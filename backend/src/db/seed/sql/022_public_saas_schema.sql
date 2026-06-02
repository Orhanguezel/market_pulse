-- ============================================================================
-- 022 — Public SaaS: user_plans + user_scan_usage
-- Plan codes: free (5/day) · starter (30/day) · pro (unlimited) · agency (unlimited)
-- ============================================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_plans (
  id          CHAR(36)       NOT NULL,
  tenant_key  VARCHAR(64)    NOT NULL DEFAULT 'avrasya',
  user_id     CHAR(36)       NOT NULL,
  plan_code   ENUM('free','starter','pro','agency') NOT NULL DEFAULT 'free',
  started_at  DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at  DATETIME(3)    DEFAULT NULL,
  is_active   TINYINT(1)     NOT NULL DEFAULT 1,
  created_at  DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_user_plans_tenant (tenant_key),
  KEY idx_user_plans_user_id (user_id),
  KEY idx_user_plans_active (is_active),
  CONSTRAINT fk_user_plans_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_scan_usage (
  id          CHAR(36)   NOT NULL,
  tenant_key  VARCHAR(64) NOT NULL DEFAULT 'avrasya',
  user_id     CHAR(36)   NOT NULL,
  scan_date   DATE       NOT NULL,
  scan_count  INT        NOT NULL DEFAULT 0,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_scan_usage (tenant_key, user_id, scan_date),
  KEY idx_user_scan_usage_tenant (tenant_key),
  KEY idx_user_scan_usage_user (user_id),
  CONSTRAINT fk_user_scan_usage_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
