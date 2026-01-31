-- Migration: Create separate CNIC and Date of Birth tracking table
-- Date: January 30, 2026
-- Purpose: Maintain detailed CNIC issue/expiry dates and date of birth separately from employee_onboarding

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Create CNIC Documents table for tracking CNIC details separately
CREATE TABLE IF NOT EXISTS `employee_cnic_documents` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `employee_id` INT(11) NOT NULL,
  `cnic_number` VARCHAR(20) NOT NULL COMMENT 'CNIC number (e.g., 12345-6789012-3)',
  `date_of_birth` DATE DEFAULT NULL COMMENT 'Employee date of birth (YYYY-MM-DD)',
  `cnic_issue_date` DATE NOT NULL COMMENT 'CNIC issue date (YYYY-MM-DD)',
  `cnic_expiry_date` DATE NOT NULL COMMENT 'CNIC expiry date (YYYY-MM-DD)',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Flag to mark document as active/inactive',
  `document_status` ENUM('Valid', 'Expired', 'Pending', 'Archived') DEFAULT 'Valid' COMMENT 'Current status of CNIC',
  `notes` TEXT DEFAULT NULL COMMENT 'Additional notes about the document',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_cnic` (`employee_id`, `cnic_number`),
  FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_cnic_expiry` (`cnic_expiry_date`),
  INDEX `idx_document_status` (`document_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add dob (date_of_birth) column to employee_onboarding if not exists
ALTER TABLE `employee_onboarding`
ADD COLUMN IF NOT EXISTS `date_of_birth` DATE DEFAULT NULL AFTER `cnic_expiry_date`;

-- Create trigger to update document_status based on expiry date
CREATE TRIGGER IF NOT EXISTS `update_cnic_status_on_insert`
AFTER INSERT ON `employee_cnic_documents`
FOR EACH ROW
BEGIN
    UPDATE `employee_cnic_documents`
    SET `document_status` = IF(NEW.`cnic_expiry_date` < CURDATE(), 'Expired', 'Valid')
    WHERE `id` = NEW.`id`;
END;

-- Create trigger to update document_status on update
CREATE TRIGGER IF NOT EXISTS `update_cnic_status_on_update`
BEFORE UPDATE ON `employee_cnic_documents`
FOR EACH ROW
BEGIN
    IF NEW.`cnic_expiry_date` IS NOT NULL THEN
        SET NEW.`document_status` = IF(NEW.`cnic_expiry_date` < CURDATE(), 'Expired', 'Valid');
    END IF;
END;

-- Commit transaction
COMMIT;

-- Optional: Migrate existing CNIC data from employee_onboarding to employee_cnic_documents
-- Uncomment the following if you want to migrate historical data
/*
INSERT IGNORE INTO `employee_cnic_documents` 
(`employee_id`, `cnic_number`, `cnic_issue_date`, `cnic_expiry_date`, `document_status`, `created_at`, `updated_at`)
SELECT 
  `id`,
  `cnic`,
  `cnic_issue_date`,
  `cnic_expiry_date`,
  IF(`cnic_expiry_date` < CURDATE(), 'Expired', 'Valid'),
  `created_at`,
  `updated_at`
FROM `employee_onboarding`
WHERE `cnic` IS NOT NULL AND `cnic_issue_date` IS NOT NULL AND `cnic_expiry_date` IS NOT NULL;
*/
