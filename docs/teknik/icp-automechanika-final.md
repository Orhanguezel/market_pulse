# ICP — Automechanika 2026 — Paspas/Oto Aksesuar Alıcısı (Final)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 0 Avrasya ICP review çıktısı — Avrasya görüşmesi bekleniyor; bu **draft v1** Codex'in seed dosyasına koyabileceği biçimde hazırlanmıştır)
> **Hedef okuyucu:** ⚙️ Codex — `icp_profiles` tablosuna INSERT'lecek (Sprint 0 — "Avrasya ICP'sini DB'ye seed et")
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 0

---

## Versiyonlama

- **v1** (2026-05-21) — Claude'un master plan + Avrasya public bilgisi + Strateji C ön bulgularıyla hazırladığı taslak
- **v2** (2026-05-21, bu güncelleme) — **Codex'in 429 exhibitor API çıktısı + precision raporu** sonrası Polonya hakimiyeti + Türk üretici exclude pattern + sektör daraltma. Avrasya görüşmesi henüz yapılmadı (gerek olmadan ilerlendi).
- **v3** (Sprint 1 sonrası, ileride) — ilk 100 aday review'undan çıkan red pattern'lara göre kalibre

**Codex v2 ile yeniden seed eder, eski v1 satırını `is_active=0` yapar.**

---

## Final ICP — JSON

```json
{
  "name": "Automechanika 2026 — Paspas/Oto Aksesuar Alıcısı",
  "is_active": 1,
  "definition": {
    "version": 1,
    "fair": {
      "name": "Automechanika Frankfurt 2026",
      "dates": "2026-09-08/2026-09-12",
      "host_exhibitor": {
        "name": "Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti.",
        "brand": "ProMats",
        "hall": "3.1",
        "booth": "D11"
      }
    },
    "sectors": [
      "automotive accessories",
      "car care",
      "floor mats",
      "car mats",
      "car carpet",
      "interior accessories",
      "boot liners",
      "trunk mats",
      "auto trim",
      "rubber mats"
    ],
    "firm_types": [
      "distributor",
      "importer",
      "wholesaler",
      "e-commerce seller",
      "buying group",
      "aftermarket retailer",
      "tuning shop chain",
      "auto parts catalog company"
    ],
    "geographies": [
      "DE", "AT", "NL", "PL", "FR",
      "BE", "CZ", "IT", "ES", "UK",
      "RO", "HU", "SK", "SE", "DK",
      "NO", "FI", "CH", "GR", "BG",
      "PT", "IE"
    ],
    "priority_geographies": ["DE", "AT", "NL", "PL", "FR"],
    "sales_types": ["B2B", "B2B2C", "B2C"],
    "sales_channels": [
      "own website",
      "amazon",
      "ebay",
      "kaufland",
      "otto",
      "cdiscount",
      "fruugo",
      "wholesale catalog",
      "retail chain",
      "tuning chain"
    ],
    "price_segment": "mid",
    "company_size_min": "small",
    "company_size_max": "enterprise",
    "annual_revenue_min_eur": 500000,
    "exclude_firm_types": [
      "manufacturer (own production)",
      "OEM tier-1 supplier",
      "single car brand official dealer",
      "raw material supplier",
      "tooling supplier"
    ],
    "exclude_sectors": [
      "engine oil only",
      "lubricants only",
      "battery only",
      "tire only",
      "electronic parts only",
      "mechanical parts only"
    ],
    "exclude_patterns": [
      "chinese factory direct",
      "made in china reseller only"
    ],
    "exclude_geographies": [
      "CN", "HK", "IN", "PK", "BD", "VN", "TH"
    ],
    "positive_signals": [
      "private label interest",
      "ODM partnership signals",
      "european-made preference",
      "amazon FBA seller",
      "multi-brand catalog",
      "stocking distributor"
    ],
    "negative_signals": [
      "in-house production line",
      "patent on floor mat manufacturing",
      "established china supplier chain",
      "single OEM contract revenue >70%"
    ],
    "scoring_weights": {
      "sector_match": 0.30,
      "firm_type_match": 0.25,
      "geography_match": 0.20,
      "channel_match": 0.10,
      "positive_signal": 0.10,
      "negative_signal": -0.15
    },
    "min_lead_score_for_candidate": 5.0
  }
}
```

---

## Açıklamalar — neden böyle

### Sektörler
- Avrasya'nın ProMats markası floor mat üretiyor. Ana hedef sektör floor/car/carpet/rubber mat
- Komşu sektörler dahil edildi (interior accessories, boot liners, trunk mats) çünkü Avrasya bu kategorilere genişleyebilir veya bu kategorilerin distribütörü Avrasya'nın paspasını da raflarına alabilir
- "auto trim" geniş bir terim — distribütörlerin web sitelerinde sıkça geçer

### Firma tipleri
- **Distribütör + ithalatçı + toptancı**: ana hedef. Bu firmaların kendi üretimi yok, raflarına ürün arıyorlar
- **E-commerce seller**: Amazon FBA, Otto, Kaufland'da satıcı olan firmalar — paspas private label fırsatı
- **Buying group**: AB'de auto parts buying group'ları var (örn. ATR International, Temot, Group Auto Union); tek firma anlaşması 50+ küçük distribütörü açar
- **Tuning shop chain**: aksesuar ağırlıklı zincirler — Avrasya'nın "trim-kit" ürünleri için
- **Auto parts catalog company**: Hans Pries gibi — örnek olarak Strateji C'de çıktı

### Coğrafyalar
- 22 AB ülkesi (Birleşik Krallık dahil) — geniş başla, performansa göre dar
- **5 öncelikli (K-1):** DE, AT, NL, PL, FR — pilot pazarlar
- Kuzey/Doğu Avrupa ikinci dalga
- Türkiye **dahil edilmedi** (Avrasya zaten iç pazarda var, fuar amacı dış)
- ABD/Kanada **şu an yok** — Automechanika Frankfurt'ta var ama çok az; ROI düşük

### Dışlamalar
- **Üreticiler:** Apesan gibi (Türk paspas üreticisi) — bu **rakip**, müşteri değil. Bu raporu hazırlarken Strateji C'de çıktı, doğrulanmış kural.
- **Tek araç markası bayisi:** "Volkswagen yetkili yedek parça satıcısı" gibi — kapsam dar, paspas private label uygun değil
- **Hammadde/kalıp tedarikçileri:** Avrasya zaten Türk hammadde tedarikçileri ile çalışıyor; fuar amacı bu değil
- **Tek kategori firmalar:** sadece motor yağı, sadece batarya, sadece lastik vs.
- **Çin firmaları:** Avrasya'nın **rakibi**. Hong Kong, Hindistan, Pakistan, Bangladeş, Vietnam, Tayland — düşük maliyetli üreticiler

### Pozitif sinyaller
- "private label interest" — web sitelerinde "OEM/ODM available" gibi ifadeler arar
- "european-made preference" — özellikle DACH bölgesi distribütörleri Çin'den uzaklaşıyor
- "amazon FBA seller" — Avrasya'nın FBA için private label tedarik kapasitesi var
- "stocking distributor" — stoktan satan, anlık ürün isteyen — Avrasya'nın hızlı teslimat avantajı

### Negatif sinyaller
- "in-house production line" — kendi üretimi varsa müşteri değil rakip
- "patent on floor mat manufacturing" — pazarda özel teknoloji ile yer kapmış, Avrasya'nın ucuza tek shot şansı zor
- "established china supplier chain" — değiştirmesi zor (10 yıllık tedarikçi ilişkisi)
- "single OEM contract revenue >70%" — bir VW veya BMW kontratına bağlı; aftermarket'a girmeyebilir

### Skorlama
- Sector match en yüksek ağırlık (0.30) — çekirdek uyum
- Firm type ikinci (0.25) — distribütör değilse alma
- Geography üçüncü (0.20) — pazar erişimi
- Channel (0.10) — satış kanalı uyumu, ikincil
- Positive signal (+0.10), negative signal (-0.15) — pozitiften negatif daha ağır cezalandırılır
- **Minimum candidate score: 5.0** — bu eşiğin altı `lead_candidates`'a düşmez

---

## ICP v2 — Codex için SQL (yeni seed)

Precision raporu ([sprint-1-precision-raporu.md](sprint-1-precision-raporu.md)) bulgularına göre v1'in üzerine 5 ekleme/değişiklik:

1. `priority_geographies`: **POL eklendi (Hall 3.1 hakimiyeti)** — DE/POL/AT/NL/FR sıra
2. `exclude_patterns`: paspas/oto aksesuar/PVC enjeksiyon/dernek/buying alliance + ürün-dışı kategoriler genişletildi
3. `exclude_geographies`: **TUR eklendi** (Türk üretici rakipler)
4. `strong_match_sectors` vs `weak_match_sectors` ayrımı — sektör skor boost
5. `min_lead_score_for_candidate`: 5.0 → **5.5**

```sql
-- Automechanika 2026 — ICP v2 (2026-05-21, precision raporu sonrası)
-- Önceki v1'i (UUID 9f4c8f04-64b8-4da5-9c7d-4a4b5cf4b1b0) pasif yap
UPDATE `icp_profiles` SET is_active = 0
  WHERE id = '9f4c8f04-64b8-4da5-9c7d-4a4b5cf4b1b0';

INSERT INTO `icp_profiles` (`id`, `name`, `is_active`, `definition`) VALUES (
  UUID(),
  'Automechanika 2026 — Paspas/Oto Aksesuar Alıcısı (v2)',
  1,
  JSON_OBJECT(
    'version', 2,
    'parent_version', 1,
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
      'negative_signal', -0.20
    ),
    'min_lead_score_for_candidate', 5.5,
    'auto_approve_threshold', 7.0
  )
);
```

**Önemli:** ICP v2 seed sonrası Codex `bun run db:seed:fresh` çalıştırmaz (mevcut adaylar kaybolur) — sadece bu INSERT'i ayrı bir migration olarak ekler. Sonra `fair.job.ts`'i v2 UUID ile yeniden tetikler, mevcut `lead_candidates`'da v1 UUID ile düşmüş kayıtlar **status='auto_reject'**'e alınır (v2 ile yeniden değerlendirme).

---

## ICP v1 — Codex için SQL (eski, referans)

[018_lead_machine_schema.sql:157-170](../../backend/src/db/seed/sql/018_lead_machine_schema.sql#L157-L170) yapısıyla uyumlu, bunun **yanına** eklenecek (mevcut "Oto Aksesuar Distribütörü — Avrupa" ICP'sini bozmaz).

`backend/src/db/seed/sql/018_lead_machine_schema.sql` sonuna ekle:

```sql
-- Automechanika 2026 — Avrasya Paspas için kalibre ICP (v1, 2026-05-21)
-- Kaynak: docs/teknik/icp-automechanika-final.md
INSERT INTO `icp_profiles` (`id`, `name`, `is_active`, `definition`) VALUES (
  UUID(),
  'Automechanika 2026 — Paspas/Oto Aksesuar Alıcısı',
  1,
  JSON_OBJECT(
    'version', 1,
    'fair', JSON_OBJECT(
      'name', 'Automechanika Frankfurt 2026',
      'dates', '2026-09-08/2026-09-12',
      'host_exhibitor', JSON_OBJECT(
        'name', 'Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti.',
        'brand', 'ProMats',
        'hall', '3.1',
        'booth', 'D11'
      )
    ),
    'sectors', JSON_ARRAY(
      'automotive accessories','car care','floor mats','car mats','car carpet',
      'interior accessories','boot liners','trunk mats','auto trim','rubber mats'
    ),
    'firm_types', JSON_ARRAY(
      'distributor','importer','wholesaler','e-commerce seller','buying group',
      'aftermarket retailer','tuning shop chain','auto parts catalog company'
    ),
    'geographies', JSON_ARRAY(
      'DE','AT','NL','PL','FR','BE','CZ','IT','ES','UK',
      'RO','HU','SK','SE','DK','NO','FI','CH','GR','BG','PT','IE'
    ),
    'priority_geographies', JSON_ARRAY('DE','AT','NL','PL','FR'),
    'sales_types', JSON_ARRAY('B2B','B2B2C','B2C'),
    'sales_channels', JSON_ARRAY(
      'own website','amazon','ebay','kaufland','otto','cdiscount','fruugo',
      'wholesale catalog','retail chain','tuning chain'
    ),
    'price_segment', 'mid',
    'company_size_min', 'small',
    'company_size_max', 'enterprise',
    'annual_revenue_min_eur', 500000,
    'exclude_firm_types', JSON_ARRAY(
      'manufacturer (own production)','OEM tier-1 supplier','single car brand official dealer',
      'raw material supplier','tooling supplier'
    ),
    'exclude_sectors', JSON_ARRAY(
      'engine oil only','lubricants only','battery only','tire only',
      'electronic parts only','mechanical parts only'
    ),
    'exclude_patterns', JSON_ARRAY('chinese factory direct','made in china reseller only'),
    'exclude_geographies', JSON_ARRAY('CN','HK','IN','PK','BD','VN','TH'),
    'positive_signals', JSON_ARRAY(
      'private label interest','ODM partnership signals','european-made preference',
      'amazon FBA seller','multi-brand catalog','stocking distributor'
    ),
    'negative_signals', JSON_ARRAY(
      'in-house production line','patent on floor mat manufacturing',
      'established china supplier chain','single OEM contract revenue >70%'
    ),
    'scoring_weights', JSON_OBJECT(
      'sector_match', 0.30,
      'firm_type_match', 0.25,
      'geography_match', 0.20,
      'channel_match', 0.10,
      'positive_signal', 0.10,
      'negative_signal', -0.15
    ),
    'min_lead_score_for_candidate', 5.0
  )
);
```

**Codex notu:** `bun run db:seed:fresh` ile re-seed. ICP UUID'sini al, env veya doc'a kaydet — fair job tetiklenirken kullanılacak.

---

## v2'ye Geçiş — Avrasya Görüşmesi Sonrası

Bu sorular Avrasya görüşmesinde netleşecek ve v2'yi belirleyecek:

1. **Ürün önceliği:** sadece floor mat mı, yoksa Avrasya boot liner/interior trim de üretiyor mu?
   - Eğer sadece floor mat: `sectors` daraltılır
   - Eğer geniş: aynı kalır
2. **Pilot pazar darltma:** DE+AT+NL+PL+FR'in altında daha dar bir başlangıç (örn. sadece DE+AT) ister mi?
   - `priority_geographies` güncellenir
3. **Min revenue eşiği:** 500K EUR mantıklı mı, yoksa Avrasya'nın ölçeğine göre 1-2M EUR mu?
   - `annual_revenue_min_eur` güncellenir
4. **Çin dışlama:** Avrasya Çinli distribütörler de istemez mi (örn. Almanya'da kurulu Çinli dağıtıcı)?
   - `exclude_geographies` ve `exclude_patterns` gözden geçirilir
5. **Private label vurgusu:** Avrasya kapasitesi nasıl?
   - `positive_signals` ağırlıkları kalibre

---

## Bağlantılar

- 📋 Master strateji (Bölüm 2): [../strateji/AUTOMECHANIKA_2026_PLANI.md](../strateji/AUTOMECHANIKA_2026_PLANI.md)
- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🔧 Detay çeklist: [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md)
- 🗄️ DB schema referansı: [../../backend/src/db/seed/sql/018_lead_machine_schema.sql](../../backend/src/db/seed/sql/018_lead_machine_schema.sql)
- 🌐 Network analiz raporu: [messefrankfurt-network-analizi.md](messefrankfurt-network-analizi.md)
