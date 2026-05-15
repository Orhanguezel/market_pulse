# Outreach Alanları — Kullanım Rehberi

> Kapsam: `outreach_priority`, `persuasion_points`, `brand_context`
> Deploy tarihi: 2026-05-11
> API endpoint: `GET /api/v1/admin/lead-machine/amazon/risk-scores/{keyword}?marketplace={marketplace}`

---

## Yeni alanlar ne zaman doluyor?

| Kayıt türü | outreach_priority | persuasion_points |
|---|---|---|
| **Yeni scan** (bugünden sonra) | Hesaplanmış değer (1-10) | Dolu (1-4 madde) |
| **Eski scan** (önceki kayıtlar) | 1 (fallback) | Boş [] |

Eski kayıtları güncellemek için aynı keyword'ü admin panelden tekrar scan et.

---

## 1. outreach_priority (1-10)

Markanın ne kadar öncelikli bir outreach hedefi olduğunu gösterir.

**Formül:**
```
base     = composite_score (0-10)
brand_gap = (10 - brand_reliability.score) * 0.3
priority  = clamp(base * 0.7 + brand_gap, 1, 10)
```

Yüksek composite_score → pazar riskli → marka dağıtım kanalı zayıf → outreach fırsatı yüksek.

### Öncelik tablosu

| Değer | Anlam | Aksiyon |
|---|---|---|
| **7-10** | Yüksek öncelik — pazar kalabalık, marka dağıtımı zayıf | Bu haftaki arama listesine al |
| **4-6** | Orta öncelik — izle, henüz acil değil | Takibe al |
| **1-3** | Düşük öncelik — pazar stabil ya da veri yetersiz | Şimdilik geç |

### Örnek API çıktısı

```json
{
  "keyword": "thermal labels",
  "composite_score": 5.3,
  "decision": "DIKKATLI_OL",
  "outreach_priority": 6.2
}
```

---

## 2. persuasion_points (string[])

Scoring sonucundan otomatik üretilen, müşteri görüşmesinde kullanılabilecek Türkçe iş argümanları.

**Kaynak:** Her dimension'ın skoru belirli eşiği geçerse ilgili argüman listeye eklenir.

| Tetikleyen koşul | Üretilen argüman |
|---|---|
| `category_risk ≥ 6` | "Yüksek satıcı yoğunluğu fiyat disiplinini bozuyor — yetkili bayi modeli olmadan sürdürülebilir konumlanmak güçleşiyor." |
| `price_war_risk ≥ 6` | "Aktif fiyat savaşı mevcut — konumlanmak için pencere kapanmadan harekete geçmek kritik." |
| `sku_chaos ≥ 6` | "Standart dışı fiyatlandırma ve yüksek varyant baskısı marka algısını zedeliyor." |
| `brand_reliability ≤ 4` | "Yetkili kanal açılırsa listing kalitesi ve marka görünürlüğü direkt iyileşir." |
| `operational_risk ≥ 6` | "Yüksek iade/şikayet oranı operasyonel risk oluşturuyor — çözüm fırsatı sizi kategoride öne çıkarır." |
| *(hiçbiri tetiklenmezse)* | "Kategori şu an istikrarlı görünüyor — erken giriş için uygun pencere." |

### Kullanım senaryosu

1. Scan tamamlanır
2. `persuasion_points` alanındaki maddeler sunum notuna veya e-postaya doğrudan yapıştırılır
3. Görüşme öncesi 30 saniyede hazır argüman listesi elimde olur

### Örnek API çıktısı

```json
{
  "persuasion_points": [
    "Yüksek satıcı yoğunluğu fiyat disiplinini bozuyor — yetkili bayi modeli olmadan sürdürülebilir konumlanmak güçleşiyor.",
    "Aktif fiyat savaşı mevcut — konumlanmak için pencere kapanmadan harekete geçmek kritik."
  ]
}
```

---

## 3. brand_context (ileride)

Şu an tüm kayıtlarda sabit değer gelir:

```json
{
  "brand_context": {
    "brand_aggregated": false,
    "brand_name": null,
    "sku_count": null
  }
}
```

İleride bir markanın tüm SKU'ları birlikte tarandığında `brand_aggregated: true` ve `brand_name` dolacak.

---

## 4. enrichment (ileride)

Şu an her zaman `null` gelir. İleride karar vericinin LinkedIn, unvan, iletişim bilgisi gibi external veriler için rezerve edilmiş alan.

---

## Pratik iş akışı

```
1. Admin panelde keyword gir → scan başlat
2. Scan biter (~20-30 sn) → risk-scores endpoint'ini çek
3. outreach_priority'ye göre sırala
4. 7+ olanları bu haftaki görüşme listesine al
5. Her biri için persuasion_points → sunum/e-posta notuna kopyala
6. Görüşmeye gir
```

---

## API çağrısı

```bash
# Token al
curl -s -X POST 'https://api.marketpulse.com/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"...", "password":"..."}'

# Risk raporu çek
curl -s -H 'Authorization: Bearer {TOKEN}' \
  'https://api.marketpulse.com/api/v1/admin/lead-machine/amazon/risk-scores/thermal%20labels?marketplace=com'
```

---

## Notlar

- **Polling yapma:** Sistem on-demand çalışıyor. Scan tamamlanınca direkt sorgula.
- **Eski kayıtlar:** 2026-05-11 öncesi scanlar yeni alanları içermiyor. Re-scan ile güncellenir.
- **Panel UI:** `outreach_priority` ve `persuasion_points` henüz panel ekranında görünmüyor; sadece API'den geliyor. UI entegrasyonu ayrı geliştirme gerektirir.
