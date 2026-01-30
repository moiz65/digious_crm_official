/**
 * Employee Profile API Service
 * Handles all communications with the backend employee profile endpoints
 */

import config from '../config/api';

const API_BASE_URL = config.FULL_API_URL;

// Helper to convert File to Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const EmployeeProfileService = {
  /**
   * Get employee profile by ID
   */
  async getProfile(employeeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return await response.json();
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  /**
   * Get complete profile summary with metadata
   */
  async getProfileSummary(employeeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}/summary`);
      if (!response.ok) throw new Error('Failed to fetch profile summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching profile summary:', error);
      throw error;
    }
  },

  /**
   * Get financial summary (bank accounts, salary, allowances)
   */
  async getFinancialSummary(employeeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}/financial`);
      if (!response.ok) throw new Error('Failed to fetch financial summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      throw error;
    }
  },

  /**
   * Get attendance summary (90-day stats)
   */
  async getAttendanceSummary(employeeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}/attendance`);
      if (!response.ok) throw new Error('Failed to fetch attendance summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }
  },

  /**
   * Get performance summary
   */
  async getPerformanceSummary(employeeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}/performance`);
      if (!response.ok) throw new Error('Failed to fetch performance summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching performance summary:', error);
      throw error;
    }
  },

  /**
   * Update employee profile fields
   */
  async updateProfile(employeeId, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Upload banner image to Cloudinary
   * @param {number} employeeId - Employee ID
   * @param {File} imageFile - Image file object
   */
  async uploadBanner(employeeId, imageFile) {
    try {
      const imageBase64 = await fileToBase64(imageFile);
      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}/upload-banner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageBase64 })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload banner');
      }
      return await response.json();
    } catch (error) {
      console.error('Error uploading banner:', error);
      throw error;
    }
  },

  /**
   * Upload multiple documents to Cloudinary
   * @param {number} employeeId - Employee ID
   * @param {Array} documents - Array of {imageFile, title, type}
   */
  async uploadDocuments(employeeId, documents) {
    try {
      const uploadPromises = documents.map(async (doc) => {
        const imageBase64 = await fileToBase64(doc.imageFile);
        return {
          image_base64: imageBase64,
          title: doc.title,
          type: doc.type || 'document'
        };
      });

      const documentsWithBase64 = await Promise.all(uploadPromises);

      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}/upload-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: documentsWithBase64 })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload documents');
      }
      return await response.json();
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  },

  /**
   * Update documents JSON metadata (without file upload)
   */
  async updateDocuments(employeeId, documents) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update documents');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating documents:', error);
      throw error;
    }
  },

  /**
   * Update resources JSON
   */
  async updateResources(employeeId, resources) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}/resources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resources })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update resources');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating resources:', error);
      throw error;
    }
  }
};

export default EmployeeProfileService;
