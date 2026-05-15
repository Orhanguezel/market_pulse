# 11 — Ek Belgeler

Bu doküman MatPortal'ın **terimler sözlüğünü**, **referans linklerini**, **örnek yasal metinleri** (KVKK aydınlatma, bayi sözleşme klozu), **teknik referansları**, **rapor şablonlarını** ve **ek görselleri** içerir. Diğer dokümanların yanında destekleyici materyaldir.

## 1. Terim Sözlüğü

### Genel
- **MatPortal** — Bu projenin adı. Promats Bayi Portalı + AI tahmin + churn radarı + saha CRM'in birleşik markası
- **Paspas ERP** — Promats için geliştirilmiş mevcut Üretim ERP sistemi
- **Promats** — MatPortal'ın hedef müşterisi (plastik enjeksiyon kalıplama üreticisi)
- **Bayi** — Promats'tan toptan ürün alan distribütör/perakendeci (B2B müşteri)

### Teknik
- **MAPE** — Mean Absolute Percentage Error. Tahmin doğruluğu metriği. Düşük iyi
- **RMSE** — Root Mean Squared Error. Büyük sapmaları cezalandırır
- **MAE** — Mean Absolute Error. Mutlak ortalama sapma
- **SHAP** — SHapley Additive exPlanations. Hangi feature tahmini ne kadar etkiledi
- **ROP** — Reorder Point. Stok yeniden sipariş seviyesi
- **PO** — Purchase Order. Satınalma siparişi
- **LTV** — Lifetime Value. Müşteri ömür boyu değeri
- **NPS** — Net Promoter Score. Müşteri memnuniyet skoru
- **CRUD** — Create, Read, Update, Delete
- **JWT** — JSON Web Token. Authentication mekanizması
- **TTL** — Time To Live. Cache geçerlilik süresi
- **FCM** — Firebase Cloud Messaging. Push bildirim
- **MTTR** — Mean Time To Recovery. Hatadan toparlanma süresi
- **DR** — Disaster Recovery. Felaket kurtarma
- **A/B test** — İki versiyonu paralel çalıştırma + karşılaştırma
- **Champion/Challenger** — Aktif model vs yeni eğitilmiş model

### AI / ML
- **LLM** — Large Language Model (Claude, GPT, Llama)
- **Prophet** — Facebook geliştirdiği zaman serisi tahmin kütüphanesi
- **ARIMA** — AutoRegressive Integrated Moving Average. Klasik zaman serisi modeli
- **XGBoost** — Gradient boosting kütüphanesi (tabular veri)
- **LSTM** — Long Short-Term Memory. Recurrent neural network
- **Univariate** — Tek değişkenli (sadece geçmiş sipariş)
- **Multivariate** — Çok değişkenli (sipariş + kur + tatil + hava)
- **Active learning** — Kullanıcı düzeltmesinden öğrenen sistem
- **Calibration** — Modelin çıktılarının ince ayarı
- **Federated learning** — Veriyi paylaşmadan model paylaşımı
- **Slot-filling** — Sohbet'te eksik parametre toplama
- **Intent** — Niyet (kullanıcının ne istediği)
- **Prompt injection** — Kullanıcı girdisi ile sistem prompt'u manipüle etme

### Yasal
- **KVKK** — Kişisel Verilerin Korunması Kanunu (Türkiye)
- **GDPR** — General Data Protection Regulation (AB)
- **CBAM** — Carbon Border Adjustment Mechanism (AB karbon vergisi)
- **GİB** — Gelir İdaresi Başkanlığı
- **TBK** — Türk Borçlar Kanunu
- **TCK** — Türk Ceza Kanunu
- **e-Fatura** — Elektronik fatura (GİB sistemi)
- **e-Arşiv** — Elektronik arşiv (B2C için)
- **TOBB** — Türkiye Odalar ve Borsalar Birliği
- **TÜİK** — Türkiye İstatistik Kurumu
- **TCMB** — Türkiye Cumhuriyet Merkez Bankası
- **TÜFE** — Tüketici Fiyatları Endeksi
- **Aydınlatma metni** — KVKK gereği veri toplama amacının açıklandığı belge
- **Açık rıza** — Veri sahibinin bilinçli onayı
- **VERBİS** — Veri Sorumluları Sicili (KVKK kayıt sistemi)

### İş
- **B2B** — Business to Business. Firma-firma satış
- **B2C** — Business to Consumer. Firma-tüketici satış
- **OEM** — Original Equipment Manufacturer
- **Aftermarket** — Yedek parça / aksesuar pazarı
- **Distribütör** — Toplu alıp dağıtan bayi
- **Cari hesap** — Müşteri/tedarikçi mali takip hesabı
- **Vade** — Ödeme süresi
- **Cross-sell** — Mevcut müşteriye ek ürün satışı
- **Upsell** — Mevcut müşteriye daha pahalı/üst ürün satışı
- **Churn** — Müşteri kaybı (rakibe geçme veya hesap kapatma)
- **Lead** — Potansiyel müşteri (henüz satış olmamış)
- **Pipeline** — Satış süreci akışı (lead → kazanç)
- **Outreach** — Soğuk iletişim (yeni müşteriye ilk temas)
- **Sequence** — Otomatik çoklu adımlı email akışı
- **Onboarding** — Yeni kullanıcı/bayi alıştırma süreci

## 2. Yasal Metin Şablonları

### 2.1 KVKK Aydınlatma Metni — Bayi Portal'ı için

```
PROMATS BAYİ PORTALI (MATPORTAL)
KİŞİSEL VERİLERİN KORUNMASI KANUNU AYDINLATMA METNİ

1. VERİ SORUMLUSU
[Promats Şirket Bilgisi — yasal isim, adres, vergi no]

2. VERİ TOPLAMA AMACI
Promats Bayi Portalı (MatPortal) hizmetinin sunulması, sipariş yönetimi,
cari hesap takibi, ürün önerisi ve müşteri ilişkileri yönetimi amacıyla
aşağıdaki kişisel veriler işlenmektedir:

  - Kimlik bilgileri (ad, soyad)
  - İletişim bilgileri (email, telefon)
  - Firma temsilciliği bilgileri (görev, departman)
  - İşlem bilgileri (sipariş geçmişi, sepet hareketi)
  - Teknik bilgiler (IP, cihaz, oturum)

3. İŞLEME HUKUKİ SEBEP
KVKK m.5/2 uyarınca:
  - Sözleşmenin kurulması veya ifasıyla doğrudan doğrulu ilgili olması (e)
  - Veri sorumlusunun meşru menfaati (f)

4. AKTARIM
Veriler, MatPortal hizmet sağlayıcılarına (cloud hosting, email gateway,
analitik) hizmet sunum sınırı içinde aktarılır. Yurt dışı aktarım sadece
KVKK m.9 kapsamında, Avrupa Birliği uyumlu sağlayıcılara yapılır.

5. SAKLAMA SÜRESİ
Aktif hesap dönemi + 5 yıl yasal saklama yükümlülüğü kapsamında saklanır.

6. HAKLARINIZ (KVKK m.11)
  - Verilere erişim, düzeltme, silme talebi
  - İşlemenin amacını öğrenme
  - Yurt içi/dışı aktarım bilgisi
  - İtiraz hakkı

Talepleriniz için: kvkk@promats.com.tr

7. SCRAPING / VERİ ZENGİNLEŞTİRME
MatPortal hizmeti gelişimi amacıyla, bayinizin **public** web sitesi ve
sosyal medya hesapları periyodik olarak izlenir. Bu işlem yalnızca
firma verilerinizi (ürün listesi, kampanyalar, çalışma saatleri vb.)
kapsar; çalışanlarınızın kişisel verisi izlenmez. Detay için:
[link: scraping politikası]
```

### 2.2 Bayi Sözleşmesi — Scraping ve Veri Klozu

```
[BAYİ SÖZLEŞMESİ — EK MADDE]

Madde X. DİJİTAL VERİ KULLANIMI

X.1 Bayi, MatPortal hizmetinin geliştirilmesi ve iyileştirilmesi
amacıyla, kendi web sitesi, sosyal medya hesapları ve diğer **public**
dijital varlıklarının izlenmesine onay verir.

X.2 İzleme kapsamı:
  a) Bayinin sattığı markalar listesi
  b) Yayınladığı kampanyalar
  c) Çalışma saatleri ve iletişim bilgileri (public)
  d) Müşteri yorumları (public platformlar)

X.3 Toplanan veri:
  a) Yalnızca dahili kullanımdır, üçüncü tarafa paylaşılmaz
  b) KVKK kapsamı dışındaki firma verisidir
  c) Bayinin onayı olmadan rakip bilgisi olarak kullanılmaz

X.4 Veri saklama:
  a) HTML snapshot maksimum 90 gün saklanır
  b) Yapılandırılmış veri 2 yıl saklanır
  c) Bayi onayı geri çekerse, ilgili veri 30 gün içinde silinir

X.5 Bayi onayı geri çekme:
  Yazılı bildirim ile: kvkk@promats.com.tr
  Onay geri çekilirse, scraping durur, mevcut veri silinir, MatPortal
  hizmetlerinin bazı özellikleri (churn radarı vb.) o bayi için devre
  dışı kalır.
```

> **Not:** Yukarıdaki metinler **şablon**dur. Avukat onayından geçirilmeli, Promats kurumsal kimliğine uyarlanmalıdır.

## 3. Teknik Referans Linkleri

### Stack belgeleri
- Fastify: https://fastify.dev/docs/latest/
- Bun: https://bun.sh/docs
- Drizzle ORM: https://orm.drizzle.team/docs/overview
- Next.js 16: https://nextjs.org/docs
- Shadcn/UI: https://ui.shadcn.com/docs
- Redux Toolkit: https://redux-toolkit.js.org/
- RTK Query: https://redux-toolkit.js.org/rtk-query/overview
- Zod: https://zod.dev

### ML / Python
- scikit-learn: https://scikit-learn.org
- Prophet: https://facebook.github.io/prophet/
- XGBoost: https://xgboost.readthedocs.io
- MLflow: https://mlflow.org
- SHAP: https://shap.readthedocs.io
- FastAPI: https://fastapi.tiangolo.com

### Scraping
- Crawlee: https://crawlee.dev
- Playwright: https://playwright.dev
- Apify: https://apify.com

### LLM Providers
- Anthropic Claude: https://docs.anthropic.com
- OpenAI: https://platform.openai.com/docs
- Groq: https://console.groq.com/docs

### Mobil
- Flutter: https://docs.flutter.dev
- Firebase FCM: https://firebase.google.com/docs/cloud-messaging

### DevOps
- Docker: https://docs.docker.com
- GitHub Actions: https://docs.github.com/actions
- Sentry: https://docs.sentry.io
- Cloudflare: https://developers.cloudflare.com

### Türkiye public veri
- TOBB üye sorgusu: https://www.tobb.org.tr
- sanayim.net: https://www.sanayim.net
- TCMB EVDS: https://evds2.tcmb.gov.tr
- TÜİK: https://www.tuik.gov.tr
- GİB e-Fatura: https://efatura.gov.tr
- Türkpatent: https://www.turkpatent.gov.tr

### Yasal
- KVKK kanun: https://www.kvkk.gov.tr/Icerik/2030/6698-Sayili-Kisisel-Verilerin-Korunmasi-Kanunu
- VERBİS: https://verbis.kvkk.gov.tr
- KVKK aydınlatma rehberi: https://www.kvkk.gov.tr/Icerik/4123/Aydinlatma-Yukumlulugunun-Yerine-Getirilmesinde-Uyulacak-Usul-ve-Esaslar-Hakkinda-Teblig
- AB CBAM: https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en

## 4. Rapor Şablonları

### 4.1 Aylık yönetici raporu (otomatik PDF)

```
┌─────────────────────────────────────────────────────┐
│  MATPORTAL — AYLIK RAPOR                            │
│  [Ay/Yıl]                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ÜST DÜZEY                                          │
│  ─────────                                          │
│  Aktif bayi: 47 (önceki ay: 42, +12%)              │
│  Aylık sipariş: 285 (önceki: 245, +16%)            │
│  Portal payı: %68 (hedef: %70)                     │
│  Tahmin MAPE: %23 (hedef: %25 ✓)                   │
│                                                     │
│  KAZANÇLAR                                          │
│  ─────────                                          │
│  • 3 churn risk → 2 kurtarma (saha ziyareti)       │
│  • 12 yeni lead → 2 bayiye dönüşüm                 │
│  • Stok-out 2 olay (önceki ay: 7)                  │
│  • Sipariş hatası 1 (önceki: 9)                    │
│                                                     │
│  DİKKAT NOKTALARI                                   │
│  ──────────────                                     │
│  ⚠ Ankara Oto Market — churn skoru 75 yükselen    │
│  ⚠ PE Granül stok 2 hafta yeterli — PO açıldı     │
│  ⚠ Trabzon bölgesi sipariş %20 düşük               │
│                                                     │
│  MALİ                                               │
│  ────                                               │
│  Operasyonel maliyet: $245 (bütçe $300, %82)       │
│  ROI tahmini: 18x                                  │
│                                                     │
│  SONRAKİ AY ODAKLAR                                 │
│  ──────────────────                                 │
│  • Pilot 5 → 10 bayi yaygınlaştırma                │
│  • Tahmin model v1.4 → v1.5 challenger test        │
│  • Yurt dışı outreach 3 lead → görüşme             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 Çeyreklik yönetim toplantı şablonu

```
1. ÖNCEKİ ÇEYREK ÖZET
   - Hedef vs gerçekleşen
   - Başarılar
   - Eksikler

2. ÜRÜN GELİŞMELERİ
   - Tamamlanan fazlar
   - Yeni özellikler
   - Demo

3. KPI REVIEW
   - 7 kategori detayı
   - Hedef revizyon önerileri

4. RİSK GÜNCELLEMESİ
   - Aktif riskler
   - Yeni riskler
   - Mitigation durumu

5. BÜTÇE DURUMU
   - Operasyonel maliyet trendi
   - Beklenmedik kalemler

6. SONRAKİ ÇEYREK PLANI
   - Faz öncelikleri
   - Personel ihtiyacı
   - Karar bekleyen noktalar

7. AÇIK SORULAR
```

### 4.3 Bayi onboarding kontrol listesi

```
✓ Müşteri kaydı tamam (Paspas'ta `musteriler`)
✓ Portal hesabı oluşturuldu (`portal_kullanicilari`)
✓ Geçici şifre email gönderildi
✓ İskonto + kredi limit + vade tanımlandı
✓ İlk giriş yapıldı (3 gün içinde)
✓ Şifre değiştirildi
✓ Onboarding video izlendi
✓ İlk katalog araması yapıldı
✓ İlk sepet hareketi
✓ İlk sipariş onaylandı
✓ İlk cari sorgu
✓ NPS anket gönderildi (1 hafta sonra)
✓ Saha ekibi pasif takip aktif (4 hafta)
```

## 5. Ek Görseller (Yer Tutucular)

### 5.1 Gerekli görseller

Proje teklifinin HTML/PDF haline getirilirken eklenecek:

1. **Üst düzey mimari diyagramı** (`docs/proje-teklifi/03-mimari-ve-teknoloji.md` içindeki ASCII'den çizim)
2. **7 katmanlı vizyon** (`docs/proje-teklifi/02-cozum-genel-bakis.md`)
3. **11 fazlı zaman çizelgesi** (Gantt görünümü)
4. **Bayi web portal ekran görüntüleri** (mockup) — Faz 6 dashboard, katalog, sepet, cari
5. **Yönetici dashboard ekran görüntüleri** (mockup) — KPI, churn radar, tahmin heatmap
6. **Saha mobil app mockup** — ziyaret formu, ses kaydı UI
7. **Veri akış diyagramı** (kaynaklar → backend → frontend)
8. **KPI dashboard örnek** (gerçek veri ile)
9. **Risk matrisi grafiği** (olasılık × etki)
10. **ROI grafiği** (yatırım vs tasarruf)

### 5.2 Excalidraw kaynak dosyaları

Wireframe ve diyagramlar Excalidraw'da hazırlanır:
- `docs/proje-teklifi/diagrams/` klasöründe `.excalidraw` dosyaları
- Her diyagramın `.png` export'u dokümana eklenir
- Kaynak değişikliği güncellenir

## 6. Bayi Onboarding — Detay Akış

### 6.1 Yönetici tarafı (yeni bayi)

```
Adım 1: Müşteri kaydı kontrolü
  → Paspas /admin/musteriler
  → Mevcut mü? → Evet ise devam, yok ise yeni kayıt

Adım 2: Portal hesabı
  → /admin/bayi-portali/yonetim
  → "Yeni bayi hesabı oluştur"
  → Form doldur: müşteri seç + yetkili bilgisi + iskonto + kredi + vade
  → Sistem: portal_kullanicilari + audit log
  → Sistem: geçici şifre üret + email gönder

Adım 3: Onboarding takip
  → Email gönderildi mi? ✓
  → 24 saat — ilk giriş yapıldı mı?
  → 3 gün — yapılmadıysa hatırlatma email
  → 7 gün — yapılmadıysa telefon görüşmesi

Adım 4: İlk hafta destek
  → Kullanıcı analitik takip
  → "Sepet aktif ama sipariş yok" → proaktif yardım
  → Memnuniyet kontrol (manuel)
```

### 6.2 Bayi tarafı (ilk kullanım)

```
Adım 1: Email aldım
  ↓
Adım 2: Linki tıkla
  ↓
Adım 3: Login (geçici şifre)
  ↓
Adım 4: Şifre değiştir (zorunlu)
  ↓
Adım 5: Dashboard'da yön
  ↓
Adım 6: "Onboarding turu" (3 dakikalık interaktif tur)
  - Ana menü
  - Katalog araması
  - Sepete ekleme
  - Cari hesap görünümü
  - Bildirim merkezi
  ↓
Adım 7: İlk gerçek arama
  - Marka → Model → Yıl → Uyumlu paspas
  ↓
Adım 8: İlk sepet
  ↓
Adım 9: İlk sipariş onayı
  ↓
Adım 10: Email + portal bildirimi
```

## 7. Eğitim Materyalleri Listesi

### 7.1 Bayi için
- Video: "MatPortal'a Hoş Geldin" (3 dk, Loom kayıt)
- Video: "Sipariş nasıl verilir?" (5 dk)
- Video: "Cari hesap nasıl izlenir?" (3 dk)
- PDF: Sıkça Sorulan Sorular (2 sayfa)
- PDF: Hangi paspas hangi araca uyar? (genişleyen referans)

### 7.2 Yönetici için
- Canlı eğitim: 2 saat (sistem genel turu)
- Canlı eğitim: 1 saat (tahmin motoru ve raporlar)
- Canlı eğitim: 1 saat (churn radarı + aksiyon)
- PDF: Yönetici Operasyonel Runbook (10 sayfa)

### 7.3 Saha ekibi için
- Canlı eğitim: 1 saat (mobil app + ziyaret kaydı)
- Video: "Ses kaydı nasıl alınır?" (2 dk)
- PDF: Saha Operasyon Rehberi (5 sayfa)

### 7.4 Teknik destek
- Internal: API dokümantasyonu (Swagger)
- Internal: Architecture decision records (ADR)
- Internal: Operational runbook (DevOps)

## 8. Geri Besleme ve Sürekli İyileştirme

### 8.1 Kanal listesi

| Kanal | Kullanıcı | Sıklık |
|-------|-----------|--------|
| NPS anketi | Bayi | Çeyreklik |
| Yönetici görüşme | Promats yönetimi | Aylık |
| Saha ekibi feedback | Mert + diğer saha | Haftalık |
| Bug raporu | Tüm | Anlık |
| Feature request | Tüm | Anlık (backlog'a) |
| Pen test | Dış güvenlik firması | Yıllık |

### 8.2 Feedback → aksiyon döngüsü

```
1. Feedback toplama (sürekli)
2. Triage haftalık (Tech Lead + Sales lead)
3. Kategorize: bug / iyileştirme / yeni özellik
4. Önceliklendirme: matrix (etki × kolaylık)
5. Backlog'a ekle
6. Sprint planlamaya dahil
7. Geri bildirimi yapan kişiye dönüş
```

## 9. Versiyon Geçmişi

```
v1.0 (2026-05-01) — İlk taslak (B2B portal odaklı)
v1.1 (2026-05-01) — 11 fazlı tam vizyona genişletildi
                  - Doc 00, 02, 05 yeniden yazıldı
                  - Doc 01, 03, 04, 06, 07, 08, 09, 10, 11 yeni eklendi
                  - tartisma/ klasöründe Doc 12-15 derinlemesine eklendi
```

## 10. İletişim & Destek

```
Geliştirici:        Orhan Güzel
Email:             orhanguzell@gmail.com
GitHub:            (özel repo, Promats erişim)
Acil durum:        (telefon — sözleşme ile)

Promats temsilci:  [Yönetici adı]
Email:             [Promats KVKK email]
Telefon:           [Promats genel]
```

## 11. Lisans ve Fikri Mülkiyet

```
KOD:
  - matportal-core kod tabanı Geliştirici (Orhan Güzel) sahipliğindedir
  - Promats için kullanım hakkı: süresiz, devredilemez, münhasır olmayan
  - Promats, kodu değiştiremez veya başka tarafa lisanslayamaz
  - Geliştirici, aynı kodu başka müşterilere de adapte edebilir
    (Promats'ın özel müşteri verisi gizli kalır)

VERİ:
  - Promats verileri Promats sahipliğindedir
  - Geliştirici sadece sözleşme süresi boyunca işler
  - Sözleşme bitiminde verisi tam export edilir, sistemden silinir

MARKA:
  - "MatPortal" isim hakkı Geliştirici tarafından kullanılır
  - Promats için "Paspas Bayi Portalı" markası kullanılır
  - Promats marka kimliği değişmeden kalır
```

> **Not:** Yukarıdaki lisans şablonu **çalışma taslağıdır**. Avukat onayından geçirilmeli, Promats ile sözleşmeleştirilmelidir.
