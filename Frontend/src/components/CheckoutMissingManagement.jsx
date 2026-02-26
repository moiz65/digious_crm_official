/**
 * Checkout Missing Management Component
 * For HR to manage employees who forgot to check out
 * Created: February 16, 2026
 */

import { useState, useEffect } from 'react';
import { endpoints } from '../config/api';
import { 
  Clock, AlertCircle, CheckCircle, XCircle, Calendar, 
  User, Search, Filter, Download, RefreshCw, 
  Eye, Edit3, Save, X, FileText, Users, TrendingUp,
  ChevronLeft, ChevronRight, LogOut, LogIn
} from 'lucide-react';

const CheckoutMissingManagement = () => {
  // State Management
  const [pendingRecords, setPendingRecords] = useState([]);
  const [resolvedRecords, setResolvedRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'resolved', 'summary'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 20;
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });
  
  // Modal for resolving checkout missing
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    check_out_time: '',
    employee_explanation: '',
    hr_notes: ''
  });
  
  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Fetch data on component mount and tab change
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingRecords();
    } else if (activeTab === 'resolved') {
      fetchResolvedRecords();
    } else if (activeTab === 'summary') {
      fetchSummary();
    }
  }, [activeTab, currentPage, dateFilter]);
  
  // Fetch pending checkout missing records
  const fetchPendingRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: recordsPerPage
      });
      
      if (dateFilter.from) params.append('date_from', dateFilter.from);
      if (dateFilter.to) params.append('date_to', dateFilter.to);
      
      const response = await fetch(`${endpoints.checkoutMissing}/pending?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPendingRecords(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalRecords(result.pagination.total);
      } else {
        showToast('Failed to fetch pending records', 'error');
      }
    } catch (error) {
      console.error('Error fetching pending records:', error);
      showToast('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch resolved checkout missing records
  const fetchResolvedRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: recordsPerPage
      });
      
      if (dateFilter.from) params.append('date_from', dateFilter.from);
      if (dateFilter.to) params.append('date_to', dateFilter.to);
      
      const response = await fetch(`${endpoints.checkoutMissing}/resolved?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResolvedRecords(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalRecords(result.pagination.total);
      } else {
        showToast('Failed to fetch resolved records', 'error');
      }
    } catch (error) {
      console.error('Error fetching resolved records:', error);
      showToast('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch summary statistics
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${endpoints.checkoutMissing}/stats/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSummary(result.data);
      } else {
        showToast('Failed to fetch summary', 'error');
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      showToast('Error fetching summary', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Process missing checkouts manually
  const processMissingCheckouts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${endpoints.checkoutMissing}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(`Successfully processed ${result.data.recordsMoved} records`, 'success');
        fetchPendingRecords();
      } else {
        showToast('Failed to process missing checkouts', 'error');
      }
    } catch (error) {
      console.error('Error processing missing checkouts:', error);
      showToast('Error processing missing checkouts', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Open resolve modal
  const openResolveModal = (record) => {
    setSelectedRecord(record);
    // Set default checkout time to 06:00 (end of shift)
    setResolveForm({
      check_out_time: '06:00',
      employee_explanation: '',
      hr_notes: ''
    });
    setShowResolveModal(true);
  };
  
  // Handle resolve form submission
  const handleResolve = async () => {
    if (!resolveForm.check_out_time) {
      showToast('Please enter checkout time', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${endpoints.checkoutMissing}/${selectedRecord.id}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolveForm)
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(`Successfully resolved checkout for ${selectedRecord.name}`, 'success');
        setShowResolveModal(false);
        fetchPendingRecords();
      } else {
        showToast(result.message || 'Failed to resolve checkout missing', 'error');
      }
    } catch (error) {
      console.error('Error resolving checkout missing:', error);
      showToast('Error resolving checkout missing', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Show toast notification
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };
  
  // Filter records by search term
  const filteredRecords = (records) => {
    if (!searchTerm) return records;
    
    return records.filter(record => 
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_id.toString().includes(searchTerm)
    );
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // HH:MM
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-600" />
          Checkout Missing Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage employees who forgot to check out
        </p>
      </div>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}
      
      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={processMissingCheckouts}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Process Missing Checkouts
          </button>
        </div>
        
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-80"
          />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className={`px-6 py-3 font-medium flex items-center gap-2 ${
              activeTab === 'pending' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            Pending Resolution
          </button>
          <button
            onClick={() => { setActiveTab('resolved'); setCurrentPage(1); }}
            className={`px-6 py-3 font-medium flex items-center gap-2 ${
              activeTab === 'resolved' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Resolved
          </button>
          <button
            onClick={() => { setActiveTab('summary'); setCurrentPage(1); }}
            className={`px-6 py-3 font-medium flex items-center gap-2 ${
              activeTab === 'summary' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Summary
          </button>
        </div>
        
        {/* Date Filter */}
        {(activeTab === 'pending' || activeTab === 'resolved') && (
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              placeholder="From"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              placeholder="To"
            />
            {(dateFilter.from || dateFilter.to) && (
              <button
                onClick={() => setDateFilter({ from: '', to: '' })}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* Pending Records Table */}
        {!loading && activeTab === 'pending' && (
          <>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Checkout Missing ({totalRecords})
              </h2>
            </div>
            
            {filteredRecords(pendingRecords).length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No pending checkout missing records</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detected At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords(pendingRecords).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{record.name}</div>
                              <div className="text-sm text-gray-500">{record.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(record.attendance_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <LogIn className="w-4 h-4 text-green-600" />
                            {formatTime(record.check_in_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            <LogOut className="w-3 h-3 mr-1" />
                            Missing
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(record.moved_from_attendance_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openResolveModal(record)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Edit3 className="w-4 h-4" />
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {currentPage} of {totalPages} ({totalRecords} total records)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-lg font-medium">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Resolved Records Table */}
        {!loading && activeTab === 'resolved' && (
          <>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Resolved Checkout Missing ({totalRecords})
              </h2>
            </div>
            
            {filteredRecords(resolvedRecords).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No resolved records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-out (Set by HR)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resolved By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resolved At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords(resolvedRecords).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{record.name}</div>
                              <div className="text-sm text-gray-500">{record.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(record.attendance_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <LogIn className="w-4 h-4 text-green-600" />
                            {formatTime(record.check_in_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <LogOut className="w-4 h-4 text-blue-600" />
                            {formatTime(record.check_out_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.resolved_by_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(record.resolved_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {currentPage} of {totalPages} ({totalRecords} total records)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-lg font-medium">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Summary Tab */}
        {!loading && activeTab === 'summary' && summary && (
          <div className="p-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Total Records</p>
                    <p className="text-3xl font-bold text-blue-900">{summary.summary.total_records}</p>
                  </div>
                  <FileText className="w-12 h-12 text-blue-600 opacity-50" />
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-red-900">{summary.summary.pending_count}</p>
                  </div>
                  <AlertCircle className="w-12 h-12 text-red-600 opacity-50" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Resolved</p>
                    <p className="text-3xl font-bold text-green-900">{summary.summary.resolved_count}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Affected Employees</p>
                    <p className="text-3xl font-bold text-purple-900">{summary.summary.affected_employees}</p>
                  </div>
                  <Users className="w-12 h-12 text-purple-600 opacity-50" />
                </div>
              </div>
            </div>
            
            {/* Top Employees by Missing Checkouts */}
            {summary.topEmployees && summary.topEmployees.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Employees by Missing Checkouts</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Missing</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summary.topEmployees.map((emp, index) => (
                        <tr key={emp.employee_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                                <div className="text-sm text-gray-500">{emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{emp.total_missing}</td>
                          <td className="px-6 py-4 text-sm text-red-600">{emp.pending}</td>
                          <td className="px-6 py-4 text-sm text-green-600">{emp.resolved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Recent Unresolved */}
            {summary.recentUnresolved && summary.recentUnresolved.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Unresolved Cases</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detected At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summary.recentUnresolved.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{formatDate(record.attendance_date)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{formatTime(record.check_in_time)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(record.moved_from_attendance_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Resolve Modal */}
      {showResolveModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Resolve Checkout Missing</h2>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-10 h-10 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">{selectedRecord.name}</div>
                    <div className="text-sm text-gray-600">{selectedRecord.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatDate(selectedRecord.attendance_date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-in:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatTime(selectedRecord.check_in_time)}</span>
                  </div>
                </div>
              </div>
              
              {/* Checkout Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set Checkout Time <span className="text-red-600">*</span>
                </label>
                <input
                  type="time"
                  value={resolveForm.check_out_time}
                  onChange={(e) => setResolveForm({ ...resolveForm, check_out_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Default shift end time is 06:00 AM</p>
              </div>
              
              {/* Employee Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee Explanation
                </label>
                <textarea
                  value={resolveForm.employee_explanation}
                  onChange={(e) => setResolveForm({ ...resolveForm, employee_explanation: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Reason given by employee for missing checkout..."
                />
              </div>
              
              {/* HR Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HR Notes
                </label>
                <textarea
                  value={resolveForm.hr_notes}
                  onChange={(e) => setResolveForm({ ...resolveForm, hr_notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Add any HR notes or comments..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={loading || !resolveForm.check_out_time}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Resolve & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutMissingManagement;
