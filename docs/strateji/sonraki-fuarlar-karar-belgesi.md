# Sonraki Fuarlar — Tekrarlanabilir Paket Kararı

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude
> **Durum:** Strateji taslağı — Automechanika 2026 KPI raporu sonrası finalize
> **Hedef:** Automechanika 2026'yı **tek seferlik proje değil**, **tekrarlanabilir SaaS şablonu** olarak çerçevele
> **Bağlı:** [MARKET_PULSE_SAAS_PLANI.md](MARKET_PULSE_SAAS_PLANI.md) Bölüm 3 (Fair Discover modülü) + [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 6

---

## TL;DR

Automechanika 2026 sistemi **fuar-agnostik** olacak şekilde inşa edildi (Codex'in "generic fair runner abstraction" işi). Şu an Avrasya/Paspas için somut, gelecek 12-18 ayda **3 ek fuar için tekrar koşacak**:

1. **Reifen Essen 2026** (Mayıs 2026 — eğer hâlâ açık penceredeyse, aksi 2028)
2. **Equip Auto Paris** (Ekim 2026 veya 2027 — Avrasya'nın FR pazar genişleme planı varsa)
3. **Automechanika Istanbul** (Mart-Nisan 2027 — Avrasya yerel pazar, kapsam farklı olabilir)

Her fuar için **2-4 saatlik kurulum** + **otomatik 8-12 hafta operasyon**.

---

## 1. Tekrarlanabilirlik Mimarisi (Codex'in işi)

`fair.job.ts` ve `enrichment.job.ts` zaten parametrik. Yeni fuar eklemek için tek-seferlik:

```typescript
// scripts/seed-new-fair.ts
const newFair = {
  name: 'Reifen Essen 2026',
  dates: '2026-05-26/2026-05-29',
  url: 'https://www.reifen-messe.de/.../exhibitor-search',
  hall_filter: ['1', '2', '5'],  // ICP relevant hall'lar
  host_exhibitor: {
    name: 'Avrasya Paspas',
    brand: 'ProMats',
    hall: '?',  // stand ayarlandığında doldurulur
    booth: '?',
  },
};

// 3 işlem:
// 1. ICP variant seed (varsa) — özellikle "winter mat" gibi sezonsal kategori
// 2. Codex: fair.scraper.ts test — Reifen Messe DOM yapısı uyumlu mu (Messe Frankfurt değil!)
// 3. Onay paneli filter — channel='trade_fair' AND raw_data.fair_info.name='Reifen Essen 2026'
```

**Önemli:** Reifen Essen Messe Frankfurt değil, **Messe Essen** — DOM yapısı farklı, Codex'in `extract_fair_exhibitor` Messe Essen branch'i de yazması gerek. Yeni fuar = **1 günlük selector kalibrasyonu**.

---

## 2. Fuar Karşılaştırma — Avrasya İçin Hangi Fuar Ne Kadar Değerli?

| Fuar | Tarih | Pazar | Ziyaretçi | Avrasya hedef | Tekrar maliyet (sistem) | Tahmini ROI |
|---|---|---|---|---|---|---|
| **Automechanika Frankfurt 2026** (ana) | Eyl 2026 | Global | 100K | DE/POL/AT/NL/FR distribütör | (mevcut) | Pilot |
| **Reifen Essen** | Mayıs 2026 / 2028 | Lastik + paspas | ~50K | DACH winter mat distribütör | 1 gün selector | Orta |
| **Equip Auto Paris** | Ekim odd-yıl | FR + güney AB | ~100K | FR + Iberia distribütör | 1 gün selector | Yüksek (yeni pazar) |
| **Automechanika Istanbul** | Mart-Nisan 2027 | TR + Orta Doğu | ~50K | İhracat genişleme — Orta Doğu | (mevcut Messe Frankfurt platformu) | Orta |
| **Eurasia Tyre & Auto Show** | Mayıs 2026 | TR + Balkan | ~30K | Türk pazarı (zaten güçlü) | 1 gün selector | Düşük |
| **Equip Auto Algiers** | Ekim 2026 | Cezayir + Mağrip | ~20K | Mağrip distribütör | 1 gün selector | Düşük-Orta |
| **Automechanika Ho Chi Minh / Dubai** | değişken | Vietnam/Orta Doğu | ~50K | Uzak — Avrasya henüz hazır değil | (mevcut platform) | Erken |

**Önerim:**
1. **Equip Auto Paris 2027** — eğer Automechanika Frankfurt 2026 başarılıysa (özellikle FR pazarındaki dönüşüm zayıfsa, Paris fuarı **direkt FR pazara** odaklı bir reset)
2. **Automechanika Istanbul 2027** — yerel pazar + Orta Doğu için pilot (Avrasya'nın iç pazar deneyimi zaten var, sistem orada test sahası olur)
3. **Reifen Essen** — sadece eğer Avrasya **winter mat / all-season** segmentine genişlerse (şu an sezonsal değil)

---

## 3. Paket Olarak Satılır mı?

**Soru:** Market Pulse'ı Avrasya dışındaki **diğer ihracatçı Türk firmalara** "Fuar Lead Paketi" olarak sat.

### Ürün konumlama
> "Otomotiv aksesuar / oto yedek parça / mobilya / tekstil ihracatçı firmasısınız ve **Automechanika / IFA / Möbel / IMM Cologne** gibi fuarlara katılıyorsunuz. Bizim sistem fuar öncesi 60-100 hedef alıcıyı bulup randevu yakalar."

### Fiyatlandırma seçenekleri

| Tier | Aylık | Kapsam | Hedef müşteri |
|---|---|---|---|
| Fuar-Tek | 3.000-5.000 TL × 3 ay | 1 fuar, 60-100 mail, 30 randevu | KOBİ ihracatçı |
| Fuar-Sürekli | 1.500-2.500 TL/ay | Yıllık 2-3 fuar abonelik | Orta ölçek üretici |
| Fuar-Premium | 7.500-10.000 TL/ay | Multi-fuar + custom ICP + dedicated support | Büyük üretici |

Maliyet tarafı (per müşteri):
- Hunter free 50 credit/ay — yeterli (50 firma için)
- Postmark free 100 mail/ay — yeterli
- GPT-4o-mini ~$1/ay
- Marjı: %85-95 (servis maliyeti çok düşük)

### Pazarlama açısı

Master plan [Bölüm 4 senaryolar](MARKET_PULSE_SAAS_PLANI.md) zaten "**Senaryo 3: İhracatçı KOBİ — B2B lead bulma**" diye geçiyor — bu fuar paketi onun **somut, ölçülebilir ürün versiyonu** olabilir.

**Önerim:** Avrasya 2026 başarı raporu (KPI) sonrasında **ProMats vaka çalışması** olarak yaz, Türk ihracatçı KOBİ'lere case study olarak göster.

---

## 4. Çekirdek Tasarım — Fuar-Agnostik

Codex'in inşa ettiği sistemin agnostik kısımları:

| Bileşen | Fuar-spesifik mi? | Yeniden kullanılabilir mi? |
|---|---|---|
| `fair.scraper.ts` — Messe Frankfurt API | ✅ Messe Frankfurt | Diğer Messe Frankfurt fuarları (Automechanika Istanbul, Frankfurt Buchmesse vs) için tek dosya kalibrasyon |
| `fair.scraper.ts` — Messe Essen branch | ⚠️ Yeni eklenmeli | 1 günlük iş |
| ICP filtre + `icp.matcher.ts` | ⚠️ ICP variant'ı sektöre bağlı | Aynı sektördeki (paspas) fuarlar için aynı; yeni sektör (mobilya, tekstil) için yeni ICP variant |
| `enrichment.service.ts` (Hunter) | ❌ Tamamen agnostik | %100 yeniden kullan |
| `outreach/draft.service.ts` (mail taslak) | ⚠️ Template ürüne bağlı | Mail kopyaları yeni ürün için yeniden yazılır (3 dil × 1 template = ~30 dk iş) |
| `reminder.job.ts` (T-14/T-7/T-1) | ❌ Agnostik | %100 yeniden kullan |
| `followup.job.ts` (T+3/T+10/T+30) | ❌ Agnostik | %100 yeniden kullan |
| Calendly entegrasyon | ❌ Agnostik | Yeni event type 5 dk kurulur |
| Stand brifing PDF endpoint | ❌ Agnostik | %100 yeniden kullan |
| Mobile fair-day paneli | ❌ Agnostik | %100 yeniden kullan |

**Yeni fuar ekleme efor tahmini:**
- Aynı sektör + aynı fuar organizatörü (Messe Frankfurt) → **2 saat**
- Aynı sektör + yeni fuar organizatörü → **1 gün**
- Yeni sektör → **2-3 gün** (ICP variant + mail template)

---

## 5. Karar Bekleyen Sorular (Avrasya görüşmesi sonrası)

Bunlar Automechanika 2026 KPI raporundan sonra netleşecek:

1. **Avrasya'nın sıradaki fuarı hangisi?**
   - Eğer Frankfurt'ta DE/POL distribütör havuzu **doyduysa** → FR'a geç (Equip Auto Paris)
   - Eğer çıktı çok iyi → Frankfurt 2028'i sürdür + yan fuar (Equip Auto?)
   - Eğer çıktı düşük → kök neden analizi, sistem değil hedef kitle/ürün?

2. **Avrasya sistemi sürdürmek ister mi?**
   - Free tier altyapı maliyeti $10/ay, **çok düşük**. Avrasya yıllık 12 × $10 = $120 yatırımla **sürekli lead production** yapabilir
   - Veya **fuara-özel** kullanım, fuarlar arası kapatılır

3. **Paspas dışı ürün?**
   - Avrasya'nın başka B2B kanal hedefi varsa (örn. fitness mat, ev paspası) sistem aynı altyapıyla 2-3 günlük kalibrasyonla genişler

---

## 6. Sonraki Fuarlar — Kontrol Listesi

Yeni bir fuar açılırken Avrasya tarafıyla şunu sor:

- [ ] Fuar hangi sektör (kategorinizle uyumlu mu)?
- [ ] Fuar hangi organizatör (Messe Frankfurt mu, başka mı)?
- [ ] Avrasya bu fuara stand kuruyor mu (stand bilgisi olmadan brifing kart sistemi anlamsız)?
- [ ] Hedef pazar (DE/FR/IT/TR/Orta Doğu/Mağrip) ICP'ye eklenecek mi?
- [ ] Fuar tarihi 12+ hafta sonra mı (yeter ki tüm sistem akış için yeterli zaman olsun)?

Yeşil ışıksa Codex'e iş paketi gönderilir:
1. Yeni fuar URL'i scraper-service test
2. ICP variant seed
3. Stand brifing template'inde fuar adı + booth değişir
4. Mail template'inde tarih placeholder'ları (yeni `{fair_date}`)
5. Calendly yeni event type kurulur

---

## 7. Pazara Satış Açısı (Market Pulse SaaS olarak)

Eğer Avrasya pilotu başarılıysa, **Türk ihracatçı KOBİ'ye satış kanalı** açılır:

### Soğuk satış pitch'i (15 sn)

> "Otomotiv aksesuar / mobilya / tekstil ihracatçısınız. Automechanika, IMM Cologne, Mossa Italia gibi fuarlara gidiyorsunuz. Sistemimiz fuar öncesi 60-100 hedef alıcıyı buluyor, randevuyu Calendly'ye düşürüyor. Standınıza giderken takviminizde 30+ randevu hazır. Aylık 1.500 TL."

### Pazar boyutu (kabaca)

- Türk ihracatçı KOBİ: ~80.000 firma (TIM verisi)
- Yılda en az 1 yurt dışı fuara giden: ~5.000-10.000
- Hedef pazar (kullanılabilir): ~2.000-4.000 KOBİ
- %1 dönüşüm → 20-40 müşteri
- 30 müşteri × 1.500 TL × 12 ay = ~540K TL/yıl (~$18K)

Bu **küçük ama gerçek bir gelir hattı**. Avrasya başarısı kanıtsal hikaye olur.

---

## 8. Sonraki Aksiyonlar (KPI raporu sonrası)

- [ ] **KPI raporu çıkışı** ([automechanika-2026-kpi-rapor-sablonu.md](../musteri/automechanika-2026-kpi-rapor-sablonu.md))
- [ ] **Avrasya yönetimi ile post-show oturum** — sürdür / kapat / genişlet kararı
- [ ] **Eğer sürdür/genişlet:** Bir sonraki fuar seçimi (yukarıdaki §2 tablosundan)
- [ ] **Eğer pazara açılacak:** Vaka çalışması (ProMats) yazımı + ilk 5 hedef Türk ihracatçı KOBİ'ye soğuk outreach (kendi sistemimizi kendimize satıyoruz)
- [ ] **Codex** — "Generic fair runner" abstraction (zaten Sprint 6 işi listesinde, çoğunluk yapıldı): yeni fuar eklemeyi 2 saatlik CLI komutuna indir

---

## 9. Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 📊 KPI rapor şablonu: [../musteri/automechanika-2026-kpi-rapor-sablonu.md](../musteri/automechanika-2026-kpi-rapor-sablonu.md)
- 🏗️ Master SaaS planı: [MARKET_PULSE_SAAS_PLANI.md](MARKET_PULSE_SAAS_PLANI.md) — Bölüm 4 (senaryolar), Bölüm 7 (fiyatlandırma)
- 🎯 ICP variant'lar: [../teknik/icp-automechanika-final.md](../teknik/icp-automechanika-final.md) (yeni fuar = yeni ICP variant)
- ✉️ Outreach template'leri (yeni fuara kopyalanır): [../musteri/automechanika-2026-outreach-templates.md](../musteri/automechanika-2026-outreach-templates.md)
