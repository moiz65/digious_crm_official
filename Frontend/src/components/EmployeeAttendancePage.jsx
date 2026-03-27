import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DashboardHeader } from './DashboardComponents';
import { useAuth } from '../context/AuthContext';
import { endpoints } from '../config/api';
import { getPakistanDate } from '../utils/timezone';
import {
  CheckCircle,
  Clock,
  LogIn,
  LogOut,
  User,
  Activity,
  AlertCircle,
  Timer,
  PauseCircle,
  Utensils,
  Cigarette,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Constants
const SHIFT_START = 21 * 60; // 21:00 (9 PM)
const OVERLAP_START = 9 * 60; // 09:00 (9 AM)
const OVERLAP_END = 21 * 60; // 21:00 (9 PM)

// Helper functions
const parseAttendanceDate = (dateStr) => {
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

const formatTimeDisplay = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Custom hook for current time
const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return currentTime;
};

  // Fetch data on component mount — run all independent fetches in parallel
  useEffect(() => {
    console.log('[INFO] HRMyAttendance mounted with user:', user);
    Promise.all([
      fetchTodayAttendance(),
      fetchPendingCheckout(),
      fetchActiveBreaks(),
      fetchMonthlyAttendance(),
      fetchLeaveBalance(),
    ]).catch(err => console.error('Initial fetch error:', err));
  }, []);

  // Re-fetch monthly attendance when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchMonthlyAttendance();
  }, [selectedMonth, selectedYear]);

  // Update break timers every second
  useEffect(() => {
    if (activeBreaks.length === 0) return;

    const timerInterval = setInterval(() => {
      const newTimers = {};
      activeBreaks.forEach(breakItem => {
        if (breakItem.break_start_time) {
          const [startHour, startMin, startSec] = breakItem.break_start_time.split(':').map(Number);
          const now = new Date();
          const currentHour = now.getHours();
          const currentMin = now.getMinutes();
          const currentSec = now.getSeconds();
          
          const startTotalSeconds = (startHour * 3600) + (startMin * 60) + (startSec || 0);
          const nowTotalSeconds = (currentHour * 3600) + (currentMin * 60) + currentSec;
          
          let elapsedSeconds = nowTotalSeconds - startTotalSeconds;
          if (elapsedSeconds < 0) elapsedSeconds += 24 * 3600; // Handle midnight wraparound
          
          newTimers[breakItem.id] = elapsedSeconds;
        }
      });
      setBreakTimers(newTimers);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [activeBreaks]);

  // Format elapsed time as MM:SS or H:MM:SS
  const formatElapsedTime = (seconds) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  // Reset pagination when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const getEmployeeId = () => {
    // Try multiple possible property names and log for debugging
    const id = user?.employeeId || user?.employee_id || user?.id;
    if (!id) {
      console.error('[ERROR] No employee ID found in user object!', user);
      toast.error('Unable to determine employee ID. Please logout and login again.');
      return null;
    }
    return id;
  }, [user]);
  
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);
  
  // ============================================================
  // API CALLS
  // ============================================================
  const fetchTodayAttendance = useCallback(async () => {
    if (!employeeId || fetchInProgress.current) return;
    
    try {
      fetchInProgress.current = true;
      const token = localStorage.getItem('token');
      const employeeId = getEmployeeId();
      
      if (!employeeId) {
        setPendingCheckout(null);
        return;
      }

      // Query attendance endpoint to check for pending checkouts
      // This asks: "Do I have any record with check_in_time but NO check_out_time?"
      const response = await fetch(`${endpoints.attendance.base}/pending-checkout?employee_id=${employeeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('[INFO] Pending checkout found:', data.data);
          setPendingCheckout(data.data);
          setIsOverlapWindow(isInOverlapWindow());
        } else {
          setPendingCheckout(null);
        }
      } else {
        // If endpoint doesn't exist yet, fallback to checking via the checkIn error
        // This will be triggered when user tries to check in
        setPendingCheckout(null);
      }
    } catch (error) {
      console.error('Error checking pending checkout:', error);
      // Don't block functionality if check fails
      setPendingCheckout(null);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const employeeId = getEmployeeId();
      
      if (!employeeId) {
        setLoading(false);
        return;
      }

      const response = await fetch(endpoints.attendance.today(employeeId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        setAttendanceData(data.data);
        setIsCheckedIn(data.isCheckedIn || (data.data.check_in_time && !data.data.check_out_time));
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      fetchInProgress.current = false;
      setLoading(false);
    }
  }, [employeeId]);
  
  const fetchMonthlyAttendance = useCallback(async () => {
    if (!employeeId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.attendance.monthly(employeeId, selectedYear, selectedMonth), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setMonthlyAttendance(data.data || []);
      }
    } catch (error) {
      console.error('[ERROR] Error fetching monthly attendance:', error);
    }
  }, [employeeId, selectedYear, selectedMonth]);
  
  const fetchLeaveBalance = useCallback(async () => {
    if (!employeeId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.leaves.employeeBalance(employeeId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setLeaveSummary({
          casual: { used: data.casual.used, total: data.casual.total },
          sick: { used: data.sick.used, total: data.sick.total },
          annual: { used: data.annual.used, total: data.annual.total }
        });
      }
    } catch (error) {
      console.error('[ERROR] Error fetching leave balance:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.attendance.checkIn, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: getEmployeeId(),
          email: user?.email || 'hr@digious.com',
          name: user?.name || 'HR Manager',
          device_info: 'Web Browser'
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('[SUCCESS] Check-in successful:', data);
        setIsCheckedIn(true);
        await fetchTodayAttendance();
        await fetchPendingCheckout(); // Re-check pending after check-in
        await fetchMonthlyAttendance();
      } else {
        console.error('[ERROR] Check-in failed:', data.message);
        // If error is due to pending checkout, fetch it and display warning
        if (data.data?.reason === 'PENDING_CHECKOUT_EXISTS' && data.data?.pendingRecord) {
          setPendingCheckout(data.data.pendingRecord);
          setIsOverlapWindow(isInOverlapWindow());
        }
        toast.error(data.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.attendance.checkOut, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: getEmployeeId()
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('[SUCCESS] Check-out successful:', data);
        toast.success('Checked out successfully');
        setIsCheckedIn(false);
        await fetchTodayAttendance();
        await fetchPendingCheckout(); // Re-check pending after checkout
        await fetchMonthlyAttendance();
      } else {
        console.error('[ERROR] Check-out failed:', data.message);
        toast.error(data.message || 'Check-out failed');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Failed to check out');
    }
  };

  const handleBreakStart = async (breakType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.attendance.breakStart, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: getEmployeeId(),
          break_type: breakType,
          reason: `${breakType.charAt(0).toUpperCase() + breakType.slice(1)} break`
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchActiveBreaks();
      } else {
        toast.error(data.message || 'Failed to start break');
      }
    } catch (error) {
      console.error('Start break error:', error);
      toast.error('Failed to start break');
    }
  };

  const handleBreakEnd = async (breakId) => {
    try {
      const token = localStorage.getItem('token');
      const employeeId = getEmployeeId();
      
      // Find the break details from activeBreaks
      const breakRecord = activeBreaks.find(b => b.id === breakId);
      if (!breakRecord) {
        toast.error('Break record not found');
        return;
      }

      // Calculate duration from start time to now
      // Parse times correctly: HH:MM:SS format
      const [startHour, startMin, startSec] = breakRecord.break_start_time.split(':').map(Number);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentSec = now.getSeconds();
      
      // Convert both to total minutes since midnight for accurate calculation
      const startTotalSeconds = (startHour * 3600) + (startMin * 60) + (startSec || 0);
      const nowTotalSeconds = (currentHour * 3600) + (currentMin * 60) + currentSec;
      
      // Calculate duration in minutes (handle midnight crossing)
      let durationSeconds = nowTotalSeconds - startTotalSeconds;
      if (durationSeconds < 0) {
        // Break started before midnight, ended after - add 24 hours
        durationSeconds += (24 * 3600);
      }
      const duration = Math.max(0, Math.floor(durationSeconds / 60));

      const response = await fetch(endpoints.attendance.breakEnd, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: employeeId,
          break_type: breakRecord.break_type,
          break_end_time: now.toTimeString().split(' ')[0],
          break_duration_minutes: duration
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchActiveBreaks();
        fetchTodayAttendance();
      } else {
        toast.error(data.message || 'Failed to end break');
      }
    } catch (error) {
      console.error('End break error:', error);
      toast.error('Failed to end break');
    }
  };

  const getWorkingHours = () => {
    if (!attendanceData?.check_in_time) return '0h 0m';
    
    const [checkInHour, checkInMin] = attendanceData.check_in_time.split(':').map(Number);
    const checkInTotalMinutes = checkInHour * 60 + checkInMin;
    
    let checkOutTotalMinutes;
    const isNightShift = checkInTotalMinutes >= SHIFT_START;
    
    if (attendanceData.check_out_time) {
      const [checkOutHour, checkOutMin] = attendanceData.check_out_time.split(':').map(Number);
      checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
    } else {
      const now = getPakistanDate ? getPakistanDate() : new Date();
      checkOutTotalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    }
    
    let grossMinutes;
    if (isNightShift || checkOutTotalMinutes < checkInTotalMinutes) {
      const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
      grossMinutes = minutesUntilMidnight + checkOutTotalMinutes;
    } else {
      grossMinutes = checkOutTotalMinutes - checkInTotalMinutes;
    }
    
    const hours = Math.floor(grossMinutes / 60);
    const minutes = grossMinutes % 60;
    return `${hours}h ${minutes}m`;
  }, [attendanceData]);
  
  const getStatusText = useCallback(() => {
    if (!attendanceData?.check_in_time) return 'Not Checked In';
    if (attendanceData?.check_out_time) return 'Checked Out';
    
    if (attendanceData?.check_in_time) {
      const [hour, min] = attendanceData.check_in_time.split(':').map(Number);
      const checkInMinutes = hour * 60 + min;
      
      if (checkInMinutes >= OVERLAP_START && checkInMinutes < SHIFT_START) {
        return 'Present';
      }
    }
    
    return attendanceData?.status || 'Present';
  }, [attendanceData]);
  
  const getStatusColor = useCallback(() => {
    if (!attendanceData?.check_in_time) return 'text-[#009336]';
    if (attendanceData?.check_out_time) return 'text-[#009336]';
    return attendanceData?.status === 'Present' ? 'text-green-500' : 'text-orange-500';
  }, [attendanceData]);
  
  const getLateBy = useCallback(() => {
    if (!attendanceData?.check_in_time) return '0m';
    
    const [hour, min] = attendanceData.check_in_time.split(':').map(Number);
    const checkInMinutes = hour * 60 + min;
    
    if (checkInMinutes >= OVERLAP_START && checkInMinutes < SHIFT_START) {
      return '0m';
    }
    
    return `${attendanceData?.late_by_minutes || 0}m`;
  }, [attendanceData]);
  
  const getMonthlyStats = useMemo(() => {
    if (monthlyAttendance.length === 0) {
      return {
        totalHours: 0,
        totalMinutes: 0,
        averageHours: 0,
        averageMinutes: 0,
        maxHours: 0,
        minHours: 0,
        workDays: 0,
        totalBreakMinutes: 0
      };
    }
    
    const totalMinutes = monthlyAttendance.reduce((sum, record) => sum + (record.net_working_time_minutes || 0), 0);
    const totalBreakMinutes = monthlyAttendance.reduce((sum, record) => sum + (record.total_break_duration_minutes || 0), 0);
    const workDays = monthlyAttendance.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const hours = monthlyAttendance.map(r => (r.net_working_time_minutes || 0) / 60);
    
    return {
      totalHours: Math.floor(totalMinutes / 60),
      totalMinutes: totalMinutes % 60,
      averageHours: workDays > 0 ? Math.floor(totalMinutes / workDays / 60) : 0,
      averageMinutes: workDays > 0 ? (totalMinutes / workDays) % 60 : 0,
      maxHours: Math.floor(Math.max(...hours, 0)),
      minHours: hours.length > 0 ? Math.floor(Math.min(...hours.filter(h => h > 0), Infinity)) : 0,
      workDays: workDays,
      totalBreakMinutes: totalBreakMinutes
    };
  }, [monthlyAttendance]);
  
  const filteredRecords = useMemo(() => {
    const filtered = monthlyAttendance.filter(r => 
      statusFilter === 'All Status' || r.status === statusFilter
    );
    return [...filtered].sort((a, b) => 
      new Date(b.attendance_date) - new Date(a.attendance_date)
    );
  }, [monthlyAttendance, statusFilter]);
  
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * daysInMonth;
    const endIndex = startIndex + daysInMonth;
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, currentPage, daysInMonth]);
  
  const totalPages = useMemo(() => {
    return Math.ceil(filteredRecords.length / daysInMonth);
  }, [filteredRecords.length, daysInMonth]);
  
  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    fetchTodayAttendance();
    fetchMonthlyAttendance();
    fetchLeaveBalance();
  }, [fetchTodayAttendance, fetchMonthlyAttendance, fetchLeaveBalance]);
  
  useEffect(() => {
    setCurrentPage(1);
    fetchMonthlyAttendance();
  }, [selectedMonth, selectedYear, fetchMonthlyAttendance]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);
  
  // ============================================================
  // MEMOIZED COMPONENTS
  // ============================================================
  
  
  const MonthlyStatsSection = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-blue-800">Total Hours</h4>
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-blue-600">{getMonthlyStats.totalHours}h {getMonthlyStats.totalMinutes}m</p>
        <p className="text-xs text-blue-600 mt-1">total this month</p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-purple-800">Average Daily</h4>
          <Activity className="w-5 h-5 text-purple-600" />
        </div>
        <p className="text-3xl font-bold text-purple-600">{getMonthlyStats.averageHours}h {Math.round(getMonthlyStats.averageMinutes)}m</p>
        <p className="text-xs text-purple-600 mt-1">per work day</p>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-green-800">Work Days</h4>
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-3xl font-bold text-green-600">{getMonthlyStats.workDays}</p>
        <p className="text-xs text-green-600 mt-1">days present/late</p>
      </div>
      
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-orange-800">Break Time</h4>
          <PauseCircle className="w-5 h-5 text-orange-600" />
        </div>
        <p className="text-3xl font-bold text-orange-600">{Math.floor(getMonthlyStats.totalBreakMinutes / 60)}h {getMonthlyStats.totalBreakMinutes % 60}m</p>
        <p className="text-xs text-orange-600 mt-1">total break time</p>
      </div>
    </div>
  ), [getMonthlyStats]);
  
  const AttendanceTable = useMemo(() => (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden relative z-10">
      <div className="px-6 py-4 border-b border-gray-200 bg-white text-black/90">
        <h2 className="text-lg font-bold">Detailed Attendance</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#349DFF] text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Check In</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Check Out</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Working Hours</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Breaks</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Late By</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Overtime</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No attendance records found for the selected filters
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record, index) => (
                <tr key={record.id || `absent-${record.attendance_date}`} className={`${
                  record.is_absent ? 'bg-red-50 hover:bg-red-100' : index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'
                } transition-colors`}>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {parseAttendanceDate(record.attendance_date).toLocaleDateString('en-US', {
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {!record.check_in_time ? <span className="text-red-600 font-semibold">No Check-in</span> : record.check_in_time}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {!record.check_in_time ? <span className="text-red-600 font-semibold">—</span> : (record.check_out_time || '-')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      record.status === 'Present' ? 'bg-green-100 text-green-700' :
                      record.status === 'Late' ? 'bg-orange-100 text-orange-700' :
                      record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                      record.status === 'Paid Leave' ? 'bg-teal-100 text-teal-700' :
                      record.status === 'Uninformed Absent' ? 'bg-red-200 text-red-800' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {record.status === 'Paid Leave' ? 'PL' :
                       record.status === 'Uninformed Absent' ? 'UA' :
                       record.status === 'Present' ? 'P' :
                       record.status === 'Late' ? 'L' :
                       record.status === 'Absent' ? 'A' :
                       record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {record.is_absent ? <span className="text-red-600 font-semibold">—</span> : (
                      record.net_working_time_minutes 
                        ? `${Math.floor(record.net_working_time_minutes / 60)}h ${record.net_working_time_minutes % 60}m`
                        : '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {record.is_absent ? <span className="text-red-600 font-semibold">—</span> : (
                      (record.total_breaks_taken || 0) + ' (' + (record.total_break_duration_minutes || 0) + 'm)'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {record.is_absent ? <span className="text-red-600 font-semibold">—</span> : (record.late_by_minutes ? `${record.late_by_minutes}m` : '-')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {record.is_absent ? (
                      <span className="text-red-600 font-semibold">—</span>
                    ) : (
                      record.overtime_minutes > 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {Math.floor(record.overtime_minutes / 60)}h {record.overtime_minutes % 60}m
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="border-t border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
            <span className="ml-4">Total: <span className="font-semibold text-gray-900">{filteredRecords.length}</span> records <span className="text-gray-500 text-xs">(showing {daysInMonth} per page)</span></span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-semibold text-sm"
            >
              ← Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-semibold text-sm"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  ), [paginatedRecords, currentPage, totalPages, filteredRecords.length, daysInMonth]);
  
  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="My Attendance Records"
          subtitle="View and manage your attendance history"
          role={role}
          currentTime={currentTime}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            
            
            {/* Monthly Statistics Section */}
            <div className="mt-8">
              {MonthlyStatsSection}
            </div>
            
            {/* Header with Month/Year Navigation */}
            <div className="bg-white rounded-lg px-6 py-2 text-black/90 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Attendance Records</h2>
                  <p className="text-black/70 text-sm">
                    <span className="font-semibold">{filteredRecords.length}</span> records in <span className="font-semibold">{
                      new Date(2026, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long' })
                    } {selectedYear}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedMonth === 1) {
                        setSelectedMonth(12);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-semibold text-sm"
                    title="Previous month"
                  >
                    ← Prev
                  </button>
                  
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-lg bg-white text-gray-700 font-semibold cursor-pointer border border-gray-300 hover:border-blue-400 transition-colors"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1).toLocaleDateString('en-US', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-lg bg-white text-gray-700 font-semibold cursor-pointer border border-gray-300 hover:border-blue-400 transition-colors"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => {
                      if (selectedMonth === 12) {
                        setSelectedMonth(1);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-semibold text-sm"
                    title="Next month"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status Filter Buttons */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {['All Status', 'Present', 'Late', 'Absent', 'Leave'].map(status => {
                  const count = status === 'All Status' ? monthlyAttendance.length : monthlyAttendance.filter(r => r.status === status).length;
                  const colorClasses = {
                    'All Status': statusFilter === 'All Status' ? 'bg-[#349DFF] text-white' : 'bg-white text-gray-700 hover:border-blue-400',
                    'Present': statusFilter === 'Present' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200',
                    'Late': statusFilter === 'Late' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200',
                    'Absent': statusFilter === 'Absent' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200',
                    'Leave': statusFilter === 'Leave' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'
                  };
                  
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm shadow-md ${colorClasses[status]}`}
                    >
                      {status} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Attendance Table */}
            {AttendanceTable}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HRMyAttendance;
export const EmployeeAttendancePage = HRMyAttendance;