import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
// import { DashboardHeader } from './DashboardComponents';
import AttendanceCorrectionModal from "../../components/AttendanceCorrectionModal";
// import { useAuth } from '../context/AuthContext';
import { endpoints } from "../../config/api";
import { getPakistanDate } from "../../utils/timezone";
import HrSidebar from "../../components/HrSidebar";
import PagePreloader from "../../components/PagePreloader";
import HRAttendanceSync from "../../components/HRAttendanceSync";
import {
  DashboardHeader,
  RoleBasedNav,
} from "../../components/DashboardComponents";
import { useAuth } from "../../context/AuthContext";
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
  Table,
  Edit3,
} from "lucide-react";
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
  Cell,
} from "recharts";

const parseAttendanceDate = (dateStr) => {
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

const HRMyAttendance = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard or sheet
  const [statusFilter, setStatusFilter] = useState("All Status"); // Filter for status
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarActiveItem, setSidebarActiveItem] = useState("my-attendance");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeBreaks, setActiveBreaks] = useState([]);
  const [breakTimers, setBreakTimers] = useState({});
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState("monthly");
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [isOverlapWindow, setIsOverlapWindow] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionRecord, setCorrectionRecord] = useState(null);

  const [leaveSummary, setLeaveSummary] = useState({
    casual: { used: 0, total: 8 },
    sick: { used: 0, total: 8 },
    annual: { used: 0, total: 12 },
  });

  // Calculate RECORDS_PER_PAGE dynamically based on month (30 or 31 days)
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const RECORDS_PER_PAGE = getDaysInMonth(selectedMonth, selectedYear);

  const getEmployeeId = () => {
    const id = user?.employeeId || user?.employee_id || user?.id;
    console.log("[INFO] Getting employee ID:", {
      user,
      employeeId: user?.employeeId,
      employee_id: user?.employee_id,
      id: user?.id,
      resolved: id,
    });
    return id;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data on component mount — OPTIMIZED: parallel fetches
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTodayAttendance(),
          fetchPendingCheckout(),
          fetchActiveBreaks(),
          fetchMonthlyAttendance(),
          fetchLeaveBalance(),
        ]);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Re-fetch monthly attendance when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchMonthlyAttendance();
  }, [selectedMonth, selectedYear]);
  useEffect(() => {
    if (activeBreaks.length === 0) return;

    const timerInterval = setInterval(() => {
      const newTimers = {};
      activeBreaks.forEach((breakItem) => {
        if (breakItem.break_start_time) {
          const [startHour, startMin, startSec] = breakItem.break_start_time
            .split(":")
            .map(Number);
          const now = new Date();
          const currentHour = now.getHours();
          const currentMin = now.getMinutes();
          const currentSec = now.getSeconds();

          const startTotalSeconds =
            startHour * 3600 + startMin * 60 + (startSec || 0);
          const nowTotalSeconds =
            currentHour * 3600 + currentMin * 60 + currentSec;

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
    if (!seconds) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${minutes}:${String(secs).padStart(2, "0")}`;
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
      const token = localStorage.getItem("token");
      const employeeId = getEmployeeId();

      if (!employeeId) {
        setPendingCheckout(null);
        return;
      }

      const response = await fetch(
        `${endpoints.attendance.base}/pending-checkout?employee_id=${employeeId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log("[INFO] Pending checkout found:", data.data);
          setPendingCheckout(data.data);
          setIsOverlapWindow(isInOverlapWindow());
        } else {
          setPendingCheckout(null);
        }
      } else {
        setPendingCheckout(null);
      }
    } catch (error) {
      console.error("Error checking pending checkout:", error);
      setPendingCheckout(null);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const employeeId = getEmployeeId();

      if (!employeeId) {
        setLoading(false);
        return;
      }

      const response = await fetch(endpoints.attendance.today(employeeId), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success && data.data) {
        const todayRecord = data.data;
        console.log("[SUCCESS] Today attendance data:", todayRecord);
        setAttendanceData(todayRecord);
        setIsCheckedIn(
          data.isCheckedIn ||
          (todayRecord.check_in_time && !todayRecord.check_out_time),
        );
      } else {
        console.warn("[WARNING] No attendance data received:", data);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyAttendance = async () => {
    try {
      const token = localStorage.getItem("token");
      const employeeId = getEmployeeId();

      if (!employeeId) {
        console.log(
          "[WARNING] No employee ID available for monthly attendance fetch",
        );
        return;
      }

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const response = await fetch(
        endpoints.attendance.monthly(employeeId, selectedYear, selectedMonth),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        console.log("[SUCCESS] Monthly attendance fetched:", data.data);
        setMonthlyAttendance(data.data || []);
      } else {
        console.warn("[WARNING] Failed to fetch monthly attendance:", data);
      }
    } catch (error) {
      console.error("[ERROR] Error fetching monthly attendance:", error);
    }
  };

  const fetchActiveBreaks = async () => {
    try {
      const token = localStorage.getItem("token");
      const employeeId = getEmployeeId();

      if (!employeeId) return;

      const response = await fetch(
        endpoints.attendance.ongoingBreaks(employeeId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setActiveBreaks(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching active breaks:", error);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const employeeId = getEmployeeId();

      if (!employeeId) {
        console.log(
          "[WARNING] No employee ID available for leave balance fetch",
        );
        return;
      }

      console.log("[INFO] Fetching leave balance for employee:", employeeId);
      const response = await fetch(
        endpoints.leaves.employeeBalance(employeeId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        console.log("[SUCCESS] Leave balance fetched:", data);
        setLeaveSummary({
          casual: {
            used: data.casual.used,
            total: data.casual.total,
            remaining: data.casual.remaining,
          },
          sick: {
            used: data.sick.used,
            total: data.sick.total,
            remaining: data.sick.remaining,
          },
          annual: {
            used: data.annual.used,
            total: data.annual.total,
            remaining: data.annual.remaining,
          },
        });
      } else {
        console.warn("[WARNING] Failed to fetch leave balance:", data);
      }
    } catch (error) {
      console.error("[ERROR] Error fetching leave balance:", error);
    }
  };

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(endpoints.attendance.checkIn, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: getEmployeeId(),
          email: user?.email || "hr@digious.com",
          name: user?.name || "HR Manager",
          device_info: "Web Browser",
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("[SUCCESS] Check-in successful:", data);
        setIsCheckedIn(true);
        await fetchTodayAttendance();
        await fetchPendingCheckout();
        await fetchMonthlyAttendance();
      } else {
        console.error("[ERROR] Check-in failed:", data.message);
        if (
          data.data?.reason === "PENDING_CHECKOUT_EXISTS" &&
          data.data?.pendingRecord
        ) {
          setPendingCheckout(data.data.pendingRecord);
          setIsOverlapWindow(isInOverlapWindow());
        }
        toast.error(data.message || "Check-in failed");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(endpoints.attendance.checkOut, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: getEmployeeId(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("[SUCCESS] Check-out successful:", data);
        toast.success("Checked out successfully");
        setIsCheckedIn(false);
        await fetchTodayAttendance();
        await fetchPendingCheckout();
        await fetchMonthlyAttendance();
      } else {
        console.error("[ERROR] Check-out failed:", data.message);
        toast.error(data.message || "Check-out failed");
      }
    } catch (error) {
      console.error("Check-out error:", error);
      toast.error("Failed to check out");
    }
  };

  const handleBreakStart = async (breakType) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(endpoints.attendance.breakStart, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: getEmployeeId(),
          break_type: breakType,
          reason: `${breakType.charAt(0).toUpperCase() + breakType.slice(1)} break`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchActiveBreaks();
      } else {
        toast.error(data.message || "Failed to start break");
      }
    } catch (error) {
      console.error("Start break error:", error);
      toast.error("Failed to start break");
    }
  };

  const handleBreakEnd = async (breakId) => {
    try {
      const token = localStorage.getItem("token");
      const employeeId = getEmployeeId();

      const breakRecord = activeBreaks.find((b) => b.id === breakId);
      if (!breakRecord) {
        toast.error("Break record not found");
        return;
      }

      const [startHour, startMin, startSec] = breakRecord.break_start_time
        .split(":")
        .map(Number);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentSec = now.getSeconds();

      const startTotalSeconds =
        startHour * 3600 + startMin * 60 + (startSec || 0);
      const nowTotalSeconds = currentHour * 3600 + currentMin * 60 + currentSec;

      let durationSeconds = nowTotalSeconds - startTotalSeconds;
      if (durationSeconds < 0) {
        durationSeconds += 24 * 3600;
      }
      const duration = Math.max(0, Math.floor(durationSeconds / 60));

      const response = await fetch(endpoints.attendance.breakEnd, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: employeeId,
          break_type: breakRecord.break_type,
          break_end_time: now.toTimeString().split(" ")[0],
          break_duration_minutes: duration,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchActiveBreaks();
        fetchTodayAttendance();
      } else {
        toast.error(data.message || "Failed to end break");
      }
    } catch (error) {
      console.error("End break error:", error);
      toast.error("Failed to end break");
    }
  };

  const getWorkingHours = () => {
    if (!attendanceData?.check_in_time) return "0h 0m";

    const [checkInHour, checkInMin, checkInSec] = attendanceData.check_in_time
      .split(":")
      .map(Number);
    const checkInTotalMinutes = checkInHour * 60 + checkInMin;

    let checkOutTotalMinutes = 0;
    let isCurrentTime = false;

    if (attendanceData.check_out_time) {
      const [checkOutHour, checkOutMin, checkOutSec] =
        attendanceData.check_out_time.split(":").map(Number);
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
        const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
        const minutesAfterMidnight = checkOutTotalMinutes;
        grossMinutes = minutesUntilMidnight + minutesAfterMidnight;
      }
    } else if (checkOutTotalMinutes < checkInTotalMinutes) {
      const minutesUntilMidnight = 24 * 60 - checkInTotalMinutes;
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
    if (!attendanceData?.check_in_time) return "text-[#009336]";
    if (attendanceData?.check_out_time) return "text-[#009336]";
    return attendanceData?.status === "Present"
      ? "text-green-500"
      : attendanceData?.status === "Late"
        ? "text-orange-500"
        : "text-orange-500";
  };

  const getStatusText = () => {
    if (!attendanceData?.check_in_time) return "Not Checked In";
    if (attendanceData?.check_out_time) return "Checked Out";

    if (attendanceData?.check_in_time) {
      const [hour, min] = attendanceData.check_in_time.split(":").map(Number);
      const checkInMinutes = hour * 60 + min;
      const shiftStart = 21 * 60;
      const nineAM = 9 * 60;

      if (checkInMinutes >= nineAM && checkInMinutes < shiftStart) {
        return "Present";
      }
    }

    return attendanceData?.status || "Present";
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
      const dateStr = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      });
      weekDays[dateStr] = { hours: 0, status: "Absent", raw_minutes: 0 };
    }

    monthlyAttendance
      .filter((r) => {
        const recordDate = parseAttendanceDate(r.attendance_date);
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      })
      .forEach((record) => {
        const dateStr = parseAttendanceDate(
          record.attendance_date,
        ).toLocaleDateString("en-US", {
          weekday: "short",
          month: "numeric",
          day: "numeric",
        });
        let hours = record.net_working_time_minutes
          ? Math.floor(record.net_working_time_minutes / 60)
          : 0;
        let rawMinutes = record.net_working_time_minutes || 0;

        const recordDate = parseAttendanceDate(record.attendance_date);
        const isToday = recordDate.toDateString() === today.toDateString();
        if (isToday && record.check_in_time && !record.check_out_time) {
          const [checkInHour, checkInMin, checkInSec] = record.check_in_time
            .split(":")
            .map(Number);
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
            const timeDifferenceMinutes =
              currentTotalMinutes - checkInTotalMinutes;
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
          raw_minutes: rawMinutes,
        };
      });

    const weekData = Object.entries(weekDays).map(([date, data]) => ({
      date: date,
      hours: data.hours,
      status: data.status,
      raw_minutes: data.raw_minutes,
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
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      monthDays[dateStr] = { hours: 0, status: "Absent", raw_minutes: 0 };
    }

    monthlyAttendance
      .filter((r) => {
        const recordDate = new Date(r.attendance_date);
        return (
          recordDate.getFullYear() === currentYear &&
          recordDate.getMonth() === today.getMonth() &&
          recordDate.getDate() <= today.getDate()
        );
      })
      .forEach((record) => {
        const dateStr = parseAttendanceDate(
          record.attendance_date,
        ).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        let hours = record.net_working_time_minutes
          ? Math.floor(record.net_working_time_minutes / 60)
          : 0;
        let rawMinutes = record.net_working_time_minutes || 0;

        const recordDate = parseAttendanceDate(record.attendance_date);
        const isToday = recordDate.toDateString() === today.toDateString();
        if (isToday && record.check_in_time && !record.check_out_time) {
          const [checkInHour, checkInMin, checkInSec] = record.check_in_time
            .split(":")
            .map(Number);
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
            const timeDifferenceMinutes =
              currentTotalMinutes - checkInTotalMinutes;
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
          raw_minutes: rawMinutes,
        };
      });

    const chartData = Object.entries(monthDays).map(([date, data]) => ({
      date: date,
      hours: data.hours,
      status: data.status,
      total: data.raw_minutes,
      days_worked: data.hours > 0 ? 1 : 0,
    }));

    return chartData.length > 0
      ? chartData
      : [
        {
          date: "No Data",
          hours: 0,
          status: "N/A",
          total: 0,
          days_worked: 0,
        },
      ];
  };

  const getStatusDistribution = () => {
    const statusCount = monthlyAttendance.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    const COLORS = {
      Present: "#10b981",
      Late: "#f59e0b",
      Absent: "#ef4444",
      Leave: "#8b5cf6",
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
      color: COLORS[status] || "#6b7280",
    }));
  };

  const getMonthlyStats = () => {
    if (monthlyAttendance.length === 0) {
      return {
        totalHours: 0,
        averageHours: 0,
        maxHours: 0,
        minHours: 0,
        workDays: 0,
        totalBreakTime: 0,
      };
    }

    const totalMinutes = monthlyAttendance.reduce(
      (sum, record) => sum + (record.net_working_time_minutes || 0),
      0,
    );
    const totalBreakMinutes = monthlyAttendance.reduce(
      (sum, record) => sum + (record.total_break_duration_minutes || 0),
      0,
    );
    const workDays = monthlyAttendance.filter(
      (r) => r.status === "Present" || r.status === "Late",
    ).length;
    const hours = monthlyAttendance.map(
      (r) => (r.net_working_time_minutes || 0) / 60,
    );

    return {
      totalHours: Math.floor(totalMinutes / 60),
      totalMinutes: totalMinutes % 60,
      averageHours: workDays > 0 ? Math.floor(totalMinutes / workDays / 60) : 0,
      averageMinutes: workDays > 0 ? (totalMinutes / workDays) % 60 : 0,
      maxHours: Math.floor(Math.max(...hours, 0)),
      minHours:
        hours.length > 0
          ? Math.floor(Math.min(...hours.filter((h) => h > 0), Infinity))
          : 0,
      workDays: workDays,
      totalBreakMinutes: totalBreakMinutes,
    };
  };

  const getMonthlyData = () => {
    return monthlyAttendance
      .map((record) => ({
        date: parseAttendanceDate(record.attendance_date).getDate(),
        hours: Math.floor((record.net_working_time_minutes || 0) / 60),
        minutes: (record.net_working_time_minutes || 0) % 60,
        status: record.status,
      }))
      .sort((a, b) => a.date - b.date);
  };

  const formatTimeDisplay = (minutes) => {
    if (!minutes || minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const breakTypes = [
    {
      type: "Smoke",
      label: "Smoke Break",
      icon: Cigarette,
      color: "bg-gray-500",
      maxPerDay: 9,
      duration: 5,
    },
    {
      type: "Dinner",
      label: "Dinner Break",
      icon: Utensils,
      color: "bg-orange-500",
      maxPerDay: 1,
      duration: 45,
    },
    {
      type: "Washroom",
      label: "Washroom Break",
      icon: User,
      color: "bg-blue-500",
      maxPerDay: null,
      duration: 10,
    },
    {
      type: "Prayer",
      label: "Prayer Break",
      icon: Activity,
      color: "bg-purple-500",
      maxPerDay: null,
      duration: 10,
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <HrSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={sidebarActiveItem}
        setActiveItem={setSidebarActiveItem}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="My Attendance Dashboard"
          subtitle="Manage your daily attendance and working hours"
          role={role}
          currentTime={currentTime}
        />
        <RoleBasedNav role={role} />
        {loading ? (
          <PagePreloader
            loading={true}
            message="Loading your attendance data..."
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-all ${activeTab === "dashboard"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <Shield className="w-5 h-5" />
                  Attendance Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("sheet")}
                  className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-all ${activeTab === "sheet"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <Table className="w-5 h-5" />
                  Attendance Sheet
                </button>
              </div>
              <HRAttendanceSync />
            </div>
            <main className="flex-1 overflow-y-auto p-6">
              {activeTab === "dashboard" && (
                <>
                  <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 p-6">
                        {/* Stats Cards Row - 5 Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                          {/* Current Status Card */}
                          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-5">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${attendanceData?.check_in_time &&
                                    !attendanceData?.check_out_time
                                    ? "bg-green-100"
                                    : attendanceData?.check_out_time
                                      ? "bg-blue-100"
                                      : "bg-white"
                                  }`}
                              >
                                <CheckCircle
                                  className={`w-6 h-6 ${getStatusColor()}`}
                                />
                              </div>
                              <div>
                                <p className="text-xs text-green-600 font-medium">
                                  Status
                                </p>
                                <p
                                  className={`text-lg font-bold ${getStatusColor()}`}
                                >
                                  {getStatusText()}
                                </p>
                                {attendanceData?.check_in_time && (
                                  <p className="text-[10px] text-gray-500">
                                    In: {attendanceData.check_in_time}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Working Hours Card */}
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-blue-600 font-medium">
                                  Working Hours
                                </p>
                                <p className="text-lg font-bold text-blue-600">
                                  {getWorkingHours()}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  Expected: 9h 0m
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Late By Card */}
                          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-xs text-amber-600 font-medium">
                                  Late By
                                </p>
                                <p className="text-lg font-bold text-amber-600">
                                  {(() => {
                                    if (attendanceData?.check_in_time) {
                                      const [hour, min] =
                                        attendanceData.check_in_time
                                          .split(":")
                                          .map(Number);
                                      const checkInMinutes = hour * 60 + min;
                                      const shiftStart = 21 * 60;
                                      const nineAM = 9 * 60;
                                      if (
                                        checkInMinutes >= nineAM &&
                                        checkInMinutes < shiftStart
                                      ) {
                                        return "0m";
                                      }
                                    }
                                    return (
                                      (attendanceData?.late_by_minutes || 0) +
                                      "m"
                                    );
                                  })()}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  Minutes late
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Inactivity Card */}
                          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <p className="text-xs text-red-600 font-medium">
                                  Inactivity
                                </p>
                                <p className="text-lg font-bold text-red-600">
                                  {formatTimeDisplay(
                                    attendanceData?.total_inactivity_minutes ||
                                    0,
                                  )}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {attendanceData?.total_inactivity_minutes > 0
                                    ? "⚠️ Extra time"
                                    : "No inactivity"}
                                </p>
                              </div>
                            </div>
                            {/* Mini breakdown - only show if there's inactivity */}
                            {(attendanceData?.smoke_inactivity_minutes > 0 ||
                              attendanceData?.dinner_inactivity_minutes > 0 ||
                              attendanceData?.washroom_inactivity_minutes > 0 ||
                              attendanceData?.prayer_inactivity_minutes >
                              0) && (
                                <div className="mt-3 pt-2 border-t border-red-200">
                                  <div className="flex flex-wrap gap-2 text-[10px]">
                                    {attendanceData?.smoke_inactivity_minutes >
                                      0 && (
                                        <span className="flex items-center gap-1">
                                          <span className="text-red-500">
                                            Smoke:
                                          </span>
                                          <span className="font-medium">
                                            {formatTimeDisplay(
                                              attendanceData.smoke_inactivity_minutes,
                                            )}
                                          </span>
                                        </span>
                                      )}
                                    {attendanceData?.dinner_inactivity_minutes >
                                      0 && (
                                        <span className="flex items-center gap-1">
                                          <span className="text-red-500">
                                            Dinner:
                                          </span>
                                          <span className="font-medium">
                                            {formatTimeDisplay(
                                              attendanceData.dinner_inactivity_minutes,
                                            )}
                                          </span>
                                        </span>
                                      )}
                                    {attendanceData?.washroom_inactivity_minutes >
                                      0 && (
                                        <span className="flex items-center gap-1">
                                          <span className="text-red-500">
                                            Washroom:
                                          </span>
                                          <span className="font-medium">
                                            {formatTimeDisplay(
                                              attendanceData.washroom_inactivity_minutes,
                                            )}
                                          </span>
                                        </span>
                                      )}
                                    {attendanceData?.prayer_inactivity_minutes >
                                      0 && (
                                        <span className="flex items-center gap-1">
                                          <span className="text-red-500">
                                            Prayer:
                                          </span>
                                          <span className="font-medium">
                                            {formatTimeDisplay(
                                              attendanceData.prayer_inactivity_minutes,
                                            )}
                                          </span>
                                        </span>
                                      )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Main Action Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Check In/Out Section */}
                          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                            <div className="text-center">
                              <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                  Attendance
                                </h2>
                                <div className="text-3xl font-mono font-bold text-blue-600">
                                  {currentTime.toLocaleTimeString("en-US", {
                                    hour12: false,
                                    timeZone: "Asia/Karachi",
                                  })}
                                </div>
                                <p className="text-gray-500 mt-1">
                                  {currentTime.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    timeZone: "Asia/Karachi",
                                  })}
                                </p>
                              </div>

                              {!loading && (
                                <div className="space-y-4">
                                  {isCheckedIn ||
                                    (attendanceData?.check_in_time &&
                                      !attendanceData?.check_out_time) ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                      <p className="text-green-700 font-semibold">
                                        You are checked in
                                      </p>
                                      {attendanceData?.check_in_time && (
                                        <p className="text-sm text-green-600">
                                          Checked in at{" "}
                                          {attendanceData.check_in_time}
                                        </p>
                                      )}
                                    </div>
                                  ) : attendanceData?.check_out_time ? (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                      <LogOut className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                      <p className="text-blue-700 font-semibold">
                                        You have checked out
                                      </p>
                                      <p className="text-sm text-blue-600">
                                        Checked out at{" "}
                                        {attendanceData.check_out_time}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                                      <LogIn className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                      <p className="text-gray-600">
                                        Ready to check in
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex gap-4 mb-4">
                                    <button
                                      onClick={handleCheckIn}
                                      disabled={
                                        attendanceData?.check_in_time ||
                                        attendanceData?.check_out_time
                                      }
                                      className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${attendanceData?.check_in_time ||
                                          attendanceData?.check_out_time
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                          : "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/25"
                                        }`}
                                    >
                                      <LogIn className="w-5 h-5 inline mr-2" />
                                      Check In
                                    </button>

                                    <button
                                      onClick={handleCheckOut}
                                      disabled={
                                        !attendanceData?.check_in_time ||
                                        !!attendanceData?.check_out_time
                                      }
                                      className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${attendanceData?.check_in_time &&
                                          !attendanceData?.check_out_time
                                          ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25"
                                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        }`}
                                    >
                                      <LogOut className="w-5 h-5 inline mr-2" />
                                      Check Out
                                    </button>
                                  </div>

                                  {/* Leave Summary */}
                                  <div className="mt-10 w-full">
                                    <h1 className="text-sm font-semibold text-gray-700 mb-3">
                                      Leave Summary
                                    </h1>
                                    <div className="flex flex-col sm:flex-row gap-4 w-full items-stretch justify-between">
                                      <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[86px]">
                                        <p className="text-sm text-gray-600">
                                          Casual Leaves
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Used/ Total
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 mt-3">
                                          {leaveSummary.casual.used}/
                                          {leaveSummary.casual.total}
                                        </p>
                                      </div>

                                      <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[86px]">
                                        <p className="text-sm text-gray-600">
                                          Sick Leaves
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Used/ Total
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 mt-3">
                                          {leaveSummary.sick.used}/
                                          {leaveSummary.sick.total}
                                        </p>
                                      </div>

                                      <div className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[86px]">
                                        <p className="text-sm text-gray-600">
                                          Annual Leaves
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Used/ Total
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 mt-3">
                                          {leaveSummary.annual.used}/
                                          {leaveSummary.annual.total}
                                        </p>
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
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-purple-50 rounded-lg">
                                    <PauseCircle className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <h2 className="text-base font-semibold text-gray-900">
                                    Break Management
                                  </h2>
                                </div>
                                {activeBreaks.length > 0 && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    {activeBreaks.length} Active
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-6 space-y-6">
                              {/* Today's Summary */}
                              {attendanceData && (
                                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                      Today's Breaks
                                    </h3>
                                    <span className="text-[10px] text-gray-400">
                                      Last updated:{" "}
                                      {new Date().toLocaleTimeString()}
                                    </span>
                                  </div>

                                  {/* Stats Row */}
                                  <div className="grid grid-cols-3 gap-4 mb-5">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-900">
                                        {attendanceData.total_breaks_taken || 0}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        Total
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-900">
                                        {formatTimeDisplay(
                                          attendanceData.total_break_duration_minutes ||
                                          0,
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        Duration
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-900">
                                        {activeBreaks.length}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        Active
                                      </div>
                                    </div>
                                  </div>

                                  {/* Break Type Details with Limits */}
                                  <div className="grid grid-cols-2 gap-2">
                                    {/* Smoke Break - ONLY show count, NO time */}
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Cigarette className="w-4 h-4 text-gray-500" />
                                          <span className="text-xs font-medium text-gray-700">
                                            Smoke Break
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-purple-600">
                                            {attendanceData?.smoke_break_count ||
                                              0}
                                            /9
                                          </span>
                                          <span className="text-[10px] text-gray-400">
                                            {formatTimeDisplay(
                                              attendanceData?.smoke_break_duration_minutes ||
                                              0,
                                            )}{" "}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="bg-purple-500 h-1.5 rounded-full transition-all"
                                          style={{
                                            width: `${Math.min(((attendanceData?.smoke_break_count || 0) / 9) * 100, 100)}%`,
                                          }}
                                        />
                                      </div>
                                      <p className="text-[10px] text-gray-400 mt-1.5">
                                        {9 -
                                          (attendanceData?.smoke_break_count ||
                                            0)}{" "}
                                        breaks remaining
                                      </p>
                                    </div>

                                    {/* Dinner Break - Show remaining time and completion status */}
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Utensils className="w-4 h-4 text-gray-500" />
                                          <span className="text-xs font-medium text-gray-700">
                                            Dinner Break
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-purple-600">
                                            {attendanceData?.dinner_break_taken ||
                                              (attendanceData?.dinner_break_duration_minutes ||
                                                0) >= 45
                                              ? "1/1"
                                              : "0/1"}
                                          </span>
                                          <span className="text-[10px] text-gray-400">
                                            {formatTimeDisplay(
                                              attendanceData?.dinner_break_duration_minutes ||
                                              0,
                                            )}{" "}
                                            / 45m
                                          </span>
                                        </div>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="bg-orange-500 h-1.5 rounded-full transition-all"
                                          style={{
                                            width: `${Math.min(((attendanceData?.dinner_break_duration_minutes || 0) / 45) * 100, 100)}%`,
                                          }}
                                        />
                                      </div>
                                      {attendanceData?.dinner_break_taken ||
                                        (attendanceData?.dinner_break_duration_minutes ||
                                          0) >= 45 ? (
                                        <p className="text-[10px] text-green-600 mt-1.5 flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          Dinner break completed
                                        </p>
                                      ) : (
                                        <p className="text-[10px] text-gray-400 mt-1.5">
                                          {Math.max(
                                            0,
                                            45 -
                                            (attendanceData?.dinner_break_duration_minutes ||
                                              0),
                                          )}{" "}
                                          minutes remaining
                                        </p>
                                      )}
                                      {/* Show inactivity warning for dinner break */}
                                      {attendanceData?.dinner_inactivity_minutes >
                                        0 && (
                                          <p className="text-[9px] text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="w-2.5 h-2.5" />
                                            {formatTimeDisplay(
                                              attendanceData.dinner_inactivity_minutes,
                                            )}{" "}
                                            inactivity (exceeded limit)
                                          </p>
                                        )}
                                    </div>

                                    {/* Washroom Break - No limit */}
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <User className="w-4 h-4 text-gray-500" />
                                          <span className="text-xs font-medium text-gray-700">
                                            Washroom
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-purple-600">
                                            {attendanceData?.washroom_break_count ||
                                              0}
                                            x
                                          </span>
                                          <span className="text-[10px] text-gray-400">
                                            {formatTimeDisplay(
                                              attendanceData?.washroom_break_duration_minutes ||
                                              0,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Prayer Break - No limit */}
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Activity className="w-4 h-4 text-gray-500" />
                                          <span className="text-xs font-medium text-gray-700">
                                            Prayer
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-purple-600">
                                            {attendanceData?.prayer_break_count ||
                                              0}
                                            x
                                          </span>
                                          <span className="text-[10px] text-gray-400">
                                            {formatTimeDisplay(
                                              attendanceData?.prayer_break_duration_minutes ||
                                              0,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Break Type Cards - With Limit Checks */}
                              <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                  Start New Break
                                </h3>
                                <div className="grid grid-cols-4 gap-3">
                                  {breakTypes.map((breakType) => {
                                    const Icon = breakType.icon;
                                    const isActive = activeBreaks.some(
                                      (b) => b.break_type === breakType.type,
                                    );

                                    // Check break limits
                                    let isLimitReached = false;
                                    let limitMessage = "";

                                    if (breakType.type === "Smoke") {
                                      const smokeCount =
                                        attendanceData?.smoke_break_count || 0;
                                      isLimitReached = smokeCount >= 9;
                                      limitMessage = isLimitReached
                                        ? "Daily limit reached (9/9)"
                                        : "";
                                    } else if (breakType.type === "Dinner") {
                                      // Check if dinner break is already taken OR duration completed 45 minutes
                                      const dinnerDuration =
                                        attendanceData?.dinner_break_duration_minutes ||
                                        0;
                                      isLimitReached =
                                        attendanceData?.dinner_break_taken ===
                                        true || dinnerDuration >= 45;
                                      limitMessage = isLimitReached
                                        ? "Dinner break already taken today"
                                        : "";
                                    }

                                    // Also disable if currently in an active break
                                    const isDisabled =
                                      !isCheckedIn ||
                                      isActive ||
                                      attendanceData?.check_out_time ||
                                      isLimitReached;

                                    return (
                                      <button
                                        key={breakType.type}
                                        onClick={() =>
                                          handleBreakStart(breakType.type)
                                        }
                                        disabled={isDisabled}
                                        className={`group relative overflow-hidden rounded-xl transition-all duration-200 ${isDisabled
                                            ? "bg-gray-50 cursor-not-allowed opacity-60"
                                            : "bg-white hover:bg-purple-50 cursor-pointer border border-gray-200 hover:border-purple-200"
                                          }`}
                                      >
                                        <div className="p-3 text-center">
                                          <Icon
                                            className={`w-5 h-5 mx-auto mb-1.5 transition-colors ${isDisabled
                                                ? "text-gray-400"
                                                : "text-gray-500 group-hover:text-purple-600"
                                              }`}
                                          />
                                          <div
                                            className={`text-xs font-medium ${isDisabled
                                                ? "text-gray-400"
                                                : "text-gray-700 group-hover:text-purple-700"
                                              }`}
                                          >
                                            {breakType.label}
                                          </div>
                                          <div className="text-[10px] text-gray-400 mt-0.5">
                                            {breakType.duration}m
                                          </div>
                                          {limitMessage && (
                                            <div className="text-[9px] text-red-500 mt-1">
                                              {limitMessage}
                                            </div>
                                          )}
                                        </div>
                                        {isActive && (
                                          <div className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                {activeBreaks.length > 0 && (
                                  <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Complete your current break before starting
                                    a new one
                                  </p>
                                )}
                              </div>

                              {/* Active Breaks - Show current break if any */}
                              {activeBreaks.length > 0 && (
                                <div className="bg-amber-50/50 rounded-xl p-4 space-y-3">
                                  <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-2">
                                    <Timer className="w-3.5 h-3.5" />
                                    Current Break
                                  </h3>
                                  <div className="space-y-2">
                                    {activeBreaks.map((breakItem) => {
                                      const elapsedSeconds =
                                        breakTimers[breakItem.id] || 0;
                                      let maxDuration = 10;
                                      let remainingSeconds = 0;

                                      if (breakItem.break_type === "Dinner") {
                                        maxDuration = 45;
                                        const elapsedMinutes =
                                          elapsedSeconds / 60;
                                        remainingSeconds = Math.max(
                                          0,
                                          (maxDuration - elapsedMinutes) * 60,
                                        );
                                      } else if (
                                        breakItem.break_type === "Smoke"
                                      ) {
                                        maxDuration = 5;
                                        const elapsedMinutes =
                                          elapsedSeconds / 60;
                                        remainingSeconds = Math.max(
                                          0,
                                          (maxDuration - elapsedMinutes) * 60,
                                        );
                                      } else {
                                        maxDuration = 10;
                                        const elapsedMinutes =
                                          elapsedSeconds / 60;
                                        remainingSeconds = Math.max(
                                          0,
                                          (maxDuration - elapsedMinutes) * 60,
                                        );
                                      }

                                      const progress = Math.min(
                                        100,
                                        (elapsedSeconds / 60 / maxDuration) *
                                        100,
                                      );
                                      const remainingMinutes = Math.floor(
                                        remainingSeconds / 60,
                                      );
                                      const remainingSecs = Math.floor(
                                        remainingSeconds % 60,
                                      );

                                      return (
                                        <div
                                          key={breakItem.id}
                                          className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                              <span className="text-sm font-medium text-gray-800">
                                                {breakItem.break_type
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                  breakItem.break_type.slice(
                                                    1,
                                                  )}{" "}
                                                Break
                                              </span>
                                              <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono font-semibold text-amber-600">
                                                  {formatElapsedTime(
                                                    elapsedSeconds,
                                                  )}
                                                </span>
                                                {/* Only show remaining time for Dinner break */}
                                                {breakItem.break_type ===
                                                  "Dinner" &&
                                                  remainingSeconds > 0 && (
                                                    <span className="text-xs font-mono text-gray-400">
                                                      {remainingMinutes > 0
                                                        ? `${remainingMinutes}m `
                                                        : ""}
                                                      {remainingSecs}s left
                                                    </span>
                                                  )}
                                              </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                              <div
                                                className={`h-full rounded-full transition-all duration-300 ${progress >= 100
                                                    ? "bg-red-500"
                                                    : "bg-gradient-to-r from-amber-400 to-amber-500"
                                                  }`}
                                                style={{
                                                  width: `${Math.min(progress, 100)}%`,
                                                }}
                                              />
                                            </div>
                                            {progress >= 100 && (
                                              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Break time exceeded! Extra time
                                                will be marked as inactivity.
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            onClick={() =>
                                              handleBreakEnd(breakItem.id)
                                            }
                                            className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                                          >
                                            End Break
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Charts Section */}
                        <div className="space-y-6 mt-8">
                          {/* Chart View Filter */}
                          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-lg font-bold text-gray-900">
                                Working Hours Trend
                              </h3>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setChartView("monthly")}
                                  className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${chartView === "monthly"
                                      ? "bg-blue-500 text-white shadow-lg"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                  Monthly
                                </button>
                              </div>
                            </div>

                            {/* Working Hours Chart */}
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={
                                  chartView === "monthly"
                                    ? getMonthlyChartData()
                                    : getWeeklyData()
                                }
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis
                                  label={{
                                    value: "Hours",
                                    angle: -90,
                                    position: "insideLeft",
                                  }}
                                />
                                <Tooltip
                                  formatter={(value) => `${value}h`}
                                  labelFormatter={(label) => `${label}`}
                                />
                                <Bar
                                  dataKey="hours"
                                  fill="#3b82f6"
                                  name="Working Hours"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Status Distribution Chart */}
                          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">
                              Attendance Status Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={getStatusDistribution()}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={(entry) =>
                                    `${entry.name}: ${entry.value}`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {getStatusDistribution().map(
                                    (entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                      />
                                    ),
                                  )}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "sheet" && (
                <div className="space-y-6">
                  {/* Header Section */}
                  <div className="bg-white rounded-lg p-6 text-black/90 shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">
                          Attendance Records
                        </h2>
                        <p className="text-black/70 text-sm">
                          <span className="font-semibold">
                            {
                              monthlyAttendance.filter(
                                (r) =>
                                  statusFilter === "All Status" ||
                                  r.status === statusFilter,
                              ).length
                            }
                          </span>{" "}
                          records in{" "}
                          <span className="font-semibold">
                            {new Date(
                              2026,
                              selectedMonth - 1,
                            ).toLocaleDateString("en-US", {
                              month: "long",
                            })}{" "}
                            {selectedYear}
                          </span>
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
                          onChange={(e) =>
                            setSelectedMonth(parseInt(e.target.value))
                          }
                          className="px-3 py-2 rounded-lg bg-white text-gray-700 font-semibold cursor-pointer border border-gray-300 hover:border-blue-400 transition-colors"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                            <option key={m} value={m}>
                              {new Date(2026, m - 1).toLocaleDateString(
                                "en-US",
                                { month: "short" },
                              )}
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(parseInt(e.target.value))
                          }
                          className="px-3 py-2 rounded-lg bg-white text-gray-700 font-semibold cursor-pointer border border-gray-300 hover:border-blue-400 transition-colors"
                        >
                          {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
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

                  {/* Monthly Statistics Section */}
                  <div className="mt-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Monthly Overview
                    </h3>

                    {/* Monthly Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      {/* Total Working Hours */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-blue-800">
                            Total Hours
                          </h4>
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                          {getMonthlyStats().totalHours}h{" "}
                          {getMonthlyStats().totalMinutes}m
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          total this month
                        </p>
                      </div>

                      {/* Average Daily Hours */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-purple-800">
                            Average Daily
                          </h4>
                          <Activity className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-purple-600">
                          {getMonthlyStats().averageHours}h{" "}
                          {Math.round(getMonthlyStats().averageMinutes)}m
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          per work day
                        </p>
                      </div>

                      {/* Work Days */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-green-800">
                            Work Days
                          </h4>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                          {getMonthlyStats().workDays}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          days present/late
                        </p>
                      </div>

                      {/* Total Break Time */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-orange-800">
                            Break Time
                          </h4>
                          <PauseCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-orange-600">
                          {Math.floor(getMonthlyStats().totalBreakMinutes / 60)}
                          h {getMonthlyStats().totalBreakMinutes % 60}m
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          total break time
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="space-y-3">
                    <p className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                      Filter by Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {/* All Status Button */}
                      <button
                        onClick={() => setStatusFilter("All Status")}
                        className={`px-6 py-3 rounded-full font-semibold transition-all text-sm shadow-md ${statusFilter === "All Status"
                            ? "bg-[#349DFF] text-white shadow-lg scale-105"
                            : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400"
                          }`}
                      >
                        All ({monthlyAttendance.length})
                      </button>

                      {/* Present Button */}
                      <button
                        onClick={() => setStatusFilter("Present")}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${statusFilter === "Present"
                            ? "bg-green-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        Present (
                        {
                          monthlyAttendance.filter(
                            (r) => r.status === "Present",
                          ).length
                        }
                        )
                      </button>

                      <button
                        onClick={() => setStatusFilter("Late")}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${statusFilter === "Late"
                            ? "bg-orange-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        Late (
                        {
                          monthlyAttendance.filter((r) => r.status === "Late")
                            .length
                        }
                        )
                      </button>

                      <button
                        onClick={() => setStatusFilter("ML")}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${statusFilter === "ML"
                            ? "bg-blue-900 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        ML (
                        {
                          monthlyAttendance.filter((r) => r.status === "ML")
                            .length
                        }
                        )
                      </button>

                      <button
                        onClick={() => setStatusFilter("Absent")}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${statusFilter === "Absent"
                            ? "bg-red-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        Absent (
                        {
                          monthlyAttendance.filter((r) => r.status === "Absent")
                            .length
                        }
                        )
                      </button>

                      <button
                        onClick={() => setStatusFilter("Leave")}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${statusFilter === "Leave"
                            ? "bg-purple-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        Leave (
                        {
                          monthlyAttendance.filter((r) => r.status === "Leave")
                            .length
                        }
                        )
                      </button>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden relative z-10">
                    <div className="px-6 py-4 border-b border-gray-200 bg-white text-black/90">
                      <h2 className="text-lg font-bold">Detailed Attendance</h2>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#349DFF] text-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Check In
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Check Out
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Working Hours
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Breaks
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Late By
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Overtime
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyAttendance.filter(
                            (r) =>
                              statusFilter === "All Status" ||
                              r.status === statusFilter,
                          ).length === 0 ? (
                            <tr>
                              <td
                                colSpan="9"
                                className="px-4 py-8 text-center text-gray-500"
                              >
                                No attendance records found for the selected
                                filters
                              </td>
                            </tr>
                          ) : (
                            (() => {
                              const filteredRecords = monthlyAttendance.filter(
                                (r) =>
                                  statusFilter === "All Status" ||
                                  r.status === statusFilter,
                              );

                              // Sort by date in descending order (latest first)
                              const sortedRecords = [...filteredRecords].sort(
                                (a, b) => {
                                  const dateA = new Date(a.attendance_date);
                                  const dateB = new Date(b.attendance_date);
                                  return dateB - dateA; // Latest dates first
                                },
                              );

                              const totalPages = Math.ceil(
                                sortedRecords.length / RECORDS_PER_PAGE,
                              );
                              const startIndex =
                                (currentPage - 1) * RECORDS_PER_PAGE;
                              const endIndex = startIndex + RECORDS_PER_PAGE;
                              const paginatedRecords = sortedRecords.slice(
                                startIndex,
                                endIndex,
                              );

                              return paginatedRecords.map((record, index) => (
                                <tr
                                  key={
                                    record.id ||
                                    `absent-${record.attendance_date}`
                                  }
                                  className={`${record.is_absent
                                      ? "bg-red-50 hover:bg-red-100"
                                      : record.status === "ML"
                                        ? "bg-blue-50 hover:bg-blue-100"
                                        : index % 2 === 0
                                          ? "bg-gray-50 hover:bg-gray-100"
                                          : "bg-white hover:bg-gray-50"
                                    } transition-colors`}
                                >
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {parseAttendanceDate(
                                      record.attendance_date,
                                    ).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {!record.check_in_time ? (
                                      <span className="text-red-600 font-semibold">
                                        No Check-in
                                      </span>
                                    ) : (
                                      record.check_in_time
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {!record.check_in_time ? (
                                      <span className="text-red-600 font-semibold">
                                        —
                                      </span>
                                    ) : (
                                      record.check_out_time || "-"
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === "Present"
                                          ? "bg-green-100 text-green-700"
                                          : record.status === "Late"
                                            ? "bg-orange-100 text-orange-700"
                                            : record.status === "ML"
                                              ? "bg-blue-900 text-white"
                                              : record.status === "Absent"
                                                ? "bg-red-100 text-red-700"
                                                : record.status === "Paid Leave"
                                                  ? "bg-teal-100 text-teal-700"
                                                  : record.status ===
                                                    "Uninformed Absent"
                                                    ? "bg-red-200 text-red-800"
                                                    : "bg-purple-100 text-purple-700"
                                        }`}
                                    >
                                      {record.status === "Paid Leave"
                                        ? "PL"
                                        : record.status === "Uninformed Absent"
                                          ? "UA"
                                          : record.status === "Present"
                                            ? "P"
                                            : record.status === "Late"
                                              ? "L"
                                              : record.status === "ML"
                                                ? "ML"
                                                : record.status === "Absent"
                                                  ? "A"
                                                  : record.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {record.is_absent ? (
                                      <span className="text-red-600 font-semibold">
                                        —
                                      </span>
                                    ) : record.net_working_time_minutes ? (
                                      `${Math.floor(record.net_working_time_minutes / 60)}h ${record.net_working_time_minutes % 60}m`
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {record.is_absent ? (
                                      <span className="text-red-600 font-semibold">
                                        —
                                      </span>
                                    ) : (
                                      (record.total_breaks_taken || 0) +
                                      " (" +
                                      (record.total_break_duration_minutes ||
                                        0) +
                                      "m)"
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {record.is_absent ? (
                                      <span className="text-red-600 font-semibold">
                                        —
                                      </span>
                                    ) : record.late_by_minutes ? (
                                      `${record.late_by_minutes}m`
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {record.is_absent ? (
                                      <span className="text-red-600 font-semibold">
                                        —
                                      </span>
                                    ) : record.overtime_minutes > 0 ? (
                                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                        {Math.floor(
                                          record.overtime_minutes / 60,
                                        )}
                                        h {record.overtime_minutes % 60}m
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <button
                                      onClick={() => {
                                        setCorrectionRecord(record);
                                        setCorrectionModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all"
                                      title="Request attendance correction"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      Correct
                                    </button>
                                  </td>
                                </tr>
                              ));
                            })()
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {(() => {
                      const filteredRecords = monthlyAttendance.filter(
                        (r) =>
                          statusFilter === "All Status" ||
                          r.status === statusFilter,
                      );

                      // Sort by date in descending order (latest first)
                      const sortedRecords = [...filteredRecords].sort(
                        (a, b) => {
                          const dateA = new Date(a.attendance_date);
                          const dateB = new Date(b.attendance_date);
                          return dateB - dateA; // Latest dates first
                        },
                      );

                      const totalPages = Math.ceil(
                        sortedRecords.length / RECORDS_PER_PAGE,
                      );

                      return totalPages > 1 ? (
                        <div className="border-t border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="text-sm text-gray-600">
                            Showing page{" "}
                            <span className="font-semibold text-gray-900">
                              {currentPage}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-900">
                              {totalPages}
                            </span>
                            <span className="ml-4">
                              Total:{" "}
                              <span className="font-semibold text-gray-900">
                                {filteredRecords.length}
                              </span>{" "}
                              records{" "}
                              <span className="text-gray-500 text-xs">
                                (showing {RECORDS_PER_PAGE} per page)
                              </span>
                            </span>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() =>
                                setCurrentPage(Math.max(1, currentPage - 1))
                              }
                              disabled={currentPage === 1}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-semibold text-sm"
                            >
                              ← Previous
                            </button>

                            {Array.from(
                              { length: totalPages },
                              (_, i) => i + 1,
                            ).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${currentPage === page
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                              >
                                {page}
                              </button>
                            ))}

                            <button
                              onClick={() =>
                                setCurrentPage(
                                  Math.min(totalPages, currentPage + 1),
                                )
                              }
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
          </>
        )}
      </div>

      {/* Attendance Correction Modal */}
      <AttendanceCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => {
          setCorrectionModalOpen(false);
          setCorrectionRecord(null);
        }}
        record={correctionRecord}
        onSubmitted={() => fetchMonthlyAttendance()}
      />
    </div>
  );
};

export default HRMyAttendance;
export const EmployeeAttendancePage = HRMyAttendance;
