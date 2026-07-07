-- Prospect Listeleri: içe-aktarılan firma+website listeleri + karma (ücretsiz/Apollo) enrichment.
-- owner_user_id + tenant_key ile kişi-bazlı izole.

CREATE TABLE IF NOT EXISTS `prospect_lists` (
  `id`            char(36)     NOT NULL,
  `tenant_key`    varchar(64)  NOT NULL,
  `owner_user_id` char(36)     NOT NULL,
  `name`          varchar(255) NOT NULL,
  `source_file`   varchar(255) DEFAULT NULL,
  `total`         int          NOT NULL DEFAULT 0,
  `free_done`     int          NOT NULL DEFAULT 0,
  `apollo_done`   int          NOT NULL DEFAULT 0,
  `created_at`    datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prospect_lists_owner` (`tenant_key`, `owner_user_id`),
  KEY `idx_prospect_lists_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `prospect_companies` (
  `id`                          char(36)     NOT NULL,
  `tenant_key`                  varchar(64)  NOT NULL,
  `owner_user_id`               char(36)     NOT NULL,
  `list_id`                     char(36)     NOT NULL,
  `row_index`                   int          DEFAULT NULL,
  `company_name`                varchar(500) NOT NULL,
  `country`                     varchar(120) DEFAULT NULL,
  `website`                     varchar(500) DEFAULT NULL,
  `generic_email`               varchar(255) DEFAULT NULL,
  `phone`                       varchar(64)  DEFAULT NULL,
  `linkedin_search_url`         varchar(1000) DEFAULT NULL,
  `decision_maker_name`         varchar(255) DEFAULT NULL,
  `decision_maker_title`        varchar(255) DEFAULT NULL,
  `decision_maker_linkedin`     varchar(500) DEFAULT NULL,
  `decision_maker_email`        varchar(255) DEFAULT NULL,
  `decision_maker_email_source` varchar(32)  DEFAULT NULL,
  `enrich_status`               enum('pending','free_running','free_done','apollo_running','apollo_done','failed') NOT NULL DEFAULT 'pending',
  `error`                       varchar(500) DEFAULT NULL,
  `created_at`                  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prospect_companies_list` (`list_id`),
  KEY `idx_prospect_companies_owner` (`tenant_key`, `owner_user_id`),
  KEY `idx_prospect_companies_status` (`list_id`, `enrich_status`),
  CONSTRAINT `fk_prospect_companies_list`
    FOREIGN KEY (`list_id`) REFERENCES `prospect_lists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
