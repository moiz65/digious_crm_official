// Frontend/src/pages/Sales/SalesQuarters.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Edit, Trash2, Play, Eye, Loader, X, CheckCircle } from 'lucide-react';
import { quarterService } from '../../services/salesTierService';
import toast from 'react-hot-toast';

const AdminSalesQuarters = () => {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editQuarter, setEditQuarter] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [formData, setFormData] = useState({
    quarter_name: 'Q1',
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    evaluation_date: '',
  });

  useEffect(() => {
    fetchQuarters();
  }, []);

  const fetchQuarters = async () => {
    setLoading(true);
    try {
      const res = await quarterService.getAll();
      setQuarters(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditQuarter(null);
    setFormData({
      quarter_name: 'Q1',
      year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      evaluation_date: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.start_date || !formData.end_date) {
        return toast.error('Start and End dates are required');
      }

      if (editQuarter) {
        await quarterService.update(editQuarter.id, formData);
        toast.success('Quarter updated');
      } else {
        await quarterService.create(formData);
        toast.success('Quarter created');
      }
      setShowModal(false);
      fetchQuarters();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (quarter) => {
    if (!window.confirm(`Delete ${quarter.quarter_name} ${quarter.year}?`)) return;
    try {
      await quarterService.delete(quarter.id);
      toast.success('Quarter deleted');
      fetchQuarters();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePreview = async (quarter) => {
    try {
      const res = await quarterService.preview(quarter.id);
      setPreviewData(res.data);
      setShowPreview(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEvaluate = async (quarter) => {
    if (!window.confirm(
      `Evaluate ${quarter.quarter_name} ${quarter.year}?\n\nThis will:\n` +
      `• Calculate each employee's achievement\n` +
      `• Upgrade/Downgrade tiers automatically\n` +
      `• Update salaries\n\nThis action cannot be undone!`
    )) return;

    setEvaluatingId(quarter.id);
    try {
      const res = await quarterService.evaluate(quarter.id);
      toast.success(res.message);
      fetchQuarters();
      // Show results
      setPreviewData(res.data);
      setShowPreview(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEvaluatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Upcoming: 'bg-gray-100 text-gray-700',
      Active: 'bg-green-100 text-green-700',
      Completed: 'bg-blue-100 text-blue-700',
      Evaluated: 'bg-purple-100 text-purple-700',
    };
    return map[status] || map.Upcoming;
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
              <Calendar className="w-8 h-8 text-blue-600" />
              Sales Quarters
            </h1>
            <p className="text-slate-600 mt-1">
              Manage quarterly evaluation periods
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Create Quarter
          </button>
        </div>

        {/* Quarters Grid */}
        {quarters.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-lg">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Quarters Yet</h3>
            <p className="text-gray-500 mb-6">Create your first quarter to get started</p>
            <button
              onClick={handleOpenCreate}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Create First Quarter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quarters.map((quarter) => (
              <div
                key={quarter.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100"
              >
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                      {quarter.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold">
                    {quarter.quarter_name} {quarter.year}
                  </h3>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Period:</span>
                    <span className="font-medium text-gray-800">
                      {new Date(quarter.start_date).toLocaleDateString()} -{' '}
                      {new Date(quarter.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Evaluation:</span>
                    <span className="font-medium text-gray-800">
                      {new Date(quarter.evaluation_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(quarter.status)}`}>
                      {quarter.status}
                    </span>
                  </div>
                </div>

                <div className="px-6 pb-6 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(quarter)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleEvaluate(quarter)}
                      disabled={evaluatingId === quarter.id || quarter.status === 'Evaluated'}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-medium text-sm disabled:opacity-50"
                    >
                      {evaluatingId === quarter.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Evaluating
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Evaluate
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditQuarter(quarter);
                        setFormData({
                          quarter_name: quarter.quarter_name,
                          year: quarter.year,
                          start_date: quarter.start_date.split('T')[0],
                          end_date: quarter.end_date.split('T')[0],
                          evaluation_date: quarter.evaluation_date.split('T')[0],
                        });
                        setShowModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg font-medium text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(quarter)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <QuarterModal
            editQuarter={editQuarter}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
          />
        )}

        {/* Preview/Result Modal */}
        {showPreview && previewData && (
          <PreviewModal
            data={previewData}
            onClose={() => {
              setShowPreview(false);
              setPreviewData(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// ═══════════════ QUARTER MODAL ═══════════════
const QuarterModal = ({ editQuarter, formData, setFormData, onSave, onClose }) => {
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-set quarter name based on start date
  const handleStartDateChange = (date) => {
    handleChange('start_date', date);
    if (date) {
      const month = new Date(date).getMonth() + 1;
      const q = Math.ceil(month / 3);
      handleChange('quarter_name', `Q${q}`);
    }
  };

  // Auto-set evaluation date based on end date
  const handleEndDateChange = (date) => {
    handleChange('end_date', date);
    if (date) {
      const d = new Date(date);
      d.setDate(d.getDate() + 1);
      handleChange('evaluation_date', d.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {editQuarter ? 'Edit Quarter' : 'Create New Quarter'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quarter Name
              </label>
              <select
                value={formData.quarter_name}
                onChange={(e) => handleChange('quarter_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option>Q1</option>
                <option>Q2</option>
                <option>Q3</option>
                <option>Q4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Evaluation Date
            </label>
            <input
              type="date"
              value={formData.evaluation_date}
              onChange={(e) => handleChange('evaluation_date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: 1 day after end date
            </p>
          </div>
        </div>

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
            {editQuarter ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════ PREVIEW MODAL ═══════════════
const PreviewModal = ({ data, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = (data.preview || data.results || []).filter(p => {
    const name = p.employee_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const isEvaluated = !!data.results;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {isEvaluated ? '✅ Evaluation Results' : '🔍 Preview — Before Evaluation'}
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              {data.quarter || `${data.quarter_name} ${data.year}`} • {filtered.length} employees
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Employee</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Tier</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Sales</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Target</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Achievement</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p, idx) => {
                  const change = p.tier_change || p.projected_change || 'SAME';
                  const changeColor = {
                    UPGRADE: 'bg-green-100 text-green-700',
                    DOWNGRADE: 'bg-red-100 text-red-700',
                    SAME: 'bg-gray-100 text-gray-700',
                  }[change];

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">
                        {p.employee_name || `Emp #${p.employee_id}`}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {p.tier_at_start || p.current_tier}
                        {p.tier_at_end && p.tier_at_end !== (p.tier_at_start || p.current_tier) && (
                          <span className="text-gray-400"> → {p.tier_at_end}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-800 font-medium">
                        ${parseFloat(p.total_sales || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600">
                        ${parseFloat(p.target || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span className={`font-bold ${
                          parseFloat(p.achievement) >= 100 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {parseFloat(p.achievement).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${changeColor}`}>
                          {change === 'UPGRADE' ? '⬆️ UPGRADE' :
                           change === 'DOWNGRADE' ? '⬇️ DOWNGRADE' : '— SAME'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No employees found
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesQuarters;