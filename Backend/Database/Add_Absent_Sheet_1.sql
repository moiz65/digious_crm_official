-- Active: 1767355687894@@localhost@3306@Digious_CRM_DataBase
-- ========================================================================
-- DIGIOUS CRM - EMPLOYEE ABSENT SHEET SCHEMA
-- Description: Schema for tracking employee absences with automatic logic
-- Date Created: Feb 10, 2026
-- ========================================================================

-- ============================================================
-- TABLE 1: Employee_Absent
-- Purpose: Store absence records for employees
-- ============================================================

CREATE TABLE IF NOT EXISTS `Employee_Absent` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `absent_date` date NOT NULL,
  `reason_type` enum('No Check-in','Leave','Medical','Sick','Other') DEFAULT 'No Check-in' COMMENT 'Structured reason category',
  `reason` text DEFAULT NULL COMMENT 'Detailed reason text; supports paragraphs',
  `supporting_document_url` varchar(1000) DEFAULT NULL COMMENT 'Link to supporting document (e.g., sick note, leave form)',
  `is_approved` tinyint(1) DEFAULT 0 COMMENT '0 = Pending, 1 = Approved by Admin || HR',
  `approved_by` int(11) DEFAULT NULL COMMENT 'Admin ID who approved the absence',
  `approved_at` timestamp NULL DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `absent_date` (`absent_date`),
  KEY `email` (`email`),
  KEY `reason_type` (`reason_type`),
  UNIQUE KEY `unique_employee_date` (`employee_id`, `absent_date`),
  FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROCEDURE: ProcessDailyAbsences
-- Purpose: Automatically check for missing check-ins and mark as absent
-- Execution: Should be run once daily (via cron or scheduled task)
-- Parameters: @check_date (the date to check, defaults to TODAY)
-- NOTE: If you see error #1558 about mysql.proc, run the MariaDB upgrade steps before creating procedures (see notes at bottom).
-- ============================================================

DROP PROCEDURE IF EXISTS `ProcessDailyAbsences`;
DELIMITER $$

CREATE PROCEDURE `ProcessDailyAbsences`()
BEGIN
    DECLARE check_date DATE;
    DECLARE done INT DEFAULT FALSE;
    DECLARE emp_id INT;
    DECLARE emp_email VARCHAR(100);
    DECLARE emp_name VARCHAR(100);
    
    DECLARE emp_cursor CURSOR FOR
        SELECT DISTINCT id, email, name 
        FROM employee_onboarding 
        WHERE status = 'Active';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Set check_date to today (can be customized)
    SET check_date = CURDATE();
    
    -- Only process past dates (not future dates)
    IF check_date > CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot process future dates for absences';
    END IF;
    
    OPEN emp_cursor;
    
    read_loop: LOOP
        FETCH emp_cursor INTO emp_id, emp_email, emp_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Check if employee has NO check-in record for this date
        IF NOT EXISTS (
            SELECT 1 FROM Employee_Attendance 
            WHERE employee_id = emp_id 
            AND attendance_date = check_date
        ) THEN
            
            -- Check if absence record already exists for this date
            IF NOT EXISTS (
                SELECT 1 FROM Employee_Absent 
                WHERE employee_id = emp_id 
                AND absent_date = check_date
            ) THEN
                
                -- Insert new absence record
                INSERT INTO Employee_Absent 
                (employee_id, email, name, absent_date, reason_type, reason, is_approved, remarks) 
                VALUES 
                (emp_id, emp_email, emp_name, check_date, 'No Check-in', 'Automatically marked - No check-in record found', 0, 'Automatically marked - No check-in record found');
                
            END IF;
        END IF;
    END LOOP;
    
    CLOSE emp_cursor;
    
END$$

DELIMITER ;