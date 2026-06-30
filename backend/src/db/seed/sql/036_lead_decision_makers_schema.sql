-- =============================================================
-- 036 — Karar Verici Bulma sonuçları (kalıcı, tenant-scoped, dedup'lı)
-- /lead-machine/decision-makers/find sonuçları buraya UPSERT edilir;
-- sayfa yenilense de kalır, tekrar aramada birikir (A'lar çoğalır).
-- =============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `lead_decision_makers` (
  `id`                   char(36)     NOT NULL,
  `tenant_key`           varchar(64)  NOT NULL,
  `job_id`               char(36)     DEFAULT NULL,
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
  `review_status`        enum('pending','verified','rejected','manual_review') NOT NULL DEFAULT 'pending',
  `sector`               varchar(64)  DEFAULT NULL,
  `last_verified_at`     date         DEFAULT NULL,
  `created_at`           datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ldm_tenant_company_city` (`tenant_key`, `company_name`, `city`),
  KEY `idx_ldm_tenant` (`tenant_key`),
  KEY `idx_ldm_job` (`job_id`),
  KEY `idx_ldm_conf` (`confidence_score`),
  KEY `idx_ldm_review` (`review_status`),
  KEY `idx_ldm_sector` (`sector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @add_ldm_job_id := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_decision_makers'
     AND COLUMN_NAME = 'job_id') = 0,
  'ALTER TABLE `lead_decision_makers` ADD COLUMN `job_id` char(36) DEFAULT NULL AFTER `tenant_key`, ADD KEY `idx_ldm_job` (`job_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @add_ldm_job_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mevcut prod tablosuna review_status kolonu (manuel doğrul/reddet aksiyonları) — veri kaybısız.
SET @add_ldm_review := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_decision_makers'
     AND COLUMN_NAME = 'review_status') = 0,
  'ALTER TABLE `lead_decision_makers` ADD COLUMN `review_status` enum(''pending'',''verified'',''rejected'',''manual_review'') NOT NULL DEFAULT ''pending'' AFTER `confidence_score`, ADD KEY `idx_ldm_review` (`review_status`)',
  'SELECT 1'
);
PREPARE stmt FROM @add_ldm_review;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `lead_company_pool` (
  `id`                char(36)     NOT NULL,
  `tenant_key`        varchar(64)  NOT NULL,
  `job_id`            char(36)     DEFAULT NULL,
  `company_name`      varchar(255) NOT NULL,
  `city`              varchar(120) DEFAULT NULL,
  `business_type`     varchar(120) DEFAULT NULL,
  `website`           varchar(500) DEFAULT NULL,
  `phone`             varchar(120) DEFAULT NULL,
  `google_maps_url`   varchar(500) DEFAULT NULL,
  `address`           varchar(500) DEFAULT NULL,
  `quality_score`     int          NOT NULL DEFAULT 0,
  `quality_status`    enum('qualified','possible','manual_review','excluded') NOT NULL DEFAULT 'manual_review',
  `exclude_reason`    varchar(255) DEFAULT NULL,
  `source`            varchar(64)  NOT NULL DEFAULT 'google_places',
  `sector`            varchar(64)  DEFAULT NULL,
  `last_verified_at`  date         DEFAULT NULL,
  `created_at`        datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lcp_tenant_company_city` (`tenant_key`, `company_name`, `city`),
  KEY `idx_lcp_tenant` (`tenant_key`),
  KEY `idx_lcp_job` (`job_id`),
  KEY `idx_lcp_status` (`quality_status`),
  KEY `idx_lcp_sector` (`sector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
