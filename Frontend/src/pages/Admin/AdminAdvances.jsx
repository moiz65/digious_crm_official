import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import {
  DollarSign, Search, Filter, Plus, Edit, Trash2, Eye, X,
  RefreshCw, TrendingUp, TrendingDown, Calendar, Check,
  CreditCard, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Users, AlertCircle, Banknote, PauseCircle, PlayCircle,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/${process.env.REACT_APP_API_VERSION || "v1"}`
  : "http://localhost:5000/api/v1";

const getToken = () => localStorage.getItem("token") || localStorage.getItem("authToken") || "";

const apiFetch = async (url, opts = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const r = await fetch(url, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      signal: controller.signal,
      ...opts,
    });
    clearTimeout(timeoutId);
    const text = await r.text();
    if (!text.trim()) return { success: false, message: `Empty response (${r.status})` };
    try { return JSON.parse(text); }
    catch { return { success: false, message: `Server error (${r.status})` }; }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return { success: false, message: 'Request timed out - please try again' };
    throw err;
  }
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 })
    .format(amount || 0).replace("PKR", "Rs.");

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const TYPE_LABELS = { advance: "Advance", short_term_loan: "Short-Term Loan", long_term_loan: "Long-Term Loan" };
const TYPE_COLORS = { advance: "bg-blue-100 text-blue-700", short_term_loan: "bg-amber-100 text-amber-700", long_term_loan: "bg-purple-100 text-purple-700" };
const STATUS_COLORS = {
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-rose-100 text-rose-700",
  on_hold: "bg-amber-100 text-amber-700",
  pending_approval: "bg-sky-100 text-sky-700",
};
const STATUS_LABELS = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On Hold",
  pending_approval: "Pending Approval",
};
const REASON_OPTIONS = [
  "Medical Emergency",
  "Personal Needs",
  "Education",
  "House Rent / Deposit",
  "Family Emergency",
  "Wedding / Event",
  "Vehicle Purchase",
  "Home Renovation",
  "Other",
];

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Calculate when first deduction will happen based on form inputs
const computeFirstDeduction = (form) => {
  if (!form.disbursement_date) return null;
  const disb = new Date(form.disbursement_date + 'T00:00:00');
  switch (form.repayment_start_option) {
    case 'same_month':
      return `${MONTH_NAMES[disb.getMonth() + 1]} ${disb.getFullYear()}`;
    case 'next_month': {
      const d = new Date(disb); d.setMonth(d.getMonth() + 1);
      return `${MONTH_NAMES[d.getMonth() + 1]} ${d.getFullYear()}`;
    }
    case 'grace_period': {
      const g = parseInt(form.grace_period_months) || 0;
      const d = new Date(disb); d.setMonth(d.getMonth() + g);
      return `${MONTH_NAMES[d.getMonth() + 1]} ${d.getFullYear()}`;
    }
    case 'custom':
      if (!form.repayment_start_date) return null;
      const c = new Date(form.repayment_start_date + 'T00:00:00');
      return `${MONTH_NAMES[c.getMonth() + 1]} ${c.getFullYear()}`;
    default:
      return null;
  }
};

// ─── Main Component ───────────────────────────────────────────────────────
const AdminAdvances = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("advances");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form
  const defaultForm = {
    employee_id: "",
    type: "advance",
    amount: "",
    repayment_months: "1",
    disbursement_date: new Date().toISOString().slice(0, 10),
    repayment_start_option: "same_month",   // same_month | next_month | grace_period | custom
    repayment_start_date: "",               // only used when option is "custom"
    grace_period_months: "0",               // only used when option is "grace_period"
    reason: "",
    reason_custom: "",
    notes: "",
  };
  const [form, setForm] = useState({ ...defaultForm });

  // ─── Fetchers ───────────────────────────────────────────────────────────
  const fetchAdvances = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("type", filterType);
      const data = await apiFetch(`${API_BASE}/advances?${params}`);
      if (data.success) setAdvances(data.data || []);
      else setError(data.message);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [filterStatus, filterType]);

  const fetchEmployees = useCallback(async () => {
    const data = await apiFetch(`${API_BASE}/advances/employees`);
    if (data.success) setEmployees(data.data || []);
  }, []);

  const fetchSummary = useCallback(async () => {
    const data = await apiFetch(`${API_BASE}/advances/summary`);
    if (data.success) setSummary(data.data || {});
  }, []);

  useEffect(() => { fetchAdvances(); }, [fetchAdvances]);
  useEffect(() => { fetchEmployees(); fetchSummary(); }, [fetchEmployees, fetchSummary]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.amount || !form.repayment_months) return;
    setSaving(true); setError(null);
    try {
      // Calculate repayment_start_date based on option
      let repayStartDate = null;
      let gracePeriod = 0;
      const disbDate = form.disbursement_date;
      const disbD = new Date(disbDate + 'T00:00:00');

      switch (form.repayment_start_option) {
        case 'same_month':
          // First deduction in the same month as disbursement
          repayStartDate = disbDate;
          break;
        case 'next_month': {
          const next = new Date(disbD);
          next.setMonth(next.getMonth() + 1);
          repayStartDate = next.toISOString().slice(0, 10);
          break;
        }
        case 'grace_period':
          gracePeriod = parseInt(form.grace_period_months) || 0;
          // Backend will compute: disbursement_date + grace_period_months
          break;
        case 'custom':
          repayStartDate = form.repayment_start_date;
          break;
        default:
          repayStartDate = disbDate;
      }

      const body = {
        employee_id: +form.employee_id,
        type: form.type,
        amount: +form.amount,
        repayment_months: +form.repayment_months,
        disbursement_date: disbDate,
        repayment_start_date: repayStartDate,
        grace_period_months: gracePeriod,
        reason: form.reason === 'Other' ? (form.reason_custom || 'Other') : (form.reason || null),
        notes: form.notes,
      };
      const data = await apiFetch(`${API_BASE}/advances`, { method: "POST", body: JSON.stringify(body) });
      if (data.success) {
        await fetchAdvances();
        await fetchSummary();
        setShowCreateModal(false);
        setForm({ ...defaultForm });
      } else setError(data.message || "Failed to create");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this advance/loan? Remaining installments will be skipped.")) return;
    const data = await apiFetch(`${API_BASE}/advances/${id}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
    if (data.success) { fetchAdvances(); fetchSummary(); }
    else setError(data.message);
  };

  const handleToggleHold = async (adv) => {
    const newStatus = adv.status === 'on_hold' ? 'active' : 'on_hold';
    const msg = newStatus === 'on_hold'
      ? "Put this advance on hold? Deductions will be paused."
      : "Resume this advance? Deductions will restart.";
    if (!window.confirm(msg)) return;
    const data = await apiFetch(`${API_BASE}/advances/${adv.id}`, { method: "PUT", body: JSON.stringify({ status: newStatus }) });
    if (data.success) { fetchAdvances(); fetchSummary(); }
    else setError(data.message);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this advance/loan? This cannot be undone.")) return;
    const data = await apiFetch(`${API_BASE}/advances/${id}`, { method: "DELETE" });
    if (data.success) { fetchAdvances(); fetchSummary(); }
    else setError(data.message);
  };

  const openView = async (adv) => {
    const data = await apiFetch(`${API_BASE}/advances/${adv.id}`);
    if (data.success) { setSelectedAdvance(data.data); setShowViewModal(true); }
    else setError(data.message);
  };

  // ─── Computed ───────────────────────────────────────────────────────────
  const monthlyDeductionPreview = form.amount && form.repayment_months
    ? Math.round((parseFloat(form.amount) / parseInt(form.repayment_months)) * 100) / 100
    : 0;

  const filtered = advances.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (!q || a.employee_name?.toLowerCase().includes(q) || a.employee_code?.toLowerCase().includes(q) || a.reason?.toLowerCase().includes(q) || a.notes?.toLowerCase().includes(q));
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} activeItem={activeItem} setActiveItem={setActiveItem} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-blue-600">Digious CRM</h1>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">A</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
          <div className="p-8 max-w-[1600px] mx-auto">

            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  Advances & Loans
                </h1>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Manage employee advances, short-term & long-term loans with automatic payroll deductions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { fetchAdvances(); fetchSummary(); }} className="flex items-center gap-2 px-4 py-2.5 border rounded-xl font-semibold bg-white border-blue-200 text-blue-600 hover:bg-blue-50 transition">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
                <button onClick={() => { setForm({ ...defaultForm }); setShowCreateModal(true); }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition hover:scale-105">
                  <Plus className="h-4 w-4" /> New Advance / Loan
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg"><CreditCard className="h-5 w-5" /></div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{summary.active_count || 0}</div>
                    <div className="text-blue-100 text-xs">Active</div>
                  </div>
                </div>
                <div className="text-blue-100 text-xs">{formatCurrency(summary.total_active_amount)} total</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(summary.total_recovered)}</div>
                    <div className="text-emerald-100 text-xs">Recovered</div>
                  </div>
                </div>
                <div className="text-emerald-100 text-xs">{formatCurrency(summary.total_remaining)} remaining</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg"><Clock className="h-5 w-5" /></div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(summary.pending_this_month)}</div>
                    <div className="text-amber-100 text-xs">Due This Month</div>
                  </div>
                </div>
                <div className="text-amber-100 text-xs">pending deductions</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg"><PauseCircle className="h-5 w-5" /></div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{summary.on_hold_count || 0}</div>
                    <div className="text-orange-100 text-xs">On Hold</div>
                  </div>
                </div>
                <div className="text-orange-100 text-xs">paused deductions</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg"><CheckCircle className="h-5 w-5" /></div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{summary.completed_count || 0}</div>
                    <div className="text-purple-100 text-xs">Completed</div>
                  </div>
                </div>
                <div className="text-purple-100 text-xs">
                  {(summary.active_advances || 0)} adv &bull; {(summary.active_short_term || 0)} ST &bull; {(summary.active_long_term || 0)} LT
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-5 shadow border border-slate-200 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input type="text" placeholder="Search by employee name, code or reason…" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <option value="all">All Types</option>
                  <option value="advance">Advance</option>
                  <option value="short_term_loan">Short-Term Loan</option>
                  <option value="long_term_loan">Long-Term Loan</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-100">
                    <tr>
                      {["Employee", "Type", "Amount", "Monthly Ded.", "Progress", "Status", "Disbursed", "1st Deduction", "Reason", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan="10" className="py-16 text-center">
                        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-slate-500">Loading…</p>
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan="10" className="py-16 text-center">
                        <Banknote className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 font-medium">No advances or loans found</p>
                        <p className="text-sm text-slate-400">Click "New Advance / Loan" to get started.</p>
                      </td></tr>
                    ) : filtered.map((a) => {
                      const progress = a.amount > 0 ? Math.round((parseFloat(a.total_repaid) / parseFloat(a.amount)) * 100) : 0;
                      return (
                        <tr key={a.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                                {a.employee_name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{a.employee_name}</p>
                                <p className="text-xs text-slate-400">{a.employee_code} &bull; {a.department}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[a.type] || "bg-slate-100 text-slate-600"}`}>
                              {TYPE_LABELS[a.type] || a.type}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-bold text-slate-800">{formatCurrency(a.amount)}</td>
                          <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(a.monthly_deduction)}<span className="text-xs text-slate-400"> /mo</span></td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${a.status === 'completed' ? 'bg-emerald-500' : a.status === 'cancelled' ? 'bg-rose-400' : a.status === 'on_hold' ? 'bg-amber-400' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(progress, 100)}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-slate-500 w-10 text-right">{progress}%</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(a.total_repaid)} / {formatCurrency(a.amount)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status] || "bg-slate-100"}`}>
                              {STATUS_LABELS[a.status] || a.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">{formatDate(a.disbursement_date || a.start_date)}</td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {formatDate(a.repayment_start_date || a.start_date)}
                            {a.grace_period_months > 0 && (
                              <span className="block text-xs text-amber-600 font-medium">{a.grace_period_months}mo grace</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500 max-w-[120px] truncate" title={a.reason}>{a.reason || "—"}</td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1">
                              <button onClick={() => openView(a)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details"><Eye size={15} /></button>
                              {(a.status === 'active' || a.status === 'on_hold') && (
                                <button onClick={() => handleToggleHold(a)}
                                  className={`p-2 rounded-lg transition ${a.status === 'on_hold' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                  title={a.status === 'on_hold' ? 'Resume' : 'Hold'}>
                                  {a.status === 'on_hold' ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                                </button>
                              )}
                              {a.status === 'active' && (
                                <button onClick={() => handleCancel(a.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Cancel"><XCircle size={15} /></button>
                              )}
                              {a.status !== 'completed' && (
                                <button onClick={() => handleDelete(a.id)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition" title="Delete"><Trash2 size={15} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length > 0 && (
                <div className="border-t border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 flex items-center justify-between">
                  <span className="text-sm text-slate-600"><strong>{filtered.length}</strong> records shown</span>
                  <span className="text-sm font-semibold text-blue-600">
                    Total: {formatCurrency(filtered.reduce((s, a) => s + parseFloat(a.amount || 0), 0))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white">
            <Sidebar isCollapsed={false} setIsCollapsed={setIsMobileMenuOpen} activeItem={activeItem} setActiveItem={setActiveItem} />
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAdvanceModal
          form={form} setForm={setForm} employees={employees}
          saving={saving} error={error} monthlyPreview={monthlyDeductionPreview}
          onClose={() => setShowCreateModal(false)} onSubmit={handleCreate}
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedAdvance && (
        <ViewAdvanceModal
          advance={selectedAdvance}
          onClose={() => { setShowViewModal(false); setSelectedAdvance(null); }}
        />
      )}
    </div>
  );
};

// ─── Create Modal ──────────────────────────────────────────────────────────
const CreateAdvanceModal = ({ form, setForm, employees, saving, error, monthlyPreview, onClose, onSubmit }) => {
  const [empSearch, setEmpSearch] = useState("");
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const empRef = React.useRef(null);
  const filteredEmps = employees.filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase()) || (e.employee_code || "").toLowerCase().includes(empSearch.toLowerCase())).slice(0, 8);
  const selectedEmpName = form.employee_id ? employees.find(e => e.id === +form.employee_id)?.name : "";

  const firstDeduction = computeFirstDeduction(form);

  React.useEffect(() => {
    const handler = (e) => { if (empRef.current && !empRef.current.contains(e.target)) setShowEmpDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onMouseDown={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold">New Advance / Loan</h2>
            <p className="text-blue-100 text-sm mt-0.5">Set up repayment plan for automatic payroll deductions</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">{error}</div>}

          {/* Employee Select */}
          <div ref={empRef}>
            <label className="block text-gray-700 font-medium mb-2">Employee <span className="text-blue-600">*</span></label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="text" placeholder="Search employee…"
                value={empSearch || selectedEmpName}
                onChange={(e) => { setEmpSearch(e.target.value); setForm({ ...form, employee_id: "" }); setShowEmpDropdown(true); }}
                onFocus={() => setShowEmpDropdown(true)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required={!form.employee_id} />
              {showEmpDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  {filteredEmps.length === 0 ? (
                    <div className="px-4 py-3 text-slate-500 text-sm">No employees found</div>
                  ) : filteredEmps.map(emp => (
                    <button key={emp.id} type="button"
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition border-b border-slate-100 last:border-0"
                      onMouseDown={() => { setForm({ ...form, employee_id: emp.id.toString() }); setEmpSearch(""); setShowEmpDropdown(false); }}>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.employee_code} &bull; {emp.department}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Type <span className="text-blue-600">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {[["advance", "Advance"], ["short_term_loan", "Short-Term"], ["long_term_loan", "Long-Term"]].map(([val, label]) => (
                <button key={val} type="button" onClick={() => setForm({ ...form, type: val })}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition ${form.type === val ? "bg-blue-600 text-white border-blue-600 shadow" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount + Repayment Months side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Total Amount <span className="text-blue-600">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-medium text-sm">Rs.</span>
                <input type="number" placeholder="0" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required step="1" min="1" />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Repay in (months) <span className="text-blue-600">*</span></label>
              <input type="number" placeholder="e.g. 6" value={form.repayment_months}
                onChange={e => setForm({ ...form, repayment_months: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required min="1" max="60" />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Reason</label>
            <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm">
              <option value="">Select reason…</option>
              {REASON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {form.reason === 'Other' && (
              <input type="text" placeholder="Specify reason…" value={form.reason_custom}
                onChange={e => setForm({ ...form, reason_custom: e.target.value })}
                className="w-full mt-2 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
            )}
          </div>

          {/* Disbursement Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Disbursement Date <span className="text-blue-600">*</span></label>
            <input type="date" value={form.disbursement_date}
              onChange={e => setForm({ ...form, disbursement_date: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required />
            <p className="text-xs text-slate-400 mt-1">The date the advance / loan amount was given to the employee</p>
          </div>

          {/* Repayment Start Option */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">When should deductions start? <span className="text-blue-600">*</span></label>
            <div className="space-y-2">
              {[
                { value: "same_month", label: "Same month as disbursement", desc: "Deduct from this month's payroll" },
                { value: "next_month", label: "Next month", desc: "Start deductions from the following month" },
                { value: "grace_period", label: "After a grace period", desc: "Wait N months before first deduction" },
                { value: "custom", label: "Custom date", desc: "Pick a specific start date for deductions" },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition ${
                    form.repayment_start_option === opt.value
                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <input type="radio" name="repayment_start_option" value={opt.value}
                    checked={form.repayment_start_option === opt.value}
                    onChange={() => setForm({ ...form, repayment_start_option: opt.value })}
                    className="mt-1 accent-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Grace Period Input */}
            {form.repayment_start_option === 'grace_period' && (
              <div className="mt-3 ml-8">
                <label className="block text-sm text-slate-600 mb-1">Grace period (months)</label>
                <input type="number" min="1" max="24" value={form.grace_period_months}
                  onChange={e => setForm({ ...form, grace_period_months: e.target.value })}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                <p className="text-xs text-slate-400 mt-1">
                  Employee gets {form.grace_period_months || 0} month{parseInt(form.grace_period_months) !== 1 ? 's' : ''} before deductions begin
                </p>
              </div>
            )}

            {/* Custom Date Input */}
            {form.repayment_start_option === 'custom' && (
              <div className="mt-3 ml-8">
                <label className="block text-sm text-slate-600 mb-1">Deduction start date</label>
                <input type="date" value={form.repayment_start_date}
                  onChange={e => setForm({ ...form, repayment_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  min={form.disbursement_date} />
              </div>
            )}
          </div>

          {/* Monthly Deduction + First Deduction Preview */}
          {monthlyPreview > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Repayment Plan Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-blue-500 mb-0.5">Monthly Deduction</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(monthlyPreview)}<span className="text-sm font-normal text-blue-400"> /mo</span></p>
                </div>
                <div>
                  <p className="text-xs text-blue-500 mb-0.5">First Deduction In</p>
                  <p className="text-xl font-bold text-blue-600">{firstDeduction || '—'}</p>
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-2">
                {formatCurrency(form.amount)} over {form.repayment_months} month{parseInt(form.repayment_months) !== 1 ? 's' : ''}
                — auto-deducted from payroll each month
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Notes</label>
            <textarea placeholder="Additional details or terms…" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm" rows="2" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-300 text-gray-700 font-semibold rounded-xl hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg disabled:opacity-60">
              {saving ? "Creating…" : "Create Advance / Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── View Modal ────────────────────────────────────────────────────────────
const ViewAdvanceModal = ({ advance, onClose }) => {
  const progress = advance.amount > 0 ? Math.round((parseFloat(advance.total_repaid) / parseFloat(advance.amount)) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onMouseDown={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-lg"><Banknote className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-bold">{advance.employee_name}</h2>
              <p className="text-blue-100 text-sm">{TYPE_LABELS[advance.type]} — {advance.employee_code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(advance.amount)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Monthly Deduction</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(advance.monthly_deduction)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Repaid</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(advance.total_repaid)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Remaining</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(advance.remaining_balance)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Repayment Progress</span>
              <span className="text-sm font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${advance.status === 'completed' ? 'bg-emerald-500' : advance.status === 'cancelled' ? 'bg-rose-400' : advance.status === 'on_hold' ? 'bg-amber-400' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
            <div><p className="text-xs text-slate-500">Status</p>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[advance.status]}`}>{STATUS_LABELS[advance.status] || advance.status}</span>
            </div>
            <div><p className="text-xs text-slate-500">Type</p>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[advance.type]}`}>{TYPE_LABELS[advance.type]}</span>
            </div>
            <div><p className="text-xs text-slate-500">Disbursement Date</p><p className="font-semibold text-slate-800 text-sm">{formatDate(advance.disbursement_date || advance.start_date)}</p></div>
            <div><p className="text-xs text-slate-500">1st Deduction Date</p><p className="font-semibold text-slate-800 text-sm">{formatDate(advance.repayment_start_date || advance.start_date)}</p></div>
            <div><p className="text-xs text-slate-500">End Date</p><p className="font-semibold text-slate-800 text-sm">{formatDate(advance.end_date)}</p></div>
            <div><p className="text-xs text-slate-500">Repayment Period</p><p className="font-semibold text-slate-800 text-sm">{advance.repayment_months} months</p></div>
            {advance.grace_period_months > 0 && (
              <div><p className="text-xs text-slate-500">Grace Period</p><p className="font-semibold text-amber-700 text-sm">{advance.grace_period_months} months</p></div>
            )}
            <div><p className="text-xs text-slate-500">Approved By</p><p className="font-semibold text-slate-800 text-sm">{advance.approved_by_name || "—"}</p></div>
          </div>

          {/* Reason */}
          {advance.reason && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-600 font-semibold mb-1">Reason</p>
              <p className="text-sm text-slate-700">{advance.reason}</p>
            </div>
          )}

          {advance.notes && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{advance.notes}</p>
            </div>
          )}

          {/* Installments Table */}
          {advance.installments && advance.installments.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Installment Schedule ({advance.installments.length} months)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      {["#", "Month", "Amount", "Status"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-700 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {advance.installments.map((inst) => {
                      return (
                        <tr key={inst.id} className={`hover:bg-slate-50 ${inst.status === 'deducted' ? 'bg-emerald-50/50' : inst.status === 'skipped' ? 'bg-slate-50 opacity-50' : ''}`}>
                          <td className="px-4 py-3 text-sm text-slate-600">{inst.installment_no}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">{MONTH_NAMES[inst.month]} {inst.year}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-700">{formatCurrency(inst.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              inst.status === 'deducted' ? 'bg-emerald-100 text-emerald-700' :
                              inst.status === 'skipped' ? 'bg-slate-100 text-slate-500' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {inst.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAdvances;
