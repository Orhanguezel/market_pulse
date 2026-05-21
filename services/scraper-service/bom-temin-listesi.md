# Donanım Alım Listesi — Dirican Mantar AI Hasat Sistemi

**Tarih:** 2026-05-08  
**Revizyon:** v3 — Gerçek piyasa fiyatları eklendi (scraper-service ile çekilen canlı veriler)

---

## Kritik Ön Notlar

### 1. Jetson Orin Nano Super — DisplayPort çıkışı, HDMI değil
Jetson Orin Nano Developer Kit görüntü çıkışı **DisplayPort 1.2**'dir. HDMI veya USB-C
görüntü çıkışı desteklenmez. Projektörlere bağlamak için aktif dönüştürücü gerekir:

- **1 projektör:** 1× DisplayPort → HDMI aktif dönüştürücü
- **2 projektör (çift başlık):** 1× DisplayPort MST Hub → 2× HDMI çıkışı

> Kaynak: [NVIDIA Jetson Orin Nano Devkit User Guide](https://developer.nvidia.com/embedded/learn/jetson-orin-nano-devkit-user-guide/hardware_spec.html)

### 2. Güç kaynağı — 19V için laptop tipi adaptör
Meanwell RSP-150 serisinde **19V modeli yoktur** (standart çıkışlar: 12V, 24V, 48V).
MVP için en pratik çözüm: **19V 7.9A 150W laptop tipi DC adaptör** (Acer/HP/Dell uyumlu tip).
Projektörler kendi adaptörlerini kullanır; Jetson için ayrı 19V adaptör alınır.

### 3. Prototip stratejisi — Önce tek başlık
İlk prototipte tek taraflı başlamak önerilir: **1× Orbbec Gemini 335 + 1× AAXA P400**.
Sistem doğrulandıktan sonra ikinci başlık eklenir. Bu yaklaşım:
- İlk test maliyetini ~%40 düşürür (~80.000 TL → ~48.000 TL)
- Entegrasyon riskini azaltır
- DP → HDMI tek dönüştürücü yeterli olur

---

## BOM A — Faz 1 Prototip (Tek Başlık)

> Sütun açıklaması: **Gerçek Fiyat** = scraper-service ile 2026-05-08 tarihinde çekilen canlı veri.  
> `(JSON-LD)` = satıcı sitenin schema.org verisi; `(CSS)` = HTML selector; `—` = otomatik çekilemedi.

| # | Parça | Adet | Satıcı | Link | Tahmini (TL) | **Gerçek Fiyat (TL)** | Durum |
|---|-------|------|--------|------|--------------|----------------------|-------|
| 1 | NVIDIA Jetson Orin Nano Super 8GB Developer Kit | 1 | OpenZeka | [openzeka.com](https://openzeka.com/urun/nvidia-jetson-orin-nano-developer-kit/) | ~20.000 | **19.264,80** (KDV dahil) | ⛔ STOKTA YOK |
| 1b | *(Alternatif — önerilen)* SAMM Market | 1 | SAMM | [market.samm.com](https://market.samm.com/nvidia-jetson-orin-nano-super-developer-kit) | ~20.832 | **20.832,09** (JSON-LD) | ✅ Stok var |
| 2 | Orbbec Gemini 335 RGB-D kamera | 1 | e-komponent | [e-komponent.com](https://www.e-komponent.com/orbbec-gemini-335-depth-camera-100100476) | ~21.333 | **21.333,69** (JSON-LD) | ⚠️ Yurt Dışı 7-10 gün |
| 2b | *(Alternatif)* Robot Sepeti | 1 | robotsepeti | [robotsepeti.com](https://www.robotsepeti.com/orbbec-gemini-335-3d-stereo-derinlik-kamerasi) | ~28.246 | **28.246,91** (JSON-LD) | ✅ Stokta |
| 3 | AAXA P400 mini projektör | 1 | Teknosa | [teknosa.com](https://www.teknosa.com/aaxa-p400-1080p-kisa-mesafeli-mini-projektor-2-saat-pil-omru-p-780940335) | ~32.525 | — (JS render) | ⚠️ Canlı kontrol et |
| 4 | DisplayPort → HDMI aktif dönüştürücü | 1 | Lokal / Amazon TR | — | ~300–600 | — | Manuel bak |
| 5 | 512 GB NVMe SSD (M.2 2280) | 1 | Vatanbilgisayar | [vatanbilgisayar.com](https://www.vatanbilgisayar.com/nvme-m-2/) | ~1.500 | — (403 Cloudflare) | ⚠️ Canlı kontrol et |
| 6 | 40×40 sigma profil (160 cm) | 1 | CNC Marketi | [cnc-marketi.com](https://www.cnc-marketi.com/urun/sigma-profil-40x40-sigma-profil-8-kanal) | ~680 | **575,19/metre** → 160cm ≈ **920 TL** (JSON-LD) | ✅ Stokta |
| 7 | 20×20 V-Slot profil (60 cm) | 1 | CNC Marketi | [cnc-marketi.com](https://www.cnc-marketi.com/urun/20x20-v-slot-sigma-profil-6-kanal) | ~128 | **213,86/metre** → 60cm ≈ **128 TL** (JSON-LD) | ✅ Stokta |
| 8 | Mini V wheel kaydırıcı kiti | 1 | Robotistan | [robotistan.com](https://www.robotistan.com/pom-pulley-3d-printer-wheels) | ~300 | — (JS render) | ⚠️ Canlı kontrol et |
| 9 | Eksantrik somun (5×8.5mm) + kilit kolu | 1 set | Robolink Market | [robolinkmarket.com](https://www.robolinkmarket.com/eksantrik-somun-5x85mm-v-kanalli) | ~200 | **19,20/adet** (JSON-LD) | ⛔ STOKTA YOK |
| 10 | Altınkaya IP65 alüminyum kutu | 1 | Altınkaya | [altinkaya.com](https://www.altinkaya.com/tr/shop/category/ip65-aluminyum-kutular-130) | ~1.000 | — (USD liste, tel sor) | ⚠️ +90 312 963 1985 |
| 11 | Antireflekte akrilik/PVC optik pencere | 1 | MalzemeShop | [malzemeshop.com.tr](https://www.malzemeshop.com.tr/urun/0-50-mm-seffaf-antireflekte-pvc-levha-70x100-cm) | ~300 | **312,84 +KDV ≈ 379 TL** (text) | ✅ Stokta |
| 12 | Rijit kamera-projektör montaj plakası (lazer kesim) | 1 | CADCut | [cadcut.co](https://cadcut.co) | ~400 | — | DXF sonrası teklif |
| 13 | DC güç dağıtım / buck converter (ayarlanabilir) | 1 | Robotistan | [robotistan.com](https://www.robotistan.com/voltaj-regulator-karti) | ~400 | — (kategori sayfası) | ⚠️ Ürün seçilip kontrol et |
| 14 | 19V 7.9A 150W DC adaptör (laptop tipi) | 1 | Aykom | [aykom.com.tr](https://www.aykom.com.tr/urun/retro-acer-aspire-19v-7-9a-150w-notebook-adaptor-rna-ac04) | ~600 | **2.274,33** (CSS) | ❗ Tahminin 3.7× pahalısı |
| 15 | Tekerlekli platform / servis arabası | 1 | Trendyol | [trendyol.com](https://www.trendyol.com/acar-raf/profil-ayakli-sepet-cift-katli-tel-sepet-60x80-cm-p-333326581) | ~1.500 | **2.620,08** (JSON-LD) | ✅ Stokta — %75 pahalı |
| 16 | ArUco/ChArUco kalibrasyon plakası (A3 baskı) | 1 | Lokal baskı | [OpenCV Docs](https://docs.opencv.org/4.x/da/d13/tutorial_aruco_calibration.html) | ~100 | ~100 | Lokal baskı |
| 17 | USB-C kamera kablosu, HDMI, IP65 rakor seti | 1 set | Robotistan | [robotistan.com](https://www.robotistan.com/hdmi-cable-15-m) | ~500 | — | Canlı kontrol et |
| | | | | **TOPLAM (Tek Başlık) — Eski Tahmin** | **~80.000–82.000 TL** | | |
| | | | | **TOPLAM (Tek Başlık) — Güncel Gerçekçi** | | **~86.000–88.000 TL** | Fark: +~6.000 TL |

---

## BOM B — Üretim Birimi (Çift Başlık, Sol + Sağ)

Tek başlık prototipin üzerine eklenenler:

| # | Ek Parça | Adet | Satıcı | Link | Tahmini Fiyat (TL) |
|---|----------|------|--------|------|--------------------|
| E1 | Orbbec Gemini 335 (sağ başlık) | +1 | e-komponent | [e-komponent.com](https://www.e-komponent.com/orbbec-gemini-335-depth-camera-100100476) | ~21.333 |
| E2 | AAXA P400 mini projektör (sağ başlık) | +1 | Teknosa | [teknosa.com](https://www.teknosa.com/aaxa-p400-1080p-kisa-mesafeli-mini-projektor-2-saat-pil-omru-p-780940335) | ~32.525 |
| E3 | DisplayPort MST Hub → 2× HDMI (prototip DP dönüştürücü yerine) | 1 | Amazon TR / Lokal | — | ~800–1.200 |
| E4 | 20×20 V-Slot profil 60 cm (sağ dikey ray) | +1 | CNC Marketi | [cnc-marketi.com](https://www.cnc-marketi.com/urun/20x20-v-slot-sigma-profil-6-kanal) | ~128 |
| E5 | Mini V wheel kaydırıcı kiti (sağ başlık) | +1 | Robotistan | [robotistan.com](https://www.robotistan.com/pom-pulley-3d-printer-wheels) | ~300 |
| E6 | Eksantrik somun + kilit kolu (sağ) | +1 set | Robolink | [robolinkmarket.com](https://www.robolinkmarket.com/eksantrik-somun-5x85mm-v-kanalli) | ~200 |
| E7 | Altınkaya IP65 kutu (sağ başlık) | +1 | Altınkaya | [altinkaya.com](https://www.altinkaya.com/tr/shop/category/ip65-aluminyum-kutular-130) | ~1.000 |
| E8 | Optik pencere (sağ) | +1 | MalzemeShop | [malzemeshop.com.tr](https://www.malzemeshop.com.tr/urun/0-50-mm-seffaf-antireflekte-pvc-levha-70x100-cm) | ~300 |
| E9 | Rijit montaj plakası (sağ başlık) | +1 | CADCut | [cadcut.co](https://cadcut.co) | ~400 |
| E10 | 19V 7.9A 150W DC adaptör (2. projektör için) | +1 | Aykom | [aykom.com.tr](https://www.aykom.com.tr/urun/retro-acer-aspire-19v-7-9a-150w-notebook-adaptor-rna-ac04) | ~600 |
| | | | | **Ek maliyet (çift başlık)** | **~57.000–58.000 TL** |
| | | | | **TOPLAM (Çift Başlık Tam Birim)** | **~137.000–140.000 TL** |

---

## Maliyet Özeti

| Senaryo | Adet | Tahmini Maliyet |
|---------|------|----------------|
| Faz 1 Prototip (tek başlık) | 1 birim | ~80.000–82.000 TL |
| Üretim birimi (çift başlık) | 1 birim | ~137.000–140.000 TL |
| 8 birim üretim (çift başlık) | 8 birim | ~1.096.000–1.120.000 TL |

> **Not:** MycoSense Spotlight CHF 4.500 ≈ 190.000 TL/birim satış fiyatı.
> Bizim bileşen maliyeti ~137.000 TL → makul kar marjı için satış fiyatı
> **175.000–200.000 TL/birim** olmalı. Başlangıçta belirlenen 20.000 TL hedefi
> çift başlıklı bu sistem için geçerli değil — müşteriyle revize edilmeli.

---

## Satıcı İletişim Listesi

| Satıcı | URL | Ürün | İletişim |
|--------|-----|------|----------|
| **OpenZeka** | [openzeka.com](https://openzeka.com) | Jetson Orin Nano Super | info@openzeka.com |
| **SAMM Market** | [market.samm.com](https://market.samm.com) | Jetson Orin Nano Super | Web üzerinden |
| **e-komponent** | [e-komponent.com](https://www.e-komponent.com) | Orbbec Gemini 335 | Web üzerinden |
| **Robot Sepeti** | [robotsepeti.com](https://www.robotsepeti.com) | Orbbec Gemini 335 | Web üzerinden |
| **Teknosa** | [teknosa.com](https://www.teknosa.com) | AAXA P400 | Mağaza / web |
| **CNC Marketi** | [cnc-marketi.com](https://www.cnc-marketi.com) | V-Slot profil | Web üzerinden |
| **Robolink Market** | [robolinkmarket.com](https://www.robolinkmarket.com) | Eksantrik somun | Web üzerinden |
| **Robotistan** | [robotistan.com](https://www.robotistan.com) | Wheel kit, kablo, konvertör | Web üzerinden |
| **Altınkaya** | [altinkaya.com](https://www.altinkaya.com) | IP65 alüminyum kutu | +90 312 963 1985 |
| **MalzemeShop** | [malzemeshop.com.tr](https://www.malzemeshop.com.tr) | Optik akrilik pencere | Web üzerinden |
| **CADCut** | [cadcut.co](https://cadcut.co) | Lazer kesim montaj plakası | Web / DXF yükle |
| **Vatanbilgisayar** | [vatanbilgisayar.com](https://www.vatanbilgisayar.com) | NVMe SSD | Mağaza / web |
| **Aykom** | [aykom.com.tr](https://www.aykom.com.tr) | 19V 150W DC adaptör | Web üzerinden |

---

## Gerçek Fiyat Analizi — Scraper Bulguları (2026-05-08)

> Kaynak: `scraper-service` (JSON-LD, CSS selector, regex); 15 üründen 12'sinde veri alındı.

### Kritik Fiyat Sapmaları

| Ürün | Tahmin | Gerçek | Fark |
|------|--------|--------|------|
| 19V 150W DC adaptör (Aykom) | ~600 TL | **2.274 TL** | +%279 ❗ |
| Tekerlekli servis arabası (Trendyol) | ~1.500 TL | **2.620 TL** | +%75 ❗ |
| 40×40 sigma profil 160cm | ~680 TL | **~920 TL** (575/m) | +%35 |
| Antireflekte PVC 70×100 cm | ~300 TL | **~380 TL** (KDV dahil) | +%27 |

### Stok Uyarıları

| Ürün | Durum | Aksiyon |
|------|-------|---------|
| Jetson Orin Nano Super — OpenZeka | ⛔ STOKTA YOK | → SAMM Market'ten al (20.832 TL) |
| Eksantrik somun — Robolink Market | ⛔ STOKTA YOK | → Alternatif satıcı ara |
| Orbbec Gemini 335 — e-komponent | ⚠️ Yurt dışı 7-10 gün | → Erkenden sipariş ver |

### Adaptör Fiyatı Notu (Kritik)

Aykom'daki `RETRO Acer Aspire 19V 7.9A 150W` adaptör **2.274 TL** — bu OEM kaliteli bir üründür.  
**Öneri:** Aynı spec için Hepsiburada/Trendyol'da generic/muadil bak (genellikle 400–800 TL).  
Marka fark etmiyorsa 19V 7.9A üçüncü parti adaptörler çok daha ucuzdur.

### Manuel Kontrol Gereken Ürünler

| # | Ürün | Neden Çekilemedi |
|---|------|-----------------|
| 3 | AAXA P400 — Teknosa | JS render (fiyat SPA'da yükleniyor) |
| 5 | NVMe SSD — Vatanbilgisayar | Cloudflare 403 (bot koruması) |
| 8 | POM Pulley — Robotistan | JS render |
| 13 | Buck converter — Robotistan | Kategori sayfası, ürün seçilmeli |
| 10 | IP65 kutu — Altınkaya | USD liste fiyatı, telefon gerek |

---

## Öncelikli Aksiyonlar (Sırasıyla) — Güncel

1. **SAMM Market** → Jetson Orin Nano Super sipariş ver (**OpenZeka stokta yok**) — 20.832 TL
2. **e-komponent.com** → 2× Orbbec Gemini 335 sipariş ver (7–10 gün teslimat) — 21.334 TL/adet
3. **Teknosa** → 1× AAXA P400 canlı fiyat kontrol + al (~32.525 TL tahmin)
4. **Adaptör alternatifi** → Aykom 2.274 TL yerine Trendyol/Hepsiburada'dan 19V 150W muadil bak (~600–800 TL hedef)
5. **Robolink Market** → Eksantrik somun alternatifi ara (stokta yok, 19,20 TL/adet)
6. **Altınkaya** → 8 birim için toplu IP65 kutu fiyat teklifi al (+90 312 963 1985)
7. **Trendyol arabalığı** → 2.620 TL gerçek fiyat; bütçeye dahil et veya alternatif ara
8. **CNC Marketi** → 40×40 profil 575 TL/m onaylandı; 160cm kesim için sipariş ver (~920 TL)
9. **DisplayPort MST Hub** → Amazon TR veya lokal elektronik marketten temin et (~800–1.200 TL)
10. **CADCut** → Montaj plakası DXF dosyası hazırla, lazer kesim teklifi al
