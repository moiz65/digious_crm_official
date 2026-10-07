// Backend/controllers/salesTierController.js (continued)

// ═══════════════════════════════════════════════════════════
// TIER MANAGEMENT (HR creates/edits dynamically)
// ═══════════════════════════════════════════════════════════
const pool = require('../../config/database');
// GET /tiers
exports.getTiers = async (req, res) => {
    try {
        const { include_inactive } = req.query;
        let where = include_inactive === 'true' ? '1=1' : 'is_active = 1';

        const [rows] = await pool.query(
            `SELECT * FROM sales_tiers WHERE ${where} ORDER BY level ASC`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getTiers error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /tiers
exports.createTier = async (req, res) => {
    try {
        const {
            name,
            level,
            base_salary_pkr,
            monthly_target_usd,
            commission_rate = 0,
            color = '#3B82F6',
            description = ''
        } = req.body;

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Tier name is required' });
        }
        if (!level || level < 1) {
            return res.status(400).json({ success: false, message: 'Level must be >= 1' });
        }
        if (!base_salary_pkr || base_salary_pkr < 0) {
            return res.status(400).json({ success: false, message: 'Base salary is required' });
        }
        if (!monthly_target_usd || monthly_target_usd < 0) {
            return res.status(400).json({ success: false, message: 'Monthly target is required' });
        }

        const [result] = await pool.query(
            `INSERT INTO sales_tiers 
       (name, level, base_salary_pkr, monthly_target_usd, commission_rate, color, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name.trim(), level, base_salary_pkr, monthly_target_usd, commission_rate, color, description]
        );

        const [rows] = await pool.query(`SELECT * FROM sales_tiers WHERE id = ?`, [result.insertId]);
        return res.status(201).json({
            success: true,
            message: 'Tier created successfully',
            data: rows[0]
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'A tier with this level already exists' });
        }
        console.error('createTier error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /tiers/:id
exports.updateTier = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, level, base_salary_pkr, monthly_target_usd,
            commission_rate, color, description, is_active
        } = req.body;

        const fields = [];
        const values = [];

        if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
        if (level !== undefined) { fields.push('level = ?'); values.push(level); }
        if (base_salary_pkr !== undefined) { fields.push('base_salary_pkr = ?'); values.push(base_salary_pkr); }
        if (monthly_target_usd !== undefined) { fields.push('monthly_target_usd = ?'); values.push(monthly_target_usd); }
        if (commission_rate !== undefined) { fields.push('commission_rate = ?'); values.push(commission_rate); }
        if (color !== undefined) { fields.push('color = ?'); values.push(color); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }

        if (!fields.length) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        await pool.query(`UPDATE sales_tiers SET ${fields.join(', ')} WHERE id = ?`, values);

        const [rows] = await pool.query(`SELECT * FROM sales_tiers WHERE id = ?`, [id]);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Tier not found' });
        }

        return res.json({ success: true, message: 'Tier updated', data: rows[0] });
    } catch (err) {
        console.error('updateTier error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /tiers/:id
exports.deleteTier = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if any employee is assigned to this tier
        const [assigned] = await pool.query(
            `SELECT COUNT(*) AS cnt FROM sales_employees WHERE current_tier_id = ?`,
            [id]
        );
        if (assigned[0].cnt > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete. ${assigned[0].cnt} employee(s) are on this tier.`
            });
        }

        const [result] = await pool.query(`DELETE FROM sales_tiers WHERE id = ?`, [id]);
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Tier not found' });
        }
        return res.json({ success: true, message: 'Tier deleted' });
    } catch (err) {
        console.error('deleteTier error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /employees
exports.getSalesEmployees = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
         e.id AS employee_id,
         e.employee_id AS employee_code,
         e.name AS employee_name,
         e.email AS employee_email,
         e.department,
         e.designation,
         e.status AS employee_status,
         e.join_date,
         -- Tier assignment (NULL if not assigned yet)
         se.id AS sales_emp_id,
         se.current_tier_id,
         se.joined_date AS tier_joined_date,
         se.status AS tier_status,
         t.name AS tier_name,
         t.level AS tier_level,
         t.base_salary_pkr,
         t.monthly_target_usd,
         t.quarterly_target_usd,
         t.color AS tier_color
       FROM employee_onboarding e
       LEFT JOIN sales_employees se ON se.employee_id = e.id
       LEFT JOIN sales_tiers t ON t.id = se.current_tier_id
       WHERE LOWER(e.department) = 'sales'
         AND e.status = 'Active'
       ORDER BY 
         CASE WHEN se.current_tier_id IS NULL THEN 1 ELSE 0 END,
         t.level DESC,
         e.name ASC`
        );

        return res.json({
            success: true,
            data: rows,
            total: rows.length,
            assigned: rows.filter(r => r.current_tier_id).length,
            unassigned: rows.filter(r => !r.current_tier_id).length,
        });
    } catch (err) {
        console.error('getSalesEmployees error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ═══════════════════════════════════════════════════════════
// ASSIGN TIER TO EMPLOYEE (with auto target sync)
// ═══════════════════════════════════════════════════════════
exports.assignEmployee = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { employee_id, tier_id, joined_date } = req.body;

        if (!employee_id || !tier_id) {
            throw new Error('employee_id and tier_id are required');
        }

        // Verify employee
        const [emp] = await connection.query(
            `SELECT id, name, department FROM employee_onboarding 
       WHERE id = ? AND LOWER(department) = 'sales'`,
            [employee_id]
        );
        if (!emp.length) {
            throw new Error('Employee not found or not in Sales department');
        }

        // Verify tier
        const [tier] = await connection.query(
            `SELECT id, name, monthly_target_usd FROM sales_tiers 
       WHERE id = ? AND is_active = 1`,
            [tier_id]
        );
        if (!tier.length) {
            throw new Error('Tier not found or inactive');
        }

        // Upsert sales_employees entry
        await connection.query(
            `INSERT INTO sales_employees 
       (employee_id, current_tier_id, joined_date, last_tier_change_date, status)
       VALUES (?, ?, ?, CURDATE(), 'Active')
       ON DUPLICATE KEY UPDATE
         current_tier_id = VALUES(current_tier_id),
         joined_date = VALUES(joined_date),
         status = 'Active',
         updated_at = NOW()`,
            [employee_id, tier_id, joined_date || new Date().toISOString().split('T')[0]]
        );

        // ⭐ AUTO-SYNC: Update current month's sales_target if exists
        // Only update if existing target was using tier (or no target exists)
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const tierTarget = parseFloat(tier[0].monthly_target_usd);

        const [existingTarget] = await connection.query(
            `SELECT id, monthly_target FROM sales_targets 
       WHERE employee_id = ? AND month = ? AND year = ?`,
            [employee_id, currentMonth, currentYear]
        );

        if (existingTarget.length === 0) {
            // No target exists → Create one with tier target
            await connection.query(
                `INSERT INTO sales_targets 
         (employee_id, month, year, monthly_target, notes)
         VALUES (?, ?, ?, ?, ?)`,
                [
                    employee_id,
                    currentMonth,
                    currentYear,
                    tierTarget,
                    `Auto-set from "${tier[0].name}" tier`
                ]
            );
            console.log(`✅ Auto-created target $${tierTarget} for employee ${employee_id}`);
        }
        // If existing target exists but user manually set it, we don't override
        // (Manual override has priority)

        await connection.commit();

        return res.json({
            success: true,
            message: `${emp[0].name} assigned to ${tier[0].name} tier`,
            data: {
                employee_id,
                employee_name: emp[0].name,
                tier_id,
                tier_name: tier[0].name,
                tier_target: tierTarget,
                target_synced: existingTarget.length === 0,
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('assignEmployee error:', err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        connection.release();
    }
};

// ═══════════════════════════════════════════════════════════
// GET UNASSIGNED SALES EMPLOYEES (not yet on any tier)
// ═══════════════════════════════════════════════════════════
exports.getUnassignedSalesEmployees = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
         e.id AS employee_id,
         e.employee_id AS employee_code,
         e.name AS employee_name,
         e.email AS employee_email,
         e.department,
         e.designation,
         e.join_date
       FROM employee_onboarding e
       LEFT JOIN sales_employees se ON se.employee_id = e.id
       WHERE LOWER(e.department) = 'sales'
         AND e.status = 'Active'
         AND se.id IS NULL
       ORDER BY e.name ASC`
        );

        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getUnassignedSalesEmployees error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ═══════════════════════════════════════════════════════════
// BULK ASSIGN TIER TO MULTIPLE EMPLOYEES
// ═══════════════════════════════════════════════════════════
exports.bulkAssignEmployees = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { employee_ids, tier_id, joined_date } = req.body;

        if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
            throw new Error('employee_ids array is required');
        }
        if (!tier_id) {
            throw new Error('tier_id is required');
        }

        // Verify tier
        const [tier] = await connection.query(
            `SELECT id, name FROM sales_tiers WHERE id = ? AND is_active = 1`,
            [tier_id]
        );
        if (!tier.length) {
            throw new Error('Tier not found or inactive');
        }

        // Verify all employees are in Sales dept
        const [emps] = await connection.query(
            `SELECT id, name FROM employee_onboarding 
       WHERE id IN (?) AND LOWER(department) = 'sales' AND status = 'Active'`,
            [employee_ids]
        );

        if (emps.length !== employee_ids.length) {
            throw new Error(`Some employees not found or not in Sales department`);
        }

        const joinDate = joined_date || new Date().toISOString().split('T')[0];

        // Bulk upsert
        for (const empId of employee_ids) {
            await connection.query(
                `INSERT INTO sales_employees 
         (employee_id, current_tier_id, joined_date, last_tier_change_date, status)
         VALUES (?, ?, ?, CURDATE(), 'Active')
         ON DUPLICATE KEY UPDATE
           current_tier_id = VALUES(current_tier_id),
           joined_date = VALUES(joined_date),
           status = 'Active',
           updated_at = NOW()`,
                [empId, tier_id, joinDate]
            );
        }

        await connection.commit();

        return res.json({
            success: true,
            message: `${employee_ids.length} employee(s) assigned to ${tier[0].name} tier`,
            data: {
                tier_id,
                tier_name: tier[0].name,
                assigned_count: employee_ids.length,
                employees: emps,
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('bulkAssignEmployees error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// ═══════════════════════════════════════════════════════════
// REMOVE EMPLOYEE FROM TIER (keeps employee in Sales dept)
// ═══════════════════════════════════════════════════════════
exports.removeSalesEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const [result] = await pool.query(
            `DELETE FROM sales_employees WHERE employee_id = ?`,
            [employeeId]
        );
        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Employee not assigned to any tier'
            });
        }
        return res.json({
            success: true,
            message: 'Employee removed from tier assignment'
        });
    } catch (err) {
        console.error('removeSalesEmployee error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /quarters
exports.getQuarters = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM sales_quarters ORDER BY year DESC, start_date DESC`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getQuarters error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /quarters (HR manually creates quarter)
exports.createQuarter = async (req, res) => {
    try {
        const { quarter_name, year, start_date, end_date, evaluation_date } = req.body;

        if (!quarter_name || !year || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'quarter_name, year, start_date, end_date are required'
            });
        }

        const evalDate = evaluation_date || (() => {
            const d = new Date(end_date);
            d.setDate(d.getDate() + 1);
            return d.toISOString().split('T')[0];
        })();

        const [result] = await pool.query(
            `INSERT INTO sales_quarters 
       (quarter_name, year, start_date, end_date, evaluation_date, status)
       VALUES (?, ?, ?, ?, ?, 'Upcoming')`,
            [quarter_name, year, start_date, end_date, evalDate]
        );

        const [rows] = await pool.query(`SELECT * FROM sales_quarters WHERE id = ?`, [result.insertId]);
        return res.status(201).json({ success: true, message: 'Quarter created', data: rows[0] });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Quarter already exists' });
        }
        console.error('createQuarter error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /quarters/:id
exports.updateQuarter = async (req, res) => {
    try {
        const { id } = req.params;
        const { quarter_name, year, start_date, end_date, evaluation_date, status } = req.body;

        const fields = [];
        const values = [];

        if (quarter_name !== undefined) { fields.push('quarter_name = ?'); values.push(quarter_name); }
        if (year !== undefined) { fields.push('year = ?'); values.push(year); }
        if (start_date !== undefined) { fields.push('start_date = ?'); values.push(start_date); }
        if (end_date !== undefined) { fields.push('end_date = ?'); values.push(end_date); }
        if (evaluation_date !== undefined) { fields.push('evaluation_date = ?'); values.push(evaluation_date); }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }

        if (!fields.length) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        await pool.query(`UPDATE sales_quarters SET ${fields.join(', ')} WHERE id = ?`, values);

        const [rows] = await pool.query(`SELECT * FROM sales_quarters WHERE id = ?`, [id]);
        return res.json({ success: true, message: 'Quarter updated', data: rows[0] });
    } catch (err) {
        console.error('updateQuarter error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /quarters/:id
exports.deleteQuarter = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(`DELETE FROM sales_quarters WHERE id = ?`, [id]);
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Quarter not found' });
        }
        return res.json({ success: true, message: 'Quarter deleted' });
    } catch (err) {
        console.error('deleteQuarter error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /quarters/:id/evaluate
exports.evaluateQuarter = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id: quarterId } = req.params;

        // Get quarter
        const [quarters] = await connection.query(
            `SELECT * FROM sales_quarters WHERE id = ?`,
            [quarterId]
        );
        if (!quarters.length) {
            throw new Error('Quarter not found');
        }
        const quarter = quarters[0];

        // Get all active sales employees with their tier info
        const [employees] = await connection.query(
            `SELECT 
         se.id AS sales_emp_id,
         se.employee_id,
         se.current_tier_id,
         t.name AS tier_name,
         t.level AS tier_level,
         t.base_salary_pkr,
         t.monthly_target_usd,
         t.quarterly_target_usd
       FROM sales_employees se
       JOIN sales_tiers t ON t.id = se.current_tier_id
       WHERE se.status = 'Active'`
        );

        const results = [];

        for (const emp of employees) {
            const [salesData] = await connection.query(
                `SELECT COALESCE(SUM(upfront_payment), 0) AS total_sales_usd,
                COUNT(*) AS total_deals
         FROM sales 
         WHERE employee_id = ?
           AND sale_date BETWEEN ? AND ?
           AND status NOT IN ('cancelled', 'refunded')`,
                [emp.employee_id, quarter.start_date, quarter.end_date]
            );

            const totalSales = parseFloat(salesData[0].total_sales_usd);
            const target = parseFloat(emp.quarterly_target_usd);
            const achievement = target > 0 ? (totalSales / target) * 100 : 0;
            const isAchieved = totalSales >= target;

            // ⭐ Determine tier change
            let newTierId = emp.current_tier_id;
            let newTierName = emp.tier_name;
            let tierChange = 'SAME';
            let reason = '';

            if (isAchieved) {
                // Target achieved
                if (achievement >= 150) {
                    // Upgrade to next tier (if exists)
                    const [nextTier] = await connection.query(
                        `SELECT id, name FROM sales_tiers
             WHERE level > ? AND is_active = 1
             ORDER BY level ASC LIMIT 1`,
                        [emp.tier_level]
                    );
                    if (nextTier.length > 0) {
                        newTierId = nextTier[0].id;
                        newTierName = nextTier[0].name;
                        tierChange = 'UPGRADE';
                        reason = `Exceeded target by ${(achievement - 100).toFixed(1)}% — Upgraded to ${newTierName}`;
                    } else {
                        reason = `Target achieved at highest tier (${emp.tier_name})`;
                    }
                } else {
                    reason = `Target achieved (${achievement.toFixed(1)}%) — Tier maintained`;
                }
            } else {
                // Target NOT achieved → Downgrade
                const [prevTier] = await connection.query(
                    `SELECT id, name FROM sales_tiers
           WHERE level < ? AND is_active = 1
           ORDER BY level DESC LIMIT 1`,
                    [emp.tier_level]
                );
                if (prevTier.length > 0) {
                    newTierId = prevTier[0].id;
                    newTierName = prevTier[0].name;
                    tierChange = 'DOWNGRADE';
                    reason = `Missed target (${achievement.toFixed(1)}%) — Downgraded to ${newTierName}`;
                } else {
                    reason = `Missed target but already at lowest tier (${emp.tier_name})`;
                }
            }

            // Insert/update quarter performance
            await connection.query(
                `INSERT INTO employee_quarter_performance
         (employee_id, quarter_id,
          tier_at_start_id, tier_at_start_name,
          base_salary_at_start, quarterly_target_at_start,
          total_sales_usd, achievement_percentage, is_target_achieved,
          tier_at_end_id, tier_at_end_name, tier_change,
          evaluated_at, evaluation_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE
           total_sales_usd = VALUES(total_sales_usd),
           achievement_percentage = VALUES(achievement_percentage),
           is_target_achieved = VALUES(is_target_achieved),
           tier_at_end_id = VALUES(tier_at_end_id),
           tier_at_end_name = VALUES(tier_at_end_name),
           tier_change = VALUES(tier_change),
           evaluation_notes = VALUES(evaluation_notes),
           evaluated_at = NOW()`,
                [
                    emp.employee_id, quarterId,
                    emp.current_tier_id, emp.tier_name,
                    emp.base_salary_pkr, emp.quarterly_target_usd,
                    totalSales, achievement, isAchieved ? 1 : 0,
                    newTierId, newTierName, tierChange,
                    reason
                ]
            );

            // If tier changed, update employee
            if (newTierId !== emp.current_tier_id) {
                await connection.query(
                    `UPDATE sales_employees
           SET current_tier_id = ?,
               last_tier_change_date = CURDATE(),
               last_evaluation_date = CURDATE()
           WHERE id = ?`,
                    [newTierId, emp.sales_emp_id]
                );

                const [newTierInfo] = await connection.query(
                    `SELECT base_salary_pkr FROM sales_tiers WHERE id = ?`,
                    [newTierId]
                );

                await connection.query(
                    `INSERT INTO tier_change_history
           (employee_id, quarter_id, old_tier_id, new_tier_id,
            old_salary, new_salary, change_type, reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        emp.employee_id, quarterId,
                        emp.current_tier_id, newTierId,
                        emp.base_salary_pkr, newTierInfo[0].base_salary_pkr,
                        tierChange, reason
                    ]
                );
            } else {
                await connection.query(
                    `UPDATE sales_employees SET last_evaluation_date = CURDATE() WHERE id = ?`,
                    [emp.sales_emp_id]
                );
            }

            results.push({
                employee_id: emp.employee_id,
                tier_at_start: emp.tier_name,
                tier_at_end: newTierName,
                total_sales: totalSales,
                target,
                achievement: achievement.toFixed(2),
                tier_change: tierChange,
                reason,
            });
        }

        // Mark quarter as evaluated
        await connection.query(
            `UPDATE sales_quarters SET status = 'Evaluated' WHERE id = ?`,
            [quarterId]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: `Quarter evaluated — ${results.length} employees processed`,
            data: {
                quarter: `${quarter.quarter_name} ${quarter.year}`,
                evaluated_count: results.length,
                results,
            },
        });
    } catch (error) {
        await connection.rollback();
        console.error('evaluateQuarter error:', error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// GET /quarters/:id/preview – see projected changes before evaluating
exports.previewQuarter = async (req, res) => {
    try {
        const { id: quarterId } = req.params;

        const [quarters] = await pool.query(
            `SELECT * FROM sales_quarters WHERE id = ?`,
            [quarterId]
        );
        if (!quarters.length) {
            return res.status(404).json({ success: false, message: 'Quarter not found' });
        }
        const quarter = quarters[0];

        const [employees] = await pool.query(
            `SELECT 
         se.id AS sales_emp_id,
         se.employee_id,
         e.name AS employee_name,
         se.current_tier_id,
         t.name AS tier_name,
         t.level AS tier_level,
         t.quarterly_target_usd
       FROM sales_employees se
       JOIN employee_onboarding e ON e.id = se.employee_id
       JOIN sales_tiers t ON t.id = se.current_tier_id
       WHERE se.status = 'Active'`
        );

        const preview = [];

        for (const emp of employees) {
            const [salesData] = await pool.query(
                `SELECT COALESCE(SUM(upfront_payment), 0) AS total_sales
         FROM sales 
         WHERE employee_id = ?
           AND sale_date BETWEEN ? AND ?
           AND status NOT IN ('cancelled', 'refunded')`,
                [emp.employee_id, quarter.start_date, quarter.end_date]
            );

            const totalSales = parseFloat(salesData[0].total_sales);
            const target = parseFloat(emp.quarterly_target_usd);
            const achievement = target > 0 ? (totalSales / target) * 100 : 0;
            const isAchieved = totalSales >= target;

            let projectedChange = 'SAME';
            if (!isAchieved) projectedChange = 'DOWNGRADE';
            else if (achievement >= 150) projectedChange = 'UPGRADE';

            preview.push({
                employee_id: emp.employee_id,
                employee_name: emp.employee_name,
                current_tier: emp.tier_name,
                total_sales: totalSales,
                target,
                achievement: achievement.toFixed(2),
                is_target_achieved: isAchieved,
                projected_change: projectedChange,
            });
        }

        return res.json({
            success: true,
            data: {
                quarter: `${quarter.quarter_name} ${quarter.year}`,
                preview,
            },
        });
    } catch (err) {
        console.error('previewQuarter error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /performance – all employees performance for a quarter
exports.getQuarterPerformance = async (req, res) => {
    try {
        const { quarter_id } = req.query;
        let where = '1=1';
        const params = [];
        if (quarter_id) {
            where += ' AND eqp.quarter_id = ?';
            params.push(quarter_id);
        }

        const [rows] = await pool.query(
            `SELECT 
         eqp.*,
         e.name AS employee_name,
         e.email AS employee_email,
         q.quarter_name,
         q.year
       FROM employee_quarter_performance eqp
       JOIN employee_onboarding e ON e.id = eqp.employee_id
       JOIN sales_quarters q ON q.id = eqp.quarter_id
       WHERE ${where}
       ORDER BY eqp.achievement_percentage DESC`,
            params
        );

        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getQuarterPerformance error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /tier-history/:employeeId
exports.getTierHistory = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const [rows] = await pool.query(
            `SELECT 
         tch.*,
         ot.name AS old_tier_name,
         nt.name AS new_tier_name,
         q.quarter_name,
         q.year
       FROM tier_change_history tch
       LEFT JOIN sales_tiers ot ON ot.id = tch.old_tier_id
       LEFT JOIN sales_tiers nt ON nt.id = tch.new_tier_id
       LEFT JOIN sales_quarters q ON q.id = tch.quarter_id
       WHERE tch.employee_id = ?
       ORDER BY tch.changed_at DESC`,
            [employeeId]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getTierHistory error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};