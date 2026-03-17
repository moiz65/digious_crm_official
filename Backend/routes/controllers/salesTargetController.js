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

// ─────────────────────────────────────────────────────────
// GET /sales-targets/:employeeId
// Get sales target for a specific employee (current month or specified month/year)
// ─────────────────────────────────────────────────────────
exports.getTarget = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get target record
    const [targets] = await pool.query(
      `SELECT st.*, eo.name AS employee_name, eo.department
       FROM sales_targets st
       JOIN employee_onboarding eo ON eo.id = st.employee_id
       WHERE st.employee_id = ? AND st.month = ? AND st.year = ?`,
      [employeeId, month, year]
    );

    // Get achieved from sales (sum of upfront_payment for that employee in that month/year)
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
    const monthlyTarget = target ? parseFloat(target.monthly_target) : 0;
    
    // Use achieved_override if set, otherwise use auto-calculated from sales
    const achieved = target && target.achieved_override !== null 
      ? parseFloat(target.achieved_override) 
      : achievedFromSales;

    const remaining = monthlyTarget - achieved;

    return res.json({
      success: true,
      data: {
        employee_id: parseInt(employeeId),
        month,
        year,
        monthly_target: monthlyTarget,
        achieved,
        achieved_from_sales: achievedFromSales,
        achieved_override: target ? target.achieved_override : null,
        remaining,
        exceeded: remaining < 0,
        sales_count: salesData[0].total_sales_count,
        notes: target ? target.notes : null,
        target_id: target ? target.id : null,
      }
    });
  } catch (err) {
    console.error('getTarget error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────
// PUT /sales-targets/:employeeId
// Set or update monthly sales target for an employee
// Body: { month, year, monthly_target, achieved_override?, notes? }
// ─────────────────────────────────────────────────────────
exports.setTarget = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year, monthly_target, achieved_override, notes } = req.body;

    if (!month || !year || monthly_target === undefined) {
      return res.status(400).json({
        success: false,
        message: 'month, year, and monthly_target are required'
      });
    }

    // Verify employee exists and is in Sales department
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

    // Upsert the target (INSERT ON DUPLICATE KEY UPDATE)
    await pool.query(
      `INSERT INTO sales_targets (employee_id, month, year, monthly_target, achieved_override, notes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         monthly_target = VALUES(monthly_target),
         achieved_override = VALUES(achieved_override),
         notes = VALUES(notes)`,
      [
        employeeId,
        parseInt(month),
        parseInt(year),
        parseFloat(monthly_target),
        achieved_override !== undefined && achieved_override !== null && achieved_override !== '' 
          ? parseFloat(achieved_override) 
          : null,
        notes || null
      ]
    );

    // Fetch updated data including achieved from sales
    const [salesData] = await pool.query(
      `SELECT COALESCE(SUM(s.upfront_payment), 0) AS achieved_from_sales
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
      message: 'Sales target updated successfully',
      data: {
        employee_id: parseInt(employeeId),
        employee_name: employees[0].name,
        month: parseInt(month),
        year: parseInt(year),
        monthly_target: parseFloat(monthly_target),
        achieved: finalAchieved,
        achieved_from_sales: achievedFromSales,
        achieved_override: (achieved_override !== undefined && achieved_override !== null && achieved_override !== '') 
          ? parseFloat(achieved_override) : null,
        remaining: parseFloat(monthly_target) - finalAchieved,
      }
    });
  } catch (err) {
    console.error('setTarget error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

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
exports.getTargetHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // All 12 months with targets and achieved from sales
    const [rows] = await pool.query(
      `SELECT
         m.month,
         COALESCE(st.monthly_target, 0)          AS monthly_target,
         COALESCE(sa.achieved_from_sales, 0)      AS achieved,
         COALESCE(sa.sales_count, 0)              AS sales_count,
         st.notes,
         st.achieved_override
       FROM (
         SELECT 1 AS month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
         UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
         UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
       ) m
       LEFT JOIN sales_targets st
         ON st.employee_id = ? AND st.month = m.month AND st.year = ?
       LEFT JOIN (
         SELECT
           MONTH(sale_date)              AS month,
           SUM(upfront_payment)          AS achieved_from_sales,
           COUNT(*)                      AS sales_count
         FROM sales
         WHERE employee_id = ?
           AND YEAR(sale_date) = ?
           AND status NOT IN ('cancelled','refunded')
         GROUP BY MONTH(sale_date)
       ) sa ON sa.month = m.month
       ORDER BY m.month ASC`,
      [employeeId, year, employeeId, year]
    );

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const history = rows.map(row => {
      const monthlyTarget = parseFloat(row.monthly_target) || 0;
      const achievedFromSales = parseFloat(row.achieved) || 0;
      const achieved = row.achieved_override !== null && row.achieved_override !== undefined
        ? parseFloat(row.achieved_override)
        : achievedFromSales;
      const remaining = monthlyTarget - achieved;
      const isFuture = year > currentYear || (year === currentYear && row.month > currentMonth);

      return {
        month: row.month,
        month_name: MONTH_NAMES[row.month - 1],
        year,
        monthly_target: monthlyTarget,
        achieved: isFuture ? null : achieved,
        sales_count: isFuture ? null : parseInt(row.sales_count) || 0,
        remaining: isFuture ? null : remaining,
        target_set: monthlyTarget > 0,
        is_current: year === currentYear && row.month === currentMonth,
        is_future: isFuture,
        notes: row.notes || null,
        hit_target: !isFuture && monthlyTarget > 0 && achieved >= monthlyTarget,
      };
    });

    return res.json({ success: true, data: history, meta: { year, employee_id: parseInt(employeeId) } });
  } catch (err) {
    console.error('getTargetHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
