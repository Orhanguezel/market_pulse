# Lead ve Rakip Monitoring Yol Haritasi

## Faz 0: Hazirlik

Amac: Mevcut scraper-service'in lead monitoring icin uygun sinirlarini netlestirmek.

Isler:

- Mevcut `/api/v1/scrape` API'sinin lead use case'leri icin test edilmesi
- 3 ornek sektor secimi
- 10-20 ornek kaynak URL listesi hazirlanmasi
- Basit selector config formatinin belirlenmesi
- Ornek CSV cikti formatinin kararlastirilmasi

Cikti:

- Ilk demo dataset
- Hangi kaynaklarin fast/dynamic/stealthy istedigi listesi
- MVP extractor alan listesi

## Faz 1: Lead Profile ve Normalization

Amac: Ham scrape sonucunu lead kaydina donusturmek.

Isler:

- `lead-page` profile tasarimi
- Telefon extractor
- Email extractor
- Address heuristic
- Social profile extractor
- Product/service baslik extractor
- Domain normalization
- Confidence score hesaplama

Cikti:

- Tek URL'den normalize lead JSON
- Unit testler
- Ornek API response dokumani

## Faz 2: Lead Monitor Backend

Amac: Project/source/run/lead/change tablolarini yoneten is katmanini kurmak.

Isler:

- Backend projesi olusturma
- Database schema
- CRUD endpointleri
- Run creation endpoint
- Scraper-service client
- Raw snapshot saklama
- Lead upsert
- Deduplication

Cikti:

- API ile proje ve kaynak yonetimi
- Manuel run baslatma
- Lead listesi alma

## Faz 3: Scheduler ve Worker

Amac: Duzenli tarama ve arka plan islerini otomatize etmek.

Isler:

- Schedule config
- Worker queue
- Source URL discovery
- Scrape job orchestration
- Retry policy
- Partial failure handling
- Run summary hesaplama

Cikti:

- Haftalik/gunluk otomatik run
- Run status takibi
- Hata raporlama

## Faz 4: Change Detection

Amac: Rakip ve lead degisikliklerini yakalamak.

Isler:

- Snapshot hash
- Field-level diff
- Change type mapping
- Noise filtering
- Confidence score
- Change feed endpointleri

Cikti:

- Yeni lead feed'i
- Fiyat/urun/contact degisiklikleri
- Degisiklik gecmisi

## Faz 5: Dashboard MVP

Amac: Operasyon ekibinin ve musterinin kullanabilecegi arayuzu sunmak.

Sayfalar:

- Projects
- Sources
- Runs
- Leads
- Competitors
- Changes
- Exports

Oncelikler:

- Yogun ama okunabilir tablo tasarimi
- Filtreleme
- Status badge'leri
- Run detaylari
- CSV/XLSX export
- Hata gorunurlugu

Cikti:

- Kullanilabilir internal dashboard
- Musteriye demo yapilabilir ekranlar

## Faz 6: Export ve Entegrasyonlar

Amac: Veriyi satis ve operasyon araclarina aktarmak.

Isler:

- CSV export
- XLSX export
- JSON export
- Webhook delivery
- Google Sheets entegrasyonu
- n8n webhook template

Cikti:

- Haftalik rapor dosyasi
- CRM'e aktarilabilir lead listesi

## Faz 7: Ticari Paketleme

Amac: Managed service olarak satilabilir hale getirmek.

Isler:

- Paket limitleri
- Musteri onboarding formu
- Ornek rapor sablonu
- Demo veri seti
- Basit fiyat sayfasi
- Sozlesme ve compliance notlari

Cikti:

- Starter/Growth/Custom paketleri
- Musteri demo akisi
- Ilk pilot musteri icin hazir operasyon modeli

## Teknik Riskler

- Anti-bot korumali kaynaklarda maliyet artisi
- Verinin normalize edilmesinde false positive
- Duplicate kayitlar
- Fiyat bilgisinin sayfada standard olmamasi
- Kisisel veri ve compliance riskleri
- Kaynak sitelerin HTML yapisini degistirmesi

## Risk Azaltma

- Ilk etapta acik ve dusuk riskli kaynaklar secilmeli
- Fast mode varsayilan olmali
- Dynamic/stealthy mode limitlenmeli
- Kaynak basina extractor config saklanmali
- Review gerektiren dusuk confidence lead'ler ayrilmali
- Her contact verisi kaynak URL ile saklanmali

