-- ============================================================
-- Managed Leave Ticket System
-- Migration: Create tables for managed leave workflow
-- Same approval flow as attendance corrections:
--   Employee → Tagged Person → HR → Applied
-- ============================================================

-- ─── Main managed leave tickets table ───────────────────────
CREATE TABLE IF NOT EXISTS `managed_leave_tickets` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `ticket_number` VARCHAR(30) NOT NULL UNIQUE,

  -- Employee who is requesting the leave
  `employee_id` INT(11) NOT NULL COMMENT 'FK → employee_onboarding.id',
  `employee_name` VARCHAR(100) NOT NULL,
  `employee_email` VARCHAR(100) NOT NULL,

  -- Leave type & category
  `leave_type` ENUM('casual', 'sick', 'annual') NOT NULL,

  -- Scenario: 'mark_absent_as_leave' (retroactive) or 'advance_leave' (future)
  `leave_scenario` ENUM('mark_absent_as_leave', 'advance_leave') NOT NULL,

  -- Date range for the leave
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_days` INT(11) NOT NULL DEFAULT 1,

  -- Snapshot of leave balance at time of request
  `balance_at_request` INT(11) DEFAULT NULL COMMENT 'remaining leaves of this type when ticket was created',

  -- Employee's reason / explanation
  `reason` TEXT NOT NULL,

  -- Tagged person (approver step 1 — e.g., team lead / manager)
  `tagged_employee_id` INT(11) NOT NULL COMMENT 'FK → employee_onboarding.id',
  `tagged_employee_name` VARCHAR(100) NOT NULL,
  `tagged_employee_email` VARCHAR(100) NOT NULL,

  -- Approval workflow (same pattern as attendance_corrections)
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

  -- Whether the leave was actually applied (balance deducted + attendance updated)
  `is_applied` TINYINT(1) DEFAULT 0,
  `applied_at` TIMESTAMP NULL DEFAULT NULL,

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_ml_employee_id` (`employee_id`),
  KEY `idx_ml_tagged_employee_id` (`tagged_employee_id`),
  KEY `idx_ml_start_date` (`start_date`),
  KEY `idx_ml_end_date` (`end_date`),
  KEY `idx_ml_overall_status` (`overall_status`),
  KEY `idx_ml_ticket_number` (`ticket_number`),
  KEY `idx_ml_leave_type` (`leave_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Activity log for each managed leave ticket ─────────────
CREATE TABLE IF NOT EXISTS `managed_leave_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` INT(11) NOT NULL COMMENT 'FK → managed_leave_tickets.id',
  `action` ENUM('created', 'tagged_approved', 'tagged_rejected', 'hr_approved', 'hr_rejected', 'applied', 'reopened') NOT NULL,
  `action_by_id` INT(11) NOT NULL,
  `action_by_name` VARCHAR(100) NOT NULL,
  `action_by_role` VARCHAR(50) DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_mll_ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
