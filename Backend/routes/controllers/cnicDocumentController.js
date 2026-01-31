const pool = require("../../config/database");

// Get CNIC and DOB details for an employee (stored in employee_onboarding)
exports.getEmployeeCnicDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Validate employeeId
    if (!employeeId || isNaN(parseInt(employeeId))) {
      return res.status(400).json({
        success: false,
        message: "Valid employee ID is required",
      });
    }

    const connection = await pool.getConnection();

    try {
      // Always read CNIC/DOB from employee_onboarding (single source of truth)
      const [rows] = await connection.query(
        `SELECT id as employee_id, cnic as cnic_number, cnic_issue_date, cnic_expiry_date, dob as date_of_birth
         FROM employee_onboarding WHERE id = ? LIMIT 1`,
        [parseInt(employeeId)]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const r = rows[0];

      // Compute document status based on expiry date
      let status = null;
      if (!r.cnic_expiry_date) status = 'Invalid';
      else if (new Date(r.cnic_expiry_date) < new Date()) status = 'Expired';
      else status = 'Valid';

      return res.json({
        success: true,
        message: 'CNIC/DOB retrieved from employee_onboarding',
        data: {
          employee_id: r.employee_id,
          cnic_number: r.cnic_number || null,
          cnic_issue_date: r.cnic_issue_date,
          cnic_expiry_date: r.cnic_expiry_date,
          date_of_birth: r.date_of_birth,
          document_status: status
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching CNIC/DOB:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch CNIC/DOB",
      error: error.message,
    });
  }
};

// Update CNIC document (separate from main employee record)
exports.updateEmployeeCnicDocument = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let {
      cnic_number,
      cnic_issue_date,
      cnic_expiry_date,
      date_of_birth,
      document_status,
    } = req.body;

    // Validate employeeId
    if (!employeeId || isNaN(parseInt(employeeId))) {
      return res.status(400).json({
        success: false,
        message: "Valid employee ID is required",
      });
    }

    // Normalize possible ISO timestamps to YYYY-MM-DD
    const normalizeToDate = (val) => {
      if (!val) return val;
      if (typeof val !== 'string') return val;
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      const m = val.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${mm}-${dd}`;
      }
      return val;
    };

    const norm_issue = normalizeToDate(cnic_issue_date);
    const norm_expiry = normalizeToDate(cnic_expiry_date);
    const norm_dob = normalizeToDate(date_of_birth);

    // Validate date formats if provided
    const validateDateFormat = (dateStr) => {
      if (!dateStr) return true; // Allow null/empty
      return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    };

    if (
      norm_issue &&
      !validateDateFormat(norm_issue)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "CNIC issue date must be in YYYY-MM-DD format",
      });
    }

    if (
      norm_expiry &&
      !validateDateFormat(norm_expiry)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "CNIC expiry date must be in YYYY-MM-DD format",
      });
    }

    if (norm_dob && !validateDateFormat(norm_dob)) {
      return res.status(400).json({
        success: false,
        message: "Date of birth must be in YYYY-MM-DD format",
      });
    }

    // Replace variables with normalized versions
    cnic_issue_date = norm_issue;
    cnic_expiry_date = norm_expiry;
    date_of_birth = norm_dob;

    // Validate expiry >= issue date
    if (cnic_issue_date && cnic_expiry_date) {
      if (new Date(cnic_expiry_date) < new Date(cnic_issue_date)) {
        return res.status(400).json({
          success: false,
          message:
            "CNIC expiry date must be same or after issue date",
        });
      }
    }

    // Validate document_status enum
    const validStatuses = ["Valid", "Expired", "Pending", "Invalid"];
    if (document_status && !validStatuses.includes(document_status)) {
      return res.status(400).json({
        success: false,
        message: `Document status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const connection = await pool.getConnection();

    try {
      // Write CNIC/DOB directly into employee_onboarding (single source of truth)
      let updateStatus = document_status;
      if (!updateStatus && (cnic_issue_date || cnic_expiry_date)) {
        // Auto-calculate status based on dates
        if (!cnic_expiry_date) updateStatus = "Invalid";
        else if (new Date(cnic_expiry_date) < new Date()) updateStatus = "Expired";
        else updateStatus = "Valid";
      }

      await connection.query(
        `UPDATE employee_onboarding SET cnic = COALESCE(?, cnic), cnic_issue_date = COALESCE(?, cnic_issue_date), cnic_expiry_date = COALESCE(?, cnic_expiry_date), dob = COALESCE(?, dob), updated_at = NOW() WHERE id = ?`,
        [cnic_number || null, cnic_issue_date || null, cnic_expiry_date || null, date_of_birth || null, parseInt(employeeId)]
      );

      return res.json({
        success: true,
        message: 'CNIC/DOB saved on employee_onboarding',
        data: {
          employee_id: parseInt(employeeId),
          cnic_number,
          cnic_issue_date,
          cnic_expiry_date,
          date_of_birth,
          document_status: updateStatus
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating CNIC document:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update CNIC document",
      error: error.message,
    });
  }
};

// Get all employees with expiring CNIC documents (within X days)
exports.getExpiringCnicDocuments = async (req, res) => {
  try {
    const { daysThreshold = 90 } = req.query;

    if (isNaN(parseInt(daysThreshold)) || parseInt(daysThreshold) < 0) {
      return res.status(400).json({
        success: false,
        message: "daysThreshold must be a positive number",
      });
    }

    const connection = await pool.getConnection();

    try {
      // Use employee_onboarding directly to find upcoming expiries
      const [rows] = await connection.query(
        `SELECT 
          eo.id as id,
          eo.id as employee_id,
          eo.cnic as cnic_number,
          eo.cnic_issue_date,
          eo.cnic_expiry_date,
          eo.dob as date_of_birth,
          eo.name,
          eo.email,
          eo.department,
          DATEDIFF(eo.cnic_expiry_date, CURDATE()) as days_until_expiry
        FROM employee_onboarding eo
        WHERE eo.cnic_expiry_date IS NOT NULL
          AND DATEDIFF(eo.cnic_expiry_date, CURDATE()) <= ?
          AND DATEDIFF(eo.cnic_expiry_date, CURDATE()) > 0
        ORDER BY eo.cnic_expiry_date ASC`,
        [parseInt(daysThreshold)]
      );

      return res.json({
        success: true,
        message: `Found ${rows.length} employees with CNIC expiring within ${daysThreshold} days`,
        threshold_days: parseInt(daysThreshold),
        count: rows.length,
        data: rows,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching expiring CNIC documents:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expiring CNIC documents",
      error: error.message,
    });
  }
};

// Get expired CNIC documents
exports.getExpiredCnicDocuments = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // Use employee_onboarding directly to find expired CNICs
      const [rows] = await connection.query(
        `SELECT 
          eo.id as id,
          eo.id as employee_id,
          eo.cnic as cnic_number,
          eo.cnic_issue_date,
          eo.cnic_expiry_date,
          eo.dob as date_of_birth,
          eo.name,
          eo.email,
          eo.department,
          DATEDIFF(CURDATE(), eo.cnic_expiry_date) as days_expired
        FROM employee_onboarding eo
        WHERE eo.cnic_expiry_date IS NOT NULL
          AND eo.cnic_expiry_date < CURDATE()
        ORDER BY eo.cnic_expiry_date ASC`
      );

      return res.json({
        success: true,
        message: `Found ${rows.length} employees with expired CNIC`,
        count: rows.length,
        data: rows,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching expired CNIC documents:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expired CNIC documents",
      error: error.message,
    });
  }
};
