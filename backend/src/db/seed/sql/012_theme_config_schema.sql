-- Theme runtime config storage used by /api/v1/theme and /api/v1/admin/theme

CREATE TABLE IF NOT EXISTS `theme_config` (
  `id`         char(36)   NOT NULL,
  `is_active` tinyint(1)  NOT NULL DEFAULT 1,
  `config`     mediumtext NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
