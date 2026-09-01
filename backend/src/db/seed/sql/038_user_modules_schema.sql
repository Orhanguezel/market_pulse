-- ============================================================================
-- 038 — Kişi-bazlı modül matrisi: user_modules
-- Her kullanıcının hangi modülleri göreceği KİŞİ bazında ayarlanır. tenant_modules
-- (tenant hangi modüle sahip) + user_modules (o tenant içinde kullanıcıya verilen)
-- birlikte kişi-bazlı entitlement üretir. 'mail' ve 'calendar' herkese DEFAULT açıktır
-- (kod tarafında; user_modules kaydı gerekmez).
-- ALTER YASAK — değişiklikler CREATE TABLE + seed ile.
-- ============================================================================
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_modules` (
  `id`          char(36)    NOT NULL,
  `tenant_key`  varchar(64) NOT NULL,
  `user_id`     char(36)    NOT NULL,
  `module_key`  varchar(64) NOT NULL,
  `status`      enum('active','suspended') NOT NULL DEFAULT 'active',
  `created_at`  datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_modules` (`tenant_key`, `user_id`, `module_key`),
  KEY `idx_user_modules_user` (`tenant_key`, `user_id`),
  CONSTRAINT `fk_user_modules_module`
    FOREIGN KEY (`module_key`) REFERENCES `module_catalog` (`module_key`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_modules_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 'mail' ve 'calendar' modül kataloğuna eklenir (default-açık modüller; nav bunlara map'lenir).
INSERT INTO `module_catalog` (`module_key`, `name`, `description`, `category`, `base_price`, `currency`, `billing_period`, `is_active`, `sort`)
VALUES
  ('mail',     'Mail Yönetimi', 'E-posta gönderim, kampanya ve gelen kutusu', 'productivity', 0.00, 'USD', 'monthly', 1, 40),
  ('calendar', 'Takvim',        'Görev ve hatırlatma takvimi',                'productivity', 0.00, 'USD', 'monthly', 1, 45)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`), `category` = VALUES(`category`), `is_active` = 1;

-- Mevcut tüm tenant'lara 'mail' ve 'calendar' modüllerini aktif ver (default-açık).
INSERT INTO `tenant_modules` (`id`, `tenant_key`, `module_key`, `status`, `price_snapshot`, `currency`, `activated_at`)
SELECT UUID(), t.tenant_key, m.module_key, 'active', 0.00, 'USD', NOW()
  FROM (SELECT DISTINCT `tenant_key` FROM `tenant_modules`) t
  CROSS JOIN (SELECT 'mail' AS module_key UNION SELECT 'calendar') m
 WHERE NOT EXISTS (
   SELECT 1 FROM `tenant_modules` tm WHERE tm.`tenant_key` = t.`tenant_key` AND tm.`module_key` = m.`module_key`
 );
