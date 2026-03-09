-- ============================================================
-- Migration 004: Expense Categories & Expenses
-- ============================================================

-- Expense Categories Table
CREATE TABLE IF NOT EXISTS expense_categories (
  id          INT(11)     NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  color       VARCHAR(20)  DEFAULT '#3B82F6',
  is_active   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Admin-managed expense categories';

-- Expenses Table (denormalized — category name stored alongside FK for audit trail)
CREATE TABLE IF NOT EXISTS expenses (
  id              INT(11)        NOT NULL AUTO_INCREMENT,
  category_id     INT(11)        DEFAULT NULL,
  category_name   VARCHAR(100)   NOT NULL COMMENT 'Denormalized snapshot at time of entry',
  amount          DECIMAL(12,2)  NOT NULL,
  note            TEXT           DEFAULT NULL,
  expense_date    DATE           NOT NULL,
  expense_time    TIME           NOT NULL,
  created_by      INT(11)        DEFAULT NULL COMMENT 'admin_users.id',
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_expense_date  (expense_date),
  KEY idx_category_id   (category_id),
  KEY idx_created_by    (created_by),
  CONSTRAINT fk_expense_category
    FOREIGN KEY (category_id) REFERENCES expense_categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Company expenses — denormalized category name for audit trail';

-- Seed default categories
INSERT IGNORE INTO expense_categories (name, description, color) VALUES
  ('Salaries',        'Employee salary payments',          '#3B82F6'),
  ('Office Supplies', 'Stationery and office consumables', '#8B5CF6'),
  ('Travel',          'Travel and transportation costs',   '#10B981'),
  ('Utilities',       'Electricity, internet, phone',      '#F59E0B'),
  ('Marketing',       'Advertising and promotions',        '#EF4444'),
  ('Miscellaneous',   'Other uncategorised expenses',      '#6B7280');
