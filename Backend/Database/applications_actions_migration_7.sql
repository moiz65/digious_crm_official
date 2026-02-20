-- =====================================================
-- Applications Actions & Status Migration
-- Date: 2026-02-16
-- Description: Adds withdraw functionality and approval notes
-- =====================================================

USE Digious_CRM_DataBase;

-- Step 1: Modify status enum to include 'withdrawn' and 'in-progress'
-- This changes the existing enum to support new statuses
ALTER TABLE applications 
  MODIFY COLUMN status enum('pending','approved','rejected','in_review','in-progress','withdrawn') DEFAULT 'pending';

-- Step 2: Add approval_notes column for storing HR approval notes
ALTER TABLE applications 
  ADD COLUMN approval_notes TEXT DEFAULT NULL AFTER approved_date;

-- Step 3: Add indexes for better performance on new queries
CREATE INDEX idx_status_withdrawn ON applications(status);

-- Step 4: Verify the changes
DESCRIBE applications;

-- Step 5: Confirmation message
SELECT 'Applications Actions Migration completed successfully!' AS status,
       'New statuses: pending, approved, rejected, in_review, in-progress, withdrawn' AS changes,
       'New column: approval_notes' AS additions;
