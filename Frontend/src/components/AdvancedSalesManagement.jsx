import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { confirmDialog } from "../utils/confirm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  Plus,
  Filter,
  Search,
  RefreshCw,
  X,
  PlusCircle,
  Wallet,
  Users,
  Trash2,
  Edit,
  Save,
  Mail,
  Phone,
  User,
  Loader2,
  ChevronDown,
  ArrowUpDown,
  Flag,
  Globe,
  Palette,
  PenTool,
  Megaphone,
  Code,
  ShoppingCart,
  Camera,
  Layout,
  ShoppingBag,
  XCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  getAllSales,
  createSale,
  updateSale,
  deleteSale as deleteSaleApi,
  getSalesCategories,
} from "../services/salesService";

// ─── Icon map used by both main comp and modal ─────────────────────────────
const ICON_MAP = {
  Globe,
  Palette,
  PenTool,
  Megaphone,
  Code,
  ShoppingCart,
  Layout,
};

const DEFAULT_CATEGORIES = [
  { id: "website-design", name: "Website Design", icon: Globe },
  { id: "logo-design", name: "Logo Design", icon: Palette },
  { id: "branding", name: "Branding", icon: PenTool },
  { id: "marketing", name: "Marketing", icon: Megaphone },
  { id: "development", name: "Development", icon: Code },
  { id: "ecommerce", name: "E-commerce", icon: ShoppingCart },
  { id: "graphic-design", name: "Graphic Design", icon: Layout },
  { id: "other", name: "Other", icon: Globe },
];

const ALL_STATUSES = [
  "pending",
  "in-progress",
  "completed",
  "cancelled",
  "refunded",
];
const MERCHANTS = [
  "Stripe",
  "Ziffs PayPal",
  "Digious PayPal",
  "Innovative PayPal",
  "Crypto",
  "Invoice",
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);

const getStatusCfg = (status) => {
  const map = {
    completed: { bg: "bg-green-50 text-green-700", Icon: CheckCircle },
    "in-progress": { bg: "bg-blue-50 text-blue-700", Icon: TrendingUp },
    pending: { bg: "bg-yellow-50 text-yellow-700", Icon: Clock },
    cancelled: { bg: "bg-red-50 text-red-700", Icon: XCircle },
    refunded: { bg: "bg-purple-50 text-purple-700", Icon: AlertCircle },
  };
  return map[status] || { bg: "bg-gray-50 text-gray-700", Icon: Clock };
};

const CAT_STYLE = {
  "website-design": { color: "text-blue-600 bg-blue-50", Icon: Globe },
  "logo-design": { color: "text-purple-600 bg-purple-50", Icon: Palette },
  branding: { color: "text-indigo-600 bg-indigo-50", Icon: PenTool },
  marketing: { color: "text-orange-600 bg-orange-50", Icon: Megaphone },
  development: { color: "text-green-600 bg-green-50", Icon: Code },
  ecommerce: { color: "text-pink-600 bg-pink-50", Icon: ShoppingCart },
  "graphic-design": { color: "text-red-600 bg-red-50", Icon: Layout },
  other: { color: "text-gray-600 bg-gray-50", Icon: Globe },
};

const getCatStyle = (slug) =>
  CAT_STYLE[slug] || { color: "text-gray-600 bg-gray-50", Icon: Globe };

const getDeadlineInfo = (deadline) => {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (diff < 0)
    return {
      label: `Overdue (${Math.abs(diff)}d)`,
      color: "text-red-600 bg-red-50",
    };
  if (diff <= 7)
    return {
      label: `Due Soon (${diff}d)`,
      color: "text-orange-600 bg-orange-50",
    };
  return { label: `On Track (${diff}d)`, color: "text-green-600 bg-green-50" };
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "\u2014";

// ─── Main Component ────────────────────────────────────────────────────────
const AdvancedSalesManagement = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const [dateRange, setDateRange] = useState("monthly"); // 'daily', 'monthly', 'custom'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [filterMerchants, setFilterMerchants] = useState([]); // Array of selected merchants
  const [showMerchantDropdown, setShowMerchantDropdown] = useState(false);
  const merchantDropdownRef = useRef(null);

  const [selectedSalesIds, setSelectedSalesIds] = useState(new Set()); // Track selected sales
  const [selectAll, setSelectAll] = useState(false);

  const toggleMerchant = (merchant) => {
    setFilterMerchants((prev) => {
      if (prev.includes(merchant)) {
        return prev.filter((m) => m !== merchant);
      } else {
        return [...prev, merchant];
      }
    });
    setPage(1);
  };

  // Select all merchants
  const selectAllMerchants = () => {
    setFilterMerchants([...MERCHANTS]);
    setPage(1);
  };

  // Clear all merchants
  const clearAllMerchants = () => {
    setFilterMerchants([]);
    setPage(1);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        merchantDropdownRef.current &&
        !merchantDropdownRef.current.contains(event.target)
      ) {
        setShowMerchantDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Load categories ──────────────────────────────────────────────────────
  useEffect(() => {
    getSalesCategories()
      .then((data) => {
        if (data && data.length > 0) {
          setCategories(
            data.map((c) => ({
              id: c.slug,
              dbId: c.id,
              name: c.name,
              icon: ICON_MAP[c.icon] || Globe,
              color: c.color,
            })),
          );
        }
      })
      .catch(console.error);
  }, []);

  // ── Load employees (Sales dept only) ────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(
      `${process.env.REACT_APP_API_URL || "http://100.126.74.55:5000"}/api/v1/employees`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setEmployees(json.data.filter((e) => e.department === "Sales"));
        }
      })
      .catch(console.error);
  }, []);
  // Add these navigation functions
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setDateRange("custom");
      setShowDatePicker(false);
    }
  };

  // ── Fetch sales ──────────────────────────────────────────────────────────
  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};

      // Build date filters based on selected range
      if (dateRange === "daily") {
        const d = selectedDate.toISOString().slice(0, 10);
        filters.from = d;
        filters.to = d;
      } else if (dateRange === "monthly") {
        const y = selectedDate.getFullYear();
        const m = selectedDate.getMonth();
        filters.from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
        const lastDay = new Date(y, m + 1, 0).getDate();
        filters.to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      } else if (dateRange === "custom" && customStartDate && customEndDate) {
        filters.from = customStartDate;
        filters.to = customEndDate;
      }

      const res = await getAllSales(filters);
      setSales(
        (res.data || []).map((s) => ({
          id: s.id,
          employeeId: s.employee_id,
          employeeName: s.employee_name || "",
          employeeEmail: s.employee_email || "",
          clientName: s.client_name || "",
          clientEmail: s.client_email || "",
          clientPhone: s.client_phone || "",
          category: s.category_slug || "",
          categoryId: s.category_id,
          totalAmount: parseFloat(s.total_amount) || 0,
          upfrontPayment: parseFloat(s.upfront_payment) || 0,
          remainingBalance: parseFloat(s.remaining_balance) || 0,
          merchant: s.merchant || "",
          paymentMethod: s.payment_method || "",
          accountName: s.account_name || "",
          status: s.status || "pending",
          saleDate: s.sale_date ? s.sale_date.slice(0, 10) : "", // Store raw date string
          date: s.sale_date ? formatDateForFrontend(s.sale_date) : "", // Add formatted date for display
          deadline: s.deadline ? s.deadline.slice(0, 10) : "",
          notes: s.notes || "",
          projectDescription: s.project_description || "",
        })),
      );
    } catch (err) {
      setError(err.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedDate, customStartDate, customEndDate]);

  // Add this useEffect to fetch when date changes
  useEffect(() => {
    fetchSales();
  }, [fetchSales, dateRange, selectedDate, customStartDate, customEndDate]);

  // Get month/year display text
  const getMonthYearDisplay = () => {
    return selectedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getDateDisplay = () => {
    if (dateRange === "daily") {
      return selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return getMonthYearDisplay();
  };

  const formatDateForFrontend = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ── Derived totals ───────────────────────────────────────────────────────
  const totalAmount = sales.reduce((s, r) => s + r.totalAmount, 0);
  const totalUpfront = sales.reduce((s, r) => s + r.upfrontPayment, 0);
  const totalRemaining = sales.reduce((s, r) => s + r.remainingBalance, 0);
  const completedCount = sales.filter((r) => r.status === "completed").length;

  // ── Filter + sort + paginate ─────────────────────────────────────────────
  const filtered = sales
    .filter((s) => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterCategory !== "all" && s.category !== filterCategory)
        return false;
      // Multiple merchant filter
      if (filterMerchants.length > 0 && !filterMerchants.includes(s.merchant))
        return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.clientName.toLowerCase().includes(q) &&
          !s.employeeName.toLowerCase().includes(q) &&
          !s.projectDescription.toLowerCase().includes(q) &&
          !s.merchant.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "client":
          cmp = a.clientName.localeCompare(b.clientName);
          break;
        case "employee":
          cmp = a.employeeName.localeCompare(b.employeeName);
          break;
        case "amount":
          cmp = a.totalAmount - b.totalAmount;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "deadline":
          cmp = new Date(a.deadline) - new Date(b.deadline);
          break;
        default:
          cmp = new Date(b.saleDate) - new Date(a.saleDate);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  // Add these functions
  const toggleSelectSale = (id) => {
    setSelectedSalesIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedSalesIds(new Set());
    } else {
      setSelectedSalesIds(new Set(filtered.map((s) => s.id)));
    }
    setSelectAll(!selectAll);
  };

  const clearSelection = () => {
    setSelectedSalesIds(new Set());
    setSelectAll(false);
  };

  // Calculate selected sales totals
  const selectedTotals = {
    totalAmount: filtered
      .filter((s) => selectedSalesIds.has(s.id))
      .reduce((sum, s) => sum + s.totalAmount, 0),
    totalUpfront: filtered
      .filter((s) => selectedSalesIds.has(s.id))
      .reduce((sum, s) => sum + s.upfrontPayment, 0),
    totalRemaining: filtered
      .filter((s) => selectedSalesIds.has(s.id))
      .reduce((sum, s) => sum + s.remainingBalance, 0),
    completedCount: filtered.filter(
      (s) => selectedSalesIds.has(s.id) && s.status === "completed",
    ).length,
    count: selectedSalesIds.size,
  };

  // Update selectAll when selection changes
  useEffect(() => {
    if (selectedSalesIds.size === filtered.length && filtered.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedSalesIds, filtered]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!(await confirmDialog("Delete this sale? This cannot be undone.")))
      return;
    try {
      await deleteSaleApi(id);
      fetchSales();
    } catch (err) {
      toast.error("Failed to delete: " + (err.message || "Unknown error"));
    }
  };

  // ── Inline edit ──────────────────────────────────────────────────────────
  const startEdit = (sale) => {
    setEditingId(sale.id);
    setEditData({
      status: sale.status,
      merchant: sale.merchant,
      category: sale.category,
      totalAmount: sale.totalAmount,
      upfrontPayment: sale.upfrontPayment,
      deadline: sale.deadline,
    });
  };

  const onEditChange = (field, value) => {
    setEditData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "totalAmount" || field === "upfrontPayment") {
        next.remaining =
          (parseFloat(next.totalAmount) || 0) -
          (parseFloat(next.upfrontPayment) || 0);
      }
      return next;
    });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      const catEntry = categories.find((c) => c.id === editData.category);
      await updateSale(id, {
        status: editData.status,
        merchant: editData.merchant,
        category_id: catEntry?.dbId || null,
        category_slug: editData.category,
        total_amount: parseFloat(editData.totalAmount) || 0,
        upfront_payment: parseFloat(editData.upfrontPayment) || 0,
        deadline: editData.deadline || null,
      });
      setEditingId(null);
      fetchSales();
    } catch (err) {
      toast.error("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // ── Add sale ─────────────────────────────────────────────────────────────
  const handleAddSale = async (formData) => {
    setSaving(true);
    try {
      const catEntry = categories.find((c) => c.id === formData.category);
      await createSale({
        employee_id: formData.employeeId || null,
        employee_name: formData.employeeName || null,
        employee_email: formData.employeeEmail || null,
        client_name: formData.clientName,
        client_email: formData.clientEmail || "",
        client_phone: formData.clientPhone || "",
        project_description: formData.projectDescription || "",
        category_id: catEntry?.dbId || null,
        category_slug: formData.category || null,
        total_amount: parseFloat(formData.totalAmount) || 0,
        upfront_payment: parseFloat(formData.upfrontPayment) || 0,
        merchant: formData.merchant || "",
        payment_method: formData.paymentMethod || "",
        account_name: formData.accountName || formData.clientName || "",
        sale_date: formData.saleDate || new Date().toISOString().slice(0, 10),
        deadline: formData.deadline || null,
        status: formData.status || "pending",
        notes: formData.notes || "",
      });
      fetchSales();
      setShowForm(false);
    } catch (err) {
      toast.error("Failed to add sale: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // ── Summary cards ────────────────────────────────────────────────────────
  const cards = [
    {
      title: "Total Paid Amount",
      value: formatCurrency(totalUpfront),
      Icon: Wallet,
      grad: "from-green-500 to-emerald-600",
      sub: `${filtered.length > 0 && totalAmount > 0 ? Math.round((totalUpfront / filtered.reduce((s, r) => s + r.totalAmount, 0)) * 100) : 0}% of total`,
    },
    {
      title: "Remaining Balance",
      value: formatCurrency(totalRemaining),
      Icon: Clock,
      grad: "from-orange-500 to-amber-600",
      sub: "From filtered sales",
    },
    {
      title: "Completed",
      value: completedCount,
      Icon: CheckCircle,
      grad: "from-purple-500 to-violet-600",
      sub: `${filtered.length > 0 ? Math.round((completedCount / filtered.length) * 100) : 0}% rate`,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Sales Management
            </h1>
            <p className="text-sm text-slate-500">
              Manage and track all team sales
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSales}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {/* <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition flex items-center gap-2 text-sm shadow-md"
          >
            <PlusCircle className="h-4 w-4" /> Add New Sale
          </button> */}
        </div>
      </div>

      {/* Summary Cards */}
      <div
        className={`grid gap-4 mb-6 ${
          selectedSalesIds.size > 0
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {/* Selected Sales Summary Card */}

        {/* Total Paid Amount Card - Using filtered totals */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {selectedSalesIds.size > 0
                  ? formatCurrency(selectedTotals.totalUpfront)
                  : formatCurrency(
                      filtered.reduce((sum, s) => sum + s.upfrontPayment, 0),
                    )}
              </div>
              <div className="text-green-100 text-xs">Paid Amount</div>
            </div>
          </div>
          {selectedSalesIds.size > 0 && (
            <div className="text-xs text-green-100">
              From {selectedSalesIds.size} selected sale(s)
            </div>
          )}
        </div>

        {/* Remaining Balance Card - Using filtered totals */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {selectedSalesIds.size > 0
                  ? formatCurrency(selectedTotals.totalRemaining)
                  : formatCurrency(
                      filtered.reduce((sum, s) => sum + s.remainingBalance, 0),
                    )}
              </div>
              <div className="text-orange-100 text-xs">Remaining</div>
            </div>
          </div>
        </div>

        {/* Completed Sales Card - Using filtered totals */}
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {selectedSalesIds.size > 0
                  ? selectedTotals.completedCount
                  : filtered.filter((s) => s.status === "completed").length}
              </div>
              <div className="text-purple-100 text-xs">Completed</div>
            </div>
          </div>
        </div>

        {/* Selected Sales Card - Using filtered totals */}
        {selectedSalesIds.size > 0 && (
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {selectedSalesIds.size}
                </div>
                <div className="text-blue-100 text-xs">Selected</div>
              </div>
            </div>
            <div className="text-xs text-blue-100">Click Clear to reset</div>
          </div>
        )}
      </div>

      {/* Selection Actions Bar */}
      {selectedSalesIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-800">
              {selectedSalesIds.size} sale(s) selected
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear Selection
            </button>
          </div>
          <div className="text-xs text-blue-600">
            Stats updated for selected items
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Date Range:
            </span>

            {/* Segmented Control */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-2">
              <button
                onClick={() => {
                  setDateRange("daily");
                  setSelectedDate(new Date());
                }}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  dateRange === "daily"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => {
                  setDateRange("monthly");
                  setSelectedDate(new Date());
                }}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  dateRange === "monthly"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  dateRange === "custom"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Custom
              </button>
            </div>
            {/* Date Navigation */}
            {dateRange === "daily" && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                <button
                  onClick={goToPreviousDay}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-500" />
                </button>
                <span className="text-sm font-medium text-gray-700 px-3 min-w-[160px] text-center">
                  {getDateDisplay()}
                </span>
                <button
                  onClick={goToNextDay}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            )}

            {dateRange === "monthly" && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-500" />
                </button>
                <span className="text-sm font-medium text-gray-700 px-3 min-w-[140px] text-center">
                  {getMonthYearDisplay()}
                </span>
                <button
                  onClick={goToNextMonth}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>

          {/* Add Sale Button */}
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition flex items-center gap-2 text-sm shadow-md"
          >
            <PlusCircle className="h-4 w-4" /> Add New Sale
          </button>
        </div>

        {/* Custom Date Picker */}
        {showDatePicker && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={applyCustomDateRange}
                disabled={!customStartDate || !customEndDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Apply
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search client, employee, project…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
              />
            </div>

            {/* Category filter */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
                className="pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Status</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative" ref={merchantDropdownRef}>
              <button
                type="button"
                onClick={() => setShowMerchantDropdown(!showMerchantDropdown)}
                className="flex items-center justify-between gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">
                    {filterMerchants.length === 0
                      ? "All Merchants"
                      : filterMerchants.length === 1
                        ? filterMerchants[0]
                        : `${filterMerchants.length} Merchants Selected`}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${showMerchantDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showMerchantDropdown && (
                <div className="absolute z-50 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={selectAllMerchants}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAllMerchants}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {MERCHANTS.map((merchant) => (
                      <label
                        key={merchant}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filterMerchants.includes(merchant)}
                          onChange={() => toggleMerchant(merchant)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {merchant}
                        </span>
                      </label>
                    ))}
                  </div>
                  {filterMerchants.length > 0 && (
                    <div className="p-2 border-t border-gray-100 bg-gray-50">
                      <div className="flex flex-wrap gap-1">
                        {filterMerchants.slice(0, 3).map((merchant) => (
                          <span
                            key={merchant}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
                          >
                            {merchant.length > 15
                              ? merchant.slice(0, 12) + "..."
                              : merchant}
                            <button
                              onClick={() => toggleMerchant(merchant)}
                              className="hover:text-blue-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        {filterMerchants.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{filterMerchants.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
          <button
            onClick={fetchSales}
            className="text-sm text-red-600 font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-gray-200 rounded"
                    title={selectAll ? "Deselect All" : "Select All"}
                  >
                    {selectAll ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </th>
                {[
                  { label: "Employee", field: "employee" },
                  { label: "Client", field: "client" },
                  { label: "Contact", field: null },
                  { label: "Category", field: null },
                  { label: "Total", field: "amount" },
                  { label: "Upfront", field: null },
                  { label: "Merchant", field: null },
                  { label: "Sale Date", field: "date" },
                  { label: "Actions", field: null },
                ].map((col) => (
                  <th key={col.label} className="px-4 py-3 text-left">
                    {col.field ? (
                      <button
                        onClick={() => handleSort(col.field)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-blue-600"
                      >
                        {col.label} <ArrowUpDown className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        {col.label}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((sale) => {
                const { bg: statusBg, Icon: StatusIcon } = getStatusCfg(
                  sale.status,
                );
                const { color: catColor, Icon: CatIcon } = getCatStyle(
                  sale.category,
                );
                const dlInfo = getDeadlineInfo(sale.deadline);
                const isEdit = editingId === sale.id;
                const isSelected = selectedSalesIds.has(sale.id);

                return (
                  <tr
                    key={sale.id}
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/30" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelectSale(sale.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </td>

                    {/* Employee */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-bold">
                            {sale.employeeName
                              ? sale.employeeName[0].toUpperCase()
                              : "?"}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[165px]">
                          {sale.employeeName || "\u2014"}
                        </span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {sale.clientName}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {sale.clientEmail && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[130px]">
                              {sale.clientEmail}
                            </span>
                          </div>
                        )}
                        {sale.clientPhone && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {sale.clientPhone}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <select
                          value={editData.category}
                          onChange={(e) =>
                            onEditChange("category", e.target.value)
                          }
                          className="px-2 py-1 border border-gray-300 rounded-lg text-xs"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${catColor}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          {categories.find((c) => c.id === sale.category)
                            ?.name ||
                            sale.category ||
                            "\u2014"}
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-left">
                      {isEdit ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editData.totalAmount}
                          onChange={(e) =>
                            onEditChange("totalAmount", e.target.value)
                          }
                          onWheel={(e) => e.target.blur()}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-right text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      )}
                    </td>

                    {/* Upfront */}
                    <td className="px-4 py-3 text-left">
                      {isEdit ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editData.upfrontPayment}
                          onChange={(e) =>
                            onEditChange("upfrontPayment", e.target.value)
                          }
                          onWheel={(e) => e.target.blur()}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-right text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      ) : (
                        <span className="text-xs font-medium text-green-600">
                          {formatCurrency(sale.upfrontPayment)}
                        </span>
                      )}
                    </td>

                    {/* Merchant */}
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <select
                          value={editData.merchant}
                          onChange={(e) =>
                            onEditChange("merchant", e.target.value)
                          }
                          className="px-2 py-1 border border-gray-300 rounded-lg text-xs"
                        >
                          <option value="">None</option>
                          {MERCHANTS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-700">
                          {sale.merchant || "\u2014"}
                        </span>
                      )}
                    </td>

                    {/* Sale Date */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {sale.date || formatDateForFrontend(sale.saleDate)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {isEdit ? (
                          <>
                            <button
                              onClick={() => saveEdit(sale.id)}
                              disabled={saving}
                              className="p-1.5 bg-green-100 hover:bg-green-200 rounded-lg transition"
                              title="Save"
                            >
                              {saving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-green-700" />
                              ) : (
                                <Save className="w-3.5 h-3.5 text-green-700" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(sale)}
                              className="p-1.5 bg-gray-100 hover:bg-blue-100 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5 text-gray-700" />
                            </button>
                            <button
                              onClick={() => handleDelete(sale.id)}
                              className="p-1.5 bg-gray-100 hover:bg-red-100 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-spin" />
            <p className="text-gray-500">Loading sales data…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No sales found
            </h3>
            <p className="text-gray-500 mb-5 text-sm">
              Adjust your filters or add a new sale.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Add First Sale
            </button>
          </div>
        )}
      </div>

      {/* Add Sale Modal */}
      {showForm && (
        <AddSaleModal
          categories={categories}
          employees={employees}
          saving={saving}
          onSubmit={handleAddSale}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

// ─── Add Sale Modal ────────────────────────────────────────────────────────
const AddSaleModal = ({ categories, employees, saving, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    employeeId: "",
    employeeName: "",
    employeeEmail: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    projectDescription: "",
    category: categories[0]?.id || "website-design",
    totalAmount: "",
    upfrontPayment: "",
    merchant: "Stripe",
    paymentMethod: "Credit Card",
    accountName: "",
    saleDate: new Date().toISOString().slice(0, 10),
    deadline: "",
    status: "pending",
    notes: "",
  });

  const [errs, setErrs] = useState({});
  // Add these ref and states
  const employeeDropdownRef = useRef(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(employeeSearchTerm.toLowerCase()),
  );

  const getSelectedEmployeeName = () => {
    const selected = employees.find(
      (emp) => String(emp.id) === String(form.employeeId),
    );
    return selected ? selected.name : "";
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(event.target)
      ) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrs((p) => ({ ...p, [field]: null }));
  };

  const pickEmployee = (id) => {
    const emp = employees.find((e) => String(e.id) === String(id));
    setForm((p) => ({
      ...p,
      employeeId: id,
      employeeName: emp
        ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
        : "",
      employeeEmail: emp?.email || "",
    }));
    setErrs((p) => ({ ...p, employeeId: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.employeeId) e.employeeId = "Select an employee";
    if (!form.clientName.trim()) e.clientName = "Client name is required";
    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0)
      e.totalAmount = "Enter a valid amount";
    if (parseFloat(form.upfrontPayment) > parseFloat(form.totalAmount))
      e.upfrontPayment = "Cannot exceed total";
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const remaining =
    (parseFloat(form.totalAmount) || 0) -
    (parseFloat(form.upfrontPayment) || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add New Sale</h3>
            <p className="text-sm text-gray-500">
              Record a new sale and assign it to an employee
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── Employee ──────────────────────────────────────────────── */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-600" /> Assign to Employee *
            </h4>
            <div className="relative" ref={employeeDropdownRef}>
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search employee by name or email..."
                value={employeeSearchTerm || getSelectedEmployeeName()}
                onChange={(e) => {
                  setEmployeeSearchTerm(e.target.value);
                  setShowEmployeeDropdown(true);
                  if (e.target.value === "") {
                    pickEmployee("");
                  }
                }}
                onFocus={() => setShowEmployeeDropdown(true)}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errs.employeeId ? "border-red-400" : "border-gray-300"}`}
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

              {/* Dropdown List */}
              {showEmployeeDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          pickEmployee(emp.id);
                          setEmployeeSearchTerm("");
                          setShowEmployeeDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-0 ${
                          String(form.employeeId) === String(emp.id)
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-xs text-gray-500">
                            {emp.email || emp.employee_id}
                          </div>
                        </div>
                        {String(form.employeeId) === String(emp.id) && (
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No employees found
                    </div>
                  )}
                </div>
              )}
            </div>
            {errs.employeeId && (
              <p className="text-red-500 text-xs mt-1">{errs.employeeId}</p>
            )}
          </div>

          {/* ── Client Info ───────────────────────────────────────────── */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-blue-600" /> Client Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => set("clientName", e.target.value)}
                  placeholder="Acme Corp"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errs.clientName ? "border-red-400" : "border-gray-300"}`}
                />
                {errs.clientName && (
                  <p className="text-red-500 text-xs mt-1">{errs.clientName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => set("clientEmail", e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Client Phone
                </label>
                <input
                  type="tel"
                  value={form.clientPhone}
                  onChange={(e) => set("clientPhone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Project Details ───────────────────────────────────────── */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-blue-600" /> Project Details
            </h4>
            <textarea
              rows={3}
              value={form.projectDescription}
              onChange={(e) => set("projectDescription", e.target.value)}
              placeholder="Describe the project or service…"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sale Date *
                </label>
                <input
                  type="date"
                  value={form.saleDate}
                  onChange={(e) => set("saleDate", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1).replace("-", " ")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Payment ───────────────────────────────────────────────── */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-blue-600" /> Payment Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Total Amount ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(e) => set("totalAmount", e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  placeholder="0.00"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errs.totalAmount ? "border-red-400" : "border-gray-300"}`}
                />
                {errs.totalAmount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errs.totalAmount}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Upfront Payment ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.upfrontPayment}
                  onChange={(e) => set("upfrontPayment", e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  placeholder="0.00"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errs.upfrontPayment ? "border-red-400" : "border-gray-300"}`}
                />
                {errs.upfrontPayment && (
                  <p className="text-red-500 text-xs mt-1">
                    {errs.upfrontPayment}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Remaining Balance
                </label>
                <input
                  type="text"
                  disabled
                  value={`$${Math.max(0, remaining).toFixed(2)}`}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-100 text-gray-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Merchant
                </label>
                <div className="relative">
                  <select
                    value={form.merchant}
                    onChange={(e) => set("merchant", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="">None</option>
                    {MERCHANTS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => set("accountName", e.target.value)}
                  placeholder="Account holder name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional notes…"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Summary + Submit */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6 text-center">
              <div>
                <p className="text-xs text-blue-600">Total</p>
                <p className="text-base font-bold text-blue-800">
                  ${(parseFloat(form.totalAmount) || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-green-600">Upfront</p>
                <p className="text-base font-bold text-green-700">
                  ${(parseFloat(form.upfrontPayment) || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-orange-600">Remaining</p>
                <p className="text-base font-bold text-orange-700">
                  ${Math.max(0, remaining).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancedSalesManagement;
