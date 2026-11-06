const fs = require('fs/promises');
const path = require('path');
const pool = require('../config/database');

const configuredRetentionDays = process.env.DESKTOP_MONITOR_RETENTION_DAYS;
const retentionDays = configuredRetentionDays === undefined
  ? 30
  : Number(configuredRetentionDays);
if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
  throw new Error('DESKTOP_MONITOR_RETENTION_DAYS must be an integer between 1 and 3650');
}

const screenshotDirectory = path.join(__dirname, '../private_uploads/desktop-monitor');

async function cleanupExpiredDesktopScreenshots() {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const [rows] = await pool.query(
    `SELECT id, stored_name FROM desktop_monitor_screenshots
     WHERE captured_at < ? ORDER BY captured_at ASC LIMIT 1000`,
    [cutoff],
  );

  for (const screenshot of rows) {
    const filePath = path.join(screenshotDirectory, `${screenshot.stored_name}.jpg`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Could not remove expired screenshot ${screenshot.id}:`, error);
        continue;
      }
    }
    await pool.query('DELETE FROM desktop_monitor_screenshots WHERE id = ?', [screenshot.id]);
  }
  await pool.query('DELETE FROM desktop_monitor_events WHERE occurred_at < ?', [cutoff]);
  await pool.query('DELETE FROM desktop_monitor_sessions WHERE started_at < ?', [cutoff]);
}

module.exports = { cleanupExpiredDesktopScreenshots, retentionDays };
