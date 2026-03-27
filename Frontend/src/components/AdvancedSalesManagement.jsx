import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  DollarSign, TrendingUp, Clock, CheckCircle,
  AlertCircle, Calendar, CreditCard,
  Plus, Filter, Search,
  RefreshCw, X, PlusCircle, Wallet, Users,
  Trash2, Edit, Save,
  Mail, Phone, User,
  Loader2, ChevronDown, ArrowUpDown, Flag,
  Globe, Palette, PenTool, Megaphone, Code, ShoppingCart, Camera, Layout,
  ShoppingBag, XCircle
} from 'lucide-react';
import {
  getAllSales,
  createSale,
  updateSale,
  deleteSale as deleteSaleApi,
  getSalesCategories,
} from '../services/salesService';

// ─── Icon map used by both main comp and modal ─────────────────────────────
const ICON_MAP = { Globe, Palette, PenTool, Megaphone, Code, ShoppingCart, Layout };

const DEFAULT_CATEGORIES = [
  { id: 'website-design',  name: 'Website Design',  icon: Globe        },
  { id: 'logo-design',     name: 'Logo Design',      icon: Palette      },
  { id: 'branding',        name: 'Branding',          icon: PenTool      },
  { id: 'marketing',       name: 'Marketing',         icon: Megaphone    },
  { id: 'development',     name: 'Development',       icon: Code         },
  { id: 'ecommerce',       name: 'E-commerce',        icon: ShoppingCart },
  { id: 'graphic-design',  name: 'Graphic Design',    icon: Layout       },
];

const ALL_STATUSES = ['pending', 'in-progress', 'completed', 'cancelled', 'refunded'];
const MERCHANTS    = ['Stripe','Ziffs PayPal',  'Digious PayPal', ' Innovative PayPal', 'Crypto'];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

const getStatusCfg = (status) => {
  const map = {
    completed:     { bg: 'bg-green-50 text-green-700',   Icon: CheckCircle  },
    'in-progress': { bg: 'bg-blue-50 text-blue-700',     Icon: TrendingUp   },
    pending:       { bg: 'bg-yellow-50 text-yellow-700', Icon: Clock        },
    cancelled:     { bg: 'bg-red-50 text-red-700',       Icon: XCircle      },
    refunded:      { bg: 'bg-purple-50 text-purple-700', Icon: AlertCircle  },
  };
  return map[status] || { bg: 'bg-gray-50 text-gray-700', Icon: Clock };
};

const CAT_STYLE = {
  'website-design': { color: 'text-blue-600 bg-blue-50',     Icon: Globe        },
  'logo-design':    { color: 'text-purple-600 bg-purple-50', Icon: Palette      },
  'branding':       { color: 'text-indigo-600 bg-indigo-50', Icon: PenTool      },
  'marketing':      { color: 'text-orange-600 bg-orange-50', Icon: Megaphone    },
  'development':    { color: 'text-green-600 bg-green-50',   Icon: Code         },
  'ecommerce':      { color: 'text-pink-600 bg-pink-50',     Icon: ShoppingCart },
  
  'graphic-design': { color: 'text-red-600 bg-red-50',       Icon: Layout       },
};

const getCatStyle = (slug) =>
  CAT_STYLE[slug] || { color: 'text-gray-600 bg-gray-50', Icon: Globe };

const getDeadlineInfo = (deadline) => {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (diff < 0)  return { label: `Overdue (${Math.abs(diff)}d)`, color: 'text-red-600 bg-red-50' };
  if (diff <= 7) return { label: `Due Soon (${diff}d)`,          color: 'text-orange-600 bg-orange-50' };
  return           { label: `On Track (${diff}d)`,               color: 'text-green-600 bg-green-50' };
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '\u2014';

// ─── Main Component ────────────────────────────────────────────────────────
const AdvancedSalesManagement = () => {
  const [sales,       setSales]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [categories,  setCategories]  = useState(DEFAULT_CATEGORIES);
  const [employees,   setEmployees]   = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [editData,    setEditData]    = useState({});
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [sortField,   setSortField]   = useState('date');
  const [sortDir,     setSortDir]     = useState('desc');
  const [page,        setPage]        = useState(1);
  const PER_PAGE = 15;

  // ── Load categories ──────────────────────────────────────────────────────
  useEffect(() => {
    getSalesCategories()
      .then(data => {
        if (data && data.length > 0) {
          setCategories(data.map(c => ({
            id:    c.slug,
            dbId:  c.id,
            name:  c.name,
            icon:  ICON_MAP[c.icon] || Globe,
            color: c.color,
          })));
        }
      })
      .catch(console.error);
  }, []);

  // ── Load employees (Sales dept only) ────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/v1/onboarding/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setEmployees(json.data.filter(e => e.department === 'Sales'));
        }
      })
      .catch(console.error);
  }, []);

  // ── Fetch sales ──────────────────────────────────────────────────────────
  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllSales();
      setSales((res.data || []).map(s => ({
        id:               s.id,
        employeeId:       s.employee_id,
        employeeName:     s.employee_name  || '',
        employeeEmail:    s.employee_email || '',
        clientName:       s.client_name    || '',
        clientEmail:      s.client_email   || '',
        clientPhone:      s.client_phone   || '',
        category:         s.category_slug  || '',
        categoryId:       s.category_id,
        totalAmount:      parseFloat(s.total_amount)    || 0,
        upfrontPayment:   parseFloat(s.upfront_payment) || 0,
        remainingBalance: parseFloat(s.remaining_balance) || 0,
        merchant:         s.merchant        || '',
        paymentMethod:    s.payment_method  || '',
        accountName:      s.account_name    || '',
        status:           s.status          || 'pending',
        saleDate:         s.sale_date  ? s.sale_date.slice(0, 10)  : '',
        deadline:         s.deadline   ? s.deadline.slice(0, 10)   : '',
        notes:            s.notes || '',
        projectDescription: s.project_description || '',
      })));
    } catch (err) {
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // ── Derived totals ───────────────────────────────────────────────────────
  const totalAmount    = sales.reduce((s, r) => s + r.totalAmount,    0);
  const totalUpfront   = sales.reduce((s, r) => s + r.upfrontPayment, 0);
  const totalRemaining = sales.reduce((s, r) => s + r.remainingBalance, 0);
  const completedCount = sales.filter(r => r.status === 'completed').length;

  // ── Filter + sort + paginate ─────────────────────────────────────────────
  const filtered = sales
    .filter(s => {
      if (filterStatus   !== 'all' && s.status   !== filterStatus)   return false;
      if (filterCategory !== 'all' && s.category !== filterCategory)  return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.clientName.toLowerCase().includes(q) &&
          !s.employeeName.toLowerCase().includes(q) &&
          !s.projectDescription.toLowerCase().includes(q) &&
          !s.merchant.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'client':   cmp = a.clientName.localeCompare(b.clientName);     break;
        case 'employee': cmp = a.employeeName.localeCompare(b.employeeName); break;
        case 'amount':   cmp = a.totalAmount - b.totalAmount;                break;
        case 'status':   cmp = a.status.localeCompare(b.status);             break;
        case 'deadline': cmp = new Date(a.deadline) - new Date(b.deadline);  break;
        default:         cmp = new Date(b.saleDate) - new Date(a.saleDate);  break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale? This cannot be undone.')) return;
    try {
      await deleteSaleApi(id);
      fetchSales();
    } catch (err) {
      toast.error('Failed to delete: ' + (err.message || 'Unknown error'));
    }
  };

  // ── Inline edit ──────────────────────────────────────────────────────────
  const startEdit = (sale) => {
    setEditingId(sale.id);
    setEditData({
      status:         sale.status,
      merchant:       sale.merchant,
      category:       sale.category,
      totalAmount:    sale.totalAmount,
      upfrontPayment: sale.upfrontPayment,
      deadline:       sale.deadline,
    });
  };

  const onEditChange = (field, value) => {
    setEditData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'totalAmount' || field === 'upfrontPayment') {
        next.remaining = (parseFloat(next.totalAmount) || 0) - (parseFloat(next.upfrontPayment) || 0);
      }
      return next;
    });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      const catEntry = categories.find(c => c.id === editData.category);
      await updateSale(id, {
        status:         editData.status,
        merchant:       editData.merchant,
        category_id:    catEntry?.dbId || null,
        category_slug:  editData.category,
        total_amount:   parseFloat(editData.totalAmount)    || 0,
        upfront_payment: parseFloat(editData.upfrontPayment) || 0,
        deadline:       editData.deadline || null,
      });
      setEditingId(null);
      fetchSales();
    } catch (err) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ── Add sale ─────────────────────────────────────────────────────────────
  const handleAddSale = async (formData) => {
    setSaving(true);
    try {
      const catEntry = categories.find(c => c.id === formData.category);
      await createSale({
        employee_id:         formData.employeeId   || null,
        employee_name:       formData.employeeName  || null,
        employee_email:      formData.employeeEmail || null,
        client_name:         formData.clientName,
        client_email:        formData.clientEmail   || '',
        client_phone:        formData.clientPhone   || '',
        project_description: formData.projectDescription || '',
        category_id:         catEntry?.dbId || null,
        category_slug:       formData.category || null,
        total_amount:        parseFloat(formData.totalAmount)    || 0,
        upfront_payment:     parseFloat(formData.upfrontPayment) || 0,
        merchant:            formData.merchant     || '',
        payment_method:      formData.paymentMethod || '',
        account_name:        formData.accountName  || formData.clientName || '',
        sale_date:           formData.saleDate || new Date().toISOString().slice(0, 10),
        deadline:            formData.deadline || null,
        status:              formData.status   || 'pending',
        notes:               formData.notes    || '',
      });
      fetchSales();
      setShowForm(false);
    } catch (err) {
      toast.error('Failed to add sale: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ── Summary cards ────────────────────────────────────────────────────────
  const cards = [
    { title: 'Total Sales',       value: formatCurrency(totalAmount),    Icon: DollarSign,  grad: 'from-blue-500 to-blue-600',     sub: `${sales.length} sale${sales.length !== 1 ? 's' : ''}` },
    { title: 'Upfront Collected', value: formatCurrency(totalUpfront),   Icon: Wallet,      grad: 'from-green-500 to-emerald-600', sub: `${totalAmount > 0 ? Math.round((totalUpfront / totalAmount) * 100) : 0}% collected` },
    { title: 'Remaining Balance', value: formatCurrency(totalRemaining), Icon: Clock,       grad: 'from-orange-500 to-amber-600',  sub: 'Pending collection' },
    { title: 'Completed',         value: completedCount,                  Icon: CheckCircle, grad: 'from-purple-500 to-violet-600', sub: `${sales.length > 0 ? Math.round((completedCount / sales.length) * 100) : 0}% rate` },
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
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Sales Management</h1>
            <p className="text-sm text-slate-500">Manage and track all team sales</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchSales} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition flex items-center gap-2 text-sm shadow-md">
            <PlusCircle className="h-4 w-4" /> Add New Sale
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-5">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-4`}>
              <c.Icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800 mb-0.5">{c.value}</p>
            <p className="text-sm font-medium text-slate-700 mb-0.5">{c.title}</p>
            <p className="text-xs text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" placeholder="Search client, employee, project…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
              />
            </div>

            {/* Category filter */}
            <div className="relative">
              <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
                className="pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                <option value="all">All Status</option>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <p className="text-sm text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-5 h-5" />{error}</div>
          <button onClick={fetchSales} className="text-sm text-red-600 font-medium flex items-center gap-1"><RefreshCw className="w-4 h-4" />Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  { label: 'Employee',  field: 'employee' },
                  { label: 'Client',    field: 'client'   },
                  { label: 'Contact',   field: null        },
                  { label: 'Category',  field: null        },
                  { label: 'Total',     field: 'amount'   },
                  { label: 'Upfront',   field: null        },
                 
                  { label: 'Merchant',  field: null        },
                 
                  
                  { label: 'Date',      field: 'date'     },
                  { label: 'Actions',   field: null        },
                ].map(col => (
                  <th key={col.label} className="px-4 py-3 text-left">
                    {col.field ? (
                      <button onClick={() => handleSort(col.field)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 uppercase tracking-wider hover:text-blue-600">
                        {col.label} <ArrowUpDown className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{col.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageData.map(sale => {
                const { bg: statusBg, Icon: StatusIcon } = getStatusCfg(sale.status);
                const { color: catColor, Icon: CatIcon }  = getCatStyle(sale.category);
                const dlInfo = getDeadlineInfo(sale.deadline);
                const isEdit = editingId === sale.id;

                return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    {/* Employee */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-bold">{sale.employeeName ? sale.employeeName[0].toUpperCase() : '?'}</span>
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[110px]">{sale.employeeName || '\u2014'}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{sale.clientName}</span>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {sale.clientEmail && <div className="flex items-center gap-1 text-xs text-gray-600"><Mail className="w-3 h-3 text-gray-400" /><span className="truncate max-w-[130px]">{sale.clientEmail}</span></div>}
                        {sale.clientPhone && <div className="flex items-center gap-1 text-xs text-gray-600"><Phone className="w-3 h-3 text-gray-400" />{sale.clientPhone}</div>}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <select value={editData.category} onChange={e => onEditChange('category', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-lg text-xs">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${catColor}`}>
                          <CatIcon className="w-3 h-3" />
                          {categories.find(c => c.id === sale.category)?.name || sale.category || '\u2014'}
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-left">
                      {isEdit ? (
                        <input type="number" min="0" step="0.01" value={editData.totalAmount}
                          onChange={e => onEditChange('totalAmount', e.target.value)}
                          onWheel={e => e.target.blur()}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-right text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      ) : (
                        <span className="font-medium text-gray-900">{formatCurrency(sale.totalAmount)}</span>
                      )}
                    </td>

                    {/* Upfront */}
                    <td className="px-4 py-3 text-left">
                      {isEdit ? (
                        <input type="number" min="0" step="0.01" value={editData.upfrontPayment}
                          onChange={e => onEditChange('upfrontPayment', e.target.value)}
                          onWheel={e => e.target.blur()}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-right text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      ) : (
                        <span className="text-xs font-medium text-green-600">{formatCurrency(sale.upfrontPayment)}</span>
                      )}
                    </td>

                   

                    {/* Merchant */}
                    <td className="px-4 py-3">
                      {isEdit ? (
                        <select value={editData.merchant} onChange={e => onEditChange('merchant', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-lg text-xs">
                          <option value="">None</option>
                          {MERCHANTS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-700">{sale.merchant || '\u2014'}</span>
                      )}
                    </td>

                    

                    
                    

                    {/* Sale Date */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{fmtDate(sale.saleDate)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {isEdit ? (
                          <>
                            <button onClick={() => saveEdit(sale.id)} disabled={saving}
                              className="p-1.5 bg-green-100 hover:bg-green-200 rounded-lg transition" title="Save">
                              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-green-700" /> : <Save className="w-3.5 h-3.5 text-green-700" />}
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition" title="Cancel">
                              <X className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(sale)}
                              className="p-1.5 bg-gray-100 hover:bg-blue-100 rounded-lg transition" title="Edit">
                              <Edit className="w-3.5 h-3.5 text-gray-700" />
                            </button>
                            <button onClick={() => handleDelete(sale.id)}
                              className="p-1.5 bg-gray-100 hover:bg-red-100 rounded-lg transition" title="Delete">
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
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No sales found</h3>
            <p className="text-gray-500 mb-5 text-sm">Adjust your filters or add a new sale.</p>
            <button onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm inline-flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Add First Sale
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1
                  : page <= 4 ? i + 1
                  : page >= totalPages - 3 ? totalPages - 6 + i
                  : page - 3 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs rounded-lg ${page === p ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
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
    employeeId:          '',
    employeeName:        '',
    employeeEmail:       '',
    clientName:          '',
    clientEmail:         '',
    clientPhone:         '',
    projectDescription:  '',
    category:            categories[0]?.id || 'website-design',
    totalAmount:         '',
    upfrontPayment:      '',
    merchant:            'Stripe',
    paymentMethod:       'Credit Card',
    accountName:         '',
    saleDate:            new Date().toISOString().slice(0, 10),
    deadline:            '',
    status:              'pending',
    notes:               '',
  });
  const [errs, setErrs] = useState({});

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrs(p => ({ ...p, [field]: null }));
  };

  const pickEmployee = (id) => {
    const emp = employees.find(e => String(e.id) === String(id));
    setForm(p => ({
      ...p,
      employeeId:    id,
      employeeName:  emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : '',
      employeeEmail: emp?.email || '',
    }));
    setErrs(p => ({ ...p, employeeId: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.employeeId) e.employeeId = 'Select an employee';
    if (!form.clientName.trim()) e.clientName = 'Client name is required';
    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0) e.totalAmount = 'Enter a valid amount';
    if (parseFloat(form.upfrontPayment) > parseFloat(form.totalAmount)) e.upfrontPayment = 'Cannot exceed total';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const remaining = (parseFloat(form.totalAmount) || 0) - (parseFloat(form.upfrontPayment) || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add New Sale</h3>
            <p className="text-sm text-gray-500">Record a new sale and assign it to an employee</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ── Employee ──────────────────────────────────────────────── */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-600" /> Assign to Employee *
            </h4>
            <div className="relative">
              <select value={form.employeeId} onChange={e => pickEmployee(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${errs.employeeId ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">— Select Sales Employee —</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.email})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {errs.employeeId && <p className="text-red-500 text-xs mt-1">{errs.employeeId}</p>}
          </div>

          {/* ── Client Info ───────────────────────────────────────────── */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-blue-600" /> Client Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client / Company Name *</label>
                <input type="text" value={form.clientName} onChange={e => set('clientName', e.target.value)}
                  placeholder="Acme Corp"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errs.clientName ? 'border-red-400' : 'border-gray-300'}`} />
                {errs.clientName && <p className="text-red-500 text-xs mt-1">{errs.clientName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client Email</label>
                <input type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client Phone</label>
                <input type="tel" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <div className="relative">
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            <textarea rows={3} value={form.projectDescription} onChange={e => set('projectDescription', e.target.value)}
              placeholder="Describe the project or service…"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sale Date *</label>
                <input type="date" value={form.saleDate} onChange={e => set('saleDate', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Deadline</label>
                <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <div className="relative">
                  <select value={form.status} onChange={e => set('status', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount ($) *</label>
                <input type="number" min="0" step="0.01" value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)}
                  onWheel={e => e.target.blur()} placeholder="0.00"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errs.totalAmount ? 'border-red-400' : 'border-gray-300'}`} />
                {errs.totalAmount && <p className="text-red-500 text-xs mt-1">{errs.totalAmount}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Upfront Payment ($)</label>
                <input type="number" min="0" step="0.01" value={form.upfrontPayment} onChange={e => set('upfrontPayment', e.target.value)}
                  onWheel={e => e.target.blur()} placeholder="0.00"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errs.upfrontPayment ? 'border-red-400' : 'border-gray-300'}`} />
                {errs.upfrontPayment && <p className="text-red-500 text-xs mt-1">{errs.upfrontPayment}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remaining Balance</label>
                <input type="text" disabled value={`$${Math.max(0, remaining).toFixed(2)}`}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-100 text-gray-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Merchant</label>
                <div className="relative">
                  <select value={form.merchant} onChange={e => set('merchant', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                    <option value="">None</option>
                    {MERCHANTS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Name</label>
                <input type="text" value={form.accountName} onChange={e => set('accountName', e.target.value)}
                  placeholder="Account holder name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any additional notes…"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Summary + Submit */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6 text-center">
              <div><p className="text-xs text-blue-600">Total</p><p className="text-base font-bold text-blue-800">${(parseFloat(form.totalAmount) || 0).toFixed(2)}</p></div>
              <div><p className="text-xs text-green-600">Upfront</p><p className="text-base font-bold text-green-700">${(parseFloat(form.upfrontPayment) || 0).toFixed(2)}</p></div>
              <div><p className="text-xs text-orange-600">Remaining</p><p className="text-base font-bold text-orange-700">${Math.max(0, remaining).toFixed(2)}</p></div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition text-sm font-medium">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Plus className="h-4 w-4" />Add Sale</>}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdvancedSalesManagement;
