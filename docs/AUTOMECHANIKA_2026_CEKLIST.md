# Automechanika Frankfurt 2026 — Çalışma Çeklisti

> **Müşteri:** Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti. (marka: ProMats)
> **Fuar:** Automechanika Frankfurt 2026 — **8-12 Eylül 2026**
> **Stand:** Hall 3.1, Booth D11
> **Strateji belgesi:** [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](docs/strateji/AUTOMECHANIKA_2026_PLANI.md)
> **Müşteri dosyası:** [docs/musteri/avrasya-paspas-automechanika.md](docs/musteri/avrasya-paspas-automechanika.md)
> **Teknik detay çeklist:** [docs/teknik/FAIR_MODULU_CEKLISTI.md](docs/teknik/FAIR_MODULU_CEKLISTI.md)
> **Üst plan:** [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](docs/strateji/MARKET_PULSE_SAAS_PLANI.md)
> **Son güncelleme:** 2026-05-21

---

## Bu belge nedir

Bu dosya **kök**te durur ve fuar projesinin tek-bakış halidir. Detay belgelere link verir. Tüm görevler iki sahip arasında bölünmüştür:

- **🧠 Claude (Mimar/Stratejist)** — tasarım, ICP, prompt, mail template, müşteri görüşmesi, dokümantasyon, kararlar, manuel keşif (DevTools), kalite kontrol
- **⚙️ Codex (Implementer)** — backend TS, scraper-service Python, DB schema, API endpoint, frontend admin sayfası, test, deploy

Görev satırında **`🧠 Claude`** veya **`⚙️ Codex`** etiketi sahipliği gösterir. Aynı satırda iki etiket varsa o iş çiftli akış: Claude tasarlar, Codex implement eder.

> İlke (CLAUDE.md): aynı dosyaya aynı anda iki araç dokunmaz. İş bittikçe sahibi bir sonraki sahibe işaret eder.

---

## Onaylanmış Stratejik Kararlar (2026-05-21)

Bu kararlar Orhan tarafından onaylandı, sistem bu varsayımlarla kurulacak:

| # | Karar | Değer |
|---|---|---|
| K-1 | **Pilot pazar (5 ülke)** | Almanya (DE), Avusturya (AT), Hollanda (NL), Polonya (PL), Fransa (FR) |
| K-2 | **Mail gönderici domain** | `info@promats.com.tr` (Avrasya'nın kendi domain'i — DKIM/SPF/DMARC kontrol edilecek) |
| K-3 | **Onay paneli kullanım taahhüdü** | Avrasya export ekibi — günlük 30 dk aday review |
| K-4 | **4 aylık servis bütçesi** | **~$10 (eski $300 plandan revize — 2026-05-21)**: Hunter free 50 credit/ay + Postmark free 100 mail/ay + GPT-4o-mini ~$0.50 toplam. Apollo $49/ay **DROP** — Hunter free yeter, sadece 9 boş mail aranacak. Detay: [docs/teknik/SPRINT_3_SADE_PLAN.md](docs/teknik/SPRINT_3_SADE_PLAN.md) |
| K-5 | **Ürün kapsamı** | Floor mat öncelik; aday firmanın gerekirse boot liner / interior accessories satıp satmadığı ikincil eşleşme sinyali |
| K-6 | **Stand randevu kapasitesi** | Pilot varsayım: 4 gün × 8 saat / 30 dk slot = **64 maks**, gerçekçi hedef **30-35 randevu** |
| K-7 | **Outreach Faz 1'i fuar için öne çek** | Master plan Faz 2'ye atmıştı; bu fuarda manuel onay + tek tıkla gönderim minimum işlevi yeterli |
| K-8 | **scraper-service için strateji sırası** | B → A → C (önce XHR endpoint, sonra DOM, son çare Google site search) |

Kararlardan biri değişirse bu tabloyu güncelle ve [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](docs/strateji/AUTOMECHANIKA_2026_PLANI.md) Bölüm 9'a yansıt.

---

## ⚠️ Strateji Düzeltmesi — 2026-05-21

Önceki "60-90 dk Avrasya görüşmesi + 30+ soru" yaklaşımı **over-engineered**'dı: o sorular Avrasya'nın **kendi satış argümanları**, **bizim outreach mailimizin işi değil**. Mail amacı sadece **stand randevusu** — detay konuşması fuarda Avrasya'nın işi.

**Yeni yaklaşım:**

1. **Sadeleştirilmiş onay dosyası hazır:** 📞 **[docs/musteri/AVRASYA_SORULAR.md](docs/musteri/AVRASYA_SORULAR.md)** — 5 soru, 15-20 dk telefon (PDF: [AVRASYA_SORULAR.pdf](docs/musteri/AVRASYA_SORULAR.pdf))
2. **Avrasya onayı şimdilik atlanır** — sistem K-1...K-8 varsayımlarıyla Sprint 1 → Sprint 3 mail bulma'ya kadar ilerler
3. **Mail gönderme elle** — sistem `status='draft'` mail kuyruğunda durur; Avrasya onayı sonrası "Toplu Onayla + Gönder" elle tetiklenir

Sprint 1 → Sprint 3 Codex iş paketi: **[docs/teknik/SPRINT_1_TAM_TARAMA_IS_PAKETI.md](docs/teknik/SPRINT_1_TAM_TARAMA_IS_PAKETI.md)**

---

## Hedef Metrikler

| Metrik | Hedef | Sahibi |
|---|---|---|
| Onaylı aday firma | 200+ | Claude (kalite) + Codex (sistem) |
| Outreach mail | 60-100 | Claude (template) + Codex (gönderim) |
| Yanıt oranı | ≥%15 | Claude (kişiselleştirme) |
| Stand randevusu | 20+ (hedef 30-35) | Avrasya export ekibi |
| scrape başarı oranı | ≥%95 | Codex |
| Sistem uptime fuar haftası | %99 | Codex |

---

## Sprint 0 — Keşif & Kalibrasyon (Hafta 1-2: 2026-05-21 → 06-04)

### Engelleyiciler (önce çöz)

- [ ] **🧠 Claude** — Avrasya export sorumlusunun kimliğini netleştir: kim mail gönderecek, kim onay panelini kullanacak (K-3) — **görüşme bekleniyor**
- [x] **🧠 Claude** — `info@promats.com.tr` için SPF/DKIM/DMARC durumu kontrol — eksik kayıt varsa Avrasya BT'sine talep göndermek için raporla — ✅ **[docs/musteri/promats-email-auth-durumu.md](docs/musteri/promats-email-auth-durumu.md)** (SPF sağlıklı; DMARC yok, DKIM belirsiz — Avrasya BT talep metni hazır)
- [x] **⚙️ Codex** — market_pulse `backend/.env` ve scraper-service erişimini doğrula: `SCRAPER_SERVICE_URL`, `SCRAPER_SERVICE_API_KEY`, `SCRAPER_CALLBACK_SECRET` (scraper-service prod URL'i .env'e gir) — local `.env` prod scraper URL + API key + callback secret ile doğrulandı
- [x] **⚙️ Codex** — scraper-service prod ortamı sağlıklı mı kontrol: `curl ${SCRAPER_SERVICE_URL}/health` ve docker compose status — `https://scraper.guezelwebdesign.com/health` OK, api/worker/redis ayakta

### scraper-service tarafı — Messe Frankfurt kalibrasyonu

- [x] **🧠 Claude** — Browser DevTools yerine WebFetch + DNS keşfiyle Automechanika sitesinin yapısını incele. **Hedef:** Internal JSON API endpoint'i tespit etmek (K-8 stratejisi B). ✅ **[docs/teknik/messefrankfurt-network-analizi.md](docs/teknik/messefrankfurt-network-analizi.md)** — AEM tabanlı; `.json/.infinity.json` selector'ları 404 (B kapalı); DuckDuckGo HTML site search çalışıyor (C açık)
- [x] **🧠 Claude** — XHR yoksa DOM yapısını çıkar: liste + detail URL pattern'leri, AEM characteristics, beklenen extractor mantığı dökümlendi (raporun §2-§4) — **Codex'in canlı Playwright kalibrasyonu yapmasını bekliyor**
- [x] **⚙️ Codex** — Claude'un network/DOM analizi raporuna göre [scraper-service/src/engine/extractors.py:333](../scraper-service/src/engine/extractors.py#L333) içine Messe Frankfurt branch'i ekle:
  - URL pattern: `automechanika.messefrankfurt.com` veya yeni helper `_extract_messefrankfurt_list(html, url)`
  - Fallback: mevcut generic akış
- [x] **⚙️ Codex** — Yeni profil: `fair-exhibitor-detail`
  - [scraper-service/src/schemas/scrape.py:6](../scraper-service/src/schemas/scrape.py#L6) `ScrapeProfile` enum'una ekle
  - Yeni extractor: `extract_fair_exhibitor_detail`
  - Çıkış alanları: `name, hall, booth, country, city, address, website, phone, email, product_groups[], brands[], target_markets[], description, trade_audience[]`
  - JSON-LD varsa öncelikli kullan, yoksa selector-based fallback
- [x] **⚙️ Codex** — Anti-bot / rate-limit ayarı: stealthy mode + 2-5 sn random delay + UA rotation. 100 ardışık URL test et — `scripts/automechanika-rate-limit-check.sh` prod scraper ile 100/100 başarılı; 403/429/captcha/block sinyali yok; summary: `/tmp/automechanika_rate_limit_1779321557/summary.tsv`
- [x] **⚙️ Codex** — scraper-service değişikliklerini PR + deploy — deploy yapıldı; local değişiklikler commitlenip `feat/automechanika-fair-detail` branch'i push edildi; PR: https://github.com/Orhanguezel/scraper-service/pull/1
- [x] **🧠 Claude** — Deploy sonrası kalite QA: Codex'in PoC çıktısı (`/tmp/automechanika_*.json`) analiz edildi — ✅ **[docs/teknik/poc-kalite-kontrol-raporu.md](docs/teknik/poc-kalite-kontrol-raporu.md)** — Detail extractor mükemmel (Avrasya 12/12 alan); Liste extractor 3 kalibrasyon işi (K-1 extractor 30'da kesiyor, K-2 sayfalama yok, K-3 liste website null); yeni domain bulgusu **info@avrasyaotomotiv.net**

### market_pulse tarafı — Fair modülü genişletme

- [x] **⚙️ Codex** — [backend/src/modules/lead-machine/fair/fair.scraper.ts](backend/src/modules/lead-machine/fair/fair.scraper.ts) içine `scrapeExhibitorDetail(detailUrl)` ekle (yeni `fair-exhibitor-detail` profilini çağırır)
- [x] **⚙️ Codex** — [backend/src/modules/lead-machine/fair/fair.job.ts](backend/src/modules/lead-machine/fair/fair.job.ts) iki aşamalı akışa geç:
  1. Liste sayfasından detail URL'leri topla
  2. Her detail URL için ayrı scrape + ICP eşleştirme + `lead_candidates`'a kayıt
  3. Hata izolasyonu: bir detail başarısız olsa job çökmesin
- [x] **⚙️ Codex** — Booth grid parser: `parseBooth("3.1 D11") → { hall: '3.1', row: 'D', col: 11 }` helper'ı `backend/src/modules/lead-machine/fair/booth.ts` olarak ekle (test ile)
- [x] **⚙️ Codex** — [backend/src/modules/lead-machine/b2b/icp.matcher.ts](backend/src/modules/lead-machine/b2b/icp.matcher.ts) içine Automechanika kategori taksonomisi (Hall 3.0/3.1/4.0 = aksesuar) eşleşme kuralları ekle

### ICP onaylama (Avrasya kalibresi)

- [ ] **🧠 Claude** — Avrasya ile 30 dk video ICP review: K-1 pazarları, K-5 ürün önceliği, dışlama kuralları (kendi üretimi olan firmalar = rakip listesi) — **görüşme sonrası v2'ye geçiş**
- [x] **🧠 Claude** — ICP **draft v1** hazırlandı (Avrasya görüşmesi öncesi master plan + Strateji C bulgularına dayalı) — ✅ **[docs/teknik/icp-automechanika-final.md](docs/teknik/icp-automechanika-final.md)** — kullanıma hazır SQL INSERT bloğu içerir
- [x] **⚙️ Codex** — Avrasya ICP'sini DB'ye seed et: [018_lead_machine_schema.sql:157-170](backend/src/db/seed/sql/018_lead_machine_schema.sql#L157-L170) yapısında yeni satır. **Hazır SQL:** [docs/teknik/icp-automechanika-final.md](docs/teknik/icp-automechanika-final.md) "Codex için SQL — Kullanıma hazır" bölümünü kopyala. ICP UUID: `9f4c8f04-64b8-4da5-9c7d-4a4b5cf4b1b0`.

### PoC

- [x] **⚙️ Codex** — [scripts/poc-automechanika-fair-scrape.sh](scripts/poc-automechanika-fair-scrape.sh) ile end-to-end test: liste + detail çekiyor mu, kaç exhibitor düşüyor — prod scraper ile `30` liste kaydı + Avrasya detail çekildi; detail alanları name/email/phone/booth/product_groups OK
- [x] **🧠 Claude** — PoC çıktısının kalite kontrolü: precision raporu yazıldı — ✅ **[docs/teknik/sprint-1-precision-raporu.md](docs/teknik/sprint-1-precision-raporu.md)** (429 exhibitor analizi, K-1 pilot 166 firma, mail %88 + website %90 coverage, ICP v1 sonrası ~45-55 aday tahmini, ICP v2 sonrası 70-90); rakip intel: **[docs/teknik/rakip-intel-automechanika-2026.md](docs/teknik/rakip-intel-automechanika-2026.md)** (Frogum POL = en büyük rakip, Apesan TUR yan stand D32)

### Sprint 0 çıkışı

- [ ] **🧠 Claude** — Sprint 0 retrospektif: bu belgenin "Onaylanmış Kararlar" tablosunu güncelle, Sprint 1 hedeflerini netleştir

---

## Sprint 1 — Tam Tarama (Hafta 3-4: 2026-06-04 → 06-18)

- [ ] **🧠 Claude** — Tarama kapsamı kararı: hangi hall'lar (3.0/3.1/4.0 dışında 8.0 customising hall'u dahil mi?), hangi keyword filtreleri
- [x] **⚙️ Codex** — Tam exhibitor URL listesini çek (hall filtreli) — Messe public API endpoint'i doğrulandı; `scripts/automechanika-export-exhibitor-urls.sh` eklendi. Varsayılan ICP hall seti `3.0,3.1,4.0` → `429` benzersiz detail URL (`/tmp/automechanika_exhibitors_1779323484/detail-urls.txt`); tüm fuar `HALLS=all` → `2325` benzersiz detail URL (`/tmp/automechanika_exhibitors_1779323574/detail-urls.txt`)
- [x] **⚙️ Codex** — Paralel detail scrape job'ı (max 5 eşzamanlı, total ~8 saat tarama süresi) — `fair.job.ts` detail aşaması `detail_concurrency` ile max 5 paralel çalışıyor; `fair.scraper.ts` Automechanika için Messe API tam/hall filtreli listeyi kullanıyor. Test: `bun test src/modules/lead-machine/__tests__/fair.test.ts src/modules/lead-machine/__tests__/icp.test.ts` → 20 pass; `bun run build` OK
- [x] **⚙️ Codex** — ICP filtresinden geçir → `lead_candidates.status='pending'` durumunda DB'de — `runFairJob` detail sonrası `matchesIcp` ile filtreleyip `insertCandidate` çağırıyor; `lead_candidates.status` schema default'u `pending`; fair job testi insert akışını doğruluyor
- [x] **⚙️ Codex** — Onay paneli admin sayfası: `admin_panel/src/app/(main)/admin/lead-machine/fair/review` (3 buton: Onayla / Reddet+tag / Favori) — route eklendi: `admin_panel/src/app/(main)/admin/(admin)/market/lead-machine/fair/review/page.tsx`; mevcut aday paneli fuar kanalına kilitlenmiş review modu ile kullanılıyor. Test: `bun run typecheck` OK
- [x] **🧠 Claude** — Onay paneli UX review + onboarding kılavuzu Avrasya export ekibi için — ✅ **[docs/musteri/lead-onay-paneli-kullanim-rehberi.md](docs/musteri/lead-onay-paneli-kullanim-rehberi.md)** (3 dk/aday akışı, klavye kısayolları, red sebepleri, sık karşılaşılan durumlar)
- [ ] **🧠 Claude + Avrasya** — Günde 50-100 aday review (K-3 taahhüdü uyarınca 30 dk × 5 gün ~= 250 aday review) — Avrasya görüşmesi sonrası
- [x] **⚙️ Codex** — Red sebepleri (`reject_tags`) → `lead_rejection_patterns` tablosuna periyodik aggregate job — `aggregateRejectionPatterns()` eklendi; `POST /lead-machine/rejection-patterns/aggregate` manuel tetikleme var; `registerLeadMachineJobs` 6 saatte bir aggregate çalıştırıyor. Test: `bun test src/modules/lead-machine/__tests__/fair.test.ts src/modules/lead-machine/__tests__/icp.test.ts` → 21 pass; `bun run build` OK
- [x] **🧠 Claude** — **ICP v2** üret (Sprint 1 429-firma analizine göre, Avrasya beklemeden) — ✅ **[docs/teknik/icp-automechanika-final.md](docs/teknik/icp-automechanika-final.md)** ICP v2 bölümü (Polonya priority eklendi, TUR exclude_geographies'a girdi, exclude_patterns'a paspas/aksesuar/dernek/buying alliance + auto_approve_threshold 7.0; **Codex SQL hazır seedeklenip mevcut adayları yeniden değerlendirsin**)

---

## Sprint 2 — Komşu Stand (Hafta 5-6: 2026-06-18 → 07-02)

> **⚠️ 10times entegrasyonu DROP edildi (2026-05-21).** Sebep: 10times'ın public/self-serve API'ı **yok**; ihtiyacımız da yok (Messe public API 429 exhibitor + mail/website veriyor). Detay: **[docs/teknik/10times-drop-karari.md](docs/teknik/10times-drop-karari.md)**

- [x] **⚙️ Codex** — Komşu stand hesabı: Avrasya'nın `3.1 D11` koordinatından ±5 mesafedeki adayları `raw_data.fair_info.is_neighbor=true` flag'le — `isNeighborBooth()` helper'ı eklendi; `runFairJob` raw_data içine `is_neighbor`, anchor booth ve kolon mesafesini yazıyor. Test: 22 pass; build OK
- [x] **🧠 Claude** — Komşu stand öncelikli aday listesi raporu: top 25 — ✅ **[docs/teknik/sprint-2-komsu-stand-top25.md](docs/teknik/sprint-2-komsu-stand-top25.md)** (Avrasya D11'in Manhattan mesafesine göre 25 firma; ✅✅ Sıcak: HromTech DE E30 + Carmotion POL C31; 11 sıcak/incele aday; ICP v2'ye `neighbor_bonus: +0.5` boost önerisi)
- ~~10times.com event_id, API key, dedupe işleri~~ — **DROP** (yukarıdaki karar belgesi)

---

## Sprint 3 — Enrichment + Outreach Faz 1 (Hafta 7-9: 2026-07-02 → 07-23)

### Karar verici enrichment

- [ ] **🧠 Claude** — Apollo.io hesabı + API key (K-4 bütçesi onaylı, Paspas faturalandırma)
- [ ] **⚙️ Codex** — `.env`'e `APOLLO_API_KEY` ekle + [backend/src/modules/lead-machine/enrichment/enrichment.service.ts](backend/src/modules/lead-machine/enrichment/enrichment.service.ts) üzerinden onaylı adaylar için karar verici + email çekimi — **key bekliyor:** local `backend/.env` içinde `APOLLO_API_KEY=<empty>`; kod yolu hazır ve Apollo response normalize ediliyor (isim/unvan/email/LinkedIn/telefon), key yoksa scraper fallback çalışıyor. Test: enrichment/controller → 24 pass; backend build OK
- [x] **⚙️ Codex** — Onaylı aday → enrichment job otomatik tetikleme (event-driven veya cron) — aday `approved`/`favorite` review aldığında veya `approve-to-lead` ile pipeline'a aktarıldığında `enrichCandidate` arka planda tetikleniyor. Test: controller/enrichment/fair → 35 pass; build OK
- [x] **🧠 Claude** — Apollo hit oranı düşükse (<%50) manuel LinkedIn fallback iş akışı yaz — ✅ **[docs/teknik/apollo-fallback-sop.md](docs/teknik/apollo-fallback-sop.md)** (LinkedIn → Hunter pattern → mail-tester doğrulama; 5 dk/aday; GDPR + KVKK notları)

### Outreach Faz 1 (fuar versiyonu — K-7 uyarınca öne çekildi)

- [x] **🧠 Claude** — Mail template'lerini yaz: TR, EN, DE × Distribütör/E-com segmentleri (6 şablon + 1 uzun yedek) — ✅ **[docs/musteri/automechanika-2026-outreach-templates.md](docs/musteri/automechanika-2026-outreach-templates.md)** (placeholder sözlüğü + A/B konu satırı + spam direnci kuralları)
- [x] **🧠 Claude** — GPT-4o-mini kişiselleştirme prompt'unu yaz — ✅ **[docs/teknik/outreach-personalization-prompt.md](docs/teknik/outreach-personalization-prompt.md)** (system prompt + örnek input/output + kalite kapısı + maliyet tahmini)
- [x] **⚙️ Codex** — Yeni servis: `backend/src/modules/lead-machine/outreach/draft.service.ts` — Claude'un template + prompt'unu kullan, `lead_outreach_drafts.status='draft'` ile yaz — fuar template'i EN/DE/TR sabit konu + tek cümle AI kişiselleştirme ile üretildi; draft insert default `draft` akışına bırakıldı. Test: outreach/controller → 26 pass; `bun run build` OK
- [x] **⚙️ Codex** — Outreach onay sayfası: `admin_panel/.../outreach/drafts` (taslağı oku, düzenle, "Gönder"e bas) — mevcut taslak editörü exact route alias ile açılıyor: `/admin/market/lead-machine/outreach/drafts`; konu/gövde düzenleme, kopyalama, gönderildi/arşiv/yanıt takibi kontrolleri var. Test: admin `bun run typecheck` OK; route HTTP 200
- [x] **⚙️ Codex** — Mail gönderim entegrasyonu: Postmark (önerilen) veya Avrasya kendi SMTP'si — gönderim sonrası `status='sent'`, `sent_at=NOW()` — SMTP/site-settings destekli `sendMailRaw` aktif; `POST /lead-machine/outreach/drafts/:id/send` alıcıyı enrichment/candidate/lead email'den çözüp gönderiyor, sonra `sent_at=CURRENT_TIMESTAMP` yazıyor; admin "Gönder" butonu gerçek send endpoint'ine bağlı. Test: backend outreach/controller → 28 pass; backend build OK; admin endpoint test → 11 pass; admin typecheck OK
- [x] **🧠 Claude** — `info@promats.com.tr` için SPF/DKIM/DMARC kayıtlarını doğrula (engelleyici K-2 cevabı). Eksikse DNS düzenlemesi talimatı yaz — ✅ **[docs/musteri/promats-email-auth-durumu.md](docs/musteri/promats-email-auth-durumu.md)** (Sprint 0'da tamamlandı — DMARC eksik, BT'ye gönderilecek talep metni hazır)
- [x] **⚙️ Codex** — Açma takibi (pixel tracker) — opsiyonel, Faz 1'de skip edilebilir — gönderilen outreach HTML'ine `/api/v1/lead-machine/outreach/open/:id/pixel.gif` 1x1 pixel'i ekleniyor; public endpoint `opened_at` + `open_count` güncelliyor, admin taslak kartında açılma sayısı görünüyor. Test: backend outreach/controller → 29 pass; backend build OK; admin typecheck OK
- [ ] **🧠 Claude** — İlk 10 maili manuel review et, kişiselleştirme paragrafı kalitesini değerlendir, prompt'u iyileştir — **Codex draft.service.ts'i ürettikten sonra**

---

## Sprint 4 — Randevu & Hazırlık (Hafta 10-12: 2026-07-23 → 08-13)

- [x] **🧠 Claude** — Avrasya export ekibi için Calendly kurulum rehberi — ✅ **[docs/musteri/calendly-kurulum-rehberi.md](docs/musteri/calendly-kurulum-rehberi.md)** (Free Basic plan + 1 event type + 4 fuar günü 09-18 slot'lar + UTM tracking + günlük 5 dk manuel sync; manuel iş Avrasya hesabı açılınca)
- [x] **🧠 Claude** — T-14/T-7/T-1 hatırlatma template'leri (Codex cron için) + Calendly link entegrasyonu — ✅ **[docs/musteri/automechanika-2026-randevu-hatirlatma-templates.md](docs/musteri/automechanika-2026-randevu-hatirlatma-templates.md)** (9 mail TR/EN/DE × 3 zaman; `lead_appointments` schema; cron iskeleti; cancel/reschedule senaryoları); `{calendly_link}` placeholder zaten outreach template'lerinde
- [x] **⚙️ Codex** — Hatırlatma sequence: T-14, T-7, T-1 gün otomatik (cron job, Postmark template) — `lead_outreach_drafts.sequence_step` + `last_reminder_at` eklendi; daily lead-machine job T-14/T-7/T-1 aşamalarında yanıt gelmemiş sent taslaklara reminder/closing mail gönderiyor ve aşamayı ilerletiyor. Test: backend outreach/controller → 31 pass; backend build OK; admin typecheck OK
- [x] **🧠 Claude** — Stand brifing dokümanı — her aday için 1 sayfalık özet kart — ✅ **[docs/teknik/stand-brifing-kart-sablon.md](docs/teknik/stand-brifing-kart-sablon.md)** (markdown şablon + alan sözlüğü + GPT-4o-mini ile niye-buradalar tahmini + ne demeyeceğiz listesi)
- [x] **⚙️ Codex** — Stand brifing kartlarını PDF olarak otomatik üreten endpoint (admin'den toplu indir) — **Şablon hazır:** [docs/teknik/stand-brifing-kart-sablon.md](docs/teknik/stand-brifing-kart-sablon.md) "Codex'in Yapacağı" bölümü (puppeteer önerisi) — hafif PDF servisi eklendi: `GET /lead-machine/fair/brifing/:candidateId.pdf`, `GET /lead-machine/fair/brifing/day/:date.pdf`, `POST /lead-machine/fair/brifing/bulk`; aday/fuar/enrichment/ICP sinyallerinden printable kart üretiyor. Test: fair/outreach → 24 pass; backend build OK; admin typecheck OK

---

## Sprint 5 — Fuar Operasyonu (08-13 → 09-12)

- [x] **⚙️ Codex** — Mobile-friendly stand paneli: `admin_panel/.../fair-day` — günün randevu listesi + aday kartları, mobile responsive — route eklendi: `/admin/market/lead-machine/fair-day`; onaylı/favori fuar adaylarını mobil kartlarla gösteriyor, arama/favori filtresi, komşu/score rozetleri, PDF brifing indir, kaynak aç, enrichment ve taslak üret aksiyonları var. Test: admin typecheck OK; endpoint test 11 pass; route HTTP 200
- [x] **🧠 Claude** — Stand operasyon SOP'u (sabah hazırlık, randevu akışı, walk-in karşılama, akşam review, acil durumlar) — ✅ **[docs/musteri/fuar-stand-operasyon-sop.md](docs/musteri/fuar-stand-operasyon-sop.md)** (3 kişilik rol dağılımı + 45 dk randevu paketi + günlük 5 zorunlu aksiyon)
- [x] **🧠 Claude** — Stand çalışan eğitimi gündemi (T-3 günü 1.5 saatlik oturum) — ✅ **[docs/musteri/stand-ekibi-egitim-gundemi.md](docs/musteri/stand-ekibi-egitim-gundemi.md)** (dakika-dakika gündem + rol oyna + 3 walk-in senaryo + materyal kontrol listesi)
- [x] **🧠 Claude** — QR/kartvizit toplama formu spec (basılı A5 + zımba + Codex import) — ✅ **[docs/musteri/fuar-kartvizit-toplama-formu.md](docs/musteri/fuar-kartvizit-toplama-formu.md)** (A5 form şablonu + akşam akışı + Codex import scripti taslağı + `channel='trade_fair_in_person'` schema önerisi + Faz 2 OCR opsiyonu)
- [ ] **🧠 Claude + Avrasya** — Günlük 18:00 review: o günkü randevuların notları + ertesi gün hatırlatma (WhatsApp grubu) — **SOP'ta detayı var, fuar haftası manuel iş**
- [x] **⚙️ Codex** — Fuar haftası sistem nöbeti: Sentry alarmı + scraper-service status izleme — `SENTRY_DSN` mevcutsa Sentry aktif; lead-machine job artık 15 dakikada bir `${SCRAPER_SERVICE_URL}/health` kontrol ediyor, hata durumunda log + Sentry exception gönderiyor. Test: backend build OK

---

## Sprint 6 — Post-show (09-12 → 09-30)

- [x] **⚙️ Codex** — Fuarda toplanan kartvizit/QR verisi → `lead_candidates` import scripti (`channel='trade_fair_in_person'`) — `bun run fair:import-cards -- --file=/path/cards.csv` scripti eklendi; CSV/JSON okuyor, basit dedupe yapıyor, `trade_fair_in_person` pending adaylarını import job ile ilişkilendiriyor. Test: backend build OK; admin typecheck OK
- [x] **🧠 Claude** — Follow-up sequence template (TR + EN + DE) — T+3, T+10, T+30 gün — ✅ **[docs/musteri/automechanika-2026-followup-templates.md](docs/musteri/automechanika-2026-followup-templates.md)** (5 sequence × 3 dil = 15 mail; brifing kart kararına göre tetik mantığı + cron iskeleti)
- [x] **⚙️ Codex** — Follow-up cron job + tracking — post-show `followup_step` + `last_followup_at` eklendi; daily lead-machine job T+3/T+10/T+30 için `sent_at` bazlı follow-up gönderiyor, her turda sadece sıradaki aşamayı ilerletiyor ve mevcut pixel tracking (`opened_at/open_count`) ile takip ediyor. Test: backend outreach/controller → 32 pass; backend build OK; admin typecheck OK
- [x] **🧠 Claude** — KPI raporu Avrasya'ya sunum — ✅ **boş şablon hazır:** [docs/musteri/automechanika-2026-kpi-rapor-sablonu.md](docs/musteri/automechanika-2026-kpi-rapor-sablonu.md) (14 bölüm — funnel + coğrafya + komşu stand etkisi + maliyet analizi + ROI hesabı; 4 sunum formatı seçeneği); **post-show 2026-09-25'te doldurulacak**
- [ ] **🧠 Claude** — Sistem öğrenme: hangi aday tipi randevu verdi → ICP v3 + red pattern güncellemesi — **post-show gerçek aday data ile**
- [x] **🧠 Claude** — Sonraki fuarlar için tekrarlanabilir paket: Reifen Essen, Equip Auto Paris vb. (KARAR belgesi) — ✅ **[docs/strateji/sonraki-fuarlar-karar-belgesi.md](docs/strateji/sonraki-fuarlar-karar-belgesi.md)** (3 ek fuar önerisi + tekrarlanabilirlik mimarisi + Türk ihracatçı KOBİ pazar paketi fiyatlandırması + yeni fuar 2 saat kurulum CLI)
- [x] **⚙️ Codex** — "Generic fair runner" abstraction: fuar URL + ICP id verilince Sprint 1-3 otomatik akmalı — `buildGenericFairRunnerParams()` ve `POST /lead-machine/fair/run` eklendi; `fair_url + icp_id` ile liste → detail → ICP filtre → candidate insert akışı güvenli varsayılanlarla başlıyor. Admin RTK hook'u `useStartGenericFairRunnerMutation` eklendi. Test: fair/outreach → 27 pass; backend build OK; admin endpoint test 11 pass; admin typecheck OK

---

## Risk İzleme

Bu riskler [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](docs/strateji/AUTOMECHANIKA_2026_PLANI.md) Bölüm 8'de detaylı; burada haftalık takip için:

| Risk | Sahibi | Durum (haftalık güncelle) |
|---|---|---|
| Messe Frankfurt scraping bloku | Codex | — |
| Apollo hit oranı düşük (<%50) | Claude (fallback SOP) | — |
| Outreach spam'e düştü | Claude (DKIM/DMARC) + Codex (gönderim hijyeni) | — |
| Avrasya onay paneli kullanılmıyor | Claude (haftalık review oturumu) | — |
| ICP yanlış kalibre, çöp aday | Claude (precision QA) | — |

---

## Haftalık Sync

Her Çarşamba 30 dk:
- Geçen hafta tamamlanan checkbox'lar
- Bu hafta blokerler
- Risk durumu güncelle
- Bir sonraki sprint hedefi netleştir

İlk sync: **2026-05-28 Çarşamba**.

---

## Bağlantılı Belgeler

- 📋 Master strateji: [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](docs/strateji/AUTOMECHANIKA_2026_PLANI.md)
- 🔧 Teknik detay çeklist: [docs/teknik/FAIR_MODULU_CEKLISTI.md](docs/teknik/FAIR_MODULU_CEKLISTI.md)
- 👤 Müşteri dosyası: [docs/musteri/avrasya-paspas-automechanika.md](docs/musteri/avrasya-paspas-automechanika.md)
- 🏗️ Üst SaaS planı: [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](docs/strateji/MARKET_PULSE_SAAS_PLANI.md)
- 📊 Lead Machine genel raporu: [docs/teknik/LEAD_MACHINE_RAPOR.md](docs/teknik/LEAD_MACHINE_RAPOR.md)
- 🧪 PoC scripti: [scripts/poc-automechanika-fair-scrape.sh](scripts/poc-automechanika-fair-scrape.sh)

## Paralel Çeklistler

Bu fuar pilotu ile aynı dönemde yürüyen iki büyük tek-seferlik iş:

- 🔄 [docs/teknik/AMOZON_AKTARIM_CEKLISTI.md](docs/teknik/AMOZON_AKTARIM_CEKLISTI.md) — amozon Amazon kodlarının Risk modülü olarak market_pulse'a aktarımı
- 🎨 [docs/teknik/TEMA_MIGRASYON_CEKLISTI.md](docs/teknik/TEMA_MIGRASYON_CEKLISTI.md) — amozon görsel diline geçiş (Shadcn token map)
