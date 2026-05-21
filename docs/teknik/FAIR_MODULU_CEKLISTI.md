# Fair Modülü — Automechanika 2026 İş Listesi

> Bu çeklist [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](../strateji/AUTOMECHANIKA_2026_PLANI.md) kararlarına bağlıdır.
> **Hedef fuar:** Automechanika Frankfurt 2026 (8-12 Eylül 2026)
> **Müşteri:** Avrasya Paspas (ProMats)
> **Durum:** Taslak — 2026-05-21

---

## Sprint 0 — Keşif & Kalibrasyon (Hafta 1-2, 05-21 → 06-04)

### scraper-service tarafı
- [ ] Browser DevTools ile Automechanika exhibitor-search sayfasında XHR/fetch trafiğini incele
  - Internal JSON API endpoint'i var mı?
  - Varsa: URL pattern + auth header + sayfalama param
  - Yoksa: Seçenek A (DOM scraping) veya C (Google site search) yoluna geç
- [x] `scraper-service/src/engine/extractors.py` içinde `extract_fair_exhibitor` fonksiyonuna Messe Frankfurt branch'i ekle
  - Yeni helper: `_extract_messefrankfurt_list(html, url)`
  - Selector seti: Messe Frankfurt'un gerçek DOM yapısına göre (DevTools'tan tespit)
  - Fallback: mevcut generic akış
- [x] Yeni profil ekle: `fair-exhibitor-detail`
  - `ScrapeProfile` enum'una ekle ([scrape.py:6](../../../scraper-service/src/schemas/scrape.py#L6))
  - Yeni extractor fonksiyonu: `extract_fair_exhibitor_detail`
  - Çıkış alanları: `name, hall, booth, country, city, address, website, phone, email, product_groups[], brands[], target_markets[], description, trade_audience[]`
- [x] scraper-service'in stealthy mode'unda Messe Frankfurt'un anti-bot davranışını test et
  - Tek tek URL: çalışıyor
  - 100 URL ardışık: `scripts/automechanika-rate-limit-check.sh` prod scraper ile 100/100 başarılı
  - Sonuç: 403/429/captcha/block sinyali yok; 2-5 sn random delay + UA rotation uygulandı
- [x] scraper-service tarafına PR aç, prod'a deploy — prod deploy tamam; PR: https://github.com/Orhanguezel/scraper-service/pull/1

### market_pulse tarafı — Fair modülü genişletme
- [x] [fair.scraper.ts](../../backend/src/modules/lead-machine/fair/fair.scraper.ts) içine `scrapeExhibitorDetail(detailUrl)` fonksiyonu ekle
- [x] [fair.job.ts](../../backend/src/modules/lead-machine/fair/fair.job.ts) içinde iki aşamalı akış:
  1. Liste sayfasından detail URL listesi topla
  2. Her detail URL'ini ayrı scrape et, `lead_candidates`'a tek tek bas
- [x] Yeni alan: `lead_candidates.raw_data.fair_info.hall` + `booth` + `product_groups`
  - Schema değişmedi (JSON kolonu zaten esnek)
- [x] `b2b/icp.matcher.ts` içine Automechanika kategori taksonomisi ile eşleşme kuralı (Hall 3.0/3.1/4.0 = aksesuar, vb.)

### ICP onaylama
- [x] Avrasya kalibre ICP'sini DB'ye ekle ([icp.repository.ts](../../backend/src/modules/lead-machine/icp/icp.repository.ts) üzerinden) — seed UUID: `9f4c8f04-64b8-4da5-9c7d-4a4b5cf4b1b0`
- [ ] Avrasya ile ICP review oturumu (30 dk video) — coğrafya, kategori, firma tipi onayı

### PoC
- [x] Tek bir exhibitor liste URL'i ile job tetikle (örn. "floor mat" keyword filtreli URL) — PoC scripti prod scraper ile 30 liste kaydı + Avrasya detail çekti
- [x] Çıkan adayların manuel kalite kontrolü — ✅ **[docs/teknik/poc-kalite-kontrol-raporu.md](poc-kalite-kontrol-raporu.md)** — 3 kalibrasyon işi (K-1: extractor 30'da kesiyor / K-2: sayfalama yok / K-3: liste'de website null) + detail extractor mükemmel (12/12 alan); yeni mail domain bulgusu `info@avrasyaotomotiv.net`
- [ ] Hedef precision: %60+ — **Codex K-1+K-2 düzeltmeleri sonrası tekrar ölç** (raporda yeşil ışık kriterleri var)

---

## Sprint 1 — Tam Tarama (Hafta 3-4, 06-04 → 06-18)

- [ ] Hall 3.0, 3.1, 4.0 tüm exhibitor URL'lerini topla (~1500-2000 firma beklenir)
- [ ] Detail scrape job'ı (her URL ayrı, paralel max 5)
- [ ] ICP filtresinden geçir → `lead_candidates.status='pending'`
- [ ] Onay paneli üzerinden Avrasya ekibi günde 50-100 aday review etsin
  - [ ] Eğer onay UI yoksa hızlı bir Next.js sayfası: `/admin/leads/fair/review` (zaten lead-machine controller'ı var)
- [ ] Red sebepleri `reject_tags`'e işlenecek → öğrenme loop'u
- [ ] Hafta sonu: red pattern'larına göre ICP v2

---

## Sprint 2 — Komşu Stand (Hafta 5-6, 06-18 → 07-02)

> **10times kısmı DROP edildi (2026-05-21):** Public/self-serve API yok + ihtiyacımız değil. Detay: [10times-drop-karari.md](10times-drop-karari.md). Sadece komşu stand kalır.

- [x] Booth grid parser: `parseBooth("3.1 D11") → { hall: '3.1', row: 'D', col: 11 }` — Codex `booth.ts` + `isNeighborBooth()` eklendi
- [x] Komşu hesabı: Avrasya'nın ±5 metre çevresindeki standlar → `is_neighbor=true` flag — Codex `runFairJob` raw_data içine yazıyor
- [x] Komşu stand top 25 raporu — ✅ [sprint-2-komsu-stand-top25.md](sprint-2-komsu-stand-top25.md)

---

## Sprint 3 — Enrichment + Outreach Faz 1 (Hafta 7-9, 07-02 → 07-23)

### Enrichment
- [ ] Apollo.io hesabı + API key
- [ ] [enrichment.service.ts](../../backend/src/modules/lead-machine/enrichment/enrichment.service.ts) üzerinden onaylı adayların karar verici + email çekimi
- [ ] Hit oranı düşükse (≤%50) manuel LinkedIn fallback adımı

### Outreach Faz 1 (fuar versiyonu)
- [ ] Mail template'i: "Avrasya/ProMats Hall 3.1 D11" sade B2B taslağı (TR + EN + DE varyantı)
- [ ] GPT-4o-mini ile kişiselleştirme prompt'u (aday firmanın website analizine göre 2-3 cümle özel paragraf)
- [ ] `lead_outreach_drafts`'a yaz, status='draft'
- [ ] Manuel onay paneli (Next.js sayfası — zaten taslağı var)
- [ ] Mail gönderim entegrasyonu (Postmark veya Avrasya'nın kendi SMTP'si)
- [ ] SPF/DKIM/DMARC kontrol checklist (Avrasya'nın domain'i için)

---

## Sprint 4 — Randevu & Hazırlık (Hafta 10-12, 07-23 → 08-13)

- [ ] Calendly link Avrasya export ekibi adına
- [ ] Mail içinde kişisel Calendly slot daveti
- [ ] Hatırlatma kampanyası: T-14, T-7, T-1 gün
- [ ] Stand brifing dokümanı: her randevu için aday özet kartı (1 sayfa: firma, ürün, ICP eşleşme nedeni, soru önerileri)

---

## Sprint 5 — Fuar Operasyonu (08-13 → 09-12)

- [ ] Mobil-friendly stand panel sayfası: günün randevu listesi + aday kartları
- [ ] QR kod / kartvizit toplama formu (basit Google Form yeterli, sonra import)
- [ ] Günlük 18:00 review: o günkü randevuların notları + ertesi gün hatırlatması

---

## Sprint 6 — Post-show (09-12 → 09-30)

- [ ] Fuarda toplanan kartvizit/QR verisi → `lead_candidates` (channel: trade_fair_in_person)
- [ ] Follow-up sequence (T+3, T+10, T+30 gün)
- [ ] KPI raporu: Avrasya'ya sunum
- [ ] Sistem öğrenme: hangi aday tipi randevu verdi → ICP v3
- [ ] **Karar:** Reifen Essen, Equip Auto Paris gibi sonraki fuarlar için tekrarlanabilir paket haline getir

---

## Eksik Bağımlılıklar (engelleyiciler)

Sprint 0 başlamadan önce çözülmeli:

- [ ] Avrasya export sorumlusu kimlik tespiti (mail gönderici, onay paneli kullanıcısı) — **görüşmede** [avrasya-gorusme-soru-listesi.md §G](../musteri/avrasya-gorusme-soru-listesi.md)
- [x] Avrasya domain'i için SPF/DKIM/DMARC durumu — ✅ İki domain de tarandı: [promats.com.tr v1](../musteri/promats-email-auth-durumu.md) (SPF ✅ `-all`, DMARC ❌, DKIM ⚠️) + [avrasyaotomotiv.net v2](../musteri/promats-avrasyaotomotiv-mail-auth-v2.md) (SPF ❌ `?all` neutral, DMARC ❌, DKIM ⚠️); K-2 hibrit öneri: promats.com.tr + Postmark verified sender + reply-to avrasyaotomotiv.net
- [x] scraper-service'in prod URL'i + API key market_pulse `.env`'inde mevcut mu? — ✅ Codex doğruladı (`scraper.guezelwebdesign.com/health` OK)
- [ ] Apollo.io fatura sahibi (Avrasya mı, biz mi — maliyet yansıması) — **görüşmede** ([K-4 onaylı: Paspas ödüyor — onay teyidi bekleniyor](../../AUTOMECHANIKA_2026_CEKLIST.md))

---

## Bağlantılı Belgeler

- Master strateji: [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](../strateji/AUTOMECHANIKA_2026_PLANI.md)
- Müşteri kayıtları: [docs/musteri/avrasya-paspas-automechanika.md](../musteri/avrasya-paspas-automechanika.md)
- Lead Machine genel raporu: [LEAD_MACHINE_RAPOR.md](LEAD_MACHINE_RAPOR.md)
- SaaS master planı: [MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md)
