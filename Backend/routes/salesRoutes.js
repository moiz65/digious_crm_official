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

// ── Categories (must be before /:id to avoid param conflicts) ──
router.get   ('/categories',      authMiddleware, ctrl.getCategories);
router.post  ('/categories',      authMiddleware, ctrl.createCategory);
router.put   ('/categories/:id',  authMiddleware, ctrl.updateCategory);
router.delete('/categories/:id',  authMiddleware, ctrl.deleteCategory);

// ── Aggregated summary ──
router.get('/summary', authMiddleware, ctrl.getSalesSummary);

// ── Employee's own sales ──
router.get('/my-sales', authMiddleware, ctrl.getMySales);

// ── CRUD ──
router.get   ('/',     authMiddleware, ctrl.getSales);
router.post  ('/',     authMiddleware, ctrl.createSale);
router.get   ('/:id',  authMiddleware, ctrl.getSaleById);
router.put   ('/:id',  authMiddleware, ctrl.updateSale);
router.delete('/:id',  authMiddleware, ctrl.deleteSale);

module.exports = router;
