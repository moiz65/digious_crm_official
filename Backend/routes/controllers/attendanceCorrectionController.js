const pool = require('../../config/database');

// ──────────────────────────────────────────────────────────────
// Helper: generate ticket number  AC-20260327-XXXX
// ──────────────────────────────────────────────────────────────
const generateTicketNumber = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `AC-${date}-${rand}`;
};

// ══════════════════════════════════════════════════════════════
// 1. CREATE CORRECTION TICKET  (Employee)
// ══════════════════════════════════════════════════════════════
const createCorrection = async (req, res) => {
  try {
    const {
      attendance_id,
      attendance_date,
      original_check_in,
      original_check_out,
      original_status,
      original_working_minutes,
      original_break_minutes,
      original_late_minutes,
      original_overtime_minutes,
      corrected_check_in,
      corrected_check_out,
      corrected_status,
      reason,
      tagged_employee_id,
      tagged_employee_name,
      tagged_employee_email,
    } = req.body;

    const employeeId = req.user.employeeId;
    const employeeName = req.user.name;
    const employeeEmail = req.user.email;

    if (!attendance_date || !reason || !tagged_employee_id) {
      return res.status(400).json({
        success: false,
        message: 'attendance_date, reason, and tagged_employee_id are required',
      });
    }

    const ticketNumber = generateTicketNumber();

    const [result] = await pool.query(
      `INSERT INTO attendance_corrections
        (ticket_number, employee_id, employee_name, employee_email,
         attendance_id, attendance_date,
         original_check_in, original_check_out, original_status,
         original_working_minutes, original_break_minutes,
         original_late_minutes, original_overtime_minutes,
         corrected_check_in, corrected_check_out, corrected_status,
         reason,
         tagged_employee_id, tagged_employee_name, tagged_employee_email,
         tagged_status, hr_status, overall_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'open')`,
      [
        ticketNumber,
        employeeId, employeeName, employeeEmail,
        attendance_id || null,
        attendance_date,
        original_check_in || null,
        original_check_out || null,
        original_status || null,
        original_working_minutes ?? null,
        original_break_minutes ?? null,
        original_late_minutes ?? null,
        original_overtime_minutes ?? null,
        corrected_check_in || null,
        corrected_check_out || null,
        corrected_status || null,
        reason,
        tagged_employee_id,
        tagged_employee_name || '',
        tagged_employee_email || '',
      ]
    );

    // Log the creation
    await pool.query(
      `INSERT INTO attendance_correction_logs
        (correction_id, action, action_by_id, action_by_name, action_by_role, remarks)
       VALUES (?, 'created', ?, ?, ?, ?)`,
      [result.insertId, employeeId, employeeName, req.user.role || 'employee', reason]
    );

    res.status(201).json({
      success: true,
      message: 'Attendance correction ticket created successfully',
      data: {
        id: result.insertId,
        ticket_number: ticketNumber,
      },
    });
  } catch (error) {
    console.error('Error creating correction ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to create correction ticket', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 2. GET MY CORRECTIONS  (Employee)
// ══════════════════════════════════════════════════════════════
const getMyCorrections = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { status } = req.query;

    let query = `SELECT * FROM attendance_corrections WHERE employee_id = ?`;
    const params = [employeeId];

    if (status && status !== 'all') {
      query += ` AND overall_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);

    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching my corrections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch corrections', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 3. GET TAGGED TO ME  (Tagged person reviews)
// ══════════════════════════════════════════════════════════════
const getTaggedToMe = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { status } = req.query;

    let query = `SELECT * FROM attendance_corrections WHERE tagged_employee_id = ?`;
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
    console.error('Error fetching tagged corrections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tagged corrections', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 4. TAGGED PERSON ACTION  (Approve / Reject)
// ══════════════════════════════════════════════════════════════
const taggedAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: 'approved' | 'rejected'
    const actionBy = req.user.employeeId;
    const actionByName = req.user.name;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "approved" or "rejected"' });
    }

    // Verify the ticket is tagged to this person
    const [ticket] = await pool.query(
      `SELECT * FROM attendance_corrections WHERE id = ? AND tagged_employee_id = ?`,
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
      `UPDATE attendance_corrections
       SET tagged_status = ?, tagged_remarks = ?, tagged_action_at = NOW(),
           overall_status = ?, updated_at = NOW()
       WHERE id = ?`,
      [action, remarks || null, newOverall, id]
    );

    // Log
    await pool.query(
      `INSERT INTO attendance_correction_logs
        (correction_id, action, action_by_id, action_by_name, action_by_role, remarks)
       VALUES (?, ?, ?, ?, 'tagged_person', ?)`,
      [id, action === 'approved' ? 'tagged_approved' : 'tagged_rejected', actionBy, actionByName, remarks || null]
    );

    res.status(200).json({
      success: true,
      message: `Correction ticket ${action} by tagged person`,
    });
  } catch (error) {
    console.error('Error in tagged action:', error);
    res.status(500).json({ success: false, message: 'Failed to process action', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 5. GET ALL CORRECTIONS  (HR)
// ══════════════════════════════════════════════════════════════
const getAllCorrections = async (req, res) => {
  try {
    const { status, employee_id, month, year } = req.query;

    let query = `SELECT * FROM attendance_corrections WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND overall_status = ?`;
      params.push(status);
    }
    if (employee_id) {
      query += ` AND employee_id = ?`;
      params.push(employee_id);
    }
    if (month && year) {
      query += ` AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?`;
      params.push(month, year);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);

    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching all corrections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch corrections', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 6. HR ACTION  (Approve / Reject with final authority)
// ══════════════════════════════════════════════════════════════
const hrAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: 'approved' | 'rejected'
    const hrId = req.user.employeeId || req.user.userId;
    const hrName = req.user.name;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "approved" or "rejected"' });
    }

    // Fetch the ticket
    const [ticket] = await pool.query(
      `SELECT * FROM attendance_corrections WHERE id = ?`,
      [id]
    );

    if (ticket.length === 0) {
      return res.status(404).json({ success: false, message: 'Correction ticket not found' });
    }

    const newOverall = action === 'approved' ? 'hr_approved' : 'hr_rejected';

    await pool.query(
      `UPDATE attendance_corrections
       SET hr_status = ?, hr_remarks = ?, hr_action_by = ?, hr_action_by_name = ?,
           hr_action_at = NOW(), overall_status = ?, updated_at = NOW()
       WHERE id = ?`,
      [action, remarks || null, hrId, hrName, newOverall, id]
    );

    // If HR approved → apply the correction to the actual attendance record
    if (action === 'approved') {
      const t = ticket[0];
      await applyCorrection(t);

      await pool.query(
        `UPDATE attendance_corrections SET is_applied = 1, applied_at = NOW(), overall_status = 'applied' WHERE id = ?`,
        [id]
      );
    }

    // Log
    await pool.query(
      `INSERT INTO attendance_correction_logs
        (correction_id, action, action_by_id, action_by_name, action_by_role, remarks)
       VALUES (?, ?, ?, ?, 'HR', ?)`,
      [id, action === 'approved' ? 'hr_approved' : 'hr_rejected', hrId, hrName, remarks || null]
    );

    res.status(200).json({
      success: true,
      message: `Correction ticket ${action} by HR` + (action === 'approved' ? ' and applied to attendance' : ''),
    });
  } catch (error) {
    console.error('Error in HR action:', error);
    res.status(500).json({ success: false, message: 'Failed to process HR action', error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// Helper: Apply the correction to Employee_Attendance
// ──────────────────────────────────────────────────────────────
const applyCorrection = async (ticket) => {
  const {
    attendance_id,
    employee_id,
    employee_email,
    employee_name,
    attendance_date,
    corrected_check_in,
    corrected_check_out,
    corrected_status,
  } = ticket;

  if (attendance_id) {
    // Update existing attendance record
    const updates = [];
    const values = [];

    if (corrected_check_in) {
      updates.push('check_in_time = ?');
      values.push(corrected_check_in);
    }
    if (corrected_check_out) {
      updates.push('check_out_time = ?');
      values.push(corrected_check_out);
    }
    if (corrected_status) {
      updates.push('status = ?');
      values.push(corrected_status);
    }

    // Recalculate working hours if both check-in and check-out are available
    const finalCheckIn = corrected_check_in || ticket.original_check_in;
    const finalCheckOut = corrected_check_out || ticket.original_check_out;

    if (finalCheckIn && finalCheckOut) {
      const [ciH, ciM] = finalCheckIn.split(':').map(Number);
      const [coH, coM] = finalCheckOut.split(':').map(Number);
      let grossMinutes = (coH * 60 + coM) - (ciH * 60 + ciM);
      if (grossMinutes < 0) grossMinutes += 1440; // overnight
      const breakMinutes = ticket.original_break_minutes || 0;
      const netMinutes = Math.max(0, grossMinutes - breakMinutes);
      const expectedMinutes = 540; // 9 hours
      const overtime = Math.max(0, netMinutes - expectedMinutes);

      updates.push('gross_working_time_minutes = ?');
      values.push(grossMinutes);
      updates.push('net_working_time_minutes = ?');
      values.push(netMinutes);
      updates.push('overtime_minutes = ?');
      values.push(overtime);
      updates.push('overtime_hours = ?');
      values.push(Math.round((overtime / 60) * 100) / 100);
    }

    // Recalculate late_by_minutes if check-in changed
    if (corrected_check_in) {
      const [h, m] = corrected_check_in.split(':').map(Number);
      const checkInMinutes = h * 60 + m;
      const expectedStart = 21 * 60 + 15; // 21:15 (9:15 PM)
      const lateBy = checkInMinutes > expectedStart ? checkInMinutes - expectedStart : 0;
      updates.push('late_by_minutes = ?');
      values.push(lateBy);
      updates.push('on_time = ?');
      values.push(lateBy === 0 ? 1 : 0);

      // Update status based on lateness if not explicitly corrected
      if (!corrected_status) {
        updates.push('status = ?');
        values.push(lateBy > 0 ? 'Late' : 'Present');
      }
    }

    updates.push("remarks = CONCAT(IFNULL(remarks, ''), ?)");
    values.push(`\n[CORRECTION APPLIED - ${new Date().toISOString()}] Ticket: ${ticket.ticket_number}`);

    updates.push('updated_at = NOW()');

    if (updates.length > 0) {
      values.push(attendance_id);
      await pool.query(
        `UPDATE Employee_Attendance SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
  } else {
    // No attendance record exists (was absent) — create one if check-in/out provided
    if (corrected_check_in) {
      const status = corrected_status || 'Present';
      let grossMinutes = 0, netMinutes = 0, overtime = 0;

      if (corrected_check_in && corrected_check_out) {
        const [ciH, ciM] = corrected_check_in.split(':').map(Number);
        const [coH, coM] = corrected_check_out.split(':').map(Number);
        grossMinutes = (coH * 60 + coM) - (ciH * 60 + ciM);
        if (grossMinutes < 0) grossMinutes += 1440;
        netMinutes = grossMinutes;
        overtime = Math.max(0, netMinutes - 540);
      }

      await pool.query(
        `INSERT INTO Employee_Attendance
          (employee_id, email, name, attendance_date, check_in_time, check_out_time,
           status, gross_working_time_minutes, net_working_time_minutes,
           expected_working_time_minutes, overtime_minutes, overtime_hours,
           remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 540, ?, ?, ?)`,
        [
          employee_id, employee_email, employee_name, attendance_date,
          corrected_check_in, corrected_check_out || null,
          status, grossMinutes, netMinutes, overtime,
          Math.round((overtime / 60) * 100) / 100,
          `[CORRECTION APPLIED - ${new Date().toISOString()}] Ticket: ${ticket.ticket_number}`,
        ]
      );

      // Remove from Employee_Absent if exists
      await pool.query(
        `DELETE FROM Employee_Absent WHERE employee_id = ? AND absent_date = ?`,
        [employee_id, attendance_date]
      );
    }
  }
};

// ══════════════════════════════════════════════════════════════
// 7. GET CORRECTION LOGS  (Audit trail)
// ══════════════════════════════════════════════════════════════
const getCorrectionLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const [logs] = await pool.query(
      `SELECT * FROM attendance_correction_logs WHERE correction_id = ? ORDER BY created_at ASC`,
      [id]
    );

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching correction logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 8. GET SINGLE CORRECTION DETAIL
// ══════════════════════════════════════════════════════════════
const getCorrectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM attendance_corrections WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Correction ticket not found' });
    }

    // Also get logs
    const [logs] = await pool.query(
      `SELECT * FROM attendance_correction_logs WHERE correction_id = ? ORDER BY created_at ASC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: { ...rows[0], logs },
    });
  } catch (error) {
    console.error('Error fetching correction detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch correction', error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// 9. GET CORRECTION COUNTS (for badges)
// ══════════════════════════════════════════════════════════════
const getCorrectionCounts = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const [myPending] = await pool.query(
      `SELECT COUNT(*) as count FROM attendance_corrections WHERE employee_id = ? AND overall_status = 'open'`,
      [employeeId]
    );

    const [taggedPending] = await pool.query(
      `SELECT COUNT(*) as count FROM attendance_corrections WHERE tagged_employee_id = ? AND tagged_status = 'pending'`,
      [employeeId]
    );

    const [hrPending] = await pool.query(
      `SELECT COUNT(*) as count FROM attendance_corrections WHERE overall_status = 'tagged_approved' AND hr_status = 'pending'`
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
    console.error('Error fetching correction counts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch counts', error: error.message });
  }
};

module.exports = {
  createCorrection,
  getMyCorrections,
  getTaggedToMe,
  taggedAction,
  getAllCorrections,
  hrAction,
  getCorrectionLogs,
  getCorrectionById,
  getCorrectionCounts,
};
