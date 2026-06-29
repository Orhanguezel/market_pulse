# CODEX GÖREVİ — Karar Verici Bulma: Eksik Backend (çeklist + brief)

> Plan: `docs/lead-machine/DECISION_MAKER_FINDER_PLAN.md` · Gap: `docs/lead-machine/LINKEDIN_B2B_CLAIM_GAP.md`
> Faz 1 (Places + Apollo + frontend `/karar-vericiler` + CSV + export preset + search-hints) = Claude, CANLIDA.
> **Sınır:** Codex backend (`backend/`). Frontend Claude'da. Konvansiyon: tenant scope + requireModule('leads'),
> Apollo key env.APOLLO_API_KEY, Places getGoogleMapsKey, `bun run build`+`bun test`+`tenant:guard` yeşil.

## 0. CANLI TEST + KANITLANMIŞ YÖNTEM (KRİTİK)
- **Apollo people-search 0 kişi döndürdü** (fitness/TR, tüm satır "C"). Apollo Türk KOBİ'de zayıf →
  otomatik akışın Apollo'ya bağlı olması BACKEND SORUNU.
- **Codex manuel/araç ile 10/10 "A" liste üretti** (kanıt: `fitness_b2b_10_saglam_ornek_liste.csv` repo kökü).
  Kullandığı KAZANAN yöntem: **Google operatörü (`site:linkedin.com/in "Founder" "Firma"`) → LinkedIn profili
  → Places/web ile doğrulama.** Çıktı: gerçek isim + unvan + LinkedIn URL + kaynak link, hepsi A.
- **HEDEF:** bu manuel yöntemi OTOMATİKLEŞTİR. Kalite çıtası = o CSV (kolonlar + A skoru + doğrulama linki).
- Segment stratejisi: TR yerel → Google-operatör/LinkedIn + website OSINT (asıl); uluslararası/ihracat → Apollo.

---

## ✅ Faz 1 (Claude, bitti)
- [x] Places havuzu (sektör×şehir) + Apollo people-search + A/B/C skor + finder.service
- [x] `POST /lead-machine/decision-makers/find` + `/presets` (requireAuth+requireModule)
- [x] EXPORT_B2B_TITLES preset + `POST /decision-makers/search-hints` (Google operatör + LinkedIn URL)
- [x] Frontend `/karar-vericiler` (form + tablo + CSV)

---

## 🔴 GÖREV A — KAZANAN yöntemi otomatikleştir: Google-operatör → LinkedIn (ÖNCELİK 1)
Codex'in 10/10 A listeyi ürettiği akış. Apollo'ya bağlı kalma.
- [x] **Google-operatör → LinkedIn profil çözümü:** her firma için `buildSearchHints` operatörlerini
      (`site:linkedin.com/in "Founder|Owner|Genel Müdür" "Firma" "şehir"`) **scraper-service** ile Google'a
      sorgula (SERP fetch; gerekirse residential proxy — kullanıcı onayladı), sonuçlardan `linkedin.com/in/...`
      URL'lerini çıkar, firma adı/şehirle eşleştir → isim + unvan + LinkedIn URL.
      (Google bot koruması: scraper-service stealthy + proxy; alternatif SERP API gerekirse not düş.)
- [x] **Website-OSINT yedeği:** profil bulunamazsa `enrichment.analyzeCompanyWebsite(website)`
      (scraper /team /about /impressum isim+unvan) → row'a yaz. Sosyal linkleri de çek (row.social_url).
- [x] **Skor:** LinkedIn profil + unvan eşleşti → **A**; website isim+unvan → **B**; sadece firma → **C**.
- [x] **Doğrulama linki:** source_url'e LinkedIn profil + Google Maps cid + (varsa) şirket LinkedIn sayfası.
- [ ] **Kabul:** fitness/TR çalıştırınca çıktı `fitness_b2b_10_saglam_ornek_liste.csv` kalitesine yaklaşmalı
      (A-satırlar gerçek LinkedIn URL + isim + unvan). Apollo yalnızca uluslararası firmalarda yardımcı.
      _Durum:_ backend resolver + testler hazır; canlıda proxy/SERP hit oranı smoke edilmeli.

## 🔴 GÖREV B — Batch karar-verici enrichment (mevcut adaylara)
İhracat iddiası: elimdeki customs/GTİP alıcı firmalarına kişi bul.
- [x] `POST /lead-machine/candidates/enrich-decision-makers` (requireModule('leads'), tenant-scope):
      body { icp_id?|job_id?|candidate_ids[]?, titles? } → seçili lead_candidates üzerinde
      domain → Apollo people-search (EXPORT_B2B_TITLES) + website-OSINT fallback (Görev A).
- [x] Sonucu lead_candidates.raw_data.decision_makers[] (name/title/linkedin_url/source/confidence) olarak yaz;
      idempotent (tekrar koşumda güncelle).
- [ ] Kabul: customs ile bulunmuş bir firmaya en az bir karar verici eklenebiliyor.
      _Durum:_ unit test var; canlı customs adayıyla smoke edilmeli.

## 🔴 GÖREV C — LinkedIn bağlantı + mesaj şablonu (AI)
- [x] `draft.service`'e LinkedIn modu: lead bazlı **connection request** + **ilk mesaj** + **2-3 adım takip**
      üret (askBestAvailable zaten var; dil TR/EN, kişi adı+unvan+firma+ürün bağlamı).
- [x] Endpoint: `POST /lead-machine/outreach/linkedin-templates` { candidate_id|context } → { connection, first_message, followups[] }.
- [x] Kabul: bir lead için 3 adımlı, kişiselleştirilmiş, profesyonel LinkedIn metin seti döner.

## 🔴 GÖREV D — Takip planı / sequence
- [x] outreach'i çok adımlı LinkedIn cadence ile genişlet (gün-0 bağlantı, gün-3 mesaj, gün-7 takip…);
      durum takibi (gönderildi/yanıt). lead_outreach_drafts/outreach_campaigns yapısını kullan.
- [x] Kabul: bir aday için sequence oluşturulup adımları listelenebiliyor.

## ⚪ GÖREV E — Sertleştirme (sonra)
- [ ] find senkron→background job (lead_search_jobs channel='b2b_decision_makers'), timeout riski.
- [ ] Sonuçları lead_candidates'a persist (source='decision_maker') + dedup.
- [ ] XLSX export. Sektör presetleri (otel/medikal/otomotiv).

---

## Önerilen sıra
A (website-OSINT — test'te hemen değer) → B (customs adaylarına kişi) → C (mesaj) → D (sequence) → E.
A + B, "temiz isimli liste" beklentisini Apollo'ya bağımlı kalmadan karşılar.
