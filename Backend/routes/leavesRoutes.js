const express = require('express');
const router = express.Router();
const {
  getEmployeeLeaveBalance,
  getAllEmployeeLeaves,
  markEmployeeLeave,
  updateLeaveAllocation,
  resetLeavesForYear,
  removeLeaveRecord,
  getLeaveStatistics
} = require('./controllers/employeeLeavesController');

/**
 * ============================================================================
 * EMPLOYEE LEAVES ROUTES
 * ============================================================================
 * All routes for managing employee leaves
 */

/**
 * GET ENDPOINTS
 */

// Get leave balance for a specific employee
// GET /api/employee/:id/leaveBalance
router.get('/employee/:id/leaveBalance', getEmployeeLeaveBalance);

// Get all employee leaves (admin/HR only)
// GET /api/leaves/all
router.get('/all', getAllEmployeeLeaves);

// Get leave statistics for dashboard
// GET /api/leaves/statistics
router.get('/statistics', getLeaveStatistics);

/**
 * POST ENDPOINTS
 */

// Mark/use leave days for an employee
// POST /api/employee/:id/markLeave
// Body: { leaveType: 'casual|sick|annual', days: 1, reason: 'optional' }
router.post('/employee/:id/markLeave', markEmployeeLeave);

/**
 * PUT ENDPOINTS
 */

// Update leave allocation totals
// PUT /api/employee/:id/updateLeaveAllocation
// Body: { casual_total: 8, sick_total: 8, annual_total: 12 }
router.put('/employee/:id/updateLeaveAllocation', updateLeaveAllocation);

// Reset leaves for a new year
// PUT /api/leaves/resetYear
// Body: { year: 2026 (optional) }
router.put('/resetYear', resetLeavesForYear);

/**
 * DELETE ENDPOINTS
 */

// Remove a leave record (admin only)
// DELETE /api/employee/:id/removeLeaveRecord
router.delete('/employee/:id/removeLeaveRecord', removeLeaveRecord);

module.exports = router;
