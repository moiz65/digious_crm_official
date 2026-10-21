
-- Migration: 001_create_sales_tier_tables
-- Description: Create sales tier management tables

CREATE TABLE IF NOT EXISTS sales_tiers (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    level INT(11) NOT NULL,
    base_salary_pkr DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    monthly_target_usd DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    quarterly_target_usd DECIMAL(12,2)
        GENERATED ALWAYS AS (monthly_target_usd * 3) STORED,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    color VARCHAR(30) DEFAULT '#3B82F6',
    description TEXT DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tier_level (level)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS sales_employees (
    id INT(11) NOT NULL AUTO_INCREMENT,
    employee_id INT(11) NOT NULL,
    current_tier_id INT(11) NOT NULL,
    joined_date DATE NOT NULL,
    last_tier_change_date DATE DEFAULT NULL,
    last_evaluation_date DATE DEFAULT NULL,
    status ENUM('Active','Inactive','On Leave')
        NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sales_emp (employee_id),
    KEY idx_current_tier (current_tier_id),
    CONSTRAINT fk_se_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee_onboarding(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_se_tier
        FOREIGN KEY (current_tier_id)
        REFERENCES sales_tiers(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS sales_quarters (
    id INT(11) NOT NULL AUTO_INCREMENT,
    quarter_name VARCHAR(10) NOT NULL,
    year INT(11) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    evaluation_date DATE NOT NULL,
    status ENUM('Upcoming','Active','Completed','Evaluated')
        NOT NULL DEFAULT 'Upcoming',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_quarter (quarter_name, year),
    KEY idx_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS employee_quarter_performance (
    id INT(11) NOT NULL AUTO_INCREMENT,
    employee_id INT(11) NOT NULL,
    quarter_id INT(11) NOT NULL,
    tier_at_start_id INT(11) NOT NULL,
    tier_at_start_name VARCHAR(50) DEFAULT NULL,
    base_salary_at_start DECIMAL(12,2) DEFAULT 0.00,
    quarterly_target_at_start DECIMAL(12,2) DEFAULT 0.00,
    total_sales_usd DECIMAL(12,2) DEFAULT 0.00,
    achievement_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_target_achieved TINYINT(1) DEFAULT 0,
    tier_at_end_id INT(11) DEFAULT NULL,
    tier_at_end_name VARCHAR(50) DEFAULT NULL,
    tier_change ENUM('UPGRADE','DOWNGRADE','SAME')
        DEFAULT 'SAME',
    evaluated_at TIMESTAMP NULL,
    evaluation_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_emp_quarter (employee_id, quarter_id),
    KEY idx_emp (employee_id),
    KEY idx_quarter (quarter_id),
    CONSTRAINT fk_eqp_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee_onboarding(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_eqp_quarter
        FOREIGN KEY (quarter_id)
        REFERENCES sales_quarters(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS tier_change_history (
    id INT(11) NOT NULL AUTO_INCREMENT,
    employee_id INT(11) NOT NULL,
    quarter_id INT(11) NOT NULL,
    old_tier_id INT(11) NOT NULL,
    new_tier_id INT(11) NOT NULL,
    old_salary DECIMAL(12,2) DEFAULT 0.00,
    new_salary DECIMAL(12,2) DEFAULT 0.00,
    change_type ENUM('UPGRADE','DOWNGRADE','SAME') NOT NULL,
    reason TEXT DEFAULT NULL,
    changed_by INT(11) DEFAULT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_emp (employee_id),
    KEY idx_quarter (quarter_id),
    CONSTRAINT fk_tch_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee_onboarding(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tch_quarter
        FOREIGN KEY (quarter_id)
        REFERENCES sales_quarters(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
