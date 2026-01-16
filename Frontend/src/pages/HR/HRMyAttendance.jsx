import React, { useState, useEffect } from 'react';
import HrSidebar from '../../components/HrSidebar';
import { DashboardHeader } from '../../components/DashboardComponents';
import { useAuth } from '../../context/AuthContext';
import { endpoints } from '../../config/api';
import { getPakistanTimeString, getPakistanDateString } from '../../utils/timezone';
import {
  CheckCircle,
  Clock,
  LogIn,
  LogOut,
  Coffee,
  User,
  Calendar,
  Activity,
  AlertCircle,
  BarChart3,
  Timer,
  PlayCircle,
  StopCircle,
  PauseCircle,
  Utensils,
  Cigarette,
  Table,
  LineChart,
  Shield
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart as ReLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const HRMyAttendance = () => {
  const { user, role } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('my-attendance');
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard or sheet
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeBreaks, setActiveBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Status'); // Filter for status
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    console.log('🔍 HRMyAttendance mounted with user:', user);
    fetchTodayAttendance();
    fetchActiveBreaks();
    fetchMonthlyAttendance();
  }, []);

  // Re-fetch monthly attendance when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchMonthlyAttendance();
  }, [selectedMonth, selectedYear]);

  // Reset pagination when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const getEmployeeId = () => {
    // Try multiple possible property names and log for debugging
    const id = user?.employeeId || user?.employee_id || user?.id;
    console.log('🔍 Getting employee ID:', { 
      user, 
      employeeId: user?.employeeId,
      employee_id: user?.employee_id,
      id: user?.id,
      resolved: id 
    });
    
    if (!id) {
      console.error('❌ No employee ID found in user object!', user);
      alert('Unable to determine employee ID. Please logout and login again.');
      return null;
    }
    
    return id;
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
        const todayRecord = data.data;
        console.log('✅ Today attendance data:', todayRecord);
        console.log('📊 Check-in status:', {
          check_in_time: todayRecord.check_in_time,
          check_out_time: todayRecord.check_out_time,
          isCheckedIn: data.isCheckedIn || (todayRecord.check_in_time && !todayRecord.check_out_time)
        });
        setAttendanceData(todayRecord);
        setIsCheckedIn(data.isCheckedIn || (todayRecord.check_in_time && !todayRecord.check_out_time));
      } else {
        console.warn('⚠️ No attendance data received:', data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const employeeId = getEmployeeId();
      
      if (!employeeId) return;
      
      // Use selected month and year from filter
      const response = await fetch(endpoints.attendance.monthly(employeeId, selectedYear, selectedMonth), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ Monthly attendance fetched:', data.data);
        setMonthlyAttendance(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
    }
  };

  const fetchActiveBreaks = async () => {
    try {
      const token = localStorage.getItem('token');
      const employeeId = getEmployeeId();
      
      if (!employeeId) return;

      const response = await fetch(endpoints.attendance.ongoingBreaks(employeeId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setActiveBreaks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching active breaks:', error);
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
        console.log('✅ Check-in successful:', data);
        setIsCheckedIn(true);
        await fetchTodayAttendance();
        await fetchMonthlyAttendance();
      } else {
        console.error('❌ Check-in failed:', data.message);
        alert(data.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in');
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
        console.log('✅ Check-out successful:', data);
        setIsCheckedIn(false);
        await fetchTodayAttendance();
        await fetchMonthlyAttendance();
      } else {
        console.error('❌ Check-out failed:', data.message);
        alert(data.message || 'Check-out failed');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Failed to check out');
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
        alert(data.message || 'Failed to start break');
      }
    } catch (error) {
      console.error('Start break error:', error);
      alert('Failed to start break');
    }
  };

  const handleBreakEnd = async (breakId) => {
    try {
      const token = localStorage.getItem('token');
      const employeeId = getEmployeeId();
      
      // Find the break details from activeBreaks
      const breakRecord = activeBreaks.find(b => b.id === breakId);
      if (!breakRecord) {
        alert('Break record not found');
        return;
      }

      // Calculate duration from start time to now
      const now = new Date();
      const breakStartTime = new Date(`2000-01-01 ${breakRecord.break_start_time}`);
      const duration = Math.floor((now - breakStartTime) / (1000 * 60)); // Duration in minutes

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
        alert(data.message || 'Failed to end break');
      }
    } catch (error) {
      console.error('End break error:', error);
      alert('Failed to end break');
    }
  };

  const getWorkingHours = () => {
    if (!attendanceData?.check_in_time) return '0h 0m';
    
    const checkInTime = new Date(`2000-01-01 ${attendanceData.check_in_time}`);
    const currentOrCheckOutTime = attendanceData.check_out_time 
      ? new Date(`2000-01-01 ${attendanceData.check_out_time}`)
      : new Date(`2000-01-01 ${getPakistanTimeString()}`);
    
    const diffMs = currentOrCheckOutTime - checkInTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = () => {
    // Check if there's a check-in time
    if (!attendanceData?.check_in_time) return 'text-gray-500';
    // If checked out, return blue
    if (attendanceData?.check_out_time) return 'text-blue-500';
    // If checked in, return status color (Present/Late/etc)
    return attendanceData?.status === 'Present' ? 'text-green-500' : 
           attendanceData?.status === 'Late' ? 'text-orange-500' : 'text-blue-500';
  };

  const getStatusText = () => {
    // Check if there's a check-in time
    if (!attendanceData?.check_in_time) return 'Not Checked In';
    // If there's a check-out time, show checked out
    if (attendanceData?.check_out_time) return 'Checked Out';
    // If checked in with no check-out, show status (Present/Late/etc)
    return attendanceData?.status || 'Present';
  };

  // Prepare chart data
  const getWeeklyData = () => {
    const last7Days = monthlyAttendance.slice(-7).map(record => ({
      date: new Date(record.attendance_date).toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Math.floor((record.net_working_time_minutes || 0) / 60),
      status: record.status
    }));
    return last7Days;
  };

  const getStatusDistribution = () => {
    const statusCount = monthlyAttendance.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    const COLORS = {
      'Present': '#10b981',
      'Late': '#f59e0b',
      'Absent': '#ef4444',
      'Leave': '#8b5cf6'
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
      color: COLORS[status] || '#6b7280'
    }));
  };

  const breakTypes = [
    { type: 'Smoke', label: 'Smoke Break', icon: Cigarette, color: 'bg-gray-500' },
    { type: 'Dinner', label: 'Dinner Break', icon: Utensils, color: 'bg-orange-500' },
    { type: 'Washroom', label: 'Washroom Break', icon: User, color: 'bg-blue-500' },
    { type: 'Prayer', label: 'Prayer Break', icon: Activity, color: 'bg-purple-500' }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <HrSidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="My Attendance Dashboard"
          subtitle="Manage your daily attendance and working hours"
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          role={role}
          currentTime={currentTime}
        />

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-all ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-5 h-5" />
              Attendance Dashboard
            </button>
            <button
              onClick={() => setActiveTab('sheet')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-all ${
                activeTab === 'sheet'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Table className="w-5 h-5" />
              Attendance Sheet
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Current Status */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    attendanceData?.check_in_time && !attendanceData?.check_out_time ? 'bg-green-100' : attendanceData?.check_out_time ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <CheckCircle className={`w-6 h-6 ${getStatusColor()}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase">Status</h3>
                    <p className={`text-xl font-bold ${getStatusColor()}`}>
                      {getStatusText()}
                    </p>
                  </div>
                </div>
              </div>
              {attendanceData?.check_in_time && (
                <p className="text-sm text-gray-500">
                  Checked in at: {attendanceData.check_in_time}
                </p>
              )}
            </div>

            {/* Working Hours */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase">Working Hours</h3>
                    <p className="text-xl font-bold text-blue-600">
                      {getWorkingHours()}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Expected: 9h 0m
              </p>
            </div>

            {/* Total Breaks */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <PauseCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase">Total Breaks</h3>
                    <p className="text-xl font-bold text-purple-600">
                      {attendanceData?.total_breaks_taken || 0}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Active: {activeBreaks.length}
              </p>
            </div>

            {/* Late Arrivals */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-semibold text-gray-600 uppercase">Late By</h3>
                    <p className="text-xl font-bold text-orange-600">
                      {attendanceData?.late_by_minutes || 0}m
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Minutes late today
              </p>
            </div>
          </div>

          {/* Main Action Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Check In/Out Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="text-center">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance</h2>
                  <div className="text-3xl font-mono font-bold text-blue-600">
                    {currentTime.toLocaleTimeString('en-US', { 
                      hour12: false,
                      timeZone: 'Asia/Karachi'
                    })}
                  </div>
                  <p className="text-gray-500 mt-1">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'Asia/Karachi'
                    })}
                  </p>
                </div>

                {!loading && (
                  <div className="space-y-4">
                    {isCheckedIn || (attendanceData?.check_in_time && !attendanceData?.check_out_time) ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-green-700 font-semibold">You are checked in</p>
                        {attendanceData?.check_in_time && (
                          <p className="text-sm text-green-600">
                            Checked in at {attendanceData.check_in_time}
                          </p>
                        )}
                      </div>
                    ) : attendanceData?.check_out_time ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <LogOut className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-blue-700 font-semibold">You have checked out</p>
                        <p className="text-sm text-blue-600">
                          Checked out at {attendanceData.check_out_time}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                        <LogIn className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-600">Ready to check in</p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        onClick={handleCheckIn}
                        disabled={attendanceData?.check_in_time || attendanceData?.check_out_time}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                          attendanceData?.check_in_time || attendanceData?.check_out_time
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/25'
                        }`}
                      >
                        <LogIn className="w-5 h-5 inline mr-2" />
                        Check In
                      </button>
                      
                      <button
                        onClick={handleCheckOut}
                        disabled={!attendanceData?.check_in_time || !!attendanceData?.check_out_time}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                          attendanceData?.check_in_time && !attendanceData?.check_out_time
                            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <LogOut className="w-5 h-5 inline mr-2" />
                        Check Out
                      </button>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Break Management */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Break Management</h2>
              
              {/* Active Breaks */}
              {activeBreaks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Active Breaks</h3>
                  <div className="space-y-2">
                    {activeBreaks.map((breakItem) => (
                      <div key={breakItem.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <Timer className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-red-700">
                            {breakItem.break_type.charAt(0).toUpperCase() + breakItem.break_type.slice(1)} Break
                          </span>
                        </div>
                        <button
                          onClick={() => handleBreakEnd(breakItem.id)}
                          className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          End Break
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Break Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {breakTypes.map((breakType) => {
                  const isActive = activeBreaks.some(b => b.break_type === breakType.type);
                  const Icon = breakType.icon;
                  
                  return (
                    <button
                      key={breakType.type}
                      onClick={() => handleBreakStart(breakType.type)}
                      disabled={!isCheckedIn || isActive || attendanceData?.check_out_time}
                      className={`p-4 rounded-xl text-center transition-all duration-300 ${
                        !isCheckedIn || isActive || attendanceData?.check_out_time
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : `${breakType.color} hover:opacity-90 text-white shadow-lg`
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-semibold">{breakType.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Today's Break Summary */}
              {attendanceData && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">Today's Breaks</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{attendanceData.total_breaks_taken || 0}</p>
                      <p className="text-xs text-gray-500">Total Breaks</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{attendanceData.total_break_duration_minutes || 0}m</p>
                      <p className="text-xs text-gray-500">Total Time</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Working Hours Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Working Hours</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getWeeklyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance Status Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getStatusDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getStatusDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
          )}

          {activeTab === 'sheet' && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-blue-600 rounded-lg p-6 text-white shadow-md">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Attendance Records</h2>
                    <p className="text-blue-100 text-sm">
                      <span className="font-semibold">{
                        monthlyAttendance.filter(r => 
                          statusFilter === 'All Status' || r.status === statusFilter
                        ).length
                      }</span> records in <span className="font-semibold">{
                        new Date(2026, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long' })
                      } {selectedYear}</span>
                    </p>
                  </div>
                  
                  {/* Month/Year Navigation */}
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

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow border-l-4 border-blue-600">
                  <p className="text-gray-600 text-xs font-semibold uppercase">Total</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{monthlyAttendance.length}</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow border-l-4 border-green-600">
                  <p className="text-gray-600 text-xs font-semibold uppercase">Present</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {monthlyAttendance.filter(r => r.status === 'Present').length}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow border-l-4 border-orange-600">
                  <p className="text-gray-600 text-xs font-semibold uppercase">Late</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {monthlyAttendance.filter(r => r.status === 'Late').length}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow border-l-4 border-red-600">
                  <p className="text-gray-600 text-xs font-semibold uppercase">Absent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {monthlyAttendance.filter(r => r.status === 'Absent').length}
                  </p>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="space-y-3">
                <p className="text-gray-700 font-bold text-sm uppercase tracking-wide">Filter by Status</p>
                <div className="flex flex-wrap gap-2">
                  {/* All Status Button */}
                  <button
                    onClick={() => setStatusFilter('All Status')}
                    className={`px-6 py-3 rounded-full font-semibold transition-all text-sm shadow-md ${
                      statusFilter === 'All Status'
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    📊 All ({monthlyAttendance.length})
                  </button>

                  {/* Present Button */}
                  <button
                    onClick={() => setStatusFilter('Present')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      statusFilter === 'Present'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Present ({monthlyAttendance.filter(r => r.status === 'Present').length})
                  </button>

                  <button
                    onClick={() => setStatusFilter('Late')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      statusFilter === 'Late'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Late ({monthlyAttendance.filter(r => r.status === 'Late').length})
                  </button>

                  <button
                    onClick={() => setStatusFilter('Absent')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      statusFilter === 'Absent'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Absent ({monthlyAttendance.filter(r => r.status === 'Absent').length})
                  </button>

                  <button
                    onClick={() => setStatusFilter('Leave')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      statusFilter === 'Leave'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Leave ({monthlyAttendance.filter(r => r.status === 'Leave').length})
                    </button>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden relative z-10">
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 text-white">
                  <h2 className="text-lg font-bold">Detailed Attendance</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-500 text-white">
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
                      {monthlyAttendance.filter(r => 
                        statusFilter === 'All Status' || r.status === statusFilter
                      ).length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                            No attendance records found for the selected filters
                          </td>
                        </tr>
                      ) : (() => {
                        const filteredRecords = monthlyAttendance.filter(r => 
                          statusFilter === 'All Status' || r.status === statusFilter
                        );
                        const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
                        const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
                        const endIndex = startIndex + RECORDS_PER_PAGE;
                        const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

                        return paginatedRecords.map((record, index) => (
                          <tr key={record.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {new Date(record.attendance_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {record.check_in_time || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {record.check_out_time || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                record.status === 'Present' ? 'bg-green-100 text-green-700' :
                                record.status === 'Late' ? 'bg-orange-100 text-orange-700' :
                                record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {record.net_working_time_minutes 
                                ? `${Math.floor(record.net_working_time_minutes / 60)}h ${record.net_working_time_minutes % 60}m`
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {record.total_breaks_taken || 0} ({record.total_break_duration_minutes || 0}m)
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {record.late_by_minutes ? `${record.late_by_minutes}m` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {record.overtime_minutes > 0 ? (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  {Math.floor(record.overtime_minutes / 60)}h {record.overtime_minutes % 60}m
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {(() => {
                  const filteredRecords = monthlyAttendance.filter(r => 
                    statusFilter === 'All Status' || r.status === statusFilter
                  );
                  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
                  
                  return totalPages > 1 ? (
                    <div className="border-t border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                        <span className="ml-4">Total: <span className="font-semibold text-gray-900">{filteredRecords.length}</span> records</span>
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
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HRMyAttendance;