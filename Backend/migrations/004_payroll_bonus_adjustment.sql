-- Migration: Add bonus and adjustment columns to payroll_records
-- Date: 2025-01-XX
-- Description: Adds bonus, adjustment, and adjustment_reason fields
--   bonus: Extra amount paid to employee (added to net salary)
--   adjustment: Correction/extra amount (can be positive or negative, added to net salary)
--   adjustment_reason: Free text explaining the adjustment

ALTER TABLE payroll_records
  ADD COLUMN bonus DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER gross_salary,
  ADD COLUMN adjustment DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER bonus,
  ADD COLUMN adjustment_reason TEXT DEFAULT NULL AFTER adjustment;

-- Update net_salary for any existing records (should be 0 impact since defaults are 0)
-- UPDATE payroll_records SET net_salary = gross_salary + bonus + adjustment - total_deductions WHERE 1=1;
