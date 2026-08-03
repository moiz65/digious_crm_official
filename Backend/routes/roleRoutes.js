// Backend/routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rolesController = require('./controllers/rolesController');

// ============================================================
// ROLES CRUD
// ============================================================

// GET /api/v1/roles - Get all roles
router.get('/', authMiddleware, rolesController.getRoles);

// POST /api/v1/roles - Create new role
router.post('/', authMiddleware, rolesController.createRole);

// PUT /api/v1/roles/:id - Update role
router.put('/:id', authMiddleware, rolesController.updateRole);

// DELETE /api/v1/roles/:id - Delete role
router.delete('/:id', authMiddleware, rolesController.deleteRole);

// GET /api/v1/roles/:id/permissions - Get role permissions
router.get('/:id/permissions', authMiddleware, rolesController.getRolePermissions);

// ============================================================
// PERMISSIONS
// ============================================================

// GET /api/v1/permissions - Get all permissions
router.get('/permissions', authMiddleware, rolesController.getPermissions);

// GET /api/v1/permissions/groups - Get permission groups
router.get('/permissions/groups', authMiddleware, rolesController.getPermissionGroups);

// ============================================================
// USER ROLES ASSIGNMENT
// ============================================================

// GET /api/v1/users/:userId/roles - Get user roles
router.get('/users/:userId/roles', authMiddleware, rolesController.getUserRoles);

// POST /api/v1/users/:userId/roles - Assign roles to user
router.post('/users/:userId/roles', authMiddleware, rolesController.assignUserRoles);

// GET /api/v1/users/with-roles - Get all users with their roles
router.get('/users/with-roles', authMiddleware, rolesController.getUsersWithRoles);

module.exports = router;