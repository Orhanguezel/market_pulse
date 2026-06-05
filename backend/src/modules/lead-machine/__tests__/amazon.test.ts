import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const env = {
  TENANT_KEY: 'avrasya',
  OXYLABS_USERNAME: 'user',
  OXYLABS_PASSWORD: 'pass',
  GROQ_API_KEY: '',
  OPENAI_API_KEY: '',
};

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env }));

mock.module('@/modules/siteSettings/service', () => ({
  getOxylabsSettings: async () => ({ username: env.OXYLABS_USERNAME, password: env.OXYLABS_PASSWORD }),
  getKeepaSettings: async () => ({ apiKey: '', tokenBudget: 5 }),
}));

mock.module('@/modules/lead-machine/_shared/ai.client', () => ({
  askBestAvailable: async (_prompt: string, _model?: string) => {
    if (!env.GROQ_API_KEY && !env.OPENAI_API_KEY) throw new Error('NO_AI_KEY_CONFIGURED');
    return '';
  },
  askGroq: async () => { throw new Error('GROQ_API_KEY_NOT_CONFIGURED'); },
  askOpenAI: async () => { throw new Error('OPENAI_API_KEY_NOT_CONFIGURED'); },
}));

const fetchMock = mock(() => Promise.resolve(new Response('{}')));
globalThis.fetch = fetchMock as unknown as typeof fetch;

const scraper = await import('../amazon/amazon.scraper');
const { extractUniqueSellers } = await import('../amazon/seller.extractor');
const { scoreAmazonSeller } = await import('../amazon/amazon.scorer');
const { scoreAmazonSellerLegacy } = await import('../amazon/legacy.scorer');
const { analyzeProductReviews } = await import('../amazon/review.analyzer');
const { runAmazonJob } = await import('../amazon/amazon.job');

beforeEach(() => {
  dbMock.reset();
  fetchMock.mockReset();
  fetchMock.mockImplementation(() => Promise.resolve(new Response('{}')));
  env.OXYLABS_USERNAME = 'user';
  env.OXYLABS_PASSWORD = 'pass';
});

describe('amazon lead machine scraper', () => {
  test('sends amazon search payload and normalizes filtered products', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({
      results: [{
        content: {
          results: {
            organic: [
              {
                title: 'Car Mat A',
                price: '$29.90',
                rating: '4.2',
                reviews_count: '120',
                url: 'https://amazon.example/p/a',
                seller: 'Seller A',
                seller_url: 'https://amazon.example/seller/a',
              },
              {
                title: 'Filtered Low Reviews',
                price: '$10',
                rating: '4.2',
                reviews_count: '5',
              },
            ],
          },
        },
      }],
    })));

    const result = await scraper.scrapeAmazonProducts('car mats', 'de', {
      review_min: 50,
      review_max: 200,
      rating_min: 4,
      rating_max: 4.5,
      price_min: 15,
      price_max: 100,
    });

    expect(fetchMock).toHaveBeenCalledWith('https://realtime.oxylabs.io/v1/queries', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        authorization: expect.stringContaining('Basic '),
        'content-type': 'application/json',
      }),
      body: JSON.stringify({
        source: 'amazon_search',
        query: 'car mats',
        domain: 'de',
        pages: 5,
        parse: true,
      }),
    }));
    expect(result).toEqual([{
      product_title: 'Car Mat A',
      price: 29.9,
      rating: 4.2,
      review_count: 120,
      product_url: 'https://amazon.example/p/a',
      seller_name: 'Seller A',
      seller_url: 'https://amazon.example/seller/a',
    }]);
  });

  test('sends amazon review payload and returns first 50 reviews', async () => {
    const reviews = Array.from({ length: 55 }, (_, index) => ({ title: `R${index}`, content: 'fit issue' }));
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({
      results: [{ content: { reviews } }],
    })));

    const result = await scraper.scrapeAmazonReviews('https://amazon.example/p/a', 'de');

    expect(fetchMock).toHaveBeenCalledWith('https://realtime.oxylabs.io/v1/queries', expect.objectContaining({
      body: JSON.stringify({
        source: 'amazon_reviews',
        url: 'https://amazon.example/p/a',
        domain: 'de',
        pages: 1,
        parse: true,
      }),
    }));
    expect(result).toHaveLength(50);
  });

  test('requires Oxylabs credentials', async () => {
    env.OXYLABS_USERNAME = '';

    await expect(scraper.scrapeAmazonProducts('car mats')).rejects.toThrow('OXYLABS_NOT_CONFIGURED');
  });
});

describe('amazon lead machine job runner', () => {
  test('runs amazon job and inserts seller candidates', async () => {
    dbMock.queuePoolExecute([{
      id: 'job-1',
      channel: 'amazon',
      status: 'pending',
      icp_id: null,
      params: '{"keyword":"car mats","marketplace":"de","review_min":50,"review_max":200,"rating_min":4,"rating_max":4.5}',
      result_count: 0,
      error_msg: null,
      created_by: null,
      created_at: '2026-05-08',
      started_at: null,
      finished_at: null,
    }]);

    let call = 0;
    fetchMock.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve(Response.json({
          results: [{
            content: {
              results: {
                organic: [{
                  title: 'Car Mat A',
                  price: '$29.90',
                  rating: '4.2',
                  reviews_count: '120',
                  url: 'https://amazon.example/p/a',
                  seller: 'Seller A',
                  seller_url: 'https://amazon.example/seller/a',
                }],
              },
            },
          }],
        }));
      }
      return Promise.resolve(Response.json({
        results: [{ content: { reviews: [{ title: 'Bad fit', content: 'cheap quality return' }] } }],
      }));
    });

    await runAmazonJob('job-1');

    expect(dbMock.poolExecutions[1]?.values).toEqual(['running', null, 'job-1', 'avrasya']);
    expect(dbMock.poolExecutions.some((entry) => entry.sql.includes('INSERT INTO amazon_risk_scores'))).toBe(true);
    expect(dbMock.poolExecutions.some((entry) => entry.sql.startsWith('INSERT INTO lead_candidates'))).toBe(true);
    const insert = dbMock.poolExecutions.find((entry) => entry.sql.startsWith('INSERT INTO lead_candidates'));
    expect(insert?.values).toEqual(expect.arrayContaining(['job-1', 'amazon']));
    expect(insert?.values).toEqual(expect.arrayContaining(['car mats — Amazon Skor Raporu']));
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['done', 1, 'job-1', 'avrasya']);
  });

  test('marks amazon job failed on scrape error', async () => {
    dbMock.queuePoolExecute([{
      id: 'job-1',
      channel: 'amazon',
      status: 'pending',
      icp_id: null,
      params: '{"keyword":"car mats"}',
      result_count: 0,
      error_msg: null,
      created_by: null,
      created_at: '2026-05-08',
      started_at: null,
      finished_at: null,
    }]);
    fetchMock.mockImplementation(() => Promise.resolve(new Response('', { status: 500 })));

    await runAmazonJob('job-1');

    expect(
      dbMock.poolExecutions.some((entry) => entry.sql.includes('INSERT INTO amazon_job_error_logs')),
    ).toBe(true);
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['failed', 'OXYLABS_AMAZON_SEARCH_FAILED_500', 'job-1', 'avrasya']);
  });
});

describe('amazon lead machine seller scoring', () => {
  test('groups products by seller identity', () => {
    const result = extractUniqueSellers([
      { product_title: 'A', seller_name: 'Seller A', seller_url: 'https://seller/a' },
      { product_title: 'B', seller_name: 'Seller A', seller_url: 'https://seller/a' },
      { product_title: 'No Seller Product' },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expect.objectContaining({
      seller_name: 'Seller A',
      products: [expect.objectContaining({ product_title: 'A' }), expect.objectContaining({ product_title: 'B' })],
    }));
    expect(result[1]).toEqual(expect.objectContaining({ seller_name: 'No Seller Product' }));
  });

  test('scores seller by reviews, rating, problem score, seller url and price', () => {
    const score = scoreAmazonSeller(
      {
        seller_name: 'Seller A',
        seller_url: 'https://seller/a',
        products: [{ product_title: 'A', review_count: 120, rating: 4.2, price: 29.9 }],
      },
      { problem_score: 6 },
    );

    expect(score).toBe(10);
  });

  test('keeps deprecated scorer compatible with legacy scorer output', () => {
    const seller = {
      seller_name: 'Seller A',
      seller_url: 'https://seller/a',
      products: [{ product_title: 'A', review_count: 120, rating: 4.2, price: 29.9 }],
    };
    const reviewAnalysis = { problem_score: 6 };

    expect(scoreAmazonSeller(seller, reviewAnalysis)).toBe(scoreAmazonSellerLegacy(seller, reviewAnalysis));
  });
});

describe('amazon review analyzer', () => {
  test('detects recurring complaint flags and falls back when AI is unavailable', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({
      results: [{
        content: {
          reviews: [
            { title: 'Bad fit', content: 'Thin material and cheap quality. I returned it.' },
            { title: 'Slippery', content: 'Loose fit and disappointed.' },
          ],
        },
      }],
    })));

    const result = await analyzeProductReviews('https://amazon.example/p/a', 'de');

    expect(result.problem_flags).toEqual(expect.arrayContaining([
      'fit',
      'thin',
      'quality',
      'slippery',
      'loose',
      'cheap',
      'return',
      'disappointed',
    ]));
    expect(result.problem_score).toBe(10);
    expect(result.ai_summary).toContain('Detected recurring complaints');
  });
});
