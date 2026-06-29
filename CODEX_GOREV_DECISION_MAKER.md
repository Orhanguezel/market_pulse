# CODEX GÖREVİ — Karar Verici Bulma: Eksik Backend (çeklist + brief)

> Plan: `docs/lead-machine/DECISION_MAKER_FINDER_PLAN.md` · Gap: `docs/lead-machine/LINKEDIN_B2B_CLAIM_GAP.md`
> Faz 1 (Places + Apollo + frontend `/karar-vericiler` + CSV + export preset + search-hints) = Claude, CANLIDA.
> **Sınır:** Codex backend (`backend/`). Frontend Claude'da. Konvansiyon: tenant scope + requireModule('leads'),
> Apollo key env.APOLLO_API_KEY, Places getGoogleMapsKey, `bun run build`+`bun test`+`tenant:guard` yeşil.

## 0. CANLI TEST BULGUSU (KRİTİK — önceliği belirler)
Fitness/TR canlı testte **Apollo people-search 0 kişi döndürdü** (tüm satırlar "C"). Apollo Türk KOBİ'lerinde
zayıf; ABD/uluslararası firmalarda güçlü. Sonuç:
- TR yerel segment (fitness/wellness vb.) → **website-OSINT + Google operatör** asıl yol.
- Uluslararası/büyük alıcı (ihracat) → Apollo people-search değerli kalır.
- Çoğu firmada web sitesi VAR → `/team /about /impressum` taraması isim/unvan verebilir.

---

## ✅ Faz 1 (Claude, bitti)
- [x] Places havuzu (sektör×şehir) + Apollo people-search + A/B/C skor + finder.service
- [x] `POST /lead-machine/decision-makers/find` + `/presets` (requireAuth+requireModule)
- [x] EXPORT_B2B_TITLES preset + `POST /decision-makers/search-hints` (Google operatör + LinkedIn URL)
- [x] Frontend `/karar-vericiler` (form + tablo + CSV)

---

## 🔴 GÖREV A — Website-OSINT karar verici fallback (ÖNCELİK 1, test bulgusu)
Apollo 0 dönünce finder, firmanın web sitesinden karar verici çıkarsın.
- [ ] `finder.service.runDecisionMakerFinder`: company.website varsa ve Apollo boşsa
      `enrichment.analyzeCompanyWebsite(website)` çağır (zaten scraper-service ile /team /about /impressum
      isim+unvan regex çıkarımı yapıyor) → bulunan isim/unvanı row'a yaz.
- [ ] Sosyal medya linklerini de çek (Instagram/LinkedIn company) → row.social_url.
- [ ] Skor: website'tan isim+karar-verici unvan → **B**; sadece isim → **C+**; hiç yok → **C**.
- [ ] Kabul: fitness/TR testinde C satırların önemli kısmı isimli (B) hale gelmeli.

## 🔴 GÖREV B — Batch karar-verici enrichment (mevcut adaylara)
İhracat iddiası: elimdeki customs/GTİP alıcı firmalarına kişi bul.
- [ ] `POST /lead-machine/candidates/enrich-decision-makers` (requireModule('leads'), tenant-scope):
      body { icp_id?|job_id?|candidate_ids[]?, titles? } → seçili lead_candidates üzerinde
      domain → Apollo people-search (EXPORT_B2B_TITLES) + website-OSINT fallback (Görev A).
- [ ] Sonucu lead_candidates.raw_data.decision_makers[] (name/title/linkedin_url/source/confidence) olarak yaz;
      idempotent (tekrar koşumda güncelle).
- [ ] Kabul: customs ile bulunmuş bir firmaya en az bir karar verici eklenebiliyor.

## 🔴 GÖREV C — LinkedIn bağlantı + mesaj şablonu (AI)
- [ ] `draft.service`'e LinkedIn modu: lead bazlı **connection request** + **ilk mesaj** + **2-3 adım takip**
      üret (askBestAvailable zaten var; dil TR/EN, kişi adı+unvan+firma+ürün bağlamı).
- [ ] Endpoint: `POST /lead-machine/outreach/linkedin-templates` { candidate_id|context } → { connection, first_message, followups[] }.
- [ ] Kabul: bir lead için 3 adımlı, kişiselleştirilmiş, profesyonel LinkedIn metin seti döner.

## 🔴 GÖREV D — Takip planı / sequence
- [ ] outreach'i çok adımlı LinkedIn cadence ile genişlet (gün-0 bağlantı, gün-3 mesaj, gün-7 takip…);
      durum takibi (gönderildi/yanıt). lead_outreach_drafts/outreach_campaigns yapısını kullan.
- [ ] Kabul: bir aday için sequence oluşturulup adımları listelenebiliyor.

## ⚪ GÖREV E — Sertleştirme (sonra)
- [ ] find senkron→background job (lead_search_jobs channel='b2b_decision_makers'), timeout riski.
- [ ] Sonuçları lead_candidates'a persist (source='decision_maker') + dedup.
- [ ] XLSX export. Sektör presetleri (otel/medikal/otomotiv).

---

## Önerilen sıra
A (website-OSINT — test'te hemen değer) → B (customs adaylarına kişi) → C (mesaj) → D (sequence) → E.
A + B, "temiz isimli liste" beklentisini Apollo'ya bağımlı kalmadan karşılar.
