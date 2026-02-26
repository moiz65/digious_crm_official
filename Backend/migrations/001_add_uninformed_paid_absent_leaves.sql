-- ============================================================
-- Migration: Add Uninformed Leaves & Paid Absent columns
-- Also: Create MySQL Event to auto-run ProcessMissingCheckouts
-- Run: mysql -h 127.0.0.1 -P 3306 -u root Digious_CRM_DataBase < 001_add_uninformed_paid_absent_leaves.sql
-- ============================================================

USE Digious_CRM_DataBase;

-- ------------------------------------------------------------
-- 1. Add new columns to employee_leaves (if not exist)
-- ------------------------------------------------------------
ALTER TABLE employee_leaves
  ADD COLUMN IF NOT EXISTS uninformed_leaves_used    INT NOT NULL DEFAULT 0     COMMENT 'Uninformed absences (purely absent, adjustable)',
  ADD COLUMN IF NOT EXISTS uninformed_leaves_total   INT NOT NULL DEFAULT 0     COMMENT 'Allowed uninformed leave quota (0 = not applicable)',
  ADD COLUMN IF NOT EXISTS paid_absent_balance       INT NOT NULL DEFAULT 3     COMMENT 'Paid absent days granted (HR configures per employee)',
  ADD COLUMN IF NOT EXISTS paid_absent_used          INT NOT NULL DEFAULT 0     COMMENT 'Paid absent days consumed';

-- ------------------------------------------------------------
-- 2. Enable MySQL Event Scheduler (must be ON for events to run)
-- ------------------------------------------------------------
SET GLOBAL event_scheduler = ON;

-- ------------------------------------------------------------
-- 3. Create daily event to process missing checkouts at 21:05
--    (after typical shift end — 9:05 PM)
-- ------------------------------------------------------------
DROP EVENT IF EXISTS evt_process_missing_checkouts;

CREATE EVENT evt_process_missing_checkouts
  ON SCHEDULE EVERY 1 DAY
  STARTS CONCAT(CURDATE(), ' 21:05:00')
  ON COMPLETION PRESERVE
  ENABLE
  COMMENT 'Auto-populate Employee_Checkout_Missing for employees who forgot to check out'
  DO CALL ProcessMissingCheckouts();

-- ------------------------------------------------------------
-- 4. Create daily event to process daily absences at 21:10
--    (marks employees absent who didn't check in)
-- ------------------------------------------------------------
DROP EVENT IF EXISTS evt_process_daily_absences;

CREATE EVENT evt_process_daily_absences
  ON SCHEDULE EVERY 1 DAY
  STARTS CONCAT(CURDATE(), ' 21:10:00')
  ON COMPLETION PRESERVE
  ENABLE
  COMMENT 'Auto-mark daily absences for employees with no check-in'
  DO CALL ProcessDailyAbsences();

-- ------------------------------------------------------------
-- 5. Verify
-- ------------------------------------------------------------
SELECT 'Migration complete.' AS status;
SHOW EVENTS;
SELECT 
  COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'Digious_CRM_DataBase'
  AND TABLE_NAME   = 'employee_leaves'
  AND COLUMN_NAME  IN ('uninformed_leaves_used','uninformed_leaves_total','paid_absent_balance','paid_absent_used')
ORDER BY ORDINAL_POSITION;
