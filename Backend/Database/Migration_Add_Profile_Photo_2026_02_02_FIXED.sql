-- ============================================================
-- Migration: Add Profile Photo Support
-- Date: 2026-02-02
-- Description: Add profile_photo column to employee tables for
--              Cloudinary profile picture storage
-- ============================================================

-- Add profile_photo column to employee_onboarding table
ALTER TABLE `employee_onboarding`
ADD COLUMN `profile_photo` varchar(1000) DEFAULT NULL COMMENT 'Cloudinary URL for employee profile photo' AFTER `dob`;

-- Add profile_photo column to employee_profiles table (if table exists)
ALTER TABLE `employee_profiles`
ADD COLUMN `profile_photo` varchar(1000) DEFAULT NULL COMMENT 'Cloudinary URL for employee profile photo' AFTER `banner_url`;

-- Create indexes for profile_photo for faster lookups
ALTER TABLE `employee_onboarding`
ADD INDEX `idx_profile_photo` (`profile_photo`);

ALTER TABLE `employee_profiles`
ADD INDEX `idx_profile_photo` (`profile_photo`);

-- End of Migration
