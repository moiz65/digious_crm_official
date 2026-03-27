-- ============================================================
-- Attendance Correction Ticket System
-- Migration: Create tables for attendance correction workflow
-- ============================================================

-- ─── Main correction tickets table ──────────────────────────
CREATE TABLE IF NOT EXISTS `attendance_corrections` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `ticket_number` VARCHAR(30) NOT NULL UNIQUE,
  `employee_id` INT(11) NOT NULL COMMENT 'FK → employee_onboarding.id',
  `employee_name` VARCHAR(100) NOT NULL,
  `employee_email` VARCHAR(100) NOT NULL,
  `attendance_id` INT(11) DEFAULT NULL COMMENT 'FK → Employee_Attendance.id (NULL if absent record)',
  `attendance_date` DATE NOT NULL,

  -- Original attendance data (snapshot at time of request)
  `original_check_in` TIME DEFAULT NULL,
  `original_check_out` TIME DEFAULT NULL,
  `original_status` VARCHAR(50) DEFAULT NULL,
  `original_working_minutes` INT(11) DEFAULT NULL,
  `original_break_minutes` INT(11) DEFAULT NULL,
  `original_late_minutes` INT(11) DEFAULT NULL,
  `original_overtime_minutes` INT(11) DEFAULT NULL,

  -- Corrected values requested by employee
  `corrected_check_in` TIME DEFAULT NULL,
  `corrected_check_out` TIME DEFAULT NULL,
  `corrected_status` VARCHAR(50) DEFAULT NULL,

  -- Employee's reason/explanation for the correction
  `reason` TEXT NOT NULL,

  -- Tagged person (approver step 1)
  `tagged_employee_id` INT(11) NOT NULL COMMENT 'FK → employee_onboarding.id',
  `tagged_employee_name` VARCHAR(100) NOT NULL,
  `tagged_employee_email` VARCHAR(100) NOT NULL,

  -- Approval workflow
  `tagged_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `tagged_remarks` TEXT DEFAULT NULL,
  `tagged_action_at` TIMESTAMP NULL DEFAULT NULL,

  `hr_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `hr_remarks` TEXT DEFAULT NULL,
  `hr_action_by` INT(11) DEFAULT NULL COMMENT 'HR employee who took action',
  `hr_action_by_name` VARCHAR(100) DEFAULT NULL,
  `hr_action_at` TIMESTAMP NULL DEFAULT NULL,

  -- Overall ticket status
  `overall_status` ENUM('open', 'tagged_approved', 'tagged_rejected', 'hr_approved', 'hr_rejected', 'applied') DEFAULT 'open',

  -- Whether the correction was actually applied to the attendance record
  `is_applied` TINYINT(1) DEFAULT 0,
  `applied_at` TIMESTAMP NULL DEFAULT NULL,

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_tagged_employee_id` (`tagged_employee_id`),
  KEY `idx_attendance_date` (`attendance_date`),
  KEY `idx_overall_status` (`overall_status`),
  KEY `idx_ticket_number` (`ticket_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Activity log for each correction ticket ────────────────
CREATE TABLE IF NOT EXISTS `attendance_correction_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `correction_id` INT(11) NOT NULL COMMENT 'FK → attendance_corrections.id',
  `action` ENUM('created', 'tagged_approved', 'tagged_rejected', 'hr_approved', 'hr_rejected', 'applied', 'reopened') NOT NULL,
  `action_by_id` INT(11) NOT NULL,
  `action_by_name` VARCHAR(100) NOT NULL,
  `action_by_role` VARCHAR(50) DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_correction_id` (`correction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
