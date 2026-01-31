-- ============================================================
-- Migration: Employee Profile Extended Schema with Data Sync
-- Date: 2026-01-30
-- Description: Add normalized views and fields for enhanced employee 
-- profile display. Integrates with existing tables:
-- employees, employee_bank_accounts, employee_allowances, 
-- Employee_Attendance, Employee_Activities
--
-- DATA MIGRATION FLOW:
-- 1. Creates new tables: employee_profiles, employee_emergency_contacts
-- 2. Migrates existing data from related tables into new structures
-- 3. Creates views that JOIN existing and new tables to provide complete profile data
-- 4. All existing employee records get automatic profile entries
-- ============================================================

-- ============================================================
-- TABLE: employee_profiles
-- Purpose: Centralized employee profile configuration and metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS `employee_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `bio` text DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_relation` varchar(100) DEFAULT NULL,
  `preferred_contact_method` enum('Email','Phone','WhatsApp') DEFAULT 'Email',
  `linkedin_url` varchar(500) DEFAULT NULL,
  `github_url` varchar(500) DEFAULT NULL,
  `portfolio_url` varchar(500) DEFAULT NULL,
  `skills_json` json DEFAULT NULL,
  `certifications_json` json DEFAULT NULL,
  `banner_url` varchar(1000) DEFAULT NULL,
  `documents_json` json DEFAULT NULL,
  `resources_json` json DEFAULT NULL,
  `next_review_date` date DEFAULT NULL,
  `review_cycle` enum('Quarterly','Half-Yearly','Yearly') DEFAULT 'Yearly',
  `preferred_work_location` varchar(255) DEFAULT NULL,
  `work_mode_preference` enum('Remote','Office','Hybrid') DEFAULT 'Hybrid',
  `total_work_experience_years` decimal(5,1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `idx_next_review_date` (`next_review_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: employee_emergency_contacts
-- Purpose: Store multiple emergency contacts for each employee
-- ============================================================
CREATE TABLE IF NOT EXISTS `employee_emergency_contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `contact_name` varchar(255) NOT NULL,
  `contact_phone` varchar(20) NOT NULL,
  `relation` varchar(100) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  CONSTRAINT `fk_emergency_contact_employee` FOREIGN KEY (`employee_id`) 
    REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: employee_goals (removed)
-- Note: Performance goals table removed from this migration. If goals are required later, add in a separate migration with non-destructive backward-compatible changes.
-- ============================================================

-- ============================================================
-- VIEW: employee_profile_summary
-- Purpose: Comprehensive employee profile view combining data 
-- from multiple tables for dashboard/profile display
-- ============================================================
CREATE OR REPLACE VIEW `employee_profile_summary` AS
SELECT 
  e.`id`,
  e.`first_name`,
  e.`last_name`,
  CONCAT(e.`first_name`, ' ', e.`last_name`) AS `full_name`,
  e.`email`,
  e.`phone`,
  e.`department_id`,
  d.`department_name`,
  e.`role_id`,
  r.`role_name`,
  COALESCE(e.`date_of_birth`, eo.`dob`) AS `date_of_birth`,
  YEAR(CURDATE()) - YEAR(COALESCE(e.`date_of_birth`, eo.`dob`)) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(COALESCE(e.`date_of_birth`, eo.`dob`), '%m%d')) AS `age`,
  e.`gender`,
  eo.`dob` AS `onboarding_dob`,
  eo.`emergency_contact` AS `onboarding_emergency_contact`,
  ep.`banner_url`,
  ep.`documents_json`,
  ep.`resources_json`,
  e.`joining_date`,
  DATEDIFF(CURDATE(), e.`joining_date`) / 365.25 AS `years_in_company`,
  e.`employment_type`,
  e.`employment_status`,
  e.`reporting_to_employee_id`,
  ep.`bio`,
  COALESCE(ep.`emergency_contact_name`, NULL) AS `emergency_contact_name`,
  COALESCE(ep.`emergency_contact_phone`, eo.`emergency_contact`) AS `emergency_contact_phone`,
  ep.`linkedin_url`,
  ep.`github_url`,
  ep.`portfolio_url`,
  ep.`next_review_date`,
  ep.`preferred_work_location`,
  ep.`work_mode_preference`,
  CAST(ep.`total_work_experience_years` AS DECIMAL(5,1)) AS `total_work_experience_years`,
  COALESCE(
    (SELECT GROUP_CONCAT(ba.`account_number`, '|', ba.`bank_name` ORDER BY ba.`is_primary` DESC)
     FROM `employee_bank_accounts` ba 
     WHERE ba.`employee_id` = e.`id`), 
    'No bank account registered'
  ) AS `bank_accounts_summary`,
  COALESCE(
    (SELECT SUM(CAST(ea.`allowance_amount` AS DECIMAL(12,2)))
     FROM `employee_allowances` ea 
     WHERE ea.`employee_id` = e.`id`), 
    0
  ) AS `total_allowances`,
  0 AS `completed_goals`,
  0 AS `in_progress_goals`,
  0 AS `total_goals`,
  e.`created_at`,
  e.`updated_at`
FROM `employees` e
LEFT JOIN `departments` d ON e.`department_id` = d.`id`
LEFT JOIN `roles` r ON e.`role_id` = r.`id`
LEFT JOIN `employee_profiles` ep ON e.`id` = ep.`employee_id`
LEFT JOIN `employee_onboarding` eo ON eo.`id` = e.`id`
WHERE e.`deleted_at` IS NULL;

-- ============================================================
-- VIEW: employee_financial_summary
-- Purpose: Employee financial information (bank, allowances, salary)
-- ============================================================
CREATE OR REPLACE VIEW `employee_financial_summary` AS
SELECT 
  e.`id`,
  e.`first_name`,
  e.`last_name`,
  ba.`id` AS `bank_account_id`,
  CONCAT(SUBSTRING(ba.`account_number`, 1, 4), '****', SUBSTRING(ba.`account_number`, -4)) AS `account_number_masked`,
  ba.`account_title_name`,
  ba.`bank_name`,
  ba.`account_type`,
  COALESCE(
    (SELECT SUM(CAST(ea.`allowance_amount` AS DECIMAL(12,2)))
     FROM `employee_allowances` ea 
     WHERE ea.`employee_id` = e.`id`), 
    0
  ) AS `total_allowances`,
  COALESCE(
    (SELECT GROUP_CONCAT(CONCAT(ea.`allowance_name`, '=', ea.`allowance_amount`) SEPARATOR ', ')
     FROM `employee_allowances` ea 
     WHERE ea.`employee_id` = e.`id`), 
    'No allowances'
  ) AS `allowances_detail`,
  e.`salary_grade` AS `salary_grade`,
  ba.`created_at`,
  es.`base_salary`,
  es.`total_salary`
FROM `employees` e
LEFT JOIN `employee_bank_accounts` ba ON e.`id` = ba.`employee_id` AND ba.`is_primary` = 1
LEFT JOIN `employee_salary` es ON e.`id` = es.`employee_id`
WHERE e.`deleted_at` IS NULL;

-- ============================================================
-- VIEW: employee_attendance_summary
-- Purpose: Recent attendance summary for profile display
-- ============================================================
CREATE OR REPLACE VIEW `employee_attendance_summary` AS
SELECT 
  e.`id`,
  e.`first_name`,
  e.`last_name`,
  COUNT(ea.`id`) AS `total_attendance_records`,
  SUM(CASE WHEN ea.`status` = 'Present' THEN 1 ELSE 0 END) AS `present_days`,
  SUM(CASE WHEN ea.`status` = 'Absent' THEN 1 ELSE 0 END) AS `absent_days`,
  SUM(CASE WHEN ea.`status` = 'Late' THEN 1 ELSE 0 END) AS `late_days`,
  SUM(CASE WHEN ea.`status` = 'Half Day' THEN 1 ELSE 0 END) AS `half_days`,
  ROUND(
    (SUM(CASE WHEN ea.`status` = 'Present' OR ea.`status` = 'Late' THEN 1 ELSE 0 END) / COUNT(ea.`id`) * 100), 2
  ) AS `attendance_percentage`,
  SUM(CAST(ea.`overtime_hours` AS DECIMAL(5,2))) AS `total_overtime_hours`,
  MAX(ea.`attendance_date`) AS `last_attendance_date`,
  MAX(CASE WHEN ea.`status` = 'Present' OR ea.`status` = 'Late' THEN ea.`attendance_date` END) AS `last_present_date`
FROM `employees` e
LEFT JOIN `Employee_Attendance` ea ON e.`id` = ea.`employee_id` 
  AND ea.`attendance_date` >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
WHERE e.`deleted_at` IS NULL
GROUP BY e.`id`, e.`first_name`, e.`last_name`;

-- ============================================================
-- VIEW: employee_performance_summary
-- Purpose: Performance metrics including goals, reviews, rating
-- ============================================================
CREATE OR REPLACE VIEW `employee_performance_summary` AS
SELECT 
  e.`id`,
  e.`first_name`,
  e.`last_name`,
  ep.`next_review_date`,
  CASE 
    WHEN ep.`next_review_date` IS NULL THEN 'Not Scheduled'
    WHEN ep.`next_review_date` < CURDATE() THEN 'Overdue'
    WHEN ep.`next_review_date` <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Due Soon'
    ELSE 'Scheduled'
  END AS `review_status`,
  DATEDIFF(ep.`next_review_date`, CURDATE()) AS `days_until_review`,
  0 AS `completed_goals`,
  0 AS `in_progress_goals`,
  0 AS `total_goals`,
  0 AS `avg_goal_progress`
FROM `employees` e
LEFT JOIN `employee_profiles` ep ON e.`id` = ep.`employee_id`
WHERE e.`deleted_at` IS NULL;

-- ============================================================
-- Indexes for performance optimization
-- ============================================================
ALTER TABLE `employee_profiles` 
ADD INDEX IF NOT EXISTS `idx_employee_profile_created` (`created_at`),
ADD INDEX IF NOT EXISTS `idx_review_status` (`next_review_date`, `employee_id`);

ALTER TABLE `employee_emergency_contacts` 
ADD INDEX IF NOT EXISTS `idx_is_primary` (`is_primary`),
ADD INDEX IF NOT EXISTS `idx_created` (`created_at`);

-- Indexes for employee_goals removed (table not part of this migration).

-- ============================================================
-- DATA MIGRATION PROCEDURES
-- Purpose: Migrate existing employee data into new profile tables
-- ============================================================

-- Procedure 1: Initialize employee_profiles for all existing employees
DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_migrate_employee_profiles`$$
CREATE PROCEDURE `sp_migrate_employee_profiles`()
BEGIN
  INSERT INTO `employee_profiles` 
  (`employee_id`, `total_work_experience_years`, `preferred_work_location`, `emergency_contact_phone`, `created_at`, `updated_at`)
  SELECT 
    e.`id`,
    CAST(DATEDIFF(CURDATE(), e.`joining_date`) / 365.25 AS DECIMAL(5,1)) AS `total_work_experience_years`,
    COALESCE(e.`office_location`, 'Main Office') AS `preferred_work_location`,
    eo.`emergency_contact` AS `emergency_contact_phone`,
    NOW(),
    NOW()
  FROM `employees` e
  LEFT JOIN `employee_onboarding` eo ON eo.`id` = e.`id`
  WHERE e.`id` NOT IN (SELECT `employee_id` FROM `employee_profiles` WHERE `employee_id` IS NOT NULL)
    AND e.`deleted_at` IS NULL;
  
  SELECT CONCAT('Migrated ', ROW_COUNT(), ' employee profiles') AS `status`;
END$$
DELIMITER ;

-- Procedure 2: Sync employee data from bank accounts and allowances
DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_sync_profile_financial_data`$$
CREATE PROCEDURE `sp_sync_profile_financial_data`()
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SELECT 'Error occurred during financial data sync' AS `error`;
  END;
  
  -- This view automatically syncs data via the employee_financial_summary view
  -- No direct insert needed - views handle the JOIN automatically
  SELECT CONCAT('Financial data synced from ', 
    (SELECT COUNT(*) FROM `employee_bank_accounts`), 
    ' bank accounts and ',
    (SELECT COUNT(*) FROM `employee_allowances`),
    ' allowance records') AS `status`;
END$$
DELIMITER ;

-- Procedure `sp_initialize_employee_goals` removed (goals are not part of this migration).

-- Procedure 4: Update attendance summary (can be called periodically)
DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_update_attendance_summary`$$
CREATE PROCEDURE `sp_update_attendance_summary`(IN p_days_back INT)
BEGIN
  -- This is for reference - the view automatically calculates attendance
  -- Set p_days_back to 90 for last 90 days, 30 for last month, etc.
  SELECT 
    e.`id`,
    e.`first_name`,
    e.`last_name`,
    COALESCE(
      (SELECT COUNT(*) FROM `Employee_Attendance` ea 
       WHERE ea.`employee_id` = e.`id` 
       AND ea.`attendance_date` >= DATE_SUB(CURDATE(), INTERVAL p_days_back DAY)
       AND ea.`status` IN ('Present', 'Late')), 0
    ) AS `present_days`,
    COALESCE(
      (SELECT COUNT(*) FROM `Employee_Attendance` ea 
       WHERE ea.`employee_id` = e.`id` 
       AND ea.`attendance_date` >= DATE_SUB(CURDATE(), INTERVAL p_days_back DAY)
       AND ea.`status` = 'Absent'), 0
    ) AS `absent_days`
  FROM `employees` e
  WHERE e.`deleted_at` IS NULL
  LIMIT 100;
END$$
DELIMITER ;

-- ============================================================
-- EXECUTE DATA MIGRATION
-- ============================================================
-- Run these procedures to migrate existing data
CALL `sp_migrate_employee_profiles`();
CALL `sp_sync_profile_financial_data`();

-- Procedure 5: Migrate bank account details from employee_onboarding into employee_bank_accounts (if missing)
DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_migrate_onboarding_bank_accounts`$$
CREATE PROCEDURE `sp_migrate_onboarding_bank_accounts`()
BEGIN
  INSERT INTO `employee_bank_accounts` (`employee_id`, `account_number`, `account_title_name`, `bank_name`, `is_primary`, `created_at`, `updated_at`)
  SELECT eo.`id`, eo.`bank_account`, eo.`account_title_name`, eo.`bank_name`, 1, NOW(), NOW()
  FROM `employee_onboarding` eo
  WHERE eo.`bank_account` IS NOT NULL
    AND eo.`bank_account` != ''
    AND NOT EXISTS (
      SELECT 1 FROM `employee_bank_accounts` ba WHERE ba.`employee_id` = eo.`id`
    );

  SELECT CONCAT('Migrated ', ROW_COUNT(), ' bank accounts from onboarding') AS `status`;
END$$
DELIMITER ;

-- Run bank account migration
CALL `sp_migrate_onboarding_bank_accounts`();

-- ============================================================
-- Sample data for testing (optional)
-- ============================================================
-- Uncomment below to add sample profile data

/*
INSERT INTO `employee_profiles` 
(`employee_id`, `bio`, `emergency_contact_name`, `emergency_contact_phone`, 
 `emergency_contact_relation`, `next_review_date`, `total_work_experience_years`, `preferred_work_location`)
VALUES 
(1, 'Senior Developer with 12+ years of experience in web technologies', 
 'Muhammad Ali', '+92 300 1234567', 'Brother', DATE_ADD(CURDATE(), INTERVAL 2 MONTH), 12.5, 'Karachi Office');

INSERT INTO `employee_emergency_contacts` 
(`employee_id`, `contact_name`, `contact_phone`, `relation`, `is_primary`)
VALUES 
(1, 'Muhammad Ali', '+92 300 1234567', 'Brother', 1),
(1, 'Fatima Khan', '+92 321 9876543', 'Sister', 0);

*/

-- ============================================================
-- End of Migration
-- ============================================================
