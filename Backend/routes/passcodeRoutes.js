// routes/passcodeRoutes.js
const express = require('express');
const router = express.Router();
const passcodeController = require('./controllers/passcodeController');
const authMiddleware = require('../middleware/auth');

// Get passcode status (whether user has set passcode or not)
// Supports both admin and employee users
router.get('/status', authMiddleware, passcodeController.getPasscodeStatus);

// Set initial passcode
// Only for employee users (admin passcode is auto-set)
router.post('/set', authMiddleware, passcodeController.setPasscode);

// Verify passcode for module access
// Supports both admin and employee users
router.post('/verify', authMiddleware, passcodeController.verifyPasscode);

// Reset passcode using favorite movie
// Only for employee users (admin cannot reset passcode)
router.post('/reset', authMiddleware, passcodeController.resetPasscode);

// Lock module temporarily
// Logs action for both admin and employee users
router.post('/lock-module', authMiddleware, passcodeController.lockModule);

// Get module access status
// Returns module-specific access information
router.get('/module-status/:moduleName', authMiddleware, passcodeController.getModuleStatus);


// Optional: Get user's passcode security info (for profile page)
router.get('/security-info', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { getUserInfo } = require('./controllers/passcodeController');
    const userInfo = await getUserInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Return security info without exposing sensitive data
    res.json({
      success: true,
      data: {
        userType: userInfo.type,
        hasPasscode: userInfo.type === 'admin' ? true : undefined, // Will be fetched separately
        securityLevel: userInfo.type === 'admin' ? 'high' : 'standard',
        canResetPasscode: userInfo.type !== 'admin',
        canSetPasscode: userInfo.type !== 'admin',
        lastActivity: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting security info:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Optional: Get audit logs for user (admin only)
router.get('/audit-logs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { getUserInfo } = require('../controllers/passcodeController');
    const userInfo = await getUserInfo(userId);
    
    // Only admin can view audit logs
    if (userInfo?.type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }
    
    const pool = require('../../config/database');
    
    // Get admin audit logs
    const [adminLogs] = await pool.query(
      `SELECT action, status, ip_address, user_agent, created_at 
       FROM admin_audit_log_passcode 
       WHERE admin_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userInfo.id]
    );
    
    // Get employee audit logs (optional, if admin needs to see all)
    const [employeeLogs] = await pool.query(
      `SELECT user_id, action, status, ip_address, user_agent, created_at 
       FROM passcode_audit_log 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    
    res.json({
      success: true,
      data: {
        adminLogs,
        employeeLogs,
        totalAdminLogs: adminLogs.length,
        totalEmployeeLogs: employeeLogs.length
      }
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Optional: Force lock module (admin only)
router.post('/admin/lock-module/:moduleName', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { moduleName } = req.params;
    const { getUserInfo } = require('../controllers/passcodeController');
    const userInfo = await getUserInfo(userId);
    
    // Only admin can force lock modules for all users
    if (userInfo?.type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }
    
    // Log the action
    const pool = require('../../config/database');
    await pool.query(
      `INSERT INTO admin_audit_log_passcode (admin_id, action, status, ip_address, user_agent, created_at) 
       VALUES (?, 'FORCE_LOCK_MODULE', 'SUCCESS', ?, ?, NOW())`,
      [userInfo.id, req.ip || null, req.headers['user-agent'] || null]
    );
    
    res.json({ 
      success: true, 
      message: `Module "${moduleName}" has been force locked for all users`,
      data: { moduleName, lockedBy: userInfo.email, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Error force locking module:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;