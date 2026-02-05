-- Migration: Social Links, Required Documents, and Achievements
-- Date: 2026-02-03
-- Purpose: Add support for social links, required documents, and achievements in employee profiles
-- This migration is idempotent and safe to re-run

USE Digious_CRM_DataBase;

-- Start transaction for atomicity
START TRANSACTION;

-- ============================================================================
-- 1. ADD JSON COLUMNS TO employee_onboarding TABLE
-- ============================================================================

-- Add social_links_json column (stores LinkedIn, GitHub, Portfolio, etc.)
ALTER TABLE employee_onboarding
ADD COLUMN IF NOT EXISTS social_links_json longtext NULL COMMENT 'JSON object containing social links (linkedin, github, portfolio, twitter, etc.)';

-- Add required_documents_json column (stores document metadata)
ALTER TABLE employee_onboarding
ADD COLUMN IF NOT EXISTS required_documents_json longtext NULL COMMENT 'JSON array of required documents with status';

-- Add achievements_json column (stores awards, certifications, publications)
ALTER TABLE employee_onboarding
ADD COLUMN IF NOT EXISTS achievements_json longtext NULL COMMENT 'JSON array of achievements with categories (award, certification, publication)';

-- ============================================================================
-- 2. CREATE SUPPORTING TABLES FOR NORMALIZED STORAGE
-- ============================================================================

-- Create employee_social_links table (normalized storage)
CREATE TABLE IF NOT EXISTS employee_social_links (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_id INT(11) NOT NULL,
    platform VARCHAR(50) NOT NULL COMMENT 'e.g., linkedin, github, portfolio, twitter, facebook, instagram',
    url VARCHAR(500) NOT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_employee_id (employee_id),
    KEY idx_platform (platform),
    UNIQUE KEY unique_employee_platform (employee_id, platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create employee_required_documents table (normalized storage)
CREATE TABLE IF NOT EXISTS employee_required_documents (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_id INT(11) NOT NULL,
    document_type VARCHAR(100) NOT NULL COMMENT 'e.g., cnic, passport, diploma, resume, reference_letter',
    document_name VARCHAR(255) NOT NULL,
    document_url VARCHAR(500),
    status ENUM('pending', 'submitted', 'verified', 'rejected') DEFAULT 'pending',
    expiry_date DATE,
    notes TEXT,
    uploaded_at TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by INT(11),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_employee_id (employee_id),
    KEY idx_document_type (document_type),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create employee_achievements table (normalized storage)
CREATE TABLE IF NOT EXISTS employee_achievements (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_id INT(11) NOT NULL,
    achievement_type ENUM('award', 'certification', 'publication', 'recognition', 'project') DEFAULT 'award' COMMENT 'Type of achievement',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issuer_organization VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(255),
    credential_url VARCHAR(500),
    attachment_url VARCHAR(500),
    is_verified TINYINT(1) DEFAULT 0,
    visibility ENUM('public', 'private', 'restricted') DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_employee_id (employee_id),
    KEY idx_achievement_type (achievement_type),
    KEY idx_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Optimize queries on employee_onboarding
ALTER TABLE employee_onboarding 
ADD INDEX IF NOT EXISTS idx_social_links_json (social_links_json(100)),
ADD INDEX IF NOT EXISTS idx_required_documents_json (required_documents_json(100)),
ADD INDEX IF NOT EXISTS idx_achievements_json (achievements_json(100));

-- ============================================================================
-- 4. INITIALIZE JSON COLUMNS WITH EMPTY STRUCTURES
-- ============================================================================

-- Update existing records with default empty JSON structures
UPDATE employee_onboarding 
SET social_links_json = JSON_OBJECT(
    'linkedin', '',
    'github', '',
    'portfolio', '',
    'twitter', '',
    'facebook', '',
    'instagram', '',
    'other_links', JSON_ARRAY()
)
WHERE social_links_json IS NULL;

UPDATE employee_onboarding 
SET required_documents_json = JSON_ARRAY(
    JSON_OBJECT(
        'id', 1,
        'type', 'cnic',
        'name', 'CNIC',
        'status', 'pending',
        'uploaded_at', NULL,
        'url', ''
    ),
    JSON_OBJECT(
        'id', 2,
        'type', 'passport',
        'name', 'Passport',
        'status', 'pending',
        'uploaded_at', NULL,
        'url', ''
    ),
    JSON_OBJECT(
        'id', 3,
        'type', 'diploma',
        'name', 'Educational Diploma',
        'status', 'pending',
        'uploaded_at', NULL,
        'url', ''
    ),
    JSON_OBJECT(
        'id', 4,
        'type', 'resume',
        'name', 'Resume/CV',
        'status', 'pending',
        'uploaded_at', NULL,
        'url', ''
    ),
    JSON_OBJECT(
        'id', 5,
        'type', 'reference_letter',
        'name', 'Reference Letter',
        'status', 'pending',
        'uploaded_at', NULL,
        'url', ''
    )
)
WHERE required_documents_json IS NULL;

UPDATE employee_onboarding 
SET achievements_json = JSON_ARRAY()
WHERE achievements_json IS NULL;

-- ============================================================================
-- 5. VERIFICATION QUERIES (Non-breaking - shows migration status)
-- ============================================================================

SELECT 'Verification Results' AS 'Migration Status';

-- Verify columns were added
SELECT 
    'Social Links JSON column' AS check_item,
    COUNT(*) AS exists_count
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='employee_onboarding' 
AND TABLE_SCHEMA='Digious_CRM_DataBase' 
AND COLUMN_NAME='social_links_json';

SELECT 
    'Required Documents JSON column' AS check_item,
    COUNT(*) AS exists_count
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='employee_onboarding' 
AND TABLE_SCHEMA='Digious_CRM_DataBase' 
AND COLUMN_NAME='required_documents_json';

SELECT 
    'Achievements JSON column' AS check_item,
    COUNT(*) AS exists_count
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='employee_onboarding' 
AND TABLE_SCHEMA='Digious_CRM_DataBase' 
AND COLUMN_NAME='achievements_json';

-- Verify tables were created
SELECT 
    'Social Links table' AS check_item,
    COUNT(*) AS exists_count
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME='employee_social_links' 
AND TABLE_SCHEMA='Digious_CRM_DataBase';

SELECT 
    'Required Documents table' AS check_item,
    COUNT(*) AS exists_count
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME='employee_required_documents' 
AND TABLE_SCHEMA='Digious_CRM_DataBase';

SELECT 
    'Achievements table' AS check_item,
    COUNT(*) AS exists_count
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME='employee_achievements' 
AND TABLE_SCHEMA='Digious_CRM_DataBase';

-- Verify indexes were created
SELECT 
    'Performance indexes' AS check_item,
    COUNT(*) AS index_count
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_NAME='employee_onboarding' 
AND TABLE_SCHEMA='Digious_CRM_DataBase' 
AND INDEX_NAME IN ('idx_social_links_json', 'idx_required_documents_json', 'idx_achievements_json');

COMMIT;

-- Migration complete
SELECT 'Migration completed successfully!' AS status;
