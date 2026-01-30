const pool = require('../../config/database');
const cloudinary = require('../../config/cloudinary');

/**
 * Get employee profile by ID (from employee_profile_summary view)
 */
const getEmployeeProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      'SELECT * FROM employee_profile_summary WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Employee profile retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee profile',
      error: error.message
    });
  }
};

/**
 * Get profile summary (comprehensive view)
 */
const getProfileSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [profile] = await pool.query(
      'SELECT * FROM employee_profile_summary WHERE id = ?',
      [id]
    );
    
    if (profile.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Profile summary retrieved successfully',
      data: {
        profile: profile[0],
        metadata: {
          has_banner: !!profile[0].banner_url,
          has_documents: !!profile[0].documents_json,
          has_resources: !!profile[0].resources_json,
          profile_completeness: calculateProfileCompleteness(profile[0])
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profile summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile summary',
      error: error.message
    });
  }
};

/**
 * Get financial summary for employee
 */
const getFinancialSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      'SELECT * FROM employee_financial_summary WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Financial data not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Financial summary retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve financial summary',
      error: error.message
    });
  }
};

/**
 * Get attendance summary for employee
 */
const getAttendanceSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      'SELECT * FROM employee_attendance_summary WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance data not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Attendance summary retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance summary',
      error: error.message
    });
  }
};

/**
 * Get performance summary for employee
 */
const getPerformanceSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      'SELECT * FROM employee_performance_summary WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Performance data not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Performance summary retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching performance summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance summary',
      error: error.message
    });
  }
};

/**
 * Create employee profile (inserts into employee_profiles table)
 */
const createEmployeeProfile = async (req, res) => {
  try {
    const {
      employee_id,
      bio,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      preferred_contact_method,
      linkedin_url,
      github_url,
      portfolio_url,
      skills_json,
      certifications_json,
      banner_url,
      documents_json,
      resources_json,
      next_review_date,
      review_cycle,
      preferred_work_location,
      work_mode_preference,
      total_work_experience_years
    } = req.body;
    
    // Check if profile already exists
    const [existing] = await pool.query(
      'SELECT id FROM employee_profiles WHERE employee_id = ?',
      [employee_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists for this employee'
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO employee_profiles 
      (employee_id, bio, emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
       preferred_contact_method, linkedin_url, github_url, portfolio_url, skills_json, 
       certifications_json, banner_url, documents_json, resources_json, next_review_date, 
       review_cycle, preferred_work_location, work_mode_preference, total_work_experience_years)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id, bio, emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        preferred_contact_method, linkedin_url, github_url, portfolio_url, 
        skills_json ? JSON.stringify(skills_json) : null,
        certifications_json ? JSON.stringify(certifications_json) : null,
        banner_url,
        documents_json ? JSON.stringify(documents_json) : null,
        resources_json ? JSON.stringify(resources_json) : null,
        next_review_date, review_cycle, preferred_work_location, work_mode_preference,
        total_work_experience_years
      ]
    );
    
    return res.status(201).json({
      success: true,
      message: 'Employee profile created successfully',
      data: {
        id: result.insertId,
        employee_id
      }
    });
  } catch (error) {
    console.error('Error creating employee profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create employee profile',
      error: error.message
    });
  }
};

/**
 * Update employee profile
 */
const updateEmployeeProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const allowedFields = [
      'bio', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
      'preferred_contact_method', 'linkedin_url', 'github_url', 'portfolio_url',
      'skills_json', 'certifications_json', 'banner_url', 'documents_json', 'resources_json',
      'next_review_date', 'review_cycle', 'preferred_work_location', 'work_mode_preference',
      'total_work_experience_years'
    ];
    
    const updateFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        // Stringify JSON fields
        if (['skills_json', 'certifications_json', 'documents_json', 'resources_json'].includes(key)) {
          values.push(updates[key] ? JSON.stringify(updates[key]) : null);
        } else {
          values.push(updates[key]);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    values.push(id);
    
    const [result] = await pool.query(
      `UPDATE employee_profiles SET ${updateFields.join(', ')}, updated_at = NOW() WHERE employee_id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    // Fetch updated profile
    const [updated] = await pool.query(
      'SELECT * FROM employee_profile_summary WHERE id = ?',
      [id]
    );
    
    return res.status(200).json({
      success: true,
      message: 'Employee profile updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating employee profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update employee profile',
      error: error.message
    });
  }
};

/**
 * Update banner URL
 */
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { banner_url } = req.body;
    
    if (!banner_url) {
      return res.status(400).json({
        success: false,
        message: 'banner_url is required'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE employee_profiles SET banner_url = ?, updated_at = NOW() WHERE employee_id = ?',
      [banner_url, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: { banner_url }
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message
    });
  }
};

/**
 * Update documents JSON
 */
const updateDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        message: 'documents array is required'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE employee_profiles SET documents_json = ?, updated_at = NOW() WHERE employee_id = ?',
      [JSON.stringify(documents), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Documents updated successfully',
      data: { documents }
    });
  } catch (error) {
    console.error('Error updating documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update documents',
      error: error.message
    });
  }
};

/**
 * Update resources JSON
 */
const updateResources = async (req, res) => {
  try {
    const { id } = req.params;
    const { resources } = req.body;
    
    if (!resources || !Array.isArray(resources)) {
      return res.status(400).json({
        success: false,
        message: 'resources array is required'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE employee_profiles SET resources_json = ?, updated_at = NOW() WHERE employee_id = ?',
      [JSON.stringify(resources), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Resources updated successfully',
      data: { resources }
    });
  } catch (error) {
    console.error('Error updating resources:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update resources',
      error: error.message
    });
  }
};

/**
 * Delete employee profile
 */
const deleteEmployeeProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      'DELETE FROM employee_profiles WHERE employee_id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Employee profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee profile',
      error: error.message
    });
  }
};

/**
 * Helper: Calculate profile completeness percentage
 */
function calculateProfileCompleteness(profile) {
  const fields = [
    'bio', 'emergency_contact_phone', 'linkedin_url', 'github_url',
    'portfolio_url', 'next_review_date', 'preferred_work_location',
    'total_work_experience_years', 'banner_url'
  ];
  
  let completed = 0;
  fields.forEach(field => {
    if (profile[field] !== null && profile[field] !== '') {
      completed++;
    }
  });
  
  return Math.round((completed / fields.length) * 100);
}

/**
 * Upload banner image to Cloudinary
 */
const uploadBannerImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_base64 } = req.body;

    if (!image_base64) {
      return res.status(400).json({
        success: false,
        message: 'image_base64 is required'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image_base64, {
      folder: `employee_profiles/${id}/banner`,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });

    if (!result || !result.secure_url) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload banner to Cloudinary'
      });
    }

    // Update banner_url in database
    const [updateResult] = await pool.query(
      'UPDATE employee_profiles SET banner_url = ?, updated_at = NOW() WHERE employee_id = ?',
      [result.secure_url, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        banner_url: result.secure_url,
        cloudinary_public_id: result.public_id
      }
    });
  } catch (error) {
    console.error('Error uploading banner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload banner',
      error: error.message
    });
  }
};

/**
 * Upload multiple documents to Cloudinary
 */
const uploadDocumentsToCloudinary = async (req, res) => {
  try {
    const { id } = req.params;
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'documents array with image_base64 fields is required'
      });
    }

    const uploadedDocs = [];

    for (const doc of documents) {
      if (!doc.image_base64 || !doc.title) {
        continue;
      }

      try {
        const result = await cloudinary.uploader.upload(doc.image_base64, {
          folder: `employee_profiles/${id}/documents`,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto'
        });

        uploadedDocs.push({
          id: uploadedDocs.length + 1,
          title: doc.title,
          type: doc.type || 'document',
          url: result.secure_url,
          cloudinary_public_id: result.public_id,
          uploadedAt: new Date().toISOString().split('T')[0]
        });
      } catch (uploadError) {
        console.error(`Error uploading document "${doc.title}":`, uploadError);
      }
    }

    if (uploadedDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No documents were successfully uploaded'
      });
    }

    // Update documents_json in database
    const [updateResult] = await pool.query(
      'UPDATE employee_profiles SET documents_json = ?, updated_at = NOW() WHERE employee_id = ?',
      [JSON.stringify(uploadedDocs), id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedDocs.length} document(s)`,
      data: { documents: uploadedDocs }
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
};

module.exports = {
  getEmployeeProfile,
  getProfileSummary,
  getFinancialSummary,
  getAttendanceSummary,
  getPerformanceSummary,
  createEmployeeProfile,
  updateEmployeeProfile,
  updateBanner,
  updateDocuments,
  updateResources,
  deleteEmployeeProfile,
  uploadBannerImage,
  uploadDocumentsToCloudinary
};
