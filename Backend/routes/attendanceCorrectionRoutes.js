const express = require('express');
const router = express.Router();
const correctionController = require('./controllers/attendanceCorrectionController');
const authMiddleware = require('../middleware/auth');

// ── Employee endpoints ──────────────────────────────────────
// Create a new correction ticket
router.post('/', authMiddleware, correctionController.createCorrection);

// Get my correction tickets
router.get('/my', authMiddleware, correctionController.getMyCorrections);

// Get correction counts (badges)
router.get('/counts', authMiddleware, correctionController.getCorrectionCounts);

// ── Tagged person endpoints ─────────────────────────────────
// Get tickets tagged to me
router.get('/tagged', authMiddleware, correctionController.getTaggedToMe);

// Approve/reject as tagged person
router.put('/tagged/:id', authMiddleware, correctionController.taggedAction);

// ── HR endpoints ────────────────────────────────────────────
// Get all correction tickets (HR view)
router.get('/all', authMiddleware, correctionController.getAllCorrections);

// HR approve/reject
router.put('/hr/:id', authMiddleware, correctionController.hrAction);

// ── Common endpoints ────────────────────────────────────────
// Get single correction detail
router.get('/:id', authMiddleware, correctionController.getCorrectionById);

// Get correction logs (audit trail)
router.get('/:id/logs', authMiddleware, correctionController.getCorrectionLogs);

module.exports = router;
