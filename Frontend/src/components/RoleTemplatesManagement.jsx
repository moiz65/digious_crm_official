// RoleTemplatesManagement.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { confirmDialog } from '../utils/confirm';

const RoleTemplatesManagement = () => {
  // Default role templates
  const [roleTemplates, setRoleTemplates] = useState([
    {
      id: 'employee',
      name: 'Employee',
      description: 'Basic access for regular employees',
      type: 'Default',
      users: 45,
      permissions: {
        dashboard: ['view'],
        employees: ['view'],
        attendance: ['view'],
        leaves: ['view', 'create', 'edit'],
        applications: ['view', 'create'],
        reports: ['view'],
        settings: []
      }
    },
    {
      id: 'super-admin',
      name: 'Super Admin',
      description: 'Complete system control and administration',
      type: 'Default',
      users: 3,
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
      id: 'operation-manager',
      name: 'Operation Manager',
      description: 'Operations management and oversight',
      type: 'Default',
      users: 12,
      permissions: {
        dashboard: ['view', 'export'],
        employees: ['view', 'create', 'edit'],
        attendance: ['view', 'create', 'edit', 'approve'],
        leaves: ['view', 'approve', 'reject'],
        applications: ['view', 'process'],
        reports: ['view', 'export'],
        settings: ['view', 'edit']
      }
    },
    {
      id: 'hr',
      name: 'HR',
      description: 'Human resources management',
      type: 'Default',
      users: 8,
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
      id: 'team-lead',
      name: 'Team Lead',
      description: 'Team leadership and supervision',
      type: 'Default',
      users: 15,
      permissions: {
        dashboard: ['view'],
        employees: ['view'],
        attendance: ['view', 'edit', 'approve'],
        leaves: ['view', 'approve'],
        applications: ['view', 'process'],
        reports: ['view'],
        settings: ['view']
      }
    },
    {
      id: 'production-manager',
      name: 'Production Manager',
      description: 'Production and manufacturing oversight',
      type: 'Default',
      users: 7,
      permissions: {
        dashboard: ['view', 'export'],
        employees: ['view', 'create', 'edit'],
        attendance: ['view', 'create', 'edit', 'approve'],
        leaves: ['view', 'approve'],
        applications: ['view', 'process'],
        reports: ['view', 'create', 'edit', 'export'],
        settings: ['view', 'edit']
      }
    }
  ]);

  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState({});
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // All possible permissions
  const allPermissions = {
    dashboard: ['view', 'export'],
    employees: ['view', 'create', 'edit', 'delete', 'export'],
    attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    leaves: ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'export'],
    applications: ['view', 'create', 'edit', 'process', 'export'],
    reports: ['view', 'create', 'edit', 'export', 'share'],
    settings: ['view', 'edit', 'manage_roles', 'manage_users']
  };

  // Permission labels for display
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
    manage_users: 'Manage Users'
  };

  // Module labels
  const moduleLabels = {
    dashboard: 'Dashboard',
    employees: 'Employees',
    attendance: 'Attendance',
    leaves: 'Leaves',
    applications: 'Applications',
    reports: 'Reports',
    settings: 'Settings'
  };

  // Filter roles based on search
  const filteredRoles = roleTemplates.filter(role => {
    return (
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate total permissions for a role
  const calculateTotalPermissions = (permissions) => {
    return Object.values(permissions).reduce((total, modulePerms) => total + modulePerms.length, 0);
  };

  // Handle permission toggle
  const togglePermission = (module, permission) => {
    setRolePermissions(prev => {
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
    setRolePermissions(prev => {
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
    
    setRolePermissions(allSelectedPermissions);
  };

  // Select all permissions for a specific module
  const handleSelectAllInModule = (module) => {
    setRolePermissions(prev => ({
      ...prev,
      [module]: [...allPermissions[module]]
    }));
  };

  // Check if all permissions in a module are selected
  const areAllModulePermissionsSelected = (module) => {
    const modulePermissions = rolePermissions[module] || [];
    const allModulePermissions = allPermissions[module];
    return modulePermissions.length === allModulePermissions.length;
  };

  // Check if module is enabled
  const isModuleEnabled = (module) => {
    return rolePermissions.hasOwnProperty(module);
  };

  // Open permissions popup
  const openPermissionsPopup = (role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  // Add new role
  const handleAddRole = () => {
    if (!newRoleName.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    const roleId = newRoleName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check if role already exists
    if (roleTemplates.some(role => role.id === roleId)) {
      toast.error('A role with this name already exists');
      return;
    }

    const newRole = {
      id: roleId,
      name: newRoleName,
      description: newRoleDescription || '',
      type: 'Added',
      users: 0,
      permissions: { ...rolePermissions }
    };

    setRoleTemplates([...roleTemplates, newRole]);
    setNewRoleName('');
    setNewRoleDescription('');
    setRolePermissions({});
    setShowAddRoleModal(false);
    toast.success(`Role "${newRoleName}" added successfully!`);
  };

  // Edit existing role
  const handleEditRole = (roleId) => {
    const roleToEdit = roleTemplates.find(t => t.id === roleId);
    if (roleToEdit) {
      setEditingRoleId(roleId);
      setNewRoleName(roleToEdit.name);
      setNewRoleDescription(roleToEdit.description || '');
      setRolePermissions(roleToEdit.permissions);
      setShowAddRoleModal(true);
    }
  };

  // Update existing role
  const handleUpdateRole = () => {
    if (!newRoleName.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    setRoleTemplates(roleTemplates.map(role => {
      if (role.id === editingRoleId) {
        return {
          ...role,
          name: newRoleName,
          description: newRoleDescription || '',
          permissions: { ...rolePermissions }
        };
      }
      return role;
    }));

    setNewRoleName('');
    setNewRoleDescription('');
    setRolePermissions({});
    setShowAddRoleModal(false);
    setEditingRoleId(null);
    toast.success(`Role "${newRoleName}" updated successfully!`);
  };

  // Delete role
  const handleDeleteRole = async (roleId) => {
    const role = roleTemplates.find(t => t.id === roleId);
    
    if (role.type === 'Default') {
      toast.error('Default roles cannot be deleted.');
      return;
    }

    // Check if any user is using this role
    if (role.users > 0) {
      toast.error(`Cannot delete this role. ${role.users} user(s) are currently using it. Please reassign them first.`);
      return;
    }

    if (await confirmDialog('Are you sure you want to delete this role? This action cannot be undone.')) {
      setRoleTemplates(roleTemplates.filter(role => role.id !== roleId));
      toast.success('Role deleted successfully!');
    }
  };

  return (
    <div className="max-w-8xl m-5">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search roles by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              setShowAddRoleModal(true);
              setEditingRoleId(null);
              setNewRoleName('');
              setNewRoleDescription('');
              setRolePermissions({});
            }}
            className="px-4 py-2 bg-[#349dff] text-white rounded-lg hover:bg-[#2d8ce8] transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Role
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                        role.type === 'Default' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <span className={`font-semibold ${
                          role.type === 'Default' ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {role.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{role.name}</div>
                        <div className="text-xs text-gray-500">ID: {role.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">{role.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      role.type === 'Default' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {role.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900 font-medium">{role.users}</div>
                      <span className="text-xs text-gray-500 ml-1">users</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900 font-medium mr-2">
                        {calculateTotalPermissions(role.permissions)} total
                      </div>
                      <button
                        onClick={() => openPermissionsPopup(role)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View details
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.keys(role.permissions).filter(module => role.permissions[module].length > 0).length} modules
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditRole(role.id)}
                        className="p-1.5 text-gray-500 hover:text-[#349dff] hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Edit Role"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.type === 'Default'}
                        className={`p-1.5 rounded-lg transition-colors duration-200 ${
                          role.type === 'Default'
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={role.type === 'Default' ? 'Default roles cannot be deleted' : 'Delete Role'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openPermissionsPopup(role)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        Permissions
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingRoleId ? 'Edit Role' : 'Add New Role'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddRoleModal(false);
                    setNewRoleName('');
                    setNewRoleDescription('');
                    setRolePermissions({});
                    setEditingRoleId(null);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                      placeholder="Enter role name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#349dff] focus:border-transparent"
                      placeholder="Describe this role's purpose"
                      rows="4"
                    />
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-800">Role Permissions</h4>
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                    >
                      Select All Permissions
                    </button>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(allPermissions).map(([module, permissions]) => (
                      <div key={module} className="border border-gray-200 rounded-lg p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                          <div className="flex items-center">
                            <h5 className="font-semibold text-gray-800 mr-4">
                              {moduleLabels[module] || module}
                            </h5>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {isModuleEnabled(module) && (
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
                            )}
                            
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
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {permissions.map(permission => (
                              <label
                                key={permission}
                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                  rolePermissions[module]?.includes(permission)
                                    ? 'border-[#349dff] bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-[#349dff] focus:ring-[#349dff] border-gray-300 rounded mr-3"
                                  checked={rolePermissions[module]?.includes(permission) || false}
                                  onChange={() => togglePermission(module, permission)}
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {permissionLabels[permission] || permission}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddRoleModal(false);
                    setNewRoleName('');
                    setNewRoleDescription('');
                    setRolePermissions({});
                    setEditingRoleId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRoleId ? handleUpdateRole : handleAddRole}
                  className="px-6 py-2 bg-[#349dff] text-white rounded-lg hover:bg-[#2d8ce8] transition-colors duration-200"
                >
                  {editingRoleId ? 'Update Role' : 'Add Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Popup Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedRole.name} - Permissions</h3>
                  <p className="text-gray-600 mt-1">View all permissions assigned to this role</p>
                </div>
                <button
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedRole(null);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Role Info Summary */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Role Type</div>
                    <div className="text-sm font-medium text-gray-800">{selectedRole.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Permissions</div>
                    <div className="text-sm font-medium text-gray-800">
                      {calculateTotalPermissions(selectedRole.permissions)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Active Modules</div>
                    <div className="text-sm font-medium text-gray-800">
                      {Object.keys(selectedRole.permissions).filter(module => selectedRole.permissions[module].length > 0).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="space-y-6">
                {Object.entries(allPermissions).map(([module, allModulePermissions]) => {
                  const roleModulePermissions = selectedRole.permissions[module] || [];
                  const isModuleActive = roleModulePermissions.length > 0;

                  if (!isModuleActive) return null;

                  return (
                    <div key={module} className="border border-gray-200 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <h4 className="font-semibold text-gray-800 mr-4">
                            {moduleLabels[module] || module}
                          </h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {roleModulePermissions.length} of {allModulePermissions.length} permissions
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {allModulePermissions.map(permission => {
                          const hasPermission = roleModulePermissions.includes(permission);
                          return (
                            <div
                              key={permission}
                              className={`flex items-center p-3 rounded-lg border ${
                                hasPermission
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-gray-100 bg-gray-50'
                              }`}
                            >
                              {hasPermission ? (
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-300 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              <span className={`text-sm font-medium ${
                                hasPermission ? 'text-gray-800' : 'text-gray-400'
                              }`}>
                                {permissionLabels[permission] || permission}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Check for modules with no permissions */}
                {Object.entries(allPermissions).some(([module]) => !selectedRole.permissions[module] || selectedRole.permissions[module].length === 0) && (
                  <div className="border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800">Disabled Modules</h4>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>The following modules are disabled for this role:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(allPermissions)
                          .filter(([module]) => !selectedRole.permissions[module] || selectedRole.permissions[module].length === 0)
                          .map(([module]) => (
                            <span key={module} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {moduleLabels[module] || module}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedRole(null);
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleTemplatesManagement;