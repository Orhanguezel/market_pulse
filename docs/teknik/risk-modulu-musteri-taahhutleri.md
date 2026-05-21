# Risk Modülü — Bionluk Müşteri Taahhüt Manifestosu (KORUNUM LİSTESİ)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint A0 — Risk modülü aktarımı öncesi)
> **Hedef okuyucu:** ⚙️ Codex — aktarım sırasında bu **davranışlar bozulmamalı**, yoksa Bionluk müşterisinin teslim kalitesi düşer
> **Bağlı çeklist:** [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md) Sprint A0/A1/A4
> **Kaynak:** [../musteri/amazon-proje-taahhut-listesi.md](../musteri/amazon-proje-taahhut-listesi.md) — Bionluk, 20.000 TL, ÖDENDİ ✓

---

## Bu belge nedir

amozon repo'sunda Bionluk müşterisine **teslim edilmiş ve ödemesi alınmış** ürün özelliklerinin listesi. Risk modülü olarak market_pulse'a taşınırken bu davranışlar **birebir korunmalı**. Codex aktarım sırasında bir tanesini bozarsa müşteri davası açabilir.

market_pulse'taki Risk modülü amozon'un upstream'i değil — ondan **fork** edildi (Senaryo A). Yani amozon'da bug fix olursa o repo'da olur, market_pulse Risk modülü kendi yoluna devam eder. Ama **temel teslim taahhüdü** her ikisinde de geçerli kalır.

---

## §1 — Skorlama Davranış Korunumu (KIRMIZI ÇİZGİ)

### 5 boyut + composite (bozulmamalı)

| Boyut | Kaynak dosya (amozon) | Hedef (market_pulse) | Kritik |
|---|---|---|---|
| Kategori risk | `scorers/category-risk.scorer.ts` | `modules/risk/scorers/category-risk.scorer.ts` | seller yoğunluğu + dominant brand + review dağılımı |
| Marka güvenilirlik | `scorers/brand-reliability.scorer.ts` | aynı yol | fiyat tutarlılığı + listing kalitesi |
| SKU kaos | `scorers/sku-chaos.scorer.ts` | aynı yol | fiyat σ + price spread + seller/listing oranı |
| Fiyat savaşı | `scorers/price-war.scorer.ts` | aynı yol | sayfa 1→3 fiyat trendi + **RACE_TO_BOTTOM** tespiti |
| Operasyonel risk | `scorers/operational-risk.scorer.ts` | aynı yol | negatif review pattern + iade/kalite şikayeti |
| Composite | `composite.scorer.ts` | aynı yol | 5 boyut → toplam skor + karar etiketi |

### Karar etiketi (literal string'ler — değiştirme!)

```typescript
// composite.scorer.ts içinde:
type Decision = 'GÜVENLİ' | 'DİKKATLİ_OL' | 'GİRME';
```

Bionluk müşteri bu **Türkçe** etiketleri görüyor. İngilizceye çevirme, lower-case yapma, başka semboller ekleme. UI'da bunlar:
- 🟢 GÜVENLİ — yeşil renk
- 🟡 DİKKATLİ_OL — sarı renk
- 🔴 GİRME — kırmızı renk

### Confidence katmanı (bozulmamalı)

```typescript
type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
```

`INSUFFICIENT_DATA` → "yetersiz veri" — Bionluk müşterisi gerçek bir taramada bu confidence ile karşılaştı (`cable organizer` ve `surge protector` keyword'leri test sonucu — [docs/test-results/2026-05-08-5keyword-results.md](../test-results/2026-05-08-5keyword-results.md)). Davranış:
- INSUFFICIENT_DATA olduğunda overall decision **TAKIP_ET**'e indirilir (downgrade)
- UI'da "yetersiz veri" badge'i + neden açıklaması gösterilir

### MIXED_SIGNAL flag (bozulmamalı)

```typescript
// signal.validator.ts içinde:
if (oneDimensionHigh && othersLow) {
  flag = 'MIXED_SIGNAL';
}
```

Tek boyut yüksek, diğerleri düşük → MIXED_SIGNAL. UI'da yan rozet olarak görünür. **Bu mantık bozulmamalı** — çoğu sahte alarm bu mekanizmayla yakalanıyor.

---

## §2 — Reason Persistence (DB Kontratı)

Bionluk müşterisinin teslim listesinde özel madde:

> "`reason` alanı DB'ye persist ediliyor — 5 boyut için ayrı kolon (`amazon_risk_scores`)"

[021_amazon_scoring_schema.sql](../../backend/src/db/seed/sql/021_amazon_scoring_schema.sql) içinde `amazon_risk_scores` tablosunda:
- `category_risk_reason` TEXT
- `brand_reliability_reason` TEXT
- `sku_chaos_reason` TEXT
- `price_war_reason` TEXT
- `operational_risk_reason` TEXT

**Codex'in yapacağı:**
- Aktarımda bu kolonları **silmez veya JSON'a indirgemez**
- 5 ayrı kolon olarak kalır
- Her scoring çalıştığında **boş bırakılmaz** — composite.scorer.ts her boyut için 1-2 cümlelik reason üretir

---

## §3 — Confidence Honesty Kuralı (Phase 4)

amozon Phase 4'te LLM'i **dürüst** olmaya zorlayan bir prompt sistemi yazıldı:

> "LLM 'tahmini/sınırlı veri' ifadelerini zorunlu kılar; coverage gate AL/UZAK_DUR'u TAKIP_ET'e indirir"

Kaynak: [llm-enrichment.ts](../../../amozon/backend/src/amazon/llm-enrichment.ts) içindeki system prompt.

**Codex'in yapacağı:**
- llm-enrichment.ts'i **olduğu gibi** taşı, prompt metnine dokunma
- coverage gate ([coverage-gate.ts](../../../amozon/backend/src/amazon/coverage-gate.ts)) — boyut başına minimum data_points eşiği uygulanır; altındaki sonuçların güveni düşürülür
- Bu davranış Bionluk teslimi sırasında müşteriye demonstre edildi, kayıtlı feature

---

## §4 — Single Journey UX (Phase 4)

amozon admin panelinde `/scan` sayfası **tek ekranda 6 aşama progress bar** + özet gösteriyor.

> "keyword yaz → tek ekranda 6 aşama progress bar → özet"

Codex'in yapacağı (Sprint A3 admin taşımasında):
- [scan/page.tsx](../../../amozon/admin_panel/src/app/scan/page.tsx) ve [components/admin/ScanJourneyPanel.tsx](../../../amozon/admin_panel/src/components/admin/ScanJourneyPanel.tsx) **birebir taşınır**
- 6 aşama: scrape → normalize → score → keepa-enrich → llm-reasoning → done
- "Auto-Enrichment" mantığı: scan "done" denildiğinde tüm seller/Keepa hazır olur (Promise.all + `enriching` ara status)

**Bu UX müşteri demosunda gösterildi → bozulmamalı.**

---

## §5 — Thesis Memory (Phase 4)

amozon'da AL kararı verilen ürünler **tez olarak izlenir**:

> "AL kararları 'tez' olarak izlenir; sinyaller bozulunca 'zayıfladı/bozuldu' uyarısı"

Kaynak: [thesis.service.ts](../../../amozon/backend/src/amazon/thesis.service.ts) + 022_amazon_theses.sql + admin `/theses` sayfası.

Codex'in yapacağı:
- thesis.service.ts (276 satır) **birebir taşınır**
- 022_amazon_theses.sql schema'sı korunur
- admin `/theses` sayfası taşınır
- **Test:** Phase 4'te bu feature için unit test'ler var ([__tests__/](../../../amozon/backend/src/amazon/__tests__/)) — aktarım sonrası tümü yeşil kalmalı

---

## §6 — Test Sayım Hedefi (KALİTE KAPISI)

Bionluk teslim listesinde **specific test sayım taahhüdü**:

> "165 test — 27 dosya, 0 hata (bun test)"

amozon repo'sunda `bun test` çalıştırılınca toplam **165 test** geçiyor olmalı (Phase 4 sonu). market_pulse Risk modülüne aktarımdan sonra:

- [ ] **⚙️ Codex** — `bun test backend/src/modules/risk` → **165 test, 0 hata**
- [ ] Aktarım sırasında 1 test bile kaybolursa **kalite kapısı kapalı** sayılır, PR merge edilmez
- [ ] Test sayısı **arttırılabilir** (yeni test eklemek serbest), azaltılamaz

---

## §7 — Keyword Testleri (HİSSE KOPYASI)

Bionluk'a teslim sırasında 5 keyword test edildi:

| Keyword | Skor | Decision | Confidence |
|---|---|---|---|
| thermal labels | 5.3 | DİKKATLİ_OL | HIGH |
| dash cam | 5.4 | DİKKATLİ_OL | HIGH |
| webcam lighting | 5.2 | DİKKATLİ_OL | HIGH |
| cable organizer | — | — | INSUFFICIENT_DATA |
| surge protector | — | — | INSUFFICIENT_DATA |

Bu **regression test referansı** — aktarımdan sonra aynı 5 keyword ile çalıştırıldığında **aynı yakınlıkta sonuç gelmeli** (±%5 skor sapması kabul; karar etiketi değişirse alarm).

- [ ] **⚙️ Codex** — Aktarım sonrası bu 5 keyword smoke test scripti yaz (`scripts/risk-bionluk-regression.sh`)
- [ ] **🧠 Claude** — Sonuçları karşılaştır, sapma varsa root cause analiz

---

## §8 — Scoring Config Dış Etiketi

Bionluk taahhüdünde:

> "Merkezi config — ağırlıklar ve eşikler `scoring.config.ts`'te toplandı"

**Kritik kural:** Skorlama parametreleri (ağırlık, eşik, çarpan) **scoring.config.ts** dışına dağıtılmaz. Bu tek dosya bütün sistemi yönetir.

Codex'in yapacağı:
- [scoring.config.ts](../../../amozon/backend/src/amazon/scoring.config.ts) (146 satır) birebir taşınır
- Aktarımda hiçbir scorer içine "magic number" dağıtılmaz
- Müşteri ileride ağırlık ayarlamak isterse tek dosya değişir → kolay yönetim

---

## §9 — Standalone Repo İlkesi (TARİHSEL)

Bionluk'a teslim "standalone repo" olarak yapıldı (`docs/standalone-scope.md`):

- ERP bağımlılıkları koparıldı (`job-store.ts` Seçenek A)
- Legacy dosyalar silindi
- ai.client lib/ altına taşındı
- E2E test standalone'a uyarlandı

market_pulse'a aktarımda **bu standalone kararlar tersine çevrilebilir**:
- Risk modülü artık market_pulse içinde yaşar
- Ortak `_shared/` modülünü kullanabilir (artık ERP bağımsızlığı zorunlu değil)
- ai.client kullanma davranışı korunur ama dosya yolu değişebilir

**Risk yönetimi:** Bionluk'a teslim edilmiş standalone repo zaten bağımsız çalışıyor — orada kalır, bozulmaz. market_pulse Risk modülü farklı bir kuruluş, kendi yapısı olabilir.

---

## §10 — Aktarım Çıkış Doğrulama Listesi

Codex aktarımı tamamladıktan sonra Claude şu kontrolü yapar:

- [ ] 5 scorer + composite çalışıyor (manuel smoke)
- [ ] Karar etiketi Türkçe (GÜVENLİ/DİKKATLİ_OL/GİRME)
- [ ] Confidence 4 katmanlı (HIGH/MEDIUM/LOW/INSUFFICIENT_DATA)
- [ ] MIXED_SIGNAL flag tetikleniyor
- [ ] 5 reason kolonu DB'ye yazılıyor
- [ ] Coverage gate çalışıyor (INSUFFICIENT_DATA → TAKIP_ET downgrade)
- [ ] Single Journey UX 6 aşama progress
- [ ] Thesis Memory `/theses` sayfası
- [ ] 165 test, 0 hata
- [ ] 5 keyword regression sonucu ±%5 sapma içinde
- [ ] scoring.config.ts tek kaynak (magic number dağılmamış)

---

## Bağlantılar

- 📋 Aktarım çeklisti: [AMOZON_AKTARIM_CEKLISTI.md](AMOZON_AKTARIM_CEKLISTI.md)
- 📜 Bionluk taahhüt listesi: [../musteri/amazon-proje-taahhut-listesi.md](../musteri/amazon-proje-taahhut-listesi.md)
- 📊 Skorlama mantığı: [SCORING_LOGIC.md](SCORING_LOGIC.md)
- 🔑 Keepa BYOK kararı: [byok-keepa-politikasi.md](byok-keepa-politikasi.md)
- 🧪 Test sonuçları (regression baseline): [../test-results/](../test-results/)
- ⚙️ amozon teknik PDF: [amazon-scoring-engine-teknik-rapor.pdf](amazon-scoring-engine-teknik-rapor.pdf)
