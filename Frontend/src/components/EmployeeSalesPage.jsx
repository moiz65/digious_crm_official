import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown,
  Download,
  MoreVertical,
  Mail,
  Phone,
  User,
  DollarSign,
  CreditCard,
  Calendar,
  ArrowUpDown,
  Eye,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Edit,
  Save,
  X,
  Globe,
  Palette,
  Megaphone,
  Code,
  ShoppingCart,
  Camera,
  PenTool,
  Layout,
  LogOut,
  BarChart3,
  PieChart,
  TrendingUp as TrendingUpIcon,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  getMySales,
  getAllSales,
  createSale,
  updateSale,
  deleteSale,
  getSalesCategories,
} from '../services/salesService';

const EmployeeSalesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMerchant, setFilterMerchant] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [chartView, setChartView] = useState('monthly');
  const [dateRange, setDateRange] = useState('monthly'); // 'daily', 'monthly', 'custom'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // API state
  const [salesData, setSalesData] = useState([]);
  const [apiTotals, setApiTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const role = user?.role || 'employee';

  // Role configuration
  const roleInfo = {
    admin: {
      label: 'Administrator',
      color: 'text-purple-600'
    },
    manager: {
      label: 'Manager',
      color: 'text-blue-600'
    },
    employee: {
      label: 'Sales Employee',
      color: 'text-green-600'
    }
  };

  // Category options with icons (fallback if API categories fail)
  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Categories', icon: null },
    { id: 'website-design', name: 'Website Design', icon: Globe },
    { id: 'logo-design', name: 'Logo Design', icon: Palette },
    { id: 'branding', name: 'Branding', icon: PenTool },
    { id: 'marketing', name: 'Marketing', icon: Megaphone },
    { id: 'development', name: 'Development', icon: Code },
    { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart },
    { id: 'photography', name: 'Photography', icon: Camera },
    { id: 'graphic-design', name: 'Graphic Design', icon: Layout }
  ]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getSalesCategories();
        if (data && data.length > 0) {
          const iconMap = { Globe, Palette, PenTool, Megaphone, Code, ShoppingCart, Camera, Layout };
          const mapped = data.map(cat => ({
            id: cat.slug,
            dbId: cat.id,
            name: cat.name,
            icon: iconMap[cat.icon] || Globe,
            color: cat.color,
          }));
          setCategories([{ id: 'all', name: 'All Categories', icon: null }, ...mapped]);
        }
      } catch (err) {
        console.error('Failed to load sales categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // ── Fetch sales data from API ──────────────────────────
  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};

      // Build date filters
      if (dateRange === 'daily') {
        const d = selectedDate.toISOString().slice(0, 10);
        filters.from = d;
        filters.to = d;
      } else if (dateRange === 'monthly') {
        const y = selectedDate.getFullYear();
        const m = selectedDate.getMonth();
        filters.from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(y, m + 1, 0).getDate();
        filters.to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        filters.from = customStartDate;
        filters.to = customEndDate;
      }

      // Use role-appropriate endpoint
      const isAdmin = role === 'admin' || role === 'hr';
      const response = isAdmin ? await getAllSales(filters) : await getMySales(filters);

      // Map API fields to component fields
      const mapped = (response.data || []).map(s => ({
        id: s.id,
        name: s.client_name,
        email: s.client_email || '',
        phone: s.client_phone || '',
        about: s.project_description || '',
        category: s.category_slug || s.cat_slug || 'website-design',
        categoryId: s.category_id,
        totalSales: parseFloat(s.total_amount) || 0,
        upfrontPayment: parseFloat(s.upfront_payment) || 0,
        remainingPayment: parseFloat(s.remaining_balance) || 0,
        merchant: s.merchant || '',
        status: s.status || 'pending',
        date: s.sale_date ? s.sale_date.slice(0, 10) : '',
        deadline: s.deadline ? s.deadline.slice(0, 10) : '',
        notes: s.notes || '',
        employeeName: s.employee_name || '',
        accountName: s.account_name || '',
        paymentMethod: s.payment_method || '',
        categoryName: s.category_name || '',
        categoryIcon: s.category_icon || 'Globe',
        categoryColor: s.category_color || '#3B82F6',
      }));

      setSalesData(mapped);
      if (response.totals) setApiTotals(response.totals);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedDate, customStartDate, customEndDate, role]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Status options
  const statuses = ['completed', 'in-progress', 'pending', 'cancelled'];
  
  // Merchant options
  const merchants = ['PayPal', 'Stripe', 'CashApp', 'Venmo'];

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  };

  // Get category icon and color
  const getCategoryDetails = (categoryId) => {
    const categoryMap = {
      'website-design': {
        icon: Globe,
        color: 'text-blue-600 bg-blue-50',
        name: 'Website Design'
      },
      'logo-design': {
        icon: Palette,
        color: 'text-purple-600 bg-purple-50',
        name: 'Logo Design'
      },
      'branding': {
        icon: PenTool,
        color: 'text-indigo-600 bg-indigo-50',
        name: 'Branding'
      },
      'marketing': {
        icon: Megaphone,
        color: 'text-orange-600 bg-orange-50',
        name: 'Marketing'
      },
      'development': {
        icon: Code,
        color: 'text-green-600 bg-green-50',
        name: 'Development'
      },
      'ecommerce': {
        icon: ShoppingCart,
        color: 'text-pink-600 bg-pink-50',
        name: 'E-commerce'
      },
      'photography': {
        icon: Camera,
        color: 'text-yellow-600 bg-yellow-50',
        name: 'Photography'
      },
      'graphic-design': {
        icon: Layout,
        color: 'text-red-600 bg-red-50',
        name: 'Graphic Design'
      }
    };
    return categoryMap[categoryId] || {
      icon: AlertCircle,
      color: 'text-gray-600 bg-gray-50',
      name: categoryId
    };
  };

  // Get status color and icon
  const getStatusDetails = (status) => {
    const statusMap = {
      'completed': {
        color: 'text-green-600 bg-green-50',
        icon: CheckCircle,
        label: 'Completed'
      },
      'in-progress': {
        color: 'text-blue-600 bg-blue-50',
        icon: TrendingUp,
        label: 'In Progress'
      },
      'pending': {
        color: 'text-yellow-600 bg-yellow-50',
        icon: Clock,
        label: 'Pending'
      },
      'cancelled': {
        color: 'text-red-600 bg-red-50',
        icon: XCircle,
        label: 'Cancelled'
      }
    };
    return statusMap[status] || {
      color: 'text-gray-600 bg-gray-50',
      icon: AlertCircle,
      label: status
    };
  };

  // Get merchant color
  const getMerchantColor = (merchant) => {
    const colors = {
      'PayPal': 'text-blue-600 bg-blue-50',
      'Stripe': 'text-purple-600 bg-purple-50',
      'CashApp': 'text-green-600 bg-green-50',
      'Venmo': 'text-cyan-600 bg-cyan-50'
    };
    return colors[merchant] || 'text-gray-600 bg-gray-50';
  };

  // Get deadline status
  const getDeadlineStatus = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { color: 'text-red-600 bg-red-50', label: 'Overdue', days: Math.abs(diffDays) };
    } else if (diffDays <= 7) {
      return { color: 'text-orange-600 bg-orange-50', label: 'Due Soon', days: diffDays };
    } else {
      return { color: 'text-green-600 bg-green-50', label: 'On Track', days: diffDays };
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle edit button click
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditFormData({
      status: item.status,
      merchant: item.merchant,
      category: item.category,
      totalSales: item.totalSales,
      upfrontPayment: item.upfrontPayment,
      remainingPayment: item.remainingPayment,
      deadline: item.deadline
    });
  };

  // Handle save edit
  const handleSaveEdit = async (id) => {
    setSaving(true);
    try {
      // Find the category dbId from slug
      const catEntry = categories.find(c => c.id === editFormData.category);
      await updateSale(id, {
        status: editFormData.status,
        merchant: editFormData.merchant,
        category_id: catEntry?.dbId || null,
        category_slug: editFormData.category,
        total_amount: parseFloat(editFormData.totalSales) || 0,
        upfront_payment: parseFloat(editFormData.upfrontPayment) || 0,
        deadline: editFormData.deadline,
      });
      setEditingId(null);
      setEditFormData({});
      await fetchSales(); // Refresh from API
    } catch (err) {
      console.error('Failed to update sale:', err);
      alert('Failed to update sale: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  // Handle input change in edit mode
  const handleEditChange = (field, value) => {
    setEditFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Recalculate remaining payment if totalSales or upfrontPayment changes
      if (field === 'totalSales' || field === 'upfrontPayment') {
        const total = parseFloat(newData.totalSales) || 0;
        const upfront = parseFloat(newData.upfrontPayment) || 0;
        newData.remainingPayment = total - upfront;
      }
      
      return newData;
    });
  };

  // Handle view details
  const handleView = (item) => {
    const deadlineStatus = getDeadlineStatus(item.deadline);
    alert(`Viewing details for ${item.name}\n\n` +
          `Email: ${item.email}\n` +
          `Phone: ${item.phone}\n` +
          `Project: ${item.about}\n` +
          `Category: ${getCategoryDetails(item.category).name}\n` +
          `Total: $${item.totalSales}\n` +
          `Status: ${item.status}\n` +
          `Deadline: ${new Date(item.deadline).toLocaleDateString()}\n` +
          `Deadline Status: ${deadlineStatus.label} (${deadlineStatus.days} days)`);
  };

  // Filter by date range — now handled server-side, this is a pass-through
  const filterByDateRange = (data) => {
    return data;
  };

  // Filter and sort data
  const filteredData = filterByDateRange(salesData)
    .filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm) ||
        item.about.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMerchant = filterMerchant === 'all' || item.merchant === filterMerchant;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      
      return matchesSearch && matchesMerchant && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'totalSales') {
        comparison = a.totalSales - b.totalSales;
      } else if (sortField === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortField === 'deadline') {
        comparison = new Date(a.deadline) - new Date(b.deadline);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Pagination
  const RECORDS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredData.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + RECORDS_PER_PAGE);

  // Calculate totals
  const totals = filteredData.reduce((acc, item) => ({
    totalSales: acc.totalSales + item.totalSales,
    upfrontPayment: acc.upfrontPayment + item.upfrontPayment,
    remainingPayment: acc.remainingPayment + item.remainingPayment,
    completedSales: acc.completedSales + (item.status === 'completed' ? 1 : 0)
  }), { totalSales: 0, upfrontPayment: 0, remainingPayment: 0, completedSales: 0 });

  // Chart data preparation
  const getMonthlyChartData = () => {
    const monthlyData = {};
    const today = new Date();
    const filteredByDate = filterByDateRange(salesData);
    
    filteredByDate.forEach(item => {
      const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, total: 0, count: 0 };
      }
      monthlyData[month].total += item.totalSales;
      monthlyData[month].count += 1;
    });
    
    return Object.values(monthlyData);
  };

  const getDailyChartData = () => {
    const dailyData = {};
    const today = new Date();
    const last7Days = [];
    
    // Create last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last7Days.push(dateStr);
      dailyData[dateStr] = { date: dateStr, total: 0 };
    }
    
    // Fill with actual data
    const filteredByDate = filterByDateRange(salesData);
    filteredByDate.forEach(item => {
      const itemDate = new Date(item.date);
      const dateStr = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyData[dateStr]) {
        dailyData[dateStr].total += item.totalSales;
      }
    });
    
    return Object.values(dailyData);
  };

  const getCategoryDistribution = () => {
    const categoryData = {};
    const filteredByDate = filterByDateRange(salesData);
    
    filteredByDate.forEach(item => {
      const category = getCategoryDetails(item.category).name;
      if (!categoryData[category]) {
        categoryData[category] = { name: category, value: 0 };
      }
      categoryData[category].value += item.totalSales;
    });
    
    return Object.values(categoryData);
  };

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Date navigation functions
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    setDateRange('daily');
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    setDateRange('daily');
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
    setDateRange('monthly');
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
    setDateRange('monthly');
  };

  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setDateRange('custom');
      setShowDatePicker(false);
    }
  };

  // Custom CSS to hide number input arrows
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Hide number input arrows for all browsers */
      input[type=number]::-webkit-inner-spin-button, 
      input[type=number]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
      }
      input[type=number] {
        -moz-appearance: textfield;
        appearance: textfield;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add Sale Modal Component
  const AddSaleModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      about: '',
      category: 'website-design',
      totalSales: '',
      upfrontPayment: '',
      merchant: 'PayPal',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        // Resolve category DB id from slug
        const catEntry = categories.find(c => c.id === formData.category);
        await createSale({
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone,
          project_description: formData.about,
          category_id: catEntry?.dbId || null,
          category_slug: formData.category,
          total_amount: parseFloat(formData.totalSales) || 0,
          upfront_payment: parseFloat(formData.upfrontPayment) || 0,
          merchant: formData.merchant,
          status: formData.status,
          sale_date: formData.date,
          deadline: formData.deadline,
        });
        setShowAddSaleModal(false);
        await fetchSales(); // Refresh from API
      } catch (err) {
        console.error('Failed to create sale:', err);
        alert('Failed to create sale: ' + (err.message || 'Unknown error'));
      } finally {
        setSaving(false);
      }
    };

    if (!showAddSaleModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add New Sale</h2>
              <button 
                onClick={() => setShowAddSaleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Customer Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* Email */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {/* Phone */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              {/* About Project */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About the Project *
                </label>
                <textarea
                  required
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.about}
                  onChange={(e) => setFormData({...formData, about: e.target.value})}
                />
              </div>

              {/* Category */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Category *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.slice(1).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sale Date */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Date *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              {/* Project Deadline */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Deadline *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
              </div>

              {/* Total Sales - Without arrows */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Sales ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={formData.totalSales}
                  onChange={(e) => setFormData({...formData, totalSales: e.target.value})}
                  onWheel={(e) => e.target.blur()}
                />
              </div>

              {/* Paid Amount - Without arrows */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid Amount ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={formData.upfrontPayment}
                  onChange={(e) => setFormData({...formData, upfrontPayment: e.target.value})}
                  onWheel={(e) => e.target.blur()}
                />
              </div>

              {/* Remaining Payment (Auto-calculated) - Without arrows */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remaining Payment
                </label>
                <input
                  type="number"
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={formData.totalSales && formData.upfrontPayment ? 
                    (parseFloat(formData.totalSales) - parseFloat(formData.upfrontPayment)).toFixed(2) : '0.00'}
                />
              </div>

              {/* Merchant */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.merchant}
                  onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                >
                  {merchants.map(merchant => (
                    <option key={merchant} value={merchant}>{merchant}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddSaleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Add Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-gray-500 mt-1">Manage and track all customer sales</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right pr-4 border-r border-gray-200">
                <p className="text-sm font-semibold text-gray-900">{user?.name || user?.email || 'Muhammad Hamza'}</p>
                <p className={`text-xs font-medium ${roleInfo[role]?.color} mt-0.5`}>
                  {roleInfo[role]?.label}
                </p>
              </div>

              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {String(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sales */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-blue-800">Total Sales</h3>
                  <p className="text-xl font-bold text-blue-600">
                    ${totals.totalSales.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {dateRange === 'daily' ? "Today's revenue" : 
               dateRange === 'monthly' ? "This month's revenue" : 
               "Selected period revenue"}
            </p>
          </div>

          {/* Paid Amount */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-green-800">Paid Amount</h3>
                  <p className="text-xl font-bold text-green-600">
                    ${totals.upfrontPayment.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Received amount
            </p>
          </div>

          {/* Remaining Payment */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-orange-800">Remaining Payment</h3>
                  <p className="text-xl font-bold text-orange-600">
                    ${totals.remainingPayment.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Pending collection
            </p>
          </div>

          {/* Completed Sales */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-purple-800">Completed</h3>
                  <p className="text-xl font-bold text-purple-600">
                    {totals.completedSales}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Successful projects
            </p>
          </div>
        </div>

       

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>

              {/* Merchant Filter */}
              <div className="relative">
                <select
                  className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                  value={filterMerchant}
                  onChange={(e) => setFilterMerchant(e.target.value)}
                >
                  <option value="all">All Merchants</option>
                  {merchants.map(merchant => (
                    <option key={merchant} value={merchant}>{merchant}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Selector - Redesigned */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
              
              {/* Simple Segmented Control */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-2">
                <button
                  onClick={() => {
                    setDateRange('daily');
                    setSelectedDate(new Date());
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    dateRange === 'daily' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => {
                    setDateRange('monthly');
                    setSelectedDate(new Date());
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    dateRange === 'monthly' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    dateRange === 'custom' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Date Display - Clean and Simple */}
            {dateRange === 'daily' && (
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-1.5">
                <button
                  onClick={goToPreviousDay}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm font-medium text-gray-700 px-3 min-w-[200px] text-center">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <button
                  onClick={goToNextDay}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {dateRange === 'monthly' && (
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-1.5">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm font-medium text-gray-700 px-3 min-w-[140px] text-center">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={goToNextMonth}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {/* Add Sale Button - Moved here for better balance */}
            <button
              onClick={() => setShowAddSaleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ml-auto"
            >
              <Plus className="w-4 h-4" />
              Add Sale
            </button>
          </div>

          {/* Custom Date Picker - Dropdown style */}
          {showDatePicker && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={applyCustomDateRange}
                  disabled={!customStartDate || !customEndDate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button onClick={fetchSales} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Sales Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button 
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-blue-600"
                      onClick={() => handleSort('name')}
                    >
                      Customer
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-blue-600"
                      onClick={() => handleSort('category')}
                    >
                      Category
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button 
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-blue-600 ml-auto"
                      onClick={() => handleSort('totalSales')}
                    >
                      Total
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Upfront
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-blue-600"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-blue-600"
                      onClick={() => handleSort('deadline')}
                    >
                      Deadline
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Sale Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((item, index) => {
                  const StatusIcon = getStatusDetails(item.status).icon;
                  const CategoryIcon = getCategoryDetails(item.category).icon;
                  const deadlineStatus = getDeadlineStatus(item.deadline);
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {item.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {item.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600 max-w-[200px] truncate">{item.about}</p>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editFormData.category}
                            onChange={(e) => handleEditChange('category', e.target.value)}
                          >
                            {categories.slice(1).map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getCategoryDetails(item.category).color}`}>
                            <CategoryIcon className="w-3 h-3" />
                            {getCategoryDetails(item.category).name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={editFormData.totalSales}
                            onChange={(e) => handleEditChange('totalSales', e.target.value)}
                            step="0.01"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            ${item.totalSales.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={editFormData.upfrontPayment}
                            onChange={(e) => handleEditChange('upfrontPayment', e.target.value)}
                            step="0.01"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                          />
                        ) : (
                          <span className="text-xs font-medium text-green-600">
                            ${item.upfrontPayment.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-xs bg-gray-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={editFormData.remainingPayment?.toFixed(2) || '0.00'}
                            disabled
                          />
                        ) : (
                          <span className="text-xs font-medium text-orange-600">
                            ${item.remainingPayment.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editFormData.merchant}
                            onChange={(e) => handleEditChange('merchant', e.target.value)}
                          >
                            {merchants.map(merchant => (
                              <option key={merchant} value={merchant}>{merchant}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMerchantColor(item.merchant)}`}>
                            {item.merchant}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editFormData.status}
                            onChange={(e) => handleEditChange('status', e.target.value)}
                          >
                            {statuses.map(status => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusDetails(item.status).color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {getStatusDetails(item.status).label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="date"
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editFormData.deadline}
                            onChange={(e) => handleEditChange('deadline', e.target.value)}
                          />
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">
                              {new Date(item.deadline).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block w-fit ${deadlineStatus.color}`}>
                              <Flag className="w-3 h-3 inline mr-1" />
                              {deadlineStatus.label} {deadlineStatus.days && `(${deadlineStatus.days}d)`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleSaveEdit(item.id)}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Save"
                              >
                                <Save className="w-3.5 h-3.5 text-gray-700" />
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5 text-gray-700" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleView(item)}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-700" />
                              </button>
                              {/* <button 
                                onClick={() => handleEdit(item)}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5 text-gray-700" />
                              </button> */}
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

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-gray-600 font-medium">Loading sales data...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredData.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No sales data found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your search, filter, or date range</p>
              <button
                onClick={() => setShowAddSaleModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Sale
              </button>
            </div>
          )}

          {/* Pagination */}
          {filteredData.length > 0 && totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + RECORDS_PER_PAGE, filteredData.length)} of {filteredData.length} entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddSaleModal />
    </div>
  );
};

export default EmployeeSalesPage;