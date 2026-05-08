const ZKLib = require("node-zklib");

// Configuration
const zkConfig = {
  ip: "192.168.100.20",
  port: 4370,
  timeout: 20000,
  inport: 5200,
};

let zkInstance = null;
let isConnected = false;

// ============ HELPER FUNCTIONS ============

async function connectToDevice() {
  try {
    console.log("🔄 Connecting to device at:", zkConfig.ip);

    zkInstance = new ZKLib(
      zkConfig.ip,
      zkConfig.port,
      zkConfig.timeout,
      zkConfig.inport,
    );

    await zkInstance.createSocket();
    const deviceInfo = await zkInstance.getInfo();

    isConnected = true;
    console.log("✅ Connected successfully");
    console.log("📟 Device Info:", deviceInfo);

    return { success: true, info: deviceInfo };
  } catch (error) {
    isConnected = false;
    zkInstance = null;
    console.error("❌ Connection error:", error.message || error);
    throw error;
  }
}

async function ensureConnection() {
  if (!isConnected || !zkInstance) {
    await connectToDevice();
  }
}

async function disconnectDevice() {
  try {
    if (zkInstance) {
      await zkInstance.disconnect();
    }
    isConnected = false;
    zkInstance = null;
    console.log("✅ Disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting:", error.message);
  }
}

// ============ CONTROLLER FUNCTIONS ============

// Connect to device
exports.connectDevice = async (req, res) => {
  try {
    const result = await connectToDevice();
    res.status(200).json({
      success: true,
      message: "Device connected successfully",
      data: result.info,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get device info
exports.getDeviceInfo = async (req, res) => {
  try {
    await ensureConnection();
    const info = await zkInstance.getInfo();
    res.status(200).json({
      success: true,
      data: info,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// get device time
exports.getDeviceTime = async (req, res) => {
  try {
    await ensureConnection();
    // Correct method name is getTime() - it should work
    // If still error, try getDeviceTime()
    let time;
    try {
      time = await zkInstance.getTime();
    } catch (err) {
      // Alternative method names
      if (typeof zkInstance.getDeviceTime === "function") {
        time = await zkInstance.getDeviceTime();
      } else if (typeof zkInstance.getDateTime === "function") {
        time = await zkInstance.getDateTime();
      } else {
        // Fallback: get info which includes time
        const info = await zkInstance.getInfo();
        time = info?.time || info?.datetime || new Date().toISOString();
      }
    }
    res.status(200).json({
      success: true,
      data: time,
    });
  } catch (error) {
    console.error("Error getting device time:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all attendance logs
exports.getAllAttendanceLogs = async (req, res) => {
  try {
    await ensureConnection();
    const logs = await zkInstance.getAttendances();
    res.status(200).json({
      success: true,
      count: logs ? logs.length : 0,
      data: logs || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get attendance by user ID
exports.getAttendanceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    await ensureConnection();

    // Fetch users for mapping
    let users = [];
    try {
      const userResponse = await zkInstance.getUsers();
      if (
        userResponse &&
        userResponse.data &&
        Array.isArray(userResponse.data)
      ) {
        users = userResponse.data;
      }
    } catch (error) {
      console.warn("Could not fetch users:", error.message);
    }

    // Fetch attendance logs
    let allLogs = [];
    const rawResponse = await zkInstance.getAttendances();

    if (rawResponse && rawResponse.data && Array.isArray(rawResponse.data)) {
      allLogs = rawResponse.data;
    } else if (Array.isArray(rawResponse)) {
      allLogs = rawResponse;
    }

    if (!allLogs.length) {
      return res.status(200).json({
        success: true,
        user_id: userId,
        count: 0,
        data: [],
      });
    }

    // Filter by user ID
    const searchUserId = String(userId);
    const userLogs = allLogs.filter((log) => {
      const logUserId = String(
        log.deviceUserId || log.userId || log.user_id || log.uid || log.userSn,
      );
      return logUserId === searchUserId;
    });

    // Filter by date range
    let filteredLogs = userLogs;
    if (from || to) {
      filteredLogs = userLogs.filter((log) => {
        const logDate = new Date(
          log.recordTime ||
            log.timestamp ||
            log.date ||
            log.datetime ||
            log.time,
        );
        if (from && to) {
          return logDate >= new Date(from) && logDate <= new Date(to);
        } else if (from) {
          return logDate >= new Date(from);
        } else if (to) {
          return logDate <= new Date(to);
        }
        return true;
      });
    }

    const formattedLogs = filteredLogs.map((log) => ({
      user_id: log.deviceUserId || log.userId || log.user_id,
      record_time: log.recordTime || log.timestamp || log.date,
      ip: log.ip || "",
      user_sn: log.userSn || log.uid,
    }));

    res.status(200).json({
      success: true,
      user_id: userId,
      count: formattedLogs.length,
      data: formattedLogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ TODAY'S ATTENDANCE - By User ID (Fully Fixed Night Shift)
exports.getTodayAttendance = async (req, res) => {
  try {
    const { userId } = req.params; // userId from URL parameter

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required. Use: /api/v1/zkTime/attendance/today/10",
      });
    }

    // Get current Pakistan Time (UTC+5)
    const now = new Date();
    const pkNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const currentHour = pkNow.getHours();

    // 🔥 CRITICAL: Determine target date and night shift status
    let targetDate;
    let isNightShiftActive = false;

    // If time is between 12 AM and 6 AM, it's night shift window
    if (currentHour >= 0 && currentHour < 6) {
      // Night shift: show previous day's attendance
      const prevDay = new Date(pkNow.getTime() - 24 * 60 * 60 * 1000);
      const year = prevDay.getFullYear();
      const month = String(prevDay.getMonth() + 1).padStart(2, "0");
      const day = String(prevDay.getDate()).padStart(2, "0");
      targetDate = `${year}-${month}-${day}`;
      isNightShiftActive = true;
      console.log(
        `🌙 Night shift active (${currentHour}:00). Showing attendance for user ${userId} on: ${targetDate}`,
      );
    } else {
      // Normal hours: show today's attendance
      const year = pkNow.getFullYear();
      const month = String(pkNow.getMonth() + 1).padStart(2, "0");
      const day = String(pkNow.getDate()).padStart(2, "0");
      targetDate = `${year}-${month}-${day}`;
      isNightShiftActive = false;
      console.log(
        `☀️ Normal hours (${currentHour}:00). Showing attendance for user ${userId} on: ${targetDate}`,
      );
    }

    await ensureConnection();

    // Get all attendance logs
    const rawResponse = await zkInstance.getAttendances();

    let allLogs = [];
    if (rawResponse && rawResponse.data && Array.isArray(rawResponse.data)) {
      allLogs = rawResponse.data;
    } else if (Array.isArray(rawResponse)) {
      allLogs = rawResponse;
    }

    if (!allLogs.length) {
      return res.status(200).json({
        success: true,
        user_id: userId,
        target_date: targetDate,
        current_pakistan_time: formatPakistanTime(new Date().toISOString()),
        current_hour: currentHour,
        night_shift_active: isNightShiftActive,
        message: "No attendance logs found in device",
        checkin: null,
        checkout: null,
        data: [],
      });
    }

    // Helper functions
    const utcToPakistanTime = (utcDateString) => {
      if (!utcDateString) return null;
      const utcDate = new Date(utcDateString);
      if (isNaN(utcDate.getTime())) return null;
      return new Date(utcDate.getTime() + 5 * 60 * 60 * 1000);
    };

    const formatPakistanTime = (utcDateString) => {
      const pkDate = utcToPakistanTime(utcDateString);
      if (!pkDate) return null;

      const year = pkDate.getFullYear();
      const month = String(pkDate.getMonth() + 1).padStart(2, "0");
      const day = String(pkDate.getDate()).padStart(2, "0");
      const hours = String(pkDate.getHours()).padStart(2, "0");
      const minutes = String(pkDate.getMinutes()).padStart(2, "0");
      const seconds = String(pkDate.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const getPunchType = (hours) => {
      if (hours === null || hours === undefined) return null;
      // Check-in: 9 PM to 3 AM (21-23, 0-3)
      if (hours >= 21 || (hours >= 0 && hours <= 3)) {
        return 0; // Check-in
      }
      // Check-out: 5 AM to 7 AM (5-7)
      else if (hours >= 5 && hours <= 7) {
        return 1; // Check-out
      } else {
        return null; // Mid-day record
      }
    };

    const getEffectiveDate = (utcDateString) => {
      const pkDate = utcToPakistanTime(utcDateString);
      if (!pkDate) return null;

      const hours = pkDate.getHours();
      const year = pkDate.getFullYear();
      const month = String(pkDate.getMonth() + 1).padStart(2, "0");
      const day = String(pkDate.getDate()).padStart(2, "0");

      // For night shift logs (12 AM to 6 AM), they belong to previous day
      if (hours >= 0 && hours < 6) {
        const prevDay = new Date(pkDate.getTime() - 24 * 60 * 60 * 1000);
        const prevYear = prevDay.getFullYear();
        const prevMonth = String(prevDay.getMonth() + 1).padStart(2, "0");
        const prevDayDate = String(prevDay.getDate()).padStart(2, "0");
        return `${prevYear}-${prevMonth}-${prevDayDate}`;
      }

      return `${year}-${month}-${day}`;
    };

    // Filter by user ID
    const searchUserId = String(userId);

    // First filter logs by user
    let userLogs = allLogs.filter((log) => {
      const logUserId = String(
        log.deviceUserId || log.userId || log.user_id || log.uid || log.userSn,
      );
      return logUserId === searchUserId;
    });

    if (!userLogs.length) {
      return res.status(200).json({
        success: true,
        user_id: userId,
        target_date: targetDate,
        current_pakistan_time: formatPakistanTime(new Date().toISOString()),
        current_hour: currentHour,
        night_shift_active: isNightShiftActive,
        message: `No attendance records found for user ${userId}`,
        checkin: null,
        checkout: null,
        data: [],
      });
    }

    // Process logs with timezone and punch detection
    let processedLogs = userLogs
      .map((log) => {
        const utcTime =
          log.recordTime || log.timestamp || log.datetime || log.time;
        if (!utcTime) return null;

        const pkTime = utcToPakistanTime(utcTime);
        const hours = pkTime ? pkTime.getHours() : null;
        const punchType = getPunchType(hours);
        const effectiveDate = getEffectiveDate(utcTime);
        const pakistanTimeFormatted = formatPakistanTime(utcTime);

        return {
          user_id: searchUserId,
          user_sn: log.userSn,
          utc_time: utcTime,
          pakistan_time: pakistanTimeFormatted,
          pakistan_hour: hours,
          effective_date: effectiveDate,
          punch: punchType,
          ip: log.ip || "",
        };
      })
      .filter((log) => log !== null);

    // Log for debugging
    console.log(`📊 Processed ${processedLogs.length} logs for user ${userId}`);
    console.log(`🎯 Target date: ${targetDate}`);
    console.log(
      `📅 Available effective dates: ${[...new Set(processedLogs.map((l) => l.effective_date))].join(", ")}`,
    );

    // Filter by target date
    let filteredLogs = processedLogs.filter(
      (log) => log.effective_date === targetDate,
    );

    if (!filteredLogs.length) {
      return res.status(200).json({
        success: true,
        user_id: userId,
        target_date: targetDate,
        current_pakistan_time: formatPakistanTime(new Date().toISOString()),
        current_hour: currentHour,
        night_shift_active: isNightShiftActive,
        message: `No attendance records for user ${userId} on ${targetDate}`,
        available_dates: [
          ...new Set(processedLogs.map((l) => l.effective_date)),
        ],
        checkin: null,
        checkout: null,
        data: [],
      });
    }

    // Sort by time
    filteredLogs.sort((a, b) => new Date(a.utc_time) - new Date(b.utc_time));

    // Find check-in and check-out
    const checkinLog = filteredLogs.find((log) => log.punch === 0);
    const checkoutLog = filteredLogs.find((log) => log.punch === 1);

    // Also get all records for the day
    const allRecords = filteredLogs.map((log) => ({
      time: log.pakistan_time,
      type:
        log.punch === 0
          ? "Check-in"
          : log.punch === 1
            ? "Check-out"
            : "Mid-day",
      hour: log.pakistan_hour,
    }));

    // Calculate work hours if both checkin and checkout exist
    let workHours = null;
    if (checkinLog && checkoutLog) {
      const checkinTime = new Date(checkinLog.utc_time);
      const checkoutTime = new Date(checkoutLog.utc_time);
      if (!isNaN(checkinTime) && !isNaN(checkoutTime)) {
        const diffMs = checkoutTime - checkinTime;
        workHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
      }
    }

    res.status(200).json({
      success: true,
      user_id: userId,
      user_sn: filteredLogs[0]?.user_sn || null,
      target_date: targetDate,
      current_pakistan_time: formatPakistanTime(new Date().toISOString()),
      current_hour: currentHour,
      night_shift_active: isNightShiftActive,
      timezone: "Asia/Karachi (UTC+5)",
      summary: {
        total_records: filteredLogs.length,
        has_checkin: !!checkinLog,
        has_checkout: !!checkoutLog,
        work_hours: workHours ? parseFloat(workHours) : null,
      },
      checkin: checkinLog
        ? {
            time: checkinLog.pakistan_time,
            utc: checkinLog.utc_time,
            punch: 0,
            hour: checkinLog.pakistan_hour,
          }
        : null,
      checkout: checkoutLog
        ? {
            time: checkoutLog.pakistan_time,
            utc: checkoutLog.utc_time,
            punch: 1,
            hour: checkoutLog.pakistan_hour,
          }
        : null,
      all_records: allRecords,
    });
  } catch (error) {
    console.error("Error fetching user's today attendance:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    await ensureConnection();

    let users = [];
    const userResponse = await zkInstance.getUsers();

    if (userResponse && userResponse.data && Array.isArray(userResponse.data)) {
      users = userResponse.data;
    } else if (Array.isArray(userResponse)) {
      users = userResponse;
    }

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    await ensureConnection();

    const userResponse = await zkInstance.getUsers();
    let users = [];

    if (userResponse && userResponse.data && Array.isArray(userResponse.data)) {
      users = userResponse.data;
    } else if (Array.isArray(userResponse)) {
      users = userResponse;
    }

    const user = users.find((u) => {
      const uid = u.userId || u.user_id || u.id || u.uid;
      return String(uid) === String(userId);
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User with ID ${userId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Disconnect
exports.disconnectDevice = async (req, res) => {
  try {
    await disconnectDevice();
    res.status(200).json({
      success: true,
      message: "Device disconnected successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
