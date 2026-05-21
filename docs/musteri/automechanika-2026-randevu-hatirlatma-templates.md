# Sprint 4 — Randevu Hatırlatma Mail Şablonları

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude
> **Hedef okuyucu:** ⚙️ Codex — `reminder.job.ts` cron'unda T-14/T-7/T-1 hatırlatma gönderiminde kullanılır
> **Bağlı:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 4

---

## Fark — Follow-up vs Randevu Hatırlatma

İki farklı sequence var, karıştırılmamalı:

| | [Follow-up sequence](automechanika-2026-followup-templates.md) | **Bu belge — Randevu hatırlatma** |
|---|---|---|
| Tetikleyici | Outreach gönderildi, **yanıt yok** | Aday Calendly slot **rezerve etti** |
| Zaman ekseni | T+3 / T+10 / T+30 (gönderim sonrası) | T-14 / T-7 / T-1 (randevu öncesi) |
| Ton | Hatırlatma, son temas | Teyit, lojistik bilgi |
| Hedef | "Hâlâ ilgilenir misiniz?" | "Görüşmemizi unutmayın, X gün X saatte" |

---

## Akış

```
Calendly slot rezerve edildi (webhook)
        ↓
appointment_datetime kaydedildi
        ↓
Cron job (her gün 09:00) kontrol eder:
  - T-14 mail gönderildi mi? → değilse gönder, mark sent
  - T-7  mail gönderildi mi? → değilse gönder, mark sent
  - T-1  mail gönderildi mi? → değilse gönder, mark sent
        ↓
Aday standa gelince stand brifing kartı kullanılır
```

`appointment_reminders` tablosu (yeni):
```sql
CREATE TABLE appointment_reminders (
  id char(36) NOT NULL,
  candidate_id char(36) NOT NULL,
  reminder_type ENUM('t_minus_14','t_minus_7','t_minus_1') NOT NULL,
  sent_at datetime NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cand_type (candidate_id, reminder_type)
);
```

---

## T-14 (2 Hafta Kala) — Teyit + Materyal

Tipik durum: aday Calendly üzerinden randevuyu aldı, mesaj almadı. Bu mail "randevumuzu hatırlatıyorum + materyal var mı yok mu" diyor.

### EN
**Konu:** `Confirming our Automechanika meeting on {date} - {company}`

```
Hi {first_name},

Just confirming our meeting at Automechanika Frankfurt on {date} at {time}.

We're at Hall 3.1, Booth D11. Bring nothing - we'll have samples and
catalogues on site.

If anything specific you'd like me to prepare in advance (a particular
SKU range, region pricing, sample quantity), reply to this and I'll
have it ready.

See you in {days_until} days.

{gonderici_ad_soyad}
Avrasya / ProMats
```

### DE
**Konu:** `Bestätigung unser Automechanika-Termin am {date} - {company}`

```
Hallo {first_name},

kurze Bestätigung unseres Termins auf der Automechanika Frankfurt am
{date} um {time} Uhr.

Wir sind in Halle 3.1, Stand D11. Bringen Sie nichts mit - Muster und
Kataloge haben wir vor Ort.

Falls Sie möchten, dass ich etwas vorab vorbereite (bestimmte SKU-Range,
Regionalkonditionen, Musterumfang), antworten Sie kurz und ich habe es
fertig.

Bis in {days_until} Tagen.

{gonderici_ad_soyad}
Avrasya / ProMats
```

### TR
**Konu:** `Automechanika randevumuzun teyidi - {date} - {company}`

```
Selam {first_name},

{date} tarihinde {time}'de Automechanika Frankfurt'taki görüşmemizin
kısa bir teyidi.

Hall 3.1, Stand D11'deyiz. Yanınızda bir şey getirmenize gerek yok -
numune ve kataloglar bizde.

Önceden hazırlamamı istediğiniz bir şey varsa (belirli SKU range, bölge
fiyatları, numune adedi), bu mesaja kısa bir yanıtla bildirin, hazır
ederim.

{days_until} gün sonra görüşürüz.

{gonderici_ad_soyad}
Avrasya / ProMats
```

---

## T-7 (1 Hafta Kala) — WhatsApp + son detay

Bu noktada aday seyahat planlamış oluyor. Mail daha kısa, **direkt iletişim kanalı açıyor**.

### EN
**Konu:** `1 week to Automechanika - my number for any last-minute changes`

```
Hi {first_name},

A week left until we meet at Automechanika. If any timing change is
needed, this is the easiest way to reach me:

WhatsApp / Direct: {gonderici_phone}

We've blocked your slot at {date} {time}, Hall 3.1 D11. Looking
forward.

{gonderici_ad_soyad}
Avrasya / ProMats
```

### DE
**Konu:** `Noch 1 Woche bis zur Automechanika - meine direkte Nummer`

```
Hallo {first_name},

eine Woche bis zu unserem Treffen auf der Automechanika. Falls sich
zeitlich etwas ändern muss, am schnellsten erreichen Sie mich über:

WhatsApp / Direkt: {gonderici_phone}

Wir haben Ihren Slot am {date} um {time} Uhr, Halle 3.1 D11, fest
geblockt.

{gonderici_ad_soyad}
Avrasya / ProMats
```

### TR
**Konu:** `Automechanika'ya 1 hafta - direkt numaram`

```
Selam {first_name},

Automechanika'ya 1 hafta kaldı. Saat değişikliği gerekirse en hızlı
yol:

WhatsApp / Direkt: {gonderici_phone}

{date} tarihinde {time}'deki slotunuz Hall 3.1 D11'de bloklu.

{gonderici_ad_soyad}
Avrasya / ProMats
```

---

## T-1 (1 Gün Kala) — Son not

Çok kısa. Aday muhtemelen yolda. **WhatsApp daha doğru olabilir** ama mail de gönderilir (yedek).

### EN
**Konu:** `Tomorrow at {time} - Hall 3.1 D11`

```
Hi {first_name},

See you tomorrow at {time}, Hall 3.1 D11.

If running late, WhatsApp me: {gonderici_phone}

{gonderici_ad_soyad}
```

### DE
**Konu:** `Morgen um {time} - Halle 3.1 D11`

```
Hallo {first_name},

bis morgen um {time} Uhr, Halle 3.1 D11.

Falls Sie sich verspäten, WhatsApp: {gonderici_phone}

{gonderici_ad_soyad}
```

### TR
**Konu:** `Yarın {time} - Hall 3.1 D11`

```
Selam {first_name},

Yarın {time}'de Hall 3.1 D11'de görüşürüz.

Gecikme olursa WhatsApp: {gonderici_phone}

{gonderici_ad_soyad}
```

---

## Placeholder Sözlüğü

| Placeholder | Kaynak | Format örneği |
|---|---|---|
| `{first_name}` | `lead_enrichment.decision_maker.name` ilk kelime, yoksa Calendly form'undan | "Peter" |
| `{company}` | `lead_candidates.name` | "Carmotion Polska Sp. z o.o." |
| `{date}` | Calendly slot tarihi | "Sept 10, 2026" (EN) / "10. September 2026" (DE) / "10 Eylül 2026" (TR) |
| `{time}` | Calendly slot saati (yerel CEST) | "14:30 CEST" |
| `{days_until}` | hesaplama (T-14 mailde "14") | "14" / "vierzehn" / "on dört" |
| `{gonderici_phone}` | `env.OUTREACH_SENDER_PHONE` | "+90 539 860 75 80" |
| `{gonderici_ad_soyad}` | `env.OUTREACH_SENDER_NAME` | "Ahmet Yılmaz" |

---

## Cron Job Mantığı (Codex için)

```typescript
// backend/src/jobs/reminder.job.ts (her gün 09:00 CEST)

async function runReminderJob() {
  const today = new Date();

  // Calendly slot rezerve etmiş ama henüz X tipi hatırlatma almamış adaylar
  const due = await db.query(`
    SELECT lc.id, lc.country,
           la.appointment_datetime,
           le.decision_maker
    FROM lead_candidates lc
    JOIN lead_appointments la ON la.candidate_id = lc.id
    LEFT JOIN lead_enrichment le ON le.candidate_id = lc.id
    WHERE la.appointment_datetime IS NOT NULL
      AND la.cancelled_at IS NULL
      AND DATE(la.appointment_datetime) > CURRENT_DATE
  `);

  for (const aday of due) {
    const daysUntil = daysBetween(today, aday.appointment_datetime);
    const reminderType = pickReminderType(daysUntil);  // 't_minus_14' | 't_minus_7' | 't_minus_1' | null
    if (!reminderType) continue;

    const alreadySent = await db.query(
      `SELECT 1 FROM appointment_reminders WHERE candidate_id=? AND reminder_type=?`,
      [aday.id, reminderType]
    );
    if (alreadySent.length > 0) continue;

    await sendReminder(aday, reminderType);
    await db.insert('appointment_reminders', {
      candidate_id: aday.id,
      reminder_type: reminderType,
      sent_at: new Date(),
    });
    await sleep(2000);  // rate-limit Postmark
  }
}

function pickReminderType(daysUntil: number): ReminderType | null {
  // toleranslı pencere — cron her gün çalışsa da hangi gün gönderildi tespiti
  if (daysUntil >= 13 && daysUntil <= 15) return 't_minus_14';
  if (daysUntil >= 6  && daysUntil <= 8)  return 't_minus_7';
  if (daysUntil === 1)                     return 't_minus_1';
  return null;
}
```

`lead_appointments` tablosu (yeni, Calendly webhook'tan dolar):
```sql
CREATE TABLE lead_appointments (
  id char(36) NOT NULL,
  candidate_id char(36) NOT NULL,
  appointment_datetime datetime NOT NULL,
  calendly_event_id varchar(255),
  cancelled_at datetime NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cand (candidate_id),
  KEY idx_dt (appointment_datetime)
);
```

---

## Calendly Webhook Entegrasyonu

Calendly free Basic plan **webhook desteklemiyor** (paid feature). İki seçenek:

### Seçenek A — Free plan + manuel sync (basit)
Avrasya export ekibi Calendly admin'inde gelen randevuları görür, **günlük 5 dk** market_pulse panel'ine elle "Aday X için randevu eklendi: 2026-09-10 14:30" girer. Sayı düşük olduğu için (~30 randevu) bu makul.

### Seçenek B — Calendly Standard $10/ay
Webhook açık → otomatik sync. Bütçeyi $10 daha artırır.

**Önerim:** Seçenek A başla, randevu sayısı 20+'a ulaşırsa B'ye geç. Avrasya görüşmesinde Calendly hesap kim açıyor netleşince karar verilir.

---

## Cancel / Reschedule Senaryoları

Aday Calendly üzerinden randevuyu **iptal ederse** veya **yeniden planlarsa**:

- İptal → `lead_appointments.cancelled_at = NOW()` set edilir → cron pas geçer
- Reschedule → `appointment_datetime` güncellenir → hatırlatma flag'leri **sıfırlanır**:
  ```sql
  DELETE FROM appointment_reminders WHERE candidate_id = ?;
  ```
  Böylece yeni tarihe göre T-14/T-7/T-1 tekrar gönderilir.

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- ✉️ İlk outreach (sade): [automechanika-2026-outreach-templates.md](automechanika-2026-outreach-templates.md)
- 🔄 Follow-up sequence (yanıt yok için, ayrı): [automechanika-2026-followup-templates.md](automechanika-2026-followup-templates.md)
- 📅 Calendly kurulum rehberi: [calendly-kurulum-rehberi.md](calendly-kurulum-rehberi.md)
- 🃏 Stand brifing kartı (randevu sonrası): [../teknik/stand-brifing-kart-sablon.md](../teknik/stand-brifing-kart-sablon.md)
