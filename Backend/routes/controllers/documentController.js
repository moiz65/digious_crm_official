const pool = require('../../config/database');
const documentHandler = require('../../utils/documentHandler');

/**
 * Upload required document for employee
 * POST /api/v1/employees/documents/upload
 */
const uploadDocument = async (req, res) => {
  try {
    const { employee_id, document_type, document_name, notes, expiry_date } = req.body;
    const file = req.file;

    // Validation
    if (!employee_id || !document_type || !file) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, document type, and file are required'
      });
    }

    // Get employee details for folder naming
    const [employee] = await pool.query(
      'SELECT id, name FROM employee_onboarding WHERE id = ?',
      [employee_id]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employeeName = employee[0].name;

    // Validate file type
    if (!documentHandler.validateFileType(file.originalname)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX'
      });
    }

    // Validate file size
    if (!documentHandler.validateFileSize(file.size)) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds limit. Maximum: ${documentHandler.getFileSizeLimit() / (1024 * 1024)}MB`
      });
    }

    // Save document to file system
    const saveResult = await documentHandler.saveDocument(
      file.buffer,
      employee_id,
      employeeName,
      document_type,
      file.originalname
    );

    if (!saveResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save document',
        error: saveResult.error
      });
    }

    // Insert document record into database
    const [result] = await pool.query(
      `INSERT INTO employee_required_documents 
       (employee_id, document_type, document_name, document_url, status, expiry_date, notes, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        employee_id,
        document_type,
        document_name || file.originalname,
        saveResult.relativePath,
        'submitted',
        expiry_date || null,
        notes || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: result.insertId,
        employee_id,
        document_type,
        document_name: document_name || file.originalname,
        document_url: saveResult.relativePath,
        fileName: saveResult.fileName,
        folderPath: saveResult.relativePath.split('/')[0],
        status: 'submitted',
        uploaded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

/**
 * Get all documents for an employee
 * GET /api/v1/employees/:employee_id/documents
 */
const getEmployeeDocuments = async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Get documents from database
    const [documents] = await pool.query(
      `SELECT 
        id, employee_id, document_type, document_name, document_url,
        status, expiry_date, notes, uploaded_at, verified_at, verified_by, created_at, updated_at
       FROM employee_required_documents 
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [employee_id]
    );

    // Get file system documents
    const fsDocuments = documentHandler.getEmployeeDocuments(employee_id);

    return res.status(200).json({
      success: true,
      message: 'Documents retrieved successfully',
      data: {
        database_records: documents,
        file_system_docs: fsDocuments,
        total_count: documents.length
      }
    });
  } catch (error) {
    console.error('Error getting employee documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: error.message
    });
  }
};

/**
 * Get specific document by ID
 * GET /api/v1/employees/documents/:document_id
 */
const getDocumentById = async (req, res) => {
  try {
    const { document_id } = req.params;

    const [document] = await pool.query(
      `SELECT * FROM employee_required_documents WHERE id = ?`,
      [document_id]
    );

    if (document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document retrieved successfully',
      data: document[0]
    });
  } catch (error) {
    console.error('Error getting document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve document',
      error: error.message
    });
  }
};

/**
 * Download document
 * GET /api/v1/employees/documents/download/:document_id
 */
const downloadDocument = async (req, res) => {
  try {
    const { document_id } = req.params;

    const [document] = await pool.query(
      `SELECT * FROM employee_required_documents WHERE id = ?`,
      [document_id]
    );

    if (document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const doc = document[0];
    const fileBuffer = documentHandler.getDocument(doc.document_url);

    if (!fileBuffer) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found in storage'
      });
    }

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${doc.document_name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    return res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download document',
      error: error.message
    });
  }
};

/**
 * Update document status (e.g., verify, reject)
 * PUT /api/v1/employees/documents/:document_id/status
 */
const updateDocumentStatus = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { status, verified_by, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'submitted', 'verified', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, submitted, verified, rejected'
      });
    }

    const verifiedAt = status === 'verified' ? new Date() : null;

    const [result] = await pool.query(
      `UPDATE employee_required_documents 
       SET status = ?, verified_by = ?, verified_at = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, verified_by || null, verifiedAt, notes || null, document_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Document status updated to ${status}`,
      data: {
        id: document_id,
        status,
        verified_at: verifiedAt,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update document status',
      error: error.message
    });
  }
};

/**
 * Delete document
 * DELETE /api/v1/employees/documents/:document_id
 */
const deleteDocument = async (req, res) => {
  try {
    const { document_id } = req.params;

    const [document] = await pool.query(
      `SELECT * FROM employee_required_documents WHERE id = ?`,
      [document_id]
    );

    if (document.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const doc = document[0];

    // Delete from file system
    if (doc.document_url) {
      const deleteResult = await documentHandler.deleteDocument(doc.document_url);
      if (!deleteResult.success) {
        console.warn('File deletion warning:', deleteResult.message);
      }
    }

    // Delete from database
    await pool.query(
      `DELETE FROM employee_required_documents WHERE id = ?`,
      [document_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

/**
 * Get document statistics for an employee
 * GET /api/v1/employees/:employee_id/documents/stats
 */
const getDocumentStats = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_documents,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURDATE() THEN 1 ELSE 0 END) as expired_count
       FROM employee_required_documents 
       WHERE employee_id = ?`,
      [employee_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Document statistics retrieved',
      data: stats[0]
    });
  } catch (error) {
    console.error('Error getting document stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve document statistics',
      error: error.message
    });
  }
};

module.exports = {
  uploadDocument,
  getEmployeeDocuments,
  getDocumentById,
  downloadDocument,
  updateDocumentStatus,
  deleteDocument,
  getDocumentStats
};
