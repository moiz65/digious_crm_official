ALTER TABLE desktop_monitor_events
  ADD COLUMN attendance_id INT NULL AFTER employee_id,
  ADD INDEX idx_desktop_monitor_event_attendance (attendance_id);

ALTER TABLE desktop_monitor_screenshots
  ADD COLUMN attendance_id INT NULL AFTER employee_id,
  ADD INDEX idx_desktop_monitor_screenshot_attendance (attendance_id);
