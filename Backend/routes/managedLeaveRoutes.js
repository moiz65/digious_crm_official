const express = require('express');
const router = express.Router();
const mlController = require('./controllers/managedLeaveController');
const authMiddleware = require('../middleware/auth');

// ── Employee endpoints ──────────────────────────────────────
// Create a new managed leave ticket
router.post('/', authMiddleware, mlController.createManagedLeave);

// Get my managed leave tickets
router.get('/my', authMiddleware, mlController.getMyManagedLeaves);

// Get managed leave counts (badges)
router.get('/counts', authMiddleware, mlController.getManagedLeaveCounts);

// Get my leave balance (for the form)
router.get('/balance', authMiddleware, mlController.getMyLeaveBalance);

// ── Tagged person endpoints ─────────────────────────────────
// Get tickets tagged to me
router.get('/tagged', authMiddleware, mlController.getTaggedManagedLeaves);

// Approve/reject as tagged person
router.put('/tagged/:id', authMiddleware, mlController.taggedManagedLeaveAction);

// ── HR endpoints ────────────────────────────────────────────
// Get all managed leave tickets (HR view)
router.get('/all', authMiddleware, mlController.getAllManagedLeaves);

// HR approve/reject
router.put('/hr/:id', authMiddleware, mlController.hrManagedLeaveAction);

// ── Common endpoints ────────────────────────────────────────
// Get single ticket detail
router.get('/:id', authMiddleware, mlController.getManagedLeaveById);

// Get ticket logs (audit trail)
router.get('/:id/logs', authMiddleware, mlController.getManagedLeaveLogs);

module.exports = router;
