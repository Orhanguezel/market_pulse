# 05 — Fonksiyonel Kapsam (Özellik Listesi)

Bu doküman MatPortal'ın **11 faza dağılmış** tüm özelliklerini listeler. Her özellik bir satırda — fazı, modülü, MVP/Genişleme/Vizyon kategorisi belli.

## Toplam Özet

| Faz | Modül | MVP | Genişleme | Vizyon | Toplam |
|-----|-------|-----|-----------|--------|--------|
| 0 | Paspas tamamlanma | 8 | 4 | — | 12 |
| 1 | Talep toplama altyapısı | 7 | 4 | 2 | 13 |
| 2 | Sipariş tahmin motoru | 12 | 6 | 4 | 22 |
| 3 | Müşteri keşif motoru | 8 | 5 | 3 | 16 |
| 4 | Stok & tedarik otomasyonu | 9 | 5 | 3 | 17 |
| 5 | Bayi scraping & churn | 10 | 6 | 4 | 20 |
| 6 | B2B Bayi Portalı | 53 | 23 | — | 76 |
| 7 | MLOps & eğitilebilir modeller | 10 | 5 | 4 | 19 |
| 8 | Konversasyonel katman | 7 | 5 | 4 | 16 |
| 9 | Mobil & saha CRM | 9 | 6 | 4 | 19 |
| 10+ | Genişleme (10 sinyal) | — | — | 30 | 30 |
| **Toplam** | | **133** | **69** | **58** | **260** |

> "MVP" = ilk teslim. "Genişleme" = 3-12 ay sonra. "Vizyon" = 1+ yıl.

---

## Faz 0 — Paspas Tamamlanma (12 özellik)

### MVP (8)

| # | Özellik | Açıklama |
|---|---------|----------|
| 0.1 | Mevcut 14 modülün açık edge case'leri | Sevkiyat, üretim emri, vardiya dipnotları |
| 0.2 | Bilinen kritik bug listesi → 0 | Bug tracker'da open=0 hedefi |
| 0.3 | Test coverage genişlemesi | Backend ≥ 70%, kritik akışlar 90%+ |
| 0.4 | Performance baseline ölçümü | API p50/p95/p99 latency, DB query slow log |
| 0.5 | Loglama standartlaştırma | Structured JSON, log level yönetimi |
| 0.6 | Hata raporlama | Sentry veya alternatif kurulumu |
| 0.7 | Backup & restore prosedürü | Günlük DB dump, haftalık tam yedek |
| 0.8 | Operasyonel runbook | Acil durum prosedürleri yazılı |

### Genişleme (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 0.9 | Performance optimization | N+1 query'ler, cache layer (Redis) |
| 0.10 | Audit log yaygınlaştırma | Risk 7+ tüm aksiyonlara genişlet |
| 0.11 | Rol tabanlı yetki revizyonu | Mevcut yetki matrisini genişlet |
| 0.12 | Tek tıkla deployment | Docker compose + GitHub Actions |

---

## Faz 1 — Talep Toplama Altyapısı (13 özellik)

### MVP (7)

| # | Özellik | Açıklama |
|---|---------|----------|
| 1.1 | `talep_havuzu` tablosu | bayi/müşteri/iç tüm talepler tek yerde |
| 1.2 | Talep girişi formu | Yönetici manuel: kaynak, içerik, durum |
| 1.3 | LLM yapılandırma | Serbest metin → JSON (`{urun, miktar, vade}`) |
| 1.4 | `/admin/talep-havuzu` kanban | yeni → işleniyor → siparişe → kapanış |
| 1.5 | Müşteri kartına talep geçmişi | Bayi/müşteri 360 derece görünüm |
| 1.6 | Talep → sipariş dönüşümü | Tek tıkla `satis_siparisleri` oluştur |
| 1.7 | Talep kaynağı dağılım raporu | WhatsApp/telefon/email/portal/manuel |

### Genişleme (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 1.8 | WhatsApp talep alma (manuel kopyala) | WA mesajı yapıştır, LLM yapılandırsın |
| 1.9 | Email otomatik parsing | IMAP entegrasyonu, gelen email → talep |
| 1.10 | Sesli talep (Whisper) | Telefon görüşme ses kaydı → metin → JSON |
| 1.11 | Talep önceliklendirme (AI) | Aciliyet + müşteri değeri + ürün kritikliği skoru |

### Vizyon (2)

| # | Özellik | Açıklama |
|---|---------|----------|
| 1.12 | WhatsApp Business API doğrudan webhook | Resmi entegrasyon |
| 1.13 | Talep → tahmin motoruna besleme | Faz 2 modeli için ek özellik |

---

## Faz 2 — Sipariş Tahmin Motoru (22 özellik)

### MVP (12)

| # | Özellik | Açıklama |
|---|---------|----------|
| 2.1 | `tahmin_calistirma` tablosu | Bayi-ürün × dönem × tahmin sonucu |
| 2.2 | `tahmin_modelleri` tablosu | Algoritma versiyon ve metadata |
| 2.3 | `tahmin_dogruluk` tablosu | Gerçekleşen vs tahmin karşılaştırma |
| 2.4 | Naive baseline modeli | Fallback + iyilik karşılaştırması |
| 2.5 | Mevsimsel ortalama modeli | Geçen yıl + 2 yıl önce ortalama |
| 2.6 | Lineer regresyon modeli | scikit-learn, açıklanabilir |
| 2.7 | Prophet modeli (varsayılan) | Türk tatil takvimi entegre |
| 2.8 | Algoritma seçim mantığı | Veri yaşına göre otomatik (kademeli) |
| 2.9 | `/admin/tahmin-motoru` UI | Bayi-ürün heatmap, top yükselen/düşen |
| 2.10 | Bayi-detay tahmin grafiği | Tarihsel + 30 gün ileri |
| 2.11 | Açıklanabilirlik — sinyal listesi | Hangi faktör ne kadar etkiledi |
| 2.12 | Manuel re-train butonu | Yönetici tetikleyebilir |

### Genişleme (6)

| # | Özellik | Açıklama |
|---|---------|----------|
| 2.13 | XGBoost modeli (multivariate) | Kur + tatil + kampanya birlikte |
| 2.14 | Champion/challenger seçimi | Otomatik en iyi model |
| 2.15 | Excel upload — geçmiş veri | `siparis_gecmisi_v1.xlsx` şablonu |
| 2.16 | Excel upload kolon mapping | Otomatik tespit + manuel düzeltme |
| 2.17 | Outlier auto-flag | IQR × 3 üstü eğitimden çıkarılır |
| 2.18 | Doğal dil tahmin açıklaması | LLM ile "neden bu tahmin" cümlesi |

### Vizyon (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 2.19 | LSTM / Transformer model | 24+ ay veride çoklu bayi ortak desen |
| 2.20 | Hyperparameter tuning (Optuna) | Aylık otomatik optimizasyon |
| 2.21 | Hava durumu entegrasyonu | OpenWeather geçmiş, sezonsal sektör |
| 2.22 | Kampanya etkisi modelleme | `kampanyalar` tablosu → feature |

> **Detay:** [`tartisma/12-tahmin-motoru-derinlemesine.md`](../tartisma/12-tahmin-motoru-derinlemesine.md)

---

## Faz 3 — Müşteri Keşif Motoru (16 özellik)

### MVP (8)

| # | Özellik | Açıklama |
|---|---------|----------|
| 3.1 | `lead_havuzu` tablosu | Aday firma, iletişim, sektör, ölçek, skor |
| 3.2 | `lead_etkilesim` tablosu | Temas geçmişi (tarih, kim, sonuç) |
| 3.3 | TOBB veri çekme | TOBB üye listesi parser (resmi public data) |
| 3.4 | sanayim.net entegrasyonu | Sektör/şehir filtreyle firma listesi |
| 3.5 | Google Places API entegrasyonu | TR sektör + şehir → işletme listesi |
| 3.6 | Mevcut bayi profil benzerlik skoru | ML — yeni leadi mevcut bayiyle karşılaştır |
| 3.7 | `/admin/lead-pipeline` kanban | yeni → temas → görüşme → kazanıldı/kayıp |
| 3.8 | Manuel lead girişi formu | Yöneticinin elle eklediği aday |

### Genişleme (5)

| # | Özellik | Açıklama |
|---|---------|----------|
| 3.9 | Apollo.io API (yurt dışı) | Free tier başlangıç, ihtiyaç doğunca paid |
| 3.10 | Hunter.io / Snov.io email bulma | Domain → çalışan kurumsal email |
| 3.11 | Outreach taslak üretimi (LLM) | Bayi profili + sektör → kişiselleştirilmiş email |
| 3.12 | Lead → bayi dönüşüm raporu | Pipeline conversion oranı |
| 3.13 | OpenStreetMap Overpass yedek | Google Places limit aşıldığında |

### Vizyon (3)

| # | Özellik | Açıklama |
|---|---------|----------|
| 3.14 | Sequence email otomasyonu | Brevo/Mailgun ile çoklu adımlı follow-up |
| 3.15 | LinkedIn Sales Navigator (manuel) | Hunter üzerinden dolaylı erişim |
| 3.16 | Hibrit CRM (Apollo + dahili) | Doc 10 — D opsiyonu uygulaması |

> **Detay:** [`tartisma/02-musteri-kesif.md`](../tartisma/02-musteri-kesif.md), [`tartisma/10-crm-karari.md`](../tartisma/10-crm-karari.md)

---

## Faz 4 — Stok & Tedarik Otomasyonu (17 özellik)

### MVP (9)

| # | Özellik | Açıklama |
|---|---------|----------|
| 4.1 | Tüketim hızı analizi | Her ürün/hammadde için aylık/haftalık |
| 4.2 | Reçete bazlı ham madde projeksiyonu | Üretim emri × reçete = hammadde |
| 4.3 | Reorder point (ROP) hesabı | Lead time × ortalama tüketim + safety stock |
| 4.4 | "Bu hafta ne almalıyız" raporu | Yöneticiye Pazartesi sabah otomatik |
| 4.5 | Tedarikçi performans skoru | Zamanında teslim, kalite, fiyat ağırlıklı |
| 4.6 | Tedarikçi karşılaştırma tablosu | Aynı malzeme için alternatif tedarikçiler |
| 4.7 | Otomatik PO taslağı | Manuel onayla tedarikçiye email |
| 4.8 | Stok-out anomali uyarısı | Beklenmedik tükenme tespiti |
| 4.9 | Aşırı stok uyarısı | Tüketim hızının çok üzerindeki birikim |

### Genişleme (5)

| # | Özellik | Açıklama |
|---|---------|----------|
| 4.10 | Tedarikçi keşif (yeni alternatif arama) | Web crawler + sektör portalları |
| 4.11 | Fiyat trend analizi | Hammadde fiyat geçmişi, tahmin |
| 4.12 | Otomatik teklif isteme | Multi-tedarikçi RFQ akışı |
| 4.13 | Stok rezervasyon önceliği | Premium müşteri/sipariş için |
| 4.14 | Multi-depo stok | Birden fazla lokasyon |

### Vizyon (3)

| # | Özellik | Açıklama |
|---|---------|----------|
| 4.15 | Just-in-time tedarik | Tahmin × lead time eşleşmesi |
| 4.16 | Fason iş yönü | Kapasite aşıldığında dış üretim önerisi |
| 4.17 | Sürdürülebilir tedarikçi skoru | Karbon ayakizi, etik kriterler |

> **Detay:** [`tartisma/03-tedarikci-yonetimi.md`](../tartisma/03-tedarikci-yonetimi.md), [`tartisma/04-stok-tahmin-otomasyonu.md`](../tartisma/04-stok-tahmin-otomasyonu.md)

---

## Faz 5 — Bayi Scraping & Churn Radarı (20 özellik)

### MVP (10)

| # | Özellik | Açıklama |
|---|---------|----------|
| 5.1 | `web_kazima_hedefleri` tablosu | URL, tip, sıklık, öncelik |
| 5.2 | `web_kazima_kayitlari` tablosu | HTTP yanıt, S3 snapshot, parse durumu |
| 5.3 | `bayi_sinyalleri` tablosu | Tip, değer, kanıt, güven, puan |
| 5.4 | `churn_skor_gecmisi` tablosu | Tarih × bayi × skor + risk |
| 5.5 | Crawlee + Playwright crawler | robots.txt + rate limit + retry |
| 5.6 | HTML diff → sinyal çıkarımı | Önceki vs şu anki, LLM yardımcı |
| 5.7 | 11 sinyal türü tespiti | Yeni rakip ürün, post pasifliği vb. |
| 5.8 | Kural-bazlı churn skoru | Sinyal × ağırlık → 0-100 |
| 5.9 | `/admin/bayi-radari` heatmap | Tüm bayi × son 12 hafta |
| 5.10 | Acil müdahale top listesi | Kritik (70+) skor → email + dashboard |

### Genişleme (6)

| # | Özellik | Açıklama |
|---|---------|----------|
| 5.11 | XGBoost churn ML modeli | 30/60/90 gün churn olasılık |
| 5.12 | Apify Instagram/Facebook | Sosyal medya pasiflik tespiti |
| 5.13 | Google Maps yorum izleme | Negatif yorum oranı sentiment |
| 5.14 | Saha aksiyon log | Önce/sonra ölçümleme |
| 5.15 | LLM aksiyon önerisi | "Bu bayiye ne yapılmalı?" 3 alternatif |
| 5.16 | Manuel sinyal girişi (saha) | Çağrı merkezi, "kapalı/cevap yok" |

### Vizyon (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 5.17 | Vergi mükellefi sorgusu (GIB API) | Bayi kapalı mı kontrol |
| 5.18 | Türkpatent yeni patent başvuruları | Sektör inovasyon |
| 5.19 | Sentiment analizi (genelleştirilmiş) | Tüm metin sinyalleri |
| 5.20 | Federated churn modeli | Çok müşterili meta-model |

> **Detay:** [`tartisma/13-bayi-scraping-churn.md`](../tartisma/13-bayi-scraping-churn.md)

---

## Faz 6 — B2B Bayi Portalı (76 özellik)

### Modül 6.1 — Bayi Kimlik & Hesap

#### MVP (8)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.1.1 | Email + şifre login | bcrypt + JWT cookie, mevcut Paspas auth |
| 6.1.2 | İlk girişte zorunlu şifre değişikliği | `must_change_pw` flag |
| 6.1.3 | Şifre sıfırlama (email link) | 24 saatlik token |
| 6.1.4 | Bayi profil görüntüleme | Salt okunur — firma adı, adres, vergi no |
| 6.1.5 | Birden fazla kullanıcı per bayi | Müdür/Operatör/Görüntüleyici rolleri |
| 6.1.6 | Bayi-içi yetki sistemi | Rol bazlı erişim |
| 6.1.7 | Audit log (login, sepet, sipariş) | IP + tarayıcı kayıt |
| 6.1.8 | Aktif oturum yönetimi | "Diğer cihazlardan çıkış yap" |

#### Genişleme (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.1.9 | İki faktörlü kimlik (2FA) | SMS/email kod |
| 6.1.10 | Tek tıkla giriş (magic link) | E-posta tabanlı |
| 6.1.11 | Bayilik sözleşmesi e-imza | Yasal dokümanlama |
| 6.1.12 | KVKK aydınlatma + onay akışı | Yasal uyum |

### Modül 6.2 — Katalog & Araç Eşleştirme

#### MVP (10)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.2.1 | Marka dropdown | `arac_modelleri.marka` distinct |
| 6.2.2 | Model dropdown (markaya bağlı) | Cascading |
| 6.2.3 | Yıl dropdown | Yıl aralığı |
| 6.2.4 | Gövde tipi filtresi | Sedan/Hatchback/Wagon/SUV |
| 6.2.5 | Uyumlu paspas listesi | `urun_arac_uyumlulugu` join |
| 6.2.6 | Bayi iskontosuyla fiyat | Server-side hesaplama |
| 6.2.7 | Stok durumu görüntüleme | Var/Az kaldı/Stokta yok |
| 6.2.8 | Ürün detay sayfası | Görsel, açıklama, teknik |
| 6.2.9 | SKU ile arama | Hızlı arama bar |
| 6.2.10 | İlk 30-40 araç modeli verisi | Manuel + AI destekli yükleme |

#### Genişleme (6)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.2.11 | Genişletilmiş araç verisi (200+) | Long-tail modeller |
| 6.2.12 | Ürün karşılaştırma (max 4) | Yan yana |
| 6.2.13 | Favoriler / "İlgilendiklerim" | Kullanıcı listesi |
| 6.2.14 | Cross-sell önerileri (AI) | "Bu ürüne bakanlar ayrıca aldı" |
| 6.2.15 | Excel/CSV katalog dışa aktarma | Bayi kendi sistemi için |
| 6.2.16 | Toplu sipariş şablonu yükleme (Excel) | Çoklu kalem hızlı sipariş |

### Modül 6.3 — Sipariş & Sepet

#### MVP (9)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.3.1 | Sepete ekle | Ürün + miktar + araç bilgisi |
| 6.3.2 | Sepet görüntüleme + güncelleme | Miktar, sil |
| 6.3.3 | Sepet kalıcılığı | Bayi tekrar girince bekler |
| 6.3.4 | Checkout 1 — özet | Toplam, iskonto, vergi |
| 6.3.5 | Checkout 2 — adres + ödeme | Vadeli/havale/kart |
| 6.3.6 | Checkout 3 — onay | Son özet, "siparişi onayla" |
| 6.3.7 | Kredi limit kontrolü | Vadeli aşılırsa engellenir |
| 6.3.8 | Stok kontrol + transaction | `repoCreate` atomik |
| 6.3.9 | Sipariş onay maili | Email + portal bildirim |

#### Genişleme (5)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.3.10 | Birden fazla aktif sepet | Mağaza/şube ayrı |
| 6.3.11 | Sipariş notu (yöneticiye mesaj) | Serbest metin |
| 6.3.12 | Tahmini teslim tarihi | Üretim kapasitesinden |
| 6.3.13 | Acele sipariş seçeneği | Ekstra ücretle |
| 6.3.14 | Tekrar eden sipariş | Aylık/haftalık otomatik |

### Modül 6.4 — Cari Hesap & Ödeme

#### MVP (5)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.4.1 | Dashboard'da cari özeti | Bakiye + son ödeme |
| 6.4.2 | Vadeli faturalar listesi | Tarih, tutar, kalan |
| 6.4.3 | Ekstre görüntüleme | Tarih aralığı seç |
| 6.4.4 | PDF fatura indirme | ERP'den serve |
| 6.4.5 | Yaklaşan ödemeler widget | 30 gün ileri |

#### Genişleme (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.4.6 | Online ödeme (Iyzipay/Stripe) | Kart/havale/dijital |
| 6.4.7 | Bakiye kapatıldıkça bildirim | Otomatik |
| 6.4.8 | Yıllık hesap durumu PDF | Yöneticiye + bayiye |
| 6.4.9 | Cari mutabakat formu | İmzalı PDF |

### Modül 6.5 — Sipariş Takibi & Kargo

#### MVP (6)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.5.1 | Sipariş listesi | Tarih, durum, tutar |
| 6.5.2 | Sipariş detay sayfası | Kalemler, fatura, sevk |
| 6.5.3 | Statü zinciri | Onaylandı→Üretimde→Kargoda→Teslim |
| 6.5.4 | Tahmini teslim tarihi | Üretim planından |
| 6.5.5 | Yeniden sipariş et (tek tık) | Geçmişi sepete kopyala |
| 6.5.6 | Sipariş arama / filtreleme | Tarih, durum, ürün |

#### Genişleme (3)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.5.7 | Kargo entegrasyonu | Yurtiçi/Aras/MNG API gerçek zamanlı |
| 6.5.8 | Teslim onayı | Bayi imzasıyla doğrulama |
| 6.5.9 | Gecikme uyarısı + tazminat hesabı | Otomatik |

### Modül 6.6 — Numune & İade

#### Genişleme (5)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.6.1 | Numune talep formu | Ürün + adres + not |
| 6.6.2 | Yöneticiden onay akışı | Onay → ücretsiz örnek |
| 6.6.3 | İade bildir formu | Sipariş + sebep + dosya |
| 6.6.4 | İade onay → cari düşüm + iade etiketi | Otomatik |
| 6.6.5 | İade geçmişi | Bayi görür |

### Modül 6.7 — Bildirim & Mesajlaşma (Not Defteri)

#### MVP (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.7.1 | Sipariş alındı mail + push | Otomatik |
| 6.7.2 | Üretime aktarıldı mail + push | Otomatik |
| 6.7.3 | Kargoda mail + push | Kargo takip linki |
| 6.7.4 | Bildirim merkezi | Portal içi geçmiş |

#### Genişleme (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.7.5 | WhatsApp Business API | Resmi entegrasyon |
| 6.7.6 | Push bildirim (PWA) | Mobil destekli |
| 6.7.7 | Not defteri (yönetici-bayi mesaj) | Thread, dosya ek, okundu |
| 6.7.8 | Toplu duyuru | Yönetici → tüm bayilere |

### Modül 6.8 — Eğitim & Yardım

#### Genişleme (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.8.1 | SSS sayfası | Kategorili, aranabilir |
| 6.8.2 | Video eğitim kütüphanesi | Portal kullanım |
| 6.8.3 | Canlı destek talep | Yönetici thread'ine |
| 6.8.4 | "Hangi paspas hangi araca" PDF | Otomatik üretim |

### Modül 6.9 — Bayi Yönetimi (Yönetici)

#### MVP (7)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.9.1 | Bayi listesi sayfası | Filtre + arama + sıralama |
| 6.9.2 | Yeni bayi kaydı | Mevcut müşteriden + portal user |
| 6.9.3 | Bayi pasifleştirme | Erişim kapatma |
| 6.9.4 | İskonto güncelleme | Toplu/tek |
| 6.9.5 | Kredi limiti tanımlama | Aşılırsa portalda uyarı |
| 6.9.6 | Bayi audit log görünümü | Tek bayi tüm aktivite |
| 6.9.7 | Şifre sıfırlama (yöneticiden) | Acil durum |

#### Genişleme (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.9.8 | Toplu bayi işlemleri (Excel) | Çoklu güncelleme |
| 6.9.9 | Bayi performans skoru | Ciro + sıklık + ödeme disiplini |
| 6.9.10 | Bayi segmentasyon otomasyonu | Davranış kümeleri |
| 6.9.11 | Bayi davranış zaman çizelgesi | Tek görünüm |

### Modül 6.10 — Portal Raporları (Yönetici)

#### MVP (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.10.1 | Günlük/haftalık sipariş hacmi | Bar chart |
| 6.10.2 | Bayi bazında sipariş listesi | Sıralı tablo |
| 6.10.3 | Top 10 ürün | Hacim + adet |
| 6.10.4 | Aktif/pasif bayi sayısı | Son 30 gün |

#### Genişleme (8)

| # | Özellik | Açıklama |
|---|---------|----------|
| 6.10.5 | En çok aranan araç (yeni ürün sinyali) | Filtreden okur |
| 6.10.6 | Sepet terk analizi | Terk + sebep tahmini |
| 6.10.7 | Bayi kayıp risk uyarısı | 60 gün siparişsiz |
| 6.10.8 | Coğrafi pazar haritası | Şehir dağılımı |
| 6.10.9 | Kampanya etkinlik raporu | Öncesi/sonrası |
| 6.10.10 | Saatlik portal kullanım | Trafik grafiği |
| 6.10.11 | Cohort analizi | Yeni bayi takip |
| 6.10.12 | Excel/PDF özelleştirilebilir rapor | Filtreli dışa aktarma |

> **Detay:** [`tartisma/11-b2b-bayi-portali.md`](../tartisma/11-b2b-bayi-portali.md)

---

## Faz 7 — MLOps & Eğitilebilir Modeller (19 özellik)

### MVP (10)

| # | Özellik | Açıklama |
|---|---------|----------|
| 7.1 | Python FastAPI ML servis | Bun → HTTP, ayrı container |
| 7.2 | MLflow kurulumu | Deneme + artifact tracking |
| 7.3 | S3 model storage | Versiyon arşivi |
| 7.4 | `model_versiyonlari` tablosu | Versiyon, metrik, durum |
| 7.5 | `/admin/ml-laboratuvari` UI | Aktif modeller, eğitim kuyruğu |
| 7.6 | Model detay sayfası | Eğitim geçmişi, metrik trend |
| 7.7 | Excel upload UX | Dosya seç + preview + onay |
| 7.8 | Kolon eşleştirme arayüzü | Otomatik tespit + manuel |
| 7.9 | Hata düzeltme inline | Hatalı satırı düzelt |
| 7.10 | Yeniden eğitim butonu | Manuel tetikleme |

### Genişleme (5)

| # | Özellik | Açıklama |
|---|---------|----------|
| 7.11 | Champion/challenger A/B test | %5 trafiğe challenger |
| 7.12 | İstatistiksel anlamlılık testi | t-test, p < 0.05 |
| 7.13 | Multivariate feature pipeline | Kur+tatil+hava+kampanya |
| 7.14 | SHAP feature importance UI | Görsel etki tablosu |
| 7.15 | Auto-rollback (MAPE > %50) | Eski stabile dön |

### Vizyon (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 7.16 | Active learning calibration | Yönetici düzeltme → calibration layer |
| 7.17 | Hyperparameter tuning otomatik | Optuna entegrasyonu |
| 7.18 | Multi-deployment hazırlık | Env-based config |
| 7.19 | Federated learning iskelet | Anonim ağırlık paylaşımı |

> **Detay:** [`tartisma/14-egitilebilir-modeller-mlops.md`](../tartisma/14-egitilebilir-modeller-mlops.md)

---

## Faz 8 — Konversasyonel Katman (16 özellik)

### MVP (7)

| # | Özellik | Açıklama |
|---|---------|----------|
| 8.1 | Yönetici sohbet UI | Doğal dilde istek + AI yanıt |
| 8.2 | LLM provider abstraction | Claude/OpenAI/Groq seçimi |
| 8.3 | Niyet (intent) çıkarımı | "5000 paspas siyah" → action |
| 8.4 | Slot-filling | Eksik parametre sorma |
| 8.5 | Risk skoru hesabı | Geri al × tutar × dış görünüm × kayıt |
| 8.6 | Onay matrisi (risk × güven × tutar) | Otomatik mi onay mı |
| 8.7 | Audit log + rollback | Her aksiyon için |

### Genişleme (5)

| # | Özellik | Açıklama |
|---|---------|----------|
| 8.8 | Kill-switch (global/aksiyon/provider) | Tek tıkla kapatma |
| 8.9 | Sessiz onay penceresi | 12-24 saat tepki yoksa otomatik |
| 8.10 | LLM fallback mekanizması | Pahalı patladıysa ucuza düş |
| 8.11 | Reddedilen önerilerden öğrenme | Few-shot prompt güncelleme |
| 8.12 | Çoklu intent tek mesajda | "X aldır + Y kontrol et + Z bildir" |

### Vizyon (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 8.13 | Bayi-tarafı sohbet (opsiyonel) | Bayi WhatsApp/portaldan sohbet |
| 8.14 | Sesli giriş (Whisper STT) | Mobil mikrofondan |
| 8.15 | Ses çıkışı (TTS) | Operatör ekranı sesli yanıt |
| 8.16 | Çoklu dil sohbet | İngilizce/Almanca |

> **Detay:** [`tartisma/07-konversasyonel-katman.md`](../tartisma/07-konversasyonel-katman.md), [`tartisma/09-otomasyon-esikleri.md`](../tartisma/09-otomasyon-esikleri.md)

---

## Faz 9 — Mobil & Saha CRM (19 özellik)

### MVP (9)

| # | Özellik | Açıklama |
|---|---------|----------|
| 9.1 | Saha satış mobil app (Flutter) | iOS + Android |
| 9.2 | Bayi ziyaret kaydı | Tarih, lokasyon, not |
| 9.3 | Sesli not (Whisper API) | Konuşmadan metin |
| 9.4 | Foto/video yükleme | Ziyaret kanıtı |
| 9.5 | Offline-first sipariş | Bağlantı dönünce senkron |
| 9.6 | Push bildirim altyapısı (FCM) | Kritik uyarılar |
| 9.7 | Bayi mobil PWA | Web portal'ın mobil versiyonu |
| 9.8 | Operatör mobil polish | Mevcut uygulama tamamlama |
| 9.9 | Push bildirim teslim raporu | Açma/tıklama metrikleri |

### Genişleme (6)

| # | Özellik | Açıklama |
|---|---------|----------|
| 9.10 | Bayi native mobil (Flutter) | PWA yetersizse |
| 9.11 | Saha ziyaret → churn sinyali | Otomatik feed-in |
| 9.12 | LLM ziyaret özeti | "Bu ziyarette kritik bilgi var mı?" |
| 9.13 | Aksiyon takibi (next steps + due) | Otomatik reminder |
| 9.14 | QR kod ile sipariş | Ürün koduna fotoğraf |
| 9.15 | Saha ekibi performans dashboard | Ziyaret sayısı, dönüşüm |

### Vizyon (4)

| # | Özellik | Açıklama |
|---|---------|----------|
| 9.16 | AR ürün önizleme (3D) | Paspas aracın içinde nasıl |
| 9.17 | Mobil sohbet entegrasyonu | Faz 8 ile birleşik |
| 9.18 | Müşteri B2C mobil app | Son tüketici uygulaması |
| 9.19 | Saha rotalama (mini lojistik) | Günlük ziyaret rotası optimize |

---

## Faz 10+ — Genişleme Modülleri (30 özellik)

### Sinyal #1 — Rakip & Pazar İstihbaratı (4)

| # | Özellik |
|---|---------|
| 10.1.1 | Rakip web tarama altyapısı (mevcut Faz 5 reuse) |
| 10.1.2 | Yeni ürün/fiyat değişikliği tespiti |
| 10.1.3 | Kamu İhale Kurumu kazanan/kaybeden analiz |
| 10.1.4 | Türkpatent yeni başvuru takibi |

### Sinyal #2 — Müşteri (B2C) Churn (3)

| # | Özellik |
|---|---------|
| 10.2.1 | B2C müşteri sipariş aralığı analizi |
| 10.2.2 | Survival analysis (Kaplan-Meier) |
| 10.2.3 | Otomatik retention email (eşik üstü) |

### Sinyal #3 — Fiyat Optimizasyonu (3)

| # | Özellik |
|---|---------|
| 10.3.1 | Bayi-spesifik iskonto önerisi (RL bandit) |
| 10.3.2 | Liste fiyatı elastikiyeti analizi |
| 10.3.3 | Rakip fiyat + maliyet + marj optimizasyonu |

### Sinyal #4 — AI Belge İşleme (3)

| # | Özellik |
|---|---------|
| 10.4.1 | OCR (Tesseract / Google Vision) |
| 10.4.2 | LLM JSON çıkarımı (fatura/PO/irsaliye) |
| 10.4.3 | İnsan onay kuyruğu (eşik altı) |

### Sinyal #5 — Lojistik & Rota (3)

| # | Özellik |
|---|---------|
| 10.5.1 | OR-Tools VRP solver |
| 10.5.2 | Trafik + kapasite + zaman penceresi |
| 10.5.3 | Günlük sevkiyat plan haritası |

### Sinyal #7 — Dış Veri / Sektör (3)

| # | Özellik |
|---|---------|
| 10.7.1 | TÜİK / TCMB / TOBB veri pipeline |
| 10.7.2 | Aylık "sektör nabzı" raporu |
| 10.7.3 | Tahmin motoruna sektör endeksi feature |

### Sinyal #8 — API Entegrasyonları (8)

| # | Özellik |
|---|---------|
| 10.8.1 | e-Fatura (Logo/Mikro/GİB) |
| 10.8.2 | e-Arşiv |
| 10.8.3 | Banka mutabakat API |
| 10.8.4 | Kargo API (Aras/Yurtiçi/MNG/PTT) |
| 10.8.5 | Trendyol/Hepsiburada/N11 ürün senk |
| 10.8.6 | WhatsApp Business doğrudan |
| 10.8.7 | SMS Gateway (Netgsm/İletimerkezi) |
| 10.8.8 | Logo/Mikro muhasebe senk |

### Sinyal #9 — Field CRM (3)

| # | Özellik |
|---|---------|
| 10.9.1 | Detaylı saha ziyaret formu |
| 10.9.2 | Hashtag / sektör trendi feed-in |
| 10.9.3 | Saha ekibi koçluk dashboard |

### Sinyal #10 — Sürdürülebilirlik (3)

| # | Özellik |
|---|---------|
| 10.10.1 | LCA hesaplama altyapısı |
| 10.10.2 | Ürün başına karbon raporu (PDF) |
| 10.10.3 | CBAM uyumlu müşteri raporu |

> **Detay:** [`tartisma/15-genisletme-sinyalleri.md`](../tartisma/15-genisletme-sinyalleri.md)

---

## Teslimat Sırası — Hafta-Hafta Özeti

```
Hafta 1-4    → Faz 0 (Paspas tamamlanma)
Hafta 5-8    → Faz 1 (Talep havuzu)
Hafta 9-16   → Faz 2 (Tahmin motoru)
Hafta 17-22  → Faz 3 (Müşteri keşif) + Faz 4 (Stok) [paralel]
Hafta 23-30  → Faz 5 (Bayi scraping & churn)
Hafta 31-38  → Faz 6 (Bayi Portalı MVP)
Hafta 39-46  → Faz 7 (MLOps)
Hafta 47-52  → Faz 8 (Konversasyonel)
Hafta 53-60  → Faz 9 (Mobil & saha)
Hafta 61+    → Faz 10+ (genişleme — Promats yönetimi ile sıralı)
```

> Ana iskelet (Faz 0-9): ~60 hafta (~14 ay).
> Faz 10+ ihtiyaca göre paralel veya sıralı.

## Açık Tartışma Noktaları (Fonksiyonel)

1. **Faz 6 öne çekilsin mi?** Bayi portalı bayinin en hızlı hissedeceği değer. Faz 0+6 önce, Faz 1-5 paralel olabilir mi?
2. **Yetki sistemi:** Bayi içi rol (admin/operatör/görüntüleyici) MVP'de mi v2'de mi?
3. **WhatsApp Business:** Hesap onay süreci 2-3 ay; MVP'de mi v2'de mi?
4. **Mobil:** PWA yeter mi (Faz 9.7), native şart mı (Faz 9.10)?
5. **e-Fatura:** Faz 10.8.1 öne çekilebilir mi (yasal zorunluluk)?
6. **Çoklu dil:** v3'te mi (Faz 9 sonrası), önce mi?
7. **Online ödeme:** Iyzipay entegrasyonu MVP'de mi (6.4.6)?
8. **Faz 8 (sohbet) bayi tarafı:** ilk yıl yönetici-only mi?
9. **Faz 10 önceliklendirme:** AI belge işleme mi (Sinyal #4) önce, yoksa rakip istihbaratı mı (Sinyal #1)?
10. **Sürdürülebilirlik (Sinyal #10):** CBAM 2026 yürürlükte — şimdiden başlamak gerekir mi?
