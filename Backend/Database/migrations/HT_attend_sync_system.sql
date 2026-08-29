-- Sync Jobs Table
CREATE TABLE attendance_sync_jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_id VARCHAR(50) UNIQUE NOT NULL,
    initiated_by INT NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    total_employees INT DEFAULT 0,
    processed_employees INT DEFAULT 0,
    total_records INT DEFAULT 0,
    synced_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    date_from DATE,
    date_to DATE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    error_message TEXT,
    INDEX idx_job_id (job_id),
    INDEX idx_status (status)
);

-- Sync Logs Table
CREATE TABLE attendance_sync_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_id VARCHAR(50) NOT NULL,
    employee_id INT,
    employee_code VARCHAR(50),
    status ENUM('pending', 'processing', 'inserted', 'updated', 'skipped', 'failed') DEFAULT 'processing',
    synced_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    record_date DATE,
    punch_type VARCHAR(10),
    message TEXT,
    error_message TEXT,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job_id (job_id),
    INDEX idx_employee (employee_id),
    FOREIGN KEY (job_id) REFERENCES attendance_sync_jobs(job_id) ON DELETE CASCADE
);