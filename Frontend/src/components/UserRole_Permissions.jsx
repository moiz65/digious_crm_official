// UserManagementDashboard.jsx
import React, { useState, useEffect } from 'react';

const UserManagementDashboard = () => {
  const [selectedUser, setSelectedUser] = useState('john-doe');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'hr-executive',
    department: 'HR'
  });
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Initial users data with additional users for new roles
  const [users, setUsers] = useState([
    {
      id: 'john-doe',
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'hr-manager',
      department: 'HR',
      status: 'active',
      lastActive: '2 hours ago',
      avatarColor: 'bg-blue-500',
      permissions: {
        dashboard: ['view'],
        employees: ['view', 'create', 'edit', 'delete'],
        attendance: ['view', 'create', 'edit', 'approve'],
        leaves: ['view', 'approve', 'reject'],
        applications: ['view', 'process'],
        reports: ['view', 'export'],
        settings: ['view', 'edit']
      }
    },
    {
      id: 'jane-smith',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      role: 'hr-executive',
      department: 'HR',
      status: 'active',
      lastActive: '1 day ago',
      avatarColor: 'bg-purple-500',
      permissions: {
        dashboard: ['view'],
        employees: ['view', 'create'],
        attendance: ['view', 'edit'],
        leaves: ['view', 'process'],
        applications: ['view', 'process'],
        reports: ['view'],
        settings: ['view']
      }
    },
    {
      id: 'bob-johnson',
      name: 'Bob Johnson',
      email: 'bob.johnson@company.com',
      role: 'hr-recruiter',
      department: 'Recruitment',
      status: 'active',
      lastActive: 'Just now',
      avatarColor: 'bg-green-500',
      permissions: {
        dashboard: ['view'],
        employees: ['view', 'create'],
        attendance: ['view'],
        leaves: ['view'],
        applications: ['view'],
        reports: ['view'],
        settings: ['view']
      }
    },
    {
      id: 'alice-williams',
      name: 'Alice Williams',
      email: 'alice.williams@company.com',
      role: 'view-only',
      department: 'Audit',
      status: 'inactive',
      lastActive: '1 week ago',
      avatarColor: 'bg-yellow-500',
      permissions: {
        dashboard: ['view'],
        employees: ['view'],
        attendance: ['view'],
        leaves: ['view'],
        applications: ['view'],
        reports: ['view'],
        settings: []
      }
    },
    {
      id: 'mike-brown',
      name: 'Mike Brown',
      email: 'mike.brown@company.com',
      role: 'hr-executive',
      department: 'HR',
      status: 'active',
      lastActive: '30 minutes ago',
      avatarColor: 'bg-red-500',
      permissions: {
        dashboard: ['view'],
        employees: ['view', 'create'],
        attendance: ['view', 'edit'],
        leaves: ['view', 'process'],
        applications: ['view'],
        reports: ['view'],
        settings: ['view']
      }
    },
    {
      id: 'sarah-miller',
      name: 'Sarah Miller',
      email: 'sarah.miller@company.com',
      role: 'hr-manager',
      department: 'Operations',
      status: 'active',
      lastActive: '5 hours ago',
      avatarColor: 'bg-indigo-500',
      permissions: {
        dashboard: ['view'],
        employees: ['view', 'create', 'edit'],
        attendance: ['view', 'create', 'edit', 'approve'],
        leaves: ['view', 'approve'],
        applications: ['view', 'process'],
        reports: ['view', 'export'],
        settings: ['view', 'edit']
      }
    },
    // New users for added roles
    {
      id: 'david-wilson',
      name: 'David Wilson',
      email: 'david.wilson@company.com',
      role: 'super-admin',
      department: 'IT',
      status: 'active',
      lastActive: '10 minutes ago',
      avatarColor: 'bg-pink-500',
      permissions: {
        dashboard: ['view', 'export'],
        employees: ['view', 'create', 'edit', 'delete', 'export'],
        attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        leaves: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'export'],
        applications: ['view', 'create', 'edit', 'process', 'export'],
        reports: ['view', 'create', 'edit', 'export', 'share'],
        settings: ['view', 'edit', 'manage_roles', 'manage_users']
      }
    },
    {
      id: 'lisa-anderson',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@company.com',
      role: 'operation-manager',
      department: 'Operations',
      status: 'active',
      lastActive: '1 hour ago',
      avatarColor: 'bg-teal-500',
      permissions: {
        dashboard: ['view', 'export'],
        employees: ['view', 'create'],
        attendance: ['view', 'create', 'edit', 'approve', 'export'],
        leaves: ['view', 'approve', 'reject'],
        applications: ['view', 'process'],
        reports: ['view', 'create', 'export'],
        settings: ['view']
      }
    },
    {
      id: 'robert-taylor',
      name: 'Robert Taylor',
      email: 'robert.taylor@company.com',
      role: 'team-lead',
      department: 'Production',
      status: 'active',
      lastActive: '45 minutes ago',
      avatarColor: 'bg-orange-500',
      permissions: {
        dashboard: ['view'],
        employees: ['view'],
        attendance: ['view', 'create', 'edit', 'approve'],
        leaves: ['view', 'approve'],
        applications: ['view', 'process'],
        reports: ['view'],
        settings: []
      }
    },
    {
      id: 'emily-clark',
      name: 'Emily Clark',
      email: 'emily.clark@company.com',
      role: 'production-manager',
      department: 'Production',
      status: 'active',
      lastActive: '20 minutes ago',
      avatarColor: 'bg-cyan-500',
      permissions: {
        dashboard: ['view', 'export'],
        employees: ['view', 'create'],
        attendance: ['view', 'create', 'edit', 'approve', 'export'],
        leaves: ['view', 'approve', 'reject'],
        applications: ['view', 'process'],
        reports: ['view', 'create', 'export'],
        settings: ['view']
      }
    }
  ]);

  // Updated available roles including new roles
  const availableRoles = [
    { id: 'super-admin', name: 'Super Admin' },
    { id: 'hr-manager', name: 'HR Manager' },
    { id: 'operation-manager', name: 'Operation Manager' },
    { id: 'production-manager', name: 'Production Manager' },
    { id: 'hr-executive', name: 'HR Executive' },
    { id: 'team-lead', name: 'Team Lead' },
    { id: 'hr-recruiter', name: 'HR Recruiter' },
    { id: 'view-only', name: 'View Only' }
  ];

  // Updated departments including new departments
  const departments = ['HR', 'Recruitment', 'Operations', 'Audit', 'Finance', 'IT', 'Production', 'Marketing', 'Sales', 'Quality Control'];

  // All possible permissions - Added "Add Employee" permission
  const allPermissions = {
    dashboard: ['view', 'export'],
    employees: ['view', 'create', 'edit', 'delete', 'export', 'add_employee'], // Added add_employee
    attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    leaves: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'export'],
    applications: ['view', 'create', 'edit', 'process', 'export'],
    reports: ['view', 'create', 'edit', 'export', 'share'],
    settings: ['view', 'edit', 'manage_roles', 'manage_users']
  };

  // Permission labels for display - Updated with new permission
  const permissionLabels = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    approve: 'Approve',
    reject: 'Reject',
    process: 'Process',
    export: 'Export',
    share: 'Share',
    manage_roles: 'Manage Roles',
    manage_users: 'Manage Users',
    add_employee: 'Add Employee' // New permission label
  };

  // Module labels
  const moduleLabels = {
    dashboard: 'Dashboard',
    employees: 'Employee Management',
    attendance: 'Attendance',
    leaves: 'Leave Management',
    applications: 'Applications & Memos',
    reports: 'Reports & Analytics',
    settings: 'System Settings'
  };

  // Get selected user data
  const selectedUserData = users.find(user => user.id === selectedUser);

  // Filter users based on search and department
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  // Handle permission toggle
  const togglePermission = (module, permission) => {
    setSelectedPermissions(prev => {
      const newPermissions = { ...prev };
      if (!newPermissions[module]) {
        newPermissions[module] = [];
      }

      if (newPermissions[module].includes(permission)) {
        newPermissions[module] = newPermissions[module].filter(p => p !== permission);
      } else {
        newPermissions[module] = [...newPermissions[module], permission];
      }

      return newPermissions;
    });
  };

  // Toggle module enable/disable
  const toggleModule = (module) => {
    setSelectedPermissions(prev => {
      const newPermissions = { ...prev };
      const hasModuleKey = newPermissions.hasOwnProperty(module);
      
      if (hasModuleKey) {
        // Disable module - remove the module key completely
        delete newPermissions[module];
      } else {
        // Enable module - add module key with empty array
        newPermissions[module] = [];
      }
      
      return newPermissions;
    });
  };

  // Select all permissions for all modules
  const handleSelectAll = () => {
    const allSelectedPermissions = {};
    
    Object.keys(allPermissions).forEach(module => {
      allSelectedPermissions[module] = [...allPermissions[module]];
    });
    
    setSelectedPermissions(allSelectedPermissions);
  };

  // Deselect all permissions for all modules
  const handleDeselectAll = () => {
    // Keep the module keys but with empty arrays
    const emptyPermissions = {};
    Object.keys(allPermissions).forEach(module => {
      emptyPermissions[module] = [];
    });
    
    setSelectedPermissions(emptyPermissions);
  };

  // Select all permissions for a specific module
  const handleSelectAllInModule = (module) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [module]: [...allPermissions[module]]
    }));
  };

  // Deselect all permissions for a specific module
  const handleDeselectAllInModule = (module) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [module]: []
    }));
  };

  // Check if all permissions in a module are selected
  const areAllModulePermissionsSelected = (module) => {
    const modulePermissions = selectedPermissions[module] || [];
    const allModulePermissions = allPermissions[module];
    return modulePermissions.length === allModulePermissions.length;
  };

  // Check if any permission in a module is selected
  const isAnyPermissionSelectedInModule = (module) => {
    const modulePermissions = selectedPermissions[module] || [];
    return modulePermissions.length > 0;
  };

  // Check if module is enabled (has module key in selectedPermissions)
  const isModuleEnabled = (module) => {
    return selectedPermissions.hasOwnProperty(module);
  };

  // Handle add new user
  const handleAddUser = () => {
    if (!newUserData.name.trim() || !newUserData.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const newUser = {
      id: newUserData.email.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: newUserData.name,
      email: newUserData.email,
      role: newUserData.role,
      department: newUserData.department,
      status: 'active',
      lastActive: 'Never',
      avatarColor: `bg-${['blue', 'purple', 'green', 'yellow', 'red', 'indigo', 'pink', 'teal', 'orange', 'cyan'][Math.floor(Math.random() * 10)]}-500`,
      permissions: { ...selectedPermissions }
    };

    setUsers([...users, newUser]);
    setNewUserData({ name: '', email: '', role: 'hr-executive', department: 'HR' });
    setSelectedPermissions({});
    setShowAddUserModal(false);
    setSelectedUser(newUser.id);
  };

  // Handle edit user
  const handleEditUser = (userId) => {
    const userToEdit = users.find(user => user.id === userId);
    if (userToEdit) {
      setSelectedPermissions(userToEdit.permissions);
      setNewUserData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        department: userToEdit.department
      });
      setEditingUserId(userId);
      setIsEditing(true);
      setShowAddUserModal(true);
    }
  };

  // Handle update user
  const handleUpdateUser = () => {
    if (!newUserData.name.trim() || !newUserData.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setUsers(users.map(user => {
      if (user.id === editingUserId) {
        return {
          ...user,
          name: newUserData.name,
          email: newUserData.email,
          role: newUserData.role,
          department: newUserData.department,
          permissions: { ...selectedPermissions }
        };
      }
      return user;
    }));

    setNewUserData({ name: '', email: '', role: 'hr-executive', department: 'HR' });
    setSelectedPermissions({});
    setShowAddUserModal(false);
    setIsEditing(false);
    setEditingUserId(null);
  };

  // Handle delete user
  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      if (selectedUser === userId && updatedUsers.length > 0) {
        setSelectedUser(updatedUsers[0].id);
      }
    }
  };

  // Handle status toggle
  const handleToggleStatus = (userId) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          status: user.status === 'active' ? 'inactive' : 'active'
        };
      }
      return user;
    }));
  };

  // Handle save permissions
  const handleSavePermissions = () => {
    setUsers(users.map(user => {
      if (user.id === selectedUser) {
        return {
          ...user,
          permissions: { ...selectedPermissions }
        };
      }
      return user;
    }));
    alert('User permissions saved successfully!');
  };

  // Handle role change for selected user - Updated with new role templates
  const handleRoleChange = (newRoleId) => {
    const roleTemplate = {
      'super-admin': {
        dashboard: ['view', 'export'],
        employees: ['view', 'create', 'edit', 'delete', 'export', 'add_employee'],
        attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        leaves: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'export'],
        applications: ['view', 'create', 'edit', 'process', 'export'],
        reports: ['view', 'create', 'edit', 'export', 'share'],
        settings: ['view', 'edit', 'manage_roles', 'manage_users']
      },
      'hr-manager': {
        dashboard: ['view', 'export'],
        employees: ['view', 'create', 'edit', 'delete', 'export', 'add_employee'],
        attendance: ['view', 'create', 'edit', 'approve', 'export'],
        leaves: ['view', 'approve', 'reject', 'export'],
        applications: ['view', 'process', 'export'],
        reports: ['view', 'export'],
        settings: ['view', 'edit']
      },
      'operation-manager': {
        dashboard: ['view', 'export'],
        employees: ['view', 'create', 'add_employee'],
        attendance: ['view', 'create', 'edit', 'approve', 'export'],
        leaves: ['view', 'approve', 'reject'],
        applications: ['view', 'process'],
        reports: ['view', 'create', 'export'],
        settings: ['view']
      },
      'production-manager': {
        dashboard: ['view', 'export'],
        employees: ['view', 'create', 'add_employee'],
        attendance: ['view', 'create', 'edit', 'approve', 'export'],
        leaves: ['view', 'approve', 'reject'],
        applications: ['view', 'process'],
        reports: ['view', 'create', 'export'],
        settings: ['view']
      },
      'hr-executive': {
        dashboard: ['view'],
        employees: ['view', 'create', 'add_employee'],
        attendance: ['view', 'edit'],
        leaves: ['view', 'process'],
        applications: ['view', 'process'],
        reports: ['view'],
        settings: ['view']
      },
      'team-lead': {
        dashboard: ['view'],
        employees: ['view'],
        attendance: ['view', 'create', 'edit', 'approve'],
        leaves: ['view', 'approve'],
        applications: ['view', 'process'],
        reports: ['view'],
        settings: []
      },
      'hr-recruiter': {
        dashboard: ['view'],
        employees: ['view', 'create', 'add_employee'],
        attendance: ['view'],
        leaves: ['view'],
        applications: ['view'],
        reports: ['view'],
        settings: ['view']
      },
      'view-only': {
        dashboard: ['view'],
        employees: ['view'],
        attendance: ['view'],
        leaves: ['view'],
        applications: ['view'],
        reports: ['view'],
        settings: []
      }
    };

    if (window.confirm('Change user role? This will reset custom permissions to the role template.')) {
      setUsers(users.map(user => {
        if (user.id === selectedUser) {
          return {
            ...user,
            role: newRoleId,
            permissions: { ...roleTemplate[newRoleId] }
          };
        }
        return user;
      }));
      
      if (selectedUserData) {
        setSelectedPermissions(roleTemplate[newRoleId]);
      }
    }
  };

  // Initialize selected permissions when user changes
  useEffect(() => {
    if (selectedUserData) {
      setSelectedPermissions(selectedUserData.permissions);
    }
  }, [selectedUser]);

  return (
    <div className="max-w-8xl m-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Users List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Search and Filter */}
            <div className="mb-6 space-y-3">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
              />
              <div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent text-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedUser === user.id
                      ? 'border-[#349dff] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <div className="flex items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${user.avatarColor} mr-3`}>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{user.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {user.department}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(user.id);
                            }}
                            className={`p-1.5 rounded-lg ${
                              user.status === 'active'
                                ? 'text-green-500 hover:bg-green-50'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                            title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {user.status === 'active' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUser(user.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-[#349dff] hover:bg-blue-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.id);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Last active: {user.lastActive}
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {availableRoles.find(r => r.id === user.role)?.name || user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add User Button */}
            <button
              onClick={() => {
                setShowAddUserModal(true);
                setIsEditing(false);
                setNewUserData({ name: '', email: '', role: 'hr-executive', department: 'HR' });
                setSelectedPermissions({});
              }}
              className="w-full mt-6 px-4 py-3 bg-[#349dff] text-white rounded-lg hover:bg-[#2d8ce8] transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New User
            </button>
          </div>
        </div>

        {/* Right Panel - User Details & Permissions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* User Header */}
            {selectedUserData && (
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ${selectedUserData.avatarColor} mr-4`}>
                    {selectedUserData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedUserData.name}</h2>
                    <p className="text-gray-600">{selectedUserData.email}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {selectedUserData.department}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedUserData.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUserData.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm text-gray-500">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Last active: {selectedUserData.lastActive}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Role & Permissions</h3>
                    <p className="text-gray-600">Manage user role and module access permissions</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedUserData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                    >
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleSavePermissions}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#349dff] to-[#1e87e6] text-white rounded-lg hover:opacity-90 transition-opacity duration-200 font-medium shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Permissions Grid */}
            <div className="space-y-6">
              {Object.entries(allPermissions).map(([module, permissions]) => (
                <div key={module} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-800 mr-4">
                        {moduleLabels[module] || module}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* Module-level Select/Deselect buttons */}
                      {isModuleEnabled(module) && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSelectAllInModule(module)}
                            disabled={areAllModulePermissionsSelected(module)}
                            className={`px-3 py-1 text-xs rounded ${
                              areAllModulePermissionsSelected(module)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            } transition-colors duration-200`}
                          >
                            Select All
                          </button>
                        </div>
                      )}
                      
                      {/* Enable/Disable Toggle */}
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isModuleEnabled(module)}
                            onChange={() => toggleModule(module)}
                          />
                          <div className={`block w-12 h-6 rounded-full ${isModuleEnabled(module) ? 'bg-[#349dff]' : 'bg-gray-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${isModuleEnabled(module) ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm text-gray-600">
                          {isModuleEnabled(module) ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {isModuleEnabled(module) && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                        {permissions.map(permission => (
                          <label
                            key={permission}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                              selectedPermissions[module]?.includes(permission)
                                ? 'border-[#349dff] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-[#349dff] focus:ring-[#349dff] border-gray-300 rounded mr-3"
                              checked={selectedPermissions[module]?.includes(permission) || false}
                              onChange={() => togglePermission(module, permission)}
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {permissionLabels[permission] || permission}
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {isEditing ? 'Edit User' : 'Add New User'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={newUserData.department}
                      onChange={(e) => setNewUserData({...newUserData, department: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                    >
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserData({ name: '', email: '', role: 'hr-executive', department: 'HR' });
                    setSelectedPermissions({});
                    setIsEditing(false);
                    setEditingUserId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={isEditing ? handleUpdateUser : handleAddUser}
                  className="px-6 py-2 bg-[#349dff] text-white rounded-lg hover:bg-[#2d8ce8] transition-colors duration-200"
                >
                  {isEditing ? 'Update User' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementDashboard;