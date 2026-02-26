const express = require('express');
const router = express.Router();
const applicationsController = require('./controllers/applicationsController');
const auth = require('../middleware/auth');

// =====================================================
// APPLICATIONS ROUTES
// =====================================================
// All routes require authentication
// Supports multi-assignee sequential approval workflow
// =====================================================

// Employee's own applications
router.get('/employee/:id', auth, applicationsController.getEmployeeApplications);
router.get('/stats/:employeeId', auth, applicationsController.getApplicationStatistics);

// Employee search for assignment auto-suggest
router.get('/employees/search', auth, applicationsController.searchEmployees);

// Applications assigned to current user
router.get('/assigned-to-me', auth, applicationsController.getAssignedToMe);

// All applications (HR/Admin view)
router.get('/all', auth, applicationsController.getAllApplications);

// Single application CRUD
router.get('/:id', auth, applicationsController.getApplicationById);
router.post('/', auth, applicationsController.createApplication);
router.put('/:id/status', auth, applicationsController.updateApplicationStatus);
router.put('/:id', auth, applicationsController.updateApplication);
router.delete('/:id', auth, applicationsController.deleteApplication);

// Document management
router.post('/:id/documents', auth, applicationsController.addApplicationDocument);

// Application actions
router.post('/:id/withdraw', auth, applicationsController.withdrawApplication);
router.patch('/:id/approve', auth, applicationsController.approveApplication);
router.patch('/:id/reject', auth, applicationsController.rejectApplication);
router.post('/:id/withdraw-assignment', auth, applicationsController.withdrawAssignment);
router.patch('/:id/priority', auth, applicationsController.updateApplicationPriority);

// Multi-assign chain info
router.get('/:id/approval-log', auth, applicationsController.getApprovalLog);
router.get('/:id/assignees', auth, applicationsController.getApplicationAssignees);

module.exports = router;
