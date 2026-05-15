# Amazon Ticari Karar Motoru — Scoring Logic

> Kaynak: `amazon-scoring-engine-teknik-rapor.pdf`
> Implement tarihi: 2026-05-08

---

## Pipeline Akışı

```
Keyword + Marketplace
  → scrapeAmazonProducts()          [amazon.scraper.ts — Oxylabs, 3 sayfa]
  → filterEligibleProducts()        [signal.validator.ts — review_count < 10 ele]
  → analyzeProductReviews()         [review.analyzer.ts — ilk ürün, AI problem skoru]
  → scoreAmazonCategory()           [amazon.scoring-engine.ts — orchestrator]
      ├─ buildCategoryStats()       [category.normalizer.ts — min/max/median/sigma]
      ├─ normalizeProducts()        [category.normalizer.ts — percentile 0-10]
      ├─ scoreCategoryRisk()        [scorers/category-risk.scorer.ts]
      ├─ scoreSkuChaos()            [scorers/sku-chaos.scorer.ts]
      ├─ scorePriceWar()            [scorers/price-war.scorer.ts]
      ├─ scoreBrandReliability()    [scorers/brand-reliability.scorer.ts]
      ├─ scoreOperationalRisk()     [scorers/operational-risk.scorer.ts]
      ├─ CompositeScorer.score()    [composite.scorer.ts]
      └─ validateSignals()          [signal.validator.ts — MIXED_SIGNAL kontrolü]
  → saveRiskScore()                 [amazon_risk_scores tablosu]
  → fetchKeepaSnapshot() [koşullu]  [keepa.client.ts — düşük güven veya score > 7]
```

---

## 5 Boyutlu Skor Açıklamaları

### 1. Kategori Risk Puanı (`category_risk`)

| Girdi | Ağırlık | Açıklama |
|-------|---------|----------|
| `seller_count` | %40 | 50+ satıcı → yüksek rekabet |
| `dominant_brand_ratio` | %35 | >%40 tek marka → yüksek giriş engeli |
| Yüksek review ürün oranı | %25 | Çoğu üründe 500+ yorum → yerleşik pazar |

### 2. SKU Kaos Puanı (`sku_chaos`)

| Girdi | Etki | Açıklama |
|-------|------|----------|
| `priceSigma / priceMedian` (CV) | Ana faktör | Variation coefficient — kaotik fiyatlandırma |
| `(priceMax - priceMin) / priceMedian` | Destek | Geniş fiyat aralığı |
| `product_count / seller_count` | Ek | Satıcı başına ürün < 1.5 → çok parçalı katalog |

### 3. Fiyat Savaşı Riski (`price_war_risk`)

| Girdi | Açıklama |
|-------|----------|
| `pageOneAveragePrice` vs `pageThreeAveragePrice` | Sayfa 1-3 fiyat düşüş oranı |
| `priceSigma / priceMedian` | Sigma oranı yüksekse kronik baskı |
| Düşük fiyat kümesi oranı | Medyanın %80'i altındaki ürünlerin payı |

> **Not:** Fiyat verisi hiç yoksa `confidence: INSUFFICIENT_DATA` döner, skor hesaplanmaz.

### 4. Marka Güvenilirlik Puanı (`brand_reliability`)

| Girdi | Açıklama |
|-------|----------|
| Marka token çeşitliliği | Kaç farklı marka başlığı var |
| Zayıf listing oranı | Seller adı/URL eksik veya rating < 4.0 |
| `priceSigma` | Satıcıdan satıcıya fiyat sapması |

### 5. Operasyonel Risk (`operational_risk`)

| Girdi | Ağırlık |
|-------|---------|
| `reviewProblemScore` (review.analyzer.ts'den) | %65 |
| Kritik bayrak sayısı (return, quality, broke…) | %35 ek |
| Düşük puanlı ürün oranı (rating < 4.0) | Ek çarpan |

---

## Bileşik Skor (Composite Score)

| Boyut | Ağırlık |
|-------|---------|
| `category_risk` | **%25** |
| `price_war_risk` | **%25** |
| `sku_chaos` | **%20** |
| `brand_reliability` | **%15** |
| `operational_risk` | **%15** |

> Ağırlıklar `CompositeScorer` constructor'ına geçilerek müşteri bazında özelleştirilebilir.

Yalnızca `confidence: HIGH` veya `MEDIUM` olan boyutlar hesaplamaya alınır.
Hiç güvenilir boyut yoksa `composite_score: null`, `decision: INSUFFICIENT_DATA` döner.

---

## Confidence (Güven) Katmanı

| `data_points` | `confidence` | Anlam |
|---------------|--------------|-------|
| < 10 | `INSUFFICIENT_DATA` | Skor üretilmez |
| 10 – 30 | `LOW` | Sadece referans |
| 31 – 45 | `MEDIUM` | Karar verilebilir |
| > 45 | `HIGH` | Güvenilir karar |

---

## Karar Etiketleri

| Bileşik Skor | Etiket | Anlam |
|-------------|--------|-------|
| 0 – 3 | `GUVENLI` | Pazar girişi uygun |
| 4 – 6 | `DIKKATLI_OL` | Karma sinyaller, strateji gerektirir |
| 7 – 10 | `GIRME` | Yüksek risk, giriş önerilmez |
| — | `MIXED_SIGNAL` | Tek boyut yüksek, diğerleri düşük |
| — | `INSUFFICIENT_DATA` | Güvenilir güven yok |

---

## Threshold Bazlı Eleme (signal.validator.ts)

| Koşul | Davranış |
|-------|----------|
| `review_count < 10` | Ürün analize dahil edilmez |
| Tek sayfa sonuç (`pageCount < 2`) | Kategori analizi referans işareti alır |
| Fiyat verisi yok | `price_war_risk` skoru hesaplanmaz |

**MIXED_SIGNAL kriteri:** 5 boyuttan sadece 1 tanesi ≥ 7 VE ≥ 3 tanesi ≤ 3 ise `MIXED_SIGNAL`.

---

## Keepa API Kullanım Kuralları

- Sadece şu durumlarda tetiklenir:
  - `price_war_risk.confidence === 'INSUFFICIENT_DATA'`
  - `composite_score > 7`
- Bir taramada maksimum **5 ASIN** gönderilir (token tasarrufu)
- `KEEPA_API_KEY` env var ile yapılandırılır; yoksa sessizce atlanır

---

## Örnek Çıktı

```json
{
  "keyword": "silikon paspas",
  "scanned_at": "2026-05-08T10:00:00Z",
  "data_points": 47,
  "scores": {
    "category_risk":     { "score": 7.2, "confidence": "HIGH",   "reason": "Yüksek satıcı yoğunluğu (63 satıcı)" },
    "sku_chaos":         { "score": 8.1, "confidence": "HIGH",   "reason": "Fiyat aralığı 42.30, sigma 11.20, ürün sayısı 47" },
    "price_war_risk":    { "score": 6.0, "confidence": "MEDIUM", "reason": "Sayfa fiyat düşüş oranı 38%, düşük fiyat kümesi 45%" },
    "brand_reliability": { "score": 4.5, "confidence": "HIGH",   "reason": "23 marka tokenı, 12 zayıf listing, fiyat sapması 11.20" },
    "operational_risk":  { "score": 5.0, "confidence": "MEDIUM", "reason": "Review problem skoru 3.5, kritik şikayet bayrağı 2" }
  },
  "composite_score": 6.6,
  "decision": "DIKKATLI_OL",
  "summary": "Kategori kalabalık ve fiyat baskısı var. Güçlü marka olmadan girmek risklidir."
}
```

---

## Dosya Haritası

| Dosya | Görev |
|-------|-------|
| `amazon.types.ts` | Tüm tip tanımları |
| `confidence.calculator.ts` | data_points → confidence hesabı |
| `signal.validator.ts` | Threshold filtre + MIXED_SIGNAL |
| `category.normalizer.ts` | Kategori istatistikleri + percentile normalize |
| `scorers/category-risk.scorer.ts` | Kategori risk skoru |
| `scorers/sku-chaos.scorer.ts` | SKU kaos skoru |
| `scorers/price-war.scorer.ts` | Fiyat savaşı riski |
| `scorers/brand-reliability.scorer.ts` | Marka güvenilirlik skoru |
| `scorers/operational-risk.scorer.ts` | Operasyonel risk skoru |
| `composite.scorer.ts` | Ağırlıklı birleşik skor + karar etiketi |
| `amazon.scoring-engine.ts` | Pipeline orchestrator |
| `keepa.client.ts` | Keepa API entegrasyonu |
| `amazon.job.ts` | Fastify background job (yeni pipeline) |
| `amazon.schema.ts` | Drizzle ORM tablo tanımları |
| `__tests__/scoring-engine.test.ts` | 22 birim + entegrasyon testi |
