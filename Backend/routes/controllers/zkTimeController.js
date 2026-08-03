// controllers/zkTimeController.js - OPTIMIZED & FIXED

const Zkteco = require("zkteco-js");

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
let connectionLock = false; // prevent race conditions

// ============ HELPER FUNCTIONS ============

/**
 * Universal field extractor - handles all possible ZKTeco field name variants
 * Ek jagah se saare fields resolve honge - no more inconsistency
 */
function resolveLog(log) {
  if (!log) return null;

  const userId = String(
    log.user_id ?? // ✅ actual device field name (confirmed from raw data)
      log.deviceUserId ??
      log.userId ??
      log.uid ??
      log.userSn ??
      "",
  );

  const recordTime =
    log.record_time ?? // ✅ actual device field name
    log.recordTime ??
    log.timestamp ??
    log.datetime ??
    log.date ??
    log.time ??
    null;

  const userSn = log.userSn ?? log.uid ?? log.sn ?? "";
  const deviceType = log.type ?? null; // ZKTeco type: 0=in, 1=out, 2=break-out, etc.

  return {
    raw_user_id: userId,
    raw_time: recordTime,
    raw_user_sn: String(userSn),
    raw_type: deviceType,
    ip: log.ip ?? "",
  };
}

/**
 * Parse device time - device already sends Pakistan time (GMT+0500)
 * DO NOT add +5 again — that was the double-add bug causing wrong times
 */
function toPakistanTime(recordTimeStr) {
  if (!recordTimeStr) return null;
  try {
    const date = new Date(recordTimeStr);
    if (isNaN(date.getTime())) return null;

    const pad = (n) => String(n).padStart(2, "0");
    // Device string already has timezone info (GMT+0500), so JS parses correctly
    const pkDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const pkTime = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

    return {
      pkDatetime: `${pkDate} ${pkTime}`,
      pkDate,
      pkHour: date.getHours(),
    };
  } catch {
    return null;
  }
}

/**
 * Get today's date - server runs in PKT so new Date() is already correct
 */
function getTodayPakistan() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Punch type from device's own 'type' field
 * ZKTeco type values: 0=Check-in, 1=Check-out, 2=Break-out, 3=Break-in, 4=OT-in, 5=OT-out
 * Use device value directly instead of guessing from hour
 */
function getPunchType(deviceType) {
  const types = {
    0: "check-out",
    1: "check-in",
    2: "break-out",
    3: "break-in",
    4: "overtime-in",
    5: "overtime-out",
  };
  return types[deviceType] ?? "unknown";
}

/**
 * Format a resolved log into a clean response object
 */
function formatLog(log) {
  const resolved = resolveLog(log);
  if (!resolved) return null;

  const pk = toPakistanTime(resolved.raw_time);

  return {
    user_id: resolved.raw_user_id,
    user_sn: resolved.raw_user_sn,
    record_time: resolved.raw_time, // original device time string
    attendance_time: pk?.pkDatetime ?? null,
    punch_date_date: pk?.pkDate ?? null,
    pakistan_hour: pk?.pkHour ?? null,
    punch_code: resolved.raw_type, // raw device type number (0,1,2,3,4,5)
    punch_label: getPunchType(resolved.raw_type), // human-readable label
    ip: resolved.ip,
  };
}

/**
 * Safely extract logs array from any ZKTeco response shape
 */
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
  // Prevent concurrent connection attempts
  if (connectionLock) {
    await sleep(500);
    if (isConnected && zkInstance) return { success: true };
  }

  connectionLock = true;
  let lastError = null;

  try {
    for (let attempt = 1; attempt <= zkConfig.retryCount; attempt++) {
      try {
        console.log(`🔄 Connection attempt ${attempt}/${zkConfig.retryCount}`);

        if (zkInstance) {
          try {
            await zkInstance.disconnect();
          } catch {}
          zkInstance = null;
          isConnected = false;
        }

        zkInstance = new Zkteco(
          zkConfig.ip,
          zkConfig.port,
          zkConfig.inport,
          zkConfig.timeout,
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
    return res
      .status(200)
      .json({ success: true, message: "Connected", data: result.info });
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
    return res.status(200).json({ success: true, message: "Disconnected" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============ ATTENDANCE CONTROLLERS ============

/**
 * DEBUG: Check raw data structure from device
 */
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

/**
 * GET ALL ATTENDANCE LOGS
 */
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

/**
 * GET ATTENDANCE BY USER ID - FIXED
 * Previously: null values in user_id, record_time, user_sn
 * Now: resolveLog() handles all field name variants consistently
 */
exports.getAttendanceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    await ensureConnection();
    const rawLogs = await zkInstance.getAttendances();
    const allLogs = extractLogsArray(rawLogs);

    if (!allLogs.length) {
      return res
        .status(200)
        .json({ success: true, user_id: userId, count: 0, data: [] });
    }

    const searchId = String(userId);

    // Filter by userId using resolveLog for consistent field resolution
    let userLogs = allLogs.filter((log) => {
      const resolved = resolveLog(log);
      return resolved?.raw_user_id === searchId;
    });

    // Filter by date range if provided
    if (from || to) {
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;

      userLogs = userLogs.filter((log) => {
        const resolved = resolveLog(log);
        if (!resolved?.raw_time) return false;

        const logDate = new Date(resolved.raw_time);
        if (isNaN(logDate.getTime())) return false;

        if (fromDate && toDate) return logDate >= fromDate && logDate <= toDate;
        if (fromDate) return logDate >= fromDate;
        if (toDate) return logDate <= toDate;
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
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET TODAY'S ATTENDANCE - FIXED & consistent with getAttendanceByUserId
 */
exports.getTodayAttendance = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    await ensureConnection();
    const rawLogs = await zkInstance.getAttendances();
    const allLogs = extractLogsArray(rawLogs);

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

/**
 * Shared helper - fetch and normalize users array
 */
async function fetchUsersArray() {
  const users = await zkInstance.getUsers();
  return Array.isArray(users) ? users : (users?.data ?? []);
}

/**
 * Resolve user ID field (uid/userId/user_id variants)
 */
function resolveUserId(user) {
  return String(user?.userId ?? user?.user_id ?? user?.uid ?? "");
}

exports.getAllUsers = async (req, res) => {
  try {
    await ensureConnection();
    const usersArray = await fetchUsersArray();
    return res
      .status(200)
      .json({ success: true, count: usersArray.length, data: usersArray });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    await ensureConnection();
    const usersArray = await fetchUsersArray();
    const user = usersArray.find((u) => resolveUserId(u) === String(userId));

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: `User ${userId} not found` });
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
      return res
        .status(400)
        .json({ success: false, error: "user_id and name are required" });
    }

    await ensureConnection();
    const usersArray = await fetchUsersArray();

    const userExists = usersArray.some(
      (u) => resolveUserId(u) === String(user_id),
    );
    if (userExists) {
      return res
        .status(409)
        .json({ success: false, error: `User ${user_id} already exists` });
    }

    // Auto-generate next UID
    const maxUid = usersArray.reduce(
      (max, u) => Math.max(max, parseInt(u.uid) || 0),
      0,
    );
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
    const { userId } = req.params; // Current device user ID (e.g., "44")
    const { user_id, name, password, role, cardno } = req.body; // ✅ Added user_id

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "Current User ID is required" });
    }

    await ensureConnection();
    const usersArray = await fetchUsersArray();
    const existingUser = usersArray.find(
      (u) => resolveUserId(u) === String(userId),
    );

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, error: `User ${userId} not found` });
    }

    const userUid = existingUser.uid ?? existingUser.userId;

    // New user ID to set (if provided, otherwise keep old)
    const newUserId = user_id || String(userId);

    // Delete then re-create (ZKTeco update pattern)
    await zkInstance.deleteUser(userUid);

    await zkInstance.setUser(
      userUid,
      newUserId, // ✅ Updated user ID
      name ?? existingUser.name,
      password !== undefined ? password : (existingUser.password ?? ""),
      role !== undefined ? (role === 1 ? 1 : 0) : (existingUser.role ?? 0),
      cardno !== undefined ? cardno : (existingUser.cardno ?? 0),
    );

    console.log(
      `✅ User updated: Old ID=${userId} → New ID=${newUserId}, Name=${name ?? existingUser.name}`,
    );

    return res.status(200).json({
      success: true,
      message: `User updated successfully from ${userId} to ${newUserId}`,
      data: {
        uid: userUid,
        old_user_id: String(userId),
        new_user_id: newUserId,
        name: name ?? existingUser.name,
        role: role !== undefined ? role : existingUser.role,
      },
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
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    await ensureConnection();
    const usersArray = await fetchUsersArray();
    const userToDelete = usersArray.find(
      (u) => resolveUserId(u) === String(userId),
    );

    if (!userToDelete) {
      return res
        .status(404)
        .json({ success: false, error: `User ${userId} not found` });
    }

    const userUid = userToDelete.uid ?? userToDelete.userId;
    await zkInstance.deleteUser(userUid);

    return res.status(200).json({
      success: true,
      message: `User ${userId} deleted successfully`,
    });
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
