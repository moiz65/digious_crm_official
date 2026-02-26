-- =====================================================
-- Employee Leaves - Auto-Population Procedure & Trigger
-- =====================================================
-- Purpose: Automatically sync all employees to employee_leaves table
-- - Procedure: populate existing employees
-- - Trigger: auto-insert new employees when added to employee_onboarding

-- =====================================================
-- PROCEDURE: Populate employee_leaves from employee_onboarding
-- =====================================================
-- This procedure will insert all current active employees into employee_leaves table
-- if they don't already exist (safe to run multiple times)

DELIMITER $$

CREATE PROCEDURE `PopulateEmployeeLeaves` ()
BEGIN
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

DELIMITER ;

-- =====================================================
-- TRIGGER: Auto-insert new employees into employee_leaves
-- =====================================================
-- This trigger fires when a new employee is inserted into employee_onboarding
-- and automatically creates a leave record for them

DELIMITER $$

CREATE TRIGGER `employee_onboarding_insert_leaves` 
AFTER INSERT ON `employee_onboarding` 
FOR EACH ROW
BEGIN
    -- Check if the new employee should be added to leaves tracking
    -- (added for all employees regardless of status)
    IF (NEW.id IS NOT NULL) THEN
        INSERT INTO employee_leaves 
        (employee_id, email, name, casual_leaves_used, casual_leaves_total, 
         sick_leaves_used, sick_leaves_total, annual_leaves_used, annual_leaves_total, remarks)
        VALUES 
        (NEW.id, NEW.email, NEW.name, 0, 8, 0, 8, 0, 12, 'Auto-created on employee onboarding');
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- TRIGGER: Update leave record if employee status changes
-- =====================================================
-- This trigger updates employee_leaves when employee_onboarding is updated

DELIMITER $$

CREATE TRIGGER `employee_onboarding_update_leaves` 
AFTER UPDATE ON `employee_onboarding` 
FOR EACH ROW
BEGIN
    -- Update email and name in employee_leaves if they changed
    IF (NEW.email <> OLD.email OR NEW.name <> OLD.name) THEN
        UPDATE employee_leaves 
        SET email = NEW.email, 
            name = NEW.name,
            updated_at = NOW()
        WHERE employee_id = NEW.id;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- RUN THIS FIRST TIME ONLY:
-- =====================================================
-- Execute this procedure to populate all current employees (regardless of status)
-- CALL PopulateEmployeeLeaves();

-- =====================================================
-- DELETE HANDLING:
-- =====================================================
-- When an employee is deleted from employee_onboarding:
-- - The corresponding record in employee_leaves is AUTOMATICALLY DELETED (CASCADE)
-- - This is handled by the foreign key constraint: ON DELETE CASCADE
-- - No manual cleanup required!

-- =====================================================
-- VERIFY THE PROCEDURE
-- =====================================================
-- Check how many employees were added:
-- SELECT COUNT(*) as total_employees FROM employee_leaves;

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all employee leave balances
-- SELECT 
--   employee_id,
--   name,
--   email,
--   CONCAT(casual_leaves_used, '/', casual_leaves_total) AS 'Casual Leaves',
--   CONCAT(sick_leaves_used, '/', sick_leaves_total) AS 'Sick Leaves',
--   CONCAT(annual_leaves_used, '/', annual_leaves_total) AS 'Annual Leaves'
-- FROM employee_leaves
-- ORDER BY name;

-- Get leave summary for a specific employee
-- SELECT 
--   id,
--   employee_id,
--   name,
--   casual_leaves_used,
--   casual_leaves_total,
--   casual_leaves_remaining,
--   sick_leaves_used,
--   sick_leaves_total,
--   sick_leaves_remaining,
--   annual_leaves_used,
--   annual_leaves_total,
--   annual_leaves_remaining
-- FROM employee_leaves 
-- WHERE employee_id = 27;

-- =====================================================
-- UPDATE LEAVE USAGE (No INSERT needed!)
-- =====================================================

-- When employee uses a casual leave:
-- UPDATE employee_leaves SET casual_leaves_used = casual_leaves_used + 1 WHERE employee_id = 27;

-- When employee uses a sick leave:
-- UPDATE employee_leaves SET sick_leaves_used = sick_leaves_used + 1 WHERE employee_id = 27;

-- When employee uses an annual leave:
-- UPDATE employee_leaves SET annual_leaves_used = annual_leaves_used + 1 WHERE employee_id = 27;

-- Deduct multiple leaves at once:
-- UPDATE employee_leaves 
-- SET casual_leaves_used = casual_leaves_used + 2,
--     annual_leaves_used = annual_leaves_used + 3
-- WHERE employee_id = 27;

-- =====================================================
-- RESET LEAVES (if needed for new fiscal year)
-- =====================================================
-- UPDATE employee_leaves 
-- SET casual_leaves_used = 0,
--     sick_leaves_used = 0,
--     annual_leaves_used = 0
-- WHERE leaves_year IS NULL OR YEAR(leaves_year) < 2026;

-- =====================================================
-- SYNC EMPLOYEES (if new employees were added)
-- =====================================================
-- Run this anytime to sync new employees that were added after initial setup:
-- CALL PopulateEmployeeLeaves();
