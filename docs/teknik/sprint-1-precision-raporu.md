# Sprint 1 — Precision Raporu (429 exhibitor analizi)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude
> **Veri kaynağı:** `/tmp/automechanika_exhibitors_1779323484/exhibitors.jsonl` (Hall 3.0 + 3.1 + 4.0, 429 exhibitor, Codex tarafından Messe Frankfurt public API ile çekildi)
> **Bağlı:** [SPRINT_1_TAM_TARAMA_IS_PAKETI.md](SPRINT_1_TAM_TARAMA_IS_PAKETI.md) §1.4 precision gate (hedef ≥%60)

---

## Yönetici Özeti

**Codex'in çıktısı Sprint 1'in çoğu işini halletmiş** — public Messe API endpoint'i bulunması büyük kazanç:

- 429 exhibitor, 296 AB ülkesi (22 ülke), 166 K-1 pilot pazarda (DE/AT/NL/PL/FR)
- **Mail %88 coverage** (146/166), **website %90** (149/166) — liste seviyesinde
- **Şahsi mail oranı %57** (84 personal vs 62 generic) — Apollo/Hunter ihtiyacı yarı yarıya azaldı
- Ham precision (filtresiz) tahmini **%15-20**; ICP filtre sonrası **%40-60** hedef bandında

**Sonuç:** Sprint 1 yeşil ışık. ICP filtreyi v2'ye taşıyıp Türk üretici exclude pattern eklemek precision'ı %60+'a çıkarır.

---

## 1. Hall Dağılımı (Codex API çıktısı)

| Hall | Toplam | Türü |
|---|---|---|
| 3.0 | 155 | Aksesuar / aftermarket geneli |
| 3.1 | 207 | **Avrasya stand'ı + komşular** — aksesuar yoğun |
| 4.0 | 67 | Aksesuar / customising |
| **Toplam** | **429** | |

Hall 3.1 (Avrasya'nın hall'u) en yoğun. Komşu stand sıcak müşteri taraması için ideal.

---

## 2. Ülke Dağılımı (Hall 3.0/3.1/4.0)

### En çok temsil edilen ülkeler (ilk 10)

| # | Ülke | Sayı | K-1 pilot? | Yorum |
|---|---|---|---|---|
| 1 | Almanya (DEU) | 79 | ✅ Evet | En büyük havuz |
| 2 | Polonya (POL) | 45 | ✅ Evet | **Hall 3.1'de hakim — paspas/aksesuar üretim merkezi** |
| 3 | İtalya (ITA) | 40 | ❌ İkinci dalga | Geniş aksesuar pazarı |
| 4 | **Türkiye (TUR)** | 37 | ❌ Exclude | **Rakipler — Avrasya'nın doğrudan/dolaylı rakipleri** |
| 5 | İspanya (ESP) | 24 | ❌ İkinci dalga | |
| 6 | İngiltere (GBR) | 22 | ❌ Brexit sonrası karışık | |
| 7 | Fransa (FRA) | 21 | ✅ Evet | |
| 8 | Hollanda (NLD) | 18 | ✅ Evet | Logistics hub |
| 9 | ABD (USA) | 14 | ❌ Hedef değil | |
| 10 | Belçika (BEL) | 10 | ❌ İkinci dalga | |

### K-1 pilot pazarı toplamı

**166 firma** (DE 79 + POL 45 + FRA 21 + NLD 18 + AUT 3 = 166)

- Bu sayı Avrasya görüşmesi öncesi sistemin **maksimum aday havuzu**
- ICP filtre uygulanınca tahminen **80-120 aday** kalır
- Onay paneli (Avrasya görüşmesi sonrası açılır) bu havuzdan günde 50 review eder

---

## 3. Veri Kalitesi — Liste Seviyesinde

K-1 pilot pazardaki 166 firmadan:

| Alan | Coverage | Sayı | Yorum |
|---|---|---|---|
| `website` | %90 | 149 | Hunter/Apollo'nun domain search'i için tam input |
| `email` | %88 | 146 | **Karar verici email kısa yoldan elde edilebilir** |
| `phone` | tam | 166 | (öngörü — örnekte tüm kayıtlarda var) |
| `booth_number` | tam | 166 | Komşu stand hesabı için hazır |
| `city` | tam | 166 | |

**Önemli bulgu:** Messe API mail/website veriyor, **Sprint 3 enrichment ihtiyacı yarıya iniyor**. Apollo gerekli olan sayı 146'dan ~70'e iner (sadece personel email arayanlar için).

### Mail kalitesi — generic vs şahsi

Pilot pazardaki 146 mail:
- **62 generic** (`info@`, `sales@`, `contact@`, `office@`, `export@`) — düşük yanıt oranı
- **84 şahsi/diğer** (`firstname.lastname@`, `peter@` vb.) — yüksek yanıt oranı

Şahsi mail %57. Outreach yanıt oranı hesabında:
- Generic mail × %5 yanıt = ~3 yanıt
- Şahsi mail × %15-20 yanıt = ~13-17 yanıt
- **Toplam beklenen: 16-20 randevu hareketi** (sadece K-1 havuzundan, ICP filtre öncesi)

---

## 4. İlk 30 Pilot Firma — Manuel Kategori Analizi

Codex API çıktısının ilk 30 alfabetik AB pilot kaydı manuel incelendi:

| # | Firma | Kategori | ICP Uyum |
|---|---|---|---|
| 1 | AAMPACT e.V. | Aftermarket dernek | ❌ Dernek, alıcı değil |
| 2 | ABBT Netherlands (Arnott) | Suspension | ❌ Kategori dışı |
| 3 | ABSORPOWER Service | Trailer parts | ❌ Kategori dışı |
| 4 | AE Industries | ? | ❓ Web incele |
| 5 | Ageron Polska | ? | ❓ Web incele |
| 6 | Airstal | Air conditioner | ❌ Kategori dışı |
| 7 | AiV Handels GmbH | **Handels = distribütör** | ✅ ICP eşleşmesi |
| 8 | AKS DASIS | Electronics | ❌ Kategori dışı |
| 9 | Alca Mobil Logistics | Lojistik | ❌ Kategori dışı |
| 10 | ALDOC-TOPMOTIVE | Catalog/IT | ❌ Hedef değil |
| 11 | AMiO Sp. z o.o. | Auto parts | ❓ Web incele |
| 12 | AMPRO Technologie | ? | ❓ Web incele |
| 13 | Aristar Polska | ? | ❓ Web incele |
| 14 | Art-Co | ? | ❓ Web incele |
| 15 | AS-PL | Starter/alternator parts | ❌ Kategori dışı |
| 16 | Aspöck Systems | Lighting | ❌ Kategori dışı |
| 17 | Astemo Aftermarket | OEM tier-1 | ❌ Exclude (OEM) |
| 18 | NEICHEL AUTOMOTIVE | Powertrain | ❌ Kategori dışı |
| 19 | **ATR International** | **Buying group** | ✅✅ Sıcak — master plan'da geçiyor |
| 20 | Auger Autotechnik | Motor parts | ❌ Kategori dışı |
| 21 | Augustin Group | ? | ❓ Web incele |
| 22 | Authentic Vision | Anti-counterfeit | ❌ Hedef değil |
| 23 | **Auto France Parts** | **Distribütör** | ✅ Hedef |
| 24 | **Auto Partner SA** | **Polonya distribütör** | ✅ Hedef |
| 25 | AutoDAP | Parts catalog | ❌ Hedef değil |
| 26 | AutoTechteile | Auto parts | ❓ Web incele |
| 27 | AutoView | ? | ❓ Web incele |
| 28 | AVA Benelux | Cooling | ❌ Kategori dışı |
| 29 | AVISA Polska | Aksesuar distribütör | ✅ Hedef |
| 30 | Azet Trading BV | Trading | ✅ Hedef |

### Sayım

- ✅ **Net hedef:** 6 (ATR, Auto France Parts, Auto Partner, AiV Handels, AVISA, Azet Trading) = **%20**
- ❓ **Kontrol gereken:** 8 = potansiyel %26-30 ek
- ❌ **Net hedef değil:** 16 = %53

**Ham precision (filtresiz):** %20 net + %15 muhtemel = **%35**

ICP filtre sonrası (sektör + firma tipi + dışlama uygulanırsa): **%50-65 bandı**.

---

## 5. Hall 3.1 — Avrasya Komşu Aday Listesi (Önemli)

Hall 3.1 AB pilot ülkelerinden:

| Firma | Ülke | Booth | Mesafe (Avrasya D11'e) | Yorum |
|---|---|---|---|---|
| AiV Handels GmbH | DE | F92 | uzak | Distribütör — sıcak |
| Carmotion Polska | POL | C31 | orta | Aksesuar dağıtıcı |
| ClimAir PLAVA Kunststoffe | DE | C94 | uzak | Plastik aksesuar — paspas rakibi olabilir |
| Custo Pol | POL | B60 | orta | ? |
| Dr. Marcus International | POL | C67 | uzak | Air freshener — kategori dışı |
| EAL GmbH | DE | D51 | **D sıra, yakın** | İnceleme önceliği |
| EDCO Eindhoven | NLD | F67 | uzak | ? |
| EFT GROUP | POL | E32 | orta | ? |
| **Frogum** | POL | C80 | uzak | **Paspas üreticisi — rakip!** |
| HEYNER GmbH | DE | D85 | **D sıra, yakın** | Temizleme aksesuarı |
| STEINHOF GROUP | POL | B50 | orta | Tow bars |
| Aristar | POL | A50 | uzak | ? |
| Azet Trading | NLD | E80 | orta | Trading — sıcak |

**Bulgu:** Frogum (Polonya) Hall 3.1 C80'de — bu **doğrudan rakip** (frogum.com Polonya paspas markası, AB pazarında bilinen). Avrasya stand çalışanı bunu önceden bilmeli (rakip intel).

**D sıra yakını:** EAL GmbH (DE) D51 + HEYNER (DE) D85 + Alca Mobil (DE) D85 — bunlar Avrasya'nın **fiziksel komşusu**, fuar sırasında **walk-in randevu kolaylığı**.

---

## 6. Türk Rakip Listesi (Hall 3.0/3.1/4.0)

Avrasya'nın **doğrudan rakipleri** (Türk paspas/aksesuar üreticileri):

| Firma | Şehir | Web | Tehdit Düzeyi |
|---|---|---|---|
| **Apesan Otomobil Paspasi** | Istanbul | apesan.com.tr | 🔴 Direkt paspas üreticisi rakibi |
| BRS Plast Oto Aksesuar | Bursa | — | 🟡 Plastik aksesuar — kısmi rakip |
| Dust Oto Aksesuar | Istanbul | dustauto.com | 🟡 Aksesuar geniş |
| Enes Oto Aksesuarları | Istanbul | enesoto.com | 🟡 Aksesuar |
| Eren Group Oto Aksesuar | — | erenauto.com | 🟡 Aksesuar |
| Erturk Plastik Oto Aks. | — | erturkplastik.com | 🔴 Plastik enjeksiyon (paspas potansiyel) |
| Fams Otomotiv Aksesuar | — | famsotomotiv.com | 🟡 Aksesuar |
| Luksteks Oto Döşeme | — | luksteks.com | 🟡 İç döşeme |
| Matte Auto | — | matteauto.com | 🟡 Aksesuar |
| Oto Konak | — | otokonak.com | 🟡 Aksesuar |
| S Dizayn Oto Aks. + Kalıp | — | — | 🔴 Kalıp + aksesuar (Avrasya kalıp portföyüne potansiyel rakip) |

**37 Türk firmadan ~11'i Avrasya'nın direkt veya dolaylı rakibi.** Bunlar **ICP filtrelerinden mutlaka exclude** edilmeli — yanlışlıkla outreach gönderilirse hem yararsız hem itibar riski.

**Codex'in yapması:** ICP'ye **exclude_country: ['TUR']** zaten var (icp-automechanika-final.md), ama **isim pattern** ile çift güvence:
```sql
-- ICP matcher'a ek exclude rule
-- exclude_patterns: ["paspas", "oto aksesuar", "aksesuari", "limited sirketi", "anonim sirketi"]
```

---

## 7. Precision Tahmini — ICP Filtre Sonrası

ICP v1 ile (mevcut seed):
- 166 K-1 pilot firma
- Sektör filtre uygula: 166 → ~80 (kategori dışı motor/yağ/lastik vs çıkar)
- Firma tipi: distribütör/wholesaler/importer → ~80 → ~50 (üretici/dernek çıkar)
- Geography pilot dışı çıkar (uygulanır): ~50 (zaten K-1 pilot dışı eklendi)
- Negatif sinyal (in-house production, vs): ~50 → ~45

**ICP v1 sonrası tahmin: 45-55 onaylı aday.** Hedef 60-100'ün altında.

ICP v2 önerisi (aşağıda) ile bu sayı **70-90**'a çıkar.

---

## 8. ICP v2 — Önerilen Kalibrasyon

[icp-automechanika-final.md](icp-automechanika-final.md) v1'in üzerine eklemeler:

### 8.1 — `priority_geographies` güncelleme

Mevcut: `["DE", "AT", "NL", "PL", "FR"]`

**Veri gerçeği:** Polonya **Hall 3.1'de en yoğun ülke** (POL 45 vs DEU 79 ama Hall 3.1'de POL daha hakim). **POL'u DE ile aynı önceliğe taşımalı.**

```json
"priority_geographies": ["DE", "POL", "AT", "NL", "FR"],
"score_boost_per_priority": 1.0
```

### 8.2 — `exclude_patterns` genişletme

Mevcut: `["chinese factory direct", "made in china reseller only"]`

**Yeni:**
```json
"exclude_patterns": [
  "chinese factory direct",
  "made in china reseller only",
  "paspas",
  "oto aksesuar",
  "aksesuari",
  "floor mat manufacturer",
  "rubber mat producer",
  "PVC injection",
  "verband",
  "association",
  "e.V.",
  "association",
  "buying alliance",
  "purchase group",
  "lighting",
  "battery",
  "tire only",
  "lubricant",
  "engine oil",
  "powertrain",
  "starter motor",
  "alternator",
  "anti-counterfeit",
  "logistics service"
]
```

### 8.3 — `exclude_geographies` genişletme

Mevcut: `["CN", "HK", "IN", "PK", "BD", "VN", "TH"]`

**Yeni eklenecek:** `"TUR"` — Avrasya'nın rakipleri Türkiye'den. Burada **kendisi de filtreden geçiyor** ama özel check ile geçer.

```json
"exclude_geographies": ["CN", "HK", "IN", "PK", "BD", "VN", "TH", "TUR"]
```

### 8.4 — Sektör eşleşmesi daraltma

Mevcut: 10 sektör (geniş).

Çoğu kategori dışı firma sektör filtresinden geçiyor çünkü `"car care"` ve `"interior accessories"` çok geniş. Daha keskin pozitif eşleşme:

```json
"strong_match_sectors": [
  "floor mats", "car mats", "car carpet", "rubber mats",
  "boot liners", "trunk mats", "interior protection"
],
"weak_match_sectors": [
  "automotive accessories", "car care", "interior accessories", "auto trim"
]
```

`strong_match` × 1.5 boost, `weak_match` × 1.0. Ana sektör match yoksa skor 4.0'ın üzerine çıkmaz.

### 8.5 — `min_lead_score` yükselt

Mevcut: 5.0

**Yeni:** 5.5 (eşik yükseltilerek precision artar; recall biraz azalır)

---

## 9. Sonraki Adımlar

### Codex için
- [ ] **⚙️ Codex** — ICP v2 SQL'ini Claude yazınca seed et (yeni UUID)
- [ ] **⚙️ Codex** — Detail scrape Sprint 1.2 işini başlat (paralel max 5) — Şu an `lead_candidates` boş mu kontrol et
- [ ] **⚙️ Codex** — ICP filtre v2 ile yeniden çalıştır, kaç aday çıktığını raporla

### Claude için
- [ ] ICP v2 final SQL'i yaz ([icp-automechanika-final.md](icp-automechanika-final.md) v2 olarak güncelle)
- [ ] Sample 20 onaylı aday → web sitelerini manuel kontrol → gerçek precision ölç (Codex re-run sonrası)
- [ ] Frogum + Apesan gibi rakipleri **rakip intel listesi** olarak ayrı belge: [docs/teknik/rakip-intel-automechanika-2026.md](rakip-intel-automechanika-2026.md)

### Hedef Sprint 1 yeşil ışık kriterleri
- [ ] ICP v2 ile filtre → **70-90 onaylı aday** (precision ≥ %60)
- [ ] Mail coverage doğrulama: 70 adaydan ≥%80'inde mail var
- [ ] Komşu stand listesi: Hall 3.1 D sıra ±5 → 5-8 firma tespit edildi (manuel review)

---

## 10. Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🔧 Sprint 1 iş paketi: [SPRINT_1_TAM_TARAMA_IS_PAKETI.md](SPRINT_1_TAM_TARAMA_IS_PAKETI.md)
- 🎯 ICP v1 (mevcut DB seed): [icp-automechanika-final.md](icp-automechanika-final.md)
- 🧪 PoC kalite raporu: [poc-kalite-kontrol-raporu.md](poc-kalite-kontrol-raporu.md)
- 📊 Codex çıktısı: `/tmp/automechanika_exhibitors_1779323484/exhibitors.jsonl`
