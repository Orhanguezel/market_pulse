# Wireframe Spesifikasyonları

Bu doküman MatPortal'ın **kritik UI ekranları** için wireframe taslaklarını içerir. Her wireframe için:
- ASCII görsel (markdown'da render edilir)
- Bileşen listesi
- Etkileşim notları
- Excalidraw / Figma'ya çevirme rehberi

Asıl çizimler için **2 yöntem**:
1. **Excalidraw** (önerilen): https://excalidraw.com/ — bu klasördeki ASCII'leri referans alarak çiz
2. **Figma**: detaylı kurumsal kimlik için (Faz 6 son hafta)

## Renk Paleti (Promats kurumsal)

```
Primary:    #2563eb (mavi)
Primary-soft: #dbeafe
Accent:     #7c3aed (mor — AI vurgusu)
Success:    #10b981 (yeşil — onay)
Warning:    #f59e0b (turuncu — uyarı)
Danger:     #dc2626 (kırmızı — kritik churn)
Bg:         #fafafa
Card:       #ffffff
Text:       #1a1a1a
Muted:      #6b7280
```

---

## Wireframe #1 — Bayi Portal Dashboard (Faz 6)

### Amaç
Bayinin login sonrası gördüğü ana ekran. 5 saniyede ne işine yarayacağını anlasın.

### ASCII Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [Promats Logo]              Bayi: İstanbul Oto    [Profil ▼] │
├──────────────────────────────────────────────────────────────┤
│ [Dashboard] [Katalog] [Sepet] [Siparişler] [Cari] [Yardım]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Hoş geldiniz, Mehmet Bey                                    │
│                                                              │
│  ┌─────────────────────┐  ┌──────────────────────────────┐   │
│  │  💰 CARİ BAKİYE     │  │  📢 KAMPANYA                 │   │
│  │                     │  │                              │   │
│  │  22.140 ₺ (vadeli)  │  │  3D Paspas Yaz İndirimi %15  │   │
│  │  ⚠ 3 gün kaldı      │  │  [İncele →]                  │   │
│  └─────────────────────┘  └──────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  📦 AKTİF SİPARİŞLERİM                                 │  │
│  │                                                        │  │
│  │  • SS-2026-0142  Üretimde   ETA: 12 May  18.420₺ →    │  │
│  │  • SS-2026-0156  Onaylandı  ETA: 16 May   9.756₺  →   │  │
│  │                                                        │  │
│  │  [Tüm siparişler →]                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🔄 SON ALDIKLARIM                                     │  │
│  │                                                        │  │
│  │  ⊞ Star Siyah Corolla 2018  (50 adet)  [Yeniden →]    │  │
│  │  ⊞ Premium 3D Mat Civic     (10 adet)  [Yeniden →]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  🚗 HIZLI ARAMA  │  │  💬 SORU SOR     │                  │
│  │  [Marka ▼] →     │  │  [Mesaj yaz...]  │                  │
│  └──────────────────┘  └──────────────────┘                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Bileşenler
- **Header:** logo + bayi adı + profil dropdown
- **Nav:** 6 ana menü (Dashboard active state)
- **Hero:** kişiselleştirilmiş selamlama
- **2 üst kart:** cari + kampanya (kritik bilgi)
- **Aktif siparişler:** maks 3 göster, hepsine link
- **Son aldıklarım:** tek tıkla yeniden sipariş (önemli özellik)
- **Hızlı arama:** araç filtre kısayolu
- **Soru sor:** yöneticiyle direkt mesajlaşma

### Etkileşim
- "Yeniden sipariş" → sepete kopyala → checkout
- Cari bakiye tıklanırsa → detay (cari hesap sayfası)
- "3 gün kaldı" uyarı kırmızı (ödeme yaklaşıyor)

---

## Wireframe #2 — Katalog & Araç Filtre (Faz 6)

### ASCII Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [Header — sabit]                                             │
├──────────────────────────────────────────────────────────────┤
│  Katalog                                                     │
├─────────────────────────┬────────────────────────────────────┤
│  ARAÇ FİLTRE            │  20 ürün bulundu                   │
│                         │                                    │
│  Marka                  │  ┌────────────────────────────┐    │
│  [Toyota         ▼]    │   │ ⊞ Star Siyah Kauçuk Havuz  │    │
│                         │  │ SKU: STR-SIY-COR18         │    │
│  Model                  │  │ Stok: 245 adet ✓           │    │
│  [Corolla        ▼]    │   │ Fiyat: 285₺ (size %5)      │    │
│                         │  │ [Sepete ekle]  [Detay]     │    │
│  Yıl                    │  └────────────────────────────┘    │
│  [2018           ▼]    │   ┌────────────────────────────┐    │
│                         │  │ ⊞ Premium 3D Mat            │    │
│  Gövde                  │  │ SKU: P3D-COR18             │    │
│  ☑ Sedan                │  │ Stok: 18 adet ⚠ az kaldı   │    │
│  ☐ Hatchback            │  │ Fiyat: 420₺                │    │
│                         │  │ [Sepete ekle]  [Detay]     │    │
│  [Filtreyi uygula]      │  └────────────────────────────┘    │
│                         │   ┌────────────────────────────┐    │
│  Tip                    │  │ ⊞ Halı Klasik              │    │
│  ☑ Kauçuk               │  │ Stokta yok ✗               │    │
│  ☑ 3D                   │  │ [Numune talep]             │    │
│  ☐ Halı                 │  └────────────────────────────┘    │
│                         │                                    │
│  [Filtreleri temizle]   │  [Daha fazla yükle →]              │
└─────────────────────────┴────────────────────────────────────┘
```

### Bileşenler
- **Sol panel (sticky):** Marka → Model → Yıl → Gövde cascading
- **Filtre uygula:** form submit
- **Sağ liste:** ürün kartları
- **Stok durumu:** yeşil ✓ / sarı ⚠ / kırmızı ✗
- **Hızlı aksiyonlar:** sepete ekle, detay, numune talep

---

## Wireframe #3 — Tahmin Motoru Heatmap (Faz 2)

### Amaç
Yöneticinin önümüzdeki 30 gün için tüm bayilerin tahmini sipariş hacmini tek bakışta görmesi.

### ASCII Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Tahmin Motoru — Önümüzdeki 30 Gün                            │
├──────────────────────────────────────────────────────────────┤
│  Tarih aralığı: [Mayıs 2026 ▼]  [Excel'e aktar] [Refresh]    │
│                                                              │
│  Toplam tahmin: 4.250 adet (geçen ay +%8 ↑)                  │
│  MAPE (son 90 gün): %22  ✓ hedef %25                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ HEATMAP                          Hafta1 Hf2  Hf3  Hf4   │ │
│  │ ─────────────────────────────────────────────────────── │ │
│  │ İstanbul Oto Aksesuar             ████ ████ ███  ███    │ │
│  │ Ankara Oto Market                 ███  ████ ███  ██     │ │
│  │ Ege Oto Paspas                    ██   ███  ████ ████   │ │
│  │ Karadeniz Oto Malzeme             █    █    ░░   ░░ ⚠   │ │
│  │ Bursa Aksesuar Center             ███  ██   ██   ██     │ │
│  │ ... (45 bayi daha)                                      │ │
│  │                                                         │ │
│  │ Yoğunluk: ░ Az  █ Orta  ████ Çok                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────┬───────────────────────────┐ │
│  │ TOP YÜKSELEN                 │ TOP DÜŞEN                │ │
│  │                              │                          │ │
│  │ 1. İstanbul Oto    +%35 ↑   │ 1. Karadeniz Oto -%40 ↓   │ │
│  │ 2. Ege Oto         +%22 ↑   │ 2. Bursa Aksesuar -%18 ↓  │ │
│  │ 3. Mersin Aksesuar +%18 ↑   │ 3. Edirne Oto -%15 ↓      │ │
│  │ 4. Konya Oto       +%14 ↑   │                          │ │
│  │ 5. Adana Oto       +%9  ↑   │ ⚠ 1 bayi churn radarında  │ │
│  └─────────────────────────────┴───────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Bileşenler
- **Header:** tarih seçici + export + refresh
- **KPI banner:** toplam + MAPE
- **Heatmap matrisi:** Y=bayi, X=hafta, hücre rengi=hacim
- **Top yükselen/düşen:** karşılaştırma listeleri
- **Churn entegrasyon:** ⚠ ikon ile bayi radarına link

### Etkileşim
- Heatmap hücresi tıklanırsa → bayi-detay tahmin grafiği
- "Karadeniz Oto" tıklanırsa → bayi sayfası + churn radarı
- Renk paleti: Tailwind blue-50 → blue-900 gradyan

---

## Wireframe #4 — Bayi Radarı (Churn) Heatmap (Faz 5)

### ASCII Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Bayi Radarı — Churn Risk Görünümü                            │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┬──────────────┬───────────┐  │
│  │ KRİTİK       │ YÜKSEK        │ ORTA         │ DÜŞÜK     │  │
│  │ 3 bayi       │ 8 bayi        │ 12 bayi      │ 27 bayi   │  │
│  │ 🔴            │ 🟠           │ 🟡           │ 🟢        │  │
│  └──────────────┴──────────────┴──────────────┴───────────┘  │
│                                                              │
│  ⚠ ACİL MÜDAHALE GEREKEN                                     │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🔴 Karadeniz Oto Malzeme         Skor: 78               ││
│  │                                                          ││
│  │   Sinyaller:                                            ││
│  │   • Web sitesinde yeni rakip marka belirdi (+30)        ││
│  │   • Instagram 67 gün post yok (+20)                     ││
│  │   • Son 60 gün sipariş %40 düşük (+15)                  ││
│  │   • Yorum sayısı %50 azaldı (+13)                       ││
│  │                                                          ││
│  │   Önerilen aksiyon (AI):                                ││
│  │   1️⃣ Telefon araması + %5 ek iskonto (78→50)            ││
│  │   2️⃣ Saha ziyareti + ürün eğitimi (78→35)              ││
│  │   3️⃣ Özel kampanya (78→60)                              ││
│  │                                                          ││
│  │   [Aksiyon ata →] [Bayi detay] [Geçmiş aksiyon]         ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🔴 Bursa Aksesuar Center         Skor: 72              ││
│  │   ... (özet)                                            ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  HEATMAP — Son 12 Hafta x Tüm Bayiler                        │
│  [İnteraktif gradyan tablo]                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Bileşenler
- **Risk dağılım ribbon:** 4 kategori sayım
- **Acil müdahale kart listesi:** kritik bayiler genişletilmiş
- **Sinyal listesi:** ne kadar puan eklediği gösterilir
- **AI öneri:** 3 alternatif aksiyon, her biri için tahmini etki
- **CTA:** Aksiyon ata, bayi detay, geçmiş

### Etkileşim
- "Aksiyon ata" → modal: saha temsilcisi seç + tarih + bütçe
- Sinyaller tıklanırsa → kanıt (HTML snapshot, sosyal post link)

---

## Wireframe #5 — Saha Mobil Ziyaret Formu (Faz 9)

### Amaç
Saha satış elemanı bayi ziyaretinde 5 dakikada kayıt yapsın.

### ASCII Layout (mobil portrait)

```
┌────────────────────┐
│ ← Saha Ziyareti    │
├────────────────────┤
│ Bayi: Karadeniz    │
│ Konum: ✓ doğru     │
│ Saat: 14:30        │
├────────────────────┤
│                    │
│ Tip: [▼ Saha]      │
│                    │
│ Katılımcı:         │
│ [+ Ekle: Recep B.] │
│                    │
│ ─────────────      │
│                    │
│ 🎤 SES KAYDI       │
│                    │
│   ⚫ Kayıt başlat    │
│                    │
│   ⏵ 03:42 / kayıt  │
│                    │
│ 📷 FOTO            │
│ [+ Çek]            │
│ [Foto1] [Foto2]    │
│                    │
│ ─────────────      │
│                    │
│ Sonuç:             │
│ ☑ Bayi memnun değil│
│ ☑ Rakip teklif var │
│ ☐ Yeni sipariş     │
│ ☑ Aksiyon gerekli  │
│                    │
│ Sonraki adım:      │
│ [Notlar...]        │
│                    │
│ ──── ────  ────    │
│ [İptal] [Kaydet]   │
│                    │
└────────────────────┘
```

### Bileşenler
- **Sticky top:** geri + bayi adı + konum doğrulama
- **Form alanları:** dropdown, kişi seçici, ses kayıt, foto
- **Checkboxes:** sonuç etiketleri
- **Free text:** sonraki adım notu
- **CTA:** kaydet / iptal

### Etkileşim
- Konum auto-detect (GPS)
- Ses kayıt sırasında dalga formu görünür (visual feedback)
- Kaydet sonrası: Whisper API → metin → LLM özet → backend
- Offline mod: sıraya alır, bağlantı dönünce senkron

---

## Wireframe #6 — Konversasyonel Sohbet UI (Faz 8)

### ASCII Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Sağ alt köşe — açıldığında modal                            │
├──────────────────────────────────────────────────────────────┤
│ 💬 MatPortal AI                                  [_] [×]     │
│                                                              │
│ ─────────────────────────────────────────────────────────────│
│                                                              │
│  AI: Merhaba Ayşe. Nasıl yardımcı olabilirim?               │
│                                                              │
│              Ayşe: İstanbul Oto bu ay kaç sipariş verdi?    │
│                                                              │
│  AI: 🔍 İstanbul Oto Aksesuar — Mayıs 2026:                 │
│      • 4 sipariş                                             │
│      • Toplam: 87.450₺                                       │
│      • Geçen aya göre +%22 büyüme                            │
│                                                              │
│      [Bayi sayfası] [Sipariş listesi]                        │
│                                                              │
│              Ayşe: 50 adet star siyah corolla 2018'den       │
│                    Ankara Oto Market'e sipariş aç            │
│                                                              │
│  AI: ⚠ Onayınız gerekiyor.                                   │
│      ┌──────────────────────────────────────────────┐        │
│      │ Sipariş özeti:                                │        │
│      │ • Bayi: Ankara Oto Market                    │        │
│      │ • Ürün: Star Siyah Corolla 2018              │        │
│      │ • Adet: 50  ·  13.550₺                        │        │
│      │ • Teslim: 8 Mayıs (tahmini)                  │        │
│      │                                                │        │
│      │ Risk skoru: 9 (orta) — onay gerekiyor        │        │
│      │ Güven: 0.95                                   │        │
│      └──────────────────────────────────────────────┘        │
│                                                              │
│      [Onayla] [Düzenle] [İptal]                              │
│                                                              │
│ ─────────────────────────────────────────────────────────────│
│                                                              │
│ [Sorunu yazın...]                                  [Gönder]  │
└──────────────────────────────────────────────────────────────┘
```

### Bileşenler
- **Floating action button** sağ alt → tıklanınca açılır
- **Mesaj balonları:** AI sol, kullanıcı sağ
- **Aksiyon kartları:** Risk + güven + özet + onay butonları
- **Inline link'ler:** "Bayi sayfası" tıklanınca yeni tab
- **Input:** alt sticky + gönder butonu

### Etkileşim
- ESC tuşu → kapat
- Onay tıklanınca: backend `repoCreate` → toast "Sipariş oluştu"
- Risk 10+ → "Onayla" disabled, manuel admin paneli yönlendir

---

## Wireframe #7 — KPI Dashboard (Yönetici)

### ASCII Layout

```
┌──────────────────────────────────────────────────────────────┐
│ MatPortal — KPI Dashboard                  Mayıs 2026        │
├──────────────────────────────────────────────────────────────┤
│  ÜST DÜZEY (4 boyut)                                         │
│  ┌──────────────┬──────────────┬─────────────┬─────────────┐ │
│  │ Bayi Adopt   │ Tahmin       │ Operasyonel │ Stratejik   │ │
│  │              │              │             │             │ │
│  │ Portal: 65%  │ MAPE: %22    │ Hatası: 2/ay│ Churn: %3.2 │ │
│  │ ↑ +12% MoM   │ ↓ -3 puan    │ Süre: 1.2hr │ ↓ %50 azaldı│ │
│  │              │              │             │             │ │
│  │ Hedef: 70%   │ Hedef: %20   │ Hedef: <2/ay│ Hedef: <%5  │ │
│  └──────────────┴──────────────┴─────────────┴─────────────┘ │
│                                                              │
│  TREND (son 12 ay)                                           │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  100% ┤                                          ●●●     ││
│  │   75% ┤                              ●●●●●●●●●●●         ││
│  │   50% ┤                  ●●●●●●●●●●●                      ││
│  │   25% ┤      ●●●●●●●●●●●                                  ││
│  │    0% ┤●●●●●                                              ││
│  │       └──────────────────────────────────────────────     ││
│  │       Haz Tem Ağu Eyl Eki Kas Ara Oca Şub Mar Nis May    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  RİSK UYARILARI                                              │
│  ⚠ KPI sapma (2): A-2 (%65 vs %70), B-1 (%22 vs %20)         │
│  ⚠ Risk: TR-1 tahmin doğruluğu, IR-3 sponsor                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Excalidraw'a Çevirme Rehberi

1. https://excalidraw.com/ aç
2. Bu doküman yanında olsun
3. Her wireframe için:
   - Sayfa başlığı (text, fontSize 24)
   - Ana çerçeve (rectangle, roundness)
   - İç bileşenler (rectangle + text)
   - Oklar (arrow) etkileşim için
4. Renk paletini yukarıdaki Promats kuruma göre kullan
5. PNG export → `diagrams/{wireframe-id}.png`

## Excalidraw Çabuk Stiller

| Eleman | Renk | Boyut |
|--------|------|-------|
| Başlık | #1a1a1a | 24-36px |
| Card border | #e5e7eb | 1-2px |
| Primary CTA | #2563eb fill | 14-16px text |
| Warning | #f59e0b | 14-16px |
| Danger | #dc2626 | 14-16px |
| Text body | #374151 | 14-16px |
| Muted | #6b7280 | 12-14px |

## Çevirim Sırası

| # | Wireframe | Öncelik | Faz | Süre tahmini |
|---|-----------|---------|-----|--------------|
| 1 | Bayi Dashboard | YÜKSEK | 6 | 30 dk |
| 2 | Katalog Filtre | YÜKSEK | 6 | 30 dk |
| 3 | Tahmin Heatmap | ORTA | 2 | 45 dk |
| 4 | Bayi Radarı | ORTA | 5 | 45 dk |
| 5 | Saha Mobil | DÜŞÜK | 9 | 30 dk |
| 6 | Sohbet UI | DÜŞÜK | 8 | 20 dk |
| 7 | KPI Dashboard | DÜŞÜK | her | 30 dk |
| | **Toplam:** | | | **~3.5 saat** |

Toplam 7 wireframe, ~3.5 saat çizim süresi.

## 7 Katmanlı Mimari Diyagramı

`01-mimari-7-katman.excalidraw` dosyası **örnek olarak hazır**. Excalidraw'da açıp düzenleyebilirsiniz.

```bash
# VS Code Excalidraw extension ile
code 01-mimari-7-katman.excalidraw

# Veya web'e yükle
# https://excalidraw.com/ → Open → 01-mimari-7-katman.excalidraw
```

PNG export sonrası proje teklifi HTML dokümanlarında kullanılır.
