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
