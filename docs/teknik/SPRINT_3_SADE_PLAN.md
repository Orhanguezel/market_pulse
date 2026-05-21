# Sprint 3 — Sade Plan (Enrichment + Outreach Faz 1)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (10times dersinden sonra gerçeklik kontrolüyle yazıldı)
> **Hedef:** Mail bulma + taslak üretimi — **gönderme YOK, durur**
> **Bağlı:** [SPRINT_1_TAM_TARAMA_IS_PAKETI.md](SPRINT_1_TAM_TARAMA_IS_PAKETI.md) + [sprint-1-precision-raporu.md](sprint-1-precision-raporu.md)

---

## TL;DR — Sprint 3 büyük ölçüde sadeleşti

| Önceki Sprint 3 plan | Yeni Sprint 3 (sade) |
|---|---|
| Apollo.io $49/ay enrichment | ❌ Drop — Hunter free yeterli |
| Hunter.io fallback | ✅ **Ana enrichment** (free tier, 50 credit/ay) |
| Postmark $15/ay | ✅ **Free Developer plan** (100 mail/ay yeter) |
| 4 aylık bütçe ~$300 | **~$5-10 (4 ay)** |
| Sprint 3'te ~80 enrichment | **~9 enrichment** (geri kalan mail zaten elimizde) |

**Sebep:** Messe Frankfurt public API K-1 pilot 166 firma'dan **146'sının mail'ini zaten veriyor** (%87 coverage).

---

## 1. Veri Durumu (Sprint 1 sonrası)

K-1 pilot 166 firma — mail kalite breakdown:

| Mail tipi | Adet | % | Yanıt oranı tahmini | Aksiyon |
|---|---|---|---|---|
| Sahsi `firstname.lastname@` | 33 | 22% | %15-20 | ✅ Direkt kullan |
| Tek isim `peter@` (küçük firma owner) | 35 | 24% | %12-18 | ✅ Direkt kullan |
| Initial+lastname `p.hessels@` | 8 | 5% | %10-15 | ✅ Direkt kullan |
| Generic `info@/sales@/...` | 70 | 48% | %3-8 | 🟡 Hunter ile karar verici ara |
| **Hiç yok** | 20 | — | — | 🔴 Hunter zorunlu |

**ICP filtre sonrası ~80 onaylı aday** içinde tahminen:
- ~38 sahsi mail (zaten elimizde)
- ~33 generic mail (Hunter ile karar verici ara → Hunter free 50 credit yeter)
- ~9 hiç yok (Hunter ile karar verici ara → Hunter free içinde)

**Toplam Hunter credit kullanımı:** ~42 × 1 credit = **42 credit (free tier 50 limit içinde)**.

---

## 2. Servis Gerçeklik Kontrolü (10times dersinden)

10times'tan öğrendiğimiz ders: 3. taraf entegrasyon önerisi → 5 dk gerçeklik kontrolü.

### Hunter.io — ✅ Doğrulandı
- **Public dokümantasyon:** [hunter.io/api](https://hunter.io/api)
- **Self-serve API key:** Evet (signup → Settings → API)
- **Free tier:** 50 credit/ay (kalıcı, bitmez)
- **Endpoint'ler:**
  - `GET /v2/domain-search?domain=` — domain'den tüm mailler
  - `GET /v2/email-finder?domain=&first_name=&last_name=` — isim+domain'den mail
  - `GET /v2/email-verifier?email=` — mail doğrulama (0.5 credit)
- **Credit kullanımı:** 1 credit = 1 mail bulma; 0.5 = 1 doğrulama
- **Bizim ihtiyaç:** ~42 mail bulma → free tier yeter
- **Paket gerekirse:** Starter $34/ay 2000 credit (gerek yok)

### Postmark — ✅ Doğrulandı
- **Free Developer plan:** 100 mail/ay (asla bitmez, test ve küçük volume için)
- **Bizim ihtiyaç:** 4 ay × 60-100 mail = max 400 toplam, ay başı ~25-30
- **Free tier yeter.** Sonra Basic $15/ay'a geçilir gerekirse.
- **API:** [postmarkapp.com/developer](https://postmarkapp.com/developer)
- **Verified sender setup:** Domain DKIM/SPF kayıtları (10 dk DNS değişikliği)

### Calendly — ✅ Bilinen
- Free Basic plan: 1 etkinlik tipi, sınırsız randevu
- Bizim ihtiyaç: tek "10 dk Automechanika randevusu" tipi → yeter

### Apollo.io — ❌ Drop
- Hunter'a redundant (50 credit/ay yeterli)
- $49/ay × 4 ay = $196 tasarruf
- İleride volume artarsa değerlendirilir

### GPT-4o-mini — ✅ Bilinen
- ~300 prompt × $0.0001 = ~$0.03 toplam
- OpenAI API key (zaten olabilir)

---

## 3. Yeni Bütçe Önerisi (K-4 revizyonu)

K-4 onayında $300 demiştik. Gerçek:

| Kalem | Eski plan | Yeni plan |
|---|---|---|
| Apollo.io enrichment | $49 × 4 = $196 | **DROP — $0** |
| Hunter.io fallback | (yedek) | **Free tier — $0** |
| GPT-4o-mini personalization | $15 × 4 = $60 | $0.03 × 4 = ~$0.12 |
| Postmark mail gönderim | $15 × 4 = $60 | **Free Developer — $0** |
| Calendly | $0 | $0 |
| **Toplam (4 ay)** | **$316** | **~$0.50 + opsiyonel kalemler** |

**$315 tasarruf.** Avrasya'ya bütçe sıfıra yakın. Bu da satış argümanı bile: "size servis maliyeti yok denecek kadar düşük."

K-4 onayı revizyon: bütçe = "$10 maks" (volume artarsa Postmark Basic $15/ay'a geçişe hazır olmak için tampon).

---

## 4. Codex İçin İş Paketi

### 4.1 — Hunter.io adapter

`backend/src/modules/lead-machine/enrichment/hunter.client.ts` (yeni):

```typescript
import { env } from '@/core/env';

interface HunterEmail {
  value: string;
  type: 'personal' | 'generic';
  confidence: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  department: string | null;
  seniority: string | null;
  linkedin: string | null;
}

interface HunterDomainSearchResponse {
  data: {
    organization: string;
    emails: HunterEmail[];
  };
  meta: { results: number };
}

const PRIORITY_KEYWORDS = [
  // Purchasing
  'purchasing', 'einkauf', 'satinalma', 'achat',
  // Category
  'category manager', 'product manager',
  // Director
  'head of', 'director', 'leiter', 'directeur',
  // Owner/MD
  'managing director', 'geschäftsführer', 'owner', 'inhaber', 'founder', 'gerant',
];

function scoreByPriority(position: string | null): number {
  if (!position) return 0;
  const lower = position.toLowerCase();
  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    if (lower.includes(PRIORITY_KEYWORDS[i])) return PRIORITY_KEYWORDS.length - i;
  }
  return 0;
}

export async function findDecisionMaker(domain: string): Promise<HunterEmail | null> {
  if (!env.HUNTER_API_KEY) return null;
  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${env.HUNTER_API_KEY}&limit=10`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 429) throw new Error('HUNTER_RATE_LIMIT');
    throw new Error(`HUNTER_${res.status}`);
  }
  const json: HunterDomainSearchResponse = await res.json();
  const personal = json.data.emails.filter(
    (e) => e.type === 'personal' && e.confidence >= 70,
  );
  if (personal.length === 0) return null;
  return personal.sort((a, b) => scoreByPriority(b.position) - scoreByPriority(a.position))[0];
}
```

### 4.2 — Enrichment cron job

`backend/src/jobs/enrichment.job.ts` (yeni — günlük 03:00):

```typescript
async function runEnrichmentJob() {
  // Sadece "email yok veya generic" olan approved adaylara Hunter çağrısı
  const pending = await db.query(`
    SELECT id, website, email FROM lead_candidates
    WHERE status = 'approved'
      AND channel = 'trade_fair'
      AND website IS NOT NULL
      AND id NOT IN (SELECT candidate_id FROM lead_enrichment WHERE candidate_id IS NOT NULL)
      AND (email IS NULL OR email REGEXP '^(info|sales|office|contact|export|kontakt|biuro)@')
    LIMIT 10  -- günde max 10 Hunter çağrısı (50/ay = 5/gün ortalama)
  `);

  for (const cand of pending) {
    try {
      const domain = extractDomain(cand.website);
      const decisionMaker = await findDecisionMaker(domain);
      if (decisionMaker) {
        await db.insert('lead_enrichment', {
          candidate_id: cand.id,
          decision_maker: JSON.stringify({
            name: `${decisionMaker.first_name} ${decisionMaker.last_name}`,
            title: decisionMaker.position,
            email: decisionMaker.value,
            linkedin: decisionMaker.linkedin,
          }),
          source_vendor: 'hunter',
        });
      } else {
        // Karar verici bulunamadı — generic mail'i kullan veya bayrakla
        await db.insert('lead_enrichment', {
          candidate_id: cand.id,
          decision_maker: null,
          source_vendor: 'hunter_no_match',
        });
      }
    } catch (e) {
      if (e.message === 'HUNTER_RATE_LIMIT') break;  // ay limiti
      // log error, continue
    }
    await sleep(1500);  // rate limit (Hunter: 15 req/min free)
  }
}
```

### 4.3 — Mail taslak servisi

`backend/src/modules/lead-machine/outreach/draft.service.ts` (yeni):

```typescript
import { TEMPLATES, SUBJECTS } from './templates';  // sade outreach-templates.md'den
import { personalizeWithGPT } from './personalize';

async function generateDraftForCandidate(candidateId: string) {
  const cand = await getCandidate(candidateId);
  const enrichment = await getEnrichment(candidateId);

  // Email seçimi öncelik sırası:
  // 1. Enrichment'tan karar verici email (Hunter)
  // 2. lead_candidates.email (Messe API'dan gelen — sahsi mi generic mi)
  // 3. Skip (mail yok)
  const targetEmail = enrichment?.decision_maker?.email ?? cand.email;
  if (!targetEmail) return;  // skip

  const recipientName = enrichment?.decision_maker?.name ?? null;
  const firstName = recipientName?.split(' ')[0] ?? null;

  const lang = pickLanguage(cand.country);  // DE/EN/TR
  const personalization = await personalizeWithGPT(cand);

  const body = TEMPLATES[lang]
    .replace('{alici_isim_varsa_yoksa_Sirs}', firstName ?? (lang === 'DE' ? 'Damen und Herren' : 'Sirs'))
    .replace('{kisisellestirme_paragrafi}', personalization)
    .replace('{calendly_link}', env.CALENDLY_LINK)
    .replace('{gonderici_ad_soyad}', env.OUTREACH_SENDER_NAME);

  await db.insert('lead_outreach_drafts', {
    candidate_id: candidateId,
    target_email: targetEmail,
    subject: SUBJECTS[lang],
    body,
    ai_model: 'gpt-4o-mini',
    status: 'draft',  // ← DURUR, GÖNDERME YOK
  });
}
```

### 4.4 — Onay sayfası UI

`admin_panel/src/app/(main)/admin/(admin)/market/lead-machine/outreach/drafts` — Avrasya onayı sonrası açılır. Şimdilik Codex sayfayı yazar ama Avrasya'ya erişim açılmaz.

Liste view:
```
✉️ Mail taslakları (47 hazır)
─────────────────────────────────────
[ Onayla ] [ Düzenle ] [ İptal ]   AutoParts Distribution GmbH (DE) → peter.schmidt@...
[ Onayla ] [ Düzenle ] [ İptal ]   Carmotion Polska (POL) → aleksandra.zok@...
```

Onayla → `status='approved_for_send'`. Bu durumda mail kuyrukta bekler, gönderim için **Avrasya bizim'le** ayrıca "Toplu Gönder" butonuna basar (Sprint 3 dışı, fuar öncesi).

---

## 5. Sprint 3 Akış Diyagramı

```
[Sprint 1+2 ICP filtre çıktısı: ~80 onaylı aday]
                 ↓
        ┌────────┴────────┐
        ↓                 ↓
  Email var mı?       Generic mi?
        │                 │
   ┌────┴────┐       ┌────┴────┐
   ↓         ↓       ↓         ↓
  YES       NO    GENERIC   PERSONAL
   │         │       │         │
   ↓         ↓       ↓         │
 Skip    Hunter   Hunter      ↓
enrichm. Domain   Domain    Direkt kullan
   │     Search   Search        │
   │       │        │           │
   │       ↓        ↓           │
   │  decision_maker bulundu mu?│
   │       │        │           │
   │   ┌───┴───┐ ┌──┴───┐       │
   │   ↓       ↓ ↓      ↓       │
   │  YES    NO YES     NO      │
   │   │       │ │      │       │
   └───┴───────┴─┴──────┴───────┘
                  ↓
            Email seçimi:
            1. Hunter decision_maker (varsa)
            2. lead_candidates.email (fallback)
                  ↓
            GPT-4o-mini personalize (1 cümle hook)
                  ↓
            Template + placeholder doldur
                  ↓
            lead_outreach_drafts (status='draft')
                  ↓
            [BURADA DURUR]
                  ↓
            [Avrasya manuel onayı + "Toplu Gönder"]
                  ↓
            Postmark → gönderim → status='sent'
```

---

## 6. Sprint 3 Yeşil Işık Kriterleri

- [ ] Hunter API key alındı (Orhan veya Avrasya hesabı; free signup 1 dk)
- [ ] Postmark verified sender setup (Avrasya DKIM/SPF — 10 dk DNS)
- [ ] `.env` set: `HUNTER_API_KEY`, `POSTMARK_TOKEN`, `OPENAI_API_KEY`, `CALENDLY_LINK`, `OUTREACH_SENDER_NAME`, `OUTREACH_FROM`, `OUTREACH_REPLY_TO`
- [ ] Codex Hunter adapter + enrichment cron + draft.service tamamladı
- [ ] **40+ enrichment** yapıldı (ICP filtre sonrası ~80 adayın yarısı)
- [ ] **60-70 mail taslağı** `lead_outreach_drafts` tablosunda `status='draft'`
- [ ] **🧠 Claude** ilk 10 maili manuel review — kişiselleştirme cümlesi gerçek mi, halüsinasyon mu

---

## 7. Codex'in Sıralı İşi

- [ ] **4.1** Hunter adapter — `hunter.client.ts`
- [ ] **4.2** Enrichment cron — `backend/src/jobs/enrichment.job.ts` (günde 10 çağrı limit)
- [ ] **4.3** Mail taslak servisi — `outreach/draft.service.ts`
- [ ] **4.4** Onay sayfası UI — `admin_panel/.../outreach/drafts`
- [ ] **Test:** `bun test src/modules/lead-machine/__tests__/enrichment.test.ts` — Hunter mock + draft generation

---

## 8. Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 📊 Mail coverage analizi: [sprint-1-precision-raporu.md](sprint-1-precision-raporu.md) §3
- 🚫 10times drop dersi: [10times-drop-karari.md](10times-drop-karari.md)
- ✉️ Outreach template (sade): [../musteri/automechanika-2026-outreach-templates.md](../musteri/automechanika-2026-outreach-templates.md)
- 🤖 Kişiselleştirme prompt: [outreach-personalization-prompt.md](outreach-personalization-prompt.md)
- 📊 Apollo fallback SOP (manuel iş — Hunter'da bulunmayanlar için): [apollo-fallback-sop.md](apollo-fallback-sop.md)
- 🔧 Sprint 1 iş paketi: [SPRINT_1_TAM_TARAMA_IS_PAKETI.md](SPRINT_1_TAM_TARAMA_IS_PAKETI.md)
