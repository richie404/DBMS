-- RentNest database for XAMPP / phpMyAdmin
-- Import once into a fresh installation using phpMyAdmin > Import.
-- Creates rentnest_import, matching backend/.env.example.
-- Existing tables are not deleted. This is an initial install, not an upgrade script.
-- Includes the complete schema and reference data; no demo accounts or listings.
-- Optional demo data: from backend, run npm run seed after configuring .env.

CREATE DATABASE IF NOT EXISTS rentnest_import
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rentnest_import;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE schema_migrations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Migration: 001_create_users.sql
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(32) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('renter', 'owner', 'admin') NOT NULL,
  status ENUM('active', 'suspended', 'banned') NOT NULL DEFAULT 'active',
  avatar_url VARCHAR(2048) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role (role),
  KEY idx_users_status (status),
  CONSTRAINT chk_users_role CHECK (role IN ('renter', 'owner', 'admin')),
  CONSTRAINT chk_users_status CHECK (status IN ('active', 'suspended', 'banned'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('001_create_users.sql');


-- Migration: 002_create_sessions.sql
CREATE TABLE sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  device_description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token_hash (token_hash),
  KEY idx_sessions_user_id (user_id),
  KEY idx_sessions_expires_at (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('002_create_sessions.sql');


-- Migration: 003_create_password_reset_tokens.sql
CREATE TABLE password_reset_tokens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reset_tokens_token_hash (token_hash),
  KEY idx_reset_tokens_user_id (user_id),
  KEY idx_reset_tokens_expires_at (expires_at),
  CONSTRAINT fk_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('003_create_password_reset_tokens.sql');


-- Migration: 004_create_user_preferences.sql
CREATE TABLE user_preferences (
  user_id INT UNSIGNED NOT NULL,
  booking_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  message_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  favorite_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_preferences_booking CHECK (booking_notifications IN (0, 1)),
  CONSTRAINT chk_preferences_message CHECK (message_notifications IN (0, 1)),
  CONSTRAINT chk_preferences_favorite CHECK (favorite_notifications IN (0, 1)),
  CONSTRAINT chk_preferences_marketing CHECK (marketing_notifications IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('004_create_user_preferences.sql');


-- Migration: 005_create_properties.sql
CREATE TABLE properties (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NULL,
  description TEXT NULL,
  location VARCHAR(255) NULL,
  property_type ENUM('room', 'studio', 'flat', 'apartment', 'office', 'parking') NOT NULL,
  monthly_rent DECIMAL(12,2) NULL,
  deposit_amount DECIMAL(12,2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BDT',
  size_sqft DECIMAL(10,2) NULL,
  bedrooms SMALLINT UNSIGNED NULL,
  bathrooms SMALLINT UNSIGNED NULL,
  furnished BOOLEAN NOT NULL DEFAULT TRUE,
  bachelor_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  family_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  moderation_status ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  available_from DATE NULL,
  rejection_reason TEXT NULL,
  reviewed_by INT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_properties_owner (owner_id),
  KEY idx_properties_reviewer (reviewed_by),
  KEY idx_properties_type (property_type),
  KEY idx_properties_visibility (moderation_status, is_available, available_from),
  KEY idx_properties_rent (monthly_rent),
  KEY idx_properties_created (created_at),
  CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_properties_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_properties_type CHECK (property_type IN ('room', 'studio', 'flat', 'apartment', 'office', 'parking')),
  CONSTRAINT chk_properties_moderation CHECK (moderation_status IN ('draft', 'pending', 'approved', 'rejected')),
  CONSTRAINT chk_properties_rent CHECK (monthly_rent >= 0),
  CONSTRAINT chk_properties_deposit CHECK (deposit_amount >= 0),
  CONSTRAINT chk_properties_size CHECK (size_sqft >= 0),
  CONSTRAINT chk_properties_furnished CHECK (furnished IN (0, 1)),
  CONSTRAINT chk_properties_bachelor CHECK (bachelor_allowed IN (0, 1)),
  CONSTRAINT chk_properties_family CHECK (family_allowed IN (0, 1)),
  CONSTRAINT chk_properties_available CHECK (is_available IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('005_create_properties.sql');


-- Migration: 006_create_property_images.sql
CREATE TABLE property_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  image_path VARCHAR(2048) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_property_images_order (property_id, sort_order),
  CONSTRAINT fk_property_images_property FOREIGN KEY (property_id) REFERENCES properties (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_property_images_primary CHECK (is_primary IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('006_create_property_images.sql');


-- Migration: 007_create_amenities.sql
CREATE TABLE amenities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_amenities_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('007_create_amenities.sql');


-- Migration: 008_create_property_amenities.sql
CREATE TABLE property_amenities (
  property_id INT UNSIGNED NOT NULL,
  amenity_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (property_id, amenity_id),
  KEY idx_property_amenities_amenity (amenity_id),
  CONSTRAINT fk_property_amenities_property FOREIGN KEY (property_id) REFERENCES properties (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_property_amenities_amenity FOREIGN KEY (amenity_id) REFERENCES amenities (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('008_create_property_amenities.sql');


-- Migration: 009_create_favorites.sql
CREATE TABLE favorites (
  user_id INT UNSIGNED NOT NULL,
  property_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, property_id),
  KEY idx_favorites_property (property_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_favorites_property FOREIGN KEY (property_id) REFERENCES properties (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('009_create_favorites.sql');


-- Migration: 010_create_bookings.sql
CREATE TABLE bookings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_code VARCHAR(50) NULL,
  property_id INT UNSIGNED NOT NULL,
  renter_id INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent_snapshot DECIMAL(12,2) NOT NULL,
  deposit_snapshot DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BDT',
  status ENUM('pending', 'approved', 'confirmed', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  decision_by INT UNSIGNED NULL,
  decision_at DATETIME NULL,
  decision_reason TEXT NULL,
  cancelled_by INT UNSIGNED NULL,
  cancelled_at DATETIME NULL,
  cancellation_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_code (booking_code),
  KEY idx_bookings_property_dates (property_id, start_date, end_date),
  KEY idx_bookings_renter (renter_id),
  KEY idx_bookings_status (status),
  KEY idx_bookings_created (created_at),
  KEY idx_bookings_decision_by (decision_by),
  KEY idx_bookings_cancelled_by (cancelled_by),
  CONSTRAINT fk_bookings_property FOREIGN KEY (property_id) REFERENCES properties (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_bookings_renter FOREIGN KEY (renter_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_bookings_decision_user FOREIGN KEY (decision_by) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_bookings_cancelled_user FOREIGN KEY (cancelled_by) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_bookings_dates CHECK (end_date > start_date),
  CONSTRAINT chk_bookings_rent CHECK (monthly_rent_snapshot >= 0),
  CONSTRAINT chk_bookings_deposit CHECK (deposit_snapshot >= 0),
  CONSTRAINT chk_bookings_total CHECK (total_amount >= 0),
  CONSTRAINT chk_bookings_status CHECK (status IN ('pending', 'approved', 'confirmed', 'rejected', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('010_create_bookings.sql');


-- Migration: 011_create_booking_events.sql
CREATE TABLE booking_events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED NOT NULL,
  actor_id INT UNSIGNED NULL,
  previous_status ENUM('pending', 'approved', 'confirmed', 'rejected', 'cancelled') NULL,
  new_status ENUM('pending', 'approved', 'confirmed', 'rejected', 'cancelled') NOT NULL,
  reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_booking_events_timeline (booking_id, created_at, id),
  KEY idx_booking_events_actor (actor_id),
  CONSTRAINT fk_booking_events_booking FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_booking_events_actor FOREIGN KEY (actor_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_booking_events_previous CHECK (previous_status IN ('pending', 'approved', 'confirmed', 'rejected', 'cancelled')),
  CONSTRAINT chk_booking_events_new CHECK (new_status IN ('pending', 'approved', 'confirmed', 'rejected', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('011_create_booking_events.sql');


-- Migration: 012_create_conversations.sql
CREATE TABLE conversations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  renter_id INT UNSIGNED NOT NULL,
  owner_id INT UNSIGNED NOT NULL,
  disabled_at DATETIME NULL,
  disabled_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_conversations_participants (property_id, renter_id, owner_id),
  KEY idx_conversations_renter_updated (renter_id, updated_at),
  KEY idx_conversations_owner_updated (owner_id, updated_at),
  CONSTRAINT fk_conversations_property FOREIGN KEY (property_id) REFERENCES properties (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_conversations_renter FOREIGN KEY (renter_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_conversations_owner FOREIGN KEY (owner_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('012_create_conversations.sql');


-- Migration: 013_create_messages.sql
CREATE TABLE messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NOT NULL,
  message_text TEXT NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME NULL,
  read_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_messages_timeline (conversation_id, sent_at, id),
  KEY idx_messages_sender (sender_id),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('013_create_messages.sql');


-- Migration: 014_create_notifications.sql
CREATE TABLE notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  category ENUM('booking', 'message', 'listing') NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  property_id INT UNSIGNED NULL,
  booking_id INT UNSIGNED NULL,
  conversation_id INT UNSIGNED NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_recipient_timeline (user_id, created_at, id),
  KEY idx_notifications_recipient_unread (user_id, read_at),
  KEY idx_notifications_category (category),
  KEY idx_notifications_booking (booking_id),
  KEY idx_notifications_conversation (conversation_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_notifications_property FOREIGN KEY (property_id) REFERENCES properties (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_notifications_booking FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_notifications_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_notifications_category CHECK (category IN ('booking', 'message', 'listing'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('014_create_notifications.sql');


-- Migration: 015_create_payments.sql
CREATE TABLE payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference_code VARCHAR(50) NULL,
  booking_id INT UNSIGNED NULL,
  payer_id INT UNSIGNED NULL,
  payee_id INT UNSIGNED NULL,
  record_type ENUM('charge', 'payout', 'refund') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BDT',
  status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  transaction_at DATETIME NULL,
  external_reference VARCHAR(255) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_reference_code (reference_code),
  KEY idx_payments_booking (booking_id),
  KEY idx_payments_payer (payer_id),
  KEY idx_payments_payee (payee_id),
  KEY idx_payments_type_status (record_type, status),
  KEY idx_payments_transaction_at (transaction_at),
  KEY idx_payments_created (created_at),
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_payments_payer FOREIGN KEY (payer_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_payments_payee FOREIGN KEY (payee_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_payments_type CHECK (record_type IN ('charge', 'payout', 'refund')),
  CONSTRAINT chk_payments_amount CHECK (amount >= 0),
  CONSTRAINT chk_payments_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('015_create_payments.sql');


-- Migration: 016_create_activity_logs.sql
CREATE TABLE activity_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id INT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NULL,
  target_id INT UNSIGNED NULL,
  outcome ENUM('success', 'warning', 'failure') NOT NULL DEFAULT 'success',
  description TEXT NULL,
  source_ip VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_logs_actor (actor_id),
  KEY idx_activity_logs_action (action),
  KEY idx_activity_logs_target (target_type, target_id),
  KEY idx_activity_logs_outcome (outcome),
  KEY idx_activity_logs_created (created_at),
  CONSTRAINT fk_activity_logs_actor FOREIGN KEY (actor_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_activity_logs_outcome CHECK (outcome IN ('success', 'warning', 'failure'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (migration_name) VALUES ('016_create_activity_logs.sql');


-- Migration: 017_create_platform_settings.sql
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

INSERT INTO schema_migrations (migration_name) VALUES ('017_create_platform_settings.sql');


-- Migration: 018_add_admin_notification_preferences.sql
ALTER TABLE user_preferences
  ADD COLUMN security_alert_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN moderation_queue_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN payment_incident_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN system_health_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN scheduled_report_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT chk_preferences_security_alert CHECK (security_alert_notifications IN (0, 1)),
  ADD CONSTRAINT chk_preferences_moderation_queue CHECK (moderation_queue_notifications IN (0, 1)),
  ADD CONSTRAINT chk_preferences_payment_incident CHECK (payment_incident_notifications IN (0, 1)),
  ADD CONSTRAINT chk_preferences_system_health CHECK (system_health_notifications IN (0, 1)),
  ADD CONSTRAINT chk_preferences_scheduled_report CHECK (scheduled_report_notifications IN (0, 1));

INSERT INTO schema_migrations (migration_name) VALUES ('018_add_admin_notification_preferences.sql');

-- Reference data used by listing forms and the admin settings page.
INSERT INTO amenities (code, display_name) VALUES
  ('wifi', 'Wi-Fi'),
  ('parking', 'Parking'),
  ('lift', 'Lift'),
  ('generator', 'Generator'),
  ('security', 'Security'),
  ('cctv', 'CCTV'),
  ('air_conditioning', 'Air Conditioning'),
  ('furnished', 'Furnished'),
  ('balcony', 'Balcony'),
  ('gas', 'Gas'),
  ('water_supply', 'Water Supply'),
  ('rooftop_access', 'Rooftop Access');

INSERT INTO platform_settings (id, platform_name, currency, timezone)
VALUES (1, 'RentNest', 'BDT', 'Asia/Dhaka');
