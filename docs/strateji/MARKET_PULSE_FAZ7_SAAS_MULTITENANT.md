# Market Pulse — Faz 7: SaaS Çok-Tenant (sosyal medya pattern'i)

**Tarih:** 2026-06-05
**Hazırlayan:** Claude Code (mimar)
**Referans pattern:** ekosistem-sosyal-medya (`social_projects`, `tenant_user_roles`, `site_settings`, `?tenantKey=` + switcher)
**Önkoşul:** Faz 3 (paspas de-brand) tamamlanmalı — Codex'te. Faz 7 onun üstüne kurulur.

## 0. Onaylanmış kararlar (2026-06-05, Orhan)
- **Runtime tenant:** birebir sosyal medya — `?tenantKey=` query (+ `X-Tenant` header) + frontend localStorage + sidebar switcher. **Backend üyelik doğrulaması YOK** (sosyal repo gibi). `tenant_user_roles` tablosu yine kurulur (yönetim UI + ileride doğrulama açma imkânı).
- **Deploy modeli:** market.tarvista.com = **merkezi çok-tenant SaaS** (vistaseeds + bereketfide + tarvista + default, tek DB, tenant_key ile ayrışır). **Avrasya AYRI deploy + ayrı paspas DB** olarak kalır (bozulmaz). Önceki "deploy-başına-tek-tenant" kararı bu merkezi kurulum için değişir; avrasya deploy'u env-kilitli tek-tenant kalabilir.

## 1. Mevcut temel (Faz 1/2 — hazır)
- `tenants`, `tenant_settings`, `tenant_secrets` tabloları
- Tüm iş tablolarında `tenant_key` (DEFAULT 'avrasya'), izolasyon testi, guard
- `getActiveTenantKey()` (env.TENANT_KEY) — repolar bunu çağırıyor

## 2. Eklenecekler

### 2.1 Şema — yeni seed `027_saas_multitenant_schema.sql` (CREATE TABLE)
- `tenant_user_roles(id CHAR(36) PK, user_id CHAR(36), tenant_key VARCHAR(64), role ENUM('tenant_admin','tenant_editor') NOT NULL DEFAULT 'tenant_editor', created_at, UNIQUE(user_id, tenant_key), INDEX(tenant_key))`
- `platform_settings(id CHAR(36) PK, \`key\` VARCHAR(128), locale VARCHAR(8) NOT NULL DEFAULT '*', value JSON/TEXT, created_at, updated_at, UNIQUE(\`key\`, locale))` — **global/tenant-agnostic** (super-admin yönetir).
- `tenants` tablosuna seed satırları: `vistaseeds`, `bereketfide`, `default` (+ mevcut tarvista, avrasya). Her biri için `tenant_settings.branding` (appName, displayName, logo, sector).

### 2.2 Runtime tenant context (KİLİT REFACTOR — minimum churn)
- Yeni `backend/src/core/tenant-context.ts`: Node `AsyncLocalStorage` ile `runWithTenant(key, fn)` + `getRequestTenantKey()`.
- Fastify `onRequest` hook (`backend/src/plugins/tenantContext.ts`): tenant'ı şu sırayla çöz → `?tenantKey=` query → `X-Tenant` header → `env.TENANT_KEY` (kilitli deploy) → `'default'`. ALS'e yaz.
- `tenant-scope.ts → getActiveTenantKey()`: önce ALS'ten (`getRequestTenantKey()`), yoksa `env.TENANT_KEY`. **Böylece Faz 2 repoları DEĞİŞMEDEN runtime'a geçer.**
- `core/tenant.ts → getActiveTenant()`: singleton yerine **key-başına Map cache** (her tenant'ın settings'i ayrı cache'lenir); aktif key request'ten gelir.

### 2.3 Tenant yönetim API — yeni modül `backend/src/modules/tenants/`
- `GET /api/v1/tenants` → aktif tenant listesi (key, name, branding) — switcher için.
- `GET /api/v1/tenants/:key` → tek tenant.
- `POST /api/v1/tenants/admin/onboard` (super-admin) → yeni tenant + tenant_settings.
- `PATCH /api/v1/tenants/admin/:key/profile` → branding/settings güncelle.
- `GET/POST /api/v1/tenants/admin/:key/roles` → tenant_user_roles ata/listele.

### 2.4 Global ayarlar API — yeni modül `backend/src/modules/platform-settings/`
- `GET /api/v1/platform-settings` → global config (locale).
- `POST /api/v1/admin/platform-settings` (super-admin) → yaz.

### 2.5 Admin panel
- **Tenant switcher** (sidebar select): tenant listesi `/tenants`'tan; seçilen `market-tenant-key` localStorage'a; API client her isteğe `X-Tenant` header (veya `?tenantKey=`) ekler; değişince reload.
- **Tenant yönetim sayfası**: liste / onboard / branding düzenle / rol ata.
- **Global ayarlar sayfası**: platform_settings düzenle (super-admin).

### 2.6 Seed tenant'ları & branding — **tenant = sunucudaki ekosistem projesi**
Tenant'lar vps-vistainsaat'taki gerçek projelerdir; her biri **kendi DB'sinden veri çeker**:
| tenant_key | proje | kaynak DB (localhost) |
|---|---|---|
| `vistaseeds` | VistaSeeds (tohum) | `vistaseed` |
| `bereketfide` | Bereket Fide (fide) | `bereketfide` |
| `tarvista` | TarVista | (kendi market_pulse verisi) |
| `default` | platform varsayılan | — |
- **Başlangıç tenant'ları: `vistaseeds` + `bereketfide`** (Orhan onayı). Diğer projeler panelden onboard edilir.
- `avrasya` AYRI deploy'da kalır (paspas DB), bu merkezi DB'de aktif değil.
- **İlk aktif tenant: `vistaseeds`** (deploy default `TENANT_KEY=vistaseeds`).

### 2.7b Per-tenant kaynak DB + **ortak ekosistem adapter** (KEŞİF: ortak şema)
- vistaseed/bereketfide/hal_fiyatlari DB'leri **ortak shared-backend şemasını** paylaşıyor
  (categories, contact_messages, custom_pages, dealer_profiles, email_templates, orders...).
- Dolayısıyla Faz 3'teki `ErpProvider` soyutlamasına **ikinci provider**: `EcosystemSourceProvider`
  (ortak ekosistem şemasından okur). Provider tenant_settings.external_erp.provider ile seçilir:
  * avrasya → `promat` (paspas ERP şeması)
  * vistaseeds/bereketfide/haldefiyat → `ecosystem` (ortak şema)
- Her tenant'ın bağlantısı `tenant_settings.external_db` (host=127.0.0.1, database=vistaseed/bereketfide/...)
  + parola `tenant_secrets` (veya mevcut `external_db_connections`). `external_db.enabled` ile gating.
- **Çekilecek veri (Orhan onayı — firma/bayi/müşteri/iletişim, market_pulse'a ne gerekiyorsa):**
  * `dealer_profiles` → firma/bayi (company_name, city, region, tax_number/tax_office, credit_limit,
    current_balance, discount_rate, is_approved, list_public) → market_target/lead.
  * `contact_messages` → iletişim/talep sinyali.
  * `orders` + `order_items` + `dealer_transactions` → satın-alma/churn sinyali.
  * (gerekirse `users` → bayi kullanıcı bilgisi.)
- DOĞRULANDI: vistaseed ve bereketfide `dealer_profiles` şeması BİREBİR aynı → tek `ecosystem` provider yeter.
  Şema ortak olduğu için tüm ekosistem tenant'larında aynı SQL.
- Bu veriler market_pulse'a tenant_key='vistaseeds'/'bereketfide' ile **kopyalanır/senkronlanır**
  (mevcut paspas.sync mantığının ekosistem hali) — kaynak DB sadece okunur, market_pulse kendi tablolarına yazar.

### 2.7 env
- `TENANT_KEY` artık **default/fallback**: kilitli tek-tenant deploy'da (avrasya) sabitler; merkezi deploy'da request seçer. Merkezi deploy default'u `vistaseeds`.

### 2.8 Login admin-gate (zorunlu)
- Panel = yönetim aracı → **sadece global admin (super-admin) giriş yapabilir**.
- Login handler / `/auth/me`: rolü `admin` olmayanı reddet (403) veya panel girişini engelle.
- Tenant seçimi admin'in yetkisinde; (doğrulamasız okuma kararı tenant verisi içindir, panel girişi yine admin-gated).

## 3. Doğrulama (Codex DoD)
1. `bun run build` + `bun run tenant:guard` + `bun test` geçer.
2. Aynı DB'de iki tenant: `?tenantKey=vistaseeds` ve `?tenantKey=bereketfide` farklı veri döndürür (izolasyon testi runtime-context ile).
3. Switcher'dan tenant değişince panel o tenant'ın verisini gösterir.
4. Global ayarlar tenant'tan bağımsız; platform_settings tüm tenant'larda ortak.
5. Faz 2 repoları (getActiveTenantKey üzerinden) ALS ile çalışır — imza değişmeden.

## 4. Sıra
Faz 3 (Codex, devam ediyor) → Faz 7 (bu doküman). Faz 7 implementasyonu Faz 3 merge'inden sonra başlar; aynı branch `feat/tenant-config-core`.

## 5. Risk notu
Doğrulamasız `?tenantKey` = cross-tenant okuma riski (Orhan kabul etti). `tenant_user_roles` hazır; `getRequestTenantKey` içine üyelik kontrolü eklemek ileride tek noktadan açılabilir.
