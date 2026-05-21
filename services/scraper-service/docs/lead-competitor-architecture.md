# Lead ve Rakip Monitoring Teknik Mimari

## Genel Mimari

Mevcut `scraper-service` scraping motoru olarak kalmali. Lead ve rakip monitoring icin bunun ustune ayri bir is katmani eklenmeli.

Onerilen servis ayrimi:

- `scraper-service`: URL fetch, selector extraction, profile extraction, async scrape jobs
- `lead-monitor-api`: project/source/run/lead/change yonetimi
- `lead-monitor-worker`: schedule, crawl orchestration, normalization, diff
- `lead-monitor-frontend`: managed dashboard

Bu ayrim, scraping motorunu baska projeler icin de kullanilabilir tutar.

## Veri Akisi

1. Kullanici dashboard'da proje ve source tanimlar.
2. Scheduler run olusturur.
3. Worker source URL'lerini parcalar.
4. Worker her URL icin `scraper-service` API'sine scrape job gonderir.
5. Scraper sonucu doner veya webhook ile bildirir.
6. Worker ham sonucu normalize eder.
7. Lead/competitor kaydi upsert edilir.
8. Yeni snapshot onceki snapshot ile karsilastirilir.
9. Changes tablosuna farklar yazilir.
10. Dashboard lead ve change feed'i gosterir.

## Mevcut Scraper Service Rolleri

Mevcut servis su rollerde kalmali:

- Fetch mode secimi: fast, dynamic, stealthy
- Header/cookie/body forward
- CSS/XPath selector extraction
- Cache
- Rate limit
- Async job
- Webhook callback
- Isletme listesi icin `source_type=google-maps` benzeri kullanim: `POST /api/v1/places/google-maps` veya `type: "places-google-maps"` job (`docs/places-usage-guide.md`)

Yeni eklenecek scraper profile'lari:

- `lead-page`
- `product-page`
- `price-page`
- `directory-listing`
- `competitor-page`

Bu profile'lar ham HTML yerine normalize edilmeye yakin veri dondurur.

## Onerilen Veritabani Tablolari

### projects

- id
- name
- customer_name
- industry
- country
- region
- language
- status
- created_at
- updated_at

### sources

- id
- project_id
- type
- name
- base_url
- config_json
- schedule_cron
- status
- created_at
- updated_at

### runs

- id
- project_id
- source_id
- status
- started_at
- finished_at
- total_urls
- successful_urls
- failed_urls
- new_records
- changed_records
- error_message

### raw_snapshots

- id
- project_id
- source_id
- run_id
- url
- content_hash
- extracted_json
- fetched_at

### leads

- id
- project_id
- company_name
- website_url
- domain
- source_url
- industry
- country
- city
- phone
- email
- address
- social_profiles_json
- products_or_services_json
- price_signals_json
- confidence_score
- first_seen_at
- last_seen_at

### competitors

- id
- project_id
- name
- website_url
- domain
- status
- created_at
- updated_at

### competitor_snapshots

- id
- competitor_id
- run_id
- url
- title
- products_json
- prices_json
- campaigns_json
- content_hash
- captured_at

### changes

- id
- project_id
- entity_type
- entity_id
- change_type
- field_name
- old_value
- new_value
- source_url
- confidence_score
- detected_at

### exports

- id
- project_id
- type
- status
- file_url
- row_count
- created_at

## Deduplication Stratejisi

Lead kayitlari su sirayla eslestirilmeli:

1. Normalized domain
2. Email
3. Phone
4. Company name + city
5. Source URL

Her eslesme confidence score uretmeli. Dusuk confidence kayitlar dashboard'da review gerektirir.

## Change Detection Stratejisi

Basit ve guvenilir MVP yaklasimi:

- Her URL icin normalize JSON uretilir.
- JSON canonical form'a cevrilir.
- Alan bazli hash hesaplanir.
- Onceki snapshot ile field-level diff alinir.
- Sadece anlamli alanlar icin change kaydi uretilir.

Izlenecek alanlar:

- company_name
- phone
- email
- address
- social_profiles
- products_or_services
- prices
- campaigns
- title
- meta_description

## Rate Limit ve Maliyet Kontrolu

Her project ve source icin limit olmalidir.

- max_urls_per_run
- max_runs_per_day
- max_dynamic_pages_per_run
- max_stealthy_pages_per_run
- timeout_seconds
- retry_count

Fast mode varsayilan olmali. Dynamic veya stealthy mode sadece gerekli kaynaklarda kullanilmali.

## Compliance Notlari

Bu urun sadece kamuya acik veriler icin tasarlanmali.

Ilk surum kurallari:

- Login gerektiren kapali alanlar kapsam disi
- Kisisel hassas veri hedeflenmez
- robots.txt ve site kosullari proje bazinda degerlendirilir
- Email/telefon gibi contact verileri kaynak URL ile birlikte saklanir
- Musteriye veri kaynagi ve silme mekanizmasi sunulur

