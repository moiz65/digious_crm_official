// Frontend/src/pages/Sales/SalesTiers.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Award, DollarSign, Target, Loader, X, Users } from 'lucide-react';
import { tierService, salesEmployeeService } from '../../services/salesTierService';
import toast from 'react-hot-toast';

const AdminSalesTiers = () => {
  const [tiers, setTiers] = useState([]);
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTier, setEditTier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    base_salary_pkr: '',
    monthly_target_usd: '',
    commission_rate: 0,
    color: '#3B82F6',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tiersRes, empRes] = await Promise.all([
        tierService.getAll(true),
        salesEmployeeService.getAll(),
      ]);
      setTiers(tiersRes.data || []);
      setSalesEmployees(empRes.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const nextLevel = tiers.length > 0 ? Math.max(...tiers.map(t => t.level)) + 1 : 1;
    setEditTier(null);
    setFormData({
      name: '',
      level: nextLevel,
      base_salary_pkr: '',
      monthly_target_usd: '',
      commission_rate: 0,
      color: '#3B82F6',
      description: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (tier) => {
    setEditTier(tier);
    setFormData({
      name: tier.name,
      level: tier.level,
      base_salary_pkr: tier.base_salary_pkr,
      monthly_target_usd: tier.monthly_target_usd,
      commission_rate: tier.commission_rate || 0,
      color: tier.color || '#3B82F6',
      description: tier.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) return toast.error('Tier name is required');
      if (!formData.base_salary_pkr) return toast.error('Base salary is required');
      if (!formData.monthly_target_usd) return toast.error('Monthly target is required');

      if (editTier) {
        await tierService.update(editTier.id, formData);
        toast.success('Tier updated successfully');
      } else {
        await tierService.create(formData);
        toast.success('Tier created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (tier) => {
    const count = salesEmployees.filter(e => e.current_tier_id === tier.id).length;
    if (count > 0) {
      return toast.error(`Cannot delete. ${count} employee(s) are on this tier.`);
    }
    if (!window.confirm(`Delete "${tier.name}" tier?`)) return;

    try {
      await tierService.delete(tier.id);
      toast.success('Tier deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getEmployeeCount = (tierId) => {
    return salesEmployees.filter(e => e.current_tier_id === tierId).length;
  };

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
              <Award className="w-8 h-8 text-blue-600" />
              Sales Tiers Management
            </h1>
            <p className="text-slate-600 mt-1">
              Configure salary tiers and sales targets dynamically
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Create New Tier
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Tiers" value={tiers.length} icon={Award} color="blue" />
          <StatCard label="Active Tiers" value={tiers.filter(t => t.is_active).length} icon={Target} color="green" />
          <StatCard label="Sales Employees" value={salesEmployees.length} icon={Users} color="purple" />
          <StatCard
            label="Highest Target"
            value={tiers.length > 0 ? `$${Math.max(...tiers.map(t => t.monthly_target_usd)).toLocaleString()}` : '$0'}
            icon={DollarSign}
            color="amber"
          />
        </div>

        {/* Tiers Grid */}
        {tiers.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-lg">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tiers Yet</h3>
            <p className="text-gray-500 mb-6">Create your first sales tier to get started</p>
            <button
              onClick={handleOpenCreate}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Create First Tier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.sort((a, b) => a.level - b.level).map((tier) => (
              <div
                key={tier.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100"
              >
                {/* Header */}
                <div
                  className="p-6 text-white"
                  style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}dd)` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                      LEVEL {tier.level}
                    </span>
                    {!tier.is_active && (
                      <span className="text-xs font-semibold bg-red-500/80 px-3 py-1 rounded-full">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold">{tier.name}</h3>
                  {tier.description && (
                    <p className="text-sm text-white/80 mt-1">{tier.description}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Base Salary</span>
                    <span className="font-bold text-gray-800">
                      Rs {parseFloat(tier.base_salary_pkr).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Monthly Target</span>
                    <span className="font-bold text-blue-600">
                      ${parseFloat(tier.monthly_target_usd).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Quarterly Target</span>
                    <span className="font-bold text-indigo-600">
                      ${parseFloat(tier.quarterly_target_usd).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Employees</span>
                    <span className="font-bold text-gray-800">
                      {getEmployeeCount(tier.id)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(tier)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tier)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <TierModal
            editTier={editTier}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
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
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
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

// ═══════════════ TIER MODAL ═══════════════
const TierModal = ({ editTier, formData, setFormData, onSave, onClose }) => {
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const quarterlyTarget = (parseFloat(formData.monthly_target_usd) || 0) * 3;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5" />
            {editTier ? 'Edit Tier' : 'Create New Tier'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tier Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Bronze, Silver, Gold"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Level * <span className="text-xs text-gray-400">(1 = lowest)</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Base Salary (PKR) *
              </label>
              <input
                type="number"
                value={formData.base_salary_pkr}
                onChange={(e) => handleChange('base_salary_pkr', e.target.value)}
                placeholder="20000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Target (USD) *
              </label>
              <input
                type="number"
                value={formData.monthly_target_usd}
                onChange={(e) => handleChange('monthly_target_usd', e.target.value)}
                placeholder="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.commission_rate}
                onChange={(e) => handleChange('commission_rate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="2"
              placeholder="Optional description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">Preview</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Monthly Target</p>
                <p className="font-bold text-gray-900">
                  ${parseFloat(formData.monthly_target_usd || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Quarterly Target</p>
                <p className="font-bold text-blue-700">
                  ${quarterlyTarget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Base Salary</p>
                <p className="font-bold text-gray-900">
                  Rs {parseFloat(formData.base_salary_pkr || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg font-medium"
          >
            {editTier ? 'Update Tier' : 'Create Tier'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesTiers;