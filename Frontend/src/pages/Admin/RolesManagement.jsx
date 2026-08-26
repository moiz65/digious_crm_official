// pages/SuperAdmin/RolesManagement.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Edit, Trash2, X, Check, 
  ChevronDown, ChevronRight, Save, RefreshCw,
  Users, Key, Lock, Unlock, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/${process.env.REACT_APP_API_VERSION || "v1"}`
  : "http://localhost:5000/api/v1";

const RolesManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });
  const [expandedGroups, setExpandedGroups] = useState({});
  const [fetchingPermissions, setFetchingPermissions] = useState(false);

  // Get token
  const getToken = () => localStorage.getItem('token') || '';

  // Fetch roles
  const fetchRoles = async () => {
    try {
      console.log('📡 Fetching roles...');
      const res = await fetch(`${API_BASE}/roles`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      console.log('📡 Roles response:', data);
      
      if (data.success) {
        setRoles(data.data);
      } else {
        toast.error(data.message || 'Failed to load roles');
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      toast.error('Failed to load roles');
    }
  };

  // ✅ FIX: Fetch permissions - Correct endpoint
  const fetchPermissions = async () => {
    try {
      console.log('📡 Fetching permissions from:', `${API_BASE}/roles/permissions`);
      const res = await fetch(`${API_BASE}/roles/permissions`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      console.log('📡 Permissions response:', data);
      
      if (data.success) {
        // Group permissions by module
        const grouped = data.data.reduce((acc, p) => {
          const moduleName = p.module || p.group_name || 'General';
          if (!acc[moduleName]) acc[moduleName] = [];
          acc[moduleName].push(p);
          return acc;
        }, {});
        setPermissions(grouped);
        console.log('✅ Grouped permissions:', grouped);
      } else {
        console.error('❌ Failed to fetch permissions:', data.message);
        toast.error('Failed to load permissions');
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      toast.error('Failed to load permissions');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRoles(), fetchPermissions()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Handle role creation/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      const url = editingRole 
        ? `${API_BASE}/roles/${editingRole.id}`
        : `${API_BASE}/roles`;
      
      const method = editingRole ? 'PUT' : 'POST';
      
      console.log('📤 Submitting role:', { url, method, data: formData });
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description,
          permissions: formData.permissions
        })
      });

      const data = await res.json();
      console.log('📡 Submit response:', data);
      
      if (data.success) {
        toast.success(editingRole ? 'Role updated!' : 'Role created!');
        setShowModal(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: [] });
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to save role');
      }
    } catch (err) {
      console.error('Error saving role:', err);
      toast.error('Something went wrong');
    }
  };

  // Handle permission toggle
  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId]
    }));
  };

  // Toggle group expand
  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Delete role
  const handleDelete = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    
    try {
      const res = await fetch(`${API_BASE}/roles/${role.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Role deleted!');
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to delete role');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error('Something went wrong');
    }
  };

  // Open edit modal and fetch role permissions
  const openEditModal = async (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: []
    });
    
    try {
      setFetchingPermissions(true);
      const res = await fetch(`${API_BASE}/roles/${role.id}/permissions`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      console.log('📡 Role permissions:', data);
      
      if (data.success) {
        const assigned = data.data.filter(p => p.is_assigned).map(p => p.id);
        setFormData(prev => ({ ...prev, permissions: assigned }));
      }
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      toast.error('Failed to load role permissions');
    } finally {
      setFetchingPermissions(false);
      setShowModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-500">Loading roles & permissions...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Roles & Permissions
          </h1>
          <p className="text-slate-500 mt-1">
            Manage roles and assign permissions to control access
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setFormData({ name: '', description: '', permissions: [] });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
            <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No roles created yet</p>
            <p className="text-sm text-slate-400">Click "Create Role" to get started</p>
          </div>
        ) : (
          roles.map(role => (
            <div key={role.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${role.name === 'Super Admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    <Shield className={`h-5 w-5 ${role.name === 'Super Admin' ? 'text-purple-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{role.name}</h3>
                    <p className="text-xs text-slate-500">{role.permission_count || 0} permissions</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(role)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    disabled={fetchingPermissions}
                  >
                    {fetchingPermissions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {role.description && (
                <p className="text-sm text-slate-600 mb-3">{role.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>{role.user_count || 0} users assigned</span>
                <span className="text-green-600">Active</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Role Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Finance Manager"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this role do?"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700">Permissions</label>
                  <span className="text-xs text-slate-500">
                    {formData.permissions.length} selected
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {Object.keys(permissions).length === 0 ? (
                    <div className="p-8 text-center">
                      <Key className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No permissions found</p>
                      <p className="text-xs text-slate-400">Run the permission migration script</p>
                    </div>
                  ) : (
                    Object.keys(permissions).map(module => (
                      <div key={module}>
                        <button
                          type="button"
                          onClick={() => toggleGroup(module)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition"
                        >
                          <span className="font-medium text-slate-700 capitalize">{module}</span>
                          {expandedGroups[module] ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        {expandedGroups[module] && (
                          <div className="px-4 py-2 grid grid-cols-2 gap-1">
                            {permissions[module].map(perm => (
                              <label
                                key={perm.id}
                                className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-slate-600">
                                  {perm.action.charAt(0).toUpperCase() + perm.action.slice(1)}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManagement;