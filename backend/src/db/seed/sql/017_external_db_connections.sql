-- =============================================================
-- 017 — Harici veritabanı bağlantıları
--
-- Amaç: MarketPulse'un Paspas ERP veya diğer projelerin
-- MySQL DB'lerinden okuma yapabilmesi için bağlantı kayıtları.
--
-- Güvenlik:
--   - password_enc: Node.js AES-256-CBC ile şifreli (env: DB_ENCRYPTION_KEY)
--   - Sadece SELECT yetkisi olan kullanıcı tanımlanmalı
--   - is_active=0 olan bağlantılar hiçbir zaman kullanılmaz
--
-- Runtime öncelik: DB kaydı > .env değişkenleri
-- (Env var'lar yoksa ve DB kaydı aktifse DB kaydı kullanılır)
-- =============================================================

CREATE TABLE IF NOT EXISTS `external_db_connections` (
  `id`             CHAR(36)     NOT NULL,
  -- Benzersiz kısa tanımlayıcı: "PASPAS", "VISTASEEDS", "ENSOTEK" vb.
  -- Env var kalıbıyla eşleşir: EXTERNAL_DB_{key}_HOST
  `key`            VARCHAR(50)  NOT NULL,
  `name`           VARCHAR(100) NOT NULL,
  `description`    VARCHAR(500) DEFAULT NULL,
  `host`           VARCHAR(255) NOT NULL,
  `port`           SMALLINT UNSIGNED NOT NULL DEFAULT 3306,
  `db_name`        VARCHAR(100) NOT NULL,
  `username`       VARCHAR(100) NOT NULL,
  -- AES-256-CBC ile şifrelenmiş parola (DB_ENCRYPTION_KEY env var'ı ile)
  -- NULL ise env var'daki parola kullanılır
  `password_enc`   TEXT         DEFAULT NULL,
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  -- Bağlantı test geçmişi
  `last_tested_at` DATETIME     DEFAULT NULL,
  `last_test_ok`   TINYINT(1)   DEFAULT NULL,
  `last_error`     VARCHAR(500) DEFAULT NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ext_db_key_uq` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paspas ERP okuma bağlantısı (boş — .env'den alınır)
-- Prod'da host/user/pass değerleri ya .env'de ya da bu kayıtta olur.
-- Bu satır var olması gerekiyor ki admin paneli kaydı listede göstersin.
INSERT INTO `external_db_connections`
  (`id`, `key`, `name`, `description`, `host`, `port`, `db_name`, `username`, `password_enc`, `is_active`)
VALUES
  (
    UUID(),
    'PASPAS',
    'Paspas ERP',
    'Plastik enjeksiyon fabrikası ERP — müşteri, ürün ve sipariş okuma',
    '',   -- .env EXTERNAL_DB_PASPAS_HOST ile doldurulur
    3306,
    '',   -- .env EXTERNAL_DB_PASPAS_NAME ile doldurulur
    '',   -- .env EXTERNAL_DB_PASPAS_USER ile doldurulur
    NULL, -- .env EXTERNAL_DB_PASPAS_PASSWORD ile doldurulur
    0     -- Prod'da aktif edilene kadar devre dışı
  );
