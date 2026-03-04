-- Migration: 003_payroll_records.sql
-- Description: Create payroll_records table for storing monthly payroll data
-- Date: 2026-02-28

CREATE TABLE IF NOT EXISTS `payroll_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL COMMENT 'FK to employee_onboarding.id',
  `month` int(2) NOT NULL COMMENT '1-12',
  `year` int(4) NOT NULL,
  `base_salary` decimal(12,2) NOT NULL DEFAULT 0.00,
  `daily_rate` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'base_salary / 30',
  `total_allowances` decimal(12,2) DEFAULT 0.00,
  `working_days` int(11) DEFAULT 30,
  `present_days` int(11) DEFAULT 0,
  `absent_days` int(11) DEFAULT 0,
  `late_days` int(11) DEFAULT 0,
  `leave_days` int(11) DEFAULT 0,
  `half_days` int(11) DEFAULT 0,
  `paid_leave_days` int(11) DEFAULT 0,
  `late_deduction_days` int(11) DEFAULT 0 COMMENT 'floor(late_days / 2) — every 2 lates = 1 day deduction',
  `absent_deduction` decimal(12,2) DEFAULT 0.00,
  `late_deduction` decimal(12,2) DEFAULT 0.00,
  `leave_deduction` decimal(12,2) DEFAULT 0.00,
  `total_deductions` decimal(12,2) DEFAULT 0.00,
  `gross_salary` decimal(12,2) DEFAULT 0.00 COMMENT 'base_salary + total_allowances',
  `net_salary` decimal(12,2) DEFAULT 0.00 COMMENT 'gross_salary - total_deductions',
  `status` enum('pending','processing','success','failed') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_month` (`employee_id`, `month`, `year`),
  KEY `idx_month_year` (`month`, `year`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



ALTER TABLE payroll_records 
  ADD COLUMN pay_period_start DATE NULL AFTER year,
  ADD COLUMN pay_period_end DATE NULL AFTER pay_period_start,
  ADD COLUMN days_in_month INT DEFAULT 30 AFTER pay_period_end,
  ADD COLUMN issue_date DATE NULL AFTER days_in_month