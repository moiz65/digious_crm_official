ALTER TABLE desktop_monitor_sessions
  ADD COLUMN ended_reason ENUM('paused', 'disconnected') NULL AFTER ended_at,
  ADD COLUMN last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER ended_reason;
