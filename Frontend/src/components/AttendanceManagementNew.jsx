// AttendanceManagement.jsx - Redesigned
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { endpoints } from '../config/api';
import {
  CheckCircle, Clock, Download, 
  Search, Filter, Eye, RefreshCw, Activity,
  Coffee, LogIn, LogOut, AlertCircle, TrendingUp, TrendingDown,
  Calendar, UserCheck, UserX, Zap, BarChart3, X
} from 'lucide-react';
import Chart from 'chart.js/auto';

// Helper: format time string (HH:MM) or return '-' for missing
const formatTimeShort = (timeStr) => {
  if (!timeStr || timeStr === 'N/A' || timeStr === '-') return '-';
  // Expect format like '21:00:00' or '08:30:00', return '21:00' or '08:30'
  const parts = timeStr.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
};

// Helper: format minutes into short hours/minutes string (e.g., 73 -> '1h 13m', 60 -> '1h', 45 -> '45m')
const formatMinutesShort = (mins) => {
  if (!mins || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const AttendanceManagement = () => {
  // State Management
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDate, setSelectedDate] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBreakStatus, setSelectedBreakStatus] = useState('All');
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filteredRecords, setFilteredRecords] = useState(22);
  const [totalRecords, setTotalRecords] = useState(23);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Display 20 records per page
  const [nowTime, setNowTime] = useState(Date.now());

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const response = await fetch(endpoints.attendance.all + '?limit=1000');
        const result = await response.json();
        
        if (result.success && result.data) {
          setAttendanceData(result.data);
          setTotalRecords(result.data.length);
          setFilteredRecords(result.data.length);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();

    // Auto refresh
    if (autoRefresh) {
      const interval = setInterval(fetchAttendance, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  

  // Filter data based on selected date/time range
  const getFilteredDataByDate = useCallback(() => {
    const today = new Date();
    const currentHour = today.getHours();
    today.setHours(0, 0, 0, 0);
    
    return attendanceData.filter(record => {
      const recordDate = new Date(record.attendance_date);
      recordDate.setHours(0, 0, 0, 0);
      
      switch(selectedDate) {
        case 'today':
          // Night shift awareness: 
          // - Shift runs from 21:00 (9 PM) to 06:00 (6 AM)
          // - Between 00:00-06:00 AM, employees are still on YESTERDAY's shift
          // - So "Today" filter should show yesterday's records in early morning
          if (currentHour >= 0 && currentHour < 6) {
            // Early morning: show yesterday's shift (the active night shift)
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return recordDate.getTime() === yesterday.getTime();
          }
          // Normal hours (06:00-23:59): show today's records
          return recordDate.getTime() === today.getTime();
          
        case 'yesterday':
          // Night shift awareness for "Yesterday" filter
          // - During 00:00-06:00: "today" shows yesterday's shift, so "yesterday" should show day-before-yesterday's shift
          // - During 06:00-23:59: "yesterday" is simply yesterday
          if (currentHour >= 0 && currentHour < 6) {
            // Early morning: yesterday is actually 2 days ago (since "today" = yesterday's shift)
            const dayBeforeYesterday = new Date(today);
            dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
            return recordDate.getTime() === dayBeforeYesterday.getTime();
          }
          // Normal hours: yesterday is simply the previous day
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return recordDate.getTime() === yesterday.getTime();
          
        case 'thisweek':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return recordDate >= weekStart && recordDate <= today;
          
        case 'lastweek':
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
          return recordDate >= lastWeekStart && recordDate <= lastWeekEnd;
          
        case 'thismonth':
          return recordDate.getMonth() === today.getMonth() && 
                 recordDate.getFullYear() === today.getFullYear();
                 
        case 'lastmonth':
          const lastMonth = new Date(today);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          return recordDate.getMonth() === lastMonth.getMonth() && 
                 recordDate.getFullYear() === lastMonth.getFullYear();
                 
        case 'custom':
          // Custom range: include both start and end dates (inclusive)
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return recordDate.getTime() >= start.getTime() && recordDate.getTime() <= end.getTime();
          
        default:
          return true;
      }
    });
  }, [attendanceData, selectedDate, customStartDate, customEndDate]);

  // Helper: format time string (HH:MM) or return '-' for missing
  // (moved to module scope)

  // Update filtered records count when filters change
  useEffect(() => {
    const dateFilteredData = getFilteredDataByDate();
    const filtered = dateFilteredData.filter(record => {
      // Search filter - check multiple fields
      const matchesSearch = !searchQuery || 
        record.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.attendance_date && record.attendance_date.includes(searchQuery));
      
      // Department filter
      const matchesDepartment = selectedDepartment === 'All Departments' || record.department === selectedDepartment;
      
      // Status filter (handle Late status specially - records with positive late_by_minutes)
      let matchesStatus = selectedStatus === 'All';
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Late') {
          matchesStatus = record.late_by_minutes > 0;
        } else if (selectedStatus === 'Leave') {
          matchesStatus = record.status === 'Leave' || record.status === 'On Leave';
        } else {
          matchesStatus = record.status === selectedStatus;
        }
      }
      
      // Break status filter
      let matchesBreakStatus = selectedBreakStatus === 'All';
      if (selectedBreakStatus !== 'All') {
        const hasTakenBreaks = (record.total_breaks_taken || 0) > 0;
        matchesBreakStatus = selectedBreakStatus === 'On Break' ? hasTakenBreaks : !hasTakenBreaks;
      }
      
      return matchesSearch && matchesDepartment && matchesStatus && matchesBreakStatus;
    });
    setFilteredRecords(filtered.length);
  }, [searchQuery, selectedDepartment, selectedStatus, selectedBreakStatus, selectedDate, customStartDate, customEndDate, getFilteredDataByDate]);

  // Update nowTime every minute when live updates are enabled so ongoing durations refresh
  useEffect(() => {
    if (!liveUpdates) return;
    const interval = setInterval(() => setNowTime(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, [liveUpdates]);

  // Ensure custom range is valid (end >= start)
  useEffect(() => {
    if (new Date(customEndDate) < new Date(customStartDate)) {
      setCustomEndDate(customStartDate);
    }
  }, [customStartDate, customEndDate]);

  // Filter data
  const dateFilteredData = getFilteredDataByDate();
  const filteredData = dateFilteredData.filter(record => {
    // Search filter - check multiple fields
    const matchesSearch = !searchQuery || 
      record.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Department filter
    const matchesDepartment = selectedDepartment === 'All Departments' || record.department === selectedDepartment;
    
    // Status filter (handle Late status specially - records with positive late_by_minutes)
    let matchesStatus = selectedStatus === 'All';
    if (selectedStatus !== 'All') {
      if (selectedStatus === 'Late') {
        matchesStatus = record.late_by_minutes > 0;
      } else if (selectedStatus === 'Leave') {
        matchesStatus = record.status === 'Leave' || record.status === 'On Leave';
      } else {
        matchesStatus = record.status === selectedStatus;
      }
    }
    
    // Break status filter
    let matchesBreakStatus = selectedBreakStatus === 'All';
    if (selectedBreakStatus !== 'All') {
      const hasTakenBreaks = (record.total_breaks_taken || 0) > 0;
      matchesBreakStatus = selectedBreakStatus === 'On Break' ? hasTakenBreaks : !hasTakenBreaks;
    }
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesBreakStatus;
  });

  // Calculate statistics from filtered data
  const stats = {
    present: dateFilteredData.filter(r => r.status === 'Present').length,
    absent: dateFilteredData.filter(r => r.status === 'Absent').length,
    active: dateFilteredData.filter(r => r.check_out_time === null && r.status === 'Present').length,
    inactive: dateFilteredData.filter(r => r.check_out_time !== null || r.status === 'Absent').length,
    totalBreaks: dateFilteredData.reduce((sum, r) => sum + (r.total_breaks_taken || 0), 0),
    avgWorkingHours: dateFilteredData.length > 0 
      ? (dateFilteredData.reduce((sum, r) => sum + (r.net_working_time_minutes || 0), 0) / dateFilteredData.length / 60).toFixed(1)
      : '0.0',
    late: dateFilteredData.filter(r => r.late_by_minutes > 0).length,
    onTime: dateFilteredData.filter(r => r.on_time === 1).length
  };

  // Get current date display
  const getDateDisplay = () => {
    const today = new Date();
    const currentHour = today.getHours();
    switch(selectedDate) {
      case 'today':
        // Night shift awareness: if early morning (00:00-06:00), show the actual shift date (yesterday)
        if (currentHour >= 0 && currentHour < 6) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return `${yesterday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (Active Night Shift)`;
        }
        return today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'yesterday':
        // Night shift awareness for "Yesterday" display
        // - During 00:00-06:00: "yesterday" is 2 days ago (since "today" = yesterday's shift)
        // - During 06:00-23:59: "yesterday" is simply the previous day
        if (currentHour >= 0 && currentHour < 6) {
          const dayBeforeYesterday = new Date(today);
          dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
          return dayBeforeYesterday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'thisweek':
        return 'This Week';
      case 'lastweek':
        return 'Last Week';
      case 'thismonth':
        return today.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'lastmonth':
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'custom':
        const s = new Date(customStartDate);
        const e = new Date(customEndDate);
        return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      default:
        return 'All Time';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="p-8 max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Attendance Management
              </h1>
              <p className="text-slate-600 font-medium">
                📅 {getDateDisplay()} • {dateFilteredData.length} of {totalRecords} records
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Download className="h-5 w-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Date & Filter Controls */}
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              <button
                onClick={() => setSelectedDate('today')}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  selectedDate === 'today'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate('yesterday')}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  selectedDate === 'yesterday'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => setSelectedDate('thisweek')}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  selectedDate === 'thisweek'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setSelectedDate('lastweek')}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  selectedDate === 'lastweek'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setSelectedDate('thismonth')}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  selectedDate === 'thismonth'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setSelectedDate('lastmonth')}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  selectedDate === 'lastmonth'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setSelectedDate('custom')}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  selectedDate === 'custom'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Custom Date
              </button>
              {selectedDate === 'custom' && (
                <div className="ml-3 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700">
                  {new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                  {' '}-{' '}
                  {new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                </div>
              )}
              {selectedDate === 'custom' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                    <div className="flex flex-col">
                      <label className="text-xs text-slate-500">From</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-transparent focus:ring-1 focus:ring-blue-400 text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-slate-500">To</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-transparent focus:ring-1 focus:ring-blue-400 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedDate('custom'); setCurrentPage(1); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        setCustomStartDate(todayStr);
                        setCustomEndDate(todayStr);
                        setSelectedDate('today');
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Stats Overview Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {/* Present Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <UserCheck className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.present}</div>
                <div className="text-emerald-100 text-xs font-medium">Present</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-100 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>+2 from yesterday</span>
            </div>
          </div>

          {/* Absent Card */}
          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <UserX className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.absent}</div>
                <div className="text-rose-100 text-xs font-medium">Absent</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-rose-100 text-xs">
              <TrendingDown className="h-3 w-3" />
              <span>+1 from yesterday</span>
            </div>
          </div>

          {/* On Time Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.onTime}</div>
                <div className="text-blue-100 text-xs font-medium">On Time</div>
              </div>
            </div>
            <div className="text-blue-100 text-xs">Punctual arrivals</div>
          </div>

          {/* Late Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.late}</div>
                <div className="text-amber-100 text-xs font-medium">Late</div>
              </div>
            </div>
            <div className="text-amber-100 text-xs">Arrived late</div>
          </div>

          {/* Active Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Activity className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.active}</div>
                <div className="text-indigo-100 text-xs font-medium">Active</div>
              </div>
            </div>
            <div className="text-indigo-100 text-xs">Currently working</div>
          </div>

          {/* Total Breaks Card */}
          <div className="bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Coffee className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{stats.totalBreaks}</div>
                <div className="text-slate-100 text-xs font-medium">Total Breaks</div>
              </div>
            </div>
            <div className="text-slate-100 text-xs">Avg: {stats.avgWorkingHours}h work</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          
          {/* Attendance Overview and Summary */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Attendance Overview Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceOverviewCard stats={stats} totalEmployees={dateFilteredData.length} dateDisplay={getDateDisplay()} />
              
              {/* Today's Quick Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Quick Summary</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold text-slate-800">Attendance Rate</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">
                      {dateFilteredData.length > 0 
                        ? Math.round((stats.present / dateFilteredData.length) * 100) 
                        : 0}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-slate-800">Punctuality Rate</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {stats.present > 0 
                        ? Math.round((stats.onTime / stats.present) * 100) 
                        : 0}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Coffee className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold text-slate-800">Avg Breaks per Employee</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">
                      {dateFilteredData.length > 0 
                        ? (stats.totalBreaks / dateFilteredData.length).toFixed(1) 
                        : 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-slate-800">Avg Working Hours</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">{stats.avgWorkingHours}h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Filters</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {filteredRecords} of {dateFilteredData.length} records
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                    <input
                      type="checkbox"
                      checked={liveUpdates}
                      onChange={(e) => setLiveUpdates(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">Live Updates</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">Auto Refresh</span>
                  </label>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by employee name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                  >
                    <option>All Departments</option>
                    <option>Sales</option>
                    <option>Production</option>
                    <option>HR</option>
                    <option>Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                  >
                    <option>All</option>
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Late</option>
                    <option>Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Break Status</label>
                  <select
                    value={selectedBreakStatus}
                    onChange={(e) => setSelectedBreakStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                  >
                    <option>All</option>
                    <option>On Break</option>
                    <option>Not On Break</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <AttendanceTable 
              data={filteredData}
              loading={loading}
              onViewDetails={setSelectedEmployee}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>

        {/* Employee Detail Modal */}
        {selectedEmployee && (
          <EmployeeDetailModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            nowTime={nowTime}
          />
        )}
      </div>
    </div>
  );
};

// Attendance Overview Card Component
const AttendanceOverviewCard = ({ stats, totalEmployees, dateDisplay }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      const data = {
        labels: ['Present', 'Absent', 'On Time', 'Late'],
        datasets: [{
          data: [stats.present, stats.absent, stats.onTime, stats.late],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(251, 146, 60, 0.8)'
          ],
          borderColor: [
            '#10B981',
            '#EF4444',
            '#3B82F6',
            '#FB923C'
          ],
          borderWidth: 3,
          hoverOffset: 20
        }]
      };

      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1
            }
          },
          animation: {
            animateScale: true,
            animateRotate: true
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-xl">
          <BarChart3 className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800">Attendance Overview</h3>
          <p className="text-sm text-slate-600">{dateDisplay}</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6">
        <div className="relative w-64 h-64">
          <canvas ref={chartRef} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-600">Total</div>
              <div className="text-4xl font-bold text-slate-800">{totalEmployees}</div>
              <div className="text-sm text-slate-500 mt-1">Employees</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <div>
            <div className="text-xs text-slate-600">Present</div>
            <div className="text-lg font-bold text-slate-800">{stats.present}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
          <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
          <div>
            <div className="text-xs text-slate-600">Absent</div>
            <div className="text-lg font-bold text-slate-800">{stats.absent}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div>
            <div className="text-xs text-slate-600">On Time</div>
            <div className="text-lg font-bold text-slate-800">{stats.onTime}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          <div>
            <div className="text-xs text-slate-600">Late</div>
            <div className="text-lg font-bold text-slate-800">{stats.late}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Attendance Table Component
const AttendanceTable = ({ data, loading, onViewDetails, currentPage, setCurrentPage, itemsPerPage }) => {
  // Reset to page 1 if data length changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, setCurrentPage]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-200">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Check In/Out</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Breaks</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                paginatedData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {record.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{record.name || 'Unknown'}</div>
                          <div className="text-sm text-slate-500">{record.email || 'Unknown'}</div>
                        </div>
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {record.attendance_date ? new Date(record.attendance_date).toLocaleDateString('en-CA') : '-'}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <LogIn className="h-4 w-4 text-emerald-600" />
                          <span className="text-slate-700">{formatTimeShort(record.check_in_time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <LogOut className="h-4 w-4 text-blue-600" />
                          <span className="text-slate-700">{formatTimeShort(record.check_out_time)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Coffee className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{record.total_breaks_taken || 0}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {(record.total_break_duration_minutes || 0) > 0 ? `${record.total_break_duration_minutes}m` : '0m'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                          record.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {record.status || 'Unknown'}
                        </span>
                        {record.late_by_minutes > 0 && (
                          <span className="text-xs text-amber-600 font-medium">{formatMinutesShort(record.late_by_minutes)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onViewDetails(record)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-150"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {data.length > itemsPerPage && (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="text-sm text-slate-600">
            Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, data.length)}</span> of <span className="font-semibold">{data.length}</span> records
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Employee Detail Modal Component
const EmployeeDetailModal = ({ employee, onClose, nowTime }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second to show accurate ongoing duration
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Employee Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Employee Info */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {employee.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold text-slate-800">{employee.name}</div>
                  <div className="text-sm text-slate-500">{employee.email}</div>
                  <div className="text-xs text-slate-400 mt-1">{employee.attendance_date ? new Date(employee.attendance_date).toLocaleDateString('en-CA') : ''}</div>
                </div>
                {employee.late_by_minutes > 0 && (
                  <div className="ml-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                      <svg className="h-3 w-3 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="10"></circle></svg>
                      {formatMinutesShort(employee.late_by_minutes)} late
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">Check In</div>
                <div className="text-lg font-bold text-slate-800">{formatTimeShort(employee.check_in_time)}</div>
              </div>
              <LogIn className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">Check Out</div>
                <div className="text-lg font-bold text-slate-800">{formatTimeShort(employee.check_out_time)}</div>
              </div>
              <LogOut className="h-6 w-6 text-blue-600" />
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">Total Breaks</div>
              <div className="text-lg font-bold text-slate-800">{employee.total_breaks_taken || 0}</div>
              <div className="text-xs text-slate-400 mt-1">{formatMinutesShort(employee.total_break_duration_minutes || 0)} total</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">Working Time</div>
                <div className="text-lg font-bold text-slate-800">
                  {(() => {
                    // If employee has checked out, show recorded working time from database
                    if (employee.check_out_time) {
                      return formatMinutesShort(employee.net_working_time_minutes || 0);
                    }

                    // If employee is still checked in, compute ongoing minutes from check_in_time
                    if (employee.check_in_time && employee.attendance_date) {
                      try {
                        // Parse time string HH:MM:SS into minutes since midnight
                        const parseTimeToMinutes = (timeStr) => {
                          if (!timeStr) return 0;
                          const [h, m, s] = timeStr.split(':').map(Number);
                          return (h || 0) * 60 + (m || 0);
                        };
                        
                        // Get current time as minutes since midnight
                        const now = new Date(currentTime);
                        const currentHours = now.getHours();
                        const currentMinutes = now.getMinutes();
                        const currentTimeInMinutes = currentHours * 60 + currentMinutes;
                        
                        // Get check-in time in minutes since midnight
                        const checkInTimeInMinutes = parseTimeToMinutes(employee.check_in_time);
                        
                        // Calculate difference (handling day boundary)
                        let diffMins = currentTimeInMinutes - checkInTimeInMinutes;
                        
                        // If difference is negative, employee checked in yesterday
                        if (diffMins < 0) {
                          diffMins += 24 * 60; // Add 24 hours worth of minutes
                        }
                        
                        // Subtract breaks to show net working time
                        const breakMins = employee.total_break_duration_minutes || 0;
                        const netMins = Math.max(0, diffMins - breakMins);
                        
                        return `${formatMinutesShort(netMins)} (ongoing)`;
                      } catch (e) {
                        console.error('Error calculating ongoing time:', e);
                        return formatMinutesShort(employee.net_working_time_minutes || 0);
                      }
                    }

                    return '0m';
                  })()}
                </div>
            </div>
          </div>

          {/* Breaks Details */}
          {employee.breaks && employee.breaks.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">Break Details</h3>
              <div className="space-y-2">
                {employee.breaks.map((breakItem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-md">
                        <Coffee className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{breakItem.break_type}</div>
                        <div className="text-sm text-slate-500">{breakItem.reason || 'No reason'}</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-700 font-semibold">
                      {formatMinutesShort(breakItem.break_duration_minutes || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
