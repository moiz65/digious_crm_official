import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, DollarSign, TrendingUp, RefreshCw,
  Search, Eye, X, Calendar, Mail, Phone,
  ChevronDown, ChevronUp, ArrowUpDown, Loader2,
  Clock, Briefcase, Tag,
  CreditCard, FileText, User, AlertCircle
} from "lucide-react";
import { endpoints, getAuthHeaders } from "../config/api";

const SuperadminCustomer = () => {
  // ── State ──
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total_customers: 0, total_revenue: 0, total_projects: 0, repeat_customers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Sync
  const [isSyncing, setIsSyncing] = useState(false);

  // History month accordion
  const [expandedMonths, setExpandedMonths] = useState({});

  // ── Fetch customers ──
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort_by', sortBy);
      if (sortOrder) params.append('sort_order', sortOrder);

      const url = `${endpoints.customers.getAll}?${params.toString()}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch customers');

      setCustomers(data.data || []);
      setStats(data.stats || { total_customers: 0, total_revenue: 0, total_projects: 0, repeat_customers: 0 });
    } catch (err) {
      console.error('fetchCustomers error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Fetch customer history ──
  const openHistory = async (customerId) => {
    setShowHistory(true);
    setIsLoadingHistory(true);
    setHistoryData(null);

    try {
      const response = await fetch(endpoints.customers.history(customerId), { headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch history');
      setHistoryData(data);
    } catch (err) {
      console.error('openHistory error:', err);
      setHistoryData({ error: err.message });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ── Sync ──
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(endpoints.customers.sync, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Sync failed');
      fetchCustomers();
    } catch (err) {
      console.error('Sync error:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Sort toggle ──
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
  };

  // ── Helpers ──
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const map = {
      'completed':   'bg-green-50 text-green-700 border-green-200',
      'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
      'pending':     'bg-yellow-50 text-yellow-700 border-yellow-200',
      'cancelled':   'bg-red-50 text-red-700 border-red-200',
      'refunded':    'bg-gray-50 text-gray-700 border-gray-200',
    };
    return map[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    return sortOrder === 'ASC' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  // ── Group sales by month (for history popup) ──
  const salesByMonth = useMemo(() => {
    if (!historyData?.sales?.length) return [];
    const groups = {};
    historyData.sales.forEach((sale) => {
      const d = new Date(sale.created_at || sale.sale_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!groups[key]) groups[key] = { key, label, sales: [], total: 0 };
      groups[key].sales.push(sale);
      groups[key].total += parseFloat(sale.total_amount || 0);
    });
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [historyData?.sales]);

  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  // Reset expanded months when opening a new history
  useEffect(() => {
    if (showHistory) setExpandedMonths({});
  }, [showHistory]);

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-sm text-gray-500 mt-1">All clients from your sales records, automatically synced</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync from Sales'}
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_customers}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total_revenue)}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_projects}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Repeat Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.repeat_customers}</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearchQuery(''); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="mb-3 text-sm text-gray-500">
        Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-gray-500">Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-4 text-sm">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Customers will appear here automatically when sales are created'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleSync}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync from Sales
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('client_name')} className="flex items-center gap-1 hover:text-gray-700">
                      Customer <SortIcon column="client_name" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('client_email')} className="flex items-center gap-1 hover:text-gray-700">
                      Email <SortIcon column="client_email" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('total_projects')} className="flex items-center gap-1 hover:text-gray-700">
                      Projects <SortIcon column="total_projects" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('total_spent')} className="flex items-center gap-1 hover:text-gray-700">
                      Total Spent <SortIcon column="total_spent" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('last_sale_date')} className="flex items-center gap-1 hover:text-gray-700">
                      Last Sale <SortIcon column="last_sale_date" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                          {(c.client_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{c.client_name}</div>
                          <div className="text-xs text-gray-400">ID: {c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center text-sm text-gray-600 gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{c.client_email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center text-sm text-gray-600 gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {c.client_phone || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(c.categories || []).slice(0, 2).map((cat) => (
                          <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">
                            <Tag className="w-3 h-3" />{cat}
                          </span>
                        ))}
                        {(c.categories || []).length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium" title={(c.categories || []).slice(2).join(', ')}>
                            +{(c.categories || []).length - 2}
                          </span>
                        )}
                        {(!c.categories || c.categories.length === 0) && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(c.payment_methods || []).slice(0, 2).map((pm) => (
                          <span key={pm} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium">
                            <CreditCard className="w-3 h-3" />{pm}
                          </span>
                        ))}
                        {(c.payment_methods || []).length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium" title={(c.payment_methods || []).slice(2).join(', ')}>
                            +{(c.payment_methods || []).length - 2}
                          </span>
                        )}
                        {(!c.payment_methods || c.payment_methods.length === 0) && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(c.total_spent)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center text-sm text-gray-600 gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {formatDate(c.last_sale_date)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => openHistory(c.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                        title="View full client history"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CLIENT HISTORY MODAL
         ═══════════════════════════════════════════════════════════ */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistory(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                {historyData?.customer && (
                  <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {(historyData.customer.client_name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {isLoadingHistory ? 'Loading...' : historyData?.customer?.client_name || 'Client History'}
                  </h2>
                  {historyData?.customer && (
                    <p className="text-sm text-gray-500">{historyData.customer.client_email}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-white/80 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="ml-3 text-gray-500">Loading client history...</span>
                </div>
              ) : historyData?.error ? (
                <div className="text-center py-16 text-red-500">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                  <p>{historyData.error}</p>
                </div>
              ) : historyData ? (
                <>
                  {/* ── Summary Cards ── */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium">Total Sales</p>
                      <p className="text-xl font-bold text-blue-900 mt-1">{historyData.summary?.total_sales || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <p className="text-xs text-green-600 font-medium">Total Spent</p>
                      <p className="text-xl font-bold text-green-900 mt-1">{formatCurrency(historyData.summary?.total_spent)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                      <p className="text-xs text-amber-600 font-medium">Paid Amount</p>
                      <p className="text-xl font-bold text-amber-900 mt-1">{formatCurrency(historyData.summary?.total_upfront)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                      <p className="text-xs text-red-600 font-medium">Remaining</p>
                      <p className="text-xl font-bold text-red-900 mt-1">{formatCurrency(historyData.summary?.total_remaining)}</p>
                    </div>
                  </div>

                  {/* ── Client Info ── */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" /> Client Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium text-gray-900">{historyData.customer?.client_phone || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">First sale:</span>
                        <p className="font-medium text-gray-900">{formatDate(historyData.customer?.first_sale_date)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Last sale:</span>
                        <p className="font-medium text-gray-900">{formatDate(historyData.customer?.last_sale_date)}</p>
                      </div>
                    </div>
                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {historyData.summary?.categories?.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">{cat}</span>
                      ))}
                      {historyData.summary?.merchants?.map((m) => (
                        <span key={m} className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium">{m}</span>
                      ))}
                    </div>
                    {historyData.summary?.agents?.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Agents worked with: {historyData.summary.agents.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* ── Status Breakdown ── */}
                  {historyData.summary?.status_breakdown && Object.keys(historyData.summary.status_breakdown).length > 0 && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {Object.entries(historyData.summary.status_breakdown).map(([status, count]) => (
                        <span key={status} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ── Sales History – Grouped by Month ── */}
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Sales History ({historyData.sales?.length || 0})
                  </h3>

                  {salesByMonth.length > 0 ? (
                    <div className="space-y-2">
                      {salesByMonth.map((month) => (
                        <div key={month.key} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Month Header – clickable */}
                          <button
                            onClick={() => toggleMonth(month.key)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              {expandedMonths[month.key]
                                ? <ChevronUp className="w-4 h-4 text-gray-500" />
                                : <ChevronDown className="w-4 h-4 text-gray-500" />
                              }
                              <span className="text-sm font-semibold text-gray-800">{month.label}</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {month.sales.length} sale{month.sales.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{formatCurrency(month.total)}</span>
                          </button>

                          {/* Expanded sales for this month */}
                          {expandedMonths[month.key] && (
                            <div className="divide-y divide-gray-100">
                              {month.sales.map((sale) => (
                                <div key={sale.id} className="px-4 py-3 hover:bg-white transition-colors">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      {/* Top row */}
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-xs text-gray-400 font-mono">#{sale.id}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sale.status)}`}>
                                          {sale.status}
                                        </span>
                                        {sale.category_name && (
                                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium">
                                            {sale.category_name}
                                          </span>
                                        )}
                                        {sale.merchant && (
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                            {sale.merchant}
                                          </span>
                                        )}
                                      </div>
                                      {/* Description */}
                                      {sale.project_description && (
                                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{sale.project_description}</p>
                                      )}
                                      {/* Details row */}
                                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" /> {formatDate(sale.sale_date)}
                                        </span>
                                        {sale.employee_name && (
                                          <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" /> {sale.employee_name}
                                          </span>
                                        )}
                                        {sale.payment_method && (
                                          <span className="flex items-center gap-1">
                                            <CreditCard className="w-3 h-3" /> {sale.payment_method}
                                          </span>
                                        )}
                                      </div>
                                      {/* Notes */}
                                      {sale.notes && (
                                        <p className="text-xs text-gray-400 mt-1 italic">Note: {sale.notes}</p>
                                      )}
                                    </div>
                                    {/* Amounts */}
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                                      <p className="text-xs text-green-600">Paid: {formatCurrency(sale.upfront_payment)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">No sales records found</div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperadminCustomer;