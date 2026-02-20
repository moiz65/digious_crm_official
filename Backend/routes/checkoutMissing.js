/**
 * Checkout Missing Routes
 * Manages employees who forget to check out
 * Created: February 16, 2026
 */

const express = require('express');
const router = express.Router();
const checkoutMissingController = require('./controllers/checkoutMissingController');
const authMiddleware = require('../middleware/auth');

// Process missing checkouts (can be called manually or by cron)
router.post('/process', authMiddleware, checkoutMissingController.processMissingCheckouts);

// Get pending checkout-missing records (for HR dashboard)
router.get('/pending', authMiddleware, checkoutMissingController.getPendingCheckoutMissing);

// Get resolved checkout-missing records (for history/audit)
router.get('/resolved', authMiddleware, checkoutMissingController.getResolvedCheckoutMissing);

// Get single checkout-missing record by ID
router.get('/:id', authMiddleware, checkoutMissingController.getCheckoutMissingById);

// Resolve a checkout-missing record (HR sets checkout time and reason)
router.post('/:id/resolve', authMiddleware, checkoutMissingController.resolveCheckoutMissing);

// Get summary statistics
router.get('/stats/summary', authMiddleware, checkoutMissingController.getCheckoutMissingSummary);

// Delete a checkout missing record (admin only)
router.delete('/:id', authMiddleware, checkoutMissingController.deleteCheckoutMissing);

module.exports = router;
