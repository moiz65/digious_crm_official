/**
 * Advance / Loan Controller
 *
 * Manages employee advances, short-term loans, and long-term loans.
 * Tracks monthly installments and integrates with payroll for auto-deduction.
 *
 * Tables:
 *   employee_advances      – master record (amount, type, repayment plan)
 *   advance_installments   – per-month deduction tracking
 */

const pool = require('../../config/database');

// ────────────────────────────────────────────────
// Ensure tables exist
// ────────────────────────────────────────────────
const ensureAdvanceTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_advances (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      employee_id     INT NOT NULL,
      type            ENUM('advance','short_term_loan','long_term_loan') NOT NULL DEFAULT 'advance',
      amount          DECIMAL(12,2) NOT NULL,
      repayment_months INT NOT NULL DEFAULT 1,
      monthly_deduction DECIMAL(12,2) NOT NULL,
      total_repaid    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      remaining_balance DECIMAL(12,2) NOT NULL,
      status          ENUM('pending_approval','active','completed','cancelled','on_hold') NOT NULL DEFAULT 'active',
      disbursement_date DATE NOT NULL,
      repayment_start_date DATE NOT NULL,
      grace_period_months INT NOT NULL DEFAULT 0,
      end_date        DATE DEFAULT NULL,
      start_date      DATE DEFAULT NULL,
      approved_by     INT DEFAULT NULL,
      reason          VARCHAR(255) DEFAULT NULL,
      notes           TEXT DEFAULT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_employee (employee_id),
      KEY idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // Add new columns if table already exists (safe ALTER IGNORE)
  const newCols = [
    ["disbursement_date", "DATE DEFAULT NULL AFTER status"],
    ["repayment_start_date", "DATE DEFAULT NULL AFTER disbursement_date"],
    ["grace_period_months", "INT NOT NULL DEFAULT 0 AFTER repayment_start_date"],
    ["reason", "VARCHAR(255) DEFAULT NULL AFTER approved_by"],
  ];
  for (const [col, def] of newCols) {
    try {
      await pool.query(`ALTER TABLE employee_advances ADD COLUMN ${col} ${def}`);
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error('alter advance col err:', e.message);
    }
  }

  // Add on_hold + pending_approval to status enum if missing
  try {
    await pool.query(`ALTER TABLE employee_advances MODIFY COLUMN status ENUM('pending_approval','active','completed','cancelled','on_hold') NOT NULL DEFAULT 'active'`);
  } catch (e) { /* ignore if already correct */ }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS advance_installments (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      advance_id      INT NOT NULL,
      employee_id     INT NOT NULL,
      installment_no  INT NOT NULL,
      month           INT NOT NULL,
      year            INT NOT NULL,
      amount          DECIMAL(12,2) NOT NULL,
      status          ENUM('pending','deducted','skipped') NOT NULL DEFAULT 'pending',
      payroll_record_id INT DEFAULT NULL,
      deducted_at     TIMESTAMP NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_advance (advance_id),
      KEY idx_employee_month (employee_id, year, month),
      KEY idx_status (status),
      UNIQUE KEY unique_advance_installment (advance_id, installment_no)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
};

// ────────────────────────────────────────────────
// GET /advances
// List all advances with employee info, optional filters
// ────────────────────────────────────────────────
const getAdvances = async (req, res) => {
  try {
    await ensureAdvanceTables();

    const { status, employee_id, type } = req.query;
    let where = '1=1';
    const params = [];

    if (status) { where += ' AND ea.status = ?'; params.push(status); }
    if (employee_id) { where += ' AND ea.employee_id = ?'; params.push(employee_id); }
    if (type) { where += ' AND ea.type = ?'; params.push(type); }

    const [rows] = await pool.query(`
      SELECT ea.*,
             eo.name AS employee_name,
             eo.employee_id AS employee_code,
             eo.department,
             eo.designation,
             eo.profile_photo,
             approver.name AS approved_by_name
      FROM employee_advances ea
      JOIN employee_onboarding eo ON eo.id = ea.employee_id
      LEFT JOIN employee_onboarding approver ON approver.id = ea.approved_by
      WHERE ${where}
      ORDER BY ea.created_at DESC
    `, params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAdvances error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────
// GET /advances/:id
// Single advance with installments
// ────────────────────────────────────────────────
const getAdvance = async (req, res) => {
  try {
    await ensureAdvanceTables();
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT ea.*,
             eo.name AS employee_name,
             eo.employee_id AS employee_code,
             eo.department,
             eo.designation,
             approver.name AS approved_by_name
      FROM employee_advances ea
      JOIN employee_onboarding eo ON eo.id = ea.employee_id
      LEFT JOIN employee_onboarding approver ON approver.id = ea.approved_by
      WHERE ea.id = ?
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Advance not found' });
    }

    const [installments] = await pool.query(`
      SELECT * FROM advance_installments WHERE advance_id = ? ORDER BY installment_no ASC
    `, [id]);

    return res.json({ success: true, data: { ...rows[0], installments } });
  } catch (err) {
    console.error('getAdvance error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────
// POST /advances
// Create a new advance/loan + generate installments
// ────────────────────────────────────────────────
const createAdvance = async (req, res) => {
  try {
    await ensureAdvanceTables();

    const {
      employee_id, type, amount, repayment_months,
      disbursement_date,          // when money is given (required)
      repayment_start_date,       // when deductions begin (optional — defaults to disbursement month)
      grace_period_months,        // months to wait before first deduction (optional, default 0)
      reason, notes,
      // Legacy support: accept start_date as fallback for disbursement_date
      start_date,
    } = req.body;

    const disbDate = disbursement_date || start_date;
    if (!employee_id || !amount || !repayment_months || !disbDate) {
      return res.status(400).json({ success: false, message: 'employee_id, amount, repayment_months, and disbursement_date are required' });
    }

    // Verify employee exists
    const [emp] = await pool.query('SELECT id, name FROM employee_onboarding WHERE id = ?', [employee_id]);
    if (!emp.length) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const amountVal = parseFloat(amount);
    const months = parseInt(repayment_months);
    const grace = parseInt(grace_period_months) || 0;
    const monthlyDeduction = Math.round((amountVal / months) * 100) / 100;
    const advType = type || 'advance';

    // Calculate repayment start date (disbursement + grace period)
    const disbD = new Date(disbDate + 'T00:00:00');
    let repayStart;
    if (repayment_start_date) {
      repayStart = new Date(repayment_start_date + 'T00:00:00');
    } else {
      repayStart = new Date(disbD);
      repayStart.setMonth(repayStart.getMonth() + grace);
    }
    const repayStartStr = repayStart.toISOString().slice(0, 10);

    // Calculate end_date (repayment_start + repayment_months - 1)
    const endD = new Date(repayStart);
    endD.setMonth(endD.getMonth() + months - 1);
    const endDate = endD.toISOString().slice(0, 10);

    const approved_by = req.user?.userId || req.user?.id || null;

    const [result] = await pool.query(`
      INSERT INTO employee_advances
        (employee_id, type, amount, repayment_months, monthly_deduction, remaining_balance,
         status, disbursement_date, repayment_start_date, grace_period_months, start_date, end_date,
         approved_by, reason, notes)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)
    `, [employee_id, advType, amountVal, months, monthlyDeduction, amountVal,
        disbDate, repayStartStr, grace, disbDate, endDate,
        approved_by, reason || null, notes || null]);

    const advanceId = result.insertId;

    // Generate installments starting from repayment_start_date
    const installmentValues = [];
    let remainingForInstallments = amountVal;
    for (let i = 0; i < months; i++) {
      const instDate = new Date(repayStart);
      instDate.setMonth(instDate.getMonth() + i);
      const instMonth = instDate.getMonth() + 1;
      const instYear = instDate.getFullYear();
      // Last installment gets the remainder to avoid rounding issues
      const instAmount = i === months - 1 ? remainingForInstallments : monthlyDeduction;
      remainingForInstallments -= monthlyDeduction;

      installmentValues.push([advanceId, employee_id, i + 1, instMonth, instYear, Math.max(instAmount, 0), 'pending']);
    }

    if (installmentValues.length > 0) {
      await pool.query(
        `INSERT INTO advance_installments (advance_id, employee_id, installment_no, month, year, amount, status) VALUES ?`,
        [installmentValues]
      );
    }

    // Return full record
    const [newRows] = await pool.query(`
      SELECT ea.*, eo.name AS employee_name, eo.employee_id AS employee_code, eo.department
      FROM employee_advances ea
      JOIN employee_onboarding eo ON eo.id = ea.employee_id
      WHERE ea.id = ?
    `, [advanceId]);

    return res.status(201).json({ success: true, message: 'Advance/loan created with installment plan', data: newRows[0] });
  } catch (err) {
    console.error('createAdvance error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────
// PUT /advances/:id
// Edit advance (only if not fully repaid)
// ────────────────────────────────────────────────
const updateAdvance = async (req, res) => {
  try {
    await ensureAdvanceTables();
    const { id } = req.params;
    const {
      employee_id, type, amount, repayment_months,
      disbursement_date, repayment_start_date, grace_period_months,
      reason, notes, status,
      repayment_start_option,   // same_month | next_month | grace_period | custom (from frontend)
      start_date,               // legacy alias for disbursement_date
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM employee_advances WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Advance not found' });
    }
    const adv = existing[0];

    // Check if any installments have been deducted
    const [deductedRows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM advance_installments WHERE advance_id = ? AND status = 'deducted'`, [id]
    );
    const hasDeductions = deductedRows[0].cnt > 0;

    const fields = [];
    const values = [];

    // ── Simple text fields (always editable) ──
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
    if (reason !== undefined) { fields.push('reason = ?'); values.push(reason); }

    // ── Status changes ──
    if (status !== undefined) {
      if (!['pending_approval', 'active', 'completed', 'cancelled', 'on_hold'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      fields.push('status = ?'); values.push(status);

      if (status === 'cancelled') {
        await pool.query(
          `UPDATE advance_installments SET status = 'skipped' WHERE advance_id = ? AND status = 'pending'`,
          [id]
        );
      }
      if (status === 'active' && adv.status === 'on_hold') {
        await pool.query(
          `UPDATE advance_installments SET status = 'pending' WHERE advance_id = ? AND status = 'skipped'`,
          [id]
        );
      }
    }

    // ── Core fields (only if no deductions yet) ──
    let needRecalc = false;
    let newEmployeeId = adv.employee_id;
    let newType = adv.type;
    let newAmount = parseFloat(adv.amount);
    let newRepaymentMonths = parseInt(adv.repayment_months);
    let newDisbDate = adv.disbursement_date || adv.start_date;
    let newGrace = adv.grace_period_months || 0;
    let newRepayStart = adv.repayment_start_date;

    if (employee_id !== undefined && parseInt(employee_id) !== adv.employee_id) {
      if (hasDeductions) {
        return res.status(400).json({ success: false, message: 'Cannot change employee — installments have already been deducted' });
      }
      const [emp] = await pool.query('SELECT id, name FROM employee_onboarding WHERE id = ?', [employee_id]);
      if (!emp.length) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      newEmployeeId = parseInt(employee_id);
      fields.push('employee_id = ?'); values.push(newEmployeeId);
      needRecalc = true;
    }

    if (type !== undefined && type !== adv.type) {
      if (!['advance', 'short_term_loan', 'long_term_loan'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid type' });
      }
      newType = type;
      fields.push('type = ?'); values.push(newType);
    }

    if (amount !== undefined && parseFloat(amount) !== parseFloat(adv.amount)) {
      if (hasDeductions) {
        return res.status(400).json({ success: false, message: 'Cannot change amount — installments have already been deducted. Cancel and create a new one instead.' });
      }
      newAmount = parseFloat(amount);
      fields.push('amount = ?'); values.push(newAmount);
      needRecalc = true;
    }

    if (repayment_months !== undefined && parseInt(repayment_months) !== parseInt(adv.repayment_months)) {
      if (hasDeductions) {
        return res.status(400).json({ success: false, message: 'Cannot change repayment months — installments have already been deducted' });
      }
      newRepaymentMonths = parseInt(repayment_months);
      fields.push('repayment_months = ?'); values.push(newRepaymentMonths);
      needRecalc = true;
    }

    const disbDateVal = disbursement_date || start_date;
    if (disbDateVal !== undefined) {
      const existingDisb = adv.disbursement_date ? new Date(adv.disbursement_date).toISOString().slice(0, 10) : (adv.start_date ? new Date(adv.start_date).toISOString().slice(0, 10) : null);
      if (disbDateVal !== existingDisb) {
        if (hasDeductions) {
          return res.status(400).json({ success: false, message: 'Cannot change disbursement date — installments have already been deducted' });
        }
        newDisbDate = disbDateVal;
        fields.push('disbursement_date = ?'); values.push(newDisbDate);
        fields.push('start_date = ?'); values.push(newDisbDate);
        needRecalc = true;
      }
    }

    if (grace_period_months !== undefined && parseInt(grace_period_months) !== (adv.grace_period_months || 0)) {
      if (hasDeductions) {
        return res.status(400).json({ success: false, message: 'Cannot change grace period — installments have already been deducted' });
      }
      newGrace = parseInt(grace_period_months) || 0;
      fields.push('grace_period_months = ?'); values.push(newGrace);
      needRecalc = true;
    }

    if (repayment_start_date !== undefined) {
      const existingRepay = adv.repayment_start_date ? new Date(adv.repayment_start_date).toISOString().slice(0, 10) : null;
      if (repayment_start_date !== existingRepay) {
        if (hasDeductions) {
          return res.status(400).json({ success: false, message: 'Cannot change repayment start date — installments have already been deducted' });
        }
        newRepayStart = repayment_start_date;
        needRecalc = true;
      }
    }

    // ── Recalculate monthly deduction, remaining balance, end date, and installments ──
    if (needRecalc) {
      const monthlyDeduction = Math.round((newAmount / newRepaymentMonths) * 100) / 100;
      fields.push('monthly_deduction = ?'); values.push(monthlyDeduction);
      fields.push('remaining_balance = ?'); values.push(newAmount); // Reset since no deductions

      // Compute repayment start
      const disbD = new Date(newDisbDate + 'T00:00:00');
      let repayStart;
      if (newRepayStart) {
        repayStart = new Date(newRepayStart + 'T00:00:00');
      } else {
        repayStart = new Date(disbD);
        repayStart.setMonth(repayStart.getMonth() + newGrace);
      }
      const repayStartStr = repayStart.toISOString().slice(0, 10);
      fields.push('repayment_start_date = ?'); values.push(repayStartStr);

      // End date
      const endD = new Date(repayStart);
      endD.setMonth(endD.getMonth() + newRepaymentMonths - 1);
      fields.push('end_date = ?'); values.push(endD.toISOString().slice(0, 10));

      // Regenerate installments
      await pool.query('DELETE FROM advance_installments WHERE advance_id = ?', [id]);
      const installmentValues = [];
      let remainingForInstallments = newAmount;
      for (let i = 0; i < newRepaymentMonths; i++) {
        const instDate = new Date(repayStart);
        instDate.setMonth(instDate.getMonth() + i);
        const instMonth = instDate.getMonth() + 1;
        const instYear = instDate.getFullYear();
        const instAmount = i === newRepaymentMonths - 1 ? remainingForInstallments : monthlyDeduction;
        remainingForInstallments -= monthlyDeduction;
        installmentValues.push([id, newEmployeeId, i + 1, instMonth, instYear, Math.max(instAmount, 0), 'pending']);
      }
      if (installmentValues.length > 0) {
        await pool.query(
          `INSERT INTO advance_installments (advance_id, employee_id, installment_no, month, year, amount, status) VALUES ?`,
          [installmentValues]
        );
      }
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE employee_advances SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query(`
      SELECT ea.*, eo.name AS employee_name, eo.employee_id AS employee_code, eo.department
      FROM employee_advances ea
      JOIN employee_onboarding eo ON eo.id = ea.employee_id
      WHERE ea.id = ?
    `, [id]);

    return res.json({ success: true, message: 'Advance updated', data: updated[0] });
  } catch (err) {
    console.error('updateAdvance error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────
// DELETE /advances/:id
// Only if no installments have been deducted
// ────────────────────────────────────────────────
const deleteAdvance = async (req, res) => {
  try {
    await ensureAdvanceTables();
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM employee_advances WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Advance not found' });
    }

    // Check if any installments have been deducted
    const [deducted] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM advance_installments WHERE advance_id = ? AND status = 'deducted'`, [id]
    );
    if (deducted[0].cnt > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete — installments have already been deducted. Cancel it instead.' });
    }

    await pool.query('DELETE FROM advance_installments WHERE advance_id = ?', [id]);
    await pool.query('DELETE FROM employee_advances WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Advance deleted' });
  } catch (err) {
    console.error('deleteAdvance error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────
// GET /advances/installments/pending/:year/:month
// Get all pending installments for a specific month
// (Used by payroll generation to auto-deduct)
// ────────────────────────────────────────────────
const getPendingInstallments = async (req, res) => {
  try {
    await ensureAdvanceTables();
    const { year, month } = req.params;

    const [rows] = await pool.query(`
      SELECT ai.*,
             ea.type AS advance_type,
             ea.amount AS total_advance_amount,
             ea.repayment_months,
             eo.name AS employee_name,
             eo.employee_id AS employee_code
      FROM advance_installments ai
      JOIN employee_advances ea ON ea.id = ai.advance_id
      JOIN employee_onboarding eo ON eo.id = ai.employee_id
      WHERE ai.year = ? AND ai.month = ? AND ai.status = 'pending' AND ea.status = 'active'
      ORDER BY eo.name ASC
    `, [parseInt(year), parseInt(month)]);

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPendingInstallments error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────
// GET /advances/employees
// Get active employees for dropdown
// ────────────────────────────────────────────────
const getEmployeesForDropdown = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, employee_id AS employee_code, department, designation
      FROM employee_onboarding
      WHERE status = 'Active'
      ORDER BY name ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getEmployeesForDropdown error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ────────────────────────────────────────────────
// GET /advances/summary
// Dashboard summary stats
// ────────────────────────────────────────────────
const getAdvanceSummary = async (req, res) => {
  try {
    await ensureAdvanceTables();

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) AS total_records,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
        SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) AS on_hold_count,
        SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) AS pending_approval_count,
        SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) AS total_active_amount,
        SUM(CASE WHEN status IN ('active','on_hold') THEN remaining_balance ELSE 0 END) AS total_remaining,
        SUM(CASE WHEN status IN ('active','completed') THEN total_repaid ELSE 0 END) AS total_recovered,
        SUM(CASE WHEN type = 'advance' AND status = 'active' THEN 1 ELSE 0 END) AS active_advances,
        SUM(CASE WHEN type = 'short_term_loan' AND status = 'active' THEN 1 ELSE 0 END) AS active_short_term,
        SUM(CASE WHEN type = 'long_term_loan' AND status = 'active' THEN 1 ELSE 0 END) AS active_long_term
      FROM employee_advances
    `);

    // This month's pending deductions
    const now = new Date();
    const [pending] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS pending_this_month
      FROM advance_installments
      WHERE year = ? AND month = ? AND status = 'pending'
    `, [now.getFullYear(), now.getMonth() + 1]);

    return res.json({
      success: true,
      data: {
        ...stats[0],
        pending_this_month: pending[0].pending_this_month,
      }
    });
  } catch (err) {
    console.error('getAdvanceSummary error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAdvances,
  getAdvance,
  createAdvance,
  updateAdvance,
  deleteAdvance,
  getPendingInstallments,
  getEmployeesForDropdown,
  getAdvanceSummary,
};
