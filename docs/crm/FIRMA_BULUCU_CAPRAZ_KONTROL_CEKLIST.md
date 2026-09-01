# Firma Bulucu — Admin Panel ↔ Frontend Çapraz Kontrol Çeklisti

Tarih: 2026-07-11 · Kapsam: `admin_panel` market/lead-machine modülü, `frontend` firma-bulucu sayfaları, `backend` lead-machine modülü.

Amaç: Admin paneldeki firma bulucu sistemi (fuar / B2B: Google Maps–Europages–TOBB / gümrük-konşimento / Amazon / karar verici) frontend dashboard'a aynı yetkinlikte taşımak. Aşağıdaki liste çapraz kontrolde bulunan eksik ve hataları önceliğe göre sıralar.

## Sistem haritası (özet)

| Kanal | Admin panel | Frontend | Backend user route |
|---|---|---|---|
| B2B (google_maps/europages/tobb) | ✅ `lead-machine/b2b` + birleşik Tarama sihirbazı | ✅ `firma-bulucu/tarama` | ✅ `/lead-machine/b2b/jobs` |
| Fuar | ✅ `lead-machine/fair` (+10times runner) | ✅ tarama + fuar-günü | ✅ `/lead-machine/fair/*` |
| Gümrük (konşimento) | ✅ `lead-machine/customs` | ✅ tarama (bu görevle tam parite) | ✅ `/lead-machine/customs/jobs` |
| Amazon | ✅ (developerOnly sayfa) | ✅ tarama → `/amazon` sayfası | ✅ public-api `authed /amazon/scan` |
| Karar verici | ✅ `decision-makers` | ✅ `karar-vericiler` | ✅ tam parite + günlük kota |
| Aday inceleme/onay | ✅ candidates panel | ✅ `adaylar` + `fuar-gunu` | ✅ |
| ICP profilleri | ✅ zengin form (v3 alanları) | ✅ yapılandırılmış form + hazır şablonlar | ✅ CRUD (+ zorla sil) |

## 🚀 Canlı (gzltek.tech) — 2026-07-11, commit `7df021b`

Deploy edildi: `deploy/gzltek/deploy.sh` (backend+frontend+admin build, idempotent seed, `db:migrate`, tenant scope guard, pm2 reload). 3 servis online.

Deploy öncesi doğrulama ve canlı duman testi:

| Kontrol | Sonuç |
|---|---|
| Backend build / Frontend TS / Admin TS | ✅ |
| Backend test (tam paket) | 271 pass / 2 fail — **ikisi de önceden mevcut**, bu işle ilgisiz (`churn`: tam-pakette mock sızıntısı, izolede geçer; `entitlements/myEntitlementsHandler`: `582e67c`'de de kırık) |
| `tenant:guard` (sunucu) | ✅ passed |
| `/tr/dashboard`, `/tr/firma-bulucu/icp` | 200 |
| Yeni user route'ları (bulk-review, amazon/jobs, fair/brifing, customs/jobs) | 401 (kayıtlı + auth korumalı; 404 değil) |
| Backend log (reload sonrası) | Hata yok |

### 🔴 Deploy öncesi yakalanan güvenlik regresyonu (düzeltildi — `7df021b`)

Owner-scope refactor'ü (`config.leadMachineScope`) `registerOutreachUser` guard'ına **uygulanmamıştı**. O router `controller.ts`'teki `listDrafts` / `generateOutreach` / `sendDraft` handler'larını kaydediyor ve bu handler'lar scope'u artık yalnızca bu bayraktan okuyor. Sonuç:

- `GET /lead-machine/outreach/drafts` owner filtresi olmadan çalışıyordu → tenant kullanıcısı **aynı tenant'taki diğer kullanıcıların mail taslaklarını görüyordu**.
- `POST /lead-machine/outreach/drafts/:id/send` günlük mail kotasını tüketmiyordu (`consumeDailyUsageForRoute` user route saymıyordu) → **kota bypass**.

Düzeltme: guard'a `config: { leadMachineScope: 'user' }`. Ayrıca **nöbetçi test** eklendi — `lead-machine/__tests__/route-scope.test.ts`: Fastify `onRoute` hook'uyla user router'larının **tüm** route'larının bayrağı taşıdığını, admin route'larının taşımadığını doğrular. Bayrak düşürülünce test kayıt anında patlıyor (doğrulandı: fix geri alınınca 17 outreach route'u korumasız listeleniyor). Mevcut `owner-isolation.test.ts` yeni kontrata taşındı; testler controller'ı doğrudan çağırdığı için router kaydındaki bu boşluğu **yakalayamıyordu** — asıl açık oradaydı.

> Ders: `leadMachineScope` bayrağı yeni bir user router'a eklenmeyi unutulursa hata **sessizdir** (403 değil, fazla veri döner). Yeni user route grubu açan herkes `route-scope.test.ts`'i çalıştırmalı.

## ✅ ICP turu (2026-07-11, ikinci tur)

- [x] **Tarama İşleri silme akışı eklendi.** Kullanıcı yalnızca kendisine ait tamamlanmış/hatalı işleri silebilir; aktif işler `409 job_active` ile korunur. Transaction, işe bağlı aday/enrichment/outreach, Amazon analiz ve karar-verici sonuçlarını birlikte temizler. — `deleteSearchJob`, `DELETE /lead-machine/jobs/:id`, `firma-bulucu/jobs`

- [x] **ICP silme sessizce başarısız oluyordu.** Backend, ICP'ye bağlı tarama işi varsa `409 ICP_HAS_JOBS` dönüyor; frontend `remove()` try/catch içermediği için kullanıcı hiçbir geri bildirim almıyordu (buton çalışmıyor gibi görünüyordu). Artık hata gösteriliyor ve **"yine de sil"** onayı sunuluyor: işler/adaylar ICP'den koparılır (`icp_id = NULL`, geçmiş korunur), profile ait dışlama kuralları silinir. — `icp.repository.ts`, `controller.ts` (`?force=true`), `icp/page.tsx`
- [x] **Hazır ICP şablonları eklendi** — `frontend/.../firma-bulucu/icp/icp-templates.ts`. Tek tıkla profil oluşturur; yeni şablon eklemek için diziye satır yazmak yeterli.
  - **Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti. (marka: ProMats)** — Automechanika 2026 oto aksesuar alıcısı ICP'si (host firma + fuar/stand bilgisi 3.1 D11, öncelikli ülkeler, hariç ülkeler/kalıplar, sinyaller, skor eşikleri). Kaynak: [AUTOMECHANIKA_2026_CEKLIST.md](../AUTOMECHANIKA_2026_CEKLIST.md) + seed `018_lead_machine_schema.sql`.
  - "Oto Aksesuar Distribütörü — Avrupa" ve "Genel B2B İthalatçı (boş taslak)".
- [x] **Formda eksik olan ama eşleştiricinin okuduğu 3 alan eklendi:** `priority_geographies`, `exclude_geographies`, `sales_channels` — `b2b/icp.matcher.ts` bu alanları skorlamada kullanıyor, formda bulunmadığı için elle ayarlanamıyordu.
- [x] **Codex'in yarım kalan owner-scope refactor'ü tamamlandı** (D3 maddesi): `ownerUserIdForRoute` artık `req.routeOptions.config.leadMachineScope` bayrağını okuyor; 21 çağrı hâlâ `req.url` geçirdiği için backend derlenmiyordu. Bayrak yoksa admin/tenant-geneli kabul edilir.

> ⚠️ **Canlıda profil listesi neden boş görünüyor:** Seed'lenen ICP'ler (`018_lead_machine_schema.sql`) `owner_user_id = NULL` ve `tenant_key = 'avrasya'` ile yazılıyor. User route'u `owner_user_id = <giriş yapan kullanıcı>` filtresi uyguladığı için bu kayıtlar dashboard'da **görünmez**. Kullanıcının kendi profilini oluşturması gerekir — hazır şablonlar tam da bunu tek tıkla çözer. Kalıcı çözüm için D4 (sahiplik kolonu hizalama) ve seed'lerin tenant/owner ile yazılması ele alınmalı.

## ✅ Birinci turda yapılan düzeltmeler

- [x] **Konşimento (gümrük) araması frontend'de aktifleştirildi** — `frontend/src/app/[locale]/firma-bulucu/tarama/page.tsx`
  - Kök neden: form `buyer_country` için zorunlu ülke gönderiyordu (varsayılan `DE`, "Tümü" yoktu). Gümrük gölü ağırlıklı TR/USA/RU/UA alıcı içerdiğinden aramalar hep 0 sonuç dönüyor, özellik "çalışmıyor" görünüyordu.
  - Admin paritesi sağlandı: "Tümü" ülke seçeneği (→ filtre yok), virgülle çoklu HS kodu (`hs_codes[]` / tek girişte `hs_prefix`), `min_value` (USD) alanı, `limit` alanı, seçili ICP'nin `icp_id` olarak gönderilmesi.
- [x] **Fuar brifing PDF route'ları user tarafına eklendi** — `backend/src/modules/lead-machine/router.ts`
  - Frontend `fuar-gunu` sayfası aday/gün/toplu PDF için `/lead-machine/fair/brifing/*` çağırıyordu; bu route'lar yalnızca admin scope'ta kayıtlıydı → tenant kullanıcısına **404**. Üç route `requireAuth + requireModule('leads')` guard'ı ile user router'a eklendi.
- [x] **Scraper callback imza doğrulaması fail-closed yapıldı** — `backend/src/modules/lead-machine/_shared/scraper.client.ts`
  - `SCRAPER_CALLBACK_SECRET` boşken `verifyScraperWebhook` **true** dönüyordu (fail-open): imzasız POST ile herhangi bir tenant'a aday enjekte edilebilirdi. Artık secret yoksa callback reddedilir. Not: backend'de hiçbir job başlatıcısı async callback akışını kullanmıyor (senkron scrape/GMaps kullanılıyor), dolayısıyla canlı akış etkilenmez. Async akış devreye alınırsa hem backend hem scraper-service env'ine aynı secret konmalı (`openssl rand -hex 40`).

Doğrulama: `frontend` typecheck temiz; `backend` build temiz; lead-machine test paketi değişiklik öncesiyle birebir aynı sonuç (123 pass / 3 fail — fail'ler ön-mevcut, tam-paket mock sızıntısı, aşağıda D6).

## 🔴 Kritik — frontend'i admin'le eşitlemek için gerekli

- [x] **F1. Aday listesinde sayfalama yok.** `adaylar` sabit `limit:100`, `fuar-gunu` `limit:150`; backend `page/limit` destekliyor. Büyük taramalarda sonuçlar sessizce kırpılıyor. (`frontend .../adaylar/page.tsx:50-55`)
- [x] **F2. ICP formu ham JSON.** Admin'deki yapılandırılmış ICP formunun (sektör/ülke/çalışan sayısı seçicileri, v3 skor eşikleri, keyword sync) frontend karşılığı yok; kullanıcıdan JSON yazması bekleniyor. (`frontend .../firma-bulucu/icp/page.tsx:151-156`)
- [x] **F3. Modül guard'ı yalnızca nav gizleme.** `leads` modülü olmayan kullanıcı URL ile `/firma-bulucu/*`e girebiliyor; backend 402 dönünce sayfa ham hata gösteriyor. Route-level yönlendirme/paket-teklif ekranı gerekli. (`AppShell.tsx:40-44`)
- [x] **A1. Admin candidates paneli URL paramlarını yok sayıyor.** B2B/fuar/gümrük panellerindeki "İncele → `candidates?channel=X&job_id=Y`" linkleri işlevsiz: panelde `useSearchParams` yok, `job_id` hiç gönderilmiyor; hep varsayılan filtre açılıyor. (Frontend bunu doğru yapıyor — admin'e taşınmalı.) (`admin_panel .../lead-candidates-panel.tsx:682-687`, `candidates/page.tsx`)

## 🟠 Önemli — işlevsel eksik/hata

- [x] **F4. Toplu red atomik değil.** `adaylar` toplu reddi N ayrı PATCH ile yapıyor (`reject_reason:'bulk_reject'`); backend'e bulk review endpoint'i eklenmeli. (`adaylar/page.tsx:99-105`)
- [x] **F5. Amazon işleri "Tarama İşleri"nde görünmüyor.** `jobs` sayfası yalnızca b2b/fuar/gümrük listelerini birleştiriyor; Amazon taraması başlatılınca izleme yalnızca `/amazon` sayfasında. Kanal filtresinde de `amazon` yok. (`jobs/page.tsx:94-109`)
- [x] **F6. Fuar tarihi düz metin input** (`tarama`), `fuar-gunu` ise `type="date"` kullanıyor — format uyuşmazlığı gün filtresini boşa düşürebilir. (`tarama/page.tsx:156`)
- [x] **F7. 10times heuristiği kırılgan.** `fairUrl.includes('10times')` ile `fair/run` / `fair/jobs` ayrımı yapılıyor; admin'de `/fair/run` hiç kullanılmıyor (ölü endpoint). Tek bir akışta birleştirilmeli. (`tarama/page.tsx:77`)
- [ ] **F8. i18n yok.** `[locale]` routing'e rağmen 5 sayfada tüm metinler sabit Türkçe; tarihler `tr-TR`'a sabitlenmiş.
- [x] **A2. Admin b2b/fuar/gümrük job listelerinde polling yok** — durum yalnızca elle "Yenile" ile güncelleniyor. Frontend'deki 10 sn liste + 3 sn aktif-iş polling'i admin'e de uygulanmalı.
- [x] **A3. Admin birleşik "Lead Tarama" sihirbazında gümrük ve karar verici kaynakları yok** (yalnızca b2b/fuar/amazon); gümrük ayrı sayfada. Frontend tarama sihirbazıyla eşitlenmeli.
- [x] **A4. Sessiz JSON hataları:** ICP ham JSON editörü ve kampanya `country_to_lang` alanı parse hatasını yutuyor — kullanıcı geri bildirimi yok. (`icp-profiles-panel.tsx:822-830`, `outreach-campaigns-panel.tsx:51-57`)
- [x] **A5. Fuar-günü brifing PDF linki auth header'sız ham `<a>`** — cookie yoksa 401. Karar verici export'taki `Bearer + X-Tenant` fetch kalıbı kullanılmalı. (`fair-day-panel.tsx:50-52`)

## 🟡 Orta — tutarlılık / kalite

- [x] **F9. Kanal filtresi paritesi.** Amazon işleri aday üretiyor, karar-verici sonuçları promote akışıyla adaylara geliyor; admin filtresine `trade_fair_in_person` ve `decision_maker` eklendi ve kanal union'ları aynı yedi değere hizalandı.
- [x] **F10. `LeadScanRule` şema belirsizliği:** UI `rule.value ?? rule.pattern` okuyor — tip iki alanı da içeriyor; backend kontratı netleştirilmeli. (`lead-machine.types.ts:50-60`)
- [x] **F11. Tarama formu varsayılanları** ("automotive accessories distributor", "Automechanika Frankfurt") Avrasya'ya özgü — tenant-bağımsız SaaS'ta boş/tenant-config'ten gelmeli.
- [x] **A6. Ölü kod:** kullanılmayan generic fair mutation/handler/route kaldırıldı, kullanılmayan CandidateCard prop'u kaldırıldı ve `/outreach` canonical `/outreach/drafts` route'una yönlendirildi.
- [x] **A7. `compositeOf` 0 skoru "yetersiz veri" sayıyor** (GUVENLI kararı hariç) — meşru 0 skor gizlenebilir. (`lead-candidates-panel.tsx:104`)
- [x] **A8. Amazon rescore endpoint'i frontend'de admin path'ine işaret ediyor:** `amazon_scan.endpoints.ts:106` `/lead-machine/amazon/jobs/:id/rescore` çağırıyor; bu route user scope'ta yok (Amazon lead-machine admin-only). Kullanılıyorsa 404/401 alır — user-side eklenmeli ya da UI'dan kaldırılmalı.

## 🔵 Backend mimari / güvenlik notları

- [x] **D1. `scraper-callback` tenant'ı istek gövdesinden alıyor** (`body.tenant_key`, yalnızca regex ile doğrulanıyor). Gerçek tenant allowlist kontrolü eklenmeli. (`controller.ts:90-92,233-234`)
- [x] **D2. İmza doğrulaması re-serialize edilmiş body üzerinde:** `JSON.stringify(req.body)` Python'un `sort_keys+compact` çıktısıyla bayt-bazında farklılaşabilir (ör. float gösterimi) → geçerli imzalar reddedilebilir. Fastify raw-body ile orijinal gövde doğrulanmalı. (`controller.ts:191-192`)
- [x] **D3. URL-string tabanlı yetki ayrımı kırılgan:** `isUserRoute = !url.includes('/admin/')` ile owner-scope belirleniyor; mount/rewrite değişiminde sessizce tenant-geneli veri sızdırabilir. Route kaydında açık bayrak taşınmalı. (`controller.ts:94-100`, `decision-maker/router.ts:311,323`)
- [x] **D4. `lead_search_jobs` sahiplik kolonu** fresh-seed şemasında ve uygulama kontratlarında `owner_user_id` olarak hizalandı; ALTER eklenmedi.
- [x] **D5. Konşimento veri gölü deploy koşulu:** paylaşımlı global lake stratejisi deploy planına yazıldı; `customs:lake:check` preflight'ı minimum kayıt eşiğinin altında deploy'u başarısız yapar.
- [x] **D6. Tam-paket testte mock sızıntısı (ön-mevcut):** `bun test src/modules/lead-machine` 3 fail / 2 error veriyor (`siteSettings.getGoogleSettings` export bulunamıyor); dosyalar tek tek çalıştırıldığında geçiyor. Test izolasyonu düzeltilmeli.

## Sonraki adım önerisi (Codex görev sırası)

1. F1 + A1 (sayfalama + job_id filtre paritesi) — tek görevde iki taraf.
2. F2 (yapılandırılmış ICP formu — admin bileşeni referans alınarak frontend'e port).
3. F5 + F7 (jobs sayfasına Amazon + fuar akışı sadeleştirme).
4. D2 + D1 (scraper callback raw-body doğrulama + tenant allowlist) — async akış devreye alınmadan önce şart.
