-- ============================================================
-- Sales Module – Two tables: sales_categories + sales
-- Auto-created by salesController.js on server start, but
-- this migration file can also be run manually if needed.
-- ============================================================

CREATE TABLE IF NOT EXISTS `sales_categories` (
  `id`          INT(11)       NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100)  NOT NULL,
  `slug`        VARCHAR(100)  NOT NULL,
  `description` VARCHAR(255)  DEFAULT NULL,
  `icon`        VARCHAR(50)   DEFAULT 'Globe',
  `color`       VARCHAR(30)   DEFAULT '#3B82F6',
  `is_active`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sales_cat_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default categories (skip if already present)
INSERT IGNORE INTO `sales_categories` (`name`, `slug`, `icon`, `color`) VALUES
  ('Website Design',  'website-design',  'Globe',        '#3B82F6'),
  ('Logo Design',     'logo-design',     'Palette',      '#8B5CF6'),
  ('Branding',        'branding',        'PenTool',      '#6366F1'),
  ('Marketing',       'marketing',       'Megaphone',    '#F97316'),
  ('Development',     'development',     'Code',         '#10B981'),
  ('E-commerce',      'ecommerce',       'ShoppingCart',  '#EC4899'),
  ('Photography',     'photography',     'Camera',       '#EAB308'),
  ('Graphic Design',  'graphic-design',  'Layout',       '#EF4444');

CREATE TABLE IF NOT EXISTS `sales` (
  `id`                  INT(11)        NOT NULL AUTO_INCREMENT,
  `employee_id`         INT(11)        NOT NULL,
  `employee_name`       VARCHAR(150)   DEFAULT NULL,
  `employee_email`      VARCHAR(150)   DEFAULT NULL,

  -- Client info
  `client_name`         VARCHAR(200)   NOT NULL,
  `client_email`        VARCHAR(200)   DEFAULT NULL,
  `client_phone`        VARCHAR(50)    DEFAULT NULL,

  -- Project info
  `category_id`         INT(11)        DEFAULT NULL,
  `category_slug`       VARCHAR(100)   DEFAULT NULL,
  `project_description` TEXT           DEFAULT NULL,

  -- Financials
  `total_amount`        DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `upfront_payment`     DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `remaining_balance`   DECIMAL(12,2)  GENERATED ALWAYS AS (`total_amount` - `upfront_payment`) STORED,

  -- Payment metadata
  `merchant`            VARCHAR(50)    DEFAULT NULL,
  `payment_method`      VARCHAR(50)    DEFAULT NULL,
  `account_name`        VARCHAR(200)   DEFAULT NULL,

  -- Dates
  `sale_date`           DATE           NOT NULL,
  `deadline`            DATE           DEFAULT NULL,

  -- Status
  `status`              ENUM('pending','in-progress','completed','cancelled','refunded')
                        NOT NULL DEFAULT 'pending',
  `notes`               TEXT           DEFAULT NULL,

  -- Audit
  `created_by`          INT(11)        DEFAULT NULL,
  `created_at`          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_sales_employee`  (`employee_id`),
  KEY `idx_sales_date`      (`sale_date`),
  KEY `idx_sales_status`    (`status`),
  KEY `idx_sales_category`  (`category_id`),
  CONSTRAINT `fk_sales_category`
    FOREIGN KEY (`category_id`) REFERENCES `sales_categories` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
