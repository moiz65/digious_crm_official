import { useState, useEffect } from 'react';
import { endpoints } from '../config/api';
import { getPakistanTimeString, getPakistanDate } from '../utils/timezone';
import {
  Calendar,
  CheckCircle,
  Clock,
  LogIn,
  LogOut,
  Calculator,
  Scale,
  Check,
  X,
  Clock4,
  Cigarette,
  ToiletIcon,
  Calendar1,
  Utensils,
  Users,
  AlertCircle,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  ChevronDown,
  Settings,
  UserCheck,
  UserX,
  Send,
  Mail,
  Bell,
  Shield,
  Zap,
  Crown,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  User,
  Target,
  Grid,
  List,
  MessageCircle,
  FileText,
  Activity,
  Wifi,
  Sparkle,
  RotateCcw,
  Building,
  ChevronUp,
  ArcElement,
  ShieldUser,
  Table,
  TrendingUp,
  LineChart,
  PauseCircle,
  Coffee
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart as ReLineChart, 
  Line, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Helper function to get consistent employee ID from localStorage
const getEmployeeId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Always use user.id or user.userId (from user_as_employees table)
  // This ensures consistency with attendance records
  return user.userId || user.id || 2;
};

/**
 * Parse a time string in Pakistan timezone (UTC+5)
 * Input: "21:56:00" (from API, in Pakistan time)
 * Returns: Date object representing that time in Pakistan timezone
 */
const parsePakistanTime = (dateStr, timeStr) => {
  if (!timeStr) return null;
  
  try {
    // The database stores times as HH:MM:SS in Pakistan timezone (UTC+5)
    // Example: check_in_time: "00:54:22" means 00:54:22 Pakistan time
    // 
    // Simply create a Date object using the time string as-is
    // WITHOUT any timezone conversions, since the times are already in Pakistan timezone
    
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    
    // Create a date using the Pakistan time values directly
    // This represents the moment in Pakistan timezone
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(seconds);
    date.setMilliseconds(0);
    
    // Set the date component from dateStr
    const [year, month, day] = dateStr.split('-').map(Number);
    date.setFullYear(year);
    date.setMonth(month - 1);
    date.setDate(day);
    
    return date;
  } catch (error) {
    console.error('Error parsing Pakistan time:', error);
    return new Date(`${dateStr}T${timeStr}`);
  }
};

/**
 * Format a Pakistan time string (HH:MM:SS) to 12-hour format
 * Input: "23:23:24" (Pakistan timezone)
 * Output: "11:23 PM"
 */
const formatPakistanTimeString = (timeStr) => {
  if (!timeStr) return 'N/A';
  
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  } catch (error) {
    console.error('Error formatting Pakistan time:', error);
    return timeStr;
  }
};

// Custom hook for attendance management
export const useAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [systemAttendance, setSystemAttendance] = useState({
    checkedIn: false,
    checkInTime: null,
    checkOutTime: null,
    totalWorkingTime: 0,
    isOnBreak: false,
    lastUpdate: new Date(),
    status: 'pending'
  });

  const handleSystemCheckIn = async () => {
    try {
      // Try both token storage keys
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Use consistent employee ID
      const employeeId = getEmployeeId();
      const email = user.email || 'test@example.com';
      const name = user.name || 'Employee';

      if (!token) {
        throw new Error('Authentication token not found. Please login first.');
      }

      console.log('Check-in request:', { employeeId, email, name, token: token.substring(0, 20) + '...' });

      const response = await fetch(
        endpoints.attendance.checkIn,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employee_id: employeeId,
            email: email,
            name: name,
            device_info: navigator.userAgent,
            ip_address: '127.0.0.1'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Check-in failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const now = getPakistanDate();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        const gracePeriodEnd = 22 * 60 + 15; // 22:15 = 1335 minutes
        const isLate = totalMinutes > gracePeriodEnd;
        
        console.log('Check-in response:', data.message);

        // Update attendance data
        const today = now.toISOString().split('T')[0];
        setAttendanceData(prev => {
          const existingIndex = prev.findIndex(day => day.date === today);
          
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              status: isLate ? 'late' : 'present',
              checkIn: now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              remarks: isLate ? 'Late arrival' : 'On time'
            };
            return updated;
          } else {
            return [...prev, {
              date: today,
              day: now.getDate(),
              status: isLate ? 'late' : 'present',
              checkIn: now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              checkOut: '-',
              hours: '0.0',
              remarks: isLate ? 'Late arrival' : 'On time'
            }];
          }
        });

        setSystemAttendance(prev => ({
          ...prev,
          checkedIn: true,
          checkInTime: prev.checkInTime || now,  // Keep existing check-in time if already checked in
          checkOutTime: null,
          totalWorkingTime: 0,
          isOnBreak: false,
          lastUpdate: now,
          status: isLate ? 'late' : 'present'
        }));

        return {
          timeString: now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          isLate: isLate
        };

        return {
          timeString: now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          isLate: isLate
        };
      } else {
        throw new Error(data.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error.message);
      throw error;
    }
  };

  const handleSystemCheckOut = async () => {
    try {
      // Try both token storage keys
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Use consistent employee ID
      const employeeId = getEmployeeId();

      if (!token) {
        throw new Error('Authentication token not found. Please login first.');
      }

      // Get current time in Pakistan timezone (HH:MM:SS format)
      const checkOutTimeFromClient = getPakistanTimeString();

      console.log('🔴 Checkout request - employeeId:', employeeId, 'checkOutTime:', checkOutTimeFromClient, 'user:', user);

      const response = await fetch(
        endpoints.attendance.checkOut,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employee_id: employeeId,
            check_out_time: checkOutTimeFromClient
          })
        }
      );

      console.log('🔴 Checkout response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `Check-out failed: ${response.statusText}`;
        console.error('❌ Checkout API error:', errorMsg, 'Status:', response.status);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('🔴 Checkout response data:', data);

      if (data.success) {
        console.log('✅ Checkout successful');
        const now = new Date();
        const netWorkingMinutes = data.data?.net_working_time_minutes || 0;
        const checkOutTimeFromApi = data.data?.check_out_time || now.toTimeString().split(' ')[0];
        const hours = netWorkingMinutes / 60;

        setSystemAttendance(prev => ({
          ...prev,
          checkedIn: false,
          checkOutTime: new Date(`${now.toISOString().split('T')[0]}T${checkOutTimeFromApi}`),
          lastUpdate: now,
          totalWorkingTime: netWorkingMinutes
        }));
        
        // Refresh attendance data to ensure database sync
        setTimeout(() => fetchAttendanceData(), 500);

        // Update attendance data
        const today = now.toISOString().split('T')[0];
        setAttendanceData(prev => {
          const existingIndex = prev.findIndex(day => day.date === today);
          
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              checkOut: now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              hours: hours.toFixed(1),
              remarks: hours >= 9 ? 'Full day' : 'Short day'
            };
            return updated;
          } else {
            return prev;
          }
        });

        return {
          timeString: now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          hours: hours.toFixed(1)
        };
      } else {
        throw new Error(data.message || 'Check-out failed');
      }
    } catch (error) {
      console.error('Check-out error:', error.message);
      throw error;
    }
  };

  const updateWorkingTime = () => {
    if (systemAttendance.checkedIn && systemAttendance.checkInTime) {
      const now = new Date();
      
      // Ensure checkInTime is a Date object (in case it's a string from API)
      let checkInDate = systemAttendance.checkInTime;
      if (typeof checkInDate === 'string') {
        checkInDate = new Date(checkInDate);
      }
      
      // Validate that we have a valid Date
      if (!(checkInDate instanceof Date) || isNaN(checkInDate)) {
        console.error('❌ Invalid checkInTime format:', systemAttendance.checkInTime);
        return;
      }
      
      // Calculate elapsed time from check-in time to now (in minutes)
      const elapsedMinutes = (now - checkInDate) / (1000 * 60);
      
      // Debug logging for time calculation
      console.log(`⏱️ TIME UPDATE: checkInDate=${checkInDate.toLocaleString()}, now=${now.toLocaleString()}, elapsedMinutes=${elapsedMinutes.toFixed(2)}`);
      
      // ⚠️ SAFETY CHECK: If session has been open for 24+ hours, alert
      if (elapsedMinutes >= 24 * 60) {
        const hoursElapsed = (elapsedMinutes / 60).toFixed(1);
        console.warn(`⚠️ SESSION ALERT: Session open for ${hoursElapsed} hours. Should auto-checkout.`);
      }
      
      // Only update if the value actually changes (to reduce unnecessary re-renders)
      setSystemAttendance(prev => {
        const prevTotalTime = prev.totalWorkingTime || 0;
        // Update every second for smooth timer (was 0.5 minutes)
        if (Math.abs(elapsedMinutes - prevTotalTime) > 0.016) {
          console.log(`📊 STATE UPDATE: totalWorkingTime ${prevTotalTime.toFixed(2)} -> ${elapsedMinutes.toFixed(2)}`);
          return {
            ...prev,
            totalWorkingTime: elapsedMinutes,
            lastUpdate: now
          };
        }
        return prev;
      });

      // Update hours in attendance data
      const now2 = new Date();
      const today = now2.toISOString().split('T')[0];
      const hours = elapsedMinutes / 60;
      
      setAttendanceData(prev => {
        const existingIndex = prev.findIndex(day => day.date === today);
        if (existingIndex >= 0) {
          const updated = [...prev];
          const newHours = hours.toFixed(1);
          if (updated[existingIndex].hours !== newHours) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              hours: newHours
            };
            return updated;
          }
        }
        return prev;
      });
    }
  };

  const setBreakStatus = (isOnBreak) => {
    setSystemAttendance(prev => ({
      ...prev,
      isOnBreak: isOnBreak,
      lastUpdate: new Date()
    }));
  };

  const getTodayStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = attendanceData.find(day => day.date === today);
    
    if (todayData) {
      return todayData;
    }

    // Fallback: if no record in attendanceData but systemAttendance shows checked in,
    // return the system state
    if (systemAttendance.checkedIn && systemAttendance.checkInTime) {
      return {
        date: today,
        day: new Date().getDate(),
        status: systemAttendance.status || 'present',
        checkIn: systemAttendance.checkInTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        checkOut: systemAttendance.checkOutTime ? 
          systemAttendance.checkOutTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }) : '-',
        hours: (systemAttendance.totalWorkingTime / 60).toFixed(1),
        remarks: systemAttendance.checkOutTime ? 'Checked out' : 'Currently working'
      };
    }

    return {
      date: today,
      day: new Date().getDate(),
      status: 'Not Checked In',
      checkIn: systemAttendance.checkInTime ? 
        systemAttendance.checkInTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : 'Invalid Date',
      checkOut: systemAttendance.checkOutTime ? 
        systemAttendance.checkOutTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : '-',
      hours: (systemAttendance.totalWorkingTime / 60).toFixed(1),
      remarks: systemAttendance.checkedIn ? 'Currently working' : 'Not checked in yet'
    };
  };

  const getAttendanceStats = () => {
    const present = attendanceData.filter(day => 
      day.status && (day.status.toLowerCase() === 'present')
    ).length;
    const late = attendanceData.filter(day => 
      day.status && day.status.toLowerCase() === 'late'
    ).length;
    const absent = attendanceData.filter(day => 
      day.status && day.status.toLowerCase() === 'absent'
    ).length;
    const workingDays = attendanceData.filter(day => 
      day.status && day.status !== 'off' && day.status !== 'Pending'
    ).length;
    
    const attendancePercentage = workingDays > 0 ? 
      Math.round(((present + late) / workingDays) * 100) : 0;

    return {
      present,
      absent,
      late,
      workingDays,
      attendancePercentage
    };
  };

  // Fetch attendance data function
  const fetchAttendanceData = async () => {
    try {
      // Get token from localStorage (try both keys)
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('📦 localStorage user:', user);
      // Use consistent employee ID
      const employeeId = getEmployeeId();
      
      console.log('👤 Retrieved user object:', user);
      console.log('🔑 Using employeeId:', employeeId);
      
      if (!token) {
        console.log('No authentication token found - skipping attendance fetch');
        return;
      }

      console.log('Fetching attendance for employee:', employeeId);

      // Fetch today's attendance
      const response = await fetch(
        endpoints.attendance.today(employeeId),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn(`Attendance fetch status: ${response.status} - ${response.statusText}`);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const attendanceRecord = data.data;
        const isCheckedIn = data.isCheckedIn || (attendanceRecord.check_out_time === null && attendanceRecord.check_in_time !== null);
        
        // Extract date as YYYY-MM-DD format (handle ISO timestamps)
        // The API returns attendance_date which may be UTC or a date string
        let attendanceDateStr;
        if (typeof attendanceRecord.attendance_date === 'string' && attendanceRecord.attendance_date.includes('T')) {
          // It's an ISO string like "2026-01-02T19:00:00.000Z"
          attendanceDateStr = attendanceRecord.attendance_date.split('T')[0];
        } else if (typeof attendanceRecord.attendance_date === 'string') {
          // It's already a date string like "2026-01-02"
          attendanceDateStr = attendanceRecord.attendance_date;
        } else {
          // Fallback to today
          attendanceDateStr = new Date().toISOString().split('T')[0];
        }
        
        // Parse check-in and check-out times
        // The API returns check_in_time as HH:MM:SS and attendance_date as YYYY-MM-DD
        // These are in Pakistan time (UTC+5), NOT UTC
        const checkInTime = attendanceRecord.check_in_time 
          ? parsePakistanTime(attendanceDateStr, attendanceRecord.check_in_time)
          : null;
        const checkOutTime = attendanceRecord.check_out_time
          ? parsePakistanTime(attendanceDateStr, attendanceRecord.check_out_time)
          : null;
        
        console.log('📊 Fetched Attendance Data:');
        console.log('   Raw API response:', attendanceRecord);
        console.log('   Date:', attendanceDateStr);
        console.log('   Check-in time string (raw from API):', attendanceRecord.check_in_time);
        console.log('   Check-in Date object (after parsing):', checkInTime);
        console.log('   Check-in formatted:', checkInTime ? checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'N/A');
        console.log('   Check-out time string:', attendanceRecord.check_out_time);
        console.log('   Is active session:', !attendanceRecord.check_out_time);
        
        // Update system attendance state to reflect API data
        // Employee is considered checked in if they have a check-in time and no check-out time
        // For active sessions (no checkout), calculate elapsed time from check-in
        const isActiveSession = !!checkInTime && !checkOutTime;
        let currentWorkingTime = attendanceRecord.net_working_time_minutes || 0;
        
        if (isActiveSession && checkInTime) {
          // Calculate elapsed time in minutes from check-in to now for active sessions
          const now = new Date();
          currentWorkingTime = (now - checkInTime) / (1000 * 60);
          console.log('   Current working time (calculated):', currentWorkingTime.toFixed(2), 'minutes');
        }
        
        setSystemAttendance(prev => ({
          ...prev,
          checkedIn: isActiveSession,
          checkInTime: checkInTime,
          checkOutTime: checkOutTime,
          totalWorkingTime: currentWorkingTime,
          status: attendanceRecord.status?.toLowerCase() || 'present'
        }));
        
        // Format the attendance data for display
        // Use calculated working time for active sessions
        const displayHours = isActiveSession 
          ? (currentWorkingTime / 60).toFixed(1)
          : (attendanceRecord.net_working_time_minutes ? (attendanceRecord.net_working_time_minutes / 60).toFixed(1) : '0.0');
        
        const formattedData = [{
          date: attendanceDateStr,
          day: new Date(attendanceDateStr).getDate(),
          status: attendanceRecord.status?.toLowerCase() || 'present',
          checkIn: checkInTime
            ? checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '-',
          checkOut: checkOutTime
            ? checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '-',
          hours: displayHours,
          remarks: attendanceRecord.remarks || (checkOutTime ? 'Checked out' : 'Active session'),
          breaks: attendanceRecord.breaks || [],
          total_breaks_taken: attendanceRecord.total_breaks_taken || 0,
          total_break_duration_minutes: attendanceRecord.total_break_duration_minutes || 0,
          // Include all break count fields from the API response
          smoke_break_count: attendanceRecord.smoke_break_count || 0,
          smoke_break_duration_minutes: attendanceRecord.smoke_break_duration_minutes || 0,
          dinner_break_count: attendanceRecord.dinner_break_count || 0,
          dinner_break_duration_minutes: attendanceRecord.dinner_break_duration_minutes || 0,
          washroom_break_count: attendanceRecord.washroom_break_count || 0,
          washroom_break_duration_minutes: attendanceRecord.washroom_break_duration_minutes || 0,
          prayer_break_count: attendanceRecord.prayer_break_count || 0,
          prayer_break_duration_minutes: attendanceRecord.prayer_break_duration_minutes || 0
        }];
        
        setAttendanceData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Fetch attendance data on component mount
  useEffect(() => {
    // First, fetch TODAY'S attendance to update systemAttendance state (check-in status)
    const fetchTodayData = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        // Use consistent employee ID
        const employeeId = getEmployeeId();
        
        if (!token) return;
        
        console.log('📅 Fetching TODAY\'s attendance to sync check-in status...');
        
        const response = await fetch(
          endpoints.attendance.today(employeeId),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const attendanceRecord = data.data;
            const attendanceDateStr = attendanceRecord.attendance_date.includes('T')
              ? attendanceRecord.attendance_date.split('T')[0]
              : attendanceRecord.attendance_date;
            
            // Parse check-in time using Pakistan timezone helper
            const checkInTime = attendanceRecord.check_in_time 
              ? parsePakistanTime(attendanceDateStr, attendanceRecord.check_in_time)
              : null;
            const checkOutTime = attendanceRecord.check_out_time
              ? parsePakistanTime(attendanceDateStr, attendanceRecord.check_out_time)
              : null;
            
            // Update system attendance state with today's data
            const isActiveSession = !!checkInTime && !checkOutTime;
            let currentWorkingTime = attendanceRecord.net_working_time_minutes || 0;
            
            if (isActiveSession && checkInTime) {
              const now = new Date();
              currentWorkingTime = (now - checkInTime) / (1000 * 60);
              
              console.log(`⏱️ WORKING TIME CALCULATION:`);
              console.log(`   Check-in: ${checkInTime.toLocaleString()}`);
              console.log(`   Now: ${now.toLocaleString()}`);
              console.log(`   Elapsed: ${currentWorkingTime.toFixed(2)} minutes = ${(currentWorkingTime / 60).toFixed(2)} hours`);
            }
            
            setSystemAttendance(prev => ({
              ...prev,
              checkedIn: isActiveSession,
              checkInTime: checkInTime,
              checkOutTime: checkOutTime,
              totalWorkingTime: currentWorkingTime,
              status: attendanceRecord.status?.toLowerCase() || 'present'
            }));
            
            console.log('✅ Check-in status synced: checkedIn =', isActiveSession, ', checkInTime =', checkInTime);
          }
        }
      } catch (error) {
        console.error('Error fetching today\'s attendance:', error);
      }
    };
    
    // Then fetch historical/monthly data for both charts and attendance sheet
    const fetchHistoricalData = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const employeeId = getEmployeeId();
        
        if (!token) return;
        
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        console.log(`📅 Fetching attendance for ${currentMonth}/${currentYear}...`);
        
        const response = await fetch(
          endpoints.attendance.monthly(employeeId, currentYear, currentMonth),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log(`✅ Fetched ${data.data.length} historical attendance records`);
            
            // Convert to formatted data
            const historicalData = data.data.map(record => {
              // Use the attendance_date as-is since backend now returns YYYY-MM-DD format
              // This is already the correct local date, not UTC
              const attendanceDateStr = record.attendance_date.includes('T')
                ? record.attendance_date.split('T')[0]  // If it still has time component
                : record.attendance_date;  // If it's already YYYY-MM-DD
              
              const checkInTime = record.check_in_time 
                ? parsePakistanTime(attendanceDateStr, record.check_in_time)
                : null;
              const checkOutTime = record.check_out_time
                ? parsePakistanTime(attendanceDateStr, record.check_out_time)
                : null;
                
              return {
                date: attendanceDateStr,
                day: parseInt(attendanceDateStr.split('-')[2]),  // Parse day from YYYY-MM-DD
                status: record.status?.toLowerCase() || 'present',
                checkIn: checkInTime
                  ? checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                  : '-',
                checkOut: checkOutTime
                  ? checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                  : '-',
                hours: record.net_working_time_minutes && record.net_working_time_minutes > 0 ? (record.net_working_time_minutes / 60).toFixed(1) : '-',
                grossHours: record.gross_working_time_minutes && record.gross_working_time_minutes > 0 ? (record.gross_working_time_minutes / 60).toFixed(1) : '-',
                remarks: record.remarks || (checkOutTime ? 'Checked out' : 'Active session'),
                lateByMinutes: record.late_by_minutes || 0,
                overtimeHours: record.overtime_hours && parseFloat(record.overtime_hours) > 0 ? parseFloat(record.overtime_hours).toFixed(2) : '-',
                overtimeMinutes: record.overtime_minutes || 0,
                breaks: record.breaks || [],
                total_breaks_taken: record.total_breaks_taken || 0,
                total_break_duration_minutes: record.total_break_duration_minutes || 0,
                smoke_break_count: record.smoke_break_count || 0,
                smoke_break_duration_minutes: record.smoke_break_duration_minutes || 0,
                dinner_break_count: record.dinner_break_count || 0,
                dinner_break_duration_minutes: record.dinner_break_duration_minutes || 0,
                washroom_break_count: record.washroom_break_count || 0,
                washroom_break_duration_minutes: record.washroom_break_duration_minutes || 0,
                prayer_break_count: record.prayer_break_count || 0,
                prayer_break_duration_minutes: record.prayer_break_duration_minutes || 0
              };
            });
            
            // Set monthly data for both charts and attendance sheet
            setAttendanceData(historicalData);
          }
        }
      } catch (error) {
        console.error('Error fetching historical attendance:', error);
      }
    };
    
    // Fetch today's data first to ensure check-in status is correct
    fetchTodayData();
    // Then fetch historical data
    fetchHistoricalData();
  }, []);

  return {
    attendanceData,
    systemAttendance,
    setSystemAttendance,
    handleSystemCheckIn,
    handleSystemCheckOut,
    updateWorkingTime,
    setBreakStatus,
    setAttendanceData,
    getTodayStatus,
    getAttendanceStats,
    fetchAttendanceData
  };
};

// Attendance Sheet Component with Month and Year Filters
const AttendanceSheet = ({ attendanceData, onExport, onFilter }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch monthly attendance data from API
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const employeeId = getEmployeeId();

        if (!token) {
          console.log('No authentication token found');
          return;
        }

        // API expects month as 1-12, JavaScript getMonth() returns 0-11
        const apiMonth = selectedMonth + 1;
        
        const response = await fetch(
          endpoints.attendance.monthly(employeeId, selectedYear, apiMonth),
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.warn(`Monthly data fetch failed: ${response.status}`);
          return;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          // Format API data to match attendanceData structure
          const formattedData = data.data.map(record => {
            const statusLower = record.status ? record.status.toLowerCase() : 'absent';
            const { status: _, ...rest } = record; // Exclude the original status field
            return {
              date: record.attendance_date,
              day: new Date(record.attendance_date).getDate(),
              status: statusLower,
              checkIn: record.check_in_time 
                ? parsePakistanTime(record.attendance_date, record.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                : '-',
              checkOut: record.check_out_time
                ? parsePakistanTime(record.attendance_date, record.check_out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                : '-',
              hours: record.net_working_time_minutes ? (record.net_working_time_minutes / 60).toFixed(1) : '0.0',
              overtimeHours: record.overtime_hours ? parseFloat(record.overtime_hours).toFixed(2) : '0.0',
              grossHours: record.gross_working_time_minutes ? (record.gross_working_time_minutes / 60).toFixed(1) : '0.0',
              lateByMinutes: record.late_by_minutes || 0,
              remarks: record.remarks || '-',
              ...rest  // Include all other fields EXCEPT the original capitalized status
            };
          });
          
          setMonthlyData(formattedData);
          console.log(`📅 Fetched ${formattedData.length} records for ${selectedMonth + 1}/${selectedYear}`, formattedData);
        }
      } catch (error) {
        console.error('Error fetching monthly attendance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyData();
  }, [selectedMonth, selectedYear]);

  // Use monthly data from API if available, otherwise fall back to passed attendanceData
  const dataToDisplay = monthlyData.length > 0 ? monthlyData : attendanceData;

  // Get available years - show years 2025 and 2026
  const availableYears = [2026, 2025];

  // Get available months for selected year
  const availableMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter and sort attendance data with month and year filters
  const filteredData = dataToDisplay
    .filter(record => {
      const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
      const matchesSearch = record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (record.remarks && record.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'hours':
          aValue = parseFloat(a.hours);
          bValue = parseFloat(b.hours);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'present':
        return { color: 'bg-green-100 text-green-800', text: 'Present' };
      case 'late':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Late' };
      case 'absent':
        return { color: 'bg-red-100 text-red-800', text: 'Absent' };
      case 'off':
        return { color: 'bg-gray-100 text-gray-800', text: 'Day Off' };
      default:
        return { color: 'bg-blue-100 text-blue-800', text: 'Pending' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate monthly statistics from FULL monthly data (not filtered)
  const monthlyStats = {
    present: dataToDisplay.filter(r => r.status === 'present' || r.status === 'late').length,
    late: dataToDisplay.filter(r => r.status === 'late').length,
    absent: dataToDisplay.filter(r => r.status === 'absent').length,
    totalWorkingDays: dataToDisplay.filter(r => r.status !== 'off' && r.status !== 'pending').length,
    totalHours: dataToDisplay.reduce((total, record) => total + parseFloat(record.hours || 0), 0),
    averageHours: dataToDisplay.length > 0 ? 
      (dataToDisplay.reduce((total, record) => total + parseFloat(record.hours || 0), 0) / dataToDisplay.length).toFixed(1) : 0
  };
  
  console.log('📊 Monthly Stats Debug:', {
    dataToDisplayLength: dataToDisplay.length,
    dataToDisplay: dataToDisplay,
    monthlyStats: monthlyStats
  });

  const exportToCSV = () => {
    const timestamp = new Date().toLocaleString();
    const employeeName = "MH"; // Replace with actual employee name from auth
    
    // CSV with metadata and summary
    const csvLines = [
      `"Digious CRM - Attendance Report"`,
      `"Generated:","${timestamp}"`,
      `"Employee:","${employeeName}"`,
      `"Period:","${monthNames[selectedMonth]} ${selectedYear}"`,
      `"Total Records:","${filteredData.length}"`,
      ``,
      `"Summary Statistics"`,
      `"Present Days:","${monthlyStats.present}"`,
      `"Late Arrivals:","${monthlyStats.late}"`,
      `"Absent Days:","${monthlyStats.absent}"`,
      `"Total Hours:","${monthlyStats.totalHours.toFixed(1)}"`,
      `"Average Hours/Day:","${monthlyStats.averageHours}"`,
      `"Attendance Rate:","${((monthlyStats.present / monthlyStats.totalWorkingDays) * 100).toFixed(1)}%"`,
      ``,
      `"Detailed Records"`,
      `"Date","Day","Status","Check In","Check Out","Hours","Remarks"`,
      ...filteredData.map(row => [
        `"${formatDate(row.date)}"`,
        `"${row.day}"`,
        `"${getStatusInfo(row.status).text}"`,
        `"${row.checkIn}"`,
        `"${row.checkOut}"`,
        `"${row.hours}"`,
        `"${row.remarks}"`
      ].join(','))
    ];

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Digious-Attendance-${employeeName}-${monthNames[selectedMonth]}_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Show success notification
    alert(`âœ… Attendance report exported successfully!\n\nFile: Digious-Attendance-${employeeName}-${monthNames[selectedMonth]}_${selectedYear}.csv\nRecords: ${filteredData.length}`);
  };

  // Quick month navigation
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Preloader */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-semibold">Loading...</p>
              <p className="text-xs text-slate-500 mt-1">Fetching attendance data</p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
          <p className="text-sm text-gray-600">
            Showing {filteredData.length} records for {monthNames[selectedMonth]} {selectedYear}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Month Navigation */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Previous month"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-2 py-1 border-0 focus:ring-0 text-sm font-medium"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-2 py-1 border-0 focus:ring-0 text-sm font-medium"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Next month"
            >
              <ArrowRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="off">Day Off</option>
          </select>

          {/* Export Button with Dropdown */}
          <div className="relative group">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="py-1">
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export as CSV
                </button>
                <div className="w-full px-4 py-2 text-left text-sm text-gray-400 cursor-not-allowed flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export as PDF (Soon)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution Chart */}
        <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Attendance Distribution
            </h4>
            <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">Monthly</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={[
                  { name: 'Present', value: monthlyStats.present, color: '#10b981' },
                  { name: 'Late', value: monthlyStats.late, color: '#f59e0b' },
                  { name: 'Absent', value: monthlyStats.absent, color: '#ef4444' },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Present', value: monthlyStats.present, color: '#10b981' },
                  { name: 'Late', value: monthlyStats.late, color: '#f59e0b' },
                  { name: 'Absent', value: monthlyStats.absent, color: '#ef4444' },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Present ({monthlyStats.present})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Late ({monthlyStats.late})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Absent ({monthlyStats.absent})</span>
            </div>
          </div>
        </div>

        {/* Working Hours Trend */}
        <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-600" />
              Working Hours Trend
            </h4>
            <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={filteredData.slice(-7).map(record => ({
                date: new Date(record.date).getDate(),
                hours: parseFloat(record.hours),
                status: record.status
              }))}
            >
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#6b7280' } }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="hours" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorHours)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-5 border border-green-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Present Days</div>
              <div className="text-3xl font-bold text-green-900">{monthlyStats.present}</div>
              <div className="text-xs text-green-600 mt-1">
                {monthlyStats.totalWorkingDays > 0 
                  ? Math.round((monthlyStats.present / monthlyStats.totalWorkingDays) * 100)
                  : 0}% attendance
              </div>
            </div>
            <div className="bg-green-500 rounded-lg p-2 group-hover:scale-110 transition-transform">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-5 border border-yellow-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-1">Late Arrivals</div>
              <div className="text-3xl font-bold text-yellow-900">{monthlyStats.late}</div>
              <div className="text-xs text-yellow-600 mt-1">Needs improvement</div>
            </div>
            <div className="bg-yellow-500 rounded-lg p-2 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-5 border border-red-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Absent Days</div>
              <div className="text-3xl font-bold text-red-900">{monthlyStats.absent}</div>
              <div className="text-xs text-red-600 mt-1">Unplanned leaves</div>
            </div>
            <div className="bg-red-500 rounded-lg p-2 group-hover:scale-110 transition-transform">
              <X className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Total Hours</div>
              <div className="text-3xl font-bold text-blue-900">{monthlyStats.totalHours.toFixed(0)}h</div>
              <div className="text-xs text-blue-600 mt-1">Avg: {monthlyStats.averageHours}h/day</div>
            </div>
            <div className="bg-blue-500 rounded-lg p-2 group-hover:scale-110 transition-transform">
              <Clock4 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Performance Bar Chart */}
      <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Daily Performance Overview
          </h4>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-500">Last 14 Days</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={filteredData.slice(-14).map(record => ({
              date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              hours: parseFloat(record.hours),
              target: 9,
              status: record.status
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Hours Worked', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend />
            <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Hours Worked" />
            <Bar dataKey="target" fill="#10b981" radius={[8, 8, 0, 0]} name="Target (9h)" opacity={0.3} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortBy === 'date' && (
                      <ChevronDown className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Late Arrival
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('hours')}
                >
                  <div className="flex items-center gap-1">
                    Net Hours
                    {sortBy === 'hours' && (
                      <ChevronDown className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Overtime
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Gross Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {filteredData.map((record, index) => {
                const statusInfo = getStatusInfo(record.status);
                const recordDate = new Date(record.date);
                const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'long' });
                
                return (
                  <tr key={index} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(record.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 capitalize">
                        {dayName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkIn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkOut}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.lateByMinutes > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          {record.lateByMinutes >= 60 
                            ? (record.lateByMinutes / 60).toFixed(1) + 'h late'
                            : record.lateByMinutes + 'm late'
                          }
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          On time
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.hours === '-' ? (
                        <span className="text-sm text-gray-500">-</span>
                      ) : (
                        <div className={`text-sm font-medium ${
                          parseFloat(record.hours) >= 8 ? 'text-green-600' : 
                          parseFloat(record.hours) >= 6 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {record.hours}h
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.overtimeHours === '-' ? (
                        <span className="text-sm text-gray-500">-</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {record.overtimeHours}h
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.hours === '-' || record.hours === '0.0' ? (
                        <span className="text-sm text-gray-500">-</span>
                      ) : (
                        <div className="text-sm font-medium text-blue-600">
                          {record.grossHours}h
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate" title={record.remarks}>
                        {record.remarks}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : `No attendance records for ${monthNames[selectedMonth]} ${selectedYear}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Monthly Analysis */}
      
    </div>
  );
};

export function EmployeeAttendancePage() {
  const {
    attendanceData,
    systemAttendance,
    setSystemAttendance,
    handleSystemCheckIn,
    handleSystemCheckOut,
    updateWorkingTime,
    setBreakStatus,
    setAttendanceData,
    getTodayStatus,
    getAttendanceStats,
    fetchAttendanceData
  } = useAttendance();

  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'attendance-sheet'
  const [breakRules, setBreakRules] = useState([]);
  const [breakData, setBreakData] = useState({});
  const [todayBreaksFromDB, setTodayBreaksFromDB] = useState([]); // Store breaks fetched from database

  // Overtime debt tracking
  const [overtimeDebt, setOvertimeDebt] = useState({
    totalDebt: 0,
    breakOvertime: 0,
    lateOvertime: 0,
    workedOvertime: 0,
    netDebt: 0,
    history: []
  });

  // Monthly summary (aggregated from monthly attendance records)
  const [monthlySummary, setMonthlySummary] = useState({
    overtimeMinutes: 0,
    totalBreakMinutes: 0,
    netWorkingMinutes: 0
  });

  // Fetch break rules from backend
  useEffect(() => {
    // Set loading state on component mount
    setIsLoading(true);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const fetchBreakRules = async () => {
      try {
        console.log('📥 Fetching break rules from backend...');
        const response = await fetch(
          endpoints.rules.breakRules,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log('✅ Break rules fetched successfully:', data.data);
            setBreakRules(data.data);
            
            // Initialize break data with rules from database
            const initialBreakData = {};
            data.data.forEach(rule => {
              const ruleType = rule.type.toLowerCase();
              console.log(`   🔧 Initializing break data for: ${ruleType} (${rule.limit}m limit)`);
              initialBreakData[ruleType] = {
                active: false,
                startTime: null,
                totalDuration: 0,
                exceededDuration: 0,
                breakLimit: rule.limit,
                breakCount: 0,
                autoEndTimer: null,
                autoSaveInterval: null
              };
            });
            console.log('   📊 Initial break data:', initialBreakData);
            setBreakData(prev => ({ ...prev, ...initialBreakData }));

            // IMPORTANT: Fetch any ongoing breaks from database and restore them
            await fetchAndRestoreOngoingBreaks(initialBreakData);
          }
        } else {
          console.warn('❌ Failed to fetch break rules, using defaults');
        }
      } catch (error) {
        console.error('❌ Error fetching break rules:', error);
        // Will use default breakTypes if fetch fails
      } finally {
        // Set loading to false after initial data is loaded
        setIsLoading(false);
      }
    };

    fetchBreakRules();
    
    // Also fetch today's breaks from database
    fetchTodayBreaksFromDB();
    
    // Set up interval to refresh today's breaks every 30 seconds
    const breaksFetchInterval = setInterval(() => {
      fetchTodayBreaksFromDB();
    }, 30 * 1000);
    
    return () => clearInterval(breaksFetchInterval);
  }, []);

  // Fetch ongoing breaks from database and restore them to UI
  const fetchAndRestoreOngoingBreaks = async (breakRulesData) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const employeeId = getEmployeeId();

      if (!token) {
        console.warn('⚠️ No token available, cannot fetch ongoing breaks');
        return;
      }

      console.log('🔄 Fetching ongoing breaks from database...');
      
      const response = await fetch(endpoints.attendance.ongoingBreaks(employeeId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          console.log('✅ Ongoing breaks found:', data.data);

          // Restore each ongoing break to the UI
          const now = new Date();
          data.data.forEach(ongoingBreak => {
            const breakType = ongoingBreak.break_type.toLowerCase();
            const startTimeStr = ongoingBreak.break_start_time;

            // Determine the correct local date for the break start time.
            // For early-morning breaks (00:00 - 05:59) the break belongs to the PREVIOUS day.
            // Prefer server-provided attendance_date when available.
            const pad = (n) => String(n).padStart(2, '0');
            const nowLocal = new Date();
            let dateForBreak = `${nowLocal.getFullYear()}-${pad(nowLocal.getMonth() + 1)}-${pad(nowLocal.getDate())}`;

            // If server returned an attendance_date for this break, use it (robustness)
            if (ongoingBreak.attendance_date) {
              // attendance_date may be a full ISO string or YYYY-MM-DD
              dateForBreak = String(ongoingBreak.attendance_date).split('T')[0];

              // If break time is early morning (00:00-05:59) the real timestamp is on the next calendar day
              const hour = parseInt((startTimeStr || '00:00:00').split(':')[0], 10) || 0;
              if (hour >= 0 && hour < 6) {
                const d = new Date(dateForBreak + 'T00:00:00');
                d.setDate(d.getDate() + 1);
                dateForBreak = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
              }
            } else {
              // Fallback: determine by break hour (local interpretation)
              const hour = parseInt((startTimeStr || '00:00:00').split(':')[0], 10) || 0;
              if (hour >= 0 && hour < 6) {
                const yday = new Date(nowLocal);
                yday.setDate(yday.getDate() - 1);
                dateForBreak = `${yday.getFullYear()}-${pad(yday.getMonth() + 1)}-${pad(yday.getDate())}`;
              }
            }

            const breakStartTime = new Date(`${dateForBreak}T${startTimeStr}`);
            const currentDuration = (now - breakStartTime) / (1000 * 60); // Duration in minutes

            console.log(`🔧 Restoring break: ${ongoingBreak.break_type}`);
            console.log(`   Start Time: ${startTimeStr}`);
            console.log(`   Current Duration: ${currentDuration.toFixed(2)}m`);
            console.log(`   Saved Duration: ${ongoingBreak.break_duration_minutes}m`);
            console.log(`   Break ID: ${ongoingBreak.id}`);

            // Decide which duration to display: prefer the real-time calculation
            // but fall back to server value if it's close (tolerate small differences).
            const serverDuration = ongoingBreak.break_duration_minutes || 0;
            const durationDiff = Math.abs(serverDuration - currentDuration);
            const chosenDuration = durationDiff > 10 ? currentDuration : Math.max(serverDuration, currentDuration);

            // Update breakData to show break as active
            setBreakData(prev => {
              const updated = { ...prev };
              if (updated[breakType]) {
                updated[breakType] = {
                  ...updated[breakType],
                  active: true,
                  startTime: breakStartTime,
                  totalDuration: chosenDuration,
                  breakCount: (updated[breakType].breakCount || 0) + 1,
                  breakId: ongoingBreak.id
                };
                console.log(`   ✅ Updated breakData[${breakType}]:`, updated[breakType]);
                console.log(`       (serverDuration: ${serverDuration}m, calculated: ${currentDuration.toFixed(2)}m, chosen: ${chosenDuration.toFixed(2)}m)`);
              } else {
                console.warn(`   ⚠️ breakType '${breakType}' not found in breakData`);
              }
              return updated;
            });

            // Pause working time since there's an active break
            setBreakStatus(true);

            // Resume auto-save interval for this break
            console.log(`   ✅ Setting up auto-save interval for ${ongoingBreak.break_type}`);
            const autoSaveInterval = setInterval(() => {
              autoSaveBreakProgress(breakType, breakStartTime);
            }, 30 * 1000);

            // Store the interval ID
            setBreakData(prev => ({
              ...prev,
              [breakType]: {
                ...prev[breakType],
                autoSaveInterval: autoSaveInterval
              }
            }));
          });
        } else {
          console.log('ℹ️ No ongoing breaks found');
        }
      } else {
        console.warn('⚠️ Failed to fetch ongoing breaks:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching ongoing breaks:', error);
    }
  };

  // Fetch today's completed breaks from database
  const fetchTodayBreaksFromDB = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const employeeId = getEmployeeId();

      if (!token) {
        console.warn('⚠️ No token available, cannot fetch today\'s breaks');
        return;
      }

      console.log('📊 Fetching today\'s completed breaks from database...');
      
      const response = await fetch(endpoints.attendance.todayBreaks(employeeId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('✅ Today\'s breaks fetched:', data.data);
          setTodayBreaksFromDB(data.data);
        }
      } else {
        console.warn('⚠️ Failed to fetch today\'s breaks:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching today\'s breaks:', error);
    }
  };

    // Sync breakData with attendance data (component-level) when attendance is updated
    useEffect(() => {
      if (!attendanceData || attendanceData.length === 0) return;

      // Prefer today's attendance record when syncing break data
      const todayStr = new Date().toISOString().split('T')[0];
      let record = attendanceData.find(r => r.date === todayStr);
      if (!record) {
        // Fallback: try the last record in the array (most recent)
        record = attendanceData[attendanceData.length - 1] || attendanceData[0];
      }

      console.log('🔄 Syncing breakData from attendanceData in component...');
      console.log('   Selected record date (preferred today):', todayStr);
      console.log('   Using record date:', record?.date);
      console.log('   Record keys:', Object.keys(record || {}));
      console.log('   Full record:', record);

      setBreakData(prev => {
        const updated = { ...prev };

        const breakTypeMap = {
          smoke: { countField: 'smoke_break_count', durationField: 'smoke_break_duration_minutes' },
          dinner: { countField: 'dinner_break_count', durationField: 'dinner_break_duration_minutes' },
          washroom: { countField: 'washroom_break_count', durationField: 'washroom_break_duration_minutes' },
          prayer: { countField: 'prayer_break_count', durationField: 'prayer_break_duration_minutes' }
        };

        Object.keys(breakTypeMap).forEach(type => {
          const fields = breakTypeMap[type];
          const count = record[fields.countField] || 0;
          const duration = record[fields.durationField] || 0;

          console.log(`   Syncing ${type}: count=${count} (from ${fields.countField}), duration=${duration}m (from ${fields.durationField})`);

          const prevInfo = prev[type] || { active: false, startTime: null, totalDuration: 0, exceededDuration: 0, breakLimit: 0, breakCount: 0 };

          updated[type] = {
            ...prevInfo,
            breakCount: count,
            totalDuration: duration
          };
        });

        console.log('✅ Component breakData synced:', updated);
        return updated;
      });
    }, [attendanceData]);

  // Map break rules to icons and colors
  const breakTypeMap = {
    'smoke': { icon: Cigarette, color: 'bg-orange-500' },
    'dinner': { icon: Utensils, color: 'bg-purple-500' },
    'washroom': { icon: ToiletIcon, color: 'bg-blue-500' },
    'pray': { icon: Calendar1, color: 'bg-green-500' },
    'prayer': { icon: Calendar1, color: 'bg-green-500' }
  };

  // Build breakTypes array dynamically from breakRules
  const breakTypes = breakRules.length > 0 
    ? breakRules.map(rule => {
        const typeKey = rule.type.toLowerCase();
        const mapping = breakTypeMap[typeKey] || { icon: Coffee, color: 'bg-gray-500' };
        return {
          id: typeKey,
          name: rule.name,
          icon: mapping.icon,
          color: mapping.color,
          limit: rule.limit
        };
      })
    : [
        { 
          id: 'smoke', 
          name: 'Smoke', 
          icon: Cigarette, 
          color: 'bg-orange-500',
          limit: 2
        },
        { 
          id: 'dinner', 
          name: 'Dinner', 
          icon: Utensils,
          color: 'bg-purple-500',
          limit: 40
        },
        { 
          id: 'washroom', 
          name: 'Washroom', 
          icon: ToiletIcon, 
          color: 'bg-blue-500',
          limit: 10
        },
        { 
          id: 'pray', 
          name: 'Prayer', 
          icon: Calendar1, 
          color: 'bg-green-500',
          limit: 10
        }
      ];

  // Calculate total break time and exceeded time
  const calculateTotalBreakTime = () => {
    // Calculate from database breaks instead of local breakData to avoid double-counting
    const totalDuration = todayBreaksFromDB.reduce((sum, b) => sum + (b.break_duration_minutes || 0), 0);
    
    const exceededDuration = 0; // Breaks are stored as actual records, no need for exceeded calculation
    
    return {
      totalDuration,
      exceededDuration,
      allowedDuration: totalDuration - exceededDuration
    };
  };

  // Calculate working hours summary with overtime consideration
  const calculateWorkingHoursSummary = () => {
    const breakSummary = calculateTotalBreakTime();
    
    // Calculate total working minutes from attendance data (historical records)
    let totalNetMinutes = 0;
    let totalGrossMinutes = 0;
    
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach(record => {
        // Only count hours that are valid numbers (not '-')
        if (record.hours && record.hours !== '-' && !isNaN(parseFloat(record.hours))) {
          totalNetMinutes += parseFloat(record.hours) * 60;
        }
        if (record.grossHours && record.grossHours !== '-' && !isNaN(parseFloat(record.grossHours))) {
          totalGrossMinutes += parseFloat(record.grossHours) * 60;
        }
      });
    }
    
    // For current session, add systemAttendance.totalWorkingTime if checked in
    const netWorkingTime = systemAttendance.checkedIn 
      ? totalNetMinutes + systemAttendance.totalWorkingTime
      : totalNetMinutes;
    
    const grossWorkingTime = systemAttendance.checkedIn
      ? totalGrossMinutes + systemAttendance.totalWorkingTime
      : totalGrossMinutes;
    
    // Only calculate overtime if current time is after 6 AM (using Pakistan timezone)
    const nowPKT = getPakistanDate();
    const isAfter6AM = nowPKT.getHours() >= 6;
    
    const requiredWorkingTime = 9 * 60; // 540 minutes
    let overtimeRequired = 0;
    
    if (isAfter6AM) {
      overtimeRequired = Math.max(0, requiredWorkingTime - netWorkingTime + overtimeDebt.netDebt);
      console.log('📊 Overtime calculation: After 6 AM - overtime eligible');
    } else {
      console.log('⏱️ Overtime calculation: Before 6 AM - no overtime counted');
    }
    
    return {
      totalBreakTime: breakSummary.totalDuration,
      exceededBreakTime: breakSummary.exceededDuration,
      netWorkingTime: Math.max(0, netWorkingTime - breakSummary.allowedDuration),
      grossWorkingTime,
      efficiency: grossWorkingTime > 0 
        ? Math.max(0, (((netWorkingTime - breakSummary.allowedDuration) / grossWorkingTime) * 100)).toFixed(1)
        : 0,
      overtimeRequired,
      requiredWorkingTime
    };
  };

  // Update current time and calculate break durations
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      updateWorkingTime();
      
      // Update active break durations
      breakTypes.forEach(breakType => {
        const breakInfo = breakData[breakType.id];
        if (breakInfo && breakInfo.active && breakInfo.startTime) {
          const currentDuration = (now - breakInfo.startTime) / (1000 * 60);
          
          // Check if break exceeded limit
          if (currentDuration > breakType.limit) {
            const exceededTime = currentDuration - breakType.limit;
            
            // Add overtime debt only once when it first exceeds
            if (exceededTime > 0 && breakInfo.exceededDuration === 0) {
              console.log(`⚠️ BREAK EXCEEDED: ${breakType.name} - Duration: ${currentDuration.toFixed(2)}m, Limit: ${breakType.limit}m, Exceeded: ${exceededTime.toFixed(2)}m`);
              addOvertimeDebt('break', exceededTime, `${breakType.name} exceeded by ${Math.round(exceededTime)} minutes`);
            }
          }
        }
      });
    }, 1000); // Update every 1 second for smooth timer display

    return () => clearInterval(timer);
  }, [systemAttendance.checkedIn, systemAttendance.checkInTime, systemAttendance.totalWorkingTime, systemAttendance.isOnBreak, breakData, breakTypes, updateWorkingTime]);

  // Save break immediately when started (before end is triggered)
  const saveBreakStart = async (breakType, startTime) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const employeeId = getEmployeeId();
      
      if (!token) {
        console.warn('⚠️ No token available, cannot save break start');
        return null;
      }

      const breakConfig = breakTypes.find(b => b.id === breakType);
      const capitalizedBreakType = breakType.charAt(0).toUpperCase() + breakType.slice(1);
      const breakStartTimeStr = startTime.toTimeString().split(' ')[0];

      console.log('💾 IMMEDIATE SAVE: Recording break start in database...');
      console.log('   Employee ID:', employeeId);
      console.log('   Break Type:', capitalizedBreakType);
      console.log('   Start Time:', breakStartTimeStr);
      
      const response = await fetch(endpoints.attendance.breakStart, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: employeeId,
          break_type: capitalizedBreakType,
          break_start_time: breakStartTimeStr,
          reason: `${breakConfig.name} break - Auto-saved on start`
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Break start immediately saved:', data);
        return data.data?.id; // Return the break ID for updating later
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('⚠️ Failed to save break start:', response.status, errorData.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Error saving break start:', error);
      return null;
    }
  };

  // Auto-save break progress every 30 seconds
  const autoSaveBreakProgress = async (breakType, startTime) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const employeeId = getEmployeeId();
      
      if (!token) {
        console.warn('⚠️ No token available, cannot auto-save break progress');
        return;
      }

      const capitalizedBreakType = breakType.charAt(0).toUpperCase() + breakType.slice(1);
      const now = new Date();
      const duration = (now - startTime) / (1000 * 60); // Duration in minutes
      const currentTime = now.toTimeString().split(' ')[0];

      console.log(`💾 AUTO-SAVE (30s): ${capitalizedBreakType} break - Duration: ${duration.toFixed(2)}m`);
      
      // Call the break-progress endpoint to update duration in real-time
      const response = await fetch(endpoints.attendance.breakProgress, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: employeeId,
          break_type: capitalizedBreakType,
          current_time: currentTime,
          current_duration_minutes: Math.floor(duration)
        })
      });

      if (response.ok) {
        console.log(`   ✅ Break progress auto-saved: ${Math.floor(duration)}m`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('⚠️ Failed to auto-save break progress:', response.status, errorData.message);
      }
    } catch (error) {
      console.error('❌ Error auto-saving break progress:', error);
    }
  };

  // Enhanced Break Management with Overtime Tracking
  const handleBreakStart = (breakType) => {
    const now = new Date();
    console.log('🔵 ════════════════════════════════════════');
    console.log('🔵 BREAK STARTED');
    console.log('🔵 ════════════════════════════════════════');
    console.log('   Break Type:', breakType.toUpperCase());
    console.log('   Start Time:', now.toLocaleTimeString());
    console.log('   Start Date:', now.toLocaleDateString());
    console.log('   Current breakData:', breakData[breakType]);
    
    if (breakData[breakType].active) {
      console.log('   ❌ Break already active, returning');
      return;
    }

    const breakConfig = breakTypes.find(b => b.id === breakType);
    const breakLimit = breakConfig ? breakConfig.limit : 10;
    
    console.log('   Break Name:', breakConfig?.name || 'Unknown');
    console.log('   Time Limit:', breakLimit, 'minutes');
    console.log('   1-minute warning will trigger at:', new Date(now.getTime() + (breakLimit - 1) * 60 * 1000).toLocaleTimeString());

    // IMPORTANT: Save break immediately to database when it starts
    saveBreakStart(breakType, now);

    // Set 1-minute warning timer (60 seconds before break ends)
    const warningTimer = setTimeout(() => {
      console.log(`   ⏰ 1-MINUTE WARNING: ${breakType.toUpperCase()} break will end in 1 minute`);
      
      // Play beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`⏰ ${breakConfig?.name || breakType.toUpperCase()} Break Ending Soon`, {
          body: `You have 1 minute remaining. Your break will end in 60 seconds.`,
          icon: '⏰',
          tag: `break-warning-${breakType}`,
          requireInteraction: true
        });
      }
      
      // Show alert
      alert(`⏰ ${breakConfig?.name || breakType.toUpperCase()} Break: 1 minute remaining!\n\nYour break will end in 60 seconds.\n\nClick "End Break" when ready, or the break will continue.`);
    }, (breakLimit - 1) * 60 * 1000);

    // Set auto-end timer (this will NOT auto-end, but will trigger after break limit)
    // The break continues until user manually ends it - no auto-termination
    const autoEndTimer = setTimeout(() => {
      console.log(`   ℹ️ BREAK LIMIT REACHED: ${breakType.toUpperCase()} has been running for ${breakLimit} minutes`);
      console.log(`   🔄 Break will continue until manually ended by user`);
      
      // Show notification that break time exceeded
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`⏱️ ${breakConfig?.name || breakType.toUpperCase()} Break Time Extended`, {
          body: `Your break has exceeded the ${breakLimit} minute limit and is continuing.`,
          tag: `break-extended-${breakType}`
        });
      }
    }, breakLimit * 60 * 1000);

    // Set auto-save interval (every 30 seconds, update break progress in database)
    const autoSaveInterval = setInterval(() => {
      autoSaveBreakProgress(breakType, now);
    }, 30 * 1000); // Every 30 seconds

    setBreakData(prev => {
      console.log('   ✅ Setting break as active');
      console.log('   ✅ Auto-save interval set (every 30 seconds)');
      return {
        ...prev,
        [breakType]: {
          ...prev[breakType],
          active: true,
          startTime: now,
          warningTimer: warningTimer,
          autoEndTimer: autoEndTimer,
          autoSaveInterval: autoSaveInterval, // Store interval ID to clear later
        }
      };
    });

    // Pause working time tracking
    setBreakStatus(true);
    console.log('   ✅ Break is now ACTIVE - Working time paused');
    console.log('🔵 ════════════════════════════════════════\n');
  };

  const handleBreakEnd = (breakType) => {
    const now = new Date();
    console.log('🔴 ════════════════════════════════════════');
    console.log('🔴 BREAK ENDED');
    console.log('🔴 ════════════════════════════════════════');
    console.log('   Break Type:', breakType.toUpperCase());
    console.log('   End Time:', now.toLocaleTimeString());
    console.log('   Current breakData:', breakData[breakType]);
    
    if (!breakData[breakType].active) {
      console.log('   ❌ Break not active, returning');
      console.log('🔴 ════════════════════════════════════════\n');
      return;
    }

    const breakConfig = breakTypes.find(b => b.id === breakType);
    const breakLimit = breakConfig ? breakConfig.limit : 10;
    const breakStartTime = breakData[breakType].startTime; // Capture start time before clearing

    console.log('   End time:', now.toLocaleTimeString());
    console.log('   Start time:', breakStartTime?.toLocaleTimeString());

    // Clear auto-end timer
    if (breakData[breakType].autoEndTimer) {
      clearTimeout(breakData[breakType].autoEndTimer);
      console.log('   ⏰ Auto-end timer cleared');
    }

    // Clear warning timer
    if (breakData[breakType].warningTimer) {
      clearTimeout(breakData[breakType].warningTimer);
      console.log('   🔔 Warning timer cleared');
    }

    // Clear auto-save interval
    if (breakData[breakType].autoSaveInterval) {
      clearInterval(breakData[breakType].autoSaveInterval);
      console.log('   💾 Auto-save interval cleared');
    }

    setBreakData(prev => {
      const breakInfo = prev[breakType];
      if (!breakInfo || !breakInfo.startTime) {
        console.log('   ❌ No break info or start time');
        return prev;
      }
      
      const duration = (now - breakInfo.startTime) / (1000 * 60); // Calculate actual duration
      const exceeded = Math.max(0, duration - breakLimit);
      
      console.log('   Duration:', duration.toFixed(2), 'minutes');
      console.log('   Limit:', breakLimit, 'minutes');
      console.log('   Exceeded:', exceeded.toFixed(2), 'minutes');
      
      // Add to overtime debt if exceeded
      if (exceeded > 0) {
        console.log('   ⚠️ Break exceeded! Adding to overtime debt');
        addOvertimeDebt('break', exceeded, `${breakConfig.name} exceeded by ${Math.round(exceeded)} minutes`);
      }
      
      const updated = {
        ...prev,
        [breakType]: {
          ...breakInfo,
          active: false,
          startTime: null,
          warningTimer: null,
          autoEndTimer: null,
          totalDuration: breakInfo.totalDuration + duration,
          exceededDuration: breakInfo.exceededDuration + exceeded,
          breakCount: breakInfo.breakCount + 1,
        }
      };
      
      console.log('   Updated breakData for', breakType, ':', updated[breakType]);
      return updated;
    });

    // Resume working time tracking
    setBreakStatus(false);
    console.log('   ✅ Break ended successfully');

    // Update break end time in database (break was already saved on start)
    const updateBreakEnd = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const employeeId = getEmployeeId();
        
        if (!token) {
          console.warn('⚠️ No token available, cannot update break end time');
          return;
        }

        const capitalizedBreakType = breakType.charAt(0).toUpperCase() + breakType.slice(1);
        const duration = (now - breakStartTime) / (1000 * 60);

        console.log('💾 Updating break end time in database...');
        console.log('   Employee ID:', employeeId);
        console.log('   Break Type:', capitalizedBreakType);
        console.log('   Duration:', duration.toFixed(2), 'minutes');
        console.log('   Break End Time:', now.toTimeString().split(' ')[0]);
        
        const response = await fetch(endpoints.attendance.breakEnd, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employee_id: employeeId,
            break_type: capitalizedBreakType,
            break_end_time: now.toTimeString().split(' ')[0],
            break_duration_minutes: Math.floor(duration)
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Break end time successfully updated:', data);
          
          // Refetch attendance data to update UI with break information
          console.log('🔄 Refetching attendance data to sync break records...');
          setTimeout(() => {
            fetchAttendanceData();
          }, 300);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn('⚠️ Failed to update break end time:', response.status, errorData.message);
        }
      } catch (error) {
        console.error('❌ Error updating break end time:', error);
      }
    };

    // Call the update function
    updateBreakEnd();
    console.log('🔴 ════════════════════════════════════════\n');
  };

  // Manual break end button
  const handleManualBreakEnd = (breakType) => {
    handleBreakEnd(breakType);
  };

  // Overtime debt management
  const addOvertimeDebt = (type, minutes, reason) => {
    setOvertimeDebt(prev => {
      const newDebt = {
        totalDebt: prev.totalDebt + minutes,
        breakOvertime: type === 'break' ? prev.breakOvertime + minutes : prev.breakOvertime,
        lateOvertime: type === 'late' ? prev.lateOvertime + minutes : prev.lateOvertime,
        workedOvertime: prev.workedOvertime,
        netDebt: prev.netDebt + minutes,
        history: [
          ...prev.history,
          {
            type,
            minutes,
            reason,
            date: new Date().toISOString(),
            timestamp: new Date()
          }
        ]
      };
      
      return newDebt;
    });
  };

  // Track late arrivals
  const handleSystemCheckInWrapper = async () => {
    if (!canCheckIn()) return;
    
    setIsLoading(true);
    
    try {
      const now = new Date();
      const expectedStart = new Date();
      expectedStart.setHours(9, 15, 0, 0);
      
      const lateBy = (now - expectedStart) / (1000 * 60);
      const gracePeriod = 15;
      
      if (lateBy > gracePeriod) {
        const lateMinutes = Math.round(lateBy - gracePeriod);
        addOvertimeDebt('late', lateMinutes, `Late arrival by ${lateMinutes} minutes`);
      }
      
      await handleSystemCheckIn();
      
      // Refetch attendance data after successful check-in to get the created record
      // Wait a bit for backend to process the record
      await new Promise(resolve => setTimeout(resolve, 800));
      await fetchAttendanceData();
    } catch (error) {
      alert('âŒ Failed to check in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemCheckOutWrapper = async () => {
    if (!canCheckOut()) return;
    
    setIsLoading(true);
    
    try {
      await handleSystemCheckOut();
    } catch (error) {
      alert('âŒ Failed to check out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle overtime work
  const handleOvertimeWork = (minutes) => {
    setOvertimeDebt(prev => {
      const newWorkedOvertime = prev.workedOvertime + minutes;
      return {
        ...prev,
        workedOvertime: newWorkedOvertime,
        netDebt: Math.max(0, prev.totalDebt - newWorkedOvertime)
      };
    });
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    // Ensure minutes is a number
    const mins = typeof minutes === 'number' ? minutes : parseFloat(minutes) || 0;
    
    const hours = Math.floor(mins / 60);
    const remainingMins = Math.floor(mins % 60);
    
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${remainingMins}m`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'present':
        return { icon: Check, color: 'text-green-600 bg-green-100', text: 'Present' };
      case 'late':
        return { icon: Clock4, color: 'text-yellow-600 bg-yellow-100', text: 'Late' };
      case 'absent':
        return { icon: X, color: 'text-red-600 bg-red-100', text: 'Absent' };
      case 'off':
        return { icon: Calendar, color: 'text-gray-600 bg-gray-100', text: 'Day Off' };
      default:
        return { icon: Clock, color: 'text-blue-600 bg-blue-100', text: 'Pending' };
    }
  };

  // Check if employee can check in/out - use DATABASE as source of truth
  const canCheckIn = () => {
    // Use systemAttendance.checkedIn as source of truth for real-time state
    // This is synced with backend isCheckedIn flag
    return !systemAttendance.checkedIn && !isLoading;
  };

  const canCheckOut = () => {
    // Can check out if: 1) Already checked in, 2) Not on break, 3) Has minimum time worked
    if (!systemAttendance.checkedIn) return false;
    if (systemAttendance.isOnBreak) return false;
    return !isLoading;
  };

  // Get check-in status message
  const getCheckInStatus = () => {
    // Get today's record from attendance data (source of truth from database)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceData?.find(r => r.date === todayStr);
    
    // IMPORTANT: Check the actual database record for check_out_time, not in-memory state
    // The database is the source of truth. In-memory state can be stale after page reload
    const dbCheckOutTime = todayRecord?.check_out_time;
    const dbCheckInTime = todayRecord?.check_in_time;
    
    // If database shows checkout, display it regardless of in-memory state
    if (dbCheckOutTime) {
      return {
        checked: false,
        message: `Checked out at ${formatPakistanTimeString(dbCheckOutTime)}`,
        time: dbCheckOutTime
      };
    }
    
    // If database shows check-in but no checkout, user is currently checked in
    if (dbCheckInTime && !dbCheckOutTime) {
      return {
        checked: true,
        message: `Checked in at ${formatPakistanTimeString(dbCheckInTime)}`,
        time: dbCheckInTime
      };
    }
    
    // Fallback to in-memory state only if database is not yet loaded
    if (systemAttendance.checkInTime && !systemAttendance.checkOutTime) {
      return {
        checked: true,
        message: `Checked in at ${systemAttendance.checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
        time: systemAttendance.checkInTime
      };
    }
    if (systemAttendance.checkOutTime) {
      return {
        checked: false,
        message: `Checked out at ${systemAttendance.checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
        time: systemAttendance.checkOutTime
      };
    }
    return { checked: false, message: 'Not checked in yet', time: null };
  };

  // Calculate current break duration for active breaks
  const getCurrentBreakDuration = (breakType) => {
    const breakInfo = breakData[breakType];
    if (breakInfo && breakInfo.active && breakInfo.startTime) {
      const now = new Date();
      return (now - breakInfo.startTime) / (1000 * 60);
    }
    return 0;
  };

  const workingHoursSummary = calculateWorkingHoursSummary();
  const breakSummary = calculateTotalBreakTime();
  const stats = getAttendanceStats();

  // Calculate today's break time specifically
  const getTodayBreakTime = () => {
    if (!attendanceData || attendanceData.length === 0) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceData.find(r => r.date === todayStr);
    if (!todayRecord) return breakSummary.totalDuration; // Fallback to current breakData total
    
    // Sum today's breaks from API data
    const todayBreaks = (todayRecord.smoke_break_duration_minutes || 0) +
                        (todayRecord.dinner_break_duration_minutes || 0) +
                        (todayRecord.washroom_break_duration_minutes || 0) +
                        (todayRecord.prayer_break_duration_minutes || 0);
    return todayBreaks || breakSummary.totalDuration;
  };

  // Calculate month's total break time
  const getMonthBreakTime = () => {
    if (!attendanceData || attendanceData.length === 0) return breakSummary.totalDuration;
    return attendanceData.reduce((total, record) => {
      const recordBreaks = (record.smoke_break_duration_minutes || 0) +
                          (record.dinner_break_duration_minutes || 0) +
                          (record.washroom_break_duration_minutes || 0) +
                          (record.prayer_break_duration_minutes || 0);
      return total + recordBreaks;
    }, 0);
  };

  const todayBreakTime = getTodayBreakTime();
  const monthBreakTime = getMonthBreakTime();

  // Filter only days when employee came (present or late)
  const attendanceHistory = attendanceData.filter(day => 
    day.status === 'present' || day.status === 'late'
  );

  // Tab navigation
  const tabs = [
    { id: 'dashboard', name: 'Attendance Dashboard', icon: ShieldUser },
    { id: 'attendance-sheet', name: 'Attendance Sheet', icon: Table }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-1/3 w-[800px] h-[800px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 -left-1/3 w-[800px] h-[800px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Fast Preloader */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
          <div className="flex flex-col items-center gap-4">
            {/* Spinning Loader */}
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-3 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-3 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-gray-700">Loading...</p>
          </div>
        </div>
      )}

      <div className="relative z-10 p-6 lg:p-8  mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Attendance Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Manage your daily atten  dance and working hours</p>
            </div>
            <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-lg font-semibold text-blue-600">
                <Clock className="h-5 w-5" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-3 border-b border-gray-200 pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
              <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600 uppercase">Status</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{getTodayStatus().status.toUpperCase()}</p>
                <p className="text-xs text-gray-600 mt-1">{getTodayStatus().checkIn}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium text-green-600 uppercase">Present</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                <p className="text-xs text-gray-600 mt-1">{stats.attendancePercentage}% rate</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600 uppercase">Rate</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.attendancePercentage}%</p>
                <p className="text-xs text-gray-600 mt-1">This month</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="text-xs font-medium text-orange-600 uppercase">Late</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                <p className="text-xs text-gray-600 mt-1">Late arrivals</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <PauseCircle className="h-5 w-5 text-red-600" />
                  <span className="text-xs font-medium text-red-600 uppercase">Inactive</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(todayBreakTime)}</p>
                <p className="text-xs text-gray-600 mt-1">Today | Month: {formatDuration(monthBreakTime)}</p>
              </div>

              {/* <div className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <Clock4 className="h-5 w-5 text-amber-600" />
                  <span className="text-xs font-medium text-amber-600 uppercase">Overtime</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(monthlySummary.overtimeMinutes > 0 ? monthlySummary.overtimeMinutes : overtimeDebt.netDebt)}</p>
                <p className="text-xs text-gray-600 mt-1">Debt balance</p>
              </div> */}

              <div className="bg-white rounded-lg p-4 border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-5 w-5 text-cyan-600" />
                  <span className="text-xs font-medium text-cyan-600 uppercase">Hours</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(workingHoursSummary.netWorkingTime)}</p>
                <p className="text-xs text-gray-600 mt-1">Net working</p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Check In/Out */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LogIn className="h-5 w-5 text-blue-600" />
                  Attendance
                </h2>
                
                {/* Status Display */}
                <div className={`mb-4 p-4 rounded-lg border-2 transition-all ${
                  getCheckInStatus().checked 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-yellow-50 border-yellow-300'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getCheckInStatus().checked ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-900">You are checked in</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-900">Not checked in</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {getCheckInStatus().message}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={handleSystemCheckInWrapper}
                    disabled={!canCheckIn()}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${
                      canCheckIn() 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Check In</span>
                  </button>
                  
                  <button 
                    onClick={handleSystemCheckOutWrapper}
                    disabled={!canCheckOut()}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${
                      canCheckOut() 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Check Out</span>
                  </button>
                </div>

                {systemAttendance.checkedIn && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Current Session:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatDuration(systemAttendance.totalWorkingTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                      {systemAttendance.isOnBreak ? (
                        <><Clock className="h-3 w-3" /> Break in progress</>
                      ) : (
                        <><Activity className="h-3 w-3" /> Working...</>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Break Management */}
              {systemAttendance.checkedIn ? (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-purple-600" />
                  Break Management
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {breakTypes.map((breakType) => {
                    const breakInfo = breakData[breakType.id];
                    const currentDuration = getCurrentBreakDuration(breakType.id);
                    const isExceeding = currentDuration > breakType.limit;
                    
                    return (
                      <div key={breakType.id} className="space-y-2">
                        <button 
                          onClick={() => handleBreakStart(breakType.id)}
                          disabled={!breakInfo || breakInfo.active}
                          className={`w-full flex flex-col items-center justify-center p-3 rounded-lg border transition ${
                            breakInfo && breakInfo.active
                              ? `${breakType.color} text-white`
                              : `bg-gray-50 border-gray-200 hover:border-gray-300`
                          }`}
                        >
                          {breakType.icon && <breakType.icon className="h-4 w-4 mb-1" />}
                          <span className="text-xs font-medium">
                            {breakInfo && breakInfo.active ? 'Active' : breakType.name}
                          </span>
                          <span className="text-xs mt-1">
                            {breakInfo && breakInfo.active ? 
                              `${Math.round(currentDuration)}m / ${breakType.limit}m` : 
                              `${breakType.limit}m`
                            }
                          </span>
                          {isExceeding && (
                            <span className="text-xs text-red-200 mt-1">EXCEEDED!</span>
                          )}
                        </button>
                        
                        {breakInfo && breakInfo.active && (
                          <button 
                            onClick={() => handleManualBreakEnd(breakType.id)}
                            className="w-full flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            End Break
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Break Summary */}
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Today's Breaks</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Breaks:</span>
                      <span className="font-semibold text-purple-600">
                        {todayBreaksFromDB.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Time:</span>
                      <span className="font-semibold text-purple-600">
                        {formatDuration(
                          todayBreaksFromDB.reduce((sum, b) => sum + (b.break_duration_minutes || 0), 0)
                        )}
                      </span>
                    </div>
                    {breakSummary.exceededDuration > 0 && (
                      <div className="flex justify-between">
                        <span className="text-red-600">Exceeded:</span>
                        <span className="font-semibold text-red-600">+{formatDuration(breakSummary.exceededDuration)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active:</span>
                      <span className="font-semibold text-blue-600">
                        {breakTypes.filter(breakType => breakData[breakType.id]?.active).length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Individual Break Counts - Show from Database */}
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Break Details:</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {breakTypes.map((breakType) => {
                        // Count breaks from database for this type
                        const dbBreaks = todayBreaksFromDB.filter(b => b.break_type.toLowerCase() === breakType.id);
                        const totalCount = dbBreaks.length;
                        const totalDuration = dbBreaks.reduce((sum, b) => sum + (b.break_duration_minutes || 0), 0);
                        
                        return (
                          <div key={breakType.id} className="flex justify-between items-center bg-white rounded px-2 py-1">
                            <span className="text-gray-600">{breakType.name}:</span>
                            <div className="text-right">
                              <span className="font-semibold text-purple-700 block">{totalCount}x</span>
                              {totalDuration > 0 && <span className="text-gray-500 text-xs">{totalDuration}m</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              ) : (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-64">
                <Clock className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Break Management</h3>
                <p className="text-gray-500 text-sm text-center">Check in to manage breaks</p>
              </div>
              )}
            </div>

            {/* Analytics Graphs - Monthly Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Attendance Distribution Chart */}
              <div className="bg-white rounded-lg border border-blue-200 p-6 shadow-sm hover:shadow-md transition-all">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Attendance Distribution
                </h4>
                {attendanceData && attendanceData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie
                          data={[
                            { name: 'Present', value: Math.max(1, stats.present), color: '#10b981' },
                            { name: 'Late', value: Math.max(1, stats.late), color: '#f59e0b' },
                            { name: 'Absent', value: Math.max(1, stats.absent), color: '#ef4444' },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) => value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Present', value: stats.present, color: '#10b981' },
                            { name: 'Late', value: stats.late, color: '#f59e0b' },
                            { name: 'Absent', value: stats.absent, color: '#ef4444' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => value > 0 ? value : 0} />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex justify-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Present ({stats.present})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Late ({stats.late})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Absent ({stats.absent})</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">No attendance data available</p>
                  </div>
                )}
              </div>

              {/* Working Hours Trend */}
              <div className="bg-white rounded-lg border border-blue-200 p-6 shadow-sm hover:shadow-md transition-all">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-600" />
                  Working Hours Trend
                </h4>
                {attendanceData && attendanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart
                      data={attendanceData.map((record, idx) => ({
                        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        hours: record.hours && record.hours !== '-' ? parseFloat(record.hours) : 0,
                        status: record.status,
                        key: idx
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        domain={[0, 10]}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value) => [value.toFixed(1) + 'h', 'Hours']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorHours)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">No data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Performance Bar Chart */}
            <div className="bg-white rounded-lg border border-blue-200 p-6 shadow-sm hover:shadow-md transition-all mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Daily Performance
                </h4>
                <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">Last 14 Days</span>
              </div>
              {attendanceData && attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={attendanceData.map((record, idx) => ({
                      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      hours: record.hours && record.hours !== '-' ? parseFloat(record.hours) : 0,
                      target: 9,
                      status: record.status,
                      key: idx
                    }))}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      domain={[0, 12]}
                      label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value) => [value.toFixed(1), value === 9 ? 'Target (9h)' : 'Hours Worked']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Hours Worked" />
                    <Bar dataKey="target" fill="#10b981" radius={[8, 8, 0, 0]} name="Target (9h)" opacity={0.4} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm">No performance data available</p>
                </div>
              )}
            </div>

            {/* Attendance History Table */}
            {/* <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Check In</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Check Out</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Hours</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.slice(0, 10).map((day, index) => {
                      const statusInfo = getStatusInfo(day.status);
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{formatDate(day.date)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">{day.checkIn}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{day.checkOut}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{day.hours}h</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{day.remarks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div> */}
          </>
        ) : (
          <AttendanceSheet 
            attendanceData={attendanceData}
            onExport={() => {}}
            onFilter={() => {}}
          />
        )}
      </div>
    </div>
  );
}