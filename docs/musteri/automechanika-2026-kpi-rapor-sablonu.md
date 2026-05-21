# Automechanika 2026 — KPI Raporu (Post-show — BOŞ ŞABLON)

> **Tarih (taslak):** 2026-05-21 (boş şablon)
> **Doldurulacak tarih:** 2026-09-25 (fuar bittikten 2 hafta sonra)
> **Sahibi:** 🧠 Claude (Sprint 6 — Avrasya'ya post-show sunum)
> **Hedef okuyucu:** Avrasya yönetimi (1 sayfalık özet veya 10 slide PPT)
> **Bağlı:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 6

---

## 1. Yönetici Özeti (1 paragraf)

> *[BOŞ — fuar sonrası doldurulacak. Şu format:]*
>
> "Automechanika 2026 boyunca Avrasya / ProMats standına **X randevu** ve **Y walk-in aday** kaydedildi.
> Toplam **Z firma** ile fiziken görüşüldü, bunların **N tanesi** sıcak/kapanış-yakın olarak işaretlendi.
> Sistem fuar öncesi **M mail** gönderdi, **R yanıt** geldi (**P% yanıt oranı**).
> Mevcut işleyen takip akışı sayesinde T+30'da **K firmaya** numune/teklif gitti.
> Yatırım maliyeti yaklaşık **$10** ve maliyet/randevu **$0.X**."

---

## 2. Hedef vs Gerçek

| Metrik | K-6 hedef | Gerçek | Sapma |
|---|---|---|---|
| Onaylı aday firma | 200+ | _____ | _____ |
| Outreach mail gönderim | 60-100 | _____ | _____ |
| Yanıt oranı | ≥%15 | ____% | _____ |
| Stand randevusu (planlanmış) | 20+ (hedef 30-35) | _____ | _____ |
| Walk-in aday | (hedeflenmedi) | _____ | _____ |
| Toplam görüşme (randevu + walk-in) | — | _____ | _____ |
| Numune talebi | — | _____ | _____ |
| scrape başarı oranı | ≥%95 | ____% | _____ |
| Sistem uptime fuar haftası | %99 | ____% | _____ |

---

## 3. Aday Havuzu Akışı (funnel)

```
[Messe API'den çekilen exhibitor]  ──→ _____ firma
              ↓
[ICP filtreden geçen]               ──→ _____ firma (precision %____)
              ↓
[Onaylanan]                         ──→ _____ firma
              ↓
[Enrichment edilen (mail bulunan)]  ──→ _____ firma
              ↓
[Outreach mail gönderilen]          ──→ _____ firma
              ↓
[Yanıt veren]                       ──→ _____ firma (%____ yanıt)
              ↓
[Calendly randevu rezerve eden]     ──→ _____ firma
              ↓
[Standa gelen randevulu]            ──→ _____ firma
              ↓
[Sıcak/kapanış-yakın]               ──→ _____ firma
              ↓
[Post-show numune/teklif gönderilen]──→ _____ firma
```

Yanı sıra:
```
[Walk-in stand ziyaretçi]           ──→ _____ kişi
              ↓
[Aday olarak forma kaydedilen]      ──→ _____ firma
              ↓
[Sıcak/kapanış-yakın]               ──→ _____ firma
```

---

## 4. Coğrafi Dağılım (gerçek randevular)

| Ülke | Onaylı aday | Randevu | Walk-in | Sıcak |
|---|---|---|---|---|
| Almanya (DE) | _____ | _____ | _____ | _____ |
| Polonya (POL) | _____ | _____ | _____ | _____ |
| Avusturya (AT) | _____ | _____ | _____ | _____ |
| Hollanda (NL) | _____ | _____ | _____ | _____ |
| Fransa (FR) | _____ | _____ | _____ | _____ |
| Diğer AB | _____ | _____ | _____ | _____ |
| AB dışı | _____ | _____ | _____ | _____ |

**En verimli pazar:** _____________________________________
**Hayal kırıklığı:** ____________________________________

---

## 5. Komşu Stand Etkisi

[sprint-2-komsu-stand-top25.md](../teknik/sprint-2-komsu-stand-top25.md) — top 25 listesinden:

| Klasifikasyon | Listede | Standa geldi | Sıcak |
|---|---|---|---|
| ✅✅ Sıcak (HromTech, Carmotion) | 2 | _____ | _____ |
| ✅ İncele | 9 | _____ | _____ |
| ❓ Belirsiz | 7 | _____ | _____ |

**Walk-in adayların yüzde kaçı komşu standlardan geldi:** _____%

---

## 6. Maliyet Analizi

| Kalem | Plan | Gerçek |
|---|---|---|
| Hunter.io | Free 50 credit | _____ credit kullanıldı |
| Postmark | Free 100 mail | _____ mail gönderildi |
| GPT-4o-mini | ~$0.50 | $____ |
| Calendly | Free | (free yeterli mi? evet/hayır) |
| Diğer | — | _____ |
| **Toplam** | **~$10** | **$____** |

**Plan maliyetinden _____% sapma.**

---

## 7. Sistem Performansı

| Olay | Adet | Yorum |
|---|---|---|
| Hata loglu fail | _____ | _____ |
| scraper-service down süresi | _____ dk | _____ |
| Mail bounce | _____ | _____ |
| Spam complaint | _____ | _____ |
| DKIM/DMARC fail | _____ | _____ |

---

## 8. Mail Kampanyası Detayı

| Sequence | Gönderilen | Açılan | Yanıt | Yanıt oranı |
|---|---|---|---|---|
| Initial outreach | _____ | _____ | _____ | ____% |
| T+3 reminder 1 | _____ | _____ | _____ | ____% |
| T+10 reminder 2 | _____ | _____ | _____ | ____% |
| T+30 closing | _____ | _____ | _____ | ____% |

**En verimli dil:** EN / DE / TR / hepsi yakın
**En verimli konu satırı:** ___________________________

---

## 9. Geri Bildirim — Avrasya Stand Ekibi

(Eğitim sonu + post-show için)

**Ne işe yaradı:**
- _____________________________________
- _____________________________________
- _____________________________________

**Ne zorluk çıkardı:**
- _____________________________________
- _____________________________________

**Sonraki fuarda mutlaka değişmesi gereken:**
- _____________________________________
- _____________________________________

---

## 10. Geri Bildirim — Avrasya Yönetimi

(Görüşme/sunum sonrası)

**Beklentilerin altında kaldı:** _____________________________________
**Beklentilerin üstünde:** _____________________________________
**Sonraki fuara ilgi:** ☐ Reifen Essen ☐ Equip Auto Paris ☐ Diğer: _____

---

## 11. Önemli Dersler (üst belgeye yansıyacak)

ICP v3 önerileri (Sprint 6 ICP kalibrasyonu için):
- _____________________________________
- _____________________________________
- _____________________________________

Sistem mimari değişikliği önerileri:
- _____________________________________

Pazar önceliği değişikliği:
- _____________________________________

---

## 12. ROI Hesabı (Avrasya yönetimi için)

| Kategori | TL/EUR |
|---|---|
| Fuar standı maliyeti (Avrasya) | _____ EUR |
| Market Pulse servis maliyeti | _____ EUR (~$10) |
| Toplam fuar yatırımı | _____ EUR |
| Randevu başına maliyet | _____ EUR (toplam / randevu) |
| 1 sıcak adayın yıllık tahmini ciro değeri | _____ EUR |
| Beklenen dönüşüm (sıcak → müşteri %) | _____% |
| Beklenen yıllık ciro (tahmin) | _____ EUR |
| ROI | ____x |

---

## 13. Sonraki Adımlar — Avrasya Kararı

Post-show 30 günlük cron çalışacak:
- T+3 mail (numune gönderilenler için): _____ otomatik
- T+10 reminder: _____ otomatik
- T+30 closing: _____ otomatik

Avrasya karar:
- ☐ Sistemi **kapat** (fuara özel idi)
- ☐ Sistemi **sürdür** (sürekli lead production — aylık $10 maliyet)
- ☐ Bir sonraki fuara hazırlık (Reifen Essen 2027 mayıs?)

---

## 14. Sunum Formatı

Bu rapor 3 farklı formata dönüşür:

1. **1 sayfa Avrasya yönetimine** — sadece §1, §2, §6, §12
2. **5 slide PPT (Avrasya ekibi sunumu)** — §1, §2, §3, §6, §13
3. **10 slide detaylı (gerek olursa)** — tüm bölümler
4. **Bu MD belgesi** — referans olarak Drive'da kalır

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 📊 Sprint 1 precision: [../teknik/sprint-1-precision-raporu.md](../teknik/sprint-1-precision-raporu.md)
- 🗺️ Komşu stand top 25: [../teknik/sprint-2-komsu-stand-top25.md](../teknik/sprint-2-komsu-stand-top25.md)
- 🎯 Hedef metrikler kaynağı: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) "Hedef Metrikler" tablosu
- 🔮 Sonraki fuarlar kararı: [sonraki-fuarlar-karar-belgesi.md](sonraki-fuarlar-karar-belgesi.md)
