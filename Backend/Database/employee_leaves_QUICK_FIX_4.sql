-- ============================================================================
-- QUICK FIX: POPULATE EMPLOYEE LEAVES TABLE
-- ============================================================================
-- Execute this to immediately populate all employees into employee_leaves table
-- Date: Feb 12, 2026
-- ============================================================================

USE `Digious_CRM_DataBase`;

-- Execute the procedure that populates employee_leaves with all employees
CALL `PopulateEmployeeLeaves`();

-- Verify all employees are now in the table
SELECT 
  COUNT(*) AS total_employees_loaded,
  SUM(CASE WHEN casual_leaves_remaining = 8 THEN 1 ELSE 0 END) AS with_full_casual_leaves,
  SUM(CASE WHEN sick_leaves_remaining = 8 THEN 1 ELSE 0 END) AS with_full_sick_leaves,
  SUM(CASE WHEN annual_leaves_remaining = 12 THEN 1 ELSE 0 END) AS with_full_annual_leaves
FROM `employee_leaves`;

-- Show summary of all employees
SELECT 
  employee_id,
  name,
  email,
  CONCAT(casual_leaves_remaining, '/8') AS casual_remaining,
  CONCAT(sick_leaves_remaining, '/8') AS sick_remaining,
  CONCAT(annual_leaves_remaining, '/12') AS annual_remaining
FROM `employee_leaves`
ORDER BY employee_id
LIMIT 25;

-- ============================================================================
-- SUCCESS: All employees should now appear with their leave allocations!
-- ============================================================================
