-- Migration: Add Employee Skills Table (Safe Version)
-- Created: 2026-02-03
-- Purpose: Store technical and soft skills for employees
-- Safety: Only adds missing columns/tables

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------

-- Step 1: Add missing JSON columns to employee_onboarding table
-- --------------------------------------------------------
-- Note: skills_json already exists, so only add the others if they don't exist

ALTER TABLE `employee_onboarding` ADD COLUMN IF NOT EXISTS `documents_json` JSON DEFAULT NULL COMMENT 'JSON field for documents storage';
ALTER TABLE `employee_onboarding` ADD COLUMN IF NOT EXISTS `resources_json` JSON DEFAULT NULL COMMENT 'JSON field for resources storage';
ALTER TABLE `employee_onboarding` ADD COLUMN IF NOT EXISTS `certifications_json` JSON DEFAULT NULL COMMENT 'JSON field for certifications storage';

-- --------------------------------------------------------

-- Step 2: Create employee_skills table (normalized structure for future enhancement)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_skills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `skill_name` varchar(255) NOT NULL,
  `skill_type` enum('technical', 'soft') NOT NULL DEFAULT 'technical' COMMENT 'Type of skill: technical or soft',
  `proficiency_level` enum('beginner', 'intermediate', 'expert') DEFAULT 'intermediate' COMMENT 'Optional proficiency level',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `skill_type` (`skill_type`),
  CONSTRAINT `employee_skills_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

-- Step 3: Index for faster queries
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS `idx_employee_skills_lookup` ON `employee_skills` (`employee_id`, `skill_type`);

-- --------------------------------------------------------

-- Step 4: Initialize JSON fields with empty structures (only if NULL)
-- --------------------------------------------------------
UPDATE `employee_onboarding` 
SET `skills_json` = JSON_OBJECT('technical', JSON_ARRAY(), 'soft', JSON_ARRAY())
WHERE `skills_json` IS NULL;

UPDATE `employee_onboarding` 
SET `documents_json` = JSON_ARRAY()
WHERE `documents_json` IS NULL;

UPDATE `employee_onboarding` 
SET `resources_json` = JSON_ARRAY()
WHERE `resources_json` IS NULL;

UPDATE `employee_onboarding` 
SET `certifications_json` = JSON_ARRAY()
WHERE `certifications_json` IS NULL;

-- --------------------------------------------------------

-- Step 5: Verification queries
-- --------------------------------------------------------
-- Verify all columns exist
SELECT 'Skills JSON column' as check_item, COUNT(*) as exists_count 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'employee_onboarding' AND COLUMN_NAME = 'skills_json';

SELECT 'Documents JSON column' as check_item, COUNT(*) as exists_count 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'employee_onboarding' AND COLUMN_NAME = 'documents_json';

SELECT 'Resources JSON column' as check_item, COUNT(*) as exists_count 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'employee_onboarding' AND COLUMN_NAME = 'resources_json';

SELECT 'Employee Skills table' as check_item, COUNT(*) as exists_count 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'employee_skills' AND TABLE_SCHEMA = DATABASE();

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
