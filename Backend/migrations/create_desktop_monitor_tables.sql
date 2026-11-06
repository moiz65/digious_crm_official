CREATE TABLE IF NOT EXISTS desktop_monitor_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  consent_version VARCHAR(32) NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  INDEX idx_desktop_monitor_employee_started (employee_id, started_at)
);

CREATE TABLE IF NOT EXISTS desktop_monitor_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  employee_id VARCHAR(64) NOT NULL,
  event_type ENUM('idle_started', 'idle_ended') NOT NULL,
  idle_seconds INT UNSIGNED NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_desktop_monitor_event_session (session_id, occurred_at),
  INDEX idx_desktop_monitor_event_employee (employee_id, occurred_at)
);

CREATE TABLE IF NOT EXISTS desktop_monitor_screenshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  employee_id VARCHAR(64) NOT NULL,
  stored_name CHAR(36) NOT NULL UNIQUE,
  mime_type VARCHAR(32) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  captured_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_desktop_monitor_screenshot_employee (employee_id, captured_at),
  INDEX idx_desktop_monitor_screenshot_session (session_id, captured_at)
);
