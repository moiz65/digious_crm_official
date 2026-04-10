
ALTER TABLE `Employee_Attendance` 
MODIFY COLUMN `status` 
ENUM('Present','Absent','Late','ML','On Leave','Half Day','Paid Leave','Uninformed Absent') 
DEFAULT 'Absent';
