-- Migration: Add 'ML' (Marginal Late) status to Employee_Attendance ENUM
-- Run this SQL against your MySQL database before deploying backend changes.
-- ML = check-in between 21:15 and 21:30 (marginal late, shown in dark blue)

ALTER TABLE `Employee_Attendance` 
MODIFY COLUMN `status` 
ENUM('Present','Absent','Late','ML','On Leave','Half Day','Paid Leave','Uninformed Absent') 
DEFAULT 'Absent';
