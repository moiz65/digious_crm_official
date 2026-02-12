const express = require('express');
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

/**
 * Configure multer for document uploads
 * Stores files in memory before being saved to disk by documentHandler
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Validate file extension
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file type'));
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return cb(new Error('File size exceeds 5MB limit'));
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * Upload required document
 * POST /api/v1/employees/documents/upload
 * Body: employee_id, document_type, document_name (optional), expiry_date (optional), notes (optional)
 * File: file (multipart/form-data)
 */
router.post('/documents/upload', authMiddleware, upload.single('file'), documentController.uploadDocument);

/**
 * Get all documents for an employee
 * GET /api/v1/employees/:employee_id/documents
 */
router.get('/:employee_id/documents', authMiddleware, documentController.getEmployeeDocuments);

/**
 * Get document stats for an employee
 * GET /api/v1/employees/:employee_id/documents/stats
 */
router.get('/:employee_id/documents/stats', authMiddleware, documentController.getDocumentStats);

/**
 * Get specific document by ID
 * GET /api/v1/employees/documents/:document_id
 */
router.get('/documents/:document_id', authMiddleware, documentController.getDocumentById);

/**
 * Download document
 * GET /api/v1/employees/documents/download/:document_id
 */
router.get('/documents/download/:document_id', authMiddleware, documentController.downloadDocument);

/**
 * Update document status
 * PUT /api/v1/employees/documents/:document_id/status
 * Body: status, verified_by (optional), notes (optional)
 */
router.put('/documents/:document_id/status', authMiddleware, documentController.updateDocumentStatus);

/**
 * Delete document
 * DELETE /api/v1/employees/documents/:document_id
 */
router.delete('/documents/:document_id', authMiddleware, documentController.deleteDocument);

module.exports = router;
