import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { Plus, Edit, Trash2, Search, X, ChevronDown } from 'lucide-react';

const API = '/api/v1/expenses';

const getToken = () =>
  localStorage.getItem('token') || localStorage.getItem('authToken') || '';

const apiFetch = async (url, opts = {}) => {
  try {
    const r = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      ...opts,
    });
    
    // Handle non-JSON responses gracefully
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Not JSON — likely HTML error page
      return {
        success: false,
        message: `Server error (${r.status}): ${r.statusText || 'Unknown error'}`
      };
    }
    
    // If response not OK but has JSON, return it (let backend message show)
    if (!r.ok && data) return data;
    
    // If response OK, return data
    return data;
  } catch (err) {
    return {
      success: false,
      message: `Network error: ${err.message}`
    };
  }
};

// ── Searchable Category Dropdown ──────────────────────────
const CategorySelect = ({ categories, value, onChange, onCategoryCreated, placeholder = 'Select category…' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);

  const selected = categories.find(c => String(c.id) === String(value));
  const filtered = categories.filter(
    c => c.is_active && c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await apiFetch(`${API}/categories`, {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.success) {
        onCategoryCreated(res.data);
        onChange(res.data.id);
        setNewName('');
        setShowNewForm(false);
        setOpen(false);
        setSearch('');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white text-left text-sm"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={15} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Search size={13} className="text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search categories…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}>
                  <X size={13} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No categories found</li>
            )}
            {filtered.map(cat => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => { onChange(cat.id); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-blue-50 transition ${String(cat.id) === String(value) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#3B82F6' }} />
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 p-2">
            {showNewForm ? (
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
                <button type="submit" disabled={creating}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
                  {creating ? '…' : 'Add'}
                </button>
                <button type="button" onClick={() => { setShowNewForm(false); setNewName(''); }}
                  className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">
                  <X size={13} />
                </button>
              </form>
            ) : (
              <button type="button" onClick={() => setShowNewForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <Plus size={13} /> Add new category
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────
const AdminExpense = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem] = useState('expenses');

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({ category_id: '', amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadCategories = async () => {
    const res = await apiFetch(`${API}/categories`);
    if (res.success) setCategories(res.data);
  };

  const loadExpenses = async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    if (filterCategory) params.append('category_id', filterCategory);
    const res = await apiFetch(`${API}?${params.toString()}`);
    if (res.success) { setExpenses(res.data); setTotal(res.total || 0); }
    else setError(res.message || 'Failed to load expenses');
    setLoading(false);
  };

  useEffect(() => { loadCategories(); }, []); // eslint-disable-line
  useEffect(() => { loadExpenses(); }, [search, fromDate, toDate, filterCategory]); // eslint-disable-line

  const handleSave = async e => {
    e.preventDefault();
    setFormError('');
    if (!formData.category_id) { setFormError('Please select a category'); return; }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { setFormError('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const res = editingExpense
        ? await apiFetch(`${API}/${editingExpense.id}`, { method: 'PUT', body: JSON.stringify(formData) })
        : await apiFetch(API, { method: 'POST', body: JSON.stringify(formData) });
      if (res.success) {
        setShowModal(false); setEditingExpense(null);
        setFormData({ category_id: '', amount: '', note: '' });
        loadExpenses();
      } else setFormError(res.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this expense?')) return;
    const res = await apiFetch(`${API}/${id}`, { method: 'DELETE' });
    if (res.success) loadExpenses();
    else alert(res.message || 'Delete failed');
  };

  const openEdit = exp => {
    setEditingExpense(exp);
    setFormData({ category_id: exp.category_id, amount: exp.amount, note: exp.note || '' });
    setFormError(''); setShowModal(true);
  };
  const openAdd = () => {
    setEditingExpense(null);
    setFormData({ category_id: '', amount: '', note: '' });
    setFormError(''); setShowModal(true);
  };

  const setToday = () => { const d = new Date().toISOString().slice(0, 10); setFromDate(d); setToDate(d); };
  const setThisWeek = () => {
    const now = new Date(); const day = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    setFromDate(mon.toISOString().slice(0, 10)); setToDate(now.toISOString().slice(0, 10));
  };
  const setThisMonth = () => {
    const now = new Date();
    setFromDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
    setToDate(now.toISOString().slice(0, 10));
  };
  const clearFilters = () => { setSearch(''); setFromDate(''); setToDate(''); setFilterCategory(''); };

  const fmt = v => `PKR ${parseFloat(v).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = t => { const [h, m] = t.split(':'); const hr = parseInt(h, 10); return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`; };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={() => {}}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
              <p className="text-gray-500 text-sm mt-1">Track and manage company expenses</p>
            </div>
            <button onClick={openAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full flex items-center gap-2 transition shadow-lg">
              <Plus size={20} /> Add Expense
            </button>
          </div>

            {/* Filters */}

            {/*Serach bar to serach cate gory and note*/}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative">
              <Search size={15} className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by category or note…" className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none
                  focus:border-blue-600 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none
                  focus:border-blue-600 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Category:</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none
                  focus:border-blue-600 text-sm">
                <option value="">All</option>
                {categories.filter(c => c.is_active).map(cat => (
                  <option key={cat.id
                  } value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {error && <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100">{error}</div>}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['ID', 'Date', 'Category', 'Amount', 'Note', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">Loading…</td></tr>
                  ) : expenses.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No expenses found</td></tr>
                  ) : expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">#{exp.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">{fmtDate(exp.expense_date)}</div>
                        <div className="text-xs text-gray-400">{fmtTime(exp.expense_time)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: exp.category_color || '#3B82F6' }} />
                          {exp.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">{fmt(exp.amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{exp.note || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(exp)} title="Edit"
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(exp.id)} title="Delete"
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Expenses</p>
                <p className="text-xs text-gray-400 mt-1">{expenses.length} record{expenses.length !== 1 ? 's' : ''} · current filters</p>
              </div>
              <p className="text-4xl font-extrabold text-blue-600">{fmt(total)}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-600 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Plus size={20} /> {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="hover:bg-blue-700 rounded-lg p-1 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Category <span className="text-blue-600">*</span>
                </label>
                <CategorySelect
                  categories={categories}
                  value={formData.category_id}
                  onChange={id => setFormData(p => ({ ...p, category_id: id }))}
                  onCategoryCreated={cat => setCategories(prev => [...prev, cat])}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Amount (PKR) <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400 text-sm font-medium">PKR</span>
                  <input type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                    className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 text-sm"
                    required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Note</label>
                <textarea placeholder="Add a note…" value={formData.note}
                  onChange={e => setFormData(p => ({ ...p, note: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 resize-none text-sm"
                  rows="3" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow disabled:opacity-60 text-sm">
                  {saving ? 'Saving…' : editingExpense ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpense;