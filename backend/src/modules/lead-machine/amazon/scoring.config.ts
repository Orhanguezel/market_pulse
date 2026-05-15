/**
 * Amazon Scoring Engine — Merkezi Konfigürasyon
 *
 * Bu dosyadaki değerleri değiştirerek motorun tüm ağırlık ve eşik
 * değerlerini tek noktadan düzenleyebilirsiniz.
 */

// ─── Composite Ağırlıklar ────────────────────────────────────────────────────
// Toplam 1.0 olmalı. Her boyutun composite skora katkı oranını belirler.

export const COMPOSITE_WEIGHTS = {
  category_risk:    0.25,
  price_war_risk:   0.25,
  sku_chaos:        0.20,
  brand_reliability: 0.15,
  operational_risk:  0.15,
} as const;

// ─── Güven (Confidence) Eşikleri ────────────────────────────────────────────
// Kaç veri noktası hangi güven seviyesine karşılık gelir.

export const CONFIDENCE_THRESHOLDS = {
  INSUFFICIENT_DATA_MAX: 9,   // ≤ 9  → INSUFFICIENT_DATA (skor üretilmez)
  LOW_MAX: 30,                 // 10-30 → LOW (sadece referans)
  MEDIUM_MAX: 45,              // 31-45 → MEDIUM (karar verilebilir)
                               // > 45  → HIGH  (güvenilir karar)
} as const;

// ─── Karar Etiket Eşikleri ──────────────────────────────────────────────────
// Composite skor hangi aralıkta hangi etiketi alır.

export const DECISION_THRESHOLDS = {
  GUVENLI_MAX: 3,      // 0-3   → GÜVENLİ
  DIKKATLI_OL_MAX: 6,  // 4-6   → DİKKATLİ_OL
                       // 7-10  → GİRME
} as const;

// ─── Mixed Signal Eşiği ─────────────────────────────────────────────────────
// Kaç boyut yüksek / kaç boyut düşük olursa MIXED_SIGNAL tetiklenir.

export const MIXED_SIGNAL_CONFIG = {
  HIGH_SCORE_MIN: 7,    // Bu değer ≥ boyut "yüksek" sayılır
  LOW_SCORE_MAX: 3,     // Bu değer ≤ boyut "düşük" sayılır
  HIGH_COUNT_TRIGGER: 1, // Tam bu kadar yüksek boyut olmalı
  LOW_COUNT_TRIGGER: 3,  // En az bu kadar düşük boyut olmalı
} as const;

// ─── Veri Filtreleme ────────────────────────────────────────────────────────
// Pipeline'a giren ürünler için minimum kalite eşiği.

export const FILTER_CONFIG = {
  MIN_REVIEW_COUNT: 10,    // Bu değerin altındaki ürünler analize dahil edilmez
} as const;

// ─── Outlier Temizleme ───────────────────────────────────────────────────────
// Tukey IQR yöntemi — fiyat sigma/median hesabından aşırı uç değerleri çıkarır.

export const OUTLIER_CONFIG = {
  IQR_MULTIPLIER: 1.5,  // Standart Tukey çarpanı; agresif kategoriler için 2.0
  MIN_SAMPLE: 4,         // Bu kadar değerden az varsa outlier kaldırma yapma
} as const;

// ─── Kategori Risk Eşikleri ─────────────────────────────────────────────────

export const CATEGORY_RISK_CONFIG = {
  HIGH_SELLER_COUNT: 50,       // Bu değer üstü satıcı → yüksek rekabet
  SELLER_DENSITY_DIVISOR: 5,   // sellerCount / divisor → ham puan
  HIGH_BRAND_RATIO: 0.4,       // Dominant marka oranı bu üstüyse yüksek giriş engeli
  MED_BRAND_RATIO: 0.25,
  HIGH_REVIEW_BARRIER: 0.5,    // Ürünlerin bu oranı 500+ yorumsa giriş zorlaşır
  MED_REVIEW_BARRIER: 0.25,
  HIGH_REVIEW_COUNT: 500,      // "Yüksek review" eşiği
} as const;

// ─── Keepa API ───────────────────────────────────────────────────────────────

export const KEEPA_CONFIG = {
  MAX_ASINS_PER_SCAN: 20,      // Tek job'da Keepa'ya gönderilecek max ASIN sayısı
  DEFAULT_DAILY_BUDGET: 300,   // Günlük varsayılan token bütçesi
  HIGH_RISK_SCORE_TRIGGER: 7,  // Bu değer üstü composite skor → Keepa tetiklenir
} as const;
