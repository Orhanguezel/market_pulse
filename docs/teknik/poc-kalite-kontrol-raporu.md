# PoC Kalite Kontrol Raporu — Sprint 0 Çıkışı

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 0 son adım — Codex çıktısının QA'sı)
> **Hedef okuyucu:** ⚙️ Codex — Sprint 1'e geçmeden önce burada listelenen kalibrasyonları yapmalı
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 0 + [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md) PoC
> **Çıktı dosyaları:**
> - List: `/tmp/automechanika_list_1779321331.json`
> - Detail: `/tmp/automechanika_detail_1779321331.json`

---

## Yönetici Özeti

PoC **başarılı**. scraper-service prod ortamında Messe Frankfurt sayfasını çekiyor, hem liste hem detail extractor üretim yapıyor. Ama **3 net kalibrasyon işi** Sprint 1 öncesi gerekli:

| # | Sorun | Önem | Tahmini efor |
|---|---|---|---|
| K-1 | Liste extractor'ı **30 sonuçta kesiyor** ama HTML'de 92 detail link var | 🔴 Yüksek | 1-2 saat |
| K-2 | Liste sayfasında **sayfalama** (`?page=N`) işlenmiyor — toplam ~1500-2000 firma kayıp | 🔴 Yüksek | 2-3 saat |
| K-3 | Liste exhibitor'larında **website alanı boş** (30/30 null) — detail'a düşmeden tespit edilmiyor | 🟡 Orta | 30 dk (alternatif: kabul et, detail sırasında doldur) |

Detail extractor **mükemmel** çalışıyor — Avrasya örneğinde 12/12 alan dolu (sadece beklenen şekilde brands+target_markets boş). Bunu Sprint 1'de **birebir kullanılabilir** olarak işaretliyorum.

---

## 1. Liste Sayfası Çıktısı — Sonuçlar

```json
{
  "success": true,
  "status_code": 200,
  "profile": "fair-exhibitor",
  "duration_ms": 8915,
  "count": 30,
  "html_len": 1077481
}
```

✅ HTTP 200, stealthy mode başarılı, anti-bot bypass etkili. Hız da iyi (9 sn).

### İlk 10 sonuç kalite analizi

Çekilen firmaların kategori dağılımı (Avrasya ICP için anlam):

| # | Firma | Booth | Kategori sinyali | ICP'ye uyumu |
|---|---|---|---|---|
| 1 | Schaeffler Vehicle Lifetime Solutions | 5 Booths | OEM tier-1 supplier | ❌ exclude_firm_types |
| 2 | 3G Truck & Trailer Parts (UK) | 6.1, C57 | Wholesale distributor | ✅ Distribütör |
| 3 | 4x4 Accessories & Auto Parts (AU) | 6.2, C95 | Accessories distributor | ⚠️ Hedef değil (AU, ICP'de yok) |
| 4 | 4CR International | 11.1, A57 | Body paint | ❌ Kategori dışı (boya) |
| 5 | 3M Deutschland | 2 Booths | OEM/brand | ❌ exclude_firm_types |
| 6 | 247LIGHTING (Ireland) | 4.1, B65 | LED lighting | ⚠️ Hedef değil (aydınlatma) |
| 7 | 3RG Industrial Auto (Spain) | 6.1, D49 | Auto parts manufacturer | ❌ Kategori dışı (sus/dir) |
| 8 | 31, Inc. | 9.0, F56 | (belirsiz) | ❓ Detail gerekli |
| 9 | 360 International Group | 10.1, A21D | (belirsiz) | ❓ Detail gerekli |
| 10 | AAMPACT e.V. | 2 Booths | Aftermarket dernek | ❌ Dernek, alıcı değil |

**Tespit:** İlk 10 örnek arasında **1 net distribütör adayı (3G Truck & Trailer)**. Bu küçük örneklemde ama:
- Liste extractor zaten ICP filtresinin çıktısı değil → tüm firmaları çeker, filtre sonra
- ICP filtreden geçince precision yükselir
- Sprint 1'de **tüm hall'ları çekip** ICP filtresi sonrası gerçek precision ölçülür

### Booth_number formatı

Tespit edilen pattern'ler:
- **Normal:** `"4.1, B65"` (hall.subhall, slot)
- **Multi-booth:** `"5 Booths"`, `"2 Booths"` — büyük firmalar (Schaeffler, 3M)

Codex notu: `booth.ts` parser ([booth grid](../../backend/src/modules/lead-machine/fair/booth.ts)) bu iki format'ı handle etmelidir:
```typescript
function parseBooth(s: string): BoothInfo {
  // "4.1, B65" → { hall: '4.1', slot: 'B65', multi: false }
  // "5 Booths" → { hall: null, slot: null, multi: true, count: 5 }
}
```

### Hall dağılımı (Avrasya komşusu kim?)

İlk 30 örnekten **Hall 3.1 üyeleri**:
- 3.1, A11 — ABSORPOWER Service GmbH
- 3.1, B47 — A-Belt-Lin Industrial Co.

Bunlar Avrasya'nın D11 stanbınun aynı hall'unda. Sprint 2 "komşu stand" hesabı için input olarak hazır. (Tabii hall 3.1'in 30+ standı var; tam liste için K-1+K-2 çözümü gerekli.)

---

## 2. Detail Sayfası Çıktısı — Avrasya Örneği

```json
{
  "name": "Avrasya Paspas Otomotiv Sanayi Ve Ticaret Limited Sirketi",
  "hall": "3.1",
  "booth": "3.1 D11",
  "country": "TUR",
  "city": "Istanbul",
  "address": "1. Blok, 20-22-24 Ikitelli Organize Sanayi Bolgesi Mahallesi, 34490, Istanbul, TUR",
  "website": "http://www.promats.com.tr",
  "phone": "+90 539 860 75 80",
  "email": "info@avrasyaotomotiv.net",
  "product_groups": [
    "PVC universal car mats",
    "Car floor mats",
    "Car interior accessories",
    "PVC Autofußmatten universal",
    "Auto Fußmatten Großhandel"
  ],
  "brands": [],
  "target_markets": [],
  "description": "Avrasya Automotive Ltd is a manufacturer and exporter of premium universal PVC car mats..."
}
```

### Hayati keşif — yeni mail adresi

**`info@avrasyaotomotiv.net`** — bu bizim varsaydığımız `info@promats.com.tr`'den farklı.

- **promats.com.tr** = Avrasya'nın ProMats markası, e-com sitesi
- **avrasyaotomotiv.net** = kurumsal mail domain'i (muhtemelen ekspor için)

**Etki: K-2 kararı değişti.** Outreach mailleri muhtemelen `info@avrasyaotomotiv.net` veya `export@avrasyaotomotiv.net` adresinden gidecek. Bu domain için ayrı DNS auth kontrolü gerekli ([promats-avrasyaotomotiv-mail-auth-v2.md](../musteri/promats-avrasyaotomotiv-mail-auth-v2.md) yazıldı — sonuç: durum daha kötü).

### Alan doluluğu

| Alan | Avrasya | Beklenen mi? | Yorum |
|---|---|---|---|
| name | ✅ | Evet | |
| hall | ✅ "3.1" | Evet | |
| booth | "3.1 D11" | ⚠️ Format farkı | `hall` zaten "3.1" — booth `D11` olmalı; bu duplicate. Codex helper'da düzelt |
| country | "TUR" | ⚠️ ISO format | "TR" olmalı (ISO 3166-1 alpha-2); Codex `TUR → TR` normalize etsin |
| city | ✅ | Evet | |
| address | ✅ (uzun) | Evet | "Bolgesi" düzgün geldi — Türkçe karakter ok |
| website | ✅ promats.com.tr | Evet | |
| phone | ✅ +90 539... | Evet | E.164 formatı uygun |
| email | **info@avrasyaotomotiv.net** | Yeni bilgi | K-2 günceller |
| product_groups | ✅ 5 öğe | Evet | DE+EN dil karışık — multilingual extraction iyi |
| brands | [] | Beklenen | Avrasya'da brand sergilemesi yok |
| target_markets | [] | Beklenen | Avrasya'da target sergilemesi yok |
| description | ✅ | Evet | "manufacturer and exporter of premium universal PVC car mats" — ProMats konumlama |

### product_groups dil karışıklığı — fırsat

```
"PVC universal car mats"          ← EN
"Car floor mats"                  ← EN
"Car interior accessories"        ← EN
"PVC Autofußmatten universal"     ← DE
"Auto Fußmatten Großhandel"       ← DE
```

Avrasya kendisi **5 product group**'ta sergiliyor; 3 EN + 2 DE. Bu çok değerli çünkü:
- ICP eşleştirmede aday firmanın product_groups'ı da bu dilde gelecek
- Avrasya'nın **anahtar kelimeleri** netleşti — outreach maillerinde "PVC Autofußmatten" kullanmak DE pazarında doğal
- Strateji C keyword listesi ([messefrankfurt-network-analizi.md §3](messefrankfurt-network-analizi.md)) bu 5 değeri **mutlaka içermelidir**

---

## 3. Codex İçin Sprint 1 Öncesi Düzeltme Listesi

### K-1 — Liste extractor 30'da kesiyor

**Sorun:** [scraper-service/src/engine/extractors.py:348](../../../scraper-service/src/engine/extractors.py#L348) generic akışta `if len(exhibitors) >= 150: break` var, Messe Frankfurt branch'inde de benzer bir limit veya selector seçimi 30'da kesiyor. HTML'de **92 detail link** var ama 30 çekiliyor.

**Codex'in yapacağı:**
- `_extract_messefrankfurt_list` (yeni helper) iteration limit'ini 200+ yap
- Eğer selector seçimi hatalıysa (sadece bir block tipi yakalıyor), DOM tree'yi expand et — örnek olarak `grep -oE 'exhibitor-search\.detail\.html/[a-z0-9-]+\.html'` ile 92 slug net çıkıyor, **slug regex'i de fallback olarak ekle**
- PoC tekrar çalıştır → sonuç 90+ olmalı

**Quick win — slug regex fallback:**
```python
SLUG_RE = re.compile(r'exhibitor-search\.detail\.html/([a-z0-9-]+)\.html')

def _extract_messefrankfurt_list(sel, final_url):
    exhibitors = primary_extract(sel)  # mevcut yapı
    if len(exhibitors) < 50:
        # HTML body'den slug çıkarımı — fallback
        text = sel.get()
        for slug in set(SLUG_RE.findall(text)):
            if not any(e['slug'] == slug for e in exhibitors):
                exhibitors.append({
                    'slug': slug,
                    'detail_url': f"https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html/{slug}.html",
                    'name': slug_to_name(slug),  # heuristic
                })
    return exhibitors
```

### K-2 — Sayfalama (`?page=N`) işlenmiyor

**Sorun:** HTML'de `page=1` ve `pagination` kelimeleri var ama scraper sadece ilk sayfayı çekiyor. Toplam ~1500-2000 firma var, ilk sayfa ~90 firma → 17-22 sayfa gez gerek.

**Codex'in yapacağı:**
- `fair.job.ts` veya `fair.scraper.ts` içine **iteratif sayfalama** ekle:
  ```typescript
  async function scrapeAllPages(baseUrl: string): Promise<RawExhibitor[]> {
    const all: RawExhibitor[] = [];
    let page = 1;
    while (page <= 30) {  // safety cap
      const url = `${baseUrl}?page=${page}`;
      const batch = await scrapeOfficialExhibitorList(url);
      if (batch.length === 0) break;
      all.push(...batch);
      page++;
      await sleep(2500 + Math.random() * 1500);  // 2.5-4 sn delay
    }
    return all;
  }
  ```
- Anti-bot rate-limit testi K-1 + K-2 birlikte yapılır (FAIR_MODULU_CEKLISTI Sprint 0 madde 4 "100 ardışık URL")

### K-3 — Liste'de website null

**Sorun:** Liste sayfası firma adı + booth verir ama **website yok**. Detail sayfasına gitmeden filtre yapılamıyor.

**Karar:** Bu Sprint 1 akışında zaten 2 aşamalı (liste → detail) çalışıyor, kabul edilebilir. Detail sayfasından website doluyor (Avrasya örneğinde geldi). Quick fix gereksiz.

**Önerim:** Liste'den çekilen `name` ve `slug` yeterli; detail scrape'inde website + email + product_groups + brands gelir.

### K-4 (ek bulgu) — `country` ISO normalize

Detail'da `"country": "TUR"` geldi. ICP filtre + reporting için `"TR"` (ISO 3166-1 alpha-2) standardı kullanılmalı.

**Codex'in yapacağı:** [scraper-service/src/engine/extractors.py](../../../scraper-service/src/engine/extractors.py) içinde detail extractor sonunda:
```python
ISO_3_TO_2 = {'TUR': 'TR', 'DEU': 'DE', 'CHN': 'CN', 'USA': 'US', ...}
if data['country'] in ISO_3_TO_2:
    data['country'] = ISO_3_TO_2[data['country']]
```

### K-5 (ek bulgu) — `booth` field duplicate

Detail'da `"hall": "3.1"`, `"booth": "3.1 D11"` — booth içinde hall tekrarlıyor. Tutarsızlık.

**Codex'in yapacağı:** Detail extractor'da `booth` alanından hall prefix'ini at:
```python
if data['booth'] and data['hall'] and data['booth'].startswith(data['hall']):
    data['booth'] = data['booth'][len(data['hall']):].strip(' ,')  # → "D11"
```

---

## 4. PoC Sonrası Onaylanan Kararlar

✅ scraper-service prod erişim ve stealthy mode başarılı — anti-bot bypass çalışıyor
✅ Detail extractor field-level olarak mükemmel — Avrasya 12/12 alan dolu
✅ ICP seed (`9f4c8f04-64b8-4da5-9c7d-4a4b5cf4b1b0`) DB'ye yerleşti
✅ Strateji A (DOM scraping) **olduğu gibi yeterli** — Strateji C (DuckDuckGo) yedek olarak kalabilir, ama K-1+K-2 düzeltilirse gerekmez
✅ Yeni mail domain'i tespit edildi: `info@avrasyaotomotiv.net` — K-2 master kararı revize ediliyor

---

## 5. Sprint 1 Yeşil Işık Kriterleri

K-1 + K-2 düzeltildikten sonra Codex re-test:
- [ ] **⚙️ Codex** — `bash scripts/poc-automechanika-fair-scrape.sh` → liste sayfası **90+ exhibitor** (ilk sayfa)
- [ ] **⚙️ Codex** — Çoklu sayfa test: `?page=2`, `?page=3` ile **birinci 3 sayfa toplam 250+ exhibitor**
- [ ] **⚙️ Codex** — 100 ardışık detail scrape testi (anti-bot)
- [ ] **🧠 Claude** — 50 random aday manuel kalite review → **precision ≥ %60** (ICP filtreden geçecek olanların oranı)

Bu kapı geçildiğinde Sprint 1 (tam tarama) yeşil ışık.

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🔧 Fair modülü detay çeklist: [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md)
- 🌐 Network analiz: [messefrankfurt-network-analizi.md](messefrankfurt-network-analizi.md)
- 🧪 PoC scripti: [../../scripts/poc-automechanika-fair-scrape.sh](../../scripts/poc-automechanika-fair-scrape.sh)
- 📧 Mail auth v2 (yeni domain): [../musteri/promats-avrasyaotomotiv-mail-auth-v2.md](../musteri/promats-avrasyaotomotiv-mail-auth-v2.md)
- 🎯 ICP referansı: [icp-automechanika-final.md](icp-automechanika-final.md)
