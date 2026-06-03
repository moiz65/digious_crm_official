// InvoiceManagement.jsx - Complete Invoice Management System
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { endpoints } from "../config/api";
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
} from "lucide-react";
import Chart from "chart.js/auto";

// Utility Functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status) => {
  const colors = {
    'Paid': 'bg-emerald-100 text-emerald-700',
    'Unpaid': 'bg-rose-100 text-rose-700',
    'Overdue': 'bg-red-100 text-red-700',
    'Partially Paid': 'bg-amber-100 text-amber-700',
    'Cancelled': 'bg-slate-100 text-slate-700',
    'Draft': 'bg-gray-100 text-gray-700',
    'Sent': 'bg-blue-100 text-blue-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
};

const getPriorityColor = (priority) => {
  const colors = {
    'High': 'text-red-600 bg-red-50',
    'Medium': 'text-amber-600 bg-amber-50',
    'Low': 'text-emerald-600 bg-emerald-50',
  };
  return colors[priority] || 'text-slate-600 bg-slate-50';
};

const InvoiceManagement = () => {
  // State Management
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const [filteredRecords, setFilteredRecords] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Get user info for auth
  const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const token = localStorage.getItem("token");

  // Fetch all invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.126.74.55:5000"}/api/v1/invoices?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (result.success && result.data) {
        setInvoices(result.data);
        setTotalRecords(result.data.length);
        setFilteredRecords(result.data.length);
      } else {
        // Fallback to mock data if API not ready
        setInvoices(getMockInvoices());
        setTotalRecords(getMockInvoices().length);
        setFilteredRecords(getMockInvoices().length);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      // Use mock data for demo
      setInvoices(getMockInvoices());
      setTotalRecords(getMockInvoices().length);
      setFilteredRecords(getMockInvoices().length);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://100.126.74.55:5000"}/api/v1/clients?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.success && result.data) {
        setClients(result.data);
      } else {
        setClients(getMockClients());
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients(getMockClients());
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [fetchInvoices, fetchClients]);

  // Filter data
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
        const invoiceDate = new Date(invoice.issue_date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        matchesDateRange = invoiceDate >= startDate && invoiceDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesDateRange;
    });
  }, [invoices, searchQuery, selectedStatus, selectedPriority, dateRange]);

  useEffect(() => {
    setFilteredRecords(filteredData.length);
  }, [filteredData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const s = invoices.reduce(
      (acc, inv) => {
        acc.totalInvoices++;
        acc.totalRevenue += inv.total_amount || 0;
        
        if (inv.status === "Paid") {
          acc.paidInvoices++;
          acc.paidAmount += inv.total_amount || 0;
        } else if (inv.status === "Unpaid") {
          acc.unpaidInvoices++;
          acc.unpaidAmount += inv.total_amount || 0;
        } else if (inv.status === "Overdue") {
          acc.overdueInvoices++;
          acc.overdueAmount += inv.total_amount || 0;
        } else if (inv.status === "Partially Paid") {
          acc.partiallyPaidInvoices++;
          acc.partiallyPaidAmount += inv.total_amount || 0;
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
    
    s.averageInvoiceValue = s.totalInvoices > 0 ? s.totalRevenue / s.totalInvoices : 0;
    s.collectionRate = s.totalRevenue > 0 ? (s.paidAmount / s.totalRevenue) * 100 : 0;
    
    return s;
  }, [invoices]);

  // Navigation functions
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
    return new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Invoice #", "Client", "Project", "Issue Date", "Due Date", "Amount", "Status", "Priority"];
    const csvData = filteredData.map(inv => [
      inv.invoice_number,
      inv.client_name,
      inv.project_title,
      formatDate(inv.issue_date),
      formatDate(inv.due_date),
      inv.total_amount,
      inv.status,
      inv.priority
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${getDateDisplay()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="p-8 max-w-[1600px] mx-auto">
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
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Create Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-blue-100 text-xs">Total Revenue</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.paidInvoices}</div>
                <div className="text-emerald-100 text-xs">Paid Invoices</div>
                <div className="text-xs">{formatCurrency(stats.paidAmount)}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.unpaidInvoices + stats.overdueInvoices}</div>
                <div className="text-rose-100 text-xs">Pending Payments</div>
                <div className="text-xs">{formatCurrency(stats.unpaidAmount + stats.overdueAmount)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Filters Section - Clean & Readable */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Filters</h3>
              <div className="ml-auto flex items-center gap-2">
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {filteredRecords} invoices found
                </span>
                {(searchQuery || selectedStatus !== "All" || selectedPriority !== "All" || dateRange.start || dateRange.end) && (
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
            {/* Top row - Search and Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
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

              {/* Status Filter */}
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

              {/* Priority Filter */}
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
            </div>

            {/* Bottom row - Date filters and Month/Year navigation */}
            
          </div>
        </div>

        {/* Invoices Table */}
        <InvoiceTable
          data={filteredData}
          loading={loading}
          onViewDetails={(invoice) => {
            setSelectedInvoice(invoice);
            setShowDetailModal(true);
          }}
          onDeleteInvoice={(invoice) => {
            setSelectedInvoice(invoice);
            setShowDeleteConfirm(true);
          }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />

        {/* Create/Edit Invoice Modal */}
        {showCreateModal && (
          <CreateInvoiceModal
            onClose={() => setShowCreateModal(false)}
            clients={clients}
            onSave={(newInvoice) => {
              setInvoices([newInvoice, ...invoices]);
              setShowCreateModal(false);
            }}
          />
        )}

        {/* Invoice Detail Modal */}
        {showDetailModal && selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedInvoice(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedInvoice && (
          <DeleteConfirmModal
            invoice={selectedInvoice}
            onConfirm={() => {
              setInvoices(invoices.filter(i => i.id !== selectedInvoice.id));
              setShowDeleteConfirm(false);
              setSelectedInvoice(null);
            }}
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

// Invoice Table Component
const InvoiceTable = ({
  data,
  loading,
  onViewDetails,
  onDeleteInvoice,
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
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Invoices Found</h3>
        <p className="text-slate-500">Try adjusting your filters or create a new invoice.</p>
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
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedData.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono font-semibold text-slate-800">
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
                    {new Date(invoice.due_date) < new Date() && invoice.status !== "Paid" && (
                      <div className="text-xs text-red-500 mt-1">Overdue</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    {invoice.status === "Partially Paid" && invoice.paid_amount > 0 && (
                      <div className="text-xs text-emerald-600">
                        Paid: {formatCurrency(invoice.paid_amount)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(invoice.priority)}`}>
                      {invoice.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewDetails(invoice)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

// Create Invoice Modal Component (Simplified - removed tax, discount, project code)
const CreateInvoiceModal = ({ onClose, clients, onSave }) => {
  const [formData, setFormData] = useState({
    client_id: "",
    project_title: "",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
    notes: "",
    terms: "",
    priority: "Medium",
  });

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const total = calculateTotal();

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unit_price: 0, amount: 0 }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    if (field === "quantity" || field === "unit_price") {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newInvoice = {
      id: Date.now(),
      invoice_number: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client_name: clients.find(c => c.id === parseInt(formData.client_id))?.name || "",
      client_email: clients.find(c => c.id === parseInt(formData.client_id))?.email || "",
      ...formData,
      subtotal: total,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: total,
      status: "Sent",
      created_at: new Date().toISOString(),
    };
    onSave(newInvoice);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Create New Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Client *
            </label>
            <select
              required
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.email}
                </option>
              ))}
            </select>
          </div>

          {/* Project Details */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={formData.project_title}
              onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Invoice Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start bg-slate-50 p-3 rounded-xl">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <div className="text-sm font-medium text-slate-700 py-2">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Terms & Conditions */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Terms & Conditions
            </label>
            <textarea
              rows="2"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Payment terms..."
            />
          </div>

          {/* Summary - Simplified */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-700">Total Amount:</span>
              <span className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</span>
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
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invoice Detail Modal Component (Simplified - removed tax, discount, project code)
const InvoiceDetailModal = ({ invoice, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("PDF download feature coming soon!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Invoice Details</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="h-5 w-5 text-slate-600" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Download PDF"
            >
              <FileDown className="h-5 w-5 text-slate-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="text-sm text-slate-500">INVOICE NUMBER</div>
              <div className="text-2xl font-bold text-slate-800">{invoice.invoice_number}</div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Total Amount</div>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(invoice.total_amount)}</div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 mb-2">Bill To:</h3>
            <div className="text-slate-800 font-semibold">{invoice.client_name}</div>
            <div className="text-sm text-slate-600">{invoice.client_email}</div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 mb-2">Project:</h3>
            <div className="text-slate-800 font-semibold">{invoice.project_title}</div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
          <div>
            <div className="text-xs text-slate-500">Issue Date</div>
            <div className="text-sm font-semibold text-slate-800">{formatDate(invoice.issue_date)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Due Date</div>
            <div className="text-sm font-semibold text-slate-800">{formatDate(invoice.due_date)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Priority</div>
            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(invoice.priority)}`}>
              {invoice.priority}
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-3">Invoice Items</h3>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-700">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-semibold text-slate-700">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(invoice.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes & Terms */}
        {invoice.notes && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-1">Notes</h3>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{invoice.notes}</p>
          </div>
        )}
        
        {invoice.terms && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 mb-1">Terms & Conditions</h3>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{invoice.terms}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Close
          </button>
          <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium">
            Mark as Paid
          </button>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
            Send Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ invoice, onConfirm, onClose }) => {
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
          Are you sure you want to delete invoice <span className="font-semibold">{invoice.invoice_number}</span>? 
          This action cannot be undone.
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock Data Functions
const getMockInvoices = () => {
  return [
    {
      id: 1,
      invoice_number: "INV-2024-001",
      client_name: "Tech Corp Solutions",
      client_email: "billing@techcorp.com",
      project_title: "Website Development",
      issue_date: "2024-01-15",
      due_date: "2024-02-14",
      subtotal: 5500,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 5500,
      paid_amount: 5500,
      status: "Paid",
      priority: "High",
      items: [
        { description: "Frontend Development", quantity: 1, unit_price: 3000, amount: 3000 },
        { description: "Backend Development", quantity: 1, unit_price: 2500, amount: 2500 },
      ],
      notes: "Website launch completed successfully",
      terms: "Payment due within 30 days",
      created_at: "2024-01-10T10:00:00Z",
    },
    {
      id: 2,
      invoice_number: "INV-2024-002",
      client_name: "Design Studio Inc",
      client_email: "accounts@designstudio.com",
      project_title: "Brand Identity Design",
      issue_date: "2024-01-20",
      due_date: "2024-02-19",
      subtotal: 2500,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 2500,
      paid_amount: 0,
      status: "Unpaid",
      priority: "Medium",
      items: [
        { description: "Logo Design", quantity: 1, unit_price: 1000, amount: 1000 },
        { description: "Brand Guidelines", quantity: 1, unit_price: 1500, amount: 1500 },
      ],
      notes: "Initial concepts approved",
      terms: "Payment due upon receipt",
      created_at: "2024-01-15T14:30:00Z",
    },
    {
      id: 3,
      invoice_number: "INV-2024-003",
      client_name: "E-commerce Ventures",
      client_email: "finance@ecomventures.com",
      project_title: "Mobile App Development",
      issue_date: "2023-12-01",
      due_date: "2023-12-31",
      subtotal: 10000,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 10000,
      paid_amount: 5000,
      status: "Partially Paid",
      priority: "High",
      items: [
        { description: "iOS Development", quantity: 1, unit_price: 5000, amount: 5000 },
        { description: "Android Development", quantity: 1, unit_price: 5000, amount: 5000 },
      ],
      notes: "App in testing phase",
      terms: "Payment upon milestone completion",
      created_at: "2023-11-25T09:15:00Z",
    },
  ];
};

const getMockClients = () => {
  return [
    { id: 1, name: "Tech Corp Solutions", email: "billing@techcorp.com", phone: "+1 234-567-8900" },
    { id: 2, name: "Design Studio Inc", email: "accounts@designstudio.com", phone: "+1 234-567-8901" },
    { id: 3, name: "E-commerce Ventures", email: "finance@ecomventures.com", phone: "+1 234-567-8902" },
  ];
};

export default InvoiceManagement;