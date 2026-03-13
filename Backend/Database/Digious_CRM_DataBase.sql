-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 12, 2026 at 10:01 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `Digious_CRM_DataBase`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `PopulateEmployeeLeaves` ()   BEGIN
    DECLARE emp_id INT;
    DECLARE emp_email VARCHAR(255);
    DECLARE emp_name VARCHAR(255);
    DECLARE done INT DEFAULT FALSE;
    
    DECLARE emp_cursor CURSOR FOR
        SELECT id, email, name 
        FROM employee_onboarding;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Open cursor and loop through all employees
    OPEN emp_cursor;
    
    read_loop: LOOP
        FETCH emp_cursor INTO emp_id, emp_email, emp_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Check if employee already exists in employee_leaves table
        IF NOT EXISTS (
            SELECT 1 FROM employee_leaves 
            WHERE employee_id = emp_id
        ) THEN
            -- Insert new employee with default leave allocations
            INSERT INTO employee_leaves 
            (employee_id, email, name, casual_leaves_used, casual_leaves_total, 
             sick_leaves_used, sick_leaves_total, annual_leaves_used, annual_leaves_total, remarks)
            VALUES 
            (emp_id, emp_email, emp_name, 0, 8, 0, 8, 0, 12, 'Auto-populated from employee_onboarding');
        END IF;
    END LOOP;
    
    CLOSE emp_cursor;
    
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ProcessDailyAbsences` ()   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `ProcessMissingCheckouts` ()   BEGIN
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

    
    SET v_current_time = CURTIME();
    SET v_check_date = CURDATE();

    
    START TRANSACTION;

    
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

        
        DELETE FROM Employee_Attendance WHERE id = v_attendance_id;

        SET v_records_moved = v_records_moved + 1;

    END LOOP;

    CLOSE missing_checkout_cursor;

    
    INSERT INTO system_logs (log_type, log_message, created_at) 
    VALUES ('CHECKOUT_MISSING_PROCESS', CONCAT('Completed: Moved ', v_records_moved, ' records to checkout missing table'), NOW())
    ON DUPLICATE KEY UPDATE log_message = VALUES(log_message);

    COMMIT;

    
    SELECT v_records_moved AS records_moved, NOW() AS processed_at;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ResolveCheckoutMissing` (IN `p_checkout_missing_id` INT, IN `p_check_out_time` TIME, IN `p_employee_explanation` TEXT, IN `p_hr_notes` TEXT, IN `p_resolved_by` INT)   BEGIN
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

    
    SET v_gross_working_time = TIMESTAMPDIFF(MINUTE, 
        CONCAT(v_attendance_date, ' ', v_check_in_time), 
        CONCAT(v_attendance_date, ' ', p_check_out_time)
    );
    
    SET v_net_working_time = v_gross_working_time - v_total_break_duration;
    SET v_overtime_minutes = GREATEST(0, v_net_working_time - v_expected_working_time);
    SET v_overtime_hours = ROUND(v_overtime_minutes / 60, 2);

    
    SET v_remarks = CONCAT(
        IFNULL(v_remarks, ''), 
        '\n[HR RESOLVED - ', NOW(), '] Employee Explanation: ', IFNULL(p_employee_explanation, 'None provided'),
        '\nHR Notes: ', IFNULL(p_hr_notes, 'None'),
        '\nManual checkout time set: ', p_check_out_time
    );

    
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_generate_application_number` (OUT `p_application_number` VARCHAR(20))   BEGIN
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
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `active_users_view`
-- (See below for the actual view)
--
CREATE TABLE `active_users_view` (
`id` int(11)
,`employee_id` int(11)
,`email` varchar(255)
,`name` varchar(255)
,`login_time` timestamp
,`device_type` enum('PC','Mobile','Tablet','Other')
,`device_name` varchar(255)
,`ip_address` varchar(45)
,`hostname` varchar(255)
,`mac_address` varchar(17)
,`browser` varchar(100)
,`os` varchar(100)
,`country` varchar(100)
,`city` varchar(100)
,`last_activity_time` timestamp
,`logged_in_minutes` bigint(21)
,`is_active` tinyint(1)
);

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','super_admin') NOT NULL DEFAULT 'admin',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `email`, `password`, `full_name`, `phone`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin@digious.com', '$2a$12$Tdc/e2C9kf.GOIVDwS0HQ.GIqPNlmfjL.R5wImzRWSHniZO1eKDUa', 'Administrator', '03100000000', 'super_admin', 'Active', '2025-12-28 16:04:33', '2025-12-29 17:06:53');

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `application_number` varchar(20) NOT NULL COMMENT 'Format: APP-XXXX-XXX',
  `department` varchar(100) NOT NULL,
  `application_type` varchar(150) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` longtext NOT NULL,
  `status` enum('pending','approved','rejected','in_review','in-progress','withdrawn') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `assigned_to` varchar(150) DEFAULT NULL,
  `assigned_to_employee_id` int(11) DEFAULT NULL,
  `current_step` int(11) DEFAULT 0 COMMENT 'Current step in approval chain (0=not started, 1=first assignee, etc.)',
  `total_steps` int(11) DEFAULT 0 COMMENT 'Total number of assignees in the chain',
  `is_multi_assign` tinyint(1) DEFAULT 0 COMMENT 'Whether this application has multi-assignee chain',
  `cc_department` varchar(100) DEFAULT NULL,
  `submission_date` datetime NOT NULL,
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approved_by` varchar(150) DEFAULT NULL,
  `approved_date` datetime DEFAULT NULL,
  `approval_notes` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Custom fields as JSON' CHECK (json_valid(`metadata`)),
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of documents' CHECK (json_valid(`documents`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Denormalized single table: all application data in one place';

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `employee_id`, `application_number`, `department`, `application_type`, `subject`, `description`, `status`, `priority`, `assigned_to`, `assigned_to_employee_id`, `current_step`, `total_steps`, `is_multi_assign`, `cc_department`, `submission_date`, `last_updated`, `created_at`, `updated_at`, `approved_by`, `approved_date`, `approval_notes`, `rejection_reason`, `metadata`, `documents`) VALUES
(2, 44, 'APP-QX71-XHW', 'Operations', 'Equipment Request', 'Equipment Request', 'this i stest', 'pending', 'medium', NULL, NULL, 0, 0, 0, NULL, '2026-02-12 22:09:02', '2026-02-12 22:09:02', '2026-02-12 22:09:02', '2026-02-12 22:09:02', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 44, 'APP-6BWB-6TI', 'HR', 'Remote Work Request', 'Remote Work Request', 'this is another test', 'pending', 'medium', NULL, NULL, 0, 0, 0, NULL, '2026-02-13 01:36:59', '2026-02-13 01:36:59', '2026-02-13 01:36:59', '2026-02-13 01:36:59', NULL, NULL, NULL, NULL, NULL, NULL),
(4, 44, 'APP-N04U-X4Q', 'HR', 'Annual Leave Request', 'Annual Leave Request', 'njjnfje', 'pending', 'medium', NULL, NULL, 0, 0, 0, NULL, '2026-02-13 23:17:39', '2026-02-13 23:17:39', '2026-02-13 23:17:39', '2026-02-13 23:17:39', NULL, NULL, NULL, NULL, NULL, NULL),
(5, 44, 'APP-7FMS-QXL', 'Productions', 'Production Report', 'Production Report', 'this is personal assign with CC of HR', 'pending', 'medium', 'Abdul Moiz Khan', 44, 1, 1, 0, 'HR', '2026-02-16 17:20:38', '2026-02-18 17:50:17', '2026-02-16 17:20:38', '2026-02-18 17:50:17', NULL, NULL, NULL, NULL, NULL, NULL),
(6, 44, 'APP-BFDV-5HY', 'Productions', 'Raw Material Request', 'Raw Material Request', 'this is whole department mail ', 'pending', 'medium', NULL, NULL, 0, 0, 0, 'HR', '2026-02-16 17:23:44', '2026-02-16 17:23:44', '2026-02-16 17:23:44', '2026-02-16 17:23:44', NULL, NULL, NULL, NULL, NULL, NULL),
(7, 44, 'APP-E1BA-ZFF', 'HR', 'Remote Work Request', 'Remote Work Request', 'this is HR Request ', 'pending', 'medium', 'Muhammad Hamza Hassan', 27, 1, 1, 0, NULL, '2026-02-16 17:25:46', '2026-02-18 19:30:18', '2026-02-16 17:25:46', '2026-02-18 19:30:18', NULL, NULL, NULL, NULL, NULL, NULL),
(8, 44, 'APP-4HJA-9UN', 'Productions', 'Machine Maintenance', 'Machine Maintenance', 'xyz', 'pending', 'medium', 'Abdul Moiz Khan', 44, 1, 1, 0, 'HR', '2026-02-16 23:22:16', '2026-02-18 17:50:17', '2026-02-16 23:22:16', '2026-02-18 17:50:17', NULL, NULL, NULL, NULL, NULL, NULL),
(9, 44, 'APP-8PQK-7MW', 'Productions', 'Raw Material Request', 'Raw Material Request', 'this is test', 'in-progress', 'high', 'Abdul Moiz Khan', 44, 2, 2, 1, 'HR', '2026-02-18 18:20:57', '2026-02-18 19:14:32', '2026-02-18 18:20:57', '2026-02-18 19:14:32', NULL, NULL, NULL, NULL, NULL, NULL),
(10, 56, 'APP-DLC2-AL8', 'Operations', 'Equipment Request', 'Equipment Request', 'this is testg', 'pending', 'medium', 'Abdul Moiz Khan', 44, 1, 1, 1, 'HR', '2026-02-18 19:48:44', '2026-02-18 19:48:44', '2026-02-18 19:48:44', '2026-02-18 19:48:44', NULL, NULL, NULL, NULL, NULL, NULL),
(11, 44, 'APP-498X-3K1', 'Operations', 'Safety Equipment Request', 'Safety Equipment Request', 'nbnbn', 'in-progress', 'medium', 'Muhammad Hunain', 56, 2, 3, 1, 'HR', '2026-02-18 22:57:26', '2026-02-18 22:58:06', '2026-02-18 22:57:26', '2026-02-18 22:58:06', NULL, NULL, NULL, NULL, NULL, NULL),
(12, 56, 'APP-9OG8-LCO', 'Productions', 'For leave ', 'For leave ', 'demo testing', 'approved', 'urgent', 'Abdul Moiz Khan', 44, 2, 1, 1, 'HR', '2026-02-18 23:01:39', '2026-02-18 23:06:15', '2026-02-18 23:01:39', '2026-02-18 23:06:15', 'Muhammad Hamza Hassan', '2026-02-18 23:06:15', NULL, NULL, NULL, NULL),
(13, 44, 'APP-RUCY-09W', 'HR', 'Missing Checkout', 'Missing Checkout', 'i was present forgot to check out ', 'approved', 'medium', 'Muhammad Hamza Hassan', 27, 2, 1, 1, NULL, '2026-02-19 19:47:29', '2026-02-19 23:37:38', '2026-02-19 19:47:29', '2026-02-19 23:37:38', 'Muhammad Hamza Hassan', '2026-02-19 19:48:15', NULL, NULL, '{\"adjustment_resolved\":true,\"adjustment_resolved_at\":\"2026-02-19T18:37:38.218Z\",\"adjustment_resolved_by\":27,\"resolution_notes\":\"resolved \"}', NULL),
(14, 56, 'APP-QHXE-J2X', 'HR', 'Adjustment of Absent in Leaves ', 'Adjustment of Absent in Leaves ', 'this is test', 'approved', 'medium', 'Muhammad Hamza Hassan', 27, 2, 1, 1, NULL, '2026-02-20 18:10:08', '2026-02-20 18:18:10', '2026-02-20 18:10:08', '2026-02-20 18:18:10', 'Muhammad Hamza Hassan', '2026-02-20 18:11:07', NULL, NULL, '{\"adjustment_resolved\":true,\"adjustment_resolved_at\":\"2026-02-20T13:18:10.629Z\",\"adjustment_resolved_by\":27,\"resolution_notes\":\"\"}', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `application_approval_log`
--

CREATE TABLE `application_approval_log` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `employee_name` varchar(150) NOT NULL,
  `action` enum('approved','rejected','forwarded','withdrawn','assigned','reassigned') NOT NULL,
  `step_order` int(11) DEFAULT NULL COMMENT 'Which step in the chain this action was for',
  `notes` text DEFAULT NULL COMMENT 'Approval notes, rejection reason, etc.',
  `action_date` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Full audit trail for all application approval actions';

--
-- Dumping data for table `application_approval_log`
--

INSERT INTO `application_approval_log` (`id`, `application_id`, `employee_id`, `employee_name`, `action`, `step_order`, `notes`, `action_date`, `created_at`) VALUES
(1, 9, 44, 'Abdul Moiz Khan', 'assigned', 1, 'Assigned as step 1 approver', '2026-02-18 18:20:57', '2026-02-18 18:20:57'),
(2, 9, 39, 'Muhammad Hamza', 'assigned', 2, 'Assigned as step 2 approver', '2026-02-18 18:20:57', '2026-02-18 18:20:57'),
(3, 9, 44, 'Abdul Moiz Khan', 'approved', 1, NULL, '2026-02-18 19:12:25', '2026-02-18 19:12:25'),
(4, 9, 44, 'Abdul Moiz Khan', 'forwarded', 2, 'Forwarded to Muhammad Hamza', '2026-02-18 19:12:25', '2026-02-18 19:12:25'),
(6, 10, 44, 'Abdul Moiz Khan', 'assigned', 1, 'Assigned as step 1 approver', '2026-02-18 19:48:44', '2026-02-18 19:48:44'),
(7, 11, 56, 'Muhammad Hunain', 'assigned', 1, 'Assigned as step 1 approver', '2026-02-18 22:57:26', '2026-02-18 22:57:26'),
(8, 11, 41, 'Muhammad Baqar', 'assigned', 2, 'Assigned as step 2 approver', '2026-02-18 22:57:26', '2026-02-18 22:57:26'),
(9, 11, 35, 'Muhammad Taha', 'assigned', 3, 'Assigned as step 3 approver', '2026-02-18 22:57:26', '2026-02-18 22:57:26'),
(10, 11, 56, 'Muhammad Hunain', 'approved', 1, NULL, '2026-02-18 22:58:06', '2026-02-18 22:58:06'),
(11, 11, 56, 'Muhammad Hunain', 'forwarded', 2, 'Forwarded to Muhammad Baqar', '2026-02-18 22:58:06', '2026-02-18 22:58:06'),
(12, 12, 44, 'Abdul Moiz Khan', 'assigned', 1, 'Assigned as step 1 approver', '2026-02-18 23:01:39', '2026-02-18 23:01:39'),
(13, 12, 44, 'Abdul Moiz Khan', 'approved', 1, NULL, '2026-02-18 23:04:00', '2026-02-18 23:04:00'),
(14, 12, 44, 'Abdul Moiz Khan', 'forwarded', 2, 'All assignees approved. Awaiting HR final approval.', '2026-02-18 23:04:00', '2026-02-18 23:04:00'),
(15, 12, 27, 'Muhammad Hamza Hassan', 'approved', 2, 'HR Final Approval: Approved', '2026-02-18 23:06:15', '2026-02-18 23:06:15'),
(16, 13, 27, 'Muhammad Hamza Hassan', 'assigned', 1, 'Assigned as step 1 approver', '2026-02-19 19:47:29', '2026-02-19 19:47:29'),
(17, 13, 27, 'Muhammad Hamza Hassan', 'approved', 1, NULL, '2026-02-19 19:48:15', '2026-02-19 19:48:15'),
(18, 14, 27, 'Muhammad Hamza Hassan', 'assigned', 1, 'Assigned as step 1 approver', '2026-02-20 18:10:08', '2026-02-20 18:10:08'),
(19, 14, 27, 'Muhammad Hamza Hassan', 'approved', 1, NULL, '2026-02-20 18:11:07', '2026-02-20 18:11:07');

-- --------------------------------------------------------

--
-- Table structure for table `application_assignees`
--

CREATE TABLE `application_assignees` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `employee_name` varchar(150) NOT NULL,
  `step_order` int(11) NOT NULL DEFAULT 1 COMMENT 'Priority order in approval chain (1=first, 2=second, etc.)',
  `status` enum('pending','approved','rejected','skipped') DEFAULT 'pending' COMMENT 'Status of this assignee step',
  `action_date` datetime DEFAULT NULL COMMENT 'When the action was taken',
  `notes` text DEFAULT NULL COMMENT 'Notes from the assignee during approval/rejection',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Multiple assignees per application with sequential approval chain';

--
-- Dumping data for table `application_assignees`
--

INSERT INTO `application_assignees` (`id`, `application_id`, `employee_id`, `employee_name`, `step_order`, `status`, `action_date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 5, 44, 'Abdul Moiz Khan', 1, 'pending', NULL, NULL, '2026-02-16 17:20:38', '2026-02-18 17:50:17'),
(2, 7, 27, 'Muhammad Hamza Hassan', 1, 'pending', NULL, 'Budget constraints - not approved for this quarter', '2026-02-16 17:25:46', '2026-02-18 19:30:18'),
(3, 8, 44, 'Abdul Moiz Khan', 1, 'pending', NULL, NULL, '2026-02-16 23:22:16', '2026-02-18 17:50:17'),
(4, 9, 44, 'Abdul Moiz Khan', 1, 'approved', '2026-02-18 19:12:25', NULL, '2026-02-18 18:20:57', '2026-02-18 19:12:25'),
(5, 9, 39, 'Muhammad Hamza', 2, 'pending', NULL, NULL, '2026-02-18 18:20:57', '2026-02-18 18:20:57'),
(6, 10, 44, 'Abdul Moiz Khan', 1, 'pending', NULL, NULL, '2026-02-18 19:48:44', '2026-02-18 19:48:44'),
(7, 11, 56, 'Muhammad Hunain', 1, 'approved', '2026-02-18 22:58:06', NULL, '2026-02-18 22:57:26', '2026-02-18 22:58:06'),
(8, 11, 41, 'Muhammad Baqar', 2, 'pending', NULL, NULL, '2026-02-18 22:57:26', '2026-02-18 22:57:26'),
(9, 11, 35, 'Muhammad Taha', 3, 'pending', NULL, NULL, '2026-02-18 22:57:26', '2026-02-18 22:57:26'),
(10, 12, 44, 'Abdul Moiz Khan', 1, 'approved', '2026-02-18 23:04:00', NULL, '2026-02-18 23:01:39', '2026-02-18 23:04:00'),
(11, 13, 27, 'Muhammad Hamza Hassan', 1, 'approved', '2026-02-19 19:48:15', NULL, '2026-02-19 19:47:29', '2026-02-19 19:48:15'),
(12, 14, 27, 'Muhammad Hamza Hassan', 1, 'approved', '2026-02-20 18:11:07', NULL, '2026-02-20 18:10:08', '2026-02-20 18:11:07');

-- --------------------------------------------------------

--
-- Stand-in structure for view `Attendance_Summary_View`
-- (See below for the actual view)
--
CREATE TABLE `Attendance_Summary_View` (
`employee_id` int(11)
,`name` varchar(100)
,`email` varchar(100)
,`attendance_date` date
,`check_in_time` time
,`check_out_time` time
,`status` enum('Present','Absent','Late','On Leave','Half Day','Paid Leave','Uninformed Absent')
,`total_breaks_taken` int(11)
,`total_break_duration_minutes` int(11)
,`gross_working_time` varchar(26)
,`net_working_time` varchar(26)
,`overtime_hours` decimal(5,2)
,`on_time` tinyint(1)
,`late_by_minutes` int(11)
,`created_at` timestamp
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `Company_Rules`
--

CREATE TABLE `Company_Rules` (
  `id` int(11) NOT NULL,
  `rule_name` varchar(100) NOT NULL,
  `rule_type` enum('WORKING_HOURS','BREAK_TIME','OVERTIME','LEAVE') NOT NULL,
  `description` text DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `total_hours` int(11) DEFAULT NULL,
  `break_duration_minutes` int(11) DEFAULT NULL,
  `break_type` varchar(50) DEFAULT NULL,
  `overtime_starts_after_minutes` int(11) DEFAULT NULL,
  `overtime_multiplier` decimal(3,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `priority` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Company_Rules`
--

INSERT INTO `Company_Rules` (`id`, `rule_name`, `rule_type`, `description`, `start_time`, `end_time`, `total_hours`, `break_duration_minutes`, `break_type`, `overtime_starts_after_minutes`, `overtime_multiplier`, `is_active`, `priority`, `created_at`, `updated_at`) VALUES
(1, 'Office Working Hours - Night Shift', 'WORKING_HOURS', 'Office working hours from 21:00 (9 PM) to 06:00 (6 AM)', '21:00:00', '06:00:00', 9, NULL, NULL, NULL, NULL, 1, 1, '2025-12-23 16:25:46', '2025-12-23 16:25:46'),
(2, 'Smoke Break', 'BREAK_TIME', 'Smoke break allowed during working hours', NULL, NULL, NULL, 5, 'Smoke Break', NULL, NULL, 1, 2, '2025-12-23 16:25:46', '2025-12-23 16:25:46'),
(3, 'Dinner Break', 'BREAK_TIME', 'Dinner/Lunch break during working hours', NULL, NULL, NULL, 60, 'Dinner Break', NULL, NULL, 1, 2, '2025-12-23 16:25:46', '2025-12-23 16:25:46'),
(4, 'Washroom Break', 'BREAK_TIME', 'Washroom/Restroom break', NULL, NULL, NULL, 10, 'Washroom Break', NULL, NULL, 1, 3, '2025-12-23 16:25:46', '2025-12-23 16:25:46'),
(5, 'Prayer Break', 'BREAK_TIME', 'Prayer break during working hours', NULL, NULL, NULL, 10, 'Prayer Break', NULL, NULL, 1, 3, '2025-12-23 16:25:46', '2025-12-23 16:25:46'),
(6, 'Overtime - Standard Rate', 'OVERTIME', 'Overtime payment after regular working hours (9 hours)', NULL, NULL, NULL, NULL, NULL, 540, 1.50, 1, 4, '2025-12-23 16:25:46', '2025-12-23 16:25:46');

-- --------------------------------------------------------

--
-- Table structure for table `Employee_Absent`
--

CREATE TABLE `Employee_Absent` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `absent_date` date NOT NULL,
  `reason_type` enum('No Check-in','Leave','Medical','Sick','Other','Paid Leave') DEFAULT 'No Check-in' COMMENT 'Structured reason category',
  `reason` text DEFAULT NULL COMMENT 'Detailed reason text; supports paragraphs',
  `supporting_document_url` varchar(1000) DEFAULT NULL COMMENT 'Link to supporting document (e.g., sick note, leave form)',
  `is_approved` tinyint(1) DEFAULT 0 COMMENT '0 = Pending, 1 = Approved by Admin || HR',
  `approved_by` int(11) DEFAULT NULL COMMENT 'Admin ID who approved the absence',
  `approved_at` timestamp NULL DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `leave_type_key` enum('casual','sick','annual','paid_leave') DEFAULT NULL COMMENT 'Leave type if this absence is being counted against a leave quota',
  `application_id` int(11) DEFAULT NULL COMMENT 'FK to applications table if this absence relates to an application'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Employee_Absent`
--

INSERT INTO `Employee_Absent` (`id`, `employee_id`, `email`, `name`, `absent_date`, `reason_type`, `reason`, `supporting_document_url`, `is_approved`, `approved_by`, `approved_at`, `remarks`, `created_at`, `updated_at`, `leave_type_key`, `application_id`) VALUES
(1, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-10', 'No Check-in', 'Auto-generated: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-10 19:34:00', '2026-02-10 19:34:00', NULL, NULL),
(2, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-10', 'No Check-in', 'Auto-generated: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-10 19:34:00', '2026-02-10 19:34:00', NULL, NULL),
(3, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-10', 'No Check-in', 'Auto-generated: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-10 19:34:00', '2026-02-10 19:34:00', NULL, NULL),
(4, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-10', 'No Check-in', 'Auto-generated: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-10 19:34:00', '2026-02-10 19:34:00', NULL, NULL),
(5, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-10', 'No Check-in', 'Auto-generated: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-10 19:34:00', '2026-02-10 19:34:00', NULL, NULL),
(6, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-10', 'No Check-in', 'Auto-generated: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-10 19:34:00', '2026-02-10 19:34:00', NULL, NULL),
(7, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-10', 'No Check-in', 'Auto-generated: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-10 19:34:00', '2026-02-10 19:34:00', NULL, NULL),
(8, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-10', 'No Check-in', 'Auto-generated: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-10 19:34:00', '2026-02-10 19:34:00', NULL, NULL),
(9, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(10, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(11, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(12, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(13, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(14, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(15, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(16, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(17, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(18, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(19, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(20, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(21, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(22, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(23, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(24, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(25, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(27, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(28, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(29, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(30, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-11', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(32, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(33, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(34, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(35, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(36, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(37, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(38, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(39, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(40, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(41, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(42, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(43, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(44, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(45, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(46, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(47, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(48, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(49, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(50, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(51, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 11:32:43', '2026-02-12 11:32:43', NULL, NULL),
(53, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(54, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(55, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(56, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(57, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(58, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(59, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(60, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(61, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(62, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(63, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(64, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(65, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(66, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(67, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(68, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(70, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(71, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(72, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(73, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-13', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 20:52:50', '2026-02-12 20:52:50', NULL, NULL),
(74, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-12', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-12 21:16:59', '2026-02-12 21:16:59', NULL, NULL),
(76, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(77, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(78, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(79, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(80, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(81, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(82, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(83, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(84, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(85, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(86, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(87, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(88, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(89, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(90, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(91, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(92, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(93, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(94, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(95, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(96, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(97, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(98, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-15', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(100, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(101, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(102, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(103, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(104, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(105, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(106, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(107, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(108, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(109, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(110, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(111, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(112, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(113, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(114, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:09', '2026-02-16 08:55:09', NULL, NULL),
(115, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:10', '2026-02-16 08:55:10', NULL, NULL),
(117, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:10', '2026-02-16 08:55:10', NULL, NULL),
(118, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:10', '2026-02-16 08:55:10', NULL, NULL),
(119, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:10', '2026-02-16 08:55:10', NULL, NULL),
(120, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:10', '2026-02-16 08:55:10', NULL, NULL),
(121, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-16', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-16 08:55:10', '2026-02-16 08:55:10', NULL, NULL),
(122, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(123, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(124, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(125, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(126, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(127, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(128, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(129, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(130, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(131, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(132, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(133, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(134, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(135, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(136, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(137, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(138, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(139, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(140, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(141, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(142, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(143, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(144, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(146, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(147, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(148, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(149, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(150, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(151, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(152, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(153, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(154, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(155, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(156, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(157, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(158, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(159, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(160, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(161, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(163, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(164, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(165, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(166, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(167, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-18', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 12:27:34', '2026-02-18 12:27:34', NULL, NULL),
(168, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-17', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-18 17:57:58', '2026-02-18 17:57:58', NULL, NULL),
(169, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(170, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(171, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(172, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(173, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(174, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(175, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(176, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(177, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(178, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(179, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(180, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(181, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(182, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(183, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(184, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(185, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(186, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(187, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(188, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(189, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(190, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(191, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-19', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-19 05:34:05', '2026-02-19 05:34:05', NULL, NULL),
(193, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:44', '2026-02-20 10:15:44', NULL, NULL),
(194, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:44', '2026-02-20 10:15:44', NULL, NULL),
(195, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:44', '2026-02-20 10:15:44', NULL, NULL),
(196, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:44', '2026-02-20 10:15:44', NULL, NULL),
(197, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:44', '2026-02-20 10:15:44', NULL, NULL),
(198, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:44', '2026-02-20 10:15:44', NULL, NULL),
(199, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:44', '2026-02-20 10:15:44', NULL, NULL),
(200, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(201, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(202, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(203, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(204, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(205, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(206, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(207, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(208, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(209, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL);
INSERT INTO `Employee_Absent` (`id`, `employee_id`, `email`, `name`, `absent_date`, `reason_type`, `reason`, `supporting_document_url`, `is_approved`, `approved_by`, `approved_at`, `remarks`, `created_at`, `updated_at`, `leave_type_key`, `application_id`) VALUES
(210, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(211, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(212, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(213, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(214, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(215, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-20', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-20 10:15:45', '2026-02-20 10:15:45', NULL, NULL),
(217, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(218, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(219, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(220, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(221, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(222, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(223, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(224, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(225, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(226, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(227, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(228, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(229, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(230, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(231, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(232, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(233, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(234, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(235, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(236, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:41', '2026-02-26 17:24:41', NULL, NULL),
(237, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(238, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(239, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(240, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-25', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(241, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(242, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(243, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(244, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(245, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(246, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(247, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(248, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(249, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(250, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(251, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(252, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(253, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(254, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(255, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(256, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(257, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(258, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(259, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(260, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(261, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(262, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(263, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(264, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-26', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 17:24:42', '2026-02-26 17:24:42', NULL, NULL),
(265, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(266, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(267, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(268, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(269, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(270, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(271, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(272, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(273, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(274, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(275, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(276, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(277, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(278, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(279, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(280, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(281, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(282, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(283, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(284, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(285, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(286, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(287, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(288, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-27', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-26 19:12:33', '2026-02-26 19:12:33', NULL, NULL),
(289, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(290, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(291, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(292, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(293, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(294, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(295, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(296, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(297, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(298, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(299, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(300, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(301, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(302, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(303, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(304, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(305, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(306, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(307, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(308, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(309, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(310, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(311, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(312, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-28', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 14:55:20', '2026-02-28 14:55:20', NULL, NULL),
(313, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:51', '2026-02-28 19:08:51', NULL, NULL),
(314, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:51', '2026-02-28 19:08:51', NULL, NULL),
(315, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:51', '2026-02-28 19:08:51', NULL, NULL),
(316, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:51', '2026-02-28 19:08:51', NULL, NULL),
(317, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:51', '2026-02-28 19:08:51', NULL, NULL),
(318, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:51', '2026-02-28 19:08:51', NULL, NULL),
(319, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:51', '2026-02-28 19:08:51', NULL, NULL),
(320, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:51', '2026-02-28 19:08:51', NULL, NULL),
(321, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:51', '2026-02-28 19:08:51', NULL, NULL),
(322, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(323, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(324, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(325, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(326, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(327, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(328, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(329, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(330, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(331, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(332, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(333, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(334, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(335, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(336, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-01', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-02-28 19:08:52', '2026-02-28 19:08:52', NULL, NULL),
(337, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(338, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(339, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(340, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(341, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(342, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(343, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(344, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(345, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(346, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(347, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(348, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(349, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(350, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(351, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(352, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(353, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(354, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(355, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(356, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(357, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(358, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(359, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(360, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-02', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-02 18:28:48', '2026-03-02 18:28:48', NULL, NULL),
(361, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(362, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(363, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(364, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(365, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(366, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(367, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(368, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(369, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(370, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(371, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(372, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(373, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(374, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(375, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(376, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(377, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(378, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(379, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(380, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:49', '2026-03-03 16:57:49', NULL, NULL),
(381, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:50', '2026-03-03 16:57:50', NULL, NULL),
(382, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:50', '2026-03-03 16:57:50', NULL, NULL),
(383, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:50', '2026-03-03 16:57:50', NULL, NULL),
(384, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-03', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-03 16:57:50', '2026-03-03 16:57:50', NULL, NULL),
(385, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(386, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(387, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(388, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(389, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(390, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(391, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(392, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(393, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(394, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(395, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(396, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(397, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(398, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(399, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(400, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(401, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(402, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(403, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(404, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(405, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(406, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(407, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL),
(408, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-04', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-04 17:39:21', '2026-03-04 17:39:21', NULL, NULL);
INSERT INTO `Employee_Absent` (`id`, `employee_id`, `email`, `name`, `absent_date`, `reason_type`, `reason`, `supporting_document_url`, `is_approved`, `approved_by`, `approved_at`, `remarks`, `created_at`, `updated_at`, `leave_type_key`, `application_id`) VALUES
(409, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(410, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(411, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(412, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(413, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(414, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(415, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(416, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(417, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(418, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(419, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(420, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(421, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(422, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(423, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(424, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(425, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(426, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(427, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(428, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(429, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(430, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(431, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(432, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-05', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(433, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(434, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(435, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(436, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(437, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(438, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(439, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(440, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(441, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(442, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(443, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(444, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(445, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(446, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(447, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(448, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(449, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(450, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(451, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(452, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(453, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(454, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(455, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(456, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-06', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-06 18:08:36', '2026-03-06 18:08:36', NULL, NULL),
(457, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(458, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(459, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(460, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(461, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(462, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(463, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(464, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(465, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(466, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(467, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(468, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(469, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(470, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(471, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(472, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(473, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(474, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(475, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(476, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(477, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(478, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(479, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(480, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-08', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(481, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(482, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(483, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(484, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(485, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(486, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(487, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(488, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(489, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(490, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(491, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(492, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(493, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(494, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(495, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(496, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(497, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(498, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(499, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(500, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(501, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(502, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(503, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(504, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-09', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-09 07:01:21', '2026-03-09 07:01:21', NULL, NULL),
(505, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(506, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-29', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(507, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-03', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(508, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-05', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(509, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(510, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(511, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(512, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-18', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(513, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(514, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(515, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(516, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(517, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(518, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-27', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(519, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(520, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(521, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(522, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(523, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(524, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(525, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(526, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-19', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(527, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-20', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(528, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(529, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-22', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(530, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(531, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(532, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-26', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(533, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-27', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(534, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-28', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(535, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-29', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(536, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-30', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(537, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-31', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(538, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-02', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(539, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-03', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(540, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-04', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(541, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-05', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(542, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-06', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(543, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(544, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(545, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(546, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(547, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(548, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(549, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(550, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(551, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(552, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(553, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-30', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(554, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-31', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(555, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-02', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(556, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-03', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(557, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-04', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(558, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-05', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(559, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-06', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(560, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(561, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(562, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(563, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(564, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(565, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(566, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(567, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(568, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-31', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(569, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-05', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(570, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(571, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(572, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(573, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(574, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(575, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(576, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(577, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(578, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(579, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(580, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(581, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(582, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(583, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(584, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-19', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(585, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(586, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(587, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(588, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(589, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(590, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL);
INSERT INTO `Employee_Absent` (`id`, `employee_id`, `email`, `name`, `absent_date`, `reason_type`, `reason`, `supporting_document_url`, `is_approved`, `approved_by`, `approved_at`, `remarks`, `created_at`, `updated_at`, `leave_type_key`, `application_id`) VALUES
(591, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(592, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-19', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(593, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-22', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(594, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(595, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(596, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(597, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(598, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(599, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(600, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(601, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-26', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(602, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(603, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(604, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(605, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(606, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(607, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(608, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(609, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-17', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(610, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-05', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(611, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(612, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(613, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(614, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(615, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(616, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(617, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(618, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(619, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(620, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(621, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(622, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(623, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(624, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(625, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-03', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(626, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(627, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(628, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(629, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(630, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(631, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(632, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(633, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-28', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(634, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(635, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(636, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(637, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(638, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(639, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(640, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(641, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(642, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-17', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(643, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(644, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(645, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(646, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(647, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(648, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(649, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(650, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(651, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-29', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(652, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(653, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(654, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(655, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(656, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(657, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(658, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(659, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-19', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(660, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-26', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(661, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-27', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(662, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-28', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(663, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-30', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(664, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(665, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(666, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(667, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(668, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(669, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(670, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(671, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(672, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-17', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(673, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-19', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(674, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-20', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(675, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(676, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-22', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(677, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(678, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(679, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-26', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(680, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-27', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(681, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-28', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(682, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-29', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(683, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-30', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(684, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-01-31', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(685, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-02', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(686, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-03', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(687, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-04', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(688, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-05', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(689, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-06', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(690, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(691, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(692, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(693, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(694, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(695, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(696, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(697, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-17', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(698, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(699, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(700, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-26', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(701, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(702, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-13', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(703, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(704, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(705, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(706, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(707, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(708, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(709, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(710, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(711, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(712, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(713, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(714, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(715, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(716, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(717, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-31', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(718, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(719, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(720, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(721, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(722, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(723, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(724, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(725, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(726, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(727, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(728, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(729, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(730, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(731, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(732, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(733, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(734, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-17', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(735, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-19', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(736, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-20', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(737, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(738, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-22', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(739, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(740, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(741, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-26', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(742, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-27', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(743, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-28', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(744, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-29', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(745, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-30', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(746, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-01-31', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(747, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-02', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(748, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-03', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(749, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-04', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(750, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-05', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(751, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-06', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(752, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(753, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(754, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(755, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(756, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(757, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(758, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(759, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-05', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(760, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-06', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL);
INSERT INTO `Employee_Absent` (`id`, `employee_id`, `email`, `name`, `absent_date`, `reason_type`, `reason`, `supporting_document_url`, `is_approved`, `approved_by`, `approved_at`, `remarks`, `created_at`, `updated_at`, `leave_type_key`, `application_id`) VALUES
(761, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(762, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(763, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-10', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(764, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-11', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(765, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-12', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(766, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-13', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(767, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(768, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(769, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(770, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(771, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(772, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-02', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(773, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-03', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(774, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-04', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(775, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-05', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(776, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-06', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(777, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(778, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-09', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(779, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-10', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(780, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-11', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(781, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-12', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(782, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-13', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(783, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-14', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(784, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-16', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(785, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-21', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(786, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-23', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(787, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-24', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(788, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-07', 'No Check-in', 'Auto-filled: no attendance or absence record found for this working day.', NULL, 0, NULL, NULL, 'Backfilled by fill_missing_absent_records.sql', '2026-03-09 08:26:31', '2026-03-09 08:26:31', NULL, NULL),
(789, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(790, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(791, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(792, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(793, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(794, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(795, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(796, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(797, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(798, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(799, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(800, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(801, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(802, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(803, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(804, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(805, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(806, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(807, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(808, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(809, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:15', '2026-03-10 12:01:15', NULL, NULL),
(810, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:16', '2026-03-10 12:01:16', NULL, NULL),
(811, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:16', '2026-03-10 12:01:16', NULL, NULL),
(812, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-10', 'No Check-in', 'Auto-generated on server start: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-10 12:01:16', '2026-03-10 12:01:16', NULL, NULL),
(813, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(814, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(815, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(816, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(817, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(818, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(819, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(820, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(821, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(822, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(823, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(824, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(825, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(826, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(827, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(828, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(829, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(830, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(831, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(832, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(833, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(834, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(835, 55, 'JFAD@digioussolutions.com', 'JFAD', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL),
(836, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-03-11', 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', NULL, 0, NULL, NULL, 'System auto-marked', '2026-03-11 08:34:48', '2026-03-11 08:34:48', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_achievements`
--

CREATE TABLE `employee_achievements` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `achievement_type` enum('award','certification','publication','recognition','project') DEFAULT 'award' COMMENT 'Type of achievement',
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `issuer_organization` varchar(255) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `credential_id` varchar(255) DEFAULT NULL,
  `credential_url` varchar(500) DEFAULT NULL,
  `attachment_url` varchar(500) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `visibility` enum('public','private','restricted') DEFAULT 'public',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Employee_Activities`
--

CREATE TABLE `Employee_Activities` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `action` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `location` varchar(100) DEFAULT NULL,
  `device` varchar(100) DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_allowances`
--

CREATE TABLE `employee_allowances` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `allowance_name` varchar(100) NOT NULL,
  `allowance_amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'PKR',
  `exchange_rate` decimal(10,4) DEFAULT 1.0000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_allowances`
--

INSERT INTO `employee_allowances` (`id`, `employee_id`, `allowance_name`, `allowance_amount`, `currency`, `exchange_rate`, `created_at`) VALUES
(6, 54, 'huhnj', 998.00, 'PKR', 1.0000, '2026-02-10 19:33:32'),
(7, 55, 'smms', 111.00, 'PKR', 1.0000, '2026-02-13 18:25:29');

-- --------------------------------------------------------

--
-- Stand-in structure for view `employee_allowances_in_pkr`
-- (See below for the actual view)
--
CREATE TABLE `employee_allowances_in_pkr` (
`id` int(11)
,`employee_id` int(11)
,`employee_name` varchar(255)
,`email` varchar(255)
,`allowance_name` varchar(100)
,`allowance_amount` decimal(12,2)
,`currency` varchar(10)
,`amount_in_pkr` decimal(19,2)
,`exchange_rate` decimal(10,4)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `Employee_Attendance`
--

CREATE TABLE `Employee_Attendance` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `attendance_date` date NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `status` enum('Present','Absent','Late','On Leave','Half Day','Paid Leave','Uninformed Absent') DEFAULT 'Absent',
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
  `remarks` text DEFAULT NULL,
  `device_info` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Employee_Attendance`
--

INSERT INTO `Employee_Attendance` (`id`, `employee_id`, `email`, `name`, `attendance_date`, `check_in_time`, `check_out_time`, `status`, `total_breaks_taken`, `smoke_break_count`, `dinner_break_count`, `washroom_break_count`, `prayer_break_count`, `smoke_break_duration_minutes`, `dinner_break_duration_minutes`, `washroom_break_duration_minutes`, `prayer_break_duration_minutes`, `total_break_duration_minutes`, `gross_working_time_minutes`, `net_working_time_minutes`, `expected_working_time_minutes`, `overtime_minutes`, `overtime_hours`, `on_time`, `late_by_minutes`, `remarks`, `device_info`, `ip_address`, `created_at`, `updated_at`) VALUES
(1, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-16', '00:28:39', '00:28:43', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 193, NULL, 'Web Browser', NULL, '2026-01-16 19:28:39', '2026-01-16 19:28:43'),
(2, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-16', '04:20:38', '04:31:11', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 11, 540, 0, 0.00, 0, 425, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-16 23:20:38', '2026-01-16 23:31:07'),
(3, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-17', '20:21:51', '20:22:50', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 15:21:51', '2026-01-17 15:22:44'),
(4, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-17', '21:02:23', '02:05:41', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 303, 303, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:02:23', '2026-01-17 21:05:55'),
(5, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-17', '21:11:06', '02:45:13', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 334, 334, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:11:07', '2026-01-17 21:45:14'),
(6, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-17', '21:16:12', '02:08:42', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 292, 292, 540, 0, 0.00, 0, 1, NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36', '127.0.0.1', '2026-01-17 16:16:12', '2026-01-17 21:08:43'),
(7, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-17', '21:16:48', '02:10:55', 'Late', 2, 0, 1, 1, 0, 0, 26, 0, 0, 26, 294, 268, 540, 0, 0.00, 0, 1, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:16:48', '2026-01-17 21:10:55'),
(8, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-17', '21:20:45', '02:05:26', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 285, 285, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:20:45', '2026-01-17 21:05:26'),
(9, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-17', '21:21:51', '02:05:26', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 6, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:21:52', '2026-01-20 01:21:14'),
(10, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-17', '21:22:29', '02:02:41', 'Late', 3, 2, 1, 0, 0, 19, 52, 0, 0, 71, 280, 209, 540, 0, 0.00, 0, 7, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:22:29', '2026-01-17 21:02:42'),
(11, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-17', '21:25:02', '02:05:25', 'Late', 3, 0, 1, 2, 0, 0, 56, 8, 0, 64, 280, 216, 540, 0, 0.00, 0, 10, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:25:02', '2026-01-17 21:05:11'),
(12, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-17', '21:27:34', '02:06:52', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 279, 279, 540, 0, 0.00, 0, 12, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:27:35', '2026-01-17 21:06:52'),
(13, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-17', '21:38:15', '02:08:38', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 270, 270, 540, 0, 0.00, 0, 23, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:38:15', '2026-01-17 21:08:40'),
(14, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-17', '21:45:56', '02:00:41', 'Late', 1, 0, 1, 0, 0, 0, 53, 0, 0, 53, 255, 202, 540, 0, 0.00, 0, 30, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 16:45:56', '2026-01-17 21:00:43'),
(15, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-17', '22:22:05', '02:00:00', 'Late', 2, 1, 1, 0, 0, 13698240, 13698240, 0, 0, 27396480, 0, 0, 540, 0, 0.00, 0, 67, NULL, 'Web Browser', NULL, '2026-01-17 17:22:05', '2026-01-20 01:19:28'),
(16, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-17', '22:47:16', '02:09:43', 'Late', 1, 0, 0, 1, 0, 0, 0, 3, 0, 3, 202, 199, 540, 0, 0.00, 0, 92, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 17:47:17', '2026-01-17 21:09:44'),
(17, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-17', '22:55:19', '02:06:12', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 191, 191, 540, 0, 0.00, 0, 100, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 17:55:19', '2026-01-17 21:06:13'),
(18, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-17', '23:04:25', '02:10:39', 'Late', 3, 0, 2, 1, 0, 0, 38, 9, 0, 47, 186, 139, 540, 0, 0.00, 0, 109, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 18:04:25', '2026-01-17 21:10:39'),
(19, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', '2026-01-17', '23:09:17', '02:10:39', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 114, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-17 18:09:18', '2026-01-20 01:19:46'),
(20, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-18', '22:43:05', '22:51:14', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 540, 0, 0.00, 0, 88, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-18 17:43:05', '2026-01-18 17:51:15'),
(21, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-19', '21:08:59', '03:09:18', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 361, 361, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 16:09:00', '2026-01-19 22:09:19'),
(22, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-19', '21:11:20', '06:00:06', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 16:11:20', '2026-01-20 01:20:11'),
(23, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-19', '21:14:08', '06:00:06', 'Present', 4, 0, 2, 2, 0, 0, 24, 9, 0, 33, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 16:14:08', '2026-01-20 01:20:24'),
(24, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-19', '21:17:45', '06:20:06', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 2, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 16:17:45', '2026-01-20 01:20:32'),
(25, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-19', '21:19:32', '06:20:06', 'Late', 3, 0, 1, 1, 1, 0, 17, 5, 0, 22, 0, 0, 540, 0, 0.00, 0, 4, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 16:19:32', '2026-01-20 01:20:36'),
(26, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-19', '21:20:45', '06:20:06', 'Late', 2, 1, 1, 0, 0, 11, 45, 0, 0, 56, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 16:20:45', '2026-01-20 01:20:39'),
(27, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-19', '21:20:47', '06:20:06', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 16:20:47', '2026-01-20 01:20:41'),
(28, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-19', '21:22:04', '06:20:06', 'Late', 1, 0, 1, 0, 0, 0, 10, 0, 0, 10, 0, 0, 540, 0, 0.00, 0, 7, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 16:22:04', '2026-01-20 01:20:44'),
(29, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-19', '21:47:27', '02:08:34', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 261, 261, 540, 0, 0.00, 0, 32, NULL, 'Web Browser', NULL, '2026-01-19 16:47:27', '2026-01-19 21:08:34'),
(30, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-19', '22:30:54', '06:20:06', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 470, 470, 540, 0, 0.00, 0, 75, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 17:30:54', '2026-02-10 19:47:04'),
(31, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-19', '23:30:45', '06:20:06', 'Late', 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 135, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 18:30:45', '2026-01-20 01:20:50'),
(32, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-19', '00:06:36', '06:20:06', 'Late', 5, 0, 3, 2, 0, 0, 21, 9, 0, 30, 0, 0, 540, 0, 0.00, 0, 171, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 19:06:36', '2026-01-20 01:20:55'),
(33, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-19', '00:06:53', '06:20:06', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 171, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 19:06:53', '2026-01-20 01:20:57'),
(34, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-19', '00:10:13', '06:20:06', 'Late', 2, 0, 1, 1, 0, 0, 19, 7, 0, 26, 0, 0, 540, 0, 0.00, 0, 175, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 19:10:13', '2026-01-20 01:20:59'),
(35, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-19', '00:13:46', '06:20:06', 'Late', 6, 0, 3, 3, 0, 0, 58, 16, 0, 74, 0, 0, 540, 0, 0.00, 0, 178, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 19:13:46', '2026-01-20 01:21:00'),
(36, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-19', '00:15:23', '06:20:06', 'Late', 2, 0, 2, 0, 0, 0, 41, 0, 0, 41, 0, 0, 540, 0, 0.00, 0, 180, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-19 19:15:23', '2026-01-20 01:21:02'),
(37, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-20', '21:02:50', '09:00:00', 'Present', 3, 0, 2, 1, 0, 0, 42, 6, 0, 48, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:02:50', '2026-02-13 12:33:38'),
(38, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-20', '21:04:53', '03:05:03', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 361, 361, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:04:53', '2026-01-20 22:05:04'),
(39, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-20', '21:08:19', '09:00:00', 'Present', 2, 0, 0, 1, 1, 0, 0, 21, 21, 42, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:08:19', '2026-02-13 12:33:38'),
(40, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-20', '21:09:32', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:09:32', '2026-02-13 12:33:38'),
(41, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-20', '21:12:24', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:12:24', '2026-02-13 12:33:38'),
(42, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-20', '21:14:21', '09:00:00', 'Present', 1, 0, 1, 0, 0, 0, 26, 0, 0, 26, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:14:21', '2026-02-13 12:33:38'),
(43, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-20', '21:14:31', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:14:31', '2026-02-13 12:33:38'),
(44, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-20', '21:14:56', '09:00:00', 'Present', 4, 0, 2, 2, 0, 0, 29, 11, 0, 40, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:14:56', '2026-02-13 12:33:38'),
(45, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-20', '21:15:23', '09:00:00', 'Present', 3, 0, 3, 0, 0, 0, 56, 0, 0, 56, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:15:23', '2026-02-13 12:33:38'),
(46, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-20', '21:16:35', '09:00:00', 'Late', 3, 2, 1, 0, 0, 32, 31, 0, 0, 63, 0, 0, 540, 0, 0.00, 0, 1, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:16:35', '2026-02-13 12:33:38'),
(47, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-20', '21:18:42', '05:41:09', 'Late', 4, 3, 1, 0, 0, 2, 4, 0, 0, 6, 503, 497, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:18:42', '2026-01-21 00:41:09'),
(48, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-20', '21:19:35', '09:00:00', 'Late', 3, 0, 1, 2, 0, 0, 52, 11, 0, 63, 0, 0, 540, 0, 0.00, 0, 4, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:19:35', '2026-02-13 12:33:38'),
(49, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-20', '21:19:45', '09:00:00', 'Late', 5, 1, 1, 2, 1, 7, 42, 5, 19, 73, 0, 0, 540, 0, 0.00, 0, 4, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:19:45', '2026-02-13 12:33:38'),
(50, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-20', '21:19:51', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 4, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:19:51', '2026-02-13 12:33:38'),
(51, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-20', '21:20:24', '09:00:00', 'Late', 4, 0, 3, 1, 0, 0, 48, 3, 0, 51, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:20:24', '2026-02-13 12:33:38'),
(52, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-20', '21:21:10', '09:00:00', 'Late', 4, 0, 4, 0, 0, 0, 48, 0, 0, 48, 0, 0, 540, 0, 0.00, 0, 6, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:21:10', '2026-02-13 12:33:38'),
(53, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-20', '21:23:58', '01:14:13', 'Late', 2, 2, 0, 0, 0, 27405909, 0, 0, 0, 27405909, 231, 0, 540, 0, 0.00, 0, 8, NULL, 'Web Browser', NULL, '2026-01-20 16:23:59', '2026-01-20 20:14:13'),
(54, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-20', '21:40:14', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 25, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 16:40:14', '2026-02-13 12:33:38'),
(55, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-20', '22:20:00', '07:00:04', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 740, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-20 17:20:01', '2026-02-19 18:28:34'),
(56, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-21', '06:00:46', '21:04:13', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 904, 904, 540, 364, 6.07, 0, 525, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 01:00:46', '2026-01-21 16:04:14'),
(57, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-21', '06:02:05', '06:02:30', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 01:02:06', '2026-01-21 01:02:31'),
(58, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-21', '06:07:18', '06:07:29', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 01:07:18', '2026-01-21 01:07:25'),
(59, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-21', '21:04:07', '09:00:00', 'Present', 4, 0, 2, 2, 0, 0, 55, 9, 0, 64, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:04:08', '2026-02-13 12:33:38'),
(60, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-21', '21:05:44', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:05:44', '2026-02-13 12:33:38'),
(61, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-21', '21:06:12', '03:06:28', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 360, 360, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:06:12', '2026-01-21 22:06:28'),
(62, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-21', '21:10:05', '09:00:00', 'Present', 4, 2, 2, 0, 0, 36, 58, 0, 0, 94, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:10:05', '2026-02-13 12:33:38'),
(63, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-21', '21:10:25', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:10:25', '2026-02-13 12:33:38'),
(64, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-21', '21:12:21', '09:00:00', 'Present', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:12:21', '2026-02-13 12:33:38'),
(65, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-21', '21:13:00', '09:00:00', 'Present', 6, 0, 3, 3, 0, 0, 57, 24, 0, 81, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:13:00', '2026-02-13 12:33:38'),
(66, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-21', '21:14:27', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:14:27', '2026-02-13 12:33:38'),
(67, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-21', '21:14:46', '09:00:00', 'Present', 3, 0, 2, 1, 0, 0, 33, 3, 0, 36, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:14:46', '2026-02-13 12:33:38'),
(68, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-21', '21:14:55', '09:00:00', 'Present', 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:14:55', '2026-02-13 12:33:38'),
(69, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-21', '21:17:41', '09:00:00', 'Late', 2, 0, 2, 0, 0, 0, 43, 0, 0, 43, 0, 0, 540, 0, 0.00, 0, 2, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:17:41', '2026-02-13 12:33:38'),
(70, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-21', '21:20:54', '09:00:00', 'Late', 3, 0, 2, 0, 1, 0, 45, 0, 21, 66, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:20:54', '2026-02-13 12:33:38'),
(71, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-21', '21:23:27', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 8, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:23:27', '2026-02-13 12:33:38'),
(72, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-21', '21:28:39', '09:00:00', 'Late', 2, 0, 1, 1, 0, 0, 59, 17, 0, 76, 0, 0, 540, 0, 0.00, 0, 13, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 16:28:40', '2026-02-13 12:33:38'),
(73, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-21', '21:37:57', '09:00:00', 'Late', 2, 0, 1, 0, 1, 0, 13704000, 0, 13704000, 27408000, 0, 0, 540, 0, 0.00, 0, 22, NULL, 'Web Browser', NULL, '2026-01-21 16:37:57', '2026-02-13 12:33:38'),
(74, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-21', '00:56:40', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 221, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-21 19:56:40', '2026-02-13 12:33:38'),
(75, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-22', '06:06:11', '06:06:54', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 01:06:11', '2026-01-22 01:06:55'),
(76, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-22', '06:08:26', '06:08:30', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 01:08:26', '2026-01-22 01:08:31'),
(77, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-22', '20:43:45', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 15:43:45', '2026-02-13 12:33:38'),
(78, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-22', '20:43:54', '06:00:05', 'Present', 4, 0, 3, 1, 0, 0, 49, 1, 0, 50, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 15:43:54', '2026-01-23 01:00:06'),
(79, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-22', '21:11:28', '03:03:31', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 352, 352, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:11:28', '2026-01-22 22:03:32'),
(80, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-22', '21:13:31', '09:00:00', 'Present', 5, 3, 1, 1, 0, 29, 22, 3, 0, 54, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:13:31', '2026-02-13 12:33:38'),
(81, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-22', '21:15:13', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:15:13', '2026-02-13 12:33:38'),
(82, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-22', '21:16:27', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 1, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:16:27', '2026-02-13 12:33:38'),
(83, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-22', '21:20:22', '09:00:00', 'Late', 3, 0, 2, 1, 0, 0, 77, 4, 0, 81, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:20:22', '2026-02-13 12:33:38'),
(84, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-22', '21:20:37', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:20:37', '2026-02-13 12:33:38'),
(85, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-22', '21:21:42', '09:00:00', 'Late', 5, 1, 3, 1, 0, 0, 44, 2, 0, 46, 0, 0, 540, 0, 0.00, 0, 6, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:21:43', '2026-02-13 12:33:38'),
(86, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-22', '21:22:05', '09:00:00', 'Late', 2, 0, 1, 1, 0, 0, 92, 9, 0, 101, 0, 0, 540, 0, 0.00, 0, 7, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:22:05', '2026-02-13 12:33:38'),
(87, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-22', '21:26:34', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 11, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:26:34', '2026-02-13 12:33:38'),
(88, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-22', '21:30:02', '09:00:00', 'Late', 2, 0, 1, 0, 1, 0, 54, 0, 18, 72, 0, 0, 540, 0, 0.00, 0, 15, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:30:02', '2026-02-13 12:33:38'),
(89, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-22', '21:32:36', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 17, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 16:32:36', '2026-02-13 12:33:38'),
(90, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-22', '22:21:16', '09:00:00', 'Late', 1, 1, 0, 0, 0, 13706221, 0, 0, 0, 13706221, 0, 0, 540, 0, 0.00, 0, 66, NULL, 'Web Browser', NULL, '2026-01-22 17:21:16', '2026-02-13 12:33:38'),
(91, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-22', '22:24:10', '09:00:00', 'Late', 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 69, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 17:24:10', '2026-02-13 12:33:38'),
(92, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-22', '23:04:32', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 109, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-22 18:04:32', '2026-02-13 12:33:38'),
(93, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-23', '20:22:06', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 15:22:06', '2026-02-13 12:33:38'),
(94, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-23', '21:07:00', '09:00:00', 'Present', 1, 0, 1, 0, 0, 0, 33, 0, 0, 33, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:07:00', '2026-02-13 12:33:38'),
(95, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-23', '21:07:01', '09:00:00', 'Present', 2, 0, 2, 0, 0, 0, 31, 0, 0, 31, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:07:01', '2026-02-13 12:33:38'),
(96, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-23', '21:08:56', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:08:56', '2026-02-13 12:33:38'),
(97, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-23', '21:10:53', '09:00:00', 'Present', 3, 0, 2, 1, 0, 0, 32, 2, 0, 34, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:10:53', '2026-02-13 12:33:38'),
(98, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-23', '21:11:12', '05:57:32', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 526, 526, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-01-23 16:11:12', '2026-01-24 00:57:32'),
(99, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-23', '21:11:57', '09:00:00', 'Present', 2, 0, 2, 0, 0, 0, 33, 0, 0, 33, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:11:57', '2026-02-13 12:33:38'),
(100, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-23', '21:17:39', '09:00:00', 'Late', 1, 0, 0, 0, 1, 0, 0, 0, 10, 10, 0, 0, 540, 0, 0.00, 0, 2, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:17:39', '2026-02-13 12:33:38'),
(101, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-23', '21:18:33', '09:00:00', 'Late', 4, 0, 3, 1, 0, 0, 54, 3, 0, 57, 0, 0, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:18:33', '2026-02-13 12:33:38'),
(102, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-23', '21:20:51', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:20:51', '2026-02-13 12:33:38'),
(103, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-23', '21:21:33', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 6, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:21:33', '2026-02-13 12:33:38'),
(104, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-23', '21:28:28', '00:38:26', 'Late', 1, 0, 0, 0, 1, 0, 0, 0, 47, 47, 190, 143, 540, 0, 0.00, 0, 13, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:28:28', '2026-01-23 19:38:26'),
(105, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-23', '21:36:14', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 46, 0, 0, 46, 0, 0, 540, 0, 0.00, 0, 21, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:36:14', '2026-02-13 12:33:38'),
(106, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-23', '21:47:07', '09:00:00', 'Late', 2, 0, 0, 1, 1, 0, 0, 17, 17, 34, 0, 0, 540, 0, 0.00, 0, 32, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 16:47:07', '2026-02-13 12:33:38'),
(107, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-23', '22:34:59', '09:00:00', 'Late', 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 79, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 17:34:59', '2026-02-13 12:33:38'),
(108, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-23', '22:52:33', '09:00:00', 'Late', 2, 0, 2, 0, 0, 0, 81, 0, 0, 81, 0, 0, 540, 0, 0.00, 0, 97, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-23 17:52:33', '2026-02-13 12:33:38'),
(109, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-24', '07:07:42', '07:07:50', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 02:07:42', '2026-01-24 02:07:48'),
(110, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-24', '20:55:38', '02:04:48', 'Present', 1, 0, 1, 0, 0, 0, 13, 0, 0, 13, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 15:55:38', '2026-01-24 21:04:49'),
(111, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-24', '21:08:11', '02:00:38', 'Present', 1, 0, 1, 0, 0, 0, 31, 0, 0, 31, 292, 261, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:08:11', '2026-01-24 21:00:12'),
(112, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-24', '21:08:38', '02:03:03', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 295, 295, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:08:38', '2026-01-24 21:03:03'),
(113, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-24', '21:09:34', '02:02:52', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 293, 293, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:09:34', '2026-01-24 21:02:55'),
(114, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-24', '21:12:51', '02:04:35', 'Present', 1, 0, 1, 0, 0, 0, 31, 0, 0, 31, 292, 261, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:12:52', '2026-01-24 21:04:36'),
(115, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-24', '21:12:55', '02:03:17', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 291, 291, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:12:55', '2026-01-24 21:03:18'),
(116, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-24', '21:17:09', '02:02:03', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 285, 285, 540, 0, 0.00, 0, 2, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:17:09', '2026-01-24 21:02:04'),
(117, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-24', '21:20:37', '02:06:17', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 286, 286, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:20:37', '2026-01-24 21:06:18'),
(118, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-24', '21:21:07', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 6, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:21:07', '2026-02-13 12:33:38'),
(119, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-24', '21:23:48', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 8, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:23:48', '2026-02-13 12:33:38'),
(120, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-24', '21:24:48', '02:00:02', 'Late', 3, 0, 2, 1, 0, 0, 85, 1, 0, 86, 276, 190, 540, 0, 0.00, 0, 9, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:24:49', '2026-01-24 21:00:03'),
(121, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-24', '21:28:05', '02:00:26', 'Late', 1, 0, 1, 0, 0, 0, 60, 0, 0, 60, 272, 212, 540, 0, 0.00, 0, 13, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:28:05', '2026-01-24 21:00:11'),
(122, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-24', '21:36:17', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 21, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 16:36:17', '2026-02-13 12:33:38'),
(123, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-24', '22:27:57', '02:14:30', 'Late', 1, 0, 1, 0, 0, 0, 16, 0, 0, 16, 227, 211, 540, 0, 0.00, 0, 72, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-24 17:27:57', '2026-01-24 21:14:31'),
(124, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-26', '20:39:41', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-01-26 15:39:41', '2026-02-13 12:33:38'),
(125, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-26', '21:04:14', '09:00:00', 'Present', 2, 0, 1, 1, 0, 0, 22, 1, 0, 23, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:04:14', '2026-02-13 12:33:38'),
(126, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-26', '21:05:11', '09:00:00', 'Present', 3, 1, 1, 1, 0, 11, 44, 4, 0, 59, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:05:11', '2026-02-13 12:33:38'),
(127, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-26', '21:06:39', '03:06:47', 'Present', 1, 0, 1, 0, 0, 0, 19, 0, 0, 19, 360, 341, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:06:39', '2026-01-26 22:06:48'),
(128, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-26', '21:08:57', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:08:57', '2026-02-13 12:33:38'),
(129, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-26', '21:09:52', '09:00:00', 'Present', 5, 0, 4, 1, 0, 0, 46, 0, 0, 46, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:09:52', '2026-02-13 12:33:38'),
(130, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-26', '21:14:11', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:14:11', '2026-02-13 12:33:38'),
(131, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-26', '21:14:16', '09:00:00', 'Present', 1, 0, 0, 1, 0, 0, 0, 5, 0, 5, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:14:16', '2026-02-13 12:33:38'),
(132, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-26', '21:19:45', '09:00:00', 'Late', 2, 0, 2, 0, 0, 0, 115, 0, 0, 115, 0, 0, 540, 0, 0.00, 0, 4, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:19:45', '2026-02-13 12:33:38'),
(133, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-26', '21:19:51', '09:00:00', 'Late', 1, 0, 0, 0, 1, 0, 0, 0, 25, 25, 0, 0, 540, 0, 0.00, 0, 4, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:19:51', '2026-02-13 12:33:38'),
(134, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-26', '21:22:03', '09:00:00', 'Late', 2, 0, 2, 0, 0, 0, 47, 0, 0, 47, 0, 0, 540, 0, 0.00, 0, 7, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:22:03', '2026-02-13 12:33:38'),
(135, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-26', '21:30:05', '09:00:00', 'Late', 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 15, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:30:05', '2026-02-13 12:33:38'),
(136, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-26', '21:48:36', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 18, 0, 0, 18, 0, 0, 540, 0, 0.00, 0, 33, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 16:48:37', '2026-02-13 12:33:38'),
(137, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-26', '22:48:10', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 93, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 17:48:10', '2026-02-13 12:33:38'),
(138, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-26', '23:24:23', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 17, 0, 0, 17, 0, 0, 540, 0, 0.00, 0, 129, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 18:24:23', '2026-02-13 12:33:38'),
(139, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-26', '00:26:51', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 191, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-26 19:26:51', '2026-02-13 12:33:38'),
(140, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-27', '21:00:27', '09:00:00', 'Present', 1, 0, 0, 1, 0, 0, 0, 7, 0, 7, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:00:27', '2026-02-13 12:33:38'),
(141, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-27', '21:05:47', '09:00:00', 'Present', 3, 2, 1, 0, 0, 24, 34, 0, 0, 58, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:05:47', '2026-02-13 12:33:38'),
(142, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-27', '21:07:10', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:07:10', '2026-02-13 12:33:38'),
(143, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-27', '21:08:27', '09:00:00', 'Present', 1, 1, 0, 0, 0, 308, 0, 0, 0, 308, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-01-27 16:08:27', '2026-02-13 12:33:38'),
(144, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-27', '21:08:50', '03:04:30', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 356, 356, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:08:50', '2026-01-27 22:04:31'),
(145, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-27', '21:11:32', '09:00:00', 'Present', 2, 0, 2, 0, 0, 0, 33, 0, 0, 33, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:11:32', '2026-02-13 12:33:38');
INSERT INTO `Employee_Attendance` (`id`, `employee_id`, `email`, `name`, `attendance_date`, `check_in_time`, `check_out_time`, `status`, `total_breaks_taken`, `smoke_break_count`, `dinner_break_count`, `washroom_break_count`, `prayer_break_count`, `smoke_break_duration_minutes`, `dinner_break_duration_minutes`, `washroom_break_duration_minutes`, `prayer_break_duration_minutes`, `total_break_duration_minutes`, `gross_working_time_minutes`, `net_working_time_minutes`, `expected_working_time_minutes`, `overtime_minutes`, `overtime_hours`, `on_time`, `late_by_minutes`, `remarks`, `device_info`, `ip_address`, `created_at`, `updated_at`) VALUES
(146, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-27', '21:15:37', '09:00:00', 'Present', 3, 0, 2, 1, 0, 0, 55, 9, 0, 64, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:15:37', '2026-02-13 12:33:38'),
(147, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-27', '21:16:21', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 1, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:16:21', '2026-02-13 12:33:38'),
(148, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-27', '21:16:37', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 1, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:16:37', '2026-02-13 12:33:38'),
(149, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-27', '21:18:31', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:18:32', '2026-02-13 12:33:38'),
(150, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-27', '21:21:41', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 6, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:21:41', '2026-02-13 12:33:38'),
(151, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-27', '21:26:35', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 11, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:26:35', '2026-02-13 12:33:38'),
(152, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-27', '21:26:56', '09:00:00', 'Late', 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 11, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:26:56', '2026-02-13 12:33:38'),
(153, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-27', '21:27:01', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 21, 0, 0, 21, 0, 0, 540, 0, 0.00, 0, 12, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:27:01', '2026-02-13 12:33:38'),
(154, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-27', '21:28:41', '21:29:58', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 540, 0, 0.00, 0, 13, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:28:42', '2026-01-27 16:29:59'),
(155, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-27', '21:40:23', '09:00:00', 'Late', 3, 0, 2, 1, 0, 0, 39, 5, 0, 44, 0, 0, 540, 0, 0.00, 0, 25, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 16:40:23', '2026-02-13 12:33:38'),
(156, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-27', '22:07:00', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 52, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-27 17:07:00', '2026-02-13 12:33:38'),
(157, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-28', '06:00:28', '06:02:22', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 540, 0, 0.00, 0, 525, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 01:00:28', '2026-01-28 01:02:22'),
(158, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-28', '21:06:02', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:06:02', '2026-02-13 12:33:38'),
(159, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-28', '21:06:15', '03:08:18', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 362, 362, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:06:15', '2026-01-28 22:08:19'),
(160, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-28', '21:11:44', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:11:44', '2026-02-13 12:33:38'),
(161, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-28', '21:13:48', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:13:48', '2026-02-13 12:33:38'),
(162, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-28', '21:14:58', '09:00:00', 'Present', 1, 1, 0, 0, 0, 183, 0, 0, 0, 183, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:14:58', '2026-02-13 12:33:38'),
(163, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-28', '21:15:26', '09:00:00', 'Present', 3, 0, 2, 1, 0, 0, 47, 0, 0, 47, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:15:26', '2026-02-13 12:33:38'),
(164, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-28', '21:17:17', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 25, 0, 0, 25, 0, 0, 540, 0, 0.00, 0, 2, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:17:17', '2026-02-13 12:33:38'),
(165, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-28', '21:24:26', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 9, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:24:26', '2026-02-13 12:33:38'),
(166, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-28', '21:28:12', '09:00:00', 'Late', 1, 0, 0, 1, 0, 0, 0, 4, 0, 4, 0, 0, 540, 0, 0.00, 0, 13, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:28:12', '2026-02-13 12:33:38'),
(167, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-28', '21:29:43', '09:00:00', 'Late', 3, 0, 2, 0, 1, 0, 47, 0, 0, 47, 0, 0, 540, 0, 0.00, 0, 14, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:29:43', '2026-02-13 12:33:38'),
(168, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-28', '21:29:55', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 52, 0, 0, 52, 0, 0, 540, 0, 0.00, 0, 14, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:29:55', '2026-02-13 12:33:38'),
(169, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-28', '21:34:01', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 19, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:34:01', '2026-02-13 12:33:38'),
(170, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-28', '21:36:32', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 21, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 16:36:32', '2026-02-13 12:33:38'),
(171, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-28', '00:01:32', '02:58:59', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 177, 177, 540, 0, 0.00, 0, 166, NULL, 'Web Browser', NULL, '2026-01-28 19:01:32', '2026-01-28 21:58:59'),
(172, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-28', '00:01:34', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 166, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 19:01:34', '2026-02-13 12:33:38'),
(173, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-28', '00:19:03', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 184, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-28 19:19:03', '2026-02-13 12:33:38'),
(174, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-29', '21:07:03', '03:09:14', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 362, 362, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:07:04', '2026-01-29 22:09:15'),
(175, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-29', '21:11:05', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:11:05', '2026-02-13 12:33:38'),
(176, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-29', '21:11:07', '09:00:00', 'Present', 2, 0, 2, 0, 0, 0, 23, 0, 0, 23, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:11:07', '2026-02-13 12:33:38'),
(177, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-29', '21:13:07', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:13:07', '2026-02-13 12:33:38'),
(178, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-29', '21:13:55', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:13:55', '2026-02-13 12:33:38'),
(179, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-29', '21:14:41', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:14:41', '2026-02-13 12:33:38'),
(180, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-29', '21:14:47', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:14:47', '2026-02-13 12:33:38'),
(181, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-29', '21:15:55', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:15:55', '2026-02-13 12:33:38'),
(182, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-29', '21:16:33', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 1, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:16:33', '2026-02-13 12:33:38'),
(183, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', '2026-01-29', '21:23:55', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 8, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:23:55', '2026-02-13 12:33:38'),
(184, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-29', '21:25:31', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 10, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:25:31', '2026-02-13 12:33:38'),
(185, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-29', '21:26:39', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 11, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:26:39', '2026-02-13 12:33:38'),
(186, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-29', '21:27:08', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 12, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 16:27:08', '2026-02-13 12:33:38'),
(187, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-29', '22:00:37', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 45, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 17:00:37', '2026-02-13 12:33:38'),
(188, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-29', '01:21:08', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 28, 0, 0, 28, 0, 0, 540, 0, 0.00, 0, 246, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-29 20:21:08', '2026-02-13 12:33:38'),
(189, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-29', '05:09:03', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 474, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 00:09:03', '2026-02-13 12:33:38'),
(190, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-29', '05:43:27', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 508, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 00:43:27', '2026-02-13 12:33:38'),
(191, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-30', '20:52:22', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-01-30 15:52:23', '2026-02-13 12:33:38'),
(192, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-30', '21:08:41', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:08:41', '2026-02-13 12:33:38'),
(193, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-30', '21:10:06', '09:00:00', 'Present', 2, 0, 1, 1, 0, 0, 34, 2, 0, 19, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:10:06', '2026-02-13 12:33:38'),
(194, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-30', '21:11:22', '09:00:00', 'Present', 1, 0, 1, 0, 0, 0, 120, 0, 0, 60, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:11:22', '2026-02-13 12:33:38'),
(195, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-30', '21:11:46', '09:00:00', 'Present', 1, 1, 0, 0, 0, 11, 0, 0, 0, 11, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:11:47', '2026-02-13 12:33:38'),
(196, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-30', '21:13:40', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:13:40', '2026-02-13 12:33:38'),
(197, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-30', '21:15:54', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36', '127.0.0.1', '2026-01-30 16:15:54', '2026-02-13 12:33:38'),
(198, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-30', '21:17:47', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 2, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:17:47', '2026-02-13 12:33:38'),
(199, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-30', '21:18:27', '09:00:00', 'Late', 2, 0, 1, 1, 0, 0, 60, 18, 0, 69, 0, 0, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:18:27', '2026-02-13 12:33:38'),
(200, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-30', '21:20:30', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:20:30', '2026-02-13 12:33:38'),
(201, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-30', '21:22:20', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 55, 0, 0, 28, 0, 0, 540, 0, 0.00, 0, 7, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:22:21', '2026-02-13 12:33:38'),
(202, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-30', '21:22:59', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 7, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 16:22:59', '2026-02-13 12:33:38'),
(203, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-30', '22:34:00', '09:00:00', 'Late', 1, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 540, 0, 0.00, 0, 79, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 17:34:00', '2026-02-13 12:33:38'),
(204, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-30', '22:58:07', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 103, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 17:58:07', '2026-02-13 12:33:38'),
(205, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-01-30', '01:29:27', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 254, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 20:29:27', '2026-02-13 12:33:38'),
(206, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-30', '01:40:23', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 21, 0, 0, 21, 0, 0, 540, 0, 0.00, 0, 265, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 20:40:24', '2026-02-13 12:33:38'),
(207, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-30', '23:42:12', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 337, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-30 21:52:12', '2026-02-13 12:33:38'),
(208, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-01-31', '20:57:37', '02:00:39', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 15:57:37', '2026-01-31 21:00:41'),
(209, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-01-31', '21:08:07', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 16:08:07', '2026-02-13 12:33:38'),
(210, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-31', '21:11:49', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 16:11:49', '2026-02-13 12:33:38'),
(211, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-01-31', '21:13:18', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 16:13:18', '2026-02-13 12:33:38'),
(212, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-01-31', '21:13:39', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 16:13:39', '2026-02-13 12:33:38'),
(213, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-01-31', '21:15:30', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 16:15:30', '2026-02-13 12:33:38'),
(214, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-31', '22:06:07', '02:04:53', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 238, 238, 540, 0, 0.00, 0, 51, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 17:06:07', '2026-01-31 21:04:54'),
(215, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-31', '22:07:07', '02:01:15', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 234, 234, 540, 0, 0.00, 0, 52, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 17:07:07', '2026-01-31 21:01:16'),
(216, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-31', '22:07:09', '02:06:04', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 239, 239, 540, 0, 0.00, 0, 52, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 17:07:09', '2026-01-31 21:05:32'),
(217, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-01-31', '22:09:34', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 54, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 17:09:34', '2026-02-13 12:33:38'),
(218, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-01-31', '22:10:12', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 55, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 17:10:12', '2026-02-13 12:33:38'),
(219, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-01-31', '22:20:02', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 80, 0, 0, 40, 0, 0, 540, 0, 0.00, 0, 65, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 17:20:02', '2026-02-13 12:33:38'),
(220, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-01-31', '22:23:21', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 68, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 17:23:21', '2026-02-13 12:33:38'),
(221, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-31', '22:43:25', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 88, NULL, 'Web Browser', NULL, '2026-01-31 17:43:25', '2026-02-13 12:33:38'),
(223, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-01-31', '23:50:50', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 118, 0, 0, 59, 0, 0, 540, 0, 0.00, 0, 155, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 18:50:51', '2026-02-13 12:33:38'),
(224, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-01-31', '22:07:00', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 27, 27, 540, 0, 0.00, 0, 171, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-01-31 19:06:43', '2026-02-13 12:33:38'),
(225, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-02', '21:08:47', '03:09:07', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 361, 361, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:08:47', '2026-02-02 22:09:07'),
(226, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-02', '21:09:46', '06:01:07', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 532, 532, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:09:47', '2026-02-03 01:01:07'),
(227, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-02', '21:13:10', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:13:11', '2026-02-13 12:33:38'),
(228, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-02', '21:13:27', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 707, 707, 540, 167, 2.78, 1, 0, NULL, 'Web Browser', NULL, '2026-02-02 16:13:27', '2026-02-13 13:08:33'),
(229, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-02', '21:13:57', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:13:57', '2026-02-13 12:33:38'),
(230, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-02', '21:15:28', '06:05:16', 'Present', 2, 0, 0, 1, 1, 0, 0, 64, 64, 64, 530, 466, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:15:28', '2026-02-03 01:05:16'),
(231, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-02', '21:15:58', '06:05:13', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 530, 530, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:15:58', '2026-02-03 01:05:14'),
(232, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-02', '21:17:22', '07:55:20', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 638, 638, 540, 98, 1.63, 0, 2, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:17:22', '2026-02-03 02:55:18'),
(233, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-02', '21:18:22', '06:03:25', 'Late', 2, 0, 2, 0, 0, 0, 39, 0, 0, 60, 525, 465, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:18:22', '2026-02-03 01:03:25'),
(234, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-02', '21:18:29', '06:11:26', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 533, 533, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:18:29', '2026-02-03 01:11:27'),
(235, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-02', '21:20:22', '09:00:00', 'Late', 1, 0, 0, 1, 0, 0, 0, 20, 0, 10, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:20:22', '2026-02-13 12:33:38'),
(236, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-02', '21:23:29', '06:03:55', 'Late', 3, 1, 2, 0, 0, 0, 40, 0, 0, 20, 520, 500, 540, 0, 0.00, 0, 8, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:23:29', '2026-02-03 01:03:39'),
(237, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-02', '21:24:19', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 9, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:24:19', '2026-02-13 12:33:38'),
(238, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-02', '21:25:24', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 10, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 16:25:24', '2026-02-13 12:33:38'),
(239, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-02', '22:32:24', '06:04:32', 'Late', 2, 0, 2, 0, 0, 0, 42, 0, 0, 37, 452, 415, 540, 0, 0.00, 0, 77, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 17:32:24', '2026-02-03 01:04:32'),
(240, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-02', '22:45:45', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 90, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 17:45:45', '2026-02-13 12:33:38'),
(241, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-02', '23:57:10', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 543, 543, 540, 3, 0.05, 0, 162, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 18:57:11', '2026-02-13 12:49:37'),
(242, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-02', '00:10:59', '06:03:49', 'Late', 1, 0, 1, 0, 0, 0, 48, 0, 0, 24, 353, 329, 540, 0, 0.00, 0, 175, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-02 19:10:59', '2026-02-03 01:03:50'),
(243, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-03', '20:54:12', '06:01:01', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 15:54:12', '2026-02-04 01:01:02'),
(244, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-03', '21:03:13', '03:06:19', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 363, 363, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:03:13', '2026-02-03 22:06:20'),
(245, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-03', '21:05:08', '06:15:37', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 550, 550, 540, 10, 0.17, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:05:09', '2026-02-04 01:15:37'),
(246, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-03', '21:05:33', '06:20:35', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 555, 555, 540, 15, 0.25, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:05:33', '2026-02-04 01:20:35'),
(247, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-03', '21:14:51', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:14:51', '2026-02-13 12:33:38'),
(248, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-03', '21:15:17', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:15:17', '2026-02-13 12:33:38'),
(249, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-03', '21:15:23', '06:11:25', 'Present', 2, 0, 2, 0, 0, 0, 66, 0, 0, 43, 536, 493, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:15:23', '2026-02-04 01:11:26'),
(250, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-03', '21:17:18', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 2, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:17:19', '2026-02-13 12:33:38'),
(251, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-03', '21:18:31', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:18:31', '2026-02-13 12:33:38'),
(252, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-03', '21:18:32', '06:10:40', 'Late', 1, 0, 1, 0, 0, 0, 36, 0, 0, 18, 532, 514, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:18:33', '2026-02-04 01:10:41'),
(253, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-03', '21:18:47', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 702, 702, 540, 162, 2.70, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:18:47', '2026-02-26 19:17:55'),
(254, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-03', '21:31:25', '06:04:17', 'Late', 1, 0, 1, 0, 0, 0, 132, 0, 0, 66, 513, 447, 540, 0, 0.00, 0, 16, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:31:25', '2026-02-04 01:03:59'),
(255, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-03', '21:38:48', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 23, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 16:38:48', '2026-02-13 12:33:38'),
(256, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-03', '22:16:12', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 540, 0, 0.00, 0, 61, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 17:16:12', '2026-02-13 12:33:38'),
(257, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-03', '00:30:30', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 195, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 19:30:30', '2026-02-13 12:33:38'),
(258, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-03', '00:52:25', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 488, 488, 540, 0, 0.00, 0, 217, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-03 19:52:25', '2026-02-13 12:49:37'),
(259, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-04', '21:00:44', '07:14:53', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 614, 614, 540, 74, 1.23, 1, 0, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:00:44', '2026-02-05 02:14:51'),
(260, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-04', '21:05:20', '03:08:40', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 363, 363, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:05:20', '2026-02-04 22:08:41'),
(261, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-04', '21:06:40', '05:59:52', 'Present', 2, 0, 0, 1, 1, 0, 0, 22, 36, 29, 533, 504, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:06:40', '2026-02-05 01:11:40'),
(262, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-04', '21:08:05', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:08:05', '2026-02-13 12:33:38'),
(263, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-04', '21:10:44', '06:12:54', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 542, 542, 540, 2, 0.03, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:10:44', '2026-02-05 01:12:55'),
(264, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-04', '21:11:39', '06:01:15', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 530, 530, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:11:39', '2026-02-05 01:01:15'),
(265, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-04', '21:14:16', '06:05:43', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 531, 531, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:14:16', '2026-02-05 01:05:43'),
(266, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-04', '21:16:33', '06:02:41', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 526, 526, 540, 0, 0.00, 0, 1, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:16:33', '2026-02-05 01:02:41'),
(267, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-04', '21:18:00', '06:04:23', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 526, 526, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:18:00', '2026-02-05 01:04:23'),
(268, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-04', '21:19:01', '09:00:00', 'Late', 3, 0, 3, 0, 0, 0, 64, 0, 0, 47, 0, 0, 540, 0, 0.00, 0, 4, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:19:01', '2026-02-13 12:33:38'),
(269, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-04', '21:19:17', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 4, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:19:17', '2026-02-13 12:33:38'),
(270, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-04', '21:20:30', '06:05:56', 'Late', 1, 0, 1, 0, 0, 0, 118, 0, 0, 59, 525, 466, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:20:30', '2026-02-05 01:05:57'),
(271, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-04', '21:25:52', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 695, 695, 540, 155, 2.58, 0, 10, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:25:52', '2026-02-26 19:17:55'),
(272, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-04', '21:26:15', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 694, 694, 540, 154, 2.57, 0, 11, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:26:15', '2026-02-13 12:49:37'),
(273, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-04', '21:29:21', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 14, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 16:29:21', '2026-02-13 12:33:38'),
(274, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-04', '22:26:34', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 634, 634, 540, 94, 1.57, 0, 71, NULL, 'Web Browser', NULL, '2026-02-04 17:26:34', '2026-02-13 13:08:33'),
(275, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-04', '23:56:36', '06:05:03', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 369, 369, 540, 0, 0.00, 0, 161, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 18:56:36', '2026-02-05 01:05:03'),
(276, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-04', '00:12:49', '06:06:34', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 354, 354, 540, 0, 0.00, 0, 177, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-04 19:12:49', '2026-02-05 01:06:35'),
(277, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-05', '17:54:24', '06:56:03', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 12:54:24', '2026-02-06 01:56:04'),
(278, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-05', '21:00:18', '06:11:32', 'Present', 2, 0, 0, 1, 1, 0, 0, 22, 36, 29, 551, 522, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:00:18', '2026-02-06 01:11:45'),
(279, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-05', '21:06:46', '03:07:43', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 361, 361, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:06:46', '2026-02-05 22:07:44'),
(280, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-05', '21:08:28', '06:11:30', 'Present', 1, 0, 1, 0, 0, 0, 54, 0, 0, 27, 543, 516, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:08:28', '2026-02-06 01:11:31'),
(281, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-05', '21:10:00', '06:09:45', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 539, 539, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:10:00', '2026-02-06 01:09:46'),
(282, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-05', '21:10:50', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:10:51', '2026-02-13 12:33:38'),
(283, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-05', '21:11:17', '09:00:00', 'Present', 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 709, 709, 540, 169, 2.82, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:11:17', '2026-02-26 19:17:56'),
(284, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-05', '21:16:14', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 1, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:16:14', '2026-02-13 12:33:38'),
(285, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-05', '21:20:02', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:20:02', '2026-02-13 12:33:38'),
(286, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-05', '21:21:07', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 6, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:21:07', '2026-02-13 12:33:38'),
(287, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-05', '21:23:12', '06:02:23', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 519, 519, 540, 0, 0.00, 0, 8, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:23:12', '2026-02-06 01:02:24'),
(288, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-05', '21:23:36', '06:07:09', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 524, 524, 540, 0, 0.00, 0, 8, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:23:37', '2026-02-06 01:07:11'),
(289, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-05', '21:29:31', '01:05:56', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 216, 216, 540, 0, 0.00, 0, 14, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:29:31', '2026-02-05 20:05:57'),
(290, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-05', '21:34:35', '09:00:00', 'Late', 3, 0, 2, 1, 0, 0, 54, 26, 0, 40, 0, 0, 540, 0, 0.00, 0, 19, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 16:34:36', '2026-02-13 12:33:38');
INSERT INTO `Employee_Attendance` (`id`, `employee_id`, `email`, `name`, `attendance_date`, `check_in_time`, `check_out_time`, `status`, `total_breaks_taken`, `smoke_break_count`, `dinner_break_count`, `washroom_break_count`, `prayer_break_count`, `smoke_break_duration_minutes`, `dinner_break_duration_minutes`, `washroom_break_duration_minutes`, `prayer_break_duration_minutes`, `total_break_duration_minutes`, `gross_working_time_minutes`, `net_working_time_minutes`, `expected_working_time_minutes`, `overtime_minutes`, `overtime_hours`, `on_time`, `late_by_minutes`, `remarks`, `device_info`, `ip_address`, `created_at`, `updated_at`) VALUES
(291, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-05', '04:15:11', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 285, 285, 540, 0, 0.00, 0, 420, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-05 23:15:12', '2026-02-13 12:49:37'),
(292, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-06', '21:05:56', '06:04:27', 'Present', 3, 0, 0, 2, 1, 0, 0, 560, 289, 849, 539, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:05:56', '2026-02-07 01:04:27'),
(293, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-06', '21:06:08', '06:10:14', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 544, 544, 540, 4, 0.07, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:06:08', '2026-02-07 01:10:14'),
(294, 42, 'Tahir@digioussolutions.com', 'Tahir ', '2026-02-06', '21:06:55', '07:09:04', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 603, 603, 540, 63, 1.05, 1, 0, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:06:55', '2026-02-07 02:09:04'),
(295, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', '2026-02-06', '21:08:47', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 712, 712, 540, 172, 2.87, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:08:47', '2026-02-26 19:17:56'),
(296, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-06', '21:09:30', '06:21:15', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 552, 552, 540, 12, 0.20, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:09:30', '2026-02-07 01:21:15'),
(297, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-06', '21:12:29', '06:01:02', 'Present', 1, 0, 1, 0, 0, 0, 330, 0, 0, 330, 529, 199, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:12:29', '2026-02-07 01:01:02'),
(298, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-06', '21:14:26', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:14:26', '2026-02-13 12:33:38'),
(299, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-06', '21:17:10', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 60, 0, 0, 30, 0, 0, 540, 0, 0.00, 0, 2, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:17:10', '2026-02-13 12:33:38'),
(300, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-06', '21:18:47', '06:05:59', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 527, 527, 540, 0, 0.00, 0, 3, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:18:47', '2026-02-07 01:06:00'),
(301, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-06', '21:19:38', '06:34:15', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 555, 555, 540, 15, 0.25, 0, 4, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:19:39', '2026-02-07 01:34:16'),
(302, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-06', '21:26:22', '06:34:23', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 548, 548, 540, 8, 0.13, 0, 11, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:26:22', '2026-02-07 01:34:23'),
(303, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-06', '21:33:35', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 18, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:33:35', '2026-02-13 12:33:38'),
(304, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-06', '21:46:53', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 66, 0, 0, 33, 0, 0, 540, 0, 0.00, 0, 31, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-06 16:46:53', '2026-02-13 12:33:38'),
(305, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-06', '22:21:16', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 639, 639, 540, 99, 1.65, 0, 66, NULL, 'Web Browser', NULL, '2026-02-06 17:21:16', '2026-02-13 12:49:37'),
(306, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-06', '22:28:03', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 632, 632, 540, 92, 1.53, 0, 73, NULL, 'Web Browser', NULL, '2026-02-06 17:28:03', '2026-02-13 13:08:33'),
(307, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-06', '23:10:34', '09:00:00', 'Late', 2, 0, 2, 0, 0, 0, 620, 0, 0, 620, 0, 0, 540, 0, 0.00, 0, 115, NULL, 'Web Browser', NULL, '2026-02-06 18:10:34', '2026-02-13 12:33:38'),
(308, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-06', '23:57:43', '06:03:34', 'Late', 2, 0, 2, 0, 0, 0, 652, 0, 0, 652, 366, 0, 540, 0, 0.00, 0, 162, NULL, 'Web Browser', NULL, '2026-02-06 18:57:43', '2026-02-07 01:03:34'),
(309, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-06', '23:58:59', '09:00:00', 'Late', 2, 0, 2, 0, 0, 0, 634, 0, 0, 634, 0, 0, 540, 0, 0.00, 0, 163, NULL, 'Web Browser', NULL, '2026-02-06 18:58:59', '2026-02-13 12:33:38'),
(310, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-09', '21:04:05', '03:09:09', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 365, 365, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-09 16:04:05', '2026-02-09 22:09:09'),
(311, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-09', '21:10:08', '06:01:02', 'Present', 1, 0, 1, 0, 0, 0, 339, 0, 0, 339, 531, 192, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-09 16:10:08', '2026-02-10 01:01:02'),
(312, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-09', '21:12:09', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-09 16:12:09', '2026-02-13 12:33:38'),
(313, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-09', '21:13:11', '02:08:33', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 295, 295, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-09 16:13:11', '2026-02-09 21:08:33'),
(314, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-09', '21:13:48', '06:03:37', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 530, 530, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-09 16:13:49', '2026-02-10 01:03:37'),
(315, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-09', '21:15:45', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-09 16:15:45', '2026-02-13 12:33:38'),
(316, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-09', '21:26:36', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 11, NULL, 'Web Browser', NULL, '2026-02-09 16:26:36', '2026-02-13 12:33:38'),
(317, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-09', '21:30:50', '08:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 510, 510, 540, 0, 0.00, 0, 15, NULL, 'Web Browser', NULL, '2026-02-09 16:30:50', '2026-02-10 19:47:40'),
(318, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-09', '21:31:34', '06:10:02', 'Late', 2, 0, 0, 1, 1, 0, 0, 308, 311, 619, 519, 0, 540, 0, 0.00, 0, 16, NULL, 'Web Browser', NULL, '2026-02-09 16:31:35', '2026-02-10 01:10:02'),
(319, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-09', '21:32:18', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 61, 0, 0, 31, 0, 0, 540, 0, 0.00, 0, 17, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-09 16:32:18', '2026-02-13 12:33:38'),
(320, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-09', '21:32:53', '09:00:00', 'Late', 1, 0, 1, 0, 0, 0, 300, 0, 0, 300, 0, 0, 540, 0, 0.00, 0, 17, NULL, 'Web Browser', NULL, '2026-02-09 16:32:53', '2026-02-13 12:33:38'),
(321, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-09', '21:43:26', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 28, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '127.0.0.1', '2026-02-09 16:43:26', '2026-02-13 12:33:38'),
(322, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-09', '23:36:10', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 141, NULL, 'Web Browser', NULL, '2026-02-09 18:36:10', '2026-02-13 12:33:38'),
(324, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-09', '00:59:57', '06:17:50', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 318, 318, 540, 0, 0.00, 0, 224, NULL, 'Web Browser', NULL, '2026-02-09 19:59:57', '2026-02-10 01:17:50'),
(325, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', '2026-02-10', '21:00:11', '21:00:11', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-10 16:00:11', '2026-02-10 16:00:12'),
(327, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-02-10', '21:05:02', '21:05:03', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-10 16:05:02', '2026-02-10 16:05:03'),
(330, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', '2026-02-10', '21:10:47', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-10 16:10:47', '2026-02-13 12:33:38'),
(331, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', '2026-02-10', '21:14:57', '09:00:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-10 16:14:57', '2026-02-13 12:33:38'),
(332, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', '2026-02-10', '21:17:18', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 2, NULL, 'Web Browser', NULL, '2026-02-10 16:17:18', '2026-02-13 12:33:38'),
(333, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-02-10', '21:19:43', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 4, NULL, 'Web Browser', NULL, '2026-02-10 16:19:43', '2026-02-13 12:33:38'),
(334, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', '2026-02-10', '21:20:16', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 5, NULL, 'Web Browser', NULL, '2026-02-10 16:20:16', '2026-02-13 12:33:38'),
(335, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-02-10', '21:22:02', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 7, NULL, 'Web Browser', NULL, '2026-02-10 16:22:02', '2026-02-13 12:33:38'),
(336, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-02-10', '21:23:51', '21:23:53', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 8, NULL, 'Web Browser', NULL, '2026-02-10 16:23:51', '2026-02-10 16:23:53'),
(338, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-02-10', '21:26:50', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 11, NULL, 'Web Browser', NULL, '2026-02-10 16:26:50', '2026-02-13 12:33:38'),
(339, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', '2026-02-10', '21:36:23', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 21, NULL, 'Web Browser', NULL, '2026-02-10 16:36:23', '2026-02-13 12:33:38'),
(340, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', '2026-02-10', '21:36:51', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 21, NULL, 'Web Browser', NULL, '2026-02-10 16:36:51', '2026-02-13 12:33:38'),
(341, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', '2026-02-10', '21:39:44', '21:39:45', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 24, NULL, 'Web Browser', NULL, '2026-02-10 16:39:44', '2026-02-10 16:39:45'),
(344, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', '2026-02-10', '22:21:58', '09:00:00', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 0, 66, NULL, 'Web Browser', NULL, '2026-02-10 17:21:58', '2026-02-13 12:33:38'),
(346, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-12', '16:36:31', '15:09:25', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1353, 1353, 540, 813, 13.55, 1, 0, NULL, 'Web Browser', NULL, '2026-02-12 11:36:31', '2026-02-13 10:09:25'),
(347, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-11', '02:06:03', '02:17:43', 'Late', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 11, 540, 0, 0.00, 0, 291, NULL, 'Web Browser', NULL, '2026-02-12 21:06:03', '2026-02-12 21:17:43'),
(350, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-13', '18:08:36', '17:29:41', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1401, 1401, 540, 861, 14.35, 1, 0, NULL, 'Web Browser', NULL, '2026-02-13 13:08:36', '2026-02-18 12:29:41'),
(352, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-16', '14:29:37', '17:29:40', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 180, 180, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, '2026-02-16 09:29:37', '2026-02-18 12:29:40'),
(354, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-18', '17:30:01', '06:43:00', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 793, 793, 540, 253, 4.22, 0, 450, 'present', 'Web Browser', NULL, '2026-02-18 12:30:01', '2026-02-28 18:51:36'),
(355, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-18', '19:47:59', '18:09:03', 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1342, 1342, 540, 802, 13.37, 1, 0, NULL, 'Web Browser', NULL, '2026-02-18 14:47:59', '2026-02-20 13:09:03'),
(357, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-19', NULL, NULL, 'Paid Leave', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, 'Paid leave (casual) approved by HR', NULL, NULL, '2026-02-20 13:17:29', '2026-02-20 13:17:29');

-- --------------------------------------------------------

--
-- Stand-in structure for view `employee_attendance_summary`
-- (See below for the actual view)
--
CREATE TABLE `employee_attendance_summary` (
`id` int(11)
,`full_name` varchar(255)
,`employee_id` varchar(50)
,`total_attendance_records` bigint(21)
,`present_days` decimal(22,0)
,`absent_days` decimal(22,0)
,`late_days` decimal(22,0)
,`half_days` decimal(22,0)
,`attendance_percentage` decimal(28,2)
,`total_overtime_hours` decimal(27,2)
,`last_attendance_date` date
,`last_present_date` date
);

-- --------------------------------------------------------

--
-- Table structure for table `employee_bank_accounts`
--

CREATE TABLE `employee_bank_accounts` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `account_title_name` varchar(255) NOT NULL,
  `bank_name` varchar(100) NOT NULL,
  `bank_code` varchar(10) DEFAULT NULL,
  `branch_code` varchar(10) DEFAULT NULL,
  `account_type` enum('Savings','Current','Fixed Deposit') DEFAULT 'Savings',
  `is_primary` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_bank_accounts`
--

INSERT INTO `employee_bank_accounts` (`id`, `employee_id`, `account_number`, `account_title_name`, `bank_name`, `bank_code`, `branch_code`, `account_type`, `is_primary`, `created_at`, `updated_at`) VALUES
(1, 27, 'DG-0063-1768591179129', 'Muhammad Hamza Hassan', 'Alfalah ', NULL, NULL, 'Savings', 1, '2026-01-16 19:19:39', '2026-01-16 19:19:39'),
(2, 28, 'DG-0015-1768593199046', 'Syed Shahmeer Abbas Abidi', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 19:53:19', '2026-01-16 19:53:19'),
(3, 29, 'DG-001-1768593695960', 'Syed Muhammad Ashhar', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 20:01:36', '2026-01-16 20:01:36'),
(4, 30, 'DG-006-1768594175945', 'Wajih ul Hasan', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 20:09:35', '2026-01-16 20:09:35'),
(5, 31, 'DG-005-1768594764295', 'Syed Wahaj Abbas  Abidi', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 20:19:24', '2026-01-16 20:19:24'),
(6, 32, 'DG-0062-1768596440300', 'Humaiz', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 20:47:20', '2026-01-16 20:47:20'),
(7, 33, 'DG-0066-1768596755042', 'Humaiz', 'UBL', NULL, NULL, 'Savings', 1, '2026-01-16 20:52:35', '2026-01-16 20:52:35'),
(8, 34, 'DG-0069-1768597019550', 'Khisal ', 'MCB', NULL, NULL, 'Savings', 1, '2026-01-16 20:56:59', '2026-01-16 20:56:59'),
(9, 35, 'DG-0082-1768597337167', 'MUHAMMAD TAHA KHAN', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 21:02:17', '2026-01-16 21:02:17'),
(10, 36, 'DG-0078-1768597529432', 'FAIQ SHAHZAD', 'Bank Al Habib Limited', NULL, NULL, 'Savings', 1, '2026-01-16 21:05:29', '2026-01-16 21:05:29'),
(11, 37, 'DG-0041-1768597858090', 'Taimoor Shah', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 21:10:58', '2026-01-16 21:10:58'),
(12, 38, 'DG-0057-1768598123567', 'Ebad', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 21:15:23', '2026-01-16 21:15:23'),
(13, 39, 'DG-0033-1768598404211', 'Muhammad Hamza', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 21:20:04', '2026-01-16 21:20:04'),
(14, 40, 'DG-0077-1768598693780', 'Yanish Hyder', 'Easy Paisa', NULL, NULL, 'Savings', 1, '2026-01-16 21:24:53', '2026-01-16 21:24:53'),
(15, 41, 'DG-0034-1768598978090', 'Muhammad Baqar', 'Bank Al Habib', NULL, NULL, 'Savings', 1, '2026-01-16 21:29:38', '2026-01-16 21:29:38'),
(16, 42, 'DG-0059-1768599271590', 'Tahir Khan', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 21:34:31', '2026-01-16 21:34:31'),
(17, 43, 'DG-002-1768601085796', 'Muhammad Hamdan Pir Zada', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 22:04:45', '2026-01-16 22:04:45'),
(18, 44, 'DG-0010-1768601279223', 'Abdul Moiz', 'Meezan', NULL, NULL, 'Savings', 1, '2026-01-16 22:07:59', '2026-01-16 22:07:59'),
(19, 45, 'DG-0072-1768671308631', 'Syed Abdal Ahmed', 'Nayapay', NULL, NULL, 'Savings', 1, '2026-01-17 17:35:08', '2026-01-17 17:35:08'),
(20, 46, 'DG-0047-1768671840226', 'Shahrukh Hussain Siddiqui', 'UBL', NULL, NULL, 'Savings', 1, '2026-01-17 17:44:00', '2026-01-17 17:44:00'),
(21, 47, 'DG-0076-1768672881731', 'Muhammad Uzair', 'NO Bank', NULL, NULL, 'Savings', 1, '2026-01-17 18:01:21', '2026-01-17 18:01:21'),
(24, 54, 'DG-003-1770752012512', 'IBAN 365', 'NBP', NULL, NULL, 'Savings', 1, '2026-02-10 19:33:32', '2026-02-10 19:33:32'),
(25, 55, 'DG-004-1771007129838', 'jcjjfj', 'HBL', NULL, NULL, 'Savings', 1, '2026-02-13 18:25:29', '2026-02-13 18:25:29'),
(26, 56, 'DG-098-1771426022582', 'IBN PKR 123', 'HBL', NULL, NULL, 'Savings', 1, '2026-02-18 14:47:02', '2026-02-18 14:47:02');

-- --------------------------------------------------------

--
-- Table structure for table `Employee_Breaks`
--

CREATE TABLE `Employee_Breaks` (
  `id` int(11) NOT NULL,
  `attendance_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `break_type` enum('Smoke','Dinner','Washroom','Prayer','Other') NOT NULL,
  `break_start_time` time NOT NULL,
  `break_end_time` time DEFAULT NULL,
  `break_duration_minutes` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Employee_Breaks`
--

INSERT INTO `Employee_Breaks` (`id`, `attendance_id`, `employee_id`, `break_type`, `break_start_time`, `break_end_time`, `break_duration_minutes`, `reason`, `created_at`, `updated_at`) VALUES
(1, 10, 30, 'Smoke', '21:42:20', '21:53:03', 10, 'Smoke Break break - Auto-saved on start', '2026-01-17 16:42:20', '2026-01-17 16:53:04'),
(2, 11, 28, 'Dinner', '23:16:16', '00:12:30', 56, 'Dinner Break break - Auto-saved on start', '2026-01-17 18:16:03', '2026-01-17 19:12:17'),
(3, 10, 30, 'Dinner', '23:26:20', '00:19:09', 52, 'Dinner Break break - Auto-saved on start', '2026-01-17 18:26:20', '2026-01-17 19:19:09'),
(4, 14, 41, 'Dinner', '23:26:50', '00:20:47', 53, 'Dinner Break break - Auto-saved on start', '2026-01-17 18:26:52', '2026-01-17 19:20:49'),
(5, 18, 47, 'Dinner', '23:33:31', '23:47:44', 14, 'Dinner Break break - Auto-saved on start', '2026-01-17 18:33:31', '2026-01-17 18:47:44'),
(6, 18, 47, 'Washroom', '00:49:31', '00:58:43', 9, 'Washroom Break break - Auto-saved on start', '2026-01-17 19:49:30', '2026-01-17 19:58:42'),
(7, 15, 27, 'Smoke', '19:50:16', '11:50:26', 13698240, 'Smoke break', '2026-01-17 19:50:16', '2026-01-17 19:50:26'),
(8, 15, 27, 'Dinner', '19:51:05', '11:51:10', 13698240, 'Dinner break', '2026-01-17 19:51:05', '2026-01-17 19:51:10'),
(9, 7, 32, 'Washroom', '01:00:26', '01:00:32', 0, 'Washroom Break break - Auto-saved on start', '2026-01-17 20:00:27', '2026-01-17 20:00:33'),
(10, 10, 30, 'Smoke', '01:21:23', '01:31:21', 9, 'Smoke Break break - Auto-saved on start', '2026-01-17 20:21:23', '2026-01-17 20:31:21'),
(11, 11, 28, 'Washroom', '01:31:41', '01:36:56', 5, 'Washroom Break break - Auto-saved on start', '2026-01-17 20:31:27', '2026-01-17 20:36:42'),
(12, 16, 45, 'Washroom', '01:34:04', '01:37:36', 3, 'Washroom Break break - Auto-saved on start', '2026-01-17 20:34:04', '2026-01-17 20:37:37'),
(13, 11, 28, 'Washroom', '01:37:57', '01:41:15', 3, 'Washroom Break break - Auto-saved on start', '2026-01-17 20:37:43', '2026-01-17 20:41:01'),
(14, 7, 32, 'Dinner', '01:42:34', '02:09:05', 26, 'Dinner Break break - Auto-saved on start', '2026-01-17 20:42:35', '2026-01-17 21:09:06'),
(15, 18, 47, 'Dinner', '01:43:47', '02:08:37', 24, 'Dinner Break break - Auto-saved on start', '2026-01-17 20:43:47', '2026-01-17 21:08:36'),
(16, 26, 30, 'Smoke', '23:25:05', '23:36:47', 11, 'Smoke Break break - Auto-saved on start', '2026-01-19 18:25:06', '2026-01-19 18:36:48'),
(17, 34, 47, 'Washroom', '00:10:41', '00:18:34', 7, 'Washroom Break break - Auto-saved on start', '2026-01-19 19:10:42', '2026-01-19 19:18:35'),
(18, 32, 32, 'Dinner', '00:16:26', '00:17:47', 1, 'Dinner Break break - Auto-saved on start', '2026-01-19 19:16:28', '2026-01-19 19:17:50'),
(19, 35, 28, 'Dinner', '00:38:16', '00:55:41', 17, 'Dinner Break break - Auto-saved on start', '2026-01-19 19:38:02', '2026-01-19 19:55:28'),
(20, 32, 32, 'Washroom', '00:45:19', '00:45:24', 0, 'Washroom Break break - Auto-saved on start', '2026-01-19 19:45:20', '2026-01-19 19:45:26'),
(21, 32, 32, 'Dinner', '00:45:23', '01:03:52', 18, 'Dinner Break break - Auto-saved on start', '2026-01-19 19:45:25', '2026-01-19 20:03:52'),
(22, 28, 38, 'Dinner', '00:46:11', '00:56:19', 10, 'Dinner Break break - Auto-saved on start', '2026-01-19 19:46:12', '2026-01-19 19:56:20'),
(23, 35, 28, 'Washroom', '01:01:29', '01:14:07', 12, 'Washroom Break break - Auto-saved on start', '2026-01-19 20:01:14', '2026-01-19 20:13:53'),
(24, 36, 31, 'Dinner', '01:03:46', '01:28:52', 25, 'Dinner Break break - Auto-saved on start', '2026-01-19 20:03:46', '2026-01-19 20:28:53'),
(25, 34, 47, 'Dinner', '01:20:52', '01:40:36', 19, 'Dinner Break break - Auto-saved on start', '2026-01-19 20:20:53', '2026-01-19 20:40:37'),
(26, 26, 30, 'Dinner', '01:21:47', '02:07:32', 45, 'Dinner Break break - Auto-saved on start', '2026-01-19 20:21:47', '2026-01-19 21:07:33'),
(27, 36, 31, 'Dinner', '01:41:33', '01:57:33', 16, 'Dinner Break break - Auto-saved on start', '2026-01-19 20:41:34', '2026-01-19 20:57:34'),
(28, 23, 45, 'Dinner', '01:42:18', '01:48:32', 6, 'Dinner Break break - Auto-saved on start', '2026-01-19 20:42:19', '2026-01-19 20:48:33'),
(29, 35, 28, 'Dinner', '01:43:16', '02:03:16', 20, 'Dinner Break break - Auto-saved on start', '2026-01-19 20:43:02', '2026-01-19 21:03:02'),
(30, 23, 45, 'Dinner', '01:52:57', '02:11:18', 18, 'Dinner Break break - Auto-saved on start', '2026-01-19 20:52:58', '2026-01-19 21:11:18'),
(31, 23, 45, 'Washroom', '02:41:55', '02:51:42', 9, 'Washroom Break break - Auto-saved on start', '2026-01-19 21:41:55', '2026-01-19 21:51:42'),
(32, 23, 45, 'Washroom', '02:51:56', '02:51:57', 0, 'Washroom Break break - Auto-saved on start', '2026-01-19 21:51:56', '2026-01-19 21:51:58'),
(33, 35, 28, 'Dinner', '03:02:02', '03:23:35', 21, 'Dinner Break break - Auto-saved on start', '2026-01-19 22:01:48', '2026-01-19 22:23:21'),
(34, 25, 40, 'Prayer', '03:06:37', '03:06:43', 0, 'Prayer Break break - Auto-saved on start', '2026-01-19 22:06:38', '2026-01-19 22:06:43'),
(35, 25, 40, 'Dinner', '03:06:45', '03:24:05', 17, 'Dinner Break break - Auto-saved on start', '2026-01-19 22:06:46', '2026-01-19 22:24:05'),
(36, 32, 32, 'Dinner', '04:28:22', '04:30:56', 2, 'Dinner Break break - Auto-saved on start', '2026-01-19 23:28:23', '2026-01-19 23:30:57'),
(37, 35, 28, 'Washroom', '04:34:00', '04:37:33', 3, 'Washroom Break break - Auto-saved on start', '2026-01-19 23:33:47', '2026-01-19 23:37:19'),
(38, 32, 32, 'Washroom', '04:56:29', '05:06:11', 9, 'Washroom Break break - Auto-saved on start', '2026-01-19 23:56:30', '2026-01-20 00:06:12'),
(39, 25, 40, 'Washroom', '04:57:30', '05:03:07', 5, 'Washroom Break break - Auto-saved on start', '2026-01-19 23:57:31', '2026-01-20 00:03:07'),
(40, 31, 36, 'Smoke', '05:04:39', '05:04:42', 0, 'Smoke Break break - Auto-saved on start', '2026-01-20 00:04:30', '2026-01-20 00:04:32'),
(41, 35, 28, 'Washroom', '05:48:28', '05:50:25', 1, 'Washroom Break break - Auto-saved on start', '2026-01-20 00:48:15', '2026-01-20 00:50:12'),
(42, 47, 39, 'Smoke', '21:27:34', '21:29:48', 2, 'Smoke Break break - Auto-saved on start', '2026-01-20 16:27:35', '2026-01-20 16:29:49'),
(43, 44, 32, 'Washroom', '21:27:37', '21:37:20', 9, 'Washroom Break break - Auto-saved on start', '2026-01-20 16:27:39', '2026-01-20 16:37:22'),
(44, 53, 27, 'Smoke', '16:59:42', '09:09:00', 13702569, 'Smoke break', '2026-01-20 16:59:42', '2026-01-20 17:09:01'),
(45, 53, 27, 'Smoke', '17:17:44', '22:17:50', 13703340, 'Smoke break', '2026-01-20 17:17:44', '2026-01-20 17:17:51'),
(46, 46, 36, 'Smoke', '22:37:24', '22:47:28', 10, 'Smoke Break break - Auto-saved on start', '2026-01-20 17:36:48', '2026-01-20 17:46:52'),
(47, 45, 40, 'Dinner', '22:49:32', '23:12:38', 23, 'Dinner Break break - Auto-saved on start', '2026-01-20 17:49:32', '2026-01-20 18:12:39'),
(48, 48, 28, 'Dinner', '00:04:51', '00:56:54', 52, 'Dinner Break break - Auto-saved on start', '2026-01-20 19:04:37', '2026-01-20 19:56:40'),
(49, 47, 39, 'Smoke', '00:53:56', '00:54:40', 0, 'Smoke Break break - Auto-saved on start', '2026-01-20 19:53:56', '2026-01-20 19:54:40'),
(50, 52, 31, 'Dinner', '01:16:17', '01:16:21', 0, 'Dinner Break break - Auto-saved on start', '2026-01-20 20:16:17', '2026-01-20 20:16:21'),
(51, 52, 31, 'Dinner', '01:20:24', '01:51:42', 31, 'Dinner Break break - Auto-saved on start', '2026-01-20 20:20:24', '2026-01-20 20:51:42'),
(52, 46, 36, 'Dinner', '01:24:33', '01:56:02', 31, 'Dinner Break break - Auto-saved on start', '2026-01-20 20:23:58', '2026-01-20 20:55:26'),
(53, 44, 32, 'Dinner', '01:39:17', '01:51:48', 12, 'Dinner Break break - Auto-saved on start', '2026-01-20 20:39:18', '2026-01-20 20:51:49'),
(54, 39, 33, 'Washroom', '01:42:14', '02:04:04', 21, 'Washroom Break break - Auto-saved on start', '2026-01-20 20:42:15', '2026-01-20 21:04:05'),
(55, 39, 33, 'Prayer', '01:42:16', '02:04:05', 21, 'Prayer Break break - Auto-saved on start', '2026-01-20 20:42:16', '2026-01-20 21:04:05'),
(56, 49, 41, 'Dinner', '01:51:45', '02:34:20', 42, 'Dinner Break break - Auto-saved on start', '2026-01-20 20:51:46', '2026-01-20 21:34:22'),
(57, 51, 47, 'Dinner', '01:53:54', '02:04:39', 10, 'Dinner Break break - Auto-saved on start', '2026-01-20 20:53:55', '2026-01-20 21:04:40'),
(58, 47, 39, 'Smoke', '02:02:23', '02:02:29', 0, 'Smoke Break break - Auto-saved on start', '2026-01-20 21:02:23', '2026-01-20 21:02:29'),
(59, 47, 39, 'Dinner', '02:02:36', '02:07:13', 4, 'Dinner Break break - Auto-saved on start', '2026-01-20 21:02:36', '2026-01-20 21:07:14'),
(60, 51, 47, 'Dinner', '02:24:15', '02:45:17', 21, 'Dinner Break break - Auto-saved on start', '2026-01-20 21:24:15', '2026-01-20 21:45:17'),
(61, 46, 36, 'Smoke', '02:30:17', '02:52:32', 22, 'Smoke Break break - Auto-saved on start', '2026-01-20 21:29:41', '2026-01-20 21:51:55'),
(62, 42, 38, 'Dinner', '02:46:08', '03:12:08', 26, 'Dinner Break break - Auto-saved on start', '2026-01-20 21:46:09', '2026-01-20 22:12:09'),
(63, 45, 40, 'Dinner', '02:48:06', '02:54:48', 6, 'Dinner Break break - Auto-saved on start', '2026-01-20 21:48:06', '2026-01-20 21:54:48'),
(64, 37, 45, 'Washroom', '02:59:21', '03:06:19', 6, 'Washroom Break break - Auto-saved on start', '2026-01-20 21:59:21', '2026-01-20 22:06:19'),
(65, 44, 32, 'Washroom', '03:17:20', '03:20:06', 2, 'Washroom Break break - Auto-saved on start', '2026-01-20 22:17:20', '2026-01-20 22:20:07'),
(66, 48, 28, 'Washroom', '03:28:05', '03:34:28', 6, 'Washroom Break break - Auto-saved on start', '2026-01-20 22:27:50', '2026-01-20 22:34:14'),
(67, 52, 31, 'Dinner', '03:32:57', '03:33:01', 0, 'Dinner Break break - Auto-saved on start', '2026-01-20 22:32:58', '2026-01-20 22:33:01'),
(68, 52, 31, 'Dinner', '03:33:04', '03:50:05', 17, 'Dinner Break break - Auto-saved on start', '2026-01-20 22:33:05', '2026-01-20 22:50:06'),
(69, 44, 32, 'Dinner', '03:33:13', '03:50:45', 17, 'Dinner Break break - Auto-saved on start', '2026-01-20 22:33:13', '2026-01-20 22:50:45'),
(70, 37, 45, 'Dinner', '03:34:09', '03:50:29', 16, 'Dinner Break break - Auto-saved on start', '2026-01-20 22:34:10', '2026-01-20 22:50:29'),
(71, 51, 47, 'Dinner', '03:54:36', '04:12:24', 17, 'Dinner Break break - Auto-saved on start', '2026-01-20 22:54:37', '2026-01-20 23:12:25'),
(72, 49, 41, 'Washroom', '03:57:05', '03:59:49', 2, 'Washroom Break break - Auto-saved on start', '2026-01-20 22:57:06', '2026-01-20 22:59:50'),
(73, 49, 41, 'Smoke', '04:21:10', '04:28:52', 7, 'Smoke Break break - Auto-saved on start', '2026-01-20 23:21:11', '2026-01-20 23:28:53'),
(74, 49, 41, 'Washroom', '05:04:04', '05:07:46', 3, 'Washroom Break break - Auto-saved on start', '2026-01-21 00:04:05', '2026-01-21 00:07:47'),
(75, 49, 41, 'Prayer', '05:07:49', '05:27:41', 19, 'Prayer Break break - Auto-saved on start', '2026-01-21 00:07:51', '2026-01-21 00:27:42'),
(76, 51, 47, 'Washroom', '05:14:25', '05:17:27', 3, 'Washroom Break break - Auto-saved on start', '2026-01-21 00:14:25', '2026-01-21 00:17:27'),
(77, 45, 40, 'Dinner', '05:23:40', '05:51:07', 27, 'Dinner Break break - Auto-saved on start', '2026-01-21 00:23:41', '2026-01-21 00:51:08'),
(78, 37, 45, 'Dinner', '05:24:00', '05:50:51', 26, 'Dinner Break break - Auto-saved on start', '2026-01-21 00:24:00', '2026-01-21 00:50:52'),
(79, 48, 28, 'Washroom', '05:31:57', '05:37:18', 5, 'Washroom Break break - Auto-saved on start', '2026-01-21 00:31:42', '2026-01-21 00:37:03'),
(80, 68, 39, 'Smoke', '21:18:51', '21:18:52', 0, 'Smoke Break break - Auto-saved on start', '2026-01-21 16:18:52', '2026-01-21 16:18:53'),
(81, 70, 31, 'Prayer', '21:50:28', '22:12:16', 21, 'Prayer Break break - Auto-saved on start', '2026-01-21 16:50:29', '2026-01-21 17:12:17'),
(82, 67, 32, 'Washroom', '22:13:38', '22:17:03', 3, 'Washroom Break break - Auto-saved on start', '2026-01-21 17:13:41', '2026-01-21 17:17:07'),
(83, 73, 27, 'Dinner', '17:17:44', '09:18:32', 13704000, 'Dinner break', '2026-01-21 17:17:45', '2026-01-21 17:18:37'),
(84, 73, 27, 'Prayer', '17:19:04', '09:19:24', 13704000, 'Prayer break', '2026-01-21 17:19:04', '2026-01-21 17:19:25'),
(85, 68, 39, 'Smoke', '22:24:23', '22:24:51', 0, 'Smoke Break break - Auto-saved on start', '2026-01-21 17:24:23', '2026-01-21 17:24:51'),
(86, 62, 36, 'Smoke', '22:39:17', '22:51:48', 12, 'Smoke Break break - Auto-saved on start', '2026-01-21 17:38:47', '2026-01-21 17:51:18'),
(87, 72, 28, 'Dinner', '23:46:30', '00:45:57', 59, 'Dinner Break break - Auto-saved on start', '2026-01-21 18:46:15', '2026-01-21 19:45:43'),
(88, 64, 38, 'Dinner', '23:52:52', '23:52:59', 0, 'Dinner Break break - Auto-saved on start', '2026-01-21 18:52:53', '2026-01-21 18:53:00'),
(89, 65, 47, 'Dinner', '23:54:01', '00:04:05', 10, 'Dinner Break break - Auto-saved on start', '2026-01-21 18:54:02', '2026-01-21 19:04:06'),
(90, 69, 40, 'Dinner', '00:15:03', '00:35:30', 20, 'Dinner Break break - Auto-saved on start', '2026-01-21 19:15:04', '2026-01-21 19:35:31'),
(91, 67, 32, 'Dinner', '00:23:13', '00:45:22', 22, 'Dinner Break break - Auto-saved on start', '2026-01-21 19:23:16', '2026-01-21 19:45:25'),
(92, 65, 47, 'Washroom', '00:47:31', '00:56:41', 9, 'Washroom Break break - Auto-saved on start', '2026-01-21 19:47:31', '2026-01-21 19:56:41'),
(93, 62, 36, 'Dinner', '01:07:04', '01:30:41', 23, 'Dinner Break break - Auto-saved on start', '2026-01-21 20:06:34', '2026-01-21 20:30:11'),
(94, 70, 31, 'Dinner', '01:07:56', '01:25:18', 17, 'Dinner Break break - Auto-saved on start', '2026-01-21 20:07:56', '2026-01-21 20:26:57'),
(95, 72, 28, 'Washroom', '01:09:46', '01:26:57', 17, 'Washroom Break break - Auto-saved on start', '2026-01-21 20:09:31', '2026-01-21 20:26:42'),
(96, 65, 47, 'Dinner', '01:55:03', '02:10:10', 15, 'Dinner Break break - Auto-saved on start', '2026-01-21 20:55:04', '2026-01-21 21:10:11'),
(97, 59, 45, 'Washroom', '02:14:31', '02:15:58', 1, 'Washroom Break break - Auto-saved on start', '2026-01-21 21:14:31', '2026-01-21 21:15:58'),
(98, 59, 45, 'Dinner', '02:16:35', '02:41:42', 25, 'Dinner Break break - Auto-saved on start', '2026-01-21 21:16:36', '2026-01-21 21:41:43'),
(99, 67, 32, 'Dinner', '02:18:19', '02:29:57', 11, 'Dinner Break break - Auto-saved on start', '2026-01-21 21:18:22', '2026-01-21 21:30:00'),
(100, 62, 36, 'Smoke', '02:29:13', '02:53:29', 24, 'Smoke Break break - Auto-saved on start', '2026-01-21 21:28:43', '2026-01-21 21:52:59'),
(101, 65, 47, 'Washroom', '03:18:26', '03:19:04', 0, 'Washroom Break break - Auto-saved on start', '2026-01-21 22:18:26', '2026-01-21 22:19:05'),
(102, 65, 47, 'Washroom', '03:20:07', '03:35:22', 15, 'Washroom Break break - Auto-saved on start', '2026-01-21 22:20:07', '2026-01-21 22:35:23'),
(103, 70, 31, 'Dinner', '03:39:54', '04:08:04', 28, 'Dinner Break break - Auto-saved on start', '2026-01-21 22:39:54', '2026-01-21 23:08:05'),
(104, 59, 45, 'Dinner', '03:40:19', '04:10:25', 30, 'Dinner Break break - Auto-saved on start', '2026-01-21 22:40:19', '2026-01-21 23:10:26'),
(105, 69, 40, 'Dinner', '03:44:12', '04:07:50', 23, 'Dinner Break break - Auto-saved on start', '2026-01-21 22:44:13', '2026-01-21 23:07:51'),
(106, 62, 36, 'Dinner', '04:12:13', '04:47:23', 35, 'Dinner Break break - Auto-saved on start', '2026-01-21 23:11:43', '2026-01-21 23:46:53'),
(107, 65, 47, 'Dinner', '04:11:49', '04:44:33', 32, 'Dinner Break break - Auto-saved on start', '2026-01-21 23:11:50', '2026-01-21 23:44:34'),
(108, 59, 45, 'Washroom', '04:51:21', '04:59:42', 8, 'Washroom Break break - Auto-saved on start', '2026-01-21 23:51:21', '2026-01-21 23:59:43'),
(109, 91, 39, 'Washroom', '22:24:25', '22:24:26', 0, 'Washroom Break break - Auto-saved on start', '2026-01-22 17:24:26', '2026-01-22 17:24:27'),
(110, 80, 36, 'Smoke', '22:43:24', '22:51:45', 8, 'Smoke Break break - Auto-saved on start', '2026-01-22 17:43:46', '2026-01-22 17:52:07'),
(111, 83, 28, 'Dinner', '23:09:25', '23:28:11', 18, 'Dinner Break break - Auto-saved on start', '2026-01-22 18:09:10', '2026-01-22 18:27:57'),
(112, 90, 27, 'Smoke', '18:09:52', '23:11:00', 13706221, 'Smoke break', '2026-01-22 18:09:52', '2026-01-22 18:10:52'),
(113, 85, 32, 'Dinner', '23:10:40', '23:18:10', 7, 'Dinner Break break - Auto-saved on start', '2026-01-22 18:10:44', '2026-01-22 18:18:11'),
(114, 83, 28, 'Dinner', '23:55:23', '00:54:25', 59, 'Dinner Break break - Auto-saved on start', '2026-01-22 18:55:08', '2026-01-22 19:54:09'),
(115, 80, 36, 'Washroom', '23:55:29', '23:59:08', 3, 'Washroom Break break - Auto-saved on start', '2026-01-22 18:55:51', '2026-01-22 18:59:30'),
(116, 78, 45, 'Washroom', '00:01:20', '00:02:50', 1, 'Washroom Break break - Auto-saved on start', '2026-01-22 19:01:21', '2026-01-22 19:02:51'),
(117, 78, 45, 'Dinner', '00:31:33', '00:52:27', 20, 'Dinner Break break - Auto-saved on start', '2026-01-22 19:31:34', '2026-01-22 19:52:28'),
(118, 88, 41, 'Dinner', '01:12:32', '02:07:22', 54, 'Dinner Break break - Auto-saved on start', '2026-01-22 20:12:34', '2026-01-22 21:07:24'),
(119, 86, 47, 'Dinner', '01:14:05', '02:46:38', 92, 'Dinner Break break - Auto-saved on start', '2026-01-22 20:14:05', '2026-01-22 21:46:38'),
(120, 80, 36, 'Dinner', '01:38:52', '02:01:48', 22, 'Dinner Break break - Auto-saved on start', '2026-01-22 20:39:14', '2026-01-22 21:02:10'),
(121, 78, 45, 'Dinner', '01:41:28', '02:04:27', 22, 'Dinner Break break - Auto-saved on start', '2026-01-22 20:41:29', '2026-01-22 21:04:29'),
(122, 80, 36, 'Smoke', '02:48:22', '03:01:13', 12, 'Smoke Break break - Auto-saved on start', '2026-01-22 21:48:44', '2026-01-22 22:01:35'),
(123, 85, 32, 'Dinner', '02:52:54', '03:14:09', 21, 'Dinner Break break - Auto-saved on start', '2026-01-22 21:52:55', '2026-01-22 22:14:10'),
(124, 78, 45, 'Dinner', '02:53:12', '03:00:43', 7, 'Dinner Break break - Auto-saved on start', '2026-01-22 21:53:13', '2026-01-22 22:00:44'),
(125, 85, 32, 'Smoke', '04:13:29', '04:13:31', 0, 'Smoke Break break - Auto-saved on start', '2026-01-22 23:13:30', '2026-01-22 23:13:31'),
(126, 85, 32, 'Washroom', '04:13:32', '04:16:16', 2, 'Washroom Break break - Auto-saved on start', '2026-01-22 23:13:32', '2026-01-22 23:16:16'),
(127, 86, 47, 'Washroom', '04:54:33', '05:04:07', 9, 'Washroom Break break - Auto-saved on start', '2026-01-22 23:54:33', '2026-01-23 00:04:07'),
(128, 88, 41, 'Prayer', '05:09:18', '05:27:30', 18, 'Prayer Break break - Auto-saved on start', '2026-01-23 00:09:20', '2026-01-23 00:27:32'),
(129, 83, 28, 'Washroom', '05:21:36', '05:25:53', 4, 'Washroom Break break - Auto-saved on start', '2026-01-23 00:21:22', '2026-01-23 00:25:39'),
(130, 85, 32, 'Dinner', '05:24:32', '05:40:47', 16, 'Dinner Break break - Auto-saved on start', '2026-01-23 00:24:33', '2026-01-23 00:40:48'),
(131, 80, 36, 'Smoke', '05:24:18', '05:33:20', 9, 'Smoke Break break - Auto-saved on start', '2026-01-23 00:24:40', '2026-01-23 00:33:43'),
(132, 93, 42, 'Dinner', '20:32:02', NULL, 637, 'Dinner Break break - Auto-saved on start', '2026-01-23 15:32:01', '2026-01-24 02:09:11'),
(133, 99, 37, 'Dinner', '21:12:47', '21:12:50', 0, 'Dinner Break break - Auto-saved on start', '2026-01-23 16:12:48', '2026-01-23 16:12:51'),
(134, 104, 31, 'Prayer', '21:41:44', '22:28:44', 47, 'Prayer Break break - Auto-saved on start', '2026-01-23 16:41:45', '2026-01-23 17:28:44'),
(135, 107, 39, 'Washroom', '06:22:03', '06:22:04', 0, 'Washroom Break break - Auto-saved on start', '2026-01-23 17:35:10', '2026-01-23 17:35:11'),
(136, 97, 32, 'Dinner', '23:16:23', '23:26:24', 10, 'Dinner Break break - Auto-saved on start', '2026-01-23 18:16:24', '2026-01-23 18:26:26'),
(137, 101, 36, 'Washroom', '23:43:47', '23:47:45', 3, 'Washroom Break break - Auto-saved on start', '2026-01-23 18:43:40', '2026-01-23 18:47:38'),
(138, 108, 28, 'Dinner', '23:53:26', '00:26:21', 32, 'Dinner Break break - Auto-saved on start', '2026-01-23 18:53:11', '2026-01-23 19:26:07'),
(139, 95, 45, 'Dinner', '23:54:11', '00:10:11', 16, 'Dinner Break break - Auto-saved on start', '2026-01-23 18:54:12', '2026-01-23 19:10:13'),
(140, 99, 37, 'Dinner', '00:53:58', '01:27:13', 33, 'Dinner Break break - Auto-saved on start', '2026-01-23 19:53:59', '2026-01-23 20:27:14'),
(141, 94, 46, 'Dinner', '00:54:01', '01:27:22', 33, 'Dinner Break break - Auto-saved on start', '2026-01-23 19:54:02', '2026-01-23 20:27:23'),
(142, 105, 40, 'Dinner', '01:09:20', '01:56:09', 46, 'Dinner Break break - Auto-saved on start', '2026-01-23 20:09:21', '2026-01-23 20:56:10'),
(143, 95, 45, 'Dinner', '01:10:33', '01:25:40', 15, 'Dinner Break break - Auto-saved on start', '2026-01-23 20:10:35', '2026-01-23 20:25:42'),
(144, 108, 28, 'Dinner', '01:21:41', '02:11:20', 49, 'Dinner Break break - Auto-saved on start', '2026-01-23 20:21:26', '2026-01-23 21:11:05'),
(145, 97, 32, 'Dinner', '01:24:18', '01:46:29', 22, 'Dinner Break break - Auto-saved on start', '2026-01-23 20:24:20', '2026-01-23 20:46:30'),
(146, 106, 33, 'Washroom', '02:47:44', '03:04:55', 17, 'Washroom Break break - Auto-saved on start', '2026-01-23 21:47:44', '2026-01-23 22:04:56'),
(147, 106, 33, 'Prayer', '02:47:44', '03:04:56', 17, 'Prayer Break break - Auto-saved on start', '2026-01-23 21:47:45', '2026-01-23 22:04:56'),
(148, 101, 36, 'Dinner', '03:04:00', '03:27:03', 23, 'Dinner Break break - Auto-saved on start', '2026-01-23 22:03:53', '2026-01-23 22:26:57'),
(149, 101, 36, 'Dinner', '04:31:32', '04:31:43', 0, 'Dinner Break break - Auto-saved on start', '2026-01-23 23:31:25', '2026-01-23 23:31:36'),
(150, 101, 36, 'Dinner', '04:32:01', '05:03:38', 31, 'Dinner Break break - Auto-saved on start', '2026-01-23 23:31:54', '2026-01-24 00:03:31'),
(151, 97, 32, 'Washroom', '04:35:28', '04:38:12', 2, 'Washroom Break break - Auto-saved on start', '2026-01-23 23:35:30', '2026-01-23 23:38:14'),
(152, 100, 41, 'Prayer', '05:04:04', '05:14:06', 10, 'Prayer Break break - Auto-saved on start', '2026-01-24 00:04:04', '2026-01-24 00:14:06'),
(153, 110, 33, 'Dinner', '23:14:41', '23:27:51', 13, 'Dinner Break break - Auto-saved on start', '2026-01-24 18:14:42', '2026-01-24 18:27:51'),
(154, 121, 28, 'Dinner', '23:17:08', '00:18:02', 60, 'Dinner Break break - Auto-saved on start', '2026-01-24 18:16:53', '2026-01-24 19:17:48'),
(155, 120, 45, 'Washroom', '23:25:57', '23:27:56', 1, 'Washroom Break break - Auto-saved on start', '2026-01-24 18:25:57', '2026-01-24 18:27:57'),
(156, 120, 45, 'Dinner', '23:27:57', '23:50:12', 22, 'Dinner Break break - Auto-saved on start', '2026-01-24 18:27:58', '2026-01-24 18:50:12'),
(157, 114, 32, 'Dinner', '23:50:58', '00:22:28', 31, 'Dinner Break break - Auto-saved on start', '2026-01-24 18:51:00', '2026-01-24 19:22:30'),
(158, 111, 36, 'Dinner', '00:20:40', '00:52:36', 31, 'Dinner Break break - Auto-saved on start', '2026-01-24 19:20:14', '2026-01-24 19:52:11'),
(159, 123, 31, 'Dinner', '00:53:14', '01:09:47', 16, 'Dinner Break break - Auto-saved on start', '2026-01-24 19:53:15', '2026-01-24 20:09:48'),
(160, 120, 45, 'Dinner', '00:53:26', '01:57:05', 63, 'Dinner Break break - Auto-saved on start', '2026-01-24 19:53:26', '2026-01-24 20:57:06'),
(161, 132, 28, 'Dinner', '22:14:19', '22:39:30', 25, 'Dinner Break break - Auto-saved on start', '2026-01-26 17:14:04', '2026-01-26 17:39:15'),
(162, 126, 36, 'Smoke', '22:47:06', '22:58:10', 11, 'Smoke Break break - Auto-saved on start', '2026-01-26 17:47:20', '2026-01-26 17:58:24'),
(163, 127, 46, 'Dinner', '23:01:59', '23:21:03', 19, 'Dinner Break break - Auto-saved on start', '2026-01-26 18:02:00', '2026-01-26 18:21:04'),
(164, 136, 40, 'Dinner', '23:02:02', '23:20:48', 18, 'Dinner Break break - Auto-saved on start', '2026-01-26 18:02:03', '2026-01-26 18:20:49'),
(165, 129, 32, 'Washroom', '23:49:19', '23:49:42', 0, 'Washroom Break break - Auto-saved on start', '2026-01-26 18:49:22', '2026-01-26 18:49:45'),
(166, 131, 33, 'Washroom', '00:29:11', '00:34:50', 5, 'Washroom Break break - Auto-saved on start', '2026-01-26 19:30:03', '2026-01-26 19:35:42'),
(167, 126, 36, 'Washroom', '00:39:17', '00:43:25', 4, 'Washroom Break break - Auto-saved on start', '2026-01-26 19:39:31', '2026-01-26 19:43:39'),
(168, 134, 31, 'Dinner', '01:01:54', '01:25:35', 23, 'Dinner Break break - Auto-saved on start', '2026-01-26 20:01:54', '2026-01-26 20:25:36'),
(169, 129, 32, 'Dinner', '01:01:56', '01:05:42', 3, 'Dinner Break break - Auto-saved on start', '2026-01-26 20:01:56', '2026-01-26 20:05:42'),
(170, 126, 36, 'Dinner', '01:11:52', '01:56:06', 44, 'Dinner Break break - Auto-saved on start', '2026-01-26 20:12:06', '2026-01-26 20:56:20'),
(171, 134, 31, 'Dinner', '01:31:41', '01:56:21', 24, 'Dinner Break break - Auto-saved on start', '2026-01-26 20:31:41', '2026-01-26 20:56:21'),
(172, 129, 32, 'Dinner', '01:36:12', '01:53:37', 17, 'Dinner Break break - Auto-saved on start', '2026-01-26 20:36:13', '2026-01-26 20:53:38'),
(173, 138, 47, 'Dinner', '01:51:36', '02:09:04', 17, 'Dinner Break break - Auto-saved on start', '2026-01-26 20:51:36', '2026-01-26 21:09:05'),
(174, 135, 39, 'Smoke', '02:01:04', '02:01:12', 0, 'Smoke Break break - Auto-saved on start', '2026-01-26 21:01:04', '2026-01-26 21:01:12'),
(175, 125, 45, 'Washroom', '02:40:17', '02:42:05', 1, 'Washroom Break break - Auto-saved on start', '2026-01-26 21:40:17', '2026-01-26 21:42:06'),
(176, 125, 45, 'Dinner', '02:42:06', '03:04:49', 22, 'Dinner Break break - Auto-saved on start', '2026-01-26 21:42:06', '2026-01-26 22:04:49'),
(177, 129, 32, 'Dinner', '03:20:26', '03:47:09', 26, 'Dinner Break break - Auto-saved on start', '2026-01-26 22:20:27', '2026-01-26 22:47:10'),
(178, 132, 28, 'Dinner', '03:57:52', '05:28:07', 90, 'Dinner Break break - Auto-saved on start', '2026-01-26 22:57:36', '2026-01-27 00:27:51'),
(179, 129, 32, 'Dinner', '04:28:32', '04:28:40', 0, 'Dinner Break break - Auto-saved on start', '2026-01-26 23:28:32', '2026-01-26 23:28:41'),
(180, 133, 41, 'Prayer', '05:11:34', '05:37:18', 25, 'Prayer Break break - Auto-saved on start', '2026-01-27 00:11:35', '2026-01-27 00:37:19'),
(181, 152, 39, 'Smoke', '21:28:01', '21:28:05', 0, 'Smoke Break break - Auto-saved on start', '2026-01-27 16:28:02', '2026-01-27 16:28:05'),
(182, 141, 36, 'Smoke', '22:41:47', '22:55:36', 13, 'Smoke Break break - Auto-saved on start', '2026-01-27 17:41:38', '2026-01-27 17:55:27'),
(183, 146, 32, 'Dinner', '23:41:05', '00:10:35', 29, 'Dinner Break break - Auto-saved on start', '2026-01-27 18:41:06', '2026-01-27 19:10:36'),
(184, 141, 36, 'Dinner', '00:16:24', '00:51:09', 34, 'Dinner Break break - Auto-saved on start', '2026-01-27 19:16:14', '2026-01-27 19:50:59'),
(185, 143, 27, 'Smoke', '19:25:33', '00:33:49', 308, 'Smoke break', '2026-01-27 19:25:33', '2026-01-27 19:33:40'),
(186, 156, 44, 'Smoke', '00:32:27', NULL, 0, 'Smoke Break break - Auto-saved on start', '2026-01-27 19:32:17', '2026-01-27 19:32:48'),
(187, 145, 47, 'Dinner', '00:58:57', '01:22:34', 23, 'Dinner Break break - Auto-saved on start', '2026-01-27 19:58:58', '2026-01-27 20:22:35'),
(188, 155, 40, 'Washroom', '01:20:33', '01:26:21', 5, 'Washroom Break break - Auto-saved on start', '2026-01-27 20:20:34', '2026-01-27 20:26:22'),
(189, 155, 40, 'Dinner', '01:47:06', '02:05:40', 18, 'Dinner Break break - Auto-saved on start', '2026-01-27 20:47:06', '2026-01-27 21:05:40'),
(190, 146, 32, 'Washroom', '01:52:37', '02:01:52', 9, 'Washroom Break break - Auto-saved on start', '2026-01-27 20:52:39', '2026-01-27 21:01:53'),
(191, 146, 32, 'Dinner', '02:57:19', '03:23:57', 26, 'Dinner Break break - Auto-saved on start', '2026-01-27 21:57:20', '2026-01-27 22:23:58'),
(192, 155, 40, 'Dinner', '03:02:08', '03:23:24', 21, 'Dinner Break break - Auto-saved on start', '2026-01-27 22:02:09', '2026-01-27 22:23:25'),
(193, 153, 45, 'Dinner', '03:02:12', '03:23:22', 21, 'Dinner Break break - Auto-saved on start', '2026-01-27 22:02:12', '2026-01-27 22:23:22'),
(194, 141, 36, 'Smoke', '04:24:04', '04:35:28', 11, 'Smoke Break break - Auto-saved on start', '2026-01-27 23:23:55', '2026-01-27 23:35:19'),
(195, 145, 47, 'Dinner', '04:35:50', '04:46:18', 10, 'Dinner Break break - Auto-saved on start', '2026-01-27 23:35:50', '2026-01-27 23:46:19'),
(196, 140, 33, 'Washroom', '05:31:54', '05:39:36', 7, 'Washroom Break break - Auto-saved on start', '2026-01-28 00:31:27', '2026-01-28 00:39:09'),
(197, 162, 36, 'Smoke', '22:48:46', '01:52:05', 183, 'Smoke Break break - Auto-saved on start', '2026-01-28 17:48:10', '2026-01-28 20:51:30'),
(198, 167, 31, 'Dinner', '23:13:16', '23:35:26', 22, 'Dinner Break break - Auto-saved on start', '2026-01-28 18:13:16', '2026-01-28 18:35:27'),
(199, 167, 31, 'Prayer', '23:35:26', '23:35:28', 0, 'Prayer Break break - Auto-saved on start', '2026-01-28 18:35:26', '2026-01-28 18:35:28'),
(200, 168, 28, 'Dinner', '00:37:40', '01:29:50', 52, 'Dinner Break break - Auto-saved on start', '2026-01-28 19:37:23', '2026-01-28 20:29:33'),
(201, 163, 32, 'Dinner', '00:39:26', '00:55:22', 15, 'Dinner Break break - Auto-saved on start', '2026-01-28 19:39:28', '2026-01-28 19:55:25'),
(202, 163, 32, 'Washroom', '01:02:13', '01:02:34', 0, 'Washroom Break break - Auto-saved on start', '2026-01-28 20:02:15', '2026-01-28 20:02:36'),
(203, 167, 31, 'Dinner', '01:05:54', '01:31:16', 25, 'Dinner Break break - Auto-saved on start', '2026-01-28 20:05:54', '2026-01-28 20:31:16'),
(204, 164, 47, 'Dinner', '02:27:13', '02:53:10', 25, 'Dinner Break break - Auto-saved on start', '2026-01-28 21:27:13', '2026-01-28 21:53:10'),
(205, 163, 32, 'Dinner', '03:07:29', '03:40:18', 32, 'Dinner Break break - Auto-saved on start', '2026-01-28 22:07:31', '2026-01-28 22:40:20'),
(206, 164, 47, 'Dinner', '05:32:37', NULL, 2, 'Dinner Break break - Auto-saved on start', '2026-01-29 00:32:37', '2026-01-29 00:35:07'),
(207, 166, 33, 'Washroom', '05:40:53', '05:45:51', 4, 'Washroom Break break - Auto-saved on start', '2026-01-29 00:40:48', '2026-01-29 00:45:46'),
(208, 180, 47, 'Dinner', '01:50:26', NULL, 15, 'Dinner Break break - Auto-saved on start', '2026-01-29 20:50:27', '2026-01-29 21:05:36'),
(209, 176, 36, 'Dinner', '03:10:50', '03:34:02', 23, 'Dinner Break break - Auto-saved on start', '2026-01-29 22:11:00', '2026-01-29 22:34:12'),
(210, 188, 31, 'Dinner', '04:03:58', '04:32:57', 28, 'Dinner Break break - Auto-saved on start', '2026-01-29 23:03:59', '2026-01-29 23:32:58'),
(211, 176, 36, 'Dinner', '05:23:19', '05:23:45', 0, 'Dinner Break break - Auto-saved on start', '2026-01-30 00:23:29', '2026-01-30 00:23:55'),
(212, 190, 44, 'Smoke', '05:44:55', NULL, 33, 'Smoke Break break - Auto-saved on start', '2026-01-30 00:44:44', '2026-01-30 01:17:59'),
(213, 195, 36, 'Smoke', '22:53:25', '23:04:42', 11, 'Smoke Break break - Auto-saved on start', '2026-01-30 17:54:06', '2026-01-30 18:05:23'),
(214, 199, 28, 'Dinner', '22:59:19', '23:59:32', 60, 'Dinner Break break - Auto-saved on start', '2026-01-30 17:59:03', '2026-01-30 18:59:15'),
(215, 193, 45, 'Washroom', '23:39:54', '23:42:00', 2, 'Washroom Break break - Auto-saved on start', '2026-01-30 18:39:55', '2026-01-30 18:42:01'),
(216, 203, 39, 'Smoke', '00:41:58', '00:44:05', 2, 'Smoke Break break - Auto-saved on start', '2026-01-30 19:41:58', '2026-01-30 19:44:05'),
(217, 194, 47, 'Dinner', '02:15:23', '03:15:35', 60, 'Dinner Break break - Auto-saved on start', '2026-01-30 21:15:23', '2026-01-30 22:15:35'),
(218, 201, 31, 'Dinner', '02:15:22', '02:43:29', 28, 'Dinner Break break - Auto-saved on start', '2026-01-30 21:15:23', '2026-01-30 21:43:31'),
(219, 193, 45, 'Dinner', '02:16:58', '02:34:31', 17, 'Dinner Break break - Auto-saved on start', '2026-01-30 21:16:59', '2026-01-30 21:34:32'),
(220, 206, 32, 'Dinner', '02:47:29', '03:09:21', 21, 'Dinner Break break - Auto-saved on start', '2026-01-30 21:47:31', '2026-01-30 22:09:23'),
(221, 199, 28, 'Washroom', '03:21:04', '03:30:11', 9, 'Washroom Break break - Auto-saved on start', '2026-01-30 22:20:48', '2026-01-30 22:29:54'),
(222, 201, 31, 'Dinner', '05:44:41', NULL, NULL, 'Dinner Break break - Auto-saved on start', '2026-01-31 00:44:43', '2026-01-31 00:44:43'),
(223, 206, 32, 'Dinner', '05:46:49', NULL, 21, 'Dinner Break break - Auto-saved on start', '2026-01-31 00:46:50', '2026-01-31 01:08:21'),
(224, 223, 47, 'Dinner', '23:50:55', '00:50:03', 59, 'Dinner Break break - Auto-saved on start', '2026-01-31 18:50:54', '2026-01-31 19:50:04'),
(225, 219, 28, 'Dinner', '00:34:36', '01:15:01', 40, 'Dinner Break break - Auto-saved on start', '2026-01-31 19:34:20', '2026-01-31 20:14:44'),
(226, 235, 40, 'Washroom', '22:48:58', '22:59:46', 10, 'Washroom Break break - Auto-saved on start', '2026-02-02 17:48:58', '2026-02-02 17:59:46'),
(227, 236, 28, 'Smoke', '23:53:45', '23:53:50', 0, 'Smoke break - Auto-saved on start', '2026-02-02 18:53:28', '2026-02-02 18:53:33'),
(228, 236, 28, 'Dinner', '23:53:55', '23:53:59', 0, 'Dinner break - Auto-saved on start', '2026-02-02 18:53:37', '2026-02-02 18:53:42'),
(229, 242, 32, 'Dinner', '00:11:24', '00:35:43', 24, 'Dinner Break break - Auto-saved on start', '2026-02-02 19:11:25', '2026-02-02 19:35:44'),
(230, 233, 31, 'Dinner', '00:15:03', '00:55:57', 40, 'Dinner Break break - Auto-saved on start', '2026-02-02 19:15:04', '2026-02-02 19:55:58'),
(231, 239, 47, 'Dinner', '01:19:19', '01:36:00', 16, 'Dinner Break break - Auto-saved on start', '2026-02-02 20:19:20', '2026-02-02 20:36:00'),
(232, 230, 33, 'Washroom', '03:36:23', '04:08:37', 32, 'Washroom Break break - Auto-saved on start', '2026-02-02 22:37:18', '2026-02-02 23:09:32'),
(233, 230, 33, 'Prayer', '03:36:24', '04:08:38', 32, 'Prayer Break break - Auto-saved on start', '2026-02-02 22:37:19', '2026-02-02 23:09:33'),
(234, 233, 31, 'Dinner', '03:50:51', '04:11:06', 20, 'Dinner Break break - Auto-saved on start', '2026-02-02 22:50:52', '2026-02-02 23:11:08'),
(235, 239, 47, 'Dinner', '04:34:49', '04:56:31', 21, 'Dinner Break break - Auto-saved on start', '2026-02-02 23:34:50', '2026-02-02 23:56:32'),
(236, 236, 28, 'Dinner', '04:36:08', '04:56:46', 20, 'Dinner Break break - Auto-saved on start', '2026-02-02 23:35:51', '2026-02-02 23:56:29'),
(237, 249, 47, 'Dinner', '22:25:38', '22:35:44', 10, 'Dinner Break break - Auto-saved on start', '2026-02-03 17:25:37', '2026-02-03 17:35:44'),
(238, 256, 32, 'Prayer', '00:05:31', NULL, 5, 'Prayer Break break - Auto-saved on start', '2026-02-03 19:05:31', '2026-02-03 19:10:42'),
(239, 254, 28, 'Dinner', '00:43:07', '01:49:22', 66, 'Dinner Break break - Auto-saved on start', '2026-02-03 19:42:50', '2026-02-03 20:49:05'),
(240, 249, 47, 'Dinner', '03:20:35', '03:53:49', 33, 'Dinner Break break - Auto-saved on start', '2026-02-03 22:20:35', '2026-02-03 22:53:50'),
(241, 252, 31, 'Dinner', '04:08:04', '04:26:28', 18, 'Dinner Break break - Auto-saved on start', '2026-02-03 23:08:04', '2026-02-03 23:26:29'),
(242, 268, 32, 'Dinner', '23:14:25', '23:16:30', 2, 'Dinner Break break - Auto-saved on start', '2026-02-04 18:14:26', '2026-02-04 18:16:31'),
(243, 268, 32, 'Dinner', '23:40:15', '23:53:49', 13, 'Dinner Break break - Auto-saved on start', '2026-02-04 18:40:16', '2026-02-04 18:53:50'),
(244, 268, 32, 'Dinner', '00:47:01', '01:19:32', 32, 'Dinner Break break - Auto-saved on start', '2026-02-04 19:47:02', '2026-02-04 20:19:34'),
(245, 270, 47, 'Dinner', '01:20:48', '02:20:47', 59, 'Dinner Break break - Auto-saved on start', '2026-02-04 20:20:49', '2026-02-04 21:20:48'),
(246, 261, 33, 'Washroom', '01:51:46', '02:03:40', 11, 'Washroom Break break - Auto-saved on start', '2026-02-04 21:03:34', '2026-02-04 21:15:29'),
(247, 261, 33, 'Prayer', '02:29:34', '02:47:57', 18, 'Prayer Break break - Auto-saved on start', '2026-02-04 21:41:22', '2026-02-04 21:59:45'),
(248, 269, 31, 'Dinner', '03:51:28', '03:51:28', 0, 'Dinner Break break - Auto-saved on start', '2026-02-04 22:51:28', '2026-02-04 22:51:29'),
(249, 290, 28, 'Dinner', '00:05:46', '00:33:12', 27, 'Dinner Break break - Auto-saved on start', '2026-02-05 19:05:29', '2026-02-05 19:32:54'),
(250, 290, 28, 'Washroom', '01:25:07', '01:38:43', 13, 'Washroom Break break - Auto-saved on start', '2026-02-05 20:24:49', '2026-02-05 20:38:25'),
(251, 280, 45, 'Dinner', '02:19:12', '02:46:56', 27, 'Dinner Break break - Auto-saved on start', '2026-02-05 21:19:13', '2026-02-05 21:46:57'),
(252, 278, 33, 'Washroom', '02:24:20', '02:35:52', 11, 'Washroom Break break - Auto-saved on start', '2026-02-05 22:13:27', '2026-02-05 22:24:59'),
(253, 290, 28, 'Dinner', '03:22:22', '03:22:24', 0, 'Dinner Break break - Auto-saved on start', '2026-02-05 22:22:04', '2026-02-05 22:22:07'),
(254, 278, 33, 'Prayer', '03:20:15', '03:38:42', 18, 'Prayer Break break - Auto-saved on start', '2026-02-05 23:09:23', '2026-02-05 23:27:49'),
(255, 283, 39, 'Smoke', '05:45:19', '05:46:09', 0, 'Smoke Break break - Auto-saved on start', '2026-02-06 00:45:19', '2026-02-06 00:46:10'),
(256, 304, 28, 'Dinner', '00:43:37', '01:17:12', 33, 'Dinner Break break - Auto-saved on start', '2026-02-06 19:43:19', '2026-02-06 20:16:54'),
(257, 307, 32, 'Dinner', '20:34:19', '01:43:54', 309, 'Dinner break', '2026-02-06 20:34:20', '2026-02-06 20:43:56'),
(258, 308, 31, 'Dinner', '20:34:50', '01:51:43', 316, 'Dinner break', '2026-02-06 20:34:50', '2026-02-06 20:51:45'),
(259, 309, 47, 'Dinner', '20:54:20', '02:11:35', 317, 'Dinner break', '2026-02-06 20:54:20', '2026-02-06 21:11:35'),
(260, 309, 47, 'Dinner', '20:54:20', '02:11:36', 317, 'Dinner break', '2026-02-06 20:54:20', '2026-02-06 21:11:37'),
(261, 297, 45, 'Dinner', '21:19:51', '02:50:20', 330, 'Dinner break', '2026-02-06 21:19:51', '2026-02-06 21:50:21'),
(262, 299, 36, 'Dinner', '02:17:38', '02:48:13', 30, 'Dinner Break break - Auto-saved on start', '2026-02-06 21:23:14', '2026-02-06 21:59:01'),
(263, 308, 31, 'Dinner', '22:44:18', '04:20:40', 336, 'Dinner break', '2026-02-06 22:44:18', '2026-02-06 23:20:41'),
(264, 307, 32, 'Dinner', '22:44:46', '03:56:23', 311, 'Dinner break', '2026-02-06 22:44:46', '2026-02-06 22:56:25'),
(265, 292, 33, 'Washroom', '23:12:18', '04:01:43', 289, 'Washroom break', '2026-02-06 23:12:18', '2026-02-06 23:29:56'),
(266, 292, 33, 'Washroom', '23:12:20', '03:44:11', 271, 'Washroom break', '2026-02-06 23:12:20', '2026-02-06 23:12:24'),
(267, 292, 33, 'Prayer', '23:12:20', '04:01:38', 289, 'Prayer break', '2026-02-06 23:12:21', '2026-02-06 23:29:52'),
(268, 319, 36, 'Dinner', '00:27:38', '00:59:35', 31, 'Dinner Break break - Auto-saved on start', '2026-02-09 19:27:31', '2026-02-09 19:59:31'),
(269, 311, 45, 'Dinner', '20:49:01', '02:28:35', 339, 'Dinner break', '2026-02-09 20:49:01', '2026-02-09 21:28:35'),
(270, 318, 33, 'Washroom', '21:46:51', '02:55:20', 308, 'Washroom break', '2026-02-09 21:46:51', '2026-02-09 21:56:30'),
(271, 318, 33, 'Prayer', '22:29:45', '03:40:49', 311, 'Prayer break', '2026-02-09 22:29:45', '2026-02-09 22:41:57'),
(272, 320, 32, 'Dinner', '22:50:06', '03:50:19', 300, 'Dinner break', '2026-02-09 22:50:06', '2026-02-09 22:50:20'),
(273, 330, 36, 'Dinner', '00:18:29', NULL, 4, 'Dinner Break break - Auto-saved on start', '2026-02-10 19:17:51', '2026-02-10 19:22:18');

-- --------------------------------------------------------

--
-- Table structure for table `Employee_Checkout_Missing`
--

CREATE TABLE `Employee_Checkout_Missing` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Manages employees who forgot to check out';

--
-- Dumping data for table `Employee_Checkout_Missing`
--

INSERT INTO `Employee_Checkout_Missing` (`id`, `original_attendance_id`, `employee_id`, `email`, `name`, `attendance_date`, `check_in_time`, `check_out_time`, `status`, `total_breaks_taken`, `smoke_break_count`, `dinner_break_count`, `washroom_break_count`, `prayer_break_count`, `smoke_break_duration_minutes`, `dinner_break_duration_minutes`, `washroom_break_duration_minutes`, `prayer_break_duration_minutes`, `total_break_duration_minutes`, `gross_working_time_minutes`, `net_working_time_minutes`, `expected_working_time_minutes`, `overtime_minutes`, `overtime_hours`, `on_time`, `late_by_minutes`, `remarks`, `device_info`, `ip_address`, `missing_reason`, `employee_explanation`, `hr_notes`, `resolved_by`, `resolved_at`, `is_resolved`, `moved_from_attendance_at`, `created_at`, `updated_at`) VALUES
(1, 349, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-13', '18:03:57', NULL, 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1405, 1405, 540, 865, 14.42, 1, 0, NULL, 'Web Browser', NULL, 'Checkout Missing - Auto-detected by system', NULL, NULL, NULL, NULL, 0, '2026-02-20 16:59:01', '2026-02-20 16:59:01', '2026-02-20 16:59:01'),
(2, 351, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', '2026-02-16', '14:29:02', NULL, 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 179, 179, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, 'Checkout Missing - Auto-detected by system', NULL, NULL, NULL, NULL, 0, '2026-02-20 16:59:01', '2026-02-20 16:59:01', '2026-02-20 16:59:01'),
(3, 353, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-02-18', '17:29:46', NULL, 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, 'Checkout Missing - Auto-detected by system', NULL, NULL, NULL, NULL, 0, '2026-02-20 16:59:01', '2026-02-20 16:59:01', '2026-02-20 16:59:01'),
(4, 356, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', '2026-02-20', '18:09:12', NULL, 'Present', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 540, 0, 0.00, 1, 0, NULL, 'Web Browser', NULL, 'Checkout Missing - Auto-detected by system', NULL, NULL, NULL, NULL, 0, '2026-03-11 08:34:48', '2026-03-11 08:34:48', '2026-03-11 08:34:48');

-- --------------------------------------------------------

--
-- Table structure for table `employee_dynamic_resources`
--

CREATE TABLE `employee_dynamic_resources` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `resource_name` varchar(100) NOT NULL,
  `resource_serial` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_dynamic_resources`
--

INSERT INTO `employee_dynamic_resources` (`id`, `employee_id`, `resource_name`, `resource_serial`, `created_at`) VALUES
(1, 54, 'hunain', 'yuu', '2026-02-10 19:33:32'),
(2, 55, 'aaa', '1123aa', '2026-02-13 18:25:29'),
(3, 56, 'resourse', '123', '2026-02-18 14:47:02');

-- --------------------------------------------------------

--
-- Stand-in structure for view `employee_financial_summary`
-- (See below for the actual view)
--
CREATE TABLE `employee_financial_summary` (
`id` int(11)
,`full_name` varchar(255)
,`employee_id` varchar(50)
,`bank_account_id` int(11)
,`account_number_masked` varchar(12)
,`account_number_full` varchar(50)
,`account_title_name` varchar(255)
,`bank_name` varchar(100)
,`account_type` enum('Savings','Current','Fixed Deposit')
,`total_allowances` decimal(34,2)
,`allowances_detail` mediumtext
,`base_salary` decimal(12,2)
,`total_salary` decimal(12,2)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `employee_leaves`
--

CREATE TABLE `employee_leaves` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `casual_leaves_used` int(11) DEFAULT 0 COMMENT 'Number of casual leaves used',
  `casual_leaves_total` int(11) DEFAULT 8 COMMENT 'Total casual leaves allocated (default: 8)',
  `casual_leaves_remaining` int(11) GENERATED ALWAYS AS (`casual_leaves_total` - `casual_leaves_used`) STORED COMMENT 'Auto-calculated remaining casual leaves',
  `sick_leaves_used` int(11) DEFAULT 0 COMMENT 'Number of sick leaves used',
  `sick_leaves_total` int(11) DEFAULT 8 COMMENT 'Total sick leaves allocated (default: 8)',
  `sick_leaves_remaining` int(11) GENERATED ALWAYS AS (`sick_leaves_total` - `sick_leaves_used`) STORED COMMENT 'Auto-calculated remaining sick leaves',
  `annual_leaves_used` int(11) DEFAULT 0 COMMENT 'Number of annual leaves used',
  `annual_leaves_total` int(11) DEFAULT 12 COMMENT 'Total annual leaves allocated (default: 12)',
  `annual_leaves_remaining` int(11) GENERATED ALWAYS AS (`annual_leaves_total` - `annual_leaves_used`) STORED COMMENT 'Auto-calculated remaining annual leaves',
  `leaves_year` year(4) DEFAULT NULL COMMENT 'Financial year for leaves (optional)',
  `last_updated_by` int(11) DEFAULT NULL COMMENT 'Admin ID who last updated leaves',
  `remarks` text DEFAULT NULL COMMENT 'Additional remarks about leaves',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee_leaves`
--

INSERT INTO `employee_leaves` (`id`, `employee_id`, `email`, `name`, `casual_leaves_used`, `casual_leaves_total`, `sick_leaves_used`, `sick_leaves_total`, `annual_leaves_used`, `annual_leaves_total`, `leaves_year`, `last_updated_by`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(2, 28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(3, 29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(4, 30, 'wajih@digioussolutions.com', 'Wajih ul Hasan', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(5, 31, 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(6, 32, 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(7, 33, 'Saheem@digioussolutions.com', 'Muhammad Saheem', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(8, 34, 'Khisal@digioussolutions.com', 'Khisal Zafar', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(9, 35, 'Taha@digioussolutions.com', 'Muhammad Taha', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(10, 36, 'Faiq@digioussolutions.com', 'Faiq Shahzad', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(11, 37, 'Taimoor@digioussolutions.com', 'Taimoor Shah', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(12, 38, 'Ebad@digioussolutions.com', 'Muhammad Ebad', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(13, 39, 'muhammadHamza@digioussolutions.com', 'Muhammad Hamza', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(14, 40, 'Yanish@digioussolutions.com', 'Yanish Hyder', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(15, 41, 'baqar@digioussolutions.com', 'Muhammad Baqar', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(16, 42, 'Tahir@digioussolutions.com', 'Tahir ', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(17, 43, 'Hamdan@digioussolutions.com', 'Muhammad Hamdan Pir Zada', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(18, 44, 'Moiz@digioussolutions.com', 'Abdul Moiz Khan', 2, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-19 18:29:01'),
(19, 45, 'SyedAwais@digioussolutions.com', 'Syed Awais Ahmed', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(20, 46, 'Shahrukh@digioussolutions.com', 'Shahrukh Hussain Siddiqui', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(21, 47, 'Uzair@digioussolutions.com', 'Uzair Siddiqui', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(22, 54, 'khalid.khan@digioussolutions.com', 'Khalid Khan', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-populated from employee_onboarding', '2026-02-12 14:20:17', '2026-02-12 14:20:17'),
(23, 55, 'JFAD@digioussolutions.com', 'JFAD', 0, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-created on employee onboarding', '2026-02-13 18:25:29', '2026-02-13 18:25:29'),
(24, 56, 'muhammad.hunain@digioussolutions.com', 'Muhammad Hunain', 1, 8, 0, 8, 0, 12, NULL, NULL, 'Auto-created on employee onboarding', '2026-02-18 14:47:02', '2026-02-20 13:17:29');

-- --------------------------------------------------------

--
-- Table structure for table `employee_onboarding`
--

CREATE TABLE `employee_onboarding` (
  `id` int(11) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_temp` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `department` varchar(100) NOT NULL,
  `sub_department` varchar(100) NOT NULL COMMENT 'Sub-department or role classification',
  `employment_status` enum('Probation','Part-Time','Intern','MTO','Permanent') DEFAULT 'Probation',
  `join_date` date NOT NULL,
  `confirmation_date` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergency_contact` varchar(255) DEFAULT NULL,
  `request_password_change` tinyint(1) DEFAULT 1,
  `bank_account` varchar(50) DEFAULT NULL,
  `account_title_name` varchar(255) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `tax_id` varchar(50) DEFAULT NULL,
  `cnic` varchar(20) DEFAULT NULL,
  `cnic_issue_date` date DEFAULT NULL,
  `cnic_expiry_date` date DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `status` enum('Pending','Active','Inactive','Suspended') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `dob` date DEFAULT NULL COMMENT 'Date of birth (YYYY-MM-DD)',
  `profile_photo` varchar(1000) DEFAULT NULL COMMENT 'Cloudinary URL for employee profile photo',
  `skills_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON field storing {technical: [], soft: []} skills structure' CHECK (json_valid(`skills_json`)),
  `documents_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON field for documents storage' CHECK (json_valid(`documents_json`)),
  `resources_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON field for resources storage' CHECK (json_valid(`resources_json`)),
  `certifications_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON field for certifications storage' CHECK (json_valid(`certifications_json`)),
  `social_links_json` longtext DEFAULT NULL COMMENT 'JSON object containing social links (linkedin, github, portfolio, twitter, etc.)',
  `required_documents_json` longtext DEFAULT NULL COMMENT 'JSON array of required documents with status',
  `achievements_json` longtext DEFAULT NULL COMMENT 'JSON array of achievements with categories (award, certification, publication)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_onboarding`
--

INSERT INTO `employee_onboarding` (`id`, `employee_id`, `name`, `email`, `password_temp`, `phone`, `department`, `sub_department`, `employment_status`, `join_date`, `confirmation_date`, `address`, `emergency_contact`, `request_password_change`, `bank_account`, `account_title_name`, `bank_name`, `tax_id`, `cnic`, `cnic_issue_date`, `cnic_expiry_date`, `designation`, `status`, `created_at`, `updated_at`, `dob`, `profile_photo`, `skills_json`, `documents_json`, `resources_json`, `certifications_json`, `social_links_json`, `required_documents_json`, `achievements_json`) VALUES
(27, 'DG-0063', 'Muhammad Hamza Hassan', 'hamza@digioussolutions.com', '$2a$10$GF5rgRlsHRSvY7wVx3D9QeokdLYDJaSYlAzf7iFpTE1/9LIugoDum', '03113135486', 'HR', 'Human Resource and Development', 'Permanent', '2025-05-09', '2025-08-09', 'House no L117 Kda Flats Sector 5E Karachi', '03179991964', 1, '55635001879078', 'Muhammad Hamza Hassan', 'Alfalah ', NULL, '4210170692149', '2020-10-01', '2030-10-01', 'HR - Manager', 'Active', '2026-01-16 19:19:39', '2026-01-16 20:38:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 'DG-0015', 'Syed Shahmeer Abbas', 'Shahmeerabbas@digioussolutions.com', '$2a$10$Z9tNX5PY6gqCUwVmJfrW.efRSH5oMgOqQXvwXRJu7KWAOOIiWr0ma', '03002706637', 'Sales', 'Sales', 'Permanent', '2023-07-15', '2023-07-15', 'House R583 Sector 15-A 4 Buffer zone Karachi', '03139070790', 1, '10510111486035', 'Syed Shahmeer Abbas Abidi', 'Meezan', NULL, '4210102744789', '2024-12-01', '2034-12-01', 'Senior Sales Executive', 'Active', '2026-01-16 19:53:19', '2026-01-16 19:53:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 'DG-001', 'Syed Muhammad Ashhar', 'smashhar@digioussolutions.com', '$2a$10$4ijttJoE/hGPZStA5xk.wudn.7A5388.xjMboBTcyy4xVNFU04Fw.', '03162334629', 'Sales', 'Sales', 'Permanent', '2020-12-22', '2021-03-22', 'House  # 1108 Block 2 FB Area Karachi', '03132620838', 1, '00300113304519', 'Syed Muhammad Ashhar', 'Meezan', NULL, '4210117587283', '2017-10-01', '2027-10-01', 'Operation Manager', 'Active', '2026-01-16 20:01:35', '2026-01-16 20:01:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 'DG-006', 'Wajih ul Hasan', 'wajih@digioussolutions.com', '$2a$10$k837tiPvHrnxgj4M.IwGhe4xxCzDFFLxHCw9TrM9MAwufSN4.Di1.', '03130022417', 'Sales', 'Sales', 'Permanent', '2022-07-01', '2022-10-01', 'HOuse # 1991  block 2 Azizabad FB Area Karachi', '0339409002', 1, '01280108978635', 'Wajih ul Hasan', 'Meezan', NULL, '4210136876999', '2023-08-01', '2033-08-01', 'Sales Executive', 'Active', '2026-01-16 20:09:35', '2026-01-16 20:09:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 'DG-005', 'Syed Wahaj Abbas ', 'Wahajabbas@digioussolutions.com', '$2a$10$QKK1PvJvU6IaBr5gCM1awezfU.aUN8ri8r7gHQcAlcdL.ZJ9oT1yi', '03080025336', 'Sales', 'Sales', 'Permanent', '2022-04-24', '2022-07-24', 'House R583 Sector 15-A 4 Buffer zone Karachi', '03139070790', 1, '01160109832456', 'Syed Wahaj Abbas  Abidi', 'Meezan', NULL, '4210121407247', '2023-02-01', '2033-02-01', 'Senior Sales Executive', 'Active', '2026-01-16 20:19:24', '2026-01-16 20:19:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 'DG-0062', 'Muhammad Humaiz', 'Humaiz@digioussolutions.com', '$2a$10$Or8p3GZpQFCbuMn54xG21uMlwyc2OBMTjEZKnHQUOzBDF5zmVmDi.', '03198057600', 'Sales', 'Sales', 'Permanent', '2025-05-12', '2025-08-12', 'Flat # B08 Bufferzone Sec - 15/A5 Karachi', 'Flat # B08 Bufferzone Sec - 15/A5 Karachi', 1, NULL, 'Humaiz', 'Meezan', NULL, '4230110899453', '2025-11-01', '2035-11-01', 'Sales Executive', 'Active', '2026-01-16 20:47:20', '2026-01-16 20:47:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 'DG-0066', 'Muhammad Saheem', 'Saheem@digioussolutions.com', '$2a$10$mND5h7Ufk4JcU7g9AX3u5OfENzA9VWQr3KV83YfIQeX8cgdgWeBe6', '03333043699', 'Sales', 'Sales', 'Probation', '2025-06-10', '2025-06-10', 'House # B 535 North Nazimabad Block T Nusrat Bhutto Colony,', '03153081495', 1, NULL, 'Humaiz', 'UBL', NULL, '422121121', '2026-01-01', '2026-01-01', 'Sales Executive', 'Active', '2026-01-16 20:52:35', '2026-01-16 20:52:35', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, 'DG-0069', 'Khisal Zafar', 'Khisal@digioussolutions.com', '$2a$10$ie6lGVDq7yCcFc.Np4DhDebc8FWpVKLsfMK6DHjMyPZCkjvHIrbI2', '03212781915', 'Sales', 'Sales', 'Probation', '2025-06-25', '2025-06-25', 'North Nazimabad, Block B', '03212781915', 1, NULL, 'Khisal ', 'MCB', NULL, '42255515', '2026-01-01', '2026-01-01', 'Sales Executive', 'Active', '2026-01-16 20:56:59', '2026-01-16 20:56:59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(35, 'DG-0082', 'Muhammad Taha', 'Taha@digioussolutions.com', '$2a$10$0El585zQuKIetKQlRMPBFegrXFa5UAi4rzWaIE9UtN9h/K7UM/wWa', '320 0230393', 'Sales', 'Sales', 'Probation', '2025-12-11', '2025-12-11', 'House # 796 Sector 4E Orangi Town Karachi', '03453120075', 1, 'PK34MEZN0099430112722460', 'MUHAMMAD TAHA KHAN', 'Meezan', NULL, '4240175775641', '2024-06-01', '2034-06-01', 'Sales Executive', 'Active', '2026-01-16 21:02:17', '2026-01-16 21:02:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(36, 'DG-0078', 'Faiq Shahzad', 'Faiq@digioussolutions.com', '$2a$10$XsIt.GLeoUOJ.UoVqH9zCObOIz0HVZy0X8tLWDEdBW3zkVWiPvZ5O', '346 0095359', 'Sales', 'Sales', 'Probation', '2025-11-10', '2025-11-10', 'Flat # A18 Kda Flats Surjani Town Karachi', '03113135486', 1, '5011-0081-0072-9201', 'FAIQ SHAHZAD', 'Bank Al Habib Limited', NULL, '4240172322925', '2018-11-01', '2028-11-01', 'Sales Executive', 'Active', '2026-01-16 21:05:29', '2026-01-16 21:05:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(37, 'DG-0041', 'Taimoor Shah', 'Taimoor@digioussolutions.com', '$2a$10$H9L2hC9sZlZtwuPrfj1UQetiKrUljEDn9jp.crfMGRX3wMDCLy9kO', '03148361332', 'Production', 'Production', 'Permanent', '2025-08-01', '2025-11-01', 'House # l27 5A2 North Karachi', '03482530669', 1, '99750112200615', 'Taimoor Shah', 'Meezan', NULL, '4140603724669', '2024-09-01', '2034-09-01', 'Graphic Designer', 'Active', '2026-01-16 21:10:58', '2026-01-16 21:10:58', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(38, 'DG-0057', 'Muhammad Ebad', 'Ebad@digioussolutions.com', '$2a$10$BlrWPOMUm07Tx6URSneWZOXyN1UiPyrBEkhFPXga1RxjOzXIX7JN6', '03102855214', 'Production', 'Production', 'Permanent', '2025-05-04', '2025-08-05', 'House#B8, Saima tower, 15A/5, Bufferzone', ' 349 2477213', 1, NULL, 'Ebad', 'Meezan', NULL, '4230179464015', '2021-03-01', '2031-03-01', 'Graphic Designer', 'Active', '2026-01-16 21:15:23', '2026-01-16 21:15:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(39, 'DG-0033', 'Muhammad Hamza', 'muhammadHamza@digioussolutions.com', '$2a$10$c9DgyIVIZ9yDBXcH37ZJEessxjhOW409oDaCBziBxVfiM/fdxt3Wa', '3341297373', 'Production', 'Production', 'Permanent', '2024-04-01', '2024-07-01', 'Shadman Town, North Nazimabad', '03323317409', 1, '01170105472165', 'Muhammad Hamza', 'Meezan', NULL, '4210128973099', '2016-07-01', '2026-07-01', 'Web Developer', 'Active', '2026-01-16 21:20:04', '2026-01-16 21:20:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(40, 'DG-0077', 'Yanish Hyder', 'Yanish@digioussolutions.com', '$2a$10$tUoVWN8dPYrSV.3oPWc7wOsNSs8R0QqkkdTryptVc9rbwVoztF5vy', '03481833469', 'Production', 'Production', 'MTO', '2025-09-17', '2025-09-17', 'Al khursheed Plaza block 13C House # 7 Gulshan e Iqbal Karachi', '03413004799', 1, '03365390490', 'Yanish Hyder', 'Easy Paisa', NULL, '7150257570645', '2025-09-01', '2035-09-01', 'Management Trainee', 'Active', '2026-01-16 21:24:53', '2026-01-16 21:24:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(41, 'DG-0034', 'Muhammad Baqar', 'baqar@digioussolutions.com', '$2a$10$FIx5L1D0Y/Lk6IzvNdcSRuAGKXzsSrcOyyGadX2697EmIzVxkDWsi', '346 2300125', 'Production', 'Production', 'Permanent', '2025-09-17', '2025-09-17', 'House #  B2 33 FIRST FLOOR NORTH NAZIMABAD Block D', '03113135486', 1, '10730981006780016', 'Muhammad Baqar', 'Bank Al Habib', NULL, '4210138057327', '2017-08-01', '2027-08-01', 'Web Developer', 'Active', '2026-01-16 21:29:38', '2026-01-16 21:29:38', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(42, 'DG-0059', 'Tahir ', 'Tahir@digioussolutions.com', '$2a$10$/VacHNCZEYmTjGPvsef/TuKbgHVBjwQ6y8NpEFYkzc0r2Rvvp5kSG', '03422739261', 'Operations', 'Administration', 'Permanent', '2025-05-01', '2025-08-01', 'Aslam Market', '03422739261', 1, NULL, 'Tahir Khan', 'Meezan', NULL, '1360105289763', '2020-06-01', '2030-06-01', 'Support Staff', 'Active', '2026-01-16 21:34:31', '2026-01-16 21:34:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 'DG-002', 'Muhammad Hamdan Pir Zada', 'Hamdan@digioussolutions.com', '$2a$10$tMDVTsRb.Q9TqJqNsajb6eCAxSxnNACaEqI83Ho89B8iWwDrCZdFO', '3142234297', 'Sales', 'Sales', 'Permanent', '2020-12-25', '2021-03-25', 'House # R160 sector 15b Buffer Zone Karachi', '03222874750', 1, '01430107255111', 'Muhammad Hamdan Pir Zada', 'Meezan', NULL, '4210125244295', '2020-10-01', '2030-10-01', 'Business Development Executive', 'Active', '2026-01-16 22:04:45', '2026-01-16 22:04:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 'DG-0010', 'Abdul Moiz Khan', 'Moiz@digioussolutions.com', '$2a$10$jQvx3hc/X/k7G./4dVBP0e.fpj5LBNpb6ooCeZOtDrNcIFW9J1phK', '03181210257', 'Production', 'Production', 'Permanent', '2023-03-01', '2023-06-01', 'Flat 33/16 Block H FC Area Karachi', '03121266937', 1, '99850106508808', 'Abdul Moiz', 'Meezan', NULL, '4210172776041', '2020-12-01', '2030-12-01', 'Manager', 'Active', '2026-01-16 22:07:59', '2026-02-19 03:50:30', NULL, NULL, '{\"technical\":[\"React\"],\"soft\":[\"Communication\"]}', '[]', '[{\"id\":18,\"employee_id\":44,\"laptop\":0,\"laptop_serial\":null,\"charger\":0,\"charger_serial\":null,\"mouse\":0,\"mouse_serial\":null,\"keyboard\":0,\"keyboard_serial\":null,\"monitor\":0,\"monitor_serial\":null,\"mobile\":0,\"mobile_serial\":null,\"resources_note\":null,\"allocated_date\":\"2026-01-16T22:07:59.000Z\",\"returned_date\":null}]', NULL, NULL, NULL, NULL),
(45, 'DG-0072', 'Syed Awais Ahmed', 'SyedAwais@digioussolutions.com', '$2a$10$a3F10KDgEKPOla9oJEeoO.cMaCUWejePT6F8RwxhYsc4CUDXhGL5K', '03372117919', 'Marketing', 'Social Media', 'MTO', '2025-07-07', '2026-01-01', 'House # 401 Sector 7D2 North Karachi', '03363707375', 1, '03363707375', 'Syed Abdal Ahmed', 'Nayapay', NULL, '4210193798979', '2026-01-01', '2026-01-01', 'Management Trainee Officer', 'Active', '2026-01-17 17:35:08', '2026-01-17 17:35:08', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(46, 'DG-0047', 'Shahrukh Hussain Siddiqui', 'Shahrukh@digioussolutions.com', '$2a$10$68AQ5ssgKipU4Usd5uafUOfE7A9/gPBr.3p8ZAo/oxej51u8GVmAm', '03402143935', 'Production', 'SEO', 'Part-Time', '2024-10-28', '2025-01-28', 'House # L26 Sector 11K North Karachi', '03333999602', 1, '1921295604316', 'Shahrukh Hussain Siddiqui', 'UBL', NULL, '4210127286961', '2016-05-01', '2026-05-01', 'SEO Executive', 'Active', '2026-01-17 17:44:00', '2026-01-17 17:44:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(47, 'DG-0076', 'Uzair Siddiqui', 'Uzair@digioussolutions.com', '$2a$10$AKIDP6Plp6udoVYk09x0jeeoS8pzr3eHokWwunjZ290NDuaFMDkJW', '03112166303', 'Sales', 'Sales', 'Probation', '2025-07-10', '2025-07-10', 'Unknown', '03144260099', 1, NULL, 'Muhammad Uzair', 'NO Bank', NULL, '42101-510xxxx-x', '2023-08-01', '2033-08-01', 'Sales Executive', 'Active', '2026-01-17 18:01:21', '2026-03-10 17:57:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(54, 'DG-003', 'Khalid Khan', 'khalid.khan@digioussolutions.com', '$2a$10$2zY/NffZK9nNoO3nFkNQ5OawgzcFqvDXZDcW0khIzjXFGGvOZa2rG', '0918276355', 'Production', 'America', 'Permanent', '2025-12-01', '2026-02-11', 'hunain', '0981726354', 1, 'IBAN 365', 'IBAN 365', 'NBP', NULL, '1234567182903', '2026-02-01', '2026-02-27', 'SMA', 'Active', '2026-02-10 19:33:32', '2026-02-10 19:33:32', '2002-02-01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(55, 'DG-004', 'JFAD', 'JFAD@digioussolutions.com', '$2a$10$QXdtM9ge8NSxW/bVAzvL4.GZ69aPZmc/a/o.TVhceDL3KwoUKQs66', '091827354566', 'Sales', 'sss', 'Part-Time', '2026-02-05', '2026-02-27', 'jnvjknf', '001929882', 1, 'jcjjcj', 'jcjjfj', 'HBL', NULL, '12299938847745', '2026-02-13', '2026-02-13', 'sss', 'Active', '2026-02-13 18:25:29', '2026-02-13 18:25:29', '2026-02-05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(56, 'DG-098', 'Muhammad Hunain', 'muhammad.hunain@digioussolutions.com', '$2a$10$IYxVKElO2Y.7xWVtSciH/Oc2KMfk.Riac/T2/6eobmP4R.rgYCMkq', '0928376514', 'Operations', 'Manager', 'Permanent', '2026-02-01', '2026-02-18', 'Shan Residency Block K SB-44', '03123598003', 1, '09878990998', 'IBN PKR 123', 'HBL', NULL, '42101-5103653-5', '2024-09-02', '2028-07-28', 'SM OPERt', 'Active', '2026-02-18 14:47:02', '2026-02-18 14:47:02', '2002-09-15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Triggers `employee_onboarding`
--
DELIMITER $$
CREATE TRIGGER `after_employee_delete` AFTER DELETE ON `employee_onboarding` FOR EACH ROW BEGIN
    -- Mark user as inactive instead of deleting (for audit trail)
    UPDATE user_as_employees
    SET 
        status = 'Inactive',
        updated_at = NOW()
    WHERE employee_id = OLD.id;
    
    -- Optionally, you can delete instead:
    -- DELETE FROM user_as_employees WHERE employee_id = OLD.employee_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_employee_insert` AFTER INSERT ON `employee_onboarding` FOR EACH ROW BEGIN
    INSERT INTO user_as_employees (
        employee_id,
        name,
        email,
        password,
        department,
        position,
        employment_status,
        designation,
        confirmation_date,
        account_title_name,
        bank_name,
        cnic_issue_date,
        cnic_expiry_date,
        status,
        request_password_change,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.name,
        NEW.email,
        NEW.password_temp,
        NEW.department,
        NEW.sub_department,
        NEW.employment_status,
        NEW.designation,
        NEW.confirmation_date,
        NEW.account_title_name,
        NEW.bank_name,
        NEW.cnic_issue_date,
        NEW.cnic_expiry_date,
        NEW.status,
        TRUE,
        NOW(),
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        password = VALUES(password),
        department = VALUES(department),
        position = VALUES(position),
        employment_status = VALUES(employment_status),
        designation = VALUES(designation),
        confirmation_date = VALUES(confirmation_date),
        account_title_name = VALUES(account_title_name),
        bank_name = VALUES(bank_name),
        cnic_issue_date = VALUES(cnic_issue_date),
        cnic_expiry_date = VALUES(cnic_expiry_date),
        status = VALUES(status),
        updated_at = NOW();
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_employee_update` AFTER UPDATE ON `employee_onboarding` FOR EACH ROW BEGIN
    UPDATE user_as_employees
    SET
        name = NEW.name,
        email = NEW.email,
        department = NEW.department,
        position = NEW.sub_department,
        employment_status = NEW.employment_status,
        designation = NEW.designation,
        confirmation_date = NEW.confirmation_date,
        account_title_name = NEW.account_title_name,
        bank_name = NEW.bank_name,
        cnic_issue_date = NEW.cnic_issue_date,
        cnic_expiry_date = NEW.cnic_expiry_date,
        status = NEW.status,
        updated_at = NOW()
    WHERE employee_id = NEW.id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `employee_onboarding_insert_leaves` AFTER INSERT ON `employee_onboarding` FOR EACH ROW BEGIN
    -- Check if the new employee should be added to leaves tracking
    -- (added for all employees regardless of status)
    IF (NEW.id IS NOT NULL) THEN
        INSERT INTO employee_leaves 
        (employee_id, email, name, casual_leaves_used, casual_leaves_total, 
         sick_leaves_used, sick_leaves_total, annual_leaves_used, annual_leaves_total, remarks)
        VALUES 
        (NEW.id, NEW.email, NEW.name, 0, 8, 0, 8, 0, 12, 'Auto-created on employee onboarding');
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `employee_onboarding_update_leaves` AFTER UPDATE ON `employee_onboarding` FOR EACH ROW BEGIN
    -- Update email and name in employee_leaves if they changed
    IF (NEW.email <> OLD.email OR NEW.name <> OLD.name) THEN
        UPDATE employee_leaves 
        SET email = NEW.email, 
            name = NEW.name,
            updated_at = NOW()
        WHERE employee_id = NEW.id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `employee_required_documents`
--

CREATE TABLE `employee_required_documents` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `document_type` varchar(100) NOT NULL COMMENT 'e.g., cnic, passport, diploma, resume, reference_letter',
  `document_name` varchar(255) NOT NULL,
  `document_url` varchar(500) DEFAULT NULL,
  `status` enum('pending','submitted','verified','rejected') DEFAULT 'pending',
  `expiry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `verified_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `verified_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_resources`
--

CREATE TABLE `employee_resources` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `laptop` tinyint(1) DEFAULT 0,
  `laptop_serial` varchar(100) DEFAULT NULL,
  `charger` tinyint(1) DEFAULT 0,
  `charger_serial` varchar(100) DEFAULT NULL,
  `mouse` tinyint(1) DEFAULT 0,
  `mouse_serial` varchar(100) DEFAULT NULL,
  `keyboard` tinyint(1) DEFAULT 0,
  `keyboard_serial` varchar(100) DEFAULT NULL,
  `monitor` tinyint(1) DEFAULT 0,
  `monitor_serial` varchar(100) DEFAULT NULL,
  `mobile` tinyint(1) DEFAULT 0,
  `mobile_serial` varchar(100) DEFAULT NULL,
  `resources_note` text DEFAULT NULL,
  `allocated_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `returned_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_resources`
--

INSERT INTO `employee_resources` (`id`, `employee_id`, `laptop`, `laptop_serial`, `charger`, `charger_serial`, `mouse`, `mouse_serial`, `keyboard`, `keyboard_serial`, `monitor`, `monitor_serial`, `mobile`, `mobile_serial`, `resources_note`, `allocated_date`, `returned_date`) VALUES
(1, 27, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 19:19:39', NULL),
(2, 28, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 19:53:19', NULL),
(3, 29, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 20:01:36', NULL),
(4, 30, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 20:09:36', NULL),
(5, 31, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 20:19:24', NULL),
(6, 32, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 20:47:20', NULL),
(7, 33, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 20:52:35', NULL),
(8, 34, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 20:56:59', NULL),
(9, 35, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 21:02:17', NULL),
(10, 36, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 21:05:29', NULL),
(11, 37, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 21:10:58', NULL),
(12, 38, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 21:15:23', NULL),
(13, 39, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 21:20:04', NULL),
(14, 40, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 21:24:54', NULL),
(15, 41, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 21:29:38', NULL),
(16, 42, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 21:34:31', NULL),
(17, 43, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 22:04:45', NULL),
(18, 44, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-16 22:07:59', NULL),
(19, 45, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-17 17:35:08', NULL),
(20, 46, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-17 17:44:00', NULL),
(21, 47, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-01-17 18:01:21', NULL),
(24, 54, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-02-10 19:33:32', NULL),
(25, 55, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 'aasd', '2026-02-13 18:25:29', NULL),
(26, 56, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, 0, NULL, NULL, '2026-02-18 14:47:02', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_salary`
--

CREATE TABLE `employee_salary` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `base_salary` decimal(12,2) NOT NULL,
  `total_salary` decimal(12,2) DEFAULT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_salary`
--

INSERT INTO `employee_salary` (`id`, `employee_id`, `base_salary`, `total_salary`, `last_updated`) VALUES
(1, 27, 30000.00, 30000.00, '2026-01-16 19:19:39'),
(2, 28, 25000.00, 25000.00, '2026-01-16 19:53:19'),
(3, 29, 25000.00, 25000.00, '2026-01-16 20:01:36'),
(4, 30, 25000.00, 25000.00, '2026-01-16 20:09:36'),
(5, 31, 34999.00, 34999.00, '2026-01-16 20:19:24'),
(6, 32, 20000.00, 20000.00, '2026-01-16 20:47:20'),
(7, 33, 20000.00, 20000.00, '2026-01-16 20:52:35'),
(8, 34, 20000.00, 20000.00, '2026-01-16 20:56:59'),
(9, 35, 20000.00, 20000.00, '2026-01-16 21:02:17'),
(10, 36, 20000.00, 20000.00, '2026-01-16 21:05:29'),
(11, 37, 2.00, 2.00, '2026-01-16 21:10:58'),
(12, 38, 19998.00, 19998.00, '2026-01-16 21:15:23'),
(13, 39, 20000.00, 20000.00, '2026-01-16 21:20:04'),
(14, 40, 19997.00, 19997.00, '2026-01-16 21:24:53'),
(15, 41, 20000.00, 20000.00, '2026-01-16 21:29:38'),
(16, 42, 30000.00, 30000.00, '2026-01-16 21:34:31'),
(17, 43, 25000.00, 25000.00, '2026-01-16 22:04:45'),
(18, 44, 29998.00, 29998.00, '2026-01-16 22:07:59'),
(19, 45, 20000.00, 20000.00, '2026-01-17 17:35:08'),
(20, 46, 19998.00, 19998.00, '2026-01-17 17:44:00'),
(21, 47, 0.00, 0.00, '2026-03-10 17:57:27'),
(24, 54, 78600.00, 79598.00, '2026-02-10 19:33:32'),
(25, 55, 1234.00, 1345.00, '2026-02-13 18:25:29'),
(26, 56, 100000.00, 100000.00, '2026-02-18 14:47:02');

-- --------------------------------------------------------

--
-- Table structure for table `employee_skills`
--

CREATE TABLE `employee_skills` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `skill_name` varchar(255) NOT NULL,
  `skill_type` enum('technical','soft') NOT NULL DEFAULT 'technical' COMMENT 'Type of skill: technical or soft',
  `proficiency_level` enum('beginner','intermediate','expert') DEFAULT 'intermediate' COMMENT 'Optional proficiency level',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_social_links`
--

CREATE TABLE `employee_social_links` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `platform` varchar(50) NOT NULL COMMENT 'e.g., linkedin, github, portfolio, twitter, facebook, instagram',
  `url` varchar(500) NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `category_name` varchar(100) NOT NULL COMMENT 'Denormalized snapshot at time of entry',
  `amount` decimal(12,2) NOT NULL,
  `note` text DEFAULT NULL,
  `expense_date` date NOT NULL,
  `expense_time` time NOT NULL,
  `created_by` int(11) DEFAULT NULL COMMENT 'admin_users.id',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Company expenses — denormalized category name for audit trail';

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `category_id`, `category_name`, `amount`, `note`, `expense_date`, `expense_time`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 1, 'Salaries', 500.00, 'test', '2026-03-09', '12:29:33', NULL, '2026-03-09 07:29:33', '2026-03-09 07:29:33'),
(3, 1, 'Salaries', 500.00, 'test', '2026-03-09', '12:30:16', NULL, '2026-03-09 07:30:16', '2026-03-09 07:30:16'),
(4, 1, 'Salaries', 500.00, 'test', '2026-03-09', '12:31:32', NULL, '2026-03-09 07:31:32', '2026-03-09 07:31:32'),
(5, 3, 'Travel', 2500.00, 'Taxi to client meeting', '2026-03-09', '12:35:35', 1, '2026-03-09 07:35:35', '2026-03-09 07:35:35'),
(7, 5, 'Marketing', 56700.00, 'this is test 2', '2026-03-09', '22:32:52', 1, '2026-03-09 17:32:52', '2026-03-09 17:33:00');

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `color` varchar(20) DEFAULT '#3B82F6',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Admin-managed expense categories';

--
-- Dumping data for table `expense_categories`
--

INSERT INTO `expense_categories` (`id`, `name`, `description`, `color`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Salaries', 'Employee salary payments', '#3B82F6', 1, '2026-03-09 06:54:58', '2026-03-09 06:54:58'),
(2, 'Office Supplies', 'Stationery and office consumables', '#8B5CF6', 1, '2026-03-09 06:54:58', '2026-03-09 06:54:58'),
(3, 'Travel', 'Travel and transportation costs', '#10B981', 1, '2026-03-09 06:54:58', '2026-03-09 06:54:58'),
(4, 'Utilities', 'Electricity, internet, phone', '#F59E0B', 1, '2026-03-09 06:54:58', '2026-03-09 06:54:58'),
(5, 'Marketing', 'Advertising and promotions....', '#EF4444', 1, '2026-03-09 06:54:58', '2026-03-11 14:58:53'),
(6, 'Miscellaneous', 'Other uncategorised expenses', '#6B7280', 1, '2026-03-09 06:54:58', '2026-03-09 06:54:58'),
(25, 'test', 'this is test', '#3B82F6', 1, '2026-03-09 07:40:00', '2026-03-11 17:14:10'),
(32, 'test1', '', '#3B82F6', 1, '2026-03-09 17:31:38', '2026-03-09 17:31:38');

-- --------------------------------------------------------

--
-- Stand-in structure for view `Monthly_Attendance_Summary`
-- (See below for the actual view)
--
CREATE TABLE `Monthly_Attendance_Summary` (
`employee_id` int(11)
,`name` varchar(100)
,`email` varchar(100)
,`year` int(4)
,`month` int(2)
,`total_days` bigint(21)
,`present_days` decimal(22,0)
,`absent_days` decimal(22,0)
,`late_days` decimal(22,0)
,`leave_days` decimal(22,0)
,`attendance_rate` decimal(28,2)
,`on_time_rate` decimal(28,2)
,`total_working_minutes` decimal(32,0)
,`total_overtime_minutes` decimal(32,0)
,`total_break_minutes` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Table structure for table `onboarding_progress`
--

CREATE TABLE `onboarding_progress` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `step_1_basic_info` tinyint(1) DEFAULT 0,
  `step_1_completed_at` timestamp NULL DEFAULT NULL,
  `step_2_security_setup` tinyint(1) DEFAULT 0,
  `step_2_completed_at` timestamp NULL DEFAULT NULL,
  `step_3_job_details` tinyint(1) DEFAULT 0,
  `step_3_completed_at` timestamp NULL DEFAULT NULL,
  `step_4_allowances` tinyint(1) DEFAULT 0,
  `step_4_completed_at` timestamp NULL DEFAULT NULL,
  `step_5_additional_info` tinyint(1) DEFAULT 0,
  `step_5_completed_at` timestamp NULL DEFAULT NULL,
  `step_6_review_confirm` tinyint(1) DEFAULT 0,
  `step_6_completed_at` timestamp NULL DEFAULT NULL,
  `overall_completion_percentage` int(11) DEFAULT 0,
  `is_completed` tinyint(1) DEFAULT 0,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `onboarding_progress`
--

INSERT INTO `onboarding_progress` (`id`, `employee_id`, `step_1_basic_info`, `step_1_completed_at`, `step_2_security_setup`, `step_2_completed_at`, `step_3_job_details`, `step_3_completed_at`, `step_4_allowances`, `step_4_completed_at`, `step_5_additional_info`, `step_5_completed_at`, `step_6_review_confirm`, `step_6_completed_at`, `overall_completion_percentage`, `is_completed`, `completed_at`) VALUES
(17, 27, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(18, 28, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(19, 29, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(20, 30, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(21, 31, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(22, 32, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(23, 33, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(24, 34, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(25, 35, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(26, 36, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(27, 37, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(28, 38, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(29, 39, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(30, 40, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(31, 41, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(32, 42, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(33, 43, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(34, 44, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(35, 45, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(36, 46, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(37, 47, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(40, 54, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(41, 55, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL),
(42, 56, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 1, NULL, 100, 1, NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `Overtime_Report_View`
-- (See below for the actual view)
--
CREATE TABLE `Overtime_Report_View` (
`employee_id` int(11)
,`name` varchar(100)
,`email` varchar(100)
,`attendance_date` date
,`check_in_time` time
,`check_out_time` time
,`net_working_time_minutes` int(11)
,`expected_working_time_minutes` int(11)
,`overtime_minutes` int(11)
,`overtime_hours` decimal(5,2)
,`overtime_pay_multiplier` decimal(7,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `payroll_records`
--

CREATE TABLE `payroll_records` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL COMMENT 'FK to employee_onboarding.id',
  `month` int(2) NOT NULL COMMENT '1-12',
  `year` int(4) NOT NULL,
  `pay_period_start` date DEFAULT NULL,
  `pay_period_end` date DEFAULT NULL,
  `days_in_month` int(11) DEFAULT 30,
  `issue_date` date DEFAULT NULL,
  `base_salary` decimal(12,2) NOT NULL DEFAULT 0.00,
  `daily_rate` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'base_salary / 30',
  `total_allowances` decimal(12,2) DEFAULT 0.00,
  `working_days` int(11) DEFAULT 30,
  `present_days` int(11) DEFAULT 0,
  `absent_days` int(11) DEFAULT 0,
  `late_days` int(11) DEFAULT 0,
  `leave_days` int(11) DEFAULT 0,
  `half_days` int(11) DEFAULT 0,
  `paid_leave_days` int(11) DEFAULT 0,
  `late_deduction_days` int(11) DEFAULT 0 COMMENT 'floor(late_days / 2) — every 2 lates = 1 day deduction',
  `absent_deduction` decimal(12,2) DEFAULT 0.00,
  `late_deduction` decimal(12,2) DEFAULT 0.00,
  `leave_deduction` decimal(12,2) DEFAULT 0.00,
  `total_deductions` decimal(12,2) DEFAULT 0.00,
  `gross_salary` decimal(12,2) DEFAULT 0.00 COMMENT 'base_salary + total_allowances',
  `net_salary` decimal(12,2) DEFAULT 0.00 COMMENT 'gross_salary - total_deductions',
  `status` enum('pending','processing','success','failed') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payroll_records`
--

INSERT INTO `payroll_records` (`id`, `employee_id`, `month`, `year`, `pay_period_start`, `pay_period_end`, `days_in_month`, `issue_date`, `base_salary`, `daily_rate`, `total_allowances`, `working_days`, `present_days`, `absent_days`, `late_days`, `leave_days`, `half_days`, `paid_leave_days`, `late_deduction_days`, `absent_deduction`, `late_deduction`, `leave_deduction`, `total_deductions`, `gross_salary`, `net_salary`, `status`, `notes`, `generated_at`, `updated_at`) VALUES
(313, 44, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 29998.00, 999.93, 0.00, 28, 8, 15, 7, 2, 0, 2, 2, 14999.00, 1999.87, 0.00, 16998.87, 29998.00, 12999.13, 'pending', 'Paid leaves: 2 (2 casual [2 from leave balance]). Total absent: 17, Paid: 2, Unpaid: 15', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(314, 36, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 20000.00, 666.67, 0.00, 28, 6, 19, 3, 0, 0, 0, 1, 12666.67, 666.67, 0.00, 13333.33, 20000.00, 6666.67, 'pending', 'Unpaid absences: 19', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(315, 55, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 1234.00, 41.13, 111.00, 28, 0, 22, 0, 0, 0, 0, 0, 904.93, 0.00, 0.00, 904.93, 1345.00, 440.07, 'pending', 'Unpaid absences: 22', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(316, 54, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 78600.00, 2620.00, 998.00, 28, 0, 25, 0, 0, 0, 0, 0, 65500.00, 0.00, 0.00, 65500.00, 79598.00, 14098.00, 'pending', 'Unpaid absences: 25', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(317, 34, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 20000.00, 666.67, 0.00, 28, 7, 18, 4, 0, 0, 0, 1, 12000.00, 666.67, 0.00, 12666.67, 20000.00, 7333.33, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(318, 41, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 20000.00, 666.67, 0.00, 28, 7, 18, 5, 0, 0, 0, 1, 12000.00, 666.67, 0.00, 12666.67, 20000.00, 7333.33, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(319, 38, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 19998.00, 666.60, 0.00, 28, 6, 19, 5, 0, 0, 0, 1, 12665.40, 666.60, 0.00, 13332.00, 19998.00, 6666.00, 'pending', 'Unpaid absences: 19', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(320, 43, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 25000.00, 833.33, 0.00, 28, 0, 25, 0, 0, 0, 0, 0, 20833.33, 0.00, 0.00, 20833.33, 25000.00, 4166.67, 'pending', 'Unpaid absences: 25', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(321, 39, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 20000.00, 666.67, 0.00, 28, 5, 20, 2, 0, 0, 0, 0, 13333.33, 0.00, 0.00, 13333.33, 20000.00, 6666.67, 'pending', 'Unpaid absences: 20', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(322, 27, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 30000.00, 1000.00, 0.00, 28, 6, 19, 2, 0, 0, 0, 0, 19000.00, 0.00, 0.00, 19000.00, 30000.00, 11000.00, 'pending', 'Unpaid absences: 19', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(323, 32, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 20000.00, 666.67, 0.00, 28, 7, 18, 7, 0, 0, 0, 2, 12000.00, 1333.33, 0.00, 13333.33, 20000.00, 6666.67, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(324, 56, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 100000.00, 3333.33, 0.00, 28, 2, 20, 0, 1, 0, 2, 0, 66666.67, 0.00, 0.00, 66666.67, 100000.00, 33333.33, 'pending', 'Paid leaves: 1 (1 casual [1 from leave balance]). Total absent: 21, Paid: 1, Unpaid: 20', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(325, 33, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 20000.00, 666.67, 0.00, 28, 7, 18, 1, 0, 0, 0, 0, 12000.00, 0.00, 0.00, 12000.00, 20000.00, 8000.00, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(326, 35, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 20000.00, 666.67, 0.00, 28, 7, 18, 4, 0, 0, 0, 1, 12000.00, 666.67, 0.00, 12666.67, 20000.00, 7333.33, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(327, 46, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 19998.00, 666.60, 0.00, 28, 7, 18, 1, 0, 0, 0, 0, 11998.80, 0.00, 0.00, 11998.80, 19998.00, 7999.20, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(328, 45, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 20000.00, 666.67, 0.00, 28, 7, 18, 1, 0, 0, 0, 0, 12000.00, 0.00, 0.00, 12000.00, 20000.00, 8000.00, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(329, 29, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 25000.00, 833.33, 0.00, 28, 0, 25, 0, 0, 0, 0, 0, 20833.33, 0.00, 0.00, 20833.33, 25000.00, 4166.67, 'pending', 'Unpaid absences: 25', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(330, 28, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 25000.00, 833.33, 0.00, 28, 7, 18, 7, 0, 0, 0, 2, 15000.00, 1666.67, 0.00, 16666.67, 25000.00, 8333.33, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(331, 31, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 34999.00, 1166.63, 0.00, 28, 6, 19, 6, 0, 0, 0, 2, 22166.03, 2333.27, 0.00, 24499.30, 34999.00, 10499.70, 'pending', 'Unpaid absences: 19', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(332, 42, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 30000.00, 1000.00, 0.00, 28, 5, 20, 2, 0, 0, 0, 0, 20000.00, 0.00, 0.00, 20000.00, 30000.00, 10000.00, 'pending', 'Unpaid absences: 20', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(333, 37, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 2.00, 0.07, 0.00, 28, 7, 18, 3, 0, 0, 0, 1, 1.20, 0.07, 0.00, 1.27, 2.00, 0.73, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(334, 47, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 19998.00, 666.60, 0.00, 28, 6, 19, 4, 0, 0, 0, 1, 12665.40, 666.60, 0.00, 13332.00, 19998.00, 6666.00, 'pending', 'Unpaid absences: 19', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(335, 30, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 25000.00, 833.33, 0.00, 28, 0, 25, 0, 0, 0, 0, 0, 20833.33, 0.00, 0.00, 20833.33, 25000.00, 4166.67, 'pending', 'Unpaid absences: 25', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(336, 40, 2, 2026, '2026-02-01', '2026-02-28', 28, '2026-03-05', 19997.00, 666.57, 0.00, 28, 7, 18, 5, 0, 0, 0, 1, 11998.20, 666.57, 0.00, 12664.77, 19997.00, 7332.23, 'pending', 'Unpaid absences: 18', '2026-03-04 18:59:53', '2026-03-09 08:27:38'),
(337, 44, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 29998.00, 999.93, 0.00, 31, 10, 0, 10, 0, 0, 0, 3, 0.00, 2999.80, 0.00, 2999.80, 29998.00, 26998.20, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(338, 36, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 20000.00, 666.67, 0.00, 31, 12, 0, 3, 0, 0, 0, 1, 0.00, 666.67, 0.00, 666.67, 20000.00, 19333.33, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(339, 55, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 1234.00, 41.13, 111.00, 31, 0, 0, 0, 0, 0, 0, 0, 0.00, 0.00, 0.00, 0.00, 1345.00, 1345.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(340, 54, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 78600.00, 2620.00, 998.00, 31, 0, 0, 0, 0, 0, 0, 0, 0.00, 0.00, 0.00, 0.00, 79598.00, 79598.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(341, 34, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 20000.00, 666.67, 0.00, 31, 11, 0, 7, 0, 0, 0, 2, 0.00, 1333.33, 0.00, 1333.33, 20000.00, 18666.67, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(342, 41, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 20000.00, 666.67, 0.00, 31, 11, 0, 9, 0, 0, 0, 3, 0.00, 2000.00, 0.00, 2000.00, 20000.00, 18000.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(343, 38, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 19998.00, 666.60, 0.00, 31, 13, 0, 8, 0, 0, 0, 2, 0.00, 1333.20, 0.00, 1333.20, 19998.00, 18664.80, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(344, 43, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 25000.00, 833.33, 0.00, 31, 0, 0, 0, 0, 0, 0, 0, 0.00, 0.00, 0.00, 0.00, 25000.00, 25000.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(345, 39, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 20000.00, 666.67, 0.00, 31, 12, 0, 11, 0, 0, 0, 3, 0.00, 2000.00, 0.00, 2000.00, 20000.00, 18000.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(346, 27, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 30000.00, 1000.00, 0.00, 31, 12, 0, 8, 0, 0, 0, 2, 0.00, 2000.00, 0.00, 2000.00, 30000.00, 28000.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(347, 32, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 20000.00, 666.67, 0.00, 31, 13, 0, 5, 0, 0, 0, 1, 0.00, 666.67, 0.00, 666.67, 20000.00, 19333.33, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(348, 56, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 100000.00, 3333.33, 0.00, 31, 0, 0, 0, 0, 0, 0, 0, 0.00, 0.00, 0.00, 0.00, 100000.00, 100000.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(349, 33, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 20000.00, 666.67, 0.00, 31, 12, 0, 7, 0, 0, 0, 2, 0.00, 1333.33, 0.00, 1333.33, 20000.00, 18666.67, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(350, 35, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 20000.00, 666.67, 0.00, 31, 12, 0, 4, 0, 0, 0, 1, 0.00, 666.67, 0.00, 666.67, 20000.00, 19333.33, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(351, 46, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 19998.00, 666.60, 0.00, 31, 12, 0, 2, 0, 0, 0, 0, 0.00, 0.00, 0.00, 0.00, 19998.00, 19998.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(352, 45, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 20000.00, 666.67, 0.00, 31, 13, 0, 4, 0, 0, 0, 1, 0.00, 666.67, 0.00, 666.67, 20000.00, 19333.33, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(353, 29, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 25000.00, 833.33, 0.00, 31, 1, 0, 1, 0, 0, 0, 0, 0.00, 0.00, 0.00, 0.00, 25000.00, 25000.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(354, 28, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 25000.00, 833.33, 0.00, 31, 12, 0, 12, 0, 0, 0, 4, 0.00, 3333.33, 0.00, 3333.33, 25000.00, 21666.67, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(355, 31, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 34999.00, 1166.63, 0.00, 31, 12, 0, 11, 0, 0, 0, 3, 0.00, 3499.90, 0.00, 3499.90, 34999.00, 31499.10, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(356, 42, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 30000.00, 1000.00, 0.00, 31, 9, 0, 3, 0, 0, 0, 1, 0.00, 1000.00, 0.00, 1000.00, 30000.00, 29000.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(357, 37, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 2.00, 0.07, 0.00, 31, 13, 0, 1, 0, 0, 0, 0, 0.00, 0.00, 0.00, 0.00, 2.00, 2.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(358, 47, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 19998.00, 666.60, 0.00, 31, 12, 0, 8, 0, 0, 0, 2, 0.00, 1333.20, 0.00, 1333.20, 19998.00, 18664.80, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(359, 30, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 25000.00, 833.33, 0.00, 31, 9, 0, 9, 0, 0, 0, 3, 0.00, 2500.00, 0.00, 2500.00, 25000.00, 22500.00, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11'),
(360, 40, 1, 2026, '2026-01-01', '2026-01-31', 31, '2026-02-05', 19997.00, 666.57, 0.00, 31, 12, 0, 10, 0, 0, 0, 3, 0.00, 1999.70, 0.00, 1999.70, 19997.00, 17997.30, 'pending', NULL, '2026-03-04 19:00:11', '2026-03-04 19:00:11');

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL,
  `log_type` varchar(100) NOT NULL,
  `log_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_logs`
--

INSERT INTO `system_logs` (`id`, `log_type`, `log_message`, `created_at`) VALUES
(1, 'CHECKOUT_MISSING_PROCESS', 'Completed: Moved 1 records to checkout missing table', '2026-02-20 16:59:01');

-- --------------------------------------------------------

--
-- Table structure for table `user_as_employees`
--

CREATE TABLE `user_as_employees` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `confirmation_date` date DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `employment_status` enum('Probation','Part-Time','Intern','MTO','Permanent') DEFAULT 'Probation',
  `designation` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive','Suspended') DEFAULT 'Active',
  `request_password_change` tinyint(4) DEFAULT 1,
  `login_count` int(11) DEFAULT 0,
  `last_login_time` datetime DEFAULT NULL,
  `current_session_token` varchar(500) DEFAULT NULL,
  `session_token_expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `account_title_name` varchar(255) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `cnic_issue_date` date DEFAULT NULL,
  `cnic_expiry_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_as_employees`
--

INSERT INTO `user_as_employees` (`id`, `employee_id`, `name`, `email`, `password`, `department`, `confirmation_date`, `position`, `employment_status`, `designation`, `status`, `request_password_change`, `login_count`, `last_login_time`, `current_session_token`, `session_token_expires_at`, `is_active`, `created_at`, `updated_at`, `account_title_name`, `bank_name`, `cnic_issue_date`, `cnic_expiry_date`) VALUES
(20, 27, 'Muhammad Hamza Hassan', 'hamza@digioussolutions.com', '$2a$10$/LLZXAXZPgH8H6U9XvMZ/uLo1j7DV41Wba70Jm8VO4do9sowQJLTS', 'HR', '2025-08-09', 'Human Resource and Development', 'Permanent', 'HR - Manager', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 19:19:39', '2026-01-16 20:38:10', 'Muhammad Hamza Hassan', 'Alfalah ', '2020-10-01', '2030-10-01'),
(21, 28, 'Syed Shahmeer Abbas', 'Shahmeerabbas@digioussolutions.com', '$2a$10$A94RPEK7dz5d9/2Vx0ziN.0QXQ9CN9iYVD29pRKQtWsmnmSZtB5AK', 'Sales', '2023-07-15', 'Sales', 'Permanent', 'Senior Sales Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 19:53:19', '2026-01-17 16:24:29', 'Syed Shahmeer Abbas Abidi', 'Meezan', '2024-12-01', '2034-12-01'),
(22, 29, 'Syed Muhammad Ashhar', 'smashhar@digioussolutions.com', '$2a$10$TSUxNqBTLPOm9k11zTpdA.j2ShiNfkQ.Jdf5m/PAmuS4YF0qd.hw.', 'Sales', '2021-03-22', 'Sales', 'Permanent', 'Operation Manager', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 20:01:35', '2026-01-17 18:09:02', 'Syed Muhammad Ashhar', 'Meezan', '2017-10-01', '2027-10-01'),
(23, 30, 'Wajih ul Hasan', 'wajih@digioussolutions.com', '$2a$10$E5cygbky.lq.kVPWZlRjZOHZXSei5a4kTR46X4eE1zSUScI4hFyzy', 'Sales', '2022-10-01', 'Sales', 'Permanent', 'Sales Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 20:09:35', '2026-01-17 16:21:45', 'Wajih ul Hasan', 'Meezan', '2023-08-01', '2033-08-01'),
(24, 31, 'Syed Wahaj Abbas ', 'Wahajabbas@digioussolutions.com', '$2a$10$uIuuBHfxuoCNatV60UZwou/sTyQ6ovt1bxFOLQ1qhN/4er9bPvJ5m', 'Sales', '2022-07-24', 'Sales', 'Permanent', 'Senior Sales Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 20:19:24', '2026-01-16 21:07:43', 'Syed Wahaj Abbas  Abidi', 'Meezan', '2023-02-01', '2033-02-01'),
(25, 32, 'Muhammad Humaiz', 'Humaiz@digioussolutions.com', '$2a$10$dYHHELuRyoCPdU1HoxH63OO0uVdUpfYLbDliNpGrRd7KaioAgl6E6', 'Sales', '2025-08-12', 'Sales', 'Permanent', 'Sales Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 20:47:20', '2026-01-16 21:01:26', 'Humaiz', 'Meezan', '2025-11-01', '2035-11-01'),
(26, 33, 'Muhammad Saheem', 'Saheem@digioussolutions.com', '$2a$10$WcSIa/WS2hD2hqu3AnktLOxuyqg6j5WozTAikhPNP/XD5ZqP2nsSO', 'Sales', '2025-06-10', 'Sales', 'Probation', 'Sales Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 20:52:35', '2026-01-16 20:54:34', 'Humaiz', 'UBL', '2026-01-01', '2026-01-01'),
(27, 34, 'Khisal Zafar', 'Khisal@digioussolutions.com', '$2a$10$1tZHfUdCpH3SFaKblXqs0eLlXC1ZJugSPGYDZmudZye6.z3gEmDJK', 'Sales', '2025-06-25', 'Sales', 'Probation', 'Sales Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 20:56:59', '2026-01-16 21:00:31', 'Khisal ', 'MCB', '2026-01-01', '2026-01-01'),
(28, 35, 'Muhammad Taha', 'Taha@digioussolutions.com', '$2a$10$kusNWKh6c.xVrS4CBSsbAub8Nr9hdyduYMBctVaoslfUI5kYhVelO', 'Sales', '2025-12-11', 'Sales', 'Probation', 'Sales Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 21:02:17', '2026-01-16 21:05:08', 'MUHAMMAD TAHA KHAN', 'Meezan', '2024-06-01', '2034-06-01'),
(29, 36, 'Faiq Shahzad', 'Faiq@digioussolutions.com', '$2a$10$lYotGY4.xgqdcnZje1QsButt4FPaPPXWlm9GQUbA9KsswsrUKbrvy', 'Sales', '2025-11-10', 'Sales', 'Probation', 'Sales Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 21:05:29', '2026-01-16 23:11:35', 'FAIQ SHAHZAD', 'Bank Al Habib Limited', '2018-11-01', '2028-11-01'),
(30, 37, 'Taimoor Shah', 'Taimoor@digioussolutions.com', '$2a$10$TKSBi0sUAHeCPZGiVd8TnOedGnG/xQsi.YkHir.ST/hqosI4nsrYi', 'Production', '2025-11-01', 'Production', 'Permanent', 'Graphic Designer', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 21:10:58', '2026-01-16 21:21:49', 'Taimoor Shah', 'Meezan', '2024-09-01', '2034-09-01'),
(31, 38, 'Muhammad Ebad', 'Ebad@digioussolutions.com', '$2a$10$Q.F08LWe4/b8oWHdiEV3Uu8D1RzmrpBmgyhf8VKqp7zCuKmi0j8HK', 'Production', '2025-08-05', 'Production', 'Permanent', 'Graphic Designer', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 21:15:23', '2026-01-16 21:27:31', 'Ebad', 'Meezan', '2021-03-01', '2031-03-01'),
(32, 39, 'Muhammad Hamza', 'muhammadHamza@digioussolutions.com', '$2a$10$ToO5COm3fTb5t50jz8Y.Ku1HJz76AKdiCUVCztzhCKY12kRDQGj3a', 'Production', '2024-07-01', 'Production', 'Permanent', 'Web Developer', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 21:20:04', '2026-01-16 22:02:42', 'Muhammad Hamza', 'Meezan', '2016-07-01', '2026-07-01'),
(33, 40, 'Yanish Hyder', 'Yanish@digioussolutions.com', '$2a$10$dUH.l833va7JJuYl.eXZYumA43JEdZ00/z2KkDN9Elq2u5oiaAqGS', 'Production', '2025-09-17', 'Production', 'MTO', 'Management Trainee', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 21:24:53', '2026-01-16 21:30:47', 'Yanish Hyder', 'Easy Paisa', '2025-09-01', '2035-09-01'),
(34, 41, 'Muhammad Baqar', 'baqar@digioussolutions.com', '$2a$10$m4kqqYltW9J6TvWD5YeyzeflJplbfDIuFEjrpzEh0fJNpZZbYdOpe', 'Production', '2025-09-17', 'Production', 'Permanent', 'Web Developer', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 21:29:38', '2026-01-17 16:45:30', 'Muhammad Baqar', 'Bank Al Habib', '2017-08-01', '2027-08-01'),
(35, 42, 'Tahir ', 'Tahir@digioussolutions.com', '$2a$10$R8kmVGKiw3cKgK/bLgwFrekCt02whokWuLP6FbNsOfrBordjl99NC', 'Operations', '2025-08-01', 'Administration', 'Permanent', 'Support Staff', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 21:34:31', '2026-01-16 21:53:40', 'Tahir Khan', 'Meezan', '2020-06-01', '2030-06-01'),
(36, 43, 'Muhammad Hamdan Pir Zada', 'Hamdan@digioussolutions.com', '$2a$10$tMDVTsRb.Q9TqJqNsajb6eCAxSxnNACaEqI83Ho89B8iWwDrCZdFO', 'Sales', '2021-03-25', 'Sales', 'Permanent', 'Business Development Executive', 'Active', 1, 0, NULL, NULL, NULL, 1, '2026-01-16 22:04:45', '2026-01-16 22:04:45', 'Muhammad Hamdan Pir Zada', 'Meezan', '2020-10-01', '2030-10-01'),
(37, 44, 'Abdul Moiz Khan', 'Moiz@digioussolutions.com', '$2a$10$dLwCyp7rCmVoLSV43SwW7eR.neiV.0l76ryNn90jmpwEcgiBmZHlm', 'Production', '2023-06-01', 'Production', 'Permanent', 'Manager', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-16 22:07:59', '2026-02-19 03:50:30', 'Abdul Moiz', 'Meezan', '2020-12-01', '2030-12-01'),
(38, 45, 'Syed Awais Ahmed', 'SyedAwais@digioussolutions.com', '$2a$10$J/271n03dt4c1fjMv6SJAuKPC1EJiU/9O5JraQwVD7IhVdSQ9RMiG', 'Marketing', '2026-01-01', 'Social Media', 'MTO', 'Management Trainee Officer', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-17 17:35:08', '2026-01-17 17:47:06', 'Syed Abdal Ahmed', 'Nayapay', '2026-01-01', '2026-01-01'),
(39, 46, 'Shahrukh Hussain Siddiqui', 'Shahrukh@digioussolutions.com', '$2a$10$pOLRunO/GhWescHUmT4rXefoGA1bs.PEjScULeH598ZVKih2GiizS', 'Production', '2025-01-28', 'SEO', 'Part-Time', 'SEO Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-17 17:44:00', '2026-01-17 17:54:20', 'Shahrukh Hussain Siddiqui', 'UBL', '2016-05-01', '2026-05-01'),
(40, 47, 'Uzair Siddiqui', 'Uzair@digioussolutions.com', '$2a$10$N3mMXvO6.CY5QMLlqfzOY.8KnInQ6kFtHQWJkvGY4x3TTC5eExKei', 'Sales', '2025-07-10', 'Sales', 'Probation', 'Sales Executive', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-01-17 18:01:21', '2026-03-10 17:57:27', 'Muhammad Uzair', 'NO Bank', '2023-08-01', '2033-08-01'),
(47, 54, 'Khalid Khan', 'khalid.khan@digioussolutions.com', '$2a$10$2zY/NffZK9nNoO3nFkNQ5OawgzcFqvDXZDcW0khIzjXFGGvOZa2rG', 'Production', '2026-02-11', 'America', 'Permanent', 'SMA', 'Active', 1, 0, NULL, NULL, NULL, 1, '2026-02-10 19:33:32', '2026-02-10 19:33:32', 'IBAN 365', 'NBP', '2026-02-01', '2026-02-27'),
(48, 55, 'JFAD', 'JFAD@digioussolutions.com', '$2a$10$QXdtM9ge8NSxW/bVAzvL4.GZ69aPZmc/a/o.TVhceDL3KwoUKQs66', 'Sales', '2026-02-27', 'sss', 'Part-Time', 'sss', 'Active', 1, 0, NULL, NULL, NULL, 1, '2026-02-13 18:25:29', '2026-02-13 18:25:29', 'jcjjfj', 'HBL', '2026-02-13', '2026-02-13'),
(49, 56, 'Muhammad Hunain', 'muhammad.hunain@digioussolutions.com', '$2a$10$wxumC980kvYy0wJ8BOOrU.uNiYvOYelh7jD2O87ARTwLctZ7X6E8C', 'Operations', '2026-02-18', 'Manager', 'Permanent', 'SM OPERt', 'Active', 0, 0, NULL, NULL, NULL, 1, '2026-02-18 14:47:02', '2026-02-18 14:47:46', 'IBN PKR 123', 'HBL', '2024-09-02', '2028-07-28');

-- --------------------------------------------------------

--
-- Table structure for table `user_concurrent_sessions`
--

CREATE TABLE `user_concurrent_sessions` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `total_active_sessions` int(11) DEFAULT 0,
  `pc_count` int(11) DEFAULT 0,
  `mobile_count` int(11) DEFAULT 0,
  `tablet_count` int(11) DEFAULT 0,
  `other_count` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_concurrent_sessions`
--

INSERT INTO `user_concurrent_sessions` (`id`, `employee_id`, `email`, `total_active_sessions`, `pc_count`, `mobile_count`, `tablet_count`, `other_count`, `updated_at`) VALUES
(33, 27, 'hamza@digioussolutions.com', 103, 102, 1, 0, 0, '2026-02-28 21:46:50'),
(34, 32, 'Humaiz@digioussolutions.com', 32, 32, 0, 0, 0, '2026-02-09 16:32:25'),
(35, 33, 'Saheem@digioussolutions.com', 46, 35, 11, 0, 0, '2026-02-10 17:38:21'),
(36, 34, 'Khisal@digioussolutions.com', 22, 22, 0, 0, 0, '2026-02-10 16:21:55'),
(37, 35, 'Taha@digioussolutions.com', 20, 20, 0, 0, 0, '2026-02-10 16:26:46'),
(38, 31, 'Wahajabbas@digioussolutions.com', 58, 54, 4, 0, 0, '2026-02-10 16:23:42'),
(39, 36, 'Faiq@digioussolutions.com', 29, 25, 4, 0, 0, '2026-02-10 16:10:41'),
(40, 37, 'Taimoor@digioussolutions.com', 24, 24, 0, 0, 0, '2026-02-10 16:36:45'),
(41, 38, 'Ebad@digioussolutions.com', 34, 34, 0, 0, 0, '2026-02-10 16:36:13'),
(42, 40, 'Yanish@digioussolutions.com', 37, 37, 0, 0, 0, '2026-02-09 16:26:08'),
(43, 42, 'Tahir@digioussolutions.com', 34, 33, 1, 0, 0, '2026-02-07 02:09:43'),
(44, 39, 'muhammadHamza@digioussolutions.com', 39, 39, 0, 0, 0, '2026-02-26 19:17:58'),
(45, 44, 'Moiz@digioussolutions.com', 63, 63, 0, 0, 0, '2026-03-09 08:26:51'),
(46, 30, 'wajih@digioussolutions.com', 22, 22, 0, 0, 0, '2026-01-29 16:23:47'),
(47, 28, 'Shahmeerabbas@digioussolutions.com', 28, 28, 0, 0, 0, '2026-02-10 17:21:52'),
(48, 41, 'baqar@digioussolutions.com', 35, 35, 0, 0, 0, '2026-02-10 16:20:02'),
(49, 45, 'SyedAwais@digioussolutions.com', 35, 35, 0, 0, 0, '2026-02-10 16:31:38'),
(50, 46, 'Shahrukh@digioussolutions.com', 37, 37, 0, 0, 0, '2026-02-10 16:39:37'),
(51, 47, 'Uzair@digioussolutions.com', 19, 19, 0, 0, 0, '2026-02-10 16:14:52'),
(52, 29, 'smashhar@digioussolutions.com', 1, 1, 0, 0, 0, '2026-01-17 18:08:30'),
(55, 56, 'muhammad.hunain@digioussolutions.com', 2, 2, 0, 0, 0, '2026-03-11 11:38:42');

-- --------------------------------------------------------

--
-- Stand-in structure for view `user_session_summary`
-- (See below for the actual view)
--
CREATE TABLE `user_session_summary` (
`id` int(11)
,`employee_id` varchar(50)
,`name` varchar(255)
,`email` varchar(255)
,`department` varchar(100)
,`total_active_sessions` bigint(21)
,`pc_sessions` bigint(21)
,`mobile_sessions` bigint(21)
,`tablet_sessions` bigint(21)
,`last_login_time` timestamp
,`all_ip_addresses` mediumtext
,`all_device_types` mediumtext
);

-- --------------------------------------------------------

--
-- Table structure for table `user_system_info`
--

CREATE TABLE `user_system_info` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `session_token` varchar(500) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `login_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `logout_time` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `device_type` enum('PC','Mobile','Tablet','Other') DEFAULT 'PC',
  `device_name` varchar(255) DEFAULT NULL,
  `browser` varchar(100) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `hostname` varchar(255) DEFAULT NULL,
  `mac_address` varchar(17) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `timezone` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `last_activity_time` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_system_info`
--

INSERT INTO `user_system_info` (`id`, `employee_id`, `session_token`, `email`, `name`, `login_time`, `logout_time`, `is_active`, `device_type`, `device_name`, `browser`, `os`, `ip_address`, `hostname`, `mac_address`, `country`, `city`, `timezone`, `user_agent`, `last_activity_time`, `created_at`, `updated_at`) VALUES
(1, 27, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIwLCJlbXBsb3llZUlkIjoyNywiZW1haWwiOiJoYW16YUBkaWdpb3Vzc29sdXRpb25zLmNvbSIsIm5hbWUiOiJNdWhhbW1hZCBIYW16YSBIYXNzYW4iLCJyb2xlIjoiSFIiLCJkZXNpZ25hdGlvbiI6IkhSIC0gTWFuYWdlciIsImlhdCI6MTc2ODU5MTY0NywiZXhwIjoxNzY4Njc4MDQ3fQ.HE4xPFqbTfbDlcypGXXW-TOP3VFTrXaW_eVpFocHzgc', 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-16 19:27:27', NULL, 1, 'PC', 'Windows PC', 'Chrome 143', 'Windows 10', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'Asia/Karachi', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-16 19:27:27', '2026-01-16 19:27:27', '2026-01-16 19:27:27'),
(2, 27, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIwLCJlbXBsb3llZUlkIjoyNywiZW1haWwiOiJoYW16YUBkaWdpb3Vzc29sdXRpb25zLmNvbSIsIm5hbWUiOiJNdWhhbW1hZCBIYW16YSBIYXNzYW4iLCJyb2xlIjoiSFIiLCJkZXNpZ25hdGlvbiI6IkhSIC0gTWFuYWdlciIsImlhdCI6MTc2ODU5MTY3MSwiZXhwIjoxNzY4Njc4MDcxfQ.XU21U4-0oKB0yS_rAhnpDRPSNE9Y8fvj1V3s5ArQ4LM', 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-16 19:27:52', NULL, 1, 'PC', 'Windows PC', 'Chrome 143', 'Windows 10', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'America/Los_Angeles', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-16 19:27:52', '2026-01-16 19:27:52', '2026-01-16 19:27:52'),
(3, 27, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIwLCJlbXBsb3llZUlkIjoyNywiZW1haWwiOiJoYW16YUBkaWdpb3Vzc29sdXRpb25zLmNvbSIsIm5hbWUiOiJNdWhhbW1hZCBIYW16YSBIYXNzYW4iLCJyb2xlIjoiSFIiLCJkZXNpZ25hdGlvbiI6IkhSIC0gTWFuYWdlciIsImlhdCI6MTc2ODU5MTgxMCwiZXhwIjoxNzY4Njc4MjEwfQ.jmK2IXK-zyzEvx9UvwPqPJLtuVOO70QPm5bJYRELPcc', 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', '2026-01-16 19:30:10', NULL, 1, 'PC', 'Windows PC', 'Chrome 143', 'Windows 10', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'America/Los_Angeles', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-16 19:30:10', '2026-01-16 19:30:10', '2026-01-16 19:30:10'),
(4, 32, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI1LCJlbXBsb3llZUlkIjozMiwiZW1haWwiOiJIdW1haXpAZGlnaW91c3NvbHV0aW9ucy5jb20iLCJuYW1lIjoiTXVoYW1tYWQgSHVtYWl6Iiwicm9sZSI6IlNhbGVzIiwiZGVzaWduYXRpb24iOiJTYWxlcyBFeGVjdXRpdmUiLCJpYXQiOjE3Njg1OTY2NzgsImV4cCI6MTc2ODY4MzA3OH0.815qZGh1mJeUFYEI7DDaifegNhVKr__592IPo1ksTX8', 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-16 20:51:18', NULL, 1, 'PC', 'Windows PC', 'Chrome 143', 'Windows 10', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'Asia/Karachi', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-16 20:51:18', '2026-01-16 20:51:18', '2026-01-16 20:51:18'),
(5, 33, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI2LCJlbXBsb3llZUlkIjozMywiZW1haWwiOiJTYWhlZW1AZGlnaW91c3NvbHV0aW9ucy5jb20iLCJuYW1lIjoiTXVoYW1tYWQgU2FoZWVtIiwicm9sZSI6IlNhbGVzIiwiZGVzaWduYXRpb24iOiJTYWxlcyBFeGVjdXRpdmUiLCJpYXQiOjE3Njg1OTY4NTAsImV4cCI6MTc2ODY4MzI1MH0.GXggWwWGjJyPgbSZNVLwLG1ABjDlCMvY5zr7ZjBsJhg', 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-16 20:54:10', NULL, 1, 'Mobile', 'Android Device', 'Chrome 144', 'Android', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'Asia/Karachi', 'Mozilla/5.0 (Linux; Android 10; en; Infinix X680F Build/SP1A.210812.016) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.59 HiBrowser/v2.25.8.1;lang=en;nation=PK;locale=en_US UWS/ Mobile Safari/537.36', '2026-01-16 20:54:10', '2026-01-16 20:54:10', '2026-01-16 20:54:10'),
(6, 32, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI1LCJlbXBsb3llZUlkIjozMiwiZW1haWwiOiJIdW1haXpAZGlnaW91c3NvbHV0aW9ucy5jb20iLCJuYW1lIjoiTXVoYW1tYWQgSHVtYWl6Iiwicm9sZSI6IlNhbGVzIiwiZGVzaWduYXRpb24iOiJTYWxlcyBFeGVjdXRpdmUiLCJpYXQiOjE3Njg1OTY4NTMsImV4cCI6MTc2ODY4MzI1M30.xBf8gW1lknuE4v8n1fzQEcpx2exYSzdv4L1Wf65JVPs', 'Humaiz@digioussolutions.com', 'Muhammad Humaiz', '2026-01-16 20:54:13', NULL, 1, 'PC', 'Windows PC', 'Chrome 143', 'Windows 10', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'Asia/Karachi', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-16 20:54:13', '2026-01-16 20:54:13', '2026-01-16 20:54:13'),
(7, 33, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI2LCJlbXBsb3llZUlkIjozMywiZW1haWwiOiJTYWhlZW1AZGlnaW91c3NvbHV0aW9ucy5jb20iLCJuYW1lIjoiTXVoYW1tYWQgU2FoZWVtIiwicm9sZSI6IlNhbGVzIiwiZGVzaWduYXRpb24iOiJTYWxlcyBFeGVjdXRpdmUiLCJpYXQiOjE3Njg1OTcwMTUsImV4cCI6MTc2ODY4MzQxNX0.feprlypZ0ncOhSiTolcn_p0EzKPZKP6kyG5jsmNigCE', 'Saheem@digioussolutions.com', 'Muhammad Saheem', '2026-01-16 20:56:55', NULL, 1, 'Mobile', 'Android Device', 'Chrome 143', 'Android', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'Asia/Karachi', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36', '2026-01-16 20:56:55', '2026-01-16 20:56:55', '2026-01-16 20:56:55'),
(8, 34, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI3LCJlbXBsb3llZUlkIjozNCwiZW1haWwiOiJLaGlzYWxAZGlnaW91c3NvbHV0aW9ucy5jb20iLCJuYW1lIjoiS2hpc2FsIFphZmFyIiwicm9sZSI6IlNhbGVzIiwiZGVzaWduYXRpb24iOiJTYWxlcyBFeGVjdXRpdmUiLCJpYXQiOjE3Njg1OTcxNzYsImV4cCI6MTc2ODY4MzU3Nn0.Fa6TlD0PSakccaTYzQocXRUJPAHXv7OPmADE7FRMqqg', 'Khisal@digioussolutions.com', 'Khisal Zafar', '2026-01-16 20:59:36', NULL, 1, 'PC', 'Windows PC', 'Chrome 143', 'Windows 10', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'Asia/Karachi', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-16 20:59:36', '2026-01-16 20:59:36', '2026-01-16 20:59:36'),
(9, 35, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI4LCJlbXBsb3llZUlkIjozNSwiZW1haWwiOiJUYWhhQGRpZ2lvdXNzb2x1dGlvbnMuY29tIiwibmFtZSI6Ik11aGFtbWFkIFRhaGEiLCJyb2xlIjoiU2FsZXMiLCJkZXNpZ25hdGlvbiI6IlNhbGVzIEV4ZWN1dGl2ZSIsImlhdCI6MTc2ODU5NzQ0OSwiZXhwIjoxNzY4NjgzODQ5fQ.guqz4cQRh6ffTVsFi7epm9mbZTC0XkwUCjMKh-qbYoI', 'Taha@digioussolutions.com', 'Muhammad Taha', '2026-01-16 21:04:09', NULL, 1, 'PC', 'Windows PC', 'Chrome 143', 'Windows 10', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'Asia/Karachi', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-16 21:04:09', '2026-01-16 21:04:09', '2026-01-16 21:04:09'),
(10, 31, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI0LCJlbXBsb3llZUlkIjozMSwiZW1haWwiOiJXYWhhamFiYmFzQGRpZ2lvdXNzb2x1dGlvbnMuY29tIiwibmFtZSI6IlN5ZWQgV2FoYWogQWJiYXMgIiwicm9sZSI6IlNhbGVzIiwiZGVzaWduYXRpb24iOiJTZW5pb3IgU2FsZXMgRXhlY3V0aXZlIiwiaWF0IjoxNzY4NTk3NjQyLCJleHAiOjE3Njg2ODQwNDJ9.g_hUPpz_YC3LilIld8LBK57W3JF5qdj3cHT2G9Mbquc', 'Wahajabbas@digioussolutions.com', 'Syed Wahaj Abbas ', '2026-01-16 21:07:22', NULL, 1, 'PC', 'Windows PC', 'Chrome 143', 'Windows 10', '::1', 'digious-crm-official.vercel.app', 'N/A', 'Unknown', 'Unknown', 'Asia/Yekaterinburg', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-16 21:07:22', '2026-01-16 21:07:22', '2026-01-16 21:07:22'),

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_applications_with_employee`
-- (See below for the actual view)
--
CREATE TABLE `v_applications_with_employee` (
`id` int(11)
,`application_number` varchar(20)
,`employee_id` int(11)
,`employee_name` varchar(100)
,`employee_email` varchar(100)
,`department` varchar(100)
,`application_type` varchar(150)
,`subject` varchar(255)
,`description` longtext
,`status` enum('pending','approved','rejected','in_review','in-progress','withdrawn')
,`priority` enum('low','medium','high','urgent')
,`assigned_to` varchar(150)
,`submission_date` datetime
,`last_updated` datetime
,`approved_date` datetime
,`approved_by` varchar(150)
,`rejection_reason` text
,`document_count` int(10)
,`documents` longtext
,`metadata` longtext
);

-- --------------------------------------------------------

--
-- Structure for view `active_users_view`
--
DROP TABLE IF EXISTS `active_users_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_plustaff`@`127.0.0.1` SQL SECURITY DEFINER VIEW `active_users_view`  AS SELECT `usi`.`id` AS `id`, `usi`.`employee_id` AS `employee_id`, `usi`.`email` AS `email`, `usi`.`name` AS `name`, `usi`.`login_time` AS `login_time`, `usi`.`device_type` AS `device_type`, `usi`.`device_name` AS `device_name`, `usi`.`ip_address` AS `ip_address`, `usi`.`hostname` AS `hostname`, `usi`.`mac_address` AS `mac_address`, `usi`.`browser` AS `browser`, `usi`.`os` AS `os`, `usi`.`country` AS `country`, `usi`.`city` AS `city`, `usi`.`last_activity_time` AS `last_activity_time`, timestampdiff(MINUTE,`usi`.`login_time`,current_timestamp()) AS `logged_in_minutes`, `usi`.`is_active` AS `is_active` FROM `user_system_info` AS `usi` WHERE `usi`.`is_active` = 1 ORDER BY `usi`.`login_time` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `Attendance_Summary_View`
--
DROP TABLE IF EXISTS `Attendance_Summary_View`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_plustaff`@`127.0.0.1` SQL SECURITY DEFINER VIEW `Attendance_Summary_View`  AS SELECT `ea`.`employee_id` AS `employee_id`, `ea`.`name` AS `name`, `ea`.`email` AS `email`, `ea`.`attendance_date` AS `attendance_date`, `ea`.`check_in_time` AS `check_in_time`, `ea`.`check_out_time` AS `check_out_time`, `ea`.`status` AS `status`, `ea`.`total_breaks_taken` AS `total_breaks_taken`, `ea`.`total_break_duration_minutes` AS `total_break_duration_minutes`, concat(floor(`ea`.`gross_working_time_minutes` / 60),'h ',`ea`.`gross_working_time_minutes` MOD 60,'m') AS `gross_working_time`, concat(floor(`ea`.`net_working_time_minutes` / 60),'h ',`ea`.`net_working_time_minutes` MOD 60,'m') AS `net_working_time`, `ea`.`overtime_hours` AS `overtime_hours`, `ea`.`on_time` AS `on_time`, `ea`.`late_by_minutes` AS `late_by_minutes`, `ea`.`created_at` AS `created_at`, `ea`.`updated_at` AS `updated_at` FROM `Employee_Attendance` AS `ea` ORDER BY `ea`.`attendance_date` DESC, `ea`.`employee_id` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `employee_allowances_in_pkr`
--
DROP TABLE IF EXISTS `employee_allowances_in_pkr`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_plustaff`@`127.0.0.1` SQL SECURITY DEFINER VIEW `employee_allowances_in_pkr`  AS SELECT `ea`.`id` AS `id`, `ea`.`employee_id` AS `employee_id`, `eo`.`name` AS `employee_name`, `eo`.`email` AS `email`, `ea`.`allowance_name` AS `allowance_name`, `ea`.`allowance_amount` AS `allowance_amount`, `ea`.`currency` AS `currency`, round(`ea`.`allowance_amount` * `ea`.`exchange_rate`,2) AS `amount_in_pkr`, `ea`.`exchange_rate` AS `exchange_rate`, `ea`.`created_at` AS `created_at` FROM (`employee_allowances` `ea` left join `employee_onboarding` `eo` on(`ea`.`employee_id` = `eo`.`id`)) ORDER BY `ea`.`employee_id` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `employee_attendance_summary`
--
DROP TABLE IF EXISTS `employee_attendance_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_plustaff`@`127.0.0.1` SQL SECURITY DEFINER VIEW `employee_attendance_summary`  AS SELECT `eo`.`id` AS `id`, `eo`.`name` AS `full_name`, `eo`.`employee_id` AS `employee_id`, count(`ea`.`id`) AS `total_attendance_records`, sum(case when `ea`.`status` = 'Present' then 1 else 0 end) AS `present_days`, sum(case when `ea`.`status` = 'Absent' then 1 else 0 end) AS `absent_days`, sum(case when `ea`.`status` = 'Late' then 1 else 0 end) AS `late_days`, sum(case when `ea`.`status` = 'Half Day' then 1 else 0 end) AS `half_days`, round(sum(case when `ea`.`status` = 'Present' or `ea`.`status` = 'Late' then 1 else 0 end) / nullif(count(`ea`.`id`),0) * 100,2) AS `attendance_percentage`, sum(cast(coalesce(`ea`.`overtime_hours`,0) as decimal(5,2))) AS `total_overtime_hours`, max(`ea`.`attendance_date`) AS `last_attendance_date`, max(case when `ea`.`status` = 'Present' or `ea`.`status` = 'Late' then `ea`.`attendance_date` end) AS `last_present_date` FROM (`employee_onboarding` `eo` left join `Employee_Attendance` `ea` on(`eo`.`id` = `ea`.`employee_id` and `ea`.`attendance_date` >= curdate() - interval 90 day)) WHERE `eo`.`status` <> 'Inactive' GROUP BY `eo`.`id`, `eo`.`name`, `eo`.`employee_id` ;

-- --------------------------------------------------------

--
-- Structure for view `employee_financial_summary`
--
DROP TABLE IF EXISTS `employee_financial_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_plustaff`@`127.0.0.1` SQL SECURITY DEFINER VIEW `employee_financial_summary`  AS SELECT `eo`.`id` AS `id`, `eo`.`name` AS `full_name`, `eo`.`employee_id` AS `employee_id`, `ba`.`id` AS `bank_account_id`, concat(substr(`ba`.`account_number`,1,4),'****',substr(`ba`.`account_number`,-4)) AS `account_number_masked`, `ba`.`account_number` AS `account_number_full`, `ba`.`account_title_name` AS `account_title_name`, `ba`.`bank_name` AS `bank_name`, `ba`.`account_type` AS `account_type`, coalesce((select sum(cast(`ea2`.`allowance_amount` as decimal(12,2))) from `employee_allowances` `ea2` where `ea2`.`employee_id` = `eo`.`id`),0) AS `total_allowances`, coalesce((select group_concat(concat(`ea3`.`allowance_name`,'=',`ea3`.`allowance_amount`) separator ', ') from `employee_allowances` `ea3` where `ea3`.`employee_id` = `eo`.`id`),'No allowances') AS `allowances_detail`, `es`.`base_salary` AS `base_salary`, `es`.`total_salary` AS `total_salary`, `ba`.`created_at` AS `created_at` FROM ((`employee_onboarding` `eo` left join `employee_bank_accounts` `ba` on(`eo`.`id` = `ba`.`employee_id` and `ba`.`is_primary` = 1)) left join `employee_salary` `es` on(`eo`.`id` = `es`.`employee_id`)) WHERE `eo`.`status` <> 'Inactive' ;

-- --------------------------------------------------------

--
-- Structure for view `Monthly_Attendance_Summary`
--
DROP TABLE IF EXISTS `Monthly_Attendance_Summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `Monthly_Attendance_Summary`  AS SELECT `Employee_Attendance`.`employee_id` AS `employee_id`, `Employee_Attendance`.`name` AS `name`, `Employee_Attendance`.`email` AS `email`, year(`Employee_Attendance`.`attendance_date`) AS `year`, month(`Employee_Attendance`.`attendance_date`) AS `month`, count(0) AS `total_days`, sum(case when `Employee_Attendance`.`status` = 'Present' then 1 else 0 end) AS `present_days`, sum(case when `Employee_Attendance`.`status` = 'Absent' then 1 else 0 end) AS `absent_days`, sum(case when `Employee_Attendance`.`status` = 'Late' then 1 else 0 end) AS `late_days`, sum(case when `Employee_Attendance`.`status` = 'On Leave' then 1 else 0 end) AS `leave_days`, round(sum(case when `Employee_Attendance`.`status` = 'Present' then 1 else 0 end) * 100 / count(0),2) AS `attendance_rate`, round(sum(case when `Employee_Attendance`.`on_time` = 1 then 1 else 0 end) * 100 / count(0),2) AS `on_time_rate`, sum(`Employee_Attendance`.`net_working_time_minutes`) AS `total_working_minutes`, sum(`Employee_Attendance`.`overtime_minutes`) AS `total_overtime_minutes`, sum(`Employee_Attendance`.`total_break_duration_minutes`) AS `total_break_minutes` FROM `Employee_Attendance` GROUP BY `Employee_Attendance`.`employee_id`, `Employee_Attendance`.`name`, `Employee_Attendance`.`email`, year(`Employee_Attendance`.`attendance_date`), month(`Employee_Attendance`.`attendance_date`) ;

-- --------------------------------------------------------

--
-- Structure for view `Overtime_Report_View`
--
DROP TABLE IF EXISTS `Overtime_Report_View`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_plustaff`@`127.0.0.1` SQL SECURITY DEFINER VIEW `Overtime_Report_View`  AS SELECT `ea`.`employee_id` AS `employee_id`, `ea`.`name` AS `name`, `ea`.`email` AS `email`, `ea`.`attendance_date` AS `attendance_date`, `ea`.`check_in_time` AS `check_in_time`, `ea`.`check_out_time` AS `check_out_time`, `ea`.`net_working_time_minutes` AS `net_working_time_minutes`, `ea`.`expected_working_time_minutes` AS `expected_working_time_minutes`, `ea`.`overtime_minutes` AS `overtime_minutes`, `ea`.`overtime_hours` AS `overtime_hours`, CASE WHEN `ea`.`overtime_hours` > 0 THEN round(`ea`.`overtime_hours` * 1.5,2) ELSE 0 END AS `overtime_pay_multiplier` FROM `Employee_Attendance` AS `ea` WHERE `ea`.`overtime_minutes` > 0 ORDER BY `ea`.`attendance_date` DESC, `ea`.`overtime_hours` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `user_session_summary`
--
DROP TABLE IF EXISTS `user_session_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_plustaff`@`127.0.0.1` SQL SECURITY DEFINER VIEW `user_session_summary`  AS SELECT `eo`.`id` AS `id`, `eo`.`employee_id` AS `employee_id`, `eo`.`name` AS `name`, `eo`.`email` AS `email`, `eo`.`department` AS `department`, count(case when `usi`.`is_active` = 1 then 1 end) AS `total_active_sessions`, count(case when `usi`.`device_type` = 'PC' and `usi`.`is_active` = 1 then 1 end) AS `pc_sessions`, count(case when `usi`.`device_type` = 'Mobile' and `usi`.`is_active` = 1 then 1 end) AS `mobile_sessions`, count(case when `usi`.`device_type` = 'Tablet' and `usi`.`is_active` = 1 then 1 end) AS `tablet_sessions`, max(`usi`.`login_time`) AS `last_login_time`, group_concat(distinct `usi`.`ip_address` separator ',') AS `all_ip_addresses`, group_concat(distinct `usi`.`device_type` separator ',') AS `all_device_types` FROM (`employee_onboarding` `eo` left join `user_system_info` `usi` on(`eo`.`id` = `usi`.`employee_id`)) GROUP BY `eo`.`id`, `eo`.`employee_id`, `eo`.`name`, `eo`.`email`, `eo`.`department` ;

-- --------------------------------------------------------

--
-- Structure for view `v_applications_with_employee`
--
DROP TABLE IF EXISTS `v_applications_with_employee`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_applications_with_employee`  AS SELECT `a`.`id` AS `id`, `a`.`application_number` AS `application_number`, `a`.`employee_id` AS `employee_id`, `e`.`name` AS `employee_name`, `e`.`email` AS `employee_email`, `a`.`department` AS `department`, `a`.`application_type` AS `application_type`, `a`.`subject` AS `subject`, `a`.`description` AS `description`, `a`.`status` AS `status`, `a`.`priority` AS `priority`, `a`.`assigned_to` AS `assigned_to`, `a`.`submission_date` AS `submission_date`, `a`.`last_updated` AS `last_updated`, `a`.`approved_date` AS `approved_date`, `a`.`approved_by` AS `approved_by`, `a`.`rejection_reason` AS `rejection_reason`, json_length(`a`.`documents`) AS `document_count`, `a`.`documents` AS `documents`, `a`.`metadata` AS `metadata` FROM (`applications` `a` left join `user_as_employees` `e` on(`a`.`employee_id` = `e`.`employee_id`)) ORDER BY `a`.`submission_date` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `application_number` (`application_number`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_application_number` (`application_number`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_submission_date` (`submission_date`),
  ADD KEY `idx_employee_status` (`employee_id`,`status`),
  ADD KEY `idx_pending_applications` (`employee_id`,`status`,`submission_date`),
  ADD KEY `idx_status_withdrawn` (`status`),
  ADD KEY `idx_applications_current_step` (`current_step`),
  ADD KEY `idx_applications_multi_assign` (`is_multi_assign`);

--
-- Indexes for table `application_approval_log`
--
ALTER TABLE `application_approval_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_approval_log_app_id` (`application_id`),
  ADD KEY `idx_approval_log_emp_id` (`employee_id`),
  ADD KEY `idx_approval_log_action` (`action`),
  ADD KEY `idx_approval_log_date` (`action_date`);

--
-- Indexes for table `application_assignees`
--
ALTER TABLE `application_assignees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_app_assignee_app_id` (`application_id`),
  ADD KEY `idx_app_assignee_emp_id` (`employee_id`),
  ADD KEY `idx_app_assignee_step` (`application_id`,`step_order`),
  ADD KEY `idx_app_assignee_status` (`status`);

--
-- Indexes for table `Company_Rules`
--
ALTER TABLE `Company_Rules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rule_name` (`rule_name`),
  ADD KEY `idx_rule_type` (`rule_type`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_priority` (`priority`);

--
-- Indexes for table `Employee_Absent`
--
ALTER TABLE `Employee_Absent`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_date` (`employee_id`,`absent_date`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `absent_date` (`absent_date`),
  ADD KEY `email` (`email`),
  ADD KEY `reason_type` (`reason_type`);

--
-- Indexes for table `employee_achievements`
--
ALTER TABLE `employee_achievements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_achievement_type` (`achievement_type`),
  ADD KEY `idx_is_verified` (`is_verified`);

--
-- Indexes for table `Employee_Activities`
--
ALTER TABLE `Employee_Activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_activity_type` (`activity_type`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `employee_allowances`
--
ALTER TABLE `employee_allowances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_allowance_name` (`allowance_name`),
  ADD KEY `idx_currency` (`currency`);

--
-- Indexes for table `Employee_Attendance`
--
ALTER TABLE `Employee_Attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_date` (`employee_id`,`attendance_date`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_attendance_date` (`attendance_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `employee_bank_accounts`
--
ALTER TABLE `employee_bank_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_account_per_employee` (`employee_id`,`account_number`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_is_primary` (`is_primary`);

--
-- Indexes for table `Employee_Breaks`
--
ALTER TABLE `Employee_Breaks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `idx_attendance_id` (`attendance_id`),
  ADD KEY `idx_break_type` (`break_type`);

--
-- Indexes for table `Employee_Checkout_Missing`
--
ALTER TABLE `Employee_Checkout_Missing`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_attendance_date` (`attendance_date`),
  ADD KEY `idx_is_resolved` (`is_resolved`),
  ADD KEY `idx_original_attendance_id` (`original_attendance_id`);

--
-- Indexes for table `employee_dynamic_resources`
--
ALTER TABLE `employee_dynamic_resources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_resource_name` (`resource_name`);

--
-- Indexes for table `employee_leaves`
--
ALTER TABLE `employee_leaves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `employee_onboarding`
--
ALTER TABLE `employee_onboarding`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `cnic` (`cnic`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_join_date` (`join_date`),
  ADD KEY `idx_employment_status` (`employment_status`),
  ADD KEY `idx_confirmation_date` (`confirmation_date`),
  ADD KEY `idx_bank_name` (`bank_name`),
  ADD KEY `idx_cnic_dates` (`cnic_issue_date`,`cnic_expiry_date`),
  ADD KEY `idx_profile_photo` (`profile_photo`(768)),
  ADD KEY `idx_social_links_json` (`social_links_json`(100)),
  ADD KEY `idx_required_documents_json` (`required_documents_json`(100)),
  ADD KEY `idx_achievements_json` (`achievements_json`(100));

--
-- Indexes for table `employee_required_documents`
--
ALTER TABLE `employee_required_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_document_type` (`document_type`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `employee_resources`
--
ALTER TABLE `employee_resources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_allocated_date` (`allocated_date`);

--
-- Indexes for table `employee_salary`
--
ALTER TABLE `employee_salary`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employee_id`);

--
-- Indexes for table `employee_skills`
--
ALTER TABLE `employee_skills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `skill_type` (`skill_type`),
  ADD KEY `idx_employee_skills_lookup` (`employee_id`,`skill_type`);

--
-- Indexes for table `employee_social_links`
--
ALTER TABLE `employee_social_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_platform` (`employee_id`,`platform`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_platform` (`platform`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expense_date` (`expense_date`),
  ADD KEY `idx_category_id` (`category_id`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_category_name` (`name`);

--
-- Indexes for table `onboarding_progress`
--
ALTER TABLE `onboarding_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_is_completed` (`is_completed`);

--
-- Indexes for table `payroll_records`
--
ALTER TABLE `payroll_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_month` (`employee_id`,`month`,`year`),
  ADD KEY `idx_month_year` (`month`,`year`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `log_type` (`log_type`);

--
-- Indexes for table `user_as_employees`
--
ALTER TABLE `user_as_employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_employee_id` (`employee_id`),
  ADD KEY `idx_session_token` (`current_session_token`),
  ADD KEY `idx_last_login` (`last_login_time`);

--
-- Indexes for table `user_concurrent_sessions`
--
ALTER TABLE `user_concurrent_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_employee_id` (`employee_id`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `user_system_info`
--
ALTER TABLE `user_system_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD UNIQUE KEY `uk_session_token` (`session_token`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_login_time` (`login_time`),
  ADD KEY `idx_device_type` (`device_type`),
  ADD KEY `idx_ip_address` (`ip_address`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `application_approval_log`
--
ALTER TABLE `application_approval_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `application_assignees`
--
ALTER TABLE `application_assignees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `Company_Rules`
--
ALTER TABLE `Company_Rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `Employee_Absent`
--
ALTER TABLE `Employee_Absent`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=837;

--
-- AUTO_INCREMENT for table `employee_achievements`
--
ALTER TABLE `employee_achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Employee_Activities`
--
ALTER TABLE `Employee_Activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_allowances`
--
ALTER TABLE `employee_allowances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `Employee_Attendance`
--
ALTER TABLE `Employee_Attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=358;

--
-- AUTO_INCREMENT for table `employee_bank_accounts`
--
ALTER TABLE `employee_bank_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `Employee_Breaks`
--
ALTER TABLE `Employee_Breaks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=274;

--
-- AUTO_INCREMENT for table `Employee_Checkout_Missing`
--
ALTER TABLE `Employee_Checkout_Missing`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `employee_dynamic_resources`
--
ALTER TABLE `employee_dynamic_resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `employee_leaves`
--
ALTER TABLE `employee_leaves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `employee_onboarding`
--
ALTER TABLE `employee_onboarding`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `employee_required_documents`
--
ALTER TABLE `employee_required_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_resources`
--
ALTER TABLE `employee_resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `employee_salary`
--
ALTER TABLE `employee_salary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `employee_skills`
--
ALTER TABLE `employee_skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_social_links`
--
ALTER TABLE `employee_social_links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `onboarding_progress`
--
ALTER TABLE `onboarding_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `payroll_records`
--
ALTER TABLE `payroll_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=385;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_as_employees`
--
ALTER TABLE `user_as_employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `user_concurrent_sessions`
--
ALTER TABLE `user_concurrent_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `user_system_info`
--
ALTER TABLE `user_system_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=801;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `user_as_employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `Employee_Absent`
--
ALTER TABLE `Employee_Absent`
  ADD CONSTRAINT `Employee_Absent_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_achievements`
--
ALTER TABLE `employee_achievements`
  ADD CONSTRAINT `fk_achievements_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Employee_Activities`
--
ALTER TABLE `Employee_Activities`
  ADD CONSTRAINT `Employee_Activities_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_allowances`
--
ALTER TABLE `employee_allowances`
  ADD CONSTRAINT `employee_allowances_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Employee_Attendance`
--
ALTER TABLE `Employee_Attendance`
  ADD CONSTRAINT `Employee_Attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`);

--
-- Constraints for table `employee_bank_accounts`
--
ALTER TABLE `employee_bank_accounts`
  ADD CONSTRAINT `employee_bank_accounts_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Employee_Breaks`
--
ALTER TABLE `Employee_Breaks`
  ADD CONSTRAINT `Employee_Breaks_ibfk_1` FOREIGN KEY (`attendance_id`) REFERENCES `Employee_Attendance` (`id`),
  ADD CONSTRAINT `Employee_Breaks_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`);

--
-- Constraints for table `employee_dynamic_resources`
--
ALTER TABLE `employee_dynamic_resources`
  ADD CONSTRAINT `employee_dynamic_resources_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_leaves`
--
ALTER TABLE `employee_leaves`
  ADD CONSTRAINT `fk_employee_leaves_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `employee_resources`
--
ALTER TABLE `employee_resources`
  ADD CONSTRAINT `employee_resources_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_salary`
--
ALTER TABLE `employee_salary`
  ADD CONSTRAINT `employee_salary_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_skills`
--
ALTER TABLE `employee_skills`
  ADD CONSTRAINT `employee_skills_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `fk_expense_category` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `onboarding_progress`
--
ALTER TABLE `onboarding_progress`
  ADD CONSTRAINT `onboarding_progress_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_as_employees`
--
ALTER TABLE `user_as_employees`
  ADD CONSTRAINT `user_as_employees_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_concurrent_sessions`
--
ALTER TABLE `user_concurrent_sessions`
  ADD CONSTRAINT `user_concurrent_sessions_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_system_info`
--
ALTER TABLE `user_system_info`
  ADD CONSTRAINT `user_system_info_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee_onboarding` (`id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`localhost` EVENT `evt_process_missing_checkouts` ON SCHEDULE EVERY 1 DAY STARTS '2026-02-20 21:05:00' ON COMPLETION PRESERVE ENABLE COMMENT 'Auto-populate Employee_Checkout_Missing for employees who forgot' DO CALL ProcessMissingCheckouts()$$

CREATE DEFINER=`root`@`localhost` EVENT `evt_process_daily_absences` ON SCHEDULE EVERY 1 DAY STARTS '2026-02-20 21:10:00' ON COMPLETION PRESERVE ENABLE COMMENT 'Auto-mark daily absences for employees with no check-in' DO CALL ProcessDailyAbsences()$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;