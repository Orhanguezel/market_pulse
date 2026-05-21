# Sprint 1 — Tam Tarama İş Paketi (Codex için)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude → ⚙️ Codex (handover)
> **Bağlı:** [poc-kalite-kontrol-raporu.md](poc-kalite-kontrol-raporu.md) (K-1/K-2/K-3 düzeltmeleri) + [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md) Sprint 1
> **Karar:** Avrasya görüşmesi **şimdilik atlanıyor**. Sistem K-1...K-8 onaylı varsayımlarla çalışıyor. Mail gönderme aşamasına kadar her şey otomatik ilerleyebilir.

---

## Hedef

12 hafta sonu (~2026-08-13) sistemin elimizde **enrichment edilmiş 60-100 hazır mail taslağı** olsun. Sadece **gönder** butonu kalsın — bu Avrasya onayı sonrası elle tetiklenir.

Akış:
```
Sprint 1 tarama  →  Sprint 1 ICP filtre  →  Sprint 1 onay paneli (manuel/auto)
                                                  ↓
Sprint 2 10times intent  →  Sprint 2 komşu stand
                                                  ↓
Sprint 3 Apollo enrichment (mail bulma)
                                                  ↓
Sprint 3 GPT kişiselleştirme  →  draft hazır (status='draft')
                                                  ↓
                          [BU NOKTADA DURURUZ]
                                                  ↓
                  Avrasya onayı → "Gönder" basıldığında akar
```

---

## Sprint 1 — Codex Adımları

### 1.1 — PoC kalite raporundaki K-1 + K-2 düzeltmeleri ÖNCE

[poc-kalite-kontrol-raporu.md §3](poc-kalite-kontrol-raporu.md):

**K-1:** `_extract_messefrankfurt_list` 30'da kesiyor → iteration limit 200+ + slug regex fallback ekle
```python
SLUG_RE = re.compile(r'exhibitor-search\.detail\.html/([a-z0-9-]+)\.html')
# eğer primary extract <50 dönerse, regex fallback'le tamamla
```

**K-2:** `?page=N` sayfalama ekle
```typescript
async function scrapeAllPages(baseUrl: string): Promise<RawExhibitor[]> {
  const all: RawExhibitor[] = [];
  let page = 1;
  while (page <= 30) {
    const batch = await scrapeOfficialExhibitorList(`${baseUrl}?page=${page}`);
    if (batch.length === 0) break;
    all.push(...batch);
    page++;
    await sleep(2500 + Math.random() * 1500);
  }
  return all;
}
```

**Çıkış:** PoC script tekrar çalıştırıldığında **90+ exhibitor/sayfa** + **~15 sayfa × 90 = ~1.350 toplam URL**.

### 1.2 — Detail scrape job (paralel)

`fair.job.ts` zaten 2 aşamalı çalışıyor. Şimdi paralel olarak çalıştırılması ve hata izolasyonu:

```typescript
const detailUrls = await scrapeAllPages(fairListUrl);  // ~1300 URL

// Paralel max 5 (anti-bot — her detail isteği 2-3 sn delay'li olmalı)
const limiter = pLimit(5);
const results = await Promise.allSettled(
  detailUrls.map((url) => limiter(() => scrapeExhibitorDetail(url))),
);

const successful = results
  .filter((r): r is PromiseFulfilledResult<DetailData> => r.status === 'fulfilled')
  .map((r) => r.value);

// ICP filtre — sonra
for (const exhibitor of successful) {
  const match = matchesIcp(exhibitor, icpDefinition);
  if (match.matches && match.score >= 5.0) {
    await insertCandidate({ ...exhibitor, channel: 'trade_fair', leadScore: match.score });
  }
}
```

**Beklenen sonuç:** ~1300 detail × ICP filtre → **~250-400 aday** `lead_candidates`'a düşer.

**Süre:** ~1300 URL × 3 sn = ~65 dakika tarama. Job arka planda çalışır, bittiğinde notification.

### 1.3 — ICP filtre konfigürasyonu

ICP zaten DB'de: UUID `9f4c8f04-64b8-4da5-9c7d-4a4b5cf4b1b0`. Avrasya görüşmesi bekleyen kalibre alanlar:

- `priority_geographies`: DE, AT, NL, PL, FR (varsayılan)
- `exclude_firm_types`: manufacturer, OEM tier-1, single car brand dealer (varsayılan)
- `min_lead_score_for_candidate`: 5.0 (varsayılan)

**Avrasya görüşmesi gelince** bu alanlar **v2'ye güncellenir**, Codex yeni UUID seed eder, mevcut adaylar yeniden filtrelenir. Şimdilik **varsayılan** ICP ile ilerlenir.

### 1.4 — Onay paneli — otomatik mod

Aday review için Avrasya görüşmesini bekleyemeyiz çünkü 12 hafta sürer. Pragmatik karar:

**Otomatik onay (Sprint 1 → 3 arası):**
- ICP skoru **≥ 7.0** olan adaylar **otomatik onaylanır** (yüksek güven)
- ICP skoru **5.0 - 6.9** olan adaylar **pending kalır** (manuel review, Avrasya görüşmesi sonrası)
- ICP skoru **< 5.0** olan adaylar `lead_candidates`'a hiç düşmez

Codex'in yapacağı:
```typescript
if (match.score >= 7.0) {
  await insertCandidate({ ..., status: 'approved' });  // doğrudan enrichment'a
} else {
  await insertCandidate({ ..., status: 'pending' });   // manuel review bekler
}
```

**Beklenen dağılım:** 400 aday → 150 auto-approved + 250 pending.

**Risk:** Auto-approve precision %80+ olmalı. Avrasya görüşmesi sonrası ICP v2 ile re-filter yapılır, yanlış otomatik onaylar **status='auto_reject'**'e alınır.

### 1.5 — Onay paneli UI (Avrasya manuel inceleme için, opsiyonel)

Şimdilik onay paneli UI **yazılır ama Avrasya'ya açılmaz**. Kendimiz (Orhan + Claude) ara ara bakıp auto-approve'ları sample edip precision ölçeriz.

`admin_panel/src/app/(main)/admin/lead-machine/fair/review` sayfası ([lead-onay-paneli-kullanim-rehberi.md](../musteri/lead-onay-paneli-kullanim-rehberi.md) referansı) yine yazılır, sadece kullanım Avrasya görüşmesine kadar internal kalır.

---

## Sprint 2 — Codex Adımları (paralel olarak başlanabilir)

### 2.1 — 10times olmadan ilerle

10times API key başvurusu **manuel iş** (Avrasya hesabıyla); şimdilik atlanıyor. Sprint 2'nin diğer adımı **komşu stand hesabı** Sprint 1 verisiyle yapılır.

### 2.2 — Komşu stand hesabı

Avrasya `3.1 D11`'in ±5 metre çevresindeki standları bul:

```typescript
// backend/src/modules/lead-machine/fair/neighbor.ts (yeni)

import { parseBooth } from './booth';

const AVRASYA_BOOTH = parseBooth('3.1 D11');  // { hall: '3.1', row: 'D', col: 11 }

function isNeighbor(candidateBooth: string): boolean {
  const c = parseBooth(candidateBooth);
  if (!c || c.hall !== AVRASYA_BOOTH.hall) return false;
  const rowDist = Math.abs(c.row.charCodeAt(0) - AVRASYA_BOOTH.row.charCodeAt(0));
  const colDist = Math.abs(c.col - AVRASYA_BOOTH.col);
  return rowDist <= 2 && colDist <= 5;  // 2 sıra × 5 stand mesafesi
}

// Her aday için:
candidate.raw_data.fair_info.is_neighbor = isNeighbor(candidate.raw_data.fair_info.booth_number);
```

**Beklenen:** 20-30 firma komşu olarak işaretlenir.

---

## Sprint 3 — Mail Bulma (Apollo Enrichment)

Bu Sprint'in net çıktısı: **her onaylı aday için karar verici + email**. Hedef: 150-250 enrichment.

### 3.1 — Apollo.io hesabı

**Manuel iş — Avrasya görüşmesi sonrası açılır** (Soru 4'te onay alınmalı).

Şimdilik **Hunter.io free tier (50 arama/ay)** ile pilot — Codex `enrichment.service.ts` içine Hunter adapter ekler.

### 3.2 — Hunter.io adapter (Sprint 3 başlangıcı)

```typescript
// backend/src/modules/lead-machine/enrichment/hunter.client.ts (yeni)

interface HunterDomainSearchResponse {
  data: {
    organization: string;
    emails: Array<{
      value: string;
      type: 'personal' | 'generic';
      confidence: number;
      first_name: string | null;
      last_name: string | null;
      position: string | null;
      department: string | null;
      linkedin: string | null;
    }>;
  };
}

export async function findEmailsByDomain(domain: string): Promise<EnrichmentResult> {
  const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${env.HUNTER_API_KEY}`;
  const res = await fetch(url);
  const json: HunterDomainSearchResponse = await res.json();

  // Karar verici öncelik sırası
  const PRIORITY_KEYWORDS = [
    'purchasing', 'einkauf', 'satinalma',
    'category manager',
    'head of', 'director',
    'managing director', 'geschäftsführer',
    'owner', 'inhaber',
    'founder',
  ];

  const ranked = json.data.emails
    .filter((e) => e.type === 'personal' && e.confidence >= 70)
    .sort((a, b) => {
      const aScore = scoreByPriority(a.position, PRIORITY_KEYWORDS);
      const bScore = scoreByPriority(b.position, PRIORITY_KEYWORDS);
      return bScore - aScore;
    });

  return {
    decision_maker: ranked[0] ?? null,
    all_emails: ranked,
    source_vendor: 'hunter',
  };
}
```

### 3.3 — Enrichment job

```typescript
// backend/src/jobs/enrichment.job.ts (yeni cron — her gün 03:00)

async function runEnrichmentJob() {
  const pending = await db.query(`
    SELECT id, website FROM lead_candidates
    WHERE status = 'approved'
      AND channel = 'trade_fair'
      AND id NOT IN (SELECT candidate_id FROM lead_enrichment)
    LIMIT 50
  `);

  for (const cand of pending) {
    if (!cand.website) continue;
    const domain = extractDomain(cand.website);
    try {
      const result = await findEmailsByDomain(domain);
      await db.insert('lead_enrichment', {
        candidate_id: cand.id,
        decision_maker: result.decision_maker,
        source_vendor: 'hunter',
      });
    } catch (e) {
      // hata loglar, sıradakine geç
    }
    await sleep(2000);  // rate limit
  }
}
```

**Beklenen:** 150 onaylı aday × Hunter (free 50/ay yetersiz) → **Apollo gerekli** (Avrasya görüşmesi sonrası).

Free tier 50 ay/ay ile **ilk 50 aday için pilot** yapılabilir → precision ölç.

### 3.4 — Manuel LinkedIn fallback

Hunter/Apollo email bulamadığında: [apollo-fallback-sop.md](apollo-fallback-sop.md) SOP'una göre manuel iş. Bu Avrasya/Orhan'ın işi, kod değil.

---

## Sprint 3 — Mail Taslakları (gönderme YOK)

Bu adım sistemimizin son otomatik çıktısı. Sonrası elle.

### 3.5 — Mail taslak servisi

```typescript
// backend/src/modules/lead-machine/outreach/draft.service.ts (yeni)

import { TEMPLATES } from './templates';  // outreach-templates.md'den hardcoded
import { personalizeWithGPT } from './personalize';

async function generateDraft(candidateId: string) {
  const cand = await getCandidate(candidateId);
  const enrichment = await getEnrichment(candidateId);
  if (!enrichment?.decision_maker?.email) return;  // mail yoksa skip

  const lang = pickLanguage(cand.country);  // DE/EN/TR
  const personalization = await personalizeWithGPT(cand);  // 1 cümle
  const template = TEMPLATES[lang];

  const body = template
    .replace('{alici_isim_varsa_yoksa_Sirs}', enrichment.decision_maker.first_name ?? 'Sirs')
    .replace('{kisisellestirme_paragrafi}', personalization)
    .replace('{calendly_link}', env.CALENDLY_LINK)
    .replace('{gonderici_ad_soyad}', env.OUTREACH_SENDER_NAME);

  await db.insert('lead_outreach_drafts', {
    candidate_id: candidateId,
    subject: SUBJECTS[lang],
    body,
    ai_model: 'gpt-4o-mini',
    status: 'draft',  // ←← BURADA DURUR
  });
}
```

**Önemli:** `status = 'draft'` ile kalır. Gönderim YOK. Mail kuyrukta bekler.

### 3.6 — Onay sayfası UI

Avrasya export ekibi (görüşme sonrası açılacak) admin panel'de `lead_outreach_drafts.status='draft'` listesini görür:

```
Mail taslakları (47 hazır)
─────────────────────────────────────
[ Onayla ] [ Düzenle ] [ İptal ]   AutoParts Distribution GmbH
   "Dear Sirs, your aftermarket programme covering DE..."

[ Onayla ] [ Düzenle ] [ İptal ]   CarMatsExpress B.V.
   "Hi team, your tailored-mat range for VW and BMW..."
```

Onayla → `status='approved_for_send'`. Avrasya verene kadar boşlukta bekler.

---

## Süreç Kapanışı — Ne Zaman "Gönder" Basılır?

Sistem **2026-08-13** civarında hazır olur:
- ~250 aday enriched
- ~150 mail taslağı `status='draft'`
- DNS auth (DMARC/DKIM) bekliyor → Avrasya BT
- Calendly link → Avrasya'dan
- Gönderim onayı → Avrasya'dan

Avrasya onay verdiğinde **"Toplu Onayla + Gönder"** butonu bir günde mail kuyruğunu boşaltır (10/gün warmup, 30/gün steady-state). Hedef: **2026-08-15 ilk mail batch'i**, fuara **3 hafta kala**.

---

## Codex'e Sıralı İş Listesi

Bu belge tek başına yeterli — Codex sırayla yapar:

- [ ] **1.1** PoC K-1/K-2 düzeltmeleri (extractors.py + fair.scraper.ts) — **engelleyici**
- [ ] **1.2** Detail scrape paralel job (p-limit + Promise.allSettled)
- [ ] **1.3** ICP filtre + auto-approve mantığı (skor ≥ 7.0)
- [ ] **1.4** Sprint 1 tam tarama PR + deploy
- [ ] **1.5** Admin onay paneli (internal use, Avrasya'ya kapalı)
- [ ] **2.2** Komşu stand `neighbor.ts` helper
- [ ] **3.2** Hunter.io adapter (free tier pilot)
- [ ] **3.3** Enrichment cron job
- [ ] **3.5** Mail taslak servisi (draft only, send yok)
- [ ] **3.6** Onay sayfası UI (status='draft' listesi)

Her madde bittiğinde `[x]` ve PR linki. Avrasya görüşmesi sırasında Codex bu listeyi paralel ilerletir; görüşme yapıldığında **mail gönderme** son adımı tetiklenir.

---

## Claude'un Kalan İşleri (paralel)

Bu sırada Claude:
- Sprint 1 sonrası ilk 50 auto-approve adayını sample edip **precision ölçer** (rapor: `docs/teknik/sprint-1-precision-raporu.md`)
- Hunter free 50 sonucundan email kalitesini değerlendirir
- Avrasya görüşmesi yapıldığında [AVRASYA_SORULAR.md](../musteri/AVRASYA_SORULAR.md) yanıtlarına göre ICP v2 + statikleri günceller

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🔧 Fair modülü çeklist: [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md)
- 🧪 PoC kalite raporu (K-1/K-2/K-3): [poc-kalite-kontrol-raporu.md](poc-kalite-kontrol-raporu.md)
- ✉️ Outreach (sade): [../musteri/automechanika-2026-outreach-templates.md](../musteri/automechanika-2026-outreach-templates.md)
- 🔄 Follow-up (sade): [../musteri/automechanika-2026-followup-templates.md](../musteri/automechanika-2026-followup-templates.md)
- 📊 Apollo fallback SOP: [apollo-fallback-sop.md](apollo-fallback-sop.md)
- 📞 Avrasya soru dosyası (gönderim öncesi onay): [../musteri/AVRASYA_SORULAR.md](../musteri/AVRASYA_SORULAR.md)
