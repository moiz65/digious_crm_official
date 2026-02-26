const pool = require('../../config/database');

/**
 * ============================================================================
 * EMPLOYEE LEAVES CONTROLLER - CRUD OPERATIONS
 * ============================================================================
 * Handles all operations for employee leave management:
 * - GET: Fetch leave balance for employees
 * - POST: Create/update leave records
 * - PUT: Update leave usage
 * - DELETE: Remove leave records
 * ============================================================================
 */

/**
 * GET - Fetch leave balance for a specific employee
 * Route: GET /api/employee/:id/leaveBalance
 * Returns: { casual, sick, annual } with used/total/remaining
 */
const getEmployeeLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
        error: 'MISSING_EMPLOYEE_ID'
      });
    }

    // Fetch leave balance from employee_leaves table
    const [leaves] = await pool.query(
      `SELECT 
        id,
        employee_id,
        email,
        name,
        casual_leaves_used,
        casual_leaves_total,
        casual_leaves_remaining,
        sick_leaves_used,
        sick_leaves_total,
        sick_leaves_remaining,
        annual_leaves_used,
        annual_leaves_total,
        annual_leaves_remaining,
        leaves_year,
        created_at,
        updated_at
      FROM employee_leaves
      WHERE employee_id = ?`,
      [id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No leave record found for this employee',
        error: 'LEAVE_RECORD_NOT_FOUND',
        employee_id: id
      });
    }

    const leave = leaves[0];

    // Format response
    const response = {
      success: true,
      employee_id: leave.employee_id,
      email: leave.email,
      name: leave.name,
      leaves_year: leave.leaves_year,
      casual: {
        used: leave.casual_leaves_used,
        total: leave.casual_leaves_total,
        remaining: leave.casual_leaves_remaining
      },
      sick: {
        used: leave.sick_leaves_used,
        total: leave.sick_leaves_total,
        remaining: leave.sick_leaves_remaining
      },
      annual: {
        used: leave.annual_leaves_used,
        total: leave.annual_leaves_total,
        remaining: leave.annual_leaves_remaining
      },
      last_updated: leave.updated_at,
      created_at: leave.created_at
    };

    res.json(response);
  } catch (error) {
    console.error('[ERROR] getEmployeeLeaveBalance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave balance',
      error: error.message
    });
  }
};

/**
 * GET - Fetch leave balance for ALL employees (for admin/HR)
 * Route: GET /api/leaves/all
 * Returns: Array of all employees with their leave balances
 */
const getAllEmployeeLeaves = async (req, res) => {
  try {
    const [leaves] = await pool.query(
      `SELECT 
        id,
        employee_id,
        email,
        name,
        casual_leaves_used,
        casual_leaves_total,
        casual_leaves_remaining,
        sick_leaves_used,
        sick_leaves_total,
        sick_leaves_remaining,
        annual_leaves_used,
        annual_leaves_total,
        annual_leaves_remaining,
        leaves_year,
        updated_at
      FROM employee_leaves
      ORDER BY employee_id ASC`
    );
    // Note: uninformed_leaves and paid_absent columns removed — use Employee_Absent table instead

    if (leaves.length === 0) {
      return res.json({
        success: true,
        message: 'No employees found in leave system',
        total: 0,
        data: []
      });
    }

    // Format response
    const formattedLeaves = leaves.map(leave => ({
      id: leave.id,
      employee_id: leave.employee_id,
      name: leave.name,
      email: leave.email,
      casual: {
        used: leave.casual_leaves_used,
        total: leave.casual_leaves_total,
        remaining: leave.casual_leaves_remaining
      },
      sick: {
        used: leave.sick_leaves_used,
        total: leave.sick_leaves_total,
        remaining: leave.sick_leaves_remaining
      },
      annual: {
        used: leave.annual_leaves_used,
        total: leave.annual_leaves_total,
        remaining: leave.annual_leaves_remaining
      },
      leaves_year: leave.leaves_year,
      last_updated: leave.updated_at
    }));

    res.json({
      success: true,
      total: formattedLeaves.length,
      data: formattedLeaves
    });
  } catch (error) {
    console.error('[ERROR] getAllEmployeeLeaves:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all employee leaves',
      error: error.message
    });
  }
};

/**
 * POST - Mark/use a leave day for an employee
 * Route: POST /api/employee/:id/markLeave
 * Body: { leaveType: 'casual|sick|annual', days: 1, reason: 'optional' }
 */
const markEmployeeLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveType, days = 1, reason = '' } = req.body;

    if (!id || !leaveType) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and leave type are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate leave type
    const validTypes = ['casual', 'sick', 'annual'];
    if (!validTypes.includes(leaveType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave type. Must be: casual, sick, or annual',
        error: 'INVALID_LEAVE_TYPE'
      });
    }

    // Fetch current leave balance
    const [leaves] = await pool.query(
      'SELECT * FROM employee_leaves WHERE employee_id = ?',
      [id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee leave record not found',
        error: 'LEAVE_RECORD_NOT_FOUND'
      });
    }

    const leave = leaves[0];
    const typeKey = `${leaveType}_leaves`;

    // Check available balance
    const usedKey = `${typeKey}_used`;
    const totalKey = `${typeKey}_total`;
    const currentUsed = leave[usedKey];
    const totalAllowed = leave[totalKey];
    const available = totalAllowed - currentUsed;

    if (days > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leaveType} leave balance`,
        error: 'INSUFFICIENT_BALANCE',
        current_balance: available,
        requested: days,
        leave_type: leaveType
      });
    }

    // Update leave usage
    const updateQuery = `
      UPDATE employee_leaves 
      SET ${usedKey} = ${usedKey} + ?,
          updated_at = NOW()
      WHERE employee_id = ?
    `;

    await pool.query(updateQuery, [days, id]);

    // Fetch updated balance
    const [updatedLeaves] = await pool.query(
      'SELECT * FROM employee_leaves WHERE employee_id = ?',
      [id]
    );

    const updatedLeave = updatedLeaves[0];

    res.json({
      success: true,
      message: `${days} ${leaveType} leave(s) marked successfully`,
      employee_id: id,
      leave_type: leaveType,
      days_marked: days,
      reason: reason,
      new_balance: {
        used: updatedLeave[usedKey],
        total: updatedLeave[totalKey],
        remaining: updatedLeave[`${typeKey}_remaining`]
      },
      updated_at: updatedLeave.updated_at
    });
  } catch (error) {
    console.error('[ERROR] markEmployeeLeave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark leave',
      error: error.message
    });
  }
};

/**
 * PUT - Update leave allocations (for admin/HR)
 * Route: PUT /api/employee/:id/updateLeaveAllocation
 * Body: { casual_total: 8, sick_total: 8, annual_total: 12 }
 */
const updateLeaveAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { casual_total, sick_total, annual_total } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
        error: 'MISSING_EMPLOYEE_ID'
      });
    }

    // Fetch current leave record
    const [leaves] = await pool.query(
      'SELECT * FROM employee_leaves WHERE employee_id = ?',
      [id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee leave record not found',
        error: 'LEAVE_RECORD_NOT_FOUND'
      });
    }

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (casual_total !== undefined) {
      updateFields.push('casual_leaves_total = ?');
      updateValues.push(casual_total);
    }
    if (sick_total !== undefined) {
      updateFields.push('sick_leaves_total = ?');
      updateValues.push(sick_total);
    }
    if (annual_total !== undefined) {
      updateFields.push('annual_leaves_total = ?');
      updateValues.push(annual_total);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
        error: 'NO_UPDATE_FIELDS'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const updateQuery = `
      UPDATE employee_leaves 
      SET ${updateFields.join(', ')}
      WHERE employee_id = ?
    `;

    await pool.query(updateQuery, updateValues);

    // Fetch updated record
    const [updatedLeaves] = await pool.query(
      'SELECT * FROM employee_leaves WHERE employee_id = ?',
      [id]
    );

    const updated = updatedLeaves[0];

    res.json({
      success: true,
      message: 'Leave allocation updated successfully',
      employee_id: id,
      updated_allocation: {
        casual: casual_total !== undefined ? casual_total : updated.casual_leaves_total,
        sick: sick_total !== undefined ? sick_total : updated.sick_leaves_total,
        annual: annual_total !== undefined ? annual_total : updated.annual_leaves_total
      },
      current_usage: {
        casual_used: updated.casual_leaves_used,
        sick_used: updated.sick_leaves_used,
        annual_used: updated.annual_leaves_used
      },
      updated_at: updated.updated_at
    });
  } catch (error) {
    console.error('[ERROR] updateLeaveAllocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave allocation',
      error: error.message
    });
  }
};

/**
 * PUT - Reset leaves for new year
 * Route: PUT /api/leaves/resetYear
 * Body: { year: 2026 (optional) }
 */
const resetLeavesForYear = async (req, res) => {
  try {
    const { year } = req.body;
    const targetYear = year || new Date().getFullYear();

    // Reset all leaves used to 0
    const [result] = await pool.query(
      `UPDATE employee_leaves 
       SET casual_leaves_used = 0,
           sick_leaves_used = 0,
           annual_leaves_used = 0,
           leaves_year = ?,
           updated_at = NOW()
       WHERE leaves_year IS NULL OR leaves_year != ?`,
      [targetYear, targetYear]
    );

    res.json({
      success: true,
      message: `Leaves reset successfully for year ${targetYear}`,
      affected_employees: result.affectedRows,
      year: targetYear,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ERROR] resetLeavesForYear:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset leaves',
      error: error.message
    });
  }
};

/**
 * DELETE - Remove a leave record (admin only)
 * Route: DELETE /api/employee/:id/removeLeaveRecord
 */
const removeLeaveRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
        error: 'MISSING_EMPLOYEE_ID'
      });
    }

    // Check if record exists
    const [leaves] = await pool.query(
      'SELECT * FROM employee_leaves WHERE employee_id = ?',
      [id]
    );

    if (leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee leave record not found',
        error: 'LEAVE_RECORD_NOT_FOUND'
      });
    }

    // Delete the record
    await pool.query(
      'DELETE FROM employee_leaves WHERE employee_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Leave record deleted successfully',
      employee_id: id,
      deleted_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ERROR] removeLeaveRecord:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave record',
      error: error.message
    });
  }
};

/**
 * GET - Get leave statistics for admin dashboard
 * Route: GET /api/leaves/statistics
 */
const getLeaveStatistics = async (req, res) => {
  try {
    // Get statistics
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_employees,
        ROUND(AVG(casual_leaves_remaining), 2) as avg_casual_remaining,
        ROUND(AVG(sick_leaves_remaining), 2) as avg_sick_remaining,
        ROUND(AVG(annual_leaves_remaining), 2) as avg_annual_remaining,
        SUM(casual_leaves_used) as total_casual_used,
        SUM(sick_leaves_used) as total_sick_used,
        SUM(annual_leaves_used) as total_annual_used,
        MIN(casual_leaves_remaining) as min_casual_remaining,
        MIN(sick_leaves_remaining) as min_sick_remaining,
        MIN(annual_leaves_remaining) as min_annual_remaining
      FROM employee_leaves
    `);

    // Get employees with no leave balance
    const [lowBalance] = await pool.query(`
      SELECT employee_id, name, email, casual_leaves_remaining, sick_leaves_remaining, annual_leaves_remaining
      FROM employee_leaves
      WHERE casual_leaves_remaining <= 0 OR sick_leaves_remaining <= 0 OR annual_leaves_remaining <= 0
      ORDER BY casual_leaves_remaining ASC
      LIMIT 10
    `);

    res.json({
      success: true,
      statistics: stats[0],
      employees_with_low_balance: lowBalance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ERROR] getLeaveStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics',
      error: error.message
    });
  }
};

module.exports = {
  getEmployeeLeaveBalance,
  getAllEmployeeLeaves,
  markEmployeeLeave,
  updateLeaveAllocation,
  resetLeavesForYear,
  removeLeaveRecord,
  getLeaveStatistics
};
