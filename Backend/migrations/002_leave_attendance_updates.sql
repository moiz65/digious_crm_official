-- ============================================================
-- Migration 002: Leave & Attendance Updates
-- ============================================================
-- 1. Remove uninformed_leaves and paid_absent columns from employee_leaves
-- 2. Add 'Paid Leave' to Employee_Absent.reason_type enum
-- 3. Add 'Paid Leave' and 'Uninformed Absent' to Employee_Attendance.status enum
-- 4. Add leave_type_key column to Employee_Absent (casual/sick/annual/paid_leave)
-- ============================================================
-- Run: mysql -h 127.0.0.1 -P 3306 -u root Digious_CRM_DataBase < 002_leave_attendance_updates.sql

-- Step 1: Drop unused columns from employee_leaves (uninformed & paid_absent tracking)
ALTER TABLE `employee_leaves`
  DROP COLUMN IF EXISTS `uninformed_leaves_used`,
  DROP COLUMN IF EXISTS `uninformed_leaves_total`,
  DROP COLUMN IF EXISTS `paid_absent_balance`,
  DROP COLUMN IF EXISTS `paid_absent_used`;

-- Step 2: Add 'Paid Leave' to Employee_Absent reason_type enum
ALTER TABLE `Employee_Absent`
  MODIFY COLUMN `reason_type`
    enum('No Check-in','Leave','Medical','Sick','Other','Paid Leave')
    DEFAULT 'No Check-in'
    COMMENT 'Structured reason category';

-- Step 3: Add leave_type_key to Employee_Absent (which leave type: casual/sick/annual/paid_leave)
ALTER TABLE `Employee_Absent`
  ADD COLUMN IF NOT EXISTS `leave_type_key`
    enum('casual','sick','annual','paid_leave')
    DEFAULT NULL
    COMMENT 'Leave type if this absence is being counted against a leave quota',
  ADD COLUMN IF NOT EXISTS `application_id`
    int(11) DEFAULT NULL
    COMMENT 'FK to applications table if this absence relates to an application';

-- Step 4: Extend Employee_Attendance.status enum to include Paid Leave and Uninformed Absent
ALTER TABLE `Employee_Attendance`
  MODIFY COLUMN `status`
    enum('Present','Absent','Late','On Leave','Half Day','Paid Leave','Uninformed Absent')
    DEFAULT 'Absent';

-- Step 5: Verification
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('employee_leaves', 'Employee_Absent', 'Employee_Attendance')
  AND COLUMN_NAME IN (
    'uninformed_leaves_used', 'uninformed_leaves_total',
    'paid_absent_balance', 'paid_absent_used',
    'reason_type', 'leave_type_key', 'application_id', 'status'
  )
ORDER BY TABLE_NAME, COLUMN_NAME;
