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
