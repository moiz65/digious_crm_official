import React, { useState, useEffect, useCallback } from "react";
import EmployeeSidebar from "../../components/EmployeeSidebar";
import { DashboardHeader } from "../../components/DashboardComponents";
import {
  Banknote,
  RefreshCw,
  Eye,
  X,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { config } from "../../config/api";

const API_BASE = `${config.FULL_API_URL}/advances`;

const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("authToken") || "";

const apiFetch = async (url) => {
  const r = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const text = await r.text();
  if (!text.trim()) return { success: false, message: `Empty response (${r.status})` };
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: `Server error (${r.status})` };
  }
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  })
    .format(amount || 0)
    .replace("PKR", "Rs.");

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const TYPE_LABELS = {
  advance: "Advance",
  short_term_loan: "Short-Term Loan",
  long_term_loan: "Long-Term Loan",
};
const TYPE_COLORS = {
  advance: "bg-blue-100 text-blue-700",
  short_term_loan: "bg-amber-100 text-amber-700",
  long_term_loan: "bg-purple-100 text-purple-700",
};
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
const MONTH_NAMES = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ViewModal = ({ advance, onClose }) => {
  if (!advance) return null;
  const progress =
    advance.amount > 0
      ? Math.round((Number(advance.total_repaid || 0) / Number(advance.amount)) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {TYPE_LABELS[advance.type] || "Advance / Loan"}
              </h2>
              <p className="text-blue-100 text-sm">View only — repayment details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="text-lg font-bold text-slate-800">
                {formatCurrency(advance.amount)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Monthly Deduction</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(advance.monthly_deduction)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Repaid</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(advance.total_repaid)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Remaining</p>
              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(advance.remaining_balance)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Repayment Progress
              </span>
              <span className="text-sm font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  advance.status === "completed"
                    ? "bg-emerald-500"
                    : advance.status === "cancelled"
                      ? "bg-rose-400"
                      : advance.status === "on_hold"
                        ? "bg-amber-400"
                        : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[advance.status]}`}
              >
                {STATUS_LABELS[advance.status] || advance.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Type</p>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[advance.type]}`}
              >
                {TYPE_LABELS[advance.type]}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Disbursement Date</p>
              <p className="font-semibold text-slate-800 text-sm">
                {formatDate(advance.disbursement_date || advance.start_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">1st Deduction Date</p>
              <p className="font-semibold text-slate-800 text-sm">
                {formatDate(advance.repayment_start_date || advance.start_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">End Date</p>
              <p className="font-semibold text-slate-800 text-sm">
                {formatDate(advance.end_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Repayment Period</p>
              <p className="font-semibold text-slate-800 text-sm">
                {advance.repayment_months} months
              </p>
            </div>
          </div>

          {advance.reason && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-600 font-semibold mb-1">Reason</p>
              <p className="text-sm text-slate-700">{advance.reason}</p>
            </div>
          )}

          {advance.installments?.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Installment Schedule ({advance.installments.length} months)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      {["#", "Month", "Amount", "Status"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-xs font-bold text-slate-700 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {advance.installments.map((inst) => (
                      <tr
                        key={inst.id}
                        className={`hover:bg-slate-50 ${
                          inst.status === "deducted"
                            ? "bg-emerald-50/50"
                            : inst.status === "skipped"
                              ? "bg-slate-50 opacity-50"
                              : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {inst.installment_no}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                          {MONTH_NAMES[inst.month]} {inst.year}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                          {formatCurrency(inst.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              inst.status === "deducted"
                                ? "bg-emerald-100 text-emerald-700"
                                : inst.status === "skipped"
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {inst.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeAdvances = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("advances");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`${API_BASE}/mine`);
      if (data.success) setAdvances(data.data || []);
      else setError(data.message || "Failed to load advances");
    } catch (err) {
      setError(err.message || "Failed to load advances");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvances();
  }, [fetchAdvances]);

  const openView = async (adv) => {
    const data = await apiFetch(`${API_BASE}/${adv.id}`);
    if (data.success) setSelected(data.data);
    else setError(data.message || "Failed to load details");
  };

  const filtered = advances.filter(
    (a) => statusFilter === "all" || a.status === statusFilter,
  );

  const activeBalance = advances
    .filter((a) => a.status === "active" || a.status === "on_hold")
    .reduce((sum, a) => sum + (parseFloat(a.remaining_balance) || 0), 0);

  const activeCount = advances.filter((a) => a.status === "active").length;

  return (
    <div className="flex h-screen bg-gray-50">
      <EmployeeSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="My Advances & Loans"
          subtitle="View your advance and loan repayment status"
        />

        <header className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">Advances & Loans</h1>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Records
              </p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{advances.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Active Loans
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Remaining Balance
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatCurrency(activeBalance)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-800">Your Advances & Loans</h2>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
                <button
                  onClick={fetchAdvances}
                  className="flex items-center gap-2 px-3 py-2 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 text-sm font-semibold"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-5 mt-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Banknote className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No advances or loans found</p>
                <p className="text-sm text-slate-400 mt-1">
                  When admin assigns you an advance or loan, it will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Type",
                        "Amount",
                        "Monthly",
                        "Repaid",
                        "Remaining",
                        "Status",
                        "Disbursed",
                        "",
                      ].map((h) => (
                        <th
                          key={h || "actions"}
                          className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((adv) => (
                      <tr key={adv.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[adv.type]}`}
                          >
                            {TYPE_LABELS[adv.type] || adv.type}
                          </span>
                          {adv.reason && (
                            <p className="text-xs text-slate-400 mt-1 truncate max-w-[140px]">
                              {adv.reason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                          {formatCurrency(adv.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                          {formatCurrency(adv.monthly_deduction)}
                        </td>
                        <td className="px-4 py-3 text-sm text-emerald-600 font-medium">
                          {formatCurrency(adv.total_repaid)}
                        </td>
                        <td className="px-4 py-3 text-sm text-amber-600 font-medium">
                          {formatCurrency(adv.remaining_balance)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[adv.status]}`}
                          >
                            {STATUS_LABELS[adv.status] || adv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(adv.disbursement_date || adv.start_date)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openView(adv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="h-4 w-4" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <EmployeeSidebar
              isCollapsed={false}
              setIsCollapsed={() => setIsMobileMenuOpen(false)}
              activeItem={activeItem}
              setActiveItem={setActiveItem}
            />
          </div>
        </div>
      )}

      {selected && (
        <ViewModal advance={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default EmployeeAdvances;
