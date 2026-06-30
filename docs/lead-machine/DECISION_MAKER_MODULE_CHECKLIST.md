# Karar Verici Bulma Modulu Checklist

Amaç: Apollo'da manuel yaptigimiz "firma havuzu bul, temizle, karar verici bul, dogrula, listeye aktar" akisini Market Pulse icinde backend + admin panel + frontend olarak guvenilir ve satisa kullanilabilir hale getirmek.

Referans senaryo: Turkiye fitness / spor salonu / pilates / reformer / wellness isletmeleri icin 200 kisilik temiz B2B karar verici listesi.

Kalite ilkesi: Kotu veya uydurma kisi verisi yazilmayacak. Karar verici dogrulanamiyorsa satir C skoru ile bos kisi olarak kalacak ve manuel arastirma kuyruguna dusecek.

---

## 0. Mevcut Durum ve Ana Bosluklar

- [x] Admin panelde karar verici bulma icin ayri bir Apollo-benzeri ekran yok. (Route + panel eklendi.)
- [x] Public frontendde `/karar-vericiler` sayfasi var ama admin lead-machine akisina tam bagli degil. (Job/results/export akisi ayni backend modeline baglandi.)
- [ ] Backend karar verici motoru var, fakat `SERPER_API_KEY` olmadan LinkedIn SERP akisi A kalite sonuc uretmiyor.
- [x] `backend/.env.example` icinde `SERPER_API_KEY` eksik. (Eklendi.)
- [x] `backend/src/modules/lead-machine/__tests__/decision-maker.test.ts` su an kirik: 2 pass, 2 fail. (Serper mock ile 4/4 yesil.)
- [ ] B2B arama ekrani tek arama terimi odakli; sektor presetleri, exclude filtreleri, kalite kapilari ve liste olusturma akisi eksik.
- [x] Aday listesinde karar verici kalitesi icin A/B/C filtreleri ve "LinkedIn var/yok" ayrimi yeterince gorunur degil. (Karar verici panelinde A/B/C filtresi ve LinkedIn aksiyonu eklendi.)
- [x] Temiz CSV/XLSX export admin panelde karar verici modulune bagli degil. (CSV + XLSX baglandi.)

---

## 1. Urun Akisi

Apollo'daki dogru akisi Market Pulse icinde su 6 adima cevirecegiz:

- [x] Kampanya / arama brief'i olustur.
- [x] Sirket havuzu uret.
- [x] Sirket havuzunu kaliteye gore temizle.
- [x] Secili sirketler icin karar verici bul.
- [x] Karar vericileri A/B/C guven skoruyla dogrula.
- [x] Temiz listeyi CSV/XLSX olarak indir veya CRM/pipeline'a aktar.

Admin panel ana route:

```text
/admin/market/lead-machine/decision-makers
```

Frontend kullanici route:

```text
/{locale}/karar-vericiler
```

Backend route grubu:

```text
/api/v1/admin/lead-machine/decision-makers/*
/api/v1/lead-machine/decision-makers/*
```

---

## 2. Backend Checklist

### 2.1 Env ve Konfigurasyon

- [x] `backend/.env.example` icine `SERPER_API_KEY=` ekle.
- [x] `backend/src/core/env.ts` zaten `SERPER_API_KEY` okuyorsa dokumante et; eksikse tip/parse ekle.
- [ ] `APOLLO_API_KEY`, `GOOGLE_MAPS_API_KEY`, `SERPER_API_KEY`, `SCRAPER_SERVICE_URL` icin health/config endpointinde masked durum gostergesi ekle.
- [ ] Site settings fallback gerekiyorsa Serper/Apollo key icin tenant-level config stratejisi belirle.

Kabul:

- [ ] Key yoksa API kirilmaz, ancak response `capabilities.serper=false` gibi net uyarir.
- [x] Key varsa LinkedIn SERP cozumleme testleri gecmeli.

### 2.2 Veri Modeli

Mevcut `lead_decision_makers` tablosu korunacak, ama operasyon icin ek alanlar degerlendirilecek.

- [ ] `lead_decision_makers` icin su alanlarin yeterliligini kontrol et:
  - `company_name`
  - `city`
  - `business_type`
  - `decision_maker_name`
  - `title`
  - `linkedin_profile_url`
  - `company_website`
  - `social_url`
  - `source_url`
  - `fit_note`
  - `confidence_score`
  - `sector`
  - `last_verified_at`
- [ ] Gerekiyorsa su alanlari migration ile ekle:
  - `campaign_id`
  - `company_quality_score`
  - `company_quality_status`
  - `decision_maker_source`
  - `verification_status`
  - `manual_review_reason`
  - `excluded_reason`
- [x] Sirket havuzu ile karar verici sonucunu ayirmak gerekiyorsa `lead_company_pool` tablosu tasarla.
- [ ] Duplicate stratejisi:
  - Sirket: `tenant_key + normalized_company_name + city`
  - Kisi: `tenant_key + linkedin_profile_url` varsa LinkedIn, yoksa `company + name + title`

Kabul:

- [ ] Ayni sirket tekrar arandiginda duplicate olusmaz.
- [ ] Daha iyi kalite skoru gelirse eski satir guncellenir.

### 2.3 Sektor Presetleri

Fitness icin Apollo deneyiminden gelen preset:

- [x] `fitness` presetini daralt:

```text
fitness center
gym
spor salonu
fitness club
pilates studio
reformer pilates studio
```

- [x] `wellness center`, `yoga studio`, `personal training` ayri alt preset olsun; ana fitness aramasina otomatik karismasin.
- [x] Exclude kelimeleri ekle:

```text
supplement
nutrition
medikal
medical
fizyoterapi
physiotherapy
termal
hotel
spa hotel
cosmetics
e-commerce
software
app
university
association
```

- [ ] Sehir presetleri:

```text
Istanbul, Ankara, Izmir, Antalya, Bursa, Kocaeli, Konya, Adana, Mersin, Mugla
```

Kabul:

- [ ] Fitness aramasi supplement/medikal/termal otel agirlikli liste uretmemeli.
- [ ] Pilates/reformer aramasi kucuk isletmelere izin vermeli ama manuel dogrulama kuyrugu uretmeli.

### 2.4 Sirket Havuzu Uretme

- [x] Google Places API ile sektor x sehir bazli sirket havuzu uret.
- [x] Her sonuc icin su alanlari normalize et:
  - Sirket adi
  - Sehir
  - Adres
  - Website
  - Telefon
  - Google Maps URL
  - Business type
  - Source
- [x] Website yoksa sosyal medya / Google Maps yine source olarak tutulmali.
- [x] Sirket uygunluk skoru hesapla:
  - Pozitif: gym, fitness, pilates, reformer, spor salonu, fitness club
  - Negatif: supplement, medikal, fizyoterapi, hotel, termal, e-commerce
  - Veri kalitesi: website var, phone var, maps var
- [x] Sirketleri `qualified`, `possible`, `manual_review`, `excluded` durumlarina ayir.

Kabul:

- [x] "Select all 294" gibi ham havuzu temiz liste diye kaydetmez.
- [x] Disqualified sirketler default exporta girmez.

### 2.5 Karar Verici Bulma

Kaynak sirasi:

- [x] 1. Serper Google operator:

```text
site:linkedin.com/in "Founder" "Firma" "Sehir"
site:linkedin.com/in "Owner" "Firma" "Sehir"
site:linkedin.com/in "General Manager" "Firma" "Sehir"
site:linkedin.com/in "Kurucu" "Firma" "Sehir"
site:linkedin.com/in "Genel Müdür" "Firma" "Sehir"
```

- [x] 2. Apollo domain people search, sadece LinkedIn URL + 2 kelimeli isim varsa kabul. (Default kapali, sadece ucretli fallback acilirsa.)
- [ ] 3. Website OSINT, sadece guclu kanit varsa B olarak kabul.
- [ ] 4. Hicbiri yoksa kisi alanlarini bos birak, C skoru ver.

Unvan presetleri:

```text
Founder
Co-Founder
Owner
CEO
General Manager
Managing Director
Operations Manager
Business Development Manager
Franchise Manager
Purchasing Manager
Kurucu
Ortak
İşletme Sahibi
Genel Müdür
Operasyon Müdürü
İş Geliştirme
Satınalma
```

Kabul:

- [ ] Tek isimli, uydurma veya tekrar eden isimler kabul edilmez.
- [ ] A skoru icin LinkedIn profil URL zorunlu.
- [x] Apollo sonucu LinkedIn URL yoksa A/B olmaz.
- [ ] Website OSINT rastgele isim yakalarsa bos/C olarak kalir.

### 2.6 A/B/C Skorlama

- [ ] A:
  - LinkedIn profile URL var.
  - Kisi adi 2+ kelime.
  - Unvan karar verici.
  - Firma/şehir baglami eslesiyor.
- [ ] B:
  - Website/social kaynakli isim + unvan var.
  - LinkedIn yok veya firma eslesmesi zayif.
- [ ] C:
  - Sirket dogrulandi ama karar verici yok.
  - Manuel arastirma onerilir.
- [ ] `fit_note` otomatik ama gercege uygun yazilmali.

Kabul:

- [ ] A/B/C rozetleri hem API hem UI'da ayni anlamda kullanilir.
- [ ] "Kotu veri yerine bos veri" prensibi testle korunur.

### 2.7 Job Mimarisi

Mevcut senkron `/decision-makers/find` uzun aramalarda yeterli degil.

- [x] `lead_search_jobs` icine `channel='decision_maker'` veya `b2b_decision_makers` ekle.
- [x] `POST /admin/lead-machine/decision-makers/jobs` ekle.
- [x] `GET /admin/lead-machine/decision-makers/jobs` ekle.
- [x] `GET /admin/lead-machine/decision-makers/results?job_id=...` ekle.
- [x] Background job ile 200 hedef icin timeout riski kaldir.
- [ ] Progress alanlari:
  - total_companies
  - processed_companies
  - found_a
  - found_b
  - manual_review
  - excluded

Kabul:

- [x] 200 hedefli arama request timeout'a dusmez.
- [x] Kullanici job ilerlemesini admin panelde gorur.

### 2.8 Export

- [x] CSV export endpoint ekle.
- [x] XLSX export endpoint ekle veya CSV ile baslayip XLSX'i ikinci faza ayir.
- [ ] Export kolonlari:

```text
Company Name
City
Business Type
Decision Maker Name
Title
LinkedIn Profile URL
Company Website / Social URL
Source / Verification URL
Fit Note
Confidence Score
Last Verified At
```

- [x] Export filtreleri:
  - Sadece A
  - A + B
  - Tum satirlar
  - Manuel kontrol gerekenler

Kabul:

- [x] CSV Excel'de Turkce karakterlerle bozulmadan acilir.
- [x] Duplicate satir exporta girmez.

### 2.9 Testler

- [x] Kirik karar verici testlerini guncelle.
- [x] Serper mock ile A skoru testi.
- [ ] Serper key yoksa C fallback testi.
- [ ] Apollo LinkedIn'siz sonuc reddedilir testi.
- [ ] Website OSINT tek isim / tekrar eden isim reddedilir testi.
- [x] Duplicate upsert testi.
- [ ] Fitness preset exclude testi.
- [x] Backend komutlari:

```bash
cd backend
bun run build
bun run tenant:guard
bun test src/modules/lead-machine/__tests__/decision-maker.test.ts
bun test
```

---

## 3. Admin Panel Checklist

### 3.1 Yeni Sayfa

- [x] Route ekle:

```text
admin_panel/src/app/(main)/admin/(admin)/market/lead-machine/decision-makers/page.tsx
```

- [x] Sidebar'a ekle:

```text
Lead Machine > Karar Verici Bulma
```

- [x] Mevcut UI diliyle uyumlu, kompakt operasyon paneli yap.

### 3.2 Arama/Kampanya Formu

Alanlar:

- [x] Sektor preset secimi
- [x] Business type multi-select
- [x] Sehir multi-select
- [x] Hedef sirket/kisi sayisi
- [ ] Calisan sayisi tercihi veya "kucuk isletmeleri dahil et" toggle
- [x] Exclude keywords alani
- [x] Unvan preset secimi
- [x] Kaynak secimi:
  - Google Places
  - Serper LinkedIn
  - Apollo
  - Website OSINT
- [ ] "Sadece LinkedIn dogrulanmis kisileri hedefle" toggle

Kabul:

- [x] Kullanici Apollo'daki filtre mantigini admin panelde anlayabilir.
- [x] Fitness icin tek tik preset vardir.

### 3.3 Sirket Havuzu Tablosu

Kolonlar:

- [x] Sirket
- [x] Sehir
- [x] Isletme turu
- [x] Website
- [x] Google Maps
- [x] Sirket kalite skoru
- [x] Durum: qualified / possible / manual / excluded
- [x] Exclude reason

Aksiyonlar:

- [ ] Sec
- [ ] Reddet
- [ ] Manuel kontrol
- [ ] Secilenlerden karar verici bul

Kabul:

- [x] Kullanici 294 ham sonucu topluca temiz listeye basamaz; kalite filtresi gorunur olur.
- [x] Excluded satirlar varsayilan olarak gizlenir.

### 3.4 Karar Verici Sonuc Tablosu

Kolonlar:

- [x] Sirket
- [x] Sehir
- [x] Kisi
- [x] Unvan
- [x] LinkedIn
- [x] Kaynak
- [x] A/B/C skor
- [x] Fit note
- [x] Son dogrulama tarihi

Filtreler:

- [x] A/B/C
- [x] LinkedIn var/yok
- [ ] Kaynak: Serper / Apollo / Website / None
- [ ] Sehir
- [ ] Business type
- [ ] Manuel kontrol

Aksiyonlar:

- [x] CSV indir
- [x] XLSX indir
- [x] CRM'e aktar
- [x] Lead candidate'a aktar
- [ ] Manuel dogrulandi olarak isaretle
- [ ] Reddet

Kabul:

- [x] 200 kisilik liste cikarmak icin kullanici public sayfaya gitmek zorunda kalmaz.

### 3.5 Aday Paneli Entegrasyonu

Mevcut `lead-candidates-panel` icinde:

- [ ] "Toplu Karar Verici Bul" aksiyonu dogru endpoint'e baglanmali.
- [ ] `raw_data.decision_makers[]` disinda `lead_decision_makers` sonuclari da gorulebilmeli.
- [ ] A/B/C rozetleri kartta gorunmeli.
- [ ] LinkedIn linki varsa tek tik acilmali.
- [ ] C skorlu adaylar "manuel arastirma" olarak ayrilmali.

Kabul:

- [ ] B2B, customs ve fair adaylarindan karar verici enrich edilebilir.

### 3.6 Admin API Hooklari

- [x] `admin_panel/src/integrations/endpoints/admin/market_admin.endpoints.ts` icine ekle:
  - `startDecisionMakerJob`
  - `listDecisionMakerJobs`
  - `listDecisionMakerResults`
  - `exportDecisionMakersCsv`
  - `exportDecisionMakersXlsx`
  - `enrichDecisionMakersForCandidates`
- [x] Tags:
  - `DecisionMakerJobs`
  - `DecisionMakerResults`
  - `LeadCandidates`

Kabul:

- [x] RTK tests guncellenir.

---

## 4. Frontend Checklist

Public frontenddeki `/karar-vericiler` iki amaca hizmet etmeli: sade musteri deneyimi ve admin modulun hafif versiyonu.

### 4.1 Mevcut Sayfayi Guclendir

- [x] `/karar-vericiler` sayfasi backend job mimarisine gecsin; senkron 24 sirket limitiyle kalmasin.
- [x] Kullanici job status gorebilsin.
- [x] A/B/C ve LinkedIn var/yok filtreleri gelsin.
- [x] CSV indir korunur.
- [x] XLSX indir eklenir.
- [ ] "Manuel kontrol gerekenler" ayrimi gelsin.

### 4.2 UX

- [x] Fitness presetleri sade sunulsun:
  - Fitness / Gym
  - Pilates / Reformer
  - Wellness
  - Yoga / Boutique
- [x] Sehir secimi daha genisletilsin.
- [x] Sonuc tablosunda source_url ve social_url gorunur olsun.
- [x] Bos karar verici satirlari gizle/goster toggle ekle.

Kabul:

- [x] Public sayfa tek basina 50-200 kayitlik arama baslatabilir.
- [x] Admin paneldeki sonuc ile ayni backend verisini kullanir.

---

## 5. Kalite ve Dogrulama Kurallari

- [ ] Sirket sektor disi ise karar verici aramaya sokulmaz.
- [ ] LinkedIn profil URL olmadan A skoru verilmez.
- [ ] Kisi adi tek kelimeyse kabul edilmez.
- [ ] Kisi adi sirket adi, sektor adi veya genel kelimeyse kabul edilmez.
- [ ] Ayni isim cok fazla farkli firmada cikiyorsa otomatik supheli sayilir.
- [ ] Website OSINT sadece title yakininda makul 2+ kelimeli isim bulursa B olabilir.
- [ ] Source URL her satirda bulunur.
- [ ] Export oncesi duplicate temizligi yapilir.
- [ ] "Disqualified", "excluded", "manual_review" satirlari default export disinda kalir.

---

## 6. Operasyonel Gereksinimler

- [ ] `SERPER_API_KEY` edinilecek ve backend env'e eklenecek.
- [ ] `GOOGLE_MAPS_API_KEY` aktif ve kotasi yeterli olacak.
- [x] `APOLLO_API_KEY` varsa sadece destekleyici kaynak olarak kullanilacak.
- [x] Apollo kredi korumasi:
  - Arastirma / sirket havuzu / on eleme asamasinda Apollo kredisi harcanmayacak.
  - `APOLLO_DECISION_MAKER_ENABLED=false` default olacak.
  - Admin ve public job formunda `Ucretli Apollo fallback` default kapali olacak.
  - Apollo sadece bilincli acilirsa people-search fallback olarak kullanilacak.
  - Email/mobile/enrichment kredileri sadece satisa alinacak A/B adaylarda manuel veya ayri aksiyonla harcanacak.
- [x] Apollo'da manuel calisirken kapali tutulacaklar:
  - Apollo Agent
  - Research with AI
  - Companies Auto-Score
  - Toplu Enrich
  - Access Mobile
  - Toplu email/mobile reveal
- [ ] Rate limit:
  - Serper sorgulari firma basina max 3-4 operator.
  - Apollo sorgulari domain basina max 1.
  - Website OSINT batch icin concurrency limitli.
- [ ] Job loglari admin panelde gorunur olacak.
- [ ] Hata durumlari:
  - Key yok
  - Quota doldu
  - Maps sonuc yok
  - Serper sonuc yok
  - Apollo sonuc yok
  - Website scrape hata

---

## 7. Fitness 200 Kisi Kabul Senaryosu

Input:

```text
Sector: Fitness / Pilates / Reformer
Cities: Istanbul, Ankara, Izmir, Antalya, Bursa, Kocaeli
Target: 200
Sources: Google Places + Serper + Apollo + Website OSINT
Export: A+B only
```

Beklenen:

- [ ] En az 200 dogrulanmis veya dogrulanabilir sirket havuzu.
- [ ] En az 80-120 A/B karar verici ilk otomatik kosuda.
- [ ] C satirlar manuel arastirma kuyrugunda.
- [ ] Exportta sektor disi supplement/medikal/termal otel agirligi yok.
- [ ] LinkedIn URL olan satirlar tek tik acilir.
- [ ] Her satirda kaynak/dogrulama linki vardir.

---

## 8. Uygulama Sirasi

### Faz 1 — Backend Saglamlastirma

- [x] Env + Serper testlerini duzelt.
- [x] Kirik decision-maker testlerini yesile cek.
- [x] Fitness preset + exclude kurallarini backendde netlestir.
- [x] Job tabanli decision-maker aramayi ekle.
- [x] Export endpointlerini ekle.

### Faz 2 — Admin Panel

- [x] Admin route + sidebar.
- [x] Kampanya formu.
- [x] Sirket havuzu tablosu.
- [x] Karar verici sonuc tablosu.
- [x] Export ve CRM/lead aktarimi. (CSV + XLSX + Lead Candidate + CRM aktarimi var.)

### Faz 3 — Frontend

- [x] Public `/karar-vericiler` sayfasini job mimarisine bagla.
- [x] Filtre/export gelistir.
- [x] Sonuc UX'ini adminle ayni veri modeline cek.

### Faz 4 — Canli Smoke

- [ ] 10 firmalik fitness smoke.
- [ ] 50 firmalik Istanbul/Ankara smoke.
- [ ] 200 hedefli uzun job smoke.
- [ ] Export dosyasi manuel kontrol.
- [ ] Apollo ekraninda gordugumuz kaliteyle karsilastirma.

---

## 9. Done Definition

Bu modul tamam sayilmasi icin:

- [x] Backend testleri yesil.
- [x] Admin panelde karar verici bulma ekrani calisiyor.
- [x] Public frontend ayni backend akisini kullaniyor.
- [ ] Fitness/TR icin A/B/C kalitesi anlamli.
- [ ] Uydurma isim yazilmiyor.
- [x] CSV/XLSX temiz ve tekrarsiz.
- [ ] 200 kisilik is icin operatorun manuel Apollo kullanmasina gerek kalmadan en az ham havuz + karar verici + dogrulama kuyrugu uretilebiliyor.
