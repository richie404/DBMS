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
