# Automechanika 2026 — Follow-up Mail (sade)

> **Tarih:** 2026-05-21 (v2 — sade sürüm)
> **Sahibi:** 🧠 Claude
> **Hedef okuyucu:** ⚙️ Codex — cron job ile T+3 / T+10 / T+30 gönderir
> **İlke:** Yanıt yoksa **2 hatırlatma**, sonra **kapanış**. Satış pitch'i yok.
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 6

---

## Akış mantığı

| Tetik | Zaman | Mail |
|---|---|---|
| İlk outreach gönderildi | T+0 | (Avrasya görüşme öncesi gönderilmez) |
| Yanıt yok | T+3 | Hatırlatma 1 (kısa) |
| Yanıt yok | T+10 | Hatırlatma 2 (durum kontrolü) |
| Yanıt yok | T+30 | Kapanış (son mail) |
| Yanıt geldi → randevu alındı | — | Cron durur, manuel takip |

**Stand görüşmesi sonrası (post-show)** akışı **ayrı**: Avrasya stand çalışanı brifing kartında "Numune gönder / Telkonferans / Teklif" işaretlerse, **manuel takip Avrasya'ya devredilir**. Bu cron mantığı **sadece fuar öncesi** çalışır.

---

## Hatırlatma 1 — T+3 gün

Stand davetimize henüz dönmemiş adaylara. Tek cümlelik hatırlatma.

### EN
**Konu:** `Re: Automechanika Frankfurt - 10 min meeting?`

```
Hi {alici_isim_varsa_yoksa_team},

Quick reminder: we're at Automechanika Frankfurt Sept 8-12, Hall 3.1 Booth D11.
If a brief on-site meeting fits your schedule, here's my calendar: {calendly_link}

Best,
{gonderici_ad_soyad}
Avrasya / ProMats
```

### DE
**Konu:** `Re: Automechanika Frankfurt - 10 Min Termin?`

```
Hallo {alici_isim_varsa_yoksa_team},

kurze Erinnerung: wir sind 8.-12. September auf der Automechanika Frankfurt,
Halle 3.1, Stand D11. Falls ein kurzer Termin passt: {calendly_link}

Beste Grüße,
{gonderici_ad_soyad}
Avrasya / ProMats
```

### TR
**Konu:** `Re: Automechanika Frankfurt - 10 dk randevu?`

```
Selam {alici_isim_varsa_yoksa_ekip},

Kısa bir hatırlatma: 8-12 Eylül arası Automechanika Frankfurt - Hall 3.1
Stand D11. Kısa bir görüşme uygunsa: {calendly_link}

Selamlar,
{gonderici_ad_soyad}
Avrasya / ProMats
```

---

## Hatırlatma 2 — T+10 gün

Durum kontrolü, baskısız. "Yanıt vermek doğru zaman değilse haber verin" tonu.

### EN
**Konu:** `Last check - Automechanika visit?`

```
Hi {alici_isim_varsa_yoksa_team},

No pressure - just wanted to check before the show fills up. If this isn't
the right time, no problem at all. Otherwise: {calendly_link}

Best,
{gonderici_ad_soyad}
```

### DE
**Konu:** `Letzte Nachfrage - Automechanika-Besuch?`

```
Hallo {alici_isim_varsa_yoksa_team},

ganz unverbindlich - kurze Nachfrage vor der Messe. Falls der Zeitpunkt
nicht passt, gerne. Sonst: {calendly_link}

Beste Grüße,
{gonderici_ad_soyad}
```

### TR
**Konu:** `Son kontrol - Automechanika ziyareti?`

```
Selam {alici_isim_varsa_yoksa_ekip},

Baskısız bir kontrol - fuar dolmadan bir kez daha soruyorum. Şu an doğru
zaman değilse sorun değil. Aksi halde: {calendly_link}

Selamlar,
{gonderici_ad_soyad}
```

---

## Kapanış — T+30 gün

Son mail. "Daha fazla rahatsız etmeyeceğiz." Negatif yanıt bile cevaplanabilir.

### EN
**Konu:** `Closing this thread - Automechanika`

```
Hi {alici_isim_varsa_yoksa_team},

No response since our note - completely understandable. This is my last
message in this thread. If something changes on your end before September,
my line is always open: {calendly_link}

Best,
{gonderici_ad_soyad}
Avrasya / ProMats
```

### DE
**Konu:** `Letzte Nachricht - Automechanika`

```
Hallo {alici_isim_varsa_yoksa_team},

keine Rückmeldung seit unserer Nachricht - völlig verständlich. Das ist
meine letzte Nachricht in diesem Thread. Falls sich bei Ihnen vor September
etwas ändert: {calendly_link}

Beste Grüße,
{gonderici_ad_soyad}
Avrasya / ProMats
```

### TR
**Konu:** `Son nota - Automechanika`

```
Selam {alici_isim_varsa_yoksa_ekip},

Mesajımızdan beri yanıt gelmedi - tamamen normal. Bu konudaki son
mesajımız. Eylül öncesi tarafınızda durum değişirse: {calendly_link}

Saygılarımla,
{gonderici_ad_soyad}
Avrasya / ProMats
```

---

## Cron Mantığı (Codex için)

```typescript
// backend/src/jobs/followup.job.ts (her gün 09:00 İstanbul)

async function runFollowupJob() {
  // T+3 hatırlatma
  await sendIfDue('reminder_1', daysSinceSent: 3);
  // T+10 hatırlatma
  await sendIfDue('reminder_2', daysSinceSent: 10);
  // T+30 kapanış
  await sendIfDue('closing', daysSinceSent: 30);
}

// "sendIfDue" mantığı:
// - Aday yanıt verdi (replied_at NOT NULL) → SKIP, otomatik cron durdu
// - Aday Calendly slot rezerve etti → SKIP
// - Önceki adımda manuel "stop sequence" işaretlendi → SKIP
// - Aksi halde gönder
```

`lead_outreach_drafts` tablosu yeterli. Yeni alan: `sequence_step` (initial / reminder_1 / reminder_2 / closing).

---

## Önemli — Post-show akışı bu dosyada YOK

Fuar sonrası "numune gönder / teklif yolla" mailleri **Avrasya'nın işi**, Market Pulse otomasyonu değil. Stand brifing kartında karar işaretlenirse Avrasya export ekibi manuel yapar.

Önceki belgedeki "Sequence A/B/C" (numune, telkonferans, teklif) **kaldırıldı** çünkü:
- Numune talebi → Avrasya operasyonu (kargo, evrak)
- Teklif maili → Avrasya'nın fiyat listesi, MOQ, Incoterms kararı
- Bu işler bizim otomasyonumuzun kapsamı değil

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- ✉️ İlk outreach (sade): [automechanika-2026-outreach-templates.md](automechanika-2026-outreach-templates.md)
- 📞 Avrasya soru dosyası: [AVRASYA_SORULAR.md](AVRASYA_SORULAR.md)
