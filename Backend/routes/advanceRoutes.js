/**
 * Advance / Loan Routes
 *
 * GET    /api/v1/advances                              – list all advances (filters: status, employee_id, type)
 * GET    /api/v1/advances/summary                      – dashboard stats
 * GET    /api/v1/advances/employees                    – active employees dropdown
 * GET    /api/v1/advances/installments/pending/:y/:m   – pending installments for a month
 * GET    /api/v1/advances/:id                          – single advance with installments
 * POST   /api/v1/advances                              – create advance + installment plan
 * PUT    /api/v1/advances/:id                          – update (notes, status/cancel)
 * DELETE /api/v1/advances/:id                          – delete (if no deductions yet)
 */

const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/advanceController');
const authMiddleware = require('../middleware/auth');

// Summary & helper endpoints (before /:id)
router.get('/summary',                          authMiddleware, ctrl.getAdvanceSummary);
router.get('/employees',                        authMiddleware, ctrl.getEmployeesForDropdown);
router.get('/installments/pending/:year/:month', authMiddleware, ctrl.getPendingInstallments);

// CRUD
router.get('/',      authMiddleware, ctrl.getAdvances);
router.get('/:id',   authMiddleware, ctrl.getAdvance);
router.post('/',     authMiddleware, ctrl.createAdvance);
router.put('/:id',   authMiddleware, ctrl.updateAdvance);
router.delete('/:id', authMiddleware, ctrl.deleteAdvance);

module.exports = router;
