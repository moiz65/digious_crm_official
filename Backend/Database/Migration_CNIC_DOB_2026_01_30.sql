-- Migration: CNIC Documents and DOB Tracking
-- Date: 2026-01-30
-- Purpose: Create separate table for CNIC issue/expiry dates and date of birth tracking
-- This improves data normalization and allows for better document management

-- ============================================================
-- Table: employee_cnic_documents
-- ============================================================
-- Stores CNIC-related documents and date of birth for employees
-- Links to employee_onboarding via employee_id (foreign key)

CREATE TABLE IF NOT EXISTS `employee_cnic_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `cnic_number` varchar(20) DEFAULT NULL COMMENT 'CNIC number format: XXXXX-XXXXXXX-X',
  `cnic_issue_date` date DEFAULT NULL COMMENT 'CNIC issue date in YYYY-MM-DD format',
  `cnic_expiry_date` date DEFAULT NULL COMMENT 'CNIC expiry date in YYYY-MM-DD format',
  `date_of_birth` date DEFAULT NULL COMMENT 'Employee date of birth in YYYY-MM-DD format',
  `document_status` enum('Valid','Expired','Pending','Invalid') DEFAULT 'Valid' COMMENT 'Status of CNIC document',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_id` (`employee_id`),
  KEY `idx_cnic_number` (`cnic_number`),
  KEY `idx_cnic_expiry_date` (`cnic_expiry_date`),
  KEY `idx_date_of_birth` (`date_of_birth`),
  CONSTRAINT `fk_employee_cnic_documents` FOREIGN KEY (`employee_id`) 
    REFERENCES `employee_onboarding` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Trigger: after_employee_insert_cnic
-- ============================================================
-- Automatically creates CNIC document record when employee is created
DELIMITER $$
CREATE TRIGGER `after_employee_insert_cnic` AFTER INSERT ON `employee_onboarding` FOR EACH ROW
BEGIN
  INSERT INTO `employee_cnic_documents` (
    `employee_id`,
    `cnic_number`,
    `cnic_issue_date`,
    `cnic_expiry_date`,
    `document_status`
  ) VALUES (
    NEW.id,
    NEW.cnic,
    NEW.cnic_issue_date,
    NEW.cnic_expiry_date,
    CASE 
      WHEN NEW.cnic_expiry_date IS NULL THEN 'Invalid'
      WHEN NEW.cnic_expiry_date < CURDATE() THEN 'Expired'
      ELSE 'Valid'
    END
  );
END$$
DELIMITER ;

-- ============================================================
-- Trigger: after_employee_update_cnic
-- ============================================================
-- Updates CNIC document record when employee CNIC info is updated
DELIMITER $$
CREATE TRIGGER `after_employee_update_cnic` AFTER UPDATE ON `employee_onboarding` FOR EACH ROW
BEGIN
  UPDATE `employee_cnic_documents` 
  SET 
    `cnic_number` = NEW.cnic,
    `cnic_issue_date` = NEW.cnic_issue_date,
    `cnic_expiry_date` = NEW.cnic_expiry_date,
    `document_status` = CASE 
      WHEN NEW.cnic_expiry_date IS NULL THEN 'Invalid'
      WHEN NEW.cnic_expiry_date < CURDATE() THEN 'Expired'
      ELSE 'Valid'
    END,
    `updated_at` = NOW()
  WHERE `employee_id` = NEW.id;
END$$
DELIMITER ;

-- ============================================================
-- Notes and Comments
-- ============================================================
-- 1. The employee_onboarding table RETAINS cnic_issue_date and cnic_expiry_date 
--    for backward compatibility
-- 2. The new employee_cnic_documents table provides normalized storage for
--    CNIC-related information
-- 3. Foreign key constraint ensures referential integrity
-- 4. Triggers automatically keep both tables in sync
-- 5. document_status field helps track CNIC validity (Valid/Expired/Pending/Invalid)
-- 6. Index on cnic_expiry_date allows efficient queries for expiring documents
