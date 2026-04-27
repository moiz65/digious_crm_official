// routes/zkTimeRoutes.js

const express = require("express");
const router = express.Router();
const zkTimeController = require("./controllers/zkTimeController");

// Device management
router.get("/connect", zkTimeController.connectDevice);
router.get("/device-info", zkTimeController.getDeviceInfo);
router.get("/device-time", zkTimeController.getDeviceTime);
router.get("/disconnect", zkTimeController.disconnectDevice);

// Attendance
router.get("/attendance-logs", zkTimeController.getAllAttendanceLogs);
router.get("/attendance/user/:userId", zkTimeController.getAttendanceByUserId);
router.get("/attendance/today", zkTimeController.getTodayAttendance);

// Users
router.get("/users", zkTimeController.getAllUsers);
router.get("/users/:userId", zkTimeController.getUserById);

module.exports = router;