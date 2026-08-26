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
router.get("/attendance/today/:userId", zkTimeController.getTodayAttendance);
// Sync today's attendance from device to database
router.get("/attendance/check-punch-exists", zkTimeController.checkPunchExists);

// Users
router.get("/users", zkTimeController.getAllUsers);
router.get("/users/:userId", zkTimeController.getUserById);
router.post("/users/create", zkTimeController.createUser);
router.put("/users/:userId", zkTimeController.updateUser);
router.delete("/users/:userId", zkTimeController.deleteUser);


router.post("/sync-all", zkTimeController.syncAllEmployeesAttendance);
// Get sync job status
router.get("/sync-status/:jobId", zkTimeController.getSyncStatus);
// Get sync job logs
router.get("/sync-logs/:jobId", zkTimeController.getSyncLogs);
// Get all sync jobs (history)
router.get("/sync-jobs", zkTimeController.getSyncJobs);

module.exports = router;