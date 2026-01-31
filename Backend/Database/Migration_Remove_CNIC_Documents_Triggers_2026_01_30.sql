-- Migration: Remove CNIC document triggers and table
-- Purpose: The application now treats `employee_onboarding` as the single source of truth for CNIC/DOB.
-- This migration safely drops the database triggers that referenced the (now optional) table
-- `employee_cnic_documents` and removes the table itself if present. It is idempotent.

-- Drop triggers created by prior migrations (if they exist)
DROP TRIGGER IF EXISTS `after_employee_insert_cnic`;
DROP TRIGGER IF EXISTS `after_employee_update_cnic`;
DROP TRIGGER IF EXISTS `after_employee_delete_cnic`;

-- Drop the documents table if it still exists
DROP TABLE IF EXISTS `employee_cnic_documents`;

-- Optional: cleanup related objects (indexes, procedures) - none known at this time.

-- Migration applied on: 2026-01-30
-- Author: Automated fix via assistant
