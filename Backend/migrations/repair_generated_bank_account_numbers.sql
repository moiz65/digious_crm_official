-- Repair bank-account values that contain an employee code plus a 13-digit
-- timestamp instead of the account number already stored on employee_onboarding.
-- Run:
--   mysql -u root -p Digious_CRM_DataBase < Backend/migrations/repair_generated_bank_account_numbers.sql

UPDATE employee_bank_accounts ba
JOIN employee_onboarding eo ON eo.id = ba.employee_id
SET ba.account_number = eo.bank_account
WHERE ba.is_primary = 1
  AND eo.bank_account IS NOT NULL
  AND TRIM(eo.bank_account) <> ''
  AND LEFT(ba.account_number, CHAR_LENGTH(eo.employee_id) + 1) =
      CONCAT(eo.employee_id, '-')
  AND CHAR_LENGTH(ba.account_number) = CHAR_LENGTH(eo.employee_id) + 14
  AND SUBSTRING(ba.account_number, CHAR_LENGTH(eo.employee_id) + 2)
      REGEXP '^[0-9]{13}$';
