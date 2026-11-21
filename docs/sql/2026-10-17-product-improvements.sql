-- Apply once to the pre-2026-10-17 MySQL schema, after a backup.
-- This file is prepared for review; it is NOT run automatically.
ALTER TABLE diary_entries MODIFY COLUMN rating INT NULL,
  MODIFY COLUMN photo_urls LONGTEXT NULL,
  ADD COLUMN has_spoiler BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN share_token VARCHAR(36) NULL,
  ADD UNIQUE KEY uk_diary_share_token (share_token);
ALTER TABLE users ADD COLUMN deactivated BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE viewing_plans (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL, show_id BIGINT NOT NULL,
  watched_date DATE NOT NULL, watched_time TIME(6) NULL,
  seat_info VARCHAR(100), memo VARCHAR(500), reminder BOOLEAN NOT NULL DEFAULT FALSE,
  diary_id BIGINT NULL, created_at DATETIME(6), updated_at DATETIME(6),
  INDEX idx_viewing_plan_user_date (user_id, watched_date),
  CONSTRAINT fk_viewing_plan_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_viewing_plan_show FOREIGN KEY (show_id) REFERENCES shows(id)
);
CREATE TABLE notification_preferences (
  user_id BIGINT NOT NULL PRIMARY KEY,
  plans BOOLEAN NOT NULL DEFAULT FALSE, favorites BOOLEAN NOT NULL DEFAULT FALSE,
  replies BOOLEAN NOT NULL DEFAULT FALSE, monthly BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE notifications (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL,
  event_key VARCHAR(120) NOT NULL, title VARCHAR(300) NOT NULL, path VARCHAR(200) NOT NULL,
  seen BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME(6), updated_at DATETIME(6),
  UNIQUE KEY uk_notification_event (user_id, event_key),
  INDEX idx_notification_user_created (user_id, created_at)
);
CREATE TABLE user_blocks (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL, blocked_user_id BIGINT NOT NULL,
  UNIQUE KEY uk_user_block (user_id, blocked_user_id)
);
CREATE TABLE content_reports (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, reporter_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL, target_type VARCHAR(20) NOT NULL, target_id BIGINT NOT NULL,
  reason VARCHAR(500) NOT NULL, evidence VARCHAR(2000) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN', created_at DATETIME(6), updated_at DATETIME(6),
  INDEX idx_report_status (status, created_at)
);
CREATE TABLE product_events (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(40) NOT NULL,
  session_id VARCHAR(36) NOT NULL, user_id BIGINT NULL, show_id BIGINT NULL,
  created_at DATETIME(6), updated_at DATETIME(6),
  INDEX idx_event_session_created (session_id, created_at),
  INDEX idx_event_name_created (name, created_at)
);
