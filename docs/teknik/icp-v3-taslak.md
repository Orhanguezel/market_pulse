# ICP v3 — Taslak Öneri (Sprint 1 Sonu Baseline)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude
> **Durum:** **Taslak** — Avrasya onaylı adayları + red pattern'ları gözden geçirdikten sonra finalize edilecek
> **Bağlı:** [icp-automechanika-final.md](icp-automechanika-final.md) (v1 + v2) + [sprint-1-precision-raporu.md](sprint-1-precision-raporu.md)

---

## ICP v3 ne zaman çıkar

- ✅ v1 — Avrasya görüşmesi öncesi varsayım (Claude tahmini)
- ✅ v2 — Sprint 1 sonrası 429 firma analizine göre (Polonya hakimiyeti, Türk üretici exclude)
- 🟡 **v3 — Sen panel'de onayla/reddet yaptıktan sonra `lead_rejection_patterns` agregatına göre**

Bu belge **v3 için baseline öneri** — Codex'in agregat job'u dolduğunda otomatik güncellenecek. Şu an manuel olarak Sprint 1 çıktısından öğrenilenleri ICP'ye yansıtıyoruz.

---

## v2'den v3'e — Net Değişiklikler

### 1. Domain substring filtresi → genişletilecek

v2'ye Python import'ta eklendi (`reachcooling.com` gibi) — ICP'ye de yazılmalı ki Codex'in fair.job.ts'i kullansın.

```json
"exclude_domain_substrings": [
  "cooling","battery","lighting","lubricant","tire","reifen","oil",
  "brake","gasket","powertrain","starter","alternator","filter",
  "audio","diagnos","welding","paint","trailer","clutch","steering",
  "turbo","clutch","windshield","glass","fragrance","perfume","duft"
]
```

**Sebep:** Reach Europe `reachcooling.com` v2'de "cooling" kelime sınırı (`\b`) ile yakalanamıyordu çünkü "reachcooling" tek tokendı.

### 2. OEM tier-1 firmalar açıkça exclude

Sprint 1 manuel review'da çıkan büyük OEM grupları:

```json
"exclude_brands": [
  "thyssenkrupp","schaeffler","bosch","valvoline","continental",
  "zf friedrichshafen","denso","hitachi","dana","astemo","borgwarner",
  "jtekt","eaton","aisin","sampa","mahle","federal-mogul"
]
```

Firma adında **substring olarak** geçerse skor -3.0 ve düşük öncelik.

### 3. Lojistik / IT / katalog şirketleri exclude

```json
"exclude_business_models": [
  "logistic","spedition","catalog only","catalog software",
  "anti-counterfeit","verification","insurance","versicherung",
  "training","education","media","marketing agency",
  "consulting","financial","banking","fintech"
]
```

### 4. Pozitif sinyal kelimeleri (skor +1)

```json
"positive_keywords_v3": [
  "handels","großhandel","grosshandel","distrib","wholesale",
  "import","export","trading",
  "aftermarket","accessor","aksesuar",
  "interior","innenraum","auto.*partner","auto.*parts"
]
```

### 5. **Yeni alan: `business_model_signals`**

v3'te firma adından yapılan **business model çıkarımı** ICP'ye girer:

```json
"business_model_signals": {
  "distributor": ["handels","distrib","wholesale","großhandel","trading","aftermarket"],
  "manufacturer": ["produktion","factory","manufacture","üretim","fabryka"],
  "oem_tier1": ["thyssenkrupp","schaeffler","bosch","continental","zf"],
  "ecom": ["amazon","ebay","shop","store","online"],
  "buying_group": ["group","alliance","cooperative","partnership","union"]
}
```

ICP filtreden geçişte aday'a **business_model** etiketi atanır:
- `distributor` → +2 skor, ICP eşleşmesi güçlü
- `oem_tier1` → -3 skor, hedef değil
- `manufacturer` → -2 skor (kendi üretimi var, paspas alıcısı değil)
- `ecom` → +1 skor
- `buying_group` → +3 skor (en sıcak — birden fazla bayi açar)

### 6. Skor eşikleri sıkılaştırma

| ICP | min_lead_score | auto_approve_threshold |
|---|---|---|
| v1 | 5.0 | yok |
| v2 | 5.5 | 7.0 |
| **v3** | **6.0** | **7.5** |

Sebep: v2 ile 120 aday çıktı, **42'si APPROVE_DIRECT/FAVORITE** (auto-onayladık), kalan 78 düşük öncelik. v3 ile bu eşiği daraltırsak Hall 8 (customising) taraması açtığımızda daha az çöp gelir.

### 7. **Yeni:** Komşu stand bonusu skor ağırlığı artırıldı

v2: `neighbor_bonus: +0.5`
**v3: `neighbor_bonus: +1.0`** — fuar haritasında ±5 stand mesafedeki adaylar **fiziksel walk-in olasılığı** yüksek.

---

## ICP v3 — Tam SQL (Codex seed için)

```sql
-- v2'yi pasif yap
UPDATE icp_profiles SET is_active = 0
  WHERE name = 'Automechanika 2026 — Paspas/Oto Aksesuar Alıcısı (v2)';

INSERT INTO icp_profiles (id, name, is_active, definition) VALUES (
  UUID(),
  'Automechanika 2026 — Paspas/Oto Aksesuar Alıcısı (v3)',
  1,
  JSON_OBJECT(
    'version', 3,
    'parent_version', 2,
    'fair', JSON_OBJECT(
      'name', 'Automechanika Frankfurt 2026',
      'dates', '2026-09-08/2026-09-12',
      'host_exhibitor', JSON_OBJECT(
        'name', 'Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti.',
        'brand', 'ProMats',
        'hall', '3.1',
        'booth', 'D11',
        'exclude_self_pattern', 'avrasya'
      )
    ),
    'strong_match_sectors', JSON_ARRAY(
      'floor mats','car mats','car carpet','rubber mats',
      'boot liners','trunk mats','interior protection'
    ),
    'weak_match_sectors', JSON_ARRAY(
      'automotive accessories','car care','interior accessories','auto trim'
    ),
    'firm_types', JSON_ARRAY(
      'distributor','importer','wholesaler','e-commerce seller','buying group',
      'aftermarket retailer','tuning shop chain','auto parts catalog company',
      'handelsgesellschaft','trading'
    ),
    'geographies', JSON_ARRAY(
      'DE','POL','AT','NL','FR','BE','CZ','IT','ES','GB',
      'RO','HU','SK','SE','DK','NO','FI','CH','GR','BG','PT','IE'
    ),
    'priority_geographies', JSON_ARRAY('DE','POL','AT','NL','FR'),
    'priority_boost', 1.0,
    'sales_types', JSON_ARRAY('B2B','B2B2C','B2C'),
    'sales_channels', JSON_ARRAY(
      'own website','amazon','ebay','kaufland','otto','cdiscount','fruugo',
      'wholesale catalog','retail chain','tuning chain'
    ),
    'price_segment', 'mid',
    'annual_revenue_min_eur', 500000,

    -- v3 yeni: domain substring eleme
    'exclude_domain_substrings', JSON_ARRAY(
      'cooling','battery','lighting','lubricant','tire','reifen','oil',
      'brake','gasket','powertrain','starter','alternator','filter',
      'audio','diagnos','welding','paint','trailer','clutch','steering',
      'turbo','windshield','glass','fragrance','perfume','duft'
    ),
    -- v3 yeni: OEM tier-1 brand exclude
    'exclude_brands', JSON_ARRAY(
      'thyssenkrupp','schaeffler','bosch','valvoline','continental',
      'zf friedrichshafen','denso','hitachi','dana','astemo','borgwarner',
      'jtekt','eaton','aisin','sampa','mahle','federal-mogul'
    ),
    -- v3 yeni: business model çıkarımı
    'business_model_signals', JSON_OBJECT(
      'distributor', JSON_ARRAY('handels','distrib','wholesale','großhandel','trading','aftermarket'),
      'manufacturer', JSON_ARRAY('produktion','factory','manufacture','üretim','fabryka'),
      'oem_tier1', JSON_ARRAY('thyssenkrupp','schaeffler','bosch','continental','zf'),
      'ecom', JSON_ARRAY('amazon','ebay','shop','store','online'),
      'buying_group', JSON_ARRAY('group','alliance','cooperative','partnership','union','federation')
    ),
    'business_model_score_modifiers', JSON_OBJECT(
      'distributor', 2.0,
      'oem_tier1', -3.0,
      'manufacturer', -2.0,
      'ecom', 1.0,
      'buying_group', 3.0
    ),

    'exclude_firm_types', JSON_ARRAY(
      'manufacturer (own production)','OEM tier-1 supplier','single car brand official dealer',
      'raw material supplier','tooling supplier','association','e.V.','verband',
      'buying alliance non-purchase','logistics service','catalog/IT only',
      'anti-counterfeit','starter/alternator only'
    ),
    'exclude_sectors', JSON_ARRAY(
      'engine oil only','lubricants only','battery only','tire only',
      'electronic parts only','mechanical parts only','suspension only',
      'air conditioner only','lighting only','cooling only','trailer parts only',
      'powertrain only','starter motor','alternator','catalog software only'
    ),
    'exclude_patterns', JSON_ARRAY(
      'chinese factory direct','made in china reseller only',
      'paspas','oto aksesuar','aksesuari','floor mat manufacturer',
      'rubber mat producer','PVC injection production',
      'verband','e.V.','association','buying alliance',
      'logistics service','anti-counterfeit'
    ),
    'exclude_geographies', JSON_ARRAY('CN','HK','IN','PK','BD','VN','TH','TUR'),

    'positive_signals', JSON_ARRAY(
      'private label interest','ODM partnership signals','european-made preference',
      'amazon FBA seller','multi-brand catalog','stocking distributor',
      'handelsgesellschaft','großhandel','wholesale'
    ),
    'negative_signals', JSON_ARRAY(
      'in-house production line','patent on floor mat manufacturing',
      'established china supplier chain','single OEM contract revenue >70%',
      'air freshener only','perfume product only'
    ),

    'scoring_weights', JSON_OBJECT(
      'strong_sector_match', 0.35,
      'weak_sector_match', 0.10,
      'firm_type_match', 0.25,
      'geography_match', 0.15,
      'priority_geo_bonus', 0.10,
      'channel_match', 0.05,
      'positive_signal', 0.10,
      'negative_signal', -0.20,
      'neighbor_bonus', 1.0  -- v3: 0.5 → 1.0
    ),

    'min_lead_score_for_candidate', 6.0,   -- v2: 5.5 → 6.0
    'auto_approve_threshold', 7.5           -- v2: 7.0 → 7.5
  )
);
```

---

## Test Senaryosu (v3 seed sonrası)

Codex v3'ü seed ettikten sonra `fair.job.ts`'i yeniden çalıştırır. Beklenen sonuçlar:

| Metrik | v2 | v3 (tahmin) |
|---|---|---|
| Hall 3.0/3.1/4.0 onaylı aday | 120 | **80-95** |
| APPROVE_DIRECT + FAVORITE | 21 | **30-40** (eşik daha sıkı ama domain/brand exclude daha temiz) |
| LOW_PRIORITY | 69 | **40-50** |
| **Toplam mail kuyruğu** | 110 | **70-90** |

Hedef: **precision %75+, recall %60+** (v2 precision ~60%).

---

## Codex İçin Aksiyonlar

- [ ] **⚙️ Codex** — Yukarıdaki SQL'i `backend/src/db/seed/sql/019_icp_v3_seed.sql` olarak ekle (CLAUDE.md ALTER kuralı — seed dosyası, ALTER yok)
- [ ] **⚙️ Codex** — `icp.matcher.ts` v3 alanlarını destekle:
  - `exclude_domain_substrings` — domain'i `email + website` ile substring check
  - `exclude_brands` — firma adında brand pattern arar
  - `business_model_signals` — model classification + skor modifier
- [ ] **⚙️ Codex** — Mevcut `lead_candidates`'a v3 ile yeniden değerlendirme:
  ```sql
  UPDATE lead_candidates
  SET status='auto_reject', reject_reason='ICP v3 yeniden değerlendirme'
  WHERE channel='trade_fair'
    AND status='pending'
    AND id NOT IN (yeni v3 filtresinden geçenler);
  ```

---

## Bağlantılar

- 📋 ICP v1 + v2 referansı: [icp-automechanika-final.md](icp-automechanika-final.md)
- 📊 Sprint 1 precision raporu: [sprint-1-precision-raporu.md](sprint-1-precision-raporu.md)
- 🐍 Python import script (referans): [../../scripts/import-automechanika-to-db.py](../../scripts/import-automechanika-to-db.py)
- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
