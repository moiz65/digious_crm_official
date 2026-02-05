const fs = require('fs');
const path = require('path');

/**
 * Document Handler Utility
 * Manages employee required documents with organized folder structure
 * 
 * Folder Structure:
 * /uploads/documents/{emp_id}_{emp_name}_{createdDate}/
 *   - {document_type}_{createdDateTime}.{ext}
 */

class DocumentHandler {
  constructor() {
    this.baseDir = path.join(__dirname, '../uploads/documents');
    this.ensureBaseDirectoryExists();
  }

  /**
   * Ensure the base documents directory exists
   */
  ensureBaseDirectoryExists() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
      console.log(`Documents base directory created: ${this.baseDir}`);
    }
  }

  /**
   * Create employee-specific document folder
   * Format: {emp_id}_{emp_name}_{creation_date}
   * @param {number} employeeId - Employee ID
   * @param {string} employeeName - Employee name
   * @returns {string} Folder path
   */
  createEmployeeFolderPath(employeeId, employeeName) {
    // Format: emp_1_Muhammad_Hunain_2026-02-04
    const sanitizedName = employeeName.replace(/\s+/g, '_').toLowerCase();
    const creationDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const folderName = `emp_${employeeId}_${sanitizedName}_${creationDate}`;
    const folderPath = path.join(this.baseDir, folderName);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Employee document folder created: ${folderPath}`);
    }

    return folderPath;
  }

  /**
   * Generate document file name with timestamp
   * Format: {document_type}_{timestamp}.{extension}
   * @param {string} documentType - Type of document (e.g., 'cnic', 'passport')
   * @param {string} originalFileName - Original file name
   * @returns {object} { fileName, timestamp }
   */
  generateDocumentFileName(documentType, originalFileName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0]; // 2026-02-04T14-30-45-123
    const ext = path.extname(originalFileName); // .pdf, .jpg, etc.
    const sanitizedType = documentType.toLowerCase().replace(/\s+/g, '_');
    const fileName = `${sanitizedType}_${timestamp}${ext}`;

    return {
      fileName,
      timestamp,
      extension: ext
    };
  }

  /**
   * Save document file to the file system
   * @param {Buffer} fileBuffer - File buffer/content
   * @param {number} employeeId - Employee ID
   * @param {string} employeeName - Employee name
   * @param {string} documentType - Type of document
   * @param {string} originalFileName - Original file name
   * @returns {Promise<object>} { success, filePath, fileName, relativePath }
   */
  async saveDocument(fileBuffer, employeeId, employeeName, documentType, originalFileName) {
    try {
      const folderPath = this.createEmployeeFolderPath(employeeId, employeeName);
      const { fileName } = this.generateDocumentFileName(documentType, originalFileName);
      const filePath = path.join(folderPath, fileName);

      // Write file to disk
      fs.writeFileSync(filePath, fileBuffer);

      // Return relative path for database storage
      const relativePath = path.relative(this.baseDir, filePath).replace(/\\/g, '/');

      console.log(`Document saved: ${filePath}`);

      return {
        success: true,
        filePath,
        fileName,
        relativePath,
        fullPath: filePath
      };
    } catch (error) {
      console.error('Error saving document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete document from file system
   * @param {string} relativePath - Relative path from documents folder
   * @returns {Promise<object>} { success, message }
   */
  async deleteDocument(relativePath) {
    try {
      const fullPath = path.join(this.baseDir, relativePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Document deleted: ${fullPath}`);
        return { success: true, message: 'Document deleted successfully' };
      } else {
        return { success: false, message: 'Document file not found' };
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get document file from file system
   * @param {string} relativePath - Relative path from documents folder
   * @returns {Buffer|null} File buffer or null if not found
   */
  getDocument(relativePath) {
    try {
      const fullPath = path.join(this.baseDir, relativePath);

      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
      } else {
        console.warn(`Document not found: ${fullPath}`);
        return null;
      }
    } catch (error) {
      console.error('Error reading document:', error);
      return null;
    }
  }

  /**
   * Get all documents for an employee (by folder)
   * @param {number} employeeId - Employee ID
   * @returns {array} Array of document file names in the employee folder
   */
  getEmployeeDocuments(employeeId) {
    try {
      const folders = fs.readdirSync(this.baseDir);
      const employeeFolders = folders.filter(folder => 
        folder.startsWith(`emp_${employeeId}_`)
      );

      const documents = [];
      employeeFolders.forEach(folder => {
        const folderPath = path.join(this.baseDir, folder);
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
          documents.push({
            fileName: file,
            folderName: folder,
            relativePath: `${folder}/${file}`,
            createdAt: fs.statSync(path.join(folderPath, file)).birthtime
          });
        });
      });

      return documents;
    } catch (error) {
      console.error('Error getting employee documents:', error);
      return [];
    }
  }

  /**
   * Get folder path for serving documents
   * @param {number} employeeId - Employee ID
   * @returns {string} Relative folder path
   */
  getEmployeeFolderPath(employeeId) {
    const folders = fs.readdirSync(this.baseDir);
    const employeeFolder = folders.find(folder => 
      folder.startsWith(`emp_${employeeId}_`)
    );
    return employeeFolder ? `${employeeFolder}/` : null;
  }

  /**
   * Validate file type
   * @param {string} fileName - File name to validate
   * @param {array} allowedExtensions - Allowed file extensions (e.g., ['.pdf', '.jpg', '.png'])
   * @returns {boolean}
   */
  validateFileType(fileName, allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']) {
    const ext = path.extname(fileName).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  /**
   * Get file size limit in bytes (default 5MB)
   * @returns {number} File size limit
   */
  getFileSizeLimit() {
    return 5 * 1024 * 1024; // 5MB
  }

  /**
   * Validate file size
   * @param {number} fileSize - File size in bytes
   * @returns {boolean}
   */
  validateFileSize(fileSize) {
    return fileSize <= this.getFileSizeLimit();
  }
}

module.exports = new DocumentHandler();
