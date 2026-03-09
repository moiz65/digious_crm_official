// PayrollManagements.jsx — Real data, no demo, no department column in earnings table
import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Download,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  FileText,
  X,
  Eye,
  Printer,
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Banknote,
  MinusCircle,
} from "lucide-react";
import {
  getMonthlyPayroll,
  generatePayroll as generatePayrollAPI,
  updatePayrollStatus as updateStatusAPI,
  bulkUpdatePayrollStatus,
  getPayslip,
} from "../services/payrollService";

// ─── Helpers ──────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount || 0)
    .replace("PKR", "Rs.");

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

const STATUS_OPTIONS = ["pending", "processing", "success", "failed"];

// ─── Main Component ──────────────────────────
const PayrollManagements = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPaySlipModal, setShowPaySlipModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [error, setError] = useState(null);

  // ─── Fetch payroll data ─────────────────────
  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMonthlyPayroll(selectedYear, selectedMonth);
      setPayrollData(data.records || []);
    } catch (err) {
      console.error("Failed to fetch payroll:", err);
      setError(err.message || "Failed to load payroll data");
      setPayrollData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // ─── Check if selected month is current or future (not yet ended) ──
  const isMonthNotEnded = (() => {
    const now = new Date();
    const selected = selectedYear * 100 + selectedMonth;
    const current = now.getFullYear() * 100 + (now.getMonth() + 1);
    return selected >= current;
  })();

  // ─── Generate payroll ───────────────────────
  const handleGenerate = async () => {
    if (isMonthNotEnded) {
      const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-PK', { month: 'long' });
      let nextMonth = selectedMonth + 1;
      let nextYear = selectedYear;
      if (nextMonth > 12) { nextMonth = 1; nextYear++; }
      const nextMonthName = new Date(nextYear, nextMonth - 1).toLocaleDateString('en-PK', { month: 'long' });
      setError(`Cannot generate payroll for ${monthName} ${selectedYear} — the month hasn't ended yet. You can generate it starting ${nextMonthName} 1, ${nextYear}.`);
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      await generatePayrollAPI(selectedMonth, selectedYear);
      await fetchPayroll();
    } catch (err) {
      console.error("Failed to generate payroll:", err);
      setError(err.message || "Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Update single status ──────────────────
  const handleUpdateStatus = async (id, status) => {
    try {
      await updateStatusAPI(id, status);
      setPayrollData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // ─── Bulk update status ────────────────────
  const handleBulkUpdate = async (status) => {
    try {
      await bulkUpdatePayrollStatus(selectedRecords, status);
      setPayrollData((prev) =>
        prev.map((r) =>
          selectedRecords.includes(r.id) ? { ...r, status } : r
        )
      );
      setSelectedRecords([]);
      setSelectAll(false);
      setShowBulkActionModal(false);
    } catch (err) {
      console.error("Bulk update failed:", err);
    }
  };

  // ─── View payslip ─────────────────────────
  const handleViewPayslip = async (record) => {
    try {
      const data = await getPayslip(record.id);
      setSelectedEmployee(data);
      setShowPaySlipModal(true);
    } catch {
      setSelectedEmployee(record);
      setShowPaySlipModal(true);
    }
  };

  // ─── Stats ────────────────────────────────
  const stats = {
    totalEmployees: payrollData.length,
    totalPayroll: payrollData.reduce((s, r) => s + (r.net_salary || 0), 0),
    totalDeductions: payrollData.reduce((s, r) => s + (r.total_deductions || 0), 0),
    successCount: payrollData.filter((r) => r.status === "success").length,
    pendingCount: payrollData.filter((r) => r.status === "pending").length,
    avgSalary:
      payrollData.length > 0
        ? payrollData.reduce((s, r) => s + (r.net_salary || 0), 0) / payrollData.length
        : 0,
    totalAbsentDeductions: payrollData.reduce((s, r) => s + (r.absent_deduction || 0), 0),
    totalLateDeductions: payrollData.reduce((s, r) => s + (r.late_deduction || 0), 0),
  };

  // ─── Filter ───────────────────────────────
  const filteredPayroll = payrollData.filter((record) => {
    const matchesSearch =
      !searchQuery ||
      record.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "All" || record.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // ─── Select all logic ─────────────────────
  useEffect(() => {
    if (selectAll) {
      setSelectedRecords(filteredPayroll.map((r) => r.id));
    } else {
      setSelectedRecords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Payroll Management
              </h1>
              <p className="text-slate-600 font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-PK", {
                  month: "long",
                  year: "numeric",
                })}{" "}
                &bull; {filteredPayroll.length} records &bull; Total: {formatCurrency(stats.totalPayroll)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <button
                  onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
                  disabled={generating || isMonthNotEnded}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isMonthNotEnded
                      ? "bg-slate-50 border-slate-200 text-slate-400"
                      : "bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                  {generating ? "Generating..." : "Generate Payroll"}
                </button>
                {isMonthNotEnded && (
                  <div className="absolute top-full mt-2 right-0 w-72 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg shadow-lg text-xs text-amber-700 hidden group-hover:block z-50">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>This month hasn't ended yet. Payroll can only be generated after the month is complete.</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Month-not-ended Info Banner */}
        {isMonthNotEnded && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 flex items-center gap-3">
            <Calendar className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <div className="text-sm">
              <span className="font-semibold">
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-PK", { month: "long", year: "numeric" })} hasn't ended yet.
              </span>{" "}
              Payroll can only be generated after the month is complete. Salary for this month will be issued around the 5th of the following month.
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Month & Year Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-slate-700">Payroll Period:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => { e.stopPropagation(); setSelectedMonth(parseInt(e.target.value)); }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleDateString("en-PK", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => { e.stopPropagation(); setSelectedYear(parseInt(e.target.value)); }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MinusCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-slate-600">
                  Deductions: <span className="font-bold text-amber-600">{formatCurrency(stats.totalDeductions)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><DollarSign className="h-6 w-6" /></div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(stats.totalPayroll)}</div>
                <div className="text-blue-100 text-xs font-medium">Total Payroll</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-blue-100 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>Avg: {formatCurrency(stats.avgSalary)}/employee</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><CheckCircle className="h-6 w-6" /></div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.successCount}</div>
                <div className="text-emerald-100 text-xs font-medium">Success</div>
              </div>
            </div>
            <div className="text-emerald-100 text-xs">
              {((stats.successCount / (payrollData.length || 1)) * 100).toFixed(1)}% paid
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><AlertCircle className="h-6 w-6" /></div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.pendingCount}</div>
                <div className="text-amber-100 text-xs font-medium">Pending</div>
              </div>
            </div>
            <div className="text-amber-100 text-xs">
              {formatCurrency(payrollData.filter((r) => r.status === "pending").reduce((s, r) => s + (r.net_salary || 0), 0))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><MinusCircle className="h-6 w-6" /></div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(stats.totalDeductions)}</div>
                <div className="text-rose-100 text-xs font-medium">Total Deductions</div>
              </div>
            </div>
            <div className="text-rose-100 text-xs flex flex-wrap items-center gap-2">
              <span>Absent: {formatCurrency(stats.totalAbsentDeductions)}</span>
              <span>|</span>
              <span>Late: {formatCurrency(stats.totalLateDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Filters</h3>
              {selectedRecords.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {selectedRecords.length} selected
                </span>
              )}
            </div>
            {selectedRecords.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowBulkActionModal(true); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Bulk Actions
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedRecords([]); setSelectAll(false); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 font-medium"
              />
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => { e.stopPropagation(); setSelectedStatus(e.target.value); }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
              >
                <option value="All">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payroll Table — NO department column */}
        <PayrollTable
          data={filteredPayroll}
          loading={loading}
          onViewPayslip={handleViewPayslip}
          onUpdateStatus={handleUpdateStatus}
          selectedRecords={selectedRecords}
          setSelectedRecords={setSelectedRecords}
          selectAll={selectAll}
          setSelectAll={setSelectAll}
        />

        {/* Pay Slip Modal */}
        {showPaySlipModal && selectedEmployee && (
          <PaySlipModal
            payroll={selectedEmployee}
            onClose={() => { setShowPaySlipModal(false); setSelectedEmployee(null); }}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* Bulk Action Modal */}
        {showBulkActionModal && (
          <BulkActionModal
            onClose={() => setShowBulkActionModal(false)}
            onUpdateStatus={handleBulkUpdate}
            selectedCount={selectedRecords.length}
          />
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// PayrollTable — Department column REMOVED
// ──────────────────────────────────────────────
const PayrollTable = ({
  data, loading, onViewPayslip, onUpdateStatus,
  selectedRecords, setSelectedRecords, selectAll, setSelectAll,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-200">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="text-slate-500 text-lg">Loading payroll data...</span>
        </div>
      </div>
    );
  }

  const handleSelectAll = (e) => { e.stopPropagation(); setSelectAll(e.target.checked); };
  const handleSelectOne = (e, id) => {
    e.stopPropagation();
    setSelectedRecords((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] table-auto">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
            <tr>
              <th className="w-12 px-2 py-4 text-left">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll}
                  onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th className="w-[200px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Employee</th>
              <th className="w-[110px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Base Salary</th>
              <th className="w-[110px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Gross Salary</th>
              <th className="w-[140px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Attendance</th>
              <th className="w-[160px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Deductions</th>
              <th className="w-[110px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Net Salary</th>
              <th className="w-[110px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
              <th className="w-[100px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-10 w-10 text-slate-300" />
                    <p className="text-lg font-medium">No payroll records</p>
                    <p className="text-sm">Click &quot;Generate Payroll&quot; to create records for this month.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="w-12 px-2 py-3">
                    <input type="checkbox" checked={selectedRecords.includes(record.id)}
                      onChange={(e) => handleSelectOne(e, record.id)}
                      onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="w-[200px] px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {record.employee_name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 text-sm truncate" title={record.employee_name}>
                          {record.employee_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {record.employee_code || `ID: ${record.employee_id}`}
                          {record.department ? ` \u2022 ${record.department}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="w-[110px] px-3 py-3">
                    <span className="text-sm font-medium text-slate-800 block">{formatCurrency(record.base_salary)}</span>
                    <span className="text-xs text-slate-400">{formatCurrency(record.daily_rate)}/day</span>
                  </td>
                  <td className="w-[110px] px-3 py-3">
                    <span className="text-sm font-medium text-blue-600 block">{formatCurrency(record.gross_salary)}</span>
                    {record.total_allowances > 0 && (
                      <span className="text-xs text-slate-400">+{formatCurrency(record.total_allowances)} allow.</span>
                    )}
                  </td>
                  <td className="w-[140px] px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded" title="Present">P:{record.present_days || 0}</span>
                      {record.absent_days > 0 && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded" title="Unpaid Absent (deducted)">A:{record.absent_days}</span>}
                      {record.late_days > 0 && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded" title={`Late (${record.late_deduction_days} day deduction)`}>L:{record.late_days}</span>}
                      {record.leave_days > 0 && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded" title="Paid Leaves (no deduction)">PL:{record.leave_days}</span>}
                    </div>
                  </td>
                  <td className="w-[160px] px-3 py-3">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-700 block">{formatCurrency(record.total_deductions)}</span>
                      <div className="flex flex-wrap gap-1 text-xs text-slate-500">
                        {record.absent_deduction > 0 && <span className="px-1 py-0.5 bg-rose-50 rounded" title="Absent Deduction">A:{formatCurrency(record.absent_deduction)}</span>}
                        {record.late_deduction > 0 && <span className="px-1 py-0.5 bg-amber-50 rounded" title={`Late: ${record.late_days} lates = ${record.late_deduction_days} day(s) deducted`}>L:{formatCurrency(record.late_deduction)}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="w-[110px] px-3 py-3">
                    <span className="text-base font-bold text-blue-600 block">{formatCurrency(record.net_salary)}</span>
                  </td>
                  <td className="w-[110px] px-3 py-3">
                    <select
                      value={record.status}
                      onChange={(e) => { e.stopPropagation(); onUpdateStatus(record.id, e.target.value); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer ${STATUS_COLORS[record.status] || "bg-slate-100 text-slate-700"}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="w-[100px] px-3 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewPayslip(record); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-150 text-sm whitespace-nowrap"
                      title="View Pay Slip"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Pay Slip</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data.length > 0 && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Showing <span className="font-semibold">{data.length}</span> records</span>
            <span className="text-slate-600">
              Total Net Salary: <span className="font-semibold text-blue-600">{formatCurrency(data.reduce((s, r) => s + (r.net_salary || 0), 0))}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// PaySlipModal
// ──────────────────────────────────────────────
const PaySlipModal = ({ payroll, onClose, onUpdateStatus }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg"><FileText className="h-6 w-6" /></div>
              <div>
                <h2 className="text-2xl font-bold">Pay Slip</h2>
                <p className="text-blue-100 text-sm">
                  {payroll.employee_name} &bull; {new Date(payroll.year, (payroll.month || 1) - 1).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X className="h-6 w-6" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl">
            <div><p className="text-xs text-slate-500">Employee ID</p><p className="font-semibold text-slate-800">{payroll.employee_code || payroll.employee_id}</p></div>
            <div><p className="text-xs text-slate-500">Department</p><p className="font-semibold text-slate-800">{payroll.department || "-"}</p></div>
            <div><p className="text-xs text-slate-500">Designation</p><p className="font-semibold text-slate-800">{payroll.designation || "-"}</p></div>
            <div><p className="text-xs text-slate-500">Bank</p><p className="font-semibold text-slate-800">{payroll.bank_name ? `${payroll.bank_name} - ****${payroll.account_number?.slice(-4) || ""}` : "-"}</p></div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[payroll.status] || "bg-slate-100 text-slate-700"}`}>
                {payroll.status?.charAt(0).toUpperCase() + payroll.status?.slice(1)}
              </span>
            </div>
            <div><p className="text-xs text-slate-500">Daily Rate (base/30)</p><p className="font-semibold text-slate-800">{formatCurrency(payroll.daily_rate)}</p></div>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center"><p className="text-xs text-blue-600">Days in Month</p><p className="text-lg font-bold text-blue-700">{payroll.working_days || 30}</p></div>
            <div className="p-3 bg-green-50 rounded-lg text-center"><p className="text-xs text-green-600">Present</p><p className="text-lg font-bold text-green-700">{payroll.present_days || 0}</p></div>
            <div className="p-3 bg-rose-50 rounded-lg text-center"><p className="text-xs text-rose-600">Unpaid Absent</p><p className="text-lg font-bold text-rose-700">{payroll.absent_days || 0}</p></div>
            <div className="p-3 bg-amber-50 rounded-lg text-center"><p className="text-xs text-amber-600">Late</p><p className="text-lg font-bold text-amber-700">{payroll.late_days || 0}</p></div>
            <div className="p-3 bg-emerald-50 rounded-lg text-center"><p className="text-xs text-emerald-600">Paid Leaves</p><p className="text-lg font-bold text-emerald-700">{payroll.leave_days || 0}</p></div>
            <div className="p-3 bg-cyan-50 rounded-lg text-center"><p className="text-xs text-cyan-600">Total Paid Leave</p><p className="text-lg font-bold text-cyan-700">{payroll.paid_leave_days || 0}</p></div>
          </div>

          {/* Salary Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" /> Earnings (PKR)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Base Salary</span>
                  <span className="font-medium text-slate-800">{formatCurrency(payroll.base_salary)}</span>
                </div>
                {payroll.total_allowances > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Allowances</span>
                    <span className="font-medium text-slate-800">{formatCurrency(payroll.total_allowances)}</span>
                  </div>
                )}
                {payroll.allowances?.map((a, i) => (
                  <div key={i} className="flex justify-between py-1 pl-4 border-b border-slate-50">
                    <span className="text-xs text-slate-500">{a.name}</span>
                    <span className="text-xs text-slate-600">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-3 mt-2">
                  <span className="font-bold text-slate-700">Gross Salary</span>
                  <span className="font-bold text-blue-700">{formatCurrency(payroll.gross_salary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-600" /> Deductions (PKR)
              </h3>
              <div className="space-y-2">
                {payroll.absent_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Unpaid Absent ({payroll.absent_days} day{payroll.absent_days !== 1 ? "s" : ""})</span>
                    <span className="font-medium text-rose-600">{formatCurrency(payroll.absent_deduction)}</span>
                  </div>
                )}
                {payroll.leave_days > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-emerald-600">Paid Leaves ({payroll.leave_days} day{payroll.leave_days !== 1 ? "s" : ""}) — No deduction</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(0)}</span>
                  </div>
                )}
                {payroll.late_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Late ({payroll.late_days} late{payroll.late_days !== 1 ? "s" : ""} = {payroll.late_deduction_days} day{payroll.late_deduction_days !== 1 ? "s" : ""})</span>
                    <span className="font-medium text-amber-600">{formatCurrency(payroll.late_deduction)}</span>
                  </div>
                )}
                {payroll.late_days > 0 && payroll.late_deduction === 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-400">Late ({payroll.late_days} - no deduction, need 2+)</span>
                    <span className="font-medium text-slate-400">{formatCurrency(0)}</span>
                  </div>
                )}
                {payroll.leave_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Unpaid Leave ({payroll.leave_days} days)</span>
                    <span className="font-medium text-purple-600">{formatCurrency(payroll.leave_deduction)}</span>
                  </div>
                )}
                {payroll.total_deductions === 0 && <p className="text-sm text-slate-400 py-2">No deductions this month</p>}
                <div className="flex justify-between py-3 bg-rose-50 rounded-lg px-3 mt-2">
                  <span className="font-bold text-slate-700">Total Deductions</span>
                  <span className="font-bold text-rose-700">{formatCurrency(payroll.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Net Salary (PKR)</p>
                <p className="text-3xl font-bold text-blue-700">{formatCurrency(payroll.net_salary)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Base ({formatCurrency(payroll.base_salary)}) + Allowances ({formatCurrency(payroll.total_allowances)}) - Deductions ({formatCurrency(payroll.total_deductions)})
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  <Printer className="h-4 w-4" /> Print
                </button>
                <button onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Mail className="h-4 w-4" /> Email
                </button>
              </div>
            </div>
          </div>

          {/* Late deduction explanation */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Late Deduction Rule</p>
                <p className="text-xs text-amber-700 mt-1">
                  Every 3 late arrivals result in 1 day salary deduction. Daily rate = Base Salary / 30.
                  {payroll.late_days > 0 && (
                    <span className="block mt-1">
                      This month: {payroll.late_days} late(s) → {payroll.late_deduction_days || Math.floor(payroll.late_days / 3)} day(s) deducted = {formatCurrency(payroll.late_deduction)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Leave Balance Summary */}
          {(payroll.casual_leaves_used > 0 || payroll.sick_leaves_used > 0 || payroll.annual_leaves_used > 0 || payroll.casual_leaves_total > 0) && (
            <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
              <p className="text-sm font-semibold text-violet-800 mb-3">Annual Leave Balance</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xs text-slate-500">Casual</p>
                  <p className="text-lg font-bold text-violet-700">{payroll.casual_leaves_used || 0}<span className="text-xs text-slate-400 font-normal">/{payroll.casual_leaves_total || 0}</span></p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xs text-slate-500">Sick</p>
                  <p className="text-lg font-bold text-violet-700">{payroll.sick_leaves_used || 0}<span className="text-xs text-slate-400 font-normal">/{payroll.sick_leaves_total || 0}</span></p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xs text-slate-500">Annual</p>
                  <p className="text-lg font-bold text-violet-700">{payroll.annual_leaves_used || 0}<span className="text-xs text-slate-400 font-normal">/{payroll.annual_leaves_total || 0}</span></p>
                </div>
              </div>
              <p className="text-xs text-violet-600 mt-2 text-center">Used / Total for the year</p>
            </div>
          )}

          {payroll.notes && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{payroll.notes}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button onClick={onClose} className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Close</button>
            {payroll.status === "pending" && (
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(payroll.id, "success"); onClose(); }}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Mark as Success
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// BulkActionModal
// ──────────────────────────────────────────────
const BulkActionModal = ({ onClose, onUpdateStatus, selectedCount }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">Bulk Update Status</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="h-5 w-5 text-slate-600" /></button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Update payment status for {selectedCount} selected record{selectedCount !== 1 ? "s" : ""}.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={(e) => { e.stopPropagation(); onUpdateStatus("pending"); }}
            className="py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors">Pending</button>
          <button onClick={(e) => { e.stopPropagation(); onUpdateStatus("processing"); }}
            className="py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">Processing</button>
          <button onClick={(e) => { e.stopPropagation(); onUpdateStatus("success"); }}
            className="py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors">Success</button>
          <button onClick={(e) => { e.stopPropagation(); onUpdateStatus("failed"); }}
            className="py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors">Failed</button>
        </div>
        <button onClick={onClose} className="w-full py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
      </div>
    </div>
  );
};

export default PayrollManagements;
