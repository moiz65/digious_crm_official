/**
 * Payroll Controller
 * 
 * Handles payroll generation and management using existing tables:
 * - employee_onboarding (employee info)
 * - employee_salary (base salary)
 * - employee_allowances (allowances)
 * - employee_bank_accounts (bank info)
 * - Monthly_Attendance_Summary (view - attendance stats)
 * - Employee_Attendance (for detailed late count)
 * - Employee_Absent (absent records)
 * - payroll_records (stores generated payroll)
 * 
 * Payroll Logic:
 * - Daily rate = base_salary / 30 (always divide by 30, even for 31-day months)
 * - Late deduction: every 3 lates = 1 day salary deducted
 * - Absent deduction: absent_days * daily_rate
 * - Status: pending | processing | success | failed
 */

const pool = require('../../config/database');

// ──────────────────────────────────────────────
// HELPER: Ensure payroll_records table exists
// ──────────────────────────────────────────────
const ensurePayrollTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payroll_records (
      id int(11) NOT NULL AUTO_INCREMENT,
      employee_id int(11) NOT NULL,
      month int(2) NOT NULL,
      year int(4) NOT NULL,
      pay_period_start date DEFAULT NULL,
      pay_period_end date DEFAULT NULL,
      days_in_month int(11) DEFAULT 30,
      issue_date date DEFAULT NULL,
      base_salary decimal(12,2) NOT NULL DEFAULT 0.00,
      daily_rate decimal(12,2) NOT NULL DEFAULT 0.00,
      total_allowances decimal(12,2) DEFAULT 0.00,
      working_days int(11) DEFAULT 30,
      present_days int(11) DEFAULT 0,
      absent_days int(11) DEFAULT 0,
      late_days int(11) DEFAULT 0,
      leave_days int(11) DEFAULT 0,
      half_days int(11) DEFAULT 0,
      paid_leave_days int(11) DEFAULT 0,
      late_deduction_days int(11) DEFAULT 0,
      absent_deduction decimal(12,2) DEFAULT 0.00,
      late_deduction decimal(12,2) DEFAULT 0.00,
      leave_deduction decimal(12,2) DEFAULT 0.00,
      total_deductions decimal(12,2) DEFAULT 0.00,
      gross_salary decimal(12,2) DEFAULT 0.00,
      bonus decimal(12,2) NOT NULL DEFAULT 0.00,
      adjustment decimal(12,2) NOT NULL DEFAULT 0.00,
      adjustment_reason text DEFAULT NULL,
      advance_deduction decimal(12,2) NOT NULL DEFAULT 0.00,
      net_salary decimal(12,2) DEFAULT 0.00,
      status enum('pending','processing','success','failed') DEFAULT 'pending',
      notes text DEFAULT NULL,
      generated_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY unique_employee_month (employee_id, month, year),
      KEY idx_month_year (month, year),
      KEY idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // Ensure advance_deduction column exists (added for advance/loan integration)
  try {
    await pool.query(`ALTER TABLE payroll_records ADD COLUMN advance_deduction decimal(12,2) NOT NULL DEFAULT 0.00 AFTER adjustment_reason`);
  } catch (e) {
    // Column already exists — ignore ER_DUP_FIELDNAME
    if (!e.message.includes('Duplicate column')) throw e;
  }
};

// Helper: Get days in a given month (handles leap years)
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate(); // month is 1-12
};

// Helper: Calculate pay period and expected issue date
// Pay period = 1st to last day of the salary month
// Issue date = 5th of the NEXT month (salary issued 4th-6th of next month)
const getPayPeriod = (year, month) => {
  const dim = getDaysInMonth(year, month);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${String(dim).padStart(2, '0')}`;
  
  // Issue date = 5th of next month
  let issueYear = year;
  let issueMonth = month + 1;
  if (issueMonth > 12) {
    issueMonth = 1;
    issueYear = year + 1;
  }
  const issueDate = `${issueYear}-${String(issueMonth).padStart(2, '0')}-05`;
  
  return { start, end, daysInMonth: dim, issueDate };
};

// ──────────────────────────────────────────────
// GET /payroll/:year/:month
// Fetch payroll records for a specific month
// ──────────────────────────────────────────────
const getMonthlyPayroll = async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (!year || !month || isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12 || yearNum < 2000) {
      return res.status(400).json({ success: false, message: 'Valid year and month are required' });
    }

    await ensurePayrollTable();

    // Get payroll records joined with employee info, bank details, and leave balances
    const [records] = await pool.query(`
      SELECT 
        pr.*,
        eo.name AS employee_name,
        eo.employee_id AS employee_code,
        eo.department,
        eo.designation,
        eo.email,
        eo.profile_photo,
        ba.account_number,
        ba.account_title_name,
        ba.bank_name,
        ba.account_type,
        COALESCE(el.casual_leaves_used, 0) AS casual_leaves_used,
        COALESCE(el.casual_leaves_total, 8) AS casual_leaves_total,
        COALESCE(el.sick_leaves_used, 0) AS sick_leaves_used,
        COALESCE(el.sick_leaves_total, 8) AS sick_leaves_total,
        COALESCE(el.annual_leaves_used, 0) AS annual_leaves_used,
        COALESCE(el.annual_leaves_total, 12) AS annual_leaves_total
      FROM payroll_records pr
      JOIN employee_onboarding eo ON eo.id = pr.employee_id
      LEFT JOIN employee_bank_accounts ba ON ba.employee_id = eo.id AND ba.is_primary = 1
      LEFT JOIN employee_leaves el ON el.employee_id = eo.id
      WHERE pr.year = ? AND pr.month = ?
      ORDER BY eo.name ASC
    `, [yearNum, monthNum]);

    // Calculate summary stats
    const totalPayroll = records.reduce((sum, r) => sum + parseFloat(r.net_salary || 0), 0);
    const totalDeductions = records.reduce((sum, r) => sum + parseFloat(r.total_deductions || 0), 0);
    const totalGross = records.reduce((sum, r) => sum + parseFloat(r.gross_salary || 0), 0);
    const successCount = records.filter(r => r.status === 'success').length;
    const pendingCount = records.filter(r => r.status === 'pending').length;
    const processingCount = records.filter(r => r.status === 'processing').length;
    const failedCount = records.filter(r => r.status === 'failed').length;

    return res.status(200).json({
      success: true,
      message: `Payroll data for ${month}/${year}`,
      data: {
        records: records.map(r => ({
          ...r,
          base_salary: parseFloat(r.base_salary),
          daily_rate: parseFloat(r.daily_rate),
          total_allowances: parseFloat(r.total_allowances),
          absent_deduction: parseFloat(r.absent_deduction),
          late_deduction: parseFloat(r.late_deduction),
          leave_deduction: parseFloat(r.leave_deduction),
          advance_deduction: parseFloat(r.advance_deduction || 0),
          total_deductions: parseFloat(r.total_deductions),
          gross_salary: parseFloat(r.gross_salary),
          net_salary: parseFloat(r.net_salary),
        })),
        summary: {
          total_employees: records.length,
          total_payroll: totalPayroll,
          total_deductions: totalDeductions,
          total_gross: totalGross,
          success_count: successCount,
          pending_count: pendingCount,
          processing_count: processingCount,
          failed_count: failedCount,
          average_salary: records.length > 0 ? totalPayroll / records.length : 0,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching monthly payroll:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payroll data', error: error.message });
  }
};

// ──────────────────────────────────────────────
// POST /payroll/generate
// Generate payroll for all active employees for a given month/year
// Uses existing tables — no duplicate data
// ──────────────────────────────────────────────
const generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // ── Validate: only allow generating payroll for COMPLETED months ──
    // The month must have fully ended before payroll can be generated.
    // e.g., March 2026 payroll can only be generated starting April 1, 2026.
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Build a comparable number: YYYYMM
    const selectedPeriod = yearNum * 100 + monthNum;
    const currentPeriod = currentYear * 100 + currentMonth;

    if (selectedPeriod >= currentPeriod) {
      // Month hasn't ended yet (or is in the future)
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[monthNum] || monthNum;

      // Calculate when it CAN be generated
      let canGenerateMonth = monthNum + 1;
      let canGenerateYear = yearNum;
      if (canGenerateMonth > 12) { canGenerateMonth = 1; canGenerateYear++; }
      const canGenerateMonthName = monthNames[canGenerateMonth];

      return res.status(400).json({
        success: false,
        message: `Cannot generate payroll for ${monthName} ${yearNum} — the month hasn't ended yet. Payroll for ${monthName} can be generated starting ${canGenerateMonthName} 1, ${canGenerateYear}.`,
        code: 'MONTH_NOT_ENDED'
      });
    }

    await ensurePayrollTable();

    // 1. Get all active employees with their salary
    const [employees] = await pool.query(`
      SELECT 
        eo.id,
        eo.employee_id AS employee_code,
        eo.name,
        eo.department,
        eo.email,
        COALESCE(es.base_salary, 0) AS base_salary,
        COALESCE(
          (SELECT SUM(ea.allowance_amount * ea.exchange_rate) FROM employee_allowances ea WHERE ea.employee_id = eo.id),
          0
        ) AS total_allowances
      FROM employee_onboarding eo
      LEFT JOIN employee_salary es ON es.employee_id = eo.id
      WHERE eo.status = 'Active'
      ORDER BY eo.name ASC
    `);

    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'No active employees found' });
    }

    // 2. Get attendance summary for the month from Monthly_Attendance_Summary view
    const [attendanceSummary] = await pool.query(`
      SELECT 
        employee_id,
        COALESCE(present_days, 0) AS present_days,
        COALESCE(absent_days, 0) AS absent_days,
        COALESCE(late_days, 0) AS late_days,
        COALESCE(leave_days, 0) AS leave_days
      FROM Monthly_Attendance_Summary
      WHERE year = ? AND month = ?
    `, [yearNum, monthNum]);

    // Build attendance lookup by employee_id
    const attendanceMap = {};
    attendanceSummary.forEach(a => {
      attendanceMap[a.employee_id] = a;
    });

    // 3. Get half-day and paid leave counts from Employee_Attendance directly
    const [detailedAttendance] = await pool.query(`
      SELECT 
        employee_id,
        SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) AS half_days,
        SUM(CASE WHEN status = 'Paid Leave' THEN 1 ELSE 0 END) AS paid_leave_days
      FROM Employee_Attendance
      WHERE YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?
      GROUP BY employee_id
    `, [yearNum, monthNum]);

    const detailedMap = {};
    detailedAttendance.forEach(d => {
      detailedMap[d.employee_id] = d;
    });

    // 3b. Get approved/paid leave days from Employee_Absent table
    // Absences properly marked via leave approval flow
    const [approvedLeaves] = await pool.query(`
      SELECT 
        employee_id,
        COUNT(*) AS paid_absent_days,
        SUM(CASE WHEN leave_type_key = 'casual' THEN 1 ELSE 0 END) AS casual_leave_days,
        SUM(CASE WHEN leave_type_key = 'sick' THEN 1 ELSE 0 END) AS sick_leave_days,
        SUM(CASE WHEN leave_type_key = 'annual' THEN 1 ELSE 0 END) AS annual_leave_days,
        SUM(CASE WHEN leave_type_key = 'paid_leave' THEN 1 ELSE 0 END) AS paid_leave_type_days,
        SUM(CASE WHEN reason_type IN ('Leave', 'Medical', 'Sick', 'Paid Leave') OR is_approved = 1 THEN 1 ELSE 0 END) AS approved_leave_days
      FROM Employee_Absent
      WHERE YEAR(absent_date) = ? AND MONTH(absent_date) = ?
        AND (
          reason_type IN ('Leave', 'Medical', 'Sick', 'Paid Leave')
          OR leave_type_key IS NOT NULL
          OR is_approved = 1
        )
      GROUP BY employee_id
    `, [yearNum, monthNum]);

    const approvedLeaveMap = {};
    approvedLeaves.forEach(l => {
      approvedLeaveMap[l.employee_id] = l;
    });

    // 3c. Get total absent records per employee for THIS MONTH from Employee_Absent
    const [totalAbsents] = await pool.query(`
      SELECT 
        employee_id,
        COUNT(*) AS total_absent_records
      FROM Employee_Absent
      WHERE YEAR(absent_date) = ? AND MONTH(absent_date) = ?
      GROUP BY employee_id
    `, [yearNum, monthNum]);

    const totalAbsentMap = {};
    totalAbsents.forEach(a => {
      totalAbsentMap[a.employee_id] = a.total_absent_records;
    });

    // 3d. Get employee_leaves yearly balances (to catch manually adjusted leaves
    // that weren't linked back to Employee_Absent records)
    const [leaveBalances] = await pool.query(`
      SELECT 
        employee_id,
        COALESCE(casual_leaves_used, 0) AS casual_used,
        COALESCE(sick_leaves_used, 0) AS sick_used,
        COALESCE(annual_leaves_used, 0) AS annual_used,
        COALESCE(casual_leaves_total, 8) AS casual_total,
        COALESCE(sick_leaves_total, 8) AS sick_total,
        COALESCE(annual_leaves_total, 12) AS annual_total
      FROM employee_leaves
    `);

    const leaveBalanceMap = {};
    leaveBalances.forEach(l => {
      leaveBalanceMap[l.employee_id] = l;
    });

    // 3e. Count how many absences are already marked as paid across the ENTIRE YEAR
    // (so we know how many from employee_leaves are still "unlinked")
    const [yearlyPaidAbsents] = await pool.query(`
      SELECT 
        employee_id,
        COUNT(*) AS yearly_paid_count
      FROM Employee_Absent
      WHERE YEAR(absent_date) = ?
        AND (
          reason_type IN ('Leave', 'Medical', 'Sick', 'Paid Leave')
          OR leave_type_key IS NOT NULL
          OR is_approved = 1
        )
      GROUP BY employee_id
    `, [yearNum]);

    const yearlyPaidMap = {};
    yearlyPaidAbsents.forEach(a => {
      yearlyPaidMap[a.employee_id] = a.yearly_paid_count;
    });

    // 3f. Get pending + already-deducted advance/loan installments for this month
    //     Include 'deducted' so re-generating payroll preserves advance amounts
    let advanceInstallmentMap = {};
    try {
      const [advInstallments] = await pool.query(`
        SELECT ai.employee_id, SUM(ai.amount) AS total_advance_deduction,
               GROUP_CONCAT(CONCAT(ea.type, ':', ai.amount, ':aid', ai.advance_id) SEPARATOR ', ') AS advance_details
        FROM advance_installments ai
        JOIN employee_advances ea ON ea.id = ai.advance_id AND ea.status IN ('active', 'completed')
        WHERE ai.year = ? AND ai.month = ? AND ai.status IN ('pending', 'deducted')
        GROUP BY ai.employee_id
      `, [yearNum, monthNum]);
      advInstallments.forEach(a => {
        advanceInstallmentMap[a.employee_id] = a;
      });
    } catch (e) {
      // advance_installments table may not exist yet — safe to ignore
      console.log('Note: advance_installments not available yet:', e.message);
    }

    // 4. Calculate pay period, days in month, and issue date
    const payPeriod = getPayPeriod(yearNum, monthNum);
    const daysInMonth = payPeriod.daysInMonth;

    // 5. Generate payroll for each employee
    const payrollRecords = [];
    const errors = [];

    for (const emp of employees) {
      try {
        const baseSalary = parseFloat(emp.base_salary) || 0;
        const totalAllowances = parseFloat(emp.total_allowances) || 0;

        // Always divide by 30 (as per requirement, even for 31-day months)
        const dailyRate = baseSalary / 30;

        // Get attendance data
        const attendance = attendanceMap[emp.id] || {};
        const detailed = detailedMap[emp.id] || {};
        const approvedLeave = approvedLeaveMap[emp.id] || {};
        const leaveBalance = leaveBalanceMap[emp.id] || {};

        // Late arrivals ARE present (they showed up, just late)
        // So present = view's present_days + late_days
        const viewPresentDays = parseInt(attendance.present_days) || 0;
        const lateDays = parseInt(attendance.late_days) || 0;
        const presentDays = viewPresentDays + lateDays;
        const totalAbsentDays = parseInt(totalAbsentMap[emp.id]) || 0;
        const leaveDays = parseInt(attendance.leave_days) || 0;
        const halfDays = parseInt(detailed.half_days) || 0;
        const paidLeaveDaysFromAttendance = parseInt(detailed.paid_leave_days) || 0;

        // 1) Approved leave days marked in Employee_Absent for THIS month
        const markedPaidDays = parseInt(approvedLeave.approved_leave_days) || 0;
        const casualFromAbsent = parseInt(approvedLeave.casual_leave_days) || 0;
        const sickFromAbsent = parseInt(approvedLeave.sick_leave_days) || 0;
        const annualFromAbsent = parseInt(approvedLeave.annual_leave_days) || 0;

        // 2) Check employee_leaves yearly balances for unlinked leaves
        //    (leaves added via HR adjustment/markLeave that didn't update Employee_Absent)
        const totalLeavesUsedYear = (parseInt(leaveBalance.casual_used) || 0)
          + (parseInt(leaveBalance.sick_used) || 0)
          + (parseInt(leaveBalance.annual_used) || 0);
        const yearlyPaidInAbsent = parseInt(yearlyPaidMap[emp.id]) || 0;
        const unlinkedLeaves = Math.max(0, totalLeavesUsedYear - yearlyPaidInAbsent);

        // 3) Total paid days = properly marked + unlinked (capped at unpaid absences in this month)
        const rawUnpaid = Math.max(0, totalAbsentDays - markedPaidDays);
        const unlinkedForThisMonth = Math.min(unlinkedLeaves, rawUnpaid);
        const totalPaidLeaveDays = markedPaidDays + unlinkedForThisMonth;
        const unpaidAbsentDays = Math.max(0, totalAbsentDays - totalPaidLeaveDays);

        // Leave type breakdown (for notes)
        const casualLeaveDays = casualFromAbsent + (unlinkedForThisMonth > 0 ? Math.min(parseInt(leaveBalance.casual_used) || 0, unlinkedForThisMonth) : 0);
        const sickLeaveDays = sickFromAbsent;
        const annualLeaveDays = annualFromAbsent;

        // Late deduction: every 3 lates = 1 day deduction
        const lateDeductionDays = Math.floor(lateDays / 3);

        // Calculate deductions — ONLY unpaid absences are deducted
        const absentDeduction = unpaidAbsentDays * dailyRate;
        const lateDeduction = lateDeductionDays * dailyRate;
        const leaveDeduction = 0; // Approved leaves = paid, no deduction
        const totalDeductions = absentDeduction + lateDeduction + leaveDeduction;

        // Gross salary = base + allowances
        const grossSalary = baseSalary + totalAllowances;

        // Advance/loan deduction for this month
        const advanceInfo = advanceInstallmentMap[emp.id] || {};
        const advanceDeduction = parseFloat(advanceInfo.total_advance_deduction) || 0;

        // Net salary (bonus and adjustment are added later via edit)
        const bonus = 0;
        const adjustment = 0;
        const netSalary = grossSalary + bonus + adjustment - totalDeductions - advanceDeduction;

        payrollRecords.push({
          employee_id: emp.id,
          month: monthNum,
          year: yearNum,
          pay_period_start: payPeriod.start,
          pay_period_end: payPeriod.end,
          days_in_month: daysInMonth,
          issue_date: payPeriod.issueDate,
          base_salary: baseSalary,
          daily_rate: dailyRate,
          total_allowances: totalAllowances,
          working_days: daysInMonth,
          present_days: presentDays,
          absent_days: unpaidAbsentDays,
          late_days: lateDays,
          leave_days: totalPaidLeaveDays,
          half_days: halfDays,
          paid_leave_days: paidLeaveDaysFromAttendance + totalPaidLeaveDays,
          late_deduction_days: lateDeductionDays,
          absent_deduction: absentDeduction,
          late_deduction: lateDeduction,
          leave_deduction: leaveDeduction,
          total_deductions: totalDeductions,
          gross_salary: grossSalary,
          bonus: bonus,
          adjustment: adjustment,
          adjustment_reason: null,
          advance_deduction: advanceDeduction,
          net_salary: netSalary,
          status: 'pending',
          notes: [
            totalPaidLeaveDays > 0
              ? `Paid leaves: ${totalPaidLeaveDays} (${casualLeaveDays > 0 ? casualLeaveDays + ' casual' : ''}${sickLeaveDays > 0 ? (casualLeaveDays > 0 ? ', ' : '') + sickLeaveDays + ' sick' : ''}${annualLeaveDays > 0 ? ((casualLeaveDays > 0 || sickLeaveDays > 0) ? ', ' : '') + annualLeaveDays + ' annual' : ''}${unlinkedForThisMonth > 0 ? ' [' + unlinkedForThisMonth + ' from leave balance]' : ''}). Total absent: ${totalAbsentDays}, Paid: ${totalPaidLeaveDays}, Unpaid: ${unpaidAbsentDays}`
              : (totalAbsentDays > 0 ? `Unpaid absences: ${unpaidAbsentDays}` : null),
            advanceDeduction > 0 ? `Advance/loan deduction: Rs.${advanceDeduction.toLocaleString()} (${advanceInfo.advance_details || ''})` : null
          ].filter(Boolean).join(' | ') || null
        });
      } catch (empError) {
        errors.push({ employee_id: emp.id, name: emp.name, error: empError.message });
      }
    }

    // 6. Delete old payroll records for this month/year (clean slate)
    try {
      // Get all deducted installments for this month to reverse advance totals
      const [deductedInsts] = await pool.query(`
        SELECT ai.id, ai.advance_id, ai.amount
        FROM advance_installments ai
        WHERE ai.year = ? AND ai.month = ? AND ai.status = 'deducted'
      `, [yearNum, monthNum]);

      // Reverse the advance totals for each deducted installment
      for (const inst of deductedInsts) {
        await pool.query(`
          UPDATE employee_advances 
          SET total_repaid = total_repaid - ?, 
              remaining_balance = remaining_balance + ?,
              status = CASE WHEN status = 'completed' THEN 'active' ELSE status END
          WHERE id = ?
        `, [inst.amount, inst.amount, inst.advance_id]);
      }

      // Reset advance installments back to 'pending' if they were deducted
      await pool.query(`
        UPDATE advance_installments
        SET status = 'pending', payroll_record_id = NULL, deducted_at = NULL
        WHERE year = ? AND month = ? AND status = 'deducted'
      `, [yearNum, monthNum]);

      // Delete payroll records
      await pool.query(`
        DELETE FROM payroll_records
        WHERE month = ? AND year = ?
      `, [monthNum, yearNum]);
    } catch (delError) {
      console.log('Note: Error deleting old payroll records:', delError.message);
    }

    // 7. Insert new payroll records
    let insertedCount = 0;

    for (const record of payrollRecords) {
      try {
        const [result] = await pool.query(`
          INSERT INTO payroll_records 
            (employee_id, month, year, pay_period_start, pay_period_end, days_in_month, issue_date,
             base_salary, daily_rate, total_allowances,
             working_days, present_days, absent_days, late_days, leave_days,
             half_days, paid_leave_days, late_deduction_days,
             absent_deduction, late_deduction, leave_deduction, total_deductions,
             gross_salary, bonus, adjustment, adjustment_reason, advance_deduction, net_salary, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          record.employee_id, record.month, record.year,
          record.pay_period_start, record.pay_period_end, record.days_in_month, record.issue_date,
          record.base_salary, record.daily_rate, record.total_allowances,
          record.working_days, record.present_days, record.absent_days,
          record.late_days, record.leave_days, record.half_days, record.paid_leave_days,
          record.late_deduction_days,
          record.absent_deduction, record.late_deduction, record.leave_deduction,
          record.total_deductions, record.gross_salary,
          record.bonus, record.adjustment, record.adjustment_reason,
          record.advance_deduction,
          record.net_salary,
          record.status, record.notes
        ]);

        if (result.affectedRows > 0) insertedCount++;
      } catch (dbError) {
        errors.push({ employee_id: record.employee_id, error: dbError.message });
      }
    }

    // 8. Mark advance installments as deducted and update advance balances
    try {
      // Get payroll record IDs for linking
      const [payrollIds] = await pool.query(
        `SELECT id, employee_id FROM payroll_records WHERE month = ? AND year = ?`,
        [monthNum, yearNum]
      );
      const payrollIdMap = {};
      payrollIds.forEach(p => { payrollIdMap[p.employee_id] = p.id; });

      // Update installments to 'deducted'
      const [pendingInsts] = await pool.query(`
        SELECT ai.id, ai.advance_id, ai.employee_id, ai.amount
        FROM advance_installments ai
        JOIN employee_advances ea ON ea.id = ai.advance_id AND ea.status = 'active'
        WHERE ai.year = ? AND ai.month = ? AND ai.status = 'pending'
      `, [yearNum, monthNum]);

      for (const inst of pendingInsts) {
        const prId = payrollIdMap[inst.employee_id] || null;
        await pool.query(
          `UPDATE advance_installments SET status = 'deducted', payroll_record_id = ?, deducted_at = NOW() WHERE id = ?`,
          [prId, inst.id]
        );

        // Update advance totals
        await pool.query(`
          UPDATE employee_advances 
          SET total_repaid = total_repaid + ?, 
              remaining_balance = remaining_balance - ?,
              status = CASE WHEN remaining_balance - ? <= 0 THEN 'completed' ELSE status END
          WHERE id = ?
        `, [inst.amount, inst.amount, inst.amount, inst.advance_id]);
      }
    } catch (advError) {
      console.log('Note: Could not update advance installments:', advError.message);
    }

    return res.status(200).json({
      success: true,
      message: `Payroll generated for ${monthNum}/${yearNum}`,
      data: {
        total_employees: employees.length,
        processed: insertedCount,
        errors: errors,
        month: monthNum,
        year: yearNum,
      }
    });
  } catch (error) {
    console.error('Error generating payroll:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate payroll', error: error.message });
  }
};

// ──────────────────────────────────────────────
// PUT /payroll/:id/status
// Update a single payroll record's status
// ──────────────────────────────────────────────
const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'success', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const [result] = await pool.query(
      'UPDATE payroll_records SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Payroll status updated to ${status}`,
      data: { id: parseInt(id), status }
    });
  } catch (error) {
    console.error('Error updating payroll status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// ──────────────────────────────────────────────
// PUT /payroll/bulk-status
// Update status for multiple payroll records
// ──────────────────────────────────────────────
const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }

    const validStatuses = ['pending', 'processing', 'success', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const [result] = await pool.query(
      'UPDATE payroll_records SET status = ? WHERE id IN (?)',
      [status, ids]
    );

    return res.status(200).json({
      success: true,
      message: `Updated ${result.affectedRows} records to ${status}`,
      data: { updated: result.affectedRows, status }
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return res.status(500).json({ success: false, message: 'Failed to bulk update status', error: error.message });
  }
};

// ──────────────────────────────────────────────
// GET /payroll/:id/payslip
// Get detailed payslip for single employee record
// ──────────────────────────────────────────────
const getPayslip = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        pr.*,
        eo.name AS employee_name,
        eo.employee_id AS employee_code,
        eo.department,
        eo.designation,
        eo.email,
        eo.phone,
        eo.cnic,
        eo.join_date,
        eo.profile_photo,
        ba.account_number,
        ba.account_title_name,
        ba.bank_name,
        ba.account_type
      FROM payroll_records pr
      JOIN employee_onboarding eo ON eo.id = pr.employee_id
      LEFT JOIN employee_bank_accounts ba ON ba.employee_id = eo.id AND ba.is_primary = 1
      WHERE pr.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    const record = rows[0];

    // Get individual allowances for this employee
    const [allowances] = await pool.query(`
      SELECT allowance_name, allowance_amount, currency, exchange_rate
      FROM employee_allowances
      WHERE employee_id = ?
    `, [record.employee_id]);

    return res.status(200).json({
      success: true,
      data: {
        ...record,
        base_salary: parseFloat(record.base_salary),
        daily_rate: parseFloat(record.daily_rate),
        total_allowances: parseFloat(record.total_allowances),
        absent_deduction: parseFloat(record.absent_deduction),
        late_deduction: parseFloat(record.late_deduction),
        leave_deduction: parseFloat(record.leave_deduction),
        advance_deduction: parseFloat(record.advance_deduction || 0),
        total_deductions: parseFloat(record.total_deductions),
        gross_salary: parseFloat(record.gross_salary),
        bonus: parseFloat(record.bonus || 0),
        adjustment: parseFloat(record.adjustment || 0),
        net_salary: parseFloat(record.net_salary),
        allowances: allowances.map(a => ({
          name: a.allowance_name,
          amount: parseFloat(a.allowance_amount),
          currency: a.currency,
          exchange_rate: parseFloat(a.exchange_rate),
        })),
      }
    });
  } catch (error) {
    console.error('Error fetching payslip:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payslip', error: error.message });
  }
};

// ──────────────────────────────────────────────
// GET /payroll/my-payroll — Employee views own payroll
// ──────────────────────────────────────────────
const getMyPayroll = async (req, res) => {
  try {
    // req.user comes from JWT: { userId, employeeId (numeric FK to employee_onboarding.id), email, name, role }
    const onboardingId = req.user?.employeeId;
    if (!onboardingId) {
      return res.status(401).json({ success: false, message: 'Employee ID not found in token' });
    }

    // employeeId in JWT is user_as_employees.employee_id which maps to employee_onboarding.id
    const [empRows] = await pool.query(
      'SELECT id, name, employee_id, department, designation, email, phone, cnic, join_date, profile_photo FROM employee_onboarding WHERE id = ? LIMIT 1',
      [onboardingId]
    );
    if (empRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }
    const emp = empRows[0];

    // Get all payroll records for this employee, newest first
    const [records] = await pool.query(`
      SELECT 
        pr.*,
        el.casual_leaves_used, el.casual_leaves_total,
        el.sick_leaves_used, el.sick_leaves_total,
        el.annual_leaves_used, el.annual_leaves_total
      FROM payroll_records pr
      LEFT JOIN employee_leaves el ON el.employee_id = pr.employee_id
      WHERE pr.employee_id = ?
      ORDER BY pr.year DESC, pr.month DESC
    `, [emp.id]);

    // Get bank info
    const [bankRows] = await pool.query(
      'SELECT account_number, account_title_name, bank_name, account_type FROM employee_bank_accounts WHERE employee_id = ? AND is_primary = 1 LIMIT 1',
      [emp.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        employee: {
          ...emp,
          bank: bankRows[0] || null
        },
        records: records.map(r => ({
          ...r,
          base_salary: parseFloat(r.base_salary),
          daily_rate: parseFloat(r.daily_rate),
          total_allowances: parseFloat(r.total_allowances),
          absent_deduction: parseFloat(r.absent_deduction),
          late_deduction: parseFloat(r.late_deduction),
          leave_deduction: parseFloat(r.leave_deduction),
          advance_deduction: parseFloat(r.advance_deduction || 0),
          total_deductions: parseFloat(r.total_deductions),
          gross_salary: parseFloat(r.gross_salary),
          bonus: parseFloat(r.bonus || 0),
          adjustment: parseFloat(r.adjustment || 0),
          net_salary: parseFloat(r.net_salary),
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching employee payroll:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payroll', error: error.message });
  }
};

// ──────────────────────────────────────────────
// GET /payroll/my-payslip/:id — Employee views own payslip detail
// ──────────────────────────────────────────────
const getMyPayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const onboardingId = req.user?.employeeId;
    console.log('📋 [getMyPayslip] payslip id:', id, 'onboardingId from JWT:', onboardingId, typeof onboardingId);
    if (!onboardingId) {
      return res.status(401).json({ success: false, message: 'Employee ID not found in token' });
    }

    // Query payslip directly with ownership check (no separate employee lookup needed)
    const [rows] = await pool.query(`
      SELECT 
        pr.*,
        eo.name AS employee_name,
        eo.employee_id AS employee_code,
        eo.department,
        eo.designation,
        eo.email,
        eo.phone,
        eo.cnic,
        eo.join_date,
        eo.profile_photo,
        ba.account_number,
        ba.account_title_name,
        ba.bank_name,
        ba.account_type,
        el.casual_leaves_used, el.casual_leaves_total,
        el.sick_leaves_used, el.sick_leaves_total,
        el.annual_leaves_used, el.annual_leaves_total
      FROM payroll_records pr
      JOIN employee_onboarding eo ON eo.id = pr.employee_id
      LEFT JOIN employee_bank_accounts ba ON ba.employee_id = eo.id AND ba.is_primary = 1
      LEFT JOIN employee_leaves el ON el.employee_id = eo.id
      WHERE pr.id = ? AND pr.employee_id = ?
    `, [id, onboardingId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payslip not found or access denied' });
    }

    const record = rows[0];

    const [allowances] = await pool.query(
      'SELECT allowance_name, allowance_amount, currency, exchange_rate FROM employee_allowances WHERE employee_id = ?',
      [record.employee_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...record,
        base_salary: parseFloat(record.base_salary),
        daily_rate: parseFloat(record.daily_rate),
        total_allowances: parseFloat(record.total_allowances),
        absent_deduction: parseFloat(record.absent_deduction),
        late_deduction: parseFloat(record.late_deduction),
        leave_deduction: parseFloat(record.leave_deduction),
        advance_deduction: parseFloat(record.advance_deduction || 0),
        total_deductions: parseFloat(record.total_deductions),
        gross_salary: parseFloat(record.gross_salary),
        bonus: parseFloat(record.bonus || 0),
        adjustment: parseFloat(record.adjustment || 0),
        net_salary: parseFloat(record.net_salary),
        allowances: allowances.map(a => ({
          name: a.allowance_name,
          amount: parseFloat(a.allowance_amount),
          currency: a.currency,
          exchange_rate: parseFloat(a.exchange_rate),
        })),
      }
    });
  } catch (error) {
    console.error('Error fetching employee payslip:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payslip', error: error.message });
  }
};

// ──────────────────────────────────────────────
// PUT /payroll/:id/edit
// Edit bonus, adjustment, and adjustment_reason for a payroll record
// Recalculates net_salary automatically
// ──────────────────────────────────────────────
const editPayrollRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { bonus, adjustment, adjustment_reason } = req.body;

    // Validate inputs
    const bonusVal = parseFloat(bonus) || 0;
    const adjustmentVal = parseFloat(adjustment) || 0;
    const reasonVal = adjustment_reason || null;

    // Get current record to recalculate net salary
    const [existing] = await pool.query(
      'SELECT gross_salary, total_deductions, advance_deduction FROM payroll_records WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    const grossSalary = parseFloat(existing[0].gross_salary);
    const totalDeductions = parseFloat(existing[0].total_deductions);
    const advanceDeduction = parseFloat(existing[0].advance_deduction) || 0;
    const newNetSalary = grossSalary + bonusVal + adjustmentVal - totalDeductions - advanceDeduction;

    const [result] = await pool.query(`
      UPDATE payroll_records 
      SET bonus = ?, adjustment = ?, adjustment_reason = ?, net_salary = ?
      WHERE id = ?
    `, [bonusVal, adjustmentVal, reasonVal, newNetSalary, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Payroll record updated successfully',
      data: {
        id: parseInt(id),
        bonus: bonusVal,
        adjustment: adjustmentVal,
        adjustment_reason: reasonVal,
        net_salary: newNetSalary,
      }
    });
  } catch (error) {
    console.error('Error editing payroll record:', error);
    return res.status(500).json({ success: false, message: 'Failed to edit payroll record', error: error.message });
  }
};

module.exports = {
  getMonthlyPayroll,
  generatePayroll,
  updatePayrollStatus,
  bulkUpdateStatus,
  getPayslip,
  editPayrollRecord,
  getMyPayroll,
  getMyPayslip,
};
