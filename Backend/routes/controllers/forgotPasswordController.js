/**
 * Forgot Password Controller
 * 
 * SMTP-based forgot password flow:
 * 1. POST /forgot-password        → send 6-digit OTP to email
 * 2. POST /verify-otp             → verify the 6-digit OTP code
 * 3. POST /reset-password          → reset password with new one (after OTP verified)
 */

const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────
// SMTP Transporter (configured from .env)
// ─────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE === 'true'), // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      // Allow self-signed / mismatched certs (shared hosting uses *.web-hosting.com cert)
      rejectUnauthorized: false,
    },
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─────────────────────────────────────────────────────────
// POST /forgot-password
// Send 6-digit OTP code to user's email
// ─────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  let connection;
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    connection = await pool.getConnection();

    // Check if email exists in employee_onboarding or admin_users
    const [employees] = await connection.query(
      `SELECT id, name, email, status FROM employee_onboarding WHERE email = ?`,
      [email]
    );

    const [admins] = await connection.query(
      `SELECT id, full_name AS name, email, status FROM admin_users WHERE email = ?`,
      [email]
    );

    const user = employees[0] || admins[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'This account is not active. Please contact administrator.'
      });
    }

    // Invalidate any existing unused OTPs for this email
    await connection.query(
      `UPDATE password_reset_tokens SET is_used = 1 WHERE email = ? AND is_used = 0`,
      [email]
    );

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in database
    await connection.query(
      `INSERT INTO password_reset_tokens (email, otp_code, expires_at) VALUES (?, ?, ?)`,
      [email, otpCode, expiresAt]
    );

    // Send email with OTP
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Digious CRM'}" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Password Reset - Digious CRM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #349dff;">
            <h1 style="color: #349dff; margin: 0;">Digious CRM</h1>
            <p style="color: #666; margin: 5px 0 0;">Password Reset Request</p>
          </div>
          
          <div style="padding: 30px 0;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #666; font-size: 14px;">
              We received a request to reset your password. Use the verification code below to proceed:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #349dff, #1e87e6); padding: 20px 40px; border-radius: 12px;">
                <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${otpCode}</span>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="color: #999; font-size: 12px;">
              If you didn't request this password reset, please ignore this email or contact your administrator.
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding: 20px 0; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} Digious Solutions. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ OTP sent to ${email} for password reset`);

    return res.json({
      success: true,
      message: 'Verification code sent to your email',
      data: {
        email: email,
        expires_in: '10 minutes'
      }
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    
    // Handle SMTP errors specifically
    if (error.code === 'EAUTH' || error.code === 'ESOCKET' || error.responseCode) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again later or contact administrator.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
};

// ─────────────────────────────────────────────────────────
// POST /verify-otp
// Verify the 6-digit OTP code
// ─────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  let connection;
  try {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    connection = await pool.getConnection();

    // Find the latest unused OTP for this email
    const [tokens] = await connection.query(
      `SELECT id, otp_code, expires_at, attempts 
       FROM password_reset_tokens 
       WHERE email = ? AND is_used = 0 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email]
    );

    if (!tokens.length) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found. Please request a new one.'
      });
    }

    const token = tokens[0];

    // Check if expired
    if (new Date() > new Date(token.expires_at)) {
      await connection.query(
        `UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?`,
        [token.id]
      );
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Check max attempts (5 max)
    if (token.attempts >= 5) {
      await connection.query(
        `UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?`,
        [token.id]
      );
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new verification code.'
      });
    }

    // Verify OTP
    if (token.otp_code !== otp_code.toString()) {
      // Increment attempts
      await connection.query(
        `UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?`,
        [token.id]
      );
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${4 - token.attempts} attempts remaining.`
      });
    }

    // OTP is valid - don't mark as used yet, we need it for reset-password step
    console.log(`✅ OTP verified for ${email}`);

    return res.json({
      success: true,
      message: 'Verification code is valid',
      data: {
        email,
        verified: true,
        token_id: token.id
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
};

// ─────────────────────────────────────────────────────────
// POST /reset-password
// Reset password after OTP verification
// ─────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  let connection;
  try {
    const { email, otp_code, new_password } = req.body;

    if (!email || !otp_code || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification code, and new password are required'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    connection = await pool.getConnection();

    // Verify OTP is still valid
    const [tokens] = await connection.query(
      `SELECT id, otp_code, expires_at 
       FROM password_reset_tokens 
       WHERE email = ? AND is_used = 0 AND otp_code = ?
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email, otp_code]
    );

    if (!tokens.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new one.'
      });
    }

    const token = tokens[0];

    if (new Date() > new Date(token.expires_at)) {
      await connection.query(
        `UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?`,
        [token.id]
      );
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password in user_as_employees (same approach as updatePassword in authController)
    const [userResult] = await connection.query(
      `UPDATE user_as_employees 
       SET password = ?, request_password_change = FALSE, updated_at = NOW()
       WHERE email = ? AND status = 'Active'`,
      [hashedPassword, email]
    );

    // Also try admin_users table
    if (userResult.affectedRows === 0) {
      const [adminResult] = await connection.query(
        `UPDATE admin_users SET password = ? WHERE email = ? AND status = 'Active'`,
        [hashedPassword, email]
      );
      
      if (adminResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active account found with this email'
        });
      }
    }

    // Mark OTP as used
    await connection.query(
      `UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?`,
      [token.id]
    );

    console.log(`✅ Password reset successful for ${email}`);

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
};
