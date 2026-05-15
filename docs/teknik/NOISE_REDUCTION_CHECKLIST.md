# Noise Reduction — Çekilst ve Durum

> Oluşturulma: 2026-05-11
> Kapsam: Price outlier filtresi, SKU dedup, null price confidence düzeltmesi

---

## Tespit Edilen 3 Sorun

### Sorun 1 — Price Outlier Filtresi Yok

**Nerede:** `category.normalizer.ts` → `buildCategoryStats`

**Ne oluyor:**
Tek bir anormal fiyatlı ürün (ör. 5 TL'lik çakma listeleme) `priceSigma` ve
`priceMedian` hesaplamalarını bozuyor. Sigma şişince `sku_chaos` ve
`price_war_risk` skorları gerçekten yüksek çıkıyor; karar yanıltıcı hale geliyor.

**Örnek:**
40 ürün, fiyat aralığı 80-200 TL, bir adet 5 TL'lik → sigma anormal yükseliyor →
`sku_chaos` yanlış GIRME kararı üretiyor.

**Çözüm:** Tukey IQR yöntemi. `priceMin`/`priceMax` ham kalır (görünüm için),
`priceMedian` ve `priceSigma` outlier temizlenmiş fiyatlardan hesaplanır.

- [x] `scoring.config.ts` → `OUTLIER_CONFIG` eklendi (`IQR_MULTIPLIER: 1.5`, `MIN_SAMPLE: 4`)
- [x] `category.normalizer.ts` → `removeOutliers(sorted)` fonksiyonu eklendi
- [x] `buildCategoryStats` → `cleanPrices` sigma ve median hesabında kullanılıyor

---

### Sorun 2 — SKU Dedup Yok

**Nerede:** `signal.validator.ts` → `filterEligibleProducts`

**Ne oluyor:**
Aynı ASIN farklı satıcıdan listelenirse pipeline'a iki kez giriyor. Bu:
- `sellerCount` gerçekte olduğundan yüksek görünüyor → `category_risk` şişiyor
- `data_points` şişiyor → `confidence` yanıltıcı yükseliyor
- Dominant brand ratio bozuluyor

**Çözüm:** ASIN'e göre dedup. ASIN URL'den çekilir. Aynı ASIN'den en yüksek
`review_count`'lu kayıt korunur. ASIN çekilemeyen ürünler pass-through.

- [x] `signal.validator.ts` → `deduplicateByAsin()` eklendi
- [x] `amazon.job.ts` (backend + standalone) → `deduplicateByAsin(allProducts)` scrape sonrası çağrılıyor

---

### Sorun 3 — Null Price Confidence Yanıltıcı

**Nerede:** `scorers/price-war.scorer.ts` → `calculateConfidence` çağrısı

**Ne oluyor:**
`confidence = calculateConfidence(input.products.length)` toplam ürün sayısını
kullanıyor. Ama price war skoru yalnızca fiyatı olan ürünlere bakıyor.
40 ürünün 10'unda fiyat varsa: confidence=HIGH (40 ürüne göre) ama hesap
10 ürün üzerinden yapılıyor → güven etiketi şişirilmiş.

**Çözüm:** `calculateConfidence(pricedProducts.length)` — fiyatlı ürün sayısına göre confidence.

- [x] `scorers/price-war.scorer.ts` → `calculateConfidence(pricedProducts.length)` olarak güncellendi

---

## Değişen Dosyalar

| Dosya (backend + standalone) | Değişiklik |
|---|---|
| `scoring.config.ts` | `OUTLIER_CONFIG` eklendi |
| `category.normalizer.ts` | `removeOutliers`, `cleanPrices` kullanımı |
| `signal.validator.ts` | `deduplicateByAsin` eklendi |
| `scorers/price-war.scorer.ts` | Confidence pricedProducts.length'e göre |
| `amazon.job.ts` | `deduplicateByAsin` çağrısı eklendi |

---

## Etki Analizi

| Düzeltme | Nereyi etkiler | Beklenen iyileşme |
|---|---|---|
| Outlier temizleme | priceSigma, priceMedian → sku_chaos, price_war | Daha az yanlış GIRME kararı |
| SKU dedup | sellerCount, data_points, dominant_brand_ratio | Daha temiz category_risk ve confidence |
| Price confidence | price_war_risk confidence etiketi | HIGH yerine gerçek güven seviyesi |

---

## Notlar

- IQR çarpanı (`1.5`) standart Tukey yöntemi. Agresif kategorilerde `2.0`'a çekilebilir.
- Dedup, ASIN çekilemeyen ürünleri dokunmadan geçiriyor (backward compat).
- Değişiklikler geriye dönük uyumlu — mevcut DB verisi bozulmuyor, sadece yeni scanlar etkileniyor.
