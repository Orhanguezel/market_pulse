# CODEX GÖREVİ — Modüler SaaS Entitlement + CRM Modülü

> **Rol:** Bu görev Codex içindir (implementasyon). Mimari kararlar Claude tarafından
> verildi; bu dosya bağlayıcı brief'tir.
> **Kaynak dokümanlar (OKU):**
> - `docs/teknik/MODULER_SAAS_MIMARI.md` — entitlement mimarisi (Faz A)
> - `docs/crm/MVP_PLAN.md` — CRM modülü tasarımı (Faz B)
> **Sınır:** `frontend/` klasörüne **DOKUNMA** — orayı Claude paralelde işletmeniyönet
> tasarımına taşıyor. Sen sadece `backend/` ve `admin_panel/` üzerinde çalış.

---

## 0. Bağlam ve ön koşullar

- market_pulse, **modül modül satılan çok-kiracılı CRM SaaS**'a dönüşüyor. Odoo
  klonlanmıyor; modüller aşama aşama ekleniyor. İlk satılan modül `leads` (mevcut),
  ardından `crm`.
- **Faz 0 (tenant JWT izolasyonu) TAMAMLANDI** (commit 905fe5c). tenantContext JWT'ye
  bağlı; cross-tenant → 403. Bunu BOZMA; yeni tüm sorgular aynı `tenant_key` kaynağını
  (JWT/ALS, `getActiveTenantKey`/`getRequiredTenantKey`) kullanmalı.
- İş verisi zaten tenant-scoped. Yeni tablolar da `tenant_key` taşımalı.

## Konvansiyonlar (ZORUNLU)

- **DB:** Şema değişikliği SADECE yeni `src/db/seed/sql/0XX_*.sql` dosyasına `CREATE TABLE`
  ile eklenir. **`ALTER TABLE` YASAK.** `bun run build && bun run db:seed:*:fresh` ile uygula.
- Kolonlar: `id char(36)`, `tenant_key varchar(64) NOT NULL`, `created_at/updated_at datetime`,
  index `idx_<tablo>_<kolon>`, `ENGINE=InnoDB ... utf8mb4_unicode_ci`. JSON esnek alanlar.
- Modül pattern'i mevcut `backend/src/modules/lead-machine/` (router/controller/service) ile aynı.
- Her route tenant'ı **JWT'den** çözer; istemciden gelen tenant_key'e güvenme.
- Bitince: `bun run typecheck` + backend testleri + admin testleri YEŞİL olmalı.
- Commit mesajları Türkçe, mevcut stil (`feat(...)`, `fix(...)`).

---

## FAZ A — Entitlement (modül yetkilendirme) katmanı

**Amaç:** Para kazanmanın temeli. Her tenant'ta bağımsız modüller aktif/pasif.

### A1. Şema — `src/db/seed/sql/032_module_entitlements_schema.sql`
`docs/teknik/MODULER_SAAS_MIMARI.md` §2'deki iki tablo:
- `module_catalog` (module_key PK varchar, name, description, category, base_price decimal(10,2),
  currency varchar(3) DEFAULT 'USD', billing_period enum('monthly','yearly'), is_active tinyint,
  sort int, created_at, updated_at) — **platform seviyesi, tenant_key YOK**.
- `tenant_modules` (id char(36) PK, tenant_key, module_key, status enum('trial','active','suspended','cancelled')
  DEFAULT 'trial', price_snapshot decimal(10,2), currency varchar(3), activated_at datetime,
  expires_at datetime NULL, config json NULL, created_at, updated_at;
  UNIQUE(tenant_key, module_key); idx tenant/module/status).
- **Seed:** `module_catalog`'a başlangıç satırları: `leads` (Müşteri Bulma), `crm` (CRM),
  `email-marketing` (E-posta Pazarlama). Mevcut tenant'lar (avrasya, gzltek, tarvista) için
  `tenant_modules`'a `leads` = status 'active' satırı ekle (geriye dönük uyum — bugün çalışan
  lead akışı kapanmasın).

### A2. Backend modülü — `src/modules/entitlements/`
- `service.ts`: `hasModule(tenantKey, moduleKey): Promise<boolean>` (status IN ('trial','active')
  AND (expires_at IS NULL OR expires_at > NOW())). `listTenantModules(tenantKey)`,
  `activateModule(tenantKey, moduleKey, opts)`, `suspendModule(...)`, `listCatalog()`.
- `guard.ts`: Fastify preHandler factory `requireModule(moduleKey)` → yetki yoksa
  `402 { error: 'MODULE_NOT_ENTITLED', module: moduleKey }`. super-admin bypass (mevcut isSuperAdmin).
- `router.ts`: admin uçları —
  - `GET  /entitlements/catalog` (katalog)
  - `GET  /entitlements/tenant/:tenantKey` (o tenant'ın modülleri)
  - `POST /entitlements/tenant/:tenantKey/activate` { module_key, status?, expires_at? }
  - `POST /entitlements/tenant/:tenantKey/suspend` { module_key }
  Bu uçlar yalnız super-admin/agency erişimli.

### A3. Mevcut `leads` route'larını kapıya al
- `backend/src/modules/lead-machine/router.ts` (ve customs lead uçları) başına
  `requireModule('leads')` preHandler ekle. super-admin bypass korunur. Mevcut testler
  geçmeli (gerekirse test setup'ına aktif `leads` entitlement seed'le).

### A4. Admin panel — "Modüller" sayfası
- `admin_panel/.../admin/(admin)/modules/` (veya mevcut tenants sayfasının altında sekme):
  katalog listesi + seçili tenant için aç/kapat/durum (trial/active/suspended), expires_at.
- Mevcut RTK Query baseApi + X-Tenant header pattern'i kullan. Tenant seçimi mevcut switcher'dan.

### FAZ A kabul kriterleri
- [x] `032_*` seed dosyası eklendi; katalog ve `leads` tenant seed satırları var. `db:seed:fresh` henüz yerel DB üzerinde koşturulmadı.
- [x] `requireModule('leads')` aktif; entitlement'sız tenant 402 alıyor; super-admin geçiyor (`entitlements.test.ts`).
- [x] Admin "Modüller" sayfasından bir tenant'a modül açıp kapatılabiliyor (`/admin/modules`, RTK entitlements endpointleri).
- [x] typecheck + backend + admin testleri yeşil. Backend: [x] `bun run build`, [x] `bun run tenant:guard`, [x] `bun test` (229 test). Admin: [x] `bun run typecheck`, [x] `bun test` (19 test).

---

## FAZ B — CRM modülü

**Amaç:** İkinci satılan modül. Tasarım: `docs/crm/MVP_PLAN.md` (bağlayıcı).

### B1. Şema — `src/db/seed/sql/031_crm_schema.sql`
`MVP_PLAN.md` §4'teki tablolar: `crm_accounts`, `crm_contacts`, `crm_pipelines`,
`crm_stages`, `crm_deals`, `crm_activities`. Hepsi `tenant_key`'li, index'li.
Yeni tenant onboard'ında varsayılan bir pipeline + stage seti oluşturulmalı
(seed helper veya onboard akışına ekle).

### B2. Backend modülü — `src/modules/crm/`
`MVP_PLAN.md` §5: `router.ts`, `controller.ts`, `accounts.service.ts`, `contacts.service.ts`,
`deals.service.ts`, `activities.service.ts`, `pipelines.service.ts`, `convert.service.ts`, `schema.ts`.
- Tüm route'lar `requireModule('crm')` arkasında.
- `convert.service.ts`: onaylı `lead_candidates` → `crm_accounts` + `crm_contacts` + `crm_deals`
  (kaynak izi `source_lead_id`). Tüm yazımlar tenant-scoped.
- E-posta gönderimi mevcut `outreach`/`mail` modülünü çağırır (yeniden yazma yok).

### B3. Admin panel — CRM
`MVP_PLAN.md` §6: `admin/(admin)/crm/` altında `pipeline/` (kanban, sürükle-bırak),
`deals/[id]/` (detay + aktivite zaman çizelgesi), `accounts/`, `contacts/`.
Menüye "CRM" girdisi; sadece `crm` modülü aktif tenant'ta görünür (entitlement'a göre filtre).

### FAZ B kabul kriterleri
- [x] `031_*` CRM şema seed dosyası eklendi; varsayılan pipeline/stage seed'i var. `db:seed:fresh` henüz yerel DB üzerinde koşturulmadı.
- [x] `requireModule('crm')` ile backend route kapısı çalışıyor (`registerCrmAdmin`).
- [x] lead → account+contact+deal dönüşümü tenant-scoped çalışıyor (`crm.service.test.ts`).
- [x] Kanban'da deal stage taşınıyor; aktivite eklenip tamamlanabiliyor (`/admin/crm/pipeline`).
- [x] typecheck + backend + admin testleri yeşil. Backend: [x] `bun run build`, [x] `bun run tenant:guard`, [x] `bun test` (229 test). Admin: [x] `bun run typecheck`, [x] `bun test` (19 test).

---

## Koordinasyon
- **`frontend/` Claude'da** — açma. Çakışma riskli ortak dosya (örn. shared types) varsa
  commit mesajında belirt.
- Sıra: **Faz A → Faz B.** Faz A bitmeden Faz B'ye geçme (CRM, entitlement guard'ına bağımlı).
- Şema dosya numaraları: entitlement 032, CRM 031 — ikisi de yeni; mevcut 030'dan sonra.
