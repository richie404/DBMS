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
