const pool = require('../../config/database');
const cloudinary = require('../../config/cloudinary');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Safely resolve an incoming id to the correct employee_onboarding.id.
 *
 * Priority:
 *  1. If the id directly matches employee_onboarding.id  →  use as-is.
 *  2. Else if it matches a user_as_employees.id          →  follow FK to employee_onboarding.id.
 *  3. Otherwise return the original value (downstream query will 404).
 *
 * This guards against the bug where employee_onboarding.id happens to equal
 * another user's user_as_employees.id, causing the wrong profile to be returned.
 */
const resolveEmployeeId = async (rawId) => {
  // 1. Direct match in employee_onboarding?
  const [directMatch] = await pool.query(
    'SELECT id FROM employee_onboarding WHERE id = ?',
    [rawId]
  );
  if (directMatch.length > 0) {
    return rawId; // already a valid employee_onboarding.id — use it directly
  }

  // 2. Fall back: treat rawId as user_as_employees.id
  const [userMapping] = await pool.query(
    'SELECT employee_id FROM user_as_employees WHERE id = ?',
    [rawId]
  );
  if (userMapping.length > 0) {
    const resolved = userMapping[0].employee_id;
    console.log(`🔄 resolveEmployeeId: converted user_as_employees.id ${rawId} → employee_onboarding.id ${resolved}`);
    return resolved;
  }

  return rawId; // return original; let downstream queries produce a natural 404
};

/**
 * Get employee profile by ID (from employee_onboarding and employee_profiles)
 */
const getEmployeeProfile = async (req, res) => {
  try {
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);
    
    // Get from employee_onboarding
    const [onboarding] = await pool.query(
      'SELECT * FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );
    
    // Get from employee_profiles (if exists)
    let profiles = [];
    try {
      const [pRows] = await pool.query(
        'SELECT * FROM employee_profiles WHERE employee_id = ? OR id = ?',
        [id, id]
      );
      profiles = pRows;
    } catch (err) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('employee_profiles table missing, continuing without it');
        profiles = [];
      } else {
        throw err;
      }
    }
    
    if (onboarding.length === 0 && profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    
    // Merge data from both tables
    const onboardingData = onboarding[0] || {};
    const profileData = profiles[0] || {};
    
    const mergedProfile = {
      id: onboardingData.id || profileData.id,
      employee_id: onboardingData.employee_id || profileData.employee_id,
      name: onboardingData.name,
      email: onboardingData.email,
      phone: onboardingData.phone,
      department: onboardingData.department,
      designation: onboardingData.designation,
      join_date: onboardingData.join_date,
      dob: onboardingData.dob,
      profile_photo: profileData.profile_photo || onboardingData.profile_photo,
      banner_url: profileData.banner_url,
      bio: profileData.bio,
      emergency_contact_phone: profileData.emergency_contact_phone,
      linkedin_url: profileData.linkedin_url,
      github_url: profileData.github_url,
      portfolio_url: profileData.portfolio_url,
      skills_json: profileData.skills_json,
      documents_json: profileData.documents_json,
      resources_json: profileData.resources_json
    };
    
    return res.status(200).json({
      success: true,
      message: 'Employee profile retrieved successfully',
      data: mergedProfile
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
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);
    
    // Get from employee_onboarding
    const [onboarding] = await pool.query(
      'SELECT * FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );
    
    // Get from employee_profiles (if exists)
    let profiles = [];
    try {
      const [pRows] = await pool.query(
        'SELECT * FROM employee_profiles WHERE employee_id = ? OR id = ?',
        [id, id]
      );
      profiles = pRows;
    } catch (err) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('employee_profiles table missing, continuing without it');
        profiles = [];
      } else {
        throw err;
      }
    }
    
    if (onboarding.length === 0 && profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Merge data from both tables
    const onboardingData = onboarding[0] || {};
    const profileData = profiles[0] || {};
    
    const mergedProfile = {
      id: onboardingData.id || profileData.id,
      employee_id: onboardingData.employee_id || profileData.employee_id,
      // Provide both 'name' and 'full_name' for frontend compatibility
      name: onboardingData.name || profileData.name || (profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''}` : null),
      full_name: onboardingData.name || profileData.full_name || (profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''}` : null),
      email: onboardingData.email,
      phone: onboardingData.phone,
      department: onboardingData.department,
      designation: profileData.designation || onboardingData.designation || null,
      join_date: onboardingData.join_date,
      dob: onboardingData.dob,
      // Profile photo preference: profile table first, then onboarding
      profile_photo: profileData.profile_photo || onboardingData.profile_photo,
      banner_url: profileData.banner_url,
      bio: profileData.bio,
      emergency_contact_phone: profileData.emergency_contact_phone || onboardingData.emergency_contact,
      linkedin_url: profileData.linkedin_url,
      github_url: profileData.github_url,
      portfolio_url: profileData.portfolio_url,
      documents_json: profileData.documents_json,
      resources_json: profileData.resources_json,
      // Expose employment and type information
      employment_status: onboardingData.employment_status || profileData.employment_status || null,
      employee_type: profileData.employee_type || onboardingData.employment_status || null
    };
    
    return res.status(200).json({
      success: true,
      message: 'Profile summary retrieved successfully',
      data: {
        profile: mergedProfile,
        metadata: {
          has_banner: !!mergedProfile.banner_url,
          has_documents: !!mergedProfile.documents_json,
          has_resources: !!mergedProfile.resources_json,
          has_profile_photo: !!mergedProfile.profile_photo,
          profile_completeness: calculateProfileCompleteness(mergedProfile)
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
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);

    console.log(`\n💰 [Financial Summary] Employee ID: ${id}`);

    // Get employee basic info
    const [empRows] = await pool.query(
      'SELECT id, employee_id, name FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );

    if (empRows.length === 0) {
      console.warn(`⚠️ [Financial Summary] Employee not found - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const emp = empRows[0];
    const empId = emp.employee_id || emp.id;

    // Get base salary and total salary from employee_salary table
    let salary = { base_salary: null, total_salary: null };
    try {
      const [salRows] = await pool.query(
        'SELECT base_salary, total_salary FROM employee_salary WHERE employee_id = ?',
        [empId]
      );
      if (salRows.length > 0) {
        salary = salRows[0];
        console.log(`✅ [Financial Summary] Found salary: base=${salary.base_salary}, total=${salary.total_salary}`);
      } else {
        // Fallback to employee_onboarding table - use the numeric id directly
        console.log(`📋 [Financial Summary] No salary in employee_salary, checking employee_onboarding with id=${id}...`);
        const [onboardRows] = await pool.query(
          'SELECT base_salary, total_salary FROM employee_onboarding WHERE id = ?',
          [id]
        );
        if (onboardRows.length > 0) {
          salary = { 
            base_salary: onboardRows[0].base_salary,
            total_salary: onboardRows[0].total_salary
          };
          console.log(`✅ [Financial Summary] Found salary in onboarding: base=${salary.base_salary}, total=${salary.total_salary}`);
        }
      }
    } catch (err) {
      console.warn(`⚠️ [Financial Summary] Error querying salary:`, err.message);
    }

    // Get allowances from employee_allowances table
    let allowances = [];
    let totalAllowances = 0;
    try {
      const [allowRows] = await pool.query(
        'SELECT allowance_name, allowance_amount FROM employee_allowances WHERE employee_id = ?',
        [empId]
      );
      allowances = allowRows || [];
      totalAllowances = allowances.reduce((sum, a) => sum + (parseFloat(a.allowance_amount) || 0), 0);
      console.log(`✅ [Financial Summary] Found ${allowances.length} allowances, total=${totalAllowances}`);
    } catch (err) {
      console.warn(`⚠️ [Financial Summary] Error querying allowances:`, err.message);
    }

    // Get bank account info (masked)
    let bankAccount = null;
    try {
      // Try both ID formats since empId might be the ID or the employee_id string
      const [baRows] = await pool.query(
        `SELECT
           id AS bank_account_id,
           CONCAT('****', SUBSTRING(account_number, -4)) AS account_number_masked,
           account_title_name,
           bank_name,
           account_type
         FROM employee_bank_accounts
         WHERE id = ? OR employee_id = ?
         LIMIT 1`,
        [id, empId]
      );
      if (baRows.length > 0) {
        bankAccount = baRows[0];
        console.log(`✅ [Financial Summary] Found bank account: ${bankAccount.bank_name}`);
      }
    } catch (err) {
      console.warn(`⚠️ [Financial Summary] Error querying bank accounts:`, err.message);
    }

    // Build response
    const result = {
      id: empId,
      employee_id: empId,
      name: emp.name,
      base_salary: salary.base_salary ? parseFloat(salary.base_salary) : null,
      total_salary: salary.total_salary ? parseFloat(salary.total_salary) : null,
      allowances: allowances.map(a => ({
        name: a.allowance_name,
        amount: parseFloat(a.allowance_amount)
      })),
      total_allowances: totalAllowances,
      allowances_count: allowances.length,
      bank_account: bankAccount || null
    };

    console.log(`✅ [Financial Summary] Returning complete financial summary`);
    return res.status(200).json({
      success: true,
      message: 'Financial summary retrieved successfully',
      data: result
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
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);

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
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);

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
      emergency_contact_phone,
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
      (employee_id, bio, emergency_contact_phone,
       preferred_contact_method, linkedin_url, github_url, portfolio_url, skills_json, 
       certifications_json, banner_url, documents_json, resources_json, next_review_date, 
       review_cycle, preferred_work_location, work_mode_preference, total_work_experience_years)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id, bio, emergency_contact_phone,
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
    
    // Fields that belong to employee_onboarding table
    const onboardingFields = ['email', 'phone', 'address', 'emergency_contact', 'emergency_contact_relation'];
    
    // Fields that belong to employee_profiles table
    const profileFields = [
      'bio', 'emergency_contact_phone',
      'preferred_contact_method', 'linkedin_url', 'github_url', 'portfolio_url',
      'skills_json', 'certifications_json', 'banner_url', 'documents_json', 'resources_json',
      'next_review_date', 'review_cycle', 'preferred_work_location', 'work_mode_preference',
      'total_work_experience_years'
    ];
    
    // Separate updates by table
    const onboardingUpdates = {};
    const profileUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (onboardingFields.includes(key)) {
        onboardingUpdates[key] = updates[key];
      } else if (profileFields.includes(key)) {
        profileUpdates[key] = updates[key];
      }
    });
    
    let totalAffected = 0;
    
    // Update employee_onboarding if there are onboarding fields
    if (Object.keys(onboardingUpdates).length > 0) {
      const onboardingUpdateFields = [];
      const onboardingValues = [];
      
      Object.keys(onboardingUpdates).forEach(key => {
        onboardingUpdateFields.push(`${key} = ?`);
        onboardingValues.push(onboardingUpdates[key]);
      });
      
      onboardingValues.push(id);
      onboardingValues.push(id);
      
      const [onboardingResult] = await pool.query(
        `UPDATE employee_onboarding SET ${onboardingUpdateFields.join(', ')}, updated_at = NOW() WHERE id = ? OR employee_id = ?`,
        onboardingValues
      );
      
      totalAffected += onboardingResult.affectedRows;
    }
    
    // Also store JSON fields in employee_onboarding as fallback (for skills_json, documents_json, etc.)
    const jsonFieldsForOnboarding = {};
    Object.keys(profileUpdates).forEach(key => {
      if (['skills_json', 'documents_json', 'resources_json', 'certifications_json'].includes(key)) {
        jsonFieldsForOnboarding[key] = profileUpdates[key];
      }
    });
    
    if (Object.keys(jsonFieldsForOnboarding).length > 0) {
      const onboardingJsonFields = [];
      const onboardingJsonValues = [];
      
      Object.keys(jsonFieldsForOnboarding).forEach(key => {
        onboardingJsonFields.push(`${key} = ?`);
        // Stringify JSON fields for storage
        const value = jsonFieldsForOnboarding[key];
        if (typeof value === 'string') {
          onboardingJsonValues.push(value);
        } else if (value) {
          onboardingJsonValues.push(JSON.stringify(value));
        } else {
          onboardingJsonValues.push(null);
        }
      });
      
      onboardingJsonValues.push(id);
      onboardingJsonValues.push(id);
      
      try {
        const [jsonResult] = await pool.query(
          `UPDATE employee_onboarding SET ${onboardingJsonFields.join(', ')}, updated_at = NOW() WHERE id = ? OR employee_id = ?`,
          onboardingJsonValues
        );
        totalAffected += jsonResult.affectedRows;
      } catch (err) {
        // Log but don't fail - columns might not exist yet
        console.warn('Could not update JSON fields in employee_onboarding:', err.message);
        // Non-fatal, continue
      }
    }
    
    // Update employee_profiles if there are profile fields
    if (Object.keys(profileUpdates).length > 0) {
      try {
        const profileUpdateFields = [];
        const profileValues = [];
        
        Object.keys(profileUpdates).forEach(key => {
          profileUpdateFields.push(`${key} = ?`);
          // Handle JSON fields - they might come as string or object
          if (['skills_json', 'certifications_json', 'documents_json', 'resources_json'].includes(key)) {
            const value = profileUpdates[key];
            if (typeof value === 'string') {
              // Already stringified by frontend
              profileValues.push(value);
            } else if (value) {
              // Object - stringify it
              profileValues.push(JSON.stringify(value));
            } else {
              profileValues.push(null);
            }
          } else {
            profileValues.push(profileUpdates[key]);
          }
        });
        
        profileValues.push(id);
        profileValues.push(id);
        
        const [profileResult] = await pool.query(
          `UPDATE employee_profiles SET ${profileUpdateFields.join(', ')}, updated_at = NOW() WHERE employee_id = ? OR id = ?`,
          profileValues
        );
        
        totalAffected += profileResult.affectedRows;
      } catch (err) {
        // If employee_profiles table doesn't exist, log warning and continue
        // Profile data will be stored/retrieved from employee_onboarding instead
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
          console.warn('employee_profiles table missing, storing profile fields in employee_onboarding instead');
          // Data already stored in employee_onboarding above, so just continue
        } else {
          throw err;
        }
      }
    }
    
    // Check if employee exists (even if no updates were applied to profile tables)
    const [checkOnboarding] = await pool.query(
      'SELECT id FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );
    
    if (checkOnboarding.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Fetch updated profile data from both tables
    const [onboarding] = await pool.query(
      'SELECT * FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );
    
    let profiles = [];
    try {
      const [pRows] = await pool.query(
        'SELECT * FROM employee_profiles WHERE employee_id = ? OR id = ?',
        [id, id]
      );
      profiles = pRows;
    } catch (err) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('employee_profiles table missing, continuing without it');
        profiles = [];
      } else {
        throw err;
      }
    }

    const onboardingData = onboarding[0] || {};
    const profileData = profiles[0] || {};

    const mergedProfile = {
      id: onboardingData.id || profileData.id,
      employee_id: onboardingData.employee_id || profileData.employee_id,
      name: onboardingData.name || profileData.name || (profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''}` : null),
      full_name: onboardingData.name || profileData.full_name || (profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''}` : null),
      email: onboardingData.email,
      phone: onboardingData.phone,
      address: onboardingData.address,
      department: onboardingData.department,
      designation: profileData.designation || onboardingData.designation || null,
      join_date: onboardingData.join_date,
      dob: onboardingData.dob,
      profile_photo: profileData.profile_photo || onboardingData.profile_photo,
      banner_url: profileData.banner_url,
      bio: profileData.bio,
      emergency_contact_phone: profileData.emergency_contact_phone || onboardingData.emergency_contact,
      linkedin_url: profileData.linkedin_url,
      github_url: profileData.github_url,
      portfolio_url: profileData.portfolio_url,
      documents_json: profileData.documents_json,
      resources_json: profileData.resources_json,
      employment_status: onboardingData.employment_status || profileData.employment_status || null,
      employee_type: profileData.employee_type || onboardingData.employment_status || null,
      skills_json: profileData.skills_json,
      certifications_json: profileData.certifications_json,
      preferred_contact_method: profileData.preferred_contact_method,
      next_review_date: profileData.next_review_date,
      review_cycle: profileData.review_cycle,
      preferred_work_location: profileData.preferred_work_location,
      work_mode_preference: profileData.work_mode_preference,
      total_work_experience_years: profileData.total_work_experience_years
    };
    
    return res.status(200).json({
      success: true,
      message: 'Employee profile updated successfully',
      data: mergedProfile
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

    // Update documents_json in database (use employee_onboarding table)
    const [updateResult] = await pool.query(
      'UPDATE employee_onboarding SET documents_json = ?, updated_at = NOW() WHERE id = ? OR employee_id = ?',
      [JSON.stringify(uploadedDocs), id, id]
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

/**
 * Upload profile photo to Cloudinary
 */
const uploadProfilePhoto = async (req, res) => {
  try {
    const { id } = req.params; // This is the employee ID (numeric or string)
    const { image_base64 } = req.body;

    if (!image_base64) {
      return res.status(400).json({
        success: false,
        message: 'image_base64 is required'
      });
    }

    // Upload to Cloudinary with optimizations
    const result = await cloudinary.uploader.upload(image_base64, {
      folder: `employee_profiles/${id}/photos`,
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good', fetch_format: 'auto' }
      ]
    });

    if (!result || !result.secure_url) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload profile photo to Cloudinary'
      });
    }

    // First, check if employee exists in employee_onboarding
    const [onboardingRows] = await pool.query(
      'SELECT id FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );

    // Update profile_photo in employee_onboarding if found
    let onboardingUpdated = false;
    if (onboardingRows.length > 0) {
      try {
        const [onboardingUpdate] = await pool.query(
          'UPDATE employee_onboarding SET profile_photo = ?, updated_at = NOW() WHERE id = ? OR employee_id = ?',
          [result.secure_url, id, id]
        );
        onboardingUpdated = onboardingUpdate.affectedRows > 0;
        console.log(`Updated employee_onboarding: ${onboardingUpdate.affectedRows} rows`);
      } catch (err) {
        console.warn('Error updating employee_onboarding:', err.message);
      }
    }

    // Update or insert into employee_profiles
    let profileUpdated = false;
    try {
      const [profileUpdate] = await pool.query(
        'UPDATE employee_profiles SET profile_photo = ?, updated_at = NOW() WHERE employee_id = ? OR id = ?',
        [result.secure_url, id, id]
      );
      
      if (profileUpdate.affectedRows > 0) {
        profileUpdated = true;
        console.log(`Updated employee_profiles: ${profileUpdate.affectedRows} rows`);
      } else {
        // If no profile exists, create one with the profile_photo set
        try {
          const [insertResult] = await pool.query(
            `INSERT INTO employee_profiles (employee_id, profile_photo, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())`,
            [id, result.secure_url]
          );
          profileUpdated = insertResult.affectedRows > 0;
          console.log(`Inserted to employee_profiles: ${insertResult.affectedRows} rows`);
        } catch (insertErr) {
          console.warn('Error inserting to employee_profiles:', insertErr.message);
        }
      }
    } catch (err) {
      console.warn('Error updating employee_profiles:', err.message);
    }

    if (!onboardingUpdated && !profileUpdated) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found in profile tables'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profile_photo_url: result.secure_url,
        cloudinary_public_id: result.public_id,
        width: result.width,
        height: result.height,
        size: result.bytes,
        updated_tables: {
          onboarding: onboardingUpdated,
          profiles: profileUpdated
        }
      }
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload profile photo',
      error: error.message
    });
  }
};

const getEmployeeResources = async (req, res) => {
  try {
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);

    // Same approach as getProfileSummary - get from employee_profiles (if exists)
    let profiles = [];
    try {
      const [pRows] = await pool.query(
        'SELECT * FROM employee_profiles WHERE employee_id = ? OR id = ?',
        [id, id]
      );
      profiles = pRows;
    } catch (err) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('employee_profiles table missing, continuing without it');
        profiles = [];
      } else {
        throw err;
      }
    }

    let resourcesArray = [];

    if (profiles && profiles.length > 0 && profiles[0].resources_json) {
      try {
        let parsed = JSON.parse(profiles[0].resources_json);
        
        // If the result is a string (double-escaped), parse again
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        
        // If it's still a string (triple-escaped), parse once more
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        
        let parsedArray = Array.isArray(parsed) ? parsed : [];
        // Filter out empty objects / entries with no meaningful data
        parsedArray = parsedArray.filter(item => item && Object.values(item).some(v => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)));
        
        // Transform old format equipment list to display format
        if (parsedArray.length > 0 && parsedArray[0].laptop !== undefined) {
          // Old format detected - build display-friendly resources
          resourcesArray = [];
          const oldData = parsedArray[0];
          
          // List of equipment to check
          const equipment = [
            { field: 'laptop', label: 'Laptop', serial: oldData.laptop_serial },
            { field: 'charger', label: 'Charger', serial: oldData.charger_serial },
            { field: 'mouse', label: 'Mouse', serial: oldData.mouse_serial },
            { field: 'keyboard', label: 'Keyboard', serial: oldData.keyboard_serial },
            { field: 'monitor', label: 'Monitor', serial: oldData.monitor_serial },
            { field: 'mobile', label: 'Mobile', serial: oldData.mobile_serial }
          ];
          
          // Add allocated items
          equipment.forEach((item, idx) => {
            if (oldData[item.field]) {
              resourcesArray.push({
                id: idx + 1,
                employee_id: oldData.employee_id || id,
                resource_name: item.label,
                title: item.label,
                resource_serial: item.serial || 'N/A',
                serial: item.serial || 'N/A',
                allocated_date: oldData.allocated_date,
                created_at: oldData.allocated_date,
                issuedAt: oldData.allocated_date ? new Date(oldData.allocated_date).toISOString().split('T')[0] : null
              });
            }
          });
        } else {
          resourcesArray = parsedArray;
        }
      } catch (parseErr) {
        // Silently fail and return empty array
        resourcesArray = [];
      }
    }

    // If no resources in JSON, try employee_dynamic_resources table
    if (resourcesArray.length === 0) {
      const [dynamicResources] = await pool.query(
        `SELECT id, employee_id, resource_name, resource_serial, created_at
         FROM employee_dynamic_resources
         WHERE employee_id = ? AND COALESCE(TRIM(resource_name), '') != ''`,
        [id]
      );
      resourcesArray = (dynamicResources || []).filter(r => r && (r.resource_name || r.resource_serial));
    }

    const successMessage = resourcesArray.length === 0 ? 'No resources allocated' : 'Employee resources retrieved successfully';

    return res.status(200).json({
      success: true,
      message: successMessage,
      data: resourcesArray
    });
  } catch (error) {
    console.error('Error fetching employee resources:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee resources',
      error: error.message
    });
  }
};

/**
 * Get employee skills (technical and soft) from skills_json field
 * Supports both JSON storage and dedicated employee_skills table
 */
const getEmployeeSkills = async (req, res) => {
  try {
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);

    // First, try to get skills from employee_onboarding.skills_json
    const [onboarding] = await pool.query(
      'SELECT skills_json FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );

    let skillsData = {
      technical: [],
      soft: []
    };

    // If skills_json exists in onboarding, parse and use it
    if (onboarding && onboarding.length > 0 && onboarding[0].skills_json) {
      try {
        let parsed = onboarding[0].skills_json;
        
        // Handle JSON string or already-parsed object
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        
        // Ensure we have the correct structure
        skillsData = {
          technical: Array.isArray(parsed?.technical) ? parsed.technical : [],
          soft: Array.isArray(parsed?.soft) ? parsed.soft : []
        };
      } catch (parseErr) {
        console.warn('Could not parse skills_json:', parseErr);
        skillsData = { technical: [], soft: [] };
      }
    }

    // If no skills found in JSON, try dedicated employee_skills table
    if (skillsData.technical.length === 0 && skillsData.soft.length === 0) {
      try {
        const [dbSkills] = await pool.query(
          `SELECT skill_name, skill_type FROM employee_skills 
           WHERE employee_id = ? 
           ORDER BY skill_type, skill_name`,
          [id]
        );

        if (dbSkills && dbSkills.length > 0) {
          dbSkills.forEach(skill => {
            if (skill.skill_type === 'technical') {
              skillsData.technical.push(skill.skill_name);
            } else if (skill.skill_type === 'soft') {
              skillsData.soft.push(skill.skill_name);
            }
          });
        }
      } catch (err) {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
          console.warn('employee_skills table missing, using JSON storage only');
        } else {
          throw err;
        }
      }
    }

    const successMessage = 
      (skillsData.technical.length === 0 && skillsData.soft.length === 0) 
        ? 'No skills added yet' 
        : 'Employee skills retrieved successfully';

    return res.status(200).json({
      success: true,
      message: successMessage,
      data: skillsData
    });
  } catch (error) {
    console.error('Error fetching employee skills:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee skills',
      error: error.message
    });
  }
};

/**
 * Get employee social links
 */
const getEmployeeSocialLinks = async (req, res) => {
  try {
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);

    console.log(`\n📖 [Get Social Links] Employee ID: ${id}`);

    // Try employee_social_links table first
    try {
      console.log(`📖 [Get Social Links] Querying employee_social_links table...`);
      const [links] = await pool.query(
        'SELECT platform, url, is_verified FROM employee_social_links WHERE employee_id = ?',
        [id]
      );

      console.log(`📖 [Get Social Links] Found ${links.length} social links in table`);

      if (links.length > 0) {
        const socialLinks = {};
        links.forEach(link => {
          socialLinks[link.platform] = {
            url: link.url,
            is_verified: link.is_verified
          };
          console.log(`  ✓ ${link.platform}: ${link.url}`);
        });

        console.log(`✅ [Get Social Links] Returning ${links.length} links from table`);
        return res.status(200).json({
          success: true,
          message: 'Employee social links retrieved successfully',
          data: socialLinks
        });
      }
      console.log(`⚠️ [Get Social Links] No links found in table, trying JSON fallback...`);
    } catch (err) {
      console.warn(`⚠️ [Get Social Links] Table error:`, err.message);
      if (err && err.code !== 'ER_NO_SUCH_TABLE') {
        throw err;
      }
    }

    // Fallback to JSON column in employee_onboarding
    console.log(`📋 [Get Social Links] Querying JSON column in employee_onboarding...`);
    const [onboarding] = await pool.query(
      'SELECT social_links_json FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );

    if (onboarding.length === 0) {
      console.error(`❌ [Get Social Links] Employee not found - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    let socialLinks = {};
    if (onboarding[0].social_links_json) {
      try {
        socialLinks = typeof onboarding[0].social_links_json === 'string'
          ? JSON.parse(onboarding[0].social_links_json)
          : onboarding[0].social_links_json;
        console.log(`✅ [Get Social Links] Returning links from JSON:`, socialLinks);
      } catch (e) {
        console.warn('Failed to parse social_links_json:', e);
      }
    } else {
      console.log(`📖 [Get Social Links] No JSON data found`);
    }

    return res.status(200).json({
      success: true,
      message: 'Employee social links retrieved successfully',
      data: socialLinks
    });
  } catch (error) {
    console.error('❌ [Get Social Links] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee social links',
      error: error.message
    });
  }
};

/**
 * Get employee required documents
 */
const getEmployeeRequiredDocuments = async (req, res) => {
  try {
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);

    console.log(`\n📖 [Get Documents] Employee ID: ${id}`);

    // Try employee_required_documents table first
    try {
      console.log(`📖 [Get Documents] Querying employee_required_documents table...`);
      const [documents] = await pool.query(
        `SELECT id, document_type, document_name, document_url, status, expiry_date, uploaded_at 
         FROM employee_required_documents 
         WHERE employee_id = ? 
         AND document_url IS NOT NULL 
         AND TRIM(document_url) != '' 
         AND status != 'pending'`,
        [id]
      );

      console.log(`📖 [Get Documents] Found ${documents.length} uploaded documents in table`);

      if (documents.length > 0) {
        documents.forEach(doc => {
          console.log(`  ✓ ${doc.document_type}: ${doc.document_name} (${doc.status})`);
        });
        console.log(`✅ [Get Documents] Returning ${documents.length} documents from table`);
        return res.status(200).json({
          success: true,
          message: 'Employee required documents retrieved successfully',
          data: documents
        });
      }
      console.log(`✅ [Get Documents] No uploaded documents found - returning empty array`);
      return res.status(200).json({
        success: true,
        message: 'No uploaded documents found',
        data: []
      });
    } catch (err) {
      console.warn(`⚠️ [Get Documents] Table error:`, err.message);
      if (err && err.code !== 'ER_NO_SUCH_TABLE') {
        throw err;
      }
    }

    // Fallback to JSON column in employee_onboarding
    console.log(`📋 [Get Documents] Querying JSON column in employee_onboarding...`);
    const [onboarding] = await pool.query(
      'SELECT required_documents_json FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );

    if (onboarding.length === 0) {
      console.error(`❌ [Get Documents] Employee not found - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    let documents = [];
    if (onboarding[0].required_documents_json) {
      try {
        documents = typeof onboarding[0].required_documents_json === 'string'
          ? JSON.parse(onboarding[0].required_documents_json)
          : onboarding[0].required_documents_json;
        console.log(`✅ [Get Documents] Returning ${documents.length} documents from JSON`);
      } catch (e) {
        console.warn('Failed to parse required_documents_json:', e);
      }
    } else {
      console.log(`📖 [Get Documents] No JSON data found`);
    }

    return res.status(200).json({
      success: true,
      message: 'Employee required documents retrieved successfully',
      data: documents
    });
  } catch (error) {
    console.error('❌ [Get Documents] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee required documents',
      error: error.message
    });
  }
};

/**
 * Get employee achievements
 */
const getEmployeeAchievements = async (req, res) => {
  try {
    let { id } = req.params;

    // Resolve to correct employee_onboarding.id (guards against ID-collision with user_as_employees)
    id = await resolveEmployeeId(id);

    console.log(`\n📖 [Get Achievements] Employee ID: ${id}`);

    // Try employee_achievements table first
    try {
      console.log(`📖 [Get Achievements] Querying employee_achievements table...`);
      const [achievements] = await pool.query(
        'SELECT id, achievement_type, title, description, issuer_organization, issue_date, expiry_date, credential_url, attachment_url, is_verified FROM employee_achievements WHERE employee_id = ?',
        [id]
      );

      console.log(`📖 [Get Achievements] Found ${achievements.length} achievements in table`);

      if (achievements.length > 0) {
        achievements.forEach(ach => {
          console.log(`  ✓ ${ach.achievement_type}: ${ach.title}`);
        });
        console.log(`✅ [Get Achievements] Returning ${achievements.length} achievements from table`);
        return res.status(200).json({
          success: true,
          message: 'Employee achievements retrieved successfully',
          data: achievements
        });
      }
      console.log(`⚠️ [Get Achievements] No achievements found in table, trying JSON fallback...`);
    } catch (err) {
      console.warn(`⚠️ [Get Achievements] Table error:`, err.message);
      if (err && err.code !== 'ER_NO_SUCH_TABLE') {
        throw err;
      }
    }

    // Fallback to JSON column in employee_onboarding
    console.log(`📋 [Get Achievements] Querying JSON column in employee_onboarding...`);
    const [onboarding] = await pool.query(
      'SELECT achievements_json FROM employee_onboarding WHERE id = ? OR employee_id = ?',
      [id, id]
    );

    if (onboarding.length === 0) {
      console.error(`❌ [Get Achievements] Employee not found - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    let achievements = [];
    if (onboarding[0].achievements_json) {
      try {
        achievements = typeof onboarding[0].achievements_json === 'string'
          ? JSON.parse(onboarding[0].achievements_json)
          : onboarding[0].achievements_json;
        console.log(`✅ [Get Achievements] Returning ${achievements.length} achievements from JSON`);
      } catch (e) {
        console.warn('Failed to parse achievements_json:', e);
      }
    } else {
      console.log(`📖 [Get Achievements] No JSON data found`);
    }

    return res.status(200).json({
      success: true,
      message: 'Employee achievements retrieved successfully',
      data: achievements
    });
  } catch (error) {
    console.error('❌ [Get Achievements] Error:', error);
    console.error('Error fetching employee achievements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee achievements',
      error: error.message
    });
  }
};

/**
 * Update employee social links
 */
const updateEmployeeSocialLinks = async (req, res) => {
  try {
    const { id } = req.params;
    const { socialLinks } = req.body;

    console.log(`\n📝 [Social Links Update] Employee ID: ${id}`);
    console.log(`📝 [Social Links Update] Received Data:`, JSON.stringify(socialLinks, null, 2));

    if (!socialLinks) {
      console.error('❌ [Social Links Update] Missing socialLinks in request body');
      return res.status(400).json({
        success: false,
        message: 'Social links data is required'
      });
    }

    // Try updating in employee_social_links table first
    try {
      console.log(`🔄 [Social Links Update] Attempting to update employee_social_links table...`);
      
      // Delete old entries
      const [deleteResult] = await pool.query('DELETE FROM employee_social_links WHERE employee_id = ?', [id]);
      console.log(`🗑️  [Social Links Update] Deleted ${deleteResult.affectedRows} old entries`);

      // Insert new entries
      let insertCount = 0;
      for (const [platform, data] of Object.entries(socialLinks)) {
        const url = data?.url || data;
        if (url && typeof url === 'string' && url.trim()) {
          console.log(`➕ [Social Links Update] Inserting ${platform}: ${url}`);
          await pool.query(
            'INSERT INTO employee_social_links (employee_id, platform, url, is_verified) VALUES (?, ?, ?, ?)',
            [id, platform, url, data.is_verified || 0]
          );
          insertCount++;
        }
      }
      console.log(`✅ [Social Links Update] Successfully inserted ${insertCount} social links`);

      return res.status(200).json({
        success: true,
        message: 'Social links updated successfully',
        data: socialLinks
      });
    } catch (err) {
      console.warn(`⚠️  [Social Links Update] employee_social_links table error:`, err.message);
      if (err && err.code !== 'ER_NO_SUCH_TABLE') {
        throw err;
      }
      console.log(`📋 [Social Links Update] Falling back to JSON storage in employee_onboarding...`);
    }

    // Fallback to JSON column in employee_onboarding
    const socialLinksJson = JSON.stringify(socialLinks);
    console.log(`💾 [Social Links Update] Storing as JSON in employee_onboarding:`, socialLinksJson);
    
    const [result] = await pool.query(
      'UPDATE employee_onboarding SET social_links_json = ? WHERE id = ? OR employee_id = ?',
      [socialLinksJson, id, id]
    );

    console.log(`✅ [Social Links Update] Updated ${result.affectedRows} rows in employee_onboarding`);

    if (result.affectedRows === 0) {
      console.error(`❌ [Social Links Update] Employee not found - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Social links updated successfully',
      data: socialLinks
    });
  } catch (error) {
    console.error('❌ [Social Links Update] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update social links',
      error: error.message
    });
  }
};

/**
 * Update employee required documents
 */
const updateEmployeeRequiredDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { requiredDocuments } = req.body;

    console.log(`\n📄 [Required Documents Update] Employee ID: ${id}`);
    console.log(`📄 [Required Documents Update] Received Data:`, JSON.stringify(requiredDocuments, null, 2));

    if (!Array.isArray(requiredDocuments)) {
      console.error('❌ [Required Documents Update] requiredDocuments is not an array');
      return res.status(400).json({
        success: false,
        message: 'Required documents must be an array'
      });
    }

    console.log(`📄 [Required Documents Update] Total documents to process: ${requiredDocuments.length}`);

    // Try updating in employee_required_documents table first
    try {
      console.log(`🔄 [Required Documents Update] Attempting to update employee_required_documents table...`);
      
      // Delete old entries
      const [deleteResult] = await pool.query('DELETE FROM employee_required_documents WHERE employee_id = ?', [id]);
      console.log(`🗑️  [Required Documents Update] Deleted ${deleteResult.affectedRows} old entries`);

      // Insert new entries
      let insertCount = 0;
      for (const doc of requiredDocuments) {
        console.log(`➕ [Required Documents Update] Inserting:`, doc);
        await pool.query(
          'INSERT INTO employee_required_documents (employee_id, document_type, document_name, document_url, status, expiry_date) VALUES (?, ?, ?, ?, ?, ?)',
          [id, doc.document_type || doc.type, doc.document_name || doc.name, doc.document_url || doc.url, doc.status || 'pending', doc.expiry_date || null]
        );
        insertCount++;
      }
      console.log(`✅ [Required Documents Update] Successfully inserted ${insertCount} documents`);

      return res.status(200).json({
        success: true,
        message: 'Required documents updated successfully',
        data: requiredDocuments
      });
    } catch (err) {
      console.warn(`⚠️  [Required Documents Update] employee_required_documents table error:`, err.message);
      if (err && err.code !== 'ER_NO_SUCH_TABLE') {
        throw err;
      }
      console.log(`📋 [Required Documents Update] Falling back to JSON storage in employee_onboarding...`);
    }

    // Fallback to JSON column in employee_onboarding
    const docsJson = JSON.stringify(requiredDocuments);
    console.log(`💾 [Required Documents Update] Storing as JSON in employee_onboarding`);
    
    const [result] = await pool.query(
      'UPDATE employee_onboarding SET required_documents_json = ? WHERE id = ? OR employee_id = ?',
      [docsJson, id, id]
    );

    console.log(`✅ [Required Documents Update] Updated ${result.affectedRows} rows in employee_onboarding`);

    if (result.affectedRows === 0) {
      console.error(`❌ [Required Documents Update] Employee not found - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Required documents updated successfully',
      data: requiredDocuments
    });
  } catch (error) {
    console.error('❌ [Required Documents Update] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update required documents',
      error: error.message
    });
  }
};

/**
 * Update employee achievements
 */
const updateEmployeeAchievements = async (req, res) => {
  try {
    const { id } = req.params;
    const { achievements } = req.body;

    console.log(`\n🏆 [Achievements Update] Employee ID: ${id}`);
    console.log(`🏆 [Achievements Update] Received Data:`, JSON.stringify(achievements, null, 2));

    if (!Array.isArray(achievements)) {
      console.error('❌ [Achievements Update] achievements is not an array');
      return res.status(400).json({
        success: false,
        message: 'Achievements must be an array'
      });
    }

    // Helper function to convert ISO date to YYYY-MM-DD format
    const formatDateForMySQL = (dateStr) => {
      if (!dateStr) return null;
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
      } catch (err) {
        return null;
      }
    };

    console.log(`🏆 [Achievements Update] Total achievements to process: ${achievements.length}`);

    // Try updating in employee_achievements table first
    try {
      console.log(`🔄 [Achievements Update] Attempting to update employee_achievements table...`);
      
      // Delete old entries
      const [deleteResult] = await pool.query('DELETE FROM employee_achievements WHERE employee_id = ?', [id]);
      console.log(`🗑️  [Achievements Update] Deleted ${deleteResult.affectedRows} old entries`);

      // Insert new entries
      let insertCount = 0;
      for (const ach of achievements) {
        console.log(`➕ [Achievements Update] Inserting:`, ach);
        // Convert ISO dates to YYYY-MM-DD format for MySQL
        const issueDate = formatDateForMySQL(ach.issue_date);
        const expiryDate = formatDateForMySQL(ach.expiry_date);
        
        await pool.query(
          'INSERT INTO employee_achievements (employee_id, achievement_type, title, description, issuer_organization, issue_date, expiry_date, credential_url, attachment_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, ach.achievement_type || 'award', ach.title, ach.description || null, ach.issuer_organization || null, issueDate, expiryDate, ach.credential_url || null, ach.attachment_url || null]
        );
        insertCount++;
      }
      console.log(`✅ [Achievements Update] Successfully inserted ${insertCount} achievements`);

      return res.status(200).json({
        success: true,
        message: 'Achievements updated successfully',
        data: achievements
      });
    } catch (err) {
      console.warn(`⚠️  [Achievements Update] employee_achievements table error:`, err.message);
      if (err && err.code !== 'ER_NO_SUCH_TABLE') {
        throw err;
      }
      console.log(`📋 [Achievements Update] Falling back to JSON storage in employee_onboarding...`);
    }

    // Fallback to JSON column in employee_onboarding
    const achJson = JSON.stringify(achievements);
    console.log(`💾 [Achievements Update] Storing as JSON in employee_onboarding`);
    
    const [result] = await pool.query(
      'UPDATE employee_onboarding SET achievements_json = ? WHERE id = ? OR employee_id = ?',
      [achJson, id, id]
    );

    console.log(`✅ [Achievements Update] Updated ${result.affectedRows} rows in employee_onboarding`);

    if (result.affectedRows === 0) {
      console.error(`❌ [Achievements Update] Employee not found - ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Achievements updated successfully',
      data: achievements
    });
  } catch (error) {
    console.error('❌ [Achievements Update] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update achievements',
      error: error.message
    });
  }
};

/**
 * Upload required documents to local storage
 * Stores files in Backend/uploads/documents/{employeeId}_{docType}_{timestamp}/
 */
const uploadRequiredDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { documents } = req.body;

    console.log(`\n📤 [Document Upload] Employee ID: ${id}`);
    console.log(`📤 [Document Upload] Received ${documents.length} documents`);

    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Documents array is required'
      });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`✅ Created uploads directory: ${uploadsDir}`);
    }

    const uploadedDocs = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2026-02-05T17-06-09

    for (const doc of documents) {
      if (!doc.base64 || !doc.document_type) {
        console.warn(`⚠️  Skipping document - missing base64 or type`);
        continue;
      }

      try {
        // Create folder for this document: {id}_{docType}_{timestamp}
        const folderName = `${id}_${doc.document_type}_${timestamp}`;
        const docFolder = path.join(uploadsDir, folderName);
        
        if (!fs.existsSync(docFolder)) {
          fs.mkdirSync(docFolder, { recursive: true });
        }

        // Generate filename
        const extension = doc.fileName ? path.extname(doc.fileName) : '.pdf';
        const fileName = `${doc.document_type}_${Date.now()}${extension}`;
        const filePath = path.join(docFolder, fileName);

        // Decode base64 and save file
        const base64Data = doc.base64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);

        // Store relative path for database
        const relativePath = `uploads/documents/${folderName}/${fileName}`;

        console.log(`✅ Saved document: ${relativePath}`);

        uploadedDocs.push({
          id: uploadedDocs.length + 1,
          employee_id: id,
          document_type: doc.document_type,
          document_name: doc.document_name || doc.document_type,
          document_url: relativePath,
          status: 'submitted',
          expiry_date: doc.expiry_date || null,
          uploaded_at: new Date()
        });
      } catch (uploadError) {
        console.error(`❌ Error saving document "${doc.document_type}":`, uploadError.message);
      }
    }

    if (uploadedDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No documents were successfully uploaded'
      });
    }

    // Update database with document URLs
    try {
      // Insert new documents (replace on duplicate to allow updates too)
      for (const doc of uploadedDocs) {
        await pool.query(
          `INSERT INTO employee_required_documents 
           (employee_id, document_type, document_name, document_url, status, uploaded_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())
           ON DUPLICATE KEY UPDATE 
           document_url = VALUES(document_url), 
           status = VALUES(status), 
           uploaded_at = NOW(), 
           updated_at = NOW()`,
          [id, doc.document_type, doc.document_name, doc.document_url, doc.status]
        );
      }
      console.log(`✅ Saved ${uploadedDocs.length} documents to database`);
    } catch (dbError) {
      console.error(`⚠️  Database error:`, dbError.message);
      // Continue even if database fails - files are saved locally
    }

    return res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedDocs.length} document(s)`,
      data: uploadedDocs
    });
  } catch (error) {
    console.error('❌ [Document Upload] Error:', error);
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
  uploadDocumentsToCloudinary,
  uploadProfilePhoto,
  getEmployeeResources,
  getEmployeeSkills,
  getEmployeeSocialLinks,
  getEmployeeRequiredDocuments,
  getEmployeeAchievements,
  updateEmployeeSocialLinks,
  updateEmployeeRequiredDocuments,
  uploadRequiredDocuments,
  updateEmployeeAchievements
};
