-- =====================================================
-- Applications Multi-Assign & Approval Chain Migration
-- Date: 2026-02-17
-- Description: Adds multi-assignee sequential approval workflow
--   - application_assignees: stores multiple assignees per application with step order
--   - application_approval_log: tracks all approval/rejection actions with timestamps
--   - Adds current_step to applications table to track chain progress
-- =====================================================

USE Digious_CRM_DataBase;

-- Step 1: Create application_assignees table for multi-assign
CREATE TABLE IF NOT EXISTS `application_assignees` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `application_id` INT(11) NOT NULL,
  `employee_id` INT(11) NOT NULL,
  `employee_name` VARCHAR(150) NOT NULL,
  `step_order` INT(11) NOT NULL DEFAULT 1 COMMENT 'Priority order in approval chain (1=first, 2=second, etc.)',
  `status` ENUM('pending','approved','rejected','skipped') DEFAULT 'pending' COMMENT 'Status of this assignee step',
  `action_date` DATETIME DEFAULT NULL COMMENT 'When the action was taken',
  `notes` TEXT DEFAULT NULL COMMENT 'Notes from the assignee during approval/rejection',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_assignee_app_id` (`application_id`),
  KEY `idx_app_assignee_emp_id` (`employee_id`),
  KEY `idx_app_assignee_step` (`application_id`, `step_order`),
  KEY `idx_app_assignee_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Multiple assignees per application with sequential approval chain';

-- Step 2: Create application_approval_log table for audit trail
CREATE TABLE IF NOT EXISTS `application_approval_log` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `application_id` INT(11) NOT NULL,
  `employee_id` INT(11) NOT NULL,
  `employee_name` VARCHAR(150) NOT NULL,
  `action` ENUM('approved','rejected','forwarded','withdrawn','assigned','reassigned') NOT NULL,
  `step_order` INT(11) DEFAULT NULL COMMENT 'Which step in the chain this action was for',
  `notes` TEXT DEFAULT NULL COMMENT 'Approval notes, rejection reason, etc.',
  `action_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_approval_log_app_id` (`application_id`),
  KEY `idx_approval_log_emp_id` (`employee_id`),
  KEY `idx_approval_log_action` (`action`),
  KEY `idx_approval_log_date` (`action_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Full audit trail for all application approval actions';

-- Step 3: Add current_step column to applications table
-- Tracks which step in the approval chain the application is currently at
ALTER TABLE `applications`
  ADD COLUMN `current_step` INT(11) DEFAULT 0 COMMENT 'Current step in approval chain (0=not started, 1=first assignee, etc.)' AFTER `assigned_to_employee_id`,
  ADD COLUMN `total_steps` INT(11) DEFAULT 0 COMMENT 'Total number of assignees in the chain' AFTER `current_step`,
  ADD COLUMN `is_multi_assign` TINYINT(1) DEFAULT 0 COMMENT 'Whether this application has multi-assignee chain' AFTER `total_steps`;

-- Step 4: Add index for step tracking
CREATE INDEX idx_applications_current_step ON applications(current_step);
CREATE INDEX idx_applications_multi_assign ON applications(is_multi_assign);

-- Step 5: Migrate existing single-assign data to the new multi-assign structure
-- For applications that already have an assigned_to_employee_id, create a single-step entry
INSERT INTO `application_assignees` (`application_id`, `employee_id`, `employee_name`, `step_order`, `status`, `created_at`)
SELECT 
  a.`id`, 
  a.`assigned_to_employee_id`, 
  a.`assigned_to`,
  1,
  CASE 
    WHEN a.`status` = 'approved' THEN 'approved'
    WHEN a.`status` = 'rejected' THEN 'rejected'
    ELSE 'pending'
  END,
  a.`created_at`
FROM `applications` a
WHERE a.`assigned_to_employee_id` IS NOT NULL;

-- Update the applications table for migrated records
UPDATE `applications` a
SET 
  a.`current_step` = CASE 
    WHEN a.`status` IN ('approved', 'rejected') THEN 1
    ELSE 1
  END,
  a.`total_steps` = 1,
  a.`is_multi_assign` = 0
WHERE a.`assigned_to_employee_id` IS NOT NULL;

-- Step 6: Verify the changes
DESCRIBE `application_assignees`;
DESCRIBE `application_approval_log`;

SELECT 'Multi-Assign Migration completed successfully!' AS status,
       'New tables: application_assignees, application_approval_log' AS tables_created,
       'New columns: current_step, total_steps, is_multi_assign on applications' AS columns_added,
       'Existing single-assign data has been migrated' AS data_migration;
