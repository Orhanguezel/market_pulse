# Lead Machine — Sonuç Raporu

> Kaynak belgeler: `1) AMAZON LEAD MACHINE.docx`, `2) B2B LEAD MACHINE.docx`, `3) Fuar Visitor Kazıma.docx`, `Lead Ortak yapısıı.docx`
> Tarih: 2026-05-07
> Proje: MarketPulse — Lead Üretim Katmanı

---

## 1. Genel Bakış

Bu 4 belge, Paspas fabrikasının **uluslararası ihracat müşterisi bulma** sorununa yönelik üç farklı otomatik lead üretim kanalını tanımlamaktadır. Belgelerin ortak sonucu `Lead Ortak Yapısı.docx` dosyasında bir satırda özetlenmiştir:

| Kanal | Hedef |
|-------|-------|
| Amazon Lead | Oto aksesuar e-ticaret satıcıları (Amazon'da satılan ürünler üzerinden) |
| B2B Lead | Toptancı / distribütör ithalatçılar (dizin ve web tarama) |
| Fuar Ziyaretçi Lead | Hedef fuardaki potansiyel alıcı firmalar |

Tüm kanallar aynı sonuca akar: **onaylanmış firma, pipeline'a girer ve Görüşme aşamasına geçer.**

---

## 2. Ortak Tasarım Kararı: Human-in-the-Loop

Üç belgede de tekrar eden en kritik karar:

> **Sistem %100 otomatik OLMAYACAK.**

Her kanal ham aday üretir → kullanıcı inceler → onay verir → pipeline'a girer.  
Bu tasarım üç nedenle doğru:

1. **Veri kalitesi**: Scraping ve AI analizi hatalı sonuç üretir; insan filtresi şart.
2. **Öğrenme**: Red nedenleri kaydedilir → sistem zamanla daha iyi önerir.
3. **Satış sorumluluğu**: Satış ekibi "sistem attı" değil, "ben seçtim" der.

---

## 3. Kanal Analizi

### 3.1 Amazon Lead Machine

**Konsept:** Amazon'da ürün arayan ve yorum problemi olan satıcıları tespit et, Paspas'ın daha iyi ürünü için potansiyel alıcı olarak listele.

**Akış:**
```
Keyword → Amazon ürün listesi → Filtreleme (50-500 yorum, 4.0-4.5 rating)
  → Review AI analizi (negatif kelimeler: smell/fit/thin/quality/slippery)
  → Seller extraction + tekil liste
  → Lead scoring (0-10)
  → Kullanıcı onay paneli
  → (Opsiyonel) Apollo.io / LinkedIn enrichment
  → AI e-posta taslağı
```

**Neden değerli:** Amazon'daki ürün yorumları "hangi rakip satıcı sorun yaşıyor" sorusunu cevaplay. Problem yaşayan satıcı = değiştirilecek tedarikçi arayan alıcı = Paspas'ın müşterisi.

**Teknik risk:** Amazon scraping TOS ihlali yapabilir. Çözüm: Apify/ScraperAPI gibi 3. taraf araçlar veya Amazon SP-API (resmi, sınırlı).

**Başarı kriteri (belgeden):** 100 üründen 20 kaliteli lead, günde 20-30 lead inceleme, lead başına 1-3 dk.

---

### 3.2 B2B Lead Machine

**Konsept:** Hedef ülkede (DE, AT, NL, PL...) Paspas'ın ideal müşteri profiline uyan firmaları web dizinlerinden, platformlardan ve scraping ile bul.

**Akış:**
```
ICP tanımla (manuel veya mevcut müşteriden öğren)
  → Kaynak seç (Europages / Kompass / Google Maps / LinkedIn)
  → Firma listesi + website scraping
  → AI analiz: ne satıyor / B2B mi / Çin ürünü var mı / pain point
  → Filtreleme + scoring
  → Kullanıcı onayı
  → Enrichment: karar verici, email, LinkedIn
  → Feedback → ICP öğrenir
```

**Neden değerli:** ICP tabanlı sistem, satıcının "ideal müşterim kim?" sorusunu bir kez yanıtlamasına izin verir. Sonra sistem bu profili otomatik arar. Reddedilen adaylardan öğrenir.

**Kritik özellik:** Pain point tespiti — "Çin'e bağımlı mı?", "MOQ problemi var mı?", "Private label yapıyor mu?" — bunlar Paspas'ın sunduğu çözümle doğrudan eşleşiyor.

**Zenginleştirme katmanı:** Firma adı + website bulunduktan sonra Apollo.io API ile email + karar verici adı çekilir. Bu outreach maliyetini ve süresini dramatik düşürür.

---

### 3.3 Fuar Ziyaretçi Lead Machine

**Konsept:** Paspas'ın stand açacağı fuardaki exhibitor listesini önceden çek, ICP ile eşleştir, fuar öncesinde randevu / outreach yap.

**Akış:**
```
Fuar seç (Automechanika Frankfurt, Reifen, Equip Auto vb.)
  → Resmi fuar sitesinden exhibitor listesi scraping
  → 10times API: kim "interested" olarak işaretledi
  → (Ücretli) whr.ai: satın alma niyeti yüksek şirketler
  → ICP filtresi
  → lead_candidates → onay paneli
  → Onaylananlar: fuar öncesi outreach veya stand randevusu
```

**Neden değerli:** Fuar standı pahalıdır. Standı çevresinde kimle konuşulacağını önceden bilmek ROI'yi katlayarak artırır.

**Kaynak karşılaştırması:**

| Platform | Ne Verir | Maliyet |
|----------|----------|---------|
| Resmi fuar sitesi | Exhibitor listesi (ücretsiz scraping) | $0 |
| 10times.com | "Kim bu fuara ilgilendi" intent sinyali | Ücretsiz API |
| whr.ai | Satın alma niyeti yüksek şirket shortlist | $200-500/ay |
| ExpoCaptive | Verified exhibitor + attendee email | $300-800/ay |
| Exhibitor Intelligence | 500K+ exhibitor contact DB | Ücretli |

**MVP önerisi:** Resmi site scraping + 10times. Ücretli platform denemesi için tek bir fuar döneminde pilot yap.

---

## 4. Ortak Altyapı

### 4.1 DB Katmanı (Tasarlandı — 018_lead_machine_schema.sql)

| Tablo | Amaç |
|-------|-------|
| `icp_profiles` | ICP tanımları (JSON yapı) |
| `lead_search_jobs` | Kanal bazlı arama iş kayıtları |
| `lead_candidates` | Ham lead adayları (onay öncesi) |
| `lead_enrichment` | Apollo/LinkedIn/scraping zenginleştirme verisi |
| `lead_outreach_drafts` | AI üretimi e-posta taslakları |
| `lead_rejection_patterns` | Öğrenme mekanizması için red pattern'ları |

### 4.2 Mevcut Tabloya Bağlantı

`lead_candidates.status = 'approved'` → `market_leads` tablosuna yeni satır:
```
source: 'amazon' | 'b2b_directory' | 'trade_fair' | 'icp_match'
```
Mevcut pipeline devralır: Yeni → Görüşmede → Dönüştürüldü.

### 4.3 AI Kullanımı

| Görev | Model Önerisi | Maliyet (tahmini) |
|-------|--------------|-------------------|
| Amazon review analizi | Groq llama-3.1-8b | ~$0 (free tier) |
| Website içerik analizi | Groq llama-3.1-70b | ~$0.05/100 site |
| ICP pattern çıkarımı | GPT-4o-mini | ~$0.01/analiz |
| Pain point tespiti | GPT-4o-mini | ~$0.01/firma |
| Outreach email üretimi | GPT-4o | ~$0.05/email |

Aylık tahmini AI maliyeti (500 lead/ay): **$10-25**

---

## 5. API Maliyet Analizi

### Zorunlu (MVP için)

| Servis | Kullanım | Aylık Maliyet |
|--------|----------|---------------|
| **Scraper-service** (self-hosted) | B2B dizin, website, fuar, Google Maps | **$0** |
| **Oxylabs** (Amazon scraping, TOS-safe) | ~2.000 ürün/ay | ~$20/ay |
| **Groq API** | Review + website analizi | $0 (free tier yeterli) |
| **GPT-4o-mini** | ICP + pain point | ~$5-15/ay |

**MVP toplam: $25-35/ay** *(Apify yerine self-hosted scraper-service: $25-30 tasarruf)*

### İkinci Faz (Enrichment)

| Servis | Kullanım | Aylık Maliyet |
|--------|----------|---------------|
| **Apollo.io** | 500 email/karar verici lookup | $49-99/ay |
| **10times API** | Fuar intent verisi | Ücretsiz başlangıç |
| **GPT-4o** | Outreach email üretimi | ~$10-20/ay |

**Faz 2 eklentisi: $60-120/ay**

### İleri Faz (Ücretli fuar verisi)

| Servis | Kullanım | Aylık Maliyet |
|--------|----------|---------------|
| **whr.ai** | Fuar satın alma niyeti | $200-500/ay |
| **ExpoCaptive** | Exhibitor DB | $300-800/ay |

**İleri faz eklentisi: $500-1300/ay** (fuar döneminde kullanılır, her ay değil)

### Toplam Senaryo

| Senaryo | Aylık Maliyet | Elde Edilen |
|---------|---------------|-------------|
| MVP (Amazon + B2B basic) | ~~$35-65~~ → **$25-35** | 200-500 aday/ay |
| Full (+ Enrichment) | ~~$100-185~~ → **$75-135** | 200-500 aday + email/DM |
| Premium (+ Fuar) | $600-1500 | Fuar döneminde |

> **Not:** Self-hosted scraper-service, Apify yerine kullanılıyor ($30-49/ay tasarruf). Amazon için Oxylabs TOS-safe (~$20/ay).

> **Not:** MarketPulse müşteri fiyatı 199-499 EUR/ay. API maliyeti %5-15 → karlı.

---

## 6. Rakip Kıyaslaması

Bu sistem piyasada neyle rekabet eder?

| Araç | Fiyat | Yapabildiği |
|------|-------|-------------|
| Apollo.io (tam) | $99-299/ay | Enrichment + outreach, lead bulma zayıf |
| Hunter.io | $49-149/ay | Email bulma, lead discovery yok |
| ZoomInfo | $15K+/yıl | Enterprise, küçük üretici için overkill |
| Clay | $149-800/ay | Güçlü ama teknik kurulum ağır |
| **Lead Machine (MarketPulse içinde)** | **Altyapı maliyeti** | **Sektöre özel + Turkish market + Paspas ürün uyumu** |

Fark: Piyasadaki araçlar **generic**. Lead Machine, Paspas'ın ürün segmentine (oto aksesuar, enjeksiyon plastik) ve hedef coğrafyasına (Avrupa) özgü filtrelenmiş sonuç üretir.

---

## 7. Risk Analizi

| Risk | Olasılık | Etki | Çözüm |
|------|----------|------|-------|
| Amazon scraping TOS ihlali | Orta | Yüksek | Apify kullan (kendi IP'si, TOS-safe) |
| AI halüsinasyon (yanlış pain point) | Orta | Düşük | Human-in-the-loop zaten var |
| Apollo kişi bulamadı | Yüksek (%30-40 miss) | Orta | Manuel fallback, web scraping |
| Fuar exhibitor verisi eksik | Orta | Düşük | Birden fazla kaynak kullan |
| IP ban (directory scraping) | Orta | Orta | Rotating proxy / Apify |

---

## 8. Başarı Kriterleri

**Sistem başarılıdır eğer:**

- [ ] Aylık 200+ kaliteli aday üretiliyor (50+ onaylanıyor)
- [ ] Aday inceleme süresi lead başına ≤ 3 dakika
- [ ] Onaylanan lead'lerin %30+ 'u Görüşmede aşamasına geçiyor
- [ ] Sistemin önerdiği ICP, 3. ayda ilk aya göre %20 daha iyi eşleşme yapıyor (öğrenme)
- [ ] Her müşteri için aylık Lead Machine kullanım raporu üretilebiliyor

---

## 9. Uygulama Önceliği

```
Sprint 1 (Kritik): H1 DB + H2 Onay Paneli
Sprint 2 (Değer):  I — Amazon Lead Machine
Sprint 3 (Büyüme): J — B2B Lead Machine + ICP
Sprint 4 (Saha):   K — Fuar Lead Machine
Sprint 5 (Olgunluk): J3 Enrichment + L Outreach
```

---

*MarketPulse — Lead Machine Sonuç Raporu*
*2026-05-07*
