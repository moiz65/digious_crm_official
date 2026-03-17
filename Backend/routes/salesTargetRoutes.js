/**
 * Sales Target Routes
 *
 * ── Targets ──
 * GET    /api/v1/sales-targets/all              – list all Sales employees' targets (admin)
 * GET    /api/v1/sales-targets/summary           – aggregated summary (admin)
 * GET    /api/v1/sales-targets/:employeeId       – get target for specific employee
 * PUT    /api/v1/sales-targets/:employeeId       – set/update target for specific employee
 */

const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/salesTargetController');
const authMiddleware = require('../middleware/auth');

// ── All targets (must be before /:employeeId to avoid param conflict) ──
router.get('/all', authMiddleware, ctrl.getAllTargets);
router.get('/summary', authMiddleware, ctrl.getTargetsSummary);

// ── Per-employee target ──
router.get('/:employeeId/history', authMiddleware, ctrl.getTargetHistory);
router.get('/:employeeId', authMiddleware, ctrl.getTarget);
router.put('/:employeeId', authMiddleware, ctrl.setTarget);

module.exports = router;
