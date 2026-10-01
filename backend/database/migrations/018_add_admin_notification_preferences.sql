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
