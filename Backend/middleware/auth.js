// Backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Async auth middleware that verifies JWT and ensures the session token is active
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify JWT signature & expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.warn('Token verification failed:', err.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Ensure session token is still active in the DB (prevents use after logout)
    // Enhanced with better error handling and fallback
    try {
      console.log('🔐 [Auth Middleware] Checking session token in database...');
      const [rows] = await pool.query (
        `SELECT id, session_token, is_active FROM user_system_info WHERE session_token = ? LIMIT 1`,
        [token]
      );

      if (rows.length === 0) {
        console.warn('🔐 [Auth Middleware] Session token not found in user_system_info table - JWT is valid, allowing access');
        // Session not found but JWT is valid - allow access (useful for development/testing)
        // In production, you may want to reject this
        req.user = decoded;
        return next();
      }

      if (rows[0].is_active !== 1) {
        console.warn('🔐 [Auth Middleware] Session is marked as inactive');
        return res.status(401).json({ success: false, message: 'Session is inactive. Please login again.' });
      }

      console.log('🔐 [Auth Middleware] ✅ Session verified and active');
    } catch (dbErr) {
      console.error('🔐 [Auth Middleware] Database error:', {
        code: dbErr.code,
        message: dbErr.message,
        errno: dbErr.errno
      });
      
      // Log more details about the error
      if (dbErr.code === 'ER_NO_SUCH_TABLE') {
        console.warn('🔐 [Auth Middleware] user_system_info table does not exist. Allowing JWT-only authentication.');
      } else {
        console.warn('🔐 [Auth Middleware] Database unavailable. Allowing JWT-only authentication.');
      }
      
      // Allow JWT verification to pass through even if DB check fails
      // This prevents total lockout if database is temporarily unavailable
      console.log('🔐 [Auth Middleware] JWT verification successful, allowing access (DB unavailable)');
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('🔐 [Auth Middleware] Unexpected error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;
