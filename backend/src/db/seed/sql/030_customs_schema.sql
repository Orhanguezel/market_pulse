-- =============================================================
-- 030 — Customs / Trade-data (Gümrük ihracat-ithalat veri lake)
--
-- isletmeniyonet'ten devralinan ~10M HS-kodu bazli gumruk kaydi.
-- Discover'in 'customs' kanali bu tablodan lead (ithalatci firma) uretir.
-- LEAD = buyer_name (Turk malini ithal eden yabanci firma).
--
-- NOT: Bu bir BULK veri tablosu (milyonlarca satir). PK olarak char(36)
-- UUID degil BIGINT AUTO_INCREMENT kullanilir (10M satirda performans).
-- tenant_key her sorguda zorunlu (tenant-scope-guard).
-- ALTER YASAK — kolon degisikligi bu CREATE TABLE'da yapilir + db:seed:fresh.
-- =============================================================

CREATE TABLE IF NOT EXISTS `customs_records` (
  `id`             bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_key`     varchar(64)     NOT NULL DEFAULT 'avrasya',
  `hs_code`        varchar(20)     DEFAULT NULL,         -- GTİP / HS kodu
  `hs_description` varchar(500)    DEFAULT NULL,         -- urun aciklamasi (EN)
  `buyer_name`     varchar(500)    DEFAULT NULL,         -- ithalatci firma = LEAD
  `exporter_name`  varchar(500)    DEFAULT NULL,         -- Turk ihracatci
  `buyer_country`  varchar(100)    DEFAULT NULL,         -- alici ulkesi (turetildiyse)
  `total_value`    decimal(20,2)   DEFAULT NULL,         -- ithalat degeri (USD)
  `total_quantity` decimal(20,2)   DEFAULT NULL,
  `month_year`     varchar(50)     DEFAULT NULL,         -- 'Aug 2024' vb.
  `source_file`    varchar(255)    DEFAULT NULL,         -- yuklenen dosya adi
  `created_at`     datetime        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customs_tenant`   (`tenant_key`),
  KEY `idx_customs_hs`       (`tenant_key`, `hs_code`),
  KEY `idx_customs_buyer`    (`tenant_key`, `buyer_name`(100)),
  KEY `idx_customs_exporter` (`tenant_key`, `exporter_name`(100)),
  KEY `idx_customs_country`  (`tenant_key`, `buyer_country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
