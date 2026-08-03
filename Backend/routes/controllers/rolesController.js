// Backend/controllers/rolesController.js
const pool = require('../../config/database');

// ============================================================
// ROLES CRUD
// ============================================================

// GET /api/v1/roles
exports.getRoles = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, 
              COUNT(DISTINCT rp.permission_id) as permission_count,
              COUNT(DISTINCT ur.user_id) as user_count
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       WHERE r.is_active = 1
       GROUP BY r.id
       ORDER BY r.name ASC`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getRoles error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/v1/roles
exports.createRole = async (req, res) => {
    try {
        const { name, description, permissions = [] } = req.body;
        const userId = req.user.userId;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Role name is required' });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert role
            const [result] = await connection.query(
                `INSERT INTO roles (name, description, created_by) VALUES (?, ?, ?)`,
                [name.trim(), description || null, userId]
            );

            const roleId = result.insertId;

            // Add permissions
            if (permissions.length > 0) {
                const values = permissions.map(p => [roleId, p]);
                await connection.query(
                    `INSERT INTO role_permissions (role_id, permission_id) VALUES ?`,
                    [values]
                );
            }

            await connection.commit();

            const [rows] = await connection.query(
                `SELECT r.*, COUNT(rp.permission_id) as permission_count
         FROM roles r
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         WHERE r.id = ?
         GROUP BY r.id`,
                [roleId]
            );

            res.status(201).json({ success: true, message: 'Role created', data: rows[0] });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('createRole error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Role name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /api/v1/roles/:id
exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissions, is_active } = req.body;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update role
            const updates = [];
            const values = [];

            if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
            if (description !== undefined) { updates.push('description = ?'); values.push(description); }
            if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

            if (updates.length > 0) {
                values.push(id);
                await connection.query(
                    `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`,
                    values
                );
            }

            // Update permissions if provided
            if (permissions !== undefined) {
                // Delete existing permissions
                await connection.query(`DELETE FROM role_permissions WHERE role_id = ?`, [id]);

                // Add new permissions
                if (permissions.length > 0) {
                    const permValues = permissions.map(p => [id, p]);
                    await connection.query(
                        `INSERT INTO role_permissions (role_id, permission_id) VALUES ?`,
                        [permValues]
                    );
                }
            }

            await connection.commit();

            const [rows] = await connection.query(
                `SELECT r.*, COUNT(rp.permission_id) as permission_count
         FROM roles r
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         WHERE r.id = ?
         GROUP BY r.id`,
                [id]
            );

            res.json({ success: true, message: 'Role updated', data: rows[0] });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('updateRole error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /api/v1/roles/:id
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if role has users assigned
        const [users] = await pool.query(
            `SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?`,
            [id]
        );

        if (users[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete role with ${users[0].count} assigned users. Remove users first or deactivate the role.`
            });
        }

        const [result] = await pool.query(`DELETE FROM roles WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        res.json({ success: true, message: 'Role deleted successfully' });
    } catch (err) {
        console.error('deleteRole error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/roles/:id/permissions
exports.getRolePermissions = async (req, res) => {
    try {
        const { id } = req.params;

        const [permissions] = await pool.query(
            `SELECT p.*, 
              CASE WHEN rp.role_id IS NOT NULL THEN 1 ELSE 0 END as is_assigned
       FROM permissions p
       LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role_id = ?
       ORDER BY p.module, p.action`,
            [id]
        );

        res.json({ success: true, data: permissions });
    } catch (err) {
        console.error('getRolePermissions error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================================
// PERMISSIONS
// ============================================================

// GET /api/v1/permissions
exports.getPermissions = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
        p.id,
        p.name,
        p.module,
        p.action,
        p.description,
        p.created_at,
        pg.name as group_name,
        pg.icon
       FROM permissions p
       LEFT JOIN permission_groups pg ON p.module = pg.name
       ORDER BY pg.sort_order, p.module, p.action`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getPermissions error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/permissions/groups
exports.getPermissionGroups = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM permission_groups ORDER BY sort_order`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getPermissionGroups error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================================
// USER ROLES ASSIGNMENT
// ============================================================

// GET /api/v1/users/:userId/roles
exports.getUserRoles = async (req, res) => {
    try {
        const { userId } = req.params;

        const [rows] = await pool.query(
            `SELECT r.*, ur.assigned_at
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ? AND r.is_active = 1`,
            [userId]
        );

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getUserRoles error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/v1/users/:userId/roles
exports.assignUserRoles = async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleIds } = req.body;
        const assignedBy = req.user.userId;

        if (!roleIds || !Array.isArray(roleIds)) {
            return res.status(400).json({ success: false, message: 'Role IDs array required' });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Remove existing roles
            await connection.query(`DELETE FROM user_roles WHERE user_id = ?`, [userId]);

            // Assign new roles
            if (roleIds.length > 0) {
                const values = roleIds.map(rid => [userId, rid, assignedBy]);
                await connection.query(
                    `INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ?`,
                    [values]
                );
            }

            await connection.commit();

            res.json({ success: true, message: 'Roles assigned successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('assignUserRoles error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/v1/users/with-roles
exports.getUsersWithRoles = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
        u.id,
        u.employee_id,
        u.name,
        u.email,
        u.department,
        u.position,
        u.status,
        GROUP_CONCAT(r.name SEPARATOR ', ') as role_names,
        GROUP_CONCAT(r.id SEPARATOR ',') as role_ids
       FROM user_as_employees u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.status = 'Active'
       GROUP BY u.id
       ORDER BY u.name`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getUsersWithRoles error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};