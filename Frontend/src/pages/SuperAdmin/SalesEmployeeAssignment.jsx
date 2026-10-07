// Frontend/src/pages/Sales/SalesEmployeeAssignment.jsx

import React, { useState, useEffect } from 'react';
import { 
  Users, Award, Plus, Trash2, Loader, X, CheckCircle, 
  AlertCircle, UserPlus, Search 
} from 'lucide-react';
import { tierService, salesEmployeeService } from '../../services/salesTierService';
import toast from 'react-hot-toast';

const SalesEmployeeAssignment = () => {
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedTier, setSelectedTier] = useState('');
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'unassigned'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, tiersRes] = await Promise.all([
        salesEmployeeService.getAll(),
        tierService.getAll(),
      ]);
      setSalesEmployees(empRes.data || []);
      setUnassigned((empRes.data || []).filter(e => !e.current_tier_id));
      setTiers(tiersRes.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = (employee) => {
    setSelectedEmployees([employee.employee_id]);
    setShowAssignModal(true);
  };

  const handleBulkAssign = () => {
    if (selectedEmployees.length === 0) {
      return toast.error('Select at least one employee');
    }
    setShowAssignModal(true);
  };

  const toggleSelectEmployee = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleAssignSubmit = async () => {
    if (!selectedTier) return toast.error('Please select a tier');
    if (selectedEmployees.length === 0) return toast.error('No employees selected');

    try {
      if (selectedEmployees.length === 1) {
        await salesEmployeeService.assign(selectedEmployees[0], selectedTier, joinedDate);
      } else {
        await salesEmployeeService.bulkAssign(selectedEmployees, selectedTier, joinedDate);
      }
      toast.success(`${selectedEmployees.length} employee(s) assigned to tier`);
      setShowAssignModal(false);
      setSelectedEmployees([]);
      setSelectedTier('');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemove = async (employee) => {
    if (!window.confirm(`Remove ${employee.employee_name} from tier assignment?`)) return;
    try {
      await salesEmployeeService.remove(employee.employee_id);
      toast.success('Employee removed from tier');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredEmployees = salesEmployees.filter(emp => {
    const matchesSearch =
      emp.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesView = viewMode === 'all' || !emp.current_tier_id;
    
    return matchesSearch && matchesView;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Sales Employee Assignments
            </h1>
            <p className="text-slate-600 mt-1">
              Assign tiers to Sales department employees
            </p>
          </div>
          <button
            onClick={handleBulkAssign}
            disabled={selectedEmployees.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <UserPlus className="w-5 h-5" />
            Assign Tier ({selectedEmployees.length})
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Sales Employees" value={salesEmployees.length} icon={Users} color="blue" />
          <StatCard label="Assigned to Tier" value={salesEmployees.filter(e => e.current_tier_id).length} icon={CheckCircle} color="green" />
          <StatCard label="Unassigned" value={unassigned.length} icon={AlertCircle} color="amber" />
          <StatCard label="Available Tiers" value={tiers.length} icon={Award} color="purple" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  viewMode === 'all' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({salesEmployees.length})
              </button>
              <button
                onClick={() => setViewMode('unassigned')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  viewMode === 'unassigned' 
                    ? 'bg-amber-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unassigned ({unassigned.length})
              </button>
            </div>
          </div>
        </div>

        {/* Employees List */}
        {filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-lg">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {viewMode === 'unassigned' ? 'All Sales Employees Assigned' : 'No Sales Employees Found'}
            </h3>
            <p className="text-gray-500">
              {viewMode === 'unassigned' 
                ? 'All active Sales employees have been assigned to a tier'
                : 'Add employees to Sales department to see them here'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-4 px-4 text-left">
                      <input
                        type="checkbox"
                        checked={filteredEmployees.length > 0 && 
                          filteredEmployees.every(e => selectedEmployees.includes(e.employee_id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees(filteredEmployees.map(e => e.employee_id));
                          } else {
                            setSelectedEmployees([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Employee</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Code</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Department</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Current Tier</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase">Base Salary</th>
                    <th className="text-center py-4 px-6 text-xs font-bold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-blue-50 transition-colors">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.employee_id)}
                          onChange={() => toggleSelectEmployee(emp.employee_id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {emp.employee_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{emp.employee_name}</p>
                            <p className="text-xs text-gray-500">{emp.employee_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                        {emp.employee_code}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {emp.department}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {emp.current_tier_id ? (
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: emp.tier_color || '#3B82F6' }}
                          >
                            {emp.tier_name}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" />
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {emp.base_salary_pkr 
                          ? `Rs ${parseFloat(emp.base_salary_pkr).toLocaleString()}` 
                          : '—'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {emp.current_tier_id ? (
                            <button
                              onClick={() => handleRemove(emp)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Remove from tier"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignClick(emp)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium"
                            >
                              <Plus className="w-3 h-3" />
                              Assign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <AssignModal
            employees={salesEmployees.filter(e => selectedEmployees.includes(e.employee_id))}
            tiers={tiers}
            selectedTier={selectedTier}
            setSelectedTier={setSelectedTier}
            joinedDate={joinedDate}
            setJoinedDate={setJoinedDate}
            onSubmit={handleAssignSubmit}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedEmployees([]);
              setSelectedTier('');
            }}
          />
        )}
      </div>
    </div>
  );
};

// ═══════════════ STAT CARD ═══════════════
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    amber: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color]}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

// ═══════════════ ASSIGN MODAL ═══════════════
const AssignModal = ({ 
  employees, tiers, selectedTier, setSelectedTier,
  joinedDate, setJoinedDate, onSubmit, onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5" />
            Assign Tier
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Selected Employees */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selected Employees ({employees.length})
            </label>
            <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-1">
              {employees.map(emp => (
                <div key={emp.employee_id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{emp.employee_name}</span>
                  <span className="text-gray-500 text-xs">{emp.employee_code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Select Tier */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Tier *
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a tier --</option>
              {tiers.map(tier => (
                <option key={tier.id} value={tier.id}>
                  {tier.name} — Rs {parseFloat(tier.base_salary_pkr).toLocaleString()} / ${tier.monthly_target_usd}/mo
                </option>
              ))}
            </select>
          </div>

          {/* Joined Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tier Start Date
            </label>
            <input
              type="date"
              value={joinedDate}
              onChange={(e) => setJoinedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview */}
          {selectedTier && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 font-semibold mb-1">📋 Summary</p>
              <p className="text-xs text-blue-800">
                {employees.length} employee(s) will be assigned to{' '}
                <strong>{tiers.find(t => t.id === parseInt(selectedTier))?.name}</strong> tier
                starting from <strong>{new Date(joinedDate).toLocaleDateString()}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!selectedTier}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-medium disabled:opacity-50"
          >
            Assign {employees.length > 1 ? `${employees.length} Employees` : 'Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesEmployeeAssignment;