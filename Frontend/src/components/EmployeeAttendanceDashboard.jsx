import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DashboardHeader } from './DashboardComponents';
import AttendanceCorrectionModal from './AttendanceCorrectionModal';
import { useAuth } from '../context/AuthContext';
import { endpoints } from '../config/api';
import { getPakistanDate } from '../utils/timezone';
import EmployeeSidebar from './EmployeeSidebar';
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
  Shield,
  Edit3
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

const parseAttendanceDate = (dateStr) => {
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

const EmployeeAttendanceDashboard = () => {
  const { user, role } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeBreaks, setActiveBreaks] = useState([]);
  const [breakTimers, setBreakTimers] = useState({});
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('monthly');
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [isOverlapWindow, setIsOverlapWindow] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionRecord, setCorrectionRecord] = useState(null);

  const [leaveSummary, setLeaveSummary] = useState({
    casual: { used: 0, total: 8 },
    sick:   { used: 0, total: 8 },
    annual: { used: 0, total: 12 }
  });

  const getEmployeeId = () => {
    const id = user?.employeeId || user?.employee_id || user?.id;
    console.log('[INFO] Getting employee ID:', { 
      user, 
      employeeId: user?.employeeId,
      employee_id: user?.employee_id,
      id: user?.id,
      resolved: id 
    });
    return id;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log('[INFO] EmployeeAttendanceDashboard mounted with user:', user);
    Promise.all([
      fetchTodayAttendance(),
      fetchPendingCheckout(),
      fetchActiveBreaks(),
      fetchMonthlyAttendance(),
      fetchLeaveBalance(),
    ]).catch(err => console.error('Initial fetch error:', err));
  }, []);

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
          if (elapsedSeconds < 0) elapsedSeconds += 24 * 3600;
          
          newTimers[breakItem.id] = elapsedSeconds;
        }
      });
      setBreakTimers(newTimers);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [activeBreaks]);

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

  const isInOverlapWindow = () => {
    const now = getPakistanDate ? getPakistanDate() : new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMin;
    const nineAM = 9 * 60;
    const ninePM = 21 * 60;
    
    return currentTotalMinutes >= nineAM && currentTotalMinutes < ninePM;
  };

  const fetchPendingCheckout = async () => {
    try {
      const token = localStorage.getItem('token');
      const employeeId = getEmployeeId();
      
      if (!employeeId) {
        setPendingCheckout(null);
        return;
      }

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
        setPendingCheckout(null);
      }
    } catch (error) {
      console.error('Error checking pending checkout:', error);
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
        const todayRecord = data.data;
        console.log('[SUCCESS] Today attendance data:', todayRecord);
        setAttendanceData(todayRecord);
        setIsCheckedIn(data.isCheckedIn || (todayRecord.check_in_time && !todayRecord.check_out_time));
      } else {
        console.warn('[WARNING] No attendance data received:', data);
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
      
      if (!employeeId) {
        console.log('[WARNING] No employee ID available for monthly attendance fetch');
        return;
      }
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const response = await fetch(endpoints.attendance.monthly(employeeId, currentYear, currentMonth), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log('[SUCCESS] Monthly attendance fetched:', data.data);
        setMonthlyAttendance(data.data || []);
      } else {
        console.warn('[WARNING] Failed to fetch monthly attendance:', data);
      }
    } catch (error) {
      console.error('[ERROR] Error fetching monthly attendance:', error);
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

  const fetchLeaveBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const employeeId = getEmployeeId();
      
      if (!employeeId) {
        console.log('[WARNING] No employee ID available for leave balance fetch');
        return;
      }

      console.log('[INFO] Fetching leave balance for employee:', employeeId);
      const response = await fetch(endpoints.leaves.employeeBalance(employeeId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log('[SUCCESS] Leave balance fetched:', data);
        setLeaveSummary({
          casual: {
            used: data.casual.used,
            total: data.casual.total,
            remaining: data.casual.remaining
          },
          sick: {
            used: data.sick.used,
            total: data.sick.total,
            remaining: data.sick.remaining
          },
          annual: {
            used: data.annual.used,
            total: data.annual.total,
            remaining: data.annual.remaining
          }
        });
      } else {
        console.warn('[WARNING] Failed to fetch leave balance:', data);
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
        await fetchPendingCheckout();
        await fetchMonthlyAttendance();
      } else {
        console.error('[ERROR] Check-in failed:', data.message);
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
        await fetchPendingCheckout();
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
      
      const breakRecord = activeBreaks.find(b => b.id === breakId);
      if (!breakRecord) {
        toast.error('Break record not found');
        return;
      }

      const [startHour, startMin, startSec] = breakRecord.break_start_time.split(':').map(Number);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentSec = now.getSeconds();
      
      const startTotalSeconds = (startHour * 3600) + (startMin * 60) + (startSec || 0);
      const nowTotalSeconds = (currentHour * 3600) + (currentMin * 60) + currentSec;
      
      let durationSeconds = nowTotalSeconds - startTotalSeconds;
      if (durationSeconds < 0) {
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
    
    const [checkInHour, checkInMin, checkInSec] = attendanceData.check_in_time.split(':').map(Number);
    const checkInTotalMinutes = checkInHour * 60 + checkInMin;
    
    let checkOutTotalMinutes = 0;
    let isCurrentTime = false;
    
    if (attendanceData.check_out_time) {
      const [checkOutHour, checkOutMin, checkOutSec] = attendanceData.check_out_time.split(':').map(Number);
      checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
    } else {
      const now = getPakistanDate ? getPakistanDate() : new Date();
      checkOutTotalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
      isCurrentTime = true;
    }
    
    let grossMinutes = 0;
    const isNightShift = checkInTotalMinutes >= 21 * 60;
    
    if (isNightShift) {
      if (checkOutTotalMinutes >= checkInTotalMinutes) {
        grossMinutes = checkOutTotalMinutes - checkInTotalMinutes;
      } else {
        const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
        const minutesAfterMidnight = checkOutTotalMinutes;
        grossMinutes = minutesUntilMidnight + minutesAfterMidnight;
      }
    } else if (checkOutTotalMinutes < checkInTotalMinutes) {
      const minutesUntilMidnight = (24 * 60) - checkInTotalMinutes;
      const minutesAfterMidnight = checkOutTotalMinutes;
      grossMinutes = minutesUntilMidnight + minutesAfterMidnight;
    } else {
      grossMinutes = checkOutTotalMinutes - checkInTotalMinutes;
    }
    
    const hours = Math.floor(grossMinutes / 60);
    const minutes = grossMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = () => {
    if (!attendanceData?.check_in_time) return 'text-[#009336]';
    if (attendanceData?.check_out_time) return 'text-[#009336]';
    return attendanceData?.status === 'Present' ? 'text-green-500' : 
           attendanceData?.status === 'Late' ? 'text-orange-500' : 'text-orange-500';
  };

  const getStatusText = () => {
    if (!attendanceData?.check_in_time) return 'Not Checked In';
    if (attendanceData?.check_out_time) return 'Checked Out';
    
    if (attendanceData?.check_in_time) {
      const [hour, min] = attendanceData.check_in_time.split(':').map(Number);
      const checkInMinutes = hour * 60 + min;
      const shiftStart = 21 * 60;
      const nineAM = 9 * 60;
      
      if (checkInMinutes >= nineAM && checkInMinutes < shiftStart) {
        return 'Present';
      }
    }
    
    return attendanceData?.status || 'Present';
  };

  const getWeeklyData = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weekDays = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      weekDays[dateStr] = { hours: 0, status: 'Absent', raw_minutes: 0 };
    }
    
    monthlyAttendance
      .filter(r => {
        const recordDate = parseAttendanceDate(r.attendance_date);
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      })
      .forEach(record => {
        const dateStr = parseAttendanceDate(record.attendance_date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        let hours = record.net_working_time_minutes ? Math.floor(record.net_working_time_minutes / 60) : 0;
        let rawMinutes = record.net_working_time_minutes || 0;
        
        const recordDate = parseAttendanceDate(record.attendance_date);
        const isToday = recordDate.toDateString() === today.toDateString();
        if (isToday && record.check_in_time && !record.check_out_time) {
          const [checkInHour, checkInMin, checkInSec] = record.check_in_time.split(':').map(Number);
          const checkInTotalMinutes = checkInHour * 60 + checkInMin;
          
          const now = new Date();
          const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
          
          let grossMinutes = 0;
          const isNightShift = checkInTotalMinutes >= 21 * 60;
          
          if (isNightShift) {
            const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
            const minutesAfterMidnight = currentTotalMinutes;
            grossMinutes = minutesUntilMidnight + minutesAfterMidnight;
          } else {
            const timeDifferenceMinutes = currentTotalMinutes - checkInTotalMinutes;
            if (timeDifferenceMinutes >= 0) {
              grossMinutes = timeDifferenceMinutes;
            } else {
              const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
              const minutesAfterMidnight = currentTotalMinutes;
              grossMinutes = minutesUntilMidnight + minutesAfterMidnight;
            }
          }
          
          const breakMinutes = record.total_break_duration_minutes || 0;
          const netMinutes = Math.max(0, grossMinutes - breakMinutes);
          
          hours = Math.floor(netMinutes / 60);
          rawMinutes = netMinutes;
        }
        
        weekDays[dateStr] = {
          hours: hours,
          status: record.status,
          raw_minutes: rawMinutes
        };
      });
    
    const weekData = Object.entries(weekDays).map(([date, data]) => ({
      date: date,
      hours: data.hours,
      status: data.status,
      raw_minutes: data.raw_minutes
    }));
    
    return weekData;
  };

  const getMonthlyChartData = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    const monthDays = {};
    for (let i = 1; i <= today.getDate(); i++) {
      const date = new Date(currentYear, today.getMonth(), i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      monthDays[dateStr] = { hours: 0, status: 'Absent', raw_minutes: 0 };
    }
    
    monthlyAttendance
      .filter(r => {
        const recordDate = new Date(r.attendance_date);
        return recordDate.getFullYear() === currentYear && 
               recordDate.getMonth() === today.getMonth() &&
               recordDate.getDate() <= today.getDate();
      })
      .forEach(record => {
        const dateStr = parseAttendanceDate(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        let hours = record.net_working_time_minutes ? Math.floor(record.net_working_time_minutes / 60) : 0;
        let rawMinutes = record.net_working_time_minutes || 0;
        
        const recordDate = parseAttendanceDate(record.attendance_date);
        const isToday = recordDate.toDateString() === today.toDateString();
        if (isToday && record.check_in_time && !record.check_out_time) {
          const [checkInHour, checkInMin, checkInSec] = record.check_in_time.split(':').map(Number);
          const checkInTotalMinutes = checkInHour * 60 + checkInMin;
          
          const now = new Date();
          const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
          
          let grossMinutes = 0;
          const isNightShift = checkInTotalMinutes >= 21 * 60;
          
          if (isNightShift) {
            const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
            const minutesAfterMidnight = currentTotalMinutes;
            grossMinutes = minutesUntilMidnight + minutesAfterMidnight;
          } else {
            const timeDifferenceMinutes = currentTotalMinutes - checkInTotalMinutes;
            if (timeDifferenceMinutes >= 0) {
              grossMinutes = timeDifferenceMinutes;
            } else {
              const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
              const minutesAfterMidnight = currentTotalMinutes;
              grossMinutes = minutesUntilMidnight + minutesAfterMidnight;
            }
          }
          
          const breakMinutes = record.total_break_duration_minutes || 0;
          const netMinutes = Math.max(0, grossMinutes - breakMinutes);
          
          hours = Math.floor(netMinutes / 60);
          rawMinutes = netMinutes;
        }
        
        monthDays[dateStr] = {
          hours: hours,
          status: record.status,
          raw_minutes: rawMinutes
        };
      });
    
    const chartData = Object.entries(monthDays).map(([date, data]) => ({
      date: date,
      hours: data.hours,
      status: data.status,
      total: data.raw_minutes,
      days_worked: data.hours > 0 ? 1 : 0
    }));
    
    return chartData.length > 0 ? chartData : [{ date: 'No Data', hours: 0, status: 'N/A', total: 0, days_worked: 0 }];
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

  const formatTimeDisplay = (minutes) => {
    if (!minutes || minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const breakTypes = [
    { type: 'Smoke', label: 'Smoke Break', icon: Cigarette, color: 'bg-gray-500', duration: 5 },
    { type: 'Dinner', label: 'Dinner Break', icon: Utensils, color: 'bg-orange-500', duration: 60 },
    { type: 'Washroom', label: 'Washroom Break', icon: User, color: 'bg-blue-500', duration: 10 },
    { type: 'Prayer', label: 'Prayer Break', icon: Activity, color: 'bg-purple-500', duration: 10 }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <EmployeeSidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader 
          title="My Attendance Dashboard"
          subtitle="Manage your daily attendance and working hours"
          role={role}
          currentTime={currentTime}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Current Status */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    attendanceData?.check_in_time && !attendanceData?.check_out_time ? 'bg-green-100' : attendanceData?.check_out_time ? 'bg-blue-100' : 'bg-white'
                  }`}>
                    <CheckCircle className={`w-6 h-6 ${getStatusColor()}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-green-800">Status</h3>
                    <p className={`text-xl font-bold ${getStatusColor()}`}>
                      {getStatusText()}
                    </p>
                  </div>
                </div>
              </div>
              {attendanceData?.check_in_time && (
                <p className="text-sm text-green">
                  Checked in at: {attendanceData.check_in_time}
                </p>
              )}
            </div>

            {/* Working Hours */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-blue-800">Working Hours</h3>
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
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <PauseCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-purple-800">Total Breaks</h3>
                    <p className="text-xl font-bold text-purple-600">
                      {attendanceData?.total_breaks_taken || 0}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Time: {formatTimeDisplay(attendanceData?.total_break_duration_minutes || 0)}
              </p>
            </div>

            {/* Late Arrivals */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-orange-800">Late By</h3>
                    <p className="text-xl font-bold text-orange-600">
                      {(() => {
                        if (attendanceData?.check_in_time) {
                          const [hour, min] = attendanceData.check_in_time.split(':').map(Number);
                          const checkInMinutes = hour * 60 + min;
                          const shiftStart = 21 * 60;
                          const nineAM = 9 * 60;
                          
                          if (checkInMinutes >= nineAM && checkInMinutes < shiftStart) {
                            return '0m';
                          }
                        }
                        return (attendanceData?.late_by_minutes || 0) + 'm';
                      })()}
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

                    <div className="flex gap-4 mb-4">
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

                    {/* Leave Summary */}
                    <div className="mt-10 w-full">
                      <h1 className="text-sm font-semibold text-gray-700 mb-3">Leave Summary</h1>
                      <div className="flex flex-col sm:flex-row gap-4 w-full items-stretch justify-between">
                        <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[86px]">
                          <p className="text-sm text-gray-600">Casual Leaves</p>
                          <p className="text-xs text-gray-500 mt-1">Used/ Total</p>
                          <p className="text-2xl font-bold text-gray-900 mt-3">{leaveSummary.casual.used}/{leaveSummary.casual.total}</p>
                        </div>

                        <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[86px]">
                          <p className="text-sm text-gray-600">Sick Leaves</p>
                          <p className="text-xs text-gray-500 mt-1">Used/ Total</p>
                          <p className="text-2xl font-bold text-gray-900 mt-3">{leaveSummary.sick.used}/{leaveSummary.sick.total}</p>
                        </div>

                        <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[86px]">
                          <p className="text-sm text-gray-600">Annual Leaves</p>
                          <p className="text-xs text-gray-500 mt-1">Used/ Total</p>
                          <p className="text-2xl font-bold text-gray-900 mt-3">{leaveSummary.annual.used}/{leaveSummary.annual.total}</p>
                        </div>
                      </div>
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
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PauseCircle className="w-6 h-6 text-purple-600" />
                Break Management
              </h2>
              
              {/* Break Type Cards Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {breakTypes.map((breakType) => {
                  const Icon = breakType.icon;
                  const isActive = activeBreaks.some(b => b.break_type === breakType.type);
                  
                  return (
                    <button
                      key={breakType.type}
                      onClick={() => handleBreakStart(breakType.type)}
                      disabled={!isCheckedIn || isActive || attendanceData?.check_out_time}
                      className={`p-5 rounded-xl text-center transition-all duration-300 border ${
                        !isCheckedIn || isActive || attendanceData?.check_out_time
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md text-gray-900'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2 opacity-70" />
                      <div className="text-sm font-semibold">{breakType.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{breakType.duration}m</div>
                    </button>
                  );
                })}
              </div>

              {/* Active Breaks Alert */}
              {activeBreaks.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Active Breaks
                  </h3>
                  <div className="space-y-2">
                    {activeBreaks.map((breakItem) => (
                      <div key={breakItem.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">
                            {breakItem.break_type.charAt(0).toUpperCase() + breakItem.break_type.slice(1)} Break
                          </span>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                                style={{
                                  width: `${Math.min(100, (breakTimers[breakItem.id] || 0) / (breakItem.break_type === 'Dinner' ? 60 : breakItem.break_type === 'Smoke' ? 5 : 10) * 100)}%`
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-700 min-w-[50px]">
                              {formatElapsedTime(breakTimers[breakItem.id] || 0)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleBreakEnd(breakItem.id)}
                          className="ml-3 text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-colors whitespace-nowrap"
                        >
                          End Break
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Break Summary */}
              {attendanceData && (
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Today's Breaks</h3>
                  
                  {/* Main Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700 font-medium">Total Breaks:</p>
                      <p className="text-2xl font-bold text-purple-600">{attendanceData.total_breaks_taken || 0}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700 font-medium">Total Time:</p>
                      <p className="text-2xl font-bold text-purple-600">{formatTimeDisplay(attendanceData.total_break_duration_minutes || 0)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700 font-medium">Active:</p>
                      <p className="text-2xl font-bold text-purple-600">{activeBreaks.length}</p>
                    </div>
                  </div>
                  
                  {/* Break Details by Type */}
                  <div className="pt-4 border-t border-purple-200">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Break Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">Smoke Break:</span>
                        <span className="font-semibold text-purple-600">0x</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">Dinner Break:</span>
                        <span className="font-semibold text-purple-600">0x</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">Washroom Break:</span>
                        <span className="font-semibold text-purple-600">0x</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">Prayer Break:</span>
                        <span className="font-semibold text-purple-600">0x</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="space-y-6 mt-8">
            {/* Chart View Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Working Hours Trend</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setChartView('monthly')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      chartView === 'monthly'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Working Hours Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={
                  chartView === 'monthly' ? getMonthlyChartData() :
                  getWeeklyData()
                }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value) => `${value}h`}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="hours" fill="#3b82f6" name="Working Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
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
        </main>
      </div>

      {/* Attendance Correction Modal */}
      <AttendanceCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => { setCorrectionModalOpen(false); setCorrectionRecord(null); }}
        record={correctionRecord}
        onSubmitted={() => fetchMonthlyAttendance()}
      />
    </div>
  );
};

export default EmployeeAttendanceDashboard;
