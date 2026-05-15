# Amazon Scoring Engine

Amazon kategori karar motoru; Oxylabs'tan ürün verisi alır, ürünleri filtreler, 5 boyutlu risk skoru üretir ve sonucu MySQL tablolarına yazar.

## Kurulum

Repo kökünden backend bağımlılıklarını kur:

```bash
cd backend
bun install
```

Gerekli minimum env değerleri:

```bash
JWT_SECRET=dev-secret
COOKIE_SECRET=dev-cookie-secret
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=app
DB_PASSWORD=app
DB_NAME=market_pulse_db
OXYLABS_USERNAME=
OXYLABS_PASSWORD=
KEEPA_API_KEY=
KEEPA_DAILY_TOKEN_BUDGET=1000
```

`OXYLABS_USERNAME` ve `OXYLABS_PASSWORD` gerçek Amazon scrape akışı için zorunludur. `KEEPA_API_KEY` boş bırakılırsa Keepa zenginleştirme atlanır; ana scoring pipeline çalışmaya devam eder.

Şemayı uygulamak için backend seed komutu kullanılır:

```bash
cd backend
bun run db:seed
```

Amazon tabloları `src/db/seed/sql/021_amazon_scoring_schema.sql` içinde tanımlıdır.

## Çalıştırma

Admin/API akışında önce `lead_search_jobs` kaydı oluşturulur, sonra job runner çağrılır:

```ts
import { runAmazonJob } from './amazon.job';

await runAmazonJob('lead_search_jobs.id');
```

Runner sırası:

1. `lead_search_jobs` kaydını okur.
2. Oxylabs Amazon search ile ürünleri çeker.
3. Ürünleri filtreler ve `amazon_products` tablosuna yazar.
4. Kategori istatistiklerini `amazon_category_stats` tablosuna upsert eder.
5. İlk uygun ürün için review analizi yapar.
6. 5 boyutlu risk raporu üretir.
7. Reason kolonları dahil `amazon_risk_scores` kaydı oluşturur.
8. Keepa aktif ve skor tetikleyicisi uygunsa ASIN kuyruğunu işler.
9. Geriye dönük uyumluluk için `lead_candidates` kaydı oluşturur.
10. Başarı veya hata durumunu `lead_search_jobs` ve `amazon_scan_jobs` üzerinde günceller.

## Test

Tüm backend testleri:

```bash
cd backend
bun test
```

Sadece Amazon scoring testleri:

```bash
cd backend
bun test src/modules/lead-machine/amazon/__tests__
```

Job full-flow E2E testi:

```bash
cd backend
bun test src/modules/lead-machine/amazon/__tests__/amazon.job.e2e.test.ts
```

E2E test gerçek ağ veya gerçek DB kullanmaz. Scraper, review analyzer ve DB pool mocklanır; `runAmazonJob()` akışında ürün, risk score, reason kolonları, candidate ve hata logu insertleri doğrulanır.

## Scoring Config

Merkezi ayarlar `scoring.config.ts` içindedir.

`COMPOSITE_WEIGHTS`:
5 boyutun composite skora katkısını belirler. Toplam `1.0` kalmalıdır.

`CONFIDENCE_THRESHOLDS`:
Veri noktası sayısına göre `INSUFFICIENT_DATA`, `LOW`, `MEDIUM`, `HIGH` seviyelerini belirler. Karar üretimi için `MEDIUM` ve `HIGH` güven seviyesi kullanılır.

`DECISION_THRESHOLDS`:
Composite skorun `GUVENLI`, `DIKKATLI_OL`, `GIRME` kararlarına nasıl çevrileceğini belirler.

`MIXED_SIGNAL_CONFIG`:
Bir boyut yüksek riskliyken en az üç boyut düşük riskliyse otomatik karar yerine `MIXED_SIGNAL` üretir.

`FILTER_CONFIG`:
Analize dahil edilecek ürünler için minimum veri kalitesini belirler.

Config değiştirildikten sonra en az şu testler çalıştırılmalıdır:

```bash
cd backend
bun test src/modules/lead-machine/amazon/__tests__
bun test src/modules/lead-machine/__tests__/amazon.test.ts
```

## Keepa Entegrasyonu

Keepa varsayılan olarak güvenli şekilde opsiyoneldir. Aktifleştirmek için:

```bash
KEEPA_API_KEY=...
KEEPA_DAILY_TOKEN_BUDGET=1000
```

Pipeline Keepa'yı sadece şu koşullarda çağırır:

- `KEEPA_API_KEY` dolu olmalı.
- Price-war confidence `INSUFFICIENT_DATA` olmalı veya composite skor yüksek risk eşiğini geçmeli.
- Ürün URL'lerinden ASIN çıkarılabilmeli.

Keepa akışı:

1. ASIN'ler `amazon_keepa_queue` tablosuna `pending` olarak yazılır.
2. `amazon_keepa_daily_budget` günlük token bütçesini korur.
3. `processKeepaQueue()` bütçe varsa snapshot alır.
4. Sonuçlar `amazon_keepa_snapshots` tablosuna yazılır.

Admin risk score endpoint'i, `amazon_products.asin` ile `amazon_keepa_snapshots` kayıtlarını eşleştirip `keepa_trend` döndürür.

## Hata Yönetimi

`runAmazonJob()` scrape veya scoring sırasında hata alırsa:

- `amazon_job_error_logs` içine retry sayacıyla hata kaydı yazar.
- `amazon_scan_jobs.status = failed` yapar.
- `lead_search_jobs.status = failed` yapar.

Log tablosu hata üretirse ana job hata yönetimi yine devam eder.
