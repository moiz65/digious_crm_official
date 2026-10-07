/**
 * Sales Target Controller
 * 
 * Manages monthly sales targets for Sales department employees.
 * - Admin sets monthly_target for each Sales employee
 * - Achieved is auto-calculated from sales.upfront_payment SUM for that employee/month/year
 * - Admin can also set achieved_override to manually override
 * - Remaining = monthly_target - achieved (can be negative if exceeded)
 */

const pool = require('../../config/database');

// ═══════════════════════════════════════════════════════════
// GET TARGET (from tier OR from sales_targets table)
// ═══════════════════════════════════════════════════════════

exports.getTarget = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Verify employee
    const [employees] = await pool.query(
      `SELECT id, name, department FROM employee_onboarding WHERE id = ?`,
      [employeeId]
    );

    if (!employees.length) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get employee's tier info
    const [tierInfo] = await pool.query(
      `SELECT 
         se.current_tier_id,
         t.name AS tier_name,
         t.level AS tier_level,
         t.base_salary_pkr,
         t.monthly_target_usd,
         t.quarterly_target_usd,
         t.color AS tier_color
       FROM sales_employees se
       JOIN sales_tiers t ON t.id = se.current_tier_id
       WHERE se.employee_id = ? AND se.status = 'Active'`,
      [employeeId]
    );

    // Get manual target record
    const [targets] = await pool.query(
      `SELECT * FROM sales_targets
       WHERE employee_id = ? AND month = ? AND year = ?`,
      [employeeId, month, year]
    );

    // Get achieved from sales
    const [salesData] = await pool.query(
      `SELECT 
         COALESCE(SUM(s.upfront_payment), 0) AS achieved_from_sales,
         COUNT(*) AS total_sales_count
       FROM sales s
       WHERE s.employee_id = ? 
         AND MONTH(s.sale_date) = ? 
         AND YEAR(s.sale_date) = ?
         AND s.status NOT IN ('cancelled', 'refunded')`,
      [employeeId, month, year]
    );

    const target = targets[0] || null;
    const achievedFromSales = parseFloat(salesData[0].achieved_from_sales) || 0;

    // ⭐ Determine target & source
    let monthlyTarget = 0;
    let targetSource = 'none';

    if (target && target.source === 'manual') {
      // User explicitly set manual target
      monthlyTarget = parseFloat(target.monthly_target);
      targetSource = 'manual';
    } else if (tierInfo.length > 0 && parseFloat(tierInfo[0].monthly_target_usd) > 0) {
      // ⭐ Use tier target (this handles both: no target exists OR target exists with source='tier')
      monthlyTarget = parseFloat(tierInfo[0].monthly_target_usd);
      targetSource = 'tier';
    }

    // Use achieved_override if set, otherwise auto-calculated
    const achievedOverride = target ? target.achieved_override : null;
    const achieved = achievedOverride !== null && achievedOverride !== undefined
      ? parseFloat(achievedOverride)
      : achievedFromSales;

    const remaining = monthlyTarget - achieved;
    const achievementPercentage = monthlyTarget > 0
      ? ((achieved / monthlyTarget) * 100).toFixed(2)
      : 0;

    return res.json({
      success: true,
      data: {
        employee_id: parseInt(employeeId),
        employee_name: employees[0].name,
        month,
        year,

        monthly_target: monthlyTarget,
        target_source: targetSource,  // 'tier' | 'manual' | 'none'

        // Tier info
        tier: tierInfo.length > 0 ? {
          id: tierInfo[0].current_tier_id,
          name: tierInfo[0].tier_name,
          level: tierInfo[0].tier_level,
          base_salary_pkr: parseFloat(tierInfo[0].base_salary_pkr),
          monthly_target_usd: parseFloat(tierInfo[0].monthly_target_usd),
          quarterly_target_usd: parseFloat(tierInfo[0].quarterly_target_usd),
          color: tierInfo[0].tier_color,
        } : null,

        // Achievement
        achieved,
        achieved_from_sales: achievedFromSales,
        achieved_override: achievedOverride,
        remaining,
        achievement_percentage: achievementPercentage,
        exceeded: remaining < 0,
        is_target_met: achieved >= monthlyTarget,
        sales_count: salesData[0].total_sales_count,

        // Manual record meta
        notes: target ? target.notes : null,
        target_id: target ? target.id : null,
      }
    });
  } catch (err) {
    console.error('getTarget error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// SET TARGET (Manual override OR Clear override to use tier)
// ═══════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────
// PUT /sales-targets/:employeeId
// ─────────────────────────────────────────────────────────
exports.setTarget = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const {
      month,
      year,
      monthly_target,
      achieved_override,
      notes,
      use_tier_target = false,
    } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'month and year are required'
      });
    }

    // Verify employee
    const [employees] = await pool.query(
      `SELECT id, name, department FROM employee_onboarding WHERE id = ?`,
      [employeeId]
    );

    if (!employees.length) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (employees[0].department !== 'Sales') {
      return res.status(400).json({
        success: false,
        message: 'Sales targets can only be set for Sales department employees'
      });
    }

    // Get employee's tier if needed
    let tierInfo = [];
    if (use_tier_target) {
      const [tierRows] = await pool.query(
        `SELECT 
           se.current_tier_id,
           t.name AS tier_name,
           t.monthly_target_usd
         FROM sales_employees se
         JOIN sales_tiers t ON t.id = se.current_tier_id
         WHERE se.employee_id = ? AND se.status = 'Active'`,
        [employeeId]
      );
      tierInfo = tierRows;

      if (tierInfo.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Employee is not assigned to any tier. Please assign a tier first.'
        });
      }
    }

    // Determine final target + source
    let finalTarget;
    let targetSource;

    if (use_tier_target) {
      finalTarget = parseFloat(tierInfo[0].monthly_target_usd);
      targetSource = 'tier';  // ⭐ Mark as tier
    } else {
      if (monthly_target === undefined || monthly_target === null) {
        return res.status(400).json({
          success: false,
          message: 'monthly_target is required (or pass use_tier_target: true)'
        });
      }
      finalTarget = parseFloat(monthly_target);
      targetSource = 'manual';  // ⭐ Mark as manual
    }

    // ⭐ UPSERT with source column
    await pool.query(
      `INSERT INTO sales_targets 
       (employee_id, month, year, monthly_target, source, achieved_override, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         monthly_target = VALUES(monthly_target),
         source = VALUES(source),
         achieved_override = VALUES(achieved_override),
         notes = VALUES(notes)`,
      [
        employeeId,
        parseInt(month),
        parseInt(year),
        finalTarget,
        targetSource,  // ⭐ NEW
        achieved_override !== undefined && achieved_override !== null && achieved_override !== ''
          ? parseFloat(achieved_override)
          : null,
        notes || null
      ]
    );

    // Fetch achieved from sales
    const [salesData] = await pool.query(
      `SELECT 
         COALESCE(SUM(s.upfront_payment), 0) AS achieved_from_sales,
         COUNT(*) AS sales_count
       FROM sales s
       WHERE s.employee_id = ? 
         AND MONTH(s.sale_date) = ? 
         AND YEAR(s.sale_date) = ?
         AND s.status NOT IN ('cancelled', 'refunded')`,
      [employeeId, month, year]
    );

    const achievedFromSales = parseFloat(salesData[0].achieved_from_sales) || 0;
    const finalAchieved = (achieved_override !== undefined && achieved_override !== null && achieved_override !== '')
      ? parseFloat(achieved_override)
      : achievedFromSales;

    return res.json({
      success: true,
      message: use_tier_target
        ? `Target set from "${tierInfo[0].tier_name}" tier ($${finalTarget})`
        : 'Custom target saved successfully',
      data: {
        employee_id: parseInt(employeeId),
        employee_name: employees[0].name,
        month: parseInt(month),
        year: parseInt(year),
        monthly_target: finalTarget,
        target_source: targetSource,  // ⭐ Return source
        tier_name: tierInfo.length > 0 ? tierInfo[0].tier_name : null,
        achieved: finalAchieved,
        achieved_from_sales: achievedFromSales,
        achieved_override: (achieved_override !== undefined && achieved_override !== null && achieved_override !== '')
          ? parseFloat(achieved_override)
          : null,
        remaining: finalTarget - finalAchieved,
        sales_count: salesData[0].sales_count || 0,
      }
    });
  } catch (err) {
    console.error('setTarget error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// GET HISTORY (uses tier targets where manual not set)
// ═══════════════════════════════════════════════════════════
exports.getTargetHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const [employees] = await pool.query(
      `SELECT id, name FROM employee_onboarding WHERE id = ?`,
      [employeeId]
    );

    if (!employees.length) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get tier info
    const [tierInfo] = await pool.query(
      `SELECT 
         t.name AS tier_name,
         t.monthly_target_usd,
         t.color AS tier_color
       FROM sales_employees se
       JOIN sales_tiers t ON t.id = se.current_tier_id
       WHERE se.employee_id = ? AND se.status = 'Active'`,
      [employeeId]
    );

    const tierTarget = tierInfo.length > 0 ? parseFloat(tierInfo[0].monthly_target_usd) : 0;
    const tierName = tierInfo.length > 0 ? tierInfo[0].tier_name : null;
    const tierColor = tierInfo.length > 0 ? tierInfo[0].tier_color : null;

    // Get all targets for year
    const [targets] = await pool.query(
      `SELECT month, monthly_target, source, achieved_override, notes
       FROM sales_targets
       WHERE employee_id = ? AND year = ?`,
      [employeeId, year]
    );

    const targetMap = {};
    targets.forEach(t => {
      targetMap[t.month] = t;
    });

    // Get sales per month
    const [salesPerMonth] = await pool.query(
      `SELECT 
         MONTH(sale_date) AS month,
         COALESCE(SUM(upfront_payment), 0) AS achieved,
         COUNT(*) AS sales_count
       FROM sales
       WHERE employee_id = ? 
         AND YEAR(sale_date) = ?
         AND status NOT IN ('cancelled', 'refunded')
       GROUP BY MONTH(sale_date)`,
      [employeeId, year]
    );

    const salesMap = {};
    salesPerMonth.forEach(s => {
      salesMap[s.month] = s;
    });

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const targetRecord = targetMap[m];
      const sales = salesMap[m] || { achieved: 0, sales_count: 0 };

      // ⭐ Determine target + source
      let monthlyTarget = 0;
      let targetSource = 'none';

      if (targetRecord && targetRecord.source === 'manual') {
        monthlyTarget = parseFloat(targetRecord.monthly_target);
        targetSource = 'manual';
      } else if (tierTarget > 0) {
        // Use tier target for months without manual override
        monthlyTarget = tierTarget;
        targetSource = 'tier';
      }

      const achieved = targetRecord && targetRecord.achieved_override !== null && targetRecord.achieved_override !== undefined
        ? parseFloat(targetRecord.achieved_override)
        : parseFloat(sales.achieved) || 0;

      const isFuture = (year > currentYear) || (year === currentYear && m > currentMonth);
      const isCurrent = (year === currentYear && m === currentMonth);

      months.push({
        month: m,
        month_name: new Date(2024, m - 1).toLocaleString('en-US', { month: 'long' }),
        monthly_target: monthlyTarget,
        target_source: targetSource,
        target_set: monthlyTarget > 0,
        achieved: isFuture ? 0 : achieved,
        remaining: isFuture ? monthlyTarget : Math.max(0, monthlyTarget - achieved),
        hit_target: !isFuture && monthlyTarget > 0 && achieved >= monthlyTarget,
        sales_count: isFuture ? 0 : sales.sales_count,
        notes: targetRecord?.notes || null,
        is_current: isCurrent,
        is_future: isFuture,
      });
    }

    return res.json({
      success: true,
      data: months,
      meta: {
        employee_id: parseInt(employeeId),
        employee_name: employees[0].name,
        year,
        tier_name: tierName,
        tier_target: tierTarget,
        tier_color: tierColor,
      }
    });
  } catch (err) {
    console.error('getTargetHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// exports.getTarget = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const month = parseInt(req.query.month) || new Date().getMonth() + 1;
//     const year = parseInt(req.query.year) || new Date().getFullYear();

//     // Get target record
//     const [targets] = await pool.query(
//       `SELECT st.*, eo.name AS employee_name, eo.department
//        FROM sales_targets st
//        JOIN employee_onboarding eo ON eo.id = st.employee_id
//        WHERE st.employee_id = ? AND st.month = ? AND st.year = ?`,
//       [employeeId, month, year]
//     );

//     // Get achieved from sales (sum of upfront_payment for that employee in that month/year)
//     const [salesData] = await pool.query(
//       `SELECT 
//          COALESCE(SUM(s.upfront_payment), 0) AS achieved_from_sales,
//          COUNT(*) AS total_sales_count
//        FROM sales s
//        WHERE s.employee_id = ? 
//          AND MONTH(s.sale_date) = ? 
//          AND YEAR(s.sale_date) = ?
//          AND s.status NOT IN ('cancelled', 'refunded')`,
//       [employeeId, month, year]
//     );

//     const target = targets[0] || null;
//     const achievedFromSales = parseFloat(salesData[0].achieved_from_sales) || 0;
//     const monthlyTarget = target ? parseFloat(target.monthly_target) : 0;

//     // Use achieved_override if set, otherwise use auto-calculated from sales
//     const achieved = target && target.achieved_override !== null 
//       ? parseFloat(target.achieved_override) 
//       : achievedFromSales;

//     const remaining = monthlyTarget - achieved;

//     return res.json({
//       success: true,
//       data: {
//         employee_id: parseInt(employeeId),
//         month,
//         year,
//         monthly_target: monthlyTarget,
//         achieved,
//         achieved_from_sales: achievedFromSales,
//         achieved_override: target ? target.achieved_override : null,
//         remaining,
//         exceeded: remaining < 0,
//         sales_count: salesData[0].total_sales_count,
//         notes: target ? target.notes : null,
//         target_id: target ? target.id : null,
//       }
//     });
//   } catch (err) {
//     console.error('getTarget error:', err);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// ─────────────────────────────────────────────────────────
// PUT /sales-targets/:employeeId
// Set or update monthly sales target for an employee
// Body: { month, year, monthly_target, achieved_override?, notes? }
// ─────────────────────────────────────────────────────────
// exports.setTarget = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const { month, year, monthly_target, achieved_override, notes } = req.body;

//     if (!month || !year || monthly_target === undefined) {
//       return res.status(400).json({
//         success: false,
//         message: 'month, year, and monthly_target are required'
//       });
//     }

//     // Verify employee exists and is in Sales department
//     const [employees] = await pool.query(
//       `SELECT id, name, department FROM employee_onboarding WHERE id = ?`,
//       [employeeId]
//     );

//     if (!employees.length) {
//       return res.status(404).json({ success: false, message: 'Employee not found' });
//     }

//     if (employees[0].department !== 'Sales') {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Sales targets can only be set for Sales department employees' 
//       });
//     }

//     // Upsert the target (INSERT ON DUPLICATE KEY UPDATE)
//     await pool.query(
//       `INSERT INTO sales_targets (employee_id, month, year, monthly_target, achieved_override, notes)
//        VALUES (?, ?, ?, ?, ?, ?)
//        ON DUPLICATE KEY UPDATE 
//          monthly_target = VALUES(monthly_target),
//          achieved_override = VALUES(achieved_override),
//          notes = VALUES(notes)`,
//       [
//         employeeId,
//         parseInt(month),
//         parseInt(year),
//         parseFloat(monthly_target),
//         achieved_override !== undefined && achieved_override !== null && achieved_override !== '' 
//           ? parseFloat(achieved_override) 
//           : null,
//         notes || null
//       ]
//     );

//     // Fetch updated data including achieved from sales
//     const [salesData] = await pool.query(
//       `SELECT COALESCE(SUM(s.upfront_payment), 0) AS achieved_from_sales
//        FROM sales s
//        WHERE s.employee_id = ? 
//          AND MONTH(s.sale_date) = ? 
//          AND YEAR(s.sale_date) = ?
//          AND s.status NOT IN ('cancelled', 'refunded')`,
//       [employeeId, month, year]
//     );

//     const achievedFromSales = parseFloat(salesData[0].achieved_from_sales) || 0;
//     const finalAchieved = (achieved_override !== undefined && achieved_override !== null && achieved_override !== '')
//       ? parseFloat(achieved_override)
//       : achievedFromSales;

//     return res.json({
//       success: true,
//       message: 'Sales target updated successfully',
//       data: {
//         employee_id: parseInt(employeeId),
//         employee_name: employees[0].name,
//         month: parseInt(month),
//         year: parseInt(year),
//         monthly_target: parseFloat(monthly_target),
//         achieved: finalAchieved,
//         achieved_from_sales: achievedFromSales,
//         achieved_override: (achieved_override !== undefined && achieved_override !== null && achieved_override !== '') 
//           ? parseFloat(achieved_override) : null,
//         remaining: parseFloat(monthly_target) - finalAchieved,
//       }
//     });
//   } catch (err) {
//     console.error('setTarget error:', err);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// ─────────────────────────────────────────────────────────
// GET /sales-targets/all
// Get all sales targets for current month (or specified month/year)
// Used by admin to see all Sales employees' targets at once
// ─────────────────────────────────────────────────────────
exports.getAllTargets = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get all Sales department employees with their targets
    const [rows] = await pool.query(
      `SELECT 
         eo.id AS employee_id,
         eo.name AS employee_name,
         eo.email,
         eo.department,
         eo.profile_photo,
         st.monthly_target,
         st.achieved_override,
         st.notes,
         COALESCE(sales_sum.achieved_from_sales, 0) AS achieved_from_sales,
         COALESCE(sales_sum.sales_count, 0) AS sales_count
       FROM employee_onboarding eo
       LEFT JOIN sales_targets st 
         ON st.employee_id = eo.id AND st.month = ? AND st.year = ?
       LEFT JOIN (
         SELECT 
           s.employee_id,
           SUM(s.upfront_payment) AS achieved_from_sales,
           COUNT(*) AS sales_count
         FROM sales s
         WHERE MONTH(s.sale_date) = ? AND YEAR(s.sale_date) = ?
           AND s.status NOT IN ('cancelled', 'refunded')
         GROUP BY s.employee_id
       ) sales_sum ON sales_sum.employee_id = eo.id
       WHERE eo.department = 'Sales' AND eo.status = 'Active'
       ORDER BY eo.name ASC`,
      [month, year, month, year]
    );

    const result = rows.map(row => {
      const monthlyTarget = parseFloat(row.monthly_target) || 0;
      const achievedFromSales = parseFloat(row.achieved_from_sales) || 0;
      const achieved = row.achieved_override !== null
        ? parseFloat(row.achieved_override)
        : achievedFromSales;

      return {
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        email: row.email,
        profile_photo: row.profile_photo,
        monthly_target: monthlyTarget,
        achieved,
        achieved_from_sales: achievedFromSales,
        achieved_override: row.achieved_override !== null ? parseFloat(row.achieved_override) : null,
        remaining: monthlyTarget - achieved,
        exceeded: (monthlyTarget - achieved) < 0,
        sales_count: row.sales_count,
        notes: row.notes,
      };
    });

    return res.json({
      success: true,
      data: result,
      meta: { month, year, total: result.length }
    });
  } catch (err) {
    console.error('getAllTargets error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /sales-targets/summary
// Get aggregated summary for all Sales employees for a given month/year
// ─────────────────────────────────────────────────────────
exports.getTargetsSummary = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const [summary] = await pool.query(
      `SELECT 
         COUNT(DISTINCT eo.id) AS total_sales_employees,
         COUNT(DISTINCT st.employee_id) AS employees_with_targets,
         COALESCE(SUM(st.monthly_target), 0) AS total_target,
         COALESCE(SUM(CASE WHEN st.achieved_override IS NOT NULL THEN st.achieved_override ELSE sales_sum.achieved END), 0) AS total_achieved
       FROM employee_onboarding eo
       LEFT JOIN sales_targets st 
         ON st.employee_id = eo.id AND st.month = ? AND st.year = ?
       LEFT JOIN (
         SELECT employee_id, SUM(upfront_payment) AS achieved
         FROM sales
         WHERE MONTH(sale_date) = ? AND YEAR(sale_date) = ?
           AND status NOT IN ('cancelled', 'refunded')
         GROUP BY employee_id
       ) sales_sum ON sales_sum.employee_id = eo.id
       WHERE eo.department = 'Sales' AND eo.status = 'Active'`,
      [month, year, month, year]
    );

    const totalTarget = parseFloat(summary[0].total_target) || 0;
    const totalAchieved = parseFloat(summary[0].total_achieved) || 0;

    return res.json({
      success: true,
      data: {
        month,
        year,
        total_sales_employees: summary[0].total_sales_employees,
        employees_with_targets: summary[0].employees_with_targets,
        total_target: totalTarget,
        total_achieved: totalAchieved,
        total_remaining: totalTarget - totalAchieved,
        achievement_percentage: totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0,
      }
    });
  } catch (err) {
    console.error('getTargetsSummary error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /sales-targets/:employeeId/history?year=YYYY
// Get all 12 months of targets + achieved for a specific employee and year
// ─────────────────────────────────────────────────────────
// exports.getTargetHistory = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const year = parseInt(req.query.year) || new Date().getFullYear();

//     // All 12 months with targets and achieved from sales
//     const [rows] = await pool.query(
//       `SELECT
//          m.month,
//          COALESCE(st.monthly_target, 0)          AS monthly_target,
//          COALESCE(sa.achieved_from_sales, 0)      AS achieved,
//          COALESCE(sa.sales_count, 0)              AS sales_count,
//          st.notes,
//          st.achieved_override
//        FROM (
//          SELECT 1 AS month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
//          UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
//          UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
//        ) m
//        LEFT JOIN sales_targets st
//          ON st.employee_id = ? AND st.month = m.month AND st.year = ?
//        LEFT JOIN (
//          SELECT
//            MONTH(sale_date)              AS month,
//            SUM(upfront_payment)          AS achieved_from_sales,
//            COUNT(*)                      AS sales_count
//          FROM sales
//          WHERE employee_id = ?
//            AND YEAR(sale_date) = ?
//            AND status NOT IN ('cancelled','refunded')
//          GROUP BY MONTH(sale_date)
//        ) sa ON sa.month = m.month
//        ORDER BY m.month ASC`,
//       [employeeId, year, employeeId, year]
//     );

//     const now = new Date();
//     const currentMonth = now.getMonth() + 1;
//     const currentYear = now.getFullYear();

//     const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

//     const history = rows.map(row => {
//       const monthlyTarget = parseFloat(row.monthly_target) || 0;
//       const achievedFromSales = parseFloat(row.achieved) || 0;
//       const achieved = row.achieved_override !== null && row.achieved_override !== undefined
//         ? parseFloat(row.achieved_override)
//         : achievedFromSales;
//       const remaining = monthlyTarget - achieved;
//       const isFuture = year > currentYear || (year === currentYear && row.month > currentMonth);

//       return {
//         month: row.month,
//         month_name: MONTH_NAMES[row.month - 1],
//         year,
//         monthly_target: monthlyTarget,
//         achieved: isFuture ? null : achieved,
//         sales_count: isFuture ? null : parseInt(row.sales_count) || 0,
//         remaining: isFuture ? null : remaining,
//         target_set: monthlyTarget > 0,
//         is_current: year === currentYear && row.month === currentMonth,
//         is_future: isFuture,
//         notes: row.notes || null,
//         hit_target: !isFuture && monthlyTarget > 0 && achieved >= monthlyTarget,
//       };
//     });

//     return res.json({ success: true, data: history, meta: { year, employee_id: parseInt(employeeId) } });
//   } catch (err) {
//     console.error('getTargetHistory error:', err);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };


// ─────────────────────────────────────────────────────────
// GET /sales-targets/quarter-summary/:employeeId
// Get quarterly target + achievement for employee
// ─────────────────────────────────────────────────────────
exports.getQuarterSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, quarter } = req.query; // quarter: 1-4

    const currentYear = parseInt(year) || new Date().getFullYear();
    const currentQuarter = parseInt(quarter) || Math.ceil((new Date().getMonth() + 1) / 3);

    // Calculate quarter date range
    const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
    const quarterEndMonth = currentQuarter * 3;
    const quarterStartDate = `${currentYear}-${String(quarterStartMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, quarterEndMonth, 0).getDate();
    const quarterEndDate = `${currentYear}-${String(quarterEndMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Verify employee
    const [employees] = await pool.query(
      `SELECT id, name, department FROM employee_onboarding WHERE id = ?`,
      [employeeId]
    );

    if (!employees.length) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get tier info
    const [tierInfo] = await pool.query(
      `SELECT 
         se.current_tier_id,
         t.name AS tier_name,
         t.monthly_target_usd,
         t.quarterly_target_usd,
         t.color AS tier_color,
         t.level AS tier_level
       FROM sales_employees se
       JOIN sales_tiers t ON t.id = se.current_tier_id
       WHERE se.employee_id = ? AND se.status = 'Active'`,
      [employeeId]
    );

    // Get achieved sales in this quarter
    const [salesData] = await pool.query(
      `SELECT 
         COALESCE(SUM(upfront_payment), 0) AS achieved,
         COALESCE(SUM(total_amount), 0) AS total_sales,
         COUNT(*) AS sales_count
       FROM sales
       WHERE employee_id = ?
         AND sale_date BETWEEN ? AND ?
         AND status NOT IN ('cancelled', 'refunded')`,
      [employeeId, quarterStartDate, quarterEndDate]
    );

    // ⭐ Determine quarterly target
    let quarterlyTarget = 0;
    let targetSource = 'none';

    if (tierInfo.length > 0) {
      quarterlyTarget = parseFloat(tierInfo[0].quarterly_target_usd);
      targetSource = 'tier';
    }

    // Also check for sum of monthly targets (if manual targets set)
    const [monthlyTargets] = await pool.query(
      `SELECT 
         COALESCE(SUM(monthly_target), 0) AS sum_monthly,
         COUNT(*) AS months_with_targets
       FROM sales_targets
       WHERE employee_id = ?
         AND month BETWEEN ? AND ?
         AND year = ?`,
      [employeeId, quarterStartMonth, quarterEndMonth, currentYear]
    );

    // If manual monthly targets exist and sum > tier quarterly, use the higher one
    if (monthlyTargets[0].months_with_targets === 3 && parseFloat(monthlyTargets[0].sum_monthly) > 0) {
      const manualSum = parseFloat(monthlyTargets[0].sum_monthly);
      if (manualSum > quarterlyTarget) {
        quarterlyTarget = manualSum;
        targetSource = 'manual';
      }
    }

    const achieved = parseFloat(salesData[0].achieved) || 0;
    const remaining = quarterlyTarget - achieved;
    const achievementPct = quarterlyTarget > 0
      ? ((achieved / quarterlyTarget) * 100).toFixed(2)
      : 0;

    // Days remaining in quarter
    const today = new Date();
    const quarterEnd = new Date(quarterEndDate);
    const daysRemaining = Math.max(0, Math.ceil((quarterEnd - today) / (1000 * 60 * 60 * 24)));

    return res.json({
      success: true,
      data: {
        employee_id: parseInt(employeeId),
        employee_name: employees[0].name,
        year: currentYear,
        quarter: currentQuarter,
        quarter_name: `Q${currentQuarter}`,
        quarter_start: quarterStartDate,
        quarter_end: quarterEndDate,
        days_remaining: daysRemaining,

        // Target
        quarterly_target: quarterlyTarget,
        target_source: targetSource,
        tier: tierInfo.length > 0 ? {
          name: tierInfo[0].tier_name,
          level: tierInfo[0].tier_level,
          color: tierInfo[0].tier_color,
          monthly_target: parseFloat(tierInfo[0].monthly_target_usd),
          quarterly_target: parseFloat(tierInfo[0].quarterly_target_usd),
        } : null,

        // Achievement
        achieved,
        total_sales: parseFloat(salesData[0].total_sales) || 0,
        sales_count: salesData[0].sales_count,
        remaining,
        achievement_percentage: achievementPct,
        exceeded: remaining < 0,
        is_target_met: achieved >= quarterlyTarget,
      }
    });
  } catch (err) {
    console.error('getQuarterSummary error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};