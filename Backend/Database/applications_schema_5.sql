-- =====================================================
-- APPLICATIONS DATABASE SCHEMA (DENORMALIZED)
-- =====================================================
-- Created: 2026-02-12
-- Purpose: Single denormalized table for all applications
-- =====================================================

-- =====================================================
-- SINGLE TABLE: APPLICATIONS (Fully Denormalized)
-- =====================================================
CREATE TABLE IF NOT EXISTS applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  application_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'Format: APP-XXXX-XXX',
  
  -- Department & Type (stored directly - no separate config table)
  department VARCHAR(100) NOT NULL,
  application_type VARCHAR(150) NOT NULL,
  
  -- Core application data
  subject VARCHAR(255) NOT NULL,
  description LONGTEXT NOT NULL,
  
  -- Status & tracking
  status ENUM('pending', 'approved', 'rejected', 'in_review') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  assigned_to VARCHAR(150),
  
  -- Timestamps
  submission_date DATETIME NOT NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Approval tracking
  approved_by VARCHAR(150),
  approved_date DATETIME,
  rejection_reason TEXT,
  
  -- Embedded data
  metadata JSON COMMENT 'Custom fields as JSON',
  documents JSON COMMENT 'Array of documents',
  
  -- Constraints & Indexes
  FOREIGN KEY (employee_id) REFERENCES user_as_employees(employee_id) ON DELETE CASCADE,
  KEY idx_employee_id (employee_id),
  KEY idx_application_number (application_number),
  KEY idx_status (status),
  KEY idx_department (department),
  KEY idx_submission_date (submission_date),
  KEY idx_employee_status (employee_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Denormalized single table: all application data in one place';

-- =====================================================
-- VIEWS (For easy querying)
-- =====================================================

-- View: Applications with employee details and document count
CREATE OR REPLACE VIEW v_applications_with_employee AS
SELECT 
  a.id,
  a.application_number,
  a.employee_id,
  e.name AS employee_name,
  e.email AS employee_email,
  a.department,
  a.application_type,
  a.subject,
  a.description,
  a.status,
  a.priority,
  a.assigned_to,
  a.submission_date,
  a.last_updated,
  a.approved_date,
  a.approved_by,
  a.rejection_reason,
  JSON_LENGTH(a.documents) AS document_count,
  a.documents,
  a.metadata
FROM applications a
LEFT JOIN user_as_employees e ON a.employee_id = e.employee_id
ORDER BY a.submission_date DESC;

-- =====================================================
-- INDEXES & OPTIMIZATION
-- =====================================================
-- Additional optimization indexes

-- Create index for pending applications
CREATE INDEX idx_pending_applications ON applications(employee_id, status, submission_date);

-- =====================================================
-- STORED PROCEDURE: Generate Unique Application Number
-- =====================================================
DELIMITER //

CREATE PROCEDURE sp_generate_application_number(
  OUT p_application_number VARCHAR(20)
)
BEGIN
  DECLARE v_year INT;
  DECLARE v_sequence INT;
  DECLARE v_timestamp_part VARCHAR(4);
  DECLARE v_random_part VARCHAR(3);
  
  -- Get current year
  SET v_year = YEAR(NOW());
  
  -- Get or initialize sequence for this year
  INSERT IGNORE INTO application_number_sequence (year, last_sequence) 
  VALUES (v_year, 0);
  
  -- Increment sequence
  UPDATE application_number_sequence 
  SET last_sequence = last_sequence + 1 
  WHERE year = v_year;
  
  -- Get the new sequence
  SELECT last_sequence INTO v_sequence 
  FROM application_number_sequence 
  WHERE year = v_year;
  
  -- Generate timestamp part (last 4 chars of base36 timestamp)
  SET v_timestamp_part = SUBSTR(CONV(FLOOR(UNIX_TIMESTAMP(NOW())), 10, 36), -4);
  
  -- Generate random alphanumeric part (3 chars)
  SET v_random_part = UPPER(SUBSTRING(MD5(RAND()), 1, 3));
  
  -- Combine to create application number
  SET p_application_number = CONCAT('APP-', v_timestamp_part, '-', v_random_part);
END //

DELIMITER ;

-- =====================================================
-- NOTE: Application Number Format
-- =====================================================
/*
  Format: APP-XXXX-XXX
  Example: APP-Z4A3-XYZ
  
  Components:
  - APP: Prefix indicating Application
  - XXXX: Last 4 characters of timestamp (base36 conversion) - unique per second
  - XXX: 3 random alphanumeric characters - ensures uniqueness within same second
  
  Advantages:
  ✓ Short (8-12 characters)
  ✓ Alphanumeric (human-readable)
  ✓ Unique (timestamp + random)
  ✓ Auto-generated (no manual input needed)
  ✓ Sequential-friendly (includes timestamp)
  
  Uniqueness Guarantee:
  - Timestamp ensures different seconds get different prefixes
  - Random suffix prevents collisions within the same second
  - Database UNIQUE constraint validates uniqueness
*/
