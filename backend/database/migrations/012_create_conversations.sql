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
