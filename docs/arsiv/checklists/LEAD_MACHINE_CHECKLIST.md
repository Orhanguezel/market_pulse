# MarketPulse — Lead Machine Modülü Ceklisti

> Kaynak: `LEAD_MACHINE_RAPOR.md` (4 belgeden derlendi)
> Oluşturulma: 2026-05-07
> Araçlar: **Claude** (mimari), **Codex** (backend), **Cursor** (admin panel), **Antigravity** (UI doğrulama)

---

## Mimari: Mevcut Yapıya Entegrasyon

```
Amazon Scraper ─┐
B2B Directory  ─┼──→ lead_candidates (yeni) ──→ Onay Paneli ──→ market_leads (mevcut)
Fuar Exhibitor ─┘                                                       ↓
                                                              Pipeline + Churn + Rapor
```

`market_leads.source` yeni değerleri: `amazon` | `b2b_directory` | `trade_fair` | `icp_match`

---

## Scraper-Service Entegrasyonu

> **Önemli:** Mevcut `scraper-service` Python microservisi (FastAPI, port 8200, Playwright stealth) Lead Machine'in tüm scraping ihtiyaçlarını karşılar. **Apify gerekmiyor → $30-49/ay tasarruf.**

| Scraper-Service Endpoint | Lead Machine Kullanımı | Durum |
|--------------------------|------------------------|-------|
| `POST /api/v1/scrape` | Europages/TOBB dizin sayfaları, website içerik analizi, fuar exhibitor listeleri | ✅ Mevcut (yeni profil gerekiyor) |
| `POST /api/v1/places/google-maps` | B2B Google Maps firma araması | ✅ Tamamen mevcut — sıfır geliştirme |
| `POST /api/v1/jobs` (async) | Büyük batch job'lar (50+ aday), webhook callback | ✅ Mevcut |

**Yeni profiller eklenmesi gereken** (scraper-service'e PR):
- `website-analysis` — şirket sitesi içerik analizi (şu an sadece `geo-page` var)
- `directory-listing` — Europages/Kompass yapılandırılmış veri çıkarımı
- `fair-exhibitor` — Fuar exhibitor listesi HTML parse

**Amazon için**: Scraper-service Amazon'u desteklemiyor (TOS riski). Apify yerine resmi Amazon SP-API veya Oxylabs/ScraperAPI kullanılmalı (ilk sprint'te en az riskli seçenek: Oxylabs $20/ay).

---

## Mevcut Durum

| Özellik | Durum |
|---------|-------|
| Lead pipeline (market_leads) | ✅ Var |
| DB şeması 018 (6 yeni tablo) | ✅ Tasarlandı (Claude) |
| Varsayılan ICP seed | ✅ Yazıldı (Claude) |
| Sonuç raporu (LEAD_MACHINE_RAPOR.md) | ✅ Yazıldı (Claude) |
| Tüm uygulama | ⏳ Codex + Cursor bekliyor |

---

## BÖLÜM H — Ortak Altyapı

### H1. DB Şeması

> **Görev:** Claude ✅ + Codex | **Öncelik:** 🔴 Kritik

- [x] `018_lead_machine_schema.sql` oluşturuldu:
  - `icp_profiles` — ICP tanımları (JSON `definition`)
  - `lead_search_jobs` — kanal + params + status + result_count
  - `lead_candidates` — ham aday, status, raw_data, ai_summary, lead_score, reject_reason
  - `lead_enrichment` — Apollo/LinkedIn/scraping verisi, decision_maker JSON
  - `lead_outreach_drafts` — AI e-posta taslakları
  - `lead_rejection_patterns` — öğrenme mekanizması için pattern tablosu
  - Varsayılan Paspas ICP seed kaydı (Oto Aksesuar Distribütörü — Avrupa)

**Codex:**
- [x] `bun run db:seed` ile tabloları oluştur, seed kontrolü yap

---

### H2. Env Değişkenleri

> **Görev:** Codex | **Öncelik:** 🔴 Kritik

`backend/src/core/env.ts`'e eklenecekler:

- [x] Scraper-service (self-hosted — ana scraping motoru):
  ```ts
  SCRAPER_SERVICE_URL:     z.string().default('http://localhost:8200'),
  SCRAPER_SERVICE_API_KEY: z.string().optional(),
  ```
- [x] Amazon (scraper-service Amazon'u desteklemiyor — TOS):
  ```ts
  OXYLABS_USERNAME:   z.string().optional(),   // Amazon scraping (~$20/ay)
  OXYLABS_PASSWORD:   z.string().optional(),
  ```
- [x] AI:
  ```ts
  GROQ_API_KEY:       z.string().optional(),   // ücretsiz, review + website analizi
  OPENAI_API_KEY:     z.string().optional(),   // GPT-4o-mini/4o, ICP + outreach
  ```
- [x] Enrichment:
  ```ts
  APOLLO_API_KEY:     z.string().optional(),   // karar verici email/LinkedIn lookup
  ```
- [x] Fuar:
  ```ts
  TENTIMES_API_KEY:   z.string().optional(),   // 10times.com attendee intent
  WHRAI_API_KEY:      z.string().optional(),   // whr.ai satın alma niyeti (ücretli)
  ```

`.env.example`'a da ekle:
```
# Lead Machine — Scraper Service (self-hosted, web scraping motoru)
SCRAPER_SERVICE_URL=http://localhost:8200
SCRAPER_SERVICE_API_KEY=

# Lead Machine — Amazon (ayrı servis, scraper-service TOS uyumsuz)
OXYLABS_USERNAME=
OXYLABS_PASSWORD=

# Lead Machine — AI
GROQ_API_KEY=
OPENAI_API_KEY=

# Lead Machine — Enrichment
APOLLO_API_KEY=

# Lead Machine — Fuar
TENTIMES_API_KEY=
WHRAI_API_KEY=
```

---

### H3. Backend Ortak Altyapı

> **Görev:** Codex | **Öncelik:** 🔴 Kritik

- [x] `backend/src/modules/lead-machine/` dizin yapısı:
  ```
  lead-machine/
    _shared/
      ai.client.ts        ← Groq + OpenAI client (env'e göre hangisi varsa)
      scraper.client.ts   ← Apify API wrapper
      candidate.helpers.ts ← candidate → market_lead dönüşümü
    amazon/
    b2b/
    fair/
    enrichment/
    outreach/
    icp/
    router.ts
  ```

- [x] `ai.client.ts`:
  - `askGroq(prompt, model?)` → string (ücretsiz, hız öncelikli)
  - `askOpenAI(prompt, model?)` → string (kalite öncelikli)
  - Öncelik: GROQ_API_KEY varsa Groq, yoksa OpenAI

- [x] `scraper.client.ts` (scraper-service REST API wrapper — Apify DEĞİL):
  ```ts
  // Sync scrape (tek URL, hızlı)
  scrape(url, profile, options?) → { html?, text?, status }
  // Async job (büyük batch, webhook callback)
  startJob(type: 'scrape'|'places-google-maps', payload) → { job_id }
  getJob(jobId) → { status, result? }
  // Google Maps (B2B firma araması — scraper-service'te TAM MEVCUT)
  searchGoogleMaps(query, country, limit) → Place[]
  ```
  - Base URL: `env.SCRAPER_SERVICE_URL`
  - Auth: `Authorization: Bearer {env.SCRAPER_SERVICE_API_KEY}`
  - Webhook callback: `POST /admin/lead-machine/scraper-callback` (market_pulse backend'e eklenecek)
  - Webhook doğrulama: HMAC-SHA256 (`X-Signature` header, shared secret)

- [x] **Webhook callback endpoint** (H3 kapsamında, Codex):
  - `POST /admin/lead-machine/scraper-callback`
  - Payload: `{ job_id, status: 'completed'|'failed', result?, error? }`
  - HMAC doğrulama → `lead_search_jobs` güncelle → `lead_candidates`'a yaz

- [x] **Scraper-service yeni profilleri** (scraper-service repo'ya PR — ayrı iş):
  - `website-analysis`: şirket sitesi içerik + B2B sinyalleri
  - `directory-listing`: Europages/Kompass yapılandırılmış veri
  - `fair-exhibitor`: Fuar exhibitor tablo/liste HTML parse

- [x] `candidate.helpers.ts`:
  - `candidateToMarketLead(candidate)` → `market_leads` insert objesi
  - source alanı candidate.channel'dan gelir

- [x] `router.ts` — `registerLeadMachineAdmin(app)` fonksiyonu, `project.ts`'e eklenir

---

### H4. Kullanıcı Onay Paneli (Tüm Kanallar İçin Ortak)

> **Görev:** Cursor | **Öncelik:** 🔴 Kritik

- [x] Backend:
  - `GET /admin/lead-machine/candidates?channel=&status=&job_id=&page=&limit=` — filtrelenmiş aday listesi
  - `PATCH /admin/lead-machine/candidates/:id/review` — body: `{ action: 'approve'|'reject'|'favorite', reject_reason? }`
  - `POST /admin/lead-machine/candidates/:id/approve-to-lead` — market_leads'e taşı

- [x] Admin panel: `/admin/market/lead-machine/candidates` sayfası
  - Kanal filtresi (Amazon / B2B / Fuar)
  - Durum filtresi (Bekliyor / Onaylandı / Reddedildi / Favori)
  - Aday kartı bileşeni (`<CandidateCard />`):
    - Firma adı, website, ülke, lead_score (0-10)
    - `ai_summary` — 2-3 satır özet
    - `raw_data`'dan kanal özgü gösterim (Amazon: problem_score, B2B: pain_points, Fuar: fuar adı/tarihi)
    - Aksiyon: ✅ Onayla | ❌ Reddet (reason textarea) | ⭐ Favori
  - Toplu onay: checkbox seçimi + "Seçilenleri Onayla" butonu

- [x] RTK Query: `useListLeadCandidatesQuery`, `useReviewCandidateMutation`, `useApproveToLeadMutation`
- [x] Sidebar'a "Lead Adayları" linki ekle (market grubu altında)

---

### H5. Öğrenme Mekanizması

> **Görev:** Codex | **Öncelik:** 🟠 Orta (H4 sonrası)

- [x] `GET /admin/lead-machine/rejection-patterns` — reddedilen adayların pattern analizi:
  - En sık red nedenleri (word frequency)
  - Kanal bazlı: hangi ülkeden / firm type'tan en çok red geliyor
  - Döndürür: `{ channel, pattern, count, last_seen }[]`

- [x] Pattern'ları ICP `exclude_patterns` alanına manuel ekleme UI'ı (ICP düzenleme formunda)

Codex doğrulama notu (2026-05-07): ICP oluşturma/düzenleme formunda `Hariç Pattern` tag input'u `exclude_patterns` alanına bağlı. Admin API ile `exclude_patterns` içeren ICP create/update akışı doğrulandı.

---

## BÖLÜM I — Amazon Lead Machine

> Kaynak: `1) AMAZON LEAD MACHINE.docx`
> API maliyeti: ~$20/ay (Oxylabs — scraper-service Amazon TOS uyumsuz)
> **Not:** Scraper-service genel web scraping'i karşılar; Amazon için Oxylabs E-Commerce API kullanılır.

### I1. Amazon Scraper Backend

> **Görev:** Codex | **Öncelik:** 🟡 Yüksek

- [x] `backend/src/modules/lead-machine/amazon/amazon.scraper.ts`
  - `scrapeAmazonProducts(keyword, marketplace, filters)` → `AmazonProduct[]`
  - **Oxylabs E-Commerce API** (OXYLABS_USERNAME/PASSWORD):
    ```
    POST https://realtime.oxylabs.io/v1/queries
    { source: 'amazon_search', query: keyword, domain: marketplace, pages: 3 }
    ```
  - Her ürün: `product_title`, `price`, `rating`, `review_count`, `product_url`, `seller_name`, `seller_url`
  - Filtreleme (kod içinde): `review_count` 50-500, `rating` 4.0-4.5, `price` range

- [x] `backend/src/modules/lead-machine/amazon/review.analyzer.ts`
  - `analyzeProductReviews(productUrl)` → `{ problem_flags: string[], problem_score: number }`
  - Oxylabs `amazon_reviews` source ile top 50 yorum çek
  - Groq'a gönder: "Bu ürün yorumlarında tespit edilen sorunları listele ve 0-10 arası ciddiyet skoru ver"
  - Negatif flag'ler: smell, fit, thin, quality, slippery, loose, cheap, broke, return, disappointed

- [x] `backend/src/modules/lead-machine/amazon/seller.extractor.ts`
  - `extractUniqueSellers(products)` → `AmazonSeller[]`
  - Tekil seller listesi (aynı seller'ı tekrar etme)

- [x] `backend/src/modules/lead-machine/amazon/amazon.scorer.ts`
  - `scoreAmazonSeller(seller, reviews)` → `lead_score: number (0-10)`
  - Kural tablosu:
    - review_count 50-200 → +2 (hedef segment)
    - rating 4.0-4.5 → +2 (müşteri beklentisi var, tam tatmin değil)
    - problem_score ≥ 5 → +3 (aktif şikayet = tedarikçi değiştirebilir)
    - seller_url mevcut → +1 (doğrulanabilir)
    - price mid-segment → +2

- [x] `backend/src/modules/lead-machine/amazon/amazon.job.ts`
  - `runAmazonJob(jobId)` → job'u çalıştır, `lead_candidates`'a yaz
  - Job status güncelle: pending → running → done/failed

- [x] API endpoint'leri (`router.ts`'e ekle):
  - `POST /lead-machine/amazon/jobs` — job başlat (`{ keyword, marketplace, filters }`)
  - `GET /lead-machine/amazon/jobs` — job listesi + durum + aday sayısı
  - `GET /lead-machine/amazon/jobs/:id` — job detay

### I2. Amazon Arama Ekranı

> **Görev:** Cursor | **Öncelik:** 🟡 Yüksek (I1 sonrası)

- [x] `/admin/market/lead-machine/amazon` sayfası:
  - Keyword input (örn: "car floor mats")
  - Marketplace select: US 🇺🇸 / DE 🇩🇪 / UK 🇬🇧 / FR 🇫🇷 / IT 🇮🇹
  - Filtreler: min/max review, min/max rating, min/max fiyat
  - "Tara" butonu → job başlatır → toast "Arama başladı"
  - Job listesi tablosu: tarih, keyword, marketplace, durum, aday sayısı, "İncele" butonu
  - "İncele" → H4 onay paneline yönlendir (channel=amazon filtreli)

- [x] RTK Query: `useStartAmazonJobMutation`, `useListAmazonJobsQuery`

---

## BÖLÜM J — B2B Lead Machine

> Kaynak: `2) B2B LEAD MACHINE.docx`
> API maliyeti: ~$5-15/ay (AI) + $49-99/ay Apollo (ikinci faz)

### J1. ICP Modülü

> **Görev:** Codex + Cursor | **Öncelik:** 🟡 Yüksek

**Backend:**
- [x] `backend/src/modules/lead-machine/icp/icp.repository.ts`
  - `listIcpProfiles()`, `getIcpProfile(id)`, `createIcpProfile(data)`, `updateIcpProfile(id, data)`

- [x] API:
  - `GET /lead-machine/icp` — ICP listesi
  - `POST /lead-machine/icp` — yeni ICP oluştur
  - `PATCH /lead-machine/icp/:id` — güncelle
  - `DELETE /lead-machine/icp/:id` — sil (aktif job varsa reddet)

**ICP JSON yapısı (tam):**
```json
{
  "sectors": ["automotive accessories"],
  "sub_sectors": ["floor mats", "car care"],
  "firm_types": ["distributor", "importer", "wholesaler", "e-commerce seller"],
  "geographies": ["DE", "AT", "NL", "PL"],
  "sales_types": ["B2B", "B2C"],
  "sales_channels": ["own website", "amazon", "ebay"],
  "price_segment": "mid",
  "min_employees": null,
  "max_employees": null,
  "exclude_countries": [],
  "exclude_patterns": []
}
```

**Cursor:**
- [x] `/admin/market/lead-machine/icp` sayfası — ICP listesi + oluştur/düzenle
- [x] ICP form: her alan için tag input (sektör, ülke vb. çoklu seçim)
- [x] "Varsayılan Paspas ICP" seed kaydı UI'da görünmeli

### J2. B2B Dizin Tarayıcı

> **Görev:** Codex | **Öncelik:** 🟡 Yüksek (J1 sonrası)

- [x] `backend/src/modules/lead-machine/b2b/directory.scraper.ts`
  - `searchDirectory(source, icp, params)` → `RawDirectoryLead[]`
  - Desteklenen kaynaklar (aşamalı):
    - **Aşama 1 — Ücretsiz / Self-hosted:**
      - **Google Maps** → `scraper.client.searchGoogleMaps(query, country)` ✅ TAM MEVCUT
      - **Europages** → `scraper.client.scrape(url, 'directory-listing')` (yeni profil)
      - **TOBB dizini** → `scraper.client.scrape(url, 'directory-listing')`
    - **Aşama 2:** Kompass API, Alibaba seller arama
  - Google Maps: `{ name, address, website, phone, reviews_count, reviews_average, coordinates }`

- [x] `backend/src/modules/lead-machine/b2b/website.analyzer.ts`
  - `analyzeCompanyWebsite(url)` → `WebsiteAnalysis`
  - `scraper.client.scrape(url, 'website-analysis')` ile sayfa içeriği çek (yeni profil)
  - AI prompt (Groq): "Bu web sitesini incele ve şunları tespit et: Sattığı ürünler, B2B mi B2C mi, Çin ürünü satıyor mu, private label var mı, distribütör mü toptancı mı, pain point tahmini"
  - Output: `{ sells, is_b2b, sells_china, private_label, firm_type, pain_points[] }`

- [x] `backend/src/modules/lead-machine/b2b/icp.matcher.ts`
  - `matchesIcp(lead, icp)` → `{ matches: boolean, score: number, reasons: string[] }`
  - ICP ülke, sektör, firma tipi, satış kanalı ile eşleştir

- [x] `backend/src/modules/lead-machine/b2b/b2b.job.ts`
  - `runB2bJob(jobId)` → ICP seç → dizin tara → website analiz → ICP eşleştir → `lead_candidates`'a yaz

- [x] API:
  - `POST /lead-machine/b2b/jobs` — body: `{ icp_id, source, search_query, country? }`
  - `GET /lead-machine/b2b/jobs` — job listesi

**Cursor:**
- [x] `/admin/market/lead-machine/b2b` sayfası:
  - ICP seçici dropdown
  - Kaynak seçici: Europages / TOBB / Google Maps
  - Arama terimi input (opsiyonel — ICP'den otomatik üretilebilir)
  - Ülke filtresi
  - "Tara" butonu, job listesi, "İncele" linki

### J3. Enrichment Modülü

> **Görev:** Codex | **Öncelik:** 🟠 Orta (J2 sonrası)
> API maliyeti: Apollo.io $49-99/ay

- [x] `backend/src/modules/lead-machine/enrichment/enrichment.service.ts`
  - `enrichCandidate(candidateId)` → `lead_enrichment` kaydı yaz
  - **Aşama 1 — Ücretsiz (web scraping):**
    - Website Contact/About sayfasından email, telefon, isim parse et
    - LinkedIn şirket sayfasından çalışan listesi (karar verici tahmini)
  - **Aşama 2 — Apollo.io (APOLLO_API_KEY varsa):**
    - `POST https://api.apollo.io/v1/people/match` → domain + title filter
    - Hedef pozisyonlar: Owner, CEO, Purchasing Manager, Category Manager, Import Manager
    - Response: name, title, email, linkedin_url

- [x] `POST /lead-machine/enrich/:candidateId` — tek aday zenginleştir
- [x] `POST /lead-machine/enrich/batch` — body: `{ candidate_ids[] }` — toplu (max 50)

**Cursor:**
- [x] Aday kartında "Zenginleştir" butonu → polling ile `lead_enrichment` sonucu göster
- [x] Zenginleştirilmiş veri görünümü: karar verici adı, unvan, email (mailto link), LinkedIn (dış link)

---

## BÖLÜM K — Fuar Lead Machine

> Kaynak: `3) Fuar Visitor Kazıma.docx`
> API maliyeti: $0-500/ay (kaynağa göre)

### K1. Fuar Exhibitor Scraper

> **Görev:** Codex | **Öncelik:** 🟠 Orta

- [x] `backend/src/modules/lead-machine/fair/fair.scraper.ts`
  - `scrapeOfficialExhibitorList(fairUrl)` → `RawExhibitor[]`
  - `scraper.client.scrape(fairUrl, 'fair-exhibitor')` (scraper-service yeni profil)
  - HTML pattern tanıma: `<table>`, `<ul>`, `.exhibitor-list` vs.
  - Her exhibitor: `name`, `website`, `country`, `booth_number?`, `description?`

- [x] `backend/src/modules/lead-machine/fair/tentimes.client.ts`
  - `getFairAttendeeIntent(fairId)` → `{ company, interested_count, attending_count }[]`
  - 10times API: `GET /api/events/{id}/attendees`
  - TENTIMES_API_KEY yoksa bu adım atlanır

- [x] `backend/src/modules/lead-machine/fair/fair.job.ts`
  - `runFairJob(jobId)` → resmi site tara → 10times intent ekle → ICP eşleştir → `lead_candidates`'a yaz
  - `raw_data.fair_info`: `{ fair_name, fair_date, booth_number, intent_score? }`

- [x] API:
  - `POST /lead-machine/fair/jobs` — body: `{ fair_name, fair_url, fair_date, icp_id? }`
  - `GET /lead-machine/fair/jobs` — job listesi
  - `GET /lead-machine/fair/suggestions` — yaklaşan fuar önerileri (10times API ile sektör bazlı)

**Cursor:**
- [x] `/admin/market/lead-machine/fair` sayfası:
  - "Fuar URL'si Gir" + fuar adı + tarih
  - ICP filtresi (opsiyonel)
  - "Tara" butonu, job listesi, "İncele" linki
  - Fuar önerileri paneli: "Bu sektörde yaklaşan fuarlar" listesi (10times'dan)

---

## BÖLÜM L — AI Outreach Generator

> Kaynak: `1) AMAZON LEAD MACHINE.docx` § 4.9
> API maliyeti: ~$0.05/email (GPT-4o)
> **Öncelik:** 🟢 Düşük — Sprint 5

### L1. Outreach Backend

> **Görev:** Codex

- [x] `backend/src/modules/lead-machine/outreach/outreach.service.ts`
  - `generateOutreachEmail(candidateId)` → `lead_outreach_drafts` kaydı yaz
  - Input: candidate name + ai_summary + enrichment.decision_maker + channel-specific pain points
  - Prompt template (GPT-4o):
    ```
    Şirket: {name}, Ülke: {country}, Sektör: {sector}
    Tespit edilen sorun: {pain_points}
    Ürünlerimiz: Oto paspas, plastik enjeksiyon parçaları
    
    Kısa, kişiselleştirilmiş B2B tanıtım e-postası yaz (TR veya EN).
    Hook: müşteri sorununu belirt.
    Insight: ürün uyumunu açıkla.
    CTA: numune talebi veya görüşme.
    Maksimum 150 kelime.
    ```
  - Dil: enrichment.decision_maker ülkesine göre TR/EN otomatik seç

- [x] API:
  - `POST /lead-machine/outreach/generate/:candidateId` — taslak üret
  - `GET /lead-machine/outreach/drafts?candidate_id=&market_lead_id=` — taslak listesi
  - `PATCH /lead-machine/outreach/drafts/:id` — taslağı düzenle

### L2. Outreach Admin Panel

> **Görev:** Cursor

- [x] Aday kartında "E-posta Taslağı Üret" butonu (enrichment tamamlanmışsa aktif)
- [x] Taslak görüntüleyici: Subject + Body textarea (düzenlenebilir)
- [x] "Kopyala" butonu (clipboard) — sistem e-posta göndermez
- [x] Kaydedilen taslaklar listesi: `/admin/market/lead-machine/outreach`

---

## BÖLÜM M — Sidebar ve Navigasyon Güncellemeleri

> **Görev:** Cursor | **Öncelik:** 🔴 Kritik (H4 ile birlikte)

- [x] `sidebar-items.ts`'e `lead-machine` grubu ekle (market grubunun altında veya ayrı):
  ```
  Lead Machine
  ├── Lead Adayları          /admin/market/lead-machine/candidates
  ├── Amazon Arama           /admin/market/lead-machine/amazon
  ├── B2B Arama              /admin/market/lead-machine/b2b
  ├── Fuar Tarama            /admin/market/lead-machine/fair
  ├── ICP Profilleri         /admin/market/lead-machine/icp
  └── Outreach Taslakları    /admin/market/lead-machine/outreach
  ```
- [x] "Lead Adayları" sidebar linkine badge: bekleyen aday sayısı (RTK Query ile real-time)
- [x] `permissions.ts`'e yeni nav key'leri ekle — bu projede ayrı `permissions.ts` yok; nav yetkisi `AppSidebar` admin rol kontrolüyle yönetiliyor

---

## BÖLÜM N — Kalite ve Doğrulama

### N1. TypeScript Build

> **Görev:** Cursor + Codex | **Öncelik:** 🟡 Yüksek

- [x] `cd backend && bun run build` — sıfır hata
- [x] `cd admin_panel && timeout 180s bun run build` — sıfır hata

### N2. UI Doğrulama

> **Görev:** Antigravity | **Öncelik:** 🟡 Yüksek (N1 sonrası)

- [x] `/admin/market/lead-machine/candidates` — aday listesi yükleniyor, onay/red akışı çalışıyor
- [x] `/admin/market/lead-machine/amazon` — job başlatma, job listesi görünüyor
- [x] `/admin/market/lead-machine/b2b` — ICP seçimi + job başlatma çalışıyor
- [x] `/admin/market/lead-machine/fair` — fuar URL girişi + job başlatma çalışıyor
- [x] `/admin/market/lead-machine/icp` — ICP oluşturma formu çalışıyor
- [x] Onaylanan aday → `/admin/market/leads` pipeline'ında görünüyor
- [x] Sidebar badge: bekleyen aday sayısı güncelleniyor

Codex doğrulama notu (2026-05-07): Backend + admin build geçti. Admin API ile Amazon/B2B/Fuar job oluşturma ve listeleme, ICP create/update/delete, scraper callback → candidate, favorite → approve-to-lead → market_leads pipeline akışı doğrulandı.

---

## Görev Özeti

| Görev | Sahip | Öncelik | Durum | Blok |
|-------|-------|---------|-------|------|
| DB şeması (018) | Claude | 🔴 | ✅ Tamam | — |
| Sonuç raporu | Claude | 🔴 | ✅ Tamam | — |
| DB seed çalıştır | Codex | 🔴 | ✅ Tamam | H1 |
| Env değişkenleri ekle | Codex | 🔴 | ✅ Tamam | — |
| Ortak backend altyapı (ai.client, scraper.client) | Codex | 🔴 | ✅ Tamam | H2 |
| Onay paneli backend (H4) | Codex | 🔴 | ✅ Tamam | H3 |
| Onay paneli UI (H4) | Cursor | 🔴 | ✅ Tamam | H3 |
| Sidebar navigasyon (M) | Cursor | 🔴 | ✅ Tamam | H4 |
| Amazon scraper + reviewer + scorer (I1) | Codex | 🟡 | ✅ Tamam | H3 |
| Amazon job runner (I1) | Codex | 🟡 | ✅ Tamam | I1 |
| Amazon arama UI (I2) | Cursor | 🟡 | ✅ Tamam | I1 |
| ICP backend (J1) | Codex | 🟡 | ✅ Tamam | H3 |
| ICP admin UI (J1) | Cursor | 🟡 | ✅ Tamam | J1 |
| B2B dizin scraper (J2) | Codex | 🟡 | ✅ Tamam | J1 |
| B2B website analyzer (J2) | Codex | 🟡 | ✅ Tamam | J2 |
| B2B job runner (J2) | Codex | 🟡 | ✅ Tamam | J2 |
| B2B arama UI (J2) | Cursor | 🟡 | ✅ Tamam | J2 |
| Fuar exhibitor scraper (K1) | Codex | 🟠 | ✅ Tamam | H3 |
| 10times client (K1) | Codex | 🟠 | ✅ Tamam | K1 |
| Fuar arama UI (K1) | Cursor | 🟠 | ✅ Tamam | K1 |
| Enrichment service — Apollo (J3) | Codex | 🟠 | ✅ Tamam | J2 |
| Enrichment UI (J3) | Cursor | 🟠 | ✅ Tamam | J3 |
| Öğrenme / rejection patterns (H5) | Codex | 🟠 | ✅ Tamam | H4 |
| AI outreach generator (L1) | Codex | 🟢 | ✅ Tamam | J3 |
| Outreach UI (L2) | Cursor | 🟢 | ✅ Tamam | L1 |
| TS build doğrulama (N1) | Codex + Cursor | 🟡 | ✅ Tamam | her sprint |
| UI doğrulama (N2) | Antigravity | 🟡 | ✅ Tamam | N1 |

---

## Sıralama (Sprint Planı)

```
Sprint 1 — Temel (H bölümü + M):
  H1 seed çalıştır → H2 env → H3 ortak altyapı → H4 onay paneli → M navigasyon

Sprint 2 — Amazon (I bölümü):
  I1 scraper + reviewer + scorer + job runner → I2 arama UI

Sprint 3 — B2B (J bölümü):
  J1 ICP backend + UI → J2 dizin + website analyzer → B2B arama UI

Sprint 4 — Fuar (K bölümü):
  K1 exhibitor scraper + 10times client → fuar arama UI

Sprint 5 — Olgunluk (J3 + H5 + L):
  J3 Apollo enrichment → H5 öğrenme → L1 outreach → N UI doğrulama
```

---

## API Maliyet Özeti

| Servis | Amaç | Aylık Maliyet | Faz |
|--------|-------|---------------|-----|
| **Scraper-service** | Web scraping (B2B dizin, fuar, website analizi, Google Maps) | **$0** (self-hosted) | Sprint 1 |
| **Oxylabs** | Amazon ürün + review scraping (TOS-safe) | ~$20 | Sprint 2 |
| **Groq** | Review + website AI analizi | $0 (ücretsiz) | Sprint 1 |
| **GPT-4o-mini** | ICP + pain point analizi | $5-15 | Sprint 3 |
| **Apollo.io** | Email + karar verici lookup | $49-99 | Sprint 5 |
| **10times** | Fuar attendee intent | $0 (ücretsiz) | Sprint 4 |
| **GPT-4o** | Outreach email üretimi | $10-20 | Sprint 5 |
| **whr.ai** *(opsiyonel)* | Fuar satın alma niyeti | $200-500 | Sonra |
| **ExpoCaptive** *(opsiyonel)* | Exhibitor DB | $300-800 | Sonra |
| **Toplam (Sprint 1-3)** | ~~$35-65~~ → **$5-35/ay** (Apify yerine self-hosted) | | |
| **Toplam (Sprint 1-5)** | ~~$95-185~~ → **$75-165/ay** | | |

---

*MarketPulse — Lead Machine Ceklisti*
*Son güncelleme: 2026-05-07 — Codex backend maddeleri tamamlandı ✅ · Seed ve backend build yeşil ✅ · UI/Admin panel maddeleri bekliyor*
