CREATE TABLE IF NOT EXISTS `tenant_user_roles` (
  `id`         char(36) NOT NULL,
  `user_id`    char(36) NOT NULL,
  `tenant_key` varchar(64) NOT NULL,
  `role`       enum('tenant_admin','tenant_editor') NOT NULL DEFAULT 'tenant_editor',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_user_roles_user_tenant` (`user_id`, `tenant_key`),
  KEY `idx_tenant_user_roles_tenant` (`tenant_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id`         char(36) NOT NULL,
  `key`        varchar(128) NOT NULL,
  `locale`     varchar(8) NOT NULL DEFAULT '*',
  `value`      json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_platform_settings_key_locale` (`key`, `locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
