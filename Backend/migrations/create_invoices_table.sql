-- ============================================================
-- Invoice Module Migration
-- Run: mysql -u root -p Digious_CRM_DataBase < Backend/migrations/create_invoices_table.sql
-- ============================================================

-- Optional: add address column to customers (for invoice client picker)
-- Skip this line if the column already exists.
ALTER TABLE `customers`
  ADD COLUMN `client_address` TEXT DEFAULT NULL COMMENT 'Customer billing/mailing address';

-- ── invoices (header) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `invoices` (
  `id`                    INT(11)        NOT NULL AUTO_INCREMENT,
  `invoice_number`        VARCHAR(30)    NOT NULL,
  `customer_id`           INT(11)        DEFAULT NULL COMMENT 'FK → customers.id',
  `client_name`           VARCHAR(200)   NOT NULL,
  `client_email`          VARCHAR(200)   NOT NULL,
  `client_phone`          VARCHAR(50)    DEFAULT NULL,
  `client_address`        TEXT           DEFAULT NULL,
  `project_title`         VARCHAR(255)   NOT NULL,
  `issue_date`            DATE           NOT NULL,
  `due_date`              DATE           NOT NULL,
  `subtotal`              DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
  `tax_amount`            DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
  `discount_amount`       DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
  `total_amount`          DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
  `paid_amount`           DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
  `status`                ENUM('Paid','Unpaid','Overdue','Partially Paid','Cancelled','Draft','Sent') NOT NULL DEFAULT 'Sent',
  `priority`              ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  `notes`                 TEXT           DEFAULT NULL,
  `terms`                 TEXT           DEFAULT NULL,
  `created_by_employee_id` VARCHAR(50)   DEFAULT NULL,
  `created_by_name`       VARCHAR(150)   DEFAULT NULL,
  `created_at`            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_number` (`invoice_number`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_issue_date` (`issue_date`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `fk_invoices_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── invoice_items (line items) ─────────────────────────────
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id`            INT(11)        NOT NULL AUTO_INCREMENT,
  `invoice_id`    INT(11)        NOT NULL,
  `description`   VARCHAR(500)   NOT NULL DEFAULT '',
  `quantity`      DECIMAL(10,2)  NOT NULL DEFAULT 1.00,
  `unit_price`    DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
  `amount`        DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
  `sort_order`    INT(11)        NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_id` (`invoice_id`),
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
