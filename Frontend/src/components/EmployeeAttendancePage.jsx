import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { DashboardHeader, RoleBasedNav } from "./DashboardComponents";
import AttendanceCorrectionModal from "./AttendanceCorrectionModal";
import { useAuth } from "../context/AuthContext";
import { endpoints } from "../config/api";
import { getPakistanDate } from "../utils/timezone";
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
  Table,
  Shield,
  Edit3,
  RefreshCw,
  Wifi,
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

// Helper function to parse YYYY-MM-DD string correctly without timezone shift
const parseAttendanceDate = (dateStr) => {
  // Expected format: "2026-02-09"
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const [year, month, day] = dateStr.split("-").map(Number);
    // Create date at midnight local time (not UTC) to avoid timezone shifts
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

const HRMyAttendance = () => {
  const { user, role } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeBreaks, setActiveBreaks] = useState([]);
  const [breakTimers, setBreakTimers] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [chartView, setChartView] = useState("monthly");
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [isOverlapWindow, setIsOverlapWindow] = useState(false);

  // NEW: Sync state variables
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const [hasSyncedToday, setHasSyncedToday] = useState(false);
  const [syncedDate, setSyncedDate] = useState(null);

  // Attendance correction modal state
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionRecord, setCorrectionRecord] = useState(null);

  // Leave summary state
  const [leaveSummary, setLeaveSummary] = useState({
    casual: { used: 0, total: 8 },
    sick: { used: 0, total: 8 },
    annual: { used: 0, total: 12 },
  });

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };
  const RECORDS_PER_PAGE = getDaysInMonth(selectedMonth, selectedYear);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    console.log("[INFO] HRMyAttendance mounted with user:", user);
    Promise.all([
      fetchTodayAttendance(),
      fetchPendingCheckout(),
      fetchActiveBreaks(),
      fetchMonthlyAttendance(),
      fetchLeaveBalance(),
      checkDeviceStatus(), // ✅ Check device status on mount
    ]).catch((err) => console.error("Initial fetch error:", err));
  }, []);

  // Re-fetch monthly attendance when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchMonthlyAttendance();
  }, [selectedMonth, selectedYear]);

  // Update break timers every second
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

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const getEmployeeId = () => {
    const id = user?.employeeId || user?.employee_id || user?.id;
    console.log("[INFO] Getting employee ID:", {
      user,
      employeeId: user?.employeeId,
      employee_id: user?.employee_id,
      id: user?.id,
      resolved: id,
    });

    if (!id) {
      console.error("[ERROR] No employee ID found in user object!", user);
      toast.error(
        "Unable to determine employee ID. Please logout and login again.",
      );
      return null;
    }

    return id;
  };

  const getDeviceUserId = () => {
    const deviceUserId = user?.device_user_id;

    console.log("[INFO] Getting device user ID:", {
      deviceUserId,
      user,
    });

    if (!deviceUserId) {
      console.warn("[WARNING] No device_user_id found in user object!");
      return null;
    }

    return deviceUserId;
  };

  // ✅ NEW: Check device status function
  const checkDeviceStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://100.118.172.21:5000/api/v1/zkTime/connect",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setDeviceStatus({ connected: data.success });
      return data.success;
    } catch (error) {
      setDeviceStatus({ connected: false, error: error.message });
      return false;
    }
  };

  const handleSyncWithDevice = async () => {
    const employeeId = getEmployeeId();
    const deviceUserId = getDeviceUserId();

    if (!employeeId) {
      toast.error("Employee ID not found");
      return;
    }

    // ✅ Check if already synced today
    if (hasSyncedToday) {
      toast.info(
        `Already synced today (${syncedDate}). Come back tomorrow for new sync.`,
        { duration: 3000 }
      );
      return;
    }

    // ✅ Check if device_user_id exists
    if (!deviceUserId) {
      toast.error("Device User ID not found. Please contact HR to set up device sync.");
      return;
    }

    setIsSyncing(true);

    try {
      const token = localStorage.getItem("token");

      console.log(`📱 Syncing with device_user_id: ${deviceUserId}`);

      // Fetch device logs
      const deviceResponse = await fetch(
        `http://100.118.172.21:5000/api/v1/zkTime/attendance/user/${deviceUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const deviceData = await deviceResponse.json();

      if (!deviceData.success) {
        toast.error("Failed to fetch device attendance");
        setIsSyncing(false);
        return;
      }

      const deviceLogs = deviceData.data || [];

      if (deviceLogs.length === 0) {
        toast.info("No attendance records found on device");
        setIsSyncing(false);
        return;
      }

      // ============================================================
      // ⭐ CORRECT DATE CORRECTION (00:00 - 08:59 → Previous Day)
      // ============================================================
      const getCorrectedDate = (punchTimeStr, originalDateStr) => {
        const [hour] = punchTimeStr.split(":").map(Number);
        // 00:00 - 08:59 → Previous day (Night shift checkout)
        if (hour >= 0 && hour <= 8) {
          const date = new Date(originalDateStr);
          date.setDate(date.getDate() - 1);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        return originalDateStr;
      };

      let savedCount = 0;
      let skippedCount = 0;
      let syncedRecords = [];

      // ✅ Process logs in batches to avoid rate limiting
      const BATCH_SIZE = 50;
      const batches = [];
      for (let i = 0; i < deviceLogs.length; i += BATCH_SIZE) {
        batches.push(deviceLogs.slice(i, i + BATCH_SIZE));
      }

      console.log(`📊 Total logs: ${deviceLogs.length}, Batches: ${batches.length}`);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);

        // Process device punches sequentially so IN is saved before OUT.
        const batchPromises = [];
        for (const log of batch) {
          const result = await (async () => {
          const fullDateTime = log.attendance_time;
          const deviceDate = log.punch_date_date;

          if (!fullDateTime) {
            skippedCount++;
            return null;
          }

          const [, timePart] = fullDateTime.split(" ");
          const punchTime = timePart;
          let punchType = null;

          if (log.punch_label === 'check-in') {
            punchType = 'IN';
          } else if (log.punch_label === 'check-out') {
            punchType = 'OUT';
          }

          if (!punchType) {
            skippedCount++;
            console.log(`⚠️ Unknown device punch type, skipping time: ${punchTime}`);
            return null;
          }

          // ⭐ Correct date for night shift
          const correctedDate = getCorrectedDate(punchTime, deviceDate);

          console.log(`📌 ${punchType} | Time: ${punchTime} | Date: ${correctedDate} (original: ${deviceDate})`);

          // ⭐ Prepare request body
          const requestBody = {
            employee_id: employeeId,
            email: user?.email,
            name: user?.name,
            device_info: "ZKTeco Device",
            is_device_sync: true,
            punch_type: punchType,  // ⭐ SEND PUNCH TYPE
          };

          let saveResponse;
          let endpoint;

          if (punchType === "IN") {
            requestBody.check_in_time = punchTime;
            requestBody.attendance_date = correctedDate;
            endpoint = endpoints.attendance.checkIn;
          } else if (punchType === "OUT") {
            requestBody.check_out_time = punchTime;
            requestBody.attendance_date = correctedDate;
            endpoint = endpoints.attendance.checkOut;
          }

          try {
            saveResponse = await fetch(endpoint, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });

            const responseData = await saveResponse.json();

            if (saveResponse.ok) {
              return { success: true, type: punchType, time: punchTime, date: correctedDate };
            } else {
              console.log(`⚠️ Failed: ${responseData.message || 'Unknown error'}`);
              return { success: false, type: punchType, time: punchTime, error: responseData.message };
            }
          } catch (err) {
            console.error(`❌ Error saving ${punchType}:`, err.message);
            return { success: false, type: punchType, time: punchTime, error: err.message };
          }
          })();
          batchPromises.push(result);
        }

        // Wait for all promises in this batch
        const batchResults = await Promise.all(batchPromises);

        // Count results
        for (const result of batchResults) {
          if (result === null) {
            // Already counted as skipped
          } else if (result.success) {
            savedCount++;
            syncedRecords.push({
              type: result.type,
              time: result.time,
              date: result.date,
            });
          } else {
            skippedCount++;
          }
        }

        // Small delay between batches
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Update progress
        const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
        console.log(`📊 Progress: ${progress}% (${savedCount} saved, ${skippedCount} skipped)`);
      }

      // ============================================================
      // ⭐ FINAL SUMMARY
      // ============================================================
      if (savedCount > 0) {
        const today = new Date().toISOString().split("T")[0];
        setHasSyncedToday(true);
        setSyncedDate(today);
        localStorage.setItem(
          `zk_sync_${employeeId}`,
          JSON.stringify({
            date: today,
            syncedAt: new Date().toISOString(),
            recordsCount: savedCount,
            skippedCount: skippedCount,
          })
        );

        toast.success(`${savedCount} record(s) synced from device`);
      } else {
        toast.info(`No new records synced. ${skippedCount} skipped.`);
      }

      if (skippedCount > 0) {
        toast(`${skippedCount} record(s) skipped`, { icon: "ℹ️" });
      }

      // Refresh display
      await fetchTodayAttendance();
      await fetchMonthlyAttendance();

    } catch (error) {
      console.error("❌ Sync error:", error);
      toast.error("Failed to sync with device: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add this useEffect to check if already synced today
  useEffect(() => {
    const employeeId = getEmployeeId();
    if (employeeId) {
      const savedSync = localStorage.getItem(`zk_sync_${employeeId}`);
      if (savedSync) {
        try {
          const syncData = JSON.parse(savedSync);
          const today = new Date().toISOString().split("T")[0];
          if (syncData.date === today) {
            setHasSyncedToday(true);
            setSyncedDate(syncData.date);
            setLastSyncTime(new Date(syncData.syncedAt));
          } else {
            // Clear old sync data for new day
            localStorage.removeItem(`zk_sync_${employeeId}`);
            setHasSyncedToday(false);
            setSyncedDate(null);
          }
        } catch (e) {
          console.error("Error parsing sync data:", e);
        }
      }
    }
  }, [user]);

  const isCheckoutDeadlineExceeded = () => {
    if (!attendanceData?.check_in_time || attendanceData?.check_out_time) {
      return false;
    }

    const now = getPakistanDate ? getPakistanDate() : new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMin;
    const nineAM = 9 * 60;

    return currentTotalMinutes >= nineAM;
  };

  const getTimeUntilDeadline = () => {
    if (!attendanceData?.check_in_time || attendanceData?.check_out_time) {
      return { text: "", exceeded: false };
    }

    const now = getPakistanDate ? getPakistanDate() : new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMin;
    const nineAM = 9 * 60;

    if (currentTotalMinutes < nineAM) {
      const minutesLeft = nineAM - currentTotalMinutes;
      const hours = Math.floor(minutesLeft / 60);
      const mins = minutesLeft % 60;
      return {
        text: `${hours}h ${mins}m until 9:00 AM tomorrow`,
        exceeded: false,
        hoursMinutes: `${hours}h ${mins}m`,
      };
    } else {
      const minutesPassed = currentTotalMinutes - nineAM;
      const hours = Math.floor(minutesPassed / 60);
      const mins = minutesPassed % 60;
      return {
        text: `${hours}h ${mins}m past deadline`,
        exceeded: true,
        hoursMinutes: `${hours}h ${mins}m`,
      };
    }
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
        let records = data.data || [];

        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const recordsByDate = {};

        records.forEach((record) => {
          if (record.attendance_date) {
            const dateNum = new Date(record.attendance_date).getDate();
            recordsByDate[dateNum] = record;
          }
        });

        const completeMonthData = [];
        for (let date = 1; date <= daysInMonth; date++) {
          const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
          const existingRecord = recordsByDate[date];

          if (existingRecord) {
            completeMonthData.push(existingRecord);
          } else {
            completeMonthData.push({
              id: null,
              employee_id: employeeId,
              attendance_date: dateStr,
              check_in_time: null,
              check_out_time: null,
              status: "Absent",
              net_working_time_minutes: 0,
              total_breaks_taken: 0,
              total_break_duration_minutes: 0,
              late_by_minutes: null,
              overtime_minutes: 0,
              is_absent: true,
            });
          }
        }

        console.log(
          "[SUCCESS] Monthly attendance fetched:",
          completeMonthData.length,
          "records",
        );
        setMonthlyAttendance(completeMonthData);
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

    const [checkInHour, checkInMin] = attendanceData.check_in_time
      .split(":")
      .map(Number);
    const checkInTotalMinutes = checkInHour * 60 + checkInMin;

    let checkOutTotalMinutes = 0;

    if (attendanceData.check_out_time) {
      const [checkOutHour, checkOutMin] = attendanceData.check_out_time
        .split(":")
        .map(Number);
      checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
    } else {
      const now = getPakistanDate ? getPakistanDate() : new Date();
      checkOutTotalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
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
          const [checkInHour, checkInMin] = record.check_in_time
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
          status: record.status === "ML" ? "Late" : record.status,
          raw_minutes: rawMinutes,
        };
      });

    return Object.entries(weekDays).map(([date, data]) => ({
      date: date,
      hours: data.hours,
      status: data.status,
      raw_minutes: data.raw_minutes,
    }));
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
          const [checkInHour, checkInMin] = record.check_in_time
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
          status: record.status === "ML" ? "Late" : record.status,
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
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const recordsByDate = {};
    monthlyAttendance.forEach((record) => {
      const dateNum = parseAttendanceDate(record.attendance_date).getDate();
      recordsByDate[dateNum] = record;
    });

    const allDates = [];
    for (let date = 1; date <= daysInMonth; date++) {
      const record = recordsByDate[date];
      const dateObj = new Date(selectedYear, selectedMonth - 1, date);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (record) {
        allDates.push({
          date: date,
          hours: record.net_working_time_minutes
            ? Math.floor(record.net_working_time_minutes / 60)
            : 0,
          minutes: record.net_working_time_minutes
            ? record.net_working_time_minutes % 60
            : 0,
          status: record.status === "ML" ? "Late" : (record.status || "Absent"),
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
          total_breaks_taken: record.total_breaks_taken || 0,
          total_break_duration_minutes:
            record.total_break_duration_minutes || 0,
          late_by_minutes: record.late_by_minutes,
          overtime_minutes: record.overtime_minutes || 0,
          id: record.id,
          is_absent: false,
          is_weekend: false,
          has_attendance: true,
        });
      } else {
        allDates.push({
          date: date,
          hours: 0,
          minutes: 0,
          status: "Absent",
          check_in_time: null,
          check_out_time: null,
          total_breaks_taken: 0,
          total_break_duration_minutes: 0,
          late_by_minutes: null,
          overtime_minutes: 0,
          id: null,
          is_absent: true,
          is_weekend: isWeekend,
          has_attendance: false,
        });
      }
    }

    return allDates.sort((a, b) => b.date - a.date);
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
      duration: 5,
    },
    {
      type: "Dinner",
      label: "Dinner Break",
      icon: Utensils,
      color: "bg-orange-500",
      duration: 60,
    },
    {
      type: "Washroom",
      label: "Washroom Break",
      icon: User,
      color: "bg-blue-500",
      duration: 10,
    },
    {
      type: "Prayer",
      label: "Prayer Break",
      icon: Activity,
      color: "bg-purple-500",
      duration: 10,
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          title="My Attendance Sheet"
          subtitle="View your monthly attendance records"
          role={role}
          currentTime={currentTime}
        />
        <RoleBasedNav role={role} />

        {/* ✅ SYNC BAR - Desktop */}
        <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${deviceStatus?.connected ? "bg-green-500" : "bg-red-500"} animate-pulse`}
                />
                <span className="text-sm text-gray-600">
                  Device: {deviceStatus?.connected ? "Connected" : "Offline"}
                </span>
              </div>
              {lastSyncTime && (
                <span className="text-xs text-gray-400">
                  Last sync: {lastSyncTime.toLocaleTimeString()}
                </span>
              )}
              {hasSyncedToday && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ✓ Synced today
                </span>
              )}
            </div>

            <button
              onClick={handleSyncWithDevice}
              disabled={isSyncing || hasSyncedToday}
              className={`
        flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300
        ${isSyncing || hasSyncedToday
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-indigo-500/25"
                }
      `}
              title={
                hasSyncedToday
                  ? `Already synced today (${syncedDate})`
                  : "Sync attendance from device"
              }
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : hasSyncedToday ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Synced Today
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync with Device
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Sync Button */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-3">
          <button
            onClick={handleSyncWithDevice}
            disabled={isSyncing || hasSyncedToday}
            className={`
      w-full flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-all duration-300
      ${isSyncing || hasSyncedToday
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-indigo-500 text-white"
              }
    `}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : hasSyncedToday ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Synced Today
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync with Device
              </>
            )}
          </button>
          {hasSyncedToday && (
            <p className="text-xs text-green-600 text-center mt-2">
              ✓ Already synced for {syncedDate}
            </p>
          )}
        </div>

        {/* ✅ Sync Result Toast Notification */}
        {syncResult && (
          <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
            <div
              className={`rounded-xl shadow-lg p-4 flex items-center gap-3 ${syncResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
                }`}
            >
              {syncResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${syncResult.success ? "text-green-800" : "text-red-800"}`}
                >
                  {syncResult.message}
                </p>
                {syncResult.details?.saved_records?.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {syncResult.details.saved_records
                      .map((r) => `${r.type} at ${r.time}`)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
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
                      {new Date(2026, selectedMonth - 1).toLocaleDateString(
                        "en-US",
                        { month: "long" },
                      )}{" "}
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
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-lg bg-white text-gray-700 font-semibold cursor-pointer border border-gray-300 hover:border-blue-400 transition-colors"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1).toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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
                  <p className="text-xs text-blue-600 mt-1">total this month</p>
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
                  <p className="text-xs text-purple-600 mt-1">per work day</p>
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
                    {Math.floor(getMonthlyStats().totalBreakMinutes / 60)}h{" "}
                    {getMonthlyStats().totalBreakMinutes % 60}m
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
                <button
                  onClick={() => setStatusFilter("All Status")}
                  className={`px-6 py-3 rounded-full font-semibold transition-all text-sm shadow-md ${statusFilter === "All Status"
                    ? "bg-[#349DFF] text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400"
                    }`}
                >
                  All ({monthlyAttendance.length})
                </button>

                <button
                  onClick={() => setStatusFilter("Present")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${statusFilter === "Present"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  Present (
                  {
                    monthlyAttendance.filter((r) => r.status === "Present")
                      .length
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
                  {monthlyAttendance.filter((r) => r.status === "Late").length})
                </button>

                <button
                  onClick={() => setStatusFilter("Half Day")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${statusFilter === "Half Day"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  HD (
                  {monthlyAttendance.filter((r) => r.status === "Half Day").length})
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
                  {monthlyAttendance.filter((r) => r.status === "Leave").length}
                  )
                </button>
              </div>
            </div>

            {/* Attendance Table - Keep your existing table code */}
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
                    {(() => {
                      const allMonthlyData = getMonthlyData();

                      let filteredRecords = allMonthlyData;
                      if (statusFilter !== "All Status") {
                        filteredRecords = allMonthlyData.filter(
                          (r) => r.status === statusFilter,
                        );
                      }

                      if (filteredRecords.length === 0) {
                        return (
                          <tr>
                            <td
                              colSpan="9"
                              className="px-4 py-8 text-center text-gray-500"
                            >
                              No attendance records found for the selected
                              filters
                            </td>
                          </tr>
                        );
                      }

                      const totalPages = Math.ceil(
                        filteredRecords.length / RECORDS_PER_PAGE,
                      );
                      const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
                      const endIndex = startIndex + RECORDS_PER_PAGE;
                      const paginatedRecords = filteredRecords.slice(
                        startIndex,
                        endIndex,
                      );

                      return paginatedRecords.map((record, index) => {
                        const isWeekend = record.is_weekend === true;

                        return (
                          <tr
                            key={record.id || `date-${record.date}`}
                            className={`${isWeekend
                              ? "bg-gray-100/50 hover:bg-gray-200"
                              : record.is_absent
                                ? "bg-red-50 hover:bg-red-100"
                                : record.status === "Half Day"
                                  ? "bg-blue-50 hover:bg-blue-100"
                                  : index % 2 === 0
                                    ? "bg-gray-50 hover:bg-gray-100"
                                    : "bg-white hover:bg-gray-50"
                              } transition-colors`}
                          >
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {new Date(
                                selectedYear,
                                selectedMonth - 1,
                                record.date,
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                              {isWeekend && (
                                <span className="ml-2 inline-block px-1.5 py-0.5 text-xs font-semibold bg-gray-300 text-gray-700 rounded">
                                  Weekend
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {isWeekend ? (
                                <span className="text-gray-400">—</span>
                              ) : !record.check_in_time ? (
                                <span className="text-red-600 font-semibold">
                                  No Check-in
                                </span>
                              ) : (
                                record.check_in_time
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {isWeekend ? (
                                <span className="text-gray-400">—</span>
                              ) : !record.check_in_time ? (
                                <span className="text-red-600 font-semibold">
                                  —
                                </span>
                              ) : (
                                record.check_out_time || "-"
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {isWeekend ? (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                                  Weekend
                                </span>
                              ) : (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-bold ${record.status === "Present"
                                    ? "bg-green-100 text-green-700"
                                    : record.status === "Late"
                                      ? "bg-orange-100 text-orange-700"
                                      : record.status === "Half Day"
                                        ? "bg-blue-100 text-blue-700"
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
                                          : record.status === "Half Day"
                                            ? "HD"
                                            : record.status === "Absent"
                                              ? "A"
                                              : record.status}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {isWeekend ? (
                                <span className="text-gray-400">—</span>
                              ) : record.is_absent ? (
                                <span className="text-red-600 font-semibold">
                                  —
                                </span>
                              ) : record.hours > 0 || record.minutes > 0 ? (
                                `${record.hours}h ${record.minutes}m`
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {isWeekend ? (
                                <span className="text-gray-400">—</span>
                              ) : record.is_absent ? (
                                <span className="text-red-600 font-semibold">
                                  —
                                </span>
                              ) : (
                                (record.total_breaks_taken || 0) +
                                " (" +
                                (record.total_break_duration_minutes || 0) +
                                "m)"
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {isWeekend ? (
                                <span className="text-gray-400">—</span>
                              ) : record.is_absent ? (
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
                              {isWeekend ? (
                                <span className="text-gray-400">—</span>
                              ) : record.is_absent ? (
                                <span className="text-red-600 font-semibold">
                                  —
                                </span>
                              ) : record.overtime_minutes > 0 ? (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  {Math.floor(record.overtime_minutes / 60)}h{" "}
                                  {record.overtime_minutes % 60}m
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {!isWeekend && (
                                <button
                                  onClick={() => {
                                    // ✅ FIX: Create date without timezone conversion
                                    const year = selectedYear;
                                    const month = String(selectedMonth).padStart(2, '0');
                                    const day = String(record.date).padStart(2, '0');
                                    const dateStr = `${year}-${month}-${day}`;

                                    const correctionCompatibleRecord = {
                                      ...record,
                                      attendance_date: dateStr, // ✅ Use direct string, no Date object
                                      net_working_time_minutes: record.hours * 60 + record.minutes,
                                    };
                                    console.log('📅 Correction Record Date:', dateStr);
                                    console.log('📅 Full Record:', correctionCompatibleRecord);
                                    setCorrectionRecord(correctionCompatibleRecord);
                                    setCorrectionModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all"
                                  title="Request attendance correction"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Correct
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {(() => {
                const filteredRecords = monthlyAttendance.filter(
                  (r) =>
                    statusFilter === "All Status" || r.status === statusFilter,
                );

                const sortedRecords = [...filteredRecords].sort((a, b) => {
                  const dateA = new Date(a.attendance_date);
                  const dateB = new Date(b.attendance_date);
                  return dateB - dateA;
                });

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

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
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
                        ),
                      )}

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
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
        </main>
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
