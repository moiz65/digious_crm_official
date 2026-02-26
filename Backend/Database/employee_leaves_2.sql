-- =====================================================
-- Employee Leaves Table
-- =====================================================
-- Purpose: Track leave balances for each employee
-- Columns: casual_leaves_used, casual_leaves_total
--          sick_leaves_used, sick_leaves_total
--          annual_leaves_used, annual_leaves_total

CREATE TABLE `employee_leaves` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `employee_id` int(11) NOT NULL UNIQUE,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  
  -- Casual Leaves
  `casual_leaves_used` int(11) DEFAULT 0 COMMENT 'Number of casual leaves used',
  `casual_leaves_total` int(11) DEFAULT 8 COMMENT 'Total casual leaves allocated (default: 8)',
  `casual_leaves_remaining` int(11) GENERATED ALWAYS AS (casual_leaves_total - casual_leaves_used) STORED COMMENT 'Auto-calculated remaining casual leaves',
  
  -- Sick Leaves
  `sick_leaves_used` int(11) DEFAULT 0 COMMENT 'Number of sick leaves used',
  `sick_leaves_total` int(11) DEFAULT 8 COMMENT 'Total sick leaves allocated (default: 8)',
  `sick_leaves_remaining` int(11) GENERATED ALWAYS AS (sick_leaves_total - sick_leaves_used) STORED COMMENT 'Auto-calculated remaining sick leaves',
  
  -- Annual Leaves
  `annual_leaves_used` int(11) DEFAULT 0 COMMENT 'Number of annual leaves used',
  `annual_leaves_total` int(11) DEFAULT 12 COMMENT 'Total annual leaves allocated (default: 12)',
  `annual_leaves_remaining` int(11) GENERATED ALWAYS AS (annual_leaves_total - annual_leaves_used) STORED COMMENT 'Auto-calculated remaining annual leaves',
  
  -- Additional Info
  `leaves_year` year DEFAULT NULL COMMENT 'Financial year for leaves (optional)',
  `last_updated_by` int(11) DEFAULT NULL COMMENT 'Admin ID who last updated leaves',
  `remarks` text DEFAULT NULL COMMENT 'Additional remarks about leaves',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  
  -- Foreign Key
  CONSTRAINT `fk_employee_leaves_employee_id` 
    FOREIGN KEY (`employee_id`) 
    REFERENCES `employee_onboarding`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  -- Indexes for better query performance
  INDEX `idx_employee_id` (`employee_id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Sample Data (Optional - uncomment to insert)
-- =====================================================
-- INSERT INTO `employee_leaves` (`employee_id`, `email`, `name`, `casual_leaves_used`, `casual_leaves_total`, `sick_leaves_used`, `sick_leaves_total`, `annual_leaves_used`, `annual_leaves_total`, `remarks`) 
-- VALUES 
-- (27, 'hamza@digioussolutions.com', 'Muhammad Hamza Hassan', 0, 8, 0, 8, 0, 12, 'Initial allocation'),
-- (28, 'Shahmeerabbas@digioussolutions.com', 'Syed Shahmeer Abbas', 0, 8, 0, 8, 0, 12, 'Initial allocation'),
-- (29, 'smashhar@digioussolutions.com', 'Syed Muhammad Ashhar', 0, 8, 0, 8, 0, 12, 'Initial allocation');

-- =====================================================
-- Useful Queries
-- =====================================================

-- Get all employee leave balances
-- SELECT id, employee_id, name, email, casual_leaves_used, casual_leaves_total, casual_leaves_remaining, sick_leaves_used, sick_leaves_total, sick_leaves_remaining, annual_leaves_used, annual_leaves_total, annual_leaves_remaining FROM employee_leaves;

-- Get leave summary for a specific employee
-- SELECT employee_id, name, 
--        CONCAT(casual_leaves_used, '/', casual_leaves_total) AS 'Casual Leaves',
--        CONCAT(sick_leaves_used, '/', sick_leaves_total) AS 'Sick Leaves',
--        CONCAT(annual_leaves_used, '/', annual_leaves_total) AS 'Annual Leaves'
-- FROM employee_leaves 
-- WHERE employee_id = 27;

-- Update leave usage (example: add 1 casual leave used)
-- UPDATE employee_leaves SET casual_leaves_used = casual_leaves_used + 1 WHERE employee_id = 27;

-- Reset leaves for new year
-- UPDATE employee_leaves SET casual_leaves_used = 0, sick_leaves_used = 0, annual_leaves_used = 0 WHERE leaves_year = YEAR(CURDATE());
