// InvoiceManagement.jsx - Complete Invoice Management System with Minimalist Design
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import pdfLogo from "../pdf_logo.png";
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
  UserPlus,
} from "lucide-react";

// Utility Functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PKR',
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

const getPriorityIcon = (priority) => {
  if (priority === 'High') return <AlertTriangle className="h-3.5 w-3.5 text-red-600" />;
  if (priority === 'Medium') return <Zap className="h-3.5 w-3.5 text-amber-600" />;
  return <Check className="h-3.5 w-3.5 text-emerald-600" />;
};

// Company Details
const COMPANY_DETAILS = {
  name: "Digious Solutions",
  phone: "(+92)33 127 38475",
  email: "digioussolutions@gmail.com",
  address: "B-71 Block B, North Nazimabad, Karachi",
  logo: "https://www.digioussolutions.com/assets/img/logo-white.svg",
  pdf_logo: pdfLogo,
};

const InvoiceManagement = () => {
  // State Management
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
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
        setInvoices(getMockInvoices());
        setTotalRecords(getMockInvoices().length);
        setFilteredRecords(getMockInvoices().length);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
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

  // Add new customer
  const addCustomer = (newCustomer) => {
    setClients([...clients, { id: Date.now(), ...newCustomer }]);
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

        {/* Main Filters Section */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
            onAddCustomer={() => setShowCreateCustomerModal(true)}
          />
        )}

        {/* Create Customer Modal */}
        {showCreateCustomerModal && (
          <CreateCustomerModal
            onClose={() => setShowCreateCustomerModal(false)}
            onSave={addCustomer}
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

// Create Customer Modal Component
const CreateCustomerModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Add New Customer</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Invoice Modal Component
const CreateInvoiceModal = ({ onClose, clients, onSave, onAddCustomer }) => {
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
    const selectedClient = clients.find(c => c.id === parseInt(formData.client_id));
    const newInvoice = {
      id: Date.now(),
      invoice_number: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client_name: selectedClient?.name || "",
      client_email: selectedClient?.email || "",
      client_phone: selectedClient?.phone || "",
      client_address: selectedClient?.address || "",
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
          {/* Client Selection with Add Customer Button */}
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

          {/* Summary */}
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

// InvoiceDetailModal Component - Minimalist Print Layout
const InvoiceDetailModal = ({ invoice, onClose }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-content');
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <>
      {/* Modern Print Layout */}
      <div id="invoice-print-content" className="hidden">
        <style>{`
          @page { 
            size: A4; 
            margin: 15mm;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .modern-invoice {
            max-width: 210mm;
            margin: 0 auto;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            position: relative;
            overflow: hidden;
          }
          .modern-invoice::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%);
            pointer-events: none;
          }
          .modern-invoice table {
            width: 100%;
            border-collapse: collapse;
          }
          .modern-invoice th, 
          .modern-invoice td {
            padding: 12px 10px;
          }
          .modern-invoice .items-table th {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #ffffff;
            font-weight: 600;
            font-size: 11px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            border: none;
          }
          .modern-invoice .items-table td {
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
          }
          .modern-invoice .items-table tr:hover td {
            background: #f8fafc;
          }
          .modern-invoice .totals-table td {
            padding: 8px 12px;
          }
          .modern-invoice .total-row {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border-radius: 8px;
          }
          .gradient-text {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
        `}</style>

        <div className="modern-invoice" style={{ padding: '8px', position: 'relative' }}>
          
          {/* Decorative Header Bar */}
          <div style={{
            height: '4px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
            marginBottom: '32px',
            borderRadius: '2px',
            backgroundSize: '200% 100%',
            animation: 'gradientShift 3s ease infinite'
          }}></div>

          {/* Header Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '2px solid #e2e8f0',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  width: '150px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={COMPANY_DETAILS.pdf_logo || COMPANY_DETAILS.logo}
                    alt={COMPANY_DETAILS.name + ' Logo'}
                    style={{ width: '150px', height: '50px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, maxWidth: '320px' }}>
                  {COMPANY_DETAILS.address && <div>📍 {COMPANY_DETAILS.address}</div>}
                  {COMPANY_DETAILS.phone && <div>📞 {COMPANY_DETAILS.phone}</div>}
                  {COMPANY_DETAILS.email && <div>✉️ {COMPANY_DETAILS.email}</div>}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '800', 
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '2px',
                marginBottom: '8px'
              }}>
                INVOICE
              </div>
              <div style={{ fontSize: '13px', color: '#475569', fontFamily: 'monospace', fontWeight: '600' }}>
                #{invoice.invoice_number}
              </div>
            </div>
          </div>

          {/* Two Column Info with Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Bill To Card */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                fontSize: '10px', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                color: '#3b82f6',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>👤</span> BILL TO
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                {invoice.client_name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                {invoice.client_email}
              </div>
              {invoice.client_phone && (
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                  📞 {invoice.client_phone}
                </div>
              )}
              {invoice.client_address && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                  📍 {invoice.client_address}
                </div>
              )}
            </div>

            {/* Right Column - Invoice Details + Billing Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}>
                <div style={{ 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  color: '#8b5cf6',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📋</span> INVOICE DETAILS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '11px' }}>
                  <div style={{ color: '#64748b', fontWeight: '500' }}>Issue Date:</div>
                  <div style={{ color: '#0f172a', fontWeight: '500' }}>{formatDate(invoice.issue_date)}</div>
                  <div style={{ color: '#64748b', fontWeight: '500' }}>Due Date:</div>
                  <div style={{ color: '#dc2626', fontWeight: '600' }}>{formatDate(invoice.due_date)}</div>
                  <div style={{ color: '#64748b', fontWeight: '500' }}>Project:</div>
                  <div style={{ color: '#0f172a', fontWeight: '600' }}>{invoice.project_title}</div>
                  <div style={{ color: '#64748b', fontWeight: '500' }}>Priority:</div>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '9px',
                      fontWeight: '700',
                      background: invoice.priority === 'High' ? '#fef2f2' : invoice.priority === 'Medium' ? '#fffbeb' : '#f0fdf4',
                      color: invoice.priority === 'High' ? '#dc2626' : invoice.priority === 'Medium' ? '#d97706' : '#16a34a'
                    }}>
                      {invoice.priority === 'High' ? '🔴' : invoice.priority === 'Medium' ? '🟡' : '🟢'} {invoice.priority || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billing Details Card */}
              
            </div>
          </div>

          {/* Items Table - Premium Design */}
          <div style={{ marginBottom: '28px' }}>
            <table className="items-table" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '14px 12px' }}>Description</th>
                  <th style={{ textAlign: 'center', padding: '14px 12px', width: '15%' }}>Quantity</th>
                  <th style={{ textAlign: 'right', padding: '14px 12px', width: '20%' }}>Unit Price</th>
                  <th style={{ textAlign: 'right', padding: '14px 12px', width: '20%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: '500' }}>
                      {item.description || 'Service'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px', fontSize: '12px' }}>
                      {item.quantity || 1}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px', fontSize: '12px' }}>
                      {formatCurrency(item.unit_price || 0)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                      {formatCurrency(item.amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section - Modern Card Style */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
            <div style={{ width: '300px' }}>
              <table className="totals-table" style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#64748b', fontSize: '11px', padding: '8px 12px' }}>Subtotal</td>
                    <td style={{ textAlign: 'right', fontSize: '11px', color: '#334155', padding: '8px 12px' }}>
                      {formatCurrency(invoice.subtotal || invoice.total_amount || 0)}
                    </td>
                  </tr>
                  {invoice.tax_amount > 0 && (
                    <tr>
                      <td style={{ color: '#64748b', fontSize: '11px', padding: '8px 12px' }}>Tax ({invoice.tax_rate || 0}%)</td>
                      <td style={{ textAlign: 'right', fontSize: '11px', color: '#334155', padding: '8px 12px' }}>
                        {formatCurrency(invoice.tax_amount)}
                      </td>
                    </tr>
                  )}
                  {invoice.discount_amount > 0 && (
                    <tr>
                      <td style={{ color: '#64748b', fontSize: '11px', padding: '8px 12px' }}>Discount</td>
                      <td style={{ textAlign: 'right', fontSize: '11px', color: '#dc2626', padding: '8px 12px' }}>
                        -{formatCurrency(invoice.discount_amount)}
                      </td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', padding: '12px 12px', borderRadius: '8px' }}>
                      Total Amount
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '12px 12px' }}>
                      {formatCurrency(invoice.total_amount || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Status Badge */}
          {invoice.status && (
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '24px',
              padding: '10px',
              background: invoice.status === 'Paid' ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : invoice.status === 'Unpaid' ? 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)',
              borderRadius: '12px',
              border: `1px solid ${invoice.status === 'Paid' ? '#bbf7d0' : invoice.status === 'Unpaid' ? '#fecaca' : '#fde68a'}`
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: invoice.status === 'Paid' ? '#16a34a' : invoice.status === 'Unpaid' ? '#dc2626' : '#d97706'
              }}>
                {invoice.status === 'Paid' ? '✅ PAID IN FULL' : invoice.status === 'Unpaid' ? '⚠️ PENDING PAYMENT' : '🟡 PARTIALLY PAID'}
              </span>
            </div>
          )}

          {/* Notes & Terms Grid */}
          {(invoice.notes || invoice.terms) && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: invoice.notes && invoice.terms ? '1fr 1fr' : '1fr',
              gap: '20px',
              marginBottom: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0'
            }}>
              {invoice.notes && (
                <div style={{
                  background: '#fefce8',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid #fef08a'
                }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#854d0e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📝</span> Notes
                  </div>
                  <div style={{ fontSize: '10px', color: '#713f12', lineHeight: '1.5' }}>
                    {invoice.notes}
                  </div>
                </div>
              )}
              {invoice.terms && (
                <div style={{
                  background: '#eff6ff',
                  borderRadius: '12px',
                  padding: '14px',
                  border: '1px solid #bfdbfe'
                }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e40af', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚖️</span> Terms & Conditions
                  </div>
                  <div style={{ fontSize: '10px', color: '#1e3a8a', lineHeight: '1.5' }}>
                    {invoice.terms}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Premium Footer */}
          <div style={{ 
            textAlign: 'center', 
            paddingTop: '20px', 
            borderTop: '1px solid #e2e8f0',
            marginTop: '8px',
            position: 'relative'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              padding: '8px 20px',
              borderRadius: '30px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>💳</span>
              <span style={{ fontSize: '9px', color: '#475569', fontWeight: '500' }}>
                Please include invoice #{invoice.invoice_number} in your payment reference
              </span>
            </div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>
              For questions, contact <strong>{COMPANY_DETAILS.email}</strong> | 📞 {COMPANY_DETAILS.phone}
            </div>
            <div style={{ fontSize: '8px', color: '#cbd5e1', marginTop: '10px' }}>
              © {new Date().getFullYear()} {COMPANY_DETAILS.name} • All Rights Reserved
            </div>
          </div>
        </div>
      </div>

      {/* MODAL VIEW - Premium Modern Design */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-scaleIn">
          {/* Premium Header */}
          <div className="sticky top-0 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Invoice Details
                </h2>
                <p className="text-xs text-slate-500 font-mono">#{invoice.invoice_number}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm font-medium hover:scale-105"
              >
                <Printer className="h-4 w-4" /> Print / PDF
              </button>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8">
            {/* Premium Company Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                
                <div>
                  <img
                    src={COMPANY_DETAILS.pdf_logo || COMPANY_DETAILS.logo}
                    alt={COMPANY_DETAILS.name + ' Logo'}
                    className="w-[250px] h-32 object-contain rounded-md"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">📍</span>
                    <p className="text-xs text-slate-600">{COMPANY_DETAILS.address}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">📞 {COMPANY_DETAILS.phone}</span>
                    <span className="text-xs text-slate-500">✉️ {COMPANY_DETAILS.email}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  INVOICE
                </div>
                <div className="text-xs text-slate-500 mt-2">Issued: {formatDate(invoice.issue_date)}</div>
                <div className="text-xs text-slate-500">Due: {formatDate(invoice.due_date)}</div>
              </div>
            </div>

            {/* Client & Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">Client Information</h4>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-slate-800 text-lg">{invoice.client_name}</p>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {invoice.client_email}
                  </p>
                  {invoice.client_phone && (
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {invoice.client_phone}
                    </p>
                  )}
                  {invoice.client_address && (
                    <p className="text-sm text-slate-600 flex items-start gap-2 mt-3 pt-3 border-t border-slate-200">
                      <MapPin className="h-3 w-3 mt-0.5" /> {invoice.client_address}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">Project Details</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Project Title:</span>
                    <span className="text-sm font-semibold text-slate-800">{invoice.project_title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Priority Level:</span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(invoice.priority)} shadow-sm`}>
                      {getPriorityIcon(invoice.priority)}
                      {invoice.priority || 'Medium'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Invoice Status:</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)} shadow-sm`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Items Table */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Invoice Items
                </h4>
                <div className="text-sm text-slate-500">
                  {invoice.items?.length || 0} item(s)
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">Qty</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">Unit Price</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-5 py-4 text-slate-700 font-medium">{item.description}</td>
                        <td className="px-5 py-4 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-5 py-4 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                        <td className="px-5 py-4 text-right font-bold text-slate-800">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-slate-50 to-slate-100 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan="3" className="px-5 py-4 text-right font-bold text-slate-700 text-base">Total:</td>
                      <td className="px-5 py-4 text-right font-black text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes & Terms Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {invoice.notes && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <h5 className="text-xs font-bold text-amber-700 uppercase tracking-wide">Notes</h5>
                  </div>
                  <p className="text-sm text-amber-800">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    {/* <Shield className="h-4 w-4 text-blue-600" /> */}
                    <h5 className="text-xs font-bold text-blue-700 uppercase tracking-wide">Terms & Conditions</h5>
                  </div>
                  <p className="text-sm text-blue-800">{invoice.terms}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <button 
                onClick={onClose} 
                className="px-6 py-2.5 text-sm font-medium border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:scale-105"
              >
                Close
              </button>
              <button 
                onClick={handlePrint}
                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
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
      invoice_number: "INV-2026-001",
      client_name: "Tech Corp Solutions",
      client_email: "billing@techcorp.com",
      client_phone: "+1 234-567-8900",
      client_address: "123 Tech Street, Silicon Valley, CA",
      project_title: "Website Development",
      issue_date: "2026-01-15",
      due_date: "2026-02-14",
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
      created_at: "2026-01-10T10:00:00Z",
    },
    {
      id: 2,
      invoice_number: "INV-2026-002",
      client_name: "Design Studio Inc",
      client_email: "accounts@designstudio.com",
      client_phone: "+1 234-567-8901",
      client_address: "456 Creative Ave, Arts District, NY",
      project_title: "Brand Identity Design",
      issue_date: "2026-01-20",
      due_date: "2026-02-19",
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
      created_at: "2026-01-15T14:30:00Z",
    },
    {
      id: 3,
      invoice_number: "INV-2026-003",
      client_name: "E-commerce Ventures",
      client_email: "finance@ecomventures.com",
      client_phone: "+1 234-567-8902",
      client_address: "789 Market Street, Business Bay, CA",
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
    { id: 1, name: "Tech Corp Solutions", email: "billing@techcorp.com", phone: "+1 234-567-8900", address: "123 Tech Street, Silicon Valley, CA" },
    { id: 2, name: "Design Studio Inc", email: "accounts@designstudio.com", phone: "+1 234-567-8901", address: "456 Creative Ave, Arts District, NY" },
    { id: 3, name: "E-commerce Ventures", email: "finance@ecomventures.com", phone: "+1 234-567-8902", address: "789 Market Street, Business Bay, CA" },
  ];
};

export default InvoiceManagement;