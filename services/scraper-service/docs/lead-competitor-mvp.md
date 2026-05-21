# Lead ve Rakip Monitoring MVP Kapsami

## MVP Amaci

Ilk surumun amaci, belirli sektor ve kaynaklardan firma, urun, fiyat ve contact datasini duzenli toplayip dashboard uzerinden takip edilebilir hale getirmektir.

MVP, genel amacli scraping platformu olmayacak. Yonetilebilir, satilabilir ve elle desteklenebilir bir managed dashboard olacak.

## Kullanici Akislari

### 1. Proje Olusturma

Kullanici veya operasyon ekibi bir proje olusturur.

Alanlar:

- Proje adi
- Musteri adi
- Sektor
- Ulke/sehir/bolge
- Dil
- Hedef veri tipi: lead, rakip, urun, fiyat
- Calisma frekansi: gunluk, haftalik, aylik

### 2. Kaynak Ekleme

Her proje bir veya daha fazla source icerebilir.

Source tipleri:

- Manuel URL listesi
- Firma dizini
- Rakip website
- Kategori sayfasi
- Sitemap
- Arama sonucu sayfasi

Ilk MVP'de Google Maps, LinkedIn ve login gerektiren kapali platformlar kapsam disinda tutulmali. Once acik web kaynaklari ve musteri tarafindan verilen URL listeleri ile baslanmali.

### 3. Tarama Calistirma

Sistem kaynaklari schedule ile veya manuel olarak tarar.

Run bilgileri:

- Baslangic zamani
- Bitis zamani
- Status: queued, running, done, failed
- Taranan URL sayisi
- Basarili URL sayisi
- Hata sayisi
- Yeni lead sayisi
- Degisen kayit sayisi

### 4. Veri Normalize Etme

Ham scraping sonucu tek tip lead veya competitor kaydina donusturulur.

Lead alanlari:

- company_name
- website_url
- source_url
- industry
- country
- city
- phone
- email
- address
- social_profiles
- products_or_services
- price_signals
- confidence_score
- first_seen_at
- last_seen_at

Competitor alanlari:

- competitor_name
- website_url
- tracked_pages
- products
- prices
- campaigns
- social_profiles
- last_snapshot_at

### 5. Degisiklik Algilama

Her yeni tarama onceki snapshot ile karsilastirilir.

Degisiklik tipleri:

- lead_created
- contact_changed
- phone_added
- email_added
- product_added
- product_removed
- price_changed
- campaign_changed
- page_added
- page_removed

Degisiklik kaydi su alanlari tutar:

- entity_type
- entity_id
- change_type
- field_name
- old_value
- new_value
- source_url
- detected_at
- confidence_score

### 6. Dashboard

MVP dashboard sayfalari:

- Projects
- Sources
- Runs
- Leads
- Competitors
- Changes
- Exports

Dashboard ilk etapta operasyon odakli olmali. Pazarlama landing page veya agir analitik panel gerekmez.

### 7. Export

Ilk export formatlari:

- CSV
- XLSX
- JSON

Sonraki entegrasyonlar:

- Google Sheets
- HubSpot
- Pipedrive
- Airtable
- n8n webhook
- Make/Zapier webhook

## MVP Disi Kalanlar

Ilk surumde asagidakiler ertelenmeli:

- Self-serve billing
- Public signup
- Kredi bazli kullanim sistemi
- Chrome extension
- AI agent workflow builder
- LinkedIn automation
- Google Maps otomasyonlari
- Residential proxy marketplace
- CAPTCHA solving paneli

## Kabul Kriterleri

MVP basarili sayilirsa:

- Bir proje altinda en az 3 kaynak tanimlanabiliyor
- Manuel run baslatilabiliyor
- Schedule ile run calisabiliyor
- Lead kayitlari normalize ediliyor
- Duplicate lead'ler birlestiriliyor
- Onceki run'a gore degisiklikler goruluyor
- CSV/XLSX export alinabiliyor
- Run hatalari dashboard'da gorunuyor

