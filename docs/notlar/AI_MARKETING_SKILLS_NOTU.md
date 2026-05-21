# İlham Notu — ai-marketing-skills

> **Bu dosya bir hatırlatmadır.** market_pulse üzerinde çalışırken aşağıdaki
> konularda `ai-marketing-skills` reposundan **fikir/desen** alınabilir.
> Bağımlılık değil, referans kütüphanesi.

**Kaynak:** `/home/orhan/Documents/Projeler/ai-marketing-skills` (3. parti, Single Grain / ericosiu — local-only referans, bu repoya commit/deploy edilmez)

---

## market_pulse için ilham alınacak konular

market_pulse = Türk KOBİ/sanayi için **modüler operasyon SaaS** (müşteri-rakip-bayi-lead-fiyat
tek panel; Monitor / CRM / Lead modülleri). Bu repodaki en güçlü eşleşme bu proje.

| Kaynak skill | market_pulse'ta nereye | Ne alınır |
|---|---|---|
| **sales-pipeline** (`icp_learning_analyzer.py`, `trigger_prospector.py`, `deal_resurrector.py`, `rb2b_suppression_pipeline.py`) | Lead modülü, CRM modülü | ICP'yi win/loss verisinden öğrenip güncelleme; web sinyali (yeni işe alım, fuar, funding) ile prospect tetikleme; ölü deal canlandırma 3-katman skoru; 5-katman suppression. **Mantığı al, scraper-service'e bağla** (RB2B/HubSpot/Instantly yerine) |
| **outbound-engine** (`outbound-engine/SKILL.md`, `references/` ICP template) | Lead → outreach akışı, ICP tanımı | ICP şablonu, kopya kuralları, cold outbound optimizer mantığı — TR/DE pazarına uyarlanarak |
| **conversion-ops** (`survey_lead_magnet.py`, `cro_audit.py`) | Lead magnet üretimi, müşteri landing skorlama | Anket verisinden segment + lead magnet üretme; landing CRO skoru (headless browser gerektirmiyor) |
| **growth-engine** (`experiment-engine.py`, `autogrowth-weekly-scorecard.py`) | SaaS büyüme, modül adoption deneyleri | Bootstrap CI + Mann-Whitney U ile A/B; haftalık scorecard deseni — kendi büyüme metriklerine |
| **revenue-intelligence** (`client_report_generator.py`) | Müşteriye operasyon raporu | Modül başına müşteri raporu üretimi deseni |

## Alınmayacaklar (örtüşme / alakasız)

- seo-ops → guezelwebdesign/GeoSerra GEO skill suite ile çakışır, market_pulse'a gerekmez.
- podcast-ops, team-ops, finance-ops → kapsam dışı.

## Uyarlama kuralları

- Her `SKILL.md` başındaki **telemetry preamble** satırlarını kopyalamadan önce **sil**.
- Dış SaaS bağımlılıkları (RB2B / HubSpot / Instantly / Brave / Gong) sende **yok**;
  sadece algoritma/mantığı al, entegrasyonu **scraper-service** üzerine kur.
- Akışlar ABD B2B GTM'ine göre; ICP/agency keyword'leri **TR/DE pazarına yeniden yaz**.
- Kod parçası alınacaksa kaynak reponun `LICENSE` dosyasını kontrol et.
