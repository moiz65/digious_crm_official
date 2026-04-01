const express = require('express');
const router = express.Router();
const attendanceController = require('./controllers/attendanceController');
const authMiddleware = require('../middleware/auth');

// Employee Routes (Protected)
router.post('/check-in', authMiddleware, attendanceController.checkIn);
router.post('/check-out', authMiddleware, attendanceController.checkOut);
router.post('/break', authMiddleware, attendanceController.recordBreak);
router.post('/break-start', authMiddleware, attendanceController.recordBreakStart);   // Save break immediately on start
router.patch('/break-progress', authMiddleware, attendanceController.recordBreakProgress); // Auto-save progress every 30s
router.patch('/break-end', authMiddleware, attendanceController.recordBreakEnd);     // Update break with end time
router.get('/ongoing-breaks/:employee_id', authMiddleware, attendanceController.getOngoingBreaks); // Get unfinished breaks
router.get('/today-breaks/:employee_id', authMiddleware, attendanceController.getTodayBreaks); // Get today's completed breaks

// Get attendance data (Public for HR Dashboard)
router.get('/today/:employee_id', attendanceController.getTodayAttendance);
router.get('/monthly/:employee_id', attendanceController.getMonthlyAttendance);
router.get('/break-summary', attendanceController.getBreakSummary); // Get break summary for a specific employee and date
router.get('/pending-checkout', authMiddleware, attendanceController.getPendingCheckout); // NEW: Check for pending checkout from previous shift

// Absence Management Routes
router.post('/generate-absent', attendanceController.generateAbsentRecords); // Generate absent records from joining date
router.post('/auto-mark-absent', attendanceController.autoMarkAbsentByDateRange); // Auto-mark absent for date range
router.get('/absent-today', attendanceController.getTodayAbsentEmployees); // Get today's absent employees (auto-generate)
router.get('/absent-by-date', attendanceController.getAbsentEmployeesByDate); // Get absent by specific date
router.get('/absent-by-range', attendanceController.getAbsentEmployeesByDateRange); // Get absent by date range
router.get('/absent-summary', attendanceController.getAbsentSummaryByEmployee); // Get absence summary per employee
router.get('/all-with-absent', attendanceController.getAllAttendanceWithAbsent); // New endpoint with absent records

// Admin Routes (Public for HR Dashboard)
router.get('/all', attendanceController.getAllAttendance);
router.get('/breaks', attendanceController.getAllBreaks);
router.get('/summary', authMiddleware, attendanceController.getAttendanceSummary);
router.get('/overtime', authMiddleware, attendanceController.getOvertimeReport);
router.post('/auto-fix-working-hours', attendanceController.autoFixMissingWorkingHours); // Auto-fix missing working hours
router.post('/auto-checkout', attendanceController.autoCheckoutExpiredSessions); // Auto-checkout for expired sessions at 9 AM
router.post('/fix-status/:id', attendanceController.fixStatusById); // Admin: fix status and late_by_minutes for early check-ins
router.post('/fix-checkout/:id', attendanceController.fixCheckoutById); // Admin: fix a single attendance by id
router.put('/:id', authMiddleware, attendanceController.hrUpdateAttendance); // HR: direct update attendance without approval
router.post('/hr-create', authMiddleware, attendanceController.hrCreateAttendance); // HR: create attendance for absent days

module.exports = router;
