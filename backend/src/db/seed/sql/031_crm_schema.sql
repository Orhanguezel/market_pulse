-- =============================================================
-- 031 — CRM MVP schema
--
-- Tenant-scoped accounts, contacts, pipelines, stages, deals and activities.
-- Lead machine candidates can be converted into CRM records through source_lead_id.
-- ALTER YASAK — degisiklikler bu CREATE TABLE seed'leriyle uygulanir.
-- =============================================================

CREATE TABLE IF NOT EXISTS `crm_accounts` (
  `id`             char(36)      NOT NULL,
  `tenant_key`     varchar(64)   NOT NULL,
  `name`           varchar(255)  NOT NULL,
  `website`        varchar(500)  DEFAULT NULL,
  `country`        varchar(100)  DEFAULT NULL,
  `city`           varchar(100)  DEFAULT NULL,
  `phone`          varchar(100)  DEFAULT NULL,
  `email`          varchar(255)  DEFAULT NULL,
  `industry`       varchar(120)  DEFAULT NULL,
  `source_lead_id` char(36)      DEFAULT NULL,
  `owner_user_id`  char(36)      DEFAULT NULL,
  `status`         enum('active','inactive') NOT NULL DEFAULT 'active',
  `raw_data`       json          DEFAULT NULL,
  `created_at`     datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_accounts_tenant` (`tenant_key`),
  KEY `idx_crm_accounts_owner` (`owner_user_id`),
  KEY `idx_crm_accounts_status` (`status`),
  KEY `idx_crm_accounts_source_lead` (`source_lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_contacts` (
  `id`             char(36)      NOT NULL,
  `tenant_key`     varchar(64)   NOT NULL,
  `account_id`     char(36)      DEFAULT NULL,
  `first_name`     varchar(120)  DEFAULT NULL,
  `last_name`      varchar(120)  DEFAULT NULL,
  `title`          varchar(160)  DEFAULT NULL,
  `email`          varchar(255)  DEFAULT NULL,
  `phone`          varchar(100)  DEFAULT NULL,
  `linkedin_url`   varchar(500)  DEFAULT NULL,
  `source_lead_id` char(36)      DEFAULT NULL,
  `owner_user_id`  char(36)      DEFAULT NULL,
  `created_at`     datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_contacts_tenant` (`tenant_key`),
  KEY `idx_crm_contacts_account` (`account_id`),
  KEY `idx_crm_contacts_owner` (`owner_user_id`),
  KEY `idx_crm_contacts_email` (`email`),
  KEY `idx_crm_contacts_source_lead` (`source_lead_id`),
  CONSTRAINT `fk_crm_contacts_account`
    FOREIGN KEY (`account_id`) REFERENCES `crm_accounts` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_pipelines` (
  `id`         char(36)     NOT NULL,
  `tenant_key` varchar(64)  NOT NULL,
  `name`       varchar(120) NOT NULL,
  `is_default` tinyint(1)   NOT NULL DEFAULT 0,
  `sort`       int          NOT NULL DEFAULT 100,
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_crm_pipelines_tenant_name` (`tenant_key`, `name`),
  KEY `idx_crm_pipelines_tenant` (`tenant_key`),
  KEY `idx_crm_pipelines_default` (`tenant_key`, `is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_stages` (
  `id`          char(36)     NOT NULL,
  `tenant_key`  varchar(64)  NOT NULL,
  `pipeline_id` char(36)     NOT NULL,
  `name`        varchar(120) NOT NULL,
  `sort`        int          NOT NULL DEFAULT 100,
  `probability` decimal(4,1) NOT NULL DEFAULT 0.0,
  `is_won`      tinyint(1)   NOT NULL DEFAULT 0,
  `is_lost`     tinyint(1)   NOT NULL DEFAULT 0,
  `created_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_crm_stages_pipeline_name` (`pipeline_id`, `name`),
  KEY `idx_crm_stages_tenant` (`tenant_key`),
  KEY `idx_crm_stages_pipeline` (`pipeline_id`),
  CONSTRAINT `fk_crm_stages_pipeline`
    FOREIGN KEY (`pipeline_id`) REFERENCES `crm_pipelines` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_deals` (
  `id`                  char(36)      NOT NULL,
  `tenant_key`          varchar(64)   NOT NULL,
  `account_id`          char(36)      DEFAULT NULL,
  `contact_id`          char(36)      DEFAULT NULL,
  `pipeline_id`         char(36)      NOT NULL,
  `stage_id`            char(36)      NOT NULL,
  `title`               varchar(255)  NOT NULL,
  `amount`              decimal(14,2) DEFAULT NULL,
  `currency`            varchar(3)    NOT NULL DEFAULT 'USD',
  `expected_close_date` date          DEFAULT NULL,
  `owner_user_id`       char(36)      DEFAULT NULL,
  `status`              enum('open','won','lost') NOT NULL DEFAULT 'open',
  `lost_reason`         varchar(500)  DEFAULT NULL,
  `source_lead_id`      char(36)      DEFAULT NULL,
  `raw_data`            json          DEFAULT NULL,
  `created_at`          datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_deals_tenant` (`tenant_key`),
  KEY `idx_crm_deals_account` (`account_id`),
  KEY `idx_crm_deals_stage` (`stage_id`),
  KEY `idx_crm_deals_owner` (`owner_user_id`),
  KEY `idx_crm_deals_status` (`status`),
  KEY `idx_crm_deals_source_lead` (`source_lead_id`),
  CONSTRAINT `fk_crm_deals_account`
    FOREIGN KEY (`account_id`) REFERENCES `crm_accounts` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_crm_deals_contact`
    FOREIGN KEY (`contact_id`) REFERENCES `crm_contacts` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_crm_deals_pipeline`
    FOREIGN KEY (`pipeline_id`) REFERENCES `crm_pipelines` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_crm_deals_stage`
    FOREIGN KEY (`stage_id`) REFERENCES `crm_stages` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_activities` (
  `id`            char(36)     NOT NULL,
  `tenant_key`    varchar(64)  NOT NULL,
  `ref_type`      enum('deal','contact','account') NOT NULL,
  `ref_id`        char(36)     NOT NULL,
  `type`          enum('call','email','meeting','task','note') NOT NULL DEFAULT 'task',
  `subject`       varchar(255) NOT NULL,
  `body`          text         DEFAULT NULL,
  `planned_start_at` datetime   DEFAULT NULL,
  `due_at`        datetime     DEFAULT NULL,
  `done`          tinyint(1)   NOT NULL DEFAULT 0,
  `done_at`       datetime     DEFAULT NULL,
  `owner_user_id` char(36)     DEFAULT NULL,
  `created_by`    char(36)     DEFAULT NULL,
  `created_at`    datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_activities_tenant` (`tenant_key`),
  KEY `idx_crm_activities_ref` (`ref_type`, `ref_id`),
  KEY `idx_crm_activities_owner` (`owner_user_id`),
  KEY `idx_crm_activities_due_at` (`due_at`),
  KEY `idx_crm_activities_done` (`done`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `crm_pipelines` (`id`, `tenant_key`, `name`, `is_default`, `sort`)
SELECT UUID(), t.tenant_key, 'Satış Pipeline', 1, 10
FROM tenants t
WHERE t.tenant_key IN ('avrasya', 'gzltek', 'tarvista', 'vistaseeds', 'bereketfide', 'default')
ON DUPLICATE KEY UPDATE
  `is_default` = VALUES(`is_default`),
  `sort` = VALUES(`sort`);

INSERT INTO `crm_stages` (`id`, `tenant_key`, `pipeline_id`, `name`, `sort`, `probability`, `is_won`, `is_lost`)
SELECT UUID(), p.tenant_key, p.id, s.name, s.sort, s.probability, s.is_won, s.is_lost
FROM `crm_pipelines` p
JOIN (
  SELECT 'Yeni' AS name, 10 AS sort, 10.0 AS probability, 0 AS is_won, 0 AS is_lost
  UNION ALL SELECT 'İletişimde', 20, 30.0, 0, 0
  UNION ALL SELECT 'Teklif', 30, 60.0, 0, 0
  UNION ALL SELECT 'Kazanıldı', 90, 100.0, 1, 0
  UNION ALL SELECT 'Kaybedildi', 100, 0.0, 0, 1
) s
WHERE p.name = 'Satış Pipeline'
  AND p.tenant_key IN ('avrasya', 'gzltek', 'tarvista', 'vistaseeds', 'bereketfide', 'default')
ON DUPLICATE KEY UPDATE
  `sort` = VALUES(`sort`),
  `probability` = VALUES(`probability`),
  `is_won` = VALUES(`is_won`),
  `is_lost` = VALUES(`is_lost`);
