-- =====================================================
-- Applications Assignment & CC Migration
-- Date: 2026-02-16
-- Description: Adds assignment and CC functionality to applications table
-- =====================================================

USE Digious_CRM_DataBase;

-- Add assignment columns to applications table
ALTER TABLE applications 
  ADD COLUMN assigned_to_employee_id INT DEFAULT NULL AFTER assigned_to,
  ADD COLUMN cc_department VARCHAR(100) DEFAULT NULL AFTER assigned_to_employee_id;

-- Add foreign key constraint (optional, for referential integrity)
-- Note: Only enable if you want to enforce that assigned employees must exist
-- ALTER TABLE applications 
--   ADD CONSTRAINT fk_assigned_employee 
--   FOREIGN KEY (assigned_to_employee_id) 
--   REFERENCES user_as_employees(employee_id) 
--   ON DELETE SET NULL 
--   ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_assigned_to_employee ON applications(assigned_to_employee_id);
CREATE INDEX idx_cc_department ON applications(cc_department);

-- Verify the changes
DESCRIBE applications;

SELECT 'Migration completed successfully!' AS status;
