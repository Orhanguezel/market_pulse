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
| ICP profilleri | ✅ zengin form (v3 alanları) | ⚠️ ham JSON textarea | ✅ CRUD |

## ✅ Bu turda yapılan düzeltmeler

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

- [ ] **F9. `adaylar` kanal filtresi** `amazon` ve `decision_maker` seçeneklerini listeliyor ama bu sayfaya o kanallardan aday akışı yok; admin filtresinde ise `trade_fair_in_person`/`decision_maker` hiç yok. Kanal listeleri tek kaynaktan türetilmeli.
- [x] **F10. `LeadScanRule` şema belirsizliği:** UI `rule.value ?? rule.pattern` okuyor — tip iki alanı da içeriyor; backend kontratı netleştirilmeli. (`lead-machine.types.ts:50-60`)
- [x] **F11. Tarama formu varsayılanları** ("automotive accessories distributor", "Automechanika Frankfurt") Avrasya'ya özgü — tenant-bağımsız SaaS'ta boş/tenant-config'ten gelmeli.
- [ ] **A6. Ölü kod:** `startGenericFairRunner`/`POST /fair/run` admin UI'da kullanılmıyor; `onCreateRule` prop'u CandidateCard'da hiç çağrılmıyor; `/outreach` ve `/outreach/drafts` aynı paneli render ediyor.
- [x] **A7. `compositeOf` 0 skoru "yetersiz veri" sayıyor** (GUVENLI kararı hariç) — meşru 0 skor gizlenebilir. (`lead-candidates-panel.tsx:104`)
- [x] **A8. Amazon rescore endpoint'i frontend'de admin path'ine işaret ediyor:** `amazon_scan.endpoints.ts:106` `/lead-machine/amazon/jobs/:id/rescore` çağırıyor; bu route user scope'ta yok (Amazon lead-machine admin-only). Kullanılıyorsa 404/401 alır — user-side eklenmeli ya da UI'dan kaldırılmalı.

## 🔵 Backend mimari / güvenlik notları

- [x] **D1. `scraper-callback` tenant'ı istek gövdesinden alıyor** (`body.tenant_key`, yalnızca regex ile doğrulanıyor). Gerçek tenant allowlist kontrolü eklenmeli. (`controller.ts:90-92,233-234`)
- [x] **D2. İmza doğrulaması re-serialize edilmiş body üzerinde:** `JSON.stringify(req.body)` Python'un `sort_keys+compact` çıktısıyla bayt-bazında farklılaşabilir (ör. float gösterimi) → geçerli imzalar reddedilebilir. Fastify raw-body ile orijinal gövde doğrulanmalı. (`controller.ts:191-192`)
- [x] **D3. URL-string tabanlı yetki ayrımı kırılgan:** `isUserRoute = !url.includes('/admin/')` ile owner-scope belirleniyor; mount/rewrite değişiminde sessizce tenant-geneli veri sızdırabilir. Route kaydında açık bayrak taşınmalı. (`controller.ts:94-100`, `decision-maker/router.ts:311,323`)
- [ ] **D4. `lead_search_jobs` sahiplik kolonu `created_by`,** diğer tablolar `owner_user_id` — adlandırma tutarsızlığı; fresh-seed şemasında hizalanmalı (ALTER değil, seed SQL güncellemesi + `db:seed:*:fresh`).
- [ ] **D5. Konşimento veri gölü deploy koşulu:** `customs_records` gzltek VPS'te dolu (≈16.15M kayıt); başka tenant deploy'unda tablo boşsa gümrük araması 0 sonuç döner. Tenant kurulumlarında veri senkron/erişim stratejisi (paylaşımlı lake) netleştirilmeli.
- [x] **D6. Tam-paket testte mock sızıntısı (ön-mevcut):** `bun test src/modules/lead-machine` 3 fail / 2 error veriyor (`siteSettings.getGoogleSettings` export bulunamıyor); dosyalar tek tek çalıştırıldığında geçiyor. Test izolasyonu düzeltilmeli.

## Sonraki adım önerisi (Codex görev sırası)

1. F1 + A1 (sayfalama + job_id filtre paritesi) — tek görevde iki taraf.
2. F2 (yapılandırılmış ICP formu — admin bileşeni referans alınarak frontend'e port).
3. F5 + F7 (jobs sayfasına Amazon + fuar akışı sadeleştirme).
4. D2 + D1 (scraper callback raw-body doğrulama + tenant allowlist) — async akış devreye alınmadan önce şart.
