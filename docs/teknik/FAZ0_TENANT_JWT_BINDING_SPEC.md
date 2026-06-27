# Faz 0 — Tenant JWT Binding (Güvenlik Bloker) — Codex İş Paketi

> Tarih: 2026-06-27 · Mimar: Claude Code · Sahip (impl): Codex · Branch: feat/tenant-config-core
> İlgili: [../strateji/ISLETMENIYONET_BIRLESTIRME.md](../strateji/ISLETMENIYONET_BIRLESTIRME.md) Faz 0
> Karar: isletmeniyonet birleştirmesi öncesi **kapatılması zorunlu** güvenlik açığı.

---

## 1. Tehdit modeli — neden bloker

Tenant kimliği şu an **tamamen client kontrolünde** çözülüyor, hiçbir doğrulama yok:

```ts
// src/plugins/tenantContext.ts:13
function resolveTenant(req) {
  return firstString(query.tenantKey)        // ?tenantKey=... (client)
    ?? firstString(req.headers['x-tenant'])  // X-Tenant header (client)
    ?? env.TENANT_KEY ?? 'default';
}
```

- **Bugün sınırlı:** login admin-gated (`rejectNonAdmin`, sadece global `role==='admin'` girebiliyor). Yani tek super-admin operatör için switcher'ın doğrulamasız olması Orhan kararıydı.
- **Birleştirme sonrası 🔴 kritik:** merge planı self-serve B2B + signup getiriyor (tenant müşterileri login olacak). O noktada **herhangi bir authenticated kullanıcı `?tenantKey=` veya `X-Tenant` set ederek başka tenant'ın verisini okur** → cross-tenant veri sızıntısı. Tenant kimliğe (JWT) bağlanmalı.

## 2. Hedef tasarım

İki katman:

1. **JWT tenant taşır** — login/refresh'te kullanıcının izinli tenant'ları + super-admin bayrağı token'a gömülür.
2. **tenantContext doğrular** — istenen tenant, JWT'deki izinli set'e karşı kontrol edilir; super-admin serbest, diğerleri bağlı, public route'lar env-only.

Faz 2 repoları (`getActiveTenantKey()` → ALS) **DEĞİŞMEZ**. Tüm enforcement sınırda (tenantContext) yapılır.

### 2.1 JWT payload genişletme

Tek imza noktası: `issueTokens()` → `src/modules/auth/helpers/core.ts:81` (`jwt.sign`). Refresh akışı da aynı claim'leri üretmeli (`controller.ts:313`).

Yeni access-token payload:
```ts
{
  sub, email, role,              // mevcut
  isSuperAdmin: boolean,         // global role === 'admin' → true (bugünkü tek operatör)
  tenants: string[],            // tenant_user_roles'tan user_id için tenant_key listesi
  defaultTenant: string | null  // tenants[0] ?? env.TENANT_KEY
}
```

- `isSuperAdmin` = mevcut global `role === 'admin'` kontrolünden türetilir (yeni rol sistemi gerekmez).
- `tenants` = `SELECT tenant_key FROM tenant_user_roles WHERE user_id = ?` (tablo zaten var: `027_saas_multitenant_schema.sql`).
- Super-admin için `tenants` boş olabilir → enforcement'ta bypass edileceği için sorun değil.

`JwtUser` tipine (`src/middleware/auth.ts:7`) alanlar eklenir: `isSuperAdmin?`, `tenants?: string[]`, `defaultTenant?: string`.

### 2.2 tenantContext enforcement (kritik)

Plugin sırası zaten doğru: `authPlugin` (app.ts:60, jwtVerify) → `tenantContextPlugin` (app.ts:61). authPlugin onRequest önce çalışır → `req.user` hazır olur. Ama authPlugin **sadece `config.auth===true` route'larda** jwtVerify yapıyor; public route'larda `req.user` yok.

Yeni `resolveTenant` mantığı:

```
requested = query.tenantKey ?? headers['x-tenant'] ?? undefined
user = req.user (authPlugin doğruladıysa dolu)

EĞER user var (authenticated istek):
  EĞER user.isSuperAdmin:
    tenant = requested ?? user.defaultTenant ?? env.TENANT_KEY   // serbest switch (Orhan kararı korunur)
  DEĞİLSE:
    EĞER requested verildi VE requested ∉ user.tenants:
       → 403 { error: { message: 'tenant_forbidden' } }          // reply.code(403), hook'u kes
    tenant = requested ?? user.defaultTenant
    EĞER tenant yok → 403 'no_tenant_assigned'
DEĞİLSE (public/unauthenticated istek):
  tenant = env.TENANT_KEY ?? 'default'   // client header'ı YOK SAY → public deploy tek-tenant
```

Notlar:
- Public route'larda `X-Tenant`/`?tenantKey` artık **yok sayılır** (frontend `/api/home/*` gibi anonim uçlar deploy'un env tenant'ına sabitlenir). Bu, header-spoofing'i public yüzeyde de kapatır.
- 403 dönerken hook async olmalı veya `reply.code(403).send(...)` + `return` ile akış kesilmeli (mevcut hook `done()` callback'li sync → async'e çevir veya reply ile kes).
- `loadActiveTenant` zaten bilinmeyen/pasif tenant'ta throw ediyor (`tenant.ts:56`) — geçerlilik kontrolü orada kalır.

### 2.3 Süper-admin bypass gerekçesi
Orhan kararı: tek operatör super-admin sidebar switcher'ı ile tüm tenant'lar arası serbest geçer (doğrulamasız). Bu tasarım onu **açıkça** korur (`isSuperAdmin` bypass), ama non-super-admin (gelecekteki self-serve müşteriler) için sıkı bağlama getirir.

## 3. Yan temizlik (aynı pakette)
- **Commit'li secret:** `git log -p` / grep ile Messe API key + diğer commit'li sırları bul → revoke + env'e taşı (ISLETMENIYONET_BIRLESTIRME §2 "commit'li secret"). Geçmişten temizleme ayrı karar (BFG/filter-repo) — şimdilik en az: anahtarı rotate et, koddan kaldır.
- **`.sync-conflict-*`** çöp dosyaları sil (varsa).

## 4. Testler (bun test — eklenecek)
1. non-super-admin, `tenants=['vistaseeds']`, `X-Tenant: bereketfide` → **403 tenant_forbidden**.
2. non-super-admin, header yok → `defaultTenant` (vistaseeds) ile çalışır.
3. super-admin, `X-Tenant: bereketfide` → bereketfide ile çalışır (bypass).
4. public route (auth:false), `X-Tenant: foo` → `env.TENANT_KEY` kullanılır (header yok sayılır).
5. tenant ataması olmayan non-super-admin → **403 no_tenant_assigned**.
6. Regresyon: mevcut `tenant-isolation` + `tenantContext.test.ts` yeşil kalmalı.

## 5. Kabul kriterleri
- [ ] JWT'de `isSuperAdmin` + `tenants` + `defaultTenant` (login + refresh + google + password flow hepsinde).
- [ ] tenantContext §2.2 mantığını uygular; non-super-admin cross-tenant isteği 403.
- [ ] Public route'lar client tenant header'ını yok sayar (env-only).
- [ ] `bun run build` + `bun run tenant:guard` + `bun test` yeşil.
- [ ] Commit'li secret rotate + koddan kaldırıldı.

## 6. Sıra
Faz 0 BİTİNCE → Faz 1 (gümrük tam import) veya frontend EN/DE, Orhan önceliğine göre.
