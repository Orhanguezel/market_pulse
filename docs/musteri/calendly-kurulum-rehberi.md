# Calendly Kurulum Rehberi — Automechanika 2026

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 4 hazırlık)
> **Hedef okuyucu:** Avrasya export ekibinden Calendly hesabını açacak kişi (Avrasya görüşmesi sonrası belirlenir)
> **Süre:** 10-15 dakika (Avrasya'nın hesap açacak kişisinin yapacağı toplam iş)
> **Bağlı:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 4

---

## Niye Calendly

Outreach maillerinde {calendly_link} placeholder'ı var. Aday tıklar → "10 Eylül 14:30" gibi bir slot rezerve eder → fuar günü saatinde Avrasya standa gelir.

Alternatifsiz değil — TidyCal / Cal.com / Microsoft Bookings da çalışır. Ama Calendly:
- Free Basic plan (1 event type, sınırsız randevu)
- En geniş tanınırlık (alıcı "ne bu link?" diye düşünmez)
- Hızlı kurulum (10 dk)
- Türkçe arayüz mevcut

---

## Adım 1 — Hesap Aç (2 dk)

1. https://calendly.com/signup
2. Avrasya export ekibinin **kurumsal mail'i** ile aç (örn. `info@promats.com.tr` veya export sorumlusunun şahsi maili)
3. "Calendly URL" oluştur — öneri: `calendly.com/avrasya-export` veya `calendly.com/promats-export`
4. Free Basic plan onayla (kredi kartı istemiyor)

---

## Adım 2 — Tek "Event Type" Tanımla (5 dk)

Free plan **1 event type** veriyor. Aşağıdaki ayarlarla bir tane oluştur:

### Genel
- **Event Name:** `Automechanika Frankfurt - 10 min meeting`
- **Location:** `In person — Hall 3.1 Booth D11, Messe Frankfurt`
- **Duration:** `15 minutes` (10 dk görüşme + 5 dk transition)
- **Color:** Brand teal (eğer Avrasya rengi farklıysa onu kullan)
- **Description:**
  ```
  10-minute meeting at the Avrasya / ProMats booth, Hall 3.1, Booth D11.

  Please bring your business card. We'll have samples and catalogues on site.

  If you need to reschedule, use the link in your confirmation email.
  ```

### Availability — Fuar günleri

Sadece **4 fuar günü** (Salı 8 Eylül - Cuma 12 Eylül) açık olsun. Calendly "Date Range" ile:

- **Available dates:** `September 8-12, 2026`
- **Time zone:** `Europe/Berlin (CEST)` — alıcılara gösterilirken otomatik yerel saate çevirir

Günlük açık saatler:
| Gün | Açık | Kapanış | Slot sayısı (15 dk) |
|---|---|---|---|
| Salı 8 Eylül | 09:00 | 18:00 | 32 |
| Çarşamba 9 Eylül | 09:00 | 18:00 | 32 |
| Perşembe 10 Eylül | 09:00 | 18:00 | 32 |
| Cuma 11 Eylül | 09:00 | 18:00 | 32 |
| Cumartesi 12 Eylül | 09:00 | 16:00 | 28 |

**Toplam teorik 156 slot.** K-6 gerçekçi hedef 30-35 randevu — yeter (10x manevra alanı).

### Buffer time
- **Before event:** `5 minutes` (önceki görüşmeden geçiş)
- **After event:** `0 minutes` (slot bitişik akar)

### Limits
- **Max bookings per day:** `12` (önceden boş hayal kurmamak için — gerçekçi günlük kapasite)
- **Min scheduling notice:** `2 hours` (son dakika rezervasyonu)

---

## Adım 3 — Form Alanları (3 dk)

Calendly "Booking Page Questions" — randevu alırken aday hangi bilgileri girer.

**Zorunlu alanlar:**
- Name (default)
- Email (default)
- **Company name** (custom — text)
- **Your role / position** (custom — text)
- **Country** (custom — dropdown DE/AT/NL/PL/FR/Other)

**Opsiyonel:**
- Specific topics you want to discuss (textarea, opsiyonel — adayın aklındaki konu)

---

## Adım 4 — Confirmation Email (2 dk)

Calendly otomatik onay maili gönderir. Default'u **özelleştir**:

```
Subject: Confirmed - your Automechanika meeting on {date} at {time}

Body:
Thanks for booking!

📅 {date} at {time} (Europe/Berlin)
📍 Hall 3.1, Booth D11 - Messe Frankfurt
👤 With: Avrasya / ProMats export team

Need to change or cancel? Use the link below.

See you in Frankfurt.

Avrasya / ProMats
www.promats.com.tr
```

Reminder emails (Calendly otomatik):
- 24 saat öncesinde mail
- 1 saat öncesinde mail

Bizim T-14/T-7/T-1 hatırlatma cron'umuz **bu Calendly otomatik mail'lerine ek olarak** çalışır — daha kişiselleştirilmiş ve takvim entegrasyonu olmadan.

---

## Adım 5 — Public Link + Webhook Kurulumu (3 dk)

### Public link
Sayfa hazır olduktan sonra Calendly **public link** verir:
```
https://calendly.com/avrasya-export/automechanika-frankfurt-10-min-meeting
```

Bu link mail template'lerindeki `{calendly_link}` placeholder'a girer:

```bash
# market_pulse backend/.env
CALENDLY_LINK=https://calendly.com/avrasya-export/automechanika-frankfurt-10-min-meeting
```

### Per-aday tracking (opsiyonel)
Calendly link'i query string ile **prefill** edilebilir → analytics:
```
{base_url}?utm_source=outreach&utm_campaign=automechanika2026&candidate={candidate_id}
```

Codex `draft.service.ts`'te her aday için unique `utm_content={candidate_id}` ekler. Calendly bunu rezervasyon'a saklar → market_pulse rezervasyon→aday eşleştirmesi yapar (webhook olmasa bile günlük export ile).

### Webhook (paid — opsiyonel)
Free plan'da yok. Eğer Avrasya Standard $10/ay'a geçerse:
- Webhook URL: `https://api.market-pulse.io/webhooks/calendly`
- Event: `invitee.created`, `invitee.canceled`
- Otomatik olarak `lead_appointments` tablosuna yazar

Free plan'da kalırsanız: günlük 5 dk Calendly admin → market_pulse panele elle giriş.

---

## Adım 6 — Test (1 dk)

Hesap açıldıktan sonra **incognito tab**'da link'i aç:
- 8 Eylül için bir slot seç
- Test mail'i ile rezerve et (örn. test@orhanguezell.gmail.com)
- Confirmation mail geldi mi kontrol
- Calendly admin panel'de rezervasyon görünüyor mu
- Test rezervasyonunu iptal et

---

## Adım 7 — Avrasya Export Ekibi Eğitimi (T-21 günü, fuara 3 hafta kala)

15 dakikalık Zoom oturumu — Avrasya'nın Calendly kullanacak kişisine:

1. **Login bilgileri paylaş**
2. **Günde 5 dk:** admin panel'i aç, yeni randevuları gör, market_pulse'a manuel gir (webhook yoksa)
3. **Cancel/reschedule:** aday değiştirirse market_pulse panel'inden cron sıfırlama nasıl
4. **Conflict resolution:** aynı saatte 2 rezervasyon olmaması için Calendly otomatik blok — manuel ayar gerekmez

---

## Limit Kontrol (Free Plan ile yetinmek için)

Free Basic plan limitleri:
- ✅ 1 event type (yeterli)
- ✅ Sınırsız randevu
- ✅ Calendar sync (Google/Outlook)
- ❌ Webhook (yukarıda alternatif)
- ❌ Multi-host (1 kişi — Avrasya export sorumlusu)
- ❌ Custom branding (Calendly logosu görünür — kabul edilebilir)
- ❌ Reminder customization (otomatik mail'ler standart — biz kendi cron'umuzla destekliyoruz)

**Free yeter.** Standard'a ($10/ay) sadece webhook için geçilir → bu aşamada gereksiz.

---

## Sprint 4 Yeşil Işık (Calendly tarafı)

- [ ] **Avrasya** — Calendly hesabı açıldı, event type kuruldu
- [ ] **Avrasya** — Public link Orhan'a paylaşıldı
- [ ] **⚙️ Codex** — `.env`'e `CALENDLY_LINK` girildi
- [ ] **⚙️ Codex** — Mail template'lerinde `{calendly_link}` placeholder doğru dolduruluyor mu test
- [ ] **🧠 Claude veya Orhan** — Test rezervasyonu yapıldı, akış doğrulandı
- [ ] **Avrasya** — Günlük 5 dk Calendly→market_pulse manuel sync rutini onaylandı

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- ✉️ Outreach template (Calendly link burada): [automechanika-2026-outreach-templates.md](automechanika-2026-outreach-templates.md)
- 🔔 Hatırlatma template'leri (Calendly sonrası): [automechanika-2026-randevu-hatirlatma-templates.md](automechanika-2026-randevu-hatirlatma-templates.md)
- 🛠️ Stand operasyon SOP'u (fuar günü randevu listesi): [fuar-stand-operasyon-sop.md](fuar-stand-operasyon-sop.md)
