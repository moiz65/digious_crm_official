import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { confirmDialog } from "../../utils/confirm";
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  LayoutList,
  Check,
} from "lucide-react";

import ProtectedModule from "../../components/ProtectedModule";
import { usePasscode } from "../../context/PasscodeContext";
import PaymentTypes from "./PaymentTypes";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/${process.env.REACT_APP_API_VERSION || "v1"}`
  : "http://100.114.9.93:5000/api/v1";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  })
    .format(amount || 0)
    .replace("PKR", "Rs.");

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(+h, +m);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const fmtExpenseId = (id) => `#EXP-${String(id).padStart(3, "0")}`;
const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("authToken") || "";

const apiFetch = async (url, opts = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const r = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      signal: controller.signal,
      ...opts,
    });
    clearTimeout(timeoutId);
    const text = await r.text();
    if (!text.trim())
      return { success: false, message: `Empty response (${r.status})` };
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: `Server error (${r.status})` };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError")
      return {
        success: false,
        message: "Request timed out - please try again",
      };
    throw err;
  }
};

const COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];
const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminExpense = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("expenses");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // ── Tab ──
  const [activeTab, setActiveTab] = useState("expenses"); // "expenses" | "categories"

  // ── Expenses state ──
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().getMonth(),
  );
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear(),
  );

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    category_id: "",
    amount: "",
    payment_type: "Bank Account", // ✅ Added
    note: "",
    expense_date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  // ── Monthly summary state ──
  const [monthlySummary, setMonthlySummary] = useState([]);

  // Add state for individual value visibility (split into amount and count)
  const [showExpenseAmount, setShowExpenseAmount] = useState({
    box1Amount: false,
    box1Records: false,
    box2Amount: false,
    box2Records: false,
  });

  const toggleExpenseAmount = (key) => {
    setShowExpenseAmount((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Category state ──
  const [showCatModal, setShowCatModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [catForm, setCatForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState(null);
  const [catSuccess, setCatSuccess] = useState(null);
  const [catSearch, setCatSearch] = useState("");
  // Add payment_type filter to the filters section
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("All");
  const [paymentTypes, setPaymentTypes] = useState([]);


  // ─── Fetch categories (all, including inactive) ──────────────────────────
  const fetchCategories = useCallback(async () => {
    const data = await apiFetch(`${API_BASE}/expenses/categories`);
    if (data.success) setCategories(data.data || []);
  }, []);

  // Fetch payment types from backend
  const fetchPaymentTypes = useCallback(async () => {
    try {
      const data = await apiFetch(`${API_BASE}/types/payment-types?include_inactive=true`);
      if (data.success) {
        setPaymentTypes(data.data);
      }
    } catch (err) {
      console.error('Error fetching payment types:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchCategories(), fetchPaymentTypes()]);
    };
    loadData();
  }, [fetchCategories, fetchPaymentTypes]);

  // ─── Fetch expenses ──────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append("from", dateRange.from);
      if (dateRange.to) params.append("to", dateRange.to);
      if (selectedCategory !== "All") {
        const cat = categories.find((c) => c.name === selectedCategory);
        if (cat) params.append("category_id", cat.id);
      }
      const data = await apiFetch(`${API_BASE}/expenses?${params}`);
      if (data.success) {
        setExpenses(data.data || []);
      } else {
        setError(data.message || "Failed to load expenses");
        setExpenses([]);
      }
    } catch (err) {
      setError(err.message || "Network error");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedCategory, categories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, fetchPaymentTypes]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // ─── Fetch monthly summary ─────────────────────────────────────────────
  const fetchMonthlySummary = useCallback(async () => {
    try {
      const data = await apiFetch(`${API_BASE}/expenses/summary/monthly`);
      if (data.success) setMonthlySummary(data.data || []);
    } catch (err) {
      /* silent */
    }
  }, []);
  useEffect(() => {
    fetchMonthlySummary();
  }, [fetchMonthlySummary]);

  // ─── Autocomplete suggestions ────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const q = searchQuery
      .toLowerCase()
      .replace(/^#?exp-?/i, "")
      .trim();
    const catSuggestions = categories
      .filter((c) => c.name.toLowerCase().includes(q))
      .map((c) => ({
        type: "category",
        label: c.name,
        value: c.name,
        color: c.color,
      }));
    const expSuggestions = expenses
      .filter((e) => {
        const rawId = String(e.id).padStart(3, "0");
        return (
          fmtExpenseId(e.id).toLowerCase().includes(q) ||
          rawId.includes(q) ||
          String(e.id).includes(q) ||
          (e.note && e.note.toLowerCase().includes(q))
        );
      })
      .slice(0, 4)
      .map((e) => ({
        type: "expense",
        label: e.note
          ? `${fmtExpenseId(e.id)} – ${e.note.slice(0, 30)}`
          : fmtExpenseId(e.id),
        value: String(e.id).padStart(3, "0"),
      }));
    setSuggestions([...catSuggestions, ...expSuggestions].slice(0, 8));
  }, [searchQuery, categories, expenses]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── EXPENSE CRUD ────────────────────────────────────────────────────────
  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.category_id || !expenseForm.amount) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        category_id: +expenseForm.category_id,
        amount: +expenseForm.amount,
        payment_type: expenseForm.payment_type || "Bank Account", // ✅ Default
        note: expenseForm.note || "",
        expense_date:
          expenseForm.expense_date || new Date().toISOString().slice(0, 10),
      };

      console.log("📤 Submitting expense:", body);

      const data = selectedExpense
        ? await apiFetch(`${API_BASE}/expenses/${selectedExpense.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        })
        : await apiFetch(`${API_BASE}/expenses`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      if (data.success) {
        await fetchExpenses();
        await fetchMonthlySummary();
        closeExpenseModal();
      } else setError(data.message || "Failed to save");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!(await confirmDialog("Delete this expense?"))) return;
    const data = await apiFetch(`${API_BASE}/expenses/${id}`, {
      method: "DELETE",
    });
    if (data.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      fetchMonthlySummary();
    } else setError(data.message || "Failed to delete");
  };

  const openEditExpense = (expense) => {
    console.log("✏️ Editing expense:", expense);
    console.log("Payment type from DB:", expense.payment_type);

    setSelectedExpense(expense);
    setExpenseForm({
      category_id: expense.category_id?.toString() || "",
      amount: expense.amount?.toString() || "",
      payment_type: expense.payment_type || "Bank Account", // ✅ Default if null/undefined
      note: expense.note || "",
      expense_date: expense.expense_date
        ? expense.expense_date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setSelectedExpense(null);
    setExpenseForm({
      category_id: "",
      amount: "",
      payment_type: "Bank Account", // ✅ Default
      note: "",
      expense_date: new Date().toISOString().slice(0, 10),
    });
  };

  // ─── CATEGORY CRUD ───────────────────────────────────────────────────────
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    setCatSaving(true);
    setCatError(null);
    try {
      const body = {
        name: catForm.name.trim(),
        description: catForm.description,
        color: selectedCat ? selectedCat.color : getRandomColor(),
      };
      const data = selectedCat
        ? await apiFetch(`${API_BASE}/expenses/categories/${selectedCat.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        })
        : await apiFetch(`${API_BASE}/expenses/categories`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      if (data.success) {
        await fetchCategories();
        closeCatModal();
      } else setCatError(data.message || "Failed to save category");
    } catch (err) {
      setCatError(err.message);
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const cat = categories.find((c) => c.id === id);
    if (
      !(await confirmDialog(
        `Permanently delete "${cat.name}"? This cannot be undone.`,
      ))
    )
      return;
    setCatError(null);
    setCatSuccess(null);
    const data = await apiFetch(`${API_BASE}/expenses/categories/${id}`, {
      method: "DELETE",
    });
    if (data.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setCatSuccess(`Category "${cat.name}" deleted permanently.`);
      setTimeout(() => setCatSuccess(null), 3000);
    } else {
      setCatError(data.message || "Failed to delete category");
    }
  };

  const handleToggleCategoryActive = async (cat) => {
    const data = await apiFetch(`${API_BASE}/expenses/categories/${cat.id}`, {
      method: "PUT",
      body: JSON.stringify({ is_active: cat.is_active ? 0 : 1 }),
    });
    if (data.success) fetchCategories();
  };

  const openEditCategory = (cat) => {
    setSelectedCat(cat);
    setCatForm({ name: cat.name, description: cat.description || "" });
    setShowCatModal(true);
  };
  const closeCatModal = () => {
    setShowCatModal(false);
    setSelectedCat(null);
    setCatForm({ name: "", description: "" });
    setCatError(null);
  };

  // ─── Stats ───────────────────────────────────────────────────────────────
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const thisMonthPfx = now.toISOString().slice(0, 7);
  const lastMonthD = new Date(now);
  lastMonthD.setMonth(lastMonthD.getMonth() - 1);
  const lastMonthPfx = lastMonthD.toISOString().slice(0, 7);

  const totalExpenses = expenses.reduce(
    (s, e) => s + parseFloat(e.amount || 0),
    0,
  );
  const thisMonthTotal = expenses
    .filter((e) => e.expense_date?.startsWith(thisMonthPfx))
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const lastMonthTotal = expenses
    .filter((e) => e.expense_date?.startsWith(lastMonthPfx))
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const todayTotal = expenses
    .filter((e) => e.expense_date === today)
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const yesterdayTotal = expenses
    .filter((e) => e.expense_date === yesterdayStr)
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const averageExpense =
    expenses.length > 0 ? totalExpenses / expenses.length : 0;
  const monthlyChange =
    lastMonthTotal > 0
      ? (((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1)
      : thisMonthTotal > 0
        ? 100
        : 0;
  const todayChange =
    yesterdayTotal > 0
      ? (((todayTotal - yesterdayTotal) / yesterdayTotal) * 100).toFixed(1)
      : todayTotal > 0
        ? 100
        : 0;

  // ─── Whether a custom date range is active ──────────────────────────────
  const isRangeSet = !!(dateRange.from || dateRange.to);

  // ─── Month/year navigator ─────────────────────────────────────────────
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const MONTH_SHORT = [
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
  const selectedMonthPfx = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  const selectedMonthTotal = expenses
    .filter((e) => e.expense_date?.startsWith(selectedMonthPfx))
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const prevMonthD = new Date(selectedYear, selectedMonth - 1, 1);
  const prevMonthPfx = `${prevMonthD.getFullYear()}-${String(prevMonthD.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthTotal = expenses
    .filter((e) => e.expense_date?.startsWith(prevMonthPfx))
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const selMonthChange =
    prevMonthTotal > 0
      ? (
        ((selectedMonthTotal - prevMonthTotal) / prevMonthTotal) *
        100
      ).toFixed(1)
      : selectedMonthTotal > 0
        ? 100
        : 0;

  const yearOptions = Array.from(
    { length: 6 },
    (_, i) => now.getFullYear() - 2 + i,
  );

  const goPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else setSelectedMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else setSelectedMonth((m) => m + 1);
  };

  // ─── Client-side filter ──────────────────────────────────────────────────
  // Payment Type Filter - ensure it works with null values
  const filteredExpenses = expenses.filter((expense) => {
    const q = searchQuery
      .toLowerCase()
      .replace(/^#?exp-?/i, "")
      .trim();
    const rawId = String(expense.id).padStart(3, "0");
    const matchSearch =
      !q ||
      fmtExpenseId(expense.id).toLowerCase().includes(q) ||
      rawId.includes(q) ||
      String(expense.id).includes(q) ||
      expense.category_name?.toLowerCase().includes(q) ||
      expense.note?.toLowerCase().includes(q);
    const matchCat =
      selectedCategory === "All" || expense.category_name === selectedCategory;
    // ✅ FIX: Handle null/undefined payment_type
    const expensePaymentType = expense.payment_type || "Bank Account";
    const matchPaymentType =
      paymentTypeFilter === "All" || expensePaymentType === paymentTypeFilter;
    const matchDate =
      q || isRangeSet
        ? true
        : expense.expense_date?.startsWith(selectedMonthPfx);
    return matchSearch && matchCat && matchPaymentType && matchDate;
  });

  const filteredTotal = filteredExpenses.reduce(
    (s, e) => s + parseFloat(e.amount || 0),
    0,
  );
  const filteredCats = categories.filter(
    (c) =>
      !catSearch ||
      c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(catSearch.toLowerCase()),
  );

  // Add payment types constant at the top of the file
  const PAYMENT_TYPES = [
    { value: 'Bank Account', label: 'Bank Account' },
    { value: 'PayPal', label: 'PayPal' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Credit Card', label: 'Credit Card' },
  ];

  // Update filteredExpenses to include payment_type filter
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ProtectedModule
          moduleName="expense"
          title="Expense Management"
          description="Sensitive expense information. Access requires security verification."
        >
          {/* Mobile Header */}
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
              <h1 className="text-lg font-bold text-blue-600">Digious CRM</h1>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                A
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            <div className="p-8 max-w-[1600px] mx-auto">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                    Expense Management
                  </h1>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    {formatCurrency(totalExpenses)} total &bull;{" "}
                    {filteredExpenses.length} records &bull;{" "}
                    {categories.filter((c) => c.is_active).length} active
                    categories
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {activeTab !== "payment-types" && (
                    <>
                      <button
                        onClick={fetchExpenses}
                        className="flex items-center gap-2 px-4 py-2.5 border rounded-xl font-semibold bg-white border-blue-200 text-blue-600 hover:bg-blue-50 transition"
                      >
                        <RefreshCw className="h-4 w-4" /> Refresh
                      </button>
                      {activeTab === "expenses" ? (
                        <button
                          onClick={() => {
                            setSelectedExpense(null);
                            setExpenseForm({
                              category_id: "",
                              amount: "",
                              payment_type: "Bank Account",
                              note: "",
                              expense_date: new Date().toISOString().slice(0, 10),
                            });
                            setShowExpenseModal(true);
                          }}
                          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition hover:scale-105"
                        >
                          <Plus className="h-4 w-4" /> Add Expense
                        </button>
                      ) : activeTab === "categories" ? (
                        <button
                          onClick={() => {
                            setSelectedCat(null);
                            setCatForm({
                              name: "",
                              description: "",
                              color: "#3B82F6",
                            });
                            setShowCatModal(true);
                          }}
                          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition hover:scale-105"
                        >
                          <Plus className="h-4 w-4" /> Add Category
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-white rounded-2xl p-1 shadow border border-slate-200 mb-6 w-fit">
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === "expenses" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <LayoutList className="h-4 w-4" /> Expenses
                </button>
                <button
                  onClick={() => setActiveTab("categories")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === "categories" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <Tag className="h-4 w-4" /> Categories
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "categories" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}
                  >
                    {categories.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("payment-types")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === "payment-types" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <DollarSign className="h-4 w-4" />Payment Types
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "payment-types" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>
                    {paymentTypes.length}
                  </span>
                </button>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3">
                  <X className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                  <button onClick={() => setError(null)} className="ml-auto">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* ══════════════ EXPENSES TAB ══════════════ */}
              {activeTab === "expenses" && (
                <>
                  {/* Summary Boxes – always 2 at 50/50 width */}
                  <div className="mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Box 1 */}
                      <div
                        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                        onClick={() => {
                          if (isRangeSet) setDateRange({ from: "", to: "" });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-blue-100 mb-1">
                            {isRangeSet
                              ? "Selected Range Total"
                              : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpenseAmount("box1Amount");
                            }}
                            className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                            title={
                              showExpenseAmount.box1Amount
                                ? "Hide Amount"
                                : "Show Amount"
                            }
                          >
                            {showExpenseAmount.box1Amount ? (
                              <EyeOff className="h-3 w-3 text-white/80" />
                            ) : (
                              <Eye className="h-3 w-3 text-white/80" />
                            )}
                          </button>
                        </div>
                        <div className="text-2xl font-bold">
                          {showExpenseAmount.box1Amount
                            ? isRangeSet
                              ? formatCurrency(filteredTotal)
                              : formatCurrency(selectedMonthTotal)
                            : "****"}
                        </div>
                        <div className="flex items-center justify-between gap-1 text-blue-100 text-xs mt-2">
                          <div className="flex items-center gap-1">
                            {isRangeSet ? (
                              <>
                                <Receipt className="h-3 w-3" />
                                {showExpenseAmount.box1Records
                                  ? filteredExpenses.length
                                  : "**"}{" "}
                                records
                              </>
                            ) : (
                              <>
                                {selMonthChange >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {showExpenseAmount.box1Records
                                  ? Math.abs(selMonthChange)
                                  : "**"}
                                % vs prev month
                              </>
                            )}
                          </div>
                          {!isRangeSet && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpenseAmount("box1Records");
                              }}
                              className="p-0.5 rounded bg-white/20 hover:bg-white/30 transition-colors"
                            >
                              {showExpenseAmount.box1Records ? (
                                <EyeOff className="h-2.5 w-2.5" />
                              ) : (
                                <Eye className="h-2.5 w-2.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Box 2 */}
                      <div
                        className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                        onClick={() => {
                          if (!isRangeSet) {
                            const lmStart = `${prevMonthPfx}-01`;
                            const lmEnd = new Date(
                              prevMonthD.getFullYear(),
                              prevMonthD.getMonth() + 1,
                              0,
                            )
                              .toISOString()
                              .slice(0, 10);
                            setDateRange({ from: lmStart, to: lmEnd });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-emerald-100 mb-1">
                            {isRangeSet
                              ? "Records Found"
                              : `${MONTH_NAMES[prevMonthD.getMonth()]} ${prevMonthD.getFullYear()}`}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpenseAmount("box2Amount");
                            }}
                            className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                            title={
                              showExpenseAmount.box2Amount
                                ? "Hide Amount"
                                : "Show Amount"
                            }
                          >
                            {showExpenseAmount.box2Amount ? (
                              <EyeOff className="h-3 w-3 text-white/80" />
                            ) : (
                              <Eye className="h-3 w-3 text-white/80" />
                            )}
                          </button>
                        </div>
                        <div className="text-2xl font-bold">
                          {showExpenseAmount.box2Amount
                            ? isRangeSet
                              ? filteredExpenses.length
                              : formatCurrency(prevMonthTotal)
                            : "****"}
                        </div>
                        <div className="flex items-center justify-between gap-1 text-emerald-100 text-xs mt-2">
                          <div>
                            {isRangeSet
                              ? `${dateRange.from || "Start"} → ${dateRange.to || "End"}`
                              : `${showExpenseAmount.box2Records ? expenses.filter((e) => e.expense_date?.startsWith(prevMonthPfx)).length : "**"} records`}
                          </div>
                          {!isRangeSet && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpenseAmount("box2Records");
                              }}
                              className="p-0.5 rounded bg-white/20 hover:bg-white/30 transition-colors"
                            >
                              {showExpenseAmount.box2Records ? (
                                <EyeOff className="h-2.5 w-2.5" />
                              ) : (
                                <Eye className="h-2.5 w-2.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 mt-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h3 className="font-bold text-slate-800">
                          {isRangeSet
                            ? "Selected Range Summary"
                            : "Monthly Expense Summary"}
                        </h3>
                        {isRangeSet && (
                          <button
                            onClick={() => setDateRange({ from: "", to: "" })}
                            className="ml-2 flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <X className="h-3 w-3" /> Clear Range
                          </button>
                        )}
                      </div>
                      {/* Month / Year Navigator */}
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm w-fit">
                        <button
                          onClick={goPrevMonth}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                        >
                          ← Prev
                        </button>
                        <select
                          value={selectedMonth}
                          onChange={(e) =>
                            setSelectedMonth(Number(e.target.value))
                          }
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {MONTH_SHORT.map((m, i) => (
                            <option key={i} value={i}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(Number(e.target.value))
                          }
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {yearOptions.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={goNextMonth}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="bg-white rounded-2xl p-5 shadow border border-slate-200 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="h-5 w-5 text-blue-600" />
                      <h3 className="font-bold text-slate-800">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Search with autocomplete */}
                      <div className="relative" ref={searchRef}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search by ID, category, note…"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() =>
                            searchQuery && setShowSuggestions(true)
                          }
                          className="w-full pl-12 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-sm"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setSuggestions([]);
                              setShowSuggestions(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            {suggestions.map((s, i) => (
                              <button
                                key={i}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition"
                                onMouseDown={() => {
                                  setSearchQuery(s.value);
                                  setShowSuggestions(false);
                                }}
                              >
                                {s.type === "category" ? (
                                  <>
                                    <span
                                      className="w-3 h-3 rounded-full flex-shrink-0"
                                      style={{
                                        background: s.color || "#6366f1",
                                      }}
                                    />
                                    <span className="text-sm font-medium text-slate-700">
                                      {s.label}
                                    </span>
                                    <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                      Category
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Receipt className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-700 truncate">
                                      {s.label}
                                    </span>
                                    <span className="ml-auto text-xs text-slate-400 bg-blue-50 px-2 py-0.5 rounded-full">
                                      Expense
                                    </span>
                                  </>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-sm"
                      >
                        <option value="All">All Categories</option>
                        {categories
                          .filter((c) => c.is_active)
                          .map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, from: e.target.value })
                        }
                        className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) =>
                            setDateRange({ ...dateRange, to: e.target.value })
                          }
                          className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        />
                        {isRangeSet && (
                          <button
                            onClick={() => setDateRange({ from: "", to: "" })}
                            className="flex-shrink-0 px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition text-sm font-medium"
                            title="Clear date range"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Payment Type Filter - Clean dropdown */}
                      <div>
                        <select
                          value={paymentTypeFilter}
                          onChange={(e) => {
                            console.log("🔍 Filtering by payment type:", e.target.value);
                            setPaymentTypeFilter(e.target.value);
                          }}
                          className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-sm outline-none cursor-pointer"
                        >
                          <option value="All">All Payment Types</option>
                          {PAYMENT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Expense Table */}
                  <ExpenseTable
                    data={filteredExpenses}
                    loading={loading}
                    filteredTotal={filteredTotal}
                    onView={(e) => {
                      setSelectedExpense(e);
                      setShowViewModal(true);
                    }}
                    onEdit={openEditExpense}
                    onDelete={handleDeleteExpense}
                  />
                </>
              )}

              {/* ══════════════ CATEGORIES TAB ══════════════ */}
              {activeTab === "categories" && (
                <>
                  {catError && (
                    <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3 text-sm">
                      <X className="h-5 w-5 flex-shrink-0" /> {catError}
                      <button
                        onClick={() => setCatError(null)}
                        className="ml-auto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {catSuccess && (
                    <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-3 text-sm">
                      <Check className="h-5 w-5 flex-shrink-0" /> {catSuccess}
                      <button
                        onClick={() => setCatSuccess(null)}
                        className="ml-auto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Search bar */}
                  <div className="bg-white rounded-2xl p-4 shadow border border-slate-200 mb-6">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search categories…"
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Category Table */}
                  <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-100 border-b border-slate-200">
                          <tr>
                            {[
                              "Category",
                              "Description",
                              "Status",
                              "Actions",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCats.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="py-12 text-center">
                                <Tag className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 font-medium">
                                  No categories found
                                </p>
                                <p className="text-sm text-slate-400">
                                  {catSearch
                                    ? "Try a different search."
                                    : `Click "Add Category" to create one.`}
                                </p>
                              </td>
                            </tr>
                          ) : (
                            filteredCats.map((cat) => (
                              <tr
                                key={cat.id}
                                className={`hover:bg-slate-50 transition ${!cat.is_active ? "opacity-50" : ""}`}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0"
                                      style={{
                                        background: cat.color || "#6366f1",
                                      }}
                                    >
                                      {cat.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-800 text-sm">
                                        {cat.name}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        ID #{cat.id}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                  {cat.description || (
                                    <span className="text-slate-400 italic">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cat.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                                  >
                                    {cat.is_active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleToggleCategoryActive(cat)
                                      }
                                      title={
                                        cat.is_active
                                          ? "Deactivate"
                                          : "Activate"
                                      }
                                      className={`p-1.5 rounded transition text-sm ${cat.is_active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                                    >
                                      {cat.is_active ? (
                                        <XCircle size={16} />
                                      ) : (
                                        <CheckCircle size={16} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => openEditCategory(cat)}
                                      title="Edit"
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteCategory(cat.id)
                                      }
                                      title="Delete"
                                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {filteredCats.length > 0 && (
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600 flex gap-6">
                        <span>
                          <strong className="text-slate-800">
                            {categories.filter((c) => c.is_active).length}
                          </strong>{" "}
                          active
                        </span>
                        <span>
                          <strong className="text-slate-800">
                            {categories.filter((c) => !c.is_active).length}
                          </strong>{" "}
                          inactive
                        </span>
                        <span>
                          <strong className="text-slate-800">
                            {categories.length}
                          </strong>{" "}
                          total
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ══════════════ PAYMENT TYPE TAB ══════════════ */}
              {activeTab === "payment-types" && (
                <PaymentTypes
                  paymentTypes={paymentTypes}
                  setPaymentTypes={setPaymentTypes}
                  fetchPaymentTypes={fetchPaymentTypes}
                />
              )}
            </div>
          </main>
        </ProtectedModule>
      </div>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-white">
            <Sidebar
              isCollapsed={false}
              setIsCollapsed={setIsMobileMenuOpen}
              activeItem={activeItem}
              setActiveItem={setActiveItem}
            />
          </div>
        </div>
      )}

      {/* Expense Add/Edit Modal */}
      {showExpenseModal && (
        <ExpenseModal
          expense={selectedExpense}
          formData={expenseForm}
          setFormData={setExpenseForm}
          categories={categories}
          paymentTypes={paymentTypes}
          saving={saving}
          error={error}
          onClose={closeExpenseModal}
          onSubmit={handleSubmitExpense}
        />
      )}

      {/* Expense View Modal */}
      {showViewModal && selectedExpense && (
        <ViewExpenseModal
          expense={selectedExpense}
          onClose={() => {
            setShowViewModal(false);
            setSelectedExpense(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            openEditExpense(selectedExpense);
          }}
        />
      )}

      {/* Category Add/Edit Modal */}
      {showCatModal && (
        <CategoryModal
          category={selectedCat}
          formData={catForm}
          setFormData={setCatForm}
          saving={catSaving}
          error={catError}
          onClose={closeCatModal}
          onSubmit={handleSubmitCategory}
        />
      )}
    </div>
  );
};

// ─── Expense Table ────────────────────────────────────────────────────────────
const ExpenseTable = ({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  filteredTotal,
}) => {
  if (loading)
    return (
      <div className="bg-white rounded-2xl p-12 shadow border border-slate-200 flex items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="text-slate-500 text-lg">Loading expenses…</span>
      </div>
    );
  return (
    <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-slate-100">
            <tr>
              {["Expense", "Category", "Amount", "Payment Type", "Note", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center">
                  <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">
                    No expense records
                  </p>
                  <p className="text-sm text-slate-400">
                    Click "Add Expense" to get started.
                  </p>
                </td>
              </tr>
            ) : (
              data.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-blue-600 text-sm">
                      {fmtExpenseId(expense.id)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDate(expense.expense_date)}
                      {expense.expense_time
                        ? ` • ${formatTime(expense.expense_time)}`
                        : ""}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={
                        expense.category_color
                          ? {
                            background: expense.category_color + "22",
                            color: expense.category_color,
                          }
                          : { background: "#e5e7eb", color: "#374151" }
                      }
                    >
                      {expense.category_name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold text-blue-600 text-base">
                    {formatCurrency(expense.amount)}
                  </td>
                  {/* ✅ Payment Type Column */}
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-slate-700">
                      {expense.payment_type || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <span className="text-sm text-slate-600 line-clamp-2">
                      {expense.note || (
                        <i className="text-slate-400">No note</i>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onView(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 size={15} />
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
        <div className="border-t border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">PKR</div>
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Total Filtered Amount
              </p>
              <p className="text-xs text-slate-400">
                {data.length} transactions
              </p>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(filteredTotal)}
          </p>
        </div>
      )}
    </div>
  );
};

const PAYMENT_TYPES = [
  { value: 'Bank Account', label: 'Bank Account' },
  { value: 'PayPal', label: 'PayPal' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Credit Card', label: 'Credit Card' },
];

// ─── Expense Add/Edit Modal ───────────────────────────────────────────────────
const ExpenseModal = ({
  expense,
  formData,
  setFormData,
  categories,
  saving,
  paymentTypes = [],
  error,
  onClose,
  onSubmit,
}) => {
  const [catSearch, setCatSearch] = React.useState("");
  const [showCatDropdown, setShowCatDropdown] = React.useState(false);
  const catInputRef = React.useRef(null);
  // const [paymentTypes, setPaymentTypes] = useState([]);

  const filteredCats = categories
    .filter(
      (c) =>
        c.is_active && c.name.toLowerCase().includes(catSearch.toLowerCase()),
    )
    .slice(0, 8);
  const selectedCatName = formData.category_id
    ? categories.find((c) => c.id === +formData.category_id)?.name
    : "";

  React.useEffect(() => {
    const handler = (e) => {
      if (catInputRef.current && !catInputRef.current.contains(e.target))
        setShowCatDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ✅ Debug: Check if paymentTypes are coming through
  console.log("💰 Payment Types in Modal:", paymentTypes);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {expense ? "Edit Expense" : "Add New Expense"}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {expense
                ? "Update expense details"
                : "Fill in the details to record"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
              {error}
            </div>
          )}

          {/* Category with Autocomplete */}
          <div ref={catInputRef}>
            <label className="block text-gray-700 font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search or select category…"
                value={catSearch || selectedCatName}
                onChange={(e) => {
                  setCatSearch(e.target.value);
                  setFormData({ ...formData, category_id: "" });
                  setShowCatDropdown(true);
                }}
                onFocus={() => setShowCatDropdown(true)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required={!formData.category_id}
              />
              {(catSearch || !formData.category_id) && (
                <button
                  type="button"
                  onClick={() => {
                    setCatSearch("");
                    setFormData({ ...formData, category_id: "" });
                    setShowCatDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {showCatDropdown && (catSearch || !formData.category_id) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                  {filteredCats.length === 0 ? (
                    <div className="px-4 py-3 text-slate-500 text-sm">
                      No categories found
                    </div>
                  ) : (
                    filteredCats.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition border-b border-slate-100 last:border-0"
                        onMouseDown={() => {
                          setFormData({
                            ...formData,
                            category_id: cat.id.toString(),
                          });
                          setCatSearch("");
                          setShowCatDropdown(false);
                        }}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: cat.color || "#3B82F6" }}
                        />
                        <span className="text-sm font-medium text-slate-700 flex-1">
                          {cat.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {cat.description ? cat.description.slice(0, 20) : ""}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500 font-medium text-sm">
                PKR
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full pl-16 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* ✅ Payment Type Dropdown - Clean Design */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Payment Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.payment_type || "Bank Account"}
                onChange={(e) => {
                  setFormData({ ...formData, payment_type: e.target.value });
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer outline-none"
                required
              >
                {paymentTypes && paymentTypes.length > 0 ? (
                  paymentTypes.filter(pt => pt.is_active !== false).map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Bank Account">🏦 Bank Account</option>
                    <option value="PayPal">💰 PayPal</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="Credit Card">💳 Credit Card</option>
                  </>
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {paymentTypes.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {paymentTypes.filter(pt => pt.is_active !== false).length} payment types available
              </p>
            )}
          </div>

          {/* Expense Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Expense Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.expense_date || ""}
              onChange={(e) =>
                setFormData({ ...formData, expense_date: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Note</label>
            <textarea
              placeholder="Add a note (optional)"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none outline-none"
              rows="3"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-300 text-gray-700 font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg disabled:opacity-60"
            >
              {saving ? "Saving…" : expense ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ─── Expense View Modal ───────────────────────────────────────────────────────
const ViewExpenseModal = ({ expense, onClose, onEdit }) => (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div
      className="bg-white rounded-2xl max-w-lg w-full shadow-2xl"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Expense Details</h2>
            <p className="text-blue-100 text-sm">{fmtExpenseId(expense.id)}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="text-xs text-slate-500">Date</p>
            <p className="font-semibold text-slate-800">
              {formatDate(expense.expense_date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Time</p>
            <p className="font-semibold text-slate-800">
              {formatTime(expense.expense_time) || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Category</p>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={
                expense.category_color
                  ? {
                    background: expense.category_color + "22",
                    color: expense.category_color,
                  }
                  : { background: "#e5e7eb", color: "#374151" }
              }
            >
              {expense.category_name || "—"}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500">Amount</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(expense.amount)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500 mb-1">Payment Type</p>
            <p className="font-semibold text-slate-800">
              {expense.payment_type || "Bank Account"}
            </p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500 mb-1">Note</p>
          <p className="text-sm text-slate-700">
            {expense.note || <i className="text-slate-400">No note provided</i>}
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Edit size={15} /> Edit Expense
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Category Add/Edit Modal ──────────────────────────────────────────────────
const CategoryModal = ({
  category,
  formData,
  setFormData,
  saving,
  error,
  onClose,
  onSubmit,
}) => (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div
      className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">
            {category ? "Edit Category" : "New Category"}
          </h2>
          <p className="text-purple-100 text-xs mt-1">
            {category ? "Update details" : "Create a new category"}
          </p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
          <X size={20} />
        </button>
      </div>
      <form onSubmit={onSubmit} className="p-5 space-y-4">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {error}
          </div>
        )}
        <div>
          <label className="block text-gray-700 font-medium text-sm mb-2">
            Name <span className="text-purple-600">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Marketing, Travel, Office…"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            required
            maxLength={50}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium text-sm mb-2">
            Description
          </label>
          <textarea
            placeholder="Brief description (optional)"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            rows="2"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 text-gray-700 font-semibold text-sm rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-60"
          >
            {saving ? "Saving…" : category ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default AdminExpense;
