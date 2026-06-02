-- =============================================================
-- 025 — Outreach Campaign (Multi-tenant SaaS dinamik kampanya)
--
-- Her tenant'in birden fazla outreach kampanyasi olabilir.
-- Kampanya hem fuar bilgisi hem gonderici/marka bilgisini tutar.
-- generate-outreach-drafts.py + mail taslak servisi buradan ceker.
-- =============================================================

CREATE TABLE IF NOT EXISTS `outreach_campaigns` (
  `id`             char(36)     NOT NULL,
  `tenant_key`     varchar(64)  NOT NULL DEFAULT 'avrasya',
  `slug`           varchar(100) NOT NULL,        -- 'avrasya-automechanika-2026'
  `name`           varchar(200) NOT NULL,        -- 'Avrasya - Automechanika 2026'
  `is_active`      tinyint(1)   NOT NULL DEFAULT 1,

  -- Marka & gonderici
  `brand_name`     varchar(150) NOT NULL,        -- 'Avrasya / ProMats'
  `brand_short`    varchar(80)  NOT NULL,        -- 'ProMats'
  `brand_legal`    varchar(255) DEFAULT NULL,    -- 'Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti.'
  `sender_label`   varchar(150) NOT NULL,        -- 'Avrasya / ProMats Export'
  `sender_name`    varchar(150) DEFAULT NULL,    -- 'Ahmet Yılmaz' (görüşme sonrası)
  `sender_title`   varchar(120) DEFAULT NULL,    -- 'Export Manager'
  `sender_email`   varchar(255) NOT NULL,        -- 'info@promats.com.tr'
  `reply_to_email` varchar(255) DEFAULT NULL,    -- 'info@avrasyaotomotiv.net'
  `sender_phone`   varchar(50)  DEFAULT NULL,    -- '+90 539 860 75 80'
  `sender_office`  varchar(50)  DEFAULT NULL,    -- '+90 (212) 485 75 70'
  `sender_website` varchar(255) DEFAULT NULL,    -- 'www.promats.com.tr'
  `sender_address` varchar(500) DEFAULT NULL,    -- 'İkitelli OSB...'

  -- Urun / sektor tanimi (mail icinde 1 cumlelik vaadin baslangici)
  `product_en`     varchar(500) NOT NULL,        -- 'Turkish floor mat manufacturer exporting to 30+ markets'
  `product_de`     varchar(500) DEFAULT NULL,
  `product_tr`     varchar(500) DEFAULT NULL,

  -- Fuar bilgisi (kampanya fuara baglanmissa)
  `fair_name`      varchar(200) DEFAULT NULL,    -- 'Automechanika Frankfurt'
  `fair_edition`   varchar(50)  DEFAULT NULL,    -- '2026'
  `fair_dates_en`  varchar(100) DEFAULT NULL,    -- 'September 8-12, 2026'
  `fair_dates_de`  varchar(100) DEFAULT NULL,    -- '8.-12. September 2026'
  `fair_dates_tr`  varchar(100) DEFAULT NULL,    -- '8-12 Eylül 2026'
  `fair_hall`      varchar(20)  DEFAULT NULL,    -- '3.1'
  `fair_booth`     varchar(20)  DEFAULT NULL,    -- 'D11'
  `fair_url`       varchar(500) DEFAULT NULL,

  -- Calendly / randevu
  `calendly_link`           varchar(500) DEFAULT NULL,
  `calendly_placeholder`    varchar(200) DEFAULT NULL, -- gonderim oncesi gosterilecek metin

  -- ICP referansi (kampanya ile ICP eslestirme)
  `icp_id`         char(36)     DEFAULT NULL,

  -- Dil onceligi (CSV)
  `default_lang`   varchar(5)   NOT NULL DEFAULT 'EN',  -- 'EN' | 'DE' | 'TR'
  `country_to_lang` json        DEFAULT NULL,           -- {"DE":"DE","AT":"DE","PL":"EN",...}

  `created_at`     datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_outreach_campaign_slug` (`tenant_key`, `slug`),
  KEY `idx_outreach_campaign_tenant` (`tenant_key`),
  KEY `idx_outreach_campaign_active` (`is_active`),
  KEY `idx_outreach_campaign_icp` (`icp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- lead_outreach_drafts.campaign_id fresh seed yolunda 018_lead_machine_schema.sql
-- CREATE TABLE tanimina eklenir. Canli veri korumali ileri migrasyon ayri runner ile yapilacak.
