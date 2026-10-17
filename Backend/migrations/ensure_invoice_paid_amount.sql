-- ============================================================
-- Migration: invoices.paid_amount
-- Purpose : Store amount received for Partially Paid invoices
-- Idempotent: safe to run more than once
--
-- Run:
--   mysql -u root -p digious_crm_official < Backend/migrations/ensure_invoice_paid_amount.sql
-- Or:
--   cd Backend/migrations && ./run_migration.sh ensure_invoice_paid_amount.sql
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS migrate_invoice_paid_amount$$

CREATE PROCEDURE migrate_invoice_paid_amount()
BEGIN
  DECLARE col_count INT DEFAULT 0;

  SELECT COUNT(*)
  INTO col_count
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'invoices'
    AND COLUMN_NAME = 'paid_amount';

  IF col_count = 0 THEN
    ALTER TABLE `invoices`
      ADD COLUMN `paid_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00
        COMMENT 'Amount received so far (Partially Paid invoices)'
        AFTER `total_amount`;
  END IF;

  -- Ensure status enum includes Partially Paid (no-op if already present)
  -- MySQL will error if value already exists in some versions; wrap carefully via schema check
  SET col_count = 0;
  SELECT COUNT(*)
  INTO col_count
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'invoices'
    AND COLUMN_NAME = 'status'
    AND COLUMN_TYPE LIKE '%Partially Paid%';

  IF col_count = 0 THEN
    ALTER TABLE `invoices`
      MODIFY COLUMN `status`
        ENUM(
          'Paid',
          'Unpaid',
          'Overdue',
          'Partially Paid',
          'Cancelled',
          'Draft',
          'Sent'
        ) NOT NULL DEFAULT 'Sent';
  END IF;

  UPDATE `invoices`
  SET `paid_amount` = 0
  WHERE `paid_amount` IS NULL;
END$$

DELIMITER ;

CALL migrate_invoice_paid_amount();
DROP PROCEDURE IF EXISTS migrate_invoice_paid_amount;
