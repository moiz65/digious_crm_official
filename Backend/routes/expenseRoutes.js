/**
 * Expense Routes
 *
 * GET    /api/v1/expenses                   – list expenses (filters: from, to, category_id, search)
 * POST   /api/v1/expenses                   – create expense
 * PUT    /api/v1/expenses/:id               – update expense
 * DELETE /api/v1/expenses/:id               – delete expense
 *
 * GET    /api/v1/expenses/categories        – list all categories
 * POST   /api/v1/expenses/categories        – create category
 * PUT    /api/v1/expenses/categories/:id    – update category
 * DELETE /api/v1/expenses/categories/:id    – soft-delete category
 */

const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/expenseController');
const authMiddleware = require('../middleware/auth');

// ── Categories (must be before /:id to avoid param conflicts) ──
router.get   ('/categories',      authMiddleware, ctrl.getCategories);
router.post  ('/categories',      authMiddleware, ctrl.createCategory);
router.put   ('/categories/:id',  authMiddleware, ctrl.updateCategory);
router.delete('/categories/:id',  authMiddleware, ctrl.deleteCategory);

// ── Monthly summary (must be before /:id) ─────────────────────
router.get   ('/summary/monthly', authMiddleware, ctrl.getMonthlySummary);

// ── Expenses ──────────────────────────────────────────────────
router.get   ('/',     authMiddleware, ctrl.getExpenses);
router.post  ('/',     authMiddleware, ctrl.createExpense);
router.put   ('/:id',  authMiddleware, ctrl.updateExpense);
router.delete('/:id',  authMiddleware, ctrl.deleteExpense);

module.exports = router;
