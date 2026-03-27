import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { DashboardHeader } from './DashboardComponents';
import { useAuth } from '../context/AuthContext';
import { endpoints, getAuthHeaders } from '../config/api';
import EmployeeSidebar from './EmployeeSidebar';
import HrSidebar from './HrSidebar';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Eye,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Shield,
  FileText,
  Edit3,
  Tag,
  Filter,
  RefreshCw,
  X,
  Download,
  File,
  Paperclip,
} from 'lucide-react';

// ─── Helper: format time string ──────────────────────────────
const fmt = (v, fallback = '—') => v || fallback;

// ─── Helper: parse date safely ───────────────────────────────
const parseDate = (dateStr) => {
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
};

// ─── Status badge ────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    open: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    tagged_approved: 'bg-blue-100 text-blue-800 border-blue-300',
    tagged_rejected: 'bg-red-100 text-red-800 border-red-300',
    hr_approved: 'bg-green-100 text-green-800 border-green-300',
    hr_rejected: 'bg-red-100 text-red-800 border-red-300',
    applied: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
  const labels = {
    open: 'Pending Review',
    tagged_approved: 'Reviewer Approved',
    tagged_rejected: 'Reviewer Rejected',
    hr_approved: 'HR Approved',
    hr_rejected: 'HR Rejected',
    applied: 'Applied',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════
// File Slider Panel (right-side panel)
// ══════════════════════════════════════════════════════════════
const FileSliderPanel = ({ isOpen, onClose, ticket }) => {
  const mockDocuments = [
    { id: 1, name: 'correction_request.pdf', size: '2.4 MB', type: 'application/pdf', date: '2026-03-27' },
    { id: 2, name: 'attendance_record.xlsx', size: '1.8 MB', type: 'application/vnd.ms-excel', date: '2026-03-27' },
    { id: 3, name: 'evidence.jpg', size: '845 KB', type: 'image/jpeg', date: '2026-03-27' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slider Panel */}
      <div
        className={`
          fixed right-0 top-0 bottom-0 h-screen w-96 max-w-[100vw]
          bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 shadow-2xl
          flex flex-col z-50
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'}
        `}
        style={{ 
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          visibility: isOpen ? 'visible' : 'hidden'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Paperclip className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Attachments</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mockDocuments.length > 0 ? (
            <>
              <div className="space-y-2 mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket #{ticket?.ticket_number}</h3>
                <p className="text-sm text-gray-600">{mockDocuments.length} file(s) attached</p>
              </div>

              <div className="space-y-3">
                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 hover:border-indigo-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                        <File className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {doc.size} • {new Date(doc.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <button className="p-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex-shrink-0">
                        <Download className="w-4 h-4 text-indigo-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-gray-100 rounded-full mb-3">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No attachments yet</p>
              <p className="text-xs text-gray-400 mt-1">Files related to this ticket will appear here</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium">
            <Paperclip className="w-4 h-4" />
            Add Files
          </button>
        </div>
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════
// Ticket Detail View (replaces the list — view-switch pattern)
// ══════════════════════════════════════════════════════════════
const TicketDetailView = ({ ticket, onBack, onAction, userRole, currentEmployeeId }) => {
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (ticket) {
      setRemarks('');
      fetchLogs();
    }
  }, [ticket]);

  const fetchLogs = async () => {
    if (!ticket) return;
    try {
      const res = await fetch(endpoints.attendanceCorrections.logs(ticket.id), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      await onAction(ticket.id, action, remarks);
      onBack();
    } finally {
      setActionLoading(false);
    }
  };

  if (!ticket) return null;

  const isTaggedPerson = ticket.tagged_employee_id === currentEmployeeId;
  const canTaggedAct = isTaggedPerson && ticket.tagged_status === 'pending';
  const canHRAct = (userRole === 'hr' || userRole === 'admin') &&
                   ticket.overall_status === 'tagged_approved' && ticket.hr_status === 'pending';

  return (
    <div>
      {/* Header bar with back button — same pattern as HrAttendancePage EmployeeDetailView */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition duration-300"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
              {ticket.employee_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {ticket.ticket_number}
                <StatusBadge status={ticket.overall_status} />
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {ticket.employee_name} &bull;{' '}
                {parseDate(ticket.attendance_date).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Before / After Comparison Table ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Original vs Corrected</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Field</th>
                <th className="text-left px-5 py-3 text-red-600 font-medium">Original</th>
                <th className="text-center px-2 py-3"></th>
                <th className="text-left px-5 py-3 text-green-600 font-medium">Corrected</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-700">Check In</td>
                <td className="px-5 py-3 text-gray-900">{fmt(ticket.original_check_in)}</td>
                <td className="px-2 py-3 text-center">{ticket.corrected_check_in && <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />}</td>
                <td className={`px-5 py-3 font-semibold ${ticket.corrected_check_in ? 'text-green-700' : 'text-gray-400'}`}>
                  {ticket.corrected_check_in || 'No change'}
                </td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-700">Check Out</td>
                <td className="px-5 py-3 text-gray-900">{fmt(ticket.original_check_out)}</td>
                <td className="px-2 py-3 text-center">{ticket.corrected_check_out && <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />}</td>
                <td className={`px-5 py-3 font-semibold ${ticket.corrected_check_out ? 'text-green-700' : 'text-gray-400'}`}>
                  {ticket.corrected_check_out || 'No change'}
                </td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-700">Status</td>
                <td className="px-5 py-3 text-gray-900">{fmt(ticket.original_status)}</td>
                <td className="px-2 py-3 text-center">{ticket.corrected_status && <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />}</td>
                <td className={`px-5 py-3 font-semibold ${ticket.corrected_status ? 'text-green-700' : 'text-gray-400'}`}>
                  {ticket.corrected_status || 'No change'}
                </td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-700">Working Time</td>
                <td className="px-5 py-3 text-gray-900">
                  {ticket.original_working_minutes != null
                    ? `${Math.floor(ticket.original_working_minutes / 60)}h ${ticket.original_working_minutes % 60}m`
                    : '—'}
                </td>
                <td className="px-2 py-3"></td>
                <td className="px-5 py-3 text-gray-400">—</td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-700">Late By</td>
                <td className="px-5 py-3 text-gray-900">
                  {ticket.original_late_minutes ? `${ticket.original_late_minutes} min` : '—'}
                </td>
                <td className="px-2 py-3"></td>
                <td className="px-5 py-3 text-gray-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Reason ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Employee's Reason
          </h3>
          <p className="text-sm text-gray-800 leading-relaxed">{ticket.reason}</p>
        </div>

        {/* ── Workflow Status Cards (Tagged + HR) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tagged Person */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Tagged Reviewer
            </h3>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{ticket.tagged_employee_name}</p>
                <p className="text-xs text-gray-500">{ticket.tagged_employee_email}</p>
              </div>
              <StatusBadge
                status={
                  ticket.tagged_status === 'approved' ? 'tagged_approved' :
                  ticket.tagged_status === 'rejected' ? 'tagged_rejected' : 'open'
                }
              />
            </div>
            {ticket.tagged_remarks && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                <span className="font-medium">Remarks:</span> {ticket.tagged_remarks}
              </div>
            )}
            {ticket.tagged_action_at && (
              <p className="text-[11px] text-gray-400 mt-1">{new Date(ticket.tagged_action_at).toLocaleString()}</p>
            )}
          </div>

          {/* HR */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> HR Decision
            </h3>
            {ticket.hr_action_by_name ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ticket.hr_action_by_name}</p>
                    <p className="text-xs text-gray-500">{ticket.hr_action_at && new Date(ticket.hr_action_at).toLocaleString()}</p>
                  </div>
                  <StatusBadge
                    status={
                      ticket.hr_status === 'approved' ? 'hr_approved' :
                      ticket.hr_status === 'rejected' ? 'hr_rejected' : 'open'
                    }
                  />
                </div>
                {ticket.hr_remarks && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                    <span className="font-medium">Remarks:</span> {ticket.hr_remarks}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">Awaiting HR action</p>
            )}
          </div>
        </div>

        {/* ── Activity Log ── */}
        {logs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Activity Log
            </h3>
            <div className="relative">
              <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 relative">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ring-2 ring-white ${
                      log.action.includes('approved') ? 'bg-green-500' :
                      log.action.includes('rejected') ? 'bg-red-500' :
                      log.action === 'created' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{log.action_by_name}</span>
                        <span className="text-gray-400 text-xs ml-1">({log.action_by_role})</span>
                        {' — '}
                        <span className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</span>
                      </p>
                      {log.remarks && <p className="text-xs text-gray-500 mt-0.5">&ldquo;{log.remarks}&rdquo;</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Action Panel ── */}
        {(canTaggedAct || canHRAct) && (
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-indigo-800 mb-3">
              {canTaggedAct ? 'Your Review (Tagged Person)' : 'HR Final Decision'}
            </h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add remarks (optional)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleAction('rejected')}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => handleAction('approved')}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// Main Page Component
// ══════════════════════════════════════════════════════════════
const AttendanceCorrectionPage = () => {
  const { user, role } = useAuth();
  const currentEmployeeId = user?.employeeId || user?.employee_id || user?.id;
  const isHR = role === 'hr' || role === 'admin';

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState(isHR ? 'attendance-corrections' : 'corrections');

  // View state: 'list' or 'detail'
  const [view, setView] = useState('list');
  const [activeTab, setActiveTab] = useState('my');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [counts, setCounts] = useState({ my_open: 0, tagged_pending: 0, hr_pending: 0 });
  const [isFileSliderOpen, setIsFileSliderOpen] = useState(false);

  // Render the appropriate sidebar based on role
  const renderSidebar = () => {
    if (isHR) {
      return (
        <HrSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />
      );
    }
    return (
      <EmployeeSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />
    );
  };

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch(endpoints.attendanceCorrections.counts, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setCounts(data.data);
    } catch (err) {
      console.error('Failed to fetch counts:', err);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      let url;
      if (activeTab === 'my') {
        url = `${endpoints.attendanceCorrections.my}?status=${statusFilter}`;
      } else if (activeTab === 'tagged') {
        url = `${endpoints.attendanceCorrections.tagged}?status=${statusFilter === 'all' ? '' : statusFilter === 'open' ? 'pending' : 'reviewed'}`;
      } else {
        url = `${endpoints.attendanceCorrections.all}?status=${statusFilter}`;
      }
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setTickets(data.data || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      toast.error('Failed to load correction tickets');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    fetchTickets();
    fetchCounts();
  }, [fetchTickets, fetchCounts]);

  const handleTaggedAction = async (ticketId, action, remarks) => {
    try {
      const res = await fetch(endpoints.attendanceCorrections.taggedAction(ticketId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, remarks }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); fetchTickets(); fetchCounts(); }
      else toast.error(data.message);
    } catch { toast.error('Failed to process action'); }
  };

  const handleHRAction = async (ticketId, action, remarks) => {
    try {
      const res = await fetch(endpoints.attendanceCorrections.hrAction(ticketId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, remarks }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); fetchTickets(); fetchCounts(); }
      else toast.error(data.message);
    } catch { toast.error('Failed to process action'); }
  };

  const handleAction = activeTab === 'tagged' ? handleTaggedAction : handleHRAction;

  const openDetail = (ticket) => {
    setSelectedTicket(ticket);
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setSelectedTicket(null);
    fetchTickets();
    fetchCounts();
  };

  // ────────────────────────────────────────────────────────────
  // DETAIL VIEW (replaces the list, like HrAttendancePage)
  // ────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedTicket) {
    return (
      <>
        <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 animate-slideIn">
          <style>{`
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            @keyframes slideOutLeft {
              from {
                opacity: 1;
                transform: translateX(0);
              }
              to {
                opacity: 0;
                transform: translateX(-50px);
              }
            }
            .animate-slideIn {
              animation: slideInRight 0.3s ease-out;
            }
          `}</style>
          {renderSidebar()}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader
              title="Attendance Corrections"
              subtitle="Ticket Detail"
            />
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <h3 className="text-sm font-semibold text-gray-700">Quick Actions</h3>
                <button
                  onClick={() => {
                    console.log('Opening files slider...');
                    setIsFileSliderOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white border-0 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
                >
                  <Paperclip className="w-4 h-4" />
                  View Files
                </button>
              </div>
              <TicketDetailView
                ticket={selectedTicket}
                onBack={backToList}
                onAction={handleAction}
                userRole={role}
                currentEmployeeId={currentEmployeeId}
              />
            </div>
          </div>
        </div>
        <FileSliderPanel
          isOpen={isFileSliderOpen}
          onClose={() => setIsFileSliderOpen(false)}
          ticket={selectedTicket}
        />
      </>
    );
  }

  // ────────────────────────────────────────────────────────────
  // LIST VIEW (table layout)
  // ────────────────────────────────────────────────────────────
  return (
    <>
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 animate-slideInList">
      <style>{`
        @keyframes slideInListView {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInList {
          animation: slideInListView 0.3s ease-out;
        }
      `}</style>
      {renderSidebar()}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="Attendance Corrections"
          subtitle="Review and manage attendance correction requests"
        />

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => { setActiveTab('my'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'my' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              My Requests
              {counts.my_open > 0 && (
                <span className="bg-blue-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">{counts.my_open}</span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('tagged'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'tagged' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Tag className="w-4 h-4" />
              Tagged to Me
              {counts.tagged_pending > 0 && (
                <span className="bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">{counts.tagged_pending}</span>
              )}
            </button>
            {isHR && (
              <button
                onClick={() => { setActiveTab('hr'); setStatusFilter('all'); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'hr' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                HR Approvals
                {counts.hr_pending > 0 && (
                  <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">{counts.hr_pending}</span>
                )}
              </button>
            )}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              {['all', 'open', 'tagged_approved', 'tagged_rejected', 'hr_approved', 'hr_rejected', 'applied'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
            <button
              onClick={() => { fetchTickets(); fetchCounts(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-500">No correction tickets found</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {activeTab === 'my'
                    ? "You haven't submitted any correction requests yet."
                    : activeTab === 'tagged'
                    ? 'No correction requests are tagged to you.'
                    : 'No correction tickets to review.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket #</th>
                      {activeTab !== 'my' && (
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                      )}
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Original</th>
                      <th className="text-center px-2 py-3"></th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Corrected</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reviewer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">HR</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tickets.map((t) => {
                      const correctedParts = [];
                      if (t.corrected_check_in) correctedParts.push(`In: ${t.corrected_check_in}`);
                      if (t.corrected_check_out) correctedParts.push(`Out: ${t.corrected_check_out}`);
                      if (t.corrected_status) correctedParts.push(t.corrected_status);

                      const originalParts = [];
                      if (t.original_check_in) originalParts.push(`In: ${t.original_check_in}`);
                      if (t.original_check_out) originalParts.push(`Out: ${t.original_check_out}`);
                      if (t.original_status) originalParts.push(t.original_status);

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-indigo-50 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-sm"
                          onClick={() => openDetail(t)}
                        >
                          <td className="px-4 py-3">
                            <span className="font-semibold text-indigo-700">{t.ticket_number}</span>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </td>
                          {activeTab !== 'my' && (
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 text-xs">{t.employee_name}</p>
                            </td>
                          )}
                          <td className="px-4 py-3 text-gray-700">
                            {parseDate(t.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-700 space-y-0.5">
                              {originalParts.length > 0
                                ? originalParts.map((p, i) => <div key={i}>{p}</div>)
                                : <span className="text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center">
                            {correctedParts.length > 0 && <ArrowRight className="w-3.5 h-3.5 text-gray-400 mx-auto" />}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-medium text-green-700 space-y-0.5">
                              {correctedParts.length > 0
                                ? correctedParts.map((p, i) => <div key={i}>{p}</div>)
                                : <span className="text-gray-400">No change</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <p className="text-gray-800 font-medium">{t.tagged_employee_name}</p>
                              <p className={`text-[11px] font-semibold ${
                                t.tagged_status === 'approved' ? 'text-green-600' :
                                t.tagged_status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {t.tagged_status}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${
                              t.hr_status === 'approved' ? 'text-green-600' :
                              t.hr_status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {t.hr_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={t.overall_status} />
                          </td>
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => openDetail(t)}
                              className="p-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-indigo-500" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default AttendanceCorrectionPage;
