CREATE TABLE IF NOT EXISTS `crm_products` (
  `id` varchar(36) NOT NULL,
  `tenant_key` varchar(64) NOT NULL,
  `sku` varchar(120) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `unit_price` decimal(14,2) DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `owner_user_id` varchar(36) DEFAULT NULL,
  `raw_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_products_tenant` (`tenant_key`),
  KEY `idx_crm_products_owner` (`tenant_key`, `owner_user_id`),
  KEY `idx_crm_products_status` (`tenant_key`, `status`),
  KEY `idx_crm_products_sku` (`tenant_key`, `sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_quotes` (
  `id` varchar(36) NOT NULL,
  `tenant_key` varchar(64) NOT NULL,
  `deal_id` varchar(36) DEFAULT NULL,
  `account_id` varchar(36) DEFAULT NULL,
  `contact_id` varchar(36) DEFAULT NULL,
  `quote_no` varchar(80) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(14,2) DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `status` enum('draft','sent','accepted','rejected','expired','cancelled') NOT NULL DEFAULT 'draft',
  `valid_until` date DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `owner_user_id` varchar(36) DEFAULT NULL,
  `raw_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_crm_quotes_tenant_no` (`tenant_key`, `quote_no`),
  KEY `idx_crm_quotes_tenant` (`tenant_key`),
  KEY `idx_crm_quotes_owner` (`tenant_key`, `owner_user_id`),
  KEY `idx_crm_quotes_status` (`tenant_key`, `status`),
  KEY `idx_crm_quotes_deal` (`deal_id`),
  KEY `idx_crm_quotes_account` (`account_id`),
  CONSTRAINT `fk_crm_quotes_deal`
    FOREIGN KEY (`deal_id`) REFERENCES `crm_deals` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_crm_quotes_account`
    FOREIGN KEY (`account_id`) REFERENCES `crm_accounts` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_crm_quotes_contact`
    FOREIGN KEY (`contact_id`) REFERENCES `crm_contacts` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_orders` (
  `id` varchar(36) NOT NULL,
  `tenant_key` varchar(64) NOT NULL,
  `quote_id` varchar(36) DEFAULT NULL,
  `deal_id` varchar(36) DEFAULT NULL,
  `account_id` varchar(36) DEFAULT NULL,
  `contact_id` varchar(36) DEFAULT NULL,
  `order_no` varchar(80) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(14,2) DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `status` enum('draft','confirmed','fulfilled','cancelled') NOT NULL DEFAULT 'draft',
  `ordered_at` datetime DEFAULT NULL,
  `owner_user_id` varchar(36) DEFAULT NULL,
  `raw_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_crm_orders_tenant_no` (`tenant_key`, `order_no`),
  KEY `idx_crm_orders_tenant` (`tenant_key`),
  KEY `idx_crm_orders_owner` (`tenant_key`, `owner_user_id`),
  KEY `idx_crm_orders_status` (`tenant_key`, `status`),
  KEY `idx_crm_orders_quote` (`quote_id`),
  KEY `idx_crm_orders_deal` (`deal_id`),
  KEY `idx_crm_orders_account` (`account_id`),
  CONSTRAINT `fk_crm_orders_quote`
    FOREIGN KEY (`quote_id`) REFERENCES `crm_quotes` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_crm_orders_deal`
    FOREIGN KEY (`deal_id`) REFERENCES `crm_deals` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_crm_orders_account`
    FOREIGN KEY (`account_id`) REFERENCES `crm_accounts` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_crm_orders_contact`
    FOREIGN KEY (`contact_id`) REFERENCES `crm_contacts` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_documents` (
  `id` varchar(36) NOT NULL,
  `tenant_key` varchar(64) NOT NULL,
  `ref_type` enum('account','contact','deal','quote','order') NOT NULL,
  `ref_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_url` varchar(1000) DEFAULT NULL,
  `mime_type` varchar(120) DEFAULT NULL,
  `status` enum('active','archived') NOT NULL DEFAULT 'active',
  `owner_user_id` varchar(36) DEFAULT NULL,
  `raw_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_documents_tenant` (`tenant_key`),
  KEY `idx_crm_documents_owner` (`tenant_key`, `owner_user_id`),
  KEY `idx_crm_documents_ref` (`tenant_key`, `ref_type`, `ref_id`),
  KEY `idx_crm_documents_status` (`tenant_key`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_tasks` (
  `id` varchar(36) NOT NULL,
  `tenant_key` varchar(64) NOT NULL,
  `ref_type` enum('account','contact','deal','quote','order') DEFAULT NULL,
  `ref_id` varchar(36) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `status` enum('open','done','cancelled') NOT NULL DEFAULT 'open',
  `owner_user_id` varchar(36) DEFAULT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `raw_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_tasks_tenant` (`tenant_key`),
  KEY `idx_crm_tasks_status` (`tenant_key`, `status`),
  KEY `idx_crm_tasks_due_at` (`tenant_key`, `due_at`),
  KEY `idx_crm_tasks_owner` (`tenant_key`, `owner_user_id`),
  KEY `idx_crm_tasks_ref` (`tenant_key`, `ref_type`, `ref_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_reminders` (
  `id` varchar(36) NOT NULL,
  `tenant_key` varchar(64) NOT NULL,
  `ref_type` enum('account','contact','deal','quote','order','task','activity') DEFAULT NULL,
  `ref_id` varchar(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `body` text DEFAULT NULL,
  `remind_at` datetime NOT NULL,
  `channel` enum('in_app','email','sms','whatsapp') NOT NULL DEFAULT 'in_app',
  `status` enum('scheduled','sent','snoozed','cancelled') NOT NULL DEFAULT 'scheduled',
  `owner_user_id` varchar(36) DEFAULT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `snoozed_until` datetime DEFAULT NULL,
  `raw_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_reminders_tenant` (`tenant_key`),
  KEY `idx_crm_reminders_due` (`tenant_key`, `status`, `remind_at`),
  KEY `idx_crm_reminders_owner` (`tenant_key`, `owner_user_id`),
  KEY `idx_crm_reminders_ref` (`tenant_key`, `ref_type`, `ref_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
