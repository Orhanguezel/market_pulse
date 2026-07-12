-- =============================================================
-- 042 — Gümrük arama sözlükleri (customs_records için hızlandırma)
--
-- SORUN: urun aramasi customs_records uzerinde LIKE '%...%' yapiyordu.
-- 16.3M satirda tam tarama = ~10 dakika (olculdu). Kullanilamaz.
--
-- COZUM: customs_records'ta sadece 19.628 FARKLI aciklama ve 854k farkli
-- ihracatci var. Once bu kucuk sozluklerde LIKE ile eslesenleri buluyoruz
-- (milisaniye), sonra ana tabloyu `hs_description IN (...)` ile suzuyoruz —
-- bu idx_customs_product / idx_customs_exporter indekslerini kullanir.
--
-- FULLTEXT INDEX tercih EDILMEDI: ilk fulltext indeks InnoDB'de tablo yeniden
-- insasi gerektiriyor (~10GB kopya); VPS'te 15GB bos alan vardi, riskliydi.
--
-- Sozlukler import sonrasi `bun src/scripts/build-customs-lookup.ts` ile tazelenir
-- (import-customs-xlsx.ts sonunda otomatik cagirilir).
-- =============================================================

CREATE TABLE IF NOT EXISTS `customs_descriptions` (
  `hs_description` varchar(500) NOT NULL,
  `record_count`   int unsigned NOT NULL DEFAULT 0,
  `updated_at`     datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`hs_description`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customs_exporters` (
  `exporter_name` varchar(500) NOT NULL,
  `record_count`  int unsigned NOT NULL DEFAULT 0,
  `updated_at`    datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`exporter_name`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
