# Antigravity Handover — UI Faz 1

**Tarih:** 8 Mayıs 2026  
**Proje:** market_pulse / admin_panel  
**Backend:** Deploy edildi, tüm endpoint'ler hazır

---

## Yapılacak 3 UI Görevi

---

### GÖREV 1 — Lead Adayları: Karar Badge [x]

**Dosya:** `admin_panel/src/app/(main)/admin/(admin)/market/_components/lead-candidates-panel.tsx`

**Sorun:** Her Amazon lead kartında "SKOR 0.0" yazıyor. `lead_score` null veya 0 geliyor.

**Çözüm:** `raw_data` alanından oku — içinde tam `AmazonRiskReport` JSON var.

```ts
// candidate.raw_data içinde bu yapı var:
{
  composite_score: 4.8,        // null olabilir (INSUFFICIENT_DATA)
  decision: 'DIKKATLI_OL',     // GÜVENLİ | DIKKATLI_OL | GİRME | INSUFFICIENT_DATA | null
  data_points: 41,
  scores: { ... }
}
```

**Değişiklik:**
- `scoreValue()` fonksiyonu yerine `raw_data` oku
- Channel "amazon" ise → karar badge göster, diğerleri → mevcut skor mantığı kalsın
- Badge renkleri:

```
GÜVENLİ        → bg-green-100  text-green-700
DIKKATLI_OL    → bg-yellow-100 text-yellow-700
GİRME          → bg-red-100    text-red-700
INSUFFICIENT_DATA / null → bg-gray-100 text-gray-400  "Veri yetersiz"
MIXED_SIGNAL   → bg-orange-100 text-orange-700
```

- Skor sayısal: `4.8 / 10` formatında, null ise `—`

---

### GÖREV 2 — Amazon Arama: Risk Kartı Bağlantısı + Arama Geçmişi [x]

**Dosya:** `admin_panel/src/app/(main)/admin/(admin)/market/_components/amazon-lead-search-panel.tsx`

**Sorun A:** `riskReport` var ama `risk-score-card` render edilmiyor.  
**Sorun B:** Arama geçmişi job kartlarında karar etiketi yok.

**Çözüm A — Risk kartını bağla:**
```ts
// Zaten var:
const { data: riskReport } = useGetAmazonRiskScoreQuery(...)

// riskReport gelince risk-score-card'ı render et:
{riskReport && <RiskScoreCard report={riskReport} />}

// riskReport.top_sellers ve riskReport.products artık geliyor (backend güncellendi)
```

Tarama bittikten sonra otomatik güncelleme için: job status "done" olunca `refetchRisk()` çağır.

**Çözüm B — Arama geçmişi karar badge:**

Her job kartında şunlar gösterilmeli:
- Keyword
- Marketplace badge (COM, DE, UK...)
- Tarih
- Karar badge (GÜVENLİ / DİKKATLİ OL / GİRME / Veri Yetersiz) — renk kodu üstte
- Data points sayısı
- Composite skor

`getAmazonRiskScores` endpoint'i artık `decision` döndürüyor.  
Job listesi için mevcut `listAmazonJobs` + `getAmazonRiskScores` birleştirilmeli veya job kartı tıklandığında risk fetch edilmeli.

---

### GÖREV 3 — Risk Kart: 5 Boyut Renklendirme + Top Sellers [x]

**Dosya:** `admin_panel/src/app/(main)/admin/(admin)/market/_components/risk-score-card.tsx`

**A — Progress bar renk:**
```ts
function scoreTailwind(score: number) {
  if (score <= 3) return 'bg-green-500';
  if (score <= 6) return 'bg-yellow-500';
  return 'bg-red-500';
}
```

**B — Top Sellers bölümü:**

`riskReport.top_sellers` artık geliyor:
```ts
[
  { name: "Seller A", product_count: 5, avg_price: 24.99 },
  ...
]
```

Risk kartı altına "Kategorideki Öne Çıkan Satıcılar" bölümü ekle:
- Her satıcı: isim + ürün sayısı + ort. fiyat
- Max 5 satıcı

**C — Ürün Tablosu:**

`riskReport.products` artık geliyor (top 20, review_count DESC):
```ts
[
  { title, price, rating, review_count, seller_name, product_url, asin },
  ...
]
```

Risk kartı altında collapsible tablo:
- Kolonlar: Ürün Adı, Fiyat, Rating, Yorum, Satıcı
- Tıklanabilir satır → `product_url` ile Amazon'da aç

---

## API Referansı

```
GET /api/v1/admin/lead-machine/amazon/risk-scores/:keyword?marketplace=com
→ { keyword, composite_score, decision, data_points, scores{5 boyut}, top_sellers[], products[], keepa_trend[] }

GET /api/v1/admin/lead-machine/amazon/scan/:jobId/products
→ { products: [{ title, price, rating, review_count, seller_name, product_url, asin }] }
```

## Admin Panel Endpoint Sabiti

`admin_panel/src/integrations/endpoints/admin/market_admin.endpoints.ts` dosyasına yeni endpoint ekle:

```ts
amazonScanProducts: (jobId: string) => `/lead-machine/amazon/scan/${jobId}/products`,
```

---

## Çalışma Sırası

1. GÖREV 1 — Lead Adayları badge (bağımsız, hemen başlanabilir)
2. GÖREV 2A — Risk kartı bağlantısı
3. GÖREV 3 — Risk kart renk + top sellers + ürün tablosu
4. GÖREV 2B — Arama geçmişi badge (3 bittikten sonra)
