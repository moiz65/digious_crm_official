const express = require('express');
const router = express.Router();
const employeeProfileController = require('./controllers/employeeProfileController');
const authMiddleware = require('../middleware/auth');

// GET routes
router.get('/profile/:id', employeeProfileController.getEmployeeProfile);
router.get('/profile/:id/summary', employeeProfileController.getProfileSummary);
router.get('/profile/:id/financial', employeeProfileController.getFinancialSummary);
router.get('/profile/:id/attendance', employeeProfileController.getAttendanceSummary);
router.get('/profile/:id/performance', employeeProfileController.getPerformanceSummary);
router.get('/profile/:id/resources', employeeProfileController.getEmployeeResources);
router.get('/profile/:id/skills', employeeProfileController.getEmployeeSkills);
router.get('/profile/:id/social-links', employeeProfileController.getEmployeeSocialLinks);
router.get('/profile/:id/required-documents', employeeProfileController.getEmployeeRequiredDocuments);
router.get('/profile/:id/achievements', employeeProfileController.getEmployeeAchievements);

// POST routes
router.post('/profile', authMiddleware, employeeProfileController.createEmployeeProfile);

// PUT routes
router.put('/profile/:id', authMiddleware, employeeProfileController.updateEmployeeProfile);
router.put('/profile/:id/banner', authMiddleware, employeeProfileController.updateBanner);
router.put('/profile/:id/documents', authMiddleware, employeeProfileController.updateDocuments);
router.put('/profile/:id/resources', authMiddleware, employeeProfileController.updateResources);
router.put('/profile/:id/social-links', authMiddleware, employeeProfileController.updateEmployeeSocialLinks);
router.put('/profile/:id/required-documents', authMiddleware, employeeProfileController.updateEmployeeRequiredDocuments);
router.put('/profile/:id/achievements', authMiddleware, employeeProfileController.updateEmployeeAchievements);

// Image upload routes (Cloudinary)
router.post('/profile/:id/upload-profile-photo', authMiddleware, employeeProfileController.uploadProfilePhoto);
router.post('/profile/:id/upload-banner', authMiddleware, employeeProfileController.uploadBannerImage);
router.post('/profile/:id/upload-documents', authMiddleware, employeeProfileController.uploadDocumentsToCloudinary);
router.post('/profile/:id/upload-required-documents', authMiddleware, employeeProfileController.uploadRequiredDocuments);

// DELETE routes
router.delete('/profile/:id', authMiddleware, employeeProfileController.deleteEmployeeProfile);

module.exports = router;
