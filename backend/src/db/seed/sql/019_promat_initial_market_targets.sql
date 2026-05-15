-- Initial Promat/Paspas pilot dealer targets for MarketPulse demos.
-- Gercek bayi listesi gelene kadar anonim pilot kayitlar kullanilir.

INSERT INTO `market_targets`
  (`id`, `name`, `category`, `status`, `website`, `phone`, `email`, `contact_name`, `city`, `district`, `instagram_url`, `google_maps_url`, `notes`, `churn_risk_score`, `last_seen_at`, `created_at`, `updated_at`)
VALUES
  ('01900000-0000-4000-8000-000000000001', 'Promat Pilot Bayi - Istanbul Avrupa', 'dealer', 'active', NULL, '+90 212 000 00 01', 'istanbul-avrupa@example.com', 'Pilot Yetkili 1', 'Istanbul', 'Avrupa Yakasi', NULL, NULL, 'Anonim Promat pilot bayi kaydi. Gercek bayi listesi geldiginde Paspas ERP senkronu ile guncellenecek.', 12.0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('01900000-0000-4000-8000-000000000002', 'Promat Pilot Bayi - Istanbul Anadolu', 'dealer', 'active', NULL, '+90 216 000 00 02', 'istanbul-anadolu@example.com', 'Pilot Yetkili 2', 'Istanbul', 'Anadolu Yakasi', NULL, NULL, 'Anonim Promat pilot bayi kaydi. Gercek bayi listesi geldiginde Paspas ERP senkronu ile guncellenecek.', 18.0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('01900000-0000-4000-8000-000000000003', 'Promat Pilot Bayi - Ankara', 'dealer', 'active', NULL, '+90 312 000 00 03', 'ankara@example.com', 'Pilot Yetkili 3', 'Ankara', 'Ostim', NULL, NULL, 'Anonim Promat pilot bayi kaydi. Gercek bayi listesi geldiginde Paspas ERP senkronu ile guncellenecek.', 24.0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('01900000-0000-4000-8000-000000000004', 'Promat Pilot Bayi - Izmir', 'dealer', 'active', NULL, '+90 232 000 00 04', 'izmir@example.com', 'Pilot Yetkili 4', 'Izmir', 'Bornova', NULL, NULL, 'Anonim Promat pilot bayi kaydi. Gercek bayi listesi geldiginde Paspas ERP senkronu ile guncellenecek.', 9.0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('01900000-0000-4000-8000-000000000005', 'Promat Pilot Distribitor - Bursa', 'distributor', 'active', NULL, '+90 224 000 00 05', 'bursa@example.com', 'Pilot Yetkili 5', 'Bursa', 'Nilufer', NULL, NULL, 'Anonim Promat pilot distribitor kaydi. Gercek bayi listesi geldiginde Paspas ERP senkronu ile guncellenecek.', 31.0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `status` = VALUES(`status`),
  `phone` = VALUES(`phone`),
  `email` = VALUES(`email`),
  `contact_name` = VALUES(`contact_name`),
  `city` = VALUES(`city`),
  `district` = VALUES(`district`),
  `notes` = VALUES(`notes`),
  `churn_risk_score` = VALUES(`churn_risk_score`),
  `updated_at` = CURRENT_TIMESTAMP;
