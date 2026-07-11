# Owner (Kişi-Bazlı) İzolasyon Güvenlik Denetimi

Tarih: 2026-07-11 · Kapsam: tüm kullanıcıya-dönük (dashboard) modüller · Tetikleyen: "kimse kimsenin verisini görmemeli"

Aynı tenant içinde her kullanıcı YALNIZCA kendi kayıtlarını görmeli/değiştirmeli (`owner_user_id`). 7 user-route grubu (CRM, market, prospect-lists, mail-accounts, decision-maker, public-api/amazon, lead-machine) uçtan uca denetlendi. Bulunan tüm sızıntılar düzeltildi, nöbetçi testler eklendi, canlıya (gzltek) alındı.

## 🔴 Bulunan ve düzeltilen kritik açıklar

### 1. URL-string owner bypass — query-string ile sömürülebilir (EN KRİTİK)
`ownerScopeForUrl(req.url)` ve CRM/campaign'deki `req.url.includes('/admin/')` deseni owner'ı **istek URL'inden** çözüyordu. `req.url` sorgu dizesini içerir ve saldırgan kontrolündedir:
```
GET /api/v1/market/targets/<başkasının-id>?x=/admin/   → owner filtresi düşer → BAŞKASININ verisi
DELETE /api/v1/market/leads/<id>?x=/admin/             → başkasının kaydını siler
POST  /api/v1/market/reports/weekly/send?x=/admin/     → günlük kota bypass
```
Etkilenen: **market modülünün tamamı** (targets/leads/signals/stats/reports — read/update/delete/agg), **CRM** (accounts/contacts/deals/activities via `ownerForRequest`), **outreach campaigns**.

**Düzeltme:** Owner artık route KAYDINDAKI `config.ownerScope` (lead-machine: `leadMachineScope`) bayrağından çözülüyor — `ownerScopeForRequest(req)`. `req.url`'e asla bakılmıyor. User-scope'ta **fail-closed**: owner context yoksa `getRequiredUserId()` 401 atar (owner=null ile sessizce açığa düşme imkansız). Router guard'larına `config: { ownerScope: 'user' }` eklendi.

### 2. scanAllMarketplaces — cross-TENANT tarama
`jobs/marketplace.job.ts` `WHERE status='active'` (tenant_key YOK, owner YOK). Kullanıcı `POST /market/targets/scan-all-marketplaces` ile **tüm tenant'ların** target'larını tarayıp sinyal yazabiliyordu. **Düzeltme:** job artık `{ tenantKey, ownerUserId }` scope alıyor; user route kendi scope'unu geçiriyor, nightly cron scope'suz (sistem-geneli).

### 3. scanAllCompetitors — tenant-geneli
`controller.ts` owner filtresi yoktu → tenant'taki tüm kullanıcıların target'larını tarıyor/raporluyordu. **Düzeltme:** `andTenantOwner(..., ownerScopeForRequest(req))`.

### 4. Amazon scan IDOR (public-api, authed)
- `GET /public/amazon/scan/:jobId` → `getSearchJob(jobId)` owner filtresiz → başkasının scan job + risk raporu.
- `GET /public/amazon/scan/:jobId/products` → `amazon_products WHERE tenant_key=? AND job_id=?` owner yok → başkasının ürünleri.
- `GET /public/amazon/history` → var olmayan `created_by` kolonuna filtreliyordu (fail-closed bug, boş dönüyordu).

**Düzeltme:** ikisi de `getSearchJob(jobId, { ownerUserId: userId })` ile owner-doğrulı (yoksa 404); history `owner_user_id`'ye çevrildi.

### 5. CRM business-records — products/quotes/orders/documents (LEAK + IDOR + UNSCOPED-WRITE)
Bu 4 tabloda `owner_user_id` kolonu **hiç yoktu**; servis yalnızca tasks/reminders'ı owner-scope ediyordu. Sonuç: aynı tenant'taki kullanıcılar birbirinin ürün/teklif/sipariş/belgelerini **listeleyebiliyor, id ile çekebiliyor (IDOR), güncelleyebiliyor/silebiliyordu (unscoped-write)**. Dashboard'daki quote/order sayaçları da tenant-geneliydi.

**Düzeltme:** şema (`035_*.sql`) + idempotent migration (`db/migrate`) 4 tabloya `owner_user_id` + index ekledi (canlıda "owner ready" doğrulandı). `business-records.service.ts` list/get/update/delete artık **tüm** kaynakları `owner_user_id = ?` ile filtreliyor; INSERT owner yazıyor; dashboard sayaçları owner-scoped.

### 6. İkincil sertleştirmeler
- **Sahiplik yeniden atama engeli:** tüm CRM UPDATE'leri `buildPatchSql` üzerinden geçiyor; `owner_user_id`/`created_by`/`tenant_key`/`id` artık SET clause'a **asla** giremiyor (kullanıcı kendi kaydını başkasına atayamaz).
- **Fail-closed resolver:** `ownerScopeForRequest` user-scope'ta owner zorunlu.

## ✅ Güvenli bulunan (değişiklik gerekmedi)
- **prospect-lists** — `getRequiredUserId()`, tüm sorgular `tenant_key + owner_user_id`.
- **mail-accounts** — `getAuthUserId`, token'lar AES-GCM şifreli ve response'tan strip'li, IDOR yok, OAuth callback HMAC-signed state.
- **decision-maker** — tam owner-scoped (jobs/results/company-pool/export/promote), günlük kota.
- **lead-machine candidates/jobs/icp/enrich/rules** — `leadMachineScope` bayrağı (önceki tur `7df021b`).
- **storage/Belgeler (yeni)** — her user sorgusu `bucket(=hash(tenant:user)) + user_id` çift filtreli; `getRequiredUserId()` fail-closed; local dosyada path-traversal koruması. Owner'sız repo fonksiyonları yalnız admin tarafında.
- **amazon byok** — `(tenant_key, user_id)` anahtarlı; başkasının API anahtarı okunamaz/silinemez.

## 🛡️ Eklenen nöbetçi testler
- `_shared/__tests__/owner-scope-request.test.ts` — `ownerScopeForRequest` route-config tabanlı, **query-string `?x=/admin/` enjeksiyonu owner filtresini düşüremez** (bypass nöbetçisi), user-scope fail-closed.
- `__tests__/owner-scope-route-guard.test.ts` — market/crm/lead-machine/decision-maker user router'larının `ownerScope`/`leadMachineScope` bayrağını taşıdığını ve owner resolver'ların `req.url`'e bakmadığını statik doğrular (mock'suz, sızıntısız).
- `__tests__/owner-isolation.test.ts` — user-A/user-B izolasyonu (lead candidates, outreach drafts/campaigns, CRM accounts) + super-admin owner filtresini kaldırmıyor.
- `crm/__tests__/crm.service.test.ts` — business-records owner-scope (products/quotes list/delete/update) + reassignment engeli.

## Doğrulama
- Backend build temiz; tam test **288 pass / 2 fail** (2 fail HEAD'de de vardı — `churn` tam-pakette mock sızıntısı izolede geçer, `entitlements/myEntitlementsHandler` önceden kırık; ikisi de bu işle ilgisiz).
- `tenant:guard` (sunucu) geçti. Migration crm_products/quotes/orders/documents → owner ready.
- Canlı (gzltek, `c1a20e5`): sayfalar 200, owner-scoped + storage route'ları 401 (auth korumalı).

## Açık kalan (düşük öncelik / teknik borç)
- **Tam-paket test mock sızıntısı:** Bun `mock.module` global; testler izolede geçer, tam pakette birbirini kirletir. Test-isolation altyapısı ayrı iş. (Bu turda benim `@/core/tenant-context` mock'layan testim 48 ek fail'e yol açmıştı → gerçek `runWithTenantAndUser` context'ine taşındı.)
- **owner-scope-guard --strict** hâlâ bazı lead-machine helper'larını (owner'ı caller'dan alan servisler) offender sayıyor; deploy `tenant:guard` çalıştırıyor, `--strict` değil. Faz 1 tamamlanınca strict CI'ye alınabilir.
- **customs_records** paylaşımlı referans gölü (owner yok, tasarım gereği).
