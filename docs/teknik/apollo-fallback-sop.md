# Apollo Fallback SOP — Karar Verici Email Bulunamadığında

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 3 — enrichment akışı)
> **Hedef okuyucu:** Avrasya export ekibi (manuel iş yapacak) + ⚙️ Codex (SOP'u dashboard'a göstermesi için)
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 3
> **Tetik:** Apollo karar verici/email çekemediğinde

---

## Neden bu SOP

Apollo.io endüstri ortalaması %50-60 hit oranı sağlar — yani **onaylanan 200 adayın 80-100'ü için karar verici email bulunamayacak**. Bu adaylar ya:
- Atılır (yanlış)
- Generic `info@` mailine gönderilir (yanlış — düşük yanıt)
- **Manuel fallback ile karar verici manuel bulunur** (doğru)

Bu SOP, Avrasya export ekibi günde 30 dk içinde manuel olarak nasıl çalışacağını tarif eder. **Lead başına 5 dk hedef.**

---

## Tetikleme & Atama

Codex'in admin paneli `lead_enrichment` sonuçlarını gösterir. Aday onaylandıktan sonra Apollo job çalışır. Sonuç:

| Apollo durumu | Davranış |
|---|---|
| Karar verici **bulundu** + email **doğrulandı** | Yeşil; otomatik outreach taslak üretimine geç |
| Karar verici bulundu, email **belirsiz/risky** | Sarı; "Doğrulama gerekli" listesine düşer (bu SOP §3) |
| Karar verici **bulunamadı** | Kırmızı; "Manuel fallback gerekli" listesine düşer (bu SOP §2) |

UI'da bir filtre: "Sadece manuel fallback gereken adaylar".

---

## §1 — Doğru Karar Verici Pozisyon Adayları

Avrasya'nın aradığı sıralama (öncelikli en başta):

### Distribütör segment için
1. **Purchasing Director / Head of Purchasing / Einkaufsleiter**
2. **Category Manager — Accessories / Interior / Aftermarket**
3. **Product Manager — Accessories**
4. **Managing Director / Geschäftsführer** (küçük firmalarda direkt)
5. **Owner / Inhaber** (aile şirketlerinde)

### E-com seller segment için
1. **Founder / Co-founder / Owner**
2. **Head of Sourcing / Procurement Lead**
3. **Product Lead / Catalog Manager**
4. **Marketing Director** (private label kararını veriyorsa)

---

## §2 — Manuel Fallback Akışı (5 dk/aday)

Apollo karar verici bulamadığında:

### Adım 1 — LinkedIn Sales Navigator (yoksa LinkedIn free) (2 dk)
- LinkedIn'de firma sayfasını aç: `linkedin.com/company/{firma_slug}`
- "People" tab → "Filter by job title" → §1'deki başlıkları sırayla ara
- En üst sonucun adını ve pozisyonunu kaydet
- Profilini aç, çalıştığı yılı doğrula (3+ yıl tercih edilir — yeni başlayanlar karar veremez)

### Adım 2 — Email Çıkarımı (2 dk)
LinkedIn email vermiyor. Çoğu KOBİ'de email pattern'i sabit:

| Domain | Tipik pattern |
|---|---|
| `firma.de` | `vorname.nachname@firma.de` |
| `firma.nl` | `firstname@firma.nl` veya `f.lastname@firma.nl` |
| `firma.fr` | `prenom.nom@firma.fr` |
| `firma.com` | `firstname.lastname@firma.com` veya `flastname@firma.com` |

**Pattern tespit hızı:** firma websitesinde "Contact" sayfasında 1-2 mail varsa pattern direkt belli olur. Yoksa şu araçlar:
- **Hunter.io free tier** (50 aram/ay) — `hunter.io/email-finder` → firma domain ekle, isim yaz, %95 doğruluk
- **Snov.io** — benzer, free 50 kredi/ay
- **AnyMailFinder** — 5 ücretsiz arama, sonra ücretli

Birkaç pattern üret, **email-verifier** ile teyit et:
- **Mailtester.com** — ücretsiz, SMTP doğrulama
- **Hunter Email Verifier** — Hunter hesabı varsa

### Adım 3 — Doğrulama (1 dk)
Email tahminini doğrula:
- ✅ "valid" → kullan
- ⚠️ "accept-all" / "catch-all" → kullanabilirsin ama soğuk yanıt oranı düşük olabilir (alıcının inbox'ı kabul ediyor ama mail orada gerçekten okunuyor mu belli değil)
- ❌ "invalid" → tekrar pattern dene veya bu adayı `info@` gönderici olarak işaretle

### Adım 4 — Kaydet
Admin paneli'nde aday kartının "Manuel Enrichment" alanına yaz:
- Karar verici adı + pozisyonu
- LinkedIn URL
- Tahmin edilen email + doğrulama durumu
- Pattern kaynağı (örn. "Contact page'den `info@firma.de` + `peter@firma.de` görüldü → `firstname@` pattern'i")
- Tarih + kullanıcı

Codex bu alanları `lead_enrichment` tablosuna yazsın:
```sql
UPDATE lead_enrichment SET
  decision_maker = JSON_OBJECT(
    'name', '?',
    'title', '?',
    'linkedin_url', '?',
    'email', '?',
    'email_status', 'valid|accept_all|invalid',
    'source', 'manual_fallback'
  ),
  source_vendor = 'manual'
WHERE candidate_id = ?;
```

---

## §3 — Apollo "Sarı" Liste (Email Belirsiz/Risky)

Apollo bazen email döndürür ama düşük güven skoru ile. Davranış:

- **Güven skoru ≥ 80**: kullan
- **Güven skoru 50-79**: aynı pattern tahmini ile alternatif üret, en güveniliri seç. Apollo + Hunter çakıştığında ortak olan kazanır.
- **Güven skoru < 50**: §2 manuel fallback'a atla.

---

## §4 — Generic `info@` Gönderim — Son Çare

Hiçbir karar verici bulunmadıysa **şu kurala uy:**

- Generic mail **sadece kısa varyant** gönderir (uzun varyantı asla generic'e gönderme)
- Konu satırı agresif kişiselleştirmeden kaçınır
- Mail body'sinde "If you're not the right person, would you forward this to your purchasing lead?" ekle (EN/DE/TR muadili)
- Beklenen yanıt oranı %5-8 (kişiye gönderim %15-25 vs)
- Bu aday "düşük öncelik" etiketi alır, T+30 follow-up'a kadar manuel takip beklenmez

---

## §5 — Yasal & Etik

GDPR uyumu:
- LinkedIn'den isim/pozisyon alma serbest (kamuya açık veri)
- Email pattern tahminiyle gönderim — meşru iş ilgisi (legitimate business interest) kapsamında. **B2B amaçla**, **iletişim sebebi açık** olduğu sürece GDPR Madde 6(1)(f) altında **legal**.
- Her mailde **List-Unsubscribe** header zorunlu — Postmark otomatik ekler
- Yanıt vermek istemeyene hatırlatma yok (T+7 ve T+14 hatırlatması yanıt vermeyenin son yanıtından %48 sonra atılır)

Türkiye KVKK uyumu:
- Mailler Türkiye'den **AB alıcısına** gidiyor — KVKK Madde 28 sınırları dışında (yurt dışı transfer açık rıza gerektirebilir, ama bu B2B legitimate interest)
- Risk: Avrasya'nın hukuk danışmanının onayı alınmalı

---

## §6 — Performans Hedefleri

Sprint 3 sonunda:
- Manuel fallback yapılan aday sayısı: 30-50 (toplam ~80'in yarısı)
- Manuel fallback ortalama süresi: ≤ 5 dk/aday
- Manuel fallback email doğruluk oranı: ≥ %80 (mail-tester ile teyit edildiğinde)
- Generic `info@` gönderimi: ≤ 30 aday

Bu metrikler tutturulamıyorsa:
- Manuel fallback yavaşsa → Hunter veya Snov.io paid tier (~$49/ay)
- Doğruluk düşükse → SOP §2 Adım 2 pattern tablosu yeniden kalibre

---

## §7 — Sprint 3 Outreach Kampanyası Sırasında Günlük Akış

```
09:00 — Avrasya export sorumlusu admin'e giriş
09:05 — "Manuel fallback gereken" filtresi açık
        Bekleyen aday sayısını kontrol et
09:10 — İlk 6 adayı işle (6 × 5dk = 30 dk)
09:40 — "Doğrulanan email" filtresine geç
        Otomatik üretilen taslakları sırayla onayla
        İlk gönderim batch'i: ~15 mail (manuel onaylı)
10:00 — İşlem bitti, mailler kuyrukta
        Ertesi gün hatırlatma cron'u çalışır
```

Avrasya günde 30 dk taahhüt eder (K-3); 6-10 manuel fallback + 15-20 mail gönderimi yapılabilir.

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- ✉️ Mail template'leri: [../musteri/automechanika-2026-outreach-templates.md](../musteri/automechanika-2026-outreach-templates.md)
- 🤖 Kişiselleştirme prompt'u: [outreach-personalization-prompt.md](outreach-personalization-prompt.md)
- 📧 Mail auth durumu: [../musteri/promats-email-auth-durumu.md](../musteri/promats-email-auth-durumu.md)
- 🎯 ICP referansı: [icp-automechanika-final.md](icp-automechanika-final.md)
