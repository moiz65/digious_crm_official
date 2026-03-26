const pool = require('../../config/database');
const path = require('path');

// =====================================================
// APPLICATIONS CONTROLLER
// =====================================================

/**
 * Helper: when a leave application is finally approved, update attendance records.
 * Marks absent days in the leave range as "Paid Leave" and deducts leave balance.
 * @param {object} connection - DB connection (transaction already started by caller)
 * @param {object} app         - Application row (must have employee_id, metadata)
 */
const LEAVE_TYPE_MAP = {
  'Casual Leave Request':  'casual',
  'Sick Leave Request':    'sick',
  'Annual Leave Request':  'annual',
  'casual leave':          'casual',
  'sick leave':            'sick',
  'annual leave':          'annual',
};

const processLeaveApproval = async (connection, app) => {
  try {
    const appType = (app.application_type || '').trim();
    const meta = app.metadata
      ? (typeof app.metadata === 'string' ? JSON.parse(app.metadata) : app.metadata)
      : {};

    const leaveTypeKey = meta.leave_type_key || LEAVE_TYPE_MAP[appType];
    if (!leaveTypeKey) return; // Not a tracked leave type

    const startDate = meta.leave_start_date;
    const endDate   = meta.leave_end_date;
    if (!startDate || !endDate) return; // No dates stored — skip

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start > end) return;

    // Collect all calendar dates in range
    const dates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    const employeeId = app.employee_id;

    // 1. For each date, update or create attendance record as Paid Leave
    for (const dateStr of dates) {
      // Mark absent record as approved leave if it exists
      await connection.query(
        `UPDATE Employee_Absent
         SET reason_type  = 'Paid Leave',
             leave_type_key = ?,
             is_approved  = 1,
             approved_at  = NOW(),
             application_id = ?
         WHERE employee_id = ? AND absent_date = ?`,
        [leaveTypeKey, app.id, employeeId, dateStr]
      );

      // Upsert attendance record as Paid Leave
      const [existingAtt] = await connection.query(
        'SELECT id FROM Employee_Attendance WHERE employee_id = ? AND attendance_date = ?',
        [employeeId, dateStr]
      );
      if (existingAtt.length === 0) {
        // Fetch employee info first
        const [empInfo] = await connection.query(
          'SELECT name, email FROM user_as_employees WHERE employee_id = ?',
          [employeeId]
        );
        if (empInfo.length > 0) {
          await connection.query(
            `INSERT INTO Employee_Attendance
             (employee_id, email, name, attendance_date, status, on_time, late_by_minutes, remarks)
             VALUES (?, ?, ?, ?, 'Paid Leave', 1, 0, ?)`,
            [
              employeeId, empInfo[0].email, empInfo[0].name, dateStr,
              `Paid leave (${leaveTypeKey}) — app #${app.application_number}`
            ]
          );
        }
      } else {
        await connection.query(
          `UPDATE Employee_Attendance
           SET status = 'Paid Leave',
               remarks = CONCAT(COALESCE(remarks, ''), ' [Paid leave (${leaveTypeKey}) approved]')
           WHERE id = ?`,
          [existingAtt[0].id]
        );
      }
    }

    // 2. Deduct days from employee_leaves
    const daysCount = dates.length;
    const usedKey = `${leaveTypeKey}_leaves_used`;
    const [currentLeave] = await connection.query(
      'SELECT * FROM employee_leaves WHERE employee_id = ?', [employeeId]
    );
    if (currentLeave.length > 0) {
      await connection.query(
        `UPDATE employee_leaves SET ${usedKey} = ${usedKey} + ? WHERE employee_id = ?`,
        [daysCount, employeeId]
      );
    }

    console.log(`[LEAVE APPROVAL] ${daysCount} day(s) of ${leaveTypeKey} leave recorded for employee ${employeeId}`);
  } catch (err) {
    console.error('[processLeaveApproval] Error (non-fatal):', err.message);
    // Non-fatal — approval still proceeds
  }
};
// Handles CRUD operations for employee applications
// Supports multi-assignee sequential approval workflow
// =====================================================

/**
 * Generate unique application number
 * Format: APP-XXXX-XXX (e.g., APP-Z4A3-XYZ)
 * @returns {string} Unique application number
 */
const generateApplicationNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `APP-${timestamp.slice(-4)}-${random}`;
};

/**
 * Get all applications for a specific employee
 * GET /api/v1/applications/employee/:id
 */
const getEmployeeApplications = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { status, department } = req.query;

    let query = `
      SELECT 
        a.id,
        a.application_number,
        a.department,
        a.application_type,
        a.subject,
        a.description,
        a.status,
        a.priority,
        a.assigned_to,
        a.current_step,
        a.total_steps,
        a.is_multi_assign,
        a.submission_date,
        a.last_updated,
        a.approved_date,
        a.approved_by,
        a.rejection_reason,
        a.documents,
        JSON_LENGTH(a.documents) AS document_count
      FROM applications a
      WHERE a.employee_id = ?
    `;

    const queryParams = [employeeId];

    // Add filters if provided
    if (status) {
      query += ` AND a.status = ?`;
      queryParams.push(status);
    }
    if (department) {
      query += ` AND a.department = ?`;
      queryParams.push(department);
    }

    query += ` ORDER BY a.submission_date DESC`;

    const [applications] = await pool.query(query, queryParams);

    // Fetch assignees for each application
    if (applications.length > 0) {
      const appIds = applications.map(a => a.id);
      const [assignees] = await pool.query(
        `SELECT aa.*, e.designation, e.department as emp_department
         FROM application_assignees aa
         LEFT JOIN user_as_employees e ON aa.employee_id = e.employee_id
         WHERE aa.application_id IN (?)
         ORDER BY aa.step_order ASC`,
        [appIds]
      );

      // Group assignees by application_id
      const assigneeMap = {};
      assignees.forEach(a => {
        if (!assigneeMap[a.application_id]) assigneeMap[a.application_id] = [];
        assigneeMap[a.application_id].push(a);
      });

      // Attach assignees to applications
      applications.forEach(app => {
        app.assignees = assigneeMap[app.id] || [];
      });
    }

    res.status(200).json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Error fetching employee applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

/**
 * Get single application details with assignees and approval log
 * GET /api/v1/applications/:id
 */
const getApplicationById = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const [applications] = await pool.query(
      `SELECT 
        a.*,
        e.name AS employee_name,
        e.email AS employee_email
       FROM applications a
       LEFT JOIN user_as_employees e ON a.employee_id = e.employee_id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = applications[0];

    // Fetch all assignees with employee details
    const [assignees] = await pool.query(
      `SELECT aa.*, e.designation, e.department as emp_department, e.email
       FROM application_assignees aa
       LEFT JOIN user_as_employees e ON aa.employee_id = e.employee_id
       WHERE aa.application_id = ?
       ORDER BY aa.step_order ASC`,
      [applicationId]
    );

    // Fetch approval log
    const [approvalLog] = await pool.query(
      `SELECT * FROM application_approval_log
       WHERE application_id = ?
       ORDER BY action_date ASC`,
      [applicationId]
    );

    application.assignees = assignees;
    application.approval_log = approvalLog;

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

/**
 * Create new application with multi-assignee support
 * POST /api/v1/applications
 * 
 * Body accepts:
 *   assignees: [{ employee_id, employee_name }]  - Array of assignees in priority order
 *   OR legacy single-assign: assigned_to_employee_id, assigned_to
 */
const createApplication = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Use ONLY authenticated user's employee_id (from JWT token)
    const employeeId = req.user?.employeeId || req.user?.employee_id;
    
    const {
      department,
      application_type,
      subject,
      description,
      priority = 'medium',
      assigned_to = null,
      assigned_to_employee_id = null,
      assignees = [],  // Multi-assign: [{ employee_id, employee_name }]
      cc_department = null,
      metadata = null
    } = req.body;

    // Validation
    if (!employeeId || !department || !application_type || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: department, application_type, subject, description. Also ensure you are authenticated.'
      });
    }

    // Auto-set CC: HR is always in CC unless application is FOR HR department
    let ccDept = cc_department;
    if (!ccDept && department !== 'HR' && department !== 'Human Resources') {
      ccDept = 'HR';
    }

    // Determine if multi-assign
    const isMultiAssign = assignees.length > 0;
    const totalSteps = isMultiAssign ? assignees.length : (assigned_to_employee_id ? 1 : 0);

    // Generate unique application number
    const applicationNumber = generateApplicationNumber();

    // For backward compatibility: use first assignee for assigned_to fields
    const primaryAssignedTo = isMultiAssign ? assignees[0].employee_name : assigned_to;
    const primaryAssignedToId = isMultiAssign ? assignees[0].employee_id : assigned_to_employee_id;

    // Start transaction
    await connection.beginTransaction();

    // Insert application
    const [result] = await connection.query(
      `INSERT INTO applications (
        employee_id,
        application_number,
        department,
        application_type,
        subject,
        description,
        status,
        priority,
        assigned_to,
        assigned_to_employee_id,
        current_step,
        total_steps,
        is_multi_assign,
        cc_department,
        submission_date,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        employeeId,
        applicationNumber,
        department,
        application_type,
        subject,
        description,
        priority,
        primaryAssignedTo,
        primaryAssignedToId,
        totalSteps > 0 ? 1 : 0,  // Start at step 1 if there are assignees
        totalSteps,
        isMultiAssign ? 1 : 0,
        ccDept,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    const applicationId = result.insertId;

    // Insert assignees into application_assignees table
    if (isMultiAssign) {
      for (let i = 0; i < assignees.length; i++) {
        const assignee = assignees[i];
        await connection.query(
          `INSERT INTO application_assignees (
            application_id, employee_id, employee_name, step_order, status
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            applicationId,
            assignee.employee_id,
            assignee.employee_name,
            i + 1,  // step_order: 1-based
            i === 0 ? 'pending' : 'pending'  // All start as pending, first is the active one
          ]
        );

        // Log the assignment
        await connection.query(
          `INSERT INTO application_approval_log (
            application_id, employee_id, employee_name, action, step_order, notes
          ) VALUES (?, ?, ?, 'assigned', ?, ?)`,
          [applicationId, assignee.employee_id, assignee.employee_name, i + 1, `Assigned as step ${i + 1} approver`]
        );
      }
    } else if (assigned_to_employee_id) {
      // Legacy single assign - also insert into assignees table
      await connection.query(
        `INSERT INTO application_assignees (
          application_id, employee_id, employee_name, step_order, status
        ) VALUES (?, ?, ?, 1, 'pending')`,
        [applicationId, assigned_to_employee_id, assigned_to || 'Unknown']
      );

      // Log the assignment
      await connection.query(
        `INSERT INTO application_approval_log (
          application_id, employee_id, employee_name, action, step_order, notes
        ) VALUES (?, ?, ?, 'assigned', 1, 'Assigned as sole approver')`,
        [applicationId, assigned_to_employee_id, assigned_to || 'Unknown']
      );
    }

    // Handle document uploads if provided
    if (req.files && req.files.length > 0) {
      const documents = req.files.map(file => ({
        name: file.originalname,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        path: file.path,
        type: file.mimetype,
        uploaded_date: new Date().toISOString()
      }));

      await connection.query(
        `UPDATE applications SET documents = ? WHERE id = ?`,
        [JSON.stringify(documents), applicationId]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: {
        id: applicationId,
        application_number: applicationNumber,
        employee_id: employeeId,
        department,
        application_type,
        subject,
        status: 'pending',
        total_steps: totalSteps,
        is_multi_assign: isMultiAssign,
        assignees: isMultiAssign ? assignees.map((a, i) => ({ ...a, step_order: i + 1 })) : [],
        submission_date: new Date()
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating application',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Update application status
 * PUT /api/v1/applications/:id/status
 */
const updateApplicationStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const applicationId = req.params.id;
    const { status, approved_by, rejection_reason } = req.body;

    // Validation
    const validStatuses = ['pending', 'approved', 'rejected', 'in_review', 'in-progress', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Fetch the application first (needed for leave processing)
    const [apps] = await connection.query('SELECT * FROM applications WHERE id = ?', [applicationId]);
    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    let query = `UPDATE applications SET status = ?`;
    const params = [status];

    if (status === 'approved') {
      query += `, approved_by = ?, approved_date = NOW()`;
      params.push(approved_by || 'System');
    } else if (status === 'rejected') {
      query += `, rejection_reason = ?`;
      params.push(rejection_reason || 'No reason provided');
    }

    query += ` WHERE id = ?`;
    params.push(applicationId);

    await connection.beginTransaction();
    await connection.query(query, params);

    // If approving a leave application, auto-update attendance
    if (status === 'approved') {
      await processLeaveApproval(connection, { ...apps[0], id: applicationId });
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: { id: applicationId, status }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Update application priority (HR/Admin)
 * PATCH /api/v1/applications/:id/priority
 */
const updateApplicationPriority = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { priority } = req.body;
    const valid = ['low','medium','high','urgent'];

    if (!valid.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }

    const [result] = await pool.query(
      `UPDATE applications SET priority = ? WHERE id = ?`,
      [priority, applicationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, message: 'Priority updated', data: { id: applicationId, priority } });
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ success: false, message: 'Error updating priority', error: error.message });
  }
};

/**
 * Update full application (for employees to edit their own applications)
 * PUT /api/v1/applications/:id
 * Supports multi-assign: pass assignees[] array to update the approval chain
 */
const updateApplication = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const applicationId = req.params.id;
    const employeeId = req.user.employeeId; // From JWT auth middleware
    
    const {
      department,
      application_type,
      subject,
      description,
      priority,
      assigned_to_employee_id,
      assigned_to,
      assignees,  // Multi-assign: [{ employee_id, employee_name }]
      cc_department
    } = req.body;

    // First, verify the application belongs to this employee
    const [existingApp] = await connection.query(
      `SELECT employee_id, status FROM applications WHERE id = ?`,
      [applicationId]
    );

    if (existingApp.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Only allow editing if it's the owner and status is pending
    if (existingApp[0].employee_id !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own applications'
      });
    }

    if (existingApp[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be edited'
      });
    }

    await connection.beginTransaction();

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (department) {
      updates.push('department = ?');
      params.push(department);
    }
    if (application_type) {
      updates.push('application_type = ?');
      params.push(application_type);
    }
    if (subject) {
      updates.push('subject = ?');
      params.push(subject);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (cc_department !== undefined) {
      updates.push('cc_department = ?');
      params.push(cc_department);
    }

    // Handle multi-assign update
    if (assignees && Array.isArray(assignees)) {
      const isMultiAssign = assignees.length > 1;
      const totalSteps = assignees.length;
      
      // Update application-level fields
      updates.push('is_multi_assign = ?');
      params.push(isMultiAssign ? 1 : 0);
      updates.push('total_steps = ?');
      params.push(totalSteps);
      updates.push('current_step = ?');
      params.push(totalSteps > 0 ? 1 : 0);

      if (assignees.length > 0) {
        updates.push('assigned_to = ?');
        params.push(assignees[0].employee_name);
        updates.push('assigned_to_employee_id = ?');
        params.push(assignees[0].employee_id);
      } else {
        updates.push('assigned_to = NULL');
        updates.push('assigned_to_employee_id = NULL');
      }

      // Delete old assignees and re-create
      await connection.query(
        `DELETE FROM application_assignees WHERE application_id = ?`,
        [applicationId]
      );

      // Insert new assignees
      for (let i = 0; i < assignees.length; i++) {
        const assignee = assignees[i];
        await connection.query(
          `INSERT INTO application_assignees (
            application_id, employee_id, employee_name, step_order, status
          ) VALUES (?, ?, ?, ?, 'pending')`,
          [applicationId, assignee.employee_id, assignee.employee_name, i + 1]
        );
      }
    } else if (assigned_to_employee_id !== undefined) {
      // Legacy single assign update
      updates.push('assigned_to_employee_id = ?');
      params.push(assigned_to_employee_id);
      if (assigned_to !== undefined) {
        updates.push('assigned_to = ?');
        params.push(assigned_to);
      }
    }

    // Always update last_updated timestamp
    updates.push('last_updated = NOW()');

    if (updates.length === 1) { // Only last_updated
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const query = `UPDATE applications SET ${updates.join(', ')} WHERE id = ?`;
    params.push(applicationId);

    await connection.query(query, params);
    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: {
        id: applicationId,
        updated_fields: updates.length - 1
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Upload/Replace application document (PDF only, Cloudinary storage)
 * POST /api/v1/applications/:id/documents
 * NOTE: Only ONE PDF is allowed per application. Multiple docs must be merged into single PDF.
 */
const addApplicationDocument = async (req, res) => {
  const cloudinary = require('../config/cloudinary');
  
  try {
    const applicationId = req.params.id;
    const employeeId = req.user.employeeId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Validate file type - PDF ONLY
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are allowed. If you have multiple documents, please merge them into a single PDF file.',
        hint: 'Use online tools like ilovepdf.com or smallpdf.com to merge multiple files into one PDF'
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit. Please compress your PDF.',
        hint: 'Use online tools like ilovepdf.com to compress your PDF'
      });
    }

    // Get current application and verify ownership
    const [apps] = await pool.query(
      `SELECT employee_id, documents FROM applications WHERE id = ?`,
      [applicationId]
    );

    if (apps.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify ownership (only employee who created the application can upload documents)
    if (apps[0].employee_id !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You can only upload documents to your own applications'
      });
    }

    // Delete old document from Cloudinary if it exists
    if (apps[0].documents) {
      try {
        const oldDoc = JSON.parse(apps[0].documents);
        if (oldDoc.cloudinary_public_id) {
          await cloudinary.uploader.destroy(oldDoc.cloudinary_public_id, { resource_type: 'raw' });
          console.log(`Deleted old document: ${oldDoc.cloudinary_public_id}`);
        }
      } catch (e) {
        console.log('No old document to delete or error deleting:', e.message);
      }
    }

    // Upload PDF to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'digious_crm/applications',
          resource_type: 'raw', // For PDFs and other non-image files
          public_id: `app_${applicationId}_${Date.now()}`,
          format: 'pdf',
          type: 'upload'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Stream the buffer to Cloudinary
      uploadStream.end(req.file.buffer);
    });

    // Create document record (single PDF only)
    const documentRecord = {
      name: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      type: 'application/pdf',
      cloudinary_url: uploadResult.secure_url,
      cloudinary_public_id: uploadResult.public_id,
      uploaded_date: new Date().toISOString().split('T')[0],
      uploaded_by: employeeId
    };

    // Update application with new document (replaces any existing)
    await pool.query(
      `UPDATE applications SET documents = ? WHERE id = ?`,
      [JSON.stringify(documentRecord), applicationId]
    );

    res.status(201).json({
      success: true,
      message: 'PDF document uploaded successfully to Cloudinary',
      data: {
        name: documentRecord.name,
        size: documentRecord.size,
        url: documentRecord.cloudinary_url,
        uploaded_date: documentRecord.uploaded_date
      },
      note: 'Only one PDF is allowed per application. Previous document (if any) has been replaced.'
    });
  } catch (error) {
    console.error('Error uploading document to Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

/**
 * Delete application
 * DELETE /api/v1/applications/:id
 */
const deleteApplication = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const applicationId = req.params.id;

    await connection.beginTransaction();

    // Delete documents first
    await connection.query(
      `DELETE FROM application_documents WHERE application_id = ?`,
      [applicationId]
    );

    // Delete application
    const [result] = await connection.query(
      `DELETE FROM applications WHERE id = ?`,
      [applicationId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Get application statistics
 * GET /api/v1/applications/stats/summary
 */
const getApplicationStatistics = async (req, res) => {
  try {
    const employeeId = req.params.employeeId || req.user?.employeeId;

    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) AS total_applications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
        SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) AS in_review_count
       FROM applications
       WHERE employee_id = ?`,
      [employeeId]
    );

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

/**
 * Get all applications (for HR/Admin view) with multi-assign info
 * GET /api/v1/applications/all
 */
const getAllApplications = async (req, res) => {
  try {
    const { status, department, application_type, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT 
        a.id,
        a.application_number,
        a.employee_id,
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
        a.cc_department,
        a.submission_date,
        a.last_updated,
        a.approved_date,
        a.approved_by,
        a.rejection_reason,
        a.documents,
        JSON_LENGTH(a.documents) AS document_count,
        e.name AS applicant_name,
        e.email AS applicant_email,
        e.designation AS applicant_designation,
        assigned_emp.name AS assigned_to_name,
        assigned_emp.designation AS assigned_to_designation,
        assigned_emp.department AS assigned_to_department
      FROM applications a
      LEFT JOIN user_as_employees e ON a.employee_id = e.employee_id
      LEFT JOIN user_as_employees assigned_emp ON a.assigned_to_employee_id = assigned_emp.employee_id
    `;

    const queryParams = [];
    const conditions = [];

    // Add filters if provided
    if (status) {
      conditions.push(`a.status = ?`);
      queryParams.push(status);
    }
    if (department) {
      conditions.push(`a.department = ?`);
      queryParams.push(department);
    }
    if (application_type) {
      conditions.push(`a.application_type = ?`);
      queryParams.push(application_type);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY a.submission_date DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), offset);

    const [applications] = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM applications a`;
    if (conditions.length > 0) {
      countQuery += ` WHERE ` + conditions.join(' AND ');
    }
    const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));

    // Fetch assignees for all applications
    if (applications.length > 0) {
      const appIds = applications.map(a => a.id);
      const [assignees] = await pool.query(
        `SELECT aa.*, e.designation, e.department as emp_department
         FROM application_assignees aa
         LEFT JOIN user_as_employees e ON aa.employee_id = e.employee_id
         WHERE aa.application_id IN (?)
         ORDER BY aa.step_order ASC`,
        [appIds]
      );

      // Group assignees by application_id
      const assigneeMap = {};
      assignees.forEach(a => {
        if (!assigneeMap[a.application_id]) assigneeMap[a.application_id] = [];
        assigneeMap[a.application_id].push(a);
      });

      // Attach assignees to applications
      applications.forEach(app => {
        app.assignees = assigneeMap[app.id] || [];
      });
    }

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

/**
 * Search employees for assignment auto-suggest
 * GET /api/v1/applications/employees/search?q=<query>&department=<dept>
 * Returns basic employee info for verification
 */
const searchEmployees = async (req, res) => {
  try {
    const { q, department } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let query = `
      SELECT 
        employee_id,
        name,
        email,
        department,
        designation,
        position,
        employment_status,
        status
      FROM user_as_employees
      WHERE status = 'Active'
        AND (name LIKE ? OR email LIKE ?)
    `;

    const searchTerm = `%${q}%`;
    const queryParams = [searchTerm, searchTerm];

    if (department) {
      query += ` AND department = ?`;
      queryParams.push(department);
    }

    query += ` ORDER BY name ASC LIMIT 10`;

    const [employees] = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching employees',
      error: error.message
    });
  }
};

/**
 * Get applications assigned to the current user (via application_assignees table)
 * GET /api/v1/applications/assigned-to-me
 */
const getAssignedToMe = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId || req.user?.employee_id;
    const { status } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID not found in token'
      });
    }

    let query = `
      SELECT 
        a.id,
        a.application_number,
        a.employee_id,
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
        a.cc_department,
        a.submission_date,
        a.last_updated,
        a.approved_date,
        a.approved_by,
        a.rejection_reason,
        a.documents,
        JSON_LENGTH(a.documents) AS document_count,
        e.name AS applicant_name,
        e.email AS applicant_email,
        e.designation AS applicant_designation,
        e.department AS applicant_department,
        aa.step_order AS my_step_order,
        aa.status AS my_step_status
      FROM applications a
      INNER JOIN application_assignees aa ON a.id = aa.application_id AND aa.employee_id = ?
      LEFT JOIN user_as_employees e ON a.employee_id = e.employee_id
    `;

    const queryParams = [employeeId];

    const conditions = [];
    if (status) {
      conditions.push(`a.status = ?`);
      queryParams.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY a.submission_date DESC`;

    const [applications] = await pool.query(query, queryParams);

    // Fetch all assignees for these applications
    if (applications.length > 0) {
      const appIds = applications.map(a => a.id);
      const [allAssignees] = await pool.query(
        `SELECT aa.*, e.designation, e.department as emp_department
         FROM application_assignees aa
         LEFT JOIN user_as_employees e ON aa.employee_id = e.employee_id
         WHERE aa.application_id IN (?)
         ORDER BY aa.step_order ASC`,
        [appIds]
      );

      const assigneeMap = {};
      allAssignees.forEach(a => {
        if (!assigneeMap[a.application_id]) assigneeMap[a.application_id] = [];
        assigneeMap[a.application_id].push(a);
      });

      applications.forEach(app => {
        app.assignees = assigneeMap[app.id] || [];
        // Determine if it's this user's turn (current_step matches their step_order)
        app.is_my_turn = app.current_step === app.my_step_order && app.status === 'pending';
      });
    }

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching assigned applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned applications',
      error: error.message
    });
  }
};

/**
 * Withdraw an application (employee only)
 * POST /api/v1/applications/:id/withdraw
 */
const withdrawApplication = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const employeeId = req.user.employeeId;

    // Verify application exists and belongs to employee
    const [application] = await pool.query(
      `SELECT employee_id, status FROM applications WHERE id = ?`,
      [applicationId]
    );

    if (application.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application[0].employee_id !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own applications'
      });
    }

    if (application[0].status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw applications that are still pending. Only submitted applications can be withdrawn.'
      });
    }

    // Update status to withdrawn
    await pool.query(
      `UPDATE applications SET status = 'withdrawn' WHERE id = ?`,
      [applicationId]
    );

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing application',
      error: error.message
    });
  }
};

/**
 * Approve an application (sequential chain approval)
 * PATCH /api/v1/applications/:id/approve
 * 
 * Flow:
 *   - Employee apps (department != HR): assignee chain → HR final approval
 *   - HR apps (department == HR): assignee chain → last assignee is final
 *   - Each step moves to next. When all steps done:
 *     - For non-HR: status stays pending until HR gives final approval
 *     - For HR: auto-approved after last assignee approves
 */
const approveApplication = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const applicationId = req.params.id;
    const { approval_notes } = req.body;
    const employeeId = req.user?.employeeId || req.user?.employee_id;
    const employeeName = req.user?.name || 'Unknown';

    // Get application details
    const [apps] = await connection.query(
      `SELECT a.*, e.department as submitter_department 
       FROM applications a
       LEFT JOIN user_as_employees e ON a.employee_id = e.employee_id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = apps[0];

    if (app.status === 'approved' || app.status === 'rejected' || app.status === 'withdrawn') {
      return res.status(400).json({ success: false, message: `Application is already ${app.status}` });
    }

    await connection.beginTransaction();

    // Check if this user is the current step assignee
    const [currentAssignee] = await connection.query(
      `SELECT * FROM application_assignees
       WHERE application_id = ? AND step_order = ? AND employee_id = ?`,
      [applicationId, app.current_step, employeeId]
    );

    const isCurrentStepAssignee = currentAssignee.length > 0;
    const isHrApp = app.department === 'HR' || app.department === 'Human Resources';

    // If not the current step assignee, check if this is HR doing final approval on a non-HR app
    const isHrFinalApproval = !isCurrentStepAssignee && !isHrApp && app.current_step > app.total_steps;
    
    if (!isCurrentStepAssignee && !isHrFinalApproval) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'It is not your turn to approve this application. Current step: ' + app.current_step
      });
    }

    if (isCurrentStepAssignee) {
      // Update this assignee's status to approved
      await connection.query(
        `UPDATE application_assignees SET status = 'approved', action_date = NOW(), notes = ?
         WHERE application_id = ? AND step_order = ?`,
        [approval_notes || null, applicationId, app.current_step]
      );

      // Log the approval action
      await connection.query(
        `INSERT INTO application_approval_log (application_id, employee_id, employee_name, action, step_order, notes)
         VALUES (?, ?, ?, 'approved', ?, ?)`,
        [applicationId, employeeId, employeeName, app.current_step, approval_notes || null]
      );

      const nextStep = app.current_step + 1;

      if (nextStep <= app.total_steps) {
        // Move to next assignee
        await connection.query(
          `UPDATE applications SET current_step = ?, status = 'in-progress' WHERE id = ?`,
          [nextStep, applicationId]
        );

        // Log the forwarding
        const [nextAssignee] = await connection.query(
          `SELECT employee_name FROM application_assignees WHERE application_id = ? AND step_order = ?`,
          [applicationId, nextStep]
        );

        await connection.query(
          `INSERT INTO application_approval_log (application_id, employee_id, employee_name, action, step_order, notes)
           VALUES (?, ?, ?, 'forwarded', ?, ?)`,
          [applicationId, employeeId, employeeName, nextStep,
           `Forwarded to ${nextAssignee.length > 0 ? nextAssignee[0].employee_name : 'next assignee'}`]
        );

        await connection.commit();
        return res.status(200).json({
          success: true,
          message: `Step ${app.current_step} approved. Moved to step ${nextStep}.`,
          data: {
            id: applicationId,
            current_step: nextStep,
            total_steps: app.total_steps,
            status: 'in-progress',
            next_assignee: nextAssignee.length > 0 ? nextAssignee[0].employee_name : null
          }
        });
      } else {
        // All assignees approved
        if (isHrApp) {
          // HR app: last assignee approval = final approval
          await connection.query(
            `UPDATE applications SET 
              status = 'approved', 
              current_step = ?,
              approved_by = ?,
              approved_date = NOW(),
              approval_notes = ?
            WHERE id = ?`,
            [nextStep, employeeName, approval_notes || null, applicationId]
          );

          // Auto-update attendance for leave applications
          await processLeaveApproval(connection, { ...app, id: applicationId });

          await connection.commit();
          return res.status(200).json({
            success: true,
            message: 'Application fully approved! (Final assignee approval)',
            data: { id: applicationId, status: 'approved', approved_by: employeeName }
          });
        } else {
          // Non-HR app: needs HR final approval
          await connection.query(
            `UPDATE applications SET current_step = ?, status = 'in-progress' WHERE id = ?`,
            [nextStep, applicationId]  // current_step goes beyond total_steps = waiting for HR
          );

          await connection.query(
            `INSERT INTO application_approval_log (application_id, employee_id, employee_name, action, step_order, notes)
             VALUES (?, ?, ?, 'forwarded', ?, 'All assignees approved. Awaiting HR final approval.')`,
            [applicationId, employeeId, employeeName, nextStep]
          );

          await connection.commit();
          return res.status(200).json({
            success: true,
            message: 'All assignees approved. Awaiting HR final approval.',
            data: {
              id: applicationId,
              current_step: nextStep,
              total_steps: app.total_steps,
              status: 'in-progress',
              awaiting_hr: true
            }
          });
        }
      }
    }

    // HR Final Approval (non-HR apps only, when current_step > total_steps)
    if (isHrFinalApproval) {
      await connection.query(
        `UPDATE applications SET 
          status = 'approved', 
          approved_by = ?,
          approved_date = NOW(),
          approval_notes = ?
        WHERE id = ?`,
        [employeeName, approval_notes || null, applicationId]
      );

      await connection.query(
        `INSERT INTO application_approval_log (application_id, employee_id, employee_name, action, step_order, notes)
         VALUES (?, ?, ?, 'approved', ?, ?)`,
        [applicationId, employeeId, employeeName, app.current_step, 'HR Final Approval: ' + (approval_notes || 'Approved')]
      );

      // Auto-update attendance for leave applications
      await processLeaveApproval(connection, { ...app, id: applicationId });

      await connection.commit();
      return res.status(200).json({
        success: true,
        message: 'Application fully approved by HR!',
        data: { id: applicationId, status: 'approved', approved_by: employeeName }
      });
    }

  } catch (error) {
    await connection.rollback();
    console.error('Error approving application:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving application',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Reject an application (any assignee or HR can reject)
 * PATCH /api/v1/applications/:id/reject
 * Rejection at any step stops the entire chain
 */
const rejectApplication = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const applicationId = req.params.id;
    const { rejection_reason } = req.body;
    const employeeId = req.user?.employeeId || req.user?.employee_id;
    const employeeName = req.user?.name || 'Unknown';

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Get application details
    const [apps] = await connection.query(
      `SELECT * FROM applications WHERE id = ?`,
      [applicationId]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = apps[0];

    if (app.status === 'approved' || app.status === 'rejected' || app.status === 'withdrawn') {
      return res.status(400).json({ success: false, message: `Application is already ${app.status}` });
    }

    // Verify this user is either the current step assignee or HR
    const [currentAssignee] = await connection.query(
      `SELECT * FROM application_assignees
       WHERE application_id = ? AND step_order = ? AND employee_id = ?`,
      [applicationId, app.current_step, employeeId]
    );

    const isCurrentStepAssignee = currentAssignee.length > 0;
    const isHrApp = app.department === 'HR' || app.department === 'Human Resources';
    const isHrFinalReject = !isCurrentStepAssignee && !isHrApp && app.current_step > app.total_steps;

    if (!isCurrentStepAssignee && !isHrFinalReject) {
      return res.status(403).json({
        success: false,
        message: 'It is not your turn to act on this application'
      });
    }

    await connection.beginTransaction();

    // Update this assignee's status to rejected (if it's an assignee)
    if (isCurrentStepAssignee) {
      await connection.query(
        `UPDATE application_assignees SET status = 'rejected', action_date = NOW(), notes = ?
         WHERE application_id = ? AND step_order = ?`,
        [rejection_reason, applicationId, app.current_step]
      );

      // Mark remaining steps as skipped
      await connection.query(
        `UPDATE application_assignees SET status = 'skipped'
         WHERE application_id = ? AND step_order > ?`,
        [applicationId, app.current_step]
      );
    }

    // Update application status to rejected
    await connection.query(
      `UPDATE applications SET 
        status = 'rejected', 
        rejection_reason = ?
      WHERE id = ?`,
      [rejection_reason, applicationId]
    );

    // Log the rejection
    await connection.query(
      `INSERT INTO application_approval_log (application_id, employee_id, employee_name, action, step_order, notes)
       VALUES (?, ?, ?, 'rejected', ?, ?)`,
      [applicationId, employeeId, employeeName, app.current_step, rejection_reason]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Application rejected',
      data: {
        id: applicationId,
        status: 'rejected',
        rejected_by: employeeName,
        rejected_at_step: app.current_step
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting application',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Withdraw assignment from an application (assignee only)
 * POST /api/v1/applications/:id/withdraw-assignment
 * Removes the assignee from the chain and adjusts steps
 */
const withdrawAssignment = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const applicationId = req.params.id;
    const employeeId = req.user.employeeId;
    const employeeName = req.user?.name || 'Unknown';

    // Get application details
    const [apps] = await connection.query(
      `SELECT * FROM applications WHERE id = ?`,
      [applicationId]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Check if this employee is an assignee
    const [assignee] = await connection.query(
      `SELECT * FROM application_assignees WHERE application_id = ? AND employee_id = ?`,
      [applicationId, employeeId]
    );

    if (assignee.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'This application is not assigned to you'
      });
    }

    await connection.beginTransaction();

    const removedStep = assignee[0].step_order;

    // Remove this assignee
    await connection.query(
      `DELETE FROM application_assignees WHERE application_id = ? AND employee_id = ?`,
      [applicationId, employeeId]
    );

    // Re-order remaining assignees
    await connection.query(
      `UPDATE application_assignees SET step_order = step_order - 1
       WHERE application_id = ? AND step_order > ?`,
      [applicationId, removedStep]
    );

    // Update application totals
    const [remaining] = await connection.query(
      `SELECT COUNT(*) as cnt FROM application_assignees WHERE application_id = ?`,
      [applicationId]
    );

    const newTotal = remaining[0].cnt;
    const app = apps[0];
    let newCurrentStep = app.current_step;
    if (removedStep <= app.current_step) {
      newCurrentStep = Math.max(1, app.current_step - 1);
    }
    if (newTotal === 0) {
      newCurrentStep = 0;
    }

    await connection.query(
      `UPDATE applications SET 
        total_steps = ?,
        current_step = ?,
        is_multi_assign = ?,
        assigned_to = (SELECT employee_name FROM application_assignees WHERE application_id = ? AND step_order = 1 LIMIT 1),
        assigned_to_employee_id = (SELECT employee_id FROM application_assignees WHERE application_id = ? AND step_order = 1 LIMIT 1)
      WHERE id = ?`,
      [newTotal, newCurrentStep, newTotal > 1 ? 1 : 0, applicationId, applicationId, applicationId]
    );

    // Log the withdrawal
    await connection.query(
      `INSERT INTO application_approval_log (application_id, employee_id, employee_name, action, step_order, notes)
       VALUES (?, ?, ?, 'withdrawn', ?, 'Assignee withdrew from approval chain')`,
      [applicationId, employeeId, employeeName, removedStep]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Assignment withdrawn successfully',
      data: { total_steps: newTotal, current_step: newCurrentStep }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error withdrawing assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing assignment',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Get approval log for an application
 * GET /api/v1/applications/:id/approval-log
 */
const getApprovalLog = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const [log] = await pool.query(
      `SELECT al.*, e.designation, e.department as emp_department
       FROM application_approval_log al
       LEFT JOIN user_as_employees e ON al.employee_id = e.employee_id
       WHERE al.application_id = ?
       ORDER BY al.action_date ASC`,
      [applicationId]
    );

    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching approval log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approval log',
      error: error.message
    });
  }
};

/**
 * Get assignees for an application
 * GET /api/v1/applications/:id/assignees
 */
const getApplicationAssignees = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const [assignees] = await pool.query(
      `SELECT aa.*, e.designation, e.department as emp_department, e.email
       FROM application_assignees aa
       LEFT JOIN user_as_employees e ON aa.employee_id = e.employee_id
       WHERE aa.application_id = ?
       ORDER BY aa.step_order ASC`,
      [applicationId]
    );

    res.status(200).json({
      success: true,
      data: assignees
    });
  } catch (error) {
    console.error('Error fetching assignees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignees',
      error: error.message
    });
  }
};

module.exports = {
  getEmployeeApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  addApplicationDocument,
  deleteApplication,
  getApplicationStatistics,
  getAllApplications,
  generateApplicationNumber,
  searchEmployees,
  getAssignedToMe,
  withdrawApplication,
  approveApplication,
  rejectApplication,
  withdrawAssignment,
  updateApplicationPriority,
  getApprovalLog,
  getApplicationAssignees
};
