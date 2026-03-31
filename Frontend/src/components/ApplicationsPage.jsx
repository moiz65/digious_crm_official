import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Plus,
  AlertTriangle,
  ChevronRight,
  Send,
  Search,
  Inbox,
  CornerDownRight,
} from 'lucide-react';

// ─── Department → Application Types mapping ──────────────────
const DEPARTMENT_TYPES = {
  'Human Resources': [
    'Remote Work Request', 'Overtime Request', 'Resignation Letter',
    'Promotion Request', 'Transfer Request', 'Salary Revision',
    'Grievance Report', 'Other',
  ],
  'Finance': [
    'Expense Reimbursement', 'Advance Salary Request', 'Loan Request',
    'Invoice Approval', 'Budget Request', 'Payment Request',
    'Tax Query', 'Audit Request', 'Other',
  ],
  'Operations': [
    'Equipment Request', 'Vehicle Request', 'Maintenance Request',
    'Safety Report', 'Inventory Request', 'Site Visit Request',
    'Report Submission', 'Vendor Request', 'Other',
  ],
  'Administration': [
    'Travel Request', 'Stationery Request', 'Office Supplies',
    'Meeting Room Booking', 'Visitor Pass', 'Other',
  ],
  'IT Support': [
    'Hardware Request', 'Software Request', 'Access Request',
    'Technical Support', 'System Maintenance', 'Other',
  ],
  'Facilities': [
    'Maintenance Request', 'Repair Request', 'Cleaning Request',
    'Security Request', 'Other',
  ],
  'Sales': [
    'Sales Report', 'Client Visit Request', 'Target Revision',
    'Discount Approval', 'Material Request', 'Other',
  ],
  'Productions': [
    'Raw Material Request', 'Machine Maintenance', 'Production Report',
    'Quality Report', 'Shift Change Request', 'Other',
  ],
};

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

// ─── Helper: format date ─────────────────────────────────────
const fmtDate = (dateStr, opts) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Status Badge ────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    withdrawn: 'bg-gray-100 text-gray-600 border-gray-300',
  };
  const labels = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── Priority Badge ──────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const styles = {
    low: 'bg-gray-100 text-gray-700 border-gray-300',
    medium: 'bg-blue-100 text-blue-700 border-blue-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    urgent: 'bg-red-100 text-red-700 border-red-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap capitalize ${styles[priority] || 'bg-gray-100 text-gray-600'}`}>
      {priority === 'urgent' && '⚠ '}{priority || 'medium'}
    </span>
  );
};

// ─── Assignee Chain Visual ───────────────────────────────────
const AssigneeChain = ({ assignees, currentStep, totalSteps }) => {
  if (!assignees || assignees.length === 0) return <span className="text-xs text-gray-400">No assignees</span>;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assignees.map((a, i) => {
        const isDone = a.status === 'approved';
        const isRejected = a.status === 'rejected';
        const isCurrent = a.step_order === currentStep;
        const isSkipped = a.status === 'skipped';

        let dotColor = 'bg-gray-300';
        if (isDone) dotColor = 'bg-green-500';
        if (isRejected) dotColor = 'bg-red-500';
        if (isCurrent && !isDone && !isRejected) dotColor = 'bg-blue-500 ring-2 ring-blue-200';
        if (isSkipped) dotColor = 'bg-gray-300';

        return (
          <React.Fragment key={a.employee_id || i}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />}
            <div className="flex items-center gap-1" title={`Step ${a.step_order}: ${a.employee_name} — ${a.status}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
              <span className={`text-xs truncate max-w-[80px] ${
                isCurrent && !isDone && !isRejected ? 'font-bold text-blue-700' :
                isDone ? 'text-green-700 line-through' :
                isRejected ? 'text-red-700 line-through' :
                isSkipped ? 'text-gray-400 line-through' : 'text-gray-600'
              }`}>
                {a.employee_name?.split(' ')[0]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
      {/* HR final indicator for non-HR apps */}
      {currentStep > totalSteps && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-purple-200 flex-shrink-0" />
            <span className="text-xs font-bold text-purple-700">HR Final</span>
          </div>
        </>
      )}
    </div>
  );
};


// ══════════════════════════════════════════════════════════════
// Application Detail View
// ══════════════════════════════════════════════════════════════
const ApplicationDetailView = ({ application, onBack, onApprove, onReject, onWithdraw, isHR, currentEmployeeId }) => {
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [detail, setDetail] = useState(application);

  useEffect(() => {
    if (application) {
      setRemarks('');
      fetchDetail();
      fetchLogs();
      fetchAssignees();
    }
  }, [application]);

  const fetchDetail = async () => {
    try {
      const res = await fetch(endpoints.applications.getById(application.id), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setDetail(data.data);
        if (data.data.assignees) setAssignees(data.data.assignees);
      }
    } catch (err) {
      console.error('Failed to fetch application detail:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(endpoints.applications.approvalLog(application.id), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch approval log:', err);
    }
  };

  const fetchAssignees = async () => {
    try {
      const res = await fetch(endpoints.applications.assignees(application.id), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setAssignees(data.data || []);
    } catch (err) {
      console.error('Failed to fetch assignees:', err);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await onApprove(application.id, remarks);
      onBack();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setActionLoading(true);
    try {
      await onReject(application.id, remarks);
      onBack();
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setActionLoading(true);
    try {
      await onWithdraw(application.id);
      onBack();
    } finally {
      setActionLoading(false);
    }
  };

  if (!detail) return null;

  const app = detail;

  // Determine if current user can act
  const isOwner = String(app.employee_id) === String(currentEmployeeId);
  const canWithdraw = isOwner && (app.status === 'pending' || app.status === 'in-progress');

  // Check if it's current user's turn as assignee
  const currentAssignee = assignees.find(
    a => a.step_order === app.current_step && String(a.employee_id) === String(currentEmployeeId)
  );
  const isMyTurn = !!currentAssignee && app.status !== 'approved' && app.status !== 'rejected' && app.status !== 'withdrawn';

  // HR final approval: when chain is complete and HR needs to give final approval
  const isHrDepartment = app.department === 'HR' || app.department === 'Human Resources';
  const awaitingHrFinal = isHR && !isHrDepartment && app.current_step > app.total_steps
    && app.status !== 'approved' && app.status !== 'rejected' && app.status !== 'withdrawn';

  const canAct = isMyTurn || awaitingHrFinal;

  return (
    <div>
      {/* Header with back button */}
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
              {app.employee_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {app.application_number || `#${app.id}`}
                <StatusBadge status={app.status} />
                <PriorityBadge priority={app.priority} />
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {app.employee_name} &bull; {app.department} &bull; {app.application_type}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Application Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Application Details</h3>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Department</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{app.department}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Application Type</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{app.application_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Priority</p>
              <p className="mt-0.5"><PriorityBadge priority={app.priority} /></p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Submitted On</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {fmtDate(app.created_at, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          {/* Metadata (leave dates etc.) */}
          {app.metadata && (() => {
            try {
              const meta = typeof app.metadata === 'string' ? JSON.parse(app.metadata) : app.metadata;
              if (meta && Object.keys(meta).length > 0) {
                return (
                  <div className="px-5 pb-4 pt-0">
                    <div className="flex flex-wrap gap-4">
                      {meta.start_date && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">From</p>
                          <p className="text-sm font-bold text-gray-900">{fmtDate(meta.start_date)}</p>
                        </div>
                      )}
                      {meta.end_date && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">To</p>
                          <p className="text-sm font-bold text-gray-900">{fmtDate(meta.end_date)}</p>
                        </div>
                      )}
                      {meta.total_days && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Days</p>
                          <p className="text-sm font-bold text-gray-900">{meta.total_days}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            } catch { /* ignore */ }
            return null;
          })()}
        </div>

        {/* Subject & Description */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Subject & Description
          </h3>
          <h4 className="text-base font-bold text-gray-900 mb-2">{app.subject}</h4>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{app.description}</p>
        </div>

        {/* Approval Chain */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <CornerDownRight className="w-4 h-4" /> Approval Chain
            <span className="text-xs text-gray-400 font-normal ml-auto">
              Step {Math.min(app.current_step, app.total_steps)} of {app.total_steps}
              {app.current_step > app.total_steps && !isHrDepartment && ' + HR Final'}
            </span>
          </h3>
          <div className="space-y-3">
            {assignees.map((a, i) => {
              const isDone = a.status === 'approved';
              const isRejected = a.status === 'rejected';
              const isCurrent = a.step_order === app.current_step && app.status !== 'approved' && app.status !== 'rejected' && app.status !== 'withdrawn';
              const isSkipped = a.status === 'skipped';

              return (
                <div key={a.employee_id || i} className={`flex items-start gap-4 p-3 rounded-xl border ${
                  isCurrent ? 'border-blue-300 bg-blue-50' :
                  isDone ? 'border-green-200 bg-green-50/50' :
                  isRejected ? 'border-red-200 bg-red-50/50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isDone ? 'bg-green-500 text-white' :
                    isRejected ? 'bg-red-500 text-white' :
                    isCurrent ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> :
                     isRejected ? <XCircle className="w-4 h-4" /> :
                     a.step_order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{a.employee_name}</p>
                      <span className={`text-[11px] font-semibold capitalize ${
                        isDone ? 'text-green-600' : isRejected ? 'text-red-600' :
                        isCurrent ? 'text-blue-600' : isSkipped ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {a.status || 'pending'}
                      </span>
                    </div>
                    {a.designation && (
                      <p className="text-xs text-gray-500">{a.designation}{a.emp_department ? ` • ${a.emp_department}` : ''}</p>
                    )}
                    {a.notes && <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{a.notes}&rdquo;</p>}
                    {a.action_date && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{new Date(a.action_date).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {/* HR Final step placeholder for non-HR apps */}
            {!isHrDepartment && app.total_steps > 0 && (
              <div className={`flex items-start gap-4 p-3 rounded-xl border ${
                awaitingHrFinal ? 'border-purple-300 bg-purple-50' :
                app.status === 'approved' && app.approved_by ? 'border-green-200 bg-green-50/50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  app.status === 'approved' ? 'bg-green-500 text-white' :
                  awaitingHrFinal ? 'bg-purple-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">HR Final Approval</p>
                    <span className={`text-[11px] font-semibold ${
                      app.status === 'approved' ? 'text-green-600' :
                      awaitingHrFinal ? 'text-purple-600' : 'text-gray-400'
                    }`}>
                      {app.status === 'approved' ? 'Approved' :
                       awaitingHrFinal ? 'Awaiting' :
                       app.status === 'rejected' ? 'Skipped' : 'Waiting'}
                    </span>
                  </div>
                  {app.approved_by && (
                    <p className="text-xs text-gray-500">
                      Approved by {app.approved_by}
                      {app.approved_date && ` on ${fmtDate(app.approved_date)}`}
                    </p>
                  )}
                  {app.approval_notes && (
                    <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{app.approval_notes}&rdquo;</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rejection Reason (if rejected) */}
        {app.status === 'rejected' && app.rejection_reason && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">Application Rejected</p>
                <p className="text-sm text-red-700 mt-1">{app.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Approval Success (if approved) */}
        {app.status === 'approved' && (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">Application Approved</p>
                {app.approved_by && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Approved by {app.approved_by}
                    {app.approved_date && ` on ${fmtDate(app.approved_date, { month: 'long', day: 'numeric', year: 'numeric' })}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Log */}
        {logs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Activity Log
            </h3>
            <div className="relative">
              <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {logs.map((log, i) => (
                  <div key={log.id || i} className="flex items-start gap-4 relative">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ring-2 ring-white ${
                      log.action === 'approved' ? 'bg-green-500' :
                      log.action === 'rejected' ? 'bg-red-500' :
                      log.action === 'created' ? 'bg-blue-500' :
                      log.action === 'forwarded' ? 'bg-purple-500' :
                      log.action === 'withdrawn' ? 'bg-gray-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{log.employee_name}</span>
                        {log.designation && <span className="text-gray-400 text-xs ml-1">({log.designation})</span>}
                        {' — '}
                        <span className="font-medium capitalize">{log.action}</span>
                        {log.step_order && <span className="text-gray-400 text-xs ml-1">(Step {log.step_order})</span>}
                      </p>
                      {log.notes && <p className="text-xs text-gray-500 mt-0.5">&ldquo;{log.notes}&rdquo;</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">{new Date(log.action_date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Owner: Withdraw button */}
        {canWithdraw && (
          <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-orange-800 mb-3">Withdraw Application</h3>
            <p className="text-sm text-gray-600 mb-4">You can withdraw this application if you no longer need it to be reviewed.</p>
            <div className="flex justify-end">
              <button
                onClick={handleWithdraw}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>
        )}

        {/* Assigned / HR: Approve / Reject panel */}
        {canAct && (
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-indigo-800 mb-3">
              {awaitingHrFinal ? 'HR Final Approval' : `Your Review (Step ${app.current_step})`}
            </h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add notes (required for rejection)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={handleApprove}
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
// Create Application Form
// ══════════════════════════════════════════════════════════════
const CreateApplicationForm = ({ onSubmit, onCancel, submitting }) => {
  const [department, setDepartment] = useState('');
  const [applicationType, setApplicationType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  // Multi-assignee
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  const availableTypes = department ? (DEPARTMENT_TYPES[department] || []) : [];

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchAssignees = (query) => {
    setAssigneeSearch(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${endpoints.applications.searchEmployees}?q=${encodeURIComponent(query)}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          // Filter out already selected
          const selectedIds = selectedAssignees.map(a => String(a.employee_id));
          setSearchResults((data.data || []).filter(e => !selectedIds.includes(String(e.employee_id))));
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const addAssignee = (emp) => {
    setSelectedAssignees(prev => [...prev, {
      employee_id: emp.employee_id,
      employee_name: emp.employee_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      designation: emp.designation || '',
      department: emp.department || '',
    }]);
    setAssigneeSearch('');
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const removeAssignee = (empId) => {
    setSelectedAssignees(prev => prev.filter(a => String(a.employee_id) !== String(empId)));
  };

  const moveAssignee = (index, direction) => {
    const arr = [...selectedAssignees];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setSelectedAssignees(arr);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!department) { toast.error('Please select a department'); return; }
    if (!applicationType) { toast.error('Please select an application type'); return; }
    if (!subject.trim()) { toast.error('Please enter a subject'); return; }
    if (!description.trim()) { toast.error('Please enter a description'); return; }
    if (selectedAssignees.length === 0) { toast.error('Please add at least one assignee'); return; }

    onSubmit({
      department,
      application_type: applicationType,
      subject,
      description,
      priority,
      assignees: selectedAssignees.map((a, i) => ({
        employee_id: a.employee_id,
        employee_name: a.employee_name,
        step_order: i + 1,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Department */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
        <select
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setApplicationType(''); }}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="">Select Department</option>
          {Object.keys(DEPARTMENT_TYPES).map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Application Type */}
      {department && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Application Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableTypes.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setApplicationType(type)}
                className={`px-3 py-2.5 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                  applicationType === type
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief subject line..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Provide details about your application..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                priority === p
                  ? p === 'urgent' ? 'border-red-500 bg-red-50 text-red-700' :
                    p === 'high' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                    p === 'medium' ? 'border-blue-500 bg-blue-50 text-blue-700' :
                    'border-gray-500 bg-gray-50 text-gray-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Assignees (Multi-step approval chain) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Assignees (Approval Chain)
          <span className="text-xs text-gray-400 font-normal ml-2">Order matters — step 1 reviews first</span>
        </label>

        {/* Selected assignees */}
        {selectedAssignees.length > 0 && (
          <div className="space-y-2 mb-3">
            {selectedAssignees.map((a, i) => (
              <div key={a.employee_id} className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-800 truncate">{a.employee_name}</p>
                  {a.designation && <p className="text-xs text-indigo-500 truncate">{a.designation}{a.department ? ` • ${a.department}` : ''}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => moveAssignee(i, -1)} disabled={i === 0}
                    className="p-1 rounded hover:bg-indigo-200 disabled:opacity-30 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                  </button>
                  <button type="button" onClick={() => moveAssignee(i, 1)} disabled={i === selectedAssignees.length - 1}
                    className="p-1 rounded hover:bg-indigo-200 disabled:opacity-30 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                  </button>
                  <button type="button" onClick={() => removeAssignee(a.employee_id)}
                    className="p-1 rounded hover:bg-red-200 transition-colors ml-1">
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search box */}
        <div ref={searchRef} className="relative">
          <div className="relative">
            <input
              type="text"
              value={assigneeSearch}
              onChange={(e) => {
                handleSearchAssignees(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => { if (assigneeSearch.length >= 2) setShowSuggestions(true); }}
              placeholder="Search employee by name (min 2 characters)..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white pr-10"
            />
            {searching ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            )}
          </div>

          {/* Suggestion dropdown */}
          {showSuggestions && assigneeSearch.length >= 2 && (
            <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
              {searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  {searching ? 'Searching...' : 'No employees found'}
                </div>
              ) : (
                searchResults.map((emp) => (
                  <button
                    key={emp.employee_id}
                    type="button"
                    onClick={() => addAssignee(emp)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {(emp.employee_name || emp.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{emp.employee_name || emp.name}</p>
                      <p className="text-xs text-gray-500 truncate">{emp.designation || ''}{emp.department ? ` • ${emp.department}` : ''}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  );
};


// ══════════════════════════════════════════════════════════════
// Main Page Component
// ══════════════════════════════════════════════════════════════
const ApplicationsPage = () => {
  const { user, role } = useAuth();
  const currentEmployeeId = user?.employeeId || user?.employee_id || user?.id;
  const isHR = role === 'hr' || role === 'admin';

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState(isHR ? 'applicationmemos' : 'applications');

  // Views: 'list' | 'detail' | 'create'
  const [view, setView] = useState('list');
  const [activeTab, setActiveTab] = useState('my');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  // ── Fetch applications ────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      let url;
      if (activeTab === 'my') {
        url = endpoints.applications.getByEmployee(currentEmployeeId);
      } else if (activeTab === 'assigned') {
        url = endpoints.applications.assignedToMe;
      } else {
        // HR All view
        url = endpoints.applications.getAll;
      }

      // Add status filter query param
      const separator = url.includes('?') ? '&' : '?';
      const filterParam = statusFilter !== 'all' ? `${separator}status=${statusFilter}` : '';

      const res = await fetch(`${url}${filterParam}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data || []);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      toast.error('Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, currentEmployeeId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ── Actions ───────────────────────────────────────────────
  const handleApprove = async (appId, notes) => {
    try {
      const res = await fetch(endpoints.applications.approve(appId), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ approval_notes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Application approved');
        fetchApplications();
      } else {
        toast.error(data.message || 'Failed to approve');
      }
    } catch {
      toast.error('Failed to approve application');
    }
  };

  const handleReject = async (appId, reason) => {
    try {
      const res = await fetch(endpoints.applications.reject(appId), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejection_reason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Application rejected');
        fetchApplications();
      } else {
        toast.error(data.message || 'Failed to reject');
      }
    } catch {
      toast.error('Failed to reject application');
    }
  };

  const handleWithdraw = async (appId) => {
    try {
      const res = await fetch(endpoints.applications.withdraw(appId), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Application withdrawn');
        fetchApplications();
      } else {
        toast.error(data.message || 'Failed to withdraw');
      }
    } catch {
      toast.error('Failed to withdraw application');
    }
  };

  const handleCreate = async (formData) => {
    setSubmitting(true);
    try {
      const res = await fetch(endpoints.applications.create, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Application submitted');
        setView('list');
        fetchApplications();
      } else {
        toast.error(data.message || 'Failed to submit application');
      }
    } catch {
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (app) => {
    setSelectedApp(app);
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setSelectedApp(null);
    fetchApplications();
  };

  // ────────────────────────────────────────────────────────────
  // DETAIL VIEW (replaces the list - early return pattern)
  // ────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedApp) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 animate-slideIn">
        <style>{`
          @keyframes slideInRight { from { opacity:0; transform:translateX(50px); } to { opacity:1; transform:translateX(0); } }
          .animate-slideIn { animation: slideInRight 0.3s ease-out; }
        `}</style>
        {renderSidebar()}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader title="Applications" subtitle="Application Detail" />
          <div className="flex-1 overflow-y-auto">
            <ApplicationDetailView
              application={selectedApp}
              onBack={backToList}
              onApprove={handleApprove}
              onReject={handleReject}
              onWithdraw={handleWithdraw}
              isHR={isHR}
              currentEmployeeId={currentEmployeeId}
            />
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // CREATE VIEW (early return)
  // ────────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 animate-slideIn">
        <style>{`
          @keyframes slideInRight { from { opacity:0; transform:translateX(50px); } to { opacity:1; transform:translateX(0); } }
          .animate-slideIn { animation: slideInRight 0.3s ease-out; }
        `}</style>
        {renderSidebar()}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader title="Applications" subtitle="New Application" />
          <div className="flex-1 overflow-y-auto">
            <CreateApplicationForm
              onSubmit={handleCreate}
              onCancel={() => setView('list')}
              submitting={submitting}
            />
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // LIST VIEW
  // ────────────────────────────────────────────────────────────
  const STATUS_FILTERS = ['all', 'pending', 'in-progress', 'approved', 'rejected', 'withdrawn'];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 animate-slideInList">
      <style>{`
        @keyframes slideInListView { from { opacity:0; transform:translateX(-30px); } to { opacity:1; transform:translateX(0); } }
        .animate-slideInList { animation: slideInListView 0.3s ease-out; }
      `}</style>
      {renderSidebar()}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="Applications"
          subtitle="Submit and track your applications"
        />

        {/* Sub‑Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => { setActiveTab('my'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'my' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              My Applications
            </button>
            <button
              onClick={() => { setActiveTab('assigned'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'assigned' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Tag className="w-4 h-4" />
              Assigned to Me
            </button>
            {isHR && (
              <button
                onClick={() => { setActiveTab('all'); setStatusFilter('all'); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                All Applications
              </button>
            )}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters + Actions */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {s === 'all' ? 'All' : s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchApplications}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button
                onClick={() => setView('create')}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> New Application
              </button>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-7 w-7 border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : applications.length === 0 ? (
              <div className="py-16 text-center">
                <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-500">No applications found</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {activeTab === 'my'
                    ? "You haven't submitted any applications yet."
                    : activeTab === 'assigned'
                    ? 'No applications are assigned to you.'
                    : 'No applications to review.'}
                </p>
                {activeTab === 'my' && (
                  <button
                    onClick={() => setView('create')}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create Application
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">App #</th>
                      {activeTab !== 'my' && (
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                      )}
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignees</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-indigo-50 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-sm"
                        onClick={() => openDetail(app)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold text-indigo-700">{app.application_number || `#${app.id}`}</span>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {fmtDate(app.created_at, { month: 'short', day: 'numeric' })}
                          </p>
                        </td>
                        {activeTab !== 'my' && (
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 text-xs">{app.employee_name}</p>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-700">{app.department}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-700 font-medium">{app.application_type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-900 font-medium truncate max-w-[180px]">{app.subject}</p>
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={app.priority} />
                        </td>
                        <td className="px-4 py-3">
                          {app.assignees ? (
                            <AssigneeChain
                              assignees={app.assignees}
                              currentStep={app.current_step}
                              totalSteps={app.total_steps}
                            />
                          ) : (
                            <span className="text-xs text-gray-500">{app.assigned_to || '—'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openDetail(app)}
                            className="p-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-indigo-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ApplicationsPage;
