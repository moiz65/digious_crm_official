import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { endpoints, getAuthHeaders, getCurrentEmployeeId } from '../config/api';
import PagePreloader from './PagePreloader';
import {
  FileText, Plus, Search, Filter, Eye, Edit3, Trash2,
  ArrowLeft, X, Clock, Users, Building, Bell, Tag,
  CheckCircle, AlertTriangle, RefreshCw, Calendar,
  Megaphone, Shield, Star, Info,
} from 'lucide-react';

// ─── Category badge ──────────────────────────────────────────
const CATEGORY_STYLES = {
  general: 'bg-gray-100 text-gray-700 border-gray-300',
  policy: 'bg-blue-100 text-blue-700 border-blue-300',
  announcement: 'bg-purple-100 text-purple-700 border-purple-300',
  warning: 'bg-orange-100 text-orange-700 border-orange-300',
  appreciation: 'bg-green-100 text-green-700 border-green-300',
  event: 'bg-pink-100 text-pink-700 border-pink-300',
  other: 'bg-gray-100 text-gray-600 border-gray-300',
};

const CATEGORY_ICONS = {
  general: Info,
  policy: Shield,
  announcement: Megaphone,
  warning: AlertTriangle,
  appreciation: Star,
  event: Calendar,
  other: FileText,
};

const CategoryBadge = ({ category }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap capitalize ${CATEGORY_STYLES[category] || CATEGORY_STYLES.other}`}>
    {category || 'general'}
  </span>
);

const PriorityBadge = ({ priority }) => {
  const styles = {
    low: 'bg-gray-100 text-gray-700 border-gray-300',
    medium: 'bg-blue-100 text-blue-700 border-blue-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    urgent: 'bg-red-100 text-red-700 border-red-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap capitalize ${styles[priority] || 'bg-gray-100 text-gray-600'}`}>
      {priority === 'urgent' && '⚠ '}{priority || 'medium'}
    </span>
  );
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ══════════════════════════════════════════════════════════════
// MEMO DETAIL VIEW
// ══════════════════════════════════════════════════════════════
const MemoDetailView = ({ memo, onBack, isHR, onEdit, onDelete }) => {
  if (!memo) return null;
  const Icon = CATEGORY_ICONS[memo.category] || FileText;

  return (
    <div>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {memo.memo_number}
                <CategoryBadge category={memo.category} />
                <PriorityBadge priority={memo.priority} />
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                By {memo.created_by_name} &bull; {fmtDate(memo.created_at)}
                {memo.target_type === 'department' && <> &bull; <Building className="inline w-3 h-3" /> {memo.target_department}</>}
                {memo.target_type === 'all' && <> &bull; <Users className="inline w-3 h-3" /> All Employees</>}
              </p>
            </div>
          </div>
          {isHR && (
            <div className="flex gap-2">
              <button onClick={() => onEdit(memo)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => onDelete(memo.id)} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{memo.title}</h2>
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 whitespace-pre-wrap text-gray-700 leading-relaxed">
          {memo.content}
        </div>

        {/* Meta info */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {memo.effective_date && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Effective Date</p>
              <p className="text-sm font-semibold text-gray-800">{fmtDate(memo.effective_date)}</p>
            </div>
          )}
          {memo.expiry_date && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
              <p className="text-sm font-semibold text-gray-800">{fmtDate(memo.expiry_date)}</p>
            </div>
          )}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Target</p>
            <p className="text-sm font-semibold text-gray-800 capitalize">
              {memo.target_type === 'department' ? memo.target_department : 'All Employees'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className={`text-sm font-semibold ${memo.is_active ? 'text-green-700' : 'text-gray-400'}`}>
              {memo.is_active ? 'Active' : 'Archived'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// CREATE / EDIT MEMO FORM
// ══════════════════════════════════════════════════════════════
const MemoForm = ({ memo, onSubmit, onCancel, departments }) => {
  const [form, setForm] = useState({
    title: memo?.title || '',
    content: memo?.content || '',
    category: memo?.category || 'general',
    priority: memo?.priority || 'medium',
    target_type: memo?.target_type || 'all',
    target_department: memo?.target_department || '',
    effective_date: memo?.effective_date ? memo.effective_date.split('T')[0] : '',
    expiry_date: memo?.expiry_date ? memo.expiry_date.split('T')[0] : '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    if (form.target_type === 'department' && !form.target_department) {
      toast.error('Please select a department');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div>
      <div className="p-6 border-b border-gray-200 flex items-center space-x-4">
        <button onClick={onCancel} className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{memo ? 'Edit Memo' : 'Create New Memo'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-3xl">
        {/* Title */}
        <div>
          <label className={labelClass}>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} className={inputClass} placeholder="Memo title" />
        </div>

        {/* Content */}
        <div>
          <label className={labelClass}>Content *</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={8} className={inputClass} placeholder="Write your memo here..." />
        </div>

        {/* Row: Category + Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
              <option value="general">General</option>
              <option value="policy">Policy</option>
              <option value="announcement">Announcement</option>
              <option value="warning">Warning</option>
              <option value="appreciation">Appreciation</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Target */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Target Audience</label>
            <select name="target_type" value={form.target_type} onChange={handleChange} className={inputClass}>
              <option value="all">All Employees</option>
              <option value="department">Specific Department</option>
            </select>
          </div>
          {form.target_type === 'department' && (
            <div>
              <label className={labelClass}>Department *</label>
              <select name="target_department" value={form.target_department} onChange={handleChange} className={inputClass}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Effective Date</label>
            <input type="date" name="effective_date" value={form.effective_date} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Expiry Date</label>
            <input type="date" name="expiry_date" value={form.expiry_date} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {memo ? 'Update Memo' : 'Create Memo'}
          </button>
          <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN MEMO PAGE
// ══════════════════════════════════════════════════════════════
const MemosPage = () => {
  const { user, role } = useAuth();
  const isHR = role === 'hr' || role === 'admin';
  const employeeId = getCurrentEmployeeId();

  const [view, setView] = useState('list');       // list | detail | create | edit
  const [memos, setMemos] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [editMemo, setEditMemo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');

  // ─── Fetch memos ──────────────────────────────────────────
  const fetchMemos = useCallback(async () => {
    setLoading(true);
    try {
      const url = isHR ? endpoints.memos.getAll : endpoints.memos.getByEmployee(employeeId);
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setMemos(data.data || []);
    } catch (err) {
      console.error('Failed to fetch memos:', err);
      toast.error('Failed to load memos');
    } finally {
      setLoading(false);
    }
  }, [isHR, employeeId]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch(endpoints.memos.departments, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setDepartments(data.data || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }, []);

  useEffect(() => { fetchMemos(); fetchDepartments(); }, [fetchMemos, fetchDepartments]);

  // ─── CRUD handlers ────────────────────────────────────────
  const handleCreate = async (form) => {
    try {
      const res = await fetch(endpoints.memos.create, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Memo created successfully');
        setView('list');
        fetchMemos();
      } else {
        toast.error(data.message || 'Failed to create memo');
      }
    } catch (err) {
      toast.error('Failed to create memo');
    }
  };

  const handleUpdate = async (form) => {
    try {
      const res = await fetch(endpoints.memos.update(editMemo.id), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Memo updated');
        setView('list');
        setEditMemo(null);
        fetchMemos();
      } else {
        toast.error(data.message || 'Failed to update memo');
      }
    } catch (err) {
      toast.error('Failed to update memo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this memo?')) return;
    try {
      const res = await fetch(endpoints.memos.delete(id), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Memo deleted');
        setView('list');
        fetchMemos();
      } else {
        toast.error(data.message || 'Failed to delete memo');
      }
    } catch (err) {
      toast.error('Failed to delete memo');
    }
  };

  const openEdit = (memo) => {
    setEditMemo(memo);
    setView('edit');
  };

  // ─── Filtering ─────────────────────────────────────────────
  const filtered = memos.filter(m => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (targetFilter === 'all-employees' && m.target_type !== 'all') return false;
    if (targetFilter === 'department' && m.target_type !== 'department') return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        (m.title || '').toLowerCase().includes(s) ||
        (m.content || '').toLowerCase().includes(s) ||
        (m.memo_number || '').toLowerCase().includes(s) ||
        (m.target_department || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  // ─── Stats ─────────────────────────────────────────────────
  const stats = {
    total: memos.length,
    active: memos.filter(m => m.is_active).length,
    urgent: memos.filter(m => m.priority === 'urgent' || m.priority === 'high').length,
    departments: new Set(memos.filter(m => m.target_type === 'department').map(m => m.target_department)).size,
  };

  // ─── Render ────────────────────────────────────────────────
  if (loading && view === 'list') return <PagePreloader />;

  return (
    <div className="max-w-7xl mx-auto">
          {/* ── Detail View ─────────────── */}
          {view === 'detail' && selectedMemo && (
            <MemoDetailView
              memo={selectedMemo}
              onBack={() => { setSelectedMemo(null); setView('list'); }}
              isHR={isHR}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}

          {/* ── Create Form ─────────────── */}
          {view === 'create' && isHR && (
            <MemoForm
              onSubmit={handleCreate}
              onCancel={() => setView('list')}
              departments={departments}
            />
          )}

          {/* ── Edit Form ──────────────── */}
          {view === 'edit' && isHR && editMemo && (
            <MemoForm
              memo={editMemo}
              onSubmit={handleUpdate}
              onCancel={() => { setEditMemo(null); setView('list'); }}
              departments={departments}
            />
          )}

          {/* ── List View ──────────────── */}
          {view === 'list' && (
            <div className="p-6">
              {/* Page header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Megaphone className="w-7 h-7 text-indigo-600" />
                    Memos
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    {isHR ? 'Manage company-wide and department memos' : 'View company memos relevant to you'}
                  </p>
                </div>
                {isHR && (
                  <button
                    onClick={() => setView('create')}
                    className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> New Memo
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg"><FileText className="w-5 h-5 text-indigo-600" /></div>
                    <div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-xs text-gray-500">Total Memos</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                    <div><p className="text-2xl font-bold text-gray-900">{stats.active}</p><p className="text-xs text-gray-500">Active</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
                    <div><p className="text-2xl font-bold text-gray-900">{stats.urgent}</p><p className="text-xs text-gray-500">High / Urgent</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg"><Building className="w-5 h-5 text-purple-600" /></div>
                    <div><p className="text-2xl font-bold text-gray-900">{stats.departments}</p><p className="text-xs text-gray-500">Dept Targeted</p></div>
                  </div>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search memos..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="all">All Categories</option>
                  <option value="general">General</option>
                  <option value="policy">Policy</option>
                  <option value="announcement">Announcement</option>
                  <option value="warning">Warning</option>
                  <option value="appreciation">Appreciation</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
                <select value={targetFilter} onChange={e => setTargetFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="all">All Targets</option>
                  <option value="all-employees">All Employees</option>
                  <option value="department">Department Only</option>
                </select>
                <button onClick={fetchMemos} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600" title="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Memo cards */}
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500">No memos found</h3>
                  <p className="text-gray-400 text-sm mt-1">{isHR ? 'Create a new memo to get started' : 'No memos are available for you right now'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(memo => {
                    const Icon = CATEGORY_ICONS[memo.category] || FileText;
                    return (
                      <div
                        key={memo.id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => { setSelectedMemo(memo); setView('detail'); }}
                      >
                        <div className="p-5">
                          {/* Top row */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs text-gray-400 font-mono">{memo.memo_number}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <CategoryBadge category={memo.category} />
                              <PriorityBadge priority={memo.priority} />
                            </div>
                          </div>

                          {/* Title & preview */}
                          <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-indigo-700 transition">
                            {memo.title}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-3 mb-3 leading-relaxed">
                            {memo.content}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {fmtDate(memo.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              {memo.target_type === 'department' ? (
                                <><Building className="w-3 h-3" /> {memo.target_department}</>
                              ) : (
                                <><Users className="w-3 h-3" /> All</>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* HR actions */}
                        {isHR && (
                          <div className="px-5 py-3 border-t border-gray-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => { e.stopPropagation(); openEdit(memo); }}
                              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(memo.id); }}
                              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
  );
};

export default MemosPage;
