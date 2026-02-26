-- =====================================================
-- Employee Checkout Missing Management System
-- =====================================================
-- This system automatically detects and manages employees who forget to check out
-- Created: February 16, 2026
-- =====================================================

-- =====================================================
-- Table: Employee_Checkout_Missing
-- Purpose: Store attendance records with missing checkouts for HR review
-- =====================================================
CREATE TABLE IF NOT EXISTS `Employee_Checkout_Missing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `original_attendance_id` int(11) NOT NULL COMMENT 'Reference to original Employee_Attendance record',
  `employee_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `attendance_date` date NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL COMMENT 'Will be NULL until HR sets it',
  `status` enum('Present','Absent','Late','On Leave','Half Day') DEFAULT 'Present',
  `total_breaks_taken` int(11) DEFAULT 0,
  `smoke_break_count` int(11) DEFAULT 0,
  `dinner_break_count` int(11) DEFAULT 0,
  `washroom_break_count` int(11) DEFAULT 0,
  `prayer_break_count` int(11) DEFAULT 0,
  `smoke_break_duration_minutes` int(11) DEFAULT 0,
  `dinner_break_duration_minutes` int(11) DEFAULT 0,
  `washroom_break_duration_minutes` int(11) DEFAULT 0,
  `prayer_break_duration_minutes` int(11) DEFAULT 0,
  `total_break_duration_minutes` int(11) DEFAULT 0,
  `gross_working_time_minutes` int(11) DEFAULT 0,
  `net_working_time_minutes` int(11) DEFAULT 0,
  `expected_working_time_minutes` int(11) DEFAULT 540,
  `overtime_minutes` int(11) DEFAULT 0,
  `overtime_hours` decimal(5,2) DEFAULT 0.00,
  `on_time` tinyint(1) DEFAULT 0,
  `late_by_minutes` int(11) DEFAULT 0,
  `remarks` text DEFAULT NULL COMMENT 'Original remarks from attendance',
  `device_info` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `missing_reason` varchar(255) DEFAULT 'Checkout Missing' COMMENT 'System-generated reason',
  `employee_explanation` text DEFAULT NULL COMMENT 'Employee explanation for missing checkout',
  `hr_notes` text DEFAULT NULL COMMENT 'HR notes and comments',
  `resolved_by` int(11) DEFAULT NULL COMMENT 'HR admin who resolved this',
  `resolved_at` timestamp NULL DEFAULT NULL COMMENT 'When HR resolved this',
  `is_resolved` tinyint(1) DEFAULT 0 COMMENT '0 = Pending, 1 = Resolved',
  `moved_from_attendance_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'When moved from Employee_Attendance',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_attendance_date` (`attendance_date`),
  KEY `idx_is_resolved` (`is_resolved`),
  KEY `idx_original_attendance_id` (`original_attendance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Manages employees who forgot to check out';

-- =====================================================
-- Stored Procedure: ProcessMissingCheckouts
-- Purpose: Automatically detect and move records with missing checkouts
-- Schedule: Run after 9:00 AM daily
-- =====================================================
DROP PROCEDURE IF EXISTS `ProcessMissingCheckouts`;

DELIMITER $$

CREATE PROCEDURE `ProcessMissingCheckouts`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_attendance_id INT;
    DECLARE v_employee_id INT;
    DECLARE v_email VARCHAR(100);
    DECLARE v_name VARCHAR(100);
    DECLARE v_attendance_date DATE;
    DECLARE v_check_in_time TIME;
    DECLARE v_check_out_time TIME;
    DECLARE v_status VARCHAR(50);
    DECLARE v_total_breaks INT;
    DECLARE v_smoke_break_count INT;
    DECLARE v_dinner_break_count INT;
    DECLARE v_washroom_break_count INT;
    DECLARE v_prayer_break_count INT;
    DECLARE v_smoke_break_duration INT;
    DECLARE v_dinner_break_duration INT;
    DECLARE v_washroom_break_duration INT;
    DECLARE v_prayer_break_duration INT;
    DECLARE v_total_break_duration INT;
    DECLARE v_gross_working_time INT;
    DECLARE v_net_working_time INT;
    DECLARE v_expected_working_time INT;
    DECLARE v_overtime_minutes INT;
    DECLARE v_overtime_hours DECIMAL(5,2);
    DECLARE v_on_time TINYINT;
    DECLARE v_late_by_minutes INT;
    DECLARE v_remarks TEXT;
    DECLARE v_device_info TEXT;
    DECLARE v_ip_address VARCHAR(50);
    DECLARE v_current_time TIME;
    DECLARE v_check_date DATE;
    DECLARE v_records_moved INT DEFAULT 0;

    -- Cursor to find all attendance records with missing checkouts
    -- Only check records from previous days (not today)
    DECLARE missing_checkout_cursor CURSOR FOR
        SELECT 
            id, employee_id, email, name, attendance_date,
            check_in_time, check_out_time, status,
            total_breaks_taken, smoke_break_count, dinner_break_count,
            washroom_break_count, prayer_break_count,
            smoke_break_duration_minutes, dinner_break_duration_minutes,
            washroom_break_duration_minutes, prayer_break_duration_minutes,
            total_break_duration_minutes, gross_working_time_minutes,
            net_working_time_minutes, expected_working_time_minutes,
            overtime_minutes, overtime_hours, on_time, late_by_minutes,
            remarks, device_info, ip_address
        FROM Employee_Attendance
        WHERE check_out_time IS NULL 
            AND check_in_time IS NOT NULL
            AND attendance_date < CURDATE()
            AND id NOT IN (SELECT original_attendance_id FROM Employee_Checkout_Missing);

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Get current time and date
    SET v_current_time = CURTIME();
    SET v_check_date = CURDATE();

    -- Start transaction
    START TRANSACTION;

    -- Log the process start
    INSERT INTO system_logs (log_type, log_message, created_at) 
    VALUES ('CHECKOUT_MISSING_PROCESS', CONCAT('Starting checkout missing process at ', NOW()), NOW())
    ON DUPLICATE KEY UPDATE log_message = VALUES(log_message);

    OPEN missing_checkout_cursor;

    read_loop: LOOP
        FETCH missing_checkout_cursor INTO 
            v_attendance_id, v_employee_id, v_email, v_name, v_attendance_date,
            v_check_in_time, v_check_out_time, v_status,
            v_total_breaks, v_smoke_break_count, v_dinner_break_count,
            v_washroom_break_count, v_prayer_break_count,
            v_smoke_break_duration, v_dinner_break_duration,
            v_washroom_break_duration, v_prayer_break_duration,
            v_total_break_duration, v_gross_working_time,
            v_net_working_time, v_expected_working_time,
            v_overtime_minutes, v_overtime_hours, v_on_time, v_late_by_minutes,
            v_remarks, v_device_info, v_ip_address;

        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Insert into Employee_Checkout_Missing table
        INSERT INTO Employee_Checkout_Missing (
            original_attendance_id, employee_id, email, name, attendance_date,
            check_in_time, check_out_time, status,
            total_breaks_taken, smoke_break_count, dinner_break_count,
            washroom_break_count, prayer_break_count,
            smoke_break_duration_minutes, dinner_break_duration_minutes,
            washroom_break_duration_minutes, prayer_break_duration_minutes,
            total_break_duration_minutes, gross_working_time_minutes,
            net_working_time_minutes, expected_working_time_minutes,
            overtime_minutes, overtime_hours, on_time, late_by_minutes,
            remarks, device_info, ip_address,
            missing_reason, is_resolved, moved_from_attendance_at
        ) VALUES (
            v_attendance_id, v_employee_id, v_email, v_name, v_attendance_date,
            v_check_in_time, NULL, v_status,
            v_total_breaks, v_smoke_break_count, v_dinner_break_count,
            v_washroom_break_count, v_prayer_break_count,
            v_smoke_break_duration, v_dinner_break_duration,
            v_washroom_break_duration, v_prayer_break_duration,
            v_total_break_duration, v_gross_working_time,
            v_net_working_time, v_expected_working_time,
            v_overtime_minutes, v_overtime_hours, v_on_time, v_late_by_minutes,
            v_remarks, v_device_info, v_ip_address,
            'Checkout Missing - Auto-detected by system', 0, NOW()
        );

        -- Delete from Employee_Attendance (move to checkout missing)
        DELETE FROM Employee_Attendance WHERE id = v_attendance_id;

        SET v_records_moved = v_records_moved + 1;

    END LOOP;

    CLOSE missing_checkout_cursor;

    -- Log the process completion
    INSERT INTO system_logs (log_type, log_message, created_at) 
    VALUES ('CHECKOUT_MISSING_PROCESS', CONCAT('Completed: Moved ', v_records_moved, ' records to checkout missing table'), NOW())
    ON DUPLICATE KEY UPDATE log_message = VALUES(log_message);

    COMMIT;

    -- Return summary
    SELECT v_records_moved AS records_moved, NOW() AS processed_at;

END$$

DELIMITER ;

-- =====================================================
-- Stored Procedure: ResolveCheckoutMissing
-- Purpose: Move resolved checkout-missing record back to Employee_Attendance
-- Parameters: 
--   - p_checkout_missing_id: ID from Employee_Checkout_Missing table
--   - p_check_out_time: Manual checkout time set by HR
--   - p_employee_explanation: Reason given by employee
--   - p_hr_notes: Notes from HR
--   - p_resolved_by: Admin ID who resolved this
-- =====================================================
DROP PROCEDURE IF EXISTS `ResolveCheckoutMissing`;

DELIMITER $$

CREATE PROCEDURE `ResolveCheckoutMissing`(
    IN p_checkout_missing_id INT,
    IN p_check_out_time TIME,
    IN p_employee_explanation TEXT,
    IN p_hr_notes TEXT,
    IN p_resolved_by INT
)
BEGIN
    DECLARE v_original_attendance_id INT;
    DECLARE v_employee_id INT;
    DECLARE v_email VARCHAR(100);
    DECLARE v_name VARCHAR(100);
    DECLARE v_attendance_date DATE;
    DECLARE v_check_in_time TIME;
    DECLARE v_status VARCHAR(50);
    DECLARE v_total_breaks INT;
    DECLARE v_smoke_break_count INT;
    DECLARE v_dinner_break_count INT;
    DECLARE v_washroom_break_count INT;
    DECLARE v_prayer_break_count INT;
    DECLARE v_smoke_break_duration INT;
    DECLARE v_dinner_break_duration INT;
    DECLARE v_washroom_break_duration INT;
    DECLARE v_prayer_break_duration INT;
    DECLARE v_total_break_duration INT;
    DECLARE v_expected_working_time INT;
    DECLARE v_on_time TINYINT;
    DECLARE v_late_by_minutes INT;
    DECLARE v_remarks TEXT;
    DECLARE v_device_info TEXT;
    DECLARE v_ip_address VARCHAR(50);
    DECLARE v_gross_working_time INT;
    DECLARE v_net_working_time INT;
    DECLARE v_overtime_minutes INT;
    DECLARE v_overtime_hours DECIMAL(5,2);

    START TRANSACTION;

    -- Get all data from Employee_Checkout_Missing
    SELECT 
        original_attendance_id, employee_id, email, name, attendance_date,
        check_in_time, status,
        total_breaks_taken, smoke_break_count, dinner_break_count,
        washroom_break_count, prayer_break_count,
        smoke_break_duration_minutes, dinner_break_duration_minutes,
        washroom_break_duration_minutes, prayer_break_duration_minutes,
        total_break_duration_minutes, expected_working_time_minutes,
        on_time, late_by_minutes, remarks, device_info, ip_address
    INTO 
        v_original_attendance_id, v_employee_id, v_email, v_name, v_attendance_date,
        v_check_in_time, v_status,
        v_total_breaks, v_smoke_break_count, v_dinner_break_count,
        v_washroom_break_count, v_prayer_break_count,
        v_smoke_break_duration, v_dinner_break_duration,
        v_washroom_break_duration, v_prayer_break_duration,
        v_total_break_duration, v_expected_working_time,
        v_on_time, v_late_by_minutes, v_remarks, v_device_info, v_ip_address
    FROM Employee_Checkout_Missing
    WHERE id = p_checkout_missing_id;

    -- Calculate working times
    SET v_gross_working_time = TIMESTAMPDIFF(MINUTE, 
        CONCAT(v_attendance_date, ' ', v_check_in_time), 
        CONCAT(v_attendance_date, ' ', p_check_out_time)
    );
    
    SET v_net_working_time = v_gross_working_time - v_total_break_duration;
    SET v_overtime_minutes = GREATEST(0, v_net_working_time - v_expected_working_time);
    SET v_overtime_hours = ROUND(v_overtime_minutes / 60, 2);

    -- Append HR notes to remarks
    SET v_remarks = CONCAT(
        IFNULL(v_remarks, ''), 
        '\n[HR RESOLVED - ', NOW(), '] Employee Explanation: ', IFNULL(p_employee_explanation, 'None provided'),
        '\nHR Notes: ', IFNULL(p_hr_notes, 'None'),
        '\nManual checkout time set: ', p_check_out_time
    );

    -- Insert/Update back to Employee_Attendance
    INSERT INTO Employee_Attendance (
        id, employee_id, email, name, attendance_date,
        check_in_time, check_out_time, status,
        total_breaks_taken, smoke_break_count, dinner_break_count,
        washroom_break_count, prayer_break_count,
        smoke_break_duration_minutes, dinner_break_duration_minutes,
        washroom_break_duration_minutes, prayer_break_duration_minutes,
        total_break_duration_minutes, gross_working_time_minutes,
        net_working_time_minutes, expected_working_time_minutes,
        overtime_minutes, overtime_hours, on_time, late_by_minutes,
        remarks, device_info, ip_address, updated_at
    ) VALUES (
        v_original_attendance_id, v_employee_id, v_email, v_name, v_attendance_date,
        v_check_in_time, p_check_out_time, v_status,
        v_total_breaks, v_smoke_break_count, v_dinner_break_count,
        v_washroom_break_count, v_prayer_break_count,
        v_smoke_break_duration, v_dinner_break_duration,
        v_washroom_break_duration, v_prayer_break_duration,
        v_total_break_duration, v_gross_working_time,
        v_net_working_time, v_expected_working_time,
        v_overtime_minutes, v_overtime_hours, v_on_time, v_late_by_minutes,
        v_remarks, v_device_info, v_ip_address, NOW()
    ) ON DUPLICATE KEY UPDATE
        check_out_time = p_check_out_time,
        gross_working_time_minutes = v_gross_working_time,
        net_working_time_minutes = v_net_working_time,
        overtime_minutes = v_overtime_minutes,
        overtime_hours = v_overtime_hours,
        remarks = v_remarks,
        updated_at = NOW();

    -- Mark as resolved in Employee_Checkout_Missing
    UPDATE Employee_Checkout_Missing
    SET 
        check_out_time = p_check_out_time,
        employee_explanation = p_employee_explanation,
        hr_notes = p_hr_notes,
        resolved_by = p_resolved_by,
        resolved_at = NOW(),
        is_resolved = 1,
        gross_working_time_minutes = v_gross_working_time,
        net_working_time_minutes = v_net_working_time,
        overtime_minutes = v_overtime_minutes,
        overtime_hours = v_overtime_hours,
        updated_at = NOW()
    WHERE id = p_checkout_missing_id;

    COMMIT;

    -- Return success message
    SELECT 
        'SUCCESS' AS status,
        p_checkout_missing_id AS checkout_missing_id,
        v_original_attendance_id AS attendance_id,
        v_employee_id AS employee_id,
        v_name AS employee_name,
        v_attendance_date AS attendance_date,
        p_check_out_time AS checkout_time_set,
        NOW() AS resolved_at;

END$$

DELIMITER ;

-- =====================================================
-- Create system_logs table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `log_type` varchar(100) NOT NULL,
  `log_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `log_type` (`log_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- End of Schema
-- =====================================================
