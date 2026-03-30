const pool = require('../../config/database');

// ──────────────────────────────────────────────────────────────
// Helper: generate ticket number  ML-20260328-XXXX
// ──────────────────────────────────────────────────────────────
const generateTicketNumber = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `ML-${date}-${rand}`;
};

// ──────────────────────────────────────────────────────────────
// Helper: count business days between two dates (inclusive)
// ──────────────────────────────────────────────────────────────
const countDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    // Count all days (including weekends—adjust if needed)
    count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// ──────────────────────────────────────────────────────────────
// Helper: get all dates between start and end (inclusive)
// ──────────────────────────────────────────────────────────────
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// ══════════════════════════════════════════════════════════════
// 1. CREATE MANAGED LEAVE TICKET  (Employee)
// ══════════════════════════════════════════════════════════════
const createManagedLeave = async (req, res) => {
  try {
    const {
      leave_type,        // 'casual' | 'sick' | 'annual'
      leave_scenario,    // 'mark_absent_as_leave' | 'advance_leave'
      start_date,
      end_date,
      reason,
      tagged_employee_id,
      tagged_employee_name,
      tagged_employee_email,
    } = req.body;

    const employeeId = req.user.employeeId;
    const employeeName = req.user.name;
    const employeeEmail = req.user.email;

    // ── Validation ──────────────────────────────────────────
    if (!leave_type || !leave_scenario || !start_date || !end_date || !reason || !tagged_employee_id) {
      return res.status(400).json({
        success: false,
        message: 'leave_type, leave_scenario, start_date, end_date, reason, and tagged_employee_id are required',
      });
    }

    if (!['casual', 'sick', 'annual'].includes(leave_type)) {
      return res.status(400).json({ success: false, message: 'Invalid leave_type. Must be casual, sick, or annual' });
    }

    if (!['mark_absent_as_leave', 'advance_leave'].includes(leave_scenario)) {
      return res.status(400).json({ success: false, message: 'Invalid leave_scenario' });
    }

    const totalDays = countDays(start_date, end_date);
    if (totalDays <= 0) {
      return res.status(400).json({ success: false, message: 'end_date must be on or after start_date' });
    }

    // ── Check leave balance ─────────────────────────────────
    const leaveCol = `${leave_type}_leaves_remaining`;
    const [balanceRows] = await pool.query(
      `SELECT ${leaveCol} AS remaining FROM employee_leaves WHERE employee_id = ?`,
      [employeeId]
    );

    if (balanceRows.length === 0) {
      return res.status(404).json({ success: false, message: 'No leave record found for this employee. Contact HR.' });
    }

    const remaining = balanceRows[0].remaining;
    if (totalDays > remaining) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leave_type} leave balance. Requested ${totalDays} day(s) but only ${remaining} remaining.`,
      });
    }

    // ── For 'mark_absent_as_leave', verify the dates are actually absent ──
    if (leave_scenario === 'mark_absent_as_leave') {
      const dates = getDateRange(start_date, end_date);
      const placeholders = dates.map(() => '?').join(',');
      const [absentRows] = await pool.query(
        `SELECT attendance_date FROM Employee_Attendance
         WHERE employee_id = ? AND attendance_date IN (${placeholders})
         AND status IN ('Absent', 'Uninformed Absent')`,
        [employeeId, ...dates]
      );

      // Also check Employee_Absent table
      const [absentTable] = await pool.query(
        `SELECT absent_date FROM Employee_Absent
         WHERE employee_id = ? AND absent_date IN (${placeholders})`,
        [employeeId, ...dates]
      );

      const absentDatesSet = new Set([
        ...absentRows.map(r => {
          const d = new Date(r.attendance_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }),
        ...absentTable.map(r => {
          const d = new Date(r.absent_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }),
      ]);

      const missingDates = dates.filter(d => !absentDatesSet.has(d));
      if (missingDates.length > 0) {
        return res.status(400).json({
          success: false,
          message: `The following dates are not marked as absent: ${missingDates.join(', ')}. Only absent dates can be converted to paid leave.`,
        });
      }
    }

    // ── Create ticket ───────────────────────────────────────
    const ticketNumber = generateTicketNumber();

    const [result] = await pool.query(
      `INSERT INTO managed_leave_tickets
        (ticket_number, employee_id, employee_name, employee_email,
         leave_type, leave_scenario, start_date, end_date, total_days,
         balance_at_request, reason,
         tagged_employee_id, tagged_employee_name, tagged_employee_email,
         tagged_status, hr_status, overall_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'open')`,
      [
        ticketNumber,
        employeeId, employeeName, employeeEmail,
        leave_type, leave_scenario, start_date, end_date, totalDays,
        remaining, reason,
        tagged_employee_id,
        tagged_employee_name || '',
        tagged_employee_email || '',
      ]
    );

    // Log creation
    await pool.query(
      `INSERT INTO managed_leave_logs
        (ticket_id, action, action_by_id, action_by_name, action_by_role, remarks)
       VALUES (?, 'created', ?, ?, ?, ?)`,
      [result.insertId, employeeId, employeeName, req.user.role || 'employee', reason]
    );

    res.status(201).json({
      success: true,
      message: 'Managed leave ticket created successfully',
      data: {
        id: result.insertId,
        ticket_number: ticketNumber,
        total_days: totalDays,
        leave_type,
        leave_scenario,
      },
    });
  } catch (error) {
    console.error('Error creating managed leave ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to create managed leave ticket', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 2. GET MY MANAGED LEAVE TICKETS  (Employee)
// ══════════════════════════════════════════════════════════════
const getMyManagedLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { status } = req.query;

    let query = `SELECT * FROM managed_leave_tickets WHERE employee_id = ?`;
    const params = [employeeId];

    if (status && status !== 'all') {
      query += ` AND overall_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);
    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching my managed leaves:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch managed leaves', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 3. GET TAGGED TO ME  (Tagged person reviews)
// ══════════════════════════════════════════════════════════════
const getTaggedManagedLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { status } = req.query;

    let query = `SELECT * FROM managed_leave_tickets WHERE tagged_employee_id = ?`;
    const params = [employeeId];

    if (status === 'pending') {
      query += ` AND tagged_status = 'pending'`;
    } else if (status === 'reviewed') {
      query += ` AND tagged_status != 'pending'`;
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);
    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching tagged managed leaves:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tagged managed leaves', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 4. TAGGED PERSON ACTION  (Approve / Reject)
// ══════════════════════════════════════════════════════════════
const taggedManagedLeaveAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    const actionBy = req.user.employeeId;
    const actionByName = req.user.name;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "approved" or "rejected"' });
    }

    const [ticket] = await pool.query(
      `SELECT * FROM managed_leave_tickets WHERE id = ? AND tagged_employee_id = ?`,
      [id, actionBy]
    );

    if (ticket.length === 0) {
      return res.status(403).json({ success: false, message: 'Ticket not found or not assigned to you' });
    }

    if (ticket[0].tagged_status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This ticket has already been reviewed' });
    }

    const newOverall = action === 'approved' ? 'tagged_approved' : 'tagged_rejected';

    await pool.query(
      `UPDATE managed_leave_tickets
       SET tagged_status = ?, tagged_remarks = ?, tagged_action_at = NOW(),
           overall_status = ?, updated_at = NOW()
       WHERE id = ?`,
      [action, remarks || null, newOverall, id]
    );

    // Log
    await pool.query(
      `INSERT INTO managed_leave_logs
        (ticket_id, action, action_by_id, action_by_name, action_by_role, remarks)
       VALUES (?, ?, ?, ?, 'tagged_person', ?)`,
      [id, action === 'approved' ? 'tagged_approved' : 'tagged_rejected', actionBy, actionByName, remarks || null]
    );

    res.status(200).json({
      success: true,
      message: `Managed leave ticket ${action} by tagged person`,
    });
  } catch (error) {
    console.error('Error in tagged managed leave action:', error);
    res.status(500).json({ success: false, message: 'Failed to process action', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 5. GET ALL MANAGED LEAVE TICKETS  (HR)
// ══════════════════════════════════════════════════════════════
const getAllManagedLeaves = async (req, res) => {
  try {
    const { status, employee_id, leave_type, month, year } = req.query;

    let query = `SELECT * FROM managed_leave_tickets WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND overall_status = ?`;
      params.push(status);
    }
    if (employee_id) {
      query += ` AND employee_id = ?`;
      params.push(employee_id);
    }
    if (leave_type) {
      query += ` AND leave_type = ?`;
      params.push(leave_type);
    }
    if (month && year) {
      query += ` AND (MONTH(start_date) = ? AND YEAR(start_date) = ?)`;
      params.push(month, year);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);
    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching all managed leaves:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch managed leaves', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 6. HR ACTION  (Approve / Reject with final authority)
//    On HR approve → auto-apply: deduct leave, update attendance
// ══════════════════════════════════════════════════════════════
const hrManagedLeaveAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    const hrId = req.user.employeeId || req.user.userId;
    const hrName = req.user.name;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "approved" or "rejected"' });
    }

    const [ticket] = await pool.query(
      `SELECT * FROM managed_leave_tickets WHERE id = ?`,
      [id]
    );

    if (ticket.length === 0) {
      return res.status(404).json({ success: false, message: 'Managed leave ticket not found' });
    }

    const t = ticket[0];
    const newOverall = action === 'approved' ? 'hr_approved' : 'hr_rejected';

    await pool.query(
      `UPDATE managed_leave_tickets
       SET hr_status = ?, hr_remarks = ?, hr_action_by = ?, hr_action_by_name = ?,
           hr_action_at = NOW(), overall_status = ?, updated_at = NOW()
       WHERE id = ?`,
      [action, remarks || null, hrId, hrName, newOverall, id]
    );

    // If HR approved → apply the leave
    if (action === 'approved') {
      await applyManagedLeave(t);

      await pool.query(
        `UPDATE managed_leave_tickets SET is_applied = 1, applied_at = NOW(), overall_status = 'applied' WHERE id = ?`,
        [id]
      );
    }

    // Log
    await pool.query(
      `INSERT INTO managed_leave_logs
        (ticket_id, action, action_by_id, action_by_name, action_by_role, remarks)
       VALUES (?, ?, ?, ?, 'HR', ?)`,
      [id, action === 'approved' ? 'hr_approved' : 'hr_rejected', hrId, hrName, remarks || null]
    );

    res.status(200).json({
      success: true,
      message: `Managed leave ticket ${action} by HR` + (action === 'approved' ? ' — leave applied' : ''),
    });
  } catch (error) {
    console.error('Error in HR managed leave action:', error);
    res.status(500).json({ success: false, message: 'Failed to process HR action', error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// Helper: Apply the managed leave
//   1. Deduct from employee_leaves balance
//   2. Update/create attendance records as "Paid Leave"
//      - No check-in / check-out
//      - Full 9-hour (540 min) shift credit
//   3. Remove from Employee_Absent if applicable
// ──────────────────────────────────────────────────────────────
const applyManagedLeave = async (ticket) => {
  const {
    employee_id,
    employee_email,
    employee_name,
    leave_type,
    leave_scenario,
    start_date,
    end_date,
    total_days,
    ticket_number,
  } = ticket;

  // ── 1. Deduct leave balance ───────────────────────────────
  const usedCol = `${leave_type}_leaves_used`;
  await pool.query(
    `UPDATE employee_leaves SET ${usedCol} = ${usedCol} + ? WHERE employee_id = ?`,
    [total_days, employee_id]
  );

  // ── 2. Update attendance for each day in the range ────────
  const dates = getDateRange(start_date, end_date);

  for (const dateStr of dates) {
    // Check if attendance record already exists for this date
    const [existing] = await pool.query(
      `SELECT id FROM Employee_Attendance WHERE employee_id = ? AND attendance_date = ?`,
      [employee_id, dateStr]
    );

    if (existing.length > 0) {
      // Update existing record to Paid Leave
      await pool.query(
        `UPDATE Employee_Attendance 
         SET status = 'Paid Leave',
             check_in_time = NULL,
             check_out_time = NULL,
             gross_working_time_minutes = 540,
             net_working_time_minutes = 540,
             expected_working_time_minutes = 540,
             overtime_minutes = 0,
             overtime_hours = 0.00,
             on_time = 1,
             late_by_minutes = 0,
             total_break_duration_minutes = 0,
             remarks = CONCAT(IFNULL(remarks, ''), ?),
             updated_at = NOW()
         WHERE id = ?`,
        [
          `\n[PAID LEAVE APPLIED - ${new Date().toISOString()}] Ticket: ${ticket_number} (${leave_type})`,
          existing[0].id,
        ]
      );
    } else {
      // Create new attendance record as Paid Leave
      await pool.query(
        `INSERT INTO Employee_Attendance
          (employee_id, email, name, attendance_date,
           check_in_time, check_out_time,
           status, gross_working_time_minutes, net_working_time_minutes,
           expected_working_time_minutes, overtime_minutes, overtime_hours,
           on_time, late_by_minutes, remarks)
         VALUES (?, ?, ?, ?, NULL, NULL, 'Paid Leave', 540, 540, 540, 0, 0.00, 1, 0, ?)`,
        [
          employee_id, employee_email, employee_name, dateStr,
          `[PAID LEAVE APPLIED - ${new Date().toISOString()}] Ticket: ${ticket_number} (${leave_type})`,
        ]
      );
    }

    // Remove from Employee_Absent if exists
    await pool.query(
      `DELETE FROM Employee_Absent WHERE employee_id = ? AND absent_date = ?`,
      [employee_id, dateStr]
    );
  }
};

// ══════════════════════════════════════════════════════════════
// 7. GET MANAGED LEAVE LOGS  (Audit trail)
// ══════════════════════════════════════════════════════════════
const getManagedLeaveLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const [logs] = await pool.query(
      `SELECT * FROM managed_leave_logs WHERE ticket_id = ? ORDER BY created_at ASC`,
      [id]
    );
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching managed leave logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 8. GET SINGLE MANAGED LEAVE DETAIL
// ══════════════════════════════════════════════════════════════
const getManagedLeaveById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM managed_leave_tickets WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Managed leave ticket not found' });
    }

    const [logs] = await pool.query(
      `SELECT * FROM managed_leave_logs WHERE ticket_id = ? ORDER BY created_at ASC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: { ...rows[0], logs },
    });
  } catch (error) {
    console.error('Error fetching managed leave detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch managed leave', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 9. GET MANAGED LEAVE COUNTS (for badges)
// ══════════════════════════════════════════════════════════════
const getManagedLeaveCounts = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const [myPending] = await pool.query(
      `SELECT COUNT(*) as count FROM managed_leave_tickets WHERE employee_id = ? AND overall_status = 'open'`,
      [employeeId]
    );

    const [taggedPending] = await pool.query(
      `SELECT COUNT(*) as count FROM managed_leave_tickets WHERE tagged_employee_id = ? AND tagged_status = 'pending'`,
      [employeeId]
    );

    const [hrPending] = await pool.query(
      `SELECT COUNT(*) as count FROM managed_leave_tickets WHERE overall_status = 'tagged_approved' AND hr_status = 'pending'`
    );

    res.status(200).json({
      success: true,
      data: {
        my_open: myPending[0].count,
        tagged_pending: taggedPending[0].count,
        hr_pending: hrPending[0].count,
      },
    });
  } catch (error) {
    console.error('Error fetching managed leave counts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch counts', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 10. GET EMPLOYEE LEAVE BALANCE (for the leave form)
// ══════════════════════════════════════════════════════════════
const getMyLeaveBalance = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const [rows] = await pool.query(
      `SELECT
         casual_leaves_used, casual_leaves_total, casual_leaves_remaining,
         sick_leaves_used, sick_leaves_total, sick_leaves_remaining,
         annual_leaves_used, annual_leaves_total, annual_leaves_remaining,
         leaves_year
       FROM employee_leaves WHERE employee_id = ?`,
      [employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No leave record found.' });
    }

    const l = rows[0];
    res.status(200).json({
      success: true,
      data: {
        casual: { used: l.casual_leaves_used, total: l.casual_leaves_total, remaining: l.casual_leaves_remaining },
        sick: { used: l.sick_leaves_used, total: l.sick_leaves_total, remaining: l.sick_leaves_remaining },
        annual: { used: l.annual_leaves_used, total: l.annual_leaves_total, remaining: l.annual_leaves_remaining },
        leaves_year: l.leaves_year,
      },
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave balance', error: error.message });
  }
};

module.exports = {
  createManagedLeave,
  getMyManagedLeaves,
  getTaggedManagedLeaves,
  taggedManagedLeaveAction,
  getAllManagedLeaves,
  hrManagedLeaveAction,
  getManagedLeaveLogs,
  getManagedLeaveById,
  getManagedLeaveCounts,
  getMyLeaveBalance,
};
