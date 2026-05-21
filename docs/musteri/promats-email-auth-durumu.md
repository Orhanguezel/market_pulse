# promats.com.tr — E-posta Kimlik Doğrulama Durumu

> **Tarih:** 2026-05-21
> **Sahibi (denetleyen):** 🧠 Claude (Sprint 0 engelleyici)
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 0 + Sprint 3
> **Konu:** Avrasya Paspas (ProMats) — `info@promats.com.tr` adresinden Sprint 3'te 60-100 outreach maili gönderilebilmesi için DNS düzeyinde kimlik doğrulama kayıtlarının durumu.

---

## Yönetici Özeti

| Kayıt | Durum | Sonuç |
|---|---|---|
| MX | ✅ Var (`mail.promats.com.tr` → Turhost) | Mail alımı çalışıyor |
| SPF | ✅ Var, sağlıklı (`v=spf1 include:_spf.trwww.com -all`) | Hard fail policy doğru |
| DKIM | ⚠️ **Tespit edilemedi** | Yaygın selector taraması boş döndü — Turhost panelinden manuel doğrulama gerekli |
| DMARC | ❌ **Yok** | Outreach mailleri spam filtresi riskinde |
| DNS yöneticisi | Turhost (`cpns1/cpns2.turhost.com`) | Kayıt eklemek için Turhost hosting panel erişimi gerekli |

**Kritik bulgu:** DMARC kaydı yok. SPF tek başına yeterli değil — modern mail servisleri (Gmail, Outlook 365, GMX, Mail.ru) DMARC olmadan gelen mailleri ya **spam'e atar** ya da **header'da uyarı gösterir**. Yanıt oranı hedefimiz %15+ — DMARC olmadan bu oran yarıya iner.

---

## Ham Denetim Çıktısı

```bash
$ dig +short MX promats.com.tr
10 mail.promats.com.tr.

$ dig +short A mail.promats.com.tr
94.199.203.110

$ dig +short TXT promats.com.tr
"v=spf1 include:_spf.trwww.com -all"

$ dig +short TXT _dmarc.promats.com.tr
(boş — DMARC yok)

$ dig +short TXT _spf.trwww.com
"v=spf1 ip4:185.15.40.0/22 ip4:37.230.104.0/21 ip4:94.199.200.0/21
       ip4:109.232.216.0/21 ip4:95.211.17.0/24 ip4:31.207.80.0/21
       ip4:213.159.28.0/22 ip4:213.159.0.0/21 ip4:178.157.8.0/21 -all"

$ for sel in google default selector1 selector2 mail dkim s1 s2 k1; do
    dig +short TXT "${sel}._domainkey.promats.com.tr"
  done
(hepsi boş — DKIM yaygın selector'larda yok)
```

---

## Yorumlama

### SPF (Sender Policy Framework) — ✅ Sağlıklı

- `v=spf1 include:_spf.trwww.com -all`
- Turhost'un paylaşımlı sunucularından gelen mailler yetkili
- `-all` (hard fail) doğru policy: yetkisiz IP'lerden gelen mail reddedilir
- **Aksiyon yok.**

### DKIM (DomainKeys Identified Mail) — ⚠️ Belirsiz

- Yaygın 9 selector taraması ile DKIM kaydı bulunamadı
- Turhost paylaşımlı hostingde DKIM **opsiyonel** — cPanel "E-posta Kimlik Doğrulama" bölümünden açılabiliyor
- Açık değilse Avrasya'nın gönderdiği her mail DKIM imzasız çıkıyor → modern mail servisleri için "geçer not değil, kıl payı geçer not"
- **Aksiyon:** Avrasya BT/Turhost panel erişiminden DKIM aktif/değil kontrol et; aktif değilse aç

### DMARC (Domain-based Message Authentication, Reporting & Conformance) — ❌ KRİTİK EKSİK

- `_dmarc.promats.com.tr` TXT kaydı yok
- Sonuç: SPF ve DKIM geçse bile alıcı mail sunucuları "bu domain'in politikası ne olmalı" sorusunun cevabını bulamıyor → güvensiz say
- **Aksiyon:** DMARC kaydı **şimdi** eklenmeli. Outreach kampanyası başlamadan **en az 14 gün önce** kayıt aktif olmalı (alıcı sunucuların cache'lemesi için)

---

## Avrasya BT'ye Gönderilecek Talep (kullanıma hazır)

> Aşağıdaki metni Avrasya BT veya Turhost destek ekibine ilet:

---

**Konu:** promats.com.tr için DMARC ve DKIM kayıt eklemesi talebi

Merhaba,

Automechanika Frankfurt 2026 fuarı kapsamında `info@promats.com.tr` adresinden Eylül 2026'ya kadar **60-100 mail** gönderilecek (toplu değil, segment edilmiş aday firma outreach). Yanıt oranımızın yüksek olabilmesi için e-posta kimlik doğrulama standartlarının tamamının aktif olması gerekiyor.

Mevcut durum (DNS taramamıza göre):
- SPF: ✅ Var (Turhost'un `_spf.trwww.com` include'u, doğru)
- DKIM: ⚠️ Yaygın selector'larda tespit edilemedi — açık mı, hangi selector kullanılıyor?
- DMARC: ❌ Yok

İstediğimiz iki kayıt:

**1) DMARC** — şu TXT kaydını `_dmarc.promats.com.tr` altına ekleyin:

```
v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@promats.com.tr; ruf=mailto:dmarc-reports@promats.com.tr; fo=1; aspf=r; adkim=r
```

- `p=quarantine` ilk faz: başarısız maili spam'e at (silme)
- 30 gün test ettikten sonra `p=reject`'e geçilebilir
- Raporlama adresi: `dmarc-reports@promats.com.tr` (yoksa açın veya `info@promats.com.tr` kullanın)

**2) DKIM** — Turhost cPanel → "E-posta Kimlik Doğrulama" sayfasını açın, DKIM yoksa "Etkinleştir" basın. Sonrasında bize selector'ı bildirin (genellikle `default._domainkey.promats.com.tr` formatında olur).

Hangi soruları cevaplayabilirsiniz veya kayıtları eklediğinizde haber verir misiniz?

Teşekkürler.

---

## Doğrulama Adımları (kayıt eklendikten sonra)

- [ ] **🧠 Claude** — Talep gönderildi mi (mail/WhatsApp) — gönderim tarihini buraya yaz
- [ ] **🧠 Claude** — Avrasya BT'den dönüş geldi mi
- [ ] **🧠 Claude** — DMARC eklendikten sonra tekrar `dig +short TXT _dmarc.promats.com.tr` ile doğrula
- [ ] **🧠 Claude** — DKIM açıldıktan sonra selector öğrenildi, `dig +short TXT <selector>._domainkey.promats.com.tr` doğrula
- [ ] **🧠 Claude** — https://www.mail-tester.com/ üzerinde test mail gönderip skor ≥ 9/10 olduğunu doğrula
- [ ] **🧠 Claude** — Skor düşükse: blacklist kontrol (https://mxtoolbox.com/blacklists.aspx)

---

## Risk: Gönderici kararı değişirse ne olur

Eğer K-2 kararı değiştirilip mail gönderici Avrasya'nın kendi domain'i yerine **Postmark veya Brevo gibi 3. taraf SaaS** olarak seçilirse:
- Bu rapor geçersiz olur
- Yeni domain (örn. `outreach.market-pulse.io`) için aynı denetim tekrar yapılır
- Avrantage: 3. taraf SaaS'ın domain'i zaten warmed olduğu için spam riski daha düşük
- Dezavantaj: mail "info@promats.com.tr" yerine "info@outreach.market-pulse.io" gibi farklı domain'den gider → güven sinyali zayıflar

**Önerim:** K-2 kararına bağlı kalalım (Avrasya kendi domain'i) **ama** Postmark'ı gönderim **altyapısı** olarak kullanalım — Postmark "verified sender domain" özelliği DNS kayıtlarımızı kullanır, gönderim IP'si Postmark'ın temiz IP'leri olur. Bu hibrit yaklaşım hem yüksek deliverability hem domain güveni verir.

---

## Sonraki Adım

1. Avrasya BT ile iletişim → DMARC + DKIM kayıtları ekleniyor
2. 14 gün bekle (DNS yayılması + alıcı cache'leri)
3. mail-tester.com ile son test
4. Sprint 3 outreach kampanyasına yeşil ışık

Bu rapor güncellendikçe DMARC/DKIM doğrulama satırları işaretlenmeli, kayıt durumu güncel tutulmalı.
