-- =============================================================
-- 032 — Module entitlements
--
-- Platform module catalog + tenant-level module activation state.
-- Access decisions use tenant_modules, not tenants.plan.
-- ALTER YASAK — degisiklikler bu CREATE TABLE seed'leriyle uygulanir.
-- =============================================================

CREATE TABLE IF NOT EXISTS `module_catalog` (
  `module_key`     varchar(64)    NOT NULL,
  `name`           varchar(120)   NOT NULL,
  `description`    text           DEFAULT NULL,
  `category`       varchar(64)    NOT NULL DEFAULT 'sales',
  `base_price`     decimal(10,2)  NOT NULL DEFAULT 0.00,
  `currency`       varchar(3)     NOT NULL DEFAULT 'USD',
  `billing_period` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
  `is_active`      tinyint(1)     NOT NULL DEFAULT 1,
  `sort`           int            NOT NULL DEFAULT 100,
  `created_at`     datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`module_key`),
  KEY `idx_module_catalog_active` (`is_active`),
  KEY `idx_module_catalog_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tenant_modules` (
  `id`             char(36)       NOT NULL,
  `tenant_key`     varchar(64)    NOT NULL,
  `module_key`     varchar(64)    NOT NULL,
  `status`         enum('trial','active','suspended','cancelled') NOT NULL DEFAULT 'trial',
  `price_snapshot` decimal(10,2)  NOT NULL DEFAULT 0.00,
  `currency`       varchar(3)     NOT NULL DEFAULT 'USD',
  `activated_at`   datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at`     datetime       DEFAULT NULL,
  `config`         json           DEFAULT NULL,
  `created_at`     datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     datetime       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_modules_tenant_module` (`tenant_key`, `module_key`),
  KEY `idx_tenant_modules_tenant` (`tenant_key`),
  KEY `idx_tenant_modules_module` (`module_key`),
  KEY `idx_tenant_modules_status` (`status`),
  CONSTRAINT `fk_tenant_modules_module`
    FOREIGN KEY (`module_key`) REFERENCES `module_catalog` (`module_key`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `module_catalog`
  (`module_key`, `name`, `description`, `category`, `base_price`, `currency`, `billing_period`, `is_active`, `sort`)
-- Baslangic TL fiyatlari. Gercek fiyatlar admin panelden (/admin/modules -> Paket
-- Fiyatlari) yonetilir. ON DUPLICATE, fiyat/para/donem alanlarini YALNIZCA mevcut
-- base_price = 0 ise (yani hic ozellestirilmemis) seed degerine ceker; panelden
-- girilmis (>0) fiyati EZMEZ. Boylece re-seed hem eski 0'li kayitlari duzeltir hem
-- de panel duzenlemesini korur.
VALUES
  ('leads', 'Müşteri Bulma', 'Lead machine, gümrük verisi, enrichment ve outreach akışları.', 'sales', 2500.00, 'TRY', 'monthly', 1, 10),
  ('crm', 'CRM', 'Hesap, kontak, pipeline, fırsat ve aktivite yönetimi.', 'sales', 1500.00, 'TRY', 'monthly', 1, 20),
  ('email-marketing', 'E-posta Pazarlama', 'Kampanya ve toplu e-posta gönderim akışları.', 'marketing', 1000.00, 'TRY', 'monthly', 1, 30)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `category` = VALUES(`category`),
  `is_active` = VALUES(`is_active`),
  `sort` = VALUES(`sort`),
  `base_price` = IF(`base_price` = 0.00, VALUES(`base_price`), `base_price`),
  `currency` = IF(`base_price` = 0.00, VALUES(`currency`), `currency`),
  `billing_period` = IF(`base_price` = 0.00, VALUES(`billing_period`), `billing_period`);

INSERT INTO `tenant_modules`
  (`id`, `tenant_key`, `module_key`, `status`, `price_snapshot`, `currency`, `activated_at`)
VALUES
  (UUID(), 'avrasya', 'leads', 'active', 0.00, 'USD', CURRENT_TIMESTAMP),
  (UUID(), 'gzltek', 'leads', 'active', 0.00, 'USD', CURRENT_TIMESTAMP),
  (UUID(), 'tarvista', 'leads', 'active', 0.00, 'USD', CURRENT_TIMESTAMP),
  (UUID(), 'vistaseeds', 'leads', 'active', 0.00, 'USD', CURRENT_TIMESTAMP),
  (UUID(), 'bereketfide', 'leads', 'active', 0.00, 'USD', CURRENT_TIMESTAMP),
  (UUID(), 'default', 'leads', 'active', 0.00, 'USD', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  `status` = VALUES(`status`),
  `price_snapshot` = VALUES(`price_snapshot`),
  `currency` = VALUES(`currency`),
  `activated_at` = VALUES(`activated_at`);
