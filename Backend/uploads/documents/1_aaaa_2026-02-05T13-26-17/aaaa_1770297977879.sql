-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 04, 2026 at 07:48 PM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u115615899_arauf_crm`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts_payable`
--

CREATE TABLE `accounts_payable` (
  `id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `supplier_email` varchar(255) DEFAULT NULL,
  `supplier_phone` varchar(50) DEFAULT NULL,
  `po_id` int(11) DEFAULT NULL,
  `po_number` varchar(50) DEFAULT NULL,
  `po_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `invoice_amount` decimal(15,2) NOT NULL,
  `amount_paid` decimal(15,2) DEFAULT 0.00,
  `amount_due` decimal(15,2) NOT NULL,
  `aging_days` int(11) DEFAULT 0,
  `aging_status` enum('Current','30+ Days','60+ Days','90+ Days','120+ Days') DEFAULT 'Current',
  `status` enum('Open','Partial','Paid','Overdue','Cancelled') DEFAULT 'Open',
  `currency` varchar(10) DEFAULT 'PKR',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `accounts_receivable`
--

CREATE TABLE `accounts_receivable` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `invoice_amount` decimal(15,2) NOT NULL,
  `amount_paid` decimal(15,2) DEFAULT 0.00,
  `amount_due` decimal(15,2) NOT NULL,
  `aging_days` int(11) DEFAULT 0,
  `aging_status` enum('Current','30+ Days','60+ Days','90+ Days','120+ Days') DEFAULT 'Current',
  `status` enum('Open','Partial','Paid','Overdue','Cancelled') DEFAULT 'Open',
  `currency` varchar(10) DEFAULT 'PKR',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('All','Expense','Income','Asset','Liability') NOT NULL DEFAULT 'Expense',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chart_of_accounts`
--

CREATE TABLE `chart_of_accounts` (
  `id` int(11) NOT NULL,
  `account_code` varchar(50) NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `account_type` enum('Asset','Liability','Equity','Income','Expense','Receivable','Payable') NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `opening_balance` decimal(15,2) DEFAULT 0.00,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `parent_account_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_settings`
--

CREATE TABLE `company_settings` (
  `id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL DEFAULT 'A Rauf Brother Textile',
  `address` text NOT NULL DEFAULT 'Room No.205 Floor Saleha Chamber, Plot No. 8-9/C-1 Site, Karachi',
  `email` varchar(255) NOT NULL DEFAULT 'contact@araufbrothe.com',
  `phone` varchar(50) NOT NULL DEFAULT '021-36404043',
  `st_reg_no` varchar(100) NOT NULL DEFAULT '3253255666541',
  `ntn_no` varchar(100) NOT NULL DEFAULT '7755266214-8',
  `logo_path` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customertable`
--

CREATE TABLE `customertable` (
  `customer_id` int(11) NOT NULL,
  `customer` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `phone` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `stn` varchar(100) DEFAULT '',
  `ntn` varchar(100) DEFAULT '',
  `email` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `vendor` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` varchar(50) NOT NULL,
  `paymentMethod` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Pending',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_reports`
--

CREATE TABLE `financial_reports` (
  `id` int(11) NOT NULL,
  `report_id` varchar(50) NOT NULL,
  `short_id` varchar(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `range_type` varchar(20) DEFAULT 'all',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_debit` decimal(15,2) DEFAULT 0.00,
  `total_credit` decimal(15,2) DEFAULT 0.00,
  `total_balance` decimal(15,2) DEFAULT 0.00,
  `contact_count` int(11) DEFAULT 0,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `generated_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_report_details`
--

CREATE TABLE `financial_report_details` (
  `id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `debit_amount` decimal(15,2) DEFAULT 0.00,
  `credit_amount` decimal(15,2) DEFAULT 0.00,
  `balance` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `general_ledger`
--

CREATE TABLE `general_ledger` (
  `id` int(11) NOT NULL,
  `transaction_date` date NOT NULL,
  `voucher_number` varchar(50) NOT NULL,
  `voucher_type` enum('Invoice','Payment','Expense','Receipt','Transfer','Adjustment') NOT NULL,
  `account_id` int(11) NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL COMMENT 'invoice_id, expense_id, payment_id, etc.',
  `description` text NOT NULL,
  `debit_amount` decimal(15,2) DEFAULT 0.00,
  `credit_amount` decimal(15,2) DEFAULT 0.00,
  `running_balance` decimal(15,2) DEFAULT 0.00,
  `posted_by` int(11) DEFAULT NULL,
  `is_posted` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice`
--

CREATE TABLE `invoice` (
  `id` int(11) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `p_number` varchar(255) NOT NULL,
  `a_p_number` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `st_reg_no` varchar(255) NOT NULL,
  `ntn_number` varchar(255) NOT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT 0.00,
  `rate` decimal(10,2) DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'PKR',
  `salesTax` decimal(5,2) DEFAULT 0.00,
  `item_amount` decimal(12,2) DEFAULT 0.00,
  `bill_date` date NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `terms_of_payment` varchar(255) DEFAULT 'Within 15 days',
  `payment_deadline` date NOT NULL,
  `note` text DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 17.00,
  `tax_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'Draft',
  `is_sent` tinyint(1) DEFAULT 0,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_days` int(11) DEFAULT 30 COMMENT 'Number of days for payment terms (default 30 days)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `item_no` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `net_weight` decimal(10,2) DEFAULT NULL,
  `rate` decimal(10,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_payments`
--

CREATE TABLE `invoice_payments` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `payment_type` enum('deposit','partial','full') NOT NULL DEFAULT 'partial',
  `payment_number` varchar(50) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ledger_entries`
--

CREATE TABLE `ledger_entries` (
  `entry_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `entry_date` date NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `bill_no` varchar(100) DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT 'Cash',
  `cheque_no` varchar(100) DEFAULT NULL,
  `debit_amount` decimal(15,2) DEFAULT 0.00,
  `credit_amount` decimal(15,2) DEFAULT 0.00,
  `balance` decimal(15,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'paid',
  `due_date` date DEFAULT NULL,
  `has_multiple_items` tinyint(1) DEFAULT 0,
  `sales_tax_rate` decimal(5,2) DEFAULT 0.00,
  `sales_tax_amount` decimal(15,2) DEFAULT 0.00,
  `sequence` decimal(10,1) DEFAULT 1.0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ledger_entry_fy_mapping`
--

CREATE TABLE `ledger_entry_fy_mapping` (
  `mapping_id` int(11) NOT NULL,
  `entry_id` int(11) NOT NULL,
  `fy_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ledger_financial_years`
--

CREATE TABLE `ledger_financial_years` (
  `fy_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `fy_name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `opening_debit` decimal(15,2) DEFAULT 0.00,
  `opening_credit` decimal(15,2) DEFAULT 0.00,
  `opening_balance` decimal(15,2) DEFAULT 0.00,
  `closing_debit` decimal(15,2) DEFAULT 0.00,
  `closing_credit` decimal(15,2) DEFAULT 0.00,
  `closing_balance` decimal(15,2) DEFAULT 0.00,
  `status` enum('open','closed','archived') DEFAULT 'open',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ledger_fy_closing_balance`
--

CREATE TABLE `ledger_fy_closing_balance` (
  `closing_id` int(11) NOT NULL,
  `fy_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `closing_date` date NOT NULL,
  `closing_debit` decimal(15,2) DEFAULT 0.00,
  `closing_credit` decimal(15,2) DEFAULT 0.00,
  `closing_balance` decimal(15,2) DEFAULT 0.00,
  `pdf_file_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ledger_line_items`
--

CREATE TABLE `ledger_line_items` (
  `id` int(11) NOT NULL,
  `entry_id` int(11) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT 0.00,
  `rate` decimal(15,2) DEFAULT 0.00,
  `tax_rate` decimal(5,2) DEFAULT 0.00,
  `amount` decimal(15,2) DEFAULT 0.00,
  `total_with_tax` decimal(15,2) DEFAULT 0.00,
  `item_type` varchar(50) DEFAULT 'material',
  `line_sequence` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ledger_single_materials`
--

CREATE TABLE `ledger_single_materials` (
  `id` int(11) NOT NULL,
  `entry_id` int(11) NOT NULL,
  `bill_no` varchar(100) DEFAULT NULL,
  `quantity_mtr` decimal(10,2) DEFAULT 0.00,
  `rate` decimal(15,2) DEFAULT 0.00,
  `tax_rate` decimal(5,2) DEFAULT 0.00,
  `amount` decimal(15,2) DEFAULT 0.00,
  `total_with_tax` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_receipts`
--

CREATE TABLE `payment_receipts` (
  `id` int(11) NOT NULL,
  `receipt_number` varchar(50) NOT NULL,
  `receipt_date` date NOT NULL,
  `receipt_type` enum('Customer Payment','Supplier Payment','Other Receipt') NOT NULL,
  `party_type` enum('Customer','Supplier','Other') NOT NULL,
  `party_id` int(11) DEFAULT NULL,
  `party_name` varchar(255) NOT NULL,
  `account_id` int(11) DEFAULT NULL,
  `reference_number` varchar(50) DEFAULT NULL COMMENT 'Check/Bank Transfer number',
  `amount_received` decimal(15,2) NOT NULL,
  `payment_method` enum('Cash','Check','Bank Transfer','Credit Card','Other') NOT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `posted_by` int(11) DEFAULT NULL,
  `is_reconciled` tinyint(1) DEFAULT 0,
  `status` enum('Pending','Confirmed','Cancelled') DEFAULT 'Confirmed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `po_complete_history`
-- (See below for the actual view)
--
CREATE TABLE `po_complete_history` (
`po_number` varchar(50)
,`po_date` date
,`supplier_name` varchar(255)
,`po_total_amount` decimal(15,2)
,`po_status` enum('Draft','Pending','Approved','Received','Cancelled')
,`invoice_id` int(11)
,`invoice_number` varchar(100)
,`invoice_date` date
,`due_date` date
,`invoice_amount` decimal(15,2)
,`invoice_status` enum('Draft','Not Sent','Sent','Paid','Overdue','Cancelled')
,`payment_date` date
,`payment_method` varchar(50)
,`customer_name` varchar(255)
,`invoice_notes` text
,`total_invoiced_amount` decimal(15,2)
,`remaining_amount` decimal(15,2)
,`invoice_count` int(11)
,`last_invoice_date` date
,`invoicing_status` varchar(18)
,`invoicing_percentage` decimal(21,2)
,`invoice_created_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `po_complete_summary`
-- (See below for the actual view)
--
CREATE TABLE `po_complete_summary` (
`po_id` int(11)
,`po_number` varchar(50)
,`supplier_name` varchar(255)
,`po_total_amount` decimal(15,2)
,`po_status` enum('Draft','Pending','Approved','Received','Cancelled')
,`amount_invoiced` decimal(37,2)
,`amount_remaining` decimal(38,2)
,`amount_invoice_count` bigint(21)
,`po_total_quantity` decimal(32,2)
,`quantity_invoiced` decimal(37,2)
,`quantity_remaining` decimal(38,2)
,`quantity_invoice_count` bigint(21)
,`invoicing_type` varchar(15)
);

-- --------------------------------------------------------

--
-- Table structure for table `po_deletion_history`
--

CREATE TABLE `po_deletion_history` (
  `id` int(11) NOT NULL,
  `po_invoice_id` int(11) NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `po_number` varchar(100) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `invoice_amount` decimal(15,2) NOT NULL,
  `invoice_date` date NOT NULL,
  `deletion_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `deletion_reason` text DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT 'System User',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks deleted PO invoices for audit and history purposes';

-- --------------------------------------------------------

--
-- Stand-in structure for view `po_deletion_summary`
-- (See below for the actual view)
--
CREATE TABLE `po_deletion_summary` (
`id` int(11)
,`po_invoice_id` int(11)
,`invoice_number` varchar(100)
,`po_number` varchar(100)
,`customer_name` varchar(255)
,`invoice_amount` decimal(15,2)
,`invoice_date` date
,`deletion_date` timestamp
,`deletion_reason` text
,`deleted_by` varchar(100)
,`notes` text
,`created_at` timestamp
,`po_total_amount` decimal(15,2)
,`total_invoiced_amount` decimal(15,2)
,`remaining_amount` decimal(15,2)
,`invoice_count` int(11)
,`current_status` varchar(12)
);

-- --------------------------------------------------------

--
-- Table structure for table `po_invoices`
--

CREATE TABLE `po_invoices` (
  `id` int(11) NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `po_id` varchar(100) DEFAULT NULL,
  `po_number` varchar(100) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'PKR',
  `status` enum('Draft','Not Sent','Sent','Paid','Overdue','Cancelled') DEFAULT 'Not Sent',
  `payment_date` date DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `invoicing_mode` enum('amount','quantity','mixed') NOT NULL DEFAULT 'amount' COMMENT 'Invoicing mode: amount-based, quantity-based, or mixed',
  `total_po_quantity` decimal(15,2) DEFAULT 0.00 COMMENT 'Total quantity from PO (for quantity-based)',
  `invoiced_quantity` decimal(15,2) DEFAULT 0.00 COMMENT 'Quantity being invoiced',
  `quantity_percentage` decimal(5,2) DEFAULT 0.00 COMMENT 'Percentage of PO quantity being invoiced',
  `payment_days` int(11) DEFAULT 30 COMMENT 'Number of days for payment terms (default 30 days)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `po_invoices`
--
DELIMITER $$
CREATE TRIGGER `trg_po_summary_after_delete` AFTER DELETE ON `po_invoices` FOR EACH ROW BEGIN
    DECLARE po_total DECIMAL(15,2) DEFAULT 0;
    DECLARE remaining_invoices INT DEFAULT 0;
    
    -- Get the actual PO total amount from purchase_orders table
    SELECT total_amount INTO po_total 
    FROM purchase_orders 
    WHERE po_number = OLD.po_number 
    LIMIT 1;
    
    -- Count remaining invoices for this PO
    SELECT COUNT(*) INTO remaining_invoices 
    FROM po_invoices 
    WHERE po_number = OLD.po_number;
    
    IF remaining_invoices > 0 THEN
        -- Update existing summary record
        UPDATE po_invoice_summary 
        SET 
            po_total_amount = COALESCE(po_total, po_total_amount),
            total_invoiced_amount = total_invoiced_amount - OLD.total_amount,
            remaining_amount = COALESCE(po_total, po_total_amount) - (total_invoiced_amount - OLD.total_amount),
            invoice_count = invoice_count - 1,
            last_invoice_date = (
                SELECT MAX(invoice_date) 
                FROM po_invoices 
                WHERE po_number = OLD.po_number
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE po_number = OLD.po_number;
    ELSE
        -- Delete summary record if no invoices remain
        DELETE FROM po_invoice_summary WHERE po_number = OLD.po_number;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_po_summary_after_insert` AFTER INSERT ON `po_invoices` FOR EACH ROW BEGIN
    DECLARE po_total DECIMAL(15,2) DEFAULT 0;
    
    -- Get the actual PO total amount from purchase_orders table
    SELECT total_amount INTO po_total 
    FROM purchase_orders 
    WHERE po_number = NEW.po_number 
    LIMIT 1;
    
    -- If PO not found, use 0 as fallback
    IF po_total IS NULL THEN
        SET po_total = 0;
    END IF;
    
    -- Insert or update the summary
    INSERT INTO po_invoice_summary (
        po_number, 
        po_total_amount, 
        total_invoiced_amount, 
        remaining_amount, 
        invoice_count, 
        last_invoice_date,
        created_at,
        updated_at
    )
    VALUES (
        NEW.po_number,
        po_total,
        NEW.total_amount,
        po_total - NEW.total_amount,
        1,
        NEW.invoice_date,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON DUPLICATE KEY UPDATE
        po_total_amount = po_total,
        total_invoiced_amount = total_invoiced_amount + NEW.total_amount,
        remaining_amount = po_total - (total_invoiced_amount + NEW.total_amount),
        invoice_count = invoice_count + 1,
        last_invoice_date = NEW.invoice_date,
        updated_at = CURRENT_TIMESTAMP;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_po_summary_after_update` AFTER UPDATE ON `po_invoices` FOR EACH ROW BEGIN
    DECLARE po_total DECIMAL(15,2) DEFAULT 0;
    
    -- Get the actual PO total amount from purchase_orders table
    SELECT total_amount INTO po_total 
    FROM purchase_orders 
    WHERE po_number = NEW.po_number 
    LIMIT 1;
    
    -- If PO not found, use existing po_total_amount
    IF po_total IS NULL THEN
        SELECT po_total_amount INTO po_total 
        FROM po_invoice_summary 
        WHERE po_number = NEW.po_number;
    END IF;
    
    -- Update the summary
    UPDATE po_invoice_summary 
    SET 
        po_total_amount = po_total,
        total_invoiced_amount = total_invoiced_amount - OLD.total_amount + NEW.total_amount,
        remaining_amount = po_total - (total_invoiced_amount - OLD.total_amount + NEW.total_amount),
        last_invoice_date = NEW.invoice_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE po_number = NEW.po_number;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_sync_payment_days_on_invoice_insert` BEFORE INSERT ON `po_invoices` FOR EACH ROW BEGIN
    DECLARE po_payment_days INT DEFAULT 30;
    
    -- Get payment_days from parent purchase_order
    SELECT payment_days INTO po_payment_days
    FROM arauf_crm.purchase_orders
    WHERE id = NEW.po_id
    LIMIT 1;
    
    -- If no payment_days specified in INSERT or it's default 30, use PO's payment_days
    IF NEW.payment_days IS NULL OR NEW.payment_days = 30 THEN
        SET NEW.payment_days = po_payment_days;
    END IF;
    
    -- Recalculate due_date based on payment_days
    IF NEW.invoice_date IS NOT NULL THEN
        SET NEW.due_date = DATE_ADD(NEW.invoice_date, INTERVAL NEW.payment_days DAY);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `po_invoice_history`
-- (See below for the actual view)
--
CREATE TABLE `po_invoice_history` (
`id` int(11)
,`invoice_number` varchar(100)
,`invoice_date` date
,`due_date` date
,`po_number` varchar(100)
,`customer_name` varchar(255)
,`invoice_amount` decimal(15,2)
,`status` enum('Draft','Not Sent','Sent','Paid','Overdue','Cancelled')
,`notes` text
,`po_total_amount` decimal(15,2)
,`total_invoiced_amount` decimal(15,2)
,`remaining_amount` decimal(15,2)
,`invoice_count` int(11)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `po_invoice_items`
--

CREATE TABLE `po_invoice_items` (
  `id` int(11) NOT NULL,
  `po_invoice_id` int(11) NOT NULL,
  `po_item_id` int(11) NOT NULL,
  `item_no` int(11) NOT NULL,
  `description` text NOT NULL,
  `po_quantity` decimal(10,2) NOT NULL,
  `invoiced_quantity` decimal(10,2) NOT NULL,
  `remaining_quantity` decimal(10,2) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `net_weight` decimal(10,2) DEFAULT NULL COMMENT 'Net weight in KG',
  `unit_price` decimal(15,2) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `po_invoice_items`
--
DELIMITER $$
CREATE TRIGGER `trg_calculate_invoice_quantities_delete` AFTER DELETE ON `po_invoice_items` FOR EACH ROW BEGIN
  -- Update the parent po_invoices record with quantity totals
  UPDATE po_invoices pi
  SET 
    invoiced_quantity = (
      SELECT COALESCE(SUM(pii.invoiced_quantity), 0) 
      FROM po_invoice_items pii 
      WHERE pii.po_invoice_id = pi.id
    ),
    subtotal = (
      SELECT COALESCE(SUM(pii.amount), 0) 
      FROM po_invoice_items pii 
      WHERE pii.po_invoice_id = pi.id
    ),
    total_amount = (
      SELECT COALESCE(SUM(pii.amount), 0) + COALESCE(pi.tax_amount, 0) 
      FROM po_invoice_items pii 
      WHERE pii.po_invoice_id = pi.id
    )
  WHERE pi.id = OLD.po_invoice_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_calculate_invoice_quantities_insert` AFTER INSERT ON `po_invoice_items` FOR EACH ROW BEGIN
  -- Update the parent po_invoices record with quantity totals
  UPDATE po_invoices pi
  SET 
    invoiced_quantity = (
      SELECT COALESCE(SUM(pii.invoiced_quantity), 0) 
      FROM po_invoice_items pii 
      WHERE pii.po_invoice_id = pi.id
    ),
    subtotal = (
      SELECT COALESCE(SUM(pii.amount), 0) 
      FROM po_invoice_items pii 
      WHERE pii.po_invoice_id = pi.id
    ),
    total_amount = (
      SELECT COALESCE(SUM(pii.amount), 0) + COALESCE(pi.tax_amount, 0) 
      FROM po_invoice_items pii 
      WHERE pii.po_invoice_id = pi.id
    )
  WHERE pi.id = NEW.po_invoice_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_calculate_invoice_quantities_update` AFTER UPDATE ON `po_invoice_items` FOR EACH ROW BEGIN
  -- Update the parent po_invoices record with quantity totals
  UPDATE po_invoices pi
  SET 
    invoiced_quantity = (
      SELECT COALESCE(SUM(pii.invoiced_quantity), 0) 
      FROM po_invoice_items pii 
      WHERE pii.po_invoice_id = pi.id
    ),
    subtotal = (
      SELECT COALESCE(SUM(pii.amount), 0) 
      FROM po_invoice_items pii 
      WHERE pii.po_invoice_id = pi.id
    ),
    total_amount = (
      SELECT COALESCE(SUM(pii.amount), 0) + COALESCE(pi.tax_amount, 0) 
      FROM po_invoice_items pii 
      WHERE pii.po_invoice_id = pi.id
    )
  WHERE pi.id = NEW.po_invoice_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `po_invoice_summary`
--

CREATE TABLE `po_invoice_summary` (
  `id` int(11) NOT NULL,
  `po_number` varchar(100) NOT NULL,
  `po_total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_invoiced_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remaining_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `invoice_count` int(11) NOT NULL DEFAULT 0,
  `last_invoice_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `po_item_quantity_tracking`
-- (See below for the actual view)
--
CREATE TABLE `po_item_quantity_tracking` (
`po_item_id` int(11)
,`po_id` int(11)
,`po_number` varchar(50)
,`item_no` int(11)
,`description` text
,`po_quantity` decimal(10,2)
,`unit` varchar(50)
,`unit_price` decimal(15,2)
,`po_amount` decimal(15,2)
,`total_invoiced_quantity` decimal(32,2)
,`remaining_quantity` decimal(33,2)
,`item_invoicing_percentage` decimal(41,6)
,`item_status` varchar(18)
,`invoice_count` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `po_quantity_summary`
-- (See below for the actual view)
--
CREATE TABLE `po_quantity_summary` (
`po_id` int(11)
,`po_number` varchar(50)
,`supplier_name` varchar(255)
,`po_status` enum('Draft','Pending','Approved','Received','Cancelled')
,`po_total_quantity` decimal(32,2)
,`total_invoiced_quantity` decimal(37,2)
,`remaining_quantity` decimal(38,2)
,`quantity_invoicing_percentage` decimal(46,6)
,`quantity_invoice_count` bigint(21)
,`quantity_status` varchar(18)
);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL,
  `po_number` varchar(50) NOT NULL,
  `po_date` date NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `supplier_email` varchar(255) DEFAULT NULL,
  `supplier_phone` varchar(50) DEFAULT NULL,
  `supplier_address` text DEFAULT NULL,
  `subtotal` decimal(15,2) DEFAULT 0.00,
  `tax_rate` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'PKR',
  `status` enum('Draft','Pending','Approved','Received','Cancelled') DEFAULT 'Pending',
  `previous_status` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `payment_days` int(11) DEFAULT 30 COMMENT 'Number of days for payment terms (default 30 days)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `purchase_orders`
--
DELIMITER $$
CREATE TRIGGER `trg_po_delete_cleanup` BEFORE DELETE ON `purchase_orders` FOR EACH ROW BEGIN
    -- Create deletion history records for all related invoices
    INSERT INTO po_deletion_history (
        po_invoice_id,
        invoice_number,
        po_number,
        customer_name,
        invoice_amount,
        invoice_date,
        deletion_date,
        deletion_reason,
        deleted_by
    )
    SELECT 
        pi.id,
        pi.invoice_number,
        pi.po_number,
        pi.customer_name,
        pi.total_amount,
        pi.invoice_date,
        NOW(),
        'PO permanently deleted - invoices automatically removed',
        'System Trigger'
    FROM po_invoices pi 
    WHERE pi.po_number = OLD.po_number;
    
    -- Delete related PO invoice items first (foreign key constraint)
    DELETE pii FROM po_invoice_items pii
    INNER JOIN po_invoices pi ON pii.po_invoice_id = pi.id
    WHERE pi.po_number = OLD.po_number;
    
    -- Delete PO invoices
    DELETE FROM po_invoices WHERE po_number = OLD.po_number;
    
    -- Clear PO invoice summary
    DELETE FROM po_invoice_summary WHERE po_number = OLD.po_number;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_po_status_change_cleanup` AFTER UPDATE ON `purchase_orders` FOR EACH ROW BEGIN
    -- Check if PO is being cancelled (new status is Cancelled and old status was not Cancelled)
    IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
        -- Create deletion history records for all related invoices
        INSERT INTO po_deletion_history (
            po_invoice_id,
            invoice_number,
            po_number,
            customer_name,
            invoice_amount,
            invoice_date,
            deletion_date,
            deletion_reason,
            deleted_by
        )
        SELECT 
            pi.id,
            pi.invoice_number,
            pi.po_number,
            pi.customer_name,
            pi.total_amount,
            pi.invoice_date,
            NOW(),
            'PO cancelled - invoices automatically removed',
            'System Trigger'
        FROM po_invoices pi 
        WHERE pi.po_number = NEW.po_number;
        
        -- Delete related PO invoice items first (foreign key constraint)
        DELETE pii FROM po_invoice_items pii
        INNER JOIN po_invoices pi ON pii.po_invoice_id = pi.id
        WHERE pi.po_number = NEW.po_number;
        
        -- Delete PO invoices
        DELETE FROM po_invoices WHERE po_number = NEW.po_number;
        
        -- Clear or delete PO invoice summary
        DELETE FROM po_invoice_summary WHERE po_number = NEW.po_number;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_sync_payment_days_on_po_update` AFTER UPDATE ON `purchase_orders` FOR EACH ROW BEGIN
    -- Only update if payment_days has changed
    IF OLD.payment_days != NEW.payment_days THEN
        -- Update all related po_invoices with the new payment_days
        UPDATE arauf_crm.po_invoices
        SET payment_days = NEW.payment_days,
            updated_at = CURRENT_TIMESTAMP
        WHERE po_id = NEW.id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_sync_po_total_on_update` AFTER UPDATE ON `purchase_orders` FOR EACH ROW BEGIN
    -- Update the summary table when PO total amount changes
    UPDATE `po_invoice_summary` 
    SET 
        po_total_amount = NEW.total_amount,
        remaining_amount = NEW.total_amount - total_invoiced_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE po_number = NEW.po_number;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `id` int(11) NOT NULL,
  `purchase_order_id` int(11) DEFAULT NULL,
  `item_no` int(11) NOT NULL,
  `description` text NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `net_weight` decimal(10,2) DEFAULT NULL COMMENT 'Net weight in KG',
  `unit_price` decimal(15,2) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reporttable`
--

CREATE TABLE `reporttable` (
  `id` varchar(11) NOT NULL,
  `date` varchar(255) NOT NULL,
  `customer` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'Administrator with full access', '2026-01-24 20:34:34', '2026-01-24 20:34:34'),
(2, 'PA', 'Personal Assistant', '2026-01-24 21:05:51', '2026-01-24 21:05:51');

-- --------------------------------------------------------

--
-- Table structure for table `role_modules`
--

CREATE TABLE `role_modules` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `module` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_modules`
--

INSERT INTO `role_modules` (`id`, `role_id`, `module`, `created_at`, `updated_at`) VALUES
(1, 1, 'dashboard', '2026-01-24 20:34:34', '2026-01-24 20:34:34'),
(2, 1, 'invoices', '2026-01-24 20:34:34', '2026-01-24 20:34:34'),
(3, 1, 'customers', '2026-01-24 20:34:34', '2026-01-24 20:34:34'),
(4, 1, 'expenses', '2026-01-24 20:34:34', '2026-01-24 20:34:34'),
(5, 1, 'purchaseOrders', '2026-01-24 20:34:34', '2026-01-24 20:34:34'),
(6, 1, 'stock', '2026-01-24 20:34:34', '2026-01-24 20:34:34'),
(7, 1, 'financialProgress', '2026-01-24 20:34:35', '2026-01-24 20:34:35'),
(8, 1, 'settings', '2026-01-24 20:34:35', '2026-01-24 20:34:35'),
(9, 2, 'invoices', '2026-01-24 21:06:10', '2026-01-24 21:06:10'),
(10, 2, 'purchaseOrders', '2026-01-24 21:06:11', '2026-01-24 21:06:11'),
(11, 2, 'stock', '2026-01-24 21:06:11', '2026-01-24 21:06:11'),
(12, 2, 'customers', '2026-01-24 21:06:11', '2026-01-24 21:06:11');

-- --------------------------------------------------------

--
-- Table structure for table `stock`
--

CREATE TABLE `stock` (
  `id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(50) DEFAULT 'KG',
  `price_per_unit` decimal(10,2) DEFAULT 0.00,
  `supplier_name` varchar(255) DEFAULT NULL,
  `supplier_email` varchar(255) DEFAULT NULL,
  `supplier_phone` varchar(20) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('Active','Inactive','Low Stock','Discontinued') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction_journal`
--

CREATE TABLE `transaction_journal` (
  `id` int(11) NOT NULL,
  `journal_number` varchar(50) NOT NULL,
  `journal_date` date NOT NULL,
  `description` text NOT NULL,
  `total_debit` decimal(15,2) DEFAULT 0.00,
  `total_credit` decimal(15,2) DEFAULT 0.00,
  `status` enum('Draft','Posted','Reversed') DEFAULT 'Draft',
  `posted_by` int(11) DEFAULT NULL,
  `posted_date` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transaction_journal_entries`
--

CREATE TABLE `transaction_journal_entries` (
  `id` int(11) NOT NULL,
  `journal_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `line_item_number` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `debit_amount` decimal(15,2) DEFAULT 0.00,
  `credit_amount` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `firstName` text NOT NULL,
  `lastName` text NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `firstName`, `lastName`, `email`, `password`, `role_id`, `phone`, `created_at`, `updated_at`) VALUES
(1, 'System', 'Admin', 'admin@arauf.com', 'admin@123', 1, '0000000000', '2026-01-24 20:34:34', '2026-01-24 20:34:34'),
(2, 'Shameel', 'Arif', 'sasmshameel@gmail.com', 'admin@123', 2, 'admin@arauf.com', '2026-01-24 21:06:22', '2026-01-24 21:06:22'),
(3, 'Moiz', 'khan', 'moiz@gmail.com', 'karachi123', 1, '03181210257', '2026-02-04 19:29:24', '2026-02-04 19:29:24');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `login_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_settings`
--

CREATE TABLE `user_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL DEFAULT 1,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `profile_picture_url` varchar(255) DEFAULT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `timezone` varchar(50) DEFAULT 'UTC+5',
  `language` varchar(10) DEFAULT 'en',
  `currency_preference` varchar(10) DEFAULT 'PKR',
  `date_format` varchar(20) DEFAULT 'YYYY-MM-DD',
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `email_notifications` tinyint(1) DEFAULT 1,
  `marketing_emails` tinyint(1) DEFAULT 1,
  `theme_preference` varchar(20) DEFAULT 'light',
  `dashboard_layout` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dashboard_layout`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_picture` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_financial_year_summary`
-- (See below for the actual view)
--
CREATE TABLE `vw_financial_year_summary` (
`fy_id` int(11)
,`customer_id` int(11)
,`customer_name` varchar(255)
,`fy_name` varchar(100)
,`start_date` date
,`end_date` date
,`opening_debit` decimal(15,2)
,`opening_credit` decimal(15,2)
,`opening_balance` decimal(15,2)
,`closing_debit` decimal(15,2)
,`closing_credit` decimal(15,2)
,`closing_balance` decimal(15,2)
,`status` enum('open','closed','archived')
,`notes` text
,`entry_count` bigint(21)
,`total_debit` decimal(37,2)
,`total_credit` decimal(37,2)
,`created_at` timestamp
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_ledger_entries_complete`
-- (See below for the actual view)
--
CREATE TABLE `vw_ledger_entries_complete` (
`entry_id` int(11)
,`customer_id` int(11)
,`customer_name` varchar(255)
,`entry_date` date
,`description` varchar(500)
,`bill_no` varchar(100)
,`payment_mode` varchar(50)
,`cheque_no` varchar(100)
,`debit_amount` decimal(15,2)
,`credit_amount` decimal(15,2)
,`balance` decimal(15,2)
,`status` varchar(50)
,`due_date` date
,`has_multiple_items` tinyint(1)
,`sales_tax_rate` decimal(5,2)
,`sales_tax_amount` decimal(15,2)
,`sequence` decimal(10,1)
,`created_at` timestamp
,`updated_at` timestamp
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts_payable`
--
ALTER TABLE `accounts_payable`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_supplier_id` (`supplier_id`),
  ADD KEY `idx_po_id` (`po_id`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_aging_status` (`aging_status`);

--
-- Indexes for table `accounts_receivable`
--
ALTER TABLE `accounts_receivable`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_invoice_id` (`invoice_id`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_aging_status` (`aging_status`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `account_code` (`account_code`),
  ADD UNIQUE KEY `unique_account_code` (`account_code`),
  ADD KEY `idx_account_type` (`account_type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `parent_account_id` (`parent_account_id`);

--
-- Indexes for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customertable`
--
ALTER TABLE `customertable`
  ADD PRIMARY KEY (`customer_id`),
  ADD KEY `idx_customertable_phone` (`phone`),
  ADD KEY `idx_customertable_email` (`email`),
  ADD KEY `idx_customertable_stn_ntn` (`stn`,`ntn`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_expense_category` (`category_id`),
  ADD KEY `idx_expenses_date` (`date`),
  ADD KEY `idx_expenses_category` (`category`);

--
-- Indexes for table `financial_reports`
--
ALTER TABLE `financial_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `report_id` (`report_id`),
  ADD UNIQUE KEY `short_id` (`short_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_generated_at` (`generated_at`),
  ADD KEY `idx_short_id` (`short_id`);

--
-- Indexes for table `financial_report_details`
--
ALTER TABLE `financial_report_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_report_id` (`report_id`),
  ADD KEY `idx_customer_id` (`customer_id`);

--
-- Indexes for table `general_ledger`
--
ALTER TABLE `general_ledger`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_voucher` (`voucher_number`,`voucher_type`),
  ADD KEY `idx_transaction_date` (`transaction_date`),
  ADD KEY `idx_account_id` (`account_id`),
  ADD KEY `idx_voucher_type` (`voucher_type`),
  ADD KEY `idx_reference` (`reference_type`,`reference_id`),
  ADD KEY `posted_by` (`posted_by`);

--
-- Indexes for table `invoice`
--
ALTER TABLE `invoice`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `fk_invoice_customer` (`customer_id`),
  ADD KEY `idx_invoice_status` (`status`),
  ADD KEY `idx_invoice_date` (`bill_date`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_invoice_items_invoice` (`invoice_id`),
  ADD KEY `idx_item_no` (`item_no`);

--
-- Indexes for table `invoice_payments`
--
ALTER TABLE `invoice_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_invoice_payments_invoice` (`invoice_id`),
  ADD KEY `idx_payment_date` (`payment_date`);

--
-- Indexes for table `ledger_entries`
--
ALTER TABLE `ledger_entries`
  ADD PRIMARY KEY (`entry_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_entry_date` (`entry_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `ledger_entry_fy_mapping`
--
ALTER TABLE `ledger_entry_fy_mapping`
  ADD PRIMARY KEY (`mapping_id`),
  ADD UNIQUE KEY `unique_entry_fy` (`entry_id`,`fy_id`),
  ADD KEY `idx_fy_id` (`fy_id`);

--
-- Indexes for table `ledger_financial_years`
--
ALTER TABLE `ledger_financial_years`
  ADD PRIMARY KEY (`fy_id`),
  ADD UNIQUE KEY `unique_fy_period` (`customer_id`,`start_date`,`end_date`),
  ADD KEY `idx_customer_fy` (`customer_id`,`start_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `ledger_fy_closing_balance`
--
ALTER TABLE `ledger_fy_closing_balance`
  ADD PRIMARY KEY (`closing_id`),
  ADD KEY `fy_id` (`fy_id`),
  ADD KEY `idx_customer_fy` (`customer_id`,`fy_id`);

--
-- Indexes for table `ledger_line_items`
--
ALTER TABLE `ledger_line_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_entry_id` (`entry_id`);

--
-- Indexes for table `ledger_single_materials`
--
ALTER TABLE `ledger_single_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_entry_id` (`entry_id`);

--
-- Indexes for table `payment_receipts`
--
ALTER TABLE `payment_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD UNIQUE KEY `unique_receipt` (`receipt_number`),
  ADD KEY `idx_receipt_date` (`receipt_date`),
  ADD KEY `idx_party_id` (`party_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `account_id` (`account_id`),
  ADD KEY `posted_by` (`posted_by`);

--
-- Indexes for table `po_deletion_history`
--
ALTER TABLE `po_deletion_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_po_number` (`po_number`),
  ADD KEY `idx_deletion_date` (`deletion_date`),
  ADD KEY `idx_po_invoice_id` (`po_invoice_id`);

--
-- Indexes for table `po_invoices`
--
ALTER TABLE `po_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `idx_po_number` (`po_number`),
  ADD KEY `idx_invoice_date` (`invoice_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_customer_name` (`customer_name`),
  ADD KEY `idx_po_invoices_po_number` (`po_number`),
  ADD KEY `idx_po_invoices_status` (`status`),
  ADD KEY `idx_po_invoices_invoice_date` (`invoice_date`);

--
-- Indexes for table `po_invoice_items`
--
ALTER TABLE `po_invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_po_invoice_id` (`po_invoice_id`),
  ADD KEY `idx_po_item_id` (`po_item_id`),
  ADD KEY `idx_po_invoice_items_net_weight` (`net_weight`);

--
-- Indexes for table `po_invoice_summary`
--
ALTER TABLE `po_invoice_summary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_po_number` (`po_number`),
  ADD KEY `idx_po_number` (`po_number`),
  ADD KEY `idx_po_invoice_summary_po_number` (`po_number`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `po_number` (`po_number`),
  ADD KEY `idx_po_number` (`po_number`),
  ADD KEY `idx_po_date` (`po_date`),
  ADD KEY `idx_po_status` (`status`);

--
-- Indexes for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_po_items_order_id` (`purchase_order_id`),
  ADD KEY `idx_purchase_order_items_net_weight` (`net_weight`);

--
-- Indexes for table `reporttable`
--
ALTER TABLE `reporttable`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `role_modules`
--
ALTER TABLE `role_modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_role_module` (`role_id`,`module`);

--
-- Indexes for table `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `transaction_journal`
--
ALTER TABLE `transaction_journal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `journal_number` (`journal_number`),
  ADD UNIQUE KEY `unique_journal` (`journal_number`),
  ADD KEY `idx_journal_date` (`journal_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `posted_by` (`posted_by`);

--
-- Indexes for table `transaction_journal_entries`
--
ALTER TABLE `transaction_journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_journal_id` (`journal_id`),
  ADD KEY `idx_account_id` (`account_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_session_token` (`session_token`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_user_settings_user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_settings`
--
ALTER TABLE `company_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customertable`
--
ALTER TABLE `customertable`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_reports`
--
ALTER TABLE `financial_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_report_details`
--
ALTER TABLE `financial_report_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice`
--
ALTER TABLE `invoice`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_payments`
--
ALTER TABLE `invoice_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ledger_entries`
--
ALTER TABLE `ledger_entries`
  MODIFY `entry_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ledger_entry_fy_mapping`
--
ALTER TABLE `ledger_entry_fy_mapping`
  MODIFY `mapping_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ledger_financial_years`
--
ALTER TABLE `ledger_financial_years`
  MODIFY `fy_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ledger_fy_closing_balance`
--
ALTER TABLE `ledger_fy_closing_balance`
  MODIFY `closing_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ledger_line_items`
--
ALTER TABLE `ledger_line_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ledger_single_materials`
--
ALTER TABLE `ledger_single_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `po_deletion_history`
--
ALTER TABLE `po_deletion_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `po_invoices`
--
ALTER TABLE `po_invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `po_invoice_items`
--
ALTER TABLE `po_invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `po_invoice_summary`
--
ALTER TABLE `po_invoice_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `role_modules`
--
ALTER TABLE `role_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `stock`
--
ALTER TABLE `stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_settings`
--
ALTER TABLE `user_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `po_complete_history`
--
DROP TABLE IF EXISTS `po_complete_history`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_arauf_crm`@`127.0.0.1` SQL SECURITY DEFINER VIEW `po_complete_history`  AS SELECT `po`.`po_number` AS `po_number`, `po`.`po_date` AS `po_date`, `po`.`supplier_name` AS `supplier_name`, `po`.`total_amount` AS `po_total_amount`, `po`.`status` AS `po_status`, `pi`.`id` AS `invoice_id`, `pi`.`invoice_number` AS `invoice_number`, `pi`.`invoice_date` AS `invoice_date`, `pi`.`due_date` AS `due_date`, `pi`.`total_amount` AS `invoice_amount`, `pi`.`status` AS `invoice_status`, `pi`.`payment_date` AS `payment_date`, `pi`.`payment_method` AS `payment_method`, `pi`.`customer_name` AS `customer_name`, `pi`.`notes` AS `invoice_notes`, `ps`.`total_invoiced_amount` AS `total_invoiced_amount`, `ps`.`remaining_amount` AS `remaining_amount`, `ps`.`invoice_count` AS `invoice_count`, `ps`.`last_invoice_date` AS `last_invoice_date`, CASE WHEN `ps`.`total_invoiced_amount` >= `po`.`total_amount` THEN 'Fully Invoiced' WHEN `ps`.`total_invoiced_amount` > 0 THEN 'Partially Invoiced' ELSE 'Not Invoiced' END AS `invoicing_status`, round(`ps`.`total_invoiced_amount` / `po`.`total_amount` * 100,2) AS `invoicing_percentage`, `pi`.`created_at` AS `invoice_created_at` FROM ((`purchase_orders` `po` left join `po_invoices` `pi` on(`po`.`po_number` = `pi`.`po_number`)) left join `po_invoice_summary` `ps` on(`po`.`po_number` = `ps`.`po_number`)) ORDER BY `po`.`po_date` DESC, `pi`.`invoice_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `po_complete_summary`
--
DROP TABLE IF EXISTS `po_complete_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_arauf_crm`@`127.0.0.1` SQL SECURITY DEFINER VIEW `po_complete_summary`  AS SELECT `po`.`id` AS `po_id`, `po`.`po_number` AS `po_number`, `po`.`supplier_name` AS `supplier_name`, `po`.`total_amount` AS `po_total_amount`, `po`.`status` AS `po_status`, coalesce(sum(case when `pi`.`invoicing_mode` = 'amount' then `pi`.`total_amount` else 0 end),0) AS `amount_invoiced`, `po`.`total_amount`- coalesce(sum(case when `pi`.`invoicing_mode` = 'amount' then `pi`.`total_amount` else 0 end),0) AS `amount_remaining`, count(case when `pi`.`invoicing_mode` = 'amount' then `pi`.`id` end) AS `amount_invoice_count`, coalesce(sum(`poi`.`quantity`),0) AS `po_total_quantity`, coalesce(sum(case when `pi`.`invoicing_mode` in ('quantity','mixed') then `pi`.`invoiced_quantity` else 0 end),0) AS `quantity_invoiced`, coalesce(sum(`poi`.`quantity`),0) - coalesce(sum(case when `pi`.`invoicing_mode` in ('quantity','mixed') then `pi`.`invoiced_quantity` else 0 end),0) AS `quantity_remaining`, count(case when `pi`.`invoicing_mode` in ('quantity','mixed') then `pi`.`id` end) AS `quantity_invoice_count`, CASE WHEN count(distinct `pi`.`invoicing_mode`) > 1 THEN 'Mixed Invoicing' WHEN count(case when `pi`.`invoicing_mode` = 'amount' then 1 end) > 0 THEN 'Amount Based' WHEN count(case when `pi`.`invoicing_mode` in ('quantity','mixed') then 1 end) > 0 THEN 'Quantity Based' ELSE 'Not Invoiced' END AS `invoicing_type` FROM ((`purchase_orders` `po` left join `purchase_order_items` `poi` on(`po`.`id` = `poi`.`purchase_order_id`)) left join `po_invoices` `pi` on(`po`.`id` = `pi`.`po_id`)) GROUP BY `po`.`id`, `po`.`po_number`, `po`.`supplier_name`, `po`.`total_amount`, `po`.`status` ;

-- --------------------------------------------------------

--
-- Structure for view `po_deletion_summary`
--
DROP TABLE IF EXISTS `po_deletion_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_arauf_crm`@`127.0.0.1` SQL SECURITY DEFINER VIEW `po_deletion_summary`  AS SELECT `pdh`.`id` AS `id`, `pdh`.`po_invoice_id` AS `po_invoice_id`, `pdh`.`invoice_number` AS `invoice_number`, `pdh`.`po_number` AS `po_number`, `pdh`.`customer_name` AS `customer_name`, `pdh`.`invoice_amount` AS `invoice_amount`, `pdh`.`invoice_date` AS `invoice_date`, `pdh`.`deletion_date` AS `deletion_date`, `pdh`.`deletion_reason` AS `deletion_reason`, `pdh`.`deleted_by` AS `deleted_by`, `pdh`.`notes` AS `notes`, `pdh`.`created_at` AS `created_at`, `pis`.`po_total_amount` AS `po_total_amount`, `pis`.`total_invoiced_amount` AS `total_invoiced_amount`, `pis`.`remaining_amount` AS `remaining_amount`, `pis`.`invoice_count` AS `invoice_count`, CASE WHEN `pis`.`invoice_count` > 0 THEN 'Has Invoices' ELSE 'No Invoices' END AS `current_status` FROM (`po_deletion_history` `pdh` left join `po_invoice_summary` `pis` on(`pdh`.`po_number` = `pis`.`po_number`)) ORDER BY `pdh`.`deletion_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `po_invoice_history`
--
DROP TABLE IF EXISTS `po_invoice_history`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_arauf_crm`@`127.0.0.1` SQL SECURITY DEFINER VIEW `po_invoice_history`  AS SELECT `pi`.`id` AS `id`, `pi`.`invoice_number` AS `invoice_number`, `pi`.`invoice_date` AS `invoice_date`, `pi`.`due_date` AS `due_date`, `pi`.`po_number` AS `po_number`, `pi`.`customer_name` AS `customer_name`, `pi`.`total_amount` AS `invoice_amount`, `pi`.`status` AS `status`, `pi`.`notes` AS `notes`, `ps`.`po_total_amount` AS `po_total_amount`, `ps`.`total_invoiced_amount` AS `total_invoiced_amount`, `ps`.`remaining_amount` AS `remaining_amount`, `ps`.`invoice_count` AS `invoice_count`, `pi`.`created_at` AS `created_at` FROM (`po_invoices` `pi` left join `po_invoice_summary` `ps` on(`pi`.`po_number` = `ps`.`po_number`)) ORDER BY `pi`.`created_at` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `po_item_quantity_tracking`
--
DROP TABLE IF EXISTS `po_item_quantity_tracking`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_arauf_crm`@`127.0.0.1` SQL SECURITY DEFINER VIEW `po_item_quantity_tracking`  AS SELECT `poi`.`id` AS `po_item_id`, `poi`.`purchase_order_id` AS `po_id`, `po`.`po_number` AS `po_number`, `poi`.`item_no` AS `item_no`, `poi`.`description` AS `description`, `poi`.`quantity` AS `po_quantity`, `poi`.`unit` AS `unit`, `poi`.`unit_price` AS `unit_price`, `poi`.`amount` AS `po_amount`, coalesce(sum(`pii`.`invoiced_quantity`),0) AS `total_invoiced_quantity`, `poi`.`quantity`- coalesce(sum(`pii`.`invoiced_quantity`),0) AS `remaining_quantity`, CASE WHEN `poi`.`quantity` > 0 THEN coalesce(sum(`pii`.`invoiced_quantity`),0) / `poi`.`quantity` * 100 ELSE 0 END AS `item_invoicing_percentage`, CASE WHEN coalesce(sum(`pii`.`invoiced_quantity`),0) = 0 THEN 'Not Invoiced' WHEN `poi`.`quantity` - coalesce(sum(`pii`.`invoiced_quantity`),0) <= 0 THEN 'Fully Invoiced' ELSE 'Partially Invoiced' END AS `item_status`, count(`pii`.`id`) AS `invoice_count` FROM ((`purchase_order_items` `poi` left join `purchase_orders` `po` on(`poi`.`purchase_order_id` = `po`.`id`)) left join `po_invoice_items` `pii` on(`poi`.`id` = `pii`.`po_item_id`)) GROUP BY `poi`.`id`, `poi`.`purchase_order_id`, `po`.`po_number`, `poi`.`item_no`, `poi`.`description`, `poi`.`quantity`, `poi`.`unit`, `poi`.`unit_price`, `poi`.`amount` ;

-- --------------------------------------------------------

--
-- Structure for view `po_quantity_summary`
--
DROP TABLE IF EXISTS `po_quantity_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_arauf_crm`@`127.0.0.1` SQL SECURITY DEFINER VIEW `po_quantity_summary`  AS SELECT `po`.`id` AS `po_id`, `po`.`po_number` AS `po_number`, `po`.`supplier_name` AS `supplier_name`, `po`.`status` AS `po_status`, coalesce(sum(`poi`.`quantity`),0) AS `po_total_quantity`, coalesce(sum(case when `pi`.`invoicing_mode` in ('quantity','mixed') then `pi`.`invoiced_quantity` else 0 end),0) AS `total_invoiced_quantity`, coalesce(sum(`poi`.`quantity`),0) - coalesce(sum(case when `pi`.`invoicing_mode` in ('quantity','mixed') then `pi`.`invoiced_quantity` else 0 end),0) AS `remaining_quantity`, CASE WHEN coalesce(sum(`poi`.`quantity`),0) > 0 THEN coalesce(sum(case when `pi`.`invoicing_mode` in ('quantity','mixed') then `pi`.`invoiced_quantity` else 0 end),0) / sum(`poi`.`quantity`) * 100 ELSE 0 END AS `quantity_invoicing_percentage`, count(case when `pi`.`invoicing_mode` in ('quantity','mixed') then `pi`.`id` end) AS `quantity_invoice_count`, CASE WHEN coalesce(sum(`poi`.`quantity`),0) = 0 THEN 'No Items' WHEN coalesce(sum(case when `pi`.`invoicing_mode` in ('quantity','mixed') then `pi`.`invoiced_quantity` else 0 end),0) = 0 THEN 'Not Invoiced' WHEN coalesce(sum(`poi`.`quantity`),0) - coalesce(sum(case when `pi`.`invoicing_mode` in ('quantity','mixed') then `pi`.`invoiced_quantity` else 0 end),0) <= 0 THEN 'Fully Invoiced' ELSE 'Partially Invoiced' END AS `quantity_status` FROM ((`purchase_orders` `po` left join `purchase_order_items` `poi` on(`po`.`id` = `poi`.`purchase_order_id`)) left join `po_invoices` `pi` on(`po`.`id` = `pi`.`po_id`)) GROUP BY `po`.`id`, `po`.`po_number`, `po`.`supplier_name`, `po`.`status` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_financial_year_summary`
--
DROP TABLE IF EXISTS `vw_financial_year_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_arauf_crm`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_financial_year_summary`  AS SELECT `lfy`.`fy_id` AS `fy_id`, `lfy`.`customer_id` AS `customer_id`, `c`.`customer` AS `customer_name`, `lfy`.`fy_name` AS `fy_name`, `lfy`.`start_date` AS `start_date`, `lfy`.`end_date` AS `end_date`, `lfy`.`opening_debit` AS `opening_debit`, `lfy`.`opening_credit` AS `opening_credit`, `lfy`.`opening_balance` AS `opening_balance`, `lfy`.`closing_debit` AS `closing_debit`, `lfy`.`closing_credit` AS `closing_credit`, `lfy`.`closing_balance` AS `closing_balance`, `lfy`.`status` AS `status`, `lfy`.`notes` AS `notes`, (select count(0) from `ledger_entry_fy_mapping` where `ledger_entry_fy_mapping`.`fy_id` = `lfy`.`fy_id`) AS `entry_count`, (select coalesce(sum(`le`.`debit_amount`),0) from (`ledger_entries` `le` join `ledger_entry_fy_mapping` `lfm` on(`le`.`entry_id` = `lfm`.`entry_id`)) where `lfm`.`fy_id` = `lfy`.`fy_id` and `le`.`entry_date` between `lfy`.`start_date` and `lfy`.`end_date`) AS `total_debit`, (select coalesce(sum(`le`.`credit_amount`),0) from (`ledger_entries` `le` join `ledger_entry_fy_mapping` `lfm` on(`le`.`entry_id` = `lfm`.`entry_id`)) where `lfm`.`fy_id` = `lfy`.`fy_id` and `le`.`entry_date` between `lfy`.`start_date` and `lfy`.`end_date`) AS `total_credit`, `lfy`.`created_at` AS `created_at`, `lfy`.`updated_at` AS `updated_at` FROM (`ledger_financial_years` `lfy` left join `customertable` `c` on(`lfy`.`customer_id` = `c`.`customer_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_ledger_entries_complete`
--
DROP TABLE IF EXISTS `vw_ledger_entries_complete`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u115615899_arauf_crm`@`127.0.0.1` SQL SECURITY DEFINER VIEW `vw_ledger_entries_complete`  AS SELECT `le`.`entry_id` AS `entry_id`, `le`.`customer_id` AS `customer_id`, `ct`.`customer` AS `customer_name`, `le`.`entry_date` AS `entry_date`, `le`.`description` AS `description`, `le`.`bill_no` AS `bill_no`, `le`.`payment_mode` AS `payment_mode`, `le`.`cheque_no` AS `cheque_no`, `le`.`debit_amount` AS `debit_amount`, `le`.`credit_amount` AS `credit_amount`, `le`.`balance` AS `balance`, `le`.`status` AS `status`, `le`.`due_date` AS `due_date`, `le`.`has_multiple_items` AS `has_multiple_items`, `le`.`sales_tax_rate` AS `sales_tax_rate`, `le`.`sales_tax_amount` AS `sales_tax_amount`, `le`.`sequence` AS `sequence`, `le`.`created_at` AS `created_at`, `le`.`updated_at` AS `updated_at` FROM (`ledger_entries` `le` left join `customertable` `ct` on(`le`.`customer_id` = `ct`.`customer_id`)) ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts_payable`
--
ALTER TABLE `accounts_payable`
  ADD CONSTRAINT `accounts_payable_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `accounts_receivable`
--
ALTER TABLE `accounts_receivable`
  ADD CONSTRAINT `accounts_receivable_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customertable` (`customer_id`),
  ADD CONSTRAINT `accounts_receivable_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoice` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  ADD CONSTRAINT `chart_of_accounts_ibfk_1` FOREIGN KEY (`parent_account_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `fk_expense_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `financial_report_details`
--
ALTER TABLE `financial_report_details`
  ADD CONSTRAINT `financial_report_details_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `financial_reports` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `general_ledger`
--
ALTER TABLE `general_ledger`
  ADD CONSTRAINT `general_ledger_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  ADD CONSTRAINT `general_ledger_ibfk_2` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice`
--
ALTER TABLE `invoice`
  ADD CONSTRAINT `fk_invoice_customer` FOREIGN KEY (`customer_id`) REFERENCES `customertable` (`customer_id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoice` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoice_payments`
--
ALTER TABLE `invoice_payments`
  ADD CONSTRAINT `fk_invoice_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoice` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ledger_entries`
--
ALTER TABLE `ledger_entries`
  ADD CONSTRAINT `fk_ledger_entries_customer` FOREIGN KEY (`customer_id`) REFERENCES `customertable` (`customer_id`) ON DELETE CASCADE;

--
-- Constraints for table `ledger_entry_fy_mapping`
--
ALTER TABLE `ledger_entry_fy_mapping`
  ADD CONSTRAINT `ledger_entry_fy_mapping_ibfk_1` FOREIGN KEY (`entry_id`) REFERENCES `ledger_entries` (`entry_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ledger_entry_fy_mapping_ibfk_2` FOREIGN KEY (`fy_id`) REFERENCES `ledger_financial_years` (`fy_id`) ON DELETE CASCADE;

--
-- Constraints for table `ledger_financial_years`
--
ALTER TABLE `ledger_financial_years`
  ADD CONSTRAINT `ledger_financial_years_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customertable` (`customer_id`) ON DELETE CASCADE;

--
-- Constraints for table `ledger_fy_closing_balance`
--
ALTER TABLE `ledger_fy_closing_balance`
  ADD CONSTRAINT `ledger_fy_closing_balance_ibfk_1` FOREIGN KEY (`fy_id`) REFERENCES `ledger_financial_years` (`fy_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ledger_fy_closing_balance_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customertable` (`customer_id`) ON DELETE CASCADE;

--
-- Constraints for table `ledger_line_items`
--
ALTER TABLE `ledger_line_items`
  ADD CONSTRAINT `fk_ledger_line_items_entry` FOREIGN KEY (`entry_id`) REFERENCES `ledger_entries` (`entry_id`) ON DELETE CASCADE;

--
-- Constraints for table `ledger_single_materials`
--
ALTER TABLE `ledger_single_materials`
  ADD CONSTRAINT `fk_ledger_single_materials_entry` FOREIGN KEY (`entry_id`) REFERENCES `ledger_entries` (`entry_id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_receipts`
--
ALTER TABLE `payment_receipts`
  ADD CONSTRAINT `payment_receipts_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payment_receipts_ibfk_2` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `po_invoice_items`
--
ALTER TABLE `po_invoice_items`
  ADD CONSTRAINT `po_invoice_items_ibfk_1` FOREIGN KEY (`po_invoice_id`) REFERENCES `po_invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `po_invoice_items_ibfk_2` FOREIGN KEY (`po_item_id`) REFERENCES `purchase_order_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_modules`
--
ALTER TABLE `role_modules`
  ADD CONSTRAINT `role_modules_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transaction_journal`
--
ALTER TABLE `transaction_journal`
  ADD CONSTRAINT `transaction_journal_ibfk_1` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `transaction_journal_entries`
--
ALTER TABLE `transaction_journal_entries`
  ADD CONSTRAINT `transaction_journal_entries_ibfk_1` FOREIGN KEY (`journal_id`) REFERENCES `transaction_journal` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_journal_entries_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_settings` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
