# Automechanika 2026 — Outreach Mail Şablonları (sade)

> **Tarih:** 2026-05-21 (v2 — sade sürüm)
> **Sahibi:** 🧠 Claude
> **Hedef okuyucu:** ⚙️ Codex — `lead_outreach_drafts` üretiminde bu şablonlar kullanılır
> **İlke:** Mail = stand randevusu daveti. **Satış argümanı yok**. Avrasya alıcıyla fuar standında konuşacak.
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 3

---

## Mail amacı

> "Hall 3.1 D11'deyiz. 10 dakika konuşalım mı?"

3 dilde × 1 varyant = **3 şablon**. Distribütör/E-com ayrımı yapmıyoruz çünkü mail çağrısı aynı (randevu); segmentasyon **ICP filtresinde** yapılır.

Her mail:
1. **Hook** (1 cümle) — kişiselleştirme (AI ürettiği bağlam)
2. **Avrasya kim** (1 cümle) — Türk paspas üreticisi
3. **Stand davet** (1 cümle) — Hall 3.1 D11, randevu sorusu
4. **Calendly** + imza

Toplam 4-5 satır gövde. 30 saniyede okunur.

---

## EN — English

**Konu:** `Automechanika Frankfurt - 10 min meeting? - Avrasya / ProMats`

```
Dear {alici_isim_varsa_yoksa_Sirs},

{kisisellestirme_paragrafi}

We're Avrasya / ProMats, a Turkish floor mat manufacturer exporting to 30+
markets. We'll be at Automechanika Frankfurt September 8-12, Hall 3.1, Booth D11.

Would you have 10 minutes for an on-site meeting?

Calendar: {calendly_link}

Best regards,
{gonderici_ad_soyad}
Avrasya / ProMats | www.promats.com.tr
```

---

## DE — Deutsch

**Konu:** `Automechanika Frankfurt - 10 Min Termin? - Avrasya / ProMats`

```
Sehr geehrte Damen und Herren,

{kisisellestirme_paragrafi}

Wir sind Avrasya / ProMats, ein türkischer Hersteller von Auto-Fußmatten mit
Lieferungen in über 30 Märkte. Vom 8. bis 12. September stehen wir auf der
Automechanika Frankfurt - Halle 3.1, Stand D11.

Hätten Sie 10 Minuten für einen Termin vor Ort?

Kalender: {calendly_link}

Mit freundlichen Grüßen,
{gonderici_ad_soyad}
Avrasya / ProMats | www.promats.com.tr
```

---

## TR — Türkçe

**Konu:** `Automechanika Frankfurt - 10 dk randevu? - Avrasya / ProMats`

```
Merhabalar,

{kisisellestirme_paragrafi}

Biz Avrasya / ProMats olarak Türkiye'de oto paspası üretiyoruz, 30+ ülkeye
sevkiyat yapıyoruz. 8-12 Eylül arası Automechanika Frankfurt'tayız —
Hall 3.1, Stand D11.

10 dakikalık bir görüşme için müsait olur musunuz?

Takvim: {calendly_link}

Saygılarımla,
{gonderici_ad_soyad}
Avrasya / ProMats | www.promats.com.tr
```

---

## Placeholder Sözlüğü (minimal)

| Placeholder | Kaynak | Değer |
|---|---|---|
| `{alici_isim_varsa_yoksa_Sirs}` | enrichment, yoksa "Sirs"/"Damen und Herren"/boş | dinamik |
| `{kisisellestirme_paragrafi}` | GPT-4o-mini, 1 cümle, aday firma websitesinden | dinamik |
| `{calendly_link}` | Avrasya export ekibi Calendly slot | sabit |
| `{gonderici_ad_soyad}` | Avrasya görüşmesinde belirlenecek | sabit |

---

## Kişiselleştirme Prompt — Sadeleştirilmiş

Eski prompt 2 cümleydi (hook + bridge). Yeni mail çok kısa olduğu için **1 cümle** yeter — sadece hook.

System prompt (kısaltılmış):

```
You are writing a single-sentence opening for a cold outreach email from
Avrasya / ProMats, a Turkish floor mat manufacturer, to a European company
attending or relevant to Automechanika Frankfurt 2026.

Output ONE sentence (15-25 words max) that:
1. References a SPECIFIC fact from the prospect's data (product range, country,
   sales channel, etc) — never invent
2. Matches the email language: EN, DE, or TR

Tone: respectful, factual, NOT salesy. No exclamation marks. No emojis.
No "We're excited to" / "Game changer" type phrases.
Output ONLY the sentence. No greeting.

Fallback if input data is thin (any language):
- EN: "We've seen your aftermarket programme covering the {country} market
  and noticed a clear product-range overlap with our floor mat line."
- DE: "Wir haben Ihr Aftermarket-Programm für den {country}-Markt gesehen
  und sehen klare Überschneidungen zu unserer Floor-Mat-Linie."
- TR: "{country} pazarındaki aftermarket programınızı inceledik; paspas
  serimizle net bir örtüşme görüyoruz."
```

Token tahmini: 200 input + 30 output = ~$0.02 / 500 aday.

---

## Spam Direnci

Eski belgedeki kurallar aynı:
- Konu satırı 8-12 kelime, Türkçe karakter yok
- Plain-text + HTML multipart
- 1 link (Calendly)
- `List-Unsubscribe` header (Postmark default)
- Domain warmup — ilk hafta 10/gün, sonra 30/gün

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🤖 Kişiselleştirme prompt (eski uzun): [../teknik/outreach-personalization-prompt.md](../teknik/outreach-personalization-prompt.md) — referans olarak kalır, bu mail için minimal kullanılır
- 🔄 Follow-up (sade): [automechanika-2026-followup-templates.md](automechanika-2026-followup-templates.md)
- 📞 Avrasya soru dosyası: [AVRASYA_SORULAR.md](AVRASYA_SORULAR.md)
