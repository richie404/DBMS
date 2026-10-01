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
