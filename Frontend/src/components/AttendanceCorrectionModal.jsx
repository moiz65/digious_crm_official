import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { endpoints, getAuthHeaders } from '../config/api';
import {
  X,
  Edit3,
  Clock,
  Calendar,
  User,
  Search,
  CheckCircle,
  AlertCircle,
  Send,
  ArrowRight,
} from 'lucide-react';

// ─── Correction Modal ─────────────────────────────────────────
// Shown when employee clicks "Correct" on an attendance row
const AttendanceCorrectionModal = ({ isOpen, onClose, record, onSubmitted }) => {
  const { user } = useAuth();

  // Corrected values
  const [correctedCheckIn, setCorrectedCheckIn] = useState('');
  const [correctedCheckOut, setCorrectedCheckOut] = useState('');
  const [correctedStatus, setCorrectedStatus] = useState('');
  const [reason, setReason] = useState('');

  // Tag person
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedTagPerson, setSelectedTagPerson] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // We populate original values from the record
  useEffect(() => {
    if (record) {
      setCorrectedCheckIn(record.check_in_time || '');
      setCorrectedCheckOut(record.check_out_time || '');
      setCorrectedStatus(record.status || '');
      setReason('');
      setSelectedTagPerson(null);
      setEmployeeSearch('');
    }
  }, [record]);

  // Fetch employee list for tagging
  useEffect(() => {
    if (!isOpen) return;
    const fetchEmployees = async () => {
      try {
        const res = await fetch(endpoints.employees.base, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success || Array.isArray(data)) {
          const list = Array.isArray(data) ? data : (data.data || data.employees || []);
          // Filter out the current user
          const currentEmpId = user?.employeeId || user?.employee_id || user?.id;
          setEmployees(list.filter(e => e.id !== currentEmpId));
        }
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      }
    };
    fetchEmployees();
  }, [isOpen, user]);

  const filteredEmployees = employees.filter(e =>
    (e.name || '').toLowerCase().includes(employeeSearch.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(employeeSearch.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the correction');
      return;
    }
    if (!selectedTagPerson) {
      toast.error('Please tag a person for approval');
      return;
    }

    // Check if anything actually changed
    const hasCheckInChange = correctedCheckIn !== (record.check_in_time || '');
    const hasCheckOutChange = correctedCheckOut !== (record.check_out_time || '');
    const hasStatusChange = correctedStatus !== (record.status || '');

    if (!hasCheckInChange && !hasCheckOutChange && !hasStatusChange) {
      toast.error('No changes detected. Please modify at least one field.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        attendance_id: record.id || null,
        attendance_date: normAttendanceDate(record.attendance_date),
        original_check_in: record.check_in_time || null,
        original_check_out: record.check_out_time || null,
        original_status: record.status || null,
        original_working_minutes: record.net_working_time_minutes || null,
        original_break_minutes: record.total_break_duration_minutes || null,
        original_late_minutes: record.late_by_minutes || null,
        original_overtime_minutes: record.overtime_minutes || null,
        corrected_check_in: hasCheckInChange ? correctedCheckIn : null,
        corrected_check_out: hasCheckOutChange ? correctedCheckOut : null,
        corrected_status: hasStatusChange ? correctedStatus : null,
        reason: reason.trim(),
        tagged_employee_id: selectedTagPerson.id,
        tagged_employee_name: selectedTagPerson.name,
        tagged_employee_email: selectedTagPerson.email,
      };

      const res = await fetch(endpoints.attendanceCorrections.create, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Correction ticket ${data.data.ticket_number} created!`);
        onSubmitted && onSubmitted();
        onClose();
      } else {
        toast.error(data.message || 'Failed to create correction ticket');
      }
    } catch (err) {
      console.error('Error creating correction:', err);
      toast.error('Failed to create correction ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !record) return null;

  const parseDate = (dateStr) => {
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      // Strip the time portion (e.g. 'T19:00:00.000Z') before splitting
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  };

  // Produces a clean 'YYYY-MM-DD' string from an attendance_date that may
  // arrive as a full ISO timestamp ('2026-03-25T19:00:00.000Z' on UTC+5).
  const normAttendanceDate = (dateStr) => {
    if (!dateStr) return dateStr;
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      return dateStr.split('T')[0]; // keep only the local-date portion
    }
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const statusOptions = ['Present', 'Late', 'Absent', 'On Leave', 'Half Day', 'Paid Leave'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-bold">Correct Attendance</h2>
              <p className="text-blue-100 text-sm">
                {parseDate(record.attendance_date).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Attendance Data */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Record</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500">Check In</p>
                <p className="text-sm font-bold text-gray-800">{record.check_in_time || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500">Check Out</p>
                <p className="text-sm font-bold text-gray-800">{record.check_out_time || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500">Status</p>
                <p className={`text-sm font-bold ${
                  record.status === 'Present' ? 'text-green-600' :
                  record.status === 'Late' ? 'text-orange-600' :
                  record.status === 'Absent' ? 'text-red-600' : 'text-gray-800'
                }`}>{record.status || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500">Working Hours</p>
                <p className="text-sm font-bold text-gray-800">
                  {record.net_working_time_minutes
                    ? `${Math.floor(record.net_working_time_minutes / 60)}h ${record.net_working_time_minutes % 60}m`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Correction Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <ArrowRight className="w-4 h-4" /> Corrected Values
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" /> Check In Time
                </label>
                <input
                  type="time"
                  step="1"
                  value={correctedCheckIn}
                  onChange={(e) => setCorrectedCheckIn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" /> Check Out Time
                </label>
                <input
                  type="time"
                  step="1"
                  value={correctedCheckOut}
                  onChange={(e) => setCorrectedCheckOut(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={correctedStatus}
                onChange={(e) => setCorrectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Change Summary */}
          {(() => {
            const changes = [];
            if (correctedCheckIn !== (record.check_in_time || ''))
              changes.push({ field: 'Check In', from: record.check_in_time || 'N/A', to: correctedCheckIn || 'N/A' });
            if (correctedCheckOut !== (record.check_out_time || ''))
              changes.push({ field: 'Check Out', from: record.check_out_time || 'N/A', to: correctedCheckOut || 'N/A' });
            if (correctedStatus !== (record.status || ''))
              changes.push({ field: 'Status', from: record.status || 'N/A', to: correctedStatus || 'N/A' });

            return changes.length > 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Changes Summary</h3>
                <div className="space-y-2">
                  {changes.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-blue-700 w-24">{c.field}:</span>
                      <span className="text-red-600 line-through">{c.from}</span>
                      <ArrowRight className="w-3 h-3 text-blue-500" />
                      <span className="text-green-600 font-semibold">{c.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <AlertCircle className="w-4 h-4 inline mr-1" /> Reason for Correction *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this correction is needed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Tag Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" /> Tag Person for Approval *
            </label>

            {selectedTagPerson ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">{selectedTagPerson.name}</p>
                    <p className="text-xs text-green-600">{selectedTagPerson.email} • {selectedTagPerson.department}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedTagPerson(null); setEmployeeSearch(''); }}
                  className="text-green-600 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <Search className="w-4 h-4 text-gray-400 ml-3" />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => { setEmployeeSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search employees by name, email, or department..."
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                {showDropdown && employeeSearch.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredEmployees.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500">No employees found</p>
                    ) : (
                      filteredEmployees.slice(0, 10).map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            setSelectedTagPerson(emp);
                            setShowDropdown(false);
                            setEmployeeSearch('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                            {(emp.name || '?')[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.email} • {emp.department}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Correction
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCorrectionModal;
