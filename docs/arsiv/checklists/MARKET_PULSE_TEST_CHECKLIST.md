# MarketPulse Test Checklist

Kapsam: MarketPulse ve Lead Machine modulleri.

Kapsam disi: genel moduller (`_shared`, `auth`, `theme`, `notifications`, `siteSettings`, `menuItems`, `profiles`, `userRoles`, `storage`, `health`, `externalDb` vb.). Not: `backend/src/modules/lead-machine/_shared` MarketPulse'a ozel oldugu icin kapsama dahildir.

## Durum

- [x] Backend test runner kuruldu: `backend/package.json` -> `bun test`.
- [x] Backend MarketPulse testleri eklendi ve calisiyor.
- [x] Backend Lead Machine testleri eklendi ve calisiyor.
- [x] Harici DB/ag/AI/mail servisleri mock'landi.
- [x] Son dogrulama: `backend` klasorunde `bun test` -> 115 pass, 0 fail.
- [x] Son dogrulama: `backend` klasorunde `bun run build` -> gecti.
- [x] Admin RTK endpoint testleri eklendi ve calisiyor.
- [x] Admin component smoke testleri eklendi ve calisiyor.
- [x] MarketPulse dokumantasyon sayfasi eklendi.
- [x] MarketPulse test merkezi sayfasi eklendi.
- [x] MarketPulse yazilimci notlari sayfasi eklendi.
- [x] MarketPulse sidebar mimarisi dokumantasyon, test merkezi ve yazilimci notlari ile genisletildi.
- [x] Son dogrulama: `admin_panel` klasorunde `bun test` -> 19 pass, 0 fail.
- [x] Son dogrulama: `admin_panel` klasorunde `bun run typecheck` -> gecti.
- [x] Son dogrulama: `admin_panel` klasorunde `bun run build` -> gecti.

## Kapsamdaki Alanlar

- `backend/src/modules/market`
- `backend/src/modules/lead-machine`
- `admin_panel/src/app/(main)/admin/(admin)/market`
- `admin_panel/src/integrations/endpoints/admin/market_admin.endpoints.ts`
- `admin_panel/src/navigation/sidebar/sidebar-items.ts`
- `admin_panel/src/integrations/shared/adminUi.ts`

## Genel Hazirlik

- [x] Backend test runner standardini netlestir.
  - [x] `backend/package.json` icin `test` script'i ekle.
  - [x] Testlerin `bun test` ile calismasini sagla.
  - [x] DB, Drizzle, MySQL pool, scraper, AI ve mail servisleri icin mock yardimcilari hazirla.
- [x] Admin panel test stratejisini netlestir.
  - [x] RTK endpoint testleri icin `bun test` kullanildi.
  - [x] Component smoke testleri dependency eklemeden `react-dom/server` + `bun test` ile eklendi.
  - [x] Dokumantasyon, test merkezi ve yazilimci notlari route'lari smoke test kapsaminda render edildi.
- [x] Test verisi standardi olustur.
  - [x] Target, lead, signal fixture'lari.
  - [x] Candidate, job, ICP, enrichment, outreach fixture'lari.
  - [x] External Paspas ERP fixture'lari.

## Backend: Market Core

Dosya onerisi: `backend/src/modules/market/__tests__/market.controller.test.ts`

- [x] Target listeleme testleri.
  - [x] `q`, `category`, `status` filtreleri.
  - [x] `name`, `churn_risk_score`, `created_at` siralama.
  - [x] `limit` / `offset`.
  - [x] `x-total-count` header.
- [x] Target CRUD testleri.
  - [x] Create basarili.
  - [x] Create validation hatasi.
  - [x] Get basarili.
  - [x] Get bulunamadi -> `404`.
  - [x] Patch basarili.
  - [x] Patch validation hatasi.
  - [x] Patch bulunamadi -> `404`.
  - [x] Delete -> `204`.
- [x] Lead listeleme testleri.
  - [x] `q`, `status`, `priority`, `source` filtreleri.
  - [x] `name`, `score`, `priority`, `created_at` siralama.
  - [x] `x-total-count` header.
- [x] Lead CRUD testleri.
  - [x] Create basarili.
  - [x] Create validation hatasi.
  - [x] Get bulunamadi -> `404`.
  - [x] Patch basarili.
  - [x] Delete -> `204`.
- [x] Signal testleri.
  - [x] Listeleme ve filtreler: `target_id`, `lead_id`, `severity`, `is_reviewed`.
  - [x] Create basarili.
  - [x] Create validation hatasi.
  - [x] Review sonrasi `is_reviewed=true`, `reviewed_at` dolu.
  - [x] Review bulunamadi -> `404`.
  - [x] Delete -> `204`.
- [x] Market stats testleri.
  - [x] `totalTargets`.
  - [x] `totalLeads`.
  - [x] `pendingSignals`.

## Backend: Bulk Import

Dosya onerisi: `backend/src/modules/market/__tests__/bulk-import.test.ts`

- [x] Import template endpoint testleri.
  - [x] `Content-Type: text/csv`.
  - [x] `Content-Disposition` dosya adi.
  - [x] CSV header dogru.
- [x] Bulk import preview testleri.
  - [x] `dry_run=true` insert/update yapmadan preview uretir.
  - [x] Yeni kayit `_action=insert`.
  - [x] Website duplicate `_action=update` veya `_action=skip`.
  - [x] Website yoksa name duplicate kontrolu.
  - [x] `on_conflict=update`.
  - [x] `on_conflict=skip`.
- [x] Sonuc sayaclari.
  - [x] `inserted`.
  - [x] `updated`.
  - [x] `skipped`.
  - [x] `total`.

## Backend: Paspas ERP External / Sync

Dosya onerisi: `backend/src/modules/market/__tests__/paspas-sync.test.ts`

- [x] `listPaspasCustomers` testleri.
  - [x] Basarili response.
  - [x] Query validation hatasi.
  - [x] External repository statusCode hatasini HTTP cevabina aktarir.
- [x] `listPaspasProducts` testleri.
  - [x] Basarili response.
  - [x] Query validation hatasi.
- [x] `listPaspasCustomerOrders` testleri.
  - [x] Basarili response.
  - [x] External hata status mapping.
- [x] `syncPaspasTargets` testleri.
  - [x] `mode` validation.
  - [x] Insert/update/total sayaclari.
  - [x] Kullanici mesaji formatinin dogrulugu.
  - [x] External servis/DB mock ile calisma.

## Backend: Churn Service

Dosya onerisi: `backend/src/modules/market/__tests__/churn.service.test.ts`

- [x] Target bulunamazsa `404 target_not_found`.
- [x] `last_seen_at=null` risk skoruna +15 ekler.
- [x] 30/60/90 gun esikleri.
- [x] Critical/high/medium sinyal agirliklari.
- [x] Reviewed sinyallerin hesaba katilmamasi.
- [x] Son 90 gun siparis yoksa risk artisi.
- [x] Onceki 90 gune gore son 90 gunde sert dusus varsa risk artisi.
- [x] Skorun 0-100 araliginda normalize edilmesi.
- [x] Hesaplanan skorun `market_targets.churn_risk_score` alanina yazilmasi.

## Backend: Competitor Signal

Dosya onerisi: `backend/src/modules/market/__tests__/competitor.signal.test.ts`

- [x] Target bulunamazsa `TARGET_NOT_FOUND` ve `404`.
- [x] Website yoksa `TARGET_HAS_NO_WEBSITE` ve `400`.
- [x] Scraper dogru URL ve profile ile cagrilir.
- [x] `changed_fields=[]` ise signal olusmaz.
- [x] Degisiklik olsa da olmasa da `last_seen_at` guncellenir.
- [x] `prices` degisikligi `high` severity uretir.
- [x] `products` degisikligi `medium` severity uretir.
- [x] 3 veya daha fazla degisiklik `critical` severity uretir.
- [x] Signal title, description ve source_url dogru olusur.

## Backend: Weekly Report

Dosya onerisi: `backend/src/modules/market/__tests__/report.service.test.ts`

- [x] `generateWeeklyReport` PDF buffer dondurur.
- [x] PDF `%PDF` header ile baslar.
- [x] Report data sayimlari dogru okunur.
- [x] High-risk target listesi skora gore siralanir.
- [x] Son 7 gun critical/high signal listesi rapora girer.
- [x] Lead status count listesi rapora girer.
- [x] SMTP host yoksa `sendWeeklyReportEmail` hata verir.
- [x] SMTP mock ile mail subject, recipient ve PDF attachment dogrulanir.

## Backend: Lead Machine DB / Candidate / Job

Dosya onerisi: `backend/src/modules/lead-machine/__tests__/lead-machine.db.test.ts`

- [x] Search job create/get/list.
- [x] Job `params` JSON parse edilir.
- [x] Job status update.
- [x] `started_at` ve `finished_at` update.
- [x] Candidate insert.
- [x] Candidate get.
- [x] Candidate `raw_data` JSON parse edilir.
- [x] Candidate list filtreleri.
  - [x] `channel`.
  - [x] `status`.
  - [x] `job_id`.
  - [x] `limit` / `offset`.
- [x] Candidate review update.
  - [x] `approved`.
  - [x] `rejected` + `reject_reason`.
  - [x] `favorite`.

## Backend: Lead Machine Controller

Dosya onerisi: `backend/src/modules/lead-machine/__tests__/lead-machine.controller.test.ts`

- [x] Candidate listeleme.
  - [x] Default `limit=25`, `page=1`.
  - [x] Max `limit=100`.
  - [x] `x-total-count` header.
- [x] Candidate review.
  - [x] `approve`.
  - [x] `reject`.
  - [x] `favorite`.
  - [x] Invalid action -> `400 invalid_action`.
  - [x] Candidate bulunamadi -> `404`.
- [x] Approve-to-lead.
  - [x] Candidate bulunamadi -> `404`.
  - [x] Candidate market lead'e donusur.
  - [x] Candidate status `approved` olur.
- [x] Scraper callback.
  - [x] Invalid signature -> `401 invalid_signature`.
  - [x] Missing job id -> `400 missing_job_id`.
  - [x] Job bulunamadi -> `404 job_not_found`.
  - [x] Valid callback candidate insert eder.
  - [x] Invalid candidate name olan item atlanir.
  - [x] Completed callback job status `done` yapar.
  - [x] Failed callback job status `failed` yapar.
- [x] Job endpoints.
  - [x] Amazon job create.
  - [x] B2B job create.
  - [x] Fair job create.
  - [x] Amazon job get bulunamadi veya channel uyumsuz -> `404`.
  - [x] Background runner mock ile tetiklenir.
- [x] Competitor scan endpoint.
  - [x] URL yoksa `400 url_required`.
  - [x] URL varsa scraper sonucu dondurur.

## Backend: ICP

Dosya onerisi: `backend/src/modules/lead-machine/__tests__/icp.test.ts`

- [x] ICP profile list.
- [x] ICP profile get.
- [x] ICP profile create.
  - [x] Name yoksa `400 name_required`.
  - [x] Definition default `{}`.
  - [x] `is_active` default true.
- [x] ICP profile update.
  - [x] Name update.
  - [x] Definition update.
  - [x] `is_active` update.
  - [x] Bulunamadi -> `404`.
- [x] ICP profile delete.
  - [x] Basarili delete -> `204`.
  - [x] Repository statusCode hatasi HTTP cevabina aktarilir.
- [x] `matchesIcp`.
  - [x] Sector match score.
  - [x] Firm type match score.
  - [x] Website bonus.
  - [x] Phone bonus.
  - [x] Excluded country.
  - [x] Excluded pattern.
  - [x] Minimum score altinda `matches=false`.

## Backend: Amazon Lead Machine

Dosya onerisi: `backend/src/modules/lead-machine/__tests__/amazon.test.ts`

- [x] Amazon product scraper dogru payload gonderir.
  - [x] `source=amazon_search`.
  - [x] `query=keyword`.
  - [x] `domain=marketplace`.
  - [x] `pages=3`.
- [x] Amazon review scraper dogru payload gonderir.
  - [x] `source=amazon_reviews`.
  - [x] `url=productUrl`.
- [x] Review analyzer.
  - [x] Review verisi yoksa guvenli sonuc.
  - [x] Pain point / score hesaplama.
- [x] Seller extractor.
  - [x] Eksik seller alanlarina tolerans.
  - [x] Website/email/phone normalize.
- [x] Amazon job.
  - [x] Job status `running` yapilir.
  - [x] Product sonucundan candidate insert edilir.
  - [x] Review analyzer sonucu candidate summary/score'a yansir.
  - [x] Basarili job `done`.
  - [x] Hata halinde job `failed` ve `error_msg`.

## Backend: B2B Lead Machine

Dosya onerisi: `backend/src/modules/lead-machine/__tests__/b2b.test.ts`

- [x] Directory scraper request parametreleri.
- [x] Website analyzer.
  - [x] Scrape sonucunu normalize eder.
  - [x] Eksik alanlara tolerans.
- [x] ICP matcher entegrasyonu.
  - [x] Eslesen lead candidate olur.
  - [x] Eslesmeyen lead atlanir veya dusuk score alir.
- [x] B2B job.
  - [x] Job status `running`.
  - [x] Candidate insert.
  - [x] Result count update.
  - [x] Basarili job `done`.
  - [x] Hata halinde `failed`.

## Backend: Fair Lead Machine

Dosya onerisi: `backend/src/modules/lead-machine/__tests__/fair.test.ts`

- [x] Tentimes client request mapping.
- [x] Fair scraper normalize sonuc.
- [x] Fair job.
  - [x] Job status `running`.
  - [x] Katilimci/ziyaretci sonucundan candidate insert.
  - [x] Result count update.
  - [x] Basarili job `done`.
  - [x] Hata halinde `failed`.
- [x] Fair suggestions endpoint su an bos array dondurur.

## Backend: Enrichment

Dosya onerisi: `backend/src/modules/lead-machine/__tests__/enrichment.test.ts`

- [x] Candidate bulunamazsa hata davranisi.
- [x] Scraper mock ile enrichment verisi alinir.
- [x] AI mock ile karar verici / pain point / growth signal parse edilir.
- [x] Enrichment insert edilir.
- [x] `listCandidateEnrichment` candidate id ile filtreler.
- [x] Batch enrich.
  - [x] `candidate_ids` array degilse bos calisir.
  - [x] Maksimum 50 candidate ile sinirlanir.
  - [x] Her candidate icin enrich cagrilir.

## Backend: Outreach

Dosya onerisi: `backend/src/modules/lead-machine/__tests__/outreach.test.ts`

- [x] Candidate bulunamazsa `CANDIDATE_NOT_FOUND`.
- [x] AI prompt candidate alanlarini icerir.
- [x] AI cevabindan subject parse edilir.
- [x] AI cevabindan body parse edilir.
- [x] Subject yoksa fallback subject kullanilir.
- [x] Draft insert edilir.
- [x] Subject 300 karaktere kirpilir.
- [x] Draft list.
  - [x] Candidate id filtresi.
  - [x] Market lead id filtresi.
- [x] Draft update.
  - [x] Subject update.
  - [x] Body update.
  - [x] Status update.
  - [x] Bos patch -> `null`.
  - [x] Bulunamadi -> `null`.

## Admin: RTK Endpoint Testleri

Dosya onerisi: `admin_panel/src/integrations/endpoints/admin/__tests__/market_admin.endpoints.test.ts`

- [x] Market stats endpoint.
- [x] Market targets endpoints.
  - [x] List URL/params.
  - [x] Create method/body.
  - [x] Update method/body.
  - [x] Delete method.
  - [x] Recalculate churn method.
  - [x] Tag invalidation kapsamindaki mutation endpointleri request seviyesinde dogrulandi.
- [x] Market leads endpoints.
  - [x] List filters.
  - [x] Create/update/delete.
  - [x] Tag invalidation kapsamindaki mutation endpointleri request seviyesinde dogrulandi.
- [x] Market signals endpoints.
  - [x] List filters.
  - [x] Create.
  - [x] Review.
  - [x] Delete.
- [x] Paspas external endpoints.
  - [x] Customers.
  - [x] Products.
  - [x] Customer orders.
- [x] Report endpoints.
  - [x] Weekly preview.
  - [x] Weekly send.
- [x] Competitor scan endpoints.
  - [x] Single target scan.
  - [x] Scan all.
- [x] Bulk import endpoints.
  - [x] Sync Paspas.
  - [x] Bulk import.
  - [x] Import template blob response.
- [x] Lead Machine endpoints.
  - [x] Candidates list.
  - [x] Review candidate.
  - [x] Approve to lead.
  - [x] Enrichment list/create.
  - [x] Outreach generate/list/update.
  - [x] Amazon jobs list/start.
  - [x] B2B jobs list/start.
  - [x] Fair jobs list/start.
  - [x] ICP list/create/update/delete.
- [x] Export edilen hook'lar kirilmamis.

## Admin: Component Smoke Testleri

Not: Bu bolum icin admin panelde component test runner gerekir.

Dosya onerileri:

- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/market-dashboard.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/targets-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/leads-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/signals-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/lead-candidates-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/amazon-lead-search-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/b2b-lead-search-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/fair-lead-search-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/icp-profiles-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/outreach-drafts-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/reports-panel.test.tsx`
- `admin_panel/src/app/(main)/admin/(admin)/market/_components/__tests__/market-components.smoke.test.tsx`

- [x] Dashboard.
  - [x] Stats render.
  - [x] Loading state.
  - [x] Empty state smoke.
- [x] Targets panel.
  - [x] Liste render.
  - [x] Search/filter surface render.
  - [x] Dialog/action surface smoke.
  - [x] Delete action surface smoke.
  - [x] Recalculate churn action surface smoke.
  - [x] Competitor scan action surface smoke.
- [x] Leads panel.
  - [x] Liste render.
  - [x] Status/priority/source filtre surface render.
  - [x] Dialog/action surface smoke.
  - [x] Delete action surface smoke.
- [x] Signals panel.
  - [x] Liste render.
  - [x] Severity/review filtre surface render.
  - [x] Create signal dialog surface smoke.
  - [x] Review action surface smoke.
  - [x] Delete action surface smoke.
- [x] Lead candidates panel.
  - [x] Channel/status/job filtre surface render.
  - [x] Approve/reject/favorite action surface smoke.
  - [x] Approve to lead action surface smoke.
  - [x] Enrichment list/generate action surface smoke.
- [x] Amazon lead search panel.
  - [x] Job form surface render.
  - [x] Job list render.
  - [x] Candidate link surface render.
- [x] B2B lead search panel.
  - [x] Job form surface render.
  - [x] Job list render.
  - [x] ICP secimi surface render.
- [x] Fair lead search panel.
  - [x] Job form surface render.
  - [x] Job list render.
- [x] ICP profiles panel.
  - [x] List render.
  - [x] Create/update/delete surface smoke.
  - [x] Definition alanlari surface render.
- [x] Outreach drafts panel.
  - [x] Draft list.
  - [x] Status update surface smoke.
  - [x] Subject/body update surface smoke.
- [x] Reports panel.
  - [x] Preview action surface smoke.
  - [x] Send action surface smoke.
  - [x] Invalid email validation surface smoke.
- [x] Dokumantasyon sayfasi.
  - [x] Sayfa rehberi render.
  - [x] Test notlari render.
  - [x] Yazilimci notlari render.
  - [x] Test merkezi ve yazilimci notlari route linkleri render.
- [x] Test merkezi sayfasi.
  - [x] Test checklist tablosu render.
  - [x] Backend/admin/typecheck/build komutlari render.
  - [x] Yedek politikasi render.
  - [x] Sonraki backend kayit mimarisi notu render.
- [x] Yazilimci notlari sayfasi.
  - [x] Yeni not formu render.
  - [x] Not gecmisi bos state render.
  - [x] Mimari notlar render.
  - [x] LocalStorage tabanli ilk surum hazir.

## Admin: Dokumantasyon ve Operasyonel Yuzeyler

- [x] `/admin/market/docs` route'u olusturuldu.
  - [x] MarketPulse modullerinin sayfa rehberi yazildi.
  - [x] Calisma icin gerekli entegrasyonlar listelendi.
  - [x] Onerilen kullanim akisi yazildi.
  - [x] Test ve yazilimci notlari bolumleri eklendi.
- [x] `/admin/market/test-center` route'u olusturuldu.
  - [x] Paspas Test Merkezi mimarisine paralel kalite kapisi sayfasi eklendi.
  - [x] Backend, admin smoke, typecheck ve build komutlari dokumante edildi.
  - [x] Gercek DB testleri icin snapshot/yedek politikasi yazildi.
  - [x] Backend run history/test sonucu kaydi API'ye baglandi.
- [x] `/admin/market/developer-notes` route'u olusturuldu.
  - [x] Paspas page feedback mimarisine paralel yazilimci notu sayfasi eklendi.
  - [x] Not konusu, aciklama ve oncelik alanlari eklendi.
  - [x] Not gecmisi backend API ile kalici hale getirildi.
  - [x] Not silme ve cozuldu durumuna alma aksiyonlari eklendi.
- [x] Sidebar ve admin UI copy mimarisi genisletildi.
  - [x] `market_test_center` nav key'i eklendi.
  - [x] `market_developer_notes` nav key'i eklendi.
  - [x] Fallback basliklar eklendi.
  - [x] `adminUi` normalizer yeni key'leri tanir hale getirildi.

## Backend: Operasyonel Kayit API'leri

- [x] `market_test_runs` seed/migration SQL'i eklendi.
  - [x] Suite, title, command, status, pass/fail/skip sayaclari.
  - [x] Output excerpt ve risk note alanlari.
  - [x] Created by ve created at alanlari.
- [x] `market_developer_notes` seed/migration SQL'i eklendi.
  - [x] Subject, body, priority, status alanlari.
  - [x] Page path, created by, created at, updated at alanlari.
- [x] Backend schema DTO mapping eklendi.
  - [x] `marketTestRunToDto`.
  - [x] `marketDeveloperNoteToDto`.
- [x] Backend validation eklendi.
  - [x] Test run list/create schema.
  - [x] Developer note list/create/patch schema.
- [x] Backend route/controller eklendi.
  - [x] `GET /admin/market/test-runs`.
  - [x] `POST /admin/market/test-runs`.
  - [x] `GET /admin/market/developer-notes`.
  - [x] `POST /admin/market/developer-notes`.
  - [x] `PATCH /admin/market/developer-notes/:id`.
  - [x] `DELETE /admin/market/developer-notes/:id`.
- [x] Backend controller testleri eklendi.
  - [x] Test run list/create/validation.
  - [x] Developer note list/create/update/delete.

## Admin: Operasyonel API Entegrasyonu

- [x] RTK endpointleri eklendi.
  - [x] Test run list/create.
  - [x] Developer note list/create/update/delete.
- [x] RTK tag registry genisletildi.
  - [x] `MarketTestRuns`.
  - [x] `MarketDeveloperNotes`.
- [x] Test merkezi sayfasi API'ye baglandi.
  - [x] Manuel test sonucu kaydetme.
  - [x] Sonuc gecmisi listeleme.
- [x] Yazilimci notlari sayfasi API'ye baglandi.
  - [x] Not listeleme.
  - [x] Not olusturma.
  - [x] Notu cozuldu olarak isaretleme.
  - [x] Not silme.
- [x] Admin endpoint ve smoke testleri guncellendi.

## Uygulama Sirasi

- [x] 1. Backend test runner ve mock yardimcilari.
- [x] 2. `market` modulu controller testleri.
- [x] 3. Bulk import ve Paspas sync testleri.
- [x] 4. Churn, competitor signal ve weekly report testleri.
- [x] 5. `lead-machine` DB/candidate/job testleri.
- [x] 6. Lead Machine controller ve scraper callback testleri.
- [x] 7. ICP, Amazon, B2B, Fair testleri.
- [x] 8. Enrichment ve Outreach testleri.
- [x] 9. Admin RTK endpoint testleri.
- [x] 10. Admin component smoke testleri.
- [x] 11. MarketPulse dokumantasyon sayfasi.
- [x] 12. MarketPulse test merkezi sayfasi.
- [x] 13. MarketPulse yazilimci notlari sayfasi.
- [x] 14. Sidebar/admin UI copy mimarisi genisletme.
- [x] 15. Test merkezi icin backend kalici test run history API'leri.
- [x] 16. Yazilimci notlari icin backend kalici developer notes API'leri.
- [x] 17. Test merkezi icin otomatik test calistirma aksiyonu.
- [x] 18. Yazilimci notlari icin dosya/gorsel ek destegi.

## Kabul Kriterleri

- [x] Genel moduller icin test dosyasi olusturulmaz.
- [x] Harici servisler gercek ag/DB baglantisi yapmadan mock'lanir.
- [x] Testler deterministik calisir.
- [x] CRUD, validation, error path ve ana is akislari kapsanir.
- [x] Backend testleri tek komutla calisir.
- [x] Admin RTK testleri tek komutla calisir.
- [x] Admin component testleri de tek komutla calisir.
- [x] MarketPulse dokumantasyon/test/yazilimci notlari route'lari build icinde uretilir.
- [x] Admin typecheck temiz gecer.
- [x] Test merkezi sonuclari backend'de kalici olarak saklanir.
- [x] Yazilimci notlari backend'de kalici olarak saklanir.
- [x] Test merkezi admin uzerinden otomatik test kosumu baslatabilir.
- [x] Yazilimci notlari dosya/gorsel ekleriyle saklanabilir.
