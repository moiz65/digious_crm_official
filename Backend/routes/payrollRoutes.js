/**
 * Payroll Routes
 * 
 * Endpoints:
 * GET    /payroll/:year/:month     - Get all payroll records for a month
 * POST   /payroll/generate         - Generate payroll for all active employees
 * PUT    /payroll/:id/status       - Update single record status
 * PUT    /payroll/bulk-status      - Bulk update status
 * GET    /payroll/:id/payslip      - Get detailed payslip
 */

const express = require('express');
const router = express.Router();
const payrollController = require('./controllers/payrollController');
const authMiddleware = require('../middleware/auth');

// Employee self-service routes (must be before parameterized routes)
router.get('/my-payroll', authMiddleware, payrollController.getMyPayroll);
router.get('/my-payslip/:id', authMiddleware, payrollController.getMyPayslip);

// Generate payroll (calculate from attendance + salary data)
router.post('/generate', authMiddleware, payrollController.generatePayroll);

// Bulk update status (must be before /:id routes)
router.put('/bulk-status', authMiddleware, payrollController.bulkUpdateStatus);

// Get detailed payslip (must be before /:year/:month to avoid conflict)
router.get('/:id/payslip', authMiddleware, payrollController.getPayslip);

// Update single record status
router.put('/:id/status', authMiddleware, payrollController.updatePayrollStatus);

// Get monthly payroll data (catch-all with two params — MUST be last)
router.get('/:year/:month', authMiddleware, payrollController.getMonthlyPayroll);

module.exports = router;
