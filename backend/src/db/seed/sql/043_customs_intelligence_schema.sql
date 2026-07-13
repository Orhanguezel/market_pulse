-- =============================================================
-- 043 — Tenant bazli kendi firma / rakip gumruk eslestirmeleri
--
-- customs_records global veri goludur. Takip edilen ihracatci tanimlari ise
-- tenant'a aittir; boylece her musteri kendi firmasini ve rakiplerini ayri
-- unvan/alias setleriyle eslestirir.
-- =============================================================

CREATE TABLE IF NOT EXISTS `customs_tracked_entities` (
  `id`          char(36)     NOT NULL,
  `tenant_key`  varchar(64)  NOT NULL,
  `entity_type` enum('own','competitor') NOT NULL,
  `name`        varchar(255) NOT NULL,
  `country`     varchar(100) DEFAULT NULL,
  `is_active`   tinyint(1)   NOT NULL DEFAULT '1',
  `created_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customs_entity_tenant` (`tenant_key`, `entity_type`, `is_active`),
  UNIQUE KEY `uq_customs_entity_name` (`tenant_key`, `entity_type`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customs_entity_aliases` (
  `id`          char(36)     NOT NULL,
  `tenant_key`  varchar(64)  NOT NULL,
  `entity_id`   char(36)     NOT NULL,
  `alias`       varchar(500) NOT NULL,
  `match_type`  enum('exact','prefix') NOT NULL DEFAULT 'exact',
  `created_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customs_tenant_alias` (`tenant_key`, `alias`(191)),
  KEY `idx_customs_alias_entity` (`entity_id`),
  CONSTRAINT `fk_customs_alias_entity`
    FOREIGN KEY (`entity_id`) REFERENCES `customs_tracked_entities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
