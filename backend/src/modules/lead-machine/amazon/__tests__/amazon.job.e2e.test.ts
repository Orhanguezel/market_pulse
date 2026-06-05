import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../../market/__tests__/helpers/mock-db';
import type { AmazonProduct } from '../amazon.scraper';

const dbMock = createDbMock();

const env = {
  TENANT_KEY: 'avrasya',
  OXYLABS_USERNAME: 'user',
  OXYLABS_PASSWORD: 'pass',
  GROQ_API_KEY: '',
  OPENAI_API_KEY: '',
  KEEPA_API_KEY: '',
  KEEPA_DAILY_TOKEN_BUDGET: 1000,
};

const scrapeAmazonProductsMock = mock(async (): Promise<AmazonProduct[]> => makeProducts());
const analyzeProductReviewsMock = mock(async () => ({
  problem_flags: ['fit', 'quality', 'return'],
  problem_score: 7,
  ai_summary: 'Recurring fit and quality complaints.',
}));

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env }));

mock.module('@/modules/siteSettings/service', () => ({
  getOxylabsSettings: async () => ({ username: env.OXYLABS_USERNAME, password: env.OXYLABS_PASSWORD }),
  getKeepaSettings: async () => ({ apiKey: env.KEEPA_API_KEY ?? '', tokenBudget: env.KEEPA_DAILY_TOKEN_BUDGET ?? 1000 }),
}));

mock.module('../amazon.scraper', () => ({
  scrapeAmazonProducts: scrapeAmazonProductsMock,
}));

mock.module('../review.analyzer', () => ({
  analyzeProductReviews: analyzeProductReviewsMock,
}));

const { runAmazonJob } = await import('../amazon.job');

beforeEach(() => {
  dbMock.reset();
  scrapeAmazonProductsMock.mockClear();
  scrapeAmazonProductsMock.mockImplementation(async () => makeProducts());
  analyzeProductReviewsMock.mockClear();
});

describe('amazon job e2e integration flow', () => {
  test('runs scrape to DB full-flow and persists dimension reasons', async () => {
    dbMock.queuePoolExecute([jobRow()]);

    await runAmazonJob('job-e2e');

    expect(scrapeAmazonProductsMock).toHaveBeenCalledWith('thermal labels', 'com', expect.objectContaining({
      keyword: 'thermal labels',
      marketplace: 'com',
    }));
    expect(analyzeProductReviewsMock).toHaveBeenCalledTimes(1);

    const productInserts = dbMock.poolExecutions.filter((entry) => entry.sql.includes('INSERT INTO amazon_products'));
    expect(productInserts).toHaveLength(30);
    expect(productInserts[0]?.values).toEqual(expect.arrayContaining(['job-e2e', 'Thermal Label 1', 'B0E2E00000']));

    expect(dbMock.poolExecutions.some((entry) => entry.sql.includes('INSERT INTO amazon_category_stats'))).toBe(true);

    const riskInsert = dbMock.poolExecutions.find((entry) => entry.sql.includes('INSERT INTO amazon_risk_scores'));
    expect(riskInsert?.sql).toContain('category_risk_reason');
    expect(riskInsert?.sql).toContain('sku_chaos_reason');
    expect(riskInsert?.sql).toContain('price_war_reason');
    expect(riskInsert?.sql).toContain('brand_reliability_reason');
    expect(riskInsert?.sql).toContain('operational_risk_reason');
    expect(riskInsert?.values?.[6]).toEqual(expect.any(String));
    expect(riskInsert?.values?.[9]).toEqual(expect.any(String));
    expect(riskInsert?.values?.[12]).toEqual(expect.any(String));
    expect(riskInsert?.values?.[15]).toEqual(expect.any(String));
    expect(riskInsert?.values?.[18]).toEqual(expect.any(String));

    const candidateInsert = dbMock.poolExecutions.find((entry) => entry.sql.includes('INSERT INTO lead_candidates'));
    expect(candidateInsert?.values).toEqual(expect.arrayContaining(['job-e2e', 'amazon', 'thermal labels — Amazon Skor Raporu']));
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['done', 1, 'job-e2e', 'avrasya']);
  });

  test('records error log and marks job failed when scraper fails', async () => {
    dbMock.queuePoolExecute([jobRow()]);
    dbMock.queuePoolExecute([{ count: 0 }]);
    scrapeAmazonProductsMock.mockImplementation(async () => {
      throw new Error('OXYLABS_AMAZON_SEARCH_FAILED_500');
    });

    await runAmazonJob('job-e2e');

    expect(dbMock.poolExecutions.some((entry) => entry.sql.includes('INSERT INTO amazon_job_error_logs'))).toBe(true);
    expect(dbMock.poolExecutions.some((entry) => (
      entry.sql.includes('UPDATE amazon_scan_jobs SET status = ?')
      && entry.values?.[0] === 'failed'
      && entry.values?.[2] === 'OXYLABS_AMAZON_SEARCH_FAILED_500'
    ))).toBe(true);
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['failed', 'OXYLABS_AMAZON_SEARCH_FAILED_500', 'job-e2e', 'avrasya']);
  });
});

function jobRow() {
  return {
    id: 'job-e2e',
    channel: 'amazon',
    status: 'pending',
    icp_id: null,
    params: JSON.stringify({ keyword: 'thermal labels', marketplace: 'com' }),
    result_count: 0,
    error_msg: null,
    created_by: null,
    created_at: '2026-05-08',
    started_at: null,
    finished_at: null,
  };
}

function makeProducts(): AmazonProduct[] {
  return Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    const pageOffset = index >= 20 ? -8 : index >= 10 ? -3 : 0;
    return {
      product_title: `Thermal Label ${number}`,
      price: 34 + pageOffset + (index % 5),
      rating: 4.1 + ((index % 4) * 0.1),
      review_count: 80 + (index * 9),
      product_url: `https://www.amazon.com/dp/B0E2E${String(index).padStart(5, '0')}`,
      seller_name: `Seller ${index % 12}`,
      seller_url: `https://www.amazon.com/sp?seller=${index % 12}`,
    };
  });
}
