# 06 — Veri Modeli

Bu doküman MatPortal'ın **eklenen 30+ tabloyu**, mevcut Paspas tablolarıyla **ilişkilerini**, **migration stratejisini** ve **veri yaşam döngüsünü** anlatır. Detaylı SQL şemaları her fazın derinlemesine dokümanında; burada **bütünlük resmi** vardır.

## 1. Genel Prensipler

### 1.1 Konvansiyonlar

- **PK:** `char(36)` UUID v4 (Promats projeleri standardı)
- **Tablo isimleri:** Türkçe + snake_case (`musteriler`, `tahmin_calistirma`)
- **Audit kolonları:** `created_at datetime`, `updated_at datetime`, `created_by char(36)`, `updated_by char(36)`
- **Soft delete:** `deleted_at datetime NULL` (kritik tablolarda)
- **JSON kolonları:** MySQL 8 native JSON, schema validation Drizzle/Zod ile
- **Index:** kompozit index sorgu pattern'lerine göre, `EXPLAIN` ile doğrulanır
- **FK:** `ON DELETE RESTRICT` varsayılan (kasıtlı CASCADE açık tanımlanır)

### 1.2 Migration kuralı

**Kritik:** [CLAUDE.md](../../CLAUDE.md) gereği `ALTER TABLE` lokal ortamda yasak. Schema değişikliği **seed dosyası** (`backend/src/db/seed/sql/0XX_*.sql`) güncellenip `db:seed:fresh` ile sıfırdan kurulur. Production'da migration script ayrı yönetilir.

Bu doküman seed dosyalarına eklenen **yeni 30+ tabloyu** listeler.

## 2. Mevcut Paspas Tabloları (paylaşılan)

MatPortal'ın **read** ve sınırlı **write** yaptığı mevcut tablolar:

| Tablo | Açıklama | MatPortal kullanımı |
|-------|----------|---------------------|
| `musteriler` | Bayi/müşteri ana kayıt | `portal_kullanicilari.musteri_id` FK |
| `urunler` | Ürün katalog | `portal_sepet_kalemleri`, `tahmin_calistirma` FK |
| `urun_kategorileri` | Kategori | Faz 6 katalog filtre |
| `satis_siparisleri` | Sipariş | Portal'dan `repoCreate` çağrıyla yazılır |
| `siparis_kalemleri` | Sipariş kalemi | Portal'dan dolaylı yazılır |
| `uretim_emirleri` | Üretim emri | Portal sipariş takip read |
| `sevkiyat_emirleri` | Sevkiyat | Portal sipariş takip read |
| `hareketler` | Cari hareket | Portal cari read |
| `stoklar` | Stok | Faz 4 + portal rezervasyon |
| `recete_*` | Reçete | Faz 4 hammadde projeksiyon |
| `makine_havuzu` | Makine | Faz 2 kapasite |
| `vardiya_*` | Vardiya | Faz 2 üretim hacmi |
| `kullanicilar` | Kullanıcı | Tüm yeni modüller auth |
| `kategoriler`, `tanimlar` | Tanım tabloları | Faz 6 |

**Kritik prensip:** MatPortal Paspas tablolarına **doğrudan INSERT/UPDATE/DELETE yapmaz**. Yazma işlemleri Paspas'ın repository fonksiyonlarını çağırır (örn. `satis_siparisleri/repository.ts:repoCreate`). Bu sayede iş kuralları korunur.

İstisna: `musteriler.son_giris_at`, `musteriler.portal_aktif_mi` gibi portal-spesifik kolonlar. Bunlar `musteriler` tablosuna eklenir ve portal yazar.

## 3. Yeni Tablolar — Faz Bazlı

### Faz 1 — Talep Toplama Altyapısı (3 tablo)

```sql
CREATE TABLE talep_havuzu (
  id char(36) PK,
  kaynak ENUM('whatsapp','telefon','email','portal','manuel','sohbet','saha'),
  kaynak_referans varchar(255),    -- WA mesaj ID, email subject, vb.
  musteri_id char(36) FK musteriler.id NULL,  -- bilinen müşteri
  ham_metin text,                  -- orijinal mesaj/not
  yapilandirilmis_json JSON,       -- LLM çıktı: { urunler: [...], vade, vb. }
  durum ENUM('yeni','isleniyor','siparise_donustu','reddedildi','kapatildi'),
  oncelik ENUM('düşük','orta','yüksek','kritik'),
  ai_guven_skoru decimal(4,2),
  notlar text,
  atanan_user_id char(36) FK kullanicilar.id NULL,
  donusturulen_siparis_id char(36) NULL,  -- siparise dönüştüyse
  created_at datetime,
  created_by char(36),
  updated_at datetime,
  INDEX (durum, oncelik, created_at),
  INDEX (musteri_id)
);

CREATE TABLE talep_kalemleri (
  id char(36) PK,
  talep_id char(36) FK talep_havuzu.id,
  urun_id char(36) FK urunler.id NULL,
  urun_metin varchar(255),         -- LLM çıkardı ama eşleştirilmediyse
  miktar decimal(12,2),
  birim_fiyat_beklenti decimal(12,2) NULL,
  notlar text
);

CREATE TABLE talep_etkilesim (
  id char(36) PK,
  talep_id char(36) FK,
  etkilesim_tipi ENUM('not','arama','email','toplanti','statu_degisikligi'),
  user_id char(36),
  detay text,
  ekler JSON,
  created_at datetime
);
```

### Faz 2 — Sipariş Tahmin Motoru (4 tablo)

```sql
CREATE TABLE tahmin_modelleri (
  id char(36) PK,
  scope ENUM('genel','segment','bayi','bayi_urun'),
  scope_value varchar(255),
  algoritma varchar(64),
  egitim_tarihi datetime,
  egitim_verisi_baslangic date,
  egitim_verisi_bitis date,
  egitim_kayit_sayisi int,
  dogruluk_metrikleri JSON,        -- { mape, rmse, mae, bias, coverage }
  hyperparametreler JSON,
  model_dosyasi_yolu text,
  aktif tinyint,
  notlar text,
  created_at datetime,
  INDEX (scope, scope_value, aktif)
);

CREATE TABLE tahmin_calistirma (
  id char(36) PK,
  bayi_id char(36) FK musteriler.id,
  urun_id char(36) FK urunler.id,
  donem_baslangic date,
  donem_bitis date,
  tahmini_adet decimal(12,2),
  guven_alt decimal(12,2),
  guven_ust decimal(12,2),
  guven_yuzdesi decimal(4,2),
  guven_skoru decimal(4,2),
  metod varchar(64),
  model_id char(36) FK tahmin_modelleri.id,
  sinyaller JSON,
  uyari_bayraklari JSON,
  calistirma_zamani datetime,
  INDEX (bayi_id, urun_id, donem_baslangic),
  INDEX (calistirma_zamani)
);

CREATE TABLE tahmin_dogruluk (
  id char(36) PK,
  tahmin_id char(36) FK tahmin_calistirma.id,
  gercek_adet decimal(12,2),
  mape decimal(8,4),
  rmse decimal(12,4),
  bias decimal(8,4),
  hesaplandi_at datetime
);

CREATE TABLE siparis_gecmisi_yuklenen (
  id char(36) PK,
  yukleyen_user_id char(36),
  dosya_adi varchar(255),
  satir_sayisi int,
  basarili int,
  hata int,
  durum ENUM('yuklendi','isleniyor','tamamlandi','hatali'),
  hata_log JSON,
  yuklendi_at datetime
);
```

> **Detay:** [`tartisma/12-tahmin-motoru-derinlemesine.md`](../tartisma/12-tahmin-motoru-derinlemesine.md)

### Faz 3 — Müşteri Keşif (3 tablo)

```sql
CREATE TABLE lead_havuzu (
  id char(36) PK,
  kaynak ENUM('tobb','sanayim_net','google_places','apollo','hunter','manuel','onerilen'),
  firma_adi varchar(255),
  vergi_no varchar(20),
  sektor varchar(128),
  alt_sektor varchar(128),
  sehir varchar(64),
  ilce varchar(64),
  adres text,
  enlem decimal(10,7),
  boylam decimal(10,7),
  web_sitesi varchar(255),
  telefon varchar(64),
  email varchar(255),
  calisan_sayisi int NULL,
  ciro_tahmini decimal(15,2) NULL,
  benzerlik_skoru decimal(4,2),    -- mevcut bayilere ML benzerlik
  durum ENUM('yeni','arastiriliyor','temas','gorusme','kazanildi','kayip','reddedildi'),
  atanan_user_id char(36),
  donusturulen_musteri_id char(36) NULL,
  notlar text,
  ham_veri JSON,                   -- kaynak API response
  created_at datetime,
  INDEX (kaynak, durum),
  INDEX (sehir, sektor),
  INDEX (benzerlik_skoru DESC)
);

CREATE TABLE lead_etkilesim (
  id char(36) PK,
  lead_id char(36) FK,
  user_id char(36),
  etkilesim_tipi ENUM('not','arama','email','toplanti','demo','teklif'),
  detay text,
  sonuc varchar(64),
  ekler JSON,
  created_at datetime
);

CREATE TABLE outreach_kampanya (
  id char(36) PK,
  ad varchar(255),
  hedef_segment JSON,              -- { sektor, sehir, calisan_min, ... }
  email_sablonu_id char(36),
  baslangic_tarihi datetime,
  bitis_tarihi datetime,
  durum ENUM('taslak','aktif','tamamlandi','iptal'),
  metrikler JSON,                  -- { gonderilen, acilan, tiklanan, donusum }
  created_at datetime
);
```

### Faz 4 — Stok & Tedarik (4 tablo + mevcut genişler)

```sql
CREATE TABLE tuketim_hizi (
  id char(36) PK,
  urun_id char(36) FK urunler.id,
  donem date,                      -- ay başı
  toplam_tuketim decimal(12,2),
  ortalama_gunluk decimal(12,4),
  std_sapma decimal(12,4),
  min_gunluk decimal(12,2),
  max_gunluk decimal(12,2),
  hesaplandi_at datetime,
  UNIQUE (urun_id, donem)
);

CREATE TABLE rop_ayarlari (
  id char(36) PK,
  urun_id char(36) FK urunler.id,
  reorder_point decimal(12,2),     -- bu seviye altına düşünce sipariş aç
  guvenli_stok decimal(12,2),
  max_stok decimal(12,2),
  lead_time_gun int,
  hesap_metodu ENUM('manuel','otomatik','hibrit'),
  son_hesap_tarihi datetime,
  notlar text
);

CREATE TABLE tedarikci_skor (
  id char(36) PK,
  tedarikci_id char(36) FK musteriler.id,  -- musteriler tablosu (tedarikçi de orada)
  donem date,
  zamaninda_teslim_orani decimal(4,2),
  kalite_skoru decimal(4,2),
  fiyat_rekabet_skoru decimal(4,2),
  iletisim_skoru decimal(4,2),
  toplam_skor decimal(4,2),
  hesaplandi_at datetime
);

CREATE TABLE po_taslaklari (
  id char(36) PK,
  tedarikci_id char(36),
  alternatif_tedarikci_ids JSON,
  kalemler JSON,                   -- [{urun_id, miktar, fiyat}]
  toplam_tutar decimal(15,2),
  ai_gerekce text,                 -- LLM'in açıklaması
  durum ENUM('taslak','onayli','reddedildi','gonderildi'),
  onaylayan_user_id char(36),
  onay_tarihi datetime,
  donusturulen_satinalma_id char(36),
  created_at datetime
);
```

### Faz 5 — Bayi Scraping & Churn (5 tablo)

```sql
CREATE TABLE web_kazima_hedefleri (
  id char(36) PK,
  bayi_id char(36) FK musteriler.id NULL,  -- rakip de olabilir, NULL
  url varchar(500),
  tip ENUM('site','instagram','facebook','google_maps','linkedin','rakip'),
  oncelik ENUM('düşük','orta','yüksek','kritik'),
  sıklık ENUM('günlük','haftalık','aylık'),
  son_kazima datetime,
  sonraki_kazima datetime,
  aktif tinyint,
  notlar text,
  INDEX (sonraki_kazima, aktif)
);

CREATE TABLE web_kazima_kayitlari (
  id char(36) PK,
  hedef_id char(36) FK,
  baslangic datetime,
  bitis datetime,
  http_durum int,
  yanit_boyutu int,
  s3_yol text,
  parse_basarili tinyint,
  hata text,
  parsed_data JSON,
  INDEX (hedef_id, baslangic DESC)
);

CREATE TABLE bayi_sinyalleri (
  id char(36) PK,
  bayi_id char(36) FK musteriler.id,
  tip varchar(64),
  deger varchar(500),
  kanit text,
  guven decimal(4,2),
  puan int,
  kaynak ENUM('web','sosyal','manuel','vergi','ml_model'),
  kaynak_kayit_id char(36),
  tespit_tarihi datetime,
  durum ENUM('yeni','dogrulandi','red','gozardi'),
  manuel_yorum text,
  INDEX (bayi_id, tespit_tarihi DESC)
);

CREATE TABLE churn_skor_gecmisi (
  id char(36) PK,
  bayi_id char(36) FK musteriler.id,
  tarih date,
  skor decimal(5,2),
  risk ENUM('düşük','orta','yüksek','kritik'),
  aktif_sinyaller JSON,
  ml_olasilik_30 decimal(4,2),
  ml_olasilik_60 decimal(4,2),
  ml_olasilik_90 decimal(4,2),
  INDEX (bayi_id, tarih DESC),
  INDEX (risk, tarih DESC)
);

CREATE TABLE churn_aksiyon_log (
  id char(36) PK,
  bayi_id char(36) FK musteriler.id,
  user_id char(36),
  aksiyon_tipi varchar(64),        -- 'telefon','saha','kampanya','iskonto'
  detay text,
  oncesi_skor decimal(5,2),
  sonrasi_skor decimal(5,2),       -- 30 gün sonra otomatik dolar
  basarili tinyint NULL,           -- skor düştüyse 1
  yapildi_at datetime,
  olcum_tarihi datetime
);
```

> **Detay:** [`tartisma/13-bayi-scraping-churn.md`](../tartisma/13-bayi-scraping-churn.md)

### Faz 6 — Bayi Portalı (11 tablo)

```sql
CREATE TABLE portal_kullanicilari (
  id char(36) PK,
  musteri_id char(36) FK musteriler.id,    -- bayi
  email varchar(255) UNIQUE,
  sifre_hash varchar(255),
  ad varchar(128),
  soyad varchar(128),
  telefon varchar(64),
  rol ENUM('bayi_admin','bayi_operator','bayi_goruntu'),
  aktif tinyint,
  must_change_pw tinyint,
  son_giris datetime,
  son_giris_ip varchar(64),
  iki_faktor_aktif tinyint,
  iki_faktor_secret varchar(128) NULL,
  created_at datetime,
  INDEX (musteri_id, aktif)
);

CREATE TABLE portal_oturumlari (
  id char(36) PK,
  user_id char(36) FK portal_kullanicilari.id,
  refresh_token_hash varchar(255),
  ip varchar(64),
  user_agent text,
  expire_at datetime,
  iptal_at datetime NULL,
  INDEX (user_id, expire_at)
);

CREATE TABLE portal_sepet (
  id char(36) PK,
  portal_user_id char(36) FK,
  ad varchar(255),                 -- "Ana Mağaza", "Şube" vb.
  durum ENUM('aktif','tamamlandi','terk','silindi'),
  toplam_tutar decimal(12,2),
  notlar text,
  created_at datetime,
  updated_at datetime,
  INDEX (portal_user_id, durum)
);

CREATE TABLE portal_sepet_kalemleri (
  id char(36) PK,
  sepet_id char(36) FK,
  urun_id char(36) FK urunler.id,
  arac_model_id char(36) FK arac_modelleri.id NULL,
  miktar decimal(12,2),
  birim_fiyat decimal(12,2),
  iskonto_yuzde decimal(5,2),
  toplam decimal(12,2),
  eklendi_at datetime,
  INDEX (sepet_id)
);

CREATE TABLE portal_audit (
  id char(36) PK,
  portal_user_id char(36) FK,
  aksiyon varchar(64),             -- 'login','logout','sepet_ekle','sipariş_aç'
  hedef_tip varchar(64),
  hedef_id char(36),
  detay JSON,
  ip varchar(64),
  user_agent text,
  created_at datetime,
  INDEX (portal_user_id, created_at DESC)
);

CREATE TABLE portal_bildirimler (
  id char(36) PK,
  portal_user_id char(36) FK,
  tip ENUM('siparis','odeme','kampanya','genel','uyari'),
  baslik varchar(255),
  govde text,
  link varchar(500),
  okundu tinyint,
  gonderildi_email tinyint,
  gonderildi_push tinyint,
  created_at datetime,
  INDEX (portal_user_id, okundu, created_at DESC)
);

CREATE TABLE portal_not_defteri (
  id char(36) PK,
  thread_id char(36),              -- aynı bayi-yönetici thread
  yazan_tip ENUM('bayi','yonetici'),
  yazan_user_id char(36),
  mesaj text,
  ekler JSON,
  okundu_at datetime NULL,
  created_at datetime,
  INDEX (thread_id, created_at)
);

CREATE TABLE arac_modelleri (
  id char(36) PK,
  marka varchar(64),
  model varchar(64),
  yil_baslangic int,
  yil_bitis int,
  govde_tipi ENUM('sedan','hatchback','wagon','suv','coupe','convertible','pickup','van'),
  motor_tipi varchar(64) NULL,
  notlar text,
  UNIQUE (marka, model, yil_baslangic, yil_bitis, govde_tipi),
  INDEX (marka, model)
);

CREATE TABLE urun_arac_uyumlulugu (
  id char(36) PK,
  urun_id char(36) FK urunler.id,
  arac_model_id char(36) FK arac_modelleri.id,
  uyumluluk ENUM('tam','kismi','garanti'),
  notlar text,
  UNIQUE (urun_id, arac_model_id),
  INDEX (arac_model_id),
  INDEX (urun_id)
);

CREATE TABLE portal_numune_talepleri (
  id char(36) PK,
  portal_user_id char(36) FK,
  urun_id char(36) FK urunler.id,
  miktar int,
  adres text,
  notlar text,
  durum ENUM('yeni','onayli','gonderildi','tamamlandi','reddedildi'),
  onaylayan_user_id char(36),
  gonderim_takip_no varchar(64),
  created_at datetime
);

CREATE TABLE portal_iadeler (
  id char(36) PK,
  portal_user_id char(36) FK,
  siparis_id char(36) FK satis_siparisleri.id,
  kalemler JSON,                   -- [{kalem_id, miktar, sebep}]
  sebep_kategori ENUM('kalite','yanlis_model','fazla_teslim','hasarli','diger'),
  aciklama text,
  ekler JSON,                      -- foto/PDF
  durum ENUM('yeni','inceleniyor','onayli','reddedildi','tamamlandi'),
  onaylayan_user_id char(36),
  iade_etiket_no varchar(64),
  created_at datetime
);
```

### Faz 7 — MLOps (5 tablo)

```sql
CREATE TABLE model_versiyonlari (
  id char(36) PK,
  model_ailesi varchar(128),
  versiyon varchar(32),
  egitim_baslangic datetime,
  egitim_bitis datetime,
  egitim_kayit_sayisi int,
  hyperparametreler JSON,
  metrikler JSON,
  artifact_yolu text,              -- s3://...
  durum ENUM('egitiliyor','hazir','champion','retired','hatali'),
  champion_olma_tarihi datetime NULL,
  retired_tarih datetime NULL,
  egiten_user_id char(36),
  notlar text,
  INDEX (model_ailesi, durum)
);

CREATE TABLE ab_test_calistirma (
  id char(36) PK,
  champion_model_id char(36) FK,
  challenger_model_id char(36) FK,
  baslangic datetime,
  bitis datetime,
  champion_mape decimal(8,4),
  challenger_mape decimal(8,4),
  p_value decimal(10,8),
  istatistiksel_anlamli tinyint,
  sonuc ENUM('beklemede','promote','retire','sürer')
);

CREATE TABLE excel_yukleme_gecmisi (
  id char(36) PK,
  user_id char(36),
  dosya_tipi ENUM('siparis','kampanya','ham_madde','musteri','urun'),
  dosya_adi varchar(255),
  satir_sayisi int,
  basarili int,
  hata int,
  durum ENUM('isleniyor','tamamlandi','hatali'),
  hata_log JSON,
  yeniden_egitim_tetikledi tinyint,
  yuklendi_at datetime
);

CREATE TABLE feature_pipeline_kayitlari (
  id char(36) PK,
  pipeline_versiyonu varchar(32),
  girdi_tablo varchar(64),
  feature_count int,
  null_oran decimal(4,2),
  outlier_count int,
  calistirma_zamani datetime,
  basarili tinyint
);

CREATE TABLE tahmin_geri_besleme (
  id char(36) PK,
  tahmin_id char(36) FK tahmin_calistirma.id,
  user_id char(36),
  duzeltilen_deger decimal(12,2),
  sebep text,
  guven_dusuk_mu tinyint,
  geri_besleme_tarihi datetime
);
```

> **Detay:** [`tartisma/14-egitilebilir-modeller-mlops.md`](../tartisma/14-egitilebilir-modeller-mlops.md)

### Faz 8 — Konversasyonel (3 tablo)

```sql
CREATE TABLE ai_aksiyon_audit (
  id char(36) PK,
  aksiyon_tipi varchar(64),
  tetikleyen ENUM('ai_otomatik','ai_onerili','insan_manuel'),
  ai_oneri_id char(36) NULL,
  insan_user_id char(36) NULL,
  payload JSON,
  oncesi_state JSON,
  sonrasi_state JSON,
  rollback_mumkun tinyint,
  rollback_yapildi_at datetime NULL,
  notlar text,
  created_at datetime,
  INDEX (aksiyon_tipi, created_at)
);

CREATE TABLE ai_otomasyon_ayarlari (
  id char(36) PK,
  scope ENUM('global','aksiyon_tipi','provider'),
  scope_value varchar(128),
  enabled tinyint,
  notlar text,
  updated_by char(36),
  updated_at datetime
);

CREATE TABLE ai_oneri_geri_besleme (
  id char(36) PK,
  oneri_id char(36),
  oneri_tipi varchar(64),
  ai_guven_skoru decimal(4,2),
  risk_skoru int,
  insan_karari ENUM('onayli','red','revize','iptal'),
  red_sebebi text,
  manual_alternatif JSON,
  created_at datetime
);
```

### Faz 9 — Mobil & Saha (3 tablo)

```sql
CREATE TABLE ziyaret_kayitlari (
  id char(36) PK,
  saha_user_id char(36) FK kullanicilar.id,
  bayi_id char(36) FK musteriler.id,
  ziyaret_tipi ENUM('saha_satis','sikayet','rutin','egitim','tahsilat'),
  baslangic_zamani datetime,
  bitis_zamani datetime,
  konum_enlem decimal(10,7),
  konum_boylam decimal(10,7),
  konum_dogrulandi tinyint,
  katilimcilar JSON,
  ses_kaydi_yolu text NULL,        -- s3://
  ses_metni text NULL,             -- Whisper çıktı
  llm_ozet text NULL,
  fotograf_yollari JSON,
  sonuc_etiketleri JSON,           -- ['memnun_değil','rakip_teklif','sipariş_aldı']
  sonraki_adim text,
  yeni_siparis_id char(36) NULL,
  cretaed_at datetime,
  INDEX (saha_user_id, baslangic_zamani DESC),
  INDEX (bayi_id, baslangic_zamani DESC)
);

CREATE TABLE push_bildirim_log (
  id char(36) PK,
  user_id char(36),                -- portal veya admin user
  user_tip ENUM('admin','bayi','saha'),
  cihaz_token varchar(255),
  baslik varchar(255),
  govde text,
  payload JSON,
  gonderildi_at datetime,
  teslim_at datetime NULL,
  acildi_at datetime NULL,
  hata text NULL
);

CREATE TABLE mobil_oturumlari (
  id char(36) PK,
  user_id char(36),
  user_tip ENUM('admin','bayi','saha'),
  cihaz_id varchar(255),
  cihaz_modeli varchar(255),
  os varchar(64),
  app_versiyonu varchar(32),
  push_token varchar(255),
  son_aktif datetime,
  iptal_at datetime NULL
);
```

## 4. Mevcut Tablolara Eklenen Kolonlar

Bazı yeni özellikler **mevcut tablolara kolon ekler** (yine seed dosyası güncellenir):

```sql
-- musteriler tablosu (Faz 5 + Faz 6)
ALTER TABLE musteriler ADD COLUMN portal_aktif_mi tinyint DEFAULT 0;
ALTER TABLE musteriler ADD COLUMN son_portal_giris datetime NULL;
ALTER TABLE musteriler ADD COLUMN web_sitesi varchar(255) NULL;
ALTER TABLE musteriler ADD COLUMN sosyal_medya_json JSON NULL;
ALTER TABLE musteriler ADD COLUMN sektor_etiketi varchar(128) NULL;
ALTER TABLE musteriler ADD COLUMN segment ENUM('A','B','C') NULL;
ALTER TABLE musteriler ADD COLUMN konum_enlem decimal(10,7) NULL;
ALTER TABLE musteriler ADD COLUMN konum_boylam decimal(10,7) NULL;
ALTER TABLE musteriler ADD COLUMN churn_son_skor decimal(5,2) NULL;
ALTER TABLE musteriler ADD COLUMN churn_son_skor_tarihi datetime NULL;

-- urunler tablosu (Faz 6)
ALTER TABLE urunler ADD COLUMN portal_gorunur tinyint DEFAULT 1;
ALTER TABLE urunler ADD COLUMN sezon_etiketi varchar(64) NULL;

-- satis_siparisleri tablosu (Faz 6)
ALTER TABLE satis_siparisleri ADD COLUMN kaynak ENUM(
  'admin_panel','portal','sohbet','telefon','email','whatsapp','manuel'
) DEFAULT 'admin_panel';
ALTER TABLE satis_siparisleri ADD COLUMN portal_sepet_id char(36) NULL;
```

> **Not:** Yukarıdaki ALTER ifadeleri **gösterim amaçlıdır**. Gerçek implementasyonda seed SQL dosyaları (`0XX_*.sql`) doğrudan güncellenir, fresh deploy ile uygulanır. Production migration ayrı yönetilir.

## 5. ER İlişki Görünümü (özet)

```
                    musteriler
                        │
                ┌───────┼─────────────────────────────────┐
                ↓       ↓                                 ↓
      portal_kullanicilari   churn_skor_gecmisi      satis_siparisleri
                │              │                          │
                ↓              ↓                          ↓
         portal_sepet     bayi_sinyalleri          siparis_kalemleri
                │              ↑                          │
                ↓              │                          ↓
      portal_sepet_kalemleri   web_kazima_kayitlari   uretim_emirleri
                │
                ↓
              urunler ──────── urun_arac_uyumlulugu
                │                       │
                ↓                       ↓
         tahmin_calistirma         arac_modelleri
                │
                ↓
         tahmin_modelleri ── model_versiyonlari ── ab_test_calistirma
                │
                ↓
         tahmin_dogruluk
```

## 6. Veri Yaşam Döngüsü

### 6.1 Retention politikası

| Tablo | Saklama süresi | Sonra ne olur |
|-------|----------------|----------------|
| `portal_audit` | 7 yıl | Arşive (S3 cold) |
| `ai_aksiyon_audit` | 7 yıl | Arşive |
| `web_kazima_kayitlari` | 90 gün (HTML), 2 yıl (parse) | HTML silinir, metadata kalır |
| `tahmin_calistirma` | 3 yıl | Aggregate'ye dönüşür |
| `tahmin_dogruluk` | Sınırsız | Modelin tarihçesi |
| `model_versiyonlari` (retired) | 3 yıl | S3'ten silinir |
| `push_bildirim_log` | 6 ay | Silinir |
| `portal_oturumlari` (iptal) | 90 gün | Silinir |
| `talep_havuzu` (kapanan) | 5 yıl | Aggregate |
| `lead_havuzu` (kayıp) | 3 yıl | Anonimleştirilir |
| `ziyaret_kayitlari` | Sınırsız | (saha tarihi değerli) |

### 6.2 KVKK silme talebi akışı

Bayi silme talebi gönderirse:
1. `musteriler` → `kvkk_silme_at` damgası
2. PII alanları (telefon, email, ad-soyad) anonimleştirilir
3. İlişkili tablolar: portal_kullanicilari pasifleştirilir
4. Sipariş geçmişi anonim kalır (ticari kayıt yasal zorunlu)
5. Audit log: silme talebi + uygulanan aksiyon

### 6.3 Backup stratejisi

| Veri | Sıklık | Yer | Süre |
|------|--------|-----|------|
| MySQL tam dump | Günlük 03:00 | S3 (encrypted) | 30 gün |
| MySQL binlog | Saatlik | S3 | 7 gün |
| S3 object storage | Cross-region replica | AWS | Sürekli |
| Konfig + secrets | Manuel | Şifreli vault | Sürekli |
| Kod | Git push | GitHub/GitLab | Sürekli |

## 7. Performans — Index Stratejisi

### 7.1 Yüksek-trafik sorguları

| Sorgu | İndeks |
|-------|--------|
| Bayi sipariş geçmişi (son 90 gün) | `(bayi_id, created_at DESC)` |
| Çok satan ürün (son 30 gün) | `(urun_id, created_at DESC)` |
| Portal sepet aktif | `(portal_user_id, durum)` WHERE `durum='aktif'` |
| Tahmin sonuç (bayi-ürün-dönem) | `(bayi_id, urun_id, donem_baslangic)` |
| Churn risk top liste | `(risk, tarih DESC)` WHERE `risk IN ('yüksek','kritik')` |
| Web kazıma sıradaki | `(sonraki_kazima, aktif)` WHERE `aktif=1` |
| Lead skor sıralı | `(benzerlik_skoru DESC, durum)` WHERE `durum IN ('yeni','araştırılıyor')` |

### 7.2 Tahmin yapan sorgular (denormalize gerekirse)

İlerde performans sorunu çıkarsa:
- `bayi_aylik_ozet` materialized view (toplam sipariş, ciro, churn skoru)
- Redis cache layer (her sorgu cache'lenmeden önce ölçüm)
- Read replica (raporlama yükü ana DB'yi etkilemesin)

## 8. Test verisi

Faz 0 sonunda **realistic test verisi** üretilir:
- 5 pilot bayi anonim seed
- 6 ay sipariş geçmişi (gerçekleşen + sentetik)
- Test ortamında promats_erp_test ayrı DB
- E2E testler bu seed üzerinde koşar

## 9. Açık karar noktaları (Veri Modeli)

1. **char(36) UUID vs auto-increment INT:** mevcut Promats konvansiyonu UUID, devam ediyoruz. (Karar: UUID)
2. **JSON kolonları vs ayrı tablo:** sinyaller, parametreler vb. JSON'da mı tablolaştırma? (Önerim: JSON, sorgulanmıyorsa)
3. **Soft delete:** her tabloya mı, sadece kritiklere mi? (Önerim: kritiklere — `musteriler`, `urunler`, `siparisler`)
4. **Audit log seviyesi:** her INSERT/UPDATE'i mi loglayalım? (Önerim: risk 7+ aksiyonlar)
5. **Read replica:** ne zaman gerek? (Önerim: 100K+ aylık sipariş)
6. **MySQL partitioning:** `tahmin_calistirma` ve `web_kazima_kayitlari` için? (Önerim: 1 yıl sonra, tarih bazlı)
7. **Encryption at rest:** sadece DB volume mu, kolon-bazlı mı? (Önerim: volume — yeterli)
8. **PII şifreleme:** telefon/email DB'de plain mi şifreli mi? (Önerim: plain ama erişim audit'li, KVKK uyumlu)
9. **`musteriler` aşırı yükleniyor:** ayrı `bayi_metadata` tablosu mu? (Önerim: önce kolonlar, 50+ kolon olunca ayrıştır)
10. **Drizzle vs raw SQL migration:** seed dosyalarına raw SQL devam (Promats konvansiyonu)
