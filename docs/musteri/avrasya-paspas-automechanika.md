# Avrasya Paspas — Automechanika Frankfurt 2026

> Müşteri: Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti.
> Marka: **ProMats** (promats.com.tr)
> Fuar: Automechanika Frankfurt 2026 — 8-12 Eylül 2026
> Stand: Hall 3.1, Booth D11
> Strateji belgesi: [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](../strateji/AUTOMECHANIKA_2026_PLANI.md)
> İş listesi: [docs/teknik/FAIR_MODULU_CEKLISTI.md](../teknik/FAIR_MODULU_CEKLISTI.md)
> Son güncelleme: 2026-05-21

---

## 1. Müşteri Bilgileri (Public)

Automechanika'nın resmi exhibitor sayfasından çekilen veri ([detail URL](https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html/avrasya-paspas-otomotiv-sanayi-ve-ticaret-limited-sirketi.html)):

| Alan | Değer |
|---|---|
| Resmi adı | Avrasya Paspas Otomotiv Sanayi Ve Ticaret Limited Sirketi |
| Marka | ProMats |
| Website | http://www.promats.com.tr |
| Telefon | +90 539 860 75 80 |
| Adres | 1. Blok, 20-22-24 Ikitelli Organize Sanayi Bolgesi Mahallesi, 34490 Istanbul, Türkiye |
| Fuar | Automechanika Frankfurt 2026 |
| Tarih | 8-12 Eylül 2026 |
| Hall | 3.1 |
| Booth | D11 |
| Ek kaynaklar | Virtual showroom, 3D booth, nmedia.hub shop *(detayı JS render gerekir)* |

**Doğrulanacak (Avrasya ile):**
- E-posta
- Karar verici (export müdürü) adı + iletişim
- Sosyal medya hesapları
- Yıllık kapasitesi + üretim hattı detayı (private label / ODM kapasitesi)
- Mevcut export pazarları (hangi ülkelerde bayi var)

---

## 2. Örnek Aday — `lead_candidates` Satır Şeması

Sistemin Automechanika exhibitor sayfasından çıkardığı tipik bir adayın **DB'ye nasıl düşeceği**. Bu örnek **Avrasya'nın ICP'sine uyan hayali bir AB distribütörü** üzerinden — yani Avrasya'nın *müşterisi olabilecek* tipte bir firmanın taslak kaydı:

```json
{
  "id": "uuid-v4",
  "job_id": "automechanika-2026-hall-3-1-scan-uuid",
  "channel": "trade_fair",
  "icp_id": "automechanika-2026-icp-uuid",
  "status": "pending",
  "name": "AutoParts Distribution GmbH",
  "website": "https://www.autoparts-distribution.de",
  "country": "DE",
  "city": "Düsseldorf",
  "phone": "+49 211 1234567",
  "email": "info@autoparts-distribution.de",
  "contact_name": null,
  "lead_score": 7.8,
  "ai_summary": "Kuzey Ren-Vestfalya bölgesinde 18 yıllık oto aksesuar distribütörü. Web sitesinde paspas (Fußmatten), bagaj örtüsü ve gösterge paneli aksesuarı satıyor. Şu an Çinli üreticilerden import ediyor — private label ortağı arıyor olabilir.",
  "raw_data": {
    "fair_info": {
      "fair_name": "Automechanika Frankfurt 2026",
      "fair_date": "2026-09-08 / 2026-09-12",
      "hall": "3.1",
      "booth_number": "F08",
      "is_neighbor": true,
      "distance_meters_estimate": 8
    },
    "exhibitor": {
      "name": "AutoParts Distribution GmbH",
      "website": "https://www.autoparts-distribution.de",
      "description": "Specializing in aftermarket automotive accessories...",
      "product_groups": ["Floor mats", "Interior accessories", "Boot liners"],
      "brands": ["Brand A", "Brand B"],
      "target_markets": ["DE", "AT", "CH", "BE", "NL"],
      "trade_audience": ["Retailers", "E-commerce sellers"]
    },
    "match": {
      "matches": true,
      "score": 7.8,
      "matched_dimensions": {
        "sector": ["floor mats", "interior accessories"],
        "firm_type": "distributor",
        "geography": "DE",
        "sales_channels": ["wholesale catalog", "own website"]
      },
      "negative_signals": [],
      "notes": "Kendi üretimi olduğuna dair sinyal yok; Çinli üretici importer pattern'i tespit edildi → private label fırsatı"
    },
    "website_analysis": {
      "has_b2b_signals": true,
      "has_china_signals": true,
      "has_private_label": false,
      "contact_emails": ["info@autoparts-distribution.de", "purchase@autoparts-distribution.de"],
      "firm_type_hints": ["distributor", "wholesaler"]
    }
  },
  "decision": null,
  "reject_reason": null,
  "reject_tags": null,
  "reviewed_by": null,
  "reviewed_at": null,
  "created_at": "2026-06-15T14:32:00Z"
}
```

### Avrasya ekibi bu kaydı görünce ne yapacak (onay paneli akışı)
1. Aday kartını aç (firma adı, website, hall+booth, ICP eşleşme skoru, AI özeti)
2. 30 sn web sitesi göz at (ürün gamı + Çin importer pattern'i)
3. Üç buton: **Onayla** / **Reddet** (sebep tag'ı) / **Favori** (öncelikli outreach)
4. Onaylanan → `lead_enrichment` job'ı tetiklenir (Apollo karar verici çekimi)
5. Enrichment dönünce → AI outreach taslağı üretilir → tekrar manuel onay

### Reddedilen aday → öğrenme
Avrasya "Bu firma sadece motor yağı satıyor, paspas kategorisi yok" derse:
- `reject_tags: ["kategori-uyumsuz-yağ"]`
- Sistem `lead_rejection_patterns`'a notu işler
- Sonraki tarama'da "motor oil" / "lubricants" baskın firmalar otomatik skor düşürülür

---

## 3. Müşteri Görüşme Notları

> [MARKET_PULSE_SAAS_PLANI.md Bölüm 9](../strateji/MARKET_PULSE_SAAS_PLANI.md#L283) şablonuna göre.

**Tarih:** *(görüşme henüz yapılmadı)*

### Yapılacak ilk görüşme — Avrasya export ekibi ile

Karar verilecekler:
1. Hedef pazar öncelikleri (5 ülke önerisi: DE/AT/NL/PL/FR)
2. Ürün önceliği (sadece paspas mı, tüm interior mi)
3. Private label / ODM kapasite ve mesaj
4. Mail gönderici adresi (info@promats.com.tr veya export@avrasya.com.tr)
5. Onay paneli kullanıcısı + günlük 30 dk taahhüdü
6. Stand kapasitesi (kaç eşzamanlı randevu kaldırır)
7. Bütçe onayı: Apollo + GPT + Postmark = ~$300 (4 ay toplam)
8. Apollo faturalandırma: Avrasya mı, biz mi

---

## 4. Kayıt Dosyaları

İleride bu dosyaya eklenecekler:
- `automechanika-2026-onayli-adaylar.csv` — fuar haftası imza alınmış aday listesi
- `automechanika-2026-randevular.csv` — fuar randevuları + sonuç
- `automechanika-2026-kpi.md` — fuar sonrası başarı raporu
