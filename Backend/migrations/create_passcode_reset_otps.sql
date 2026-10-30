-- Store short-lived, hashed email verification codes for passcode resets.
-- Run against the CRM database before deploying the passcode reset code.
-- Example: mysql -u <user> -p <database> < Backend/migrations/create_passcode_reset_otps.sql
CREATE TABLE IF NOT EXISTS `passcode_reset_otps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `passcode_id` int(11) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `last_sent_at` datetime NOT NULL,
  `attempts` tinyint unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_passcode_reset_otp` (`passcode_id`),
  CONSTRAINT `fk_passcode_reset_otp_passcode`
    FOREIGN KEY (`passcode_id`) REFERENCES `user_passcodes` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
