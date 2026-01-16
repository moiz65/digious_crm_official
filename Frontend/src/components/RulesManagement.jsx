import { useState, useEffect } from 'react';
import { endpoints } from '../config/api';
import {
  Clock, Coffee, Cigarette, Users, AlertCircle, Plus, Edit2, Trash2,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Filter, Download
} from 'lucide-react';

export function RulesManagement() {
  const [rules, setRules] = useState([
    {
      id: 1,
      rule_name: 'Office Working Hours - Night Shift',
      rule_type: 'WORKING_HOURS',
      description: 'Office working hours from 21:00 (9 PM) to 06:00 (6 AM)',
      start_time: '21:00',
      end_time: '06:00',
      total_hours: 9,
      is_active: true,
      priority: 1
    },
    {
      id: 2,
      rule_name: 'Smoke Break',
      rule_type: 'BREAK_TIME',
      description: 'Smoke break allowed during working hours',
      break_type: 'Smoke Break',
      break_duration_minutes: 5,
      is_active: true,
      priority: 2
    },
    {
      id: 3,
      rule_name: 'Dinner Break',
      rule_type: 'BREAK_TIME',
      description: 'Dinner/Lunch break during working hours',
      break_type: 'Dinner Break',
      break_duration_minutes: 60,
      is_active: true,
      priority: 2
    },
    {
      id: 4,
      rule_name: 'Washroom Break',
      rule_type: 'BREAK_TIME',
      description: 'Washroom/Restroom break',
      break_type: 'Washroom Break',
      break_duration_minutes: 10,
      is_active: true,
      priority: 3
    },
    {
      id: 5,
      rule_name: 'Prayer Break',
      rule_type: 'BREAK_TIME',
      description: 'Prayer break during working hours',
      break_type: 'Prayer Break',
      break_duration_minutes: 10,
      is_active: true,
      priority: 3
    },
    {
      id: 6,
      rule_name: 'Overtime - Standard Rate',
      rule_type: 'OVERTIME',
      description: 'Overtime payment after regular working hours (9 hours)',
      overtime_starts_after_minutes: 540,
      overtime_multiplier: 1.5,
      is_active: true,
      priority: 4
    }
  ]);

  const [expandedRow, setExpandedRow] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'WORKING_HOURS',
    description: '',
    start_time: '',
    end_time: '',
    total_hours: '',
    break_type: '',
    break_duration_minutes: '',
    overtime_starts_after_minutes: '',
    overtime_multiplier: '',
    is_active: true,
    priority: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getIconForRuleType = (ruleType) => {
    switch (ruleType) {
      case 'WORKING_HOURS':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'BREAK_TIME':
        return <Coffee className="h-5 w-5 text-amber-600" />;
      case 'OVERTIME':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'LEAVE':
        return <Users className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (ruleType) => {
    return ruleType.replace('_', ' ');
  };

  const getTypeColor = (ruleType) => {
    switch (ruleType) {
      case 'WORKING_HOURS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'BREAK_TIME':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'OVERTIME':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'LEAVE':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredRules = filterType === 'ALL' 
    ? rules 
    : rules.filter(rule => rule.rule_type === filterType);

  const sortedRules = [...filteredRules].sort((a, b) => a.priority - b.priority);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name.includes('minutes') || name.includes('hours') || name.includes('multiplier') ? (value ? parseFloat(value) : '') : value)
    }));
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.rule_name.trim()) {
        setError('Rule name is required');
        setLoading(false);
        return;
      }

      // Validate based on rule type
      if (formData.rule_type === 'WORKING_HOURS') {
        if (!formData.start_time || !formData.end_time || !formData.total_hours) {
          setError('Start time, end time, and total hours are required for working hours rule');
          setLoading(false);
          return;
        }
      } else if (formData.rule_type === 'BREAK_TIME') {
        if (!formData.break_type.trim() || !formData.break_duration_minutes) {
          setError('Break type and duration are required for break time rule');
          setLoading(false);
          return;
        }
      } else if (formData.rule_type === 'OVERTIME') {
        if (!formData.overtime_starts_after_minutes || !formData.overtime_multiplier) {
          setError('Overtime start time and multiplier are required for overtime rule');
          setLoading(false);
          return;
        }
      }

      const response = await fetch(endpoints.rules.breakRules, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Add new rule to state with a generated ID
        const newRule = {
          id: Math.max(...rules.map(r => r.id), 0) + 1,
          ...formData
        };
        setRules(prev => [...prev, newRule]);

        // Reset form
        setFormData({
          rule_name: '',
          rule_type: 'WORKING_HOURS',
          description: '',
          start_time: '',
          end_time: '',
          total_hours: '',
          break_type: '',
          break_duration_minutes: '',
          overtime_starts_after_minutes: '',
          overtime_multiplier: '',
          is_active: true,
          priority: 0
        });

        setShowAddForm(false);
        alert('✅ Rule added successfully!');
      } else {
        setError(data.message || 'Failed to add rule');
      }
    } catch (err) {
      setError('Error adding rule: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                Office Rules & Policies
              </h1>
              <p className="text-gray-600 mt-2">Configure office working hours, breaks, and overtime rules</p>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5" />
              Add New Rule
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Rules</p>
                  <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Break Times</p>
                  <p className="text-2xl font-bold text-gray-900">{rules.filter(r => r.rule_type === 'BREAK_TIME').length}</p>
                </div>
                <Coffee className="h-8 w-8 text-amber-600 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Rules</p>
                  <p className="text-2xl font-bold text-gray-900">{rules.filter(r => r.is_active).length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Overtime Rules</p>
                  <p className="text-2xl font-bold text-gray-900">{rules.filter(r => r.rule_type === 'OVERTIME').length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Add Rule Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Plus className="h-6 w-6 text-blue-600" />
              Add New Rule
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg border border-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleAddRule} className="space-y-6">
              {/* Rule Name and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Rule Name *</label>
                  <input
                    type="text"
                    name="rule_name"
                    value={formData.rule_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Office Working Hours"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Rule Type *</label>
                  <select
                    name="rule_type"
                    value={formData.rule_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="WORKING_HOURS">Working Hours</option>
                    <option value="BREAK_TIME">Break Time</option>
                    <option value="OVERTIME">Overtime</option>
                    <option value="LEAVE">Leave</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter rule description..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Conditional fields based on rule type */}
              {formData.rule_type === 'WORKING_HOURS' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Start Time *</label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">End Time *</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Total Hours *</label>
                    <input
                      type="number"
                      name="total_hours"
                      value={formData.total_hours}
                      onChange={handleInputChange}
                      placeholder="e.g., 9"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {formData.rule_type === 'BREAK_TIME' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Break Type *</label>
                    <input
                      type="text"
                      name="break_type"
                      value={formData.break_type}
                      onChange={handleInputChange}
                      placeholder="e.g., Lunch Break"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Duration (minutes) *</label>
                    <input
                      type="number"
                      name="break_duration_minutes"
                      value={formData.break_duration_minutes}
                      onChange={handleInputChange}
                      placeholder="e.g., 30"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {formData.rule_type === 'OVERTIME' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Overtime Starts After (minutes) *</label>
                    <input
                      type="number"
                      name="overtime_starts_after_minutes"
                      value={formData.overtime_starts_after_minutes}
                      onChange={handleInputChange}
                      placeholder="e.g., 540 (9 hours)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Overtime Multiplier *</label>
                    <input
                      type="number"
                      step="0.1"
                      name="overtime_multiplier"
                      value={formData.overtime_multiplier}
                      onChange={handleInputChange}
                      placeholder="e.g., 1.5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Priority and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Priority</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-900">Active Rule</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Adding Rule...' : 'Add Rule'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <div className="flex flex-wrap gap-2">
              {['ALL', 'WORKING_HOURS', 'BREAK_TIME', 'OVERTIME', 'LEAVE'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterType === type
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'ALL' ? 'All Rules' : getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rules Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Rule Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Details</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRules.map((rule, index) => (
                  <tr key={rule.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getIconForRuleType(rule.rule_type)}
                        <span className="font-semibold text-gray-900">{rule.rule_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold border ${getTypeColor(rule.rule_type)}`}>
                        {getTypeLabel(rule.rule_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {rule.rule_type === 'WORKING_HOURS' && (
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{rule.start_time} - {rule.end_time}</p>
                          <p className="text-gray-600">Total: {rule.total_hours} hours</p>
                        </div>
                      )}
                      {rule.rule_type === 'BREAK_TIME' && (
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{rule.break_type}</p>
                          <p className="text-gray-600">{rule.break_duration_minutes} minutes</p>
                        </div>
                      )}
                      {rule.rule_type === 'OVERTIME' && (
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">After {Math.floor(rule.overtime_starts_after_minutes / 60)} hrs {rule.overtime_starts_after_minutes % 60} min</p>
                          <p className="text-gray-600">Rate: {rule.overtime_multiplier}x salary</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {rule.is_active ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-100 text-green-800 font-semibold text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-100 text-red-800 font-semibold text-sm">
                          <XCircle className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setExpandedRow(expandedRow === rule.id ? null : rule.id)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          title="View Details"
                        >
                          {expandedRow === rule.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                        <button 
                          className="p-2 hover:bg-yellow-100 rounded-lg transition-colors text-yellow-600"
                          title="Edit Rule"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button 
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          title="Delete Rule"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expanded Details */}
        {expandedRow && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ChevronUp className="h-6 w-6 text-blue-600" />
              Rule Details
            </h3>
            {sortedRules.find(r => r.id === expandedRow) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Rule Name</p>
                  <p className="text-lg font-semibold text-gray-900">{sortedRules.find(r => r.id === expandedRow)?.rule_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Rule Type</p>
                  <p className="text-lg font-semibold text-gray-900">{getTypeLabel(sortedRules.find(r => r.id === expandedRow)?.rule_type)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 font-medium">Description</p>
                  <p className="text-gray-900">{sortedRules.find(r => r.id === expandedRow)?.description}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RulesManagement;
