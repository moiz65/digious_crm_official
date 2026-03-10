import React, { useState, useEffect, useCallback } from "react";
import Sidebar from '../../components/Sidebar';
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  RefreshCw,
  Receipt,
  TrendingUp,
  TrendingDown,
  PieChart,
  Banknote,
  Calendar,
} from "lucide-react";

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

const CATEGORY_COLORS = {
  Salaries: "bg-emerald-100 text-emerald-700",
  "Office Supplies": "bg-blue-100 text-blue-700",
  Travel: "bg-purple-100 text-purple-700",
  Utilities: "bg-yellow-100 text-yellow-700",
  Marketing: "bg-pink-100 text-pink-700",
  Other: "bg-gray-100 text-gray-700",
};

const CATEGORY_OPTIONS = ["Salaries", "Office Supplies", "Travel", "Utilities", "Marketing", "Other"];

// ─── Main Component ──────────────────────────
const AdminExpense = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("expenses");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    note: "",
  });
  const [error, setError] = useState(null);

  // ─── Fetch expenses ─────────────────────
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call - Replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockExpenses = [
        {
          id: "#EXP-001",
          date: "13 Mar 2026",
          time: "11:05 PM",
          category: "Salaries",
          amount: 150000,
          note: "Monthly salary payment for March",
          paymentMethod: "Bank Transfer",
          vendor: "Staff Payments",
          status: "completed",
          createdBy: "Admin",
        },
        {
          id: "#EXP-002",
          date: "12 Mar 2026",
          time: "02:30 PM",
          category: "Office Supplies",
          amount: 5000,
          note: "Stationery and printer ink cartridges",
          paymentMethod: "Cash",
          vendor: "Office Depot",
          status: "completed",
          createdBy: "Admin",
        },
        {
          id: "#EXP-003",
          date: "11 Mar 2026",
          time: "09:15 AM",
          category: "Travel",
          amount: 2500,
          note: "Client meeting transport fare",
          paymentMethod: "Cash",
          vendor: "Transport",
          status: "completed",
          createdBy: "Admin",
        },
        {
          id: "#EXP-004",
          date: "10 Mar 2026",
          time: "04:45 PM",
          category: "Utilities",
          amount: 12000,
          note: "Monthly electricity bill",
          paymentMethod: "Bank Transfer",
          vendor: "IESCO",
          status: "pending",
          createdBy: "Admin",
        },
        {
          id: "#EXP-005",
          date: "09 Mar 2026",
          time: "11:30 AM",
          category: "Marketing",
          amount: 25000,
          note: "Social media advertising campaign",
          paymentMethod: "Credit Card",
          vendor: "Meta Ads",
          status: "completed",
          createdBy: "Admin",
        },
        {
          id: "#EXP-006",
          date: "08 Mar 2026",
          time: "03:20 PM",
          category: "Other",
          amount: 3500,
          note: "Team lunch meeting",
          paymentMethod: "Cash",
          vendor: "Local Restaurant",
          status: "completed",
          createdBy: "Admin",
        },
      ];
      setExpenses(mockExpenses);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      setError(err.message || "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // ─── Handle Add Expense ─────────────────────
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (formData.category && formData.amount) {
      const newExpense = {
        id: `#EXP-${String(expenses.length + 1).padStart(3, "0")}`,
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        category: formData.category,
        amount: parseFloat(formData.amount),
        note: formData.note || "No note provided",
        paymentMethod: "Cash",
        vendor: "Direct Expense",
        status: "completed",
        createdBy: "Admin",
      };
      setExpenses([newExpense, ...expenses]);
      setFormData({ category: "", amount: "", note: "" });
      setShowModal(false);
      setError(null);
    }
  };

  // ─── Handle Delete Expense ─────────────────
  const handleDeleteExpense = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setExpenses(expenses.filter((expense) => expense.id !== id));
    }
  };

  // ─── Handle View Expense ───────────────────
  const handleViewExpense = (expense) => {
    setSelectedExpense(expense);
    setShowViewModal(true);
  };

  // ─── Handle Edit Expense ───────────────────
  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      note: expense.note,
    });
    setShowModal(true);
  };

  // ─── Stats ─────────────────────────────────
  const stats = {
    totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    totalCount: expenses.length,
    averageExpense: expenses.length > 0 
      ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length 
      : 0,
    categoryBreakdown: CATEGORY_OPTIONS.reduce((acc, cat) => {
      acc[cat] = expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0);
      return acc;
    }, {}),
    thisMonth: expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    }).reduce((sum, exp) => sum + exp.amount, 0),
    lastMonth: expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const now = new Date();
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
    }).reduce((sum, exp) => sum + exp.amount, 0),
    pendingExpenses: expenses.filter(exp => exp.status === "pending").length,
    completedExpenses: expenses.filter(exp => exp.status === "completed").length,
  };

  const monthlyChange = stats.lastMonth > 0 
    ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1)
    : stats.thisMonth > 0 ? 100 : 0;

  const topCategory = Object.entries(stats.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)[0] || ["None", 0];

  // ─── Filter ───────────────────────────────
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      !searchQuery ||
      expense.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.vendor && expense.vendor.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || expense.category === selectedCategory;
    
    const matchesDateRange = 
      (!dateRange.from || new Date(expense.date) >= new Date(dateRange.from)) &&
      (!dateRange.to || new Date(expense.date) <= new Date(dateRange.to));
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      {/* Main Content */}
      <div className={`
        flex-1 flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
      `}>
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#349dff] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-[#349dff] to-[#1e87e6] bg-clip-text text-transparent">
                Digious CRM
              </h1>
            </div>

            <div className="w-8 h-8 bg-gradient-to-r from-[#349dff] to-[#1e87e6] rounded-full flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
          <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Expense Management
                  </h1>
                  <p className="text-slate-600 font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Total Expenses: {formatCurrency(stats.totalExpenses)} &bull; {filteredExpenses.length} records
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchExpenses}
                    className="flex items-center gap-2 px-4 py-2.5 border rounded-xl font-semibold transition-all duration-300 bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </button>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3">
                <X className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
              </div>
            )}

            {/* Stats Grid - Matching Payroll Style */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
  {/* Total Expenses Card */}
  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <Banknote className="h-6 w-6" />
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
        <div className="text-blue-100 text-xs font-medium">Total Expenses</div>
      </div>
    </div>
    <div className="flex items-center gap-1 text-blue-100 text-xs">
      <span>{stats.totalCount} transactions</span>
    </div>
  </div>

  {/* Average Expense Card */}
  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <TrendingUp className="h-6 w-6" />
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{formatCurrency(stats.averageExpense)}</div>
        <div className="text-purple-100 text-xs font-medium">Average Expense</div>
      </div>
    </div>
    <div className="text-purple-100 text-xs">
      per transaction
    </div>
  </div>

  {/* This Month Card */}
  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <Calendar className="h-6 w-6" />
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</div>
        <div className="text-emerald-100 text-xs font-medium">This Month</div>
      </div>
    </div>
    <div className="flex items-center gap-1 text-emerald-100 text-xs">
      <div className={`flex items-center gap-1 ${monthlyChange >= 0 ? 'text-emerald-100' : 'text-rose-100'}`}>
        {monthlyChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(monthlyChange)}%
      </div>
      <span>vs last month</span>
    </div>
  </div>

  {/* Top Category Card */}
  {/* <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <PieChart className="h-6 w-6" />
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">{formatCurrency(topCategory[1])}</div>
        <div className="text-amber-100 text-xs font-medium">{topCategory[0]}</div>
      </div>
    </div>
    <div className="text-amber-100 text-xs">
      {stats.totalExpenses > 0 ? ((topCategory[1] / stats.totalExpenses) * 100).toFixed(1) : 0}% of total
    </div>
  </div> */}
</div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Filter className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ID, category, note..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="date"
                    placeholder="From Date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    placeholder="To Date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Expenses Table */}
            <ExpenseTable
              data={filteredExpenses}
              loading={loading}
              onView={handleViewExpense}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              filteredTotal={filteredTotal}
            />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
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

      {/* Add/Edit Expense Modal */}
      {showModal && (
        <ExpenseModal
          expense={selectedExpense}
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            setShowModal(false);
            setSelectedExpense(null);
            setFormData({ category: "", amount: "", note: "" });
          }}
          onSubmit={handleAddExpense}
        />
      )}

      {/* View Expense Modal */}
      {showViewModal && selectedExpense && (
        <ViewExpenseModal
          expense={selectedExpense}
          onClose={() => {
            setShowViewModal(false);
            setSelectedExpense(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            handleEditExpense(selectedExpense);
          }}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Expense Table Component
// ──────────────────────────────────────────────
const ExpenseTable = ({ data, loading, onView, onEdit, onDelete, filteredTotal }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-200">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="text-slate-500 text-lg">Loading expenses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] table-auto">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Expense</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Details</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="h-10 w-10 text-slate-300" />
                    <p className="text-lg font-medium">No expense records</p>
                    <p className="text-sm">Click "Add Expense" to create new records.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition">
                  {/* Expense ID + Date */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-blue-600">
                        {expense.id}
                      </span>
                      <span className="text-xs text-slate-400">
                        {expense.date} • {expense.time}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[expense.category] || "bg-gray-100 text-gray-700"}`}>
                      {expense.category}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4">
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(expense.amount)}
                    </span>
                  </td>

                  {/* Vendor + Payment + Note */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="text-slate-700 font-medium">
                        {expense.vendor || "No Vendor"}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {expense.paymentMethod || "Cash"}
                      </span>
                      {expense.note && (
                        <span className="text-slate-500 text-xs line-clamp-1">
                          {expense.note}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onView(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View"
                      >
                        <Eye size={16}/>
                      </button>
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit size={16}/>
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Total Amount Section at Bottom */}
      {data.length > 0 && (
        <div className="border-t border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600">Total Filtered Amount</h3>
                <p className="text-xs text-slate-500">{data.length} transactions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(filteredTotal)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Add/Edit Expense Modal
// ──────────────────────────────────────────────
const ExpenseModal = ({ expense, formData, setFormData, onClose, onSubmit }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus size={24} />
              {expense ? "Edit Expense" : "Add New Expense"}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            {expense ? "Update expense details" : "Fill in the details to record a new expense"}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Category <span className="text-blue-600">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a category</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Amount <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">PKR</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-16 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Note</label>
              <textarea
                placeholder="Add a note (optional)"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="3"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-gray-700 font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
            >
              {expense ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// View Expense Modal
// ──────────────────────────────────────────────
const ViewExpenseModal = ({ expense, onClose, onEdit }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Expense Details</h2>
                <p className="text-blue-100 text-sm">{expense.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-xs text-slate-500">Date & Time</p>
              <p className="font-semibold text-slate-800">{expense.date} at {expense.time}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Category</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[expense.category] || "bg-gray-100 text-gray-700"}`}>
                  {expense.category}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Amount</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(expense.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Payment Method</p>
              <p className="font-semibold text-slate-800">{expense.paymentMethod || "Cash"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Vendor</p>
              <p className="font-semibold text-slate-800">{expense.vendor || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Created By</p>
              <p className="font-semibold text-slate-800">{expense.createdBy || "Admin"}</p>
            </div>
          </div>

          {/* Note */}
          {expense.note && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">Note</p>
              <p className="text-sm text-slate-700">{expense.note}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onEdit();
                onClose();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit size={16} />
              Edit Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExpense;