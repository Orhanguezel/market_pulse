# Platform Admin — Tenant Yönetimi + Paket/Ödeme-Bazlı Modül Yetkilendirme

> **Tarih:** 2026-07-05 · **Deploy:** gzltek (vps-sultan `187.77.79.59`, root) · **Branch:** `feat/tenant-config-core`
> **Deploy komutu:** `ssh vps-sultan 'bash /var/www/market_pulse/deploy/gzltek/deploy.sh'` (git reset origin + build backend/frontend/admin + seed --no-drop + migrate + tenant guard + pm2 reload). Deploy sonrası tarayıcıda **Ctrl+Shift+R** (chunk cache).
> **Bu dosya YENİ OTURUM için tek kaynak** — aşağıdaki her şey context'i korur.

---

## 0. BU OTURUMDA TAMAMLANANLAR (hepsi gzltek canlıda + doğrulandı)

**Kişi-bazlı veri izolasyonu (owner_user_id):** dashboard/market/ICP/outreach owner-scope; kullanıcılar birbirinin verisini görmez. (commit `1c6a666`)

**KRİTİK userId-context fix:** `requireAuth` preHandler'da `enterUser` handler'a taşınmıyordu → `getRequiredUserId()` null → owner-scoped yazma/okuma 401 (owner izolasyonu da aslında bu yüzden çalışmıyormuş). Çözüm: `backend/src/plugins/tenantContext.ts` onRequest hook'unda JWT payload'u **SENKRON decode** (`decodeJwtSub`, imza doğrulamadan; imza requireAuth'ta) → `enterUser` await'siz. `await req.jwtVerify()` OLMAZ (await sonrası enterWith taşınmıyor). (commit `827603f`) E2e doğrulandı: görev POST 201.

**Gmail entegrasyonu (uçtan uca çalışıyor):** kullanıcı kendi Gmail'ini bağlar/gelen kutusu/gönderir. `backend/src/modules/mail-accounts/` (service/router/controller), `user_mail_accounts` tablosu (037), AES-256-GCM şifreli token (`_shared/crypto.ts`), **ayrı Gmail OAuth client** (`GMAIL_OAUTH_CLIENT_ID/SECRET` env — login'i etkilemez), proje `assistan-501512` (Testing modu, calendar.readonly henüz eklenmedi → Faz 2b senkron için gerekli). Frontend: `mail-yonetimi` "Hesap & Ayarlar" + "Gelen Kutusu" sekmeleri. Yeni üye kaydında admin'e Gmail-test-user hatırlatma maili (`sendNewMemberAdminAlert`).

**Takvim modülü:** `frontend/src/app/[locale]/takvim/page.tsx` — aylık/haftalık görünüm + sürükle-bırak tarih değiştirme + görev/hatırlatma ekle/tamamla/sil. Owner-scoped (mevcut `crm_tasks`/`crm_reminders`). Sidebar'da Takvim.

**Açık kayıt + otomatik tenant (Faz A):** `rejectNonAdmin` artık `env.ADMIN_ONLY_LOGIN==='1'` ise devrede (varsayılan AÇIK). Yeni kullanıcı (signup/google/social) `assignDefaultTenant` ile `env.TENANT_KEY` (gzltek) tenant'ına otomatik atanır (`repoEnsureTenantMembership`, admin→tenant_admin, diğer→tenant_editor), issueTokens ÖNCESİ.

**Kişi-bazlı modül matrisi (Faz B):** `user_modules` tablosu (038 seed: tenant_key×user_id×module_key×status). `module_catalog`'a `mail`+`calendar` eklendi (default-açık) + tenant'lara grant. `entitlements/me` KİŞİ-bazlı: super-admin/tenant_admin tümünü görür; normal kullanıcı sadece default-açık (mail/calendar) + `user_modules` grant'ları (`listUserActiveModules`, `DEFAULT_USER_MODULES=['mail','calendar']`). Frontend `AppShell` izinsiz modülleri GİZLER. iy-data.ts: takvim→'calendar', mail→'mail'. Admin: `/admin/users/:id` **Modül Erişimi kartı**.

**Cross-tenant modül kartı (Faz 1 / A4):** `GET /entitlements/user/:userId/tenants` + admin kartı kullanıcının HER tenant'ı için ayrı modül bölümü gösterir (commit `3c4e2aa`).

**İlgili planlar:** `docs/crm/ADMIN_TO_USER_DASHBOARD_PLAN.md`, `docs/crm/GMAIL_MAIL_ENTEGRASYONU_PLAN.md`. Hafıza: `auth-onboarding-modul-matrisi`, `gmail-mail-entegrasyonu`, `admin-dashboard-tasima-plani`.

---

## 1. ÖDEME / PAKET MODELİ (kullanıcı netleştirdi — 2026-07-05)

- Modüller **paket** olarak satılır: örn. **Firma Bulucu** (leads), **CRM**, **Mail** paketleri. Her paketin **ücreti** var.
- **Mail + Takvim herkese ÜCRETSİZ/default açık** (temel verimlilik).
- Ödeme şimdilik **HAVALE ile manuel**: kullanıcı öder → **Orhan elle** o kullanıcıya/tenant'a paket erişimini açar. Otomatik gateway (Iyzico/Stripe) YOK, ileride eklenir.
- Erişim açma mekanizması **zaten hazır**: admin panel `/admin/users/:id` Modül Erişimi kartındaki switch'ler (kişi-bazlı) + `/admin/modules` (tenant-bazlı). Manuel açma için ek koda gerek yok — sadece paket **fiyat gösterimi** + **ödeme takibi** eksik.

**Karar:** Gateway YOK (manuel havale). Faz 2 = fiyat gösterimi + basit ödeme/paket durumu takibi (manuel işaretleme), otomatik değil.

---

## Bölüm A — TENANT YÖNETİMİ (SIRADAKİ İŞ — yeni oturumda başla)

Süper-admin tüm workspace'leri (tenant) ve üyelerini görüp yönetsin. **Not:** gzltek şu an tek tenant; ikinci müşteri workspace'i açılınca asıl değeri görünür.

### ⚠️ KRİTİK BUG (2026-07-06 keşif + düzeltme) — entitlements admin uçları 404'tü

`admin_panel/.../entitlements_admin.endpoints.ts` tüm URL'leri `/entitlements/...` (prefix'siz) çağırıyordu; backend bunları YALNIZ `/api/v1/admin/entitlements/...` altında sunuyor (route tablosu ile doğrulandı). Yani **A4 kartı + Modül Erişimi kartı + `/admin/modules` tenant modül yönetimi prod'da 404 alıyordu** (RTK hatası → kart sessizce boş → "çalışıyor" sanılmış). Diğer tüm admin dosyaları (`users`=`/admin/users`, `site-settings`, `db`, `audit`) zaten `/admin/...` kullanıyor; entitlements tek aykırıydı. **Düzeltme:** 7 URL'e `/admin` prefix'i eklendi. Deploy sonrası Modül Erişimi kartlarının GERÇEKTEN veri çektiği UI'da doğrulanmalı.

- [x] **A4. Kullanıcı detay modül kartı çok-tenant** — commit `3c4e2aa` (backend OK); ama frontend URL bug'ı nedeniyle 404'tü → **2026-07-06 düzeltildi** (yukarı).
- [x] **A1. Tenant genel liste ekranı** — TAMAM (2026-07-06, henüz commit/deploy edilmedi). Her tenant kartında özet şeridi: üye sayısı + aktif modül sayısı + en yakın `expires_at` (süresi geçmişse kırmızı) + status badge.
  - [x] Backend: `GET /tenants/admin/list` (yeni, süper-admin gated) — `listTenantsAdmin` tek sorguda `COUNT tenant_user_roles` + `COUNT tenant_modules(active/trial)` + `MIN(expires_at)`. Public `/tenants` (login pre-auth branding seçici) MİNİMAL bırakıldı — cross-tenant sızıntı olmasın diye zenginleştirme ayrı uca kondu. `backend/src/modules/tenants/{controller,router}.ts`. Frontend: `useListTenantsAdminQuery`.
- [x] **A2. Tenant detay/üyeler** — TAMAM (2026-07-06, uncommitted). Backend: `GET /tenants/admin/:key/members` (`listTenantMembersAdmin`, süper-admin gated) — üyeler + rol + her üyenin aktif modülleri (default mail/calendar + user_modules grant), 2 sorgu N+1 yok. Frontend: tenant kartında "Üyeler & Modüller" bölümü (rol badge + modül rozetleri, `•`=paket grant'ı, "yönet"→`/admin/users/:id`). RTK `useGetTenantMembersQuery`. Not: ayrı `/admin/tenants/:key` route yerine mevcut tenant kartına gömüldü (daha az yüzey, aynı değer). Tenant modül aç-kapa zaten `/admin/modules`'te.
- [x] **A3. Users listesinde tenant sütunu + filtre** — TAMAM (2026-07-06, uncommitted). Backend: `repoAdminListUsers` yanıtına `tenants[]` (tenant_key+role) **batch** eklendi (tek IN sorgu, N+1 yok). Frontend: "Workspace" sütunu (tenant rozetleri, tenant_admin altın renk) + client-side "Workspace" filtre dropdown'u (yüklü liste üzerinde; distinct tenant'lar). Tipler: `AdminUserView.tenants` + normalizer. `useListUsersAdminQuery`.
- [x] **A5. Süper-admin guard** — YAPISAL OLARAK SAĞLANDI: cross-tenant uçlar `/api/v1/admin/*` scope'unda (`routes.ts`: `requireAuth`+`requireAdmin`; bu sistemde `requireAdmin` == global admin == `isSuperAdmin`, çünkü JWT `role:'admin'` → `isSuperAdmin`). Yeni `/tenants/admin/list` de `[requireAuth, requireAdmin]`. tenant_admin kendi workspace'ini `/tenants/workspace/*` (controller'da `requireTenantAdmin`, kendi tenant'ı) üzerinden yönetir — cross-tenant uçlara erişemez. Not: `GET /tenants` ve `GET /tenants/:key` bilinçli PUBLIC (login branding seçici) ama yalnız minimal branding döner.
- [x] **A6. Yeni tenant açma UI** — TEMEL TAMAM (zaten vardı): tenants sayfasında onboard formu (tenant_key + ad → `POST /tenants/admin/onboard`) + tenant kartında "tenant admin ata" (user_id) + modül aç-kapa `/admin/modules`. Opsiyonel genişletme (tek formda ilk-admin + başlangıç paketleri) düşük öncelik.

---

## Bölüm B — PAKET FİYAT + MANUEL ÖDEME TAKİBİ (Faz 2, manuel)

Gateway yok; sadece fiyat gösterimi + admin'in ödeme durumunu elle işaretlemesi.

- [ ] **B1. Paket fiyatları:** `module_catalog.base_price`/`currency`/`billing_period` ZATEN VAR. Fiyatları doldur (leads/crm için gerçek TL fiyatları; mail/calendar = 0/ücretsiz). Admin `/admin/modules` fiyat düzenlemesi (opsiyonel; şu an catalog seed'de sabit).
- [ ] **B2. Tenant ödeme/paket durumu (manuel):** `tenant_modules.status` (trial/active/suspended/cancelled) + `expires_at` ZATEN VAR. Admin panelde tenant detayında: paketi "aktif et / askıya al" + dönem bitişi (havale onaylanınca aktif, süre dolunca askı). Ek tablo gerekmez — mevcut `tenant_modules` yeterli.
  - [ ] (Opsiyonel) `payments` tablosu: havale kaydı (tenant, tutar, tarih, not) — ödeme geçmişi için. Şart değil.
- [ ] **B3. Ödeme durumu → görünürlük:** `hasModule`/`listActiveTenantModules` zaten `status active/trial` + `expires_at` kontrol ediyor → tenant modülü askıya alınınca kullanıcılar otomatik göremez. **Bu zaten çalışıyor.** Sadece admin'in askıya alma UI'ı (B2) eksik.
- [ ] **B4. Günlük süre-dolum job'u:** `expires_at` geçmiş `tenant_modules`'ı otomatik `suspended` yap. `backend/src/jobs/` deseni (churn.job/report.job gibi). Manuel modelde opsiyonel ama faydalı.
- [ ] **B5. Kullanıcıya paket/fiyat gösterimi (frontend):** kullanıcı dashboard'unda kilitli/satın alınabilir paketleri fiyatıyla göster ("Firma Bulucu paketi — X TL/ay, havale ile satın al → admin açar"). `/pricing` sayfası VAR (frontend), oraya bağlanabilir. Şimdilik düşük öncelik.

---

## Bölüm C — OTOMATİK ÖDEME (İLERİDE, şimdilik KAPSAM DIŞI)

- Kullanıcı kararı: **manuel havale yeterli**, gateway şimdilik gerekmiyor.
- İleride ölçeklenince: Iyzico (TR, workspace'te var) veya Stripe + webhook → `tenant_modules` otomatik güncelle. Webhook imza doğrulama (scraper-callback deseni). O zaman B4 job'u + webhook birlikte çalışır.

---

## FAZ SIRASI (yeni oturum yol haritası)

1. **Faz 1 = Bölüm A (Tenant Yönetimi) — TAMAMLANDI:** A1✅ A2✅ A3✅ A4✅ A5✅ A6✅(temel). A2+A3 commit edilmedi (A1+404fix commit `aed5b9a` gzltek'te canlı). **SIRADAKİ: A2+A3'ü commit + gzltek deploy + doğrula, sonra Faz 2 (Bölüm B — paket fiyat + manuel ödeme).**
2. **Faz 2 = Bölüm B (Paket fiyat + manuel ödeme):** B1 (fiyatlar) → B2 (tenant paket aktif/askı UI) → B4 (süre-dolum job) → B5 (kullanıcıya fiyat gösterimi).
3. **Faz 3 = Bölüm C (otomatik ödeme):** ölçeklenince.

---

## TEKNİK REFERANSLAR (yeni oturum için)

**Modül/entitlement:**
- Backend: `backend/src/modules/entitlements/` — `service.ts` (`hasModule`, `listActiveTenantModules`, `listUserActiveModules`, `listUserModuleGrants`, `setUserModule`, `listUserTenants`, `isTenantAdmin`, `DEFAULT_USER_MODULES`), `router.ts` (`myEntitlementsHandler` kişi-bazlı; admin uçları: catalog, tenant/:key, tenant/:key/activate|suspend, tenant/:key/user/:userId[/set], user/:userId/tenants), `guard.ts` (`requireModule` — tenant bazlı, isSuperAdmin bypass).
- DB: `module_catalog` (module_key PK, name, base_price, billing_period, is_active, sort — leads/crm/email-marketing/mail/calendar), `tenant_modules` (tenant×module, status, expires_at — 032), `user_modules` (tenant×user×module, status — 038). `tenant_user_roles` (user×tenant, role tenant_admin/tenant_editor — 027).
- Admin panel: `admin_panel/.../users/_components/user-detail-client.tsx` (Modül Erişimi kartı → `UserModulesCard`/`TenantModuleSection`), `.../modules/` (tenant modül yönetimi), `.../tenants/` (tenant liste — genişletilecek). Endpoints: `integrations/endpoints/admin/entitlements_admin.endpoints.ts` (`useGetUserTenantsQuery`, `useGetUserModulesQuery`, `useSetUserModuleMutation`, `useListTenantModulesQuery`, `useActivate/SuspendTenantModuleMutation`).
- Frontend gating: `frontend/src/components/iy/AppShell.tsx` (`useMyEntitlementsQuery` → izinsiz modül gizle), `iy-data.ts` (`IY_APP_NAV`, item.module).

**Auth/tenant:**
- `backend/src/modules/auth/controller.ts` (signup/token/google/social; `rejectNonAdmin` env-gated; `assignDefaultTenant`), `repository.ts` (`repoEnsureTenantMembership`).
- `backend/src/plugins/tenantContext.ts` (onRequest: enterTenant + SENKRON enterUser). `_shared/tenant-scope.ts` (`getActiveUserId/TenantKey`, `andTenantOwner`, `ownerScopeForUrl`).
- `backend/src/modules/tenants/` (`listTenants`, onboard).
- JWT: `auth/helpers/core.ts` `buildAccessPayload` (sub, role, isSuperAdmin, tenants[], defaultTenant). Modül JWT'de YOK — `entitlements/me` runtime.

**Deploy/env (gzltek):** `TENANT_KEY=gzltek`, `ADMIN_ONLY_LOGIN` (boş=açık kayıt), `GMAIL_OAUTH_CLIENT_ID/SECRET` (assistan-501512 Testing client), `DB_ENCRYPTION_KEY` (MAIL_ENCRYPTION_KEY fallback), `GOOGLE_CLIENT_ID/SECRET` (login — isletmeniyonetweb client), SMTP boş (mail admin-Gmail'inden gider). Kullanıcılar: orhanguzell (super-admin+tenant_admin), gzltek tenant modülleri: leads/crm/email-marketing/mail/calendar hepsi active.

**Notlar:** e2e test bash'te `UID` readonly → `TID` kullan. Testler (owner-isolation, tenantContext) bu sandbox'ta DB/jwt yok → hang; build + canlı e2e ile doğrula. DB değişikliği yalnız seed SQL (ALTER yasak).
