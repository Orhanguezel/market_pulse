# CODEX GÖREVİ — Karar Verici Bulma (Decision-Maker Finder) sertleştirme

> Plan: `docs/lead-machine/DECISION_MAKER_FINDER_PLAN.md`. Faz 1 Claude tarafından kuruldu.
> **Mevcut (Claude, çalışıyor):** `backend/src/modules/lead-machine/decision-maker/`
> - `apollo-people.ts` — Apollo `mixed_people/search` (domain + titles) karar verici adayı
> - `finder.service.ts` — Places havuzu (sektör×şehir) → Apollo → A/B/C skor → satırlar
> - `router.ts` — `POST /lead-machine/decision-makers/find` + `/presets` (requireAuth+requireModule('leads'))
> - Frontend: `/{locale}/karar-vericiler` (form + tablo + CSV indir). Sektör preset: fitness.

## Kalan (Codex — sertleştirme, aceleci değil)
1. **Job'a alma:** şu an senkron (1-2 dk, timeout riski). `lead_search_jobs` channel='b2b_decision_makers'
   ile background job + ilerleme + sonuç saklama (lead_candidates'a karar-verici alanları).
2. **XLSX export** (CSV var; xlsx ekle — opsiyonel).
3. **Dedup/persist:** sonuçları lead_candidates'a yaz (source='decision_maker', raw_data'da dm alanları),
   tekrar koşumda INSERT IGNORE.
4. **Apollo plan kontrolü:** mixed_people/search erişimi yoksa graceful (boş döner) — log + uyarı.
5. **Sektör presetleri genişlet:** oteller (satınalma müdürü), medikal estetik, otomotiv distribütörü.
6. **Google-operatör ipucu üreteci** (yarı-manuel asist): `site:linkedin.com/in "Founder" "{sector}" "Turkey"`.

## "LinkedIn ile B2B Müşteri Bulma" iddiası eksikleri (bkz. docs/lead-machine/LINKEDIN_B2B_CLAIM_GAP.md)
7. **Batch karar-verici enrichment:** lead_candidates (customs/GTİP alıcı firmaları) üzerinde
   Apollo people-search by domain + EXPORT_B2B_TITLES → her firmaya karar verici(ler) iliştir
   (raw_data.decision_makers[] veya ayrı tablo). Endpoint: POST /lead-machine/candidates/enrich-decision-makers.
   (finder.service apollo-people.ts'i yeniden kullan.)
8. **LinkedIn mesaj/bağlantı şablonu (AI):** draft.service'e LinkedIn modu — connection request + ilk mesaj +
   2-3 adım takip; lead bazlı (askBestAvailable zaten var). 
9. **Takip planı / sequence:** outreach'i çok adımlı LinkedIn cadence ile genişlet.
NOT (Claude bu turda ekledi): EXPORT_B2B_TITLES preset + /decision-makers/search-hints (Google operatör + LinkedIn URL).

## Konvansiyon
- tenant scope + requireModule('leads'); Apollo key env.APOLLO_API_KEY (canlıda set); Places getGoogleMapsKey.
- `frontend/` Claude'da. `bun run build` + `bun test` + tenant:guard yeşil.
