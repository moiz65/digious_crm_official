const pool = require('../../config/database');

// ========== GET APPROVED TICKETS FOR ADJUSTMENT ==========
const getApprovedTickets = async (req, res) => {
  try {
    const [tickets] = await pool.query(`
      SELECT 
        a.id,
        a.employee_id,
        a.application_number,
        a.department,
        a.application_type,
        a.subject,
        a.description,
        a.status,
        a.priority,
        a.assigned_to,
        a.assigned_to_employee_id,
        a.current_step,
        a.total_steps,
        a.is_multi_assign,
        a.submission_date,
        a.last_updated,
        a.approved_by,
        a.approved_date,
        a.approval_notes,
        a.metadata,
        a.documents,
        e.name as employee_name,
        e.email as employee_email,
        e.department as employee_department,
        e.designation as employee_designation,
        e.position as employee_position
      FROM applications a
      LEFT JOIN user_as_employees e ON a.employee_id = e.employee_id
      WHERE a.status = 'approved'
      ORDER BY a.approved_date DESC
    `);

    res.status(200).json({
      success: true,
      data: tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Error fetching approved tickets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch approved tickets', error: error.message });
  }
};

// ========== GET ALL TICKETS — HR ONLY, WITH TABS ==========
// tab=pending  → approved, not yet resolved/ignored
// tab=resolved → metadata.adjustment_resolved = true
// tab=ignored  → metadata.adjustment_ignored = true
// tab=all / omitted → all HR-department tickets
const getAllTickets = async (req, res) => {
  try {
    const { tab, search } = req.query;

    let query = `
      SELECT 
        a.id,
        a.employee_id,
        a.application_number,
        a.department,
        a.application_type,
        a.subject,
        a.description,
        a.status,
        a.priority,
        a.assigned_to,
        a.submission_date,
        a.last_updated,
        a.approved_by,
        a.approved_date,
        a.approval_notes,
        a.rejection_reason,
        a.metadata,
        a.documents,
        e.name as employee_name,
        e.email as employee_email,
        e.department as employee_department,
        e.designation as employee_designation,
        e.position as employee_position
      FROM applications a
      LEFT JOIN user_as_employees e ON a.employee_id = e.employee_id
      WHERE a.department = 'HR'
    `;
    const params = [];

    if (tab === 'pending') {
      // Approved tickets that are NOT resolved and NOT ignored
      query += `
        AND a.status = 'approved'
        AND (a.metadata IS NULL
          OR JSON_UNQUOTE(JSON_EXTRACT(a.metadata, '$.adjustment_resolved')) IS NULL
          OR JSON_UNQUOTE(JSON_EXTRACT(a.metadata, '$.adjustment_resolved')) != 'true')
        AND (a.metadata IS NULL
          OR JSON_UNQUOTE(JSON_EXTRACT(a.metadata, '$.adjustment_ignored')) IS NULL
          OR JSON_UNQUOTE(JSON_EXTRACT(a.metadata, '$.adjustment_ignored')) != 'true')
      `;
    } else if (tab === 'resolved') {
      query += `
        AND a.metadata IS NOT NULL
        AND JSON_UNQUOTE(JSON_EXTRACT(a.metadata, '$.adjustment_resolved')) = 'true'
      `;
    } else if (tab === 'ignored') {
      query += `
        AND a.metadata IS NOT NULL
        AND JSON_UNQUOTE(JSON_EXTRACT(a.metadata, '$.adjustment_ignored')) = 'true'
      `;
    }
    // tab=all or omitted: no extra filter beyond HR department

    if (search) {
      query += ` AND (a.application_number LIKE ? OR a.subject LIKE ? OR e.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY a.submission_date DESC`;

    const [tickets] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
  }
};

// ========== IGNORE TICKET ==========
const ignoreTicket = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const [existing] = await pool.query('SELECT * FROM applications WHERE id = ?', [applicationId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const metadata = existing[0].metadata ? JSON.parse(existing[0].metadata) : {};
    metadata.adjustment_ignored = true;
    metadata.adjustment_ignored_at = new Date().toISOString();
    metadata.adjustment_ignored_by = req.user?.employeeId || null;
    // Remove resolved flag if it was set before
    delete metadata.adjustment_resolved;

    await pool.query(
      'UPDATE applications SET metadata = ?, last_updated = NOW() WHERE id = ?',
      [JSON.stringify(metadata), applicationId]
    );
    const [updated] = await pool.query('SELECT * FROM applications WHERE id = ?', [applicationId]);
    res.status(200).json({ success: true, message: 'Ticket ignored successfully', data: updated[0] });
  } catch (error) {
    console.error('Error ignoring ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to ignore ticket', error: error.message });
  }
};

// ========== GET EMPLOYEE DATA FOR A TICKET ==========
const getEmployeeData = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no date range specified
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Employee Info
    const [employeeInfo] = await pool.query(`
      SELECT employee_id, name, email, department, position, designation,
             employment_status, status, confirmation_date
      FROM user_as_employees WHERE employee_id = ?
    `, [employeeId]);

    // 2. Attendance Records
    const [attendance] = await pool.query(`
      SELECT id, employee_id, name, attendance_date, check_in_time, check_out_time,
             status, total_breaks_taken, total_break_duration_minutes,
             gross_working_time_minutes, net_working_time_minutes,
             expected_working_time_minutes, overtime_minutes, overtime_hours,
             on_time, late_by_minutes, remarks
      FROM Employee_Attendance 
      WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?
      ORDER BY attendance_date DESC
    `, [employeeId, start, end]);

    // 3. Leave Balances
    const [leaves] = await pool.query(`
      SELECT id, employee_id, name, 
             casual_leaves_used, casual_leaves_total, casual_leaves_remaining,
             sick_leaves_used, sick_leaves_total, sick_leaves_remaining,
             annual_leaves_used, annual_leaves_total, annual_leaves_remaining,
             leaves_year, remarks
      FROM employee_leaves WHERE employee_id = ?
    `, [employeeId]);

    // 4. Absent Records
    const [absents] = await pool.query(`
      SELECT id, employee_id, name, absent_date, reason_type, reason,
             is_approved, approved_by, approved_at, remarks
      FROM Employee_Absent 
      WHERE employee_id = ? AND absent_date BETWEEN ? AND ?
      ORDER BY absent_date DESC
    `, [employeeId, start, end]);

    // 5. Checkout Missing Records
    const [checkoutMissing] = await pool.query(`
      SELECT id, original_attendance_id, employee_id, name, attendance_date,
             check_in_time, check_out_time, status, missing_reason,
             employee_explanation, hr_notes, is_resolved, resolved_by, resolved_at
      FROM Employee_Checkout_Missing 
      WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?
      ORDER BY attendance_date DESC
    `, [employeeId, start, end]);

    // 6. Break Records
    const [breaks] = await pool.query(`
      SELECT eb.id, eb.attendance_id, eb.employee_id, eb.break_type,
             eb.break_start_time, eb.break_end_time, eb.break_duration_minutes,
             eb.reason, ea.attendance_date
      FROM Employee_Breaks eb
      JOIN Employee_Attendance ea ON eb.attendance_id = ea.id
      WHERE eb.employee_id = ? AND ea.attendance_date BETWEEN ? AND ?
      ORDER BY ea.attendance_date DESC, eb.break_start_time DESC
    `, [employeeId, start, end]);

    res.status(200).json({
      success: true,
      data: {
        employee: employeeInfo[0] || null,
        attendance,
        leaves: leaves[0] || null,
        absents,
        checkoutMissing,
        breaks
      },
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Error fetching employee data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee data', error: error.message });
  }
};

// ========== UPDATE ATTENDANCE RECORD ==========
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in_time, check_out_time, status, remarks } = req.body;

    // Get the current record first
    const [existing] = await pool.query('SELECT * FROM Employee_Attendance WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const updates = {};
    if (check_in_time !== undefined) updates.check_in_time = check_in_time;
    if (check_out_time !== undefined) updates.check_out_time = check_out_time;
    if (status !== undefined) updates.status = status;
    if (remarks !== undefined) updates.remarks = remarks;

    // Recalculate working time if check-in/out changed
    if (check_in_time || check_out_time) {
      const newCheckIn = check_in_time || existing[0].check_in_time;
      const newCheckOut = check_out_time || existing[0].check_out_time;
      
      if (newCheckIn && newCheckOut) {
        const [h1, m1] = String(newCheckIn).split(':').map(Number);
        const [h2, m2] = String(newCheckOut).split(':').map(Number);
        const grossMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        updates.gross_working_time_minutes = Math.max(0, grossMinutes);
        updates.net_working_time_minutes = Math.max(0, grossMinutes - (existing[0].total_break_duration_minutes || 0));
        
        // Check overtime
        const expected = existing[0].expected_working_time_minutes || 540;
        const overtimeMinutes = Math.max(0, updates.net_working_time_minutes - expected);
        updates.overtime_minutes = overtimeMinutes;
        updates.overtime_hours = (overtimeMinutes / 60).toFixed(2);
      }

      // Check if on time (assuming 10:00 is the check-in deadline)
      if (check_in_time) {
        const [h, m] = String(check_in_time).split(':').map(Number);
        const checkInMinutes = h * 60 + m;
        const deadlineMinutes = 10 * 60; // 10:00 AM
        updates.on_time = checkInMinutes <= deadlineMinutes ? 1 : 0;
        updates.late_by_minutes = Math.max(0, checkInMinutes - deadlineMinutes);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await pool.query(`UPDATE Employee_Attendance SET ${setClause} WHERE id = ?`, [...values, id]);

    // Fetch updated record
    const [updated] = await pool.query('SELECT * FROM Employee_Attendance WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance', error: error.message });
  }
};

// ========== ADD ATTENDANCE RECORD ==========
const addAttendance = async (req, res) => {
  try {
    const { employee_id, attendance_date, check_in_time, check_out_time, status, remarks } = req.body;

    if (!employee_id || !attendance_date) {
      return res.status(400).json({ success: false, message: 'employee_id and attendance_date are required' });
    }

    // Get employee info
    const [emp] = await pool.query('SELECT name, email FROM user_as_employees WHERE employee_id = ?', [employee_id]);
    if (emp.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if record already exists for this date
    const [existing] = await pool.query(
      'SELECT id FROM Employee_Attendance WHERE employee_id = ? AND attendance_date = ?',
      [employee_id, attendance_date]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Attendance record already exists for this date. Use update instead.' });
    }

    // Calculate working time
    let grossMinutes = 0, netMinutes = 0, overtimeMinutes = 0, overtimeHours = 0;
    let onTime = 0, lateByMinutes = 0;

    if (check_in_time && check_out_time) {
      const [h1, m1] = check_in_time.split(':').map(Number);
      const [h2, m2] = check_out_time.split(':').map(Number);
      grossMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
      netMinutes = grossMinutes;
      const expected = 540;
      overtimeMinutes = Math.max(0, netMinutes - expected);
      overtimeHours = (overtimeMinutes / 60).toFixed(2);
    }

    if (check_in_time) {
      const [h, m] = check_in_time.split(':').map(Number);
      const checkInMinutes = h * 60 + m;
      onTime = checkInMinutes <= 600 ? 1 : 0;
      lateByMinutes = Math.max(0, checkInMinutes - 600);
    }

    const [result] = await pool.query(`
      INSERT INTO Employee_Attendance 
      (employee_id, email, name, attendance_date, check_in_time, check_out_time, status,
       gross_working_time_minutes, net_working_time_minutes, expected_working_time_minutes,
       overtime_minutes, overtime_hours, on_time, late_by_minutes, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 540, ?, ?, ?, ?, ?)
    `, [
      employee_id, emp[0].email, emp[0].name, attendance_date,
      check_in_time || null, check_out_time || null, status || 'Present',
      grossMinutes, netMinutes, overtimeMinutes, overtimeHours, onTime, lateByMinutes,
      remarks || null
    ]);

    const [newRecord] = await pool.query('SELECT * FROM Employee_Attendance WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: newRecord[0]
    });
  } catch (error) {
    console.error('Error adding attendance:', error);
    res.status(500).json({ success: false, message: 'Failed to add attendance', error: error.message });
  }
};

// ========== UPDATE LEAVE BALANCES ==========
const updateLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const {
      casual_leaves_used, sick_leaves_used, annual_leaves_used,
      remarks
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM employee_leaves WHERE employee_id = ?', [employeeId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave record not found for this employee' });
    }

    const updates = {};
    if (casual_leaves_used !== undefined) updates.casual_leaves_used = casual_leaves_used;
    if (sick_leaves_used !== undefined) updates.sick_leaves_used = sick_leaves_used;
    if (annual_leaves_used !== undefined) updates.annual_leaves_used = annual_leaves_used;
    if (remarks !== undefined) updates.remarks = remarks;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await pool.query(`UPDATE employee_leaves SET ${setClause} WHERE employee_id = ?`, [...values, employeeId]);

    const [updated] = await pool.query('SELECT * FROM employee_leaves WHERE employee_id = ?', [employeeId]);

    res.status(200).json({
      success: true,
      message: 'Leave balances updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating leaves:', error);
    res.status(500).json({ success: false, message: 'Failed to update leaves', error: error.message });
  }
};

// ========== UPDATE ABSENT RECORD ==========
const updateAbsent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason_type, reason, is_approved, remarks } = req.body;
    const hrEmployeeId = req.user?.employeeId;

    const [existing] = await pool.query('SELECT * FROM Employee_Absent WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Absent record not found' });
    }

    const updates = {};
    if (reason_type !== undefined) updates.reason_type = reason_type;
    if (reason !== undefined) updates.reason = reason;
    if (remarks !== undefined) updates.remarks = remarks;
    if (is_approved !== undefined) {
      updates.is_approved = is_approved;
      if (is_approved) {
        updates.approved_by = hrEmployeeId || null;
        updates.approved_at = new Date();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await pool.query(`UPDATE Employee_Absent SET ${setClause} WHERE id = ?`, [...values, id]);

    const [updated] = await pool.query('SELECT * FROM Employee_Absent WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Absent record updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating absent record:', error);
    res.status(500).json({ success: false, message: 'Failed to update absent record', error: error.message });
  }
};

// ========== DELETE ABSENT RECORD ==========
const deleteAbsent = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM Employee_Absent WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Absent record not found' });
    }

    await pool.query('DELETE FROM Employee_Absent WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Absent record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting absent record:', error);
    res.status(500).json({ success: false, message: 'Failed to delete absent record', error: error.message });
  }
};

// ========== ADD ABSENT RECORD ==========
const addAbsent = async (req, res) => {
  try {
    const { employee_id, absent_date, reason_type, reason, is_approved } = req.body;
    const hrEmployeeId = req.user?.employeeId;

    if (!employee_id || !absent_date) {
      return res.status(400).json({ success: false, message: 'Employee ID and date are required' });
    }

    // Get employee info
    const [emp] = await pool.query('SELECT * FROM user_as_employees WHERE employee_id = ?', [employee_id]);
    if (emp.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if absent record already exists for this date
    const [existing] = await pool.query(
      'SELECT * FROM Employee_Absent WHERE employee_id = ? AND absent_date = ?',
      [employee_id, absent_date]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Absent record already exists for this date. Use update instead.' });
    }

    const [result] = await pool.query(`
      INSERT INTO Employee_Absent 
      (employee_id, name, absent_date, reason_type, reason, is_approved, approved_by, approved_at, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      employee_id,
      emp[0].name,
      absent_date,
      reason_type || 'No Check-in',
      reason || null,
      is_approved ? 1 : 0,
      is_approved ? hrEmployeeId : null,
      is_approved ? new Date() : null,
      null
    ]);

    const [newRecord] = await pool.query('SELECT * FROM Employee_Absent WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Absent record created successfully',
      data: newRecord[0]
    });
  } catch (error) {
    console.error('Error adding absent record:', error);
    res.status(500).json({ success: false, message: 'Failed to add absent record', error: error.message });
  }
};

// ========== RESOLVE CHECKOUT MISSING ==========
const resolveCheckoutMissing = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_out_time, hr_notes } = req.body;
    const hrEmployeeId = req.user?.employeeId;

    const [existing] = await pool.query('SELECT * FROM Employee_Checkout_Missing WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Checkout missing record not found' });
    }

    const updates = {
      is_resolved: 1,
      resolved_by: hrEmployeeId || null,
      resolved_at: new Date()
    };
    if (check_out_time) updates.check_out_time = check_out_time;
    if (hr_notes) updates.hr_notes = hr_notes;

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await pool.query(`UPDATE Employee_Checkout_Missing SET ${setClause} WHERE id = ?`, [...values, id]);

    // If check_out_time provided, also update the original attendance record
    if (check_out_time && existing[0].original_attendance_id) {
      const [h1, m1] = String(existing[0].check_in_time).split(':').map(Number);
      const [h2, m2] = String(check_out_time).split(':').map(Number);
      const grossMinutes = Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));

      await pool.query(`
        UPDATE Employee_Attendance SET 
          check_out_time = ?, 
          gross_working_time_minutes = ?,
          net_working_time_minutes = ? - COALESCE(total_break_duration_minutes, 0),
          remarks = CONCAT(COALESCE(remarks, ''), ' [Checkout resolved via adjustment]')
        WHERE id = ?
      `, [check_out_time, grossMinutes, grossMinutes, existing[0].original_attendance_id]);
    }

    const [updated] = await pool.query('SELECT * FROM Employee_Checkout_Missing WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Checkout missing resolved successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error resolving checkout missing:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve checkout missing', error: error.message });
  }
};

// ========== CLOSE/RESOLVE TICKET ==========
const closeTicket = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { resolution_notes } = req.body;

    const [existing] = await pool.query('SELECT * FROM applications WHERE id = ?', [applicationId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Update application status to 'in-progress' since it's been resolved/adjusted
    // We keep 'approved' status but add metadata about the adjustment
    const metadata = existing[0].metadata ? JSON.parse(existing[0].metadata) : {};
    metadata.adjustment_resolved = true;
    metadata.adjustment_resolved_at = new Date().toISOString();
    metadata.adjustment_resolved_by = req.user?.employeeId || null;
    metadata.resolution_notes = resolution_notes || '';

    await pool.query(`
      UPDATE applications 
      SET metadata = ?, last_updated = NOW()
      WHERE id = ?
    `, [JSON.stringify(metadata), applicationId]);

    const [updated] = await pool.query('SELECT * FROM applications WHERE id = ?', [applicationId]);

    res.status(200).json({
      success: true,
      message: 'Ticket closed/resolved successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to close ticket', error: error.message });
  }
};

// ========== GET ADJUSTMENT HISTORY / LOG ==========
const getAdjustmentLog = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const [application] = await pool.query('SELECT * FROM applications WHERE id = ?', [applicationId]);
    if (application.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const [approvalLog] = await pool.query(`
      SELECT * FROM application_approval_log 
      WHERE application_id = ?
      ORDER BY action_date DESC
    `, [applicationId]);

    res.status(200).json({
      success: true,
      data: {
        application: application[0],
        approvalLog
      }
    });
  } catch (error) {
    console.error('Error fetching adjustment log:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch adjustment log', error: error.message });
  }
};

// ========== CONVERT UNINFORMED ABSENT TO PAID LEAVE (HR Action) ==========
const convertAbsentToPaidLeave = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { leave_type_key = 'casual', notes = '' } = req.body;
    const hrEmployeeId = req.user?.employeeId;

    const validTypes = ['casual', 'sick', 'annual'];
    if (!validTypes.includes(leave_type_key)) {
      return res.status(400).json({ success: false, message: 'leave_type_key must be casual, sick, or annual' });
    }

    const [absent] = await connection.query('SELECT * FROM Employee_Absent WHERE id = ?', [id]);
    if (absent.length === 0) {
      return res.status(404).json({ success: false, message: 'Absent record not found' });
    }

    const record = absent[0];

    // Check employee has leave balance
    const [leaves] = await connection.query(
      'SELECT * FROM employee_leaves WHERE employee_id = ?',
      [record.employee_id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave record not found for employee' });
    }

    const leaveRecord = leaves[0];
    const usedKey = `${leave_type_key}_leaves_used`;
    const totalKey = `${leave_type_key}_leaves_total`;
    const available = (leaveRecord[totalKey] || 0) - (leaveRecord[usedKey] || 0);

    if (available < 1) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leave_type_key} leave balance (available: ${available})`
      });
    }

    await connection.beginTransaction();

    // 1. Update absent record to Paid Leave
    await connection.query(
      `UPDATE Employee_Absent
       SET reason_type = 'Paid Leave',
           leave_type_key = ?,
           is_approved = 1,
           approved_by = ?,
           approved_at = NOW(),
           remarks = ?
       WHERE id = ?`,
      [leave_type_key, hrEmployeeId || null, notes || 'Converted to paid leave by HR', id]
    );

    // 2. Deduct 1 day from the employee's leave balance
    await connection.query(
      `UPDATE employee_leaves SET ${usedKey} = ${usedKey} + 1 WHERE employee_id = ?`,
      [record.employee_id]
    );

    // 3. Check if there's already an attendance record for this date; if not, insert Paid Leave
    const [existingAtt] = await connection.query(
      'SELECT id FROM Employee_Attendance WHERE employee_id = ? AND attendance_date = ?',
      [record.employee_id, record.absent_date]
    );

    if (existingAtt.length === 0) {
      // Fetch employee info for the attendance record
      const [empInfo] = await connection.query(
        'SELECT name, email FROM user_as_employees WHERE employee_id = ?',
        [record.employee_id]
      );
      
      const empName = empInfo.length > 0 ? empInfo[0].name : 'Unknown';
      const empEmail = empInfo.length > 0 ? empInfo[0].email : '';

      await connection.query(
        `INSERT INTO Employee_Attendance
         (employee_id, email, name, attendance_date, status, on_time, late_by_minutes, remarks)
         VALUES (?, ?, ?, ?, 'Paid Leave', 1, 0, ?)`,
        [
          record.employee_id, empEmail, empName,
          record.absent_date,
          `Paid leave (${leave_type_key}) approved by HR`
        ]
      );
    } else {
      await connection.query(
        `UPDATE Employee_Attendance SET status = 'Paid Leave', remarks = ? WHERE id = ?`,
        [`Paid leave (${leave_type_key}) approved by HR`, existingAtt[0].id]
      );
    }

    await connection.commit();

    const [updatedAbsent] = await connection.query('SELECT * FROM Employee_Absent WHERE id = ?', [id]);
    const [updatedLeaves] = await connection.query('SELECT * FROM employee_leaves WHERE employee_id = ?', [record.employee_id]);

    res.status(200).json({
      success: true,
      message: `Absence on ${record.absent_date} converted to ${leave_type_key} paid leave successfully`,
      data: {
        absent: updatedAbsent[0],
        leave_balance: {
          [leave_type_key]: {
            used: updatedLeaves[0][usedKey],
            total: updatedLeaves[0][totalKey],
            remaining: updatedLeaves[0][`${leave_type_key}_leaves_remaining`] ||
              (updatedLeaves[0][totalKey] - updatedLeaves[0][usedKey])
          }
        }
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error converting absent to paid leave:', error);
    res.status(500).json({ success: false, message: 'Failed to convert absent to paid leave', error: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getApprovedTickets,
  getAllTickets,
  getEmployeeData,
  updateAttendance,
  addAttendance,
  updateLeaves,
  updateAbsent,
  addAbsent,
  deleteAbsent,
  resolveCheckoutMissing,
  closeTicket,
  ignoreTicket,
  getAdjustmentLog,
  convertAbsentToPaidLeave
};
