-- MarketPulse: Hedef firmalar, lead pipeline ve sinyaller

CREATE TABLE IF NOT EXISTS `market_targets` (
  `id`                  char(36)     NOT NULL,
  `name`                varchar(255) NOT NULL,
  `category`            varchar(50)  NOT NULL DEFAULT 'dealer',
  `status`              varchar(30)  NOT NULL DEFAULT 'active',
  `website`             varchar(500) DEFAULT NULL,
  `phone`               varchar(50)  DEFAULT NULL,
  `email`               varchar(255) DEFAULT NULL,
  `contact_name`        varchar(255) DEFAULT NULL,
  `city`                varchar(100) DEFAULT NULL,
  `district`            varchar(100) DEFAULT NULL,
  `instagram_url`       varchar(500) DEFAULT NULL,
  `google_maps_url`     varchar(500) DEFAULT NULL,
  `hepsiburada_url`     varchar(500) DEFAULT NULL,
  `trendyol_url`        varchar(500) DEFAULT NULL,
  `amazon_url`          varchar(500) DEFAULT NULL,
  `notes`               text         DEFAULT NULL,
  `churn_risk_score`    decimal(4,1) NOT NULL DEFAULT '0.0',
  `last_seen_at`        datetime     DEFAULT NULL,
  -- Paspas ERP bağlantısı: NULL = manuel giriş, dolu = ERP'den senkronize
  `paspas_customer_id`  char(36)     DEFAULT NULL,
  `created_at`          datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_market_targets_paspas_id` (`paspas_customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @add_market_targets_paspas_customer_id := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'market_targets'
     AND COLUMN_NAME = 'paspas_customer_id') = 0,
  'ALTER TABLE `market_targets` ADD COLUMN `paspas_customer_id` char(36) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @add_market_targets_paspas_customer_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_market_targets_paspas_index := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'market_targets'
     AND INDEX_NAME = 'uq_market_targets_paspas_id') = 0,
  'CREATE UNIQUE INDEX `uq_market_targets_paspas_id` ON `market_targets` (`paspas_customer_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @add_market_targets_paspas_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `market_leads` (
  `id`           char(36)     NOT NULL,
  `name`         varchar(255) NOT NULL,
  `category`     varchar(100) DEFAULT NULL,
  `source`       varchar(100) NOT NULL DEFAULT 'manual',
  `status`       varchar(50)  NOT NULL DEFAULT 'new',
  `priority`     varchar(20)  NOT NULL DEFAULT 'medium',
  `score`        decimal(4,1) NOT NULL DEFAULT '0.0',
  `website`      varchar(500) DEFAULT NULL,
  `phone`        varchar(50)  DEFAULT NULL,
  `email`        varchar(255) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `city`         varchar(100) DEFAULT NULL,
  `district`     varchar(100) DEFAULT NULL,
  `notes`        text         DEFAULT NULL,
  `assigned_to`  varchar(255) DEFAULT NULL,
  `converted_at` datetime     DEFAULT NULL,
  `created_at`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `market_signals` (
  `id`          char(36)      NOT NULL,
  `target_id`   char(36)      DEFAULT NULL,
  `lead_id`     char(36)      DEFAULT NULL,
  `signal_type` varchar(100)  NOT NULL DEFAULT 'manual',
  `severity`    varchar(20)   NOT NULL DEFAULT 'medium',
  `title`       varchar(500)  NOT NULL,
  `description` text          DEFAULT NULL,
  `source_url`  varchar(1000) DEFAULT NULL,
  `is_reviewed` tinyint(1)    NOT NULL DEFAULT '0',
  `reviewed_at` datetime      DEFAULT NULL,
  `created_at`  datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_market_signals_target`      (`target_id`),
  KEY `idx_market_signals_lead`        (`lead_id`),
  KEY `idx_market_signals_is_reviewed` (`is_reviewed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
