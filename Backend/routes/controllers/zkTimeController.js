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
      if (typeof zkInstance.getDeviceTime === 'function') {
        time = await zkInstance.getDeviceTime();
      } else if (typeof zkInstance.getDateTime === 'function') {
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
      if (userResponse && userResponse.data && Array.isArray(userResponse.data)) {
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
        log.deviceUserId || log.userId || log.user_id || log.uid || log.userSn
      );
      return logUserId === searchUserId;
    });

    // Filter by date range
    let filteredLogs = userLogs;
    if (from || to) {
      filteredLogs = userLogs.filter((log) => {
        const logDate = new Date(
          log.recordTime || log.timestamp || log.date || log.datetime || log.time
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

// ✅ TODAY'S ATTENDANCE - Main function
exports.getTodayAttendance = async (req, res) => {
  try {
    const { userId } = req.query;

    // Get today's date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    console.log(`📅 Fetching attendance for: ${todayStr}`);

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
        date: todayStr,
        user_id: userId || "all",
        count: 0,
        data: [],
      });
    }

    // Filter by today's date
    let logs = allLogs.filter((log) => {
      const logDate = new Date(
        log.recordTime || log.timestamp || log.date || log.datetime || log.time
      );
      const logDateStr = logDate.toISOString().split("T")[0];
      return logDateStr === todayStr;
    });

    // Filter by user ID if provided
    if (userId) {
      const searchUserId = String(userId);
      logs = logs.filter((log) => {
        const logUserId = String(
          log.deviceUserId || log.userId || log.user_id || log.uid || log.userSn
        );
        return logUserId === searchUserId;
      });
    }

    // Format response
    const formattedLogs = logs.map((log) => ({
      user_id: log.deviceUserId || log.userId || log.user_id,
      record_time: log.recordTime || log.timestamp || log.date,
      ip: log.ip || "",
      user_sn: log.userSn || log.uid,
    }));

    res.status(200).json({
      success: true,
      date: todayStr,
      user_id: userId || "all",
      count: formattedLogs.length,
      data: formattedLogs,
    });
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({
      success: false,
      error: error.message,
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