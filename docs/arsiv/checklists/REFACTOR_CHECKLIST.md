# MarketPulse — Bağımsız SaaS Refaktör Ceklisti

> Hazırlık: 2026-05-07
> Amaç: Monorepo bağımlılığı sıfırla · Gereksiz modülleri temizle · Hard-code sıfırla · Cross-DB bağlantısı ekle
> Araçlar: **Claude** (mimari), **Codex** (backend impl), **Cursor** (admin panel + cleanup), **Antigravity** (UI doğrulama)

---

## Mevcut Durum Özeti

| Alan                   | Sorun                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend                | Eski `shared-backend` kaynagindan 8+ modül import ediliyordu, package.json'da bile kayıtlı değildi                                                                                  |
| Backend modüller      | `topics`, `subjects`, `sessions`, `progress`, `achievements`, `questionSubmissions` — quiz/eğitim platform kalıntıları, market_pulse ile ilgisi yok                        |
| Admin panel sayfaları | 26 sayfa var, backend'de sadece 9 modül — 17 sayfa atıl (telegram, wallet, subscriptions, announcements, availability, banners, campaigns, chat, email-templates, reviews, reports, vb.) |
| Hard-code              | Legacy DB adı, marka renkleri `#E8A598`, `#22c55e`, eski marka referansları                                                                                                      |
| Cross-DB               | Paspas ERP ve diğer projelerin DB'lerine okuma bağlantısı yok                                                                                                                           |

---

## BÖLÜM A — Backend Bağımsızlığı

### A1. Legacy shared-backend Modüllerini İçselleştir

> **Görev:** Codex | **Öncelik:** 🔴 Kritik

Kopyalanacak modüller (`/home/orhan/Documents/Projeler/tarim-dijital-ekosistem/packages/shared-backend/` kaynak):

- [x] `core/error.ts` → `backend/src/core/error.ts`
- [x] `core/logger.ts` → `backend/src/core/logger.ts`
- [x] `middleware/auth.ts` → `backend/src/middleware/auth.ts`
- [x] `middleware/roles.ts` → `backend/src/middleware/roles.ts`
- [x] `modules/health/` → `backend/src/modules/health/`
- [x] `modules/auth/` → `backend/src/modules/auth/`
- [x] `modules/profiles/` → `backend/src/modules/profiles/`
- [x] `modules/storage/` → `backend/src/modules/storage/`
- [x] `modules/siteSettings/` → `backend/src/modules/siteSettings/`
- [x] `modules/menuItems/` → `backend/src/modules/menuItems/`
- [x] `modules/userRoles/` → `backend/src/modules/userRoles/`
- [x] `modules/theme/` → `backend/src/modules/theme/`
- [x] `modules/notifications/` → `backend/src/modules/notifications/`
- [x] `modules/audit/` → `backend/src/modules/audit/` (requestLogger dahil)
- [x] `modules/_shared/` → `backend/src/modules/_shared/` (kopyalanan modüllerin ortak helper bağımlılığı)

**Sonrası:**

- [x] Tüm legacy `shared-backend/...` import'larını `@/modules/...` veya `@/middleware/...` ile değiştir
- [x] `grep -r "shared-backend" src/` → sıfır çıktı doğrulaması
- [x] `package.json`'dan legacy shared-backend bağımlılığını kaldır
- [x] Gerekirse kopyalanan modüllerin kendi içindeki legacy cross-import'ları da düzelt

---

### A2. Gereksiz Backend Modüllerini Sil

> **Görev:** Codex | **Öncelik:** 🟡 Yüksek

Aşağıdaki modüller quiz/eğitim platformuna ait, market_pulse ile alakasız:

- [x] `backend/src/modules/topics/` — sil
- [x] `backend/src/modules/subjects/` — sil
- [x] `backend/src/modules/sessions/` — sil
- [x] `backend/src/modules/progress/` — sil
- [x] `backend/src/modules/achievements/` — sil
- [x] `backend/src/modules/adminPanelStubs/` — sil (e-ticaret stub'ları)
- [x] `backend/src/modules/footerStub/` — değerlendir (public footer gerekli mi? değilse sil)
- [x] `backend/src/modules/homeSections/` — değerlendir (landing page varsa tut, yoksa sil)

**Sonrası:**

- [x] `routes/project.ts` — silinen modüllerin import/register satırlarını kaldır
- [x] Kalan route'ların çalıştığını doğrula

---

### A3. Seed SQL Temizliği

> **Görev:** Codex | **Öncelik:** 🟡 Yüksek

- [x] `010_targo_schema.sql` — legacy quiz tabloları var mı kontrol et, market_pulse ile ilgisi yoksa sil veya sadece gerekli tabloları bırak
- [x] `011_question_submissions_schema.sql` — sil
- [x] `012_home_sections_schema.sql` — homeSections modülü tutulacaksa bırak, silinecekse sil
- [x] `013_theme_presets_seed.sql` — tema sistemi kullanılıyorsa tut
- [x] `014_menu_items_schema.sql` — menuItems modülü tutulacaksa tut

---

## BÖLÜM B — Admin Panel Temizliği

### B1. Atıl Admin Sayfalarını Sil

> **Görev:** Cursor | **Öncelik:** 🟡 Yüksek

`admin_panel/src/app/(main)/admin/(admin)/` altında silinecek dizinler:

- [x] `availability/` — rezervasyon/müsaitlik, market_pulse dışı
- [x] `banners/` — e-ticaret bannerları
- [x] `campaigns/` — pazarlama kampanyaları
- [x] `chat/` — AI chat modülü
- [x] `email-templates/` — e-posta şablonu yönetimi
- [x] `home-layout/` — landing page düzeni
- [x] `llm-prompts/` — AI prompt yönetimi (market_pulse'ta AI yok)
- [x] `orders/` — sipariş yönetimi
- [x] `reports/` — generic raporlar
- [x] `reviews/` — yorum yönetimi
- [x] `subscription-plans/` — abonelik planları
- [x] `subscriptions/` — abonelik yönetimi
- [x] `telegram/` — Telegram bot
- [x] `wallet/` — cüzdan
- [x] `announcements/` — duyurular (değerlendir)

**Tutulacaklar:**

- `notifications/` — bildirim sistemi (tut)
- `users/` — kullanıcı yönetimi (tut)
- `user-roles/` — rol yönetimi (tut)
- `site-settings/` — ayarlar (tut)
- `storage/` — dosya yönetimi (tut)
- `audit/` — denetim logları (tut)
- `cache/` — cache temizleme (tut)
- `db/` — DB yönetimi (tut)
- `profile/` — profil (tut)
- `market/` — ana modül (tut)

---

### B2. Atıl RTK Query Endpoint Dosyalarını Sil

> **Görev:** Cursor | **Öncelik:** 🟡 Yüksek

Codex büyük bölümünü temizledi. Kalan silinecekler (`integrations/endpoints/admin/`):

- [x] `orders_admin.endpoints.ts` — orders modülü silindi
- [x] `reports_admin.endpoints.ts` — generic reports silindi (G bölümünde yeni market rapor endpoint'i gelecek)
- [x] `wallet_admin.endpoints.ts` — wallet modülü silindi
- [x] `announcements_admin.endpoints.ts` — duyurular silindi
- [x] `support_admin.endpoints.ts` — template support modülü (MarketPulse'ta yok)

**Tutulacaklar** (mevcut ve doğru):
- `audit_admin.endpoints.ts`, `dashboard_admin.endpoints.ts`, `db_admin.endpoints.ts`
- `market_admin.endpoints.ts`, `menu_items_admin.endpoints.ts`
- `notifications_admin.endpoints.ts`, `site_settings_admin.endpoints.ts`
- `storage_admin.endpoints.ts`, `users/`
- `mail_admin.endpoints.ts` — raporlama e-postası için tutulacak

**Sonrası:**

- [x] `hooks.ts` barrel dosyasından silinen endpoint export'larını temizle
- [x] `tags.ts`'den artık kullanılmayan tag'leri temizle

---

### B3. Sidebar Temizliği

> **Görev:** Cursor | **Öncelik:** 🟠 Orta

`sidebar-items.ts` içinden silinen modüllere ait entry'leri kaldır:

- [x] `AdminNavItemKey` type'ından kaldır
- [x] `adminNavConfig` array'inden kaldır
- [x] `FALLBACK_TITLES`'tan kaldır
- [x] TypeScript derleme hatası olmadığını doğrula

---

## BÖLÜM C — Hard-Code Temizliği

### C1. Marka Renklerini DB/Ayarlar'a Taşı

> **Görev:** Claude (tasarım) ✅ + Cursor (uygulama) | **Öncelik:** 🟠 Orta

**Strateji:** `site_settings` key-value tablosuna `brand_config` key'i olarak sakla.

- [x] `site_settings` tablosuna `brand_config` key ekle (seed SQL'de) — `004_site_settings_schema.sql` güncellendi
  ```json
  {
    "primaryHex":     "#E8A598",
    "primaryHexDark": "#D88D7E",
    "accentHex":      "#22c55e",
    "accentHexDark":  "#4ade80",
    "sidebarBgCss":   "oklch(0.97 0.02 145)",
    "logoUrl":        "",
    "faviconUrl":     ""
  }
  ```

**Cursor için handoff — aşağıdaki 4 adım uygulanacak:**

- [x] Backend: `GET /api/public/brand-config` endpoint'i ekle (siteSettings controller'ına) — `brand_config` key'ini DB'den okuyup parse edilmiş JSON döndürür
- [x] Admin panel: `useGetBrandConfigQuery` hook'unu `market_admin.endpoints.ts`'e değil `site_settings` endpoint dosyasına ekle
- [x] Admin panel root layout (`app/layout.tsx` veya `(main)/layout.tsx`): uygulama açılışında `brand_config` fetch et, aşağıdaki stili `<head>`'e enjekte et:
  ```tsx
  <style>{`
    :root {
      --logo-coral: ${cfg.primaryHex};
      --logo-coral-dark: ${cfg.primaryHexDark};
      --brand-gold: ${cfg.accentHex};
      --brand-gold-light: ${cfg.accentHexDark};
    }
  `}</style>
  ```
  `globals.css`'deki hard-coded hex değerler CSS variable tanımı olarak **kalır** (fallback), DB değeri onları override eder.
- [x] `/admin/site-settings` sayfasına "Marka Renkleri" sekmesi ekle — color picker + kaydet formu

---

### C2. Şirket Adı / Marka Metinleri

> **Görev:** Cursor | **Öncelik:** 🟠 Orta

- [x] Admin panelde hard-coded "MarketPulse" metinleri `site_settings.company_name`'den gelsin
- [x] Login sayfası, sidebar başlığı, sayfa title'ları → `useGetSiteSettingsQuery` ile doldurulsun
- [x] `next.config` içindeki hard-coded site adı varsa `.env` veya DB'ye taşı

---

### C3. `.env` Şeması Standartlaştır

> **Görev:** Codex | **Öncelik:** 🟡 Yüksek

Mevcut `env.ts` içinde legacy DB isim kalıntıları var. Temizlenecek:

- [x] `DB_NAME` default'u legacy değerden `market_pulse_db`'ye taşınsın
- [x] `.env.example` dosyası oluştur/güncelle — tüm zorunlu değişkenler dokümante edilsin
- [x] `JWT_SECRET`, `COOKIE_SECRET` için güvenli random default kaldırılsın — zorunlu yapılsın (yoksa başlamaya izin verme)
- [x] `APP_NAME`, `APP_URL` değişkenleri ekle — hard-coded alan adı/isim yerine kullanılsın

`.env.example` içeriği (minimum):

```
# App
APP_NAME=MarketPulse
APP_URL=https://marketpulse.domain.com

# Ana DB
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=mp_user
DB_PASSWORD=
DB_NAME=market_pulse_db

# Harici DB'ler (opsiyonel — okuma amaçlı)
EXTERNAL_DB_PASPAS_HOST=
EXTERNAL_DB_PASPAS_PORT=3306
EXTERNAL_DB_PASPAS_USER=
EXTERNAL_DB_PASPAS_PASSWORD=
EXTERNAL_DB_PASPAS_NAME=
# Ek projeler için aynı pattern: EXTERNAL_DB_{PROJE_KODU}_*

# Auth
JWT_SECRET=   ← zorunlu, default yok
COOKIE_SECRET= ← zorunlu, default yok

# Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## BÖLÜM D — Cross-Database Bağlantısı

### D1. Harici DB Bağlantı Altyapısı

> **Görev:** Claude (tasarım) ✅ + Codex (uygulama) | **Öncelik:** 🟡 Yüksek

**Mimari:** Okuma amaçlı ek MySQL pool'ları. Her harici DB `.env`'den konfigüre edilir.

- [x] `backend/src/db/external.ts` oluşturuldu — `getExternalPool(key)` ve `closeExternalPools()` fonksiyonları var
  - Havuzlar lazy oluşturulur (ilk sorgu anında)
  - Öncelik: env var → null

**Codex için handoff — aşağıdaki 2 adım uygulanacak:**

- [x] `env.ts`'e harici DB değişkenlerini ekle (tümü opsiyonel):
  ```ts
  EXTERNAL_DB_PASPAS_HOST:     z.string().optional(),
  EXTERNAL_DB_PASPAS_PORT:     z.coerce.number().optional().default(3306),
  EXTERNAL_DB_PASPAS_USER:     z.string().optional(),
  EXTERNAL_DB_PASPAS_PASSWORD: z.string().optional(),
  EXTERNAL_DB_PASPAS_NAME:     z.string().optional(),
  ```
- [x] `external.ts` içindeki `// TODO (D3)` yorum bloğunu uygula: `external_db_connections` tablosundan `key` ile aktif kaydı sorgula, `password_enc` varsa `DB_ENCRYPTION_KEY` env'i ile AES-256-CBC çöz, oluşturulan Pool'u önceliklendir

---

### D2. Paspas ERP Entegrasyonu (Okuma)

> **Görev:** Codex | **Öncelik:** 🟡 Yüksek

- [x] `backend/src/modules/market/external/paspas.schema.ts` — Claude tarafından gerçek Paspas şemasına göre düzeltildi:
  - `paspasCustomers` (musteriler): id, tur, ad, telefon, adres, iskonto (**email/city yok**)
  - `paspasProducts` (urunler): id, kategori, kod, ad, birim, stok, rezerve_stok, kritik_stok, birim_fiyat
  - `paspasOrders` (satis_siparisleri): id, siparis_no, musteri_id, siparis_tarihi, durum (**toplam/tarih yok**)
  - `pasPasSiparisKalemleri` (siparis_kalemleri): toplam hesaplama için eklendi

- [x] `backend/src/modules/market/external/paspas.repository.ts` — Claude tarafından gerçek kolonlara göre düzeltildi:
  - `getPaspasCustomers(q?, limit?)` — `WHERE is_active=1`, arama: ad/telefon
  - `getPaspasProducts(q?, limit?)` — kategori filtresi: urun/yarimamul, arama: ad/kod
  - `getCustomerOrders(customerId)` — JOIN siparis_kalemleri ile `SUM(miktar*birim_fiyat)` hesabı

**Codex için handoff — API endpoint'leri:**

- [x] `backend/src/modules/market/router.ts`'e ekle:
  - `GET /market/external/paspas/customers?q=&limit=` → `getPaspasCustomers` çağır
  - `GET /market/external/paspas/products?q=&limit=` → `getPaspasProducts` çağır
  - `GET /market/external/paspas/customers/:id/orders` → `getCustomerOrders` çağır
  - Hata: pool null ise 503 + `{ error: 'EXTERNAL_DB_NOT_CONFIGURED' }` döndür

**Cursor için handoff — Admin UI:**

- [x] `add-target-dialog.tsx` ve `add-lead-dialog.tsx`'e "Paspas'tan İçe Aktar" buton ekle
  - Dialog açılınca `useListPaspasCustomersQuery` ile müşteri listesi gelsin
  - Seçilen müşteriden ad/telefon/adres alanları otomatik dolsun
- [x] RTK Query: `market_admin.endpoints.ts`'e `useListPaspasCustomersQuery` ve `useGetPaspasCustomerOrdersQuery` hook'ları ekle

---

### D3. Genel Harici DB Yönetim Modülü (Gelecek)

> **Görev:** Claude (tasarım) ✅ + Cursor/Codex (uygulama) | **Öncelik:** 🟢 Düşük

Birden fazla projenin DB'sine bağlanmak için:

- [x] `external_db_connections` DB tablosu tasarlandı (`017_external_db_connections.sql`):
  - `key` (örn. "PASPAS") → env kalıbıyla eşleşir (`EXTERNAL_DB_{key}_*`)
  - `password_enc`: AES-256-CBC, Node.js `DB_ENCRYPTION_KEY` env'i ile
  - `last_tested_at`, `last_test_ok`, `last_error`: test geçmişi sütunları
  - Varsayılan Paspas ERP kaydı `is_active=0` ile eklendi

**Cursor için handoff — Admin UI:**

- [x] `/admin/external-db` sayfası — liste, ekle/düzenle/sil, "Test Et" butonu
- [x] Form: key (readonly), name, description, host, port, db_name, username, password
- [x] Test butonu → `POST /admin/external-db/:id/test` → başarı/hata badge güncelle

**Codex için handoff — API:**

- [x] `GET /admin/external-db` — tüm bağlantıları listele
- [x] `POST /admin/external-db` — yeni bağlantı ekle (AES şifrele)
- [x] `POST /admin/external-db/:id/test` — `SHOW TABLES` ile sağlık kontrolü, `last_*` sütunları güncelle
- [x] `GET /admin/external-db/:id/tables` — INFORMATION_SCHEMA'dan tablo listesi
- [x] `POST /admin/external-db/:id/query` — SELECT-only sorgu (tehlikeli keyword reject: DROP, INSERT, UPDATE, DELETE, TRUNCATE, ALTER)

> **Güvenlik:** SELECT-only kullanıcı, AES-256-CBC parola, SQL keyword allowlist.

---

## BÖLÜM E — Genel Kalite

### E1. Seed SQL Birleştirme

> **Görev:** Codex | **Öncelik:** 🟢 Düşük

- [x] Mevcut seed SQL'leri gözden geçir, gereksiz olanları sil (B1 sonrası)
- [x] `016_market_pulse_schema.sql` zaten var — doğru numaralandırma kontrol et

---

### E2. TypeScript Derleme Doğrulaması

> **Görev:** Cursor | **Öncelik:** 🟡 Yüksek

Tüm temizlik işlemleri sonrası:

- [x] `cd backend && bun run build` — sıfır hata
- [x] `cd admin_panel && bun run build` — başarılı (Next.js production build tamamlandı)
- [x] `cd admin_panel && bun run typecheck` — sıfır hata
- [x] Kalan backend import'larının tümü resolve ediliyor

---

### E3. UI Doğrulama

> **Görev:** Antigravity | **Öncelik:** 🟡 Yüksek

Runbook: `docs/E3_UI_QA_RUNBOOK.md`
Triage Template: `docs/E3_BUG_TRIAGE_TEMPLATE.md`
Handoff Paketi: `docs/E3_ANTIGRAVITY_HANDOFF.md`
Tek Komut Prompt: `docs/E3_ANTIGRAVITY_PROMPT.md`
Hazir Triage Raporu: `docs/E3_TRIAGE_REPORT_READY.md`
Smoke Komutlari: `docs/E3_SMOKE_TEST_COMMANDS.md`
Fix Queue: `docs/E3_FIX_QUEUE.md`
Operasyon Panosu: `docs/E3_OPERATION_BOARD.md`
Master Run Akisi: `docs/E3_MASTER_RUN_SEQUENCE.md`
Execution Log: `docs/E3_EXECUTION_LOG.md`
Report Intake: `docs/E3_REPORT_INTAKE.md`
Triage Mapping Guide: `docs/E3_TRIAGE_MAPPING_GUIDE.md`
Status Snapshot: `docs/E3_STATUS_SNAPSHOT.md`
Ready Now: `docs/E3_READY_NOW.md`
Preflight Checklist: `docs/E3_PREFLIGHT_CHECKLIST.md`
Tek Komut Teknik Probe: `./e3_preprobe.sh`
Tek Komut Probe + Kayit: `./e3_preprobe_and_record.sh`
Tek Komut Step1 Hazirla: `./e3_step1_runner.sh`
Tek Komut Step2 Baslat: `./e3_step2_runner.sh <antigravity_rapor.md>`
Tek Komut Step3 Kapanis: `./e3_step3_runner.sh`
Tek Komut Step4 Pilot: `./e3_step4_runner.sh`
Master Runner: `./e3_master_runner.sh`
Master Runner Status: `./e3_master_runner.sh --status`
Son Teknik Probe Kaydi: `docs/E3_PREPROBE_LAST_RUN.md`
Adim 1 Calistirma Mesaji: `docs/E3_STEP1_RUN_MESSAGE.md`
Adim 2 Triage Mesaji: `docs/E3_STEP2_TRIAGE_RUN_MESSAGE.md`
Adim 3 Kapanis Mesaji: `docs/E3_STEP3_CLOSURE_RUN_MESSAGE.md`
Adim 4 Pilot Handoff Mesaji: `docs/E3_STEP4_PILOT_HANDOFF_MESSAGE.md`
Nihai Antigravity Mesaji: `docs/E3_ANTIGRAVITY_FINAL_MESSAGE.md`

E3 Hizli Baslat (tek akis):
1. `docs/E3_STEP1_RUN_MESSAGE.md` metnini Antigravity'ye gonder
2. Sonucu `docs/E3_TRIAGE_REPORT_READY.md` dosyasina isle
3. `docs/E3_STEP2_TRIAGE_RUN_MESSAGE.md` ile P0/P1 fix turunu baslat
4. `docs/E3_SMOKE_TEST_COMMANDS.md` ile smoke + build dogrulamasi yap
5. `docs/E3_STEP3_CLOSURE_RUN_MESSAGE.md` ile kapanis ozetini cikar

E3 teknik pre-probe durumu (Cursor):
- [x] Tutulacak checklist rotalari HTTP `200` dogrulandi
- [x] Silinen checklist rotalari HTTP `404` dogrulandi
- [x] Market admin API endpoint'leri auth'suz probe'da `401` (beklenen)
- [x] Lead-machine alt rotalari HTTP `200` dogrulandi
- [x] Churn badge esit/sinif haritasi statik olarak dogrulandi
- [x] Rapor onizle/gonder aksiyon wiring'i statik olarak dogrulandi
- [x] Paspas'tan Ice Aktar wiring'i (target/lead dialog) statik olarak dogrulandi
- [x] Marka Renkleri sekmesi fetch/save wiring'i statik olarak dogrulandi
- [x] `bash ./e3_preprobe.sh` strict kontrol sonucu PASS
- [x] Loginli UI davranis dogrulamasi (Codex smoke) tamamlandi

- [x] `/admin/market` — dashboard açılıyor, stats kartları görünüyor
- [x] `/admin/market/targets` — tablo yükleniyor, yeni hedef dialog'u çalışıyor
- [x] `/admin/market/leads` — tablo yükleniyor, yeni lead dialog'u çalışıyor
- [x] `/admin/market/signals` — liste yükleniyor, manuel sinyal eklenebiliyor
- [x] `/admin/site-settings` — Marka renkleri sekmesi açılıyor (C1 sonrası)
- [x] Sidebar: temizlenen modüllerin linkleri görünmüyor
- [x] Dark mode'da severity badge'leri okunabilir durumda
- [x] "Paspas'tan İçe Aktar" dialogu açılıyor; müşteri listesi için env yoksa anlamlı bağlantı kapalı mesajı gösteriliyor (D2 sonrası)

Codex doğrulama notu (2026-05-07): `/admin/market`, `/targets`, `/leads`, `/signals`, `/site-settings` route'ları HTTP 200. Admin API ile stats, target create/list/recalculate/delete, lead create/list/delete, signal create/list/review/delete ve `brand_config` save akışları doğrulandı. `EXTERNAL_DB_PASPAS_*` env yokken Paspas müşteri endpoint'i 503 ve UI fallback mesajı beklenen durumda. `papaparse` install edildi; `theme_config` seed şeması ve eski `market_targets.paspas_customer_id` backfill'i eklendi.

---

## BÖLÜM F — Churn Risk Motoru

> Strateji: `market_targets.churn_risk_score` manuel değil, otomatik hesaplansın.
> **Değer:** Bu olmadan "pazar istihbaratı" vaadi zayıf kalır — 499 EUR/ay fiyatı bu modülü justify eder.

### F1. Skor Algoritması Tasarımı

> **Görev:** Claude (tasarım) ✅ | **Öncelik:** 🔴 Kritik

**Skor: 0–100. Her gece otomatik hesaplanır. Girdi kaynakları:**

| Girdi | Koşul | Puan |
|-------|-------|------|
| Kritik sinyal (is_reviewed=0) | Her biri | +20 |
| Yüksek sinyal (is_reviewed=0) | Her biri | +10 |
| Orta sinyal (is_reviewed=0) | Her biri | +5 |
| `last_seen_at` yaşı | 30-59 gün | +10 |
| `last_seen_at` yaşı | 60-89 gün | +20 |
| `last_seen_at` yaşı | ≥90 gün | +30 |
| `last_seen_at` boş (hiç görülmemiş) | — | +15 |
| Paspas siparişi (son 90 gün yok) | PASPAS bağlıysa | +15 |
| Paspas sipariş sıklığı düştü (son 3 ay vs önceki 3 ay) | PASPAS bağlıysa | +10 |

Skor 100'ü geçemez. `churn-low < 30`, `30 ≤ churn-medium < 60`, `churn-high ≥ 60`.

**Codex için handoff:**

- [x] `backend/src/modules/market/churn.service.ts` oluştur:
  ```ts
  export async function recalculateAllChurnScores(): Promise<void>
  export async function recalculateChurnScore(targetId: string): Promise<number>
  ```
  - Tüm aktif `market_targets`'ı çek
  - Her target için ilgili `market_signals`'ı sorgula (is_reviewed=0, son 90 gün)
  - `last_seen_at` yaşını hesapla
  - PASPAS bağlıysa `getCustomerOrders` ile sipariş analizi yap (optional — pool null ise atla)
  - Skoru 0-100 arasında hesaplayıp `UPDATE market_targets SET churn_risk_score=?, updated_at=NOW()` yaz

- [x] `backend/src/modules/market/router.ts`'e ekle:
  - `POST /market/targets/:id/recalculate-churn` — tek target için manuel tetikleme (admin)

- [x] Scheduled job: `backend/src/jobs/churn.job.ts`
  ```ts
  // Her gün gece 02:00'de çalışır (node-cron veya Bun.cron)
  cron.schedule('0 2 * * *', () => recalculateAllChurnScores())
  ```
  `app.ts`'de register edilsin.

### F2. Admin Panel Entegrasyonu

> **Görev:** Cursor | **Öncelik:** 🟡 Yüksek (F1 sonrası)

- [x] `targets-panel.tsx`: churn skor sütununu `churn-low/medium/high` CSS utility class'larıyla göster (PREMIUM_UI_UPGRADE_PLAN.md Faz 1'den)
- [x] Skor yanında "Yeniden Hesapla" butonu — `POST /market/targets/:id/recalculate-churn` çağırır
- [x] Skor sütununa tooltip: "Son hesaplama: {updated_at}"
- [x] RTK Query: `useRecalculateChurnMutation` hook'u ekle

---

## BÖLÜM G — Raporlama Modülü

> Amaç: Haftada bir müşteriye otomatik PDF/e-posta raporu — 499 EUR/ay fiyatını justify eden ikinci büyük özellik.

### G1. Rapor Yapısı Tasarımı

> **Görev:** Claude (tasarım) ✅ | **Öncelik:** 🟡 Yüksek

**Haftalık Özet Raporu içeriği:**

1. **Genel Bakış** — toplam hedef sayısı, aktif lead, incelenmemiş sinyal
2. **Risk Sıralaması** — churn_risk_score ≥ 60 olan ilk 5 hedef (tablo)
3. **Bu Hafta Sinyaller** — son 7 günün kritik/yüksek sinyalleri (tarih, firma, başlık)
4. **Lead Pipeline Özeti** — her statüsteki lead sayısı (Yeni/Görüşmede/Dönüştürüldü)
5. **Aksiyon Önerisi** — churn-high firma sayısına göre otomatik metin ("X firmada yüksek risk — bu hafta arama yapılması önerilir")

**Format:** PDF (HTML-to-PDF: `puppeteer` veya `@sparticuz/chromium` serverless uyumlu)  
**Teslimat:** SMTP ile e-posta (`.env`: `SMTP_*` — `.env.example`'a eklendi)

**Codex için handoff:**

- [x] `backend/src/modules/market/report.service.ts`:
  ```ts
  export async function generateWeeklyReport(): Promise<Buffer>  // PDF buffer
  export async function sendWeeklyReportEmail(to: string): Promise<void>
  ```
  - `generateWeeklyReport`: DB'den verileri topla → HTML template render → PDF'e dönüştür
  - `sendWeeklyReportEmail`: `nodemailer` + SMTP env → PDF attachment

- [x] `backend/src/modules/market/report.template.ts` — HTML string döndüren template fonksiyonu (inlined CSS ile, harici font yok)

- [x] Admin API:
  - `GET /market/reports/weekly/preview` — PDF'i inline döndürür (`Content-Type: application/pdf`)
  - `POST /market/reports/weekly/send` — body: `{ to: string }` — SMTP ile gönderir

- [x] Scheduled job: `backend/src/jobs/report.job.ts`
  ```ts
  // Her Pazartesi 08:00'de çalışır
  cron.schedule('0 8 * * 1', () => sendWeeklyReportEmail(env.REPORT_EMAIL_TO))
  ```

- [x] `env.ts`'e `REPORT_EMAIL_TO` ekle (opsiyonel — yoksa otomatik gönderim atlanır)

### G2. Admin Panel Entegrasyonu

> **Görev:** Cursor | **Öncelik:** 🟡 Yüksek (G1 sonrası)

- [x] `/admin/market/reports` sayfası:
  - "Haftalık Raporu Önizle" butonu — PDF'i yeni sekmede aç
  - "E-posta Gönder" butonu + alıcı alanı — `POST /market/reports/weekly/send` çağırır
  - Son gönderim tarihi göster (opsiyonel: `report_logs` tablosu veya site_settings key'i)
- [x] Sidebar'a `market/reports` linki ekle (`market` grubu altında)
- [x] RTK Query: `usePreviewWeeklyReportQuery` (PDF blob) ve `useSendWeeklyReportMutation` hook'ları

---

## Görev Özeti

| Görev | Sahip | Durum | Blok |
|-------|-------|-------|------|
| Legacy shared-backend modüllerini kopyala ve import'ları güncelle | **Codex** | ✅ Tamam | — |
| Gereksiz backend modüllerini sil + routes güncelle | **Codex** | ✅ Tamam | — |
| Gereksiz seed SQL'leri sil | **Codex** | ✅ Tamam | — |
| Harici DB altyapısı (`external.ts`) | **Codex** | ✅ Tamam | — |
| `.env.example` ve `env.ts` standartlaştır | **Codex** | ✅ Tamam | — |
| Paspas ERP schema/repository (D2) düzelt | **Claude** | ✅ Tamam | — |
| Marka renk DB şeması + brand_config seed | **Claude** | ✅ Tamam | — |
| Harici DB yönetim modülü tasarla (D3) | **Claude** | ✅ Tamam | — |
| Churn risk algoritması tasarla (F1) | **Claude** | ✅ Tamam | — |
| Raporlama modülü tasarla (G1) | **Claude** | ✅ Tamam | — |
| Paspas ERP API endpoint'leri (D2) | **Codex** | ✅ Tamam | — |
| Churn risk servisi + job (F1) | **Codex** | ✅ Tamam | — |
| Rapor servisi + job + SMTP (G1) | **Codex** | ✅ Tamam | — |
| Harici DB API (D3) | **Codex** | ✅ Tamam | D1 |
| Admin panel atıl sayfaları sil (B1) | **Cursor** | ✅ Tamam | — |
| Atıl RTK Query endpoint'leri sil (B2) | **Cursor** | ✅ Tamam | B1 |
| Sidebar temizliği + TS build (B3, E2) | **Cursor** | ✅ Tamam | B1, B2 |
| brand_config CSS injection + renk formu (C1) | **Cursor** | ✅ Tamam | — |
| Paspas İçe Aktar dialog UI (D2) | **Cursor** | ✅ Tamam (API hazırlandığında aktif) | D2 API |
| Churn skor UI + yeniden hesapla butonu (F2) | **Cursor** | ✅ Tamam (API hazırlandığında aktif) | F1 |
| Raporlama sayfası + PDF önizle (G2) | **Cursor** | ✅ Tamam (API hazırlandığında aktif) | G1 |
| Harici DB admin UI (D3) | **Cursor** | ✅ Tamam (API entegrasyonuna bağlı) | D3 API |
| UI doğrulama — tüm market sayfaları | **Antigravity** | ✅ Tamam | E2 |
| UI doğrulama — churn, rapor, Paspas import | **Antigravity** | ✅ Tamam | F2, G2, D2 |

---

## Sıralama Önerisi (Güncel)

```
Tamamlanan (A1, A2, A3, C3, D1): Backend temizlendi, bağımsız.

Sıradaki:
1. E3 Antigravity UI doğrulama               ← Tamamlandı
2. E3 bulgularını triage edip P0/P1 fixleri kapat ← Tamamlandı
3. Pilot müşteri demosu için rapor/churn akışını uçtan uca smoke test et ← Tamamlandı
4. İlk müşteri teklif/fatura teslimi için çıktı paketini hazırla ← Tamamlandı

Teslim paketi kontrol listesi: `docs/PILOT_DELIVERY_PACKAGE_CHECKLIST.md`
```

---

*Tamamlanan adımlar `- [x]` olarak işaretlenecek.*
*Son güncelleme: 2026-05-07 — A/C3/D1 backend ✅ · B/C1/B2/B3/D3/E2 Cursor tamamlandı ✅ · D2/F2/G2 UI tamamlandı ✅ · D2/F1/G1/D3 Codex tamamlandı ✅ · E3 teknik pre-probe seti tamamlandi ✅ · E3 Loginli UI QA ve Delivery tamamlandı ✅*
