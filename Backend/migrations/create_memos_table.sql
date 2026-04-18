
CREATE TABLE IF NOT EXISTS `memos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `memo_number` VARCHAR(20) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `category` ENUM('general','policy','announcement','warning','appreciation','event','other') NOT NULL DEFAULT 'general',
  `priority` ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `target_type` ENUM('all','department') NOT NULL DEFAULT 'all' COMMENT 'all = visible to everyone, department = specific dept only',
  `target_department` VARCHAR(100) DEFAULT NULL COMMENT 'Required when target_type = department',
  `created_by_employee_id` VARCHAR(50) NOT NULL COMMENT 'Employee ID of the HR/Admin who created the memo',
  `created_by_name` VARCHAR(150) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = visible, 0 = archived/hidden',
  `effective_date` DATE DEFAULT NULL COMMENT 'Date the memo becomes effective',
  `expiry_date` DATE DEFAULT NULL COMMENT 'Optional auto-hide date',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `memo_number` (`memo_number`),
  KEY `idx_target` (`target_type`, `target_department`),
  KEY `idx_active` (`is_active`),
  KEY `idx_created_by` (`created_by_employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
