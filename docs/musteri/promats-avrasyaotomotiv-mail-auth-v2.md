# Avrasya — Mail Kimlik Doğrulama Durumu v2 (Yeni Bulgu)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude
> **Tetik:** PoC çıktısında Avrasya'nın **gerçek iletişim mail'i `info@avrasyaotomotiv.net`** çıktı — bizim varsaydığımız `info@promats.com.tr`'den farklı
> **Bağlı:** [promats-email-auth-durumu.md](promats-email-auth-durumu.md) — eski v1 (promats.com.tr için)
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) K-2 + Sprint 3

---

## Yönetici Özeti

| Domain | MX | SPF | DKIM | DMARC | Toplam Sağlık |
|---|---|---|---|---|---|
| promats.com.tr (eski varsayım) | ✅ | ✅ `-all` | ⚠️ tespit edilemedi | ❌ yok | 🟡 Orta |
| **avrasyaotomotiv.net (gerçek)** | ✅ | ⚠️ `?all` (neutral) | ⚠️ tespit edilemedi | ❌ yok | 🔴 **Kötü** |

**Sonuç: K-2 kararı revize edilmeli.** Outreach gönderici domain'i kararı Avrasya görüşmesinde tekrar onaylanmalı (`promats.com.tr` mi `avrasyaotomotiv.net` mı). İkisi de iyileştirme gerektirir; **promats.com.tr** daha sağlıklı başlangıç noktası.

---

## Ham Tarama — avrasyaotomotiv.net

```bash
$ dig +short MX avrasyaotomotiv.net
10 mx01.avrasyaotomotiv.net.

$ dig +short A avrasyaotomotiv.net
(IP atanmış — kendi sunucu)

$ dig +short TXT avrasyaotomotiv.net
"v=spf1 ip4:93.89.226.0/24 ip4:93.89.232.0/24 ?all"

$ dig +short TXT _dmarc.avrasyaotomotiv.net
(boş — DMARC yok)

$ for sel in google default selector1 selector2 mail dkim s1 s2 k1; do
    dig +short TXT "${sel}._domainkey.avrasyaotomotiv.net"
  done
(hepsi boş — DKIM yaygın selector'larda yok)
```

---

## SPF — `?all` Neutral KÖTÜ

`v=spf1 ip4:93.89.226.0/24 ip4:93.89.232.0/24 ?all`

Soft-fail veya hard-fail değil — **neutral** (`?all`). Bu:
- "Bu domain'den gelen mail yetkili mi karar verme" demek
- Spam filtreler için "korunmayan domain" sinyali
- Spoofing engellemiyor — herhangi biri `@avrasyaotomotiv.net` adresinden gönderebilir, SPF onu durdurmaz

**Düzeltme:** `?all` → `-all` (hard fail). Eğer Avrasya 3. taraf mail gönderim hizmeti kullanıyorsa (örn. Postmark, Brevo, Mailgun) onun include'unu da eklemek gerekir:
```
v=spf1 ip4:93.89.226.0/24 ip4:93.89.232.0/24 include:spf.postmarkapp.com -all
```

## DMARC — YOK (kritik)

promats.com.tr ile aynı durum. Düzeltme aynı (v1 belge §"Avrasya BT'ye gönderilecek talep" bölümü):

```
_dmarc.avrasyaotomotiv.net  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@avrasyaotomotiv.net; ruf=mailto:dmarc-reports@avrasyaotomotiv.net; fo=1; aspf=r; adkim=r"
```

## DKIM — Tespit Edilemedi

Yaygın selector'larda yok. Mail sunucusunun kendi cPanel'inde DKIM ayarı yapılmamış olabilir, veya farklı bir selector kullanıyor olabilir. Avrasya BT'den selector öğrenilmeli.

---

## K-2 Kararının Yeniden Değerlendirilmesi

**Eski K-2:** "Mail gönderici domain: `info@promats.com.tr`"

**Yeni durum:** Avrasya'nın gerçek kurumsal mail'i `info@avrasyaotomotiv.net`. Avrasya görüşmesinde 3 seçenek değerlendirilmeli:

### Seçenek A — promats.com.tr (eski karar — önerilen)
- ✅ SPF `-all` (hard fail, sağlıklı)
- ⚠️ DMARC + DKIM eksik ama eklenmesi kolay
- ✅ ProMats markası = export marka, fuar bağlamına uygun
- ❌ Avrasya CRM'de kullanılmıyor olabilir (kurumsal mail `.net`)

### Seçenek B — avrasyaotomotiv.net (PoC'de tespit edilen)
- ❌ SPF `?all` (neutral, korumasız)
- ❌ DMARC + DKIM eksik
- ✅ Avrasya'nın gerçek aktif mail'i — yanıt buraya gelir
- ⚠️ "avrasyaotomotiv" karmaşık brand, "ProMats" daha akılda kalıcı

### Seçenek C — yeni özel subdomain
- `outreach.promats.com.tr` veya `b2b.avrasyaotomotiv.net`
- Postmark/Brevo verified sender — temiz IP'den gönderim, ana domain etkilenmez
- Daha uzun setup süresi (DNS değişiklik + verify)

---

## Önerim (Claude)

**Hybrid: promats.com.tr (Seçenek A) + Postmark gönderici altyapısı.**

Gerekçe:
1. promats.com.tr SPF zaten doğru (`-all`)
2. DMARC + DKIM eklemesi 1 günlük iş
3. Avrasya marka sürekliliği — sergi standının arkasındaki marka da ProMats
4. Postmark verified sender = temiz IP, deliverability garantili
5. Yanıtlar `info@promats.com.tr`'ye gelir, oradan **Avrasya CRM'e veya `info@avrasyaotomotiv.net`'e forward**'lanır (mail server kuralı)

**Avrasya görüşmesinde K-2'yi onayla** ve `info@promats.com.tr` reply-to'sunun `info@avrasyaotomotiv.net`'e forward edileceğini netleştir.

---

## Codex İçin Aksiyon

Bu belge **manuel iş** (Avrasya BT) gerektirir; Codex tarafında yapılacak:

- [ ] **⚙️ Codex** — Sprint 3 outreach gönderim entegrasyonunda `FROM` ve `REPLY_TO` adreslerini env'den okusun:
  ```
  OUTREACH_FROM=info@promats.com.tr
  OUTREACH_REPLY_TO=info@avrasyaotomotiv.net
  OUTREACH_SENDER_NAME=Avrasya / ProMats
  ```
- [ ] **⚙️ Codex** — Postmark verified sender setup talimatlarını `docs/teknik/postmark-setup.md` (Sprint 3 öncesi) hazırla; bu hibrit gönderici akışını destekler

---

## Bağlantılar

- 📋 Ana çeklist (K-2): [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 📧 v1 (promats.com.tr): [promats-email-auth-durumu.md](promats-email-auth-durumu.md)
- 🧪 PoC kalite raporu (yeni domain'in bulunduğu yer): [../teknik/poc-kalite-kontrol-raporu.md](../teknik/poc-kalite-kontrol-raporu.md)
- 📞 Avrasya görüşme soru listesi: [avrasya-gorusme-soru-listesi.md](avrasya-gorusme-soru-listesi.md)
