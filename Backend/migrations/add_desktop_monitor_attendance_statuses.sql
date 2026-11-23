ALTER TABLE desktop_monitor_sessions
  MODIFY COLUMN ended_reason ENUM('paused', 'disconnected', 'break', 'checked-out') NULL;
