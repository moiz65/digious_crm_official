// PayrollManagements.jsx — Real data, no demo, no department column in earnings table
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  EyeOff,
  Printer,
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Banknote,
  MinusCircle,
  Percent as PercentIcon,
  Edit3,
  Gift,
  PlusCircle,
  Save,
  Target, // Add this
  Loader2, // Add this
} from "lucide-react";
import PagePreloader from "./PagePreloader";
import {
  getMonthlyPayroll,
  generatePayroll as generatePayrollAPI,
  updatePayrollStatus as updateStatusAPI,
  bulkUpdatePayrollStatus,
  getPayslip,
  editPayrollRecord as editPayrollAPI,
} from "../services/payrollService";

import ProtectedModule from "./ProtectedModule";
import { usePasscode } from "../context/PasscodeContext";

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const { isModuleUnlocked, requestAccess } = usePasscode();
  console.log(
    "PayrollManagement - isModuleUnlocked:",
    isModuleUnlocked("payroll"),
  );

  // for visisbility toggles in stats cards
  const [visiblePayrollValues, setVisiblePayrollValues] = useState({
    totalPayroll: false,
    success: true,
    pending: true,
    deductions: false,
  });

  const togglePayrollValue = (key) => {
    setVisiblePayrollValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const getMonthName = (year, month) => {
    return new Date(year, month - 1).toLocaleDateString("en-PK", { month: "long" });
  };

  // ─── Generate payroll ───────────────────────
  const handleGenerate = async () => {

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
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
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
          selectedRecords.includes(r.id) ? { ...r, status } : r,
        ),
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

  // ─── Edit payroll record (bonus/adjustment) ─
  const handleEditPayroll = (record) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (id, data) => {
    try {
      const result = await editPayrollAPI(id, data);
      // Update local state
      setPayrollData((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                bonus: result.bonus,
                adjustment: result.adjustment,
                adjustment_reason: result.adjustment_reason,
                net_salary: result.net_salary,
              }
            : r,
        ),
      );
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (err) {
      console.error("Failed to edit payroll:", err);
      setError(err.message || "Failed to edit payroll record");
    }
  };

  // ─── Stats (single reduce pass, memoized) ────────────────────────────────
  const stats = useMemo(() => {
    const s = payrollData.reduce(
      (acc, r) => {
        acc.totalPayroll += parseFloat(r.net_salary || 0);
        acc.totalDeductions += parseFloat(r.total_deductions || 0);
        acc.totalAbsentDeductions += parseFloat(r.absent_deduction || 0);
        acc.totalLateDeductions += parseFloat(r.late_deduction || 0);
        acc.totalAdvanceDeductions += parseFloat(r.advance_deduction || 0);
        if (r.status === "success") acc.successCount++;
        if (r.status === "pending") {
          acc.pendingCount++;
          acc.pendingPayroll += r.net_salary || 0;
        }
        return acc;
      },
      {
        totalPayroll: 0,
        totalDeductions: 0,
        totalAbsentDeductions: 0,
        totalLateDeductions: 0,
        totalAdvanceDeductions: 0,
        successCount: 0,
        pendingCount: 0,
        pendingPayroll: 0,
      },
    );
    s.totalEmployees = payrollData.length;
    s.avgSalary =
      payrollData.length > 0 ? s.totalPayroll / payrollData.length : 0;
    return s;
  }, [payrollData]);

  // ─── Filter (memoized) ───────────────────────────
  const filteredPayroll = useMemo(
    () =>
      payrollData.filter((record) => {
        const matchesSearch =
          !searchQuery ||
          record.employee_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          record.employee_code
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          record.department?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
          selectedStatus === "All" || record.status === selectedStatus;
        return matchesSearch && matchesStatus;
      }),
    [payrollData, searchQuery, selectedStatus],
  );

  // ─── Select all logic (proper deps now that filteredPayroll is memoized) ─────────────────────
  useEffect(() => {
    if (selectAll) {
      setSelectedRecords(filteredPayroll.map((r) => r.id));
    } else {
      setSelectedRecords([]);
    }
  }, [selectAll, filteredPayroll]);

  return (
    <ProtectedModule
      moduleName="payroll"
      title="Payroll Management"
      description="Sensitive salary and payment information. Access requires security verification."
    >
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
                  {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
                    "en-PK",
                    {
                      month: "long",
                      year: "numeric",
                    },
                  )}{" "}
                  &bull; {filteredPayroll.length} records &bull; Total:{" "}
                  {formatCurrency(stats.totalPayroll)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerate();
                    }}
                    disabled={generating} // Only disable when generating, NOT based on month
                    className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      generating
                        ? "bg-slate-50 border-slate-200 text-slate-400"
                        : "bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${generating ? "animate-spin" : ""}`}
                    />
                    {generating ? "Generating..." : "Generate Payroll"}
                  </button>

                  {/* Month-not-ended Info Banner - Warning but not blocking
                  {isMonthNotEnded && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                      <div className="text-sm">
                        <span className="font-semibold">
                          {getMonthName(selectedYear, selectedMonth)}{" "}
                          {selectedYear} hasn't ended yet.
                        </span>{" "}
                        You can still generate payroll now, but attendance data
                        (late days, absences, etc.) for the remaining days of
                        the month will not be included. It's recommended to
                        generate after the month ends.
                      </div>
                    </div>
                  )} */}
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
                  {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
                    "en-PK",
                    { month: "long", year: "numeric" },
                  )}{" "}
                  hasn't ended yet.
                </span>{" "}
                Payroll can only be generated after the month is complete.
                Salary for this month will be issued around the 5th of the
                following month.
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Month & Year Selector */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-slate-700">
                  Payroll Period:
                </span>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  e.stopPropagation();
                  setSelectedMonth(parseInt(e.target.value));
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleDateString("en-PK", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => {
                  e.stopPropagation();
                  setSelectedYear(parseInt(e.target.value));
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <MinusCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-slate-600">
                    Deductions:{" "}
                    <span className="font-bold text-amber-600">
                      {formatCurrency(stats.totalDeductions)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Payroll Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {visiblePayrollValues.totalPayroll
                          ? formatCurrency(stats.totalPayroll)
                          : "*****"}
                      </div>
                      <div className="text-blue-100 text-xs font-medium">
                        Total Payroll
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-100 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>
                      Avg:{" "}
                      {visiblePayrollValues.totalPayroll
                        ? formatCurrency(stats.avgSalary)
                        : "*****"}
                      /employee
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => togglePayrollValue("totalPayroll")}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title={
                    visiblePayrollValues.totalPayroll
                      ? "Hide Value"
                      : "Show Value"
                  }
                >
                  {visiblePayrollValues.totalPayroll ? (
                    <EyeOff className="h-4 w-4 text-white/80 hover:text-white" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/80 hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Success Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {visiblePayrollValues.success
                          ? stats.successCount
                          : "*****"}
                      </div>
                      <div className="text-emerald-100 text-xs font-medium">
                        Success
                      </div>
                    </div>
                  </div>
                  <div className="text-emerald-100 text-xs">
                    {visiblePayrollValues.success
                      ? (
                          (stats.successCount / (payrollData.length || 1)) *
                          100
                        ).toFixed(1)
                      : "••"}
                    % paid
                  </div>
                </div>
                <button
                  onClick={() => togglePayrollValue("success")}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title={
                    visiblePayrollValues.success ? "Hide Value" : "Show Value"
                  }
                >
                  {visiblePayrollValues.success ? (
                    <EyeOff className="h-4 w-4 text-white/80 hover:text-white" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/80 hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Pending Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {visiblePayrollValues.pending
                          ? stats.pendingCount
                          : "*****"}
                      </div>
                      <div className="text-amber-100 text-xs font-medium">
                        Pending
                      </div>
                    </div>
                  </div>
                  <div className="text-amber-100 text-xs">
                    {visiblePayrollValues.pending
                      ? formatCurrency(stats.pendingPayroll)
                      : "*****"}
                  </div>
                </div>
                <button
                  onClick={() => togglePayrollValue("pending")}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title={
                    visiblePayrollValues.pending ? "Hide Value" : "Show Value"
                  }
                >
                  {visiblePayrollValues.pending ? (
                    <EyeOff className="h-4 w-4 text-white/80 hover:text-white" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/80 hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Deductions Card */}
            <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <MinusCircle className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {visiblePayrollValues.deductions
                          ? formatCurrency(stats.totalDeductions)
                          : "*****"}
                      </div>
                      <div className="text-rose-100 text-xs font-medium">
                        Total Deductions
                      </div>
                    </div>
                  </div>
                  <div className="text-rose-100 text-xs flex flex-wrap items-center gap-2">
                    <span>
                      Absent:{" "}
                      {visiblePayrollValues.deductions
                        ? formatCurrency(stats.totalAbsentDeductions)
                        : "*****"}
                    </span>
                    <span>|</span>
                    <span>
                      Late:{" "}
                      {visiblePayrollValues.deductions
                        ? formatCurrency(stats.totalLateDeductions)
                        : "*****"}
                    </span>
                    {stats.totalAdvanceDeductions > 0 && (
                      <>
                        <span>|</span>
                        <span>
                          Advance/Loan:{" "}
                          {visiblePayrollValues.deductions
                            ? formatCurrency(stats.totalAdvanceDeductions)
                            : "*****"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => togglePayrollValue("deductions")}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title={
                    visiblePayrollValues.deductions
                      ? "Hide Value"
                      : "Show Value"
                  }
                >
                  {visiblePayrollValues.deductions ? (
                    <EyeOff className="h-4 w-4 text-white/80 hover:text-white" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/80 hover:text-white" />
                  )}
                </button>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBulkActionModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Bulk Actions
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecords([]);
                      setSelectAll(false);
                    }}
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
                  onChange={(e) => {
                    e.stopPropagation();
                    setSelectedStatus(e.target.value);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="All">All Statuses</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
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
            onEditPayroll={handleEditPayroll}
            selectedRecords={selectedRecords}
            setSelectedRecords={setSelectedRecords}
            selectAll={selectAll}
            setSelectAll={setSelectAll}
          />

          {/* Pay Slip Modal */}
          {showPaySlipModal && selectedEmployee && (
            <PaySlipModal
              payroll={selectedEmployee}
              onClose={() => {
                setShowPaySlipModal(false);
                setSelectedEmployee(null);
              }}
              onUpdateStatus={handleUpdateStatus}
              onEditPayroll={handleEditPayroll}
            />
          )}

          {/* Edit Modal */}
          {showEditModal && editingRecord && (
            <EditPayrollModal
              record={editingRecord}
              onClose={() => {
                setShowEditModal(false);
                setEditingRecord(null);
              }}
              onSave={handleSaveEdit}
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
    </ProtectedModule>
  );
};

// ──────────────────────────────────────────────
// PayrollTable — Department column REMOVED
// ──────────────────────────────────────────────

const PayrollTable = ({
  data,
  loading,
  onViewPayslip,
  onUpdateStatus,
  onEditPayroll,
  selectedRecords,
  setSelectedRecords,
  selectAll,
  setSelectAll,
}) => {
  if (loading) {
    return (
      <PagePreloader
        loading={true}
        variant="table"
        message="Loading payroll data..."
      />
    );
  }

  const handleSelectAll = (e) => {
    e.stopPropagation();
    setSelectAll(e.target.checked);
  };
  const handleSelectOne = (e, id) => {
    e.stopPropagation();
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] table-auto">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
            <tr>
              <th className="w-12 px-2 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="w-[200px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Employee
              </th>
              <th className="w-[110px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Base Salary
              </th>
              <th className="w-[110px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Gross Salary
              </th>
              <th className="w-[140px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Attendance
              </th>
              <th className="w-[160px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Deductions
              </th>
              <th className="w-[110px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Net Salary
              </th>
              <th className="w-[110px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bonus/Adj
              </th>
              <th className="w-[110px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status
              </th>
              <th className="w-[140px] px-3 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-10 w-10 text-slate-300" />
                    <p className="text-lg font-medium">No payroll records</p>
                    <p className="text-sm">
                      Click &quot;Generate Payroll&quot; to create records for
                      this month.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50 transition-colors duration-150"
                >
                  <td className="w-12 px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRecords.includes(record.id)}
                      onChange={(e) => handleSelectOne(e, record.id)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="w-[200px] px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {record.employee_name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-semibold text-slate-800 text-sm truncate"
                          title={record.employee_name}
                        >
                          {record.employee_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {record.employee_code || `ID: ${record.employee_id}`}
                          {record.department
                            ? ` \u2022 ${record.department}`
                            : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="w-[110px] px-3 py-3">
                    <span className="text-sm font-medium text-slate-800 block">
                      {formatCurrency(record.base_salary)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatCurrency(record.daily_rate)}/day
                    </span>
                  </td>
                  <td className="w-[110px] px-3 py-3">
                    <span className="text-sm font-medium text-blue-600 block">
                      {formatCurrency(record.gross_salary)}
                    </span>
                    {record.total_allowances > 0 && (
                      <span className="text-xs text-slate-400">
                        +{formatCurrency(record.total_allowances)} allow.
                      </span>
                    )}
                  </td>
                  <td className="w-[140px] px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      <span
                        className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded"
                        title="Present"
                      >
                        P:{record.present_days || 0}
                      </span>
                      {record.absent_days > 0 && (
                        <span
                          className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded"
                          title="Unpaid Absent (deducted)"
                        >
                          A:{record.absent_days}
                        </span>
                      )}
                      {record.late_days > 0 && (
                        <span
                          className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded"
                          title={`Late (${record.late_deduction_days} day deduction)`}
                        >
                          L:{record.late_days}
                        </span>
                      )}
                      {record.leave_days > 0 && (
                        <span
                          className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded"
                          title="Paid Leaves (no deduction)"
                        >
                          PL:{record.leave_days}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="w-[160px] px-3 py-3">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-700 block">
                        {formatCurrency(record.total_deductions)}
                      </span>
                      <div className="flex flex-wrap gap-1 text-xs text-slate-500">
                        {record.absent_deduction > 0 && (
                          <span
                            className="px-1 py-0.5 bg-rose-50 rounded"
                            title="Absent Deduction"
                          >
                            A:{formatCurrency(record.absent_deduction)}
                          </span>
                        )}
                        {record.late_deduction > 0 && (
                          <span
                            className="px-1 py-0.5 bg-amber-50 rounded"
                            title={`Late: ${record.late_days} lates = ${record.late_deduction_days} day(s) deducted`}
                          >
                            L:{formatCurrency(record.late_deduction)}
                          </span>
                        )}
                        {record.advance_deduction > 0 && (
                          <span
                            className="px-1 py-0.5 bg-purple-50 text-purple-700 rounded"
                            title="Advance/Loan Deduction"
                          >
                            Adv:{formatCurrency(record.advance_deduction)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="w-[110px] px-3 py-3">
                    <span className="text-base font-bold text-blue-600 block">
                      {formatCurrency(record.net_salary)}
                    </span>
                  </td>
                  <td className="w-[110px] px-3 py-3">
                    <div className="space-y-0.5">
                      {(record.bonus || 0) > 0 && (
                        <span className="text-xs font-medium text-emerald-600 block">
                          +{formatCurrency(record.bonus)}{" "}
                          <span className="text-slate-400">bonus</span>
                        </span>
                      )}
                      {(record.adjustment || 0) !== 0 && (
                        <span
                          className={`text-xs font-medium block ${record.adjustment > 0 ? "text-blue-600" : "text-rose-600"}`}
                        >
                          {record.adjustment > 0 ? "+" : ""}
                          {formatCurrency(record.adjustment)}{" "}
                          <span className="text-slate-400">adj</span>
                        </span>
                      )}
                      {!record.bonus && !record.adjustment && (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>
                  </td>
                  <td className="w-[110px] px-3 py-3">
                    <select
                      value={record.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(record.id, e.target.value);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer ${STATUS_COLORS[record.status] || "bg-slate-100 text-slate-700"}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="w-[140px] px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewPayslip(record);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-150 text-xs whitespace-nowrap"
                        title="View Pay Slip"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPayroll(record);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors duration-150 text-xs whitespace-nowrap"
                        title="Edit Bonus / Adjustment"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
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
            <span className="text-slate-600">
              Showing <span className="font-semibold">{data.length}</span>{" "}
              records
            </span>
            <span className="text-slate-600">
              Total Net Salary:{" "}
              <span className="font-semibold text-blue-600">
                {formatCurrency(
                  data.reduce((s, r) => s + (r.net_salary || 0), 0),
                )}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// PaySlipModal — Updated with Sales Commission & Download
// ──────────────────────────────────────────────
const PaySlipModal = ({ payroll, onClose, onUpdateStatus, onEditPayroll }) => {
  const [salesTarget, setSalesTarget] = useState(null);
  const [targetLoading, setTargetLoading] = useState(false);

  const isSalesEmployee =
    payroll.department === "Sales" ||
    payroll.department?.toLowerCase() === "sales";

  // Fetch sales target for this payroll period
  const fetchSalesTarget = useCallback(async () => {
    if (!isSalesEmployee) return;

    setTargetLoading(true);
    try {
      const token = localStorage.getItem("token");
      const employeeId = payroll.employee_id;
      const targetMonth = payroll.month;
      const targetYear = payroll.year;

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.118.172.21:5000"}/api/v1/sales-targets/${employeeId}?month=${targetMonth}&year=${targetYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const result = await response.json();
      if (result.success && result.data) {
        setSalesTarget(result.data);
      }
    } catch (error) {
      console.error("Error fetching sales target:", error);
    } finally {
      setTargetLoading(false);
    }
  }, [isSalesEmployee, payroll.employee_id, payroll.month, payroll.year]);

  useEffect(() => {
    fetchSalesTarget();
  }, [fetchSalesTarget]);

  // Calculate commission if not already present
  const commissionAmountPKR =
    payroll.commission_amount_pkr ||
    (payroll.net_sales &&
    payroll.commission_percentage &&
    payroll.dollar_conversion_rate
      ? ((payroll.net_sales * payroll.commission_percentage) / 100) *
        payroll.dollar_conversion_rate
      : 0);

  const netSalesUSD = payroll.net_sales || 0;
  const commissionPercentage = payroll.commission_percentage || 0;
  const conversionRate = payroll.dollar_conversion_rate || 280;

  // Handle download/print
  const handleDownload = () => {
    window.print();
  };

  const handleEmail = () => {
    window.location.href = `mailto:${payroll.employee_email || payroll.email}?subject=Pay Slip for ${new Date(payroll.year, (payroll.month || 1) - 1).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl payslip-container"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Pay Slip</h2>
                <p className="text-blue-100 text-sm">
                  {payroll.employee_name} &bull;{" "}
                  {new Date(
                    payroll.year,
                    (payroll.month || 1) - 1,
                  ).toLocaleDateString("en-PK", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Print / Download"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                onClick={handleEmail}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Email"
              >
                <Mail className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-xs text-slate-500">Employee ID</p>
              <p className="font-semibold text-slate-800">
                {payroll.employee_code || payroll.employee_id}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Department</p>
              <p className="font-semibold text-slate-800">
                {payroll.department || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Designation</p>
              <p className="font-semibold text-slate-800">
                {payroll.designation || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Bank</p>
              <p className="font-semibold text-slate-800">
                {payroll.bank_name
                  ? `${payroll.bank_name} - ****${payroll.account_number?.slice(-4) || ""}`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[payroll.status] || "bg-slate-100 text-slate-700"}`}
              >
                {payroll.status?.charAt(0).toUpperCase() +
                  payroll.status?.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Daily Rate (base/30)</p>
              <p className="font-semibold text-slate-800">
                {formatCurrency(payroll.daily_rate)}
              </p>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-blue-600">Days in Month</p>
              <p className="text-lg font-bold text-blue-700">
                {payroll.working_days || 30}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-green-600">Present</p>
              <p className="text-lg font-bold text-green-700">
                {payroll.present_days || 0}
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg text-center">
              <p className="text-xs text-rose-600">Unpaid Absent</p>
              <p className="text-lg font-bold text-rose-700">
                {payroll.absent_days || 0}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-center">
              <p className="text-xs text-amber-600">Late</p>
              <p className="text-lg font-bold text-amber-700">
                {payroll.late_days || 0}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <p className="text-xs text-emerald-600">Paid Leaves</p>
              <p className="text-lg font-bold text-emerald-700">
                {payroll.leave_days || 0}
              </p>
            </div>
            <div className="p-3 bg-cyan-50 rounded-lg text-center">
              <p className="text-xs text-cyan-600">Total Paid Leave</p>
              <p className="text-lg font-bold text-cyan-700">
                {payroll.paid_leave_days || 0}
              </p>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" /> Earnings (PKR)
              </h3>
              <div className="space-y-2">
                {/* Base Salary */}
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Base Salary</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(payroll.base_salary)}
                  </span>
                </div>

                {/* Allowances - Individual */}
                {payroll.allowances && payroll.allowances.length > 0 ? (
                  payroll.allowances.map((a, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-1 pl-4 border-b border-slate-50"
                    >
                      <span className="text-xs text-slate-500">{a.name}</span>
                      <span className="text-xs text-slate-600">
                        {formatCurrency(a.amount)}
                      </span>
                    </div>
                  ))
                ) : payroll.total_allowances > 0 ? (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">
                      Total Allowances
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(payroll.total_allowances)}
                    </span>
                  </div>
                ) : null}

                {/* Gross Salary (Base + Allowances) */}
                <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-3 mt-2">
                  <span className="font-bold text-slate-700">Gross Salary</span>
                  <span className="font-bold text-blue-700">
                    {formatCurrency(payroll.gross_salary)}
                  </span>
                </div>

                {/* Sales Commission - Only for Sales employees (not part of gross salary) */}
                {isSalesEmployee &&
                  (() => {
                    const commissionAmount =
                      payroll.commission_amount_pkr ||
                      (payroll.net_sales &&
                      payroll.commission_percentage &&
                      payroll.dollar_conversion_rate
                        ? ((payroll.net_sales * payroll.commission_percentage) /
                            100) *
                          payroll.dollar_conversion_rate
                        : 0);
                    if (commissionAmount > 0) {
                      return (
                        <div className="flex justify-between py-2 border-b border-emerald-100 bg-emerald-50/30 rounded-lg px-3">
                          <div>
                            <span className="text-sm text-emerald-600 flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" /> Sales
                              Commission
                            </span>
                            {payroll.net_sales > 0 && (
                              <div className="text-[10px] text-emerald-500 mt-0.5">
                                Net Sales: $
                                {payroll.net_sales?.toLocaleString()} ×{" "}
                                {payroll.commission_percentage}% × Rs.
                                {payroll.dollar_conversion_rate || 280}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-emerald-600">
                            +{formatCurrency(commissionAmount)}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                {/* Bonus */}
                {(payroll.bonus || 0) > 0 && (
                  <div className="flex justify-between py-2 border-b border-emerald-100">
                    <div>
                      <span className="text-sm text-emerald-600 flex items-center gap-1">
                        <Gift className="h-3.5 w-3.5" /> Bonus
                      </span>
                      {payroll.bonus_reason && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ({payroll.bonus_reason})
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-emerald-600">
                      +{formatCurrency(payroll.bonus)}
                    </span>
                  </div>
                )}

                {/* Adjustment */}
                {(payroll.adjustment || 0) !== 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <div>
                      <span className="text-sm text-blue-600 flex items-center gap-1">
                        <PlusCircle className="h-3.5 w-3.5" /> Adjustment
                        {payroll.adjustment_reason && (
                          <span className="text-xs text-slate-400 ml-1">
                            ({payroll.adjustment_reason})
                          </span>
                        )}
                      </span>
                    </div>
                    <span
                      className={`font-medium ${payroll.adjustment > 0 ? "text-blue-600" : "text-rose-600"}`}
                    >
                      {payroll.adjustment > 0 ? "+" : ""}
                      {formatCurrency(payroll.adjustment)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-600" /> Deductions
                (PKR)
              </h3>
              <div className="space-y-2">
                {payroll.absent_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">
                      Unpaid Absent ({payroll.absent_days} day
                      {payroll.absent_days !== 1 ? "s" : ""})
                    </span>
                    <span className="font-medium text-rose-600">
                      {formatCurrency(payroll.absent_deduction)}
                    </span>
                  </div>
                )}
                {payroll.late_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">
                      Late ({payroll.late_days} late
                      {payroll.late_days !== 1 ? "s" : ""} ={" "}
                      {payroll.late_deduction_days} day
                      {payroll.late_deduction_days !== 1 ? "s" : ""})
                    </span>
                    <span className="font-medium text-amber-600">
                      {formatCurrency(payroll.late_deduction)}
                    </span>
                  </div>
                )}
                {payroll.leave_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">
                      Unpaid Leave ({payroll.leave_days} days)
                    </span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(payroll.leave_deduction)}
                    </span>
                  </div>
                )}
                {payroll.advance_deduction > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">
                      Advance / Loan Deduction
                    </span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(payroll.advance_deduction)}
                    </span>
                  </div>
                )}
                {payroll.total_deductions === 0 &&
                  (payroll.advance_deduction || 0) === 0 && (
                    <p className="text-sm text-slate-400 py-2">
                      No deductions this month
                    </p>
                  )}
                <div className="flex justify-between py-3 bg-rose-50 rounded-lg px-3 mt-2">
                  <span className="font-bold text-slate-700">
                    Total Deductions
                  </span>
                  <span className="font-bold text-rose-700">
                    {formatCurrency(
                      parseFloat(payroll.total_deductions || 0) +
                        parseFloat(payroll.advance_deduction || 0),
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Net Salary (PKR)
                </p>
                <p className="text-3xl font-bold text-blue-700">
                  {formatCurrency(payroll.net_salary)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Base ({formatCurrency(payroll.base_salary)}) + Allowances (
                  {formatCurrency(payroll.total_allowances)})
                  {isSalesEmployee &&
                    commissionAmountPKR > 0 &&
                    ` + Commission (${formatCurrency(commissionAmountPKR)})`}
                  {(payroll.bonus || 0) > 0 &&
                    ` + Bonus (${formatCurrency(payroll.bonus)})`}
                  {(payroll.adjustment || 0) !== 0 &&
                    ` + Adj (${formatCurrency(payroll.adjustment)})`}
                  {` − Deductions (${formatCurrency(payroll.total_deductions)})`}
                  {(payroll.advance_deduction || 0) > 0 &&
                    ` − Advance/Loan (${formatCurrency(payroll.advance_deduction)})`}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPayroll(payroll);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
              </div>
            </div>
          </div>

          {payroll.notes && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{payroll.notes}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            {payroll.status === "pending" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(payroll.id, "success");
                  onClose();
                }}
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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">
            Bulk Update Status
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Update payment status for {selectedCount} selected record
          {selectedCount !== 1 ? "s" : ""}.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus("pending");
            }}
            className="py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
          >
            Pending
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus("processing");
            }}
            className="py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Processing
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus("success");
            }}
            className="py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Success
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus("failed");
            }}
            className="py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors"
          >
            Failed
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// EditPayrollModal — Edit Bonus, Adjustment, Sales Fields with Target
// ──────────────────────────────────────────────
const EditPayrollModal = ({ record, onClose, onSave }) => {
  const [bonus, setBonus] = useState(record.bonus || 0);
  const [bonusReason, setBonusReason] = useState(record.bonus_reason || "");
  const [adjustment, setAdjustment] = useState(record.adjustment || 0);
  const [adjustmentReason, setAdjustmentReason] = useState(
    record.adjustment_reason || "",
  );

  const [netSales, setNetSales] = useState(record.net_sales || 0);
  const [commissionPercentage, setCommissionPercentage] = useState(
    record.commission_percentage || 0,
  );
  const [dollarConversionRate, setDollarConversionRate] = useState(
    record.dollar_conversion_rate || 280,
  );

  // Sales Target state
  const [salesTarget, setSalesTarget] = useState(null);
  const [targetLoading, setTargetLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const isSalesEmployee =
    record.department === "Sales" ||
    record.department?.toLowerCase() === "sales";

  const grossSalary = parseFloat(record.gross_salary || 0);
  const totalDeductions = parseFloat(record.total_deductions || 0);
  const advanceDeduction = parseFloat(record.advance_deduction || 0);

  // Calculate commission correctly:
  const commissionAmountUSD = isSalesEmployee
    ? (parseFloat(netSales) || 0) * (parseFloat(commissionPercentage) / 100)
    : 0;
  const commissionAmountPKR = isSalesEmployee
    ? commissionAmountUSD * (parseFloat(dollarConversionRate) || 280)
    : 0;

  // Calculate preview net salary
  const previewNet =
    grossSalary +
    (parseFloat(bonus) || 0) +
    commissionAmountPKR +
    (parseFloat(adjustment) || 0) -
    totalDeductions -
    advanceDeduction;

  // ========== ADD THIS MISSING handleSave FUNCTION ==========
  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        bonus: parseFloat(bonus) || 0,
        bonus_reason: bonusReason || null,
        adjustment: parseFloat(adjustment) || 0,
        adjustment_reason: adjustmentReason || null,
      };

      // Add sales-specific fields if employee is in Sales department
      if (isSalesEmployee) {
        updateData.net_sales = parseFloat(netSales) || 0;
        updateData.commission_percentage =
          parseFloat(commissionPercentage) || 0;
        updateData.commission_amount_usd = commissionAmountUSD;
        updateData.commission_amount_pkr = commissionAmountPKR;
        updateData.dollar_conversion_rate =
          parseFloat(dollarConversionRate) || 280;
        // Also send month/year to ensure correct record is updated
        updateData.month = record.month;
        updateData.year = record.year;
      }

      await onSave(record.id, updateData);
      onClose();
    } catch (error) {
      console.error("Error saving payroll:", error);
    } finally {
      setSaving(false);
    }
  };
  // ==========================================================

  // Fetch sales target for this employee - UPDATED to use payroll month/year
  const fetchSalesTarget = useCallback(async () => {
    if (!isSalesEmployee) return;

    setTargetLoading(true);
    try {
      const token = localStorage.getItem("token");
      const employeeId = record.employee_id;

      // Use the payroll record's month and year instead of current date
      const payrollMonth = record.month;
      const payrollYear = record.year;

      // If record doesn't have month/year, use current (fallback)
      const targetMonth = payrollMonth || new Date().getMonth() + 1;
      const targetYear = payrollYear || new Date().getFullYear();

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.118.172.21:5000"}/api/v1/sales-targets/${employeeId}?month=${targetMonth}&year=${targetYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();
      if (result.success && result.data) {
        setSalesTarget(result.data);
      } else {
        setSalesTarget(null);
      }
    } catch (error) {
      console.error("Error fetching sales target:", error);
      setSalesTarget(null);
    } finally {
      setTargetLoading(false);
    }
  }, [isSalesEmployee, record.employee_id, record.month, record.year]);

  // Fetch target when modal opens
  useEffect(() => {
    fetchSalesTarget();
  }, [fetchSalesTarget]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 rounded-t-2xl sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Edit Payroll</h2>
                <p className="text-amber-100 text-sm">
                  {record.employee_name} &bull;{" "}
                  {new Date(
                    record.year,
                    (record.month || 1) - 1,
                  ).toLocaleDateString("en-PK", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Current Info Summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Gross Salary</p>
              <p className="text-lg font-bold text-slate-800">
                {formatCurrency(grossSalary)}
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg">
              <p className="text-xs text-rose-600">Deductions</p>
              <p className="text-lg font-bold text-rose-700">
                {formatCurrency(totalDeductions + advanceDeduction)}
              </p>
              {advanceDeduction > 0 && (
                <p className="text-[10px] text-rose-500 mt-0.5">
                  incl. {formatCurrency(advanceDeduction)} adv/loan
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">Current Net</p>
              <p className="text-lg font-bold text-blue-700">
                {formatCurrency(record.net_salary)}
              </p>
            </div>
          </div>

          {/* Sales Employee Fields - Only show for Sales department */}
          {isSalesEmployee && (
            <>
              {/* Monthly Target Card */}
              <div className="border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-indigo-800 flex items-center gap-2">
                    <Target className="h-4 w-4" /> Monthly Sales Target
                  </h3>
                  {targetLoading && (
                    <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                  )}
                </div>

                {salesTarget ? (
                  <div className="space-y-3">
                    {/* Target Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="text-[10px] text-indigo-500">Target</p>
                        <p className="text-sm font-bold text-indigo-700">
                          ${salesTarget.monthly_target?.toLocaleString() || "0"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="text-[10px] text-green-500">Achieved</p>
                        <p className="text-sm font-bold text-green-700">
                          ${salesTarget.achieved?.toLocaleString() || "0"}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          ({salesTarget.sales_count || 0} sales)
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="text-[10px] text-orange-500">Remaining</p>
                        <p className="text-sm font-bold text-orange-700">
                          $
                          {Math.max(
                            0,
                            salesTarget.remaining || 0,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-indigo-600 mb-1">
                        <span>Target Progress</span>
                        <span>
                          {Math.min(
                            100,
                            Math.round(
                              (salesTarget.achieved /
                                salesTarget.monthly_target) *
                                100,
                            ),
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (salesTarget.achieved / salesTarget.monthly_target) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Exceeded Badge */}
                    {salesTarget.exceeded && (
                      <div className="flex items-center gap-2 p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">
                          🎉 Target exceeded by $
                          {Math.abs(salesTarget.remaining).toLocaleString()}!
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {salesTarget.notes && (
                      <div className="p-2 bg-yellow-50 rounded-lg">
                        <p className="text-[10px] text-yellow-700">
                          📝 Note: {salesTarget.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white rounded-lg">
                    <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No target set for this month
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Set target in Sales Management
                    </p>
                  </div>
                )}
              </div>

              {/* Sales Commission Calculation */}
              <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/30">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Sales Commission
                  Calculation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Net Sales Input */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" /> Net Sales
                      ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={netSales}
                      onChange={(e) => setNetSales(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Total sales in USD for this month
                    </p>
                  </div>

                  {/* Commission Percentage Input */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <PercentIcon className="h-4 w-4 text-green-600" />{" "}
                      Commission (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={commissionPercentage}
                      onChange={(e) => setCommissionPercentage(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Commission rate (%) on net sales
                    </p>
                  </div>

                  {/* Dollar Conversion Rate Input */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <DollarSign className="h-4 w-4 text-purple-600" /> USD to
                      PKR Rate
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={dollarConversionRate}
                      onChange={(e) => setDollarConversionRate(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder="280"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-medium"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      USD to PKR conversion rate
                    </p>
                  </div>
                </div>

                {/* Commission Calculation Breakdown */}
                {commissionAmountUSD > 0 && (
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">
                          Commission Amount (USD)
                        </span>
                        <span className="text-lg font-bold text-green-700">
                          ${commissionAmountUSD.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-green-600">
                        <span>
                          ${parseFloat(netSales).toLocaleString()} ×{" "}
                          {commissionPercentage}%
                        </span>
                        <span>= ${commissionAmountUSD.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-green-200 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">
                          Commission Amount (PKR)
                        </span>
                        <span className="text-xl font-bold text-green-700">
                          {formatCurrency(commissionAmountPKR)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-green-600">
                        <span>
                          ${commissionAmountUSD.toLocaleString()} × Rs.{" "}
                          {dollarConversionRate}
                        </span>
                        <span>= {formatCurrency(commissionAmountPKR)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bonus Section with Reason */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Gift className="h-4 w-4 text-emerald-600" /> Bonus Amount (PKR)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="0"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-medium"
            />
            <p className="text-xs text-slate-400 mt-1">
              Extra amount given as a bonus (e.g. performance bonus, Eid bonus)
            </p>
          </div>

          {/* Bonus Reason Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <FileText className="h-4 w-4 text-emerald-600" /> Bonus Reason
            </label>
            <input
              type="text"
              value={bonusReason}
              onChange={(e) => setBonusReason(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="e.g. Performance Bonus, Eid Bonus, Quarterly Incentive..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Adjustment Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <PlusCircle className="h-4 w-4 text-blue-600" /> Adjustment (PKR)
            </label>
            <input
              type="number"
              step="100"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="0"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
            />
            <p className="text-xs text-slate-400 mt-1">
              Correction or extra amount (can be negative for deduction)
            </p>
          </div>

          {/* Adjustment Reason */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              Adjustment Reason (optional)
            </label>
            <input
              type="text"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="e.g. Overtime payment, Travel reimbursement..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Preview Net Salary */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700">
                Updated Net Salary
              </span>
              <span className="text-2xl font-bold text-blue-700">
                {formatCurrency(previewNet)}
              </span>
            </div>
            <p className="text-xs text-blue-500 mt-1">
              {formatCurrency(grossSalary)} +{" "}
              {formatCurrency(parseFloat(bonus) || 0)} (bonus)
              {isSalesEmployee &&
                commissionAmountPKR > 0 &&
                ` + ${formatCurrency(commissionAmountPKR)} (commission)`}
              {parseFloat(adjustment) !== 0 &&
                ` + ${formatCurrency(parseFloat(adjustment) || 0)} (adj)`}
              {` − ${formatCurrency(totalDeductions)} (deductions)`}
              {advanceDeduction > 0 &&
                ` − ${formatCurrency(advanceDeduction)} (advance/loan)`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollManagements;
