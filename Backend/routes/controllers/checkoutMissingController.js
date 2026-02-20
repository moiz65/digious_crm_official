/**
 * Checkout Missing Controller
 * Manages employees who forget to check out
 * Created: February 16, 2026
 */

const pool = require('../../config/database');

/**
 * Process missing checkouts automatically
 * This should be called after 9:00 AM daily (can be triggered by cron or manual)
 */
exports.processMissingCheckouts = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔍 Processing missing checkouts...');
    
    // Call the stored procedure
    const [results] = await connection.query('CALL ProcessMissingCheckouts()');
    
    const summary = results[0][0];
    
    console.log(`✅ Processed ${summary.records_moved} missing checkout records`);
    
    res.status(200).json({
      success: true,
      message: `Successfully processed missing checkouts`,
      data: {
        recordsMoved: summary.records_moved,
        processedAt: summary.processed_at
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing missing checkouts:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing missing checkouts',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all pending checkout-missing records
 * For HR dashboard
 */
exports.getPendingCheckoutMissing = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { page = 1, limit = 50, employee_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['is_resolved = 0'];
    let params = [];
    
    if (employee_id) {
      whereConditions.push('employee_id = ?');
      params.push(employee_id);
    }
    
    if (date_from) {
      whereConditions.push('attendance_date >= ?');
      params.push(date_from);
    }
    
    if (date_to) {
      whereConditions.push('attendance_date <= ?');
      params.push(date_to);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM Employee_Checkout_Missing ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    // Get paginated results
    const [records] = await connection.query(
      `SELECT 
        id,
        original_attendance_id,
        employee_id,
        email,
        name,
        attendance_date,
        check_in_time,
        check_out_time,
        status,
        total_breaks_taken,
        total_break_duration_minutes,
        missing_reason,
        employee_explanation,
        hr_notes,
        is_resolved,
        moved_from_attendance_at,
        created_at,
        updated_at
      FROM Employee_Checkout_Missing 
      ${whereClause}
      ORDER BY attendance_date DESC, employee_id ASC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting pending checkout missing:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving checkout missing records',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all resolved checkout-missing records
 * For history/audit trail
 */
exports.getResolvedCheckoutMissing = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { page = 1, limit = 50, employee_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = ['is_resolved = 1'];
    let params = [];
    
    if (employee_id) {
      whereConditions.push('employee_id = ?');
      params.push(employee_id);
    }
    
    if (date_from) {
      whereConditions.push('attendance_date >= ?');
      params.push(date_from);
    }
    
    if (date_to) {
      whereConditions.push('attendance_date <= ?');
      params.push(date_to);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM Employee_Checkout_Missing ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    // Get paginated results
    const [records] = await connection.query(
      `SELECT 
        ecm.*,
        admin.full_name as resolved_by_name
      FROM Employee_Checkout_Missing ecm
      LEFT JOIN admin_users admin ON ecm.resolved_by = admin.id
      ${whereClause}
      ORDER BY resolved_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting resolved checkout missing:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving resolved checkout missing records',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Get a single checkout-missing record by ID
 */
exports.getCheckoutMissingById = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    
    const [records] = await connection.query(
      `SELECT 
        ecm.*,
        admin.full_name as resolved_by_name,
        admin.email as resolved_by_email
      FROM Employee_Checkout_Missing ecm
      LEFT JOIN admin_users admin ON ecm.resolved_by = admin.id
      WHERE ecm.id = ?`,
      [id]
    );
    
    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Checkout missing record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: records[0]
    });
    
  } catch (error) {
    console.error('❌ Error getting checkout missing record:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving checkout missing record',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Resolve a checkout-missing record
 * HR sets the checkout time manually after getting employee's explanation
 */
exports.resolveCheckoutMissing = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { 
      check_out_time, 
      employee_explanation, 
      hr_notes 
    } = req.body;
    
    // Get admin ID from auth middleware
    const resolved_by = req.user?.id || req.user?.admin_id || 1; // Default to 1 if not available
    
    // Validate required fields
    if (!check_out_time) {
      return res.status(400).json({
        success: false,
        message: 'Checkout time is required'
      });
    }
    
    // Validate time format (HH:MM:SS or HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(check_out_time)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM or HH:MM:SS'
      });
    }
    
    console.log(`🔧 Resolving checkout missing ID: ${id}`);
    console.log(`   Checkout time: ${check_out_time}`);
    console.log(`   Resolved by: ${resolved_by}`);
    
    // Call the stored procedure
    const [results] = await connection.query(
      'CALL ResolveCheckoutMissing(?, ?, ?, ?, ?)',
      [
        parseInt(id),
        check_out_time,
        employee_explanation || null,
        hr_notes || null,
        resolved_by
      ]
    );
    
    const result = results[0][0];
    
    if (result.status === 'SUCCESS') {
      console.log(`✅ Successfully resolved checkout missing for ${result.employee_name}`);
      
      res.status(200).json({
        success: true,
        message: `Checkout missing resolved successfully for ${result.employee_name}`,
        data: result
      });
    } else {
      throw new Error('Failed to resolve checkout missing');
    }
    
  } catch (error) {
    console.error('❌ Error resolving checkout missing:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving checkout missing',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Get summary statistics for checkout missing
 */
exports.getCheckoutMissingSummary = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { month, year } = req.query;
    
    let dateCondition = '';
    const params = [];
    
    if (month && year) {
      dateCondition = 'AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?';
      params.push(parseInt(month), parseInt(year));
    } else if (year) {
      dateCondition = 'AND YEAR(attendance_date) = ?';
      params.push(parseInt(year));
    }
    
    // Get overall statistics
    const [summary] = await connection.query(
      `SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN is_resolved = 0 THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN is_resolved = 1 THEN 1 ELSE 0 END) as resolved_count,
        COUNT(DISTINCT employee_id) as affected_employees
      FROM Employee_Checkout_Missing
      WHERE 1=1 ${dateCondition}`,
      params
    );
    
    // Get by employee
    const [byEmployee] = await connection.query(
      `SELECT 
        employee_id,
        name,
        email,
        COUNT(*) as total_missing,
        SUM(CASE WHEN is_resolved = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN is_resolved = 1 THEN 1 ELSE 0 END) as resolved
      FROM Employee_Checkout_Missing
      WHERE 1=1 ${dateCondition}
      GROUP BY employee_id, name, email
      ORDER BY total_missing DESC
      LIMIT 10`,
      params
    );
    
    // Get recent unresolved
    const [recentUnresolved] = await connection.query(
      `SELECT 
        id,
        employee_id,
        name,
        attendance_date,
        check_in_time,
        moved_from_attendance_at
      FROM Employee_Checkout_Missing
      WHERE is_resolved = 0 ${dateCondition}
      ORDER BY attendance_date DESC
      LIMIT 5`,
      params
    );
    
    res.status(200).json({
      success: true,
      data: {
        summary: summary[0],
        topEmployees: byEmployee,
        recentUnresolved: recentUnresolved
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting checkout missing summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving checkout missing summary',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Delete a checkout missing record (admin only, for corrections)
 */
exports.deleteCheckoutMissing = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    
    // Check if exists and get details
    const [existing] = await connection.query(
      'SELECT * FROM Employee_Checkout_Missing WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Checkout missing record not found'
      });
    }
    
    // Check if already resolved
    if (existing[0].is_resolved === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a resolved record. It has already been moved back to attendance.'
      });
    }
    
    // Delete the record
    await connection.query(
      'DELETE FROM Employee_Checkout_Missing WHERE id = ?',
      [id]
    );
    
    console.log(`🗑️  Deleted checkout missing record ID: ${id} for ${existing[0].name}`);
    
    res.status(200).json({
      success: true,
      message: 'Checkout missing record deleted successfully',
      data: existing[0]
    });
    
  } catch (error) {
    console.error('❌ Error deleting checkout missing:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting checkout missing record',
      error: error.message
    });
  } finally {
    connection.release();
  }
};
