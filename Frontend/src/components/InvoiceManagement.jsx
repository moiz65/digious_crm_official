// InvoiceManagement.jsx - Complete Invoice Management System
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import pdfLogo from "../digious_logo.png";
import { endpoints, apiRequest } from "../config/api";
import PagePreloader from "./PagePreloader";
import {
  CheckCircle,
  Clock,
  Download,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Activity,
  Coffee,
  LogIn,
  LogOut,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  UserCheck,
  UserX,
  Zap,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  DollarSign,
  CreditCard,
  Wallet,
  Printer,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Receipt,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock as ClockIcon,
  Check,
  AlertTriangle,
  FileDown,
  Share2,
  Copy,
  ExternalLink,
  UserPlus,
  Building2,
} from "lucide-react";

// ==================== UTILITY FUNCTIONS ====================
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

const parseDateOnly = (dateString) => {
  if (!dateString) return null;
  const str = String(dateString).split("T")[0].split(" ")[0];
  const [year, month, day] = str.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toDateInputValue = (dateString) => {
  if (!dateString) return "";
  const str = String(dateString).split("T")[0].split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const date = parseDateOnly(dateString);
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getLocalDateString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDaysToDateString = (dateString, days) => {
  const date = parseDateOnly(dateString) || new Date();
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = parseDateOnly(dateString);
  if (!date) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status) => {
  const colors = {
    Paid: "bg-emerald-100 text-emerald-700",
    Unpaid: "bg-rose-100 text-rose-700",
    Overdue: "bg-red-100 text-red-700",
    "Partially Paid": "bg-amber-100 text-amber-700",
    Cancelled: "bg-slate-100 text-slate-700",
    Draft: "bg-gray-100 text-gray-700",
    Sent: "bg-blue-100 text-blue-700",
  };
  return colors[status] || "bg-slate-100 text-slate-700";
};

const getPriorityColor = (priority) => {
  const colors = {
    High: "text-red-600 bg-red-50",
    Medium: "text-amber-600 bg-amber-50",
    Low: "text-emerald-600 bg-emerald-50",
  };
  return colors[priority] || "text-slate-600 bg-slate-50";
};

const getPriorityIcon = (priority) => {
  if (priority === "High")
    return <AlertTriangle className="h-3.5 w-3.5 text-red-600" />;
  if (priority === "Medium")
    return <Zap className="h-3.5 w-3.5 text-amber-600" />;
  return <Check className="h-3.5 w-3.5 text-emerald-600" />;
};

// ==================== COMPANY DETAILS ====================
const COMPANY_DETAILS = {
  name: "Digious Solutions",
  phone: "(+92) 33 127 38475",
  email: "digious.info@gmail.com",
  website: "www.digioussolutions.com",
  address: "B-71 Block D, North Nazimabad, Karachi",
  logo: "../assets/digious_logo.png",
  pdf_logo: pdfLogo,
  bank: {
    name: "MEEZAN BANK",
    accountTitle: "DIGIOUS SOLUTIONS",
    bankName: "Meezan Bank",
    accountNumber: "99060107878756",
    iban: "PK49MEZN0099060107878756",
  },
};

// ==================== MAIN COMPONENT ====================
const InvoiceManagement = () => {
  // State Management
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceToSettle, setInvoiceToSettle] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [newlyAddedClient, setNewlyAddedClient] = useState(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState(null)

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  // Date States
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statsViewMode, setStatsViewMode] = useState("all"); // "all" | "monthly"

  const [filteredRecords, setFilteredRecords] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // ==================== DATA FETCHING ====================
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest(`${endpoints.invoices.getAll}?limit=1000`);
      if (result.success && Array.isArray(result.data)) {
        setInvoices(result.data);
        setTotalRecords(result.total ?? result.data.length);
        setFilteredRecords(result.data.length);
      } else {
        setInvoices([]);
        setTotalRecords(0);
        setFilteredRecords(0);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Failed to load invoices");
      setInvoices([]);
      setTotalRecords(0);
      setFilteredRecords(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const result = await apiRequest(`${endpoints.clients.getAll}?limit=1000`);
      if (result.success && Array.isArray(result.data)) {
        setClients(result.data);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      setClients([]);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [fetchInvoices, fetchClients]);

  // ==================== FILTERING ====================
  const filteredData = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        !searchQuery ||
        invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.project_title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "All" || invoice.status === selectedStatus;

      const matchesPriority =
        selectedPriority === "All" || invoice.priority === selectedPriority;

      let matchesDateRange = true;
      if (dateRange.start && dateRange.end) {
        const invoiceDate = parseDateOnly(invoice.issue_date);
        const startDate = parseDateOnly(dateRange.start);
        const endDate = parseDateOnly(dateRange.end);
        matchesDateRange =
          invoiceDate && startDate && endDate
            ? invoiceDate >= startDate && invoiceDate <= endDate
            : true;
      }

      // When date range is used, skip month filter
      let matchesMonth = true;
      if (!dateRange.start && !dateRange.end) {
        const invoiceDate = parseDateOnly(invoice.issue_date);
        matchesMonth =
          !invoiceDate ||
          (invoiceDate.getMonth() + 1 === selectedMonth &&
            invoiceDate.getFullYear() === selectedYear);
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesDateRange &&
        matchesMonth
      );
    });
  }, [
    invoices,
    searchQuery,
    selectedStatus,
    selectedPriority,
    dateRange,
    selectedMonth,
    selectedYear,
  ]);

  useEffect(() => {
    setFilteredRecords(filteredData.length);
  }, [filteredData]);

  // ==================== STATISTICS CALCULATIONS ====================
  // All-time stats (across all years)
  const allTimeStats = useMemo(() => {
    const s = invoices.reduce(
      (acc, inv) => {
        acc.totalInvoices++;
        acc.totalRevenue += Number(inv.total_amount) || 0;

        if (inv.status === "Paid") {
          acc.paidInvoices++;
          acc.paidAmount += Number(inv.total_amount) || 0;
        } else if (inv.status === "Unpaid") {
          acc.unpaidInvoices++;
          acc.unpaidAmount += Number(inv.total_amount) || 0;
        } else if (inv.status === "Overdue") {
          acc.overdueInvoices++;
          acc.overdueAmount += Number(inv.total_amount) || 0;
        } else if (inv.status === "Partially Paid") {
          acc.partiallyPaidInvoices++;
          acc.partiallyPaidAmount += Math.max(
            0,
            (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0)
          );
        }
        return acc;
      },
      {
        totalInvoices: 0,
        totalRevenue: 0,
        paidInvoices: 0,
        paidAmount: 0,
        unpaidInvoices: 0,
        unpaidAmount: 0,
        overdueInvoices: 0,
        overdueAmount: 0,
        partiallyPaidInvoices: 0,
        partiallyPaidAmount: 0,
      }
    );
    s.pendingInvoices =
      s.unpaidInvoices + s.overdueInvoices + s.partiallyPaidInvoices;
    s.pendingAmount = s.unpaidAmount + s.overdueAmount + s.partiallyPaidAmount;
    s.collectionRate =
      s.totalRevenue > 0 ? (s.paidAmount / s.totalRevenue) * 100 : 0;
    return s;
  }, [invoices]);

  // This Month stats also honor the From/To filters without changing All Time stats.
  const monthlyStats = useMemo(() => {
    const monthInvoices = invoices.filter((inv) => {
      const d = parseDateOnly(inv.issue_date);
      if (!d) return false;

      if (dateRange.start || dateRange.end) {
        const startDate = parseDateOnly(dateRange.start);
        const endDate = parseDateOnly(dateRange.end);
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      }

      return (
        d.getMonth() + 1 === selectedMonth &&
        d.getFullYear() === selectedYear
      );
    });

    const s = monthInvoices.reduce(
      (acc, inv) => {
        acc.totalInvoices++;
        acc.totalRevenue += Number(inv.total_amount) || 0;

        if (inv.status === "Paid") {
          acc.paidInvoices++;
          acc.paidAmount += Number(inv.total_amount) || 0;
        } else if (inv.status === "Unpaid") {
          acc.unpaidInvoices++;
          acc.unpaidAmount += Number(inv.total_amount) || 0;
        } else if (inv.status === "Overdue") {
          acc.overdueInvoices++;
          acc.overdueAmount += Number(inv.total_amount) || 0;
        } else if (inv.status === "Partially Paid") {
          acc.partiallyPaidInvoices++;
          acc.partiallyPaidAmount += Math.max(
            0,
            (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0)
          );
        }
        return acc;
      },
      {
        totalInvoices: 0,
        totalRevenue: 0,
        paidInvoices: 0,
        paidAmount: 0,
        unpaidInvoices: 0,
        unpaidAmount: 0,
        overdueInvoices: 0,
        overdueAmount: 0,
        partiallyPaidInvoices: 0,
        partiallyPaidAmount: 0,
      }
    );
    s.pendingInvoices =
      s.unpaidInvoices + s.overdueInvoices + s.partiallyPaidInvoices;
    s.pendingAmount = s.unpaidAmount + s.overdueAmount + s.partiallyPaidAmount;
    return s;
  }, [invoices, selectedMonth, selectedYear, dateRange]);

  // Yearly stats
  const yearlyStats = useMemo(() => {
    const yearInvoices = invoices.filter((inv) => {
      const d = parseDateOnly(inv.issue_date);
      return d && d.getFullYear() === selectedYear;
    });

    return yearInvoices.reduce(
      (acc, inv) => {
        acc.totalRevenue += Number(inv.total_amount) || 0;
        if (inv.status === "Paid") {
          acc.paidAmount += Number(inv.total_amount) || 0;
        }
        acc.count++;
        return acc;
      },
      { totalRevenue: 0, paidAmount: 0, count: 0 }
    );
  }, [invoices, selectedYear]);

  // ==================== NAVIGATION ====================
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getDateDisplay = () => {
    return new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );
  };

  const getStatsDateDisplay = () => {
    if (dateRange.start || dateRange.end) {
      return `${dateRange.start ? formatDate(dateRange.start) : "Any"} – ${
        dateRange.end ? formatDate(dateRange.end) : "Any"
      }`;
    }
    return getDateDisplay();
  };

  // ==================== EXPORT CSV ====================
  const exportToCSV = () => {
    const headers = [
      "Invoice #",
      "Client",
      "Project",
      "Issue Date",
      "Due Date",
      "Amount",
      "Status",
      "Priority",
    ];
    const csvData = filteredData.map((inv) => [
      inv.invoice_number,
      inv.client_name,
      inv.project_title,
      formatDate(inv.issue_date),
      formatDate(inv.due_date),
      inv.total_amount,
      inv.status,
      inv.priority,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${getDateDisplay()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==================== CRUD HANDLERS ====================
  const handleCreateInvoice = async (payload) => {
    setActionLoading(true);
    setError("");
    try {
      const result = await apiRequest(endpoints.invoices.create, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (result.success && result.data) {
        setInvoices((prev) => [result.data, ...prev]);
        setShowCreateModal(false);
        setSuccessMessage("Invoice created successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to create invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateInvoice = async (payload) => {
    if (!editingInvoice?.id) return;
    setActionLoading(true);
    setError("");
    try {
      const result = await apiRequest(
        endpoints.invoices.update(editingInvoice.id),
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );
      if (result.success && result.data) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === result.data.id ? result.data : inv))
        );
        if (selectedInvoice?.id === result.data.id) {
          setSelectedInvoice(result.data);
        }
        setEditingInvoice(null);
        setShowCreateModal(false);
        setSuccessMessage("Invoice updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to update invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSettleInvoice = async () => {
    if (!invoiceToSettle?.id) return;
    setActionLoading(true);
    setError("");
    try {
      const result = await apiRequest(
        endpoints.invoices.updateStatus(invoiceToSettle.id),
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "Paid",
            paid_amount: Number(invoiceToSettle.total_amount) || 0,
          }),
        }
      );
      if (result.success && result.data) {
        setInvoices((prev) =>
          prev.map((invoice) =>
            invoice.id === result.data.id ? result.data : invoice
          )
        );
        if (selectedInvoice?.id === result.data.id) {
          setSelectedInvoice(result.data);
        }
        setInvoiceToSettle(null);
        setSuccessMessage("Invoice marked as paid!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(result.message || "Failed to mark invoice as fully paid");
      }
    } catch (err) {
      setError(err.message || "Failed to mark invoice as fully paid");
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingInvoice(null);
    setShowCreateModal(true);
  };

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setShowCreateModal(true);
    setShowDetailModal(false);
  };

  const handleDeleteInvoice = async (invoice) => {
    setActionLoading(true);
    setError("");
    try {
      await apiRequest(endpoints.invoices.delete(invoice.id), {
        method: "DELETE",
      });
      setInvoices((prev) => prev.filter((i) => i.id !== invoice.id));
      setShowDeleteConfirm(false);
      setSelectedInvoice(null);
      setSuccessMessage("Invoice deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const addCustomer = async (newCustomer) => {
    setActionLoading(true);
    setError("");
    try {
      const result = await apiRequest(endpoints.clients.create, {
        method: "POST",
        body: JSON.stringify({
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          address: newCustomer.address,
        }),
      });
      const client = result.client || {
        id: result.data?.id,
        name: result.data?.client_name || newCustomer.name,
        email: result.data?.client_email || newCustomer.email,
        phone: result.data?.client_phone || newCustomer.phone,
        address: result.data?.client_address || newCustomer.address,
      };
      if (client.id) {
        setClients((prev) => {
          const exists = prev.some((c) => c.id === client.id);
          return exists ? prev : [...prev, client];
        });
        setNewlyAddedClient(client);
      }
      setShowCreateCustomerModal(false);
    } catch (err) {
      setError(err.message || "Failed to create customer");
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== SEND INVOICE HANDLER ====================
  const handleSendInvoice = async (invoice) => {
    setSendingInvoiceId(invoice.id);   // ← ADD
    setError("");
    try {
      const result = await apiRequest(endpoints.invoices.send(invoice.id), {
        method: "POST",
        body: JSON.stringify({
          email: invoice.client_email,
          invoice_number: invoice.invoice_number,
        }),
      });
      if (result.success) {
        setSuccessMessage(
          `Invoice #${invoice.invoice_number} sent to ${invoice.client_email}`
        );
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        throw new Error(result.message || "Failed to send invoice");
      }
    } catch (err) {
      setError(err.message || "Failed to send invoice via email");
    } finally {
      setSendingInvoiceId(null);   // ← ADD
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto text-rose-500 hover:text-rose-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="ml-auto text-emerald-500 hover:text-emerald-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Invoice Management
              </h1>
              <p className="text-slate-600 font-medium">
                📄 Manage all invoices • {invoices.length} total invoices
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  fetchInvoices();
                  fetchClients();
                }}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Create Invoice
              </button>
            </div>
          </div>
        </div>

        {/* ==================== ANALYTICS STATS CARDS ==================== */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Analytics Overview
          </h2>
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setStatsViewMode("all")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${statsViewMode === "all"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              All Time
            </button>
            <button
              onClick={() => setStatsViewMode("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${statsViewMode === "monthly"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              This Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {/* Total Invoices Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {statsViewMode === "all"
                    ? allTimeStats.totalInvoices
                    : monthlyStats.totalInvoices}
                </div>
                <div className="text-blue-100 text-xs">
                  {statsViewMode === "all"
                    ? "Total Invoices (All Time)"
                    : `Invoices (${getStatsDateDisplay()})`}
                </div>
              </div>
            </div>
            <div className="text-xs text-blue-100 border-t border-white/20 pt-2">
              Year {selectedYear}: {yearlyStats.count} invoices
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">
                  {formatCurrency(
                    statsViewMode === "all"
                      ? allTimeStats.totalRevenue
                      : monthlyStats.totalRevenue
                  )}
                </div>
                <div className="text-pink-100 text-xs">
                  {statsViewMode === "all"
                    ? "Total Revenue (All Time)"
                    : `Revenue (${getStatsDateDisplay()})`}
                </div>
              </div>
            </div>
            <div className="text-xs text-pink-100 border-t border-white/20 pt-2">
              Year {selectedYear}: {formatCurrency(yearlyStats.totalRevenue)}
            </div>
          </div>

          {/* Pending Invoices Card */}
          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {statsViewMode === "all"
                    ? allTimeStats.pendingInvoices
                    : monthlyStats.pendingInvoices}
                </div>
                <div className="text-rose-100 text-xs">
                  {statsViewMode === "all"
                    ? "Pending Invoices (All Time)"
                    : `Pending (${getStatsDateDisplay()})`}
                </div>
              </div>
            </div>
            <div className="text-xs text-rose-100 border-t border-white/20 pt-2">
              Amount:{" "}
              {formatCurrency(
                statsViewMode === "all"
                  ? allTimeStats.pendingAmount
                  : monthlyStats.pendingAmount
              )}
            </div>
          </div>

          {/* Paid Amount Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">
                  {formatCurrency(
                    statsViewMode === "all"
                      ? allTimeStats.paidAmount
                      : monthlyStats.paidAmount
                  )}
                </div>
                <div className="text-emerald-100 text-xs">
                  {statsViewMode === "all"
                    ? "Total Collected (All Time)"
                    : `Collected (${getStatsDateDisplay()})`}
                </div>
              </div>
            </div>
            <div className="text-xs text-emerald-100 border-t border-white/20 pt-2">
              {statsViewMode === "all"
                ? `${allTimeStats.paidInvoices} paid invoices • ${allTimeStats.collectionRate.toFixed(1)}% rate`
                : `${monthlyStats.paidInvoices} paid invoices`}
            </div>
          </div>

          {/* Expected Collection Card */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">
                  {formatCurrency(
                    statsViewMode === "all"
                      ? allTimeStats.totalRevenue
                      : monthlyStats.totalRevenue
                  )}
                </div>
                <div className="text-cyan-100 text-xs">
                  {statsViewMode === "all"
                    ? "Expected Collection (All Time)"
                    : `Expected Collection (${getStatsDateDisplay()})`}
                </div>
              </div>
            </div>
            <div className="text-xs text-cyan-100 border-t border-white/20 pt-2">
              Includes pending:{" "}
              {formatCurrency(
                statsViewMode === "all"
                  ? allTimeStats.pendingAmount
                  : monthlyStats.pendingAmount
              )}
            </div>
          </div>
        </div>

        {/* ==================== FILTERS SECTION ==================== */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Filters</h3>
              <div className="ml-auto flex items-center gap-2">
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {filteredRecords} invoices found
                </span>
                {(searchQuery ||
                  selectedStatus !== "All" ||
                  selectedPriority !== "All" ||
                  dateRange.start ||
                  dateRange.end) && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedStatus("All");
                        setSelectedPriority("All");
                        setDateRange({ start: "", end: "" });
                        setSelectedMonth(new Date().getMonth() + 1);
                        setSelectedYear(new Date().getFullYear());
                      }}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Clear all
                    </button>
                  )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Search Invoice
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by invoice #, client, or project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option>All</option>
                  <option>Paid</option>
                  <option>Unpaid</option>
                  <option>Overdue</option>
                  <option>Partially Paid</option>
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Cancelled</option>
                </select>
              </div>

              {/* Priority */}
              {/* <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option>All</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div> */}

              {/* Month Navigation */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Month
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2.5 border border-slate-300 bg-white rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                  </button>
                  <div className="flex-1 bg-slate-100 px-3 py-2.5 rounded-xl text-center font-medium text-slate-700">
                    {getDateDisplay()}
                  </div>
                  <button
                    onClick={goToNextMonth}
                    className="p-2.5 border border-slate-300 bg-white rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* ===== DATE RANGE FILTER (NEW) ===== */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Active date range pill */}
            {(dateRange.start || dateRange.end) && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">
                  Active range:
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                  <Calendar className="h-3 w-3" />
                  {dateRange.start ? formatDate(dateRange.start) : "Any"} →{" "}
                  {dateRange.end ? formatDate(dateRange.end) : "Any"}
                </span>
                <button
                  onClick={() => setDateRange({ start: "", end: "" })}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear range
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ==================== INVOICES TABLE ==================== */}
        <InvoiceTable
          data={filteredData}
          loading={loading}
          onViewDetails={(invoice) => {
            setSelectedInvoice(invoice);
            setShowDetailModal(true);
          }}
          onEditInvoice={openEditModal}
          onSettleInvoice={setInvoiceToSettle}
          onDeleteInvoice={(invoice) => {
            setSelectedInvoice(invoice);
            setShowDeleteConfirm(true);
          }}
          onSendInvoice={handleSendInvoice}
          sendingInvoiceId={sendingInvoiceId}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />

        {/* ==================== MODALS ==================== */}
        {showCreateModal && (
          <CreateInvoiceModal
            onClose={() => {
              setShowCreateModal(false);
              setEditingInvoice(null);
              setNewlyAddedClient(null);
            }}
            clients={clients}
            invoice={editingInvoice}
            onSave={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
            onAddCustomer={() => setShowCreateCustomerModal(true)}
            loading={actionLoading}
            preselectedClient={newlyAddedClient}
            onPreselectedConsumed={() => setNewlyAddedClient(null)}
          />
        )}

        {showCreateCustomerModal && (
          <CreateCustomerModal
            onClose={() => setShowCreateCustomerModal(false)}
            onSave={addCustomer}
            loading={actionLoading}
          />
        )}

        {showDetailModal && selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            onEdit={() => openEditModal(selectedInvoice)}
            onSend={() => handleSendInvoice(selectedInvoice)}
            isSending={sendingInvoiceId === selectedInvoice.id}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedInvoice(null);
            }}
          />
        )}

        {invoiceToSettle && (
          <SettleInvoiceModal
            invoice={invoiceToSettle}
            loading={actionLoading}
            onConfirm={handleSettleInvoice}
            onClose={() => setInvoiceToSettle(null)}
          />
        )}

        {showDeleteConfirm && selectedInvoice && (
          <DeleteConfirmModal
            invoice={selectedInvoice}
            loading={actionLoading}
            onConfirm={() => handleDeleteInvoice(selectedInvoice)}
            onClose={() => {
              setShowDeleteConfirm(false);
              setSelectedInvoice(null);
            }}
          />
        )}
      </div>
    </div>
  );
};


// ==================== BLACK & WHITE PRINT STYLES ====================
const PRINT_STYLES = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    background: #fff;
    font-size: 11px;
    line-height: 1.4;
  }
  .bw-invoice { width: 100%; max-width: 190mm; margin: 0 auto; padding: 0; margin-top: 20px}
  .bw-invoice table { width: 100%; border-collapse: collapse; }
  .bw-invoice .no-print { display: none !important; }

  /* Header */
  .bw-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
  .bw-header-left { display: flex; gap: 12px; align-items: flex-start; }
  .bw-logo { width: 140px; height: 80px; object-fit: contain; }
  .bw-company-name { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; margin: 0 0 4px 0; }
  .bw-company-meta { font-size: 9.5px; color: #222; line-height: 1.5; }
  .bw-company-meta div { white-space: nowrap; }
  .bw-header-right { text-align: right; }
  .bw-title { font-size: 26px; font-weight: 800; letter-spacing: 3px; margin: 0; background: linear-gradient(to right, #2563eb, #4f46e5); background-clip: text; -webkit-background-clip: text; color: transparent; -webkit-text-fill-color: transparent;}
  .bw-inv-no { font-size: 12px; font-weight: 700; margin-top: 4px; font-family: monospace; }

  /* Info grid */
  .bw-info { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
  .bw-box { border: 1px solid #000; padding: 10px 12px; }
  .bw-box-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
  .bw-box-row { display: grid; grid-template-columns: 90px 1fr; gap: 4px; font-size: 10px; margin-bottom: 3px; }
  .bw-box-row strong { font-weight: 700; }
  .bw-client-name { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
  .bw-client-line { font-size: 10px; margin-bottom: 2px; }

  /* Items table */
  .bw-items { width: 100%; margin-bottom: 14px; }
  .bw-items thead th { background: #f1f5f9; color: #000000; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 8px; text-align: left; border: 1px solid #000; }
  .bw-items thead th.center { text-align: center; }
  .bw-items thead th.right { text-align: right; }
  .bw-items tbody td { padding: 6px 8px; font-size: 10.5px; border: 1px solid #000; vertical-align: top; }
  .bw-items tbody td.center { text-align: center; }
  .bw-items tbody td.right { text-align: right; }
  .bw-items tbody tr:nth-child(even) td { background: #f4f4f4; }

  /* Totals */
  .bw-totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 14px; }
  .bw-totals { width: 55%; }
  .bw-totals td { padding: 5px 8px; font-size: 10.5px; border: 1px solid #000; }
  .bw-totals .lbl { background: #ffffff; font-weight: 600; width: 55%; }
  .bw-totals .val { text-align: right; }
  .bw-totals .grand td { font-size: 13px; font-weight: 800; background: #f1f5f9; color: #000000; }
  .bw-totals .balance td { background: #f1f5f9; font-weight: 800; font-size: 12px; }

  /* Bank details */
  .bw-bank { border: 1.5px solid #000; padding: 10px 12px; margin-bottom: 14px; }
  .bw-bank-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
  .bw-bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 10px; }
  .bw-bank-grid div { padding: 1px 0; }
  .bw-bank-grid strong { font-weight: 700; }

  /* Notes / terms */
  .bw-notes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .bw-note-box { border: 1px solid #000; padding: 8px 10px; font-size: 9.5px; }
  .bw-note-box h5 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0; }

  /* Notice */
  .bw-notice { text-align: center; padding: 6px; font-size: 9px; font-style: italic; margin-bottom: 12px; }

  /* Footer */
  .bw-footer { border-top: 2px solid #000; padding-top: 8px; text-align: center; font-size: 9px; color: #111; }
  .bw-footer .line1 { font-weight: 600; margin-bottom: 2px; }
  .bw-footer .line2 { margin-bottom: 2px; }
  .bw-footer .thanks { font-size: 11px; font-weight: 700; margin-bottom: 3px; }
`;

// ==================== INVOICE DETAIL MODAL ====================
const InvoiceDetailModal = ({ invoice, onClose, onEdit, onSend, isSending }) => {
  const handlePrint = () => {
    const printArea = document.getElementById("invoice-print-content");
    if (!printArea) return;
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) {
      alert("Please allow pop-ups to print the invoice.");
      return;
    }
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <meta charset="utf-8" />
          <style>${PRINT_STYLES}</style>
        </head>
        <body>${printArea.innerHTML}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const total = Number(invoice.total_amount) || 0;
  const paid = Number(invoice.paid_amount) || 0;
  const balance = Math.max(0, total - paid);
  const isPartiallyPaid = invoice.status === "Partially Paid";

  return (
    <>
      {/* ================= HIDDEN PRINT LAYOUT (B&W) ================= */}
      <div id="invoice-print-content" className="hidden">
        <div className="bw-invoice">

          {/* HEADER */}
          <div className="bw-header">
            <div className="bw-header-left">
              <img
                className="bw-logo"
                src={COMPANY_DETAILS.pdf_logo || COMPANY_DETAILS.logo}
                alt={COMPANY_DETAILS.name}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
            <div className="bw-header-right">
              <h2 className="bw-title">INVOICE</h2>
              <div className="bw-inv-no">#{invoice.invoice_number}</div>
            </div>
          </div>

          {/* INFO GRID */}
          <div className="bw-info">
            <div className="bw-box">
              <div className="bw-box-title">Bill To</div>
              <div className="bw-client-name">{invoice.client_name}</div>
              <div className="bw-client-line">Email: {invoice.client_email || "-"}</div>
              {invoice.client_phone && (
                <div className="bw-client-line">Phone: {invoice.client_phone}</div>
              )}
              {invoice.client_address && (
                <div className="bw-client-line">Address: {invoice.client_address}</div>
              )}
            </div>

            <div className="bw-box">
              <div className="bw-box-title">Invoice Details</div>
              <div className="bw-box-row"><strong>Issue Date:</strong><span>{formatDate(invoice.issue_date)}</span></div>
              <div className="bw-box-row"><strong>Due Date:</strong><span>{formatDate(invoice.due_date)}</span></div>
              <div className="bw-box-row"><strong>Project:</strong><span>{invoice.project_title || "-"}</span></div>
              <div className="bw-box-row"><strong>Status:</strong><span>{invoice.status}</span></div>
              {/* <div className="bw-box-row"><strong>Priority:</strong><span>{invoice.priority || "Medium"}</span></div> */}
            </div>
          </div>

          {/* ITEMS TABLE */}
          <table className="bw-items">
            <thead>
              <tr>
                <th style={{ width: "5%" }} className="center">#</th>
                <th>Description</th>
                <th style={{ width: "20%" }} className="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="center">{idx + 1}</td>
                  <td>{item.description || "Service"}</td>
                  <td className="right">
                    {formatCurrency(item.amount ?? (Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="bw-totals-wrap">
            <table className="bw-totals">
              <tbody>
                <tr>
                  <td className="lbl">Subtotal</td>
                  <td className="val">
                    {formatCurrency(invoice.subtotal || total)}
                  </td>
                </tr>
                {Number(invoice.tax_amount) > 0 && (
                  <tr>
                    <td className="lbl">Tax</td>
                    <td className="val">{formatCurrency(invoice.tax_amount)}</td>
                  </tr>
                )}
                {Number(invoice.discount_amount) > 0 && (
                  <tr>
                    <td className="lbl">Discount</td>
                    <td className="val">-{formatCurrency(invoice.discount_amount)}</td>
                  </tr>
                )}
                <tr className="grand">
                  <td className="lbl" style={{ background: "#f1f5f9", color: "#000000" }}>Total</td>
                  <td className="val">{formatCurrency(total)}</td>
                </tr>
                {isPartiallyPaid && (
                  <>
                    <tr>
                      <td className="lbl">Amount Paid</td>
                      <td className="val">{formatCurrency(paid)}</td>
                    </tr>
                    <tr className="balance">
                      <td className="lbl">Balance Due</td>
                      <td className="val">{formatCurrency(balance)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* BANK DETAILS */}
          <div className="bw-bank">
            <div className="bw-bank-title">Payment / Bank Details</div>
            <div className="bw-bank-grid">
              <div><strong>Bank:</strong> {COMPANY_DETAILS.bank.bankName}</div>
              <div><strong>Account Title:</strong> {COMPANY_DETAILS.bank.accountTitle}</div>
              <div><strong>Account Number:</strong> {COMPANY_DETAILS.bank.accountNumber}</div>
              <div><strong>IBAN:</strong> {COMPANY_DETAILS.bank.iban}</div>
            </div>
          </div>

          {/* NOTES + TERMS */}
          {(invoice.notes || invoice.terms) && (
            <div className="bw-notes">
              {invoice.notes && (
                <div className="bw-note-box">
                  <h5>Notes</h5>
                  <div>{invoice.notes}</div>
                </div>
              )}
              {invoice.terms && (
                <div className="bw-note-box">
                  <h5>Terms &amp; Conditions</h5>
                  <div>{invoice.terms}</div>
                </div>
              )}
            </div>
          )}

          {/* COMPUTER GENERATED NOTICE */}
          <div className="bw-notice">
            This is a computer generated invoice and does not require a signature.
          </div>

          {/* FOOTER */}
          <div className="bw-footer">
            <div className="thanks">Thank you for your business!</div>
            <div className="line1">
              For queries, contact {COMPANY_DETAILS.email} | {COMPANY_DETAILS.phone}
            </div>
            <div className="line1">
              Address: {COMPANY_DETAILS.address}
            </div>
            <div className="line2">
              Please quote invoice #{invoice.invoice_number} in your payment reference.
            </div>
            <div>
              © {new Date().getFullYear()} {COMPANY_DETAILS.name}. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* ================= ON-SCREEN MODAL ================= */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">

          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Invoice Details
                </h2>
                <p className="text-xs text-slate-500">
                  #{invoice.invoice_number}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all text-sm font-medium"
              >
                <Edit className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
              >
                <Printer className="h-4 w-4" /> Print / PDF
              </button>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-8 space-y-6">

            {/* Company + Invoice Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <img
                  src={COMPANY_DETAILS.pdf_logo || COMPANY_DETAILS.logo}
                  alt={COMPANY_DETAILS.name}
                  className="w-[220px] h-24 object-contain"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div>
                  {/* <h3 className="text-lg font-bold text-slate-800">
                    {COMPANY_DETAILS.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {COMPANY_DETAILS.address}
                  </p>
                  <p className="text-xs text-slate-600">
                    {COMPANY_DETAILS.phone} • {COMPANY_DETAILS.email}
                  </p> */}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  INVOICE
                </div>
                <div className="text-xs text-slate-500 mt-2 font-mono">
                  #{invoice.invoice_number}
                </div>
                <div className="text-xs text-slate-500">
                  Issued: {formatDate(invoice.issue_date)}
                </div>
                <div className="text-xs text-slate-500">
                  Due: {formatDate(invoice.due_date)}
                </div>
              </div>
            </div>

            {/* Client + Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-slate-700">Client</h4>
                </div>
                <p className="font-bold text-slate-800 text-lg">{invoice.client_name}</p>
                <p className="text-sm text-slate-600 flex items-center gap-2 mt-2">
                  <Mail className="h-3 w-3" /> {invoice.client_email}
                </p>
                {invoice.client_phone && (
                  <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                    <Phone className="h-3 w-3" /> {invoice.client_phone}
                  </p>
                )}
                {invoice.client_address && (
                  <p className="text-sm text-slate-600 flex items-start gap-2 mt-3 pt-3 border-t border-slate-200">
                    <MapPin className="h-3 w-3 mt-0.5" /> {invoice.client_address}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-slate-700">Project</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Title:</span>
                    <span className="font-semibold text-slate-800">
                      {invoice.project_title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Priority:</span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(invoice.priority)}`}>
                      {getPriorityIcon(invoice.priority)} {invoice.priority || "Medium"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                Invoice Items
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(invoice.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{item.description}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(item.amount ?? (Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">Total:</td>
                      <td className="px-4 py-3 text-right font-black text-xl text-blue-600">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                    {isPartiallyPaid && (
                      <>
                        <tr>
                          <td className="px-4 py-2 text-right text-sm text-slate-600">Paid:</td>
                          <td className="px-4 py-2 text-right font-semibold text-emerald-600">
                            {formatCurrency(paid)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-right text-sm text-slate-600">Balance:</td>
                          <td className="px-4 py-2 text-right font-semibold text-amber-700">
                            {formatCurrency(balance)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-slate-700" />
                <h4 className="text-sm font-semibold text-slate-700">Payment / Bank Details</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Bank:</span> <strong className="text-slate-800">{COMPANY_DETAILS.bank.bankName}</strong></div>
                <div><span className="text-slate-500">Account Title:</span> <strong className="text-slate-800">{COMPANY_DETAILS.bank.accountTitle}</strong></div>
                <div><span className="text-slate-500">Account #:</span> <strong className="text-slate-800 font-mono">{COMPANY_DETAILS.bank.accountNumber}</strong></div>
                <div><span className="text-slate-500">IBAN:</span> <strong className="text-slate-800 font-mono">{COMPANY_DETAILS.bank.iban}</strong></div>
              </div>
            </div>

            {/* Notes / Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoice.notes && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h5 className="text-xs font-bold text-amber-700 uppercase mb-2">Notes</h5>
                    <p className="text-sm text-amber-800">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h5 className="text-xs font-bold text-blue-700 uppercase mb-2">Terms &amp; Conditions</h5>
                    <p className="text-sm text-blue-800">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Computer Generated Notice */}
            <div className="text-center text-xs italic text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-lg py-2">
              This is a computer generated invoice and does not require a signature.
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ==================== INVOICE TABLE ====================
const InvoiceTable = ({
  data,
  loading,
  onViewDetails,
  onEditInvoice,
  onSettleInvoice,
  onDeleteInvoice,
  onSendInvoice,
  sendingInvoiceId,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => {
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, setCurrentPage]);

  if (loading) {
    return (
      <PagePreloader
        loading={true}
        variant="table"
        message="Loading invoices..."
      />
    );
  }

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-slate-200">
        <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-700 mb-2">
          No Invoices Found
        </h3>
        <p className="text-slate-500">
          Try adjusting your filters or create a new invoice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                {[
                  "Invoice #",
                  "Client",
                  "Project",
                  "Issue Date",
                  "Due Date",
                  "Amount",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedData.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">
                      {invoice.invoice_number}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {invoice.client_name?.charAt(0) || "C"}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">
                          {invoice.client_name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {invoice.client_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-800">
                      {invoice.project_title}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {formatDate(invoice.due_date)}
                    </div>
                    {(() => {
                      const dueDate = parseDateOnly(invoice.due_date);
                      const today = parseDateOnly(getLocalDateString());
                      return (
                        dueDate &&
                        today &&
                        dueDate < today &&
                        invoice.status !== "Paid" && (
                          <div className="text-xs text-red-500 mt-1">
                            Overdue
                          </div>
                        )
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">
                      {formatCurrency(Number(invoice.total_amount) || 0)}
                    </div>
                    {invoice.status === "Partially Paid" && (
                      <div className="mt-1 space-y-1">
                        <div className="text-xs text-emerald-600">
                          Paid:{" "}
                          {formatCurrency(Number(invoice.paid_amount) || 0)}
                        </div>
                        <div className="text-xs font-semibold text-amber-700">
                          Due:{" "}
                          {formatCurrency(
                            Math.max(
                              0,
                              (Number(invoice.total_amount) || 0) -
                              (Number(invoice.paid_amount) || 0)
                            )
                          )}
                        </div>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  ((Number(invoice.paid_amount) || 0) /
                                    (Number(invoice.total_amount) || 1)) *
                                  100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      {invoice.status === "Partially Paid" && (
                        <button
                          onClick={() => onSettleInvoice(invoice)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          title="Settle remaining balance"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {(() => {
                        const isSending = sendingInvoiceId === invoice.id;
                        const isDisabled =
                          !invoice.client_email ||
                          (sendingInvoiceId !== null && !isSending);

                        return (
                          <button
                            onClick={() => onSendInvoice(invoice)}
                            disabled={isDisabled}
                            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors disabled:opacity-50"
                            title={isSending ? "Sending..." : "Send invoice via email"}
                          >
                            {isSending ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => onViewDetails(invoice)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditInvoice(invoice)}
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                        title="Edit Invoice"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteInvoice(invoice)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.length > itemsPerPage && (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="text-sm text-slate-600">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, data.length)} of {data.length}{" "}
            invoices
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {currentPage}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CLIENT SEARCH SELECT ====================
const ClientSearchSelect = ({
  clients,
  value,
  onChange,
  required = false,
  preselectedClient = null,
  onPreselectedConsumed,
}) => {
  const containerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);

  const applyClient = useCallback(
    (client) => {
      if (!client?.id) return;
      setSelected(client);
      onChange(client.id, client);
      setQuery("");
      setOpen(false);
      setResults([]);
    },
    [onChange]
  );

  useEffect(() => {
    if (preselectedClient?.id) {
      applyClient(preselectedClient);
      onPreselectedConsumed?.();
    }
  }, [preselectedClient, applyClient, onPreselectedConsumed]);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    const numericValue = parseInt(value, 10);
    if (!selected || selected.id !== numericValue) {
      const match = clients.find((c) => c.id === numericValue);
      if (match) setSelected(match);
    }
  }, [value, clients, selected]);

  useEffect(() => {
    if (!open) return undefined;

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ limit: "15" });
        if (query.trim()) params.set("search", query.trim());
        const result = await apiRequest(
          `${endpoints.clients.getAll}?${params}`
        );
        if (result.success && Array.isArray(result.data)) {
          setResults(result.data);
        } else {
          setResults([]);
        }
      } catch {
        const q = query.trim().toLowerCase();
        const local = clients
          .filter((c) => {
            if (!q) return true;
            return (
              c.name?.toLowerCase().includes(q) ||
              c.email?.toLowerCase().includes(q) ||
              c.phone?.toLowerCase().includes(q)
            );
          })
          .slice(0, 15);
        setResults(local);
      } finally {
        setSearching(false);
      }
    }, query.trim() ? 280 : 0);

    return () => clearTimeout(timer);
  }, [query, open, clients]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const clearSelection = () => {
    setSelected(null);
    onChange("", null);
    setQuery("");
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {(selected.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-slate-800">
              {selected.name}
            </div>
            <div className="truncate text-sm text-slate-500">
              {selected.email}
            </div>
            {selected.phone && (
              <div className="truncate text-xs text-slate-400">
                {selected.phone}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600"
            title="Change client"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              required={required && !value}
              placeholder="Search client by name, email, or phone..."
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Browse clients"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""
                  }`}
              />
            </button>
          </div>

          {open && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
              {searching ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Searching clients...
                </div>
              ) : results.length > 0 ? (
                results.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onMouseDown={() => applyClient(client)}
                    className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-blue-50 last:border-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                      {(client.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-slate-800">
                        {client.name}
                      </div>
                      <div className="truncate text-sm text-slate-500">
                        {client.email}
                      </div>
                    </div>
                    {client.phone && (
                      <span className="shrink-0 text-xs text-slate-400">
                        {client.phone}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  {query.trim()
                    ? "No clients match your search"
                    : "No clients found"}
                </div>
              )}
            </div>
          )}
        </>
      )}
      <input type="hidden" value={value || ""} required={required} />
    </div>
  );
};

// ==================== CREATE INVOICE MODAL ====================
const CreateInvoiceModal = ({
  onClose,
  clients,
  invoice = null,
  onSave,
  onAddCustomer,
  loading = false,
  preselectedClient = null,
  onPreselectedConsumed,
}) => {
  const isEditing = Boolean(invoice?.id);
  const today = getLocalDateString();

  const buildInitialForm = (inv) => ({
    client_id: inv?.customer_id || inv?.client_id || "",
    project_title: inv?.project_title || "",
    issue_date: inv?.issue_date ? toDateInputValue(inv.issue_date) : today,
    due_date: inv?.due_date
      ? toDateInputValue(inv.due_date)
      : addDaysToDateString(today, 30),
    items:
      inv?.items?.length > 0
        ? inv.items.map((item) => ({
          description: item.description || "",
          quantity: item.quantity ?? 1,
          unit_price: item.unit_price ?? 0,
          amount: item.amount ?? (Number(item.quantity ?? 1) * Number(item.unit_price ?? 0)),
        }))
        : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
    notes: inv?.notes || "",
    terms: inv?.terms || "",
    priority: inv?.priority || "Medium",
    status: inv?.status || "Sent",
    paid_amount:
      inv?.paid_amount != null && inv.paid_amount !== ""
        ? Number(inv.paid_amount)
        : 0,
  });

  const [formData, setFormData] = useState(() => buildInitialForm(invoice));
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    setFormData(buildInitialForm(invoice));
  }, [invoice]);

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (Number(item.amount) || 0);
    }, 0);
    return Math.round((subtotal + Number.EPSILON) * 100) / 100;
  };

  const total = calculateTotal();

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: "", quantity: 1, unit_price: 0, amount: 0 },
      ],
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    if (field === "amount") {
      newItems[index].quantity = 1;
      newItems[index].unit_price = Number(value) || 0;
    }
    setFormData({ ...formData, items: newItems });
  };

  const handleStatusChange = (status) => {
    setPaymentError("");
    let paid = Number(formData.paid_amount) || 0;
    if (status === "Paid") paid = total;
    else if (["Unpaid", "Draft", "Sent", "Cancelled"].includes(status))
      paid = 0;
    setFormData({ ...formData, status, paid_amount: paid });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.client_id) return;
    setPaymentError("");
    let paidAmount = Number(formData.paid_amount) || 0;
    if (formData.status === "Paid") paidAmount = total;
    else if (formData.status === "Partially Paid") {
      if (
        !Number.isFinite(paidAmount) ||
        paidAmount <= 0 ||
        paidAmount >= total
      ) {
        setPaymentError(
          total > 0
            ? "Enter an amount greater than zero and less than the invoice total."
            : "Add an invoice item with an amount greater than zero before recording a partial payment."
        );
        return;
      }
    } else if (
      ["Unpaid", "Draft", "Sent", "Cancelled"].includes(formData.status)
    ) {
      paidAmount = 0;
    }

    const payload = {
      client_id: parseInt(formData.client_id, 10),
      project_title: formData.project_title,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      items: formData.items.map((item) => ({
        description: item.description,
        quantity: 1,
        unit_price: Number(item.amount) || 0,
        amount: Number(item.amount) || 0,
      })),
      notes: formData.notes,
      terms: formData.terms,
      priority: formData.priority,
      tax_amount: 0,
      discount_amount: 0,
      status: formData.status,
      paid_amount: paidAmount,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {isEditing ? "Edit Invoice" : "Create New Invoice"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">
                Select Client *
              </label>
              <button
                type="button"
                onClick={onAddCustomer}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" /> Add New Customer
              </button>
            </div>
            <ClientSearchSelect
              clients={clients}
              value={formData.client_id}
              required
              preselectedClient={preselectedClient}
              onPreselectedConsumed={onPreselectedConsumed}
              onChange={(clientId) =>
                setFormData({ ...formData, client_id: clientId })
              }
            />
          </div>

          {/* Project Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={formData.project_title}
              onChange={(e) =>
                setFormData({ ...formData, project_title: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Website Development"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Issue Date *
              </label>
              <input
                type="date"
                required
                value={formData.issue_date}
                onChange={(e) =>
                  setFormData({ ...formData, issue_date: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Items — FIXED LAYOUT (delete icon no overlap) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">
                Invoice Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-[1fr_160px_44px] gap-3 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <div>Description</div>
                <div className="text-right">Amount</div>
                <div></div>
              </div>

              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_160px_44px] gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200"
                >
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={item.amount || ""}
                    onChange={(e) =>
                      updateItem(index, "amount", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-center">
                    {formData.items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="w-8 h-8" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option>Sent</option>
                <option>Draft</option>
                <option>Unpaid</option>
                <option>Paid</option>
                <option>Partially Paid</option>
                <option>Overdue</option>
                <option>Cancelled</option>
              </select>
            </div>
          </div>

          {/* Paid amount block */}
          {["Partially Paid", "Paid", "Overdue"].includes(formData.status) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Amount Paid{" "}
                {formData.status === "Partially Paid" && (
                  <span className="text-rose-500">*</span>
                )}
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    max={total > 0 ? total : undefined}
                    value={formData.paid_amount}
                    disabled={formData.status === "Paid"}
                    onChange={(e) => {
                      setPaymentError("");
                      setFormData({
                        ...formData,
                        paid_amount:
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value),
                      });
                    }}
                    className="w-full pl-10 pr-3 py-2.5 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="How much has been paid?"
                  />
                </div>
                <div className="text-sm text-slate-600 whitespace-nowrap">
                  Remaining:{" "}
                  <span className="font-semibold text-rose-600">
                    {formatCurrency(
                      Math.max(0, total - (Number(formData.paid_amount) || 0))
                    )}
                  </span>
                </div>
              </div>
              {paymentError && (
                <p
                  role="alert"
                  className="mt-2 text-sm font-medium text-rose-700"
                >
                  {paymentError}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Terms &amp; Conditions
            </label>
            <textarea
              rows="2"
              value={formData.terms}
              onChange={(e) =>
                setFormData({ ...formData, terms: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Payment terms..."
            />
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-700">
                Invoice Total:
              </span>
              <span className="text-3xl font-bold text-blue-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.client_id}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-60"
            >
              {loading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== CREATE CUSTOMER MODAL ====================
const CreateCustomerModal = ({ onClose, onSave, loading = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">
              Add New Customer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Customer Name *
            </label>

            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="customer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Address
            </label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Customer address"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== SETTLE INVOICE MODAL ====================
const SettleInvoiceModal = ({ invoice, onConfirm, onClose, loading = false }) => {
  const invoiceTotal = Number(invoice.total_amount) || 0;
  const paidAmount = Number(invoice.paid_amount) || 0;
  const balanceDue = Math.max(0, invoiceTotal - paidAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settle-invoice-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-full bg-emerald-100 p-2">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3
              id="settle-invoice-title"
              className="text-xl font-bold text-slate-800"
            >
              Settle Invoice
            </h3>
            <p className="text-sm text-slate-500">{invoice.invoice_number}</p>
          </div>
        </div>

        <p className="mb-5 text-sm text-slate-600">
          Confirm that the remaining payment has been received. This will mark
          the invoice as fully paid.
        </p>

        <dl className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Invoice total</dt>
            <dd className="font-semibold text-slate-800">
              {formatCurrency(invoiceTotal)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Paid so far</dt>
            <dd className="font-semibold text-emerald-700">
              {formatCurrency(paidAmount)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
            <dt className="font-semibold text-slate-700">
              Remaining balance received
            </dt>
            <dd className="font-bold text-emerald-700">
              {formatCurrency(balanceDue)}
            </dd>
          </div>
        </dl>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || balanceDue <= 0}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            <CheckCircle className="h-4 w-4" />
            {loading ? "Updating..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== DELETE CONFIRM MODAL ====================
const DeleteConfirmModal = ({ invoice, onConfirm, onClose, loading = false }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Delete Invoice</h3>
        </div>

        <p className="text-slate-600 mb-6">
          Are you sure you want to delete invoice{" "}
          <span className="font-semibold">{invoice.invoice_number}</span>? This
          action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Deleting..." : "Delete Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;
