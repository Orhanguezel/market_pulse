-- ============================================================================
-- 023 — BYOK Keepa: user_keepa_keys
-- Stores AES-256-GCM encrypted Keepa API keys per user.
-- KEEPA_ENCRYPTION_KEY env var (32 bytes hex) required.
-- ============================================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_keepa_keys (
  id              CHAR(36)       NOT NULL,
  user_id         CHAR(36)       NOT NULL,
  encrypted_key   TEXT           NOT NULL,
  token_budget    INT            DEFAULT NULL,
  tokens_used     INT            NOT NULL DEFAULT 0,
  last_checked_at DATETIME(3)    DEFAULT NULL,
  created_at      DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_keepa_keys_user (user_id),
  CONSTRAINT fk_user_keepa_keys_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
