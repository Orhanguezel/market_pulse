---
title: "Avrasya / ProMats — Otomechanika 2026 Pilot Onay Soruları"
author: "Market Pulse"
date: "2026-05-21"
geometry: margin=2cm
fontsize: 11pt
mainfont: "DejaVu Sans"
---

# Avrasya / ProMats — Otomechanika 2026 Pilot Onay Soruları

**Konu:** Automechanika Frankfurt 2026 (8-12 Eylül 2026) için fuar öncesi otomatik müşteri adayı bulma + outreach sisteminin başlatılması.

**Süre:** ~15-20 dakika telefon

**Cevaplanması gereken:** 5 stratejik karar. Bunlar sistemin canlıya geçmesi için zorunlu. Diğer konular (üretim kapasitesi, MOQ, sertifika, fiyat) **bizim mailimizde geçmez** — alıcıyla fuar standında siz konuşacaksınız.

---

## Ne yapıyoruz — 3 cümle

1. Automechanika Frankfurt katılımcı listesinden ICP'ye uygun **Avrupa distribütör/ithalatçı/toptancı** firmaları otomatik buluyoruz (~200-400 aday).
2. Her aday için karar verici email'i çekiyoruz, fuar öncesi **kısa randevu daveti maili** gönderiyoruz.
3. Hedef: fuara giderken Avrasya standının takviminde **20-35 doğrulanmış randevu** olsun.

Mailler size detay anlatmaz; sadece *"Hall 3.1 D11'deyiz, 10 dakika konuşalım mı?"* der. Asıl satış konuşması fuarda sizde.

---

## Soru 1 — Mail gönderici hesabı

**Mailler hangi adresten gitsin?**

- [ ] `info@promats.com.tr` (web sitenizdeki ana adres) — **önerimiz**
- [ ] `info@avrasyaotomotiv.net` (Automechanika kayıt adresiniz)
- [ ] Başka adres: ____________________

**Mail altındaki imza adı + ünvanı kim olsun?**

- İsim: ____________________
- Ünvan: ____________________ (örn. *Export Manager*)
- Mobil (imzada görünsün): ____________________

**Teknik not:** Mail kimlik doğrulaması (SPF, DKIM, DMARC) için domain'inize 2 TXT kaydı eklenmesi gerekiyor — bu olmadan spam'e düşme riski yüksek. Onay verirseniz hosting (Turhost) panelinizden bizim hazırladığımız talimatla 10 dakikada eklenir.

---

## Soru 2 — Aday onay sorumlusu

Sistem her gün 50-100 yeni aday üretiyor. **Ekibinizden biri günde 30 dk** her adayın websitesine bakıp "evet bu hedef müşterimiz / hayır değil" tıklamalı.

**Kim yapacak?**

- İsim: ____________________
- Pozisyon: ____________________
- Yedek (tatil/izin durumu): ____________________

Onaylanmamış aday outreach almıyor; yani **siz onaylamadan kimseye mail gitmez.**

---

## Soru 3 — Hedef pazar onayı

İlk dalga için 5 öncelikli AB pazarı seçtik:

| | Ülke | Pilot dalga? |
|---|---|---|
| 1 | Almanya (DE) | [✓] |
| 2 | Avusturya (AT) | [ ] Evet / [ ] Hayır |
| 3 | Hollanda (NL) | [ ] Evet / [ ] Hayır |
| 4 | Polonya (PL) | [ ] Evet / [ ] Hayır |
| 5 | Fransa (FR) | [ ] Evet / [ ] Hayır |

**Eklenecek pazar var mı?** (örn. İtalya, İspanya, Çek Cumhuriyeti)

____________________

**Çıkarılacak pazar var mı?** (zaten güçlü olduğunuz veya istemediğiniz)

____________________

---

## Soru 4 — Bütçe + fatura

**🔄 Revize edildi (2026-05-21):** Sistem hazırlığında öğrendiklerimizden sonra **bütçe büyük ölçüde düştü.**

Messe Frankfurt'un kendi API'sından K-1 pilot pazardaki **166 firma'nın %87'sinin mail adresi zaten geliyor**. Yani Apollo.io gibi ücretli enrichment servislerine gerek kalmadı. Sadece ~9 firma için Hunter.io free tier (50 arama/ay) yeterli.

| Kalem | Eski plan (aylık) | **Yeni plan (4 ay toplam)** |
|---|---|---|
| ~~Apollo.io~~ | ~~$49 × 4 = $196~~ | **❌ Drop — $0** (Hunter yeter) |
| Hunter.io (mail bulma) | (yedek) | **$0 (Free 50 credit/ay)** |
| GPT-4o-mini (kişiselleştirme) | $15 × 4 = $60 | **~$0.50** |
| Postmark (mail gönderim) | $15 × 4 = $60 | **$0 (Free 100 mail/ay)** |
| **Toplam (4 ay)** | **~$316** | **~$10 maks** |

**Bu maliyeti kim ödüyor?** (artık çok küçük)

- [ ] Avrasya doğrudan ödüyor (gerek yok denecek kadar küçük)
- [ ] Paspas tarafından ödenir (varsayılan)
- [ ] Free tier yeterli, hiç fatura yok (en muhtemel)

**Hunter.io + Postmark hesabı kim açıyor?**

- [ ] Avrasya adına (orhanguezell@gmail.com onun adına yönetir)
- [ ] Doğrudan Avrasya hesabıyla
- [ ] Bizim hesabımıza, kontrol bizde

---

## Soru 5 — Hukuki çerçeve

Avrupa firmalarına soğuk mail göndereceğiz. B2B kapsamında **GDPR Madde 6(1)(f) "meşru iş ilgisi"** yasal çerçevesi var, ama Avrasya hukuk danışmanınızın bilgisi olması gerek.

- [ ] Hukukçumuzla konuştum, **onay verdi** — devam edebiliriz
- [ ] Hukukçuya iletmem gerek — **3-5 gün içinde dönerim**
- [ ] Detaylı bilgi notu yollarsanız hukukçuyla paylaşırım

**Not:** Her mailde otomatik "Unsubscribe" link bulunur; yanıt vermek istemeyene 2 hatırlatma sonrası temas kesilir.

---

## Sonraki adımlar (siz onay verdikten sonra biz yapıyoruz)

1. **Hafta 1-2** — DNS kayıtları, Apollo + Postmark hesapları, sistem hazırlık
2. **Hafta 3-4** — Tam Automechanika exhibitor taraması (~1500-2000 firma)
3. **Hafta 5-6** — ICP filtreleme → 200-400 onaylanmaya aday
4. **Hafta 7-8** — Karar verici email çıkarımı (Apollo + manuel LinkedIn)
5. **Hafta 9-10** — Kişiselleştirilmiş mail taslakları (onayınıza sunulur)
6. **Hafta 11-12** — Mail kampanyası + Calendly randevuları
7. **8-12 Eylül** — Stand operasyonu

Toplam: ~12 hafta hazırlık + 5 gün fuar.

---

## Sorularımız varsa

WhatsApp: **+90 5XX XXX XX XX** (Orhan)
Mail: **orhanguzell@gmail.com**

Cevabınızı bu dosyayı doldurarak veya kısa bir mesajla iletebilirsiniz.

*Teşekkürler.*
