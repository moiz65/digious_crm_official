-- Migration: Create sales_targets table
-- Date: 2026-03-17
-- Purpose: Store monthly sales targets set by admin for Sales department employees
-- Notes: 
--   - achieved is auto-calculated from sales.upfront_payment SUM for that employee+month+year
--   - remaining = monthly_target - achieved (can be negative if employee exceeds target)
--   - Admin can also manually set achieved_override to override auto-calculation

CREATE TABLE IF NOT EXISTS `sales_targets` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `employee_id` INT(11) NOT NULL COMMENT 'FK to employee_onboarding.id',
  `month` TINYINT(2) NOT NULL COMMENT 'Month (1-12)',
  `year` SMALLINT(4) NOT NULL COMMENT 'Year (e.g. 2026)',
  `monthly_target` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Target amount set by admin',
  `achieved_override` DECIMAL(12,2) DEFAULT NULL COMMENT 'Manual override for achieved amount (NULL = auto-calc from sales)',
  `notes` TEXT DEFAULT NULL COMMENT 'Admin notes about the target',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_month_year` (`employee_id`, `month`, `year`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_month_year` (`month`, `year`),
  CONSTRAINT `fk_sales_targets_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
