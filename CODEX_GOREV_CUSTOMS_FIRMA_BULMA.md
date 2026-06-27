# Codex Görevi — Gümrük (Customs) Firma Bulma: 10M import + admin UI

**Tarih:** 2026-06-27
**Bağlam:** isletmeniyonet'ten devralınan ~10M HS-kodu bazlı gümrük (ihracat-ithalat) kaydını mevcut "firma bulma" (lead-machine Discover) sistemine **paylaşımlı reference lake** olarak entegre et. Operatör admin panelde "ürün/HS yaz → o malı Türkiye'den ithal eden yabancı firmalar lead olarak gelsin" akışını kullanacak.
**Branch:** `feat/tenant-config-core`
**Önkoşul:** Faz 0 (tenant JWT binding, `CODEX_GOREV_FAZ0_TENANT_JWT.md`) önce bitmeli — bu görev onun üzerine gelir.

## Mevcut durum (Codex zaten kurdu — PoC çalışıyor)
- `backend/src/db/seed/sql/030_customs_schema.sql` — `customs_records` tablosu (BIGINT PK, hs/buyer/exporter/country index'leri).
- `backend/src/modules/lead-machine/customs/customs.repository.ts` — `aggregateBuyers()` (HS/min-değer filtresi → buyer'a göre grupla).
- `backend/src/modules/lead-machine/customs/customs.job.ts` — `runCustomsJob()` → buyer'ları `lead_candidates`'e (channel='customs') yazar, deterministik skor.
- `backend/src/scripts/import-customs.ts` — chunked CSV import.
- Router: `POST/GET /lead-machine/customs/jobs`.
- PoC doğrulandı: biber dilimi 3535 kayıt → 200 lead.

**EKSİK:** (1) paylaşımlı-lake refaktoru, (2) 10M gerçek import, (3) admin panel UI.

---

## KARAR — Paylaşımlı reference lake (Orhan onayı 2026-06-27)
Gümrük verisi **global varlık** (tüm tenant'lar aynı havuzu sorgular: vistaseeds biber HS'ini, avrasya otomotiv HS'ini). Tenant başına kopya YOK. `customs_records` tenant-scope-guard `businessTables` listesinde **zaten yok** → muafiyet kodu gerekmez. Tek kopya, herkes okur, **lead çıktısı (lead_candidates) tenant-scoped kalır.**

---

## İŞ 1 — Paylaşımlı lake refaktoru
**Belirti:** `aggregateBuyers(tenantKey, ...)` lake'i tenant'a göre filtreliyor → her tenant'a ayrı 10M kopya gerekiyor (yanlış). Import default `TENANT='avrasya'`'ya kilitli.

**Yapılacak:**
1. `customs.repository.ts` → `aggregateBuyers`: **`tenant_key` WHERE filtresini KALDIR** (lake global okunur). İmza `aggregateBuyers(opts)` olur; tenantKey parametresini sil.
2. `customs.job.ts` → `aggregateBuyers(...)` çağrısından tenantKey'i çıkar. **AMA** lead çıktısı tenant-scoped kalmalı: `insertCandidate` mevcut aktif tenant context'i (getActiveTenantKey / ALS) kullanmaya devam etsin. Yani **lake okuması global, candidate yazması tenant'a özel.**
3. `030_customs_schema.sql`: `tenant_key` kolonu provenance için KALSIN ama DEFAULT'u `'global'` yap (ALTER YOK — CREATE TABLE'da değiştir + db:seed fresh).
4. `import-customs.ts`: `const TENANT = 'global'` (sabit; lake tek havuz).
5. `customs_records`'u **tenant-scope-guard `businessTables` listesine EKLEME** (global kalsın). Yorum ekle ki sonradan biri eklemesin.

**Kabul:** tek import sonrası tüm tenant'lar (vistaseeds, avrasya...) aynı lake'i sorgular; her tenant'ın ürettiği candidate'lar kendi tenant_key'iyle ayrışır.

---

## İŞ 2 — 10M gerçek import
**Kaynak:** isletmeniyonet canlı DB `isle4509_vt.excel_data` (kolonlar: `hs_code, buyer_name, exporter_name, hs_code_description, total_value, total_quantity, month_year`). Orhan dump'ı sağlayacak (CSV veya .sql).

**Yapılacak:**
1. `import-customs.ts`'i kaynak şemaya map'le: `hs_code_description → hs_description`. `buyer_country` türet (HS açıklaması/exporter sinyalinden; yoksa NULL bırak — sonra enrichment).
2. **Chunked insert** (örn. 5–10k satır/batch), idempotent (tekrar çalıştırılınca duplike etmesin — `source_file` + doğal anahtar veya TRUNCATE+reload stratejisi; hangisi seçildi RUNBOOK'a yaz).
3. Import sonrası `ANALYZE TABLE customs_records` (index istatistikleri).
4. Bellek: 10M'i tek seferde RAM'e alma — stream/satır-satır oku.
5. **Performans doğrula:** import sonrası tipik sorgu (`aggregateBuyers` HS prefix + min_value + LIMIT 200) **< 1 sn** olmalı. Değilse index/sorgu ayarla (gerekirse `total_value`'ya yardımcı index).

**Kabul:** ~10M satır `customs_records`'ta; örnek HS sorgusu (biber 0904 + otomotiv bir HS) anlamlı buyer listesi + alt-saniye yanıt.

---

## İŞ 3 — Admin panel "Gümrük / Ticaret Verisi" firma bulma sekmesi
**Patern:** mevcut `admin_panel/src/app/(main)/admin/(admin)/market/_components/b2b-lead-search-panel.tsx` birebir referans (job başlat + job listesi + candidates linki).

**Yapılacak:**
1. Yeni panel: `_components/customs-lead-search-panel.tsx`. Form alanları:
   - `HS kodu` (tam veya prefix, virgülle çoklu) — `hs_codes` / `hs_prefix`
   - `Ürün adı` (opsiyonel, hs_description LIKE araması — backend'e `product_query` param ekle, LIKE ile hs_description/exporter eşleştir)
   - `Min değer (USD)` — `min_value`
   - `Limit` (default 200)
   - ICP seç (opsiyonel — ICP'nin HS/sektör'ünden HS prefix otomatik doldurabilir)
2. RTK Query endpoint'leri: `useStartCustomsJobMutation` + `useListCustomsJobsQuery` (mevcut b2b tag patternine göre `admin_panel/src/integrations/...`).
3. Job listesi + her job'tan candidates'a link: `/admin/market/lead-machine/candidates?channel=customs&job_id=...`.
4. Sidebar/route: `lead-machine/customs/page.tsx` ekle, sidebar-items'a "Gümrük Verisi" girişi (mevcut fair/b2b yanına).
5. Backend gerekirse `product_query` param'ını `aggregateBuyers`'a ekle (hs_description LIKE).

**Kabul:** Operatör panelde HS/ürün/ülke/min-değer girip tarama başlatır → buyer firmalar candidates'a düşer → mevcut onay/enrichment/outreach pipeline'ı devralır (sıfır redesign).

---

## Genel kurallar
- **ALTER YASAK** — şema değişikliği CREATE TABLE'da + `db:seed:*:fresh` (CLAUDE.md).
- `customs_records` global kalır; **lead_candidates tenant-scoped** (asla karıştırma).
- Test: `aggregateBuyers` (product_query + hs filtresi), import idempotency, scoreBuyer dağılımı.
- Kabul: `bun run build` + `bun run tenant:guard` + `bun test` yeşil; admin panel typecheck temiz.
- İmport mekaniği + performans bulgularını `deploy/.../RUNBOOK.md` veya yeni `docs/teknik/CUSTOMS_IMPORT_RUNBOOK.md`'ye yaz.
