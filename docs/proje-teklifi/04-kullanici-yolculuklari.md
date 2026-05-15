# 04 — Kullanıcı Yolculukları

Bu doküman MatPortal'ın **gerçek kullanıcı senaryolarını** uçtan uca anlatır. Hangi kullanıcı, hangi ekrana, hangi sıra ile gider; sistem ne yapar, ne göstermez. Wireframe yerine **akış metni + ekran ekran karar noktaları** kullanılır.

## Kullanıcı Tipleri

| Tip | Rol | Ana modüller |
|-----|-----|--------------|
| **B-1** | Bayi Admin (yetkili) | Faz 6 (tümü) |
| **B-2** | Bayi Operator | Faz 6 (sınırlı — sipariş ver) |
| **B-3** | Bayi Görüntüleyici | Faz 6 (read-only) |
| **Y-1** | Yönetici (sistem admin) | Hepsi |
| **Y-2** | Satış sorumlusu | Faz 1, 3, 5, 6 (yönetim) |
| **Y-3** | Üretim planlama | Faz 2, 4 |
| **Y-4** | Saha satış elemanı | Faz 9 (mobil) + Faz 5 (radar) + Faz 3 (lead) |
| **Y-5** | Muhasebeci | Paspas mevcut + Faz 6 cari onay |

---

## Yolculuk #1 — Bayi: İlk Sipariş Verme (B-1)

**Aktör:** Bayi admin Mehmet — İstanbul Oto Aksesuar
**Senaryo:** Mehmet portal'ı ilk kez kullanıyor, Toyota Corolla 2018 paspasları için sipariş verecek.

### Adım 1 — Davet email'i

```
[Mehmet'in inbox'ı]
Konu: Promats Bayi Portalı — Erişim Bilgileriniz

Sayın Mehmet Bey,
İstanbul Oto Aksesuar adına Promats Bayi Portalı hesabınız oluşturulmuştur.

Giriş için: portal.promats.com.tr
Email: mehmet@iao.com.tr
Geçici şifre: Tx9$kpL2

İlk girişte şifre değişikliği zorunludur.
Sorularınız için yöneticimiz Ali Bey: 0532-XXX-XXXX
```

### Adım 2 — İlk giriş

```
URL: portal.promats.com.tr
─────────────────────────────────
[Ekran: Login formu]
  • Email
  • Şifre
  • [Giriş Yap]
  • [Şifremi unuttum]

→ Mehmet email + geçici şifre girer
→ Sistem doğrulama: ✓
→ "İlk girişte şifre değiştirin" zorunlu yönlendirme
─────────────────────────────────
[Ekran: Şifre değiştirme]
  • Yeni şifre (min 10 karakter, complexity)
  • Yeni şifre tekrar
  • [Değiştir]

→ Audit log: "İlk giriş, şifre değişti"
→ Dashboard'a yönlendirme
```

### Adım 3 — Dashboard

```
[Ekran: Dashboard]
┌─────────────────────────────────────────────────┐
│ Hoş geldiniz, Mehmet                            │
├─────────────────────────────────────────────────┤
│ 💰 Cari bakiye: 0₺                              │
│    Vade: yok (yeni hesap)                       │
├─────────────────────────────────────────────────┤
│ 🚗 Hızlı katalog: [Markaya göre ara →]          │
├─────────────────────────────────────────────────┤
│ 📢 Kampanya: 3D Paspas Yaz İndirimi %15         │
│    [İncele →]                                   │
├─────────────────────────────────────────────────┤
│ 📋 Son siparişler: henüz sipariş yok            │
└─────────────────────────────────────────────────┘
```

### Adım 4 — Katalog ve araç eşleştirme

```
→ Mehmet "Hızlı katalog"a tıklar
─────────────────────────────────
[Ekran: Araç seçimi]
  Marka: [Toyota ▼]
  Model: [Corolla ▼]      ← seçtikten sonra
  Yıl:   [2018 ▼]
  Gövde: [Sedan ▼]

  [Uyumlu ürünleri göster →]

→ Sistem `urun_arac_uyumlulugu` join
→ İlgili paspas listesi gelir
─────────────────────────────────
[Ekran: Uyumlu ürünler]
┌─────────────────────────────────────────────────┐
│ 🔵 Star Siyah Kauçuk Havuz                      │
│    SKU: STR-SIY-COR18  •  Stok: 245 adet ✓      │
│    Fiyat: 285₺ (size özel %5 iskonto)           │
│    [Sepete ekle]  [Detay →]                     │
├─────────────────────────────────────────────────┤
│ 🔵 Premium 3D Mat                               │
│    SKU: P3D-COR18  •  Stok: 18 adet ⚠ az kaldı  │
│    Fiyat: 420₺                                  │
│    [Sepete ekle]  [Detay →]                     │
├─────────────────────────────────────────────────┤
│ 🔵 Halı Klasik                                  │
│    SKU: HAL-COR18  •  Stokta yok ✗              │
│    [Numune talep et]                            │
└─────────────────────────────────────────────────┘
```

### Adım 5 — Sepete ekleme + checkout

```
→ Mehmet "Star Siyah" 50 adet, "Premium 3D" 10 adet sepete ekler
─────────────────────────────────
[Ekran: Sepet]
┌─────────────────────────────────────────────────┐
│ Star Siyah Kauçuk    50 × 285₺ = 14.250₺        │
│ Premium 3D Mat       10 × 420₺ = 4.200₺         │
├─────────────────────────────────────────────────┤
│ Ara toplam:                       18.450₺       │
│ KDV (%20):                         3.690₺       │
│ Genel toplam:                     22.140₺       │
├─────────────────────────────────────────────────┤
│         [Devam et →]                            │
└─────────────────────────────────────────────────┘

→ "Devam et" → Adres + ödeme
─────────────────────────────────
[Ekran: Adres + ödeme]
  Sevkiyat adresi:
  [İstanbul Oto Aksesuar — Mecidiyeköy Şubesi ▼]

  Ödeme tipi:
  ○ Vadeli (yeni hesap, vade yok)
  ● Havale / EFT
  ○ Kart ile öde (yakında)

  [Devam →]

→ Yeni hesap, vade yok → vadeli pasif
→ Havale seçilir
─────────────────────────────────
[Ekran: Onay]
  Sevkiyat: İstanbul Oto Aksesuar — Mecidiyeköy
  Tahmini teslim: 3-5 iş günü
  Toplam: 22.140₺
  Ödeme: Havale (sipariş onayında IBAN gönderilecek)

  [Siparişi onayla]
```

### Adım 6 — Sipariş onayı + sonraki

```
→ Onay tıklanır
→ Backend: `repoCreate(satis_siparisleri)` — Paspas akışına düşer
→ `siparis_kalemleri` oluşturulur
→ Stok rezervasyonu (transaction)
→ Email: "Siparişiniz alındı: SS-2026-0125"
→ Portal bildirimi
─────────────────────────────────
[Ekran: Sipariş başarılı]
  ✓ Siparişiniz alındı
  Numara: SS-2026-0125
  Tutar: 22.140₺

  Yapılacaklar:
  • Bu emailde gönderilen IBAN'a havale yapın
  • Havale dekontunu satış@promats.com.tr'ye gönderin
  • Ödemenin görülmesiyle üretime aktarılacak

  [Siparişlerime git →]
```

**Toplam süre:** ~5 dakika (bayi alıştığında **2-3 dakika**).

---

## Yolculuk #2 — Bayi: Tekrar Sipariş + Cari Sorgu (B-1)

**Senaryo:** Mehmet 2 ay sonra portal'a giriyor. Hem geçen ayki siparişin durumunu görmek hem yeni sipariş vermek istiyor.

### Adım 1 — Login + dashboard
```
→ Login (alışkanlık: 30 saniye)
─────────────────────────────────
[Ekran: Dashboard]
┌─────────────────────────────────────────────────┐
│ 💰 Cari bakiye: 22.140₺ (vadeli)                │
│    ⚠ Son ödeme tarihi: 15 Mayıs (3 gün kaldı!) │
├─────────────────────────────────────────────────┤
│ 📦 Aktif sipariş: 1                             │
│    SS-2026-0142 • Üretimde • ETA: 12 Mayıs      │
├─────────────────────────────────────────────────┤
│ 🔄 Son aldıklarım: [Tek tıkla yeniden sipariş→] │
│    • Star Siyah Corolla 2018 (50 adet)          │
│    • Premium 3D Mat (10 adet)                   │
└─────────────────────────────────────────────────┘
```

### Adım 2 — Sipariş takibi
```
→ "SS-2026-0142" tıklanır
─────────────────────────────────
[Ekran: Sipariş detay]
  Sipariş: SS-2026-0142
  Tarih: 8 Mayıs 2026
  Tutar: 18.420₺

  Statü zinciri:
  ✓ Onaylandı (8 May 14:23)
  ✓ Üretime alındı (9 May 09:15)
  ◉ Üretimde — Makine M-04 (45/100 adet tamamlandı)
  ○ Tamamlandı
  ○ Kargoda
  ○ Teslim

  Tahmini teslim: 12 Mayıs 2026

  [Sipariş kalemlerini gör] [Yeniden sipariş et]
```

### Adım 3 — Cari ekstre
```
→ Üst menüden "Cari Hesap" tıklanır
─────────────────────────────────
[Ekran: Cari hesap]
  Bakiye: 22.140₺ vadeli (15 May ödeme)

  Vadeli faturalar:
  • F-2026-3421 — 22.140₺ — Vade: 15 May 2026
    [PDF indir] [Mutabakat formu]

  Yaklaşan ödemeler (30 gün):
  • 15 Mayıs: 22.140₺

  Ekstre:
  [Tarih aralığı seç] [Göster]
```

**Toplam süre:** ~2 dakika.

---

## Yolculuk #3 — Yönetici: Yeni Bayi Onboarding (Y-1)

**Aktör:** Promats yöneticisi Ayşe
**Senaryo:** Yeni bir bayi (Ankara Oto Market) Promats ile sözleşme imzaladı. Ayşe portal hesabını oluşturacak.

### Adım 1 — Müşteri kaydı kontrolü
```
→ Ayşe Paspas admin panel "Müşteriler" sayfasına gider
→ "Ankara Oto Market" mevcutsa devam, yoksa yeni müşteri kaydı
→ Bu adım Paspas'ta zaten var (mevcut akış)
```

### Adım 2 — Bayi portal hesabı oluşturma
```
→ Sidebar > "Bayi Portalı" > "Bayi Yönetimi"
─────────────────────────────────
[Ekran: Bayi yönetimi]
  Aktif bayiler: 35

  [+ Yeni bayi hesabı oluştur]

→ Tıklar
─────────────────────────────────
[Ekran: Yeni bayi hesabı]
  Müşteri: [Ankara Oto Market ▼]   ← `musteriler` tablosundan
  Bayi yöneticisi:
    Ad: Selim Bey
    Email: selim@aom.com.tr
    Telefon: 0532-XXX-XXXX
    Rol: Bayi Admin

  İskonto: %5 (varsayılan, segment B'ye göre)
  Kredi limiti: 50.000₺
  Vade: 30 gün

  [Hesabı oluştur ve email gönder]

→ Backend:
  - portal_kullanicilari kayıt
  - Geçici şifre üretimi
  - Email gönderimi (Brevo)
  - Audit log: "Yeni bayi hesabı oluşturuldu"
```

### Adım 3 — Sonrası
```
→ Ayşe bayi listesine döner
→ "Selim Bey" yeni eklenmiş, "İlk giriş bekliyor" durumu
→ 3 gün içinde Selim giriş yapmazsa hatırlatma email otomatik
```

**Toplam süre:** ~3 dakika.

---

## Yolculuk #4 — Yönetici: Tahmin Motoru Sonucu İncele (Y-3)

**Aktör:** Üretim planlama sorumlusu Hakan
**Senaryo:** Pazartesi sabah, önümüzdeki 30 gün için sipariş tahminini görüp üretim planı yapacak.

### Adım 1 — Tahmin dashboard'u
```
→ Sidebar > "Tahmin Motoru"
─────────────────────────────────
[Ekran: Tahmin dashboard]
  Önümüzdeki 30 gün toplam tahmin:
  ▼ 4.250 adet (geçen aya göre +%8)

  Heatmap (bayi × hafta):
  [INTERAKTIF GRİ-KOYU GRADİENT TABLOSU]
  Y: 50 bayi
  X: hafta 1, 2, 3, 4

  Top yükselen 5 bayi:
  1. İstanbul Oto Aksesuar  +%35 (400 adet ↑)
  2. Ege Oto Paspas         +%22 (180 adet ↑)
  ...

  Top düşen 5 bayi:
  1. Karadeniz Oto Malzeme  -%40 (geçen ay 200 → bu ay 120)
     ⚠ Churn skoru: 65 (yüksek risk) → [Bayi Radarı]
  ...

  [Tüm bayi tablosu] [Excel'e aktar]
```

### Adım 2 — Bir bayinin detayı
```
→ "İstanbul Oto Aksesuar" satırı tıklanır
─────────────────────────────────
[Ekran: Bayi tahmin detay]
  Bayi: İstanbul Oto Aksesuar

  Sipariş geçmişi (son 12 ay):
  [GRAFİK: aylık sipariş trend]

  Tahmin (30 gün):
  • Star Siyah Corolla:  120 adet (95 - 145, %95 güven)
  • Star Siyah Megane:    80 adet (65 - 95)
  • Premium 3D Civic:     45 adet (30 - 60)
  Toplam: 245 adet

  Neden bu tahmin? (sinyal listesi)
  ✓ Geçen yıl Mayıs: 230 adet (+40 etki)
  ✓ Son 30 gün ortalama: yüksek (+25)
  ✓ Mayıs sektör ay-içi: yüksek (+15)
  ⚠ USD/TRY artış: hafif düşüş (-5)
  ⚠ Kampanya aktif: belirgin etki (+10)

  Yöntem: Prophet  •  Güven: 0.92  •  MAPE 90gün: %18
```

### Adım 3 — Hakan'ın aksiyonu
```
→ "Üretim Planı'na aktar" butonu (Faz 2 v2)
→ Otomatik üretim emri taslağı oluşur
→ Hakan onaylar / düzenler
→ Üretim planlamaya düşer
```

**Toplam süre:** ~10 dakika (alışkanlık: 5 dk).

---

## Yolculuk #5 — Yönetici: Churn Alarm + Aksiyon (Y-2)

**Aktör:** Satış sorumlusu Burcu
**Senaryo:** Pazartesi sabah email gelir: "3 bayi kritik churn riskinde". Burcu inceler, aksiyon alır.

### Adım 1 — Email + dashboard
```
[Email]
Konu: ⚠ Bayi Radarı — 3 kritik risk

3 bayide kritik churn riski tespit edildi:
1. Karadeniz Oto Malzeme — Skor: 78
2. Bursa Aksesuar Center — Skor: 72
3. Adana Otomotiv         — Skor: 70

Detaylar için: portal.promats.com.tr/admin/bayi-radari
─────────────────────────────────
→ Burcu link tıklar, login sonrası
─────────────────────────────────
[Ekran: Bayi Radarı]
  Top 3 kritik:

  🔴 Karadeniz Oto Malzeme  • Skor 78
     Sinyaller:
     • Web sitesinde yeni rakip marka belirdi (+30)
     • Instagram 67 gün post yok (+20)
     • Son 60 gün sipariş %40 düşük (+15)
     • Yorum sayısı %50 azaldı (+13)

     Önerilen aksiyon (LLM):
     1️⃣ Telefon araması + %5 ek iskonto (etki: 78→50)
     2️⃣ Saha ziyareti + ürün eğitimi (78→35)
     3️⃣ Özel kampanya (78→60)

     [Aksiyon ata →]

  🔴 Bursa Aksesuar Center • Skor 72
  ...
```

### Adım 2 — Aksiyon atama
```
→ Burcu "Karadeniz Oto" için "Saha ziyareti" seçer
→ Saha ekibi atama
─────────────────────────────────
[Ekran: Aksiyon atama]
  Bayi: Karadeniz Oto Malzeme
  Aksiyon: Saha ziyareti + ürün eğitimi
  Atanacak: [Saha ekibi → Mert Bey ▼]
  Hedef tarih: [Bu Cuma]
  Bütçe: 0₺ (ulaşım ekipte)
  Notlar: [Boş]

  [Ata ve bildir]

→ Mert mobile push: "Yeni saha ziyareti atandı: Karadeniz Oto"
→ Audit log: "Burcu → Mert: aksiyon atadı"
→ Skor takibi başlar (önce/sonra)
```

### Adım 3 — Saha ziyareti (Mert)
```
[Mert'in saha mobil app'i — Yolculuk #6'ya bağlanır]
```

**Toplam süre:** ~5 dakika (Burcu için).

---

## Yolculuk #6 — Saha satış: Bayi Ziyareti (Y-4)

**Aktör:** Saha satış elemanı Mert
**Senaryo:** Karadeniz Oto Malzeme'yi ziyaret edecek, mobil app'ten ziyaret kaydı tutar.

### Adım 1 — Sabah görev listesi
```
[Mobil ekran: Bugünkü görevler]
  📍 Saha ziyareti — Karadeniz Oto Malzeme
     Adres: Trabzon ...
     Skor: 78 (kritik)
     Atayan: Burcu
     Tarih: Bugün

  📍 Rutin ziyaret — Trabzon Aksesuar
     Skor: 25 (stabil)

  [Rotayı haritada göster]
```

### Adım 2 — Ziyaret esnasında
```
→ Mert dükkana varır, ziyaret butonuna basar
─────────────────────────────────
[Mobil: Ziyaret formu]
  Bayi: Karadeniz Oto Malzeme
  Konum: ✓ doğrulandı (GPS)
  Saat: 14:30

  Ziyaret tipi: [Saha satış / Şikayet / Rutin ▼]
  Katılımcılar: [Bayi sahibi: Recep Bey ▼]

  Ses kaydı: [● Kayıt başlat]
  → Mert konuşmayı kaydeder (10 dk)
  → Whisper API: ses → metin
  → LLM özet: "Recep Bey rakip markaya geçmeyi düşünüyor,
    sebep: bizim teslimat gecikmeleri. Daha iyi vade istiyor."

  Foto: [Çek] (3 foto: dükkan, raf, rakip ürün)

  Sonuç:
  ☑ Bayi memnun değil
  ☑ Rakip teklif var
  ☐ Yeni sipariş alındı
  ☑ Aksiyon gerekli

  Sonraki adım: "Burcu'ya rapor + müdür görüşmesi öner"

  [Kaydet ve bitir]
```

### Adım 3 — Sonrası
```
→ Backend: ziyaret_kayitlari yazılır
→ LLM: "kritik bilgi var" işaretler
→ Faz 5: bayi_sinyalleri'ne otomatik feed-in (rakip teklif var → +50 puan)
→ Burcu'ya bildirim: "Mert ziyaret tamamlandı, kritik bilgi"
→ Burcu görev güncelleme: "müdür görüşmesi planla"
```

**Toplam süre:** ~30 dakika (ziyaret + 5 dk kayıt).

---

## Yolculuk #7 — Yönetici: Excel ile Geçmiş Veri Yükleme (Y-3)

**Aktör:** Hakan
**Senaryo:** Promats'ın 2 yıl önce başka bir sistemde tuttuğu sipariş verisi var. Excel olarak ihraç etti, MatPortal'a yükleyip tahmin modelini zenginleştirecek.

### Adım 1 — Şablon indirme
```
→ Sidebar > "ML Laboratuvarı" > "Veri Yükleme"
─────────────────────────────────
[Ekran: Excel yükleme]
  Veri tipi: [Sipariş geçmişi ▼]

  📥 Şablonu indir: siparis_gecmisi_v1.xlsx

  Şablon kolonları:
  - tarih (zorunlu)
  - bayi_kod (zorunlu)
  - urun_kod (zorunlu)
  - adet (zorunlu)
  - birim_fiyat
  - iskonto_yuzde (5 = %5)
  - kampanya_kodu
  - notlar
```

### Adım 2 — Yükleme
```
→ Hakan eski Excel'i template'e uyumlu hale getirir
→ Drag-drop yükler
─────────────────────────────────
[Ekran: Yükleme preview]
  Dosya: 2024_2025_siparis_gecmis.xlsx
  Boyut: 1.2 MB
  Satır: 1.847

  Doğrulama:
  ✓ 1.792 geçerli satır
  ⚠ 55 hatalı satır
    - 30: bayi_kod bulunamadı
    - 15: tarih formatı geçersiz
    - 10: ürün_kod bulunamadı

  [Hatalı satırları düzelt] [Hataları atlayarak devam]
```

### Adım 3 — Hata düzeltme
```
→ "Hatalı satırları düzelt" tıklanır
─────────────────────────────────
[Ekran: Hata düzeltme]
  Satır 42: bayi_kod "BAY-XYZ" bulunamadı
    Excel değeri: "Karadeniz Oto"
    Çözüm: [Karadeniz Oto Malzeme ▼] (BAY-007)
    Veya: [Yeni bayi olarak oluştur]
    Veya: [Bu satırı atla]

  → Hakan eşleştirir veya atlar
  → Tüm hatalar çözülür
  → 1.847 / 1.847 geçerli
```

### Adım 4 — Yükleme onayı + model re-train
```
→ "Geçerlileri kaydet" tıklanır
→ Backend: siparis_gecmisi_yuklenen + siparis_kalemleri (geçmiş tag'li)
→ Audit log
─────────────────────────────────
[Ekran: Başarılı]
  ✓ 1.847 satır kaydedildi
  ✓ Modeli yeniden eğitmek ister misiniz?

  [Hayır, sonra]  [Evet, şimdi eğit]

→ "Evet" → eğitim kuyruğuna girer
→ "Eğitim 30 dk içinde tamamlanacak, email gönderilecek"
─────────────────────────────────
[30 dk sonra email]
  ✓ Model eğitimi tamamlandı
  Eski MAPE: %32 → Yeni MAPE: %22 (-31% iyileşme)
  Champion: prophet-bayi-007-urun-star-siyah-v1.4

  [Sonuç dashboard'u]
```

**Toplam süre:** ~20 dakika (hata düzeltme dahil).

---

## Yolculuk #8 — Yönetici: Konversasyonel Sohbet (Y-1)

**Aktör:** Ayşe (Faz 8 sonrası)
**Senaryo:** Hızlıca bilgi almak istiyor; admin panelden gezinmek yerine sohbet kullanır.

```
→ Sağ alt köşede sohbet ikonu, tıklar
─────────────────────────────────
[Sohbet penceresi]
  AI: Merhaba Ayşe. Nasıl yardımcı olabilirim?

  Ayşe: İstanbul Oto Aksesuar bu ay kaç sipariş verdi?

  AI: 🔍 İstanbul Oto Aksesuar — Mayıs 2026:
      • 4 sipariş
      • Toplam: 87.450₺
      • Son sipariş: 15 Mayıs (Star Siyah 80 adet)
      Geçen aya göre +%22 büyüme.
      Detay görmek ister misin?
      [Bayi sayfası] [Sipariş listesi]

  Ayşe: Karadeniz Oto'ya bu hafta sevkiyat var mı?

  AI: 🚚 Karadeniz Oto Malzeme — sevkiyat:
      • SS-2026-0098 — kargoda (Yurtiçi, takip: ABC123)
      • Tahmini teslim: 5 Mayıs Salı

  Ayşe: 50 adet star siyah corolla 2018'den
        Ankara Oto Market'e sipariş aç

  AI: ⚠ Onayınız gerekiyor.
      Sipariş özeti:
      • Bayi: Ankara Oto Market
      • Ürün: Star Siyah Corolla 2018
      • Adet: 50
      • Fiyat: 50 × 271₺ (size %5 iskonto) = 13.550₺
      • Teslim: 8 Mayıs (tahmini)

      Risk skoru: 9 (orta) — onay gerekiyor
      Güven: 0.95

      [Onayla] [Düzenle] [İptal]

  Ayşe: [Onayla]

  AI: ✓ Sipariş açıldı: SS-2026-0156
      Üretim emrine bağlandı.
      Bildirim Selim Bey'e (Ankara Oto) gitti.
      [Sipariş detay]
```

**Toplam süre:** ~2 dakika (admin paneli açıp form doldurmaya göre 5x hızlı).

---

## Yolculuk #9 — Sistem Aksiyon Akışı: Otomatik Stok Sipariş (Y-3)

**Senaryo:** Faz 4 stok otomasyonu ham madde ROP altına düştüğünde tedarikçiye taslak PO oluşturur.

### Otomatik akış
```
[Cron — günlük 08:00]
1. Stok tüketim hızı analizi
2. Her hammadde için ROP kontrolü
3. PE Granül 5 ton altında, ortalama tüketim 2 ton/hafta
   → Lead time 5 gün → şimdi sipariş gerek
4. Tedarikçi performans skor sıralı: A-Tedarikçi (en iyi)
5. PO taslağı oluşturulur:
   • Tedarikçi: A-Tedarikçi
   • Ürün: PE Granül HD
   • Miktar: 10 ton
   • Tahmini fiyat: 280K TL
   • Tahmini teslim: 6 Mayıs

[Risk değerlendirmesi]
   risk_skoru = geri_al(2) + tutar(4) + dış_görünüm(3) + veri(1) = 10 (Yüksek)
   → Otomatik onay yok, Hakan onayı zorunlu

[Hakan'a bildirim]
   📧 Email: "PO taslağı hazır — onay bekleniyor"
   🔔 Portal: "PO-TASLAK-0042 — onay gerekli"
```

### Hakan'ın aksiyonu
```
→ Hakan portal'a girer, PO taslağını inceler
─────────────────────────────────
[Ekran: PO Taslağı]
  Tedarikçi: A-Tedarikçi (skor 4.5/5)
  Alternatifler: B-Tedarikçi (4.1), C-Tedarikçi (3.8)

  Kalemler:
  • PE Granül HD — 10 ton — 28 TL/kg = 280.000₺

  AI gerekçesi:
  "Stok kritik: 5 ton kalmış, haftalık tüketim 2 ton.
   Lead time 5 gün, güvenli rezerv için 2 hafta'lık alım.
   A-Tedarikçi: son 6 sipariş %100 zamanında, fiyat avantajlı."

  [Onayla ve gönder] [Düzenle] [Reddet]

→ Hakan onaylar
→ A-Tedarikçi'ye email + KEP otomatik
→ Audit log + PO oluşur (`satinalma_siparisleri`)
```

**Toplam süre:** Sistem 30 saniye, Hakan onayı 2 dakika.

---

## Yolculuk #10 — Bayi: WhatsApp ile Sipariş (Faz 8)

**Aktör:** Mehmet (Bayi)
**Senaryo:** Yolda, telefondan, WhatsApp üzerinden sipariş verecek.

```
[WhatsApp — Promats Resmi Hesabı]
  Mehmet: Merhaba, 30 adet star siyah corolla 2018 lazım

  Bot: Merhaba Mehmet Bey, İstanbul Oto Aksesuar.
       Siparişinizi inceleyeyim:
       • 30 × Star Siyah Corolla 2018
       • Birim fiyat: 271₺ (%5 iskonto)
       • Toplam: 8.130₺ + KDV = 9.756₺
       • Stok: ✓ var (245 adet)
       • Vadeli ödeme: limit yeterli (45K boş)
       • Tahmini teslim: 4 iş günü

       Onaylıyor musunuz?
       Onaylamak için "EVET" yazın.

  Mehmet: EVET

  Bot: ✓ Siparişiniz alındı: SS-2026-0156
       Email + portal bildirimi gitti.
       Detay: portal.promats.com.tr/siparis/SS-2026-0156
```

**Toplam süre:** ~1 dakika.

**Not:** Bu yolculuk Faz 8 ile aktif. İlk 1 yıl sadece manuel onaylı senaryolarda — risk skoru 7+ otomatik kapanır.

---

## Akış Karar Noktaları (Risk Eşikleri)

| Aksiyon | Risk skoru | Otomatik mi? | Onay tipi |
|---------|------------|--------------|-----------|
| Bayi katalog görüntüle | 1 | ✅ Anlık | — |
| Sepete ekle | 1 | ✅ | — |
| Bayi sipariş onaylama (limit içi) | 8 | ✅ Sessiz onay (5 dk) | Bayi kendi onayı |
| Yöneticiye sipariş bildirimi | 1 | ✅ | — |
| Otomatik PO taslağı (>2K TL) | 10+ | ❌ Manuel zorunlu | Yönetici |
| Email gönderme (1-100) | 5 | ✅ | — |
| Toplu mail (>100) | 14 | ❌ Manuel | Pazarlama müdürü |
| Bayi pasifleştirme | 12 | ❌ Manuel | Yönetici |
| Fiyat değişikliği önerme | 11 | ❌ Manuel | Yönetici |
| Tedarikçiye PO gönderme | 12 | ❌ Manuel | Hakan |
| Stok düzeltme (manuel) | 14 | ❌ Manuel | Yönetici |

> **Detay:** [`tartisma/09-otomasyon-esikleri.md`](../tartisma/09-otomasyon-esikleri.md)

---

## Açık karar noktaları (Yolculuklar)

1. **WhatsApp Business API:** Faz 8'de mi, daha önce manuel kanal mı? (Önerim: Faz 8 sonrası, hesap onayı zaman alır)
2. **Sesli komut (TTS/STT):** mobil saha ekibi için ne kadar kritik? (Önerim: Whisper sadece, TTS Faz 9 v2)
3. **Bayi tek hesap mı, çoklu kullanıcı mı (MVP)?** (Önerim: tek hesap MVP, çoklu kullanıcı v2)
4. **PWA bayi mobil:** ne zaman? (Önerim: Faz 6 ile birlikte responsive web; PWA Faz 9)
5. **Sohbet bayi tarafı (Faz 8):** açılsın mı? (Önerim: ilk yıl sadece yönetici)
6. **Onboarding video:** hangi formatta? (Önerim: Loom ekran kayıtları + altyazı)
7. **5 dk sessiz onay:** Bayi sepet onaylar, 5 dk içinde sistem otomatik geçirir mi? (Önerim: hayır, bayi onayı kalır manuel)
8. **Pilot bayi sayısı:** 5 mi, 10 mu? (Önerim: 5 — yönetilebilir feedback)
9. **Saha mobil offline:** kaç saat veri tutsun? (Önerim: 24 saat queue)
10. **Email frekans:** kaç bildirim/gün max? (Önerim: kullanıcı tercihiyle, default 5)
