-- =============================================================
-- 004 — site_settings schema + MarketPulse seed
-- =============================================================

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `site_settings`;

CREATE TABLE `site_settings` (
  `id` CHAR(36) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  `locale` VARCHAR(8) NOT NULL DEFAULT '*',
  `value` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_locale_uq` (`key`, `locale`),
  KEY `site_settings_key_idx` (`key`),
  KEY `site_settings_locale_idx` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`) VALUES

-- Marka kimliği
(UUID(), 'brand_name',        '*', '"MarketPulse"'),
(UUID(), 'brand_short_name',  '*', '"MP"'),
(UUID(), 'app_name',          '*', '"MarketPulse"'),
(UUID(), 'app_version',       '*', '"0.1.0"'),

-- Yerelleştirme
(UUID(), 'default_locale',    '*', '"tr"'),
(UUID(), 'available_locales', '*', '["tr"]'),
(UUID(), 'app_locales',       '*', '[{"code":"tr","label":"TR","is_default":true,"is_active":true}]'),

-- Footer
(UUID(), 'footer_copyright',  '*', '"© 2026 MarketPulse. Tüm hakları saklıdır."'),
(UUID(), 'footer_keywords',   '*', '["Pazar İstihbaratı","Bayi Takibi","Lead Yönetimi","Rakip Analizi","MarketPulse"]'),

-- Geliştirici & depolama
(UUID(), 'developer_branding','*', '{"name":"GWD","full_name":"Guzel Web Design","url":"https://guezelwebdesign.com"}'),
(UUID(), 'storage_driver',    '*', '"local"'),

-- Analitik (müşteri deploy'unda doldurulur)
(UUID(), 'facebook_pixel_id',        '*', '""'),
(UUID(), 'ga4_measurement_id',       '*', '""'),
(UUID(), 'google_site_verification', '*', '""'),
(UUID(), 'gtm_container_id',         '*', '""'),

-- Logo
(UUID(), 'site_logo',       '*', '""'),
(UUID(), 'site_logo_dark',  '*', '""'),
(UUID(), 'site_logo_light', '*', '""'),

-- İletişim & sosyal
(UUID(), 'contact_info', '*', '{}'),
(UUID(), 'socials',      '*', '{}'),
(UUID(), 'company_brand','*', '{"name":"MarketPulse","website":"","phone":"","email":"","socials":{}}'),

-- GDPR çerez onayı
(UUID(), 'cookie_consent', '*', '{"consent_version":1,"ui":{"enabled":true,"position":"bottom","show_reject_all":true},"defaults":{"necessary":true,"analytics":false,"marketing":false},"texts":{"title":"Çerezler","description":"Deneyimi geliştirmek için çerezler kullanıyoruz."}}'),

-- ----------------------------------------------------------------
-- brand_config — UI renk tokenlarını DB'den yönetmek için
-- Admin paneli bu değerleri okuyup globals.css CSS değişkenlerini
-- runtime'da override eder (--logo-coral, --brand-gold vb.)
-- ----------------------------------------------------------------
(UUID(), 'brand_config', '*', '{
  "primaryHex":      "#E8A598",
  "primaryHexDark":  "#D88D7E",
  "accentHex":       "#22c55e",
  "accentHexDark":   "#4ade80",
  "sidebarBgCss":    "oklch(0.97 0.02 145)",
  "logoUrl":         "",
  "faviconUrl":      ""
}'),

-- ----------------------------------------------------------------
-- ui_admin_config — Yönetim paneli meta ayarları
-- ----------------------------------------------------------------
(UUID(), 'ui_admin_config', '*', '{"branding":{"app_name":"MarketPulse Admin","app_copyright":"MarketPulse","html_lang":"tr","theme_color":"#E8A598","favicon_16":"/favicon/favicon-16.svg","favicon_32":"/favicon/favicon-32.svg","favicon_url":"/favicon.ico","logo_url":"","apple_touch_icon":"/favicon/apple-touch-icon.svg","admin_login_quote":"Pazar istihbaratı ve bayi izleme platformunu buradan yönetin.","admin_login_heading":"","admin_login_background_url":"/img/admin_login_bg.png","meta":{"title":"MarketPulse Admin","description":"Pazar istihbaratı yönetim paneli.","og_url":"http://localhost:3094","og_title":"MarketPulse Admin","og_description":"Bayi, lead ve rakip izleme yönetim paneli.","og_image":"/favicon.svg","twitter_card":"summary_large_image"}}}');
