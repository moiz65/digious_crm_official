const express = require('express');
const router = express.Router();
const memoController = require('./controllers/memoController');
const auth = require('../middleware/auth');

// =====================================================
// MEMO ROUTES
// =====================================================
// All routes require authentication.
// CRUD operations are intended for HR/Admin.
// Employees use the /employee/:employeeId endpoint for read-only access.
// =====================================================

// Departments list (for dropdown when creating/editing memos)
router.get('/departments', auth, memoController.getDepartments);

// All memos — HR/Admin management view
router.get('/all', auth, memoController.getAllMemos);

// Employee-visible memos (filtered by their department)
router.get('/employee/:employeeId', auth, memoController.getEmployeeMemos);

// Single memo
router.get('/:id', auth, memoController.getMemoById);

// Create memo (HR/Admin)
router.post('/', auth, memoController.createMemo);

// Update memo (HR/Admin)
router.put('/:id', auth, memoController.updateMemo);

// Delete memo (HR/Admin)
router.delete('/:id', auth, memoController.deleteMemo);

module.exports = router;
