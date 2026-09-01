# Admin Panel → Kullanıcı Dashboard'u Taşıma Planı (Kişi Bazlı)

> **Tarih:** 2026-07-05
> **Amaç:** Admin paneldeki tüm işlevsel modülleri (firma bulucu / lead machine, karar vericiler, email pazarlama / toplu gönderim, hedef firmalar, CRM) son kullanıcının frontend dashboard'una **kişi bazında** taşımak.
> **İlişkili doküman:** `docs/crm/DASHBOARD_PLAN.md` (uygulama kabuğu bölümü tamamlandı, bu doküman onu genişletir ve önceliklendirir), `docs/crm/MVP_PLAN.md`.
> **Rol ayrımı:** Bu plan Claude (mimar) tarafından yazıldı; implementasyon Codex'e, UI doğrulama Antigravity'ye.

---

## 1. Mevcut Durum Özeti (3 Katman)

### 1.1 Admin Panel (kaynak)
- 29 panel bileşeni, tek büyük endpoint dosyası: `admin_panel/src/integrations/endpoints/admin/market_admin.endpoints.ts` (1488 satır, tüm tipler inline) + `crm_admin.endpoints.ts`.
- Çekirdek modüller: Market dashboard (stats), Lead Tarama sihirbazı (B2B/Fuar/Amazon), Lead Adayları (1215 satırlık panel: filtre/onay/red/favori/enrichment/bulk-reject/scan-rules), ICP Profilleri (1047 satır, v3 skorlama), Karar Vericiler, Amazon Arama (5 boyutlu risk raporu), B2B/Gümrük/Fuar job'ları, Fuar Günü paneli, Öğrenme Raporu, Outreach Kampanyaları, Outreach Taslakları, Toplu Liste (CSV/XLSX upload + rate-limit'li toplu mail), Hedef Firmalar (churn/intel/rakip/marketplace/ERP), Lead Pipeline (kanban), Sinyaller, Haftalık Rapor, CRM (pipeline kanban + accounts + contacts).

### 1.2 Frontend (hedef)
- **Hazır olanlar:** `AppShell` (sidebar + topbar + auth guard) çalışıyor; `/karar-vericiler` (795 satır, uçtan uca) ve `/amazon` (kota/BYOK/export dahil) olgun; 11 CRM sayfası (`musteriler`, `satis-firsatlari`, `teklifler`, `siparisler`, `gorevler`, `aktiviteler`, `hatirlatmalar`, `urunler`, `belgeler`, `potansiyel-musteriler`, `dashboard`) mevcut.
- **Eksikler:** 11 CRM sayfasının tamamı salt-okunur `CrmListView` iskeleti (CRUD/detay/filtre/sayfalama yok); dashboard mock'a düşüyor (`dashboard/page.tsx:1453`); "Mail Yönetimi", "İşletme Yönetimi", "Kullanıcılar", "Raporlar" sidebar'da `soon` stub'ı; `kontaklar` route'u regex'te var ama sayfası yok; rol/modül-bazlı nav filtresi uygulanmıyor; RTK tag invalidation hiç kullanılmamış; ikili auth-guard deseni (`useAuthStore` vs AppShell-içi `useMeQuery`).

### 1.3 Backend (belirleyici kısıt)
- **İzolasyon birimi `tenant_key`; kişi (user) bazlı izolasyon YOK.** Hiçbir okuma sorgusu `owner_user_id` ile filtrelenmiyor.
- CRM tabloları (`crm_accounts/contacts/deals/activities` + business records) `owner_user_id` kolonuna **sahip** ama kolon `req.user.sub`'dan doldurulmuyor ve okumada filtre değil → **en hazır modül**.
- Lead-machine / karar-verici / outreach / market tablolarında owner kolonu **hiç yok**; dedup UNIQUE constraint'leri tenant bazlı (`uq_ldm_tenant_company_city` vb.) → iki kullanıcı aynı firmayı arayınca UPSERT çakışır.
- Kullanıcıya açık tek desen: `registerDecisionMakerPublic` (`requireAuth + requireModule('leads')`) ve `registerCrmTenant` (salt GET). Lead-machine'in geri kalanı + market + outreach yönetimi **yalnızca `/admin/` altında**.
- Email: nodemailer + in-process `setTimeout` rate limit; kalıcı queue yok (süreç ölürse gönderim kaybolur); `email-marketing` modülü katalogda tanımlı ama **hiçbir uçta guard edilmiyor**.
- `scraper-callback` webhook'u `requireAdmin` arkasında — imza tabanlı public uca taşınmalı.

---

## 2. Mimari Karar: Kişi Bazlı İzolasyon Modeli

| Seçenek | Açıklama | Artı | Eksi |
|---|---|---|---|
| **A) Kullanıcı-başına tenant** | Her son kullanıcıya otomatik tenant aç | Neredeyse sıfır sorgu değişikliği | Tenant tablosu şişer, ekip paylaşımı imkânsızlaşır, SaaS "workspace" modeliyle çelişir |
| **B) Tenant içi `owner_user_id` (ÖNERİLEN)** | Mevcut tenant korunur, ikinci seviye owner filtresi eklenir | Doğru SaaS mimarisi; ileride "ekip görünümü" (owner IN team) kolay | Şema + tüm servis sorgularına dokunma maliyeti |

**Karar: B.** CRM SaaS hedefi (bkz. hafıza/MVP_PLAN) workspace = tenant, kişi = owner modelini gerektiriyor. Uygulama kuralı:

1. `owner_user_id` her yazma işleminde **sunucuda** `req.user.sub`'dan set edilir (body'den asla alınmaz — mevcut CRM servislerindeki `body.owner_user_id ?? null` düzeltilecek).
2. Okuma: kullanıcı-uçlarında `WHERE tenant_key = ? AND owner_user_id = ?`. Admin uçları tenant-genelini görmeye devam eder.
3. `isSuperAdmin` bypass'ı kullanıcı-uçlarında owner filtresini **kaldırmaz** (sadece tenant seçimini serbest bırakır).
4. Paylaşımlı kaynaklar owner-scoped **değildir:** `customs_records` (global lake), `module_catalog`, presets. Bunlardan **üretilen** kayıtlar (candidate, job, liste) owner-scoped'dur.

---

## 3. Gap Matrisi (Admin Özelliği → Frontend Durumu → Eksik)

| # | Admin modülü | Frontend'de karşılığı | Backend user-scoped API | Eksik iş |
|---|---|---|---|---|
| 1 | Market Ana Ekran (stats) | `/dashboard` KISMEN (mock fallback) | `/crm/dashboard/summary` var (owner'sız) | Gerçek veri + lead-machine istatistikleri + mock kaldırma |
| 2 | Lead Tarama sihirbazı (B2B/Fuar/Amazon) | **YOK** | YOK (admin-only) | Tam taşıma: user router + sayfa |
| 3 | Lead Adayları paneli (onay/red/favori/enrich/rules) | `/potansiyel-musteriler` salt-okunur liste | Sadece `GET /lead-machine/candidates` | Review/approve/enrich/bulk uçları + tam panel |
| 4 | ICP Profilleri | **YOK** | YOK | Tam taşıma |
| 5 | Karar Vericiler | `/karar-vericiler` **TAM** ✅ | `registerDecisionMakerPublic` ✅ | Sadece owner-scope eklenecek + `promote-crm` user muadili |
| 6 | Amazon Arama | `/amazon` **TAM** ✅ | Public amazon uçları ✅ | Rescore/bulk-scores parite kontrolü + owner-scope |
| 7 | B2B / Gümrük / Fuar job listeleri | **YOK** | YOK | Tarama sihirbazının parçası olarak taşı |
| 8 | Fuar Günü paneli | **YOK** | YOK | Faz 3 sonu (saha modu) |
| 9 | Öğrenme Raporu (rejection/approved stats) | **YOK** | YOK | Taşı (raporlar altına) |
| 10 | Outreach Kampanyaları (CRUD + draft üretimi) | **YOK** (sidebar "Mail Yönetimi" stub) | YOK | Tam taşıma — Mail Yönetimi modülünün çekirdeği |
| 11 | Outreach Taslakları (düzenle/gönder/açılma takip) | Kısmen (`/karar-vericiler` içinde gömülü) | Kısmen (lists/generate/send var) | Bağımsız taslak yönetim ekranı + drafts uçlarının user muadili |
| 12 | Toplu Liste (CSV/XLSX upload + toplu gönderim) | **YOK** (endpoint'ler RTK'da tanımlı, UI yok) | `outreach/lists*` public'te VAR ✅ | Sadece UI + owner-scope |
| 13 | Hedef Firmalar (churn/intel/rakip/marketplace/ERP) | **YOK** ("İşletme Yönetimi" stub) | YOK | Tam taşıma (ERP hariç — faz 4) |
| 14 | Lead Pipeline kanban + conversion stats | `/satis-firsatlari` salt-okunur tablo | `GET /crm/deals` (salt GET) | Kanban + stage-taşıma + CRUD |
| 15 | Sinyaller | **YOK** | YOK | Taşı |
| 16 | Haftalık Rapor (PDF önizleme + mail) | **YOK** ("Raporlar" stub) | YOK | Taşı |
| 17 | CRM accounts/contacts/deals/activities CRUD | 11 sayfa salt-okunur; `kontaklar` sayfası yok | `registerCrmTenant` salt GET | Tenant router'a owner-scoped POST/PATCH/DELETE + tüm sayfalara CRUD |
| 18 | CRM business records (quotes/orders/products/documents/tasks/reminders) | Salt-okunur listeler | Salt GET | CRUD + detay |
| 19 | Bildirimler | **YOK** (endpoint tanımlı, UI yok) | `/notifications` var | Topbar zil + liste sayfası |
| 20 | Kullanıcı/rol yönetimi (workspace içi) | "Kullanıcılar" stub | Admin-only | Faz 4: tenant-admin rolüne workspace kullanıcı yönetimi |
| 21 | Test Merkezi, DB, Storage, Audit, Tenants, Platform | — | — | **TAŞINMAZ** (platform-admin işlevi) |

---

## 4. Fazlı Uygulama Planı ve Checklist

### FAZ 0 — Temel Kararlar + Güvenlik Zemini (bloker, her şeyden önce)

**Backend:**
- [x] `getActiveUserId()` helper'ı ekle (`backend/src/modules/_shared/tenant-scope.ts` yanına; `req.user.sub` → AsyncLocalStorage).
- [x] Seed SQL'e `owner_user_id char(36) NULL` + index ekle (idempotent koşullu blok deseniyle, **ALTER TABLE lokalde yasak — seed dosyasında CREATE TABLE'a ekle + fresh**):
  - [x] `018`: `icp_profiles`, `lead_search_jobs`, `lead_candidates`, `lead_enrichment`, `lead_outreach_drafts`, `lead_scan_rules` (`owner_user_id`)
  - [x] `036`: `lead_decision_makers`, `lead_company_pool`
  - [x] `025`: `outreach_campaigns` · `028`: `outreach_recipient_lists`, `outreach_recipients`
  - [x] `016`: `market_targets`, `market_leads`, `market_signals`
- [x] Dedup UNIQUE constraint'lerini revize et: `uq_ldm_tenant_company_city` ve `uq_lcp_tenant_company_city` → `(tenant_key, owner_user_id, company_name, city)`.
- [x] `bun run build && bun run db:seed:*:fresh` ile şemayı doğrula (Avrasya verisi migration script'i gerekiyorsa mevcut kayıtlara admin kullanıcının ID'sini yaz).
- [x] Yazma servislerinde `owner_user_id`'yi `req.user.sub`'dan otomatik doldur; CRM servislerindeki `body.owner_user_id ?? null` kalıbını kaldır (`crm/contacts.service.ts:45`, `deals.service.ts:64`, `activities.service.ts:37`).
- [x] `tenant-scope-guard` benzeri **owner-scope-guard** script'i yaz (user-router sorgularında `owner_user_id` filtresi zorunlu).
- [x] `scraper-callback`'i `requireAdmin` arkasından çıkar → `SCRAPER_CALLBACK_SECRET` imza doğrulamalı public uca taşı.
- [x] `requireModule('email-marketing')` guard'ını toplu mail uçlarına bağla (şu an guard'sız; `leads` yetkisiyle gönderilebiliyor).
- [x] JWT/entitlement: `GET /entitlements/me`'nin kullanıcı tarafından erişilebilir olduğunu doğrula (frontend nav filtresi bunu tüketecek).

**Frontend:**
- [x] Auth-guard tekilleştir: `useAuthStore` desenini AppShell'e taşı (tek guard, tek yükleme durumu).
- [x] RTK `tags.ts`'i CRM + lead-machine endpoint'lerine bağla (`providesTags`/`invalidatesTags`) — mutation'lar eklenmeden önce şart.
- [x] Nav modül filtresi: `IY_APP_NAV`'daki `module` alanını `/entitlements/me` sonucuyla eşle; entitle olmayan modül "kilitli" rozetiyle görünsün (upsell), `soon` stub'ları kaldır.

### FAZ 1 — Backend: User-Scoped API Yüzeyi

Desen: `registerDecisionMakerPublic` örnek alınır → `/api/v1/` altında `requireAuth + requireModule(...)` + owner-scope. Admin uçları aynen kalır (tenant-geneli görür).

- [x] **`registerLeadMachineUser` router'ı** (`requireModule('leads')`):
  - [x] `GET/POST /lead-machine/candidates`, `GET /candidates/:id`, `PATCH /candidates/:id/review`, `POST /candidates/:id/approve-to-lead`
  - [x] `GET/POST/PATCH/DELETE /lead-machine/icp*`
  - [x] `POST/GET /lead-machine/b2b/jobs`, `/customs/jobs`, `/fair/jobs`, `/fair/run`
  - [x] `GET/POST /lead-machine/enrich/:id`, `POST /enrich/batch`
  - [x] `GET/POST/DELETE /lead-machine/rules` (scan rules — owner-scoped)
  - [x] `GET /lead-machine/feedback/rejection-stats`, `/approved-stats` (owner-scoped)
- [x] **`registerOutreachUser` router'ı** (`requireModule('email-marketing')`):
  - [x] `GET/POST/PATCH/DELETE /lead-machine/outreach/campaigns*` + `:id/generate-drafts` + `:id/sync-host-keywords`
  - [x] `GET /lead-machine/outreach/drafts`, `PATCH /drafts/:id`, `POST /drafts/:id/send`
  - [x] Mevcut `outreach/lists*` uçlarına owner-scope ekle
- [x] **`registerMarketUser` router'ı** (`requireModule('crm')` veya yeni `market` modülü):
  - [x] `GET/POST/PATCH/DELETE /market/targets*` + `recalculate-churn` + `intel` + `scan-competitor` + `scan-marketplace/:platform` + `marketplace-history/:platform`
  - [x] `GET/POST/PATCH/DELETE /market/leads*` + `conversion-stats`
  - [x] `GET/POST /market/signals`, `POST /signals/:id/review`, `DELETE /signals/:id`
  - [x] `GET /market/stats` (dashboard kartları için, owner-scoped)
  - [x] `GET /market/reports/weekly/preview`, `POST /weekly/send` (owner verisiyle)
- [x] **CRM tenant router'ına yazma uçları** (`crm/tenant.router.ts`, owner-scoped):
  - [x] accounts/contacts/deals/activities: POST + PATCH (+ `PATCH /deals/:id/stage`)
  - [x] pipelines: GET (tenant-geneli, paylaşımlı) — POST admin'de kalır
  - [x] products/quotes/orders/documents/tasks/reminders: POST/PATCH/DELETE
  - [x] `POST /crm/convert/lead-candidate` user muadili
  - [x] Tüm mevcut GET uçlarına `owner_user_id` filtresi ekle
- [x] **Decision-maker mevcut public router'ına** owner-scope + `promote-candidates`/`promote-crm` user muadilleri.
- [x] Job sistemi: `lead_search_jobs.owner_user_id = req.user.sub` doldur; AsyncLocalStorage owner context'i ve scraper-callback sonuç yazımı aynı owner'ı kullanır.
- [x] Kişi bazlı kota/limit: `POST .../jobs` ve `POST .../send` uçlarına per-user günlük kota (basit sayaç tablosu; entitlement plan alanından okunabilir).

### FAZ 2 — Frontend: Ortak Altyapı

- [x] **Endpoint katmanı:** `frontend/src/integrations/rtk/public/` altına yeni dosyalar: `lead-machine.endpoints.ts`, `outreach.endpoints.ts`, `market.endpoints.ts`; `crm.endpoints.ts`'e mutation'lar. Tipleri admin'deki `market_admin.endpoints.ts`'ten kopyalamak yerine `src/integrations/shared/` altına ortak tip dosyaları çıkar (`lead-machine.types.ts`, `outreach.types.ts`, `crm.types.ts`) — admin panel de sonraki adımda buradan tüketebilir.
- [x] **`CrmListView` → veri tablosu v2:** sayfalama, arama, kolon bazlı filtre, sıralama, satır aksiyonları (düzenle/sil), boş-state + hata-state, toplu seçim. (Admin'deki data-table bileşenlerinden uyarlanabilir.)
- [x] **Ortak form/dialog altyapısı:** create/edit dialog kalıbı (react-hook-form + zod), confirm-delete dialog'u, toast.
- [x] **JobPoller genelleştirme:** `/amazon`'daki `JobPoller`'ı ortak hook'a çıkar (`useJobPolling`) — B2B/fuar/gümrük/karar-verici job'ları da kullanacak.
- [x] **Detay sayfası kalıbı:** `[id]` route + sekmeli detay (özet / aktiviteler / notlar) — accounts ve deals için ilk uygulama.
- [x] `kontaklar` sayfasını oluştur (tip + endpoint hazır, sayfa yok; `ClientLayout.tsx:41` regex'i zaten kapsıyor).
- [x] `/me/settings`'i AppShell içine al (tema/layout tutarsızlığını gider).
- [x] Dashboard mock fallback'ini kaldır (`dashboard/page.tsx:1453-1467`); "Aktivite Ekle / Takvim Ekle" butonlarını gerçek dialog'lara bağla.

### FAZ 3 — Modül Taşımaları (öncelik sırasıyla)

**3.1 Mail Yönetimi (Outreach paketi) — en yüksek iş değeri, sidebar stub'ı doldurur:**
- [x] `/mail-yonetimi` (veya `/outreach`) ana sayfa: kampanya listesi + kampanya formu (admin `outreach-campaigns-panel.tsx`'ten uyarla: marka/gönderici/ürün vaadi/fuar/randevu/dil bölümleri)
- [x] Taslaklar sekmesi: listele, düzenle (subject/body), tekil gönder, açılma sayacı, reply durumu (admin `outreach-drafts-panel.tsx`)
- [x] Toplu Liste sekmesi: CSV/XLSX upload dialog'u, liste kartları + ilerleme çubuğu, alıcı tablosu, şablon hazırla (`{{name}}/{{company}}/{{country}}`), taslak üret, rate-limit'li toplu gönder + onay dialog'u (admin `bulk-list-panel.tsx`; endpoint'ler frontend RTK'da zaten tanımlı)
- [x] Sidebar "Mail Yönetimi" stub'ını gerçek route'a bağla, `module: 'email-marketing'` entitlement filtresi
- [x] `/karar-vericiler` içindeki gömülü outreach akışını bu modüle linkle (çift kod üretme)

**3.2 Firma Bulucu (Lead Machine) — ikinci en yüksek değer:**
- [x] `/firma-bulucu/tarama`: 3 adımlı sihirbaz (kaynak: B2B/Fuar/Amazon/Gümrük → ICP seçimi → kaynak formu) — admin `lead-tarama-panel.tsx`
- [x] `/firma-bulucu/adaylar`: tam aday paneli — kanal/durum filtresi, sıralama, aday kartları (skor, AI özet, risk kararı), Onayla/Reddet/Favori, Lead'e Aktar, tekil+batch enrichment, aday başına outreach taslağı, toplu red, tarama dışlama kuralları — admin `lead-candidates-panel.tsx` (1215 satır; en büyük taşıma kalemi)
- [x] `/firma-bulucu/icp`: ICP CRUD (admin `icp-profiles-panel.tsx`; v3 gelişmiş alanlar "gelişmiş" akordeonuna)
- [x] `/potansiyel-musteriler`'i aday panelına yönlendir veya "onaylı adaylar" görünümü olarak yeniden tanımla
- [x] Job listesi ekranı: B2B/fuar/gümrük job'ları durum + polling (ortak `useJobPolling`)

**3.3 CRM CRUD'laştırma:**
- [x] `musteriler` (accounts): create/edit/delete + detay sayfası (kontaklar, deal'ler, aktiviteler sekmeleri)
- [x] `kontaklar`: liste + CRUD + account ilişkisi
- [x] `satis-firsatlari` (deals): **kanban görünümü** (admin `pipeline-kanban.tsx` — sürükle-bırak stage taşıma) + liste toggle + CRUD + conversion stats kartları
- [x] `gorevler`, `aktiviteler`, `hatirlatmalar`: CRUD + tamamlama aksiyonları
- [x] `teklifler`, `siparisler`, `urunler`, `belgeler`: CRUD + detay
- [x] Dashboard'u gerçek özet + lead-machine istatistikleriyle besle (`/market/stats` + `/crm/dashboard/summary`)

**3.4 İşletme Yönetimi (Hedef Firmalar + Sinyaller + Raporlar):**
- [x] `/isletme-yonetimi/hedef-firmalar`: tablo (kategori/durum/şehir/churn skoru), ekle/düzenle/sil, churn yeniden hesapla, istihbarat çek (intel dialog), rakip tarama (tekil + tümü), marketplace tarama + geçmiş, toplu import (dry-run önizleme + şablon indir) — admin `targets-panel.tsx` (ERP senkron admin'de kalır)
- [x] `/isletme-yonetimi/sinyaller`: liste + severity + ekle/incele/sil — admin `signals-panel.tsx`
- [x] `/raporlar`: haftalık PDF önizleme + maille gönder — admin `reports-panel.tsx`; öğrenme raporu (red nedenleri / onaylı profil istatistikleri) buraya sekme olarak
- [x] Sidebar "İşletme Yönetimi" ve "Raporlar" stub'larını bağla

**3.5 Tamamlayıcılar:**
- [x] Bildirimler: topbar zil (unread badge) + `/bildirimler` listesi (endpoint'ler hazır)
- [x] Karar Vericiler: `promote-crm` butonunu user ucuna bağla; owner-scope regresyon testi
- [x] Amazon: admin'deki `rescore` ve `bulk-scores` paritesini kontrol et
- [x] Fuar Günü saha paneli (`fair-day`) — mobil öncelikli, düşük öncelik

### FAZ 4 — Sertleştirme ve Ölçek

- [x] **Kalıcı mail kuyruğu:** `runInBackground` + `setTimeout` yerine Redis/BullMQ (redis plugin mevcut, BullMQ eklenecek); retry + persistence; süreç yeniden başlasa da gönderim devam eder
- [x] **Per-user gönderen kimliği:** kullanıcı başına SMTP/from ayarı (profil ayarlarına "Gönderici Ayarları" bölümü) + per-user rate limit/kota
- [x] **Workspace kullanıcı yönetimi:** tenant-admin rolündeki kullanıcı kendi workspace'ine üye davet edebilsin ("Kullanıcılar" stub'ı); ekip görünümü (owner IN team) opsiyonu
- [x] E2E owner-izolasyon testi: iki kullanıcı, aynı tenant — birbirinin lead/kampanya/CRM verisini göremez (otomatik test)
- [x] `isSuperAdmin` bypass'ının user-uçlarında veri sızdırmadığını test et
- [x] Deploy: gzltek + tarvista ortamlarında `db:seed:*:fresh` planı (Avrasya verisi için owner backfill script'i — mevcut kayıtlar admin'e atanır) — bkz. `docs/crm/DEPLOY_FRESH_SEED_OWNER_BACKFILL.md`, `backend/src/scripts/backfill-owner-user.ts`

---

## 5. Öncelik ve Bağımlılık Grafiği

```
FAZ 0 (şema + guard + auth tekilleştirme)   ← her şeyin blokeri
  └─ FAZ 1 (user-scoped API)
       └─ FAZ 2 (frontend ortak altyapı: tablo v2, tipler, polling)
            ├─ 3.1 Mail Yönetimi        (hızlı kazanım: lists uçları hazır)
            ├─ 3.2 Firma Bulucu         (en büyük kalem: candidates paneli)
            ├─ 3.3 CRM CRUD             (backend en hazır, UI işi çok)
            ├─ 3.4 İşletme Yönetimi
            └─ 3.5 Tamamlayıcılar
                 └─ FAZ 4 (queue, per-user SMTP, ekip, testler)
```

**Önerilen sprint sırası:** Faz 0+1 birlikte (backend ağırlıklı) → Faz 2 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → Faz 4.
**Hızlı kazanımlar (Faz 0 sonrası hemen):** Toplu Liste UI'ı (endpoint'ler frontend'de zaten tanımlı), `kontaklar` sayfası, dashboard mock temizliği, bildirim zili.

---

## 6. Riskler ve Notlar

1. **Veri backfill:** `owner_user_id` NULL olan mevcut kayıtlar (Avrasya tenant'ı) user-uçlarında görünmez olur → fresh seed öncesi backfill script'i şart (tüm mevcut kayıtları tenant'ın admin kullanıcısına ata).
2. **UNIQUE constraint değişikliği** dedup davranışını değiştirir: aynı firma farklı kullanıcılarca ayrı kayıt olarak tutulur → şirket havuzu maliyeti artar; kabul edilen trade-off (kişi bazlılığın doğal sonucu). Alternatif: havuz paylaşımlı kalır, sadece review/outreach owner-scoped olur — Faz 1'de karar netleştirilecek.
3. **In-process job'lar** çok kullanıcıda çakışabilir (aynı anda N tarama) → Faz 1'de basit eşzamanlılık limiti, Faz 4'te gerçek queue.
4. **Tip kopyası riski:** admin'deki 1488 satırlık inline tipler frontend'e kopyalanırsa çatallanır → Faz 2'deki paylaşımlı tip katmanı zorunlu tutulmalı.
5. **`email-marketing` guard eksikliği** şu an canlıda da geçerli (leads yetkisiyle toplu mail atılabiliyor) — Faz 0'da kapatılmalı, canlıya öncelikli deploy.
6. **DB şema değişiklikleri** yalnızca seed SQL üzerinden (ALTER yasak — CLAUDE.md kuralı); VPS'lerde fresh deploy penceresi planlanmalı.
