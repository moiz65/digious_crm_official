-- ============================================================
-- Migration: Add Employee Profile Views Only
-- Date: 2026-01-31
-- Description: Creates views for employee profile summary (assumes employee_profiles table already exists)
-- ============================================================

-- ============================================================
-- VIEW: employee_profile_summary
-- Purpose: Comprehensive employee profile view combining data 
-- from employee_onboarding and employee_profiles
-- ============================================================
CREATE OR REPLACE VIEW `employee_profile_summary` AS
SELECT 
  eo.`id`,
  eo.`employee_id`,
  eo.`name` AS `full_name`,
  eo.`email`,
  eo.`phone`,
  eo.`department`,
  eo.`sub_department`,
  eo.`designation`,
  eo.`employment_status`,
  eo.`join_date`,
  DATEDIFF(CURDATE(), eo.`join_date`) / 365.25 AS `years_in_company`,
  eo.`dob` AS `date_of_birth`,
  CASE 
    WHEN eo.`dob` IS NOT NULL THEN YEAR(CURDATE()) - YEAR(eo.`dob`) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(eo.`dob`, '%m%d'))
    ELSE NULL 
  END AS `age`,
  eo.`address`,
  eo.`emergency_contact` AS `onboarding_emergency_contact`,
  ep.`banner_url`,
  ep.`documents_json`,
  ep.`resources_json`,
  ep.`bio`,
  COALESCE(ep.`emergency_contact_name`, NULL) AS `emergency_contact_name`,
  COALESCE(ep.`emergency_contact_phone`, eo.`emergency_contact`) AS `emergency_contact_phone`,
  ep.`emergency_contact_relation`,
  ep.`preferred_contact_method`,
  ep.`linkedin_url`,
  ep.`github_url`,
  ep.`portfolio_url`,
  ep.`skills_json`,
  ep.`certifications_json`,
  ep.`next_review_date`,
  ep.`review_cycle`,
  ep.`preferred_work_location`,
  ep.`work_mode_preference`,
  CAST(ep.`total_work_experience_years` AS DECIMAL(5,1)) AS `total_work_experience_years`,
  COALESCE(
    (SELECT GROUP_CONCAT(ba.`account_number`, '|', ba.`bank_name` ORDER BY ba.`is_primary` DESC)
     FROM `employee_bank_accounts` ba 
     WHERE ba.`employee_id` = eo.`id`), 
    'No bank account registered'
  ) AS `bank_accounts_summary`,
  COALESCE(
    (SELECT SUM(CAST(ea.`allowance_amount` AS DECIMAL(12,2)))
     FROM `employee_allowances` ea 
     WHERE ea.`employee_id` = eo.`id`), 
    0
  ) AS `total_allowances`,
  0 AS `completed_goals`,
  0 AS `in_progress_goals`,
  0 AS `total_goals`,
  eo.`status`,
  eo.`created_at`,
  eo.`updated_at`
FROM `employee_onboarding` eo
LEFT JOIN `employee_profiles` ep ON eo.`id` = ep.`employee_id`
WHERE eo.`status` != 'Inactive';

-- ============================================================
-- VIEW: employee_financial_summary
-- Purpose: Employee financial information (bank, allowances, salary)
-- ============================================================
CREATE OR REPLACE VIEW `employee_financial_summary` AS
SELECT 
  eo.`id`,
  eo.`name` AS `full_name`,
  eo.`employee_id`,
  ba.`id` AS `bank_account_id`,
  CONCAT(SUBSTRING(ba.`account_number`, 1, 4), '****', SUBSTRING(ba.`account_number`, -4)) AS `account_number_masked`,
  ba.`account_number` AS `account_number_full`,
  ba.`account_title_name`,
  ba.`bank_name`,
  ba.`account_type`,
  COALESCE(
    (SELECT SUM(CAST(ea.`allowance_amount` AS DECIMAL(12,2)))
     FROM `employee_allowances` ea 
     WHERE ea.`employee_id` = eo.`id`), 
    0
  ) AS `total_allowances`,
  COALESCE(
    (SELECT GROUP_CONCAT(CONCAT(ea.`allowance_name`, '=', ea.`allowance_amount`) SEPARATOR ', ')
     FROM `employee_allowances` ea 
     WHERE ea.`employee_id` = eo.`id`), 
    'No allowances'
  ) AS `allowances_detail`,
  es.`base_salary`,
  es.`total_salary`,
  ba.`created_at`
FROM `employee_onboarding` eo
LEFT JOIN `employee_bank_accounts` ba ON eo.`id` = ba.`employee_id` AND ba.`is_primary` = 1
LEFT JOIN `employee_salary` es ON eo.`id` = es.`employee_id`
WHERE eo.`status` != 'Inactive';

-- ============================================================
-- VIEW: employee_attendance_summary
-- Purpose: Recent attendance summary for profile display
-- ============================================================
CREATE OR REPLACE VIEW `employee_attendance_summary` AS
SELECT 
  eo.`id`,
  eo.`name` AS `full_name`,
  eo.`employee_id`,
  COUNT(ea.`id`) AS `total_attendance_records`,
  SUM(CASE WHEN ea.`status` = 'Present' THEN 1 ELSE 0 END) AS `present_days`,
  SUM(CASE WHEN ea.`status` = 'Absent' THEN 1 ELSE 0 END) AS `absent_days`,
  SUM(CASE WHEN ea.`status` = 'Late' THEN 1 ELSE 0 END) AS `late_days`,
  SUM(CASE WHEN ea.`status` = 'Half Day' THEN 1 ELSE 0 END) AS `half_days`,
  ROUND(
    (SUM(CASE WHEN ea.`status` = 'Present' OR ea.`status` = 'Late' THEN 1 ELSE 0 END) / NULLIF(COUNT(ea.`id`), 0) * 100), 2
  ) AS `attendance_percentage`,
  SUM(CAST(COALESCE(ea.`overtime_hours`, 0) AS DECIMAL(5,2))) AS `total_overtime_hours`,
  MAX(ea.`attendance_date`) AS `last_attendance_date`,
  MAX(CASE WHEN ea.`status` = 'Present' OR ea.`status` = 'Late' THEN ea.`attendance_date` END) AS `last_present_date`
FROM `employee_onboarding` eo
LEFT JOIN `Employee_Attendance` ea ON eo.`id` = ea.`employee_id` 
  AND ea.`attendance_date` >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
WHERE eo.`status` != 'Inactive'
GROUP BY eo.`id`, eo.`name`, eo.`employee_id`;

-- ============================================================
-- VIEW: employee_performance_summary
-- Purpose: Performance metrics including reviews (goals removed)
-- ============================================================
CREATE OR REPLACE VIEW `employee_performance_summary` AS
SELECT 
  eo.`id`,
  eo.`name` AS `full_name`,
  eo.`employee_id`,
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
FROM `employee_onboarding` eo
LEFT JOIN `employee_profiles` ep ON eo.`id` = ep.`employee_id`
WHERE eo.`status` != 'Inactive';

-- ============================================================
-- End of Migration
-- ============================================================
