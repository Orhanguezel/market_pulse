# Market Pulse — Marka-Bağımsız / Tenant Dönüşüm Checklist'i

**Tarih:** 2026-06-02
**Hazırlayan:** Claude Code (mimar) — uygulama Codex ile
**Kaynak rapor:** [MARKET_PULSE_SAAS_MULTITENANT_RAPORU.md](./MARKET_PULSE_SAAS_MULTITENANT_RAPORU.md)
**Durum:** Uygulamaya hazır blueprint. Her madde Codex'in tek seferde alabileceği iş birimidir.

---

## 0. Onaylanmış Mimari Kararlar (bu checklist bunlara göre yazıldı)

| Karar | Seçim | Sonuç |
|---|---|---|
| İzolasyon modeli | **Deploy-başına TEK aktif tenant + marka-bağımsız config katmanı** | Full SaaS makinesi (tenant_members + her sorguda zorunlu filtre middleware) YOK. Bunun yerine: her tabloya `tenant_key`, deploy başına `TENANT_KEY` env ile tek aktif tenant. |
| Klasik SaaS mi? | **Hayır** | Her server kendi projesine göre uyarlanır. Çok-tenant'a büyüme kapısı açık ama zorunlu değil. |
| Deploy topolojisi | **Her deploy kendi `market_pulse_db`'si** | `market.tarvista.com` ayrı DB; `panel.avrasyaotomotiv.net/market` ayrı DB. Ortak DB / split-brain yok. |
| ERP entegrasyonu (paspas) | **Opsiyonel adapter, tenant config'e bağlı** | `paspas.*` dosyaları `external-erp` soyutlamasına taşınır; tablo adları config'ten. Avrasya'da açık, tarvista'da kapalı. |
| **Mevcut Avrasya yapısı** | **BOZULMAYACAK — en sıkı kısıt** | Tüm şema değişiklikleri additive. Canlı Avrasya DB'sinde DROP yok. Mevcut satırlar `avrasya` tenant'ına backfill. |

### 0.1 EN ÖST KURAL — Şema değişikliği iki yollu

CLAUDE.md "lokal'de ALTER yasak, `db:seed:fresh`" kuralı **lokal/yeni deploy** içindir. Ama canlı Avrasya'da veri var ve **bozulmayacak**. Bu yüzden her şema değişikliği İKİ yere birden yansır ve ikisi aynı son şemaya yakınsar:

1. **Lokal & yeni deploy (tarvista):** ilgili `0XX_*_schema.sql` `CREATE TABLE` tanımına kolonu doğrudan ekle → `bun run build && bun run db:seed`. (Fresh, DROP'lu.)
2. **Canlı Avrasya (veri korunur):** ayrı, **idempotent, additive-only** forward-migration runner ile `ADD COLUMN IF NOT EXISTS tenant_key ... ` + backfill. DROP/TRUNCATE asla. (Bkz. Faz 2.4.)

> Codex notu: Bir şema PR'ı, hem seed CREATE TABLE'ı hem de forward-migration adımını içermeden "tamam" sayılmaz. İkisi aynı son hâli üretmeli.

---

## 1. Hedef Tenant Anahtarları

| tenant_key | Proje | Deploy | locale | ERP |
|---|---|---|---|---|
| `avrasya` | Avrasya Otomotiv | `panel.avrasyaotomotiv.net/market` (basePath=`/market`), ayrı DB | tr | promat ERP açık |
| `tarvista` | TarVista / Tarım | `market.tarvista.com`, ayrı DB | tr | ERP yok (kapalı) |

> `tenant_key` kısa, kebab/lowercase, immutable. İleride `bereketfide` vb. ayrı tenant olabilir; şimdilik iki anahtar.

---

## FAZ 0 — Hazırlık & Güvenlik Ağı

- [x] **0.1** Bu checklist + kaynak rapor gözden geçirildi, kararlar (Bölüm 0) teyitli.
- [ ] **0.2** Avrasya canlı DB'sinin **tam yedeği** alındı (mysqldump). Migration öncesi zorunlu. Yedek olmadan hiçbir migration çalıştırılmaz.
- [x] **0.3** `git` üzerinde `feat/tenant-config-core` branch açıldı (main'e doğrudan commit yok).
- [ ] **0.4** Mevcut davranışın "altın çıktı" snapshot'ı alındı: birkaç kritik endpoint'in (lead listesi, icp, market targets) mevcut JSON yanıtı kaydedildi → regresyon karşılaştırması için.

---

## FAZ 1 — Tenant Config Çekirdeği (kod tarafı, şema henüz değil)

Amaç: "aktif tenant" kavramını koda sok, ama henüz iş tablolarına dokunma. İzole, düşük riskli adım.

- [x] **1.1 Yeni seed: `026_tenancy_schema.sql`** (CREATE TABLE, ALTER yok)
  - `tenants(tenant_key PK, name, locale, status, plan, created_at, updated_at)`
  - `tenant_settings(tenant_key, key, value_json, PRIMARY KEY(tenant_key,key))` — ICP defaultları, fuar/dizin kaynakları, branding, external_erp config (host/db/tablo adları), feature flag'ler (erp_sync_enabled vb.)
  - `tenant_secrets(tenant_key, key, value_encrypted, PRIMARY KEY(tenant_key,key))` — Apollo/Keepa/scraper token/SMTP; `DB_ENCRYPTION_KEY` ile at-rest şifreli (alan zaten `env.DB_ENCRYPTION_KEY` mevcut, [env.ts:98](../../backend/src/core/env.ts#L98)).
  - Seed içeriği: `avrasya` ve `tarvista` satırları + default settings.
  - **Branch-marker yok** — seed nötr; marka verisi tenant_settings'te.

- [x] **1.2 `env.ts`: `TENANT_KEY` (aktif tenant) ekle.** [backend/src/core/env.ts](../../backend/src/core/env.ts)
  - `TENANT_KEY: process.env.TENANT_KEY ?? 'avrasya'` (default avrasya — mevcut deploy bozulmasın).
  - `EXTERNAL_DB.PASPAS` bloğunu (satır 56-64) bırak ama **deprecated** işaretle; gerçek kaynak artık `tenant_settings.external_erp` olacak (Faz 3'te taşınır).

- [x] **1.3 Tenant context helper:** `backend/src/core/tenant.ts` (yeni)
  - `getActiveTenant(): { key, settings, ... }` — `env.TENANT_KEY`'i okur, `tenants` + `tenant_settings`'i cache'ler.
  - `getTenantSetting(key, fallback)` ve `getTenantSecret(key)` (decrypt) helper'ları.
  - Tek aktif tenant olduğu için request-scoped middleware ŞART DEĞİL; modül başlangıcında resolve edilen singleton yeterli. (Çok-tenant'a geçilirse burası `req.tenantKey`'e döner — sınır net.)

- [x] **1.4 Birim testi:** `getActiveTenant` env'den doğru tenant'ı çözüyor, eksik tenant'ta net hata veriyor.

**Faz 1 kabul:** Tamamlandı. Backend smoke geçti (`/api/health`, login, ICP listesi), `026` seed dahil tam `db:seed` akışı geçti, tenant testleri yeşil.

---

## FAZ 2 — İş Tablolarına `tenant_key` (additive, veri korunur)

EN KRİTİK FAZ. Mevcut Avrasya verisi bozulmadan tüm iş tablolarına tenant boyutu eklenir.

### 2.1 Kapsam — tenant_key eklenecek tablolar
Kanıtlanmış iş tabloları (rapor + keşif):
- `016_market_pulse_schema.sql`: market_targets, market_leads, market_signals, market_developer_notes, market_test_runs
- `018_lead_machine_schema.sql`: icp_profiles, lead_search_jobs, lead_candidates, lead_amazon_listings, lead_amazon_risks, lead_b2b_directory, lead_fair_in_person, lead_scoring_history
- `020_market_operations_schema.sql`: market_operations
- `021_amazon_scoring_schema.sql`: amazon_review_snapshots, amazon_keyword_positions
- `022_public_saas_schema.sql`: user_plans, user_scan_usage → (kota; Faz 3'te tenant'a)
- `025_outreach_campaigns_schema.sql`: outreach_campaigns
- `023_byok_keepa_schema.sql`: user_keepa_keys → tenant_secrets'e taşınacak (Faz 3), şimdilik tenant_key ekle

> `001_auth`, `004_site_settings`, `012-015` (tema/menü/bildirim) tenant_key ALMAZ (global/deploy-seviyesi) — aksi kanıtlanmadıkça. Codex her tabloyu eklemeden önce "bu veri tenant'a mı ait?" sorusunu cevaplar.

- [x] **2.2** Her CREATE TABLE seed'ine (yukarıdaki liste) ekle:
  - `tenant_key VARCHAR(64) NOT NULL DEFAULT 'avrasya'`
  - `INDEX idx_<tbl>_tenant (tenant_key)`
  - Mevcut `UNIQUE` kısıtları varsa → `UNIQUE(tenant_key, ...)` olacak şekilde genişlet (örn. icp name benzersizliği tenant başına).
  - DEFAULT `'avrasya'` geçici güvenlik ağıdır; Faz 3 sonunda kod her zaman açık `tenant_key` yazacak.

- [x] **2.3 Lokal/tarvista yolu:** `bun run build && bun run db:seed` → fresh şema doğrulanır.
  - 2026-06-02: `cd backend && bun run build` ve `bun run db:seed` geçti.

- [x] **2.4 Canlı Avrasya yolu — idempotent forward-migration runner** (yeni: `backend/src/db/migrate/` + `db:migrate` script)
  - Her tablo için: `ALTER TABLE x ADD COLUMN IF NOT EXISTS tenant_key VARCHAR(64) NOT NULL DEFAULT 'avrasya'` + index ekle (varsa atla).
  - Backfill: tüm mevcut satırlar zaten DEFAULT ile `avrasya` alır → ekstra UPDATE gerekmez.
  - **Idempotent:** ikinci çalıştırmada hata vermez (IF NOT EXISTS / information_schema kontrolü).
  - DROP/TRUNCATE içermez. `assertSafeToDrop` benzeri guard: migration runner DROP statement'ı reddeder.
  - package.json: `"db:migrate": "bun src/db/migrate/index.ts"` ekle.
  - 2026-06-02: additive-only `db:migrate` eklendi ve idempotent çalıştı. DROP/TRUNCATE guard mevcut. Not: canlı unique index dönüşümleri additive runner'da DROP gerektirmediği için yapılmıyor; ihtiyaç olursa yedek sonrası ayrı onaylı migration işi.

- [ ] **2.5 Repo katmanı — tenant scoping (iki pattern var, dikkat):** _(devam ediyor; ana market/lead/public/amazon raw ve Drizzle akışları tenant-aware yapıldı, full test expectation bakımı ve grep guard kaldı)_
  - **Raw `pool.execute()` repo'ları** (örn. [icp.repository.ts](../../backend/src/modules/lead-machine/icp/icp.repository.ts), campaign.repository.ts): her SELECT/INSERT/UPDATE/DELETE'e `tenant_key = ?` ekle. INSERT'lere `tenant_key` kolonu+değeri ekle. Değer `getActiveTenant().key`'ten gelir.
  - **Drizzle repo'ları** (market modülü, [schema.ts](../../backend/src/modules/market/schema.ts)): `withTenant(qb)` sarmalayıcı + schema'lara `tenant_key` kolonu.
  - Ortak helper: `backend/src/modules/_shared/tenant-scope.ts` → `tenantWhere()` (raw için fragment), `withTenant()` (drizzle için). [repo-helpers.ts](../../backend/src/modules/_shared/repo-helpers.ts) yanına.

- [ ] **2.6 Cross-tenant izolasyon testi:** `__tests__/tenant-isolation.test.ts`
  - İki tenant seed'le, A'nın yarattığı icp/lead/target'ı B sorgusu **görmemeli**.
  - CI'da zorunlu (regresyon kapısı).

- [ ] **2.7 Review kuralı / lint:** çıplak `pool.execute('SELECT ... FROM <iş_tablosu>')` (tenant_key'siz) ve `db.select().from(<businessTable>)` (withTenant'sız) yasak. En az grep-tabanlı bir CI guard veya PR-review checklist maddesi.

**Faz 2 kabul:** Avrasya migration sonrası tüm mevcut satırlar `tenant_key='avrasya'`, mevcut endpoint çıktıları snapshot 0.4 ile birebir. İzolasyon testi yeşil.

---

## FAZ 3 — Config & Marka-Bağımsızlık (de-branding)

Amaç: "paspas/promat" sertleşmelerini sök, tenant config'e taşı.

- [ ] **3.1 External ERP adapter soyutlaması.** `backend/src/modules/market/external/`
  - Mevcut `paspas.repository.ts`, `paspas.schema.ts`, `paspas.sync.ts` → `external-erp/` altına generic adapter:
    - `ErpAdapter` arayüzü: `getActiveCustomers()`, `getCustomerOrders(id)` vb.
    - `PromatErpAdapter` (eski paspas mantığı) — tablo adları (`musteriler`, `urunler`, `satis_siparisleri`) ve bağlantı **`tenant_settings.external_erp`'ten** okunur, env'den/hardcode değil.
    - Tenant'ta `external_erp.enabled=false` ise sync/churn no-op döner (tarvista).
  - `marketTargets.paspas_customer_id` → `external_customer_id` olarak yeniden adlandır (migration + seed; geriye dönük takma ad kabul edilebilir). Avrasya verisi korunur.

- [ ] **3.2 Route'lar marka-bağımsız.** [market/router.ts](../../backend/src/modules/market/router.ts)
  - `/market/sync-paspas` → `/market/erp/sync`; `/market/external/paspas/*` → `/market/external/erp/*`.
  - Eski yolları geçici 301/alias bırak (admin_panel kırılmasın) veya admin endpoint'leriyle aynı PR'da güncelle ([market_admin.endpoints.ts](../../admin_panel/src/integrations/endpoints/admin/market_admin.endpoints.ts)).

- [ ] **3.3 `019_promat_initial_market_targets.sql` nötrleştir.**
  - Default seed'den çıkar → tenant onboarding script'ine (`scripts/onboard-tenant.ts`) taşı. `avrasya` onboarding'inde çalışır, `tarvista`'da çalışmaz.

- [ ] **3.4 Branding & ICP defaultları → tenant_settings.**
  - APP_NAME, login başlık/quote, locale, fuar/dizin kaynakları (Automechanika vs. Growtech/Fruit Logistica), ICP default profili → `tenant_settings`.
  - admin_panel `DEFAULT_BRANDING` ([app-config.ts](../../admin_panel/src/config/app-config.ts)) fallback kalır; gerçek değerler API'den tenant'a göre gelir.

- [ ] **3.5 BYOK / sırlar → tenant_secrets.**
  - `023_byok_keepa` (user_keepa_keys) mantığını tenant_secrets'e genişlet: Keepa, Apollo, scraper token, SMTP per-tenant şifreli.
  - `env.ts`'teki global key'ler (KEEPA/APOLLO/SCRAPER) **fallback** olur; öncelik tenant_secrets.

- [ ] **3.6 Kota tenant'a.**
  - `user_plans`/`user_scan_usage` → tenant boyutu (zaten tenant_key eklendi Faz 2). Plan/limit `tenants.plan`'a göre. Avrasya & tarvista iç kullanım = `agency`/`pro` (sınırsıza yakın).
  - Scan/lead/outreach guard tenant kotasına bakar.

**Faz 3 kabul:** Kod tabanında "paspas/promat" yalnızca PromatErpAdapter içinde ve tenant_settings verisinde kalır. `grep -ri paspas backend/src/modules` → sadece adapter dosyaları. tarvista deploy'unda ERP kapalı, hata yok.

---

## FAZ 4 — scraper-service tenant farkındalığı

- [ ] **4.1** `scraper-{project}-{suffix}` key pattern'i zaten "project" taşıyor ([auth.py](../../services/scraper-service/src/auth.py)) → `project` = `tenant_key` map'le. Her tenant kendi scraper token'ını `tenant_secrets`'te tutar.
- [ ] **4.2** Job payload'ına `tenant_key` ekle ([routes/jobs.py](../../services/scraper-service/src/routes/jobs.py)); loglar/rate-limit/kota tenant başına (`lib/quota.py`, `lib/ratelimit.py`).
- [ ] **4.3** Callback webhook imzası (`SCRAPER_CALLBACK_SECRET`) tenant bağlamı taşır; backend callback'i doğru tenant'a yazar.
- [ ] **4.4** scraper-service çok deploy'da paylaşılıyorsa (`scraper.guezelwebdesign.com`) tenant token izolasyonu yeterli; ayrı kurulacaksa not düş.

---

## FAZ 5 — Risk & Uyum

- [ ] **5.1 KVKK/GDPR:** scrape edilen kişi/mail = kişisel veri. Tenant başına saklama süresi, silme/opt-out, aydınlatma; mail outreach'te abonelikten çıkma. (Avrasya & tarvista ayrı veri sorumlusu.)
- [ ] **5.2 Scraping ToS:** resmi API önceliği (Messe Frankfurt gibi), rate-limit, robots, circuit-breaker; bir kaynak düşerse diğerleri etkilenmez.
- [ ] **5.3 Sır şifreleme:** tenant_secrets at-rest şifreli; `DB_ENCRYPTION_KEY` deploy başına farklı, env'de müşteri sırrı tutma.
- [ ] **5.4 İzolasyon güvencesi:** Faz 2.6 testi CI'da; her yeni iş tablosu için tenant_key zorunlu (PR şablonuna madde).

---

## FAZ 6 — Tarım (tarvista) Tenant + PoC

- [ ] **6.1** `scripts/onboard-tenant.ts tarvista` → tenants + tenant_settings (agri ICP: tohum/fide; fuar kaynakları: Growtech Antalya / Fruit Logistica / EIMA; dizinler: Eurofruit, Europages agri).
- [ ] **6.2** tenant_members yerine: Orhan = deploy admin (`AUTH_ADMIN_EMAILS`). ERP kapalı.
- [ ] **6.3** PoC: bir agri fuarı exhibitor taraması + Yüksel/MAY web/ihracat ayak izi → tek rapor.
- [ ] **6.4 Sosyal köprü sınırı:** sosyal sinyal = ekosistem-sosyal-medya; fuar/B2B/lead = market_pulse. Kod tekrarı yok.

---

## FAZ 7 — Deploy (per-server, ayrı DB)

### 7.1 market.tarvista.com
- [ ] DNS: `market.tarvista.com` → ilgili VPS.
- [ ] Kendi `market_pulse_db` (boş, fresh seed + `onboard-tenant tarvista`).
- [ ] env: `TENANT_KEY=tarvista`, `NEXT_PUBLIC_BASE_PATH=` (boş — kök domain), ERP env yok.
- [ ] backend + scraper (Docker) + MySQL + Next.js (frontend/admin) + Nginx + SSL.

### 7.2 panel.avrasyaotomotiv.net/market
- [ ] **Mevcut yapı bozulmadan:** önce yedek (0.2), sonra `db:migrate` (Faz 2.4) canlı DB'de → tenant_key eklenir, veri kalır.
- [ ] env: `TENANT_KEY=avrasya`, `NEXT_PUBLIC_BASE_PATH=/market` (frontend zaten destekliyor, [next.config.js:28](../../frontend/next.config.js#L28)).
- [ ] Nginx: `/market` location → market_pulse backend/frontend; Avrasya'nın mevcut panel route'larına dokunma.
- [ ] ERP: `tenant_settings.external_erp` = promat ERP bağlantısı (eski `EXTERNAL_DB_PASPAS` değerleri buraya).
- [ ] Smoke test: migration sonrası tüm eski lead/icp/target erişilebilir (snapshot 0.4 karşılaştırması).

---

## Bağımlılık Sırası (Codex için)

```
Faz 0 (yedek + branch)  →  Faz 1 (config çekirdeği)  →  Faz 2 (tenant_key + izolasyon)
                                                              │
                          Faz 3 (de-brand/config)  ←──────────┘
                                    │
                          Faz 4 (scraper)  +  Faz 5 (uyum)
                                    │
                          Faz 6 (tarvista onboarding)  →  Faz 7 (deploy)
```

- Faz 1 ve Faz 2 sıralı (config olmadan scoping yazılmaz).
- Faz 3/4/5 Faz 2'den sonra paralel ilerleyebilir.
- Avrasya deploy'u (7.2) yalnızca Faz 2 + yedek tamamsa yapılır.

## Her PR'ın Geçmesi Gereken Kapı (Definition of Done)
1. Lokal `db:seed` (fresh) + Avrasya `db:migrate` (additive) ikisi de aynı şemayı üretir.
2. Cross-tenant izolasyon testi yeşil.
3. Snapshot 0.4 regresyon: mevcut Avrasya endpoint çıktıları değişmedi.
4. `grep -ri paspas backend/src/modules` Faz 3 sonrası sadece adapter'da.
5. DROP/TRUNCATE içeren migration yok.
