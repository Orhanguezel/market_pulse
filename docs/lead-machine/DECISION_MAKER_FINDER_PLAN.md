# Karar Verici Bulma (Decision-Maker Finder) — OSINT Modülü Planı

> **Talep:** Sektör bazlı (örn. fitness/wellness/pilates) işletmelerde **karar verici kişileri**
> (sahip/kurucu/GM/operasyon/satınalma) bulan, doğrulayan, skorlayan ve CSV/XLSX veren bir makine.
> Referans: Bionluk "Fitness sektörü 200 kişilik B2B hedef liste" ilanı.
> **İlke:** LinkedIn'i agresif scrape ETME (ToS + kalite riski). **Hibrit OSINT**: otomatik işletme
> havuzu + lisanslı/açık-kaynak kişi adayı + (yarı) manuel doğrulama.
> Rol: Plan = Claude (mimar). Backend = Codex, Frontend = Claude.

---

## 1. Neden bize uygun — mevcut altyapı (çoğu HAZIR)

| Adım | Mevcut bileşen | Durum |
|---|---|---|
| İşletme havuzu (firma bulma) | **Google Places API** (`directory.scraper` google_maps) | ✅ entegre, çalışıyor |
| Şehir/sektör bazlı arama | b2b.job + search_query + country | ✅ var |
| Karar verici (kişi) bulma | **Apollo** (key var) — org-by-domain → people-by-title | 🟡 key var, people-search akışı port edilecek |
| ICP/uygunluk skoru | icp.matcher + computeScore + enrichment | ✅ var (A/B/C eşlemesi eklenecek) |
| Dedup / temizlik | INSERT IGNORE + reject patterns | ✅ kısmen |
| CSV/XLSX export | CSV mantığı var | 🟡 XLSX + özel kolonlar eklenecek |
| Job/channel mimarisi | lead_search_jobs + channel | ✅ var |

**Yani %70 hazır.** Yeni iş: Apollo people-search akışını portlamak + OSINT skorlama + export kolonları + UI.

## 2. Akış (hibrit, güvenli)

1. **İşletme havuzu** — Places API: `{business_type} in {city}` (fitness center, gym, pilates studio…)
   şehir bazlı (İstanbul/Ankara/İzmir…). Çıktı: ad, şehir, web, gmaps link, kategori, telefon, sosyal.
2. **Karar verici eşleştirme** (her işletme için):
   - **Apollo people-search**: şirket domain → org → people (title filtre: Founder/Owner/GM/Operations/
     Purchasing/Business Development/Franchise). Apollo LinkedIn URL + ad + unvan döndürür (lisanslı veri).
   - **Açık web yedeği**: şirket sitesi ekip/kurucu sayfası; Instagram bio.
   - **Google operatör ipucu** (yarı-manuel asist): `site:linkedin.com/in "Founder" "Pilates" "Turkey"`
     — sistem üretir, operatör doğrular. (Otomatik scrape YOK.)
3. **Doğrulama & skor**: dedup (kişi+işletme), LinkedIn profil-işletme ilişkisi, sektör-dışı eleme.
   Güven skoru: **A** doğrudan karar verici · **B** muhtemel yönetici · **C** işletme doğrulandı, kişi zayıf.
4. **Export**: CSV/XLSX kolonları — company_name, city, business_type, decision_maker_name, title,
   linkedin_profile_url, company_website, social_url, source_url, fit_note, confidence_score, last_verified_at.

## 3. Yeni iş (Codex backend)
- **Apollo people-search servisi**: `enrichment` modülüne org-search (by domain) → people (by titles)
  akışı (memory: isletmeniyonet apollo.php akışı; org→mixed_people→people/match). Title preset listesi.
- **Job/channel**: `b2b_decision_makers` (veya `fitness_linkedin_osint`) — params: business_types[],
  cities[], country, target_count, titles[]. Places havuzu → her firma için Apollo people → skor → kaydet.
  lead_candidates'a karar-verici alanları (decision_maker_name/title/linkedin_url/confidence/source_url)
  raw_data'da veya yeni kolonlarda.
- **Confidence A/B/C** skorlama kuralı + dedup.
- **XLSX export** (yukarıdaki kolonlar) — CSV zaten var, xlsx ekle.

## 4. Yeni iş (Claude frontend)
- Lead Machine altında **"Karar Verici Bulma"** ekranı: sektör + şehirler + hedef sayı + unvanlar →
  job başlat → sonuç tablosu (A/B/C rozet) → **CSV/XLSX indir**. (Tenant app shell, IY tema.)
- Sonuçlar Potansiyel Müşteriler / lead_candidates ile entegre.

## 5. Genelleştirme
Aynı makine sektör-parametrik: fitness → oteller (satınalma müdürü), medikal estetik (klinik sahibi),
otomotiv distribütörü… Sadece business_types + titles + city listesi değişir.

## 6. Önemli (yasal/kalite)
- LinkedIn doğrudan scrape edilmez; Apollo (lisanslı) + açık web + Google operatör (manuel doğrulama).
- Her kayıtta `source_url` + `last_verified_at` + `confidence_score` → "temiz, doğru, tekrarsız,
  satışta kullanılabilir" beklentisi karşılanır (Bionluk ilanı).
- Tam otomatik "200 kişi çek" yerine hibrit → kalite + güvenlik.

## 7. Fazlama
- Faz 1: Places havuzu (var) + Apollo people-search port + A/B/C skor + CSV/XLSX export (backend) → ilk gerçek liste.
- Faz 2: Frontend "Karar Verici Bulma" UI + sektör/şehir presetleri.
- Faz 3: Google-operatör ipucu üreteci + manuel doğrulama iş akışı.
