# isletmeniyonet × Market Pulse — Birleştirme Değerlendirmesi & Planı

> Karar tarihi: 2026-06-27 · Mimar: Claude Code · Statü: Onaylı yön, Faz 1 PoC başlıyor
> Karar: **isletmeniyonet'in gümrük verisini Market Pulse'a taşı, PHP CRM'i emekliye ayır.** İlk iş: gümrük verisi entegrasyon PoC'si.

---

## 1. Özet

isletmeniyonet.com, PHP/MariaDB tabanlı bir dış-ticaret lead + mini-CRM aracı. En değerli varlığı: **~10 milyon HS-kodu bazlı gümrük (ihracat-ithalat) kaydı** (`excel_data` tablosu, canlı DB `isle4509_vt`'nin ~%95'i). Kolonlar: `hs_code, buyer_name, exporter_name, hs_code_description, total_value, total_quantity, month_year`.

Market Pulse, Türk KOBİ'leri için modern modüler B2B operasyon SaaS'ı (Fastify+Bun+Drizzle+MySQL / Next16+Tailwind4+Shadcn). Strateji dokümanı (`MARKET_PULSE_SAAS_PLANI.md`), en büyük rakibi **BAZ Export'a karşı tek zayıflığını** kabul ediyor: gümrük/ticaret-veri katmanı ve alıcı DB'si yok.

**Tez:** isletmeniyonet tam bu eksik katmanı sağlıyor; Market Pulse de isletmeniyonet'in thin PHP CRM'ine modüler CRM + Discover/Outreach/Monitor + multi-tenant getiriyor. Yüksek tamamlayıcı, düşük çakışan → birleşmeli.

---

## 2. Market Pulse değerlendirmesi

### Güçlü yönler (devralınacak varlıklar)
- **Admin panel / lead-machine** — taç mücevher. 25+ üretim-kalite panel: lead onay, ICP yönetimi, Amazon/B2B/Fuar tarama, enrichment, outreach taslak/kampanya, risk skorlama, targets, signals, reports.
- **Modüler SaaS mimarisi + yazılı strateji** — CRM Çekirdek + Monitor/Discover/Risk/Outreach/Reports; rakip analizi, fiyatlandırma, roadmap.
- **Discover pipeline** — `lead_candidates → market_leads`, ICP skorlama, human-in-the-loop onay, reddetme örüntülerinden öğrenen geri besleme döngüsü.
- **Amazon risk motoru** — 5-boyutlu, confidence-ağırlıklı, fixture+e2e testli.
- **Multi-tenant altyapı** — ALS + `tenant_key` + CI guard (`scripts/tenant-scope-guard.ts`).
- Entegrasyonlar: scraper-service (HMAC callback), Apollo.io, Groq/OpenAI, per-tenant şifreli secret store.
- Custom DB-driven i18n (TR/EN/DE, ~12k satır).

### Bloker'lar / riskler (birleştirmeden önce)
- 🔴 **Tenant güvenlik açığı:** tenant JWT'de değil, client'ın `x-tenant` header'ından okunuyor ve doğrulanmıyor → **cross-tenant erişim**. JWT'ye tenant binding ŞART.
- 🔴 **Frontend yanlış ürün:** public yüz hâlâ devralınan amozon "Amazon Pazar Analizi" + "TarMinGO" klonu. Gerçek B2B public yüz yok; teal+navy migration yapılmamış. (Altyapı — DB-driven sections, SEO, i18n, auth — yeniden kullanılabilir.)
- 🟡 İş tablolarında FK yok (orphan riski), status serbest-metin, dış çağrılarda timeout/retry yok, job'lar fire-and-forget, commit'li secret (Messe API key), `.sync-conflict-*` çöp dosyalar, karışık veri katmanı (raw SQL + Drizzle).

---

## 3. Birleştirme mimarisi — "Veriyi taşı, PHP'yi taşıma"

```
isletmeniyonet (retire edilecek)        Market Pulse (kanonik ürün)
────────────────────────────            ───────────────────────────
excel_data (10M kayıt)          ──►      yeni 'customs' Discover kanalı
sales/offers PHP CRM            ──►      CRM Çekirdek (konfig olarak modellenir)
public "yakında" sayfası        ──►      gerçek B2B public yüz (kurulacak)
```

### Gümrük = yeni Discover kanalı
- `LeadChannel` tipine `'customs'` eklenir (`src/modules/lead-machine/_shared/db.ts`).
- **Lead = ithalatçı firma** (`buyer_name`). `lead_candidates`:
  - `name` = buyer_name
  - `country` = buyer ülkesi (HS açıklaması/exporter'dan türetilir)
  - `channel` = `'customs'`
  - `raw_data` JSON = `{ hs_code, hs_code_description, exporter_name, total_value, total_quantity, month_year, record_count }`
  - `lead_score` = ithalat hacmi/sıklığına göre normalize (0-10)
- Mevcut **onay paneli + Apollo enrichment + outreach** pipeline'ı sıfır redesign devralır.

### İkinci aşama
- **Reports / Market-Intel modülü:** HS-kodu × ülke hacim/değer trendleri (§3 mimaride yeri boş). "Pepper Seeds" tarzı sorgu burada birinci-sınıf özellik olur.

---

## 4. Faz planı

| Faz | İş | Sahip | Çıktı |
|-----|----|----|-------|
| **0** | Güvenlik bloker: tenant JWT binding + commit'li secret temizliği + `.sync-conflict-*` sil | Claude tasarla / Codex impl | Sağlam multi-tenant zemin |
| **1 ✅ TAMAM (2026-06-27)** | **Gümrük verisi PoC:** `030_customs_schema.sql` + `lead-machine/customs/` (repo+job) + `customs` LeadChannel + import script. **Uçtan uca çalıştı:** 3535 biber kaydı → 200 lead (en üst MCCORMICK $1.97M). tenant:guard+tsc temiz. | Claude+agent | Pepper sorgusu Discover'da lead üretiyor ✅ |
| **2** | CRM Çekirdek'e isletmeniyonet sales/offer pipeline'ını modelle | — | Tek CRM |
| **3** | Reports/Market-Intel modülü (HS×ülke trend) | — | BAZ-paritesi ticaret istihbaratı |
| **4** | Gerçek B2B public yüz (teal+navy, TR/EN/DE — docs'ta copy hazır) | — | Self-serve landing + signup |

---

## 5. Faz 1 PoC — teknik adımlar (taslak)

1. **Veri taşıma:** `db_dump/isle4509_vt.sql` içinden `excel_data` + `excel_files` tablolarını ayıkla → Market Pulse MySQL'e `customs_records` olarak import (tenant_key ile). 10M satır → chunked import + HS/buyer/exporter index.
2. **Schema:** `src/db/seed/sql/0XX_customs_schema.sql` — `customs_records` (CREATE TABLE, ALTER yok).
3. **Kanal:** `lead-machine/customs/` modülü — `runCustomsJob(jobId)`: ICP/HS filtresine göre `customs_records` sorgula → buyer'a göre grupla → `lead_candidates` üret (channel='customs').
4. **UI:** admin panelde mevcut candidates paneli `customs` kanalını otomatik gösterir; opsiyonel HS-kodu arama formu.
5. **Doğrulama:** "Pepper Seeds" (HS 0904220000) sorgusu → ithalatçı lead listesi panelde görünür.

> Not: 10M satır ham veri lokal PoC için fazla olabilir — önce **örnek bir HS dilimi** (örn. biber 0904xx) ile PoC, sonra tam import.
