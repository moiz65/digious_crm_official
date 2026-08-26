// pages/Admin/PaymentTypes.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, X, Check, RefreshCw, Loader2,
  Banknote, Wallet, CreditCard, Coins, Smartphone,Search, XCircle, CheckCircle, Laptop, 
  Landmark, DollarSign, Zap, Globe, Circle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirm';

const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/${process.env.REACT_APP_API_VERSION || "v1"}`
  : "http://100.114.9.93:5000/api/v1";

// Icon mapping for payment types
const ICON_MAP = {
  'Bank Account': Banknote,
  'PayPal': Wallet,
  'Cash': Coins,
  'Credit Card': CreditCard,
  'Debit Card': CreditCard,
  'Bank Transfer': Landmark,
  'JazzCash': Smartphone,
  'EasyPaisa': Smartphone,
  'Crypto': Zap,
  'Default': DollarSign,
};

const PaymentTypes = ({ paymentTypes, setPaymentTypes, fetchPaymentTypes }) => {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Default',
    color: '#3B82F6',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getToken = () => localStorage.getItem('token') || '';

  // Icon options for dropdown
  const ICON_OPTIONS = [
    { value: 'Bank Account', icon: Banknote, label: 'Bank Account' },
    { value: 'PayPal', icon: Wallet, label: 'PayPal' },
    { value: 'Cash', icon: Coins, label: 'Cash' },
    { value: 'Credit Card', icon: CreditCard, label: 'Credit Card' },
    { value: 'Debit Card', icon: CreditCard, label: 'Debit Card' },
    { value: 'Bank Transfer', icon: Landmark, label: 'Bank Transfer' },
    { value: 'JazzCash', icon: Smartphone, label: 'JazzCash' },
    { value: 'EasyPaisa', icon: Smartphone, label: 'EasyPaisa' },
    { value: 'Crypto', icon: Zap, label: 'Crypto' },
    { value: 'Default', icon: DollarSign, label: 'Default' },
  ];

  const fetchPaymentTypesData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/types/payment-types?include_inactive=true`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        if (setPaymentTypes) setPaymentTypes(data.data);
      }
    } catch (err) {
      console.error('Error fetching payment types:', err);
      toast.error('Failed to load payment types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!paymentTypes || paymentTypes.length === 0) {
      fetchPaymentTypesData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const url = editingType
        ? `${API_BASE}/types/payment-types/${editingType.id}`
        : `${API_BASE}/types/payment-types`;
      const method = editingType ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingType ? 'Payment type updated!' : 'Payment type created!');
        setShowModal(false);
        setEditingType(null);
        setFormData({ name: '', description: '', icon: 'Default', color: '#3B82F6' });
        if (fetchPaymentTypes) {
          fetchPaymentTypes();
        } else {
          fetchPaymentTypesData();
        }
      } else {
        setError(data.message || 'Failed to save');
        toast.error(data.message || 'Failed to save');
      }
    } catch (err) {
      console.error('Error saving payment type:', err);
      setError('Something went wrong');
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type) => {
    if (!(await confirmDialog(`Delete payment type "${type.name}"?`))) return;

    try {
      const res = await fetch(`${API_BASE}/types/payment-types/${type.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment type deleted!');
        if (fetchPaymentTypes) {
          fetchPaymentTypes();
        } else {
          fetchPaymentTypesData();
        }
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting payment type:', err);
      toast.error('Something went wrong');
    }
  };

  const toggleActive = async (type) => {
    try {
      const res = await fetch(`${API_BASE}/types/payment-types/${type.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ is_active: type.is_active ? 0 : 1 })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(type.is_active ? 'Payment type deactivated' : 'Payment type activated');
        if (fetchPaymentTypes) {
          fetchPaymentTypes();
        } else {
          fetchPaymentTypesData();
        }
      }
    } catch (err) {
      console.error('Error toggling payment type:', err);
      toast.error('Failed to update');
    }
  };

  const openEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      icon: type.icon || 'Default',
      color: type.color || '#3B82F6',
    });
    setShowModal(true);
  };

  const getIconComponent = (iconName) => {
    const Icon = ICON_MAP[iconName] || ICON_MAP['Default'];
    return Icon;
  };

  // Filter payment types
  const filteredPaymentTypes = paymentTypes?.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (type.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-500">Loading payment types...</span>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-blue-600" />
            Payment Types
          </h1>
          <p className="text-slate-500 mt-1">
            Manage payment methods available for expenses
          </p>
        </div>
        <button
          onClick={() => {
            setEditingType(null);
            setFormData({ name: '', description: '', icon: 'Default', color: '#3B82F6' });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Payment Type
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow border border-slate-200 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search payment types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
          />
        </div>
      </div>

      {/* Payment Types Table */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Description</th>
                {/* <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Icon</th> */}
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPaymentTypes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">No payment types found</p>
                    <p className="text-sm text-slate-400">
                      {searchQuery ? 'Try a different search.' : 'Click "Add Payment Type" to create one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPaymentTypes.map((type) => {
                  const IconComponent = getIconComponent(type.icon);
                  return (
                    <tr key={type.id} className={`hover:bg-slate-50 transition ${!type.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: type.color + '22' }}
                          >
                            <IconComponent 
                              className="h-5 w-5" 
                              style={{ color: type.color || '#3B82F6' }} 
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{type.name}</p>
                            <p className="text-xs text-slate-400">ID #{type.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {type.description || <span className="text-slate-400 italic">—</span>}
                      </td>
                      {/* <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-1 rounded text-xs font-mono"
                            style={{ background: type.color + '22', color: type.color }}
                          >
                            {type.icon || 'Default'}
                          </span>
                        </div>
                      </td> */}
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            type.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {type.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleActive(type)}
                            title={type.is_active ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded transition text-sm ${
                              type.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {type.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => openEdit(type)}
                            title="Edit"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(type)}
                            title="Delete"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredPaymentTypes.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600 flex gap-6">
            <span>
              <strong className="text-slate-800">
                {paymentTypes?.filter((c) => c.is_active).length || 0}
              </strong> active
            </span>
            <span>
              <strong className="text-slate-800">
                {paymentTypes?.filter((c) => !c.is_active).length || 0}
              </strong> inactive
            </span>
            <span>
              <strong className="text-slate-800">
                {paymentTypes?.length || 0}
              </strong> total
            </span>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  {editingType ? 'Edit Payment Type' : 'Add Payment Type'}
                </h2>
                <p className="text-blue-100 text-xs mt-0.5">
                  {editingType ? 'Update payment method' : 'Create a new payment method'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bank Transfer, Wise, JazzCash..."
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
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                <select
                  value={formData.icon || 'Default'}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    );
                  })}
                </select>
              </div> */}

              {/* <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 cursor-pointer"
                />
              </div> */}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTypes;