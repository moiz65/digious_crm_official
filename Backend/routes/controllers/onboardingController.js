const pool = require("../../config/database");
const bcrypt = require("bcryptjs");
const cloudinary = require("../../config/cloudinary");

// Create new employee onboarding
exports.createEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      password,
      phone,
      cnic,
      department,
      sub_department,
      join_date,
      joinDate,
      baseSalary,
      allowances,
      address,
      emergencyContact,
      emergency_contact,
      bankAccount,
      bank_account,
      taxId,
      tax_id,
      designation,
      employment_status,
      employmentStatus,
      confirmation_date,
      confirmationDate,
      account_title_name,
      accountTitleName,
      bank_name,
      bankName,
      cnic_issue_date,
      cnicIssueDate,
      cnic_expiry_date,
      cnicExpiryDate,
      requestPasswordChange,
      request_password_change,
      profile_photo,
      profile_picture,
      // Resources
      laptop,
      laptopSerial,
      laptop_serial,
      charger,
      chargerSerial,
      charger_serial,
      mouse,
      mouseSerial,
      mouse_serial,
      mobile,
      mobileSerial,
      mobile_serial,
      keyboard,
      keyboardSerial,
      keyboard_serial,
      monitor,
      monitorSerial,
      monitor_serial,
      dynamicResources,
      dynamic_resources,
      resourcesNote,
      resources_note,
    } = req.body;

    // Normalize field names (handle both camelCase and snake_case)
    const normalizedData = {
      employeeId,
      name,
      email,
      password,
      phone,
      cnic,
      department,
      sub_department,
      joinDate: join_date || joinDate,
      baseSalary,
      allowances,
      address,
      emergencyContact: emergency_contact || emergencyContact,
      bankAccount: bank_account || bankAccount,
      taxId: tax_id || taxId,
      designation,
      employmentStatus: employment_status || employmentStatus,
      confirmationDate: confirmation_date || confirmationDate,
      accountTitleName: account_title_name || accountTitleName,
      bankName: bank_name || bankName,
      cnicIssueDate: cnic_issue_date || cnicIssueDate,
      cnicExpiryDate: cnic_expiry_date || cnicExpiryDate,
      dob: req.body.dob || null,
      requestPasswordChange:
        request_password_change !== undefined
          ? request_password_change
          : requestPasswordChange,
      laptop,
      laptopSerial: laptop_serial || laptopSerial,
      charger,
      chargerSerial: charger_serial || chargerSerial,
      mouse,
      mouseSerial: mouse_serial || mouseSerial,
      mobile,
      mobileSerial: mobile_serial || mobileSerial,
      keyboard,
      keyboardSerial: keyboard_serial || keyboardSerial,
      monitor,
      monitorSerial: monitor_serial || monitorSerial,
      dynamicResources: dynamic_resources || dynamicResources,
      resourcesNote: resources_note || resourcesNote,
    };

    const {
      joinDate: finalJoinDate,
      employmentStatus: finalEmploymentStatus,
      confirmationDate: finalConfirmationDate,
      accountTitleName: finalAccountTitleName,
      bankName: finalBankName,
      cnicIssueDate: finalCnicIssueDate,
      cnicExpiryDate: finalCnicExpiryDate,
      emergencyContact: finalEmergencyContact,
      bankAccount: finalBankAccount,
      taxId: finalTaxId,
    } = normalizedData;

    // Normalize CNIC month-year (YYYY-MM) to full date YYYY-MM-01 for storage
    const normalizeMonthYearToDate = (val) => {
      if (!val) return null;
      // Accept YYYY-MM or YYYY-MM-DD
      if (/^\d{4}-\d{2}$/.test(val)) {
        const [y, m] = val.split("-");
        const mm = Number(m);
        if (mm >= 1 && mm <= 12) return `${y}-${m}-01`;
        return null;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      return null;
    };

    const normalizedCnicIssueDate =
      normalizeMonthYearToDate(finalCnicIssueDate);
    const normalizedCnicExpiryDate =
      normalizeMonthYearToDate(finalCnicExpiryDate);

    if (finalCnicIssueDate && !normalizedCnicIssueDate) {
      return res.status(400).json({
        success: false,
        message:
          "CNIC issue date format invalid. Use month and year (YYYY-MM) or full date YYYY-MM-DD",
      });
    }
    if (finalCnicExpiryDate && !normalizedCnicExpiryDate) {
      return res.status(400).json({
        success: false,
        message:
          "CNIC expiry date format invalid. Use month and year (YYYY-MM) or full date YYYY-MM-DD",
      });
    }

    // Ensure expiry is same or after issue month
    if (normalizedCnicIssueDate && normalizedCnicExpiryDate) {
      if (
        new Date(normalizedCnicExpiryDate) < new Date(normalizedCnicIssueDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "CNIC expiry must be same or after issue month",
        });
      }
    }

    // Validation
    // Email must be @digioussolutions.com
    if (
      !normalizedData.email ||
      !normalizedData.email.endsWith("@digioussolutions.com")
    ) {
      return res.status(400).json({
        success: false,
        message: "Email must be @digioussolutions.com domain",
        received: { email: normalizedData.email },
      });
    }

    if (
      !normalizedData.employeeId ||
      !normalizedData.name ||
      !normalizedData.email ||
      !normalizedData.password ||
      !normalizedData.phone ||
      !normalizedData.department ||
      !normalizedData.sub_department ||
      !normalizedData.joinDate ||
      !normalizedData.baseSalary ||
      !finalEmploymentStatus ||
      !finalConfirmationDate ||
      !finalAccountTitleName ||
      !finalBankName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields. Required: employeeId, name, email, password, phone, department, sub_department, joinDate, baseSalary, employment_status, confirmation_date, account_title_name, bank_name",
        received: {
          employeeId: normalizedData.employeeId,
          name: normalizedData.name,
          email: normalizedData.email,
          password: normalizedData.password ? "***" : "missing",
          phone: normalizedData.phone,
          department: normalizedData.department,
          sub_department: normalizedData.sub_department,
          joinDate: normalizedData.joinDate,
          baseSalary: normalizedData.baseSalary,
          employmentStatus: finalEmploymentStatus,
          confirmationDate: finalConfirmationDate,
          accountTitleName: finalAccountTitleName,
          bankName: finalBankName,
        },
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Hash password
      const hashedPassword = await bcrypt.hash(normalizedData.password, 10);

      // Handle profile photo upload to Cloudinary if provided
      let profilePhotoUrl = null;
      const providedProfilePhoto = profile_photo || profile_picture;
      
      if (providedProfilePhoto && providedProfilePhoto.startsWith("data:image")) {
        try {
          console.log("🖼️ Uploading profile photo to Cloudinary...");
          const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
              providedProfilePhoto,
              {
                folder: `employee_profiles/${normalizedData.employeeId}`,
                public_id: `profile_photo_${Date.now()}`,
                resource_type: 'auto',
                quality: 'auto:good',
                fetch_format: 'auto',
                transformation: [
                  { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                  { quality: 'auto:good', fetch_format: 'auto' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
          });
          profilePhotoUrl = uploadResult.secure_url;
          console.log("✅ Profile photo uploaded successfully:", profilePhotoUrl);
        } catch (uploadError) {
          console.error("❌ Profile photo upload failed:", uploadError);
          // Don't fail the employee creation if photo upload fails
        }
      }

      // Insert employee onboarding record
      const [employeeResult] = await connection.query(
        `INSERT INTO employee_onboarding 
        (employee_id, name, email, password_temp, phone, cnic, department, sub_department, join_date, confirmation_date, address, emergency_contact, request_password_change, account_title_name, bank_name, bank_account, tax_id, designation, employment_status, cnic_issue_date, cnic_expiry_date, dob, profile_photo, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          normalizedData.employeeId,
          normalizedData.name,
          normalizedData.email,
          hashedPassword,
          normalizedData.phone,
          normalizedData.cnic || null,
          normalizedData.department,
          normalizedData.sub_department,
          normalizedData.joinDate,
          finalConfirmationDate,
          normalizedData.address || null,
          finalEmergencyContact || null,
          normalizedData.requestPasswordChange ? 1 : 0,
          finalAccountTitleName,
          finalBankName,
          finalBankAccount || null,
          finalTaxId || null,
          normalizedData.designation || null,
          finalEmploymentStatus,
          normalizedCnicIssueDate || null,
          normalizedCnicExpiryDate || null,
          normalizedData.dob || null,
          profilePhotoUrl,
          "Active",
        ],
      );

      const newEmployeeId = employeeResult.insertId;

      // Insert bank account details
      if (finalAccountTitleName && finalBankName) {
        // Generate account number if not provided (use employee_id + timestamp)
        const generatedAccountNumber =
          `${normalizedData.employeeId}-${Date.now()}`.substring(0, 50);
        await connection.query(
          `INSERT INTO employee_bank_accounts (employee_id, account_number, account_title_name, bank_name, is_primary) VALUES (?, ?, ?, ?, 1)`,
          [
            newEmployeeId,
            generatedAccountNumber,
            finalAccountTitleName,
            finalBankName,
          ],
        );
      }

      // Insert salary record
      const totalSalary =
        normalizedData.baseSalary +
        (normalizedData.allowances?.reduce((sum, a) => sum + a.amount, 0) || 0);
      await connection.query(
        `INSERT INTO employee_salary (employee_id, base_salary, total_salary) VALUES (?, ?, ?)`,
        [newEmployeeId, normalizedData.baseSalary, totalSalary],
      );

      // Insert allowances
      if (normalizedData.allowances && normalizedData.allowances.length > 0) {
        for (const allowance of normalizedData.allowances) {
          await connection.query(
            `INSERT INTO employee_allowances (employee_id, allowance_name, allowance_amount, currency) VALUES (?, ?, ?, ?)`,
            [newEmployeeId, allowance.name, allowance.amount, "PKR"],
          );
        }
      }

      // Insert resources
      await connection.query(
        `INSERT INTO employee_resources 
        (employee_id, laptop, laptop_serial, charger, charger_serial, mouse, mouse_serial, mobile, mobile_serial, keyboard, keyboard_serial, monitor, monitor_serial, resources_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newEmployeeId,
          normalizedData.laptop || false,
          normalizedData.laptopSerial || null,
          normalizedData.charger || false,
          normalizedData.chargerSerial || null,
          normalizedData.mouse || false,
          normalizedData.mouseSerial || null,
          normalizedData.mobile || false,
          normalizedData.mobileSerial || null,
          normalizedData.keyboard || false,
          normalizedData.keyboardSerial || null,
          normalizedData.monitor || false,
          normalizedData.monitorSerial || null,
          normalizedData.resourcesNote || null,
        ],
      );

      // Insert dynamic resources
      if (
        normalizedData.dynamicResources &&
        normalizedData.dynamicResources.length > 0
      ) {
        console.log(
          "📦 Inserting dynamic resources:",
          normalizedData.dynamicResources,
        );
        for (const resource of normalizedData.dynamicResources) {
          const insertResult = await connection.query(
            `INSERT INTO employee_dynamic_resources (employee_id, resource_name, resource_serial) VALUES (?, ?, ?)`,
            [newEmployeeId, resource.name, resource.serial || null],
          );
          console.log("✅ Dynamic resource inserted:", insertResult);
        }
      }

      // Initialize onboarding progress
      await connection.query(
        `INSERT INTO onboarding_progress 
        (employee_id, step_1_basic_info, step_2_security_setup, step_3_job_details, step_4_allowances, step_5_additional_info, step_6_review_confirm, is_completed, overall_completion_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newEmployeeId, 1, 1, 1, 1, 1, 1, 1, 100],
      );

      // Fetch created dynamic resources to return
      const [createdDynamicResources] = await connection.query(
        `SELECT id, resource_name as name, resource_serial as serial FROM employee_dynamic_resources WHERE employee_id = ?`,
        [newEmployeeId],
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Employee onboarded successfully",
        data: {
          id: newEmployeeId,
          employeeId: normalizedData.employeeId,
          name: normalizedData.name,
          email: normalizedData.email,
          department: normalizedData.department,
          sub_department: normalizedData.sub_department,
          employment_status: finalEmploymentStatus,
          confirmation_date: finalConfirmationDate,
          account_title_name: finalAccountTitleName,
          bank_name: finalBankName,
          status: "Active",
          dynamicResourcesCreated: createdDynamicResources,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Error creating employee:", error);
    console.error("Error Stack:", error.stack);
    console.error("Error Code:", error.code);
    console.error("Error SQL:", error.sql);
    res.status(500).json({
      success: false,
      message: "Error creating employee",
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === "development" ? error.sql : undefined,
    });
  }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const [employees] = await pool.query(`
  SELECT 
    eo.id,
    eo.name,
    eo.email,
    eo.phone,
    eo.department,
    eo.sub_department,
    eo.designation,
    eo.employment_status,
    eo.join_date,
    eo.status,
    eo.created_at

  FROM employee_onboarding eo

  ORDER BY eo.created_at DESC
`);

    res.status(200).json({
      success: true,
      data: employees,
      total: employees.length,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employees",
      error: error.message,
    });
  }
};

// Get single employee with all details
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
      // Get basic employee info
      const [employees] = await connection.query(
        `SELECT eo.*, es.base_salary, es.total_salary 
         FROM employee_onboarding eo
         LEFT JOIN employee_salary es ON eo.id = es.employee_id
         WHERE eo.id = ?`,
        [id],
      );

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const employee = employees[0];

      // CNIC/DOB are stored on employee_onboarding (single source of truth)
      // Compute CNIC document status based on cnic_expiry_date
      let docStatus = null;
      if (!employee.cnic_expiry_date) docStatus = 'Invalid';
      else {
        const expiry = new Date(employee.cnic_expiry_date);
        if (isNaN(expiry.getTime())) docStatus = null;
        else if (expiry < new Date()) docStatus = 'Expired';
        else docStatus = 'Valid';
      }
      employee.cnic_document_status = docStatus;

      // Get allowances (optional)
      let allowances = [];
      try {
        const [aRows] = await connection.query(
          `SELECT allowance_name as name, allowance_amount as amount 
           FROM employee_allowances 
           WHERE employee_id = ?`,
          [id],
        );
        allowances = aRows;
      } catch (err) {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
          console.warn('employee_allowances table missing, continuing without it');
          allowances = [];
        } else {
          throw err;
        }
      }

      // Get resources (optional)
      let resources = [];
      try {
        const [rRows] = await connection.query(
          `SELECT * FROM employee_resources WHERE employee_id = ?`,
          [id],
        );
        resources = rRows;
      } catch (err) {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
          console.warn('employee_resources table missing, continuing without it');
          resources = [];
        } else {
          throw err;
        }
      }

      // Get dynamic resources (optional)
      let dynamicResources = [];
      try {
        const [dRows] = await connection.query(
          `SELECT id, resource_name as name, resource_serial as serial 
           FROM employee_dynamic_resources 
           WHERE employee_id = ?`,
          [id],
        );
        dynamicResources = dRows;
      } catch (err) {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
          console.warn('employee_dynamic_resources table missing, continuing without it');
          dynamicResources = [];
        } else {
          throw err;
        }
      }

      // Get onboarding progress (optional)
      let progress = [];
      try {
        const [pRows] = await connection.query(
          `SELECT * FROM onboarding_progress WHERE employee_id = ?`,
          [id],
        );
        progress = pRows;
      } catch (err) {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
          console.warn('onboarding_progress table missing, continuing without it');
          progress = [];
        } else {
          throw err;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          ...employee,
          allowances,
          resources: resources[0] || {},
          dynamicResources,
          onboardingProgress: progress[0] || {},
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee",
      error: error.message,
    });
  }
};

exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const {
    salary,
    allowances,
    dynamic_resources,
    profile_picture,
    ...employeeFields
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /* 0. Handle Profile Picture Upload (if provided as base64/data URL) */

    let profilePictureUrl = null;

    if (profile_picture && profile_picture.startsWith("data:image")) {
      try {
        console.log("Uploading profile picture to Cloudinary...");

        // Upload base64 image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            profile_picture,
            {
              folder: "employee_profiles",
              public_id: `employee_${id}_profile_${Date.now()}`,
              overwrite: true,
              transformation: [
                { width: 500, height: 500, crop: "fill" },
                { quality: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
        });

        profilePictureUrl = uploadResult.secure_url;
        console.log(
          "Profile picture uploaded successfully:",
          profilePictureUrl,
        );

        // ✅ Add to employeeFields for database update
        employeeFields.profile_picture = profilePictureUrl;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        // Don't fail the entire update if image upload fails
      }
    }

    /* 1. Update employee_onboarding */

    // ✅ Include profile_picture in allowed fields
    const allowedFields = [
      "name",
      "email",
      "phone",
      "cnic",
      "department",
      "sub_department",
      "address",
      "emergency_contact",
      "account_title_name",
      "bank_name",
      "bank_account",
      "tax_id",
      "status",
      "designation",
      "employment_status",
      "confirmation_date",
      "cnic_issue_date",
      "cnic_expiry_date",
      "dob",
      "profile_picture",
    ];

    const updateFields = [];
    const updateValues = [];

    const normalizeToDate = (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val !== 'string') return val;
      // Already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      // ISO timestamp or other formats - extract YYYY-MM-DD if possible
      const m = val.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
      // Fallback to Date parse (use UTC components)
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${mm}-${dd}`;
      }
      return val;
    };

    for (const key of allowedFields) {
      if (employeeFields[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        let value = employeeFields[key];
        // Normalize date-like fields to YYYY-MM-DD for MySQL DATE columns
        if (key.includes('date') || key === 'dob' || key === 'join_date' || key === 'confirmation_date') {
          value = normalizeToDate(value);
        }
        updateValues.push(value);
      }
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      const updateQuery = `UPDATE employee_onboarding SET ${updateFields.join(", ")} WHERE id = ?`;
      console.log("Update Query:", updateQuery);
      console.log("Update Values:", updateValues);

      await connection.query(updateQuery, updateValues);
    }

    /* 2. Update salary */
    if (salary) {
      await connection.query(
        `
        UPDATE employee_salary 
        SET base_salary = ?, total_salary = ?
        WHERE employee_id = ?
        `,
        [salary.base_salary, salary.total_salary, id],
      );
    }

    /* 3. Update allowances (UPSERT LOGIC) */

    if (Array.isArray(allowances)) {
      // Get existing allowances
      const [existingAllowances] = await connection.query(
        `SELECT id, allowance_name FROM employee_allowances WHERE employee_id = ?`,
        [id],
      );

      // Create maps for comparison
      const existingMap = new Map();
      existingAllowances.forEach((item) => {
        existingMap.set(item.allowance_name, item.id);
      });

      const incomingMap = new Map();
      allowances.forEach((item) => {
        incomingMap.set(item.allowance_name, item);
      });

      // 1. DELETE removed allowances

      for (const [name, dbId] of existingMap) {
        if (!incomingMap.has(name)) {
          await connection.query(
            `DELETE FROM employee_allowances WHERE id = ?`,
            [dbId],
          );
          console.log(`Deleted allowance: ${name}`);
        }
      }

      // 2. UPSERT (UPDATE or INSERT) allowances

      for (const allowance of allowances) {
        const existingId = existingMap.get(allowance.allowance_name);

        if (existingId) {
          // UPDATE existing
          await connection.query(
            `
            UPDATE employee_allowances 
            SET allowance_amount = ?
            WHERE id = ?
            `,
            [allowance.allowance_amount, existingId],
          );
          console.log(`Updated allowance: ${allowance.allowance_name}`);
        } else {
          // INSERT new
          await connection.query(
            `
            INSERT INTO employee_allowances 
            (employee_id, allowance_name, allowance_amount)
            VALUES (?, ?, ?)
            `,
            [id, allowance.allowance_name, allowance.allowance_amount],
          );
          console.log(`Added new allowance: ${allowance.allowance_name}`);
        }
      }
    }

    /* 4. Update dynamic resources */

    if (Array.isArray(dynamic_resources)) {
      // For dynamic resources, we can do simple delete+insert
      await connection.query(
        `DELETE FROM employee_dynamic_resources WHERE employee_id = ?`,
        [id],
      );

      for (const resource of dynamic_resources) {
        await connection.query(
          `
          INSERT INTO employee_dynamic_resources
          (employee_id, resource_name, resource_serial)
          VALUES (?, ?, ?)
          `,
          [id, resource.resource_name, resource.resource_serial],
        );
      }
    }

    await connection.commit();

    // ✅ Get updated employee data to return
    const [updatedEmployee] = await connection.query(
      `SELECT * FROM employee_onboarding WHERE id = ?`,
      [id],
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      profile_picture_url: profilePictureUrl, // Return the URL
      employee: updatedEmployee[0], // Return updated employee data
      details: {
        allowancesUpdated: allowances ? allowances.length : 0,
        dynamicResourcesUpdated: dynamic_resources
          ? dynamic_resources.length
          : 0,
        profilePictureUpdated: !!profilePictureUrl,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating employee:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating employee",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Delete related records (foreign keys will handle via CASCADE)
      await connection.query(`DELETE FROM employee_onboarding WHERE id = ?`, [
        id,
      ]);

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting employee",
      error: error.message,
    });
  }
};

// Get onboarding progress
exports.getOnboardingProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const [progress] = await pool.query(
      `SELECT * FROM onboarding_progress WHERE employee_id = ?`,
      [id],
    );

    if (progress.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Onboarding progress not found",
      });
    }

    res.status(200).json({
      success: true,
      data: progress[0],
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress",
      error: error.message,
    });
  }
};

// Check if employee ID is available
exports.checkEmployeeIdAvailability = async (req, res) => {
  try {
    const { numericId } = req.params;
    const EMPLOYEE_ID_PREFIX = "DG";

    // Validate numeric ID
    // Must be at least 3 digits and not "000"
    if (!numericId || !/^\d+$/.test(numericId)) {
      return res.status(400).json({
        success: false,
        message: "Employee ID must contain only numeric digits",
        exists: false,
      });
    }

    // Validate it's at least 3 digits
    if (numericId.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Employee ID must have at least 3 digits",
        exists: false,
      });
    }

    // Validate "000" is not allowed
    if (numericId === "000" || parseInt(numericId) === 0) {
      return res.status(400).json({
        success: false,
        message: "000 is not a valid Employee ID",
        exists: false,
      });
    }

    // Keep the ID as-is without padding for exact match checking
    const fullEmployeeId = `${EMPLOYEE_ID_PREFIX}-${numericId}`;

    // Check if EXACT ID exists in database (case-insensitive) - use the exact user input
    const [result] = await pool.query(
      `SELECT employee_id FROM employee_onboarding WHERE UPPER(employee_id) = UPPER(?)`,
      [fullEmployeeId],
    );

    const exists = result.length > 0;

    if (!exists) {
      // ID is available
      return res.status(200).json({
        success: true,
        message: "Employee ID is available",
        exists: false,
        employeeId: fullEmployeeId,
      });
    }

    // ID exists, suggest next available ID
    // Get all employee IDs with the configured prefix (case-insensitive)
    const [allIds] = await pool.query(
      `SELECT employee_id FROM employee_onboarding 
       WHERE UPPER(employee_id) LIKE UPPER(?)
       ORDER BY CAST(SUBSTRING_INDEX(employee_id, '-', -1) AS UNSIGNED) ASC`,
      [`${EMPLOYEE_ID_PREFIX}-%`],
    );

    // Extract numeric parts and find next available
    const usedNumbers = allIds
      .map((row) => {
        const numPart = row.employee_id.split("-")[1];
        return parseInt(numPart);
      })
      .filter((n) => !isNaN(n) && n !== 0);

    // Find next available number
    let nextNumber = 1;
    for (let num of usedNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }

    const suggestedId = `${EMPLOYEE_ID_PREFIX}-${nextNumber}`;

    return res.status(200).json({
      success: false,
      message: "Employee ID already exists",
      exists: true,
      employeeId: fullEmployeeId,
      suggestedId: suggestedId,
    });
  } catch (error) {
    console.error("Error checking employee ID:", error);
    res.status(500).json({
      success: false,
      message: "Error checking employee ID availability",
      error: error.message,
      exists: false,
    });
  }
};
