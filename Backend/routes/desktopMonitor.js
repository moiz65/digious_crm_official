const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const screenshotDirectory = path.join(__dirname, '../private_uploads/desktop-monitor');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'image/jpeg') {
      return callback(null, false);
    }
    callback(null, true);
  },
});

function parseScreenshot(req, res, next) {
  upload.single('screenshot')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({
        success: false,
        message: status === 413 ? 'Screenshot exceeds the 2 MB limit' : 'Invalid screenshot upload',
      });
    }
    console.error('Desktop monitoring screenshot upload parsing failed:', error);
    return res.status(500).json({ success: false, message: 'Could not process screenshot upload' });
  });
}

const getEmployeeId = (req) => req.user && req.user.employeeId;
const isPrivileged = (req) => ['admin', 'hr', 'super admin'].includes(
  String(req.user && req.user.role || '').toLowerCase(),
);

async function findOwnedSession(sessionId, employeeId) {
  const [rows] = await pool.query(
    `SELECT id FROM desktop_monitor_sessions
     WHERE id = ? AND employee_id = ? AND ended_at IS NULL LIMIT 1`,
    [sessionId, employeeId],
  );
  return rows[0] || null;
}

router.use(authMiddleware);

router.post('/sessions', async (req, res) => {
  const employeeId = getEmployeeId(req);
  const consentVersion = req.body && req.body.consentVersion;
  if (!employeeId) {
    return res.status(403).json({ success: false, message: 'Employee identity is required' });
  }
  if (consentVersion !== 'desktop-monitor-v1') {
    return res.status(400).json({ success: false, message: 'Explicit monitoring consent is required' });
  }

  const sessionId = randomUUID();
  try {
    await pool.query(
      `INSERT INTO desktop_monitor_sessions (id, employee_id, consent_version)
       VALUES (?, ?, ?)`,
      [sessionId, String(employeeId), consentVersion],
    );
    return res.status(201).json({ success: true, data: { sessionId } });
  } catch (error) {
    console.error('Desktop monitoring session start failed:', error);
    return res.status(500).json({ success: false, message: 'Could not start monitoring session' });
  }
});

router.post('/sessions/:sessionId/stop', async (req, res) => {
  const employeeId = getEmployeeId(req);
  if (!employeeId) {
    return res.status(403).json({ success: false, message: 'Employee identity is required' });
  }
  try {
    const [result] = await pool.query(
      `UPDATE desktop_monitor_sessions SET ended_at = CURRENT_TIMESTAMP
       WHERE id = ? AND employee_id = ? AND ended_at IS NULL`,
      [req.params.sessionId, String(employeeId)],
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Active monitoring session not found' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Desktop monitoring session stop failed:', error);
    return res.status(500).json({ success: false, message: 'Could not stop monitoring session' });
  }
});

router.post('/sessions/:sessionId/events', async (req, res) => {
  const employeeId = getEmployeeId(req);
  const { eventType, idleSeconds } = req.body || {};
  if (!employeeId) {
    return res.status(403).json({ success: false, message: 'Employee identity is required' });
  }
  if (!['idle_started', 'idle_ended'].includes(eventType)) {
    return res.status(400).json({ success: false, message: 'Invalid monitoring event type' });
  }
  if (idleSeconds !== undefined && (!Number.isInteger(idleSeconds) || idleSeconds < 0 || idleSeconds > 86400)) {
    return res.status(400).json({ success: false, message: 'Invalid idle duration' });
  }

  try {
    if (!await findOwnedSession(req.params.sessionId, String(employeeId))) {
      return res.status(404).json({ success: false, message: 'Active monitoring session not found' });
    }
    await pool.query(
      `INSERT INTO desktop_monitor_events (session_id, employee_id, event_type, idle_seconds)
       VALUES (?, ?, ?, ?)`,
      [req.params.sessionId, String(employeeId), eventType, idleSeconds ?? null],
    );
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Desktop monitoring event record failed:', error);
    return res.status(500).json({ success: false, message: 'Could not record monitoring event' });
  }
});

router.post('/sessions/:sessionId/screenshots', parseScreenshot, async (req, res) => {
  const employeeId = getEmployeeId(req);
  if (!employeeId) {
    return res.status(403).json({ success: false, message: 'Employee identity is required' });
  }
  if (
    !req.file
    || req.file.mimetype !== 'image/jpeg'
    || req.file.buffer.length < 3
    || req.file.buffer[0] !== 0xff
    || req.file.buffer[1] !== 0xd8
    || req.file.buffer[2] !== 0xff
  ) {
    return res.status(400).json({ success: false, message: 'A JPEG screenshot is required' });
  }

  try {
    if (!await findOwnedSession(req.params.sessionId, String(employeeId))) {
      return res.status(404).json({ success: false, message: 'Active monitoring session not found' });
    }

    await fs.mkdir(screenshotDirectory, { recursive: true });
    const storedName = randomUUID();
    const filePath = path.join(screenshotDirectory, `${storedName}.jpg`);
    await fs.writeFile(filePath, req.file.buffer, { flag: 'wx', mode: 0o600 });

    try {
      const [result] = await pool.query(
        `INSERT INTO desktop_monitor_screenshots
         (session_id, employee_id, stored_name, mime_type, file_size)
         VALUES (?, ?, ?, 'image/jpeg', ?)`,
        [req.params.sessionId, String(employeeId), storedName, req.file.size],
      );
      return res.status(201).json({
        success: true,
        data: { id: result.insertId, capturedAt: new Date().toISOString() },
      });
    } catch (error) {
      await fs.unlink(filePath);
      throw error;
    }
  } catch (error) {
    console.error('Desktop monitoring screenshot save failed:', error);
    return res.status(500).json({ success: false, message: 'Could not save screenshot' });
  }
});

router.get('/screenshots', async (req, res) => {
  const employeeId = getEmployeeId(req);
  if (!employeeId) {
    return res.status(403).json({ success: false, message: 'Employee identity is required' });
  }
  const requestedEmployeeId = req.query.employeeId;
  if (requestedEmployeeId && !isPrivileged(req)) {
    return res.status(403).json({ success: false, message: 'Admin access is required' });
  }
  const targetEmployeeId = isPrivileged(req) && requestedEmployeeId
    ? String(requestedEmployeeId)
    : String(employeeId);

  try {
    const [rows] = await pool.query(
      `SELECT id, employee_id AS employeeId, captured_at AS capturedAt, file_size AS fileSize
       FROM desktop_monitor_screenshots
       WHERE employee_id = ?
       ORDER BY captured_at DESC LIMIT 200`,
      [targetEmployeeId],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Desktop monitoring screenshot list failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load screenshots' });
  }
});

router.get('/screenshots/:id/content', async (req, res) => {
  const employeeId = getEmployeeId(req);
  if (!employeeId) {
    return res.status(403).json({ success: false, message: 'Employee identity is required' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT employee_id, stored_name, mime_type
       FROM desktop_monitor_screenshots WHERE id = ? LIMIT 1`,
      [req.params.id],
    );
    const screenshot = rows[0];
    if (!screenshot || (String(screenshot.employee_id) !== String(employeeId) && !isPrivileged(req))) {
      return res.status(404).json({ success: false, message: 'Screenshot not found' });
    }

    const filePath = path.join(screenshotDirectory, `${screenshot.stored_name}.jpg`);
    res.set({
      'Content-Type': screenshot.mime_type,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) {
        console.error('Desktop monitoring screenshot read failed:', error);
        res.status(error.statusCode === 404 ? 404 : 500).json({
          success: false,
          message: error.statusCode === 404 ? 'Screenshot file not found' : 'Could not load screenshot',
        });
      }
    });
  } catch (error) {
    console.error('Desktop monitoring screenshot lookup failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load screenshot' });
  }
});

module.exports = router;
