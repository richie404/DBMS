CREATE TABLE platform_settings (
  id TINYINT UNSIGNED NOT NULL,
  platform_name VARCHAR(100) NOT NULL DEFAULT 'RentNest',
  support_email VARCHAR(254) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BDT',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Dhaka',
  review_target_hours SMALLINT UNSIGNED NOT NULL DEFAULT 24,
  session_timeout_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_platform_settings_updated_by (updated_by),
  CONSTRAINT chk_platform_settings_single_row CHECK (id = 1),
  CONSTRAINT fk_platform_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_platform_settings_review_target CHECK (review_target_hours > 0),
  CONSTRAINT chk_platform_settings_session_timeout CHECK (session_timeout_minutes > 0),
  CONSTRAINT chk_platform_settings_maintenance CHECK (maintenance_mode IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
