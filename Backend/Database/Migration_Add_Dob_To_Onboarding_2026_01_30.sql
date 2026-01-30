-- Migration: Add DOB to employee_onboarding and sync to employee_cnic_documents
-- Date: 2026-01-30

-- 1) Add `dob` column to employee_onboarding (if not exists)
ALTER TABLE `employee_onboarding`
  ADD COLUMN IF NOT EXISTS `dob` DATE DEFAULT NULL COMMENT 'Date of birth (YYYY-MM-DD)';

-- 2) Drop existing CNIC triggers (if they exist) and recreate them to include date_of_birth
DROP TRIGGER IF EXISTS `after_employee_insert_cnic`;
DROP TRIGGER IF EXISTS `after_employee_update_cnic`;

DELIMITER $$
CREATE TRIGGER `after_employee_insert_cnic` AFTER INSERT ON `employee_onboarding` FOR EACH ROW
BEGIN
  INSERT INTO `employee_cnic_documents` (
    `employee_id`,
    `cnic_number`,
    `cnic_issue_date`,
    `cnic_expiry_date`,
    `date_of_birth`,
    `document_status`
  ) VALUES (
    NEW.id,
    NEW.cnic,
    NEW.cnic_issue_date,
    NEW.cnic_expiry_date,
    NEW.dob,
    CASE 
      WHEN NEW.cnic_expiry_date IS NULL THEN 'Invalid'
      WHEN NEW.cnic_expiry_date < CURDATE() THEN 'Expired'
      ELSE 'Valid'
    END
  );
END$$

CREATE TRIGGER `after_employee_update_cnic` AFTER UPDATE ON `employee_onboarding` FOR EACH ROW
BEGIN
  UPDATE `employee_cnic_documents` 
  SET 
    `cnic_number` = NEW.cnic,
    `cnic_issue_date` = NEW.cnic_issue_date,
    `cnic_expiry_date` = NEW.cnic_expiry_date,
    `date_of_birth` = NEW.dob,
    `document_status` = CASE 
      WHEN NEW.cnic_expiry_date IS NULL THEN 'Invalid'
      WHEN NEW.cnic_expiry_date < CURDATE() THEN 'Expired'
      ELSE 'Valid'
    END,
    `updated_at` = NOW()
  WHERE `employee_id` = NEW.id;
END$$
DELIMITER ;

-- 3) Backfill date_of_birth into employee_cnic_documents from employee_onboarding
UPDATE employee_cnic_documents cd
JOIN employee_onboarding eo ON cd.employee_id = eo.id
SET cd.date_of_birth = eo.dob
WHERE eo.dob IS NOT NULL;
