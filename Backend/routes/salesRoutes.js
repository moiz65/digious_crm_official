/**
 * Sales Routes
 *
 * ── Categories ──
 * GET    /api/v1/sales/categories           – list all active categories
 * POST   /api/v1/sales/categories           – create category
 * PUT    /api/v1/sales/categories/:id       – update category
 * DELETE /api/v1/sales/categories/:id       – delete category
 *
 * ── Sales ──
 * GET    /api/v1/sales                      – list sales (filters: from, to, category_id, status, employee_id, search)
 * GET    /api/v1/sales/my-sales             – list logged-in employee's sales
 * GET    /api/v1/sales/summary              – aggregated summary (totals, by-status, by-category)
 * GET    /api/v1/sales/:id                  – single sale detail
 * POST   /api/v1/sales                      – create sale
 * PUT    /api/v1/sales/:id                  – update sale
 * DELETE /api/v1/sales/:id                  – delete sale
 */

const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/salesController');
const authMiddleware = require('../middleware/auth');

// Middleware to restrict sales access to Sales dept and Admin only
const salesDeptGuard = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  if (userRole === 'admin' || userRole === 'administration' || userRole === 'sales') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Sales module is restricted to Sales department only.'
  });
};

// ── Categories (must be before /:id to avoid param conflicts) ──
router.get   ('/categories',      authMiddleware, salesDeptGuard, ctrl.getCategories);
router.post  ('/categories',      authMiddleware, salesDeptGuard, ctrl.createCategory);
router.put   ('/categories/:id',  authMiddleware, salesDeptGuard, ctrl.updateCategory);
router.delete('/categories/:id',  authMiddleware, salesDeptGuard, ctrl.deleteCategory);

// ── Aggregated summary ──
router.get('/summary', authMiddleware, salesDeptGuard, ctrl.getSalesSummary);

// ── Employee's own sales ──
router.get('/my-sales', authMiddleware, salesDeptGuard, ctrl.getMySales);

// ── CRUD ──
router.get   ('/',     authMiddleware, salesDeptGuard, ctrl.getSales);
router.post  ('/',     authMiddleware, salesDeptGuard, ctrl.createSale);
router.get   ('/:id',  authMiddleware, salesDeptGuard, ctrl.getSaleById);
router.put   ('/:id',  authMiddleware, salesDeptGuard, ctrl.updateSale);
router.delete('/:id',  authMiddleware, salesDeptGuard, ctrl.deleteSale);

module.exports = router;
