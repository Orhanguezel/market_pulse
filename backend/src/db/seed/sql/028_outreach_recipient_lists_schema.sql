-- Outreach Bulk-List Send: alıcı listeleri + alıcılar
-- Lead pipeline'a bağlı OLMAYAN toplu mail gönderimi için (Excel/CSV upload).
-- tenant_key her sorguda zorunlu. FK yok (proje deseni logical link kullanıyor).

CREATE TABLE IF NOT EXISTS `outreach_recipient_lists` (
  `id`          char(36)     NOT NULL,
  `tenant_key`  varchar(64)  NOT NULL DEFAULT 'avrasya',
  `owner_user_id` char(36)   DEFAULT NULL,
  `campaign_id` char(36)     DEFAULT NULL,           -- gönderici/marka kimliği
  `name`        varchar(200) NOT NULL,
  `source`      varchar(20)  NOT NULL DEFAULT 'excel', -- excel | csv | manual | customs
  `status`      varchar(20)  NOT NULL DEFAULT 'ready', -- ready | sending | sent
  `total_count` int          NOT NULL DEFAULT 0,
  `sent_count`  int          NOT NULL DEFAULT 0,
  `created_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reclist_tenant`   (`tenant_key`),
  KEY `idx_reclist_owner`    (`tenant_key`, `owner_user_id`),
  KEY `idx_reclist_campaign` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `outreach_recipients` (
  `id`           char(36)     NOT NULL,
  `tenant_key`   varchar(64)  NOT NULL DEFAULT 'avrasya',
  `owner_user_id` char(36)    DEFAULT NULL,
  `list_id`      char(36)     NOT NULL,
  `email`        varchar(255) NOT NULL,
  `name`         varchar(255) DEFAULT NULL,
  `company`      varchar(255) DEFAULT NULL,
  `country`      varchar(100) DEFAULT NULL,
  `custom_fields` json        DEFAULT NULL,          -- şablon değişkenleri {{...}}
  `status`       varchar(20)  NOT NULL DEFAULT 'pending', -- pending | drafted | sent | bounced | skipped
  `draft_id`     char(36)     DEFAULT NULL,          -- üretilen lead_outreach_drafts.id
  `created_at`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recipient_tenant` (`tenant_key`),
  KEY `idx_recipient_owner`  (`tenant_key`, `owner_user_id`),
  KEY `idx_recipient_list`   (`list_id`),
  KEY `idx_recipient_status` (`status`),
  KEY `idx_recipient_email`  (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
