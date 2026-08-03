-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- PERMISSIONS TABLE (All available permissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- view, create, edit, delete, manage
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ROLE PERMISSIONS TABLE (Many-to-Many)
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- ============================================================
-- USER ROLES TABLE (Assign roles to users)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_by INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role_id)
);

-- ============================================================
-- PERMISSION GROUPS (For organizing permissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS permission_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- INSERT PERMISSION GROUPS
-- ============================================================
INSERT INTO permission_groups (name, icon, sort_order) VALUES
('Dashboard', 'LayoutDashboard', 1),
('Employees', 'Users', 2),
('Attendance', 'Calendar', 3),
('Payroll', 'DollarSign', 4),
('Expenses', 'Receipt', 5),
('Sales', 'TrendingUp', 6),
('Leaves', 'Briefcase', 7),
('Memos', 'FileText', 8),
('Reports', 'BarChart3', 9),
('Settings', 'Settings', 10),
('HR', 'UserCog', 11),
('Admin', 'Shield', 12);

-- ============================================================
-- INSERT PERMISSIONS
-- ============================================================
INSERT INTO permissions (name, module, action, description) VALUES
-- Dashboard
('view_dashboard', 'dashboard', 'view', 'View dashboard'),
-- Employees
('view_employees', 'employees', 'view', 'View employees list'),
('create_employee', 'employees', 'create', 'Create new employee'),
('edit_employee', 'employees', 'edit', 'Edit employee'),
('delete_employee', 'employees', 'delete', 'Delete employee'),
('manage_employees', 'employees', 'manage', 'Manage all employees'),
-- Attendance
('view_attendance', 'attendance', 'view', 'View attendance'),
('edit_attendance', 'attendance', 'edit', 'Edit attendance'),
('manage_attendance', 'attendance', 'manage', 'Manage attendance'),
-- Payroll
('view_payroll', 'payroll', 'view', 'View payroll'),
('create_payroll', 'payroll', 'create', 'Create payroll'),
('edit_payroll', 'payroll', 'edit', 'Edit payroll'),
('delete_payroll', 'payroll', 'delete', 'Delete payroll'),
('manage_payroll', 'payroll', 'manage', 'Manage payroll'),
-- Expenses
('view_expenses', 'expenses', 'view', 'View expenses'),
('create_expense', 'expenses', 'create', 'Create expense'),
('edit_expense', 'expenses', 'edit', 'Edit expense'),
('delete_expense', 'expenses', 'delete', 'Delete expense'),
('manage_expenses', 'expenses', 'manage', 'Manage expenses'),
-- Sales
('view_sales', 'sales', 'view', 'View sales'),
('create_sale', 'sales', 'create', 'Create sale'),
('edit_sale', 'sales', 'edit', 'Edit sale'),
('delete_sale', 'sales', 'delete', 'Delete sale'),
('manage_sales', 'sales', 'manage', 'Manage sales'),
-- Leaves
('view_leaves', 'leaves', 'view', 'View leaves'),
('create_leave', 'leaves', 'create', 'Create leave'),
('approve_leave', 'leaves', 'approve', 'Approve leave'),
('manage_leaves', 'leaves', 'manage', 'Manage leaves'),
-- Memos
('view_memos', 'memos', 'view', 'View memos'),
('create_memo', 'memos', 'create', 'Create memo'),
('edit_memo', 'memos', 'edit', 'Edit memo'),
('delete_memo', 'memos', 'delete', 'Delete memo'),
('manage_memos', 'memos', 'manage', 'Manage memos'),
-- Reports
('view_reports', 'reports', 'view', 'View reports'),
('create_reports', 'reports', 'create', 'Create reports'),
('manage_reports', 'reports', 'manage', 'Manage reports'),
-- Settings
('view_settings', 'settings', 'view', 'View settings'),
('edit_settings', 'settings', 'edit', 'Edit settings'),
('manage_settings', 'settings', 'manage', 'Manage settings'),
-- HR
('view_hr', 'hr', 'view', 'View HR module'),
('manage_hr', 'hr', 'manage', 'Manage HR module'),
-- Admin
('view_admin', 'admin', 'view', 'View admin module'),
('manage_admin', 'admin', 'manage', 'Manage admin module'),
-- Roles & Permissions
('view_roles', 'roles', 'view', 'View roles'),
('create_role', 'roles', 'create', 'Create role'),
('edit_role', 'roles', 'edit', 'Edit role'),
('delete_role', 'roles', 'delete', 'Delete role'),
('assign_roles', 'roles', 'assign', 'Assign roles to users'),
('manage_roles', 'roles', 'manage', 'Manage all roles');

-- ============================================================
-- INSERT DEFAULT ROLES
-- ============================================================
INSERT INTO roles (name, description, is_active) VALUES
('Super Admin', 'Full system access with all permissions', 1),
('Admin', 'Administrative access with most permissions', 1),
('HR Manager', 'Human resources management permissions', 1),
('Finance Manager', 'Finance and payroll permissions', 1),
('Sales Manager', 'Sales management permissions', 1),
('Employee', 'Basic employee access', 1);

-- ============================================================
-- ASSIGN ALL PERMISSIONS TO SUPER ADMIN ROLE
-- ============================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;