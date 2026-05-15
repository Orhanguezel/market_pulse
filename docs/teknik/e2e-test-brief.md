# E2E Integration Test Brief — `runAmazonJob()`

**Hazırlayan:** Claude Code (Mimar)  
**Hedef:** Codex bu brief'i okuyarak testi yazar  
**Dosya:** `backend/src/modules/lead-machine/amazon/__tests__/amazon.job.e2e.test.ts`  
**Tarih:** 8 Mayıs 2026

---

## Amaç

`runAmazonJob()` fonksiyonunun gerçek bir job akışını simüle eden tam akış testi. Scraper ve AI HTTP çağrıları mock'lanacak; DB sorgularının doğru parametrelerle çağrıldığı assert edilecek.

Bu test birim testlerden farklı: bireysel fonksiyonu değil, tüm pipeline'ı (iş başlatma → ürün çekme → puanlama → DB kayıt → job kapama) tek test akışında doğrular.

---

## Mock Stratejisi

Mevcut `keepa.client.test.ts` ve `amazon.test.ts` dosyaları referans alınabilir.  
`createDbMock()` helper'ı: `backend/src/modules/market/__tests__/helpers/mock-db.ts`

### Mocklanacak Modüller

```ts
// 1. DB pool — tüm SQL sorgularını yakalar
mock.module('@/db/client', () => ({ pool: dbMock.pool }));

// 2. Env — gerçek key olmadan çalışsın
mock.module('@/core/env', () => ({
  env: { OXYLABS_USER: 'test', OXYLABS_PASSWORD: 'test', GROQ_API_KEY: '', OPENAI_API_KEY: '' }
}));

// 3. Scraper — HTTP çağrısı yapmasın
mock.module('../amazon.scraper', () => ({
  scrapeAmazonProducts: async () => fakeProducts(15),
  scrapeAmazonReviews: async () => [],
}));

// 4. AI client — key yoksa throw etsin (operasyonel risk scorer bunu yakalar)
mock.module('../_shared/ai.client', () => ({
  askBestAvailable: async () => { throw new Error('NO_AI_KEY'); },
}));

// 5. Keepa — devre dışı bırak (isKeepaConfigured = false)
mock.module('../keepa.client', () => ({
  isKeepaConfigured: () => false,
  shouldFetchKeepa: () => false,
  enqueueKeepaAsins: async () => 0,
  processKeepaQueue: async () => ({ processed: 0, skippedByBudget: 0 }),
}));

// 6. _shared/db — job lookup ve kayıt için
mock.module('../_shared/db', () => ({
  getSearchJob: async () => ({
    id: TEST_JOB_ID,
    channel: 'amazon',
    params: { keyword: 'thermal labels', marketplace: 'com' },
  }),
  updateSearchJob: mock(async () => {}),
  insertCandidate: mock(async () => {}),
}));
```

---

## Fixture Verisi

```ts
const TEST_JOB_ID = 'test-job-00000000-0000-0000-0000-000000000001';

function fakeProducts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Test Product ${i}`,
    price: 15 + i * 2,
    rating: 4.2,
    review_count: 50 + i * 10,   // MIN_REVIEW_COUNT (10) üzerinde → filterEligibleProducts'tan geçer
    seller_name: `Seller ${i % 5}`,
    seller_url: `https://amazon.com/sp?seller=S${i}`,
    product_url: `https://amazon.com/dp/B0TEST${String(i).padStart(5, '0')}`,
    asin: `B0TEST${String(i).padStart(5, '0')}`,
  }));
}
```

---

## Test Senaryoları

### Senaryo 1 — Başarılı İş Akışı

```
runAmazonJob(TEST_JOB_ID)
  → getSearchJob çağrıldı mı?
  → updateSearchJob('running') çağrıldı mı?
  → amazon_scan_jobs INSERT çağrıldı mı?
  → amazon_category_stats UPSERT çağrıldı mı?
  → amazon_risk_scores INSERT çağrıldı mı? (22 param, reason kolonları dahil)
  → insertCandidate çağrıldı mı? (channel: 'amazon')
  → updateSearchJob('done') çağrıldı mı?
  → amazon_scan_jobs UPDATE (status='done') çağrıldı mı?
```

**Assert listesi:**

```ts
// updateSearchJob iki kez çağrıldı
expect(updateSearchJobMock).toHaveBeenCalledTimes(2);
expect(updateSearchJobMock.mock.calls[0][1]).toMatchObject({ status: 'running' });
expect(updateSearchJobMock.mock.calls[1][1]).toMatchObject({ status: 'done' });

// amazon_scan_jobs INSERT
const scanJobInsert = dbMock.poolExecutions.find(e => e.sql.includes('INSERT') && e.sql.includes('amazon_scan_jobs'));
expect(scanJobInsert).toBeDefined();
expect(scanJobInsert?.values).toContain(TEST_JOB_ID);
expect(scanJobInsert?.values).toContain('thermal labels');

// amazon_risk_scores INSERT — 22 parametre
const riskInsert = dbMock.poolExecutions.find(e => e.sql.includes('INSERT INTO amazon_risk_scores'));
expect(riskInsert).toBeDefined();
expect(riskInsert?.values).toHaveLength(22);
// reason kolonları null veya string olmalı
const reasonIdx = [5, 8, 11, 14, 17]; // values array'inde reason pozisyonları
for (const idx of reasonIdx) {
  expect([null, expect.any(String)]).toContain((riskInsert?.values as unknown[])[idx]);
}

// insertCandidate çağrıldı
expect(insertCandidateMock).toHaveBeenCalledOnce();
expect(insertCandidateMock.mock.calls[0][0]).toMatchObject({ channel: 'amazon', jobId: TEST_JOB_ID });

// amazon_scan_jobs UPDATE done
const scanJobUpdate = dbMock.poolExecutions.find(e =>
  e.sql.includes('UPDATE amazon_scan_jobs') && (e.values as string[])?.includes('done')
);
expect(scanJobUpdate).toBeDefined();
```

---

### Senaryo 2 — Scraper Hata Verir

Scraper mock'u `throw new Error('SCRAPER_TIMEOUT')` atacak şekilde override edilir.

```
runAmazonJob(TEST_JOB_ID)
  → updateSearchJob('running') çağrıldı
  → scraper throw eder
  → amazon_job_error_logs INSERT çağrıldı mı? (error_type: 'SCRAPER_TIMEOUT')
  → amazon_scan_jobs UPDATE (status='failed') çağrıldı mı?
  → updateSearchJob('failed') çağrıldı mı?
  → throw dışarı sızmadı mı? (runAmazonJob catch'e düşer)
```

**Assert listesi:**

```ts
// Hata loglandı
const errorLog = dbMock.poolExecutions.find(e => e.sql.includes('INSERT INTO amazon_job_error_logs'));
expect(errorLog).toBeDefined();
expect((errorLog?.values as string[])?.[2]).toContain('SCRAPER_TIMEOUT'); // error_type

// scan job failed
const failUpdate = dbMock.poolExecutions.find(e =>
  e.sql.includes('UPDATE amazon_scan_jobs') && (e.values as string[])?.includes('failed')
);
expect(failUpdate).toBeDefined();

// updateSearchJob failed
expect(updateSearchJobMock.mock.calls.at(-1)?.[1]).toMatchObject({ status: 'failed' });

// runAmazonJob hiç throw etmemeli (catch bloğu var)
await expect(runAmazonJob(TEST_JOB_ID)).resolves.toBeUndefined();
```

---

### Senaryo 3 — Yetersiz Ürün Verisi (INSUFFICIENT_DATA)

Scraper 5 ürün döndürür (MIN_REVIEW_COUNT filtresi sonrası 0 ürün kalır ya da confidence eşiği altı kalır).

```
runAmazonJob(TEST_JOB_ID)
  → amazon_risk_scores INSERT yapıldı
  → decision = 'INSUFFICIENT_DATA'
  → composite_score = null
  → data_points = 0 (veya küçük değer)
```

**Assert:**

```ts
const riskInsert = dbMock.poolExecutions.find(e => e.sql.includes('INSERT INTO amazon_risk_scores'));
const values = riskInsert?.values as unknown[];
// decision index = 19 (INSERT sıralamasına göre)
expect(values?.[19]).toBe('INSUFFICIENT_DATA');
// composite_score index = 18
expect(values?.[18]).toBeNull();
```

---

## Dosya Şablonu

```ts
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

// ── Mocklar (import öncesi) ──────────────────────────────────────────────────
mock.module('@/db/client', () => ({ pool: dbMock.pool }));
// ... diğer mock'lar

const updateSearchJobMock = mock(async () => {});
const insertCandidateMock = mock(async () => {});
mock.module('../_shared/db', () => ({
  getSearchJob: async () => ({ id: TEST_JOB_ID, channel: 'amazon', params: { keyword: 'thermal labels', marketplace: 'com' } }),
  updateSearchJob: updateSearchJobMock,
  insertCandidate: insertCandidateMock,
}));

// ── import (mock sonrası) ────────────────────────────────────────────────────
const { runAmazonJob } = await import('../amazon.job');

const TEST_JOB_ID = 'test-job-00000000-0000-0000-0000-000000000001';

beforeEach(() => {
  dbMock.reset();
  updateSearchJobMock.mockClear();
  insertCandidateMock.mockClear();
});

describe('runAmazonJob — E2E', () => {
  test('başarılı akışta tüm DB operasyonlarını çalıştırır', async () => { /* Senaryo 1 */ });
  test('scraper hatası durumunda hata loglar ve job failed işaretler', async () => { /* Senaryo 2 */ });
  test('yetersiz veri durumunda INSUFFICIENT_DATA kararı yazar', async () => { /* Senaryo 3 */ });
});
```

---

## Önemli Notlar

1. **Mock sırası kesin:** `mock.module(...)` çağrıları her zaman `await import(...)` ÖNCE yapılmalı (bun:test zorunluluğu)
2. **`dbMock.reset()`** `beforeEach`'te çağrılmalı — aksi halde önceki testten kalan `poolExecutions` karışır
3. **INSERT param sırası** `amazon.job.ts:28-38` satırlarına bak — reason'ların index pozisyonları buradan okunur
4. **`review.analyzer.ts`** AI key yoksa `catch` bloğuna düşüyor ve `{ problem_flags: [], problem_score: 0, ai_summary: '' }` dönüyor — bu beklenen davranış, test buna göre yazılacak
5. Test dosyası `163 → 166` test sayısına taşımalı (3 yeni test)
