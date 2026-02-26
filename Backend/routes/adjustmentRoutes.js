const express = require('express');
const router = express.Router();
const adjustmentController = require('./controllers/adjustmentController');
const authMiddleware = require('../middleware/auth');

// Get approved tickets for adjustment
router.get('/approved-tickets', authMiddleware, adjustmentController.getApprovedTickets);

// Get all tickets with optional filters
router.get('/tickets', authMiddleware, adjustmentController.getAllTickets);

// Get employee data (attendance, leaves, absent, checkout missing, breaks)
router.get('/employee-data/:employeeId', authMiddleware, adjustmentController.getEmployeeData);

// Update attendance record
router.put('/attendance/:id', authMiddleware, adjustmentController.updateAttendance);

// Add new attendance record
router.post('/attendance', authMiddleware, adjustmentController.addAttendance);

// Update leave balances
router.put('/leaves/:employeeId', authMiddleware, adjustmentController.updateLeaves);

// Update absent record
router.put('/absent/:id', authMiddleware, adjustmentController.updateAbsent);

// Add new absent record
router.post('/absent', authMiddleware, adjustmentController.addAbsent);

// Delete absent record
router.delete('/absent/:id', authMiddleware, adjustmentController.deleteAbsent);

// Resolve checkout missing
router.put('/checkout-missing/:id', authMiddleware, adjustmentController.resolveCheckoutMissing);

// Close/resolve ticket
router.put('/close-ticket/:applicationId', authMiddleware, adjustmentController.closeTicket);

// Ignore ticket
router.put('/ignore-ticket/:applicationId', authMiddleware, adjustmentController.ignoreTicket);

// Get adjustment/approval log for a ticket
router.get('/log/:applicationId', authMiddleware, adjustmentController.getAdjustmentLog);

// Convert uninformed absent to paid leave (HR action)
router.put('/absent/:id/convert-to-paid-leave', authMiddleware, adjustmentController.convertAbsentToPaidLeave);

module.exports = router;
