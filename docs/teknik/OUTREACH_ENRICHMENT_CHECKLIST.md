# Market Pulse — Outreach Enrichment Ceklist

> Kaynak: Müşteri notu (2026-05-11) + mimari analiz
> Kapsam: `outreach_priority`, `persuasion_points`, schema genişletme, brand-level hazırlık
> Core scoring'e dokunulmaz. Sadece output katmanı genişletilir.

---

## Görev 1 — `outreach_priority` alanı (1-10)

**Süre:** ~1 saat  
**Etki:** Operatör hangi markaya önce gideceğini direkt görebilir

### 1.1 — Tip tanımı
- [x] `amazon.types.ts` → `AmazonRiskReport`'a alan ekle

### 1.2 — Hesaplama mantığı
- [x] `composite.scorer.ts` → `calculateOutreachPriority` eklendi

### 1.3 — DB kolonu
- [x] `amazon.schema.ts` → `outreach_priority DECIMAL(3,1)` eklendi
- [ ] `bun run db:seed:fresh` ile tabloyu yeniden oluştur (ALTER yasak)

### 1.4 — Job pipeline
- [x] `amazon.job.ts` → DB insert güncellendi

### 1.5 — Rapor servisi
- [x] `risk-report.service.ts` → SELECT mapping güncellendi

---

## Görev 2 — `persuasion_points` alanı (string[])

**Süre:** ~2-3 saat  
**Etki:** Teknik bulgu → satış argümanı dönüşümü otomatik üretilir

### 2.1 — Tip tanımı
- [x] `amazon.types.ts` → `persuasion_points: string[]` eklendi

### 2.2 — Generator dosyası oluştur
- [x] `persuasion.generator.ts` oluşturuldu — 5 kural, fallback, maks 4 madde

### 2.3 — Scoring engine entegrasyonu
- [x] `amazon.scoring-engine.ts` → `generatePersuasionPoints(scores)` çağrısı eklendi

### 2.4 — DB kolonu
- [x] `amazon.schema.ts` → `persuasion_points JSON` eklendi
- [ ] `bun run db:seed:fresh`

### 2.5 — Job pipeline
- [x] `amazon.job.ts` → `JSON.stringify(report.persuasion_points)` ile kayıt

### 2.6 — Rapor servisi
- [x] `risk-report.service.ts` → parse edilerek döndürülüyor

---

## Görev 3 — Schema genişletilebilirlik (brand_context + enrichment)

**Süre:** ~30 dakika  
**Etki:** İleride brand aggregation ve external enrichment için migration gerekmez

### 3.1 — Tip tanımı
- [x] `amazon.types.ts` → `BrandContext` tipi + `brand_context`, `enrichment` alanları eklendi

### 3.2 — DB kolonları
- [x] `amazon.schema.ts` → `brand_id`, `brand_name`, `enrichment JSON` eklendi
- [ ] `bun run db:seed:fresh`

### 3.3 — Job pipeline
- [x] `amazon.job.ts` → `brand_id: null`, `brand_name`, `enrichment` geçiliyor

### 3.4 — Tip default
- [x] `amazon.scoring-engine.ts` → `brand_context` ve `enrichment` default değerleri eklendi

---

## Görev 4 — Test güncellemesi

**Süre:** ~30 dakika

- [x] `__tests__/composite.scorer.test.ts` → `calculateOutreachPriority` 4 test case eklendi
- [x] `__tests__/scoring-engine.test.ts` → `outreach_priority`, `persuasion_points`, `brand_context`, `enrichment` testleri eklendi
- fixtures güncelleme gerekmedi — scoring-fixtures.ts sadece product mock üretiyor, yeni alanlar engine içinde hesaplanıyor
- [x] `bun test` → **31 pass, 0 fail**

---

## Görev 5 — Polling / cadence (değişiklik yok)

**Süre:** 0  
Sistem şu an zaten on-demand çalışıyor. Keepa zaten conditional. Claude AI review analizi sadece ilk ürün için tetikleniyor. Müşteri notu "ileride bu yönde gitme" uyarısıdır, şimdi yapılacak bir şey yok.

- [x] ~~Realtime polling~~ — yok, doğru
- [x] ~~Keepa her ürün için~~ — conditional, doğru
- [x] ~~Review analizi tüm ürünler~~ — sadece ilk ürün, doğru

---

## Uygulama Sırası

```
Görev 3 (schema) → Görev 1 (outreach_priority) → Görev 2 (persuasion_points) → Görev 4 (test)
```

Schema önce çünkü DB seed yapılıyor; sonra logic ekleniyor; en son test.

---

## Değişen Dosyalar (Özet)

| Dosya | Değişiklik |
|---|---|
| `amazon.types.ts` | 4 yeni alan: `outreach_priority`, `persuasion_points`, `brand_context`, `enrichment` |
| `amazon.schema.ts` | 5 yeni kolon: `outreach_priority`, `persuasion_points`, `brand_id`, `brand_name`, `enrichment` |
| `composite.scorer.ts` | `calculateOutreachPriority` fonksiyonu eklenir |
| `persuasion.generator.ts` | Yeni dosya — kural tabanlı argüman üreteci |
| `amazon.scoring-engine.ts` | Generator çağrısı + brand_context default |
| `amazon.job.ts` | DB insert'e yeni alanlar eklenir |
| `risk-report.service.ts` | SELECT'e yeni alanlar eklenir |
| `__tests__/composite.scorer.test.ts` | outreach_priority beklentisi |
| `__tests__/scoring-engine.test.ts` | Yeni alanlar varlık kontrolü |
| `__tests__/fixtures/scoring-fixtures.ts` | Fixture güncelleme |
