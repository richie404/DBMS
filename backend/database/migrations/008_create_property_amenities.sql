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
