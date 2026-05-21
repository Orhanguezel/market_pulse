# Messe Frankfurt Network & DOM Analizi — Automechanika 2026

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 0 keşif görevi)
> **Hedef okuyucu:** ⚙️ Codex — scraper-service `fair-exhibitor` ve yeni `fair-exhibitor-detail` extractor'larını kalibre edecek
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 0

---

## TL;DR — Codex için karar

| Strateji | Test edildi | Durum | Codex'in yapacağı |
|---|---|---|---|
| **B** — Internal JSON API (XHR endpoint) | `.json`, `.infinity.json`, `.detail.json` selector'ları | ❌ 404 | Tarayıcıdan canlı XHR keşfi gerekli — bu rapor kapsamında değil. Headless Playwright session aç, Network panel'de fetch trafiğini gözle yakala |
| **A** — DOM scraping (stealthy + selectors) | Liste sayfası WebFetch'e boş döndü, JS render gerekiyor | ⚠️ Playwright stealthy zorunlu | Liste sayfasının client-side render ettiğini varsay; Playwright ile gerçek HTML al, selector setini ham HTML'den çıkar |
| **C** — DuckDuckGo HTML site search ile URL toplama | ✅ Çalıştı, ürün/keyword bazlı detail URL listesi çekti | ✅ Hazır | Anahtar kelime bazlı detail URL toplama job'ı yaz. Coverage tam değil ama hızlı başlangıç sağlar |

**Önerilen sıra:** C → A → B
- **C** Sprint 0'da çalıştırılabilir, Sprint 1'in tarama başlangıcını hızlandırır
- **A** Sprint 0'ın paralelinde Codex Playwright ile selector kalibrasyonu yapar (1-2 gün)
- **B** XHR keşfi opsiyonel — A çalışırsa zorunlu değil

---

## 1. Site Karakteristiği

### Backend
Asset path'lerinden tespit edildi: `/content/dam/messefrankfurt-redaktion/`

- Bu **Adobe Experience Manager (AEM)** karakteristik path'i (`dam` = Digital Asset Management)
- AEM siteleri tipik olarak server-side render eder + dinamik bileşenler için Sling Model JSON endpoint'leri açabilir
- Standart AEM JSON selector'ları (`.json`, `.infinity.json`, `.tidy.json`) **bu sitede kapalı** — 404 dönüyor
- "nmedia.hub shop" referansı detail sayfada görüldü — Messe Frankfurt'un kendi exhibitor management platformu; muhtemelen ayrı bir backend servis

### Anti-bot / WAF
- WebFetch ile düz `GET` istekleri **render edilmiş HTML döndürmüyor** — sadece iskelet
- DuckDuckGo HTML (sade arayüz) çalışıyor ama Google ve Bing site search **CAPTCHA** atıyor
- WAF muhtemelen Cloudflare veya Akamai — Playwright stealthy mod ve realistic UA zorunlu
- Rate limit testi yapılmadı; **100 ardışık URL'lik bir test Sprint 0 sonunda Codex tarafında yapılmalı**

### Robots / Sitemap
- `/robots.txt` → 404
- `/sitemap.xml` → 404
- `/frankfurt/en/sitemap.html` → 404

Sitemap yok, robots yok. Site arama indexi için kendi search arayüzüne güveniyor.

---

## 2. Detail URL Yapısı (Strateji C için kritik)

DuckDuckGo HTML site search ile çıkarılan örnekler:

### Pattern 1 — Kısa form (en yaygın)
```
/frankfurt/en/exhibitor-search.detail.html/{slug}.html
```
Örnekler:
- `hromtech-gmbh.html`
- `apesan-otomobil-paspasi-sanayi-ve-ticaret-limited-sirketi.html`
- `avrasya-paspas-otomotiv-sanayi-ve-ticaret-limited-sirketi.html`
- `gumarny-zubri-as.html`
- `hans-pries-gmbh-co-kg.html`
- `huzhou-sanjing-auto-parts-co-ltd.html`
- `ningbo-etdz-victor-enterprise-international-co--ltd.html`

Slug = firma adı lowercase + Türkçe karakterler decompose + boşluklar `-` + nokta/virgül `--` veya `-`.

### Pattern 2 — Uzun form (Çin/Asya firmaları için tipik)
```
/frankfurt/en/exhibitor-search.detail.html/{slug}/mf_1_<id1>_<id2>_<id3>.html
```
Örnekler:
- `koeng-co-ltd/mf_1_0015025959_5210361_10000007202601.html`
- `update-industry-wuhu-co-ltd/mf_1_0052427291_5240176_10000007202601.html`

`mf_1_<id1>_<id2>_<id3>`:
- `id1` (10 hane): muhtemelen firma global ID (Messe Frankfurt CRM ID)
- `id2` (7 hane): hall/event spesifik ID
- `id3` (14 hane): event year code (`10000007202601` = 2026 kodu olabilir)

Codex notu: **iki pattern'i de regex'le yakala**, normalize et:
```typescript
const SHORT = /\/exhibitor-search\.detail\.html\/([^\/]+)\.html$/;
const LONG  = /\/exhibitor-search\.detail\.html\/([^\/]+)\/(mf_\d+_\d+_\d+_\d+)\.html$/;
```

---

## 3. Strateji C — DuckDuckGo HTML üzerinden URL toplama (somut)

### Çalıştığı doğrulandı
```bash
# WebFetch ile çalışan format
https://html.duckduckgo.com/html/?q=site%3Aautomechanika.messefrankfurt.com+exhibitor-search.detail.html+<keyword>
```

### Avrasya için kritik bulgular (floor mat keyword'üyle)
İlk taramada şu firmalar çıktı — **bunlar Avrasya'nın doğrudan rakipleri veya komşuları**:

| Firma | Ülke | Kategori sinyali | Avrasya'ya konum |
|---|---|---|---|
| Apesan Otomobil Paspası San. Tic. | TR | Paspas (paspaslı firma) | 🔴 Doğrudan rakip — Hall 3.1 komşu olabilir |
| Avrasya Paspas | TR | Paspas | (kendisi) |
| Gumárny Zubří a.s. | CZ | Lastik/oto aksesuar | 🟡 Potansiyel partner veya rakip |
| Hromtech GmbH | DE | Auto parts | 🟢 Potansiyel müşteri (distribütör adayı) |
| Hans Pries GmbH & Co. KG | DE | Auto parts dağıtıcı | 🟢 Potansiyel müşteri |
| Huzhou Sanjing Auto Parts | CN | Çin üreticisi | ⚫ Hedef değil (üretici rakibi) |
| Ningbo ETDZ Victor | CN | Çin ihracatçısı | ⚫ Hedef değil |
| Koeng Co Ltd | (muhtemelen KR/CN) | Auto parts | 🟡 Belirsiz |
| Update Industry Wuhu | CN | Çin üreticisi | ⚫ Hedef değil |

**Sinyal:** İlk 10 sonuçtan **2 sıcak distribütör adayı** çıktı (Hromtech, Hans Pries). Bu **C stratejisinin Sprint 1'i hızlıca başlatabileceğinin** kanıtı.

### Codex için iş paketi (C stratejisi)
1. Keyword listesi tanımla (en az 15): `floor mat`, `car mat`, `car carpet`, `rubber mat`, `automotive accessories`, `interior accessories`, `boot liner`, `trunk mat`, `auto trim`, `car care distributor`, `aftermarket distributor`, `aftermarket retailer`, `auto parts wholesaler`, `car accessories importer`, `tuning shop chain`
2. Her keyword için DuckDuckGo HTML site search → 50-100 URL/keyword (paginate)
3. Tüm URL'leri normalize + dedupe → tahmini 500-1000 benzersiz detail URL
4. Detail URL'leri scraper-service `fair-exhibitor-detail` profili ile tek tek scrape
5. ICP filtresi → `lead_candidates`

### Riskler
- DuckDuckGo da rate limit uygulayabilir — 2-5 sn delay, en kötü ihtimalle 1 dk
- Coverage **kısmidir** — fuara katılan ama bu keyword'lerde indexlenmemiş firmalar atlanır
- **Bu yüzden Strateji A paralel çalıştırılır** — full liste için DOM scraping kaçınılmaz

---

## 4. Strateji A — DOM scraping kalibrasyonu

WebFetch düz GET ile liste sayfası boş döndüğünden Playwright zorunlu. Codex'in yapacağı:

### 4.1 Manuel headless oturum açma
```bash
# scraper-service üzerinden test
curl -X POST "${SCRAPER_SERVICE_URL}/api/v1/scrape" \
  -H 'content-type: application/json' \
  -d '{
    "url": "https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.html",
    "mode": "stealthy",
    "profile": "fair-exhibitor",
    "return_html": true,
    "return_text": false,
    "options": {
      "wait_for_selector": "[class*=\"result\"], [class*=\"exhibitor\"], [class*=\"card\"]",
      "wait_ms": 10000,
      "scroll_to_bottom": true
    }
  }' | jq '.html | length, .data.count'
```

### 4.2 HTML'den selector çıkarımı
- `.html`'yi dosyaya al, `grep -oE 'class="[^"]*exhibitor[^"]*"'` ile gerçek class'ları çıkar
- Tipik AEM bileşen adı: `exhibitor-list`, `exhibitor-tile`, `mfd-search-result-item` veya benzeri
- Sayfalama: ya "load more" butonu (intersection observer ile JS), ya da `?p=2` URL parametresi
- Filter çubuğu: kategori/hall/ülke için query parametre tespiti

### 4.3 Codex'in [scraper-service/src/engine/extractors.py:333](../../../scraper-service/src/engine/extractors.py#L333) içine ekleyeceği
```python
def _extract_messefrankfurt_list(sel: Selector, final_url: str) -> list[dict[str, Any]]:
    """
    Automechanika ve diğer Messe Frankfurt exhibitor listing sayfaları için
    domain-spesifik extractor. AEM tabanlı, JS render gerektirir.
    """
    exhibitors: list[dict[str, Any]] = []
    # Codex burayı kalibrasyon sonrası gerçek CSS selector'larıyla doldurur:
    # for node in sel.css(".SOMETHING-FROM-CALIBRATION"):
    #     ...
    return exhibitors


def extract_fair_exhibitor(html: str, url: str, response: Any) -> dict[str, Any]:
    sel = Selector(html or "", url=url)
    final_url = getattr(response, "url", url) or url
    # Domain-spesifik path
    if "messefrankfurt.com" in final_url:
        exhibitors = _extract_messefrankfurt_list(sel, final_url)
    else:
        # mevcut generic akış
        exhibitors = _extract_generic_listing(sel, final_url)
    return {
        "profile": "fair-exhibitor",
        "url": url,
        "final_url": final_url,
        "count": len(exhibitors),
        "exhibitors": exhibitors,
    }
```

### 4.4 Detail sayfa profili — `fair-exhibitor-detail` (yeni)
Avrasya detail sayfasından çıkarılması gereken alanlar (manuel doğrulanmış):

| Alan | Avrasya örnek değer | DOM/JS render? |
|---|---|---|
| `name` | "Avrasya Paspas Otomotiv Sanayi Ve Ticaret Limited Sirketi" | SSR (HTML'de var) |
| `hall` | "3.1" | SSR |
| `booth` | "D11" | SSR |
| `country` | "Türkiye" | SSR |
| `city` | "Istanbul" | SSR |
| `address` | "1. Blok, 20-22-24 Ikitelli OSB Mahallesi, 34490 Istanbul" | SSR |
| `website` | "http://www.promats.com.tr" | SSR |
| `phone` | "+90 539 860 75 80" | SSR |
| `email` | (yok) | — |
| `product_groups[]` | (WebFetch'e gelmedi — JS render) | ⚠️ Stealthy gerekli |
| `brands[]` | (aynı) | ⚠️ Stealthy gerekli |
| `target_markets[]` | (aynı) | ⚠️ Stealthy gerekli |
| `description` | (aynı) | ⚠️ Stealthy gerekli |
| `trade_audience[]` | (aynı) | ⚠️ Stealthy gerekli |

Yani **SSR alanları** (temel iletişim + booth) düz HTTP fetch'le bile alınabilir. **JS render alanları** (ürün/marka/açıklama) Playwright zorunlu. Codex stealthy mode'da `wait_for_selector` ile ürün listesi DOM'a girene kadar bekleyecek.

---

## 5. Strateji B — Internal XHR (opsiyonel, ileride)

Bu rapor kapsamında **denenemedi** çünkü tarayıcı session erişimi yok. Codex isterse:

```
# Playwright session başlat, Network panel'i etkinleştir
# https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.html sayfasını aç
# Sayfa yüklenirken Network'te XHR/Fetch trafiğini gözle:
#   - /api/* ile başlayan istekler
#   - .json döndüren responseler
#   - nmedia.hub veya benzeri 3. taraf endpoint çağrıları
```

Eğer bir JSON endpoint bulunursa — örn. `https://nmedia.hub/api/v2/exhibitors?event=automechanika-2026` gibi — bu **altın madeni** olur. Sayfalama, filtreleme, tam veri seti tek istekte gelebilir.

**Codex'e öneri:** Sprint 0 Strateji A çalışırsa B'yi atla. Çalışmazsa veya yetersiz coverage verirse 1 günlük B keşfine yatırım yap.

---

## 6. Kalibrasyon Test Setçesi (Sprint 0 sonunda Codex bunu çalıştırır)

Üç doğrulama:

### 6.1 Liste sayfası
- [ ] **⚙️ Codex** — `scripts/poc-automechanika-fair-scrape.sh` (mevcut PoC) çalıştır
- [ ] Liste sayfasından ≥10 firma adı + URL çekiyor mu doğrula
- [ ] Eğer 0 çekiyorsa Strateji A'nın selector kalibrasyonu eksik → bu raporun §4.2 adımı

### 6.2 Detail sayfası
- [ ] **⚙️ Codex** — Avrasya detail URL ile detail scrape test:
  - Beklenen alanlar (hall, booth, address, phone) gelmeli — bunlar SSR
  - Beklenen ek alanlar (product_groups) gelmeli — bunlar Playwright gerektirir
- [ ] Tüm 13 alanı 1 sayfa üzerinde çıkarabiliyor musun doğrula

### 6.3 Strateji C — keyword toplama
- [ ] **⚙️ Codex** — Tek keyword (`floor mat`) ile DuckDuckGo HTML site search → URL listesi al
- [ ] Pattern 1 ve Pattern 2'yi (§2) regex'le ayrıştır
- [ ] Sonuç ≥10 URL ise C stratejisi Sprint 1 için kullanılabilir

### Beklenen kalite kapısı
| Strateji | Sprint 0 sonunda olması gereken |
|---|---|
| A — Liste DOM | Liste sayfasından **en az 20 firma** çekiyor olmalı |
| A — Detail DOM | Avrasya detail sayfasından **9/13 alan** çekiyor olmalı (en azından SSR alanları) |
| C — Keyword | 1 keyword ile **en az 10 URL** çekiyor olmalı |

Bunların hepsi geçtiyse Sprint 1 (tam tarama) yeşil ışık.

---

## 7. Bağlantılar

- 📋 Ana çeklist: [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🔧 Teknik detay çeklist: [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md)
- 🧪 PoC scripti: [scripts/poc-automechanika-fair-scrape.sh](../../scripts/poc-automechanika-fair-scrape.sh)
- 📐 scraper-service extractor: [../scraper-service/src/engine/extractors.py:333](../../../scraper-service/src/engine/extractors.py#L333)
- 👤 Avrasya örnek aday: [../musteri/avrasya-paspas-automechanika.md](../musteri/avrasya-paspas-automechanika.md)
