# Codex Görevi — Faz 0: Tenant JWT Binding (Güvenlik Bloker)

**Tarih:** 2026-06-27
**Bağlam:** market_pulse "işletmeni yönet" ürününe dönüşüyor; isletmeniyonet birleştirmesi (gümrük verisi + self-serve B2B) öncesi **kapatılması zorunlu** güvenlik açığı.
**Branch:** `feat/tenant-config-core` (mevcut, push'lu).
**Tam spec (oku):** [docs/teknik/FAZ0_TENANT_JWT_BINDING_SPEC.md](docs/teknik/FAZ0_TENANT_JWT_BINDING_SPEC.md) — bu dosya özet + giriş noktası, detay/edge-case'ler spec'te.

---

## Açık (kanıt)

Tenant kimliği **client kontrolünde, doğrulamasız** çözülüyor:

```ts
// backend/src/plugins/tenantContext.ts:13
function resolveTenant(req) {
  return firstString(query.tenantKey)        // ?tenantKey=... (client)
    ?? firstString(req.headers['x-tenant'])  // X-Tenant header (client)
    ?? env.TENANT_KEY ?? 'default';
}
```

Bugün login admin-only (`rejectNonAdmin`, sadece global `role==='admin'`) olduğu için sınırlı. Ama birleştirme self-serve signup getiriyor → o noktada **herhangi bir authenticated kullanıcı `?tenantKey=` / `X-Tenant` set ederek başka tenant'ın verisini okur.** Tenant kimliğe (JWT) bağlanmalı.

---

## İŞ 1 — JWT tenant claim'leri taşısın (en kritik)

**Nerede:** tek imza noktası `backend/src/modules/auth/helpers/core.ts:81` (`issueTokens` → `jwt.sign`). Refresh akışı da aynı claim'leri üretmeli → `backend/src/modules/auth/controller.ts:313`. Google + password flow dahil **tüm token üretim yolları**.

**Yapılacak:** access-token payload'a ekle:
```ts
{
  sub, email, role,             // mevcut
  isSuperAdmin: boolean,        // mevcut global role === 'admin' → true
  tenants: string[],            // SELECT tenant_key FROM tenant_user_roles WHERE user_id = ?
  defaultTenant: string | null  // tenants[0] ?? env.TENANT_KEY
}
```
- `tenant_user_roles` tablosu zaten var (`backend/src/db/seed/sql/027_saas_multitenant_schema.sql`).
- `JwtUser` tipine alanları ekle: `backend/src/middleware/auth.ts:7` (`isSuperAdmin?`, `tenants?: string[]`, `defaultTenant?: string`).
- Super-admin için `tenants` boş olabilir (bypass edileceği için sorun değil).

**Kabul:** login/refresh/google/password sonrası JWT'de yeni claim'ler var.

---

## İŞ 2 — tenantContext doğrulasın (enforcement)

**Nerede:** `backend/src/plugins/tenantContext.ts`. Plugin sırası zaten doğru (authPlugin → tenantContext, app.ts:60-61) → `req.user` hazır.

**Yeni mantık (spec §2.2):**
```
requested = query.tenantKey ?? headers['x-tenant'] ?? undefined
user = req.user (authPlugin doğruladıysa dolu; public route'larda yok)

user VARSA:
  isSuperAdmin → tenant = requested ?? user.defaultTenant ?? env.TENANT_KEY   // serbest switch (Orhan kararı korunur)
  DEĞİLSE:
    requested verildi VE requested ∉ user.tenants → 403 'tenant_forbidden'
    tenant = requested ?? user.defaultTenant
    tenant yoksa → 403 'no_tenant_assigned'
user YOKSA (public istek):
  tenant = env.TENANT_KEY ?? 'default'   // client header'ı YOK SAY (public deploy tek-tenant)
```
- Hook 403 dönerken akışı kesmeli — mevcut sync `done()` hook'u async'e çevir veya `reply.code(403).send(...)` + return.
- `loadActiveTenant` zaten bilinmeyen/pasif tenant'ta throw ediyor (`tenant.ts:56`) — geçerlilik kontrolü orada kalır, dokunma.
- **Faz 2 repoları DEĞİŞMEZ** (`getActiveTenantKey()` → ALS). Enforcement sadece bu sınırda.

**Kabul:** non-super-admin cross-tenant isteği 403; super-admin serbest; public route client header'ını yok sayar.

---

## İŞ 3 — Yan temizlik (aynı pakette)
- **Commit'li secret:** Messe API key + diğer commit'li sırları bul (`git grep` / `grep -rn`) → koddan kaldır, env'e taşı, anahtarı **rotate et**. (Geçmişten silme ayrı karar; şimdilik rotate + koddan çıkar.)
- **`.sync-conflict-*`** çöp dosyaları varsa sil.

---

## Testler (bun test — ekle)
1. non-super-admin `tenants=['vistaseeds']`, `X-Tenant: bereketfide` → **403 tenant_forbidden**.
2. non-super-admin header yok → `defaultTenant` ile çalışır.
3. super-admin `X-Tenant: bereketfide` → bereketfide (bypass).
4. public route (auth:false) `X-Tenant: foo` → `env.TENANT_KEY` (header yok sayılır).
5. tenant ataması olmayan non-super-admin → **403 no_tenant_assigned**.
6. Regresyon: mevcut `tenant-isolation` + `plugins/__tests__/tenantContext.test.ts` yeşil kalmalı.

## Kabul kriterleri (hepsi)
- [x] JWT'de `isSuperAdmin` + `tenants` + `defaultTenant` (tüm access-token üretim yolları `issueAccessToken`/`issueTokens` üstünden).
- [x] tenantContext §2.2 mantığı; non-super-admin cross-tenant → 403; public route env-only.
- [x] `bun run build` + `bun run tenant:guard` + `bun test` yeşil. Son doğrulama: 2026-06-29, backend 223 test.
- [ ] Commit'li secret rotate + koddan kaldırıldı. Kod taraması: Messe key hardcoded değil, `MESSE_FRANKFURT_API_KEY` env'den okunuyor; gerçek anahtar rotasyonu dış sistemde yapılmalı.
- [x] ALTER yok (şema değişikliği gerekirse CREATE TABLE seed + db:seed fresh — CLAUDE.md kuralı).
