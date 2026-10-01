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
