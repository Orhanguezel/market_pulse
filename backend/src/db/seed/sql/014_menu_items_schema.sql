-- =============================================================
-- 014 — menu_items + menu_items_i18n (shared-backend / public API)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `menu_items_i18n`;
DROP TABLE IF EXISTS `menu_items`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS `menu_items` (
  `id`         CHAR(36)       NOT NULL,
  `parent_id`  CHAR(36)       DEFAULT NULL,
  `type`       ENUM('page','custom')    NOT NULL DEFAULT 'custom',
  `page_id`    CHAR(36)       DEFAULT NULL,
  `location`   ENUM('header','footer')  NOT NULL DEFAULT 'header',
  `section_id` CHAR(36)       DEFAULT NULL,
  `icon`       VARCHAR(64)    DEFAULT NULL,
  `order_num`  INT(11)        NOT NULL DEFAULT 0,
  `is_active`  TINYINT(1)     NOT NULL DEFAULT 1,
  `site_id`    CHAR(36)       DEFAULT NULL COMMENT 'NULL = global (all sites)',
  `created_at` DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `menu_items_parent_idx`   (`parent_id`),
  KEY `menu_items_active_idx`   (`is_active`),
  KEY `menu_items_order_idx`    (`order_num`),
  KEY `menu_items_created_idx`  (`created_at`),
  KEY `menu_items_updated_idx`  (`updated_at`),
  KEY `menu_items_location_idx` (`location`),
  KEY `menu_items_section_idx`  (`section_id`),
  KEY `menu_items_loc_parent_order_idx` (`location`, `parent_id`, `order_num`),
  KEY `menu_items_site_idx`             (`site_id`),
  CONSTRAINT `menu_items_parent_fk`
    FOREIGN KEY (`parent_id`) REFERENCES `menu_items` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `menu_items_i18n` (
  `id`           CHAR(36)      NOT NULL,
  `menu_item_id` CHAR(36)      NOT NULL,
  `locale`       VARCHAR(10)   NOT NULL,
  `title`        VARCHAR(100)  NOT NULL,
  `url`          VARCHAR(500)  NOT NULL,
  `created_at`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_menu_items_i18n_item_locale` (`menu_item_id`, `locale`),
  KEY `menu_items_i18n_locale_idx`            (`locale`),
  KEY `menu_items_i18n_title_idx`             (`title`),
  CONSTRAINT `fk_menu_items_i18n_item`
    FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
