# Market Pulse — UI Geliştirme Ceklist

**Tarih:** 8 Mayıs 2026  
**Amaç:** Admin paneli kullanıcı dostu, veri zengin, görsel hale getirme  
**Referans ekranlar:** Lead Adayları + Amazon Arama sayfaları

---

## AJAN SORUMLULUK TABLOSU

| Ajan | Rol |
|------|-----|
| **Claude Code** | Mimari karar, API kontrat, handover notu |
| **Codex** | Backend değişiklikler, yeni endpoint'ler |
| **Antigravity** | Tüm UI bileşenleri, görsel iyileştirmeler |

---

## FAZ 1 — MEVCUT VERİYİ DOĞRU GÖSTER (Acil)

### Sorun Tespiti

| # | Sorun | Nerede | Kök Neden |
|---|-------|--------|-----------|
| 1 | SKOR 0.0 gösteriyor | Lead Adayları kartı | `lead_score` kaydedilirken `composite_score ?? 0` kullanılıyor; INSUFFICIENT_DATA durumunda 0 oluyor |
| 2 | Karar etiketi yok | Lead Adayları kartı | `lead_candidates` tablosunda `decision` alanı yok, `raw_data` içinde gömülü |
| 3 | Risk kartı boş | Amazon Arama sayfası | `useGetAmazonRiskScoreQuery` çalışıyor ama keyword'e göre doğru tetiklenmiyor |
| 4 | Arama geçmişi renksiz | Amazon Arama sayfası | Job kartlarında karar etiketi hiç gösterilmiyor |

---

### [Codex] Backend Düzeltmeleri

- [ ] **`amazon.job.ts` — decision alanını `insertCandidate`'e ekle**
  - `lead_candidates` tablosuna `decision` kolonu ekle (seed dosyasında)
  - `insertCandidate` çağrısına `decision: report.decision` ekle
  - `lead_score`: `composite_score ?? 0` yerine `composite_score ?? null` yap (0 göstermesin)

- [ ] **`risk-scores` endpoint'ini genişlet**
  - Mevcut: `GET /lead-machine/amazon/risk-scores/:keyword` sadece risk skoru döndürüyor
  - Eklenecek: `top_sellers` (DB'den top 5 satıcı — `amazon_products.seller_name`)
  - Eklenecek: `products` (o keyword'ün ürün listesi — fiyat, rating, review, seller, url)
  - Eklenecek: `problem_flags` (review analyzer'dan gelen flagler)
  - Dosya: `backend/src/modules/lead-machine/risk-report.service.ts`

- [ ] **Yeni endpoint: Ürün tablosu**
  - `GET /lead-machine/amazon/scan/:jobId/products`
  - `amazon_products` tablosundan job'a ait ürünleri döndür
  - Kolon: title, price, rating, review_count, seller_name, product_url, asin

---

### [Antigravity] UI Düzeltmeleri

- [x] **Lead Adayları — karar badge**
  - `raw_data.decision` alanından oku (GÜVENLİ / DİKKATLİ_OL / GİRME / INSUFFICIENT_DATA)
  - "SKOR 0.0" yerine: karar etiketi badge + composite_score (null ise "—")
  - Renk: GÜVENLİ → yeşil, DİKKATLİ_OL → sarı, GİRME → kırmızı, INSUFFICIENT_DATA → gri
  - Dosya: `admin_panel/src/app/(main)/admin/(admin)/market/_components/lead-candidates-panel.tsx`

- [x] **Amazon Arama — risk kartı bağlantısı**
  - `riskReport` geldiğinde `risk-score-card.tsx` bileşenini render et
  - Boş state mesajı doğru kalacak ama tarama bittikten sonra otomatik güncellenmeli
  - `refetchRisk` tetikleme: job "done" olunca polling ile çek
  - Dosya: `admin_panel/src/app/(main)/admin/(admin)/market/_components/amazon-lead-search-panel.tsx`

- [x] **Amazon Arama — arama geçmişi renklendirme**
  - Her job kartına: karar etiketi badge (renkli)
  - Composite skor sayısal gösterim
  - Data points göster

---

## FAZ 2 — VERİ ZENGİNLEŞTİRME

### [Antigravity] Risk Kartı Görsel İyileştirme

- [x] **5 boyut progress bar renklendirme**
  - 0-3 → yeşil (düşük risk)
  - 3-6 → sarı (orta risk)
  - 6-10 → kırmızı (yüksek risk)
  - Her boyuta reason tooltip ekle
  - Dosya: `admin_panel/src/app/(main)/admin/(admin)/market/_components/risk-score-card.tsx`

- [x] **Radar chart — 5 boyut**
  - 5 boyutu radar/spider chart ile göster
  - Kütüphane: `recharts` (zaten kullanılıyorsa) veya `chart.js`
  - Karar etiketiyle birlikte büyük kartın üstünde göster

- [x] **Top 5 satıcı listesi**
  - Risk kartı altında "Kategorideki Öne Çıkan Satıcılar" bölümü
  - Satıcı adı + ürün sayısı + ortalama fiyat
  - Veri kaynağı: genişletilmiş risk-scores endpoint

- [x] **Ürün kanıt tablosu**
  - Risk kartı altında tab veya collapsible bölüm
  - Kolonlar: Ürün adı, Fiyat, Rating, Yorum sayısı, Satıcı, ASIN
  - Sıralama: review_count DESC
  - Veri kaynağı: `/amazon/scan/:jobId/products` endpoint

---

## FAZ 3 — YORUM VE RAKİP ANALİZİ

### [Antigravity] Review ve Problem Analizi

- [x] **Problem flag'leri görsel gösterim**
  - "İade şikayeti var", "Kalite sorunu", "Yanlış ürün gönderimi" gibi flagler
  - Her flag bir badge/chip olarak göster
  - Risk kartının operasyonel risk bölümünde
  - Veri kaynağı: `raw_data.scores.operational_risk.reason`

- [x] **Keepa trend mini grafik**
  - 30/90 gün fiyat aralığı bar grafiği
  - Buy Box değişim sayısı badge
  - Risk kartında "Fiyat Geçmişi" bölümü
  - Veri kaynağı: `amazon_keepa_snapshots` tablosu

- [x] **Keyword karşılaştırma**
  - Arama geçmişindeki birden fazla keyword'ü yan yana karşılaştır
  - Tablo: keyword, skor, karar, veri noktası, tarih

---

## TEKNİK NOTLAR (Codex ve Antigravity İçin)

### Veri Akışı

```
amazon_scan_jobs  ←→  amazon_risk_scores  ←→  amazon_products
                                ↑
                    lead_candidates (raw_data = AmazonRiskReport)
```

- `lead_candidates.raw_data` zaten tam `AmazonRiskReport` JSON içeriyor
- `raw_data.decision` → karar etiketi
- `raw_data.composite_score` → gerçek skor
- `raw_data.scores.*.reason` → 5 boyut açıklamaları
- `raw_data.scores.*.score` → 5 boyut skorları

### Renk Kodu Standardı

```
GÜVENLİ        → bg-green-100  text-green-700  border-green-200
DİKKATLİ_OL   → bg-yellow-100 text-yellow-700 border-yellow-200
GİRME          → bg-red-100    text-red-700    border-red-200
INSUFFICIENT   → bg-gray-100   text-gray-500   border-gray-200
MIXED_SIGNAL   → bg-orange-100 text-orange-700 border-orange-200
```

### Risk Skor Renk Skalası (0-10)

```
0-3   → text-green-600  (düşük risk)
3-6   → text-yellow-600 (orta risk)
6-10  → text-red-600    (yüksek risk)
```

---

## TAMAMLANAN MADDELER

*(Tamamlandıkça buraya taşınır)*

---

## SIRA

1. Faz 1 Codex backend → Faz 1 Antigravity UI (paralel çalışabilir)
2. Faz 2 backend endpoint genişletme → Faz 2 UI
3. Faz 3
