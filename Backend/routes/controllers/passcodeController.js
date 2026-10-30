const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const pool = require("../../config/database");

// Helper function to add audit log for admin
const addAdminAuditLog = async (
  adminId,
  action,
  status,
  ipAddress,
  userAgent,
) => {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log_passcode (admin_id, action, status, ip_address, user_agent, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [adminId, action, status, ipAddress, userAgent],
    );
  } catch (error) {
    console.error("Error adding admin audit log:", error);
    // Don't throw error
  }
};

// // Helper function to get user info - FIXED to use employee_id column only
// const getUserInfo = async (userId) => {
//   console.log("🔍 Getting user info for userId:", userId);

//   // First check in admin_users
//   const [adminCheck] = await pool.query(
//     "SELECT id, email FROM admin_users WHERE id = ?",
//     [userId],
//   );

//   if (adminCheck.length > 0) {
//     console.log("✅ Found admin:", adminCheck[0]);
//     return { id: adminCheck[0].id, type: "admin", email: adminCheck[0].email };
//   }

//   // ✅ FIX: Only check employee_id column, NOT the auto-generated id column
//   const [employeeCheck] = await pool.query(
//     "SELECT employee_id as id, email, name FROM user_as_employees WHERE employee_id = ?",
//     [userId],
//   );

//   if (employeeCheck.length > 0) {
//     console.log("✅ Found employee with employee_id:", employeeCheck[0].id);
//     return {
//       id: employeeCheck[0].id,
//       type: "employee",
//       email: employeeCheck[0].email,
//     };
//   }

//   console.log("❌ User not found in both tables");
//   return null;
// };

// Helper function to get user info - USING employee_id COLUMN
const getUserInfo = async (userId) => {
  console.log("🔍 Getting user info for userId:", userId);

  // First check in admin_users
  const [adminCheck] = await pool.query(
    "SELECT id, email FROM admin_users WHERE id = ?",
    [userId],
  );

  if (adminCheck.length > 0) {
    console.log("✅ Found admin:", adminCheck[0]);
    return { id: adminCheck[0].id, type: "admin", email: adminCheck[0].email };
  }

  // IMPORTANT: Use employee_id column, NOT the auto-generated id
  const [employeeCheck] = await pool.query(
    "SELECT employee_id as id, email, name FROM user_as_employees WHERE employee_id = ?",
    [userId],
  );

  if (employeeCheck.length > 0) {
    console.log("✅ Found employee with employee_id:", employeeCheck[0].id);
    console.log("Employee email:", employeeCheck[0].email);
    return {
      id: employeeCheck[0].id, // This will be 44, NOT 37
      type: "employee",
      email: employeeCheck[0].email,
    };
  }

  console.log("❌ User not found");
  return null;
};

// Get passcode status
exports.getPasscodeStatus = async (req, res) => {
  try {
    const employeeId = req.user.employeeId; // ✅ Use employeeId, not userId
    const isAdmin =
      req.user.role === "admin" ||
      req.user.email === "shameel@digioussolutions.com";

    console.log("🔍 Employee ID from token:", employeeId);
    console.log("Is Admin:", isAdmin);

    if (isAdmin) {
      const [rows] = await pool.query(
        "SELECT id FROM user_passcodes WHERE admin_id = ?",
        [req.user.userId],
      );
      return res.json({
        success: true,
        data: {
          hasPasscode: rows.length > 0,
          isActive: true,
          isAdmin: true,
          userType: "admin",
        },
      });
    }

    // Employee check - direct employee_id se
    const [rows] = await pool.query(
      "SELECT id FROM user_passcodes WHERE employee_id = ?",
      [employeeId], // ✅ 44 use hoga
    );

    const hasPasscode = rows.length > 0;
    console.log("Employee ID:", employeeId, "hasPasscode:", hasPasscode);

    res.json({
      success: true,
      data: {
        hasPasscode: hasPasscode,
        isActive: true,
        isAdmin: false,
        userType: "employee",
      },
    });
  } catch (error) {
    console.error("Error getting passcode status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Set initial passcode (Only for employees) - WITH SAFE AUDIT LOG
exports.setPasscode = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const employeeId = req.user.employeeId;
    const { passcode } = req.body;

    console.log("=========================================");
    console.log("📝 SET PASSCODE REQUEST");
    console.log("Employee ID from token:", employeeId);
    console.log("=========================================");

    // Validation
    if (!passcode) {
      return res.status(400).json({
        success: false,
        message: "Passcode is required",
      });
    }

    if (passcode.length < 4 || passcode.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Passcode must be 4-10 characters",
      });
    }

    await connection.beginTransaction();

    // Check if passcode already exists
    const [existing] = await connection.query(
      "SELECT id FROM user_passcodes WHERE employee_id = ?",
      [employeeId],
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Passcode already set. Use reset option.",
      });
    }

    // Hash passcode
    const salt = await bcrypt.genSalt(10);
    const passcodeHash = await bcrypt.hash(passcode, salt);

    // Insert using employee_id
    await connection.query(
      `INSERT INTO user_passcodes (employee_id, passcode_hash, favorite_movie, created_at) 
       VALUES (?, ?, ?, NOW())`,
      [employeeId, passcodeHash, ""],
    );

    console.log("✅ Passcode inserted for employee_id:", employeeId);

    // ✅ Safe audit log - with try-catch
    try {
      if (typeof addEmployeeAuditLog === "function") {
        await addEmployeeAuditLog(
          employeeId,
          "SET",
          "SUCCESS",
          req.ip || null,
          req.headers["user-agent"] || null,
        );
      } else {
        console.log(
          "⚠️ addEmployeeAuditLog function not available, skipping audit log",
        );
      }
    } catch (auditError) {
      console.error("Audit log error (non-critical):", auditError.message);
      // Don't fail the main operation
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Passcode set successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error setting passcode:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  } finally {
    connection.release();
  }
};

// Verify passcode
exports.verifyPasscode = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const employeeId = req.user.employeeId; // ✅ Use employeeId
    const isAdmin =
      req.user.role === "admin" ||
      req.user.email === "shameel@digioussolutions.com";
    const { passcode, moduleName } = req.body;

    console.log("🔐 VERIFY PASSCODE REQUEST");
    console.log("Employee ID:", employeeId);
    console.log("Is Admin:", isAdmin);
    console.log("Module:", moduleName);

    if (!passcode) {
      return res.status(400).json({
        success: false,
        message: "Passcode is required",
      });
    }

    let passcodeData = null;

    if (isAdmin) {
      const [rows] = await connection.query(
        "SELECT id, passcode_hash, failed_attempts, locked_until FROM user_passcodes WHERE admin_id = ?",
        [req.user.userId],
      );
      passcodeData = rows[0];
    } else {
      const [rows] = await connection.query(
        "SELECT id, passcode_hash, failed_attempts, locked_until FROM user_passcodes WHERE employee_id = ?",
        [employeeId],
      );
      passcodeData = rows[0];
    }

    if (!passcodeData) {
      return res.status(404).json({
        success: false,
        message: isAdmin
          ? "Admin passcode not initialized"
          : "Passcode not set. Please set your passcode first.",
      });
    }

    // Check if account is locked
    if (
      passcodeData.locked_until &&
      new Date(passcodeData.locked_until) > new Date()
    ) {
      return res.status(423).json({
        success: false,
        message: "Account locked. Try again later.",
        lockedUntil: passcodeData.locked_until,
      });
    }

    // Verify passcode
    const isValid = await bcrypt.compare(passcode, passcodeData.passcode_hash);

    if (!isValid) {
      const newAttempts = (passcodeData.failed_attempts || 0) + 1;
      let lockedUntil = null;

      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      const updateQuery = isAdmin
        ? "UPDATE user_passcodes SET failed_attempts = ?, locked_until = ?, last_used_at = NOW() WHERE admin_id = ?"
        : "UPDATE user_passcodes SET failed_attempts = ?, locked_until = ?, last_used_at = NOW() WHERE employee_id = ?";

      const updateId = isAdmin ? req.user.userId : employeeId;
      await connection.query(updateQuery, [newAttempts, lockedUntil, updateId]);

      const remainingAttempts = 5 - newAttempts;
      return res.status(401).json({
        success: false,
        message: `Invalid passcode. ${remainingAttempts} attempts remaining.`,
        remainingAttempts,
      });
    }

    // Success - Reset failed attempts
    const updateQuery = isAdmin
      ? "UPDATE user_passcodes SET failed_attempts = 0, locked_until = NULL, last_used_at = NOW() WHERE admin_id = ?"
      : "UPDATE user_passcodes SET failed_attempts = 0, locked_until = NULL, last_used_at = NOW() WHERE employee_id = ?";

    const updateId = isAdmin ? req.user.userId : employeeId;
    await connection.query(updateQuery, [updateId]);

    // Generate session token
    const sessionToken = Buffer.from(
      `${updateId}:${isAdmin ? "admin" : "employee"}:${moduleName}:${Date.now()}`,
    ).toString("base64");

    const responseMessage = isAdmin
      ? "✅ Admin verified!"
      : "Passcode verified successfully";

    res.json({
      success: true,
      message: responseMessage,
      data: {
        sessionToken,
        isAdmin,
        userType: isAdmin ? "admin" : "employee",
      },
    });
  } catch (error) {
    console.error("Error verifying passcode:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  } finally {
    connection.release();
  }
};

const getPasscodeResetIdentity = async (user) => {
  const isAdmin =
    user.role === "admin" || user.email === "shameel@digioussolutions.com";

  if (isAdmin) {
    const [users] = await pool.query(
      "SELECT id, email, full_name AS name FROM admin_users WHERE id = ?",
      [user.userId],
    );
    if (!users.length) return null;

    const [passcodes] = await pool.query(
      "SELECT id FROM user_passcodes WHERE admin_id = ?",
      [users[0].id],
    );
    return passcodes.length
      ? { ...users[0], passcodeId: passcodes[0].id, isAdmin: true }
      : null;
  }

  const [users] = await pool.query(
    "SELECT employee_id AS id, email, name FROM user_as_employees WHERE employee_id = ?",
    [user.employeeId],
  );
  if (!users.length) return null;

  const [passcodes] = await pool.query(
    "SELECT id FROM user_passcodes WHERE employee_id = ?",
    [users[0].id],
  );
  return passcodes.length
    ? { ...users[0], passcodeId: passcodes[0].id, isAdmin: false }
    : null;
};

const maskEmail = (email) => {
  const [localPart, domain] = email.split("@");
  return `${localPart.slice(0, 1)}***@${domain}`;
};

exports.sendPasscodeResetOtp = async (req, res) => {
  try {
    const identity = await getPasscodeResetIdentity(req.user);
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: "Passcode or registered account was not found",
      });
    }
    if (!identity.email) {
      return res.status(400).json({
        success: false,
        message: "No registered email is available for this account",
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) {
      return res.status(400).json({
        success: false,
        message: "The registered email address is invalid. Please contact your administrator.",
      });
    }

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.error("Passcode reset email is not configured");
      return res.status(503).json({
        success: false,
        message: "Email delivery is unavailable. Please contact your administrator.",
      });
    }

    const [otpRows] = await pool.query(
      `SELECT TIMESTAMPDIFF(SECOND, last_sent_at, NOW()) AS seconds_since_last_sent
       FROM passcode_reset_otps
       WHERE passcode_id = ?`,
      [identity.passcodeId],
    );
    if (
      otpRows.length &&
      Number(otpRows[0].seconds_since_last_sent) < 60
    ) {
      const retryAfter = 60 - Number(otpRows[0].seconds_since_last_sent);
      return res.status(429).json({
        success: false,
        message: `Please wait ${retryAfter} seconds before requesting another code`,
        retryAfter,
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO passcode_reset_otps
         (passcode_id, otp_hash, expires_at, last_sent_at, attempts)
       VALUES (?, ?, ?, NOW(), 0)
       ON DUPLICATE KEY UPDATE
         otp_hash = VALUES(otp_hash),
         expires_at = VALUES(expires_at),
         last_sent_at = NOW(),
         attempts = 0`,
      [identity.passcodeId, otpHash, expiresAt],
    );

    const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: smtpPort,
      secure: process.env.SMTP_SECURE === "true",
      dnsTimeout: 5000,
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 7000,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || "Digious CRM"}" <${process.env.SMTP_EMAIL}>`,
        to: identity.email,
        subject: "Passcode Reset Verification Code - Digious CRM",
        text: `Hello ${identity.name || "there"},\n\nYour passcode reset verification code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      });
    } catch (error) {
      await pool.query(
        "DELETE FROM passcode_reset_otps WHERE passcode_id = ?",
        [identity.passcodeId],
      );
      console.error("Passcode reset email delivery failed:", {
        code: error.code,
        command: error.command,
        message: error.message,
      });
      if (!res.headersSent) {
        return res.status(503).json({
          success: false,
          message: "Could not connect to the email service. Please try again later.",
        });
      }
      return;
    }

    res.json({
      success: true,
      message: "Verification code sent to your registered email",
      data: { email: maskEmail(identity.email), expiresIn: 600 },
    });
  } catch (error) {
    console.error("Error sending passcode reset code:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Could not send verification code. Please try again later.",
      });
    }
  }
};

exports.resetPasscode = async (req, res) => {
  const { otp, newPasscode } = req.body;
  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "Enter the 6-digit verification code",
    });
  }
  if (
    typeof newPasscode !== "string" ||
    newPasscode.length < 4 ||
    newPasscode.length > 10
  ) {
    return res.status(400).json({
      success: false,
      message: "Passcode must be 4-10 characters",
    });
  }

  let connection;
  let transactionStarted = false;
  try {
    const identity = await getPasscodeResetIdentity(req.user);
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: "Passcode or registered account was not found",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const [otpRows] = await connection.query(
      `SELECT id, otp_hash, expires_at, attempts,
              expires_at > NOW() AS is_valid
       FROM passcode_reset_otps
       WHERE passcode_id = ?
       FOR UPDATE`,
      [identity.passcodeId],
    );
    if (!otpRows.length) {
      await connection.commit();
      transactionStarted = false;
      return res.status(400).json({
        success: false,
        message: "Request a new verification code to continue",
      });
    }

    const resetOtp = otpRows[0];
    if (!resetOtp.is_valid) {
      await connection.query(
        "DELETE FROM passcode_reset_otps WHERE id = ?",
        [resetOtp.id],
      );
      await connection.commit();
      transactionStarted = false;
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Request a new code.",
      });
    }
    if (Number(resetOtp.attempts) >= 5) {
      await connection.commit();
      transactionStarted = false;
      return res.status(429).json({
        success: false,
        message: "Too many incorrect codes. Request a new verification code.",
      });
    }

    if (!(await bcrypt.compare(otp, resetOtp.otp_hash))) {
      await connection.query(
        "UPDATE passcode_reset_otps SET attempts = attempts + 1 WHERE id = ?",
        [resetOtp.id],
      );
      await connection.commit();
      transactionStarted = false;
      return res.status(400).json({
        success: false,
        message: "Verification code is incorrect",
        remainingAttempts: Math.max(0, 4 - Number(resetOtp.attempts)),
      });
    }

    const passcodeHash = await bcrypt.hash(newPasscode, 10);
    await connection.query(
      `UPDATE user_passcodes
       SET passcode_hash = ?, failed_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = ?`,
      [passcodeHash, identity.passcodeId],
    );
    await connection.query(
      "DELETE FROM passcode_reset_otps WHERE id = ?",
      [resetOtp.id],
    );
    await connection.commit();
    transactionStarted = false;

    res.json({
      success: true,
      message: "Passcode reset successfully",
    });
  } catch (error) {
    if (connection && transactionStarted) await connection.rollback();
    console.error("Error resetting passcode:", error);
    res.status(500).json({
      success: false,
      message: "Could not reset passcode. Please try again later.",
    });
  } finally {
    if (connection) connection.release();
  }
};

// Lock module
exports.lockModule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { moduleName } = req.body;
    const userInfo = await getUserInfo(userId);

    if (userInfo?.type === "admin") {
      await addAdminAuditLog(
        userInfo.id,
        "LOCK_MODULE",
        "SUCCESS",
        req.ip || null,
        req.headers["user-agent"] || null,
      );
    } else if (userInfo?.type === "employee") {
      await addEmployeeAuditLog(
        userInfo.id,
        "LOCK_MODULE",
        "SUCCESS",
        req.ip || null,
        req.headers["user-agent"] || null,
      );
    }

    res.json({ success: true, message: "Module locked" });
  } catch (error) {
    console.error("Error locking module:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get module status
exports.getModuleStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { moduleName } = req.params;
    const userInfo = await getUserInfo(userId);

    if (!userInfo) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const isAdmin = userInfo.type === "admin";
    let hasPasscode = false;

    if (isAdmin) {
      const [rows] = await pool.query(
        "SELECT id, is_active FROM user_passcodes WHERE admin_id = ?",
        [userInfo.id],
      );
      hasPasscode = rows.length > 0;
    } else {
      const [rows] = await pool.query(
        "SELECT id, is_active FROM user_passcodes WHERE employee_id = ?",
        [userInfo.id],
      );
      hasPasscode = rows.length > 0;
    }

    res.json({
      success: true,
      data: {
        moduleName,
        hasPasscode,
        isActive: true,
        requiresPasscode: true,
        hasAccess: hasPasscode,
        userType: userInfo.type,
        message: hasPasscode
          ? "Module access requires passcode verification"
          : "Please set up your passcode first",
      },
    });
  } catch (error) {
    console.error("Error getting module status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
