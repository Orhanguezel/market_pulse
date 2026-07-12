-- =============================================================
-- 041 — Fuar Takvimi (paylaşımlı katalog)
--
-- Türkiye Fuar Takvimi (TOBB, güncel yıl) + Dünya Fuar Takvimi kaynaklarından
-- içe aktarılan fuar kataloğu. customs_records gibi PAYLAŞIMLI referans veridir:
-- tenant/owner ile bölünmez, tüm kullanıcılar arayıp seçebilir.
--
-- exhibitor_url: fuarın KATILIMCI LİSTESİ sayfası. Fuar taraması (lead-machine
-- trade_fair kanalı) bu URL üzerinden çalışır. İçe aktarımda genelde boştur;
-- kullanıcı fuarı seçince "güncel bilgi ara" ile doldurulur.
--
-- ALTER YASAK — kolon değişikliği bu CREATE TABLE'da yapılır + db:seed:fresh.
-- =============================================================

CREATE TABLE IF NOT EXISTS `fairs` (
  `id`             char(36)     NOT NULL,
  `name`           varchar(500) NOT NULL,                 -- fuar adı (kaynak dilinde)
  `name_en`        varchar(500) DEFAULT NULL,             -- İngilizce adı (varsa)
  `sector`         varchar(300) DEFAULT NULL,             -- konu / sektör
  `products`       text         DEFAULT NULL,             -- başlıca ürün/hizmet grupları
  `fair_type`      varchar(120) DEFAULT NULL,             -- Uluslararası İhtisas / Ulusal vb.
  `country`        varchar(120) DEFAULT NULL,
  `city`           varchar(120) DEFAULT NULL,
  `venue`          varchar(300) DEFAULT NULL,             -- fuar alanı
  `organizer`      varchar(300) DEFAULT NULL,             -- düzenleyici firma
  `start_date`     date         DEFAULT NULL,
  `end_date`       date         DEFAULT NULL,
  `date_text`      varchar(160) DEFAULT NULL,             -- ham tarih metni (belirsizse)
  `date_status`    varchar(80)  DEFAULT NULL,             -- 'Tarih Açıklandı' / 'Tarih Belirsiz' ...
  `website`        varchar(500) DEFAULT NULL,             -- fuarın/organizatörün sitesi
  `exhibitor_url`  varchar(500) DEFAULT NULL,             -- KATILIMCI LİSTESİ sayfası (tarama için)
  `email`          varchar(255) DEFAULT NULL,
  `source`         varchar(40)  NOT NULL,                 -- 'tr_takvim' | 'dunya_takvim'
  `source_year`    int          DEFAULT NULL,             -- kaynak dosyanın yılı
  `verified_at`    datetime     DEFAULT NULL,             -- güncel bilgi en son ne zaman arandı
  `created_at`     datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fairs_name_start` (`name`(191), `start_date`),
  KEY `idx_fairs_country`   (`country`),
  KEY `idx_fairs_city`      (`city`),
  KEY `idx_fairs_start`     (`start_date`),
  KEY `idx_fairs_source`    (`source`),
  KEY `idx_fairs_search`    (`name`(120), `sector`(80))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
