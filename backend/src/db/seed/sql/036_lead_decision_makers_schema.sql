-- =============================================================
-- 036 — Karar Verici Bulma sonuçları (kalıcı, tenant-scoped, dedup'lı)
-- /lead-machine/decision-makers/find sonuçları buraya UPSERT edilir;
-- sayfa yenilense de kalır, tekrar aramada birikir (A'lar çoğalır).
-- =============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `lead_decision_makers` (
  `id`                   char(36)     NOT NULL,
  `tenant_key`           varchar(64)  NOT NULL,
  `company_name`         varchar(255) NOT NULL,
  `city`                 varchar(120) DEFAULT NULL,
  `business_type`        varchar(120) DEFAULT NULL,
  `decision_maker_name`  varchar(255) DEFAULT NULL,
  `title`                varchar(255) DEFAULT NULL,
  `linkedin_profile_url` varchar(500) DEFAULT NULL,
  `company_website`      varchar(500) DEFAULT NULL,
  `social_url`           varchar(500) DEFAULT NULL,
  `source_url`           text         DEFAULT NULL,
  `fit_note`             varchar(500) DEFAULT NULL,
  `confidence_score`     enum('A','B','C') NOT NULL DEFAULT 'C',
  `sector`               varchar(64)  DEFAULT NULL,
  `last_verified_at`     date         DEFAULT NULL,
  `created_at`           datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ldm_tenant_company_city` (`tenant_key`, `company_name`, `city`),
  KEY `idx_ldm_tenant` (`tenant_key`),
  KEY `idx_ldm_conf` (`confidence_score`),
  KEY `idx_ldm_sector` (`sector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
