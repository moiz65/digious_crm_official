const bcrypt = require("bcryptjs");
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
    const { passcode, favoriteMovie } = req.body;

    console.log("=========================================");
    console.log("📝 SET PASSCODE REQUEST");
    console.log("Employee ID from token:", employeeId);
    console.log("=========================================");

    // Validation
    if (!passcode || !favoriteMovie) {
      return res.status(400).json({
        success: false,
        message: "Passcode and favorite movie are required",
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
      [employeeId, passcodeHash, favoriteMovie],
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

// Reset passcode
// Reset passcode - FIXED for both Admin and Employee
exports.resetPasscode = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { favoriteMovie, newPasscode } = req.body;

    if (!favoriteMovie || !newPasscode) {
      return res.status(400).json({
        success: false,
        message: "Favorite movie and new passcode are required",
      });
    }

    // Check if user is admin
    const isAdmin = req.user.role === 'admin';
    const employeeId = req.user.employeeId;
    const userId = req.user.userId;

    console.log('🔍 Reset Passcode Request:');
    console.log('Is Admin:', isAdmin);
    console.log('Employee ID:', employeeId);
    console.log('User ID:', userId);

    let query = '';
    let params = [];
    let identifier = '';

    if (isAdmin) {
      // ✅ ADMIN: Use admin_id column
      query = "SELECT id, favorite_movie FROM user_passcodes WHERE admin_id = ?";
      params = [userId];
      identifier = `Admin ID: ${userId}`;
      console.log('🔍 Looking for admin passcode with admin_id:', userId);
    } else {
      // ✅ EMPLOYEE: Use employee_id column
      query = "SELECT id, favorite_movie FROM user_passcodes WHERE employee_id = ?";
      params = [employeeId];
      identifier = `Employee ID: ${employeeId}`;
      console.log('🔍 Looking for employee passcode with employee_id:', employeeId);
    }

    const [rows] = await connection.query(query, params);

    if (rows.length === 0) {
      console.log('❌ No passcode found for:', identifier);
      return res.status(404).json({
        success: false,
        message: isAdmin ? "Admin passcode not set." : "Passcode not set.",
      });
    }

    console.log('✅ Passcode found for:', identifier);
    console.log('📝 Stored favorite movie:', rows[0].favorite_movie);
    console.log('📝 Provided favorite movie:', favoriteMovie);

    // Verify favorite movie (case-insensitive)
    if (rows[0].favorite_movie.toLowerCase() !== favoriteMovie.toLowerCase()) {
      console.log('❌ Favorite movie does not match');
      return res.status(401).json({
        success: false,
        message: "Favorite movie does not match",
      });
    }

    console.log('✅ Favorite movie verified');

    // Hash new passcode
    const salt = await bcrypt.genSalt(10);
    const newPasscodeHash = await bcrypt.hash(newPasscode, salt);

    // Update based on user type
    let updateQuery = '';
    let updateParams = [];

    if (isAdmin) {
      updateQuery = `UPDATE user_passcodes 
                     SET passcode_hash = ?, failed_attempts = 0, locked_until = NULL, updated_at = NOW() 
                     WHERE admin_id = ?`;
      updateParams = [newPasscodeHash, userId];
    } else {
      updateQuery = `UPDATE user_passcodes 
                     SET passcode_hash = ?, failed_attempts = 0, locked_until = NULL, updated_at = NOW() 
                     WHERE employee_id = ?`;
      updateParams = [newPasscodeHash, employeeId];
    }

    await connection.query(updateQuery, updateParams);
    await connection.commit();

    console.log(`✅ Passcode reset successful for ${isAdmin ? 'Admin' : 'Employee'}:`, identifier);

    res.json({
      success: true,
      message: "Passcode reset successfully",
    });

  } catch (error) {
    await connection.rollback();
    console.error("❌ Error resetting passcode:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  } finally {
    connection.release();
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
