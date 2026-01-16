import { useState, useEffect } from 'react';
import { getPakistanDate, getPakistanDateString, convertToPakistanTime } from '../utils/timezone';

export function useAttendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [systemAttendance, setSystemAttendance] = useState({
    checkedIn: false,
    checkInTime: null,
    checkOutTime: null,
    status: 'pending',
    totalWorkingTime: 0,
    lastUpdate: null,
    isOnBreak: false
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedAttendance = localStorage.getItem('attendanceData');
    const savedSystemAttendance = localStorage.getItem('systemAttendance');
    
    if (savedAttendance) {
      setAttendanceData(JSON.parse(savedAttendance));
    }
    
    if (savedSystemAttendance) {
      const parsed = JSON.parse(savedSystemAttendance);
      // Convert string dates back to Date objects in Pakistan timezone
      setSystemAttendance({
        ...parsed,
        checkInTime: parsed.checkInTime ? convertToPakistanTime(new Date(parsed.checkInTime)) : null,
        checkOutTime: parsed.checkOutTime ? convertToPakistanTime(new Date(parsed.checkOutTime)) : null,
        lastUpdate: parsed.lastUpdate ? convertToPakistanTime(new Date(parsed.lastUpdate)) : null
      });
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
  }, [attendanceData]);

  useEffect(() => {
    localStorage.setItem('systemAttendance', JSON.stringify(systemAttendance));
  }, [systemAttendance]);

  // System Check-in
  const handleSystemCheckIn = async () => {
    const now = getPakistanDate(); // Use Pakistan timezone
    const today = getPakistanDateString();
    
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const status = isLate ? 'late' : 'present';
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Update attendance record
    const existingRecordIndex = attendanceData.findIndex(record => 
      record.date === today
    );

    let updatedAttendance;
    if (existingRecordIndex >= 0) {
      updatedAttendance = [...attendanceData];
      updatedAttendance[existingRecordIndex] = {
        ...updatedAttendance[existingRecordIndex],
        status: status,
        checkIn: timeString,
        checkOut: '-',
        hours: '0.0',
        remarks: isLate ? 'Late check-in' : 'Checked in on time'
      };
    } else {
      const newRecord = {
        date: today,
        day: now.getDate(),
        status: status,
        checkIn: timeString,
        checkOut: '-',
        hours: '0.0',
        remarks: isLate ? 'Late check-in' : 'Checked in on time'
      };
      updatedAttendance = [...attendanceData, newRecord];
    }

    setAttendanceData(updatedAttendance);
    
    // Update system attendance
    setSystemAttendance({
      checkedIn: true,
      checkInTime: now,
      checkOutTime: null,
      status: status,
      totalWorkingTime: 0,
      lastUpdate: now,
      isOnBreak: false
    });

    return { 
      success: true, 
      time: now, 
      status, 
      isLate,
      timeString 
    };
  };

  // System Check-out
  const handleSystemCheckOut = async () => {
    const now = getPakistanDate(); // Use Pakistan timezone
    const today = getPakistanDateString();
    
    // Calculate final working time
    let finalWorkingTime = systemAttendance.totalWorkingTime;
    if (systemAttendance.lastUpdate && !systemAttendance.isOnBreak) {
      const timeDiff = (now - systemAttendance.lastUpdate) / (1000 * 60);
      finalWorkingTime += timeDiff;
    }

    const totalHours = finalWorkingTime / 60;
    const formattedHours = totalHours.toFixed(1);
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Update attendance record
    const updatedAttendance = attendanceData.map(record =>
      record.date === today
        ? {
            ...record,
            checkOut: timeString,
            hours: formattedHours,
            remarks: `Worked ${formattedHours} hours`
          }
        : record
    );

    setAttendanceData(updatedAttendance);
    
    // Update system attendance
    setSystemAttendance({
      checkedIn: false,
      checkOutTime: now,
      status: systemAttendance.status,
      totalWorkingTime: finalWorkingTime,
      lastUpdate: null,
      isOnBreak: false
    });

    return { 
      success: true, 
      time: now, 
      hours: formattedHours,
      timeString 
    };
  };

  // Update working time (for real-time tracking)
  const updateWorkingTime = () => {
    if (systemAttendance.checkedIn && systemAttendance.lastUpdate && !systemAttendance.isOnBreak) {
      const now = getPakistanDate();
      const timeDiff = (now - systemAttendance.lastUpdate) / (1000 * 60);
      
      setSystemAttendance(prev => ({
        ...prev,
        totalWorkingTime: prev.totalWorkingTime + timeDiff,
        lastUpdate: now
      }));
    }
  };

  // Break management
  const setBreakStatus = (isOnBreak) => {
    setSystemAttendance(prev => ({
      ...prev,
      isOnBreak,
      lastUpdate: isOnBreak ? null : getPakistanDate()
    }));
  };

  // Get today's status
  const getTodayStatus = () => {
    const today = getPakistanDateString();
    return attendanceData.find(record => record.date === today) || {
      date: today,
      status: 'pending',
      checkIn: '-',
      checkOut: '-',
      hours: '0.0',
      remarks: 'Not checked in yet'
    };
  };

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    const completedSessions = attendanceData.filter(record => record.checkOut !== '-');
    
    const present = completedSessions.filter(record => record.status === 'present' || record.status === 'late').length;
    const late = completedSessions.filter(record => record.status === 'late').length;
    const absent = completedSessions.filter(record => record.status === 'absent').length;
    const workingDays = completedSessions.length;
    
    const attendancePercentage = workingDays > 0 ? (present / workingDays) * 100 : 0;

    return { 
      present, 
      late, 
      absent, 
      workingDays,
      attendancePercentage: Math.round(attendancePercentage)
    };
  };

  return {
    attendanceData,
    systemAttendance,
    handleSystemCheckIn,
    handleSystemCheckOut,
    updateWorkingTime,
    setBreakStatus,
    setAttendanceData,
    getTodayStatus,
    getAttendanceStats
  };
} 
export default useAttendance;