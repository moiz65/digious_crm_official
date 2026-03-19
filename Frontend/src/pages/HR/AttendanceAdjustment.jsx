import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import HrSidebar from '../../components/HrSidebar';
import PagePreloader from '../../components/PagePreloader';
import { endpoints, getAuthHeaders } from '../../config/api';
import {
  Search, FileText, User, Calendar, Clock, CheckCircle, XCircle,
  AlertTriangle, ChevronRight, ChevronLeft, RefreshCw, Save,
  ArrowLeft, Edit3, Trash2, Plus, X, Coffee, EyeOff,
  ClipboardCheck, Loader2, BookOpen
} from 'lucide-react';

// ============================================================
// MAIN PAGE COMPONENT (with HR Sidebar)
// ============================================================
const AttendanceAdjustment = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('attendance-adjustment');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <HrSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#349dff] to-[#1e87e6] bg-clip-text text-transparent">
              Digious CRM
            </h1>
            <div className="w-8 h-8 bg-gradient-to-r from-[#349dff] to-[#1e87e6] rounded-full flex items-center justify-center text-white font-semibold text-sm">
              HR
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AdjustmentContent />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white">
            <HrSidebar
              isCollapsed={false}
              setIsCollapsed={setIsMobileMenuOpen}
              activeItem={activeItem}
              setActiveItem={setActiveItem}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ADJUSTMENT CONTENT (INNER COMPONENT)
// ============================================================
const AdjustmentContent = () => {
  // ---- State ----
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [empLoading, setEmpLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // ticket tabs: pending | resolved | ignored
  const [ticketTab, setTicketTab] = useState('pending');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [toast, setToast] = useState(null);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ---- Fetch tickets ----
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${endpoints.adjustments.tickets}?tab=${ticketTab}&search=${encodeURIComponent(debouncedSearch)}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setTickets(data.data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketTab, debouncedSearch]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ---- Fetch employee data for a ticket ----
  const fetchEmployeeData = useCallback(async (employeeId) => {
    setEmpLoading(true);
    try {
      const url = `${endpoints.adjustments.employeeData(employeeId)}?startDate=${dateRange.start}&endDate=${dateRange.end}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setEmployeeData(data.data);
    } catch (err) {
      console.error('Error fetching employee data:', err);
    } finally {
      setEmpLoading(false);
    }
  }, [dateRange]);

  // ---- Select ticket ----
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('attendance');
    fetchEmployeeData(ticket.employee_id);
  };

  // ---- Go back to ticket list ----
  const handleBack = () => {
    setSelectedTicket(null);
    setEmployeeData(null);
  };

  // ---- Refresh employee data ----
  const handleRefreshData = () => {
    if (selectedTicket) fetchEmployeeData(selectedTicket.employee_id);
  };

  // ---- Show toast ----
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ---- Ignore ticket ----
  const handleIgnoreTicket = async (ticketId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(endpoints.adjustments.ignoreTicket(ticketId), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast('Ticket ignored');
        fetchTickets();
      } else {
        showToast(data.message || 'Failed to ignore ticket', 'error');
      }
    } catch (err) {
      showToast('Error ignoring ticket', 'error');
    }
  };

  // ---- Close ticket ----
  const handleCloseTicket = async (notes) => {
    try {
      const res = await fetch(endpoints.adjustments.closeTicket(selectedTicket.id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ resolution_notes: notes })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Ticket resolved successfully');
        fetchTickets();
        handleBack();
      } else {
        showToast(data.message || 'Failed to close ticket', 'error');
      }
    } catch (err) {
      showToast('Error closing ticket', 'error');
    }
  };

  // ---- Check if ticket is resolved ----
  const isTicketResolved = (ticket) => {
    if (!ticket?.metadata) return false;
    try {
      const meta = typeof ticket.metadata === 'string' ? JSON.parse(ticket.metadata) : ticket.metadata;
      return meta?.adjustment_resolved === true;
    } catch { return false; }
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 transition-all
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        {/* ---- HEADER ---- */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            {selectedTicket && (
              <button onClick={handleBack} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
            )}
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              {selectedTicket ? `Ticket: ${selectedTicket.application_number}` : 'Attendance Adjustment'}
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            {selectedTicket
              ? `Adjusting data for ${selectedTicket.employee_name || 'Employee'}`
              : 'HR department tickets — select one to begin adjustments'}
          </p>
        </div>

        {/* ---- VIEW: TICKET LIST ---- */}
        {!selectedTicket && (
          <TicketListView
            tickets={tickets}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            ticketTab={ticketTab}
            setTicketTab={(tab) => { setTicketTab(tab); setSearchQuery(''); }}
            onSelect={handleSelectTicket}
            onIgnore={handleIgnoreTicket}
            isTicketResolved={isTicketResolved}
            onRefresh={fetchTickets}
          />
        )}

        {/* ---- VIEW: TICKET DETAIL + EMPLOYEE DATA ---- */}
        {selectedTicket && (
          <TicketDetailView
            ticket={selectedTicket}
            employeeData={employeeData}
            empLoading={empLoading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefreshData={handleRefreshData}
            onCloseTicket={handleCloseTicket}
            showToast={showToast}
            isResolved={isTicketResolved(selectedTicket)}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================
// TICKET LIST VIEW  (HR-only, 3 tabs: Pending / Resolved / Ignored)
// ============================================================
const TicketListView = ({ tickets, loading, searchQuery, setSearchQuery, ticketTab, setTicketTab, onSelect, onIgnore, isTicketResolved, onRefresh }) => {
  const tabs = [
    { id: 'pending',  label: 'Pending',  color: 'text-amber-600  bg-amber-50  border-amber-400'  },
    { id: 'resolved', label: 'Resolved', color: 'text-emerald-600 bg-emerald-50 border-emerald-400' },
    { id: 'ignored',  label: 'Ignored',  color: 'text-slate-500  bg-slate-50   border-slate-400'  },
    { id: 'all',      label: 'All',      color: 'text-blue-600   bg-blue-50    border-blue-400'   },
  ];

  return (
    <>
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTicketTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all
                ${ticketTab === tab.id
                  ? `border-blue-500 text-blue-600 bg-blue-50/50`
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-3 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket #, subject, or employee..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <button onClick={onRefresh} className="p-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Ticket Cards */}
      {loading ? (
        <PagePreloader loading={true} message="Loading tickets..." />
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No {ticketTab === 'all' ? '' : ticketTab} tickets found</p>
          <p className="text-slate-400 text-sm mt-1">
            {ticketTab === 'pending' ? 'No approved tickets waiting for adjustment' :
             ticketTab === 'resolved' ? 'No resolved tickets yet' :
             ticketTab === 'ignored' ? 'No ignored tickets' : 'No tickets found'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tickets.map(ticket => {
            const resolved = isTicketResolved(ticket);
            let meta = null;
            try { meta = ticket.metadata ? JSON.parse(ticket.metadata) : null; } catch { /* */ }
            const ignored = meta?.adjustment_ignored === true;

            return (
              <div
                key={ticket.id}
                onClick={() => onSelect(ticket)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${resolved ? 'bg-emerald-100' : ignored ? 'bg-slate-100' : ticket.status === 'approved' ? 'bg-green-100' : ticket.status === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                    <FileText className={`h-5 w-5 ${resolved ? 'text-emerald-600' : ignored ? 'text-slate-500' : ticket.status === 'approved' ? 'text-green-600' : ticket.status === 'pending' ? 'text-yellow-600' : 'text-blue-600'}`} />
                  </div>

                  {/* Middle: info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-blue-600">{ticket.application_number}</span>
                      <StatusBadge status={ticket.status} />
                      {resolved && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle className="h-3 w-3 mr-1" /> Resolved
                        </span>
                      )}
                      {ignored && !resolved && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          <EyeOff className="h-3 w-3 mr-1" /> Ignored
                        </span>
                      )}
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.employee_name || `EMP-${ticket.employee_id}`}
                      </span>
                      <span>{ticket.employee_department || ticket.department}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(ticket.submission_date)}
                      </span>
                    </div>
                  </div>

                  {/* Right: action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {ticketTab === 'pending' && !resolved && !ignored && (
                      <button
                        onClick={(e) => onIgnore(ticket.id, e)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Ignore this ticket"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ============================================================
// TICKET DETAIL VIEW
// ============================================================
const TicketDetailView = ({ ticket, employeeData, empLoading, activeTab, setActiveTab, dateRange, setDateRange, onRefreshData, onCloseTicket, showToast, isResolved }) => {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');

  const tabs = [
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leaves', icon: Calendar },
    { id: 'absents', label: 'Absents', icon: AlertTriangle },
    { id: 'checkout-missing', label: 'Missing Checkouts', icon: XCircle },
    { id: 'breaks', label: 'Breaks', icon: Coffee },
    { id: 'ticket-info', label: 'Ticket Info', icon: BookOpen },
  ];

  const handleClose = () => {
    onCloseTicket(closeNotes);
    setShowCloseModal(false);
    setCloseNotes('');
  };

  return (
    <div>
      {/* ---- Ticket Summary Card ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                {employeeData?.employee?.name || ticket.employee_name || 'Loading...'}
              </h2>
              <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                <span>EMP-{ticket.employee_id}</span>
                <span>{employeeData?.employee?.department || ticket.department}</span>
                <span>{employeeData?.employee?.designation || ''}</span>
                <StatusBadge status={ticket.status} />
                {isResolved && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-3 w-3 mr-1" /> Resolved
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date range picker */}
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
            />
            <button onClick={onRefreshData} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg" title="Reload data">
              <RefreshCw className="h-4 w-4 text-slate-600" />
            </button>
            {!isResolved && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                Resolve Ticket
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---- Attendance Calendar ---- */}
      {employeeData && (
        <AttendanceCalendar 
          attendance={employeeData.attendance || []} 
          absents={employeeData.absents || []}
          dateRange={dateRange}
        />
      )}

      {/* ---- Tabs ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-4">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const count = getTabCount(tab.id, employeeData);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {count !== null && count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-600">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ---- Tab Content ---- */}
        <div className="p-4">
          {empLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-3 text-slate-500">Loading employee data...</span>
            </div>
          ) : !employeeData ? (
            <div className="text-center py-16 text-slate-500">No data available</div>
          ) : (
            <>
              {activeTab === 'attendance' && <AttendanceTab data={employeeData.attendance} employeeId={ticket.employee_id} showToast={showToast} onRefresh={onRefreshData} />}
              {activeTab === 'leaves' && <LeavesTab data={employeeData.leaves} employeeId={ticket.employee_id} showToast={showToast} onRefresh={onRefreshData} />}
              {activeTab === 'absents' && <AbsentsTab data={employeeData.absents} employeeId={ticket.employee_id} showToast={showToast} onRefresh={onRefreshData} />}
              {activeTab === 'checkout-missing' && <CheckoutMissingTab data={employeeData.checkoutMissing} showToast={showToast} onRefresh={onRefreshData} />}
              {activeTab === 'breaks' && <BreaksTab data={employeeData.breaks} />}
              {activeTab === 'ticket-info' && <TicketInfoTab ticket={ticket} />}
            </>
          )}
        </div>
      </div>

      {/* ---- Resolve Ticket Modal ---- */}
      {showCloseModal && (
        <Modal title="Resolve Ticket" onClose={() => setShowCloseModal(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              This will mark ticket <span className="font-bold text-blue-600">{ticket.application_number}</span> as resolved.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Notes</label>
              <textarea
                value={closeNotes}
                onChange={e => setCloseNotes(e.target.value)}
                rows={3}
                placeholder="Describe what adjustments were made..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCloseModal(false)} className="px-4 py-2 bg-slate-200 rounded-lg text-sm hover:bg-slate-300">Cancel</button>
              <button onClick={handleClose} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium">
                Confirm Resolve
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================
// TAB: ATTENDANCE
// ============================================================
const AttendanceTab = ({ data, employeeId, showToast, onRefresh }) => {
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({ attendance_date: '', check_in_time: '', check_out_time: '', status: 'Present', remarks: '' });

  const handleEdit = (record) => {
    setEditId(record.id);
    setEditData({
      check_in_time: record.check_in_time || '',
      check_out_time: record.check_out_time || '',
      status: record.status || 'Present',
      remarks: record.remarks || ''
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(endpoints.adjustments.updateAttendance(editId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editData)
      });
      const result = await res.json();
      if (result.success) {
        showToast('Attendance updated');
        setEditId(null);
        onRefresh();
      } else {
        showToast(result.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Error updating attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!addData.attendance_date) { showToast('Date is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(endpoints.adjustments.addAttendance, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...addData, employee_id: employeeId })
      });
      const result = await res.json();
      if (result.success) {
        showToast('Attendance record added');
        setShowAddForm(false);
        setAddData({ attendance_date: '', check_in_time: '', check_out_time: '', status: 'Present', remarks: '' });
        onRefresh();
      } else {
        showToast(result.message || 'Add failed', 'error');
      }
    } catch (err) {
      showToast('Error adding attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Attendance Records ({data?.length || 0})</h3>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
          <Plus className="h-3 w-3" /> Add Record
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-3">Add New Attendance Record</h4>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <input type="date" value={addData.attendance_date} onChange={e => setAddData(p => ({ ...p, attendance_date: e.target.value }))}
              className="px-2 py-1.5 border rounded-lg text-sm" placeholder="Date" />
            <input type="time" value={addData.check_in_time} onChange={e => setAddData(p => ({ ...p, check_in_time: e.target.value }))}
              className="px-2 py-1.5 border rounded-lg text-sm" placeholder="Check-in" />
            <input type="time" value={addData.check_out_time} onChange={e => setAddData(p => ({ ...p, check_out_time: e.target.value }))}
              className="px-2 py-1.5 border rounded-lg text-sm" placeholder="Check-out" />
            <select value={addData.status} onChange={e => setAddData(p => ({ ...p, status: e.target.value }))}
              className="px-2 py-1.5 border rounded-lg text-sm">
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="On Leave">On Leave</option>
              <option value="Half Day">Half Day</option>
            </select>
            <input type="text" value={addData.remarks} onChange={e => setAddData(p => ({ ...p, remarks: e.target.value }))}
              className="px-2 py-1.5 border rounded-lg text-sm" placeholder="Remarks" />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs hover:bg-slate-300">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Check In</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Check Out</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Working (h)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Late (min)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Remarks</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!data || data.length === 0) ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">No attendance records found</td></tr>
            ) : data.map(row => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                {editId === row.id ? (
                  /* Edit mode */
                  <>
                    <td className="px-3 py-2 text-slate-700">{formatDate(row.attendance_date)}</td>
                    <td className="px-3 py-2">
                      <input type="time" value={editData.check_in_time} onChange={e => setEditData(p => ({ ...p, check_in_time: e.target.value }))}
                        className="px-1.5 py-1 border rounded text-xs w-24" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="time" value={editData.check_out_time} onChange={e => setEditData(p => ({ ...p, check_out_time: e.target.value }))}
                        className="px-1.5 py-1 border rounded text-xs w-24" />
                    </td>
                    <td className="px-3 py-2">
                      <select value={editData.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}
                        className="px-1.5 py-1 border rounded text-xs">
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Half Day">Half Day</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{minutesToHours(row.net_working_time_minutes)}</td>
                    <td className="px-3 py-2 text-slate-500">{row.late_by_minutes || 0}</td>
                    <td className="px-3 py-2">
                      <input type="text" value={editData.remarks} onChange={e => setEditData(p => ({ ...p, remarks: e.target.value }))}
                        className="px-1.5 py-1 border rounded text-xs w-full" placeholder="Remarks" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={handleSave} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Save">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setEditId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded" title="Cancel">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  /* View mode */
                  <>
                    <td className="px-3 py-2 text-slate-700 font-medium">{formatDate(row.attendance_date)}</td>
                    <td className="px-3 py-2 text-slate-600">{row.check_in_time || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{row.check_out_time || '—'}</td>
                    <td className="px-3 py-2"><AttendanceStatusBadge status={row.status} /></td>
                    <td className="px-3 py-2 text-slate-600">{minutesToHours(row.net_working_time_minutes)}</td>
                    <td className="px-3 py-2">
                      {row.late_by_minutes > 0
                        ? <span className="text-red-600 font-medium">{row.late_by_minutes}</span>
                        : <span className="text-green-600">0</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs max-w-[120px] truncate" title={row.remarks}>{row.remarks || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// TAB: LEAVES
// ============================================================
const LeavesTab = ({ data, employeeId, showToast, onRefresh }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        casual_leaves_used:  data.casual_leaves_used ?? 0,
        sick_leaves_used:    data.sick_leaves_used ?? 0,
        annual_leaves_used:  data.annual_leaves_used ?? 0,
        remarks: data.remarks || ''
      });
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(endpoints.adjustments.updateLeaves(employeeId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        showToast('Leave balances updated');
        setEditing(false);
        onRefresh();
      } else {
        showToast(result.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Error updating leaves', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return <div className="text-center py-12 text-slate-400">No leave records found for this employee</div>;
  }

  const leaveTypes = [
    { key: 'casual', label: 'Casual Leaves', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', titleColor: 'text-blue-800', barColor: 'bg-blue-500',
      usedKey: 'casual_leaves_used', totalKey: null, remainingKey: null, totalVal: data.casual_leaves_total ?? 0, remainingVal: data.casual_leaves_remaining ?? 0 },
    { key: 'sick',   label: 'Sick Leaves',  bgColor: 'bg-orange-50', borderColor: 'border-orange-200', titleColor: 'text-orange-800', barColor: 'bg-orange-500',
      usedKey: 'sick_leaves_used', totalKey: null, remainingKey: null, totalVal: data.sick_leaves_total ?? 0, remainingVal: data.sick_leaves_remaining ?? 0 },
    { key: 'annual', label: 'Annual Leaves', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', titleColor: 'text-purple-800', barColor: 'bg-purple-500',
      usedKey: 'annual_leaves_used', totalKey: null, remainingKey: null, totalVal: data.annual_leaves_total ?? 0, remainingVal: data.annual_leaves_remaining ?? 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Leave Balances — Year: {data.leaves_year || 'N/A'}</h3>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
            <Edit3 className="h-3 w-3" /> Edit Balances
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs hover:bg-slate-300">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {leaveTypes.map(lt => {
          const used      = formData[lt.usedKey]  ?? 0;
          const total     = lt.totalKey ? (formData[lt.totalKey] ?? lt.totalVal) : lt.totalVal;
          const remaining = lt.remainingKey ? (data[lt.remainingKey] ?? 0) : (total - used);
          const percentage = total > 0 ? (used / total) * 100 : 0;

          return (
            <div key={lt.key} className={`${lt.bgColor} border ${lt.borderColor} rounded-xl p-4`}>
              <h4 className={`font-semibold ${lt.titleColor} text-sm mb-1`}>{lt.label}</h4>
              {lt.description && <p className="text-xs text-slate-500 mb-2">{lt.description}</p>}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Used</span>
                  {editing ? (
                    <input
                      type="number" min={0} max={total > 0 ? total : 999}
                      value={formData[lt.usedKey] ?? 0}
                      onChange={e => setFormData(p => ({ ...p, [lt.usedKey]: parseInt(e.target.value) || 0 }))}
                      className="w-16 px-2 py-0.5 border rounded text-right text-sm"
                    />
                  ) : (
                    <span className="font-bold">{used}</span>
                  )}
                </div>
                {/* Total (editable for uninformed/paid_absent) */}
                {lt.totalKey ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{lt.key === 'paid_absent' ? 'Balance (granted)' : 'Quota'}</span>
                    {editing ? (
                      <input
                        type="number" min={0}
                        value={formData[lt.totalKey] ?? lt.totalVal}
                        onChange={e => setFormData(p => ({ ...p, [lt.totalKey]: parseInt(e.target.value) || 0 }))}
                        className="w-16 px-2 py-0.5 border rounded text-right text-sm"
                      />
                    ) : (
                      <span className="font-bold">{total}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total</span>
                    <span className="font-bold">{total}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Remaining</span>
                  <span className={`font-bold ${remaining <= 1 ? 'text-red-600' : 'text-green-600'}`}>{remaining}</span>
                </div>
                {total > 0 && (
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className={`${lt.barColor} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
          <textarea
            value={formData.remarks}
            onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Reason for adjustment..."
          />
        </div>
      )}
    </div>
  );
};

// ============================================================
// TAB: ABSENTS
// ============================================================
const AbsentsTab = ({ data, employeeId, showToast, onRefresh }) => {
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addData, setAddData] = useState({ absent_date: '', reason_type: 'No Check-in', reason: '', is_approved: 0 });
  const [convertId, setConvertId] = useState(null);
  const [convertLeaveType, setConvertLeaveType] = useState('casual');
  const [converting, setConverting] = useState(false);

  const handleConvertToPaidLeave = async (absentId) => {
    setConverting(true);
    try {
      const res = await fetch(endpoints.adjustments.convertAbsentToPaidLeave(absentId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ leave_type_key: convertLeaveType })
      });
      const result = await res.json();
      if (result.success) {
        showToast('Absent converted to Paid Leave');
        setConvertId(null);
        onRefresh();
      } else {
        showToast(result.message || 'Conversion failed', 'error');
      }
    } catch (err) {
      showToast('Error converting absent', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleEdit = (record) => {
    setEditId(record.id);
    setEditData({
      reason_type: record.reason_type || 'No Check-in',
      reason: record.reason || '',
      is_approved: record.is_approved || 0,
      remarks: record.remarks || ''
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(endpoints.adjustments.updateAbsent(editId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editData)
      });
      const result = await res.json();
      if (result.success) {
        showToast('Absent record updated');
        setEditId(null);
        onRefresh();
      } else {
        showToast(result.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Error updating absent', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!addData.absent_date) { showToast('Date is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(endpoints.adjustments.addAbsent, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...addData, employee_id: employeeId })
      });
      const result = await res.json();
      if (result.success) {
        showToast('Absent record added');
        setShowAddForm(false);
        setAddData({ absent_date: '', reason_type: 'No Check-in', reason: '', is_approved: 0 });
        onRefresh();
      } else {
        showToast(result.message || 'Add failed', 'error');
      }
    } catch (err) {
      showToast('Error adding absent', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this absent record?')) return;
    try {
      const res = await fetch(endpoints.adjustments.deleteAbsent(id), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const result = await res.json();
      if (result.success) {
        showToast('Absent record deleted');
        onRefresh();
      } else {
        showToast(result.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Error deleting absent', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Absent Records ({data?.length || 0})</h3>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
          <Plus className="h-3 w-3" /> Add Record
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-3">Add New Absent Record</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <input type="date" value={addData.absent_date} onChange={e => setAddData(p => ({ ...p, absent_date: e.target.value }))}
              className="px-2 py-1.5 border rounded-lg text-sm" placeholder="Date" />
            <select value={addData.reason_type} onChange={e => setAddData(p => ({ ...p, reason_type: e.target.value }))}
              className="px-2 py-1.5 border rounded-lg text-sm">
              <option value="No Check-in">No Check-in</option>
              <option value="Leave">Leave</option>
              <option value="Medical">Medical</option>
              <option value="Sick">Sick</option>
              <option value="Paid Leave">Paid Leave</option>
              <option value="Other">Other</option>
            </select>
            <input type="text" value={addData.reason} onChange={e => setAddData(p => ({ ...p, reason: e.target.value }))}
              className="px-2 py-1.5 border rounded-lg text-sm" placeholder="Reason" />
            <select value={addData.is_approved} onChange={e => setAddData(p => ({ ...p, is_approved: parseInt(e.target.value) }))}
              className="px-2 py-1.5 border rounded-lg text-sm">
              <option value={0}>Not Approved</option>
              <option value={1}>Approved</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs hover:bg-slate-300">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Reason Type</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Reason</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Approved</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Remarks</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!data || data.length === 0) ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No absent records found</td></tr>
            ) : data.map(row => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                {editId === row.id ? (
                  <>
                    <td className="px-3 py-2 text-slate-700">{formatDate(row.absent_date)}</td>
                    <td className="px-3 py-2">
                      <select value={editData.reason_type} onChange={e => setEditData(p => ({ ...p, reason_type: e.target.value }))}
                        className="px-1.5 py-1 border rounded text-xs">
                        <option>No Check-in</option>
                        <option>Leave</option>
                        <option>Medical</option>
                        <option>Sick</option>
                        <option>Paid Leave</option>
                        <option>Other</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={editData.reason} onChange={e => setEditData(p => ({ ...p, reason: e.target.value }))}
                        className="px-1.5 py-1 border rounded text-xs w-40" />
                    </td>
                    <td className="px-3 py-2">
                      <select value={editData.is_approved} onChange={e => setEditData(p => ({ ...p, is_approved: parseInt(e.target.value) }))}
                        className="px-1.5 py-1 border rounded text-xs">
                        <option value={0}>No</option>
                        <option value={1}>Yes</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={editData.remarks} onChange={e => setEditData(p => ({ ...p, remarks: e.target.value }))}
                        className="px-1.5 py-1 border rounded text-xs w-32" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={handleSave} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setEditId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 text-slate-700 font-medium">{formatDate(row.absent_date)}</td>
                    <td className="px-3 py-2"><ReasonTypeBadge type={row.reason_type} /></td>
                    <td className="px-3 py-2 text-slate-600 text-xs max-w-[150px] truncate" title={row.reason}>{row.reason || '—'}</td>
                    <td className="px-3 py-2">
                      {row.is_approved ? (
                        <span className="text-green-600 font-medium text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Yes</span>
                      ) : (
                        <span className="text-red-500 text-xs flex items-center gap-1"><XCircle className="h-3 w-3" /> No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs max-w-[120px] truncate" title={row.remarks}>{row.remarks || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {row.reason_type !== 'Paid Leave' && (
                          <button
                            onClick={() => { setConvertId(row.id); setConvertLeaveType('casual'); }}
                            className="p-1 text-teal-600 hover:bg-teal-50 rounded text-xs font-semibold"
                            title="Convert to Paid Leave"
                          >
                            PL
                          </button>
                        )}
                        <button onClick={() => handleDelete(row.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {convertId === row.id && (
                        <div className="mt-1 flex items-center gap-1 justify-center">
                          <select
                            value={convertLeaveType}
                            onChange={e => setConvertLeaveType(e.target.value)}
                            className="px-1.5 py-1 border border-teal-300 rounded text-xs"
                          >
                            <option value="casual">Casual</option>
                            <option value="sick">Sick</option>
                            <option value="annual">Annual</option>
                          </select>
                          <button
                            onClick={() => handleConvertToPaidLeave(row.id)}
                            disabled={converting}
                            className="px-2 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700 disabled:opacity-50"
                          >
                            {converting ? '...' : 'Convert'}
                          </button>
                          <button
                            onClick={() => setConvertId(null)}
                            className="px-1.5 py-1 bg-slate-200 rounded text-xs hover:bg-slate-300"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// TAB: CHECKOUT MISSING
// ============================================================
const CheckoutMissingTab = ({ data, showToast, onRefresh }) => {
  const [resolveId, setResolveId] = useState(null);
  const [resolveData, setResolveData] = useState({ check_out_time: '', hr_notes: '' });
  const [saving, setSaving] = useState(false);

  const handleResolve = async () => {
    setSaving(true);
    try {
      const res = await fetch(endpoints.adjustments.resolveCheckoutMissing(resolveId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(resolveData)
      });
      const result = await res.json();
      if (result.success) {
        showToast('Checkout missing resolved');
        setResolveId(null);
        onRefresh();
      } else {
        showToast(result.message || 'Resolve failed', 'error');
      }
    } catch (err) {
      showToast('Error resolving', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Missing Checkout Records ({data?.length || 0})</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Check In</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Check Out</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Reason</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Employee Note</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Resolved</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!data || data.length === 0) ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">No missing checkout records</td></tr>
            ) : data.map(row => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-700 font-medium">{formatDate(row.attendance_date)}</td>
                <td className="px-3 py-2 text-slate-600">{row.check_in_time || '—'}</td>
                <td className="px-3 py-2 text-slate-600">{row.check_out_time || '—'}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{row.missing_reason || '—'}</td>
                <td className="px-3 py-2 text-slate-500 text-xs max-w-[120px] truncate" title={row.employee_explanation}>{row.employee_explanation || '—'}</td>
                <td className="px-3 py-2">
                  {row.is_resolved ? (
                    <span className="text-green-600 font-medium text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Yes</span>
                  ) : (
                    <span className="text-amber-600 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> No</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {!row.is_resolved && resolveId !== row.id && (
                    <button onClick={() => { setResolveId(row.id); setResolveData({ check_out_time: '', hr_notes: '' }); }}
                      className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs hover:bg-amber-200 font-medium">
                      Resolve
                    </button>
                  )}
                  {resolveId === row.id && (
                    <div className="flex items-center gap-2">
                      <input type="time" value={resolveData.check_out_time}
                        onChange={e => setResolveData(p => ({ ...p, check_out_time: e.target.value }))}
                        className="px-1.5 py-1 border rounded text-xs w-24" placeholder="Checkout" />
                      <input type="text" value={resolveData.hr_notes}
                        onChange={e => setResolveData(p => ({ ...p, hr_notes: e.target.value }))}
                        className="px-1.5 py-1 border rounded text-xs w-28" placeholder="HR Notes" />
                      <button onClick={handleResolve} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setResolveId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {row.is_resolved && (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// TAB: BREAKS
// ============================================================
const BreaksTab = ({ data }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Break Records ({data?.length || 0})</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Type</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Start</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">End</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Duration (min)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Reason</th>
            </tr>
          </thead>
          <tbody>
            {(!data || data.length === 0) ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No break records found</td></tr>
            ) : data.map(row => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-700 font-medium">{formatDate(row.attendance_date)}</td>
                <td className="px-3 py-2"><BreakTypeBadge type={row.break_type} /></td>
                <td className="px-3 py-2 text-slate-600">{row.break_start_time || '—'}</td>
                <td className="px-3 py-2 text-slate-600">{row.break_end_time || '—'}</td>
                <td className="px-3 py-2 text-slate-600">{row.break_duration_minutes ?? '—'}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{row.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// TAB: TICKET INFO
// ============================================================
const TicketInfoTab = ({ ticket }) => {
  let metadata = null;
  try {
    metadata = ticket.metadata ? (typeof ticket.metadata === 'string' ? JSON.parse(ticket.metadata) : ticket.metadata) : null;
  } catch { /* ignore */ }

  const fields = [
    { label: 'Application Number', value: ticket.application_number },
    { label: 'Type', value: ticket.application_type },
    { label: 'Department', value: ticket.department },
    { label: 'Subject', value: ticket.subject },
    { label: 'Status', value: ticket.status },
    { label: 'Priority', value: ticket.priority },
    { label: 'Submitted', value: formatDate(ticket.submission_date) },
    { label: 'Approved By', value: ticket.approved_by || '—' },
    { label: 'Approved Date', value: ticket.approved_date ? formatDate(ticket.approved_date) : '—' },
    { label: 'Assigned To', value: ticket.assigned_to || '—' },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Application Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {fields.map((f, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-0.5">{f.label}</p>
            <p className="text-sm font-medium text-slate-800">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <p className="text-xs text-slate-500 mb-1">Description</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description || '—'}</p>
      </div>

      {ticket.approval_notes && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-xs text-green-600 mb-1">Approval Notes</p>
          <p className="text-sm text-green-800">{ticket.approval_notes}</p>
        </div>
      )}

      {metadata?.adjustment_resolved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs text-emerald-600 mb-1">Resolution</p>
          <p className="text-sm text-emerald-800">
            Resolved on {metadata.adjustment_resolved_at ? new Date(metadata.adjustment_resolved_at).toLocaleString() : 'N/A'}
          </p>
          {metadata.resolution_notes && (
            <p className="text-sm text-emerald-700 mt-1">{metadata.resolution_notes}</p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// ATTENDANCE CALENDAR COMPONENT  (with month navigation)
// ============================================================
const AttendanceCalendar = ({ attendance, absents, dateRange }) => {
  // Start the calendar at the dateRange.start month, allow navigation
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(dateRange.start);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Sync viewDate if dateRange changes
  useEffect(() => {
    const d = new Date(dateRange.start);
    setViewDate({ year: d.getFullYear(), month: d.getMonth() });
  }, [dateRange.start]);

  const { year, month } = viewDate;

  const prevMonth = () => {
    setViewDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };
  const nextMonth = () => {
    setViewDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // Build lookup maps
  const attendanceMap = {};
  attendance.forEach(rec => {
    const key = rec.attendance_date?.split('T')[0] || new Date(rec.attendance_date).toISOString().split('T')[0];
    attendanceMap[key] = rec;
  });
  const absentMap = {};
  absents.forEach(rec => {
    const key = rec.absent_date?.split('T')[0] || new Date(rec.absent_date).toISOString().split('T')[0];
    absentMap[key] = rec;
  });

  // Generate days for the viewed month
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0=Sun

  const days = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getStatusInfo = (dateStr) => {
    if (absentMap[dateStr]) {
      return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-500', label: `Absent: ${absentMap[dateStr].reason_type || ''}` };
    }
    const rec = attendanceMap[dateStr];
    if (!rec) return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400', dot: null, label: 'No data' };
    switch (rec.status) {
      case 'Present': return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', dot: 'bg-green-500', label: `Present ${rec.check_in_time ? '· ' + rec.check_in_time : ''}` };
      case 'Late':    return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-500', label: `Late ${rec.check_in_time ? '· ' + rec.check_in_time : ''}${rec.late_by_minutes ? ' (+' + rec.late_by_minutes + 'm)' : ''}` };
      case 'On Leave': return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', dot: 'bg-purple-500', label: 'On Leave' };
      case 'Half Day': return { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', dot: 'bg-yellow-500', label: `Half Day ${rec.check_in_time ? '· ' + rec.check_in_time : ''}` };
      case 'Absent':  return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-500', label: 'Absent' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-400', dot: null, label: rec.status || 'No data' };
    }
  };

  const isWeekend = (day) => {
    const dow = new Date(year, month, day).getDay();
    return dow === 0 || dow === 6;
  };

  // Monthly stats for visible month
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthAttendance = Object.entries(attendanceMap).filter(([k]) => k.startsWith(monthStr));
  const monthAbsents   = Object.entries(absentMap).filter(([k]) => k.startsWith(monthStr));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
      {/* Header: month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
        <h3 className="text-sm font-semibold text-slate-700">
          {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title="Next month"
        >
          <ChevronRight className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {[
          { color: 'bg-green-100 border-green-300', label: 'Present' },
          { color: 'bg-red-100 border-red-300',     label: 'Absent' },
          { color: 'bg-orange-100 border-orange-300', label: 'Late' },
          { color: 'bg-purple-100 border-purple-300', label: 'Leave' },
          { color: 'bg-yellow-100 border-yellow-300', label: 'Half Day' },
          { color: 'bg-slate-50 border-slate-200',   label: 'No Data' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1 text-xs text-slate-600">
            <div className={`w-3 h-3 rounded border ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-slate-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells — compact */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const info = getStatusInfo(dateStr);
          const weekend = isWeekend(day);

          return (
            <div
              key={day}
              title={info.label}
              className={`h-8 flex flex-col items-center justify-center rounded border text-xs font-semibold cursor-default select-none transition-all hover:shadow-sm
                ${weekend && !attendanceMap[dateStr] && !absentMap[dateStr]
                  ? 'bg-blue-50 border-blue-100 text-blue-300'
                  : `${info.bg} ${info.border} ${info.text}`}
              `}
            >
              <span className="leading-none">{day}</span>
              {info.dot && <div className={`w-1 h-1 rounded-full ${info.dot} mt-0.5`} />}
            </div>
          );
        })}
      </div>

      {/* Monthly stats */}
      <div className="mt-3 grid grid-cols-5 gap-2">
        {[
          { label: 'Present', count: monthAttendance.filter(([,r]) => r.status === 'Present').length, bg: 'bg-green-50 border-green-200', text: 'text-green-700', sub: 'text-green-600' },
          { label: 'Absent',  count: monthAbsents.length, bg: 'bg-red-50 border-red-200', text: 'text-red-700', sub: 'text-red-600' },
          { label: 'Late',    count: monthAttendance.filter(([,r]) => r.status === 'Late').length, bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', sub: 'text-orange-600' },
          { label: 'Leave',   count: monthAttendance.filter(([,r]) => r.status === 'On Leave').length, bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', sub: 'text-purple-600' },
          { label: 'Half Day',count: monthAttendance.filter(([,r]) => r.status === 'Half Day').length, bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', sub: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-lg p-2 text-center`}>
            <p className={`text-[10px] font-medium ${s.sub}`}>{s.label}</p>
            <p className={`text-xl font-bold ${s.text}`}>{s.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// SHARED COMPONENTS
// ============================================================
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'in_review': 'bg-purple-100 text-purple-700',
    withdrawn: 'bg-gray-100 text-gray-600'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-slate-100 text-slate-600'
  };
  return priority ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[priority] || 'bg-slate-100 text-slate-600'}`}>
      {priority}
    </span>
  ) : null;
};

const AttendanceStatusBadge = ({ status }) => {
  const colors = {
    Present: 'bg-green-100 text-green-700',
    Absent: 'bg-red-100 text-red-700',
    Late: 'bg-orange-100 text-orange-700',
    'On Leave': 'bg-purple-100 text-purple-700',
    'Half Day': 'bg-yellow-100 text-yellow-700'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status || '—'}
    </span>
  );
};

const ReasonTypeBadge = ({ type }) => {
  const colors = {
    'No Check-in': 'bg-red-100 text-red-700',
    'Leave': 'bg-purple-100 text-purple-700',
    'Medical': 'bg-blue-100 text-blue-700',
    'Sick': 'bg-orange-100 text-orange-700',
    'Other': 'bg-gray-100 text-gray-600'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
      {type || '—'}
    </span>
  );
};

const BreakTypeBadge = ({ type }) => {
  const colors = {
    Smoke: 'bg-gray-100 text-gray-700',
    Dinner: 'bg-amber-100 text-amber-700',
    Washroom: 'bg-cyan-100 text-cyan-700',
    Prayer: 'bg-indigo-100 text-indigo-700',
    Other: 'bg-slate-100 text-slate-600'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
      {type || '—'}
    </span>
  );
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch { return dateStr; }
};

const minutesToHours = (mins) => {
  if (!mins && mins !== 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const getTabCount = (tabId, employeeData) => {
  if (!employeeData) return 0;
  switch (tabId) {
    case 'attendance': return employeeData.attendance?.length || 0;
    case 'leaves': return employeeData.leaves ? 1 : 0;
    case 'absents': return employeeData.absents?.length || 0;
    case 'checkout-missing': return employeeData.checkoutMissing?.length || 0;
    case 'breaks': return employeeData.breaks?.length || 0;
    default: return 0;
  }
};

export default AttendanceAdjustment;