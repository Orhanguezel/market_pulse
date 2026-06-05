-- =============================================================
-- 018 — Lead Machine: Otomatik lead üretim katmanı
--
-- Mimari: Bu tablolar lead ÜRETİM katmanıdır.
-- Onaylanan lead_candidates → market_leads tablosuna taşınır.
-- =============================================================

-- ICP (İdeal Müşteri Profili) tanımları
CREATE TABLE IF NOT EXISTS `icp_profiles` (
  `id`         char(36)      NOT NULL,
  `tenant_key` varchar(64)   NOT NULL DEFAULT 'avrasya',
  `name`       varchar(100)  NOT NULL,
  `is_active`  tinyint(1)    NOT NULL DEFAULT 1,
  -- JSON yapısı:
  -- { sectors, sub_sectors, firm_types, geographies, sales_types,
  --   sales_channels, price_segment, exclude_countries, exclude_patterns }
  `definition` json          NOT NULL,
  `created_at` datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_icp_profiles_tenant` (`tenant_key`),
  KEY `idx_icp_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Arama kampanya iş kayıtları
CREATE TABLE IF NOT EXISTS `lead_search_jobs` (
  `id`           char(36)     NOT NULL,
  `tenant_key`   varchar(64)  NOT NULL DEFAULT 'avrasya',
  `channel`      varchar(30)  NOT NULL,   -- 'amazon' | 'b2b_directory' | 'trade_fair'
  `status`       varchar(20)  NOT NULL DEFAULT 'pending',
  --   pending → running → done | failed
  `icp_id`       char(36)     DEFAULT NULL,
  -- Kanal parametreleri (JSON):
  --   amazon:       { keyword, marketplace, review_min, review_max, rating_min, rating_max, price_min?, price_max? }
  --   b2b_directory:{ source, query, country?, sector? }
  --   trade_fair:   { fair_name, fair_url, fair_date }
  `params`       json         NOT NULL,
  `result_count` int          NOT NULL DEFAULT 0,
  `error_msg`    text         DEFAULT NULL,
  `created_by`   char(36)     DEFAULT NULL,
  `created_at`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at`   datetime     DEFAULT NULL,
  `finished_at`  datetime     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lead_search_jobs_tenant` (`tenant_key`),
  KEY `idx_jobs_channel`  (`channel`),
  KEY `idx_jobs_status`   (`status`),
  KEY `idx_jobs_icp`      (`icp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ham lead adayları — kullanıcı onayından önce
CREATE TABLE IF NOT EXISTS `lead_candidates` (
  `id`             char(36)      NOT NULL,
  `tenant_key`     varchar(64)   NOT NULL DEFAULT 'avrasya',
  `job_id`         char(36)      NOT NULL,
  `channel`        varchar(30)   NOT NULL,
  `icp_id`         char(36)      DEFAULT NULL,
  `status`         varchar(20)   NOT NULL DEFAULT 'pending',
  --   pending | approved | rejected | favorite
  -- Temel firma bilgisi
  `name`           varchar(255)  NOT NULL,
  `website`        varchar(500)  DEFAULT NULL,
  `country`        varchar(100)  DEFAULT NULL,
  `city`           varchar(100)  DEFAULT NULL,
  `phone`          varchar(100)  DEFAULT NULL,
  `email`          varchar(255)  DEFAULT NULL,
  `contact_name`   varchar(255)  DEFAULT NULL,
  -- AI analiz çıktıları
  -- Amazon: { seller_url, products[], review_flags[], problem_score }
  -- B2B:    { directory_source, description, sells_china_products, private_label }
  -- Fair:   { fair_name, fair_date, booth_number, exhibitor_profile }
  `raw_data`       json          DEFAULT NULL,
  `ai_summary`     text          DEFAULT NULL,
  `lead_score`     decimal(4,1)  DEFAULT NULL,
  `decision`       varchar(30)   DEFAULT NULL,
  -- Öğrenme mekanizması
  `reject_reason`  varchar(500)  DEFAULT NULL,
  `reject_tags`    json          DEFAULT NULL,  -- ["Kendi üretimi var","Çok küçük",...]
  `reviewed_by`    char(36)      DEFAULT NULL,
  `reviewed_at`    datetime      DEFAULT NULL,
  `created_at`     datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_candidates_tenant` (`tenant_key`),
  KEY `idx_candidates_job`     (`job_id`),
  KEY `idx_candidates_status`  (`status`),
  KEY `idx_candidates_channel` (`channel`),
  KEY `idx_candidates_icp`     (`icp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @add_lead_candidates_decision := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_candidates'
     AND COLUMN_NAME = 'decision') = 0,
  'ALTER TABLE `lead_candidates` ADD COLUMN `decision` varchar(30) DEFAULT NULL AFTER `lead_score`',
  'SELECT 1'
);
PREPARE stmt FROM @add_lead_candidates_decision;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `lead_candidates`
  MODIFY COLUMN `lead_score` decimal(4,1) DEFAULT NULL;

-- Enrichment verileri
-- candidate_id VEYA market_lead_id olur (onay öncesi/sonrası)
CREATE TABLE IF NOT EXISTS `lead_enrichment` (
  `id`             char(36)    NOT NULL,
  `tenant_key`     varchar(64) NOT NULL DEFAULT 'avrasya',
  `candidate_id`   char(36)    DEFAULT NULL,
  `market_lead_id` char(36)    DEFAULT NULL,
  -- { name, title, linkedin_url, email, phone }
  `decision_maker` json        DEFAULT NULL,
  -- small | medium | large | enterprise
  `company_size`   varchar(20) DEFAULT NULL,
  -- [ "Çin'e bağımlı", "MOQ problemi", "Dropshipping yapıyor" ]
  `pain_points`    json        DEFAULT NULL,
  -- { new_products, category_expansion, hiring, distributor_wanted, blog_activity }
  `growth_signals` json        DEFAULT NULL,
  -- scraped | apollo | linkedin_manual
  `source_vendor`  varchar(50) DEFAULT NULL,
  `enriched_at`    datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_enrichment_tenant` (`tenant_key`),
  KEY `idx_enrichment_candidate`   (`candidate_id`),
  KEY `idx_enrichment_market_lead` (`market_lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Outreach taslakları (otomatik gönderilmez — kullanıcı onaylar)
CREATE TABLE IF NOT EXISTS `lead_outreach_drafts` (
  `id`             char(36)     NOT NULL,
  `tenant_key`     varchar(64)  NOT NULL DEFAULT 'avrasya',
  `candidate_id`   char(36)     DEFAULT NULL,
  `market_lead_id` char(36)     DEFAULT NULL,
  `campaign_id`    char(36)     DEFAULT NULL,
  `subject`        varchar(300) NOT NULL,
  `body`           text         NOT NULL,
  `ai_model`       varchar(50)  DEFAULT NULL,  -- hangi model ürettiyse
  `status`         varchar(20)  NOT NULL DEFAULT 'draft',  -- draft | sent | archived
  `sent_at`        datetime     DEFAULT NULL,
  `opened_at`      datetime     DEFAULT NULL,
  `open_count`     int          NOT NULL DEFAULT 0,
  `sequence_step`  varchar(30)  NOT NULL DEFAULT 'initial',
  `last_reminder_at` datetime   DEFAULT NULL,
  `followup_step`  varchar(30)  NOT NULL DEFAULT 'initial',
  `last_followup_at` datetime   DEFAULT NULL,
  `replied_at`     datetime     DEFAULT NULL,
  `reply_status`   varchar(20)  DEFAULT NULL,              -- replied | no_reply
  `created_at`     datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_outreach_drafts_tenant` (`tenant_key`),
  KEY `idx_outreach_candidate`   (`candidate_id`),
  KEY `idx_outreach_market_lead` (`market_lead_id`),
  KEY `idx_outreach_draft_campaign` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @add_lead_outreach_sent_at := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_outreach_drafts'
     AND COLUMN_NAME = 'sent_at') = 0,
  'ALTER TABLE `lead_outreach_drafts` ADD COLUMN `sent_at` datetime DEFAULT NULL AFTER `status`',
  'SELECT 1'
);
PREPARE stmt FROM @add_lead_outreach_sent_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_lead_outreach_followup_step := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_outreach_drafts'
     AND COLUMN_NAME = 'followup_step') = 0,
  'ALTER TABLE `lead_outreach_drafts` ADD COLUMN `followup_step` varchar(30) NOT NULL DEFAULT ''initial'' AFTER `last_reminder_at`',
  'SELECT 1'
);
PREPARE stmt FROM @add_lead_outreach_followup_step;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_lead_outreach_last_followup_at := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_outreach_drafts'
     AND COLUMN_NAME = 'last_followup_at') = 0,
  'ALTER TABLE `lead_outreach_drafts` ADD COLUMN `last_followup_at` datetime DEFAULT NULL AFTER `followup_step`',
  'SELECT 1'
);
PREPARE stmt FROM @add_lead_outreach_last_followup_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_lead_outreach_sequence_step := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_outreach_drafts'
     AND COLUMN_NAME = 'sequence_step') = 0,
  'ALTER TABLE `lead_outreach_drafts` ADD COLUMN `sequence_step` varchar(30) NOT NULL DEFAULT ''initial'' AFTER `open_count`',
  'SELECT 1'
);
PREPARE stmt FROM @add_lead_outreach_sequence_step;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_lead_outreach_last_reminder_at := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_outreach_drafts'
     AND COLUMN_NAME = 'last_reminder_at') = 0,
  'ALTER TABLE `lead_outreach_drafts` ADD COLUMN `last_reminder_at` datetime DEFAULT NULL AFTER `sequence_step`',
  'SELECT 1'
);
PREPARE stmt FROM @add_lead_outreach_last_reminder_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_lead_outreach_opened_at := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_outreach_drafts'
     AND COLUMN_NAME = 'opened_at') = 0,
  'ALTER TABLE `lead_outreach_drafts` ADD COLUMN `opened_at` datetime DEFAULT NULL AFTER `sent_at`',
  'SELECT 1'
);
PREPARE stmt FROM @add_lead_outreach_opened_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_lead_outreach_open_count := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'lead_outreach_drafts'
     AND COLUMN_NAME = 'open_count') = 0,
  'ALTER TABLE `lead_outreach_drafts` ADD COLUMN `open_count` int NOT NULL DEFAULT 0 AFTER `opened_at`',
  'SELECT 1'
);
PREPARE stmt FROM @add_lead_outreach_open_count;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Öğrenme: red pattern'ları (H3 mekanizması için analiz kaynağı)
-- Bu tablo lead_candidates.reject_reason'dan periyodik olarak derlenir
CREATE TABLE IF NOT EXISTS `lead_rejection_patterns` (
  `id`          char(36)     NOT NULL,
  `tenant_key`  varchar(64)  NOT NULL DEFAULT 'avrasya',
  `channel`     varchar(30)  NOT NULL,
  `pattern`     varchar(200) NOT NULL,  -- tespit edilen pattern
  `count`       int          NOT NULL DEFAULT 1,
  `last_seen`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_rejection_patterns_tenant` (`tenant_key`),
  UNIQUE KEY `uq_rejection_channel_pattern` (`tenant_key`, `channel`, `pattern`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kullanıcı tanımlı tarama dışlama kuralları ("Bu profil tipini bir daha getirme")
CREATE TABLE IF NOT EXISTS `lead_scan_rules` (
  `id`         char(36)     NOT NULL,
  `tenant_key` varchar(64)  NOT NULL DEFAULT 'avrasya',
  `icp_id`     char(36)     DEFAULT NULL,  -- NULL = tüm ICP'ler
  `channel`    varchar(30)  DEFAULT NULL,  -- NULL = tüm kanallar
  `rule_type`  varchar(30)  NOT NULL DEFAULT 'exclude_reject_tag',
  `value`      varchar(200) NOT NULL,      -- e.g. "Kendi üretimi var", firm type
  `label`      varchar(300) DEFAULT NULL,  -- opsiyonel açıklama / ICP adı
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_scan_rules_tenant` (`tenant_key`),
  KEY `idx_scan_rule_icp` (`icp_id`),
  KEY `idx_scan_rule_channel` (`channel`),
  UNIQUE KEY `uq_scan_rule` (`tenant_key`, `icp_id`, `channel`, `value`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan ICP: Oto Aksesuar için oto aksesuar distribütör profili
INSERT INTO `icp_profiles` (`id`, `name`, `is_active`, `definition`) VALUES (
  UUID(),
  'Oto Aksesuar Distribütörü — Avrupa',
  1,
  JSON_OBJECT(
    'sectors',          JSON_ARRAY('automotive accessories', 'car care', 'floor mats'),
    'firm_types',       JSON_ARRAY('distributor', 'importer', 'wholesaler', 'e-commerce seller'),
    'geographies',      JSON_ARRAY('DE', 'AT', 'NL', 'PL', 'CZ', 'FR', 'IT', 'ES'),
    'sales_types',      JSON_ARRAY('B2B', 'B2C'),
    'sales_channels',   JSON_ARRAY('own website', 'amazon', 'ebay', 'wholesale'),
    'price_segment',    'mid',
    'exclude_patterns', JSON_ARRAY()
  )
);

-- Automechanika 2026 — Avrasya Oto Aksesuar için kalibre ICP (v1, 2026-05-21)
-- Kaynak: docs/teknik/icp-automechanika-final.md
INSERT INTO `icp_profiles` (`id`, `name`, `is_active`, `definition`)
SELECT
  '9f4c8f04-64b8-4da5-9c7d-4a4b5cf4b1b0',
  'Automechanika 2026 — Oto Aksesuar Alıcısı',
  1,
  JSON_OBJECT(
    'version', 1,
    'fair', JSON_OBJECT(
      'name', 'Automechanika Frankfurt 2026',
      'dates', '2026-09-08/2026-09-12',
      'host_exhibitor', JSON_OBJECT(
        'name', 'Avrasya Otomotiv San. ve Tic. Ltd. Sti.',
        'brand', 'ProMats',
        'hall', '3.1',
        'booth', 'D11'
      )
    ),
    'sectors', JSON_ARRAY(
      'automotive accessories','car care','floor mats','car mats','car carpet',
      'interior accessories','boot liners','trunk mats','auto trim','rubber mats'
    ),
    'firm_types', JSON_ARRAY(
      'distributor','importer','wholesaler','e-commerce seller','buying group',
      'aftermarket retailer','tuning shop chain','auto parts catalog company'
    ),
    'geographies', JSON_ARRAY(
      'DE','AT','NL','PL','FR','BE','CZ','IT','ES','UK',
      'RO','HU','SK','SE','DK','NO','FI','CH','GR','BG','PT','IE'
    ),
    'priority_geographies', JSON_ARRAY('DE','AT','NL','PL','FR'),
    'sales_types', JSON_ARRAY('B2B','B2B2C','B2C'),
    'sales_channels', JSON_ARRAY(
      'own website','amazon','ebay','kaufland','otto','cdiscount','fruugo',
      'wholesale catalog','retail chain','tuning chain'
    ),
    'price_segment', 'mid',
    'company_size_min', 'small',
    'company_size_max', 'enterprise',
    'annual_revenue_min_eur', 500000,
    'exclude_firm_types', JSON_ARRAY(
      'manufacturer (own production)','OEM tier-1 supplier','single car brand official dealer',
      'raw material supplier','tooling supplier'
    ),
    'exclude_sectors', JSON_ARRAY(
      'engine oil only','lubricants only','battery only','tire only',
      'electronic parts only','mechanical parts only'
    ),
    'exclude_patterns', JSON_ARRAY('chinese factory direct','made in china reseller only'),
    'exclude_geographies', JSON_ARRAY('CN','HK','IN','PK','BD','VN','TH'),
    'positive_signals', JSON_ARRAY(
      'private label interest','ODM partnership signals','european-made preference',
      'amazon FBA seller','multi-brand catalog','stocking distributor'
    ),
    'negative_signals', JSON_ARRAY(
      'in-house production line','patent on floor mat manufacturing',
      'established china supplier chain','single OEM contract revenue >70%'
    ),
    'scoring_weights', JSON_OBJECT(
      'sector_match', 0.30,
      'firm_type_match', 0.25,
      'geography_match', 0.20,
      'channel_match', 0.10,
      'positive_signal', 0.10,
      'negative_signal', -0.15
    ),
    'min_lead_score_for_candidate', 5.0
  )
WHERE NOT EXISTS (
  SELECT 1 FROM `icp_profiles`
  WHERE `id` = '9f4c8f04-64b8-4da5-9c7d-4a4b5cf4b1b0'
     OR `name` = 'Automechanika 2026 — Oto Aksesuar Alıcısı'
);
