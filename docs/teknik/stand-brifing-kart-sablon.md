# Stand Brifing Kartı — 1 Sayfa / Aday (sade)

> **Tarih:** 2026-05-21 (v2 — sade sürüm)
> **Sahibi:** 🧠 Claude
> **Hedef okuyucu:** Avrasya stand çalışanları + ⚙️ Codex (PDF endpoint)
> **İlke:** Kart **bizim bulduğumuz bilgi** verir. **Satış argümanı / pitch / "ne söyleyin"** vermez — Avrasya kendi pitch'ini bilir.
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 4

---

## Bu kart neyi gösterir

Stand çalışanı görüşmeden önce 60 saniyede şu bilgiyi alır:
- **Firma kim** — adı, ülkesi, ölçeği
- **Ne satıyor** — bizim çıkardığımız ürün kategorileri
- **Niye geldi** — fuar bağlamı + ICP eşleşme nedeni
- **Karar verici** — varsa kim, pozisyonu

Görüşmenin geri kalanı **Avrasya export ekibinin doğal akışı**.

---

## Şablon (Markdown — Codex PDF render eder)

```markdown
# {firma_adi}
**Ülke:** {country} {city}    **ICP Skoru:** {lead_score}/10

## Stand bilgisi
| | |
|---|---|
| Bizim stand | Hall 3.1 D11 |
| Onların stand (varsa) | {their_hall} / {their_booth} |
| Komşu mu | {is_neighbor_yn}  |

## Randevu (varsa)
**Tarih + saat:** {appointment_datetime}
**Görüşülen kişi:** {decision_maker_name} ({decision_maker_title})
**Görüşme dili tercihi:** {language_pref}

## Firma — kim, ne yapıyor
{ai_summary}

**Ürün kategorileri (fuar sayfasından):**
- {product_group_1}
- {product_group_2}
- {product_group_3}

**Web sinyalleri:**
- B2B sinyali: {has_b2b_signals}
- Çin'den import sinyali: {has_china_signals}
- Private label arıyor mu: {has_private_label}
- Satış kanalları: {sales_channels_csv}

## ICP eşleşme — niye burada
{match_notes}

---
## Görüşme sonrası (stand çalışanı 30 sn doldurur)

İlgi düzeyi: ⚪ Soğuk | ⚪ Sıcak | ⚪ Kapanış yakın

İstedikleri:
[ ] Katalog    [ ] Fiyat listesi    [ ] Numune
[ ] Audit raporu    [ ] Private label    [ ] ODM
[ ] Diğer: ________________________

Sonraki adım:
⚪ Takip yok    ⚪ Mail at    ⚪ Numune gönder    ⚪ Telkonferans    ⚪ Teklif

Notlar (3 satır maks):
________________________________________________________
________________________________________________________

Stand çalışanı: _____________  Tarih: __/09/2026  Saat: ___:___
```

---

## Alan Sözlüğü

| Alan | Kaynak | Notlar |
|---|---|---|
| `{firma_adi}` | `lead_candidates.name` | Tam yasal isim |
| `{country}` `{city}` | `lead_candidates.country/city` | |
| `{lead_score}` | `lead_candidates.lead_score` | Decimal 0-10 |
| `{their_hall}` `{their_booth}` | `raw_data.fair_info.hall/booth_number` | Yoksa "—" |
| `{is_neighbor_yn}` | `raw_data.fair_info.is_neighbor` | "EVET ✓" / "—" |
| `{appointment_datetime}` | Calendly webhook | Walk-in ise "—" |
| `{decision_maker_name}/{title}` | `lead_enrichment.decision_maker` | Yoksa "Bilinmiyor" |
| `{language_pref}` | enrichment + country | "DE" / "EN" / "TR" |
| `{ai_summary}` | `lead_candidates.ai_summary` | 3-4 cümle TR |
| `{product_group_*}` | `raw_data.exhibitor.product_groups[]` | Top 3-5 |
| `{has_b2b_signals}` vs. | `raw_data.website_analysis.*` | "✓ var" / "—" |
| `{sales_channels_csv}` | `raw_data.exhibitor.sales_channels` | |
| `{match_notes}` | `raw_data.match.notes` | ICP eşleşme nedeni |

**Önceki belgede vardı, kaldırıldı:**
- ~~"NE SORACAĞIZ"~~ — Avrasya kendi sorularını bilir
- ~~"NE DEMEYECEĞIZ"~~ — Avrasya satış davranışını biz dikte etmiyoruz
- ~~"EKSTRA ARGÜMAN"~~ — Avrasya'nın pitch'ini biz yazmıyoruz
- ~~"NIYE BURADALAR" hipotez~~ — Stand çalışanı kendi okur

---

## Codex'in Yapacağı

```typescript
GET /admin/lead-machine/fair/brifing/:appointment_id.pdf
GET /admin/lead-machine/fair/brifing/day/:date.pdf      // toplu
POST /admin/lead-machine/fair/brifing/bulk              // body: ids[]
```

PDF stil: B/W printable, Inter font, A4 1.5cm margin. Puppeteer veya weasyprint.

---

## Kullanım

- T-7 gün: Avrasya tüm randevuların PDF setini indir, basılı kopya yanlarında olsun
- Fuar günü 08:30: O günkü kartlar stand'a getirilir
- Görüşme sonrası: alt kısım doldurulur, fotoğraflanır, panel'e yüklenir

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🛠️ Stand operasyon SOP: [../musteri/fuar-stand-operasyon-sop.md](../musteri/fuar-stand-operasyon-sop.md)
- ✉️ Outreach (sade): [../musteri/automechanika-2026-outreach-templates.md](../musteri/automechanika-2026-outreach-templates.md)
