# MatPortal — Tek Sayfa Özet

> A4 tek sayfa görsel özet — yönetim sunumu / asansör konuşması.

---

## Tek Cümle

**Promats'ın Üretim ERP'sini, piyasayı dinleyen, talebi öngören, kendi kendini düzelten 11 fazlı bir dijital ekosisteme dönüştüren proje.**

---

## Neden? — 3 Sayı

```
3-4 saat/gün       8-12/ay              ~150-200K TL/ay
satış ekibi        yanlış sipariş       toplam ölçülmemiş
sipariş alma                            kayıp (zaman + hata + körlemesine üretim)
```

Mevcut WhatsApp/telefon kaosu **35 bayide yürür**, **100 bayide çöker**. Şimdiden altyapı kurulmalı.

---

## Ne? — 11 Faz, 7 Katmanlı Mimari

```
G — KONVERSASYONEL  ← yönetici/bayi sohbet (Faz 8)
F — UYGULAMA        ← bayi portal + mobil + saha (Faz 6, 9)
E — MLOps           ← Excel'den eğitilebilir model (Faz 7)
D — TAHMİN          ← sipariş + churn + stok (Faz 2, 4, 5)
C — SİNYAL          ← scraping + sosyal (Faz 5)
B — KEŞİF           ← talep havuzu + lead (Faz 1, 3)
A — PASPAS ERP      ← mevcut, dokunulmaz (Faz 0)
```

**11 faz × ~14-15 ay** ana iskelet. Her faz **tek başına çalışır**, sıralama esnek.

---

## Felsefe — 4 Prensip

| 1 | **Veri-önce, AI-yardımcı** | İstatistik konuşur, AI tercüme eder |
| 2 | **Kademeli karmaşıklık** | Veri yetmediği yerde gelişmiş model yok |
| 3 | **Açıklanabilir** | Her tahmin "neden" sorusuna 3 cümle cevap verir |
| 4 | **Geri alınabilir** | Risk skorlu eşik, audit, rollback |

---

## Stratejik Kazançlar — 5 Boyut

| # | Kazanç | Faz | Etki |
|---|--------|-----|------|
| 1 | Sipariş frekansı +%30-40 | 6 | Bayi 3 dk'da sipariş |
| 2 | Sepet büyür +%15-25 | 6 + 2 | Cross-sell otomatik |
| 3 | Tahmin doğruluğu MAPE <%20 | 2 + 7 | Üretim planlama hatası -%50 |
| 4 | Erken churn yakalama -%30 | 5 | 2-3 ay önce sinyal |
| 5 | Operasyonel zaman -%65 | 6 + 8 | Satış ekibi 2-3 saat/gün açık |

---

## Yol Haritası — Görsel

```
2026 Q2          2026 Q4          2027 Q2          2027 Q4
  │                │                │                │
  Faz 0  Faz 1  Faz 2  Faz 3+4  Faz 5  Faz 6  Faz 7  Faz 8+9  Faz 10+
  ████   ████   ████████ ██████ ████████ ████████ ████████ ████████  ─────
  4hf    4hf    8hf      6hf    8hf      8hf      8hf      paralel   ihtiyaca
                                                                      göre
```

**Pilot Faz 6 sonu:** Hafta 38 (~9. ay). 5 bayi canlı.
**Tüm ana iskelet tamamlanma:** Hafta 60 (~14. ay).

---

## Operasyonel Bütçe — Aylık

```
Senaryo A (Faz 0-3):     $50-100/ay     ← Free tier başlangıç
Senaryo B (Faz 4-7):     $430-500/ay    ← Operasyonel olgunluk
Senaryo C (Faz 8+):      $1.500-1.800/ay ← Hızlı büyüme
```

Geliştirme ücreti hariç. Promats yönetimi ile ayrı görüşme.

---

## ROI Tahmini

```
Yıllık fayda:           ~1.6-2.3M TL    (zaman + hata + ciro artışı)
Yıllık operasyonel:     ~100-170K TL    ($3-5K)
Net yıllık değer:       ~1.5-2.2M TL
```

ROI ≥ **10x** aylık operasyonel maliyet (yıl 1).

---

## Risk Yönetimi — 3 En Yüksek

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Bayi portal'ı kullanmaz | Pilot 5 → kademeli + onboarding + paralel WA kanal |
| 2 | Tahmin doğruluk düşük | Naive baseline kıyas + manuel onay 3 ay + MLOps |
| 3 | Scraping yasal sorun | KVKK + bayi sözleşme + avukat + sadece firma verisi |

---

## Çıkarım — Niye Şimdi?

1. **Rakipler dijital olgunluk düşük** — Promats 2-3 yıl önde başlar
2. **Veri birikimi moat** — sonradan yetişmek zor
3. **Çin baskısı** — premium + hızlı teslim avantajını dijital ile pekiştir
4. **CBAM 2026** — sürdürülebilirlik raporu zorunlu olacak, hazırlık şimdi
5. **Multi-deployment hazırlık** — başka müşterilere konuşlanabilir kod tabanı

---

## Karar Beklenen 4 Soru

1. **Faz sıralaması** — Önce Paspas tamamlanma, paralel hazırlık. Onay?
2. **Bütçe başlangıç** — Senaryo A ($50-100/ay) onay?
3. **AI otomasyon eşiği** — İlk 3 ay tüm öneriler manuel onay; sonra kademeli aç. Onay?
4. **Marka isim (bayi tarafı)** — "Promats Bayi Portalı" / "MatPortal" / başka?

---

```
İletişim:          Orhan Güzel — orhanguzell@gmail.com
Doküman versiyonu: v1.1 — 2026-05-01
Detay:             docs/proje-teklifi/ (12 alt doküman)
                   docs/tartisma/      (15 derinlemesine teknik tartışma)
```
