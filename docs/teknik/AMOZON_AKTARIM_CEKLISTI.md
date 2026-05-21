# Amozon → Market Pulse Aktarım Çeklisti

> Bu çeklist [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) Bölüm 5 (Amazon Entegrasyon Stratejisi — Senaryo A) kararlarına bağlıdır.
> **Karar:** Senaryo A — One-time sync; amozon repo'su aktarımdan sonra dondurulur.
> **Sahipler:** 🧠 Claude (mimar/karar/doc) + ⚙️ Codex (kod/test/deploy)
> **Durum:** Taslak — 2026-05-21

---

## Bu çeklist nedir

amozon repo'sunda **test edilmiş ve çalışan** Amazon scoring engine + admin sayfalarını market_pulse'a **modül** olarak taşımak. Hedef: market_pulse'ta diğer modülleri test ederken Risk (Amazon) modülü Day 1'den çalışıyor olacak.

Aktarım stratejisi:
- **Backend kodu** → `backend/src/modules/risk/` (yeni modül; lead-machine/amazon ile karışmayacak)
- **DB şeması** → `backend/src/db/seed/sql/021_*` ve `022_*` (numara koruyarak)
- **Admin sayfaları** → `admin_panel/src/app/(main)/admin/risk/` altına Next.js route olarak
- **Tema** → ayrı çeklist: [TEMA_MIGRASYON_CEKLISTI.md](TEMA_MIGRASYON_CEKLISTI.md)

---

## Önemli Notlar (önce oku)

1. **amozon repo'su silinmez.** Mevcut Bionluk teslimi orada yaşamaya devam eder. 6 ay sonra arşivlenecek (master plan kararı).
2. **Kod kopyalanır, paylaşılmaz.** Ortak NPM paketi yapmıyoruz — direkt copy. Amozon'da bug fix olursa o repo'da yapılır, market_pulse Risk modülü kendi yoluna devam eder.
3. **Klasör adı:** amozon'da `backend/src/amazon/`, market_pulse'ta `backend/src/modules/risk/`. Risk = master plan'da Suite mimarisinin modül adı.
4. **Import path'leri değişir.** `@/amazon/...` → `@/modules/risk/...`. Bütün import'lar otomatik replace ile + manuel kontrol.
5. **DB tablosu prefix korunur.** `amazon_*` tablo adları aynı kalır — sadece yeri (numara) korunur.
6. **Mevcut market_pulse'taki `lead-machine/amazon/` modülü dokunulmaz.** Bu farklı bir iş (Amazon **lead** bulma); Risk modülü Amazon **scoring** içindir.

---

## Sprint A0 — Hazırlık (1 gün)

### Karar & doc
- [ ] **🧠 Claude** — Aktarım kapsamı son onayı: aşağıdaki "Aktarılacak dosya manifesti" Avrasya/Paspas iş akışı için yeterli mi? — **Manifest hazır, kullanıcı onayı bekleniyor**
- [x] **🧠 Claude** — amozon README'sini oku + müşteri taahhüt notlarını oku — taşıma sırasında kaybolmaması gereken müşteri-spesifik davranışları işaretle — ✅ **[docs/teknik/risk-modulu-musteri-taahhutleri.md](risk-modulu-musteri-taahhutleri.md)** (Bionluk korunum manifestosu — 5 boyut + Türkçe karar etiketleri + Confidence katmanı + MIXED_SIGNAL + Reason persistence + Single Journey + Thesis Memory + 165 test + 5 keyword regression baseline)

### Klasör & branch
- [ ] **⚙️ Codex** — Yeni branch: `feat/risk-module-from-amozon`
- [ ] **⚙️ Codex** — Hedef klasör: `mkdir -p backend/src/modules/risk/{scorers,__tests__}`
- [ ] **⚙️ Codex** — amozon `package.json` dependency farkını çıkar:
  ```bash
  diff <(jq -S '.dependencies' ../amozon/backend/package.json) \
       <(jq -S '.dependencies' backend/package.json)
  ```
- [ ] **⚙️ Codex** — Eksik bağımlılıkları market_pulse `backend/package.json`'a ekle (özellikle Keepa client'in fetch dışı bir HTTP client kullanıyorsa)

### ENV
- [ ] **⚙️ Codex** — `backend/.env.example`'a ekle: `KEEPA_API_KEY=`, `KEEPA_CACHE_TTL=`, varsa `AMAZON_LLM_*` değişkenleri
- [x] **🧠 Claude** — Müşteri için BYOK Keepa anahtarı politikasını netleştir ([master plan](../strateji/MARKET_PULSE_SAAS_PLANI.md) Risk modülü "BYOK Keepa anahtarı" diyor) — env mi, DB'de tenant başına mı tutulacak — ✅ **[docs/teknik/byok-keepa-politikasi.md](byok-keepa-politikasi.md)** (Hybrid: Faz 1 env, Faz 2 multi-tenant `tenant_module_credentials` tablosu + AES-256-GCM envelope encryption; resolver mantığı; Codex Sprint A0 aksiyonları)

---

## Sprint A1 — Backend Kod Transferi (1-2 gün)

### Aktarılacak dosya manifesti

amozon'dan kopyalanacak dosyalar — **toplam 26 dosya (~3557 satır kod) + 5 scorer + __tests__**:

| Kaynak (amozon/backend/src/amazon/) | Hedef (market_pulse/backend/src/modules/risk/) | Sahip | Not |
|---|---|---|---|
| amazon.job.ts | risk.job.ts | ⚙️ Codex | Job runner |
| amazon.schema.ts | risk.schema.ts | ⚙️ Codex | Zod validation |
| amazon.scoring-engine.ts | scoring-engine.ts | ⚙️ Codex | Çekirdek motor (550 satır) |
| amazon.scraper.ts | amazon.scraper.ts | ⚙️ Codex | Amazon ürün scrapesi |
| amazon.types.ts | types.ts | ⚙️ Codex | Tip tanımları |
| asin-resolver.ts | asin-resolver.ts | ⚙️ Codex | ASIN normalizasyonu |
| category.normalizer.ts | category.normalizer.ts | ⚙️ Codex | Kategori normalleştirme |
| composite.scorer.ts | composite.scorer.ts | ⚙️ Codex | 5 boyut → toplam skor |
| confidence.calculator.ts | confidence.calculator.ts | ⚙️ Codex | Güven hesabı |
| coverage-breakdown.ts | coverage-breakdown.ts | ⚙️ Codex | Kapsam dağılımı |
| coverage-gate.ts | coverage-gate.ts | ⚙️ Codex | Kapsam eşiği |
| data-quality-age.ts | data-quality-age.ts | ⚙️ Codex | Veri yaş kontrolü |
| keepa.client.ts | keepa.client.ts | ⚙️ Codex | Keepa API (338 satır) |
| keepa.contributions.ts | keepa.contributions.ts | ⚙️ Codex | Keepa katkı hesabı |
| keyword-variation.service.ts | keyword-variation.service.ts | ⚙️ Codex | Anahtar kelime çeşitlemesi |
| llm-enrichment.ts | llm-enrichment.ts | ⚙️ Codex | LLM ile zenginleştirme |
| persuasion.generator.ts | persuasion.generator.ts | ⚙️ Codex | "İkna" metni üretimi |
| priority-view.ts | priority-view.ts | ⚙️ Codex | Öncelik görünümü |
| review.analyzer.ts | review.analyzer.ts | ⚙️ Codex | Review analiz |
| risk-badge-stats.ts | risk-badge-stats.ts | ⚙️ Codex | Rozet istatistikleri |
| risk-badges.ts | risk-badges.ts | ⚙️ Codex | Rozet tanımları |
| risk-report.service.ts | report.service.ts | ⚙️ Codex | Risk raporu |
| scorers/brand-reliability.scorer.ts | scorers/brand-reliability.scorer.ts | ⚙️ Codex | Boyut 1 |
| scorers/category-risk.scorer.ts | scorers/category-risk.scorer.ts | ⚙️ Codex | Boyut 2 |
| scorers/operational-risk.scorer.ts | scorers/operational-risk.scorer.ts | ⚙️ Codex | Boyut 3 |
| scorers/price-war.scorer.ts | scorers/price-war.scorer.ts | ⚙️ Codex | Boyut 4 |
| scorers/sku-chaos.scorer.ts | scorers/sku-chaos.scorer.ts | ⚙️ Codex | Boyut 5 |
| scoring.config.ts | scoring.config.ts | ⚙️ Codex | Ağırlıklar/eşikler |
| seller.extractor.ts | seller.extractor.ts | ⚙️ Codex | Satıcı çıkarıcı |
| signal.validator.ts | signal.validator.ts | ⚙️ Codex | Sinyal doğrulayıcı |
| thesis.service.ts | thesis.service.ts | ⚙️ Codex | Tez servisi (276 satır) |
| __tests__/*.test.ts | __tests__/*.test.ts | ⚙️ Codex | 9 test dosyası |
| README.md | README.md | ⚙️ Codex | Modül README'si |
| SCORING_LOGIC.md | ../../docs/teknik/RISK_SCORING_LOGIC.md (taşı) | 🧠 Claude | Doküman, docs altına |

### Import + path düzeltme

- [ ] **⚙️ Codex** — `cp -r ../amozon/backend/src/amazon/* backend/src/modules/risk/` (klasör için)
- [ ] **⚙️ Codex** — Toplu import yer değiştirme:
  ```bash
  # Yol değişimleri (amozon'da @/amazon → market_pulse'ta @/modules/risk)
  find backend/src/modules/risk -type f -name "*.ts" -exec sed -i \
    -e 's|@/amazon/|@/modules/risk/|g' \
    -e 's|@/db/job-store|@/modules/risk/_shared/job-store|g' \
    -e 's|@/lib/|@/modules/risk/_lib/|g' \
    {} +
  ```
  *(Tam liste amozon'un tsconfig path alias'larına bağlı — Codex önce paths.json'u kontrol etsin)*
- [ ] **⚙️ Codex** — amozon'da `backend/src/lib/` ve `backend/src/db/job-store.ts` gibi paylaşılan dosyalar varsa `backend/src/modules/risk/_shared/` veya `_lib/` altına kopyala (risk modülü self-contained olsun)
- [ ] **⚙️ Codex** — `bun typecheck` — derleme hatasız geçene kadar import düzeltmeleri

### Router + controller

- [ ] **⚙️ Codex** — `backend/src/modules/risk/router.ts` — Fastify route'ları:
  - `POST /admin/risk/scans` — yeni scoring çalışması başlat
  - `GET /admin/risk/scans/:id` — scan durumu/sonucu
  - `GET /admin/risk/scans` — scan listesi
  - `GET /admin/risk/products/:asin` — ASIN bazlı detay
  - `GET /admin/risk/badges` — rozet stats
  - `POST /admin/risk/theses` — tez kaydı
- [ ] **⚙️ Codex** — `backend/src/routes/project.ts` veya `routes.ts` içinde `registerRiskRoutes` çağrısı ekle
- [ ] **⚙️ Codex** — `backend/src/app.ts` içine gerekirse plugin kaydı (job queue varsa)

### Job runner

- [ ] **⚙️ Codex** — amozon'daki `scheduler.ts` ve `run-job.ts` mantığını market_pulse'ın mevcut `backend/src/jobs/` pattern'ine uyarla
- [ ] **⚙️ Codex** — `backend/src/jobs/risk-scan.job.ts` — periyodik watchlist taraması (saved searches için)

---

## Sprint A2 — DB Schema Transferi (yarım gün)

> **DİKKAT:** CLAUDE.md kuralı — `ALTER TABLE` yasak. Yeni şemalar `CREATE TABLE IF NOT EXISTS` ile yazılır + `bun run db:seed:fresh` ile uygulanır.

- [ ] **⚙️ Codex** — Numara çakışması kontrolü:
  ```bash
  ls backend/src/db/seed/sql/ | grep -E "^02[12]_"
  ```
  Eğer 021/022 zaten doluysa numarayı bir sonraki boşluğa (örn. 023/024) kaydır.
- [ ] **⚙️ Codex** — Kopya:
  ```bash
  cp ../amozon/backend/src/db/seed/sql/021_amazon_scoring_schema.sql \
     backend/src/db/seed/sql/
  cp ../amozon/backend/src/db/seed/sql/022_amazon_theses.sql \
     backend/src/db/seed/sql/
  ```
- [ ] **⚙️ Codex** — SQL dosyalarını oku; tablo adlarında çakışma var mı (mevcut market_pulse şemasıyla) kontrol et. Çakışma varsa **rename** (önek olarak `amazon_` koru, fakat market_pulse'da çakışan jenerik tablo adlarını yeniden adlandır)
- [ ] **⚙️ Codex** — `bun run build && bun run db:seed:fresh` — taze veritabanı kurar; tüm seed çalıştığı doğrulanmalı
- [ ] **🧠 Claude** — Seed sonrası MySQL'de tablo listesi çıkar, master plana ekle (referans)

---

## Sprint A3 — Admin Panel Sayfaları Transferi (2 gün)

### Sayfa manifesti

amozon admin panel sayfaları → market_pulse `admin_panel/src/app/(main)/admin/risk/` altına Risk modülü route'u olarak taşınır.

| Kaynak (amozon/admin_panel/src/app/) | Hedef (market_pulse/admin_panel/src/app/(main)/admin/risk/) | Sahip |
|---|---|---|
| products/page.tsx | products/page.tsx | ⚙️ Codex |
| scan/page.tsx | scan/page.tsx | ⚙️ Codex |
| scans/page.tsx | scans/page.tsx | ⚙️ Codex |
| theses/page.tsx | theses/page.tsx | ⚙️ Codex |
| keywords/page.tsx | keywords/page.tsx | ⚙️ Codex |
| settings/page.tsx | settings/page.tsx *(merge — market_pulse'ın kendi settings'i var)* | ⚙️ Codex + 🧠 Claude |
| debug-ui/page.tsx | debug-ui/page.tsx | ⚙️ Codex |
| developer-notes/page.tsx | developer-notes/page.tsx | ⚙️ Codex |
| documentation/page.tsx | documentation/page.tsx | ⚙️ Codex |

**Aktarılmayacak:**
- `login/page.tsx` — market_pulse'ın kendi auth'u var
- `users/page.tsx` — market_pulse'ın kendi user yönetimi var
- `page.tsx` (root dashboard) — market_pulse'ın kendi dashboard'u olacak

### Component manifesti

amozon `admin_panel/src/components/admin/*` → market_pulse `admin_panel/src/components/risk/*`:

| Kaynak Component | Hedef | Sahip |
|---|---|---|
| AmozonDashboard.tsx | components/risk/RiskDashboard.tsx | ⚙️ Codex |
| ProductsPanel.tsx | components/risk/ProductsPanel.tsx | ⚙️ Codex |
| ScansPanel.tsx | components/risk/ScansPanel.tsx | ⚙️ Codex |
| ScanJourneyPanel.tsx | components/risk/ScanJourneyPanel.tsx | ⚙️ Codex |
| ThesesPanel.tsx | components/risk/ThesesPanel.tsx | ⚙️ Codex |
| KeywordsPanel.tsx | components/risk/KeywordsPanel.tsx | ⚙️ Codex |
| SettingsPanel.tsx | merge into market_pulse settings | ⚙️ Codex |
| DocumentationPanel.tsx | components/risk/DocumentationPanel.tsx | ⚙️ Codex |
| DeveloperNotesPanel.tsx | components/risk/DeveloperNotesPanel.tsx | ⚙️ Codex |
| analytics.tsx | components/risk/Analytics.tsx | ⚙️ Codex |
| decision-clarity.tsx | components/risk/DecisionClarity.tsx | ⚙️ Codex |
| UsersPanel.tsx | **atla** (market_pulse'ın kendi user paneli var) | — |
| types.ts | components/risk/types.ts | ⚙️ Codex |

### Backend API entegrasyonu

- [ ] **⚙️ Codex** — amozon `admin_panel/src/lib/backend-api.ts` içindeki Amazon endpoint çağrılarını yeni Risk route'larına yönlendir (`/admin/risk/...`)
- [ ] **⚙️ Codex** — `admin_panel/.env.example` içine eksik env varsa ekle
- [ ] **⚙️ Codex** — Type sharing: amozon admin'inde inline type'lar varsa `components/risk/types.ts`'e topla

### Navigation entegrasyonu

- [ ] **⚙️ Codex** — market_pulse'ın `admin_panel/src/navigation/` veya layout'undaki sidebar menüsüne "Risk" başlığı altına aktarılan sayfaları ekle
- [x] **🧠 Claude** — IA (information architecture) kararı: Risk modülü tek menü mü, alt menüler mi — ✅ **[docs/teknik/risk-modulu-ia-karari.md](risk-modulu-ia-karari.md)** (Karar: grup başlığı + 5 alt menü; "Yeni Tarama" highlight; tier görünürlüğü her zaman aktif; mobile drawer; Codex sidebar config örneği)

### Stil migrasyonu

- [ ] **🧠 Claude + ⚙️ Codex** — Bu işin görsel kısmı [TEMA_MIGRASYON_CEKLISTI.md](TEMA_MIGRASYON_CEKLISTI.md)'ye delege edilir. Bu çeklist sadece **yapısal** transferi kapsar.

---

## Sprint A4 — Test & Doğrulama (1 gün)

### Test transferi
- [ ] **⚙️ Codex** — `__tests__` klasörü tamamen kopyalandı + path'ler düzeltildi (Sprint A1)
- [ ] **⚙️ Codex** — `bun test backend/src/modules/risk` — tüm testler yeşil olmalı
- [ ] **⚙️ Codex** — fixtures klasörü: `cp -r ../amozon/backend/src/amazon/__tests__/fixtures backend/src/modules/risk/__tests__/`

### Smoke test
- [ ] **⚙️ Codex** — Smoke test scripti yaz (`scripts/risk-smoke-test.sh`):
  - `POST /admin/risk/scans` (örnek keyword)
  - Job tamamlanmasını bekle (polling)
  - `GET /admin/risk/scans/:id` ile sonucu al
  - 5 boyutlu skoru ve overall'u doğrula
- [ ] **🧠 Claude** — amozon'un mevcut canlı kullanım davranışıyla karşılaştırma: aynı keyword ile amozon'da ne çıkıyor, market_pulse Risk modülünde ne çıkıyor (regresyon kontrolü)

### Admin UI smoke
- [ ] **⚙️ Codex** — Admin panel build (`cd admin_panel && bun run build`) hatasız
- [ ] **⚙️ Codex** — Localhost'ta scans/keywords/theses sayfalarını manuel aç + hata yok kontrol
- [ ] **🧠 Claude + Antigravity** — Görsel QA (Antigravity senaryosu): yeni Risk sayfalarının screenshot regression testi

---

## Sprint A5 — amozon Repo Dondurma (yarım gün)

- [ ] **🧠 Claude** — amozon README'sine üst nottu ekle: "Bu repo 2026-06-XX itibariyle pasif. Aktif geliştirme [market_pulse/backend/src/modules/risk/](../market_pulse/backend/src/modules/risk/)'de devam ediyor. Mevcut müşteri (Bionluk teslimi) sözleşmesi bitene kadar bu repo'da bug fix yapılabilir."
- [ ] **🧠 Claude** — amozon `project.portfolio.json`'a `status: 'frozen'` veya `completeDate` ekle
- [ ] **⚙️ Codex** — amozon'da `.github/workflows/` varsa scheduler'ı durdur (boşa CI çalışmasın)
- [x] **🧠 Claude** — Tarihsel referans olarak `docs/musteri/amozon-pilot-konusmalari.md` taşınmış mı kontrol et — ✅ **amozon `müsterimesajlari.md` (703 satır) → `docs/musteri/amozon-pilot-konusmalari.md`** kopyalandı; aktarım sonrası tarihsel referans olarak kalır
- [x] **🧠 Claude** — `docs/teknik/risk-faz4-isleri.md`'yi amozon'dan al ([YARINKI_ISLER_PHASE4.md](../../../amozon/YARINKI_ISLER_PHASE4.md)) → market_pulse `docs/teknik/risk-faz4-isleri.md` — ✅ **[docs/teknik/risk-modulu-faz4-isleri.md](risk-modulu-faz4-isleri.md)** (Phase 4 özet snapshot + Phase 5 Threat Intelligence roadmap + amozon orijinaline link)

---

## Sonradan Yapılacaklar (out of scope — Faz 2'ye yazıldı)

- BYOK Keepa anahtarı tenant başına DB tutma (multi-tenant geldikten sonra)
- Risk modülü için ayrı pricing tier (Free/Starter/Pro — master plan Bölüm 7)
- Public SaaS frontend tarafında Risk modülü pazarlama sayfası

---

## Kalite Kapısı (PR-merge öncesi)

Aktarım PR'ı şu kriterler karşılanmadan merge edilmez:

- [ ] `bun typecheck` hatasız (backend + admin_panel)
- [ ] `bun test backend/src/modules/risk` tamamen yeşil
- [ ] `bun run db:seed:fresh` başarılı
- [ ] Admin panel build başarılı
- [ ] Smoke test scripti yeşil (Sprint A4)
- [ ] Görsel regresyon: 5 ana sayfa screenshot karşılaştırma (Antigravity)
- [ ] CLAUDE.md ALTER TABLE kuralı ihlali yok (`grep -ri 'ALTER TABLE' backend/src/db/seed/sql/` → boş)
- [ ] amozon'un `.env` değişkenleri `backend/.env.example`'a yansıtılmış

---

## Bağlantılı Belgeler

- 📋 Master strateji (Bölüm 5): [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md)
- 🎨 Tema migrasyonu (ayrı çeklist): [TEMA_MIGRASYON_CEKLISTI.md](TEMA_MIGRASYON_CEKLISTI.md)
- 🧪 Risk skorlama mantığı: [SCORING_LOGIC.md](SCORING_LOGIC.md) *(amozon'dan taşınacak — Sprint A1'de)*
- 📊 Amazon teknik rapor PDF: [amazon-scoring-engine-teknik-rapor.pdf](amazon-scoring-engine-teknik-rapor.pdf)
- 👤 Amazon müşteri taahhütleri: [../musteri/amazon-proje-taahhut-listesi.md](../musteri/amazon-proje-taahhut-listesi.md)
- ⚙️ amozon repo'su: [../../../amozon/](../../../amozon/)
