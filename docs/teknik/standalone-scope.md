# Standalone Repo Sınır Haritası — Amazon Scoring Engine

**Hazırlayan:** Claude Code (Mimar)  
**Hedef:** Codex bu dökümanı okuyarak standalone repoyu uygular  
**Tarih:** 8 Mayıs 2026

---

## Amaç

`market_pulse/backend/` içindeki `amazon/` modülünü müşteriye bağımsız teslim edilebilir bir TypeScript paketine çıkarmak. Fastify, MarketPulse ERP şeması, lead_candidates tablosu gibi host sistemin tüm bağımlılıklarından koparılacak.

---

## Bağımlılık Analizi

### Tamamen Bağımsız Dosyalar — Olduğu Gibi Kopyalanır

Bu dosyaların hiçbir dış bağımlılığı yok; yalnızca kendi `amazon/` kardeş dosyalarını import ediyor:

| Dosya | Açıklama |
|-------|----------|
| `amazon.types.ts` | Tüm tip tanımları |
| `amazon.scoring-engine.ts` | 5 boyutlu skor orkestratörü |
| `composite.scorer.ts` | Ağırlıklı composite hesaplama |
| `confidence.calculator.ts` | Veri yeterliliği katmanı |
| `signal.validator.ts` | MIXED_SIGNAL + filtre |
| `scoring.config.ts` | Tüm eşik ve ağırlık sabitleri |
| `seller.extractor.ts` | Satıcı listeleme yardımcısı |
| `scorers/brand-reliability.scorer.ts` | Scorer — bağımsız |
| `scorers/category-risk.scorer.ts` | Scorer — bağımsız |
| `scorers/operational-risk.scorer.ts` | Scorer — bağımsız |
| `scorers/price-war.scorer.ts` | Scorer — bağımsız |
| `scorers/sku-chaos.scorer.ts` | Scorer — bağımsız |
| `SCORING_LOGIC.md` | Teknik belgeleme |
| `__tests__/` | Tüm test dosyaları + fixtures |

### Adaptasyon Gerektiren Dosyalar

Bu dosyalar external bağımlılık içeriyor; aşağıdaki kurallara göre düzenlenecek:

#### `category.normalizer.ts`
- **Sorun:** `import { pool } from '@/db/client'` — `upsertAmazonCategoryStats` için pool kullanıyor
- **Çözüm:** `pool` parametresini fonksiyon argümanına taşı veya `upsertAmazonCategoryStats`'ı ayrı bir `db.ts`'ye çıkar; `calculateCategoryStats` ve `normalizeProducts` zaten pure, dokunma

#### `amazon.scraper.ts`
- **Sorun:** `import { env } from '@/core/env'` — Oxylabs kimlik bilgileri
- **Çözüm:** `env.OXYLABS_USER` / `env.OXYLABS_PASSWORD` yerine doğrudan `process.env.OXYLABS_USER` kullan

#### `keepa.client.ts`
- **Sorun:** `@/core/env` + `@/db/client`
- **Çözüm:** `process.env.*` + standalone `db/client.ts`

#### `review.analyzer.ts`
- **Sorun:** `import { askBestAvailable } from '../_shared/ai.client'`
- **Çözüm:** `_shared/ai.client.ts` dosyasını kopyala → `src/lib/ai.client.ts` olarak standalone repoya ekle; hiçbir ERP bağımlılığı yok, tamamen fetch tabanlı

#### `amazon.job.ts`
- **Sorun:** İki farklı dış bağımlılık:
  1. `@/db/client` — `pool`
  2. `../_shared/db` — `insertCandidate`, `updateSearchJob`, `getSearchJob`
- **Çözüm:** Aşağıdaki "Job Tracking" bölümüne bak

---

## `_shared/db` Sorunu — En Kritik Kesim Noktası

`_shared/db.ts` içindeki üç fonksiyon MarketPulse ERP şemasına (lead_search_jobs, lead_candidates tabloları) bağlı:

```
getSearchJob(jobId)      → lead_search_jobs SELECT
updateSearchJob(...)     → lead_search_jobs UPDATE
insertCandidate(...)     → lead_candidates INSERT
```

Bu tablolar standalone repoda bulunmayacak. **İki seçenek:**

### Seçenek A — Minimal Job Tracking (Önerilen)

Standalone repoya `src/db/job-store.ts` ekle:

```ts
// Sadece amazon job akışını takip eden minimal tablo
// Schema: amazon_jobs (id, keyword, status, error_msg, created_at, finished_at)

export async function getJob(pool: Pool, jobId: string): Promise<{ id: string; params: unknown } | null>
export async function markRunning(pool: Pool, jobId: string): Promise<void>
export async function markDone(pool: Pool, jobId: string, resultCount: number): Promise<void>
export async function markFailed(pool: Pool, jobId: string, errorMsg: string): Promise<void>
```

`amazon.job.ts` içinde `insertCandidate` çağrısını kaldır (MarketPulse'a özgü); yerine sadece `saveRiskScore` ve job status update yap.

### Seçenek B — Callback Pattern

`runAmazonJob(jobId, { onJobLoad, onJobDone, onJobFailed, onCandidateSaved })` şeklinde callback parametreleri al; host sistemi kendi implementasyonunu inject eder. Daha esnek ama daha karmaşık.

**Karar: Seçenek A.** Müşteri standalone repo istiyor; MarketPulse ERP bağlamı yok.

---

## Silinecek / Hariç Dosyalar

| Dosya | Neden |
|-------|-------|
| `legacy.job.ts` | Sadece backward compat; `runAmazonJobLegacy` artık kullanılmıyor |
| `legacy.scorer.ts` | Seller-centric eski kod; deprecated |
| `amazon.scorer.ts` | Sadece legacy wrapper; sil |

---

## Yeni Standalone Repo Yapısı

```
amazon-scoring-engine/
├── src/
│   ├── db/
│   │   ├── client.ts          ← mysql2 pool (env'den config alır)
│   │   ├── schema.sql         ← 021_amazon_scoring_schema.sql kopyası
│   │   └── job-store.ts       ← minimal job tracking (Seçenek A)
│   ├── lib/
│   │   └── ai.client.ts       ← _shared/ai.client.ts kopyası
│   ├── scorers/
│   │   ├── brand-reliability.scorer.ts
│   │   ├── category-risk.scorer.ts
│   │   ├── operational-risk.scorer.ts
│   │   ├── price-war.scorer.ts
│   │   └── sku-chaos.scorer.ts
│   ├── amazon.job.ts          ← adapte edilmiş
│   ├── amazon.schema.ts
│   ├── amazon.scoring-engine.ts
│   ├── amazon.scraper.ts      ← adapte edilmiş
│   ├── amazon.types.ts
│   ├── category.normalizer.ts ← adapte edilmiş
│   ├── composite.scorer.ts
│   ├── confidence.calculator.ts
│   ├── keepa.client.ts        ← adapte edilmiş
│   ├── review.analyzer.ts     ← adapte edilmiş (lib/ai.client)
│   ├── scoring.config.ts
│   ├── seller.extractor.ts
│   └── signal.validator.ts
├── __tests__/                 ← mevcut testlerin kopyası
│   └── fixtures/
├── .env.example
├── package.json
├── tsconfig.json
├── README.md
└── SCORING_LOGIC.md
```

---

## `.env.example` İçeriği

```env
# Veritabanı
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=app
DB_PASSWORD=your_password
DB_NAME=amazon_scoring_db

# Scraping
OXYLABS_USER=your_user
OXYLABS_PASSWORD=your_password

# Keepa (opsiyonel — yoksa Keepa zenginleştirme devre dışı kalır)
KEEPA_API_KEY=
KEEPA_DAILY_TOKEN_BUDGET=300

# AI (opsiyonel — yoksa review analizi AI'sız çalışır)
GROQ_API_KEY=
OPENAI_API_KEY=
```

---

## `package.json` Minimum Bağımlılıkları

```json
{
  "dependencies": {
    "dotenv": "^16",
    "drizzle-orm": "^0.44",
    "mysql2": "^3"
  },
  "devDependencies": {
    "bun-types": "latest",
    "typescript": "^5"
  }
}
```

Fastify, JWT, argon2, cloudinary gibi MarketPulse'a özgü bağımlılıklar dahil edilmez.

---

## Codex'e Uygulama Talimatı

1. Yeni bir dizin oluştur: `amazon-scoring-engine/`
2. "Olduğu gibi kopyalanır" tablosundaki dosyaları kopyala
3. Her "adaptasyon" dosyasını yukarıdaki kurala göre düzenle
4. `src/db/client.ts` — `process.env` tabanlı mysql2 pool yaz
5. `src/db/job-store.ts` — minimal job tracking yaz (Seçenek A)
6. `src/lib/ai.client.ts` — `_shared/ai.client.ts`'i kopyala, `@/core/env` → `process.env` yap
7. `amazon.job.ts` — `insertCandidate` çağrısını kaldır, `_shared/db` import'larını `./db/job-store` ile değiştir
8. `.env.example`, `package.json`, `tsconfig.json` oluştur
9. `bun test` çalıştır — 163 test geçmeli (mock'lar aynı kalacak)
10. README.md'yi standart kurulum formatında yaz

**Teslim:** `amazon-scoring-engine/` dizinini private GitHub repo olarak müşteriye ilet.
