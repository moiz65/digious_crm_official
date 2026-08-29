// controllers/zkTimeController.js - COMPLETE FIX

const Zkteco = require("zkteco-js");
const pool = require('../../config/database');

// ============ CONFIGURATION ============
const zkConfig = {
  ip: "192.168.1.80",
  port: 4370,
  timeout: 10000,
  inport: 5200,
  retryCount: 3,
  retryDelay: 2000,
};

let zkInstance = null;
let isConnected = false;
let connectionLock = false;

// ✅ CACHE for device logs
let cachedDeviceLogs = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000;

// ============ HELPER FUNCTIONS ============

// ============================================================
// FIXED: resolveLog - More comprehensive
// ============================================================
function resolveLog(log) {
  if (!log) return null;

  try {
    // Try multiple possible field names for user ID
    const userId = String(
      log.user_id ??
      log.deviceUserId ??
      log.userId ??
      log.uid ??
      log.userSn ??
      log.USER_ID ??
      log.UID ??
      log.USERID ??
      log.UserId ??
      log.ID ??
      log.id ??
      ""
    );

    // Try multiple possible field names for time
    let recordTime =
      log.record_time ??
      log.recordTime ??
      log.timestamp ??
      log.datetime ??
      log.date ??
      log.time ??
      log.RECORD_TIME ??
      log.TIMESTAMP ??
      log.DateTime ??
      log.Time ??
      log.Date ??
      log.attendance_time ??
      log.punch_time ??
      null;

    // If still null, try to construct from date+time fields
    if (!recordTime) {
      if (log.punch_date_date && log.punch_time) {
        recordTime = `${log.punch_date_date} ${log.punch_time}`;
      } else if (log.date && log.time) {
        recordTime = `${log.date} ${log.time}`;
      } else if (log.attendance_date && log.attendance_time) {
        recordTime = `${log.attendance_date} ${log.attendance_time}`;
      }
    }

    const userSn = log.userSn ?? log.uid ?? log.sn ?? log.USER_SN ?? log.user_sn ?? "";
    const deviceType = log.state ?? log.STATE ?? log.punch ?? log.punch_code ?? null;

    return {
      raw_user_id: userId,
      raw_time: recordTime,
      raw_user_sn: String(userSn),
      raw_type: deviceType,
      ip: log.ip ?? log.IP ?? "",
    };
  } catch (error) {
    console.error(`❌ resolveLog error:`, error.message);
    return null;
  }
}

// ============================================================
// FIXED: toPakistanTime - Handles ALL formats
// ============================================================
function toPakistanTime(recordTimeStr) {
  if (!recordTimeStr) {
    return null;
  }

  try {
    const date = recordTimeStr instanceof Date ? recordTimeStr : new Date(recordTimeStr);
    if (isNaN(date.getTime())) return null;

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date).reduce((values, part) => {
      values[part.type] = part.value;
      return values;
    }, {});

    const pkDate = `${parts.year}-${parts.month}-${parts.day}`;
    const pkTime = `${parts.hour}:${parts.minute}:${parts.second}`;
    return { pkDatetime: `${pkDate} ${pkTime}`, pkDate, pkHour: Number(parts.hour) };

  } catch (e) {
    console.log(`⚠️ toPakistanTime error:`, e.message);
    return null;
  }
}

// ============================================================
// FIXED: getPunchType - With more type mappings
// ============================================================
function getPunchType(deviceType) {
  const typeMap = {
    0: "check-in",
    1: "check-out",
    2: "break-out",
    3: "break-in",
    4: "overtime-in",
    5: "overtime-out",
    '0': "check-in",
    '1': "check-out",
    '2': "break-out",
    '3': "break-in",
    '4': "overtime-in",
    '5': "overtime-out",
    'IN': "check-in",
    'OUT': "check-out",
    'in': "check-in",
    'out': "check-out",
  };

  return typeMap[deviceType] ?? "unknown";
}

// ============================================================
// FIXED: formatLog - Main formatting function
// ============================================================
function formatLog(log) {
  try {
    const resolved = resolveLog(log);
    if (!resolved) {
      return null;
    }

    // Get time value
    let timeValue = resolved.raw_time;
    if (!timeValue) {
      timeValue = log.record_time || log.recordTime || log.timestamp ||
        log.datetime || log.date || log.time || log.attendance_time;
    }

    if (!timeValue) {
      return null;
    }

    // Parse time - Now handles all formats
    const pk = toPakistanTime(timeValue);
    if (!pk) {
      console.log(`⚠️ formatLog: Failed to parse time: "${timeValue}"`);
      return null;
    }

    // Use the device direction code; do not infer direction from time.
    let punchLabel = getPunchType(resolved.raw_type);

    if (punchLabel === 'unknown') {
      if (log.punch_label || log.punchLabel) {
        punchLabel = log.punch_label || log.punchLabel;
      }
    }

    // ✅ ALWAYS return formatted log, even if punch_label is 'unknown'
    const punchTime = pk.pkDatetime ? pk.pkDatetime.split(" ")[1] : null;

    return {
      user_id: resolved.raw_user_id || '',
      user_sn: resolved.raw_user_sn || '',
      record_time: timeValue,
      attendance_time: pk.pkDatetime,
      punch_date_date: pk.pkDate,
      punch_time: punchTime,
      pakistan_hour: pk.pkHour,
      punch_code: resolved.raw_type,
      punch_label: punchLabel,
      ip: resolved.ip || '',
    };
  } catch (error) {
    console.error(`❌ formatLog error:`, error.message);
    return null;
  }
}

function getTodayPakistan() {
  return toPakistanTime(new Date()).pkDate;
}

function shiftDate(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value, index) => index === 0 ? String(value) : String(value).padStart(2, "0"))
    .join("-");
}

function getAttendanceWorkDate(attendanceDate, punchTime) {
  const hour = Number(punchTime?.split(":")[0]);
  return hour >= 0 && hour <= 8
    ? shiftDate(attendanceDate, -1)
    : attendanceDate;
}

function getCurrentMonthDateRange() {
  const [year, month] = getTodayPakistan().split("-").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  const firstDay = `${year}-${pad(month)}-01`;
  const lastDay = `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`;
  return { from: firstDay, to: lastDay };
}

function normalizeSyncDateRange(dateFrom, dateTo) {
  const currentMonth = getCurrentMonthDateRange();

  if (!dateFrom && !dateTo) {
    return { from: currentMonth.from, to: currentMonth.to };
  }

  if (dateFrom && !dateTo) {
    const start = new Date(`${dateFrom}T00:00:00`);
    if (!isNaN(start.getTime())) {
      const year = start.getFullYear();
      const month = start.getMonth();
      const pad = (n) => String(n).padStart(2, "0");
      const firstDay = `${year}-${pad(month + 1)}-01`;
      const lastDay = `${year}-${pad(month + 1)}-${new Date(year, month + 1, 0).getDate()}`;
      return { from: firstDay, to: lastDay };
    }
    return { from: currentMonth.from, to: currentMonth.to };
  }

  if (!dateFrom && dateTo) {
    const end = new Date(`${dateTo}T00:00:00`);
    if (!isNaN(end.getTime())) {
      const year = end.getFullYear();
      const month = end.getMonth();
      const pad = (n) => String(n).padStart(2, "0");
      const firstDay = `${year}-${pad(month + 1)}-01`;
      return { from: firstDay, to: dateTo };
    }
    return { from: currentMonth.from, to: currentMonth.to };
  }

  return { from: dateFrom, to: dateTo };
}

function extractLogsArray(response) {
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  return [];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============ DEVICE CONNECTION ============

async function connectToDevice() {
  if (connectionLock) {
    while (connectionLock) await sleep(100);
    if (isConnected && zkInstance) return { success: true };
  }

  connectionLock = true;
  let lastError = null;

  try {
    for (let attempt = 1; attempt <= zkConfig.retryCount; attempt++) {
      try {
        console.log(`🔄 Connection attempt ${attempt}/${zkConfig.retryCount}`);

        if (zkInstance) {
          try { await zkInstance.disconnect(); } catch { }
          zkInstance = null;
          isConnected = false;
        }

        zkInstance = new Zkteco(
          zkConfig.ip,
          zkConfig.port,
          zkConfig.timeout,
          zkConfig.inport,
        );

        await zkInstance.createSocket();
        const deviceInfo = await zkInstance.getInfo();
        isConnected = true;

        console.log(`✅ Connected successfully`);
        return { success: true, info: deviceInfo };
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error?.message);
        if (attempt < zkConfig.retryCount) await sleep(zkConfig.retryDelay);
      }
    }
  } finally {
    connectionLock = false;
  }

  isConnected = false;
  zkInstance = null;
  throw new Error(lastError?.message || "Failed to connect after all retries");
}

async function ensureConnection() {
  if (isConnected && zkInstance) return true;
  await connectToDevice();
  return true;
}

exports.ensureConnection = ensureConnection;
exports.getZkInstance = () => zkInstance;

// ============ DEVICE MANAGEMENT ============

exports.connectDevice = async (req, res) => {
  try {
    const result = await connectToDevice();
    return res.status(200).json({ success: true, message: "Connected", data: result.info });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDeviceInfo = async (req, res) => {
  try {
    await ensureConnection();
    const info = await zkInstance.getInfo();
    return res.status(200).json({ success: true, data: info });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDeviceTime = async (req, res) => {
  try {
    await ensureConnection();
    const time = await zkInstance.getTime();
    return res.status(200).json({ success: true, data: time });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.disconnectDevice = async (req, res) => {
  try {
    if (zkInstance) await zkInstance.disconnect();
    isConnected = false;
    zkInstance = null;
    cachedDeviceLogs = null;
    cacheTimestamp = null;
    return res.status(200).json({ success: true, message: "Disconnected" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============ ATTENDANCE CONTROLLERS ============

exports.debugRawLogs = async (req, res) => {
  try {
    await ensureConnection();
    const logs = await zkInstance.getAttendances();
    const logsArray = extractLogsArray(logs);
    const firstLog = logsArray[0] ?? null;

    return res.status(200).json({
      success: true,
      total: logsArray.length,
      first_log: firstLog,
      all_keys: firstLog ? Object.keys(firstLog) : [],
      sample_logs: logsArray.slice(0, 3),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllAttendanceLogs = async (req, res) => {
  try {
    await ensureConnection();
    const logs = await zkInstance.getAttendances();
    const logsArray = extractLogsArray(logs);

    return res.status(200).json({
      success: true,
      count: logsArray.length,
      data: logsArray.map(formatLog).filter(Boolean),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET ATTENDANCE BY USER ID - WITH CACHE
// ============================================================
exports.getAttendanceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const allLogs = await getDeviceLogsCached();

    if (!allLogs.length) {
      return res.status(200).json({ success: true, user_id: userId, count: 0, data: [] });
    }

    const searchId = String(userId);

    let userLogs = allLogs.filter((log) => {
      const resolved = resolveLog(log);
      return resolved?.raw_user_id === searchId;
    });

    if (from || to) {
      userLogs = userLogs.filter((log) => {
        const resolved = resolveLog(log);
        if (!resolved?.raw_time) return false;

        const logDate = toPakistanTime(resolved.raw_time)?.pkDate;
        if (!logDate) return false;

        if (from && to) return logDate >= from && logDate <= to;
        if (from) return logDate >= from;
        if (to) return logDate <= to;
        return true;
      });
    }

    const formattedLogs = userLogs.map(formatLog).filter(Boolean);

    return res.status(200).json({
      success: true,
      user_id: userId,
      count: formattedLogs.length,
      filters: { from: from ?? null, to: to ?? null },
      data: formattedLogs,
    });
  } catch (error) {
    console.error("❌ Get attendance error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const allLogs = await getDeviceLogsCached();

    const todayStr = getTodayPakistan();
    const searchId = String(userId);

    const todayLogs = allLogs
      .filter((log) => {
        const resolved = resolveLog(log);
        if (!resolved || resolved.raw_user_id !== searchId) return false;

        const pk = toPakistanTime(resolved.raw_time);
        return pk?.pkDate === todayStr;
      })
      .map(formatLog)
      .filter(Boolean);

    const checkins = todayLogs.filter((l) => l.punch_label === "check-in");
    const checkouts = todayLogs.filter((l) => l.punch_label === "check-out");
    const unknown = todayLogs.filter((l) => l.punch_label === "unknown");

    return res.status(200).json({
      success: true,
      user_id: userId,
      date: todayStr,
      timezone: "Asia/Karachi (UTC+5)",
      summary: {
        total_records: todayLogs.length,
        checkins: checkins.length,
        checkouts: checkouts.length,
        unknown: unknown.length,
      },
      checkins,
      checkouts,
      unknown,
      all_records: todayLogs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============ USER MANAGEMENT ============

async function fetchUsersArray() {
  const users = await zkInstance.getUsers();
  return Array.isArray(users) ? users : (users?.data ?? []);
}

function resolveUserId(user) {
  return String(user?.userId ?? user?.user_id ?? user?.uid ?? "");
}

exports.getAllUsers = async (req, res) => {
  try {
    await ensureConnection();
    const usersArray = await fetchUsersArray();
    return res.status(200).json({ success: true, count: usersArray.length, data: usersArray });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    await ensureConnection();
    const usersArray = await fetchUsersArray();
    const user = usersArray.find((u) => resolveUserId(u) === String(userId));

    if (!user) {
      return res.status(404).json({ success: false, error: `User ${userId} not found` });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { user_id, name, password, role, cardno } = req.body;

    if (!user_id || !name) {
      return res.status(400).json({ success: false, error: "user_id and name are required" });
    }

    await ensureConnection();
    const usersArray = await fetchUsersArray();

    const userExists = usersArray.some((u) => resolveUserId(u) === String(user_id));
    if (userExists) {
      return res.status(409).json({ success: false, error: `User ${user_id} already exists` });
    }

    const maxUid = usersArray.reduce((max, u) => Math.max(max, parseInt(u.uid) || 0), 0);
    const newUid = maxUid + 1;

    await zkInstance.setUser(
      newUid,
      String(user_id),
      name,
      password ?? "",
      role === 1 ? 1 : 0,
      cardno ?? 0,
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { uid: newUid, user_id: String(user_id), name, role: role ?? 0 },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { user_id, name, password, role, cardno } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Current User ID is required" });
    }

    await ensureConnection();
    const usersArray = await fetchUsersArray();
    const existingUser = usersArray.find((u) => resolveUserId(u) === String(userId));

    if (!existingUser) {
      return res.status(404).json({ success: false, error: `User ${userId} not found` });
    }

    const userUid = existingUser.uid ?? existingUser.userId;
    const newUserId = user_id || String(userId);

    await zkInstance.deleteUser(userUid);
    await zkInstance.setUser(
      userUid,
      newUserId,
      name ?? existingUser.name,
      password !== undefined ? password : (existingUser.password ?? ""),
      role !== undefined ? (role === 1 ? 1 : 0) : (existingUser.role ?? 0),
      cardno !== undefined ? cardno : (existingUser.cardno ?? 0),
    );

    console.log(`✅ User updated: Old ID=${userId} → New ID=${newUserId}`);

    return res.status(200).json({
      success: true,
      message: `User updated successfully`,
      data: { uid: userUid, old_user_id: String(userId), new_user_id: newUserId },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    await ensureConnection();
    const usersArray = await fetchUsersArray();
    const userToDelete = usersArray.find((u) => resolveUserId(u) === String(userId));

    if (!userToDelete) {
      return res.status(404).json({ success: false, error: `User ${userId} not found` });
    }

    const userUid = userToDelete.uid ?? userToDelete.userId;
    await zkInstance.deleteUser(userUid);

    return res.status(200).json({ success: true, message: `User ${userId} deleted successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.checkPunchExists = async (req, res) => {
  let connection;
  try {
    const { employee_id, punch_date, punch_time } = req.query;

    if (!employee_id || !punch_date) {
      return res.json({ exists: false });
    }

    connection = await pool.getConnection();

    const [rows] = await connection.query(
      `SELECT id FROM Employee_Attendance 
       WHERE employee_id = ? AND attendance_date = ?
       AND (TIME(check_in_time) = ? OR TIME(check_out_time) = ?)`,
      [employee_id, punch_date, punch_time, punch_time],
    );

    return res.json({ exists: rows.length > 0 });
  } catch (error) {
    console.error("Error checking punch:", error);
    return res.json({ exists: false });
  } finally {
    if (connection) connection.release();
  }
};

// ============ SYNC FUNCTIONS ================ //

// ✅ CACHED DEVICE LOGS
async function getDeviceLogsCached() {
  try {
    const now = Date.now();

    if (cachedDeviceLogs && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
      console.log(`📦 Using cached device logs (${cachedDeviceLogs.length} records, ${Math.round((now - cacheTimestamp) / 1000)}s old)`);
      return cachedDeviceLogs;
    }

    console.log(`📡 Fetching fresh device logs...`);
    await ensureConnection();
    const rawLogs = await zkInstance.getAttendances();
    const allLogs = extractLogsArray(rawLogs);

    cachedDeviceLogs = allLogs;
    cacheTimestamp = now;

    console.log(`✅ Cached ${allLogs.length} device logs`);
    return allLogs;

  } catch (error) {
    console.error(`❌ Error fetching device logs:`, error.message);
    if (cachedDeviceLogs) {
      console.log(`⚠️ Returning stale cached logs (${cachedDeviceLogs.length} records)`);
      return cachedDeviceLogs;
    }
    return [];
  }
}

// ============================================================
// INTERNAL FUNCTION - Get attendance by user ID using CACHE
// ============================================================
async function getAttendanceByUserIdInternal(userId, from = null, to = null) {
  try {
    if (!userId) {
      console.warn("⚠️ User ID is required for internal function");
      return [];
    }

    console.log(`📡 [INTERNAL] Fetching attendance for userId: ${userId}`);

    const allLogs = await getDeviceLogsCached();

    if (!allLogs.length) {
      console.log(`ℹ️ [INTERNAL] No logs on device`);
      return [];
    }

    const searchId = String(userId);

    let userLogs = allLogs.filter((log) => {
      const resolved = resolveLog(log);
      return resolved?.raw_user_id === searchId;
    });

    console.log(`🔍 [INTERNAL] Found ${userLogs.length} logs for user ${userId}`);

    if (from || to) {
      userLogs = userLogs.filter((log) => {
        const resolved = resolveLog(log);
        if (!resolved?.raw_time) return false;

        const logDate = toPakistanTime(resolved.raw_time)?.pkDate;
        if (!logDate) return false;

        if (from && to) return logDate >= from && logDate <= to;
        if (from) return logDate >= from;
        if (to) return logDate <= to;
        return true;
      });
    }

    const formattedLogs = userLogs.map(formatLog).filter(Boolean);
    console.log(`✅ [INTERNAL] Returning ${formattedLogs.length} formatted logs`);

    return formattedLogs;

  } catch (error) {
    console.error(`❌ Error fetching attendance for user ${userId}:`, error.message);
    return [];
  }
}

async function updateJobStatus(jobId, status, message) {
  try {
    await pool.query(
      `UPDATE attendance_sync_jobs 
       SET status = ?, 
           error_message = ?,
           end_time = NOW()
       WHERE job_id = ?`,
      [status, message, jobId]
    );
    console.log(`📝 Job ${jobId} status updated to: ${status}`);
  } catch (err) {
    console.error('❌ Update job status error:', err);
  }
}

async function sendSyncNotification(jobId, synced, failed) {
  try {
    console.log(`📧 ========================================`);
    console.log(`📧 SYNC COMPLETED - Job: ${jobId}`);
    console.log(`📧 ========================================`);
    console.log(`📧 ✅ Records Synced: ${synced}`);
    console.log(`📧 ❌ Records Failed: ${failed}`);
    console.log(`📧 ========================================`);
    return true;
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    return false;
  }
}

// Sync all employees attendance from device
exports.syncAllEmployeesAttendance = async (req, res) => {
  try {
    const { date_from, date_to, initiated_by } = req.body;
    const normalizedRange = normalizeSyncDateRange(date_from, date_to);
    const effectiveFrom = normalizedRange.from;
    const effectiveTo = normalizedRange.to;

    const hrUserId = initiated_by;

    if (!hrUserId) {
      console.error("❌ No user ID sent from frontend");
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    console.log(`✅ HR User ID from frontend: ${hrUserId}`);
    console.log(`📅 Sync window: ${effectiveFrom} → ${effectiveTo}`);

    const jobId = `SYNC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const [jobResult] = await pool.query(
      `INSERT INTO attendance_sync_jobs 
       (job_id, initiated_by, status, total_employees, processed_employees, 
        total_records, synced_records, failed_records, start_time, date_from, date_to)
       VALUES (?, ?, 'pending', 0, 0, 0, 0, 0, NOW(), ?, ?)`,
      [jobId, hrUserId, effectiveFrom, effectiveTo]
    );

    console.log(`📝 Sync job created: ${jobId}`);

    setImmediate(() => {
      processSyncJob(jobId, effectiveFrom, effectiveTo);
    });

    return res.status(202).json({
      success: true,
      message: "Sync job initiated successfully",
      job_id: jobId,
      status_url: `/api/v1/zkTime/sync-status/${jobId}`
    });

  } catch (error) {
    console.error("❌ Sync initiation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate sync",
      error: error.message
    });
  }
};

// Get sync job status
exports.getSyncStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const [jobs] = await pool.query(
      `SELECT * FROM attendance_sync_jobs WHERE job_id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const job = jobs[0];

    const [logs] = await pool.query(
      `SELECT * FROM attendance_sync_logs 
       WHERE job_id = ? 
       ORDER BY processed_at DESC 
       LIMIT 50`,
      [jobId]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...job,
        logs: logs,
        progress_percentage: job.total_employees > 0
          ? Math.round((job.processed_employees / job.total_employees) * 100)
          : 0
      }
    });

  } catch (error) {
    console.error("❌ Get status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get sync status"
    });
  }
};

// Get sync logs
exports.getSyncLogs = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const [logs] = await pool.query(
      `SELECT * FROM attendance_sync_logs 
       WHERE job_id = ? 
       ORDER BY processed_at DESC 
       LIMIT ? OFFSET ?`,
      [jobId, parseInt(limit), parseInt(offset)]
    );

    const [count] = await pool.query(
      `SELECT COUNT(*) as total FROM attendance_sync_logs WHERE job_id = ?`,
      [jobId]
    );

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total: count[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error("❌ Get logs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get sync logs"
    });
  }
};

// Get all sync jobs (history)
exports.getSyncJobs = async (req, res) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;

    let query = `SELECT * FROM attendance_sync_jobs`;
    let countQuery = `SELECT COUNT(*) as total FROM attendance_sync_jobs`;
    const params = [];
    const countParams = [];

    if (status && status !== 'all') {
      query += ` WHERE status = ?`;
      countQuery += ` WHERE status = ?`;
      params.push(status);
      countParams.push(status);
    }

    query += ` ORDER BY start_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [jobs] = await pool.query(query, params);

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    for (const job of jobs) {
      const [summary] = await pool.query(
        `SELECT 
           COUNT(*) as total_logs,
           SUM(CASE WHEN status IN ('inserted', 'updated', 'processed') THEN 1 ELSE 0 END) as success_count,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
         FROM attendance_sync_logs 
         WHERE job_id = ?`,
        [job.job_id]
      );

      job.log_summary = summary[0] || { total_logs: 0, success_count: 0, failed_count: 0 };
    }

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error("❌ Get sync jobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get sync jobs",
      error: error.message
    });
  }
};

// ============================================================
// BACKGROUND PROCESSING FUNCTION
// ============================================================
async function processSyncJob(jobId, dateFrom, dateTo) {
  let connection;

  try {
    const defaultMonth = getCurrentMonthDateRange();
    const normalizedRange = normalizeSyncDateRange(dateFrom, dateTo);
    const effectiveFrom = normalizedRange.from || defaultMonth.from;
    const effectiveTo = normalizedRange.to || defaultMonth.to;

    console.log(`🚀 Starting sync job: ${jobId} for ${effectiveFrom} → ${effectiveTo}`);

    console.log(`📡 Pre-fetching device logs...`);
    const allDeviceLogs = await getDeviceLogsCached();
    console.log(`📊 Total device logs available: ${allDeviceLogs.length}`);

    connection = await pool.getConnection();

    const [employees] = await connection.query(
      `SELECT 
         id, 
         employee_id, 
         name, 
         email, 
         device_user_id
       FROM employee_onboarding 
       WHERE status = 'Active' 
       AND device_user_id IS NOT NULL 
       AND device_user_id != ''`
    );

    console.log(`📊 Found ${employees.length} active employees with device IDs`);

    if (employees.length === 0) {
      await updateJobStatus(jobId, 'completed', 'No active employees with device IDs found');
      return;
    }

    await connection.query(
      `UPDATE attendance_sync_jobs 
       SET total_employees = ?, status = 'processing' 
       WHERE job_id = ?`,
      [employees.length, jobId]
    );

    let totalSynced = 0;
    let totalFailed = 0;
    let processedCount = 0;
    const BATCH_SIZE = 20;

    for (let i = 0; i < employees.length; i += BATCH_SIZE) {
      const batch = employees.slice(i, i + BATCH_SIZE);

      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(employees.length / BATCH_SIZE)}`);

      const promises = batch.map(async (employee) => {
        try {
          await processEmployeeAttendance(connection, jobId, employee, dateFrom, dateTo);
          return { success: true, employee: employee.employee_id };
        } catch (error) {
          console.error(`❌ Failed for employee ${employee.employee_id}:`, error.message);
          return { success: false, employee: employee.employee_id, error: error.message };
        }
      });

      const results = await Promise.all(promises);

      const successes = results.filter(r => r.success).length;
      const failures = results.filter(r => !r.success).length;
      totalSynced += successes;
      totalFailed += failures;
      processedCount += batch.length;

      await connection.query(
        `UPDATE attendance_sync_jobs 
         SET processed_employees = ?, 
             synced_records = ?, 
             failed_records = ?,
             updated_at = NOW()
         WHERE job_id = ?`,
        [processedCount, totalSynced, totalFailed, jobId]
      );

      if (i + BATCH_SIZE < employees.length) {
        await sleep(1000);
      }
    }

    await connection.query(
      `UPDATE attendance_sync_jobs 
       SET status = 'completed', 
           end_time = NOW(),
           updated_at = NOW()
       WHERE job_id = ?`,
      [jobId]
    );

    console.log(`✅ Sync job ${jobId} completed! Synced: ${totalSynced}, Failed: ${totalFailed}`);
    await sendSyncNotification(jobId, totalSynced, totalFailed);

  } catch (error) {
    console.error(`❌ Sync job ${jobId} failed:`, error);
    if (connection) {
      await connection.query(
        `UPDATE attendance_sync_jobs 
         SET status = 'failed', 
             error_message = ?,
             end_time = NOW()
         WHERE job_id = ?`,
        [error.message, jobId]
      );
    }
  } finally {
    if (connection) connection.release();
  }
}

// ============================================================
// PROCESS INDIVIDUAL EMPLOYEE
// ============================================================
async function processEmployeeAttendance(connection, jobId, employee, dateFrom, dateTo) {
  try {
    const deviceUserId = employee.device_user_id;

    console.log(`🔍 [DEBUG] Processing employee:`, {
      id: employee.id,
      employee_id: employee.employee_id,
      name: employee.name,
      device_user_id: deviceUserId
    });

    if (!deviceUserId || deviceUserId === '') {
      console.log(`⚠️ [DEBUG] No device_user_id for employee ${employee.employee_id}`);
      await connection.query(
        `INSERT INTO attendance_sync_logs 
         (job_id, employee_id, employee_code, status, message)
         VALUES (?, ?, ?, 'skipped', 'No device_user_id found')`,
        [jobId, employee.id, employee.employee_id]
      );
      return;
    }

    const numericDeviceId = Number(deviceUserId);
    if (isNaN(numericDeviceId)) {
      console.log(`⚠️ [DEBUG] device_user_id is not numeric: ${deviceUserId}`);
      await connection.query(
        `INSERT INTO attendance_sync_logs 
         (job_id, employee_id, employee_code, status, message)
         VALUES (?, ?, ?, 'skipped', 'device_user_id is not numeric: ${deviceUserId}')`,
        [jobId, employee.id, employee.employee_id]
      );
      return;
    }

    console.log(`📡 [DEBUG] Fetching device attendance for device_user_id: ${numericDeviceId}`);

    const deviceLogs = await fetchDeviceAttendanceFromCache(numericDeviceId, dateFrom, dateTo);

    console.log(`📊 [DEBUG] Device logs found: ${deviceLogs?.length || 0}`);

    if (!deviceLogs || deviceLogs.length === 0) {
      console.log(`ℹ️ [DEBUG] No records found for device_user_id: ${numericDeviceId}`);
      await connection.query(
        `INSERT INTO attendance_sync_logs 
         (job_id, employee_id, employee_code, status, message)
         VALUES (?, ?, ?, 'skipped', 'No device records found for device_user_id: ${numericDeviceId}')`,
        [jobId, employee.id, employee.employee_id]
      );
      return;
    }

    const seenKeys = new Set();
    const uniqueDeviceLogs = deviceLogs.filter((log) => {
      const dateValue = log.punch_date_date || (log.attendance_time ? String(log.attendance_time).split(' ')[0] : '');
      const timeValue = log.punch_time || (log.attendance_time && String(log.attendance_time).includes(' ') ? String(log.attendance_time).split(' ')[1] : '');
      const key = `${employee.id}|${dateValue}|${timeValue}|${log.punch_label || 'unknown'}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    // Save punches in work-date order, with IN before OUT for each shift.
    // This prevents an OUT received before its IN from being discarded.
    const orderedDeviceLogs = uniqueDeviceLogs.sort((firstLog, secondLog) => {
      const firstWorkDate = getAttendanceWorkDate(firstLog.punch_date_date, firstLog.punch_time);
      const secondWorkDate = getAttendanceWorkDate(secondLog.punch_date_date, secondLog.punch_time);
      if (firstWorkDate !== secondWorkDate) {
        return firstWorkDate.localeCompare(secondWorkDate);
      }

      const firstIsCheckout = firstLog.punch_label === 'check-out';
      const secondIsCheckout = secondLog.punch_label === 'check-out';
      if (firstIsCheckout !== secondIsCheckout) {
        return firstIsCheckout ? 1 : -1;
      }

      return String(firstLog.punch_time).localeCompare(String(secondLog.punch_time));
    });

    console.log(`📊 Found ${orderedDeviceLogs.length} unique device records for employee ${employee.employee_id}`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const log of orderedDeviceLogs) {
      try {
        const saved = await saveAttendanceRecord(connection, employee, log, jobId);
        if (saved) {
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
        console.error(`❌ Failed to save record for ${employee.employee_id}:`, err.message);
      }
    }

    console.log(`📊 [DEBUG] Final stats for ${employee.employee_id}: Synced: ${syncedCount}, Failed: ${failedCount}`);

    await connection.query(
      `INSERT INTO attendance_sync_logs 
       (job_id, employee_id, employee_code, status, synced_count, failed_count, message)
       VALUES (?, ?, ?, 'processed', ?, ?, ?)`,
      [jobId, employee.id, employee.employee_id, syncedCount, failedCount,
        `Synced ${syncedCount} records, Failed ${failedCount} (Device ID: ${numericDeviceId})`]
    );

    return { syncedCount, failedCount };

  } catch (error) {
    console.error(`❌ [DEBUG] Error in processEmployeeAttendance for ${employee.employee_id}:`, error);
    await connection.query(
      `INSERT INTO attendance_sync_logs 
       (job_id, employee_id, employee_code, status, error_message)
       VALUES (?, ?, ?, 'failed', ?)`,
      [jobId, employee.id, employee.employee_id, error.message]
    );
    throw error;
  }
}

// ============================================================
// FETCH DEVICE ATTENDANCE FROM CACHE
// ============================================================
async function fetchDeviceAttendanceFromCache(deviceUserId, dateFrom, dateTo) {
  try {
    if (!deviceUserId) {
      console.warn(`⚠️ No device_user_id provided`);
      return [];
    }

    const numericUserId = Number(deviceUserId);
    if (isNaN(numericUserId)) {
      console.error(`❌ Invalid device_user_id: ${deviceUserId} (must be numeric)`);
      return [];
    }

    console.log(`📡 [CACHE] Fetching from cache for numeric device_user_id: ${numericUserId}`);

    const formattedLogs = await getAttendanceByUserIdInternal(numericUserId, dateFrom, dateTo);

    if (!formattedLogs || formattedLogs.length === 0) {
      console.log(`ℹ️ [CACHE] No records found for device_user_id: ${numericUserId}`);
      return [];
    }

    console.log(`✅ [CACHE] Found ${formattedLogs.length} records for device_user_id: ${numericUserId}`);

    const deviceLogs = formattedLogs.map(log => {
      const attendanceTime = log.attendance_time || `${log.punch_date_date || ''} ${log.punch_time || ''}`.trim();
      const punchDate = log.punch_date_date || (attendanceTime ? attendanceTime.split(" ")[0] : null);
      const punchTime = log.punch_time || (attendanceTime && attendanceTime.includes(" ") ? attendanceTime.split(" ")[1] : null);

      return {
        attendance_time: attendanceTime,
        punch_date_date: punchDate,
        punch_time: punchTime,
        punch_label: log.punch_label,
        pakistan_hour: log.pakistan_hour,
      };
    }).filter(log => log.punch_time && log.punch_date_date);

    return deviceLogs;

  } catch (error) {
    console.error(`❌ [CACHE] Fetch device attendance error:`, error.message);
    return [];
  }
}

// ============================================================
// SAVE ATTENDANCE RECORD
// ============================================================
async function saveAttendanceRecord(connection, employee, log, jobId) {
  try {
    const fullDateTime = log.attendance_time;
    let deviceDate = log.punch_date_date;
    let punchTime = log.punch_time;

    if (!fullDateTime && !punchTime) return false;

    // Extract date and time
    let attendanceDate = deviceDate;
    if (!attendanceDate && fullDateTime) {
      attendanceDate = fullDateTime.split(' ')[0];
    }
    if (!punchTime && fullDateTime) {
      punchTime = fullDateTime.split(' ')[1];
    }

    if (!punchTime || !attendanceDate) return false;

    const hour = parseInt(punchTime.split(':')[0]);

    // Use the device-provided punch direction. This device maps 0 to IN and 1 to OUT.
    let punchType = null;
    let finalDate = attendanceDate;

    if (log.punch_label === 'check-in') {
      punchType = 'IN';
    } else if (log.punch_label === 'check-out') {
      punchType = 'OUT';
    }

    if (!punchType) return false;

    // Keep all early-morning punches with the previous night's shift.
    if (hour <= 8) finalDate = getAttendanceWorkDate(attendanceDate, punchTime);

    console.log(`📌 [DEBUG] Employee: ${employee.employee_id}, Hour: ${hour}, Type: ${punchType}, Date: ${finalDate} (original: ${attendanceDate})`);

    // ============================================================
    // CHECK EXISTING RECORD
    // ============================================================
    const [existing] = await connection.query(
      `SELECT id, check_in_time, check_out_time FROM Employee_Attendance 
       WHERE employee_id = ? AND attendance_date = ?`,
      [employee.id, finalDate]
    );

    if (existing.length > 0) {
      const record = existing[0];

      // Skip exact duplicate times
      if (punchType === 'IN' && record.check_in_time === punchTime) {
        console.log(`⏭️ Duplicate IN for ${employee.employee_id} on ${finalDate} at ${punchTime}`);
        return false;
      }
      if (punchType === 'OUT' && record.check_out_time === punchTime) {
        console.log(`⏭️ Duplicate OUT for ${employee.employee_id} on ${finalDate} at ${punchTime}`);
        return false;
      }

      // Update missing field
      if (punchType === 'IN' && !record.check_in_time) {
        console.log(`🔄 Updating IN for ${employee.employee_id} on ${finalDate} at ${punchTime}`);
        await connection.query(
          `UPDATE Employee_Attendance 
           SET check_in_time = ?, 
               device_info = 'ZKTeco Device',
               is_device_sync = 1
           WHERE employee_id = ? AND attendance_date = ?`,
          [punchTime, employee.id, finalDate]
        );
        await updateAttendanceStatus(connection, employee.id, finalDate);
        await logSync(jobId, employee, finalDate, punchType, 'updated');
        return true;
      }

      if (punchType === 'OUT' && !record.check_out_time) {
        console.log(`🔄 Updating OUT for ${employee.employee_id} on ${finalDate} at ${punchTime}`);
        await connection.query(
          `UPDATE Employee_Attendance 
           SET check_out_time = ?, 
               device_info = 'ZKTeco Device',
               is_device_sync = 1
           WHERE employee_id = ? AND attendance_date = ?`,
          [punchTime, employee.id, finalDate]
        );
        await recalculateWorkingHours(connection, employee.id, finalDate);
        await updateAttendanceStatus(connection, employee.id, finalDate);
        await logSync(jobId, employee, finalDate, punchType, 'updated');
        return true;
      }

      console.log(`⏭️ Record already complete for ${employee.employee_id} on ${finalDate}`);
      return false;
    }

    // ============================================================
    // INSERT NEW RECORD
    // ============================================================
    console.log(`🆕 Inserting ${punchType} for ${employee.employee_id} on ${finalDate} at ${punchTime}`);

    await connection.query(
      `INSERT INTO Employee_Attendance 
       (employee_id, email, name, attendance_date, 
        check_in_time, check_out_time, 
        device_info, is_device_sync)
       VALUES (?, ?, ?, ?, 
               ?, ?,
               'ZKTeco Device', 1)`,
      [
        employee.id,
        employee.email || null,
        employee.name || null,
        finalDate,
        punchType === 'IN' ? punchTime : null,
        punchType === 'OUT' ? punchTime : null
      ]
    );

    // Update status and working hours
    await updateAttendanceStatus(connection, employee.id, finalDate);
    if (punchType === 'OUT') {
      await recalculateWorkingHours(connection, employee.id, finalDate);
    }

    await logSync(jobId, employee, finalDate, punchType, 'inserted');
    return true;

  } catch (error) {
    console.error('❌ Save attendance error:', error.message);
    return false;
  }
}

// ============================================================
// RECALCULATE WORKING HOURS
// ============================================================
async function recalculateWorkingHours(connection, employeeId, attendanceDate) {
  try {
    const [record] = await connection.query(
      `SELECT check_in_time, check_out_time, total_break_duration_minutes 
       FROM Employee_Attendance 
       WHERE employee_id = ? AND attendance_date = ?`,
      [employeeId, attendanceDate]
    );

    if (record.length === 0) return;

    const { check_in_time, check_out_time, total_break_duration_minutes } = record[0];
    if (!check_in_time || !check_out_time) return;

    const workingHours = calculateWorkingHours(
      check_in_time,
      check_out_time,
      total_break_duration_minutes || 0
    );

    await connection.query(
      `UPDATE Employee_Attendance 
       SET gross_working_time_minutes = ?,
           net_working_time_minutes = ?,
           overtime_minutes = ?,
           overtime_hours = ?
       WHERE employee_id = ? AND attendance_date = ?`,
      [
        workingHours.gross,
        workingHours.net,
        workingHours.overtime,
        workingHours.overtimeHours,
        employeeId,
        attendanceDate
      ]
    );

  } catch (error) {
    console.error('Error recalculating working hours:', error);
  }
}

// ============================================================
// CALCULATE WORKING HOURS
// ============================================================
function calculateWorkingHours(checkIn, checkOut, breakMinutes) {
  try {
    const toMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    const checkInMinutes = toMinutes(checkIn);
    const checkOutMinutes = toMinutes(checkOut);

    let totalMinutes = checkOutMinutes - checkInMinutes;
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    const gross = totalMinutes;
    const net = Math.max(0, totalMinutes - (breakMinutes || 0));
    const overtime = Math.max(0, net - 480);

    return {
      gross: gross,
      net: net,
      overtime: overtime,
      overtimeHours: (overtime / 60).toFixed(2)
    };
  } catch (error) {
    console.error('Error calculating working hours:', error);
    return {
      gross: 0,
      net: 0,
      overtime: 0,
      overtimeHours: "0.00"
    };
  }
}

// ============================================================
// UPDATE ATTENDANCE STATUS - WITH HALF DAY
// ============================================================
async function updateAttendanceStatus(connection, employeeId, attendanceDate) {
  try {
    const [record] = await connection.query(
      `SELECT check_in_time FROM Employee_Attendance 
       WHERE employee_id = ? AND attendance_date = ?`,
      [employeeId, attendanceDate]
    );

    if (record.length === 0) return;

    const checkInTime = record[0].check_in_time;
    if (!checkInTime) return;

    const [hour, minute] = checkInTime.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;

    // ⭐ SHIFT CONSTANTS
    const shiftStart = 21 * 60;        // 9:00 PM
    const lateAfterTime = 21 * 60 + 15; // 9:15 PM grace period ends
    const sixAM = 6 * 60;              // 6:00 AM
    const nineAM = 9 * 60;             // 9:00 AM
    const midnight = 0;                // 12:00 AM
    const halfDayCutoff = 6 * 60;      // 00:00 AM  to 6:00 AM (360 minutes)

    let status = "Present";
    let onTime = 1;
    let lateByMinutes = 0;

    // ============================================================
    // ⭐ 00:00 - 00:20 → Half Day
    // ============================================================
    if (totalMinutes >= midnight && totalMinutes <= halfDayCutoff) {
      status = "Half Day";
      onTime = 0;
      lateByMinutes = totalMinutes;
      console.log(`🌙 [Half Day] Early morning check-in at ${checkInTime} on ${attendanceDate}`);
    }
    // ============================================================
    // ⭐ 09:00 - 20:59 → Present (Day shift on time)
    // ============================================================
    else if (totalMinutes >= nineAM && totalMinutes < shiftStart) {
      status = "Present";
      onTime = 1;
      lateByMinutes = 0;
      console.log(`✅ [Present] Day shift on time at ${checkInTime}`);
    }
    // ============================================================
    // ⭐ 21:00 - 21:15 → Present (On time night shift)
    // ============================================================
    else if (totalMinutes >= shiftStart && totalMinutes <= lateAfterTime) {
      status = "Present";
      onTime = 1;
      lateByMinutes = 0;
      console.log(`✅ [Present] Night shift on time at ${checkInTime}`);
    }
    // ============================================================
    // ⭐ 21:16 - 23:59 → Late
    // ============================================================
    else if (totalMinutes > lateAfterTime && totalMinutes <= 23 * 60 + 59) {
      status = "Late";
      onTime = 0;
      lateByMinutes = totalMinutes - lateAfterTime;
      console.log(`⏱️ [Late] Late at ${checkInTime} (${lateByMinutes}m)`);
    }
    // ============================================================
    // ⭐ 06:00 - 09:00 → Late (Morning late check-in)
    // ============================================================
    else if (totalMinutes > sixAM && totalMinutes < nineAM) {
      status = "Late";
      onTime = 0;
      // Calculate morning lateness from the 9:15 PM grace cutoff.
      const previousDayLateAfter = lateAfterTime;
      lateByMinutes = (24 * 60 - previousDayLateAfter) + totalMinutes;
      console.log(`⏱️ [Late] Morning late at ${checkInTime} (${lateByMinutes}m)`);
    }

    await connection.query(
      `UPDATE Employee_Attendance 
       SET status = ?, on_time = ?, late_by_minutes = ?
       WHERE employee_id = ? AND attendance_date = ?`,
      [status, onTime, lateByMinutes, employeeId, attendanceDate]
    );

    console.log(`📊 [Status] Employee ${employeeId} on ${attendanceDate}: ${status} (Late: ${lateByMinutes}m)`);

  } catch (error) {
    console.error('❌ Error updating status:', error);
  }
}