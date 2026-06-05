import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';
import { callHandler } from '../../market/__tests__/helpers/reply';

const dbMock = createDbMock();
const scrape = mock(() => Promise.resolve({ data: {} }));
const searchGoogleMaps = mock(() => Promise.resolve({ places: [] }));
const verifyScraperWebhook = mock(() => true);

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'avrasya' } }));

mock.module('@/modules/lead-machine/_shared/scraper.client', () => ({
  scrape,
  searchGoogleMaps,
  verifyScraperWebhook,
}));

const controller = await import('../controller');

const now = '2026-05-08 10:00:00';

beforeEach(() => {
  dbMock.reset();
  verifyScraperWebhook.mockReset();
  verifyScraperWebhook.mockImplementation(() => true);
});

function job(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    channel: 'amazon',
    status: 'pending',
    icp_id: null,
    params: '{"keyword":"oto aksesuar"}',
    result_count: 0,
    error_msg: null,
    created_by: null,
    created_at: now,
    started_at: null,
    finished_at: null,
    ...overrides,
  };
}

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'candidate-1',
    job_id: 'job-1',
    channel: 'amazon',
    icp_id: null,
    status: 'pending',
    name: 'Seller A',
    website: 'https://seller.example',
    country: 'DE',
    city: 'Berlin',
    phone: '+49',
    email: 'sales@example.com',
    contact_name: 'Ada',
    raw_data: '{"seller_url":"https://amazon.example/seller"}',
    ai_summary: 'Good fit',
    lead_score: '8.0',
    reject_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
    ...overrides,
  };
}

describe('lead machine controller candidates', () => {
  test('lists lead candidates with total count header', async () => {
    dbMock.queuePoolExecute([candidate()]);
    dbMock.queuePoolExecute([{ count: 1 }]);

    const { result, state } = await callHandler(controller.listLeadCandidates, {
      query: { channel: 'amazon', status: 'pending', job_id: 'job-1', limit: '500', page: '2' },
    });

    expect(dbMock.poolExecutions[0]?.sql).toContain('LIMIT 100 OFFSET 100');
    expect(state.headers['x-total-count']).toBe('1');
    expect(result).toEqual([expect.objectContaining({
      id: 'candidate-1',
      raw_data: { seller_url: 'https://amazon.example/seller' },
    })]);
  });

  test('rejects invalid candidate review action', async () => {
    const { state } = await callHandler(controller.reviewCandidate, {
      params: { id: 'candidate-1' },
      body: { action: 'unknown' },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual({ error: { message: 'invalid_action' } });
  });

  test('reviews a candidate', async () => {
    dbMock.queuePoolExecute([candidate({ status: 'rejected', reject_reason: 'wrong_segment' })]);

    const { result } = await callHandler(controller.reviewCandidate, {
      params: { id: 'candidate-1' },
      body: { action: 'reject', reject_reason: 'wrong_segment' },
    });

    expect(dbMock.poolExecutions[0]?.values).toEqual(['rejected', 'wrong_segment', null, null, 'avrasya', 'candidate-1']);
    expect(result).toEqual(expect.objectContaining({
      status: 'rejected',
      reject_reason: 'wrong_segment',
    }));
  });

  test('approves a candidate to market lead', async () => {
    dbMock.queuePoolExecute([candidate()]);
    dbMock.queuePoolExecute([candidate({ status: 'approved' })]);

    const { state } = await callHandler(controller.approveToLead, {
      params: { id: 'candidate-1' },
    });

    expect(state.statusCode).toBe(201);
    expect(dbMock.poolExecutions[1]?.sql).toStartWith('INSERT INTO market_leads');
    expect(state.payload).toEqual(expect.objectContaining({
      name: 'Seller A',
      source: 'amazon',
      priority: 'high',
      score: 8,
    }));
  });
});

describe('lead machine controller scraper callback and jobs', () => {
  test('rejects invalid scraper callback signature', async () => {
    verifyScraperWebhook.mockImplementation(() => false);

    const { state } = await callHandler(controller.scraperCallback, {
      headers: { 'x-scraper-signature': 'bad' },
      body: {},
    });

    expect(state.statusCode).toBe(401);
    expect(state.payload).toEqual({ error: { message: 'invalid_signature' } });
  });

  test('imports candidates from scraper callback', async () => {
    dbMock.queuePoolExecute([job()]);

    const { result } = await callHandler(controller.scraperCallback, {
      headers: { 'x-scraper-signature': 'ok' },
      body: {
        job_id: 'job-1',
        status: 'completed',
        result: {
          candidates: [
            { name: 'Imported A', website: 'https://a.example', lead_score: 7, raw_data: { source: 'scraper' } },
            { website: 'https://invalid.example' },
          ],
        },
      },
    });

    expect(result).toEqual({ ok: true, inserted: 1 });
    expect(dbMock.poolExecutions.some((entry) => entry.sql.startsWith('INSERT INTO lead_candidates'))).toBe(true);
    expect(dbMock.poolExecutions.at(-1)?.sql).toContain('UPDATE lead_search_jobs SET status = ?, result_count = ?, error_msg = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_key = ?');
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['done', 1, null, 'job-1', 'avrasya']);
  });

  test('uses scraper callback tenant key for job lookup and writes', async () => {
    dbMock.queuePoolExecute([job()]);

    const { result } = await callHandler(controller.scraperCallback, {
      headers: { 'x-scraper-signature': 'ok' },
      body: {
        job_id: 'job-1',
        tenant_key: 'vistaseeds',
        status: 'done',
        result: {
          candidates: [
            { name: 'Vista Buyer', website: 'https://vista.example', lead_score: 6 },
          ],
        },
      },
    });

    expect(result).toEqual({ ok: true, inserted: 1 });
    expect(dbMock.poolExecutions[0]?.values).toEqual(['vistaseeds', 'job-1']);
    const insert = dbMock.poolExecutions.find((entry) => entry.sql.startsWith('INSERT INTO lead_candidates'));
    expect(insert?.values).toEqual(expect.arrayContaining(['vistaseeds', 'job-1', 'amazon', 'Vista Buyer']));
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['done', 1, null, 'job-1', 'vistaseeds']);
  });

  test('rejects scraper callback without job id', async () => {
    const { state } = await callHandler(controller.scraperCallback, {
      headers: { 'x-scraper-signature': 'ok' },
      body: { result: {} },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual({ error: { message: 'missing_job_id' } });
  });

  test('returns 404 when scraper callback job is missing', async () => {
    dbMock.queuePoolExecute([]);

    const { state } = await callHandler(controller.scraperCallback, {
      headers: { 'x-scraper-signature': 'ok' },
      body: { job_id: 'missing', result: {} },
    });

    expect(state.statusCode).toBe(404);
    expect(state.payload).toEqual({ error: { message: 'job_not_found' } });
  });

  test('marks scraper callback job failed', async () => {
    dbMock.queuePoolExecute([job()]);

    const { result } = await callHandler(controller.scraperCallback, {
      headers: { 'x-scraper-signature': 'ok' },
      body: { job_id: 'job-1', status: 'failed', error: 'SCRAPER_DOWN', result: { candidates: [] } },
    });

    expect(result).toEqual({ ok: true, inserted: 0 });
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['failed', 'SCRAPER_DOWN', 'job-1', 'avrasya']);
  });

  test('starts amazon job and returns created job', async () => {
    dbMock.queuePoolExecute([job()]);

    const { state } = await callHandler(controller.startAmazonJob, {
      body: { keyword: 'oto aksesuar', marketplace: 'de' },
    });

    expect(state.statusCode).toBe(201);
    expect(dbMock.poolExecutions[0]?.sql).toStartWith('INSERT INTO lead_search_jobs');
    expect(state.payload).toEqual(expect.objectContaining({
      id: 'job-1',
      channel: 'amazon',
      params: { keyword: 'oto aksesuar' },
    }));
  });

  test('starts b2b and fair jobs', async () => {
    dbMock.queuePoolExecute([job({ channel: 'b2b_directory', params: '{"source":"google_maps"}' })]);

    let response = await callHandler(controller.startB2bJob, {
      body: { source: 'google_maps' },
    });

    expect(response.state.statusCode).toBe(201);
    expect(response.state.payload).toEqual(expect.objectContaining({ channel: 'b2b_directory' }));

    dbMock.reset();
    dbMock.queuePoolExecute([job({ channel: 'trade_fair', params: '{"fair_name":"Automechanika"}' })]);

    response = await callHandler(controller.startFairJob, {
      body: { fair_name: 'Automechanika' },
    });

    expect(response.state.statusCode).toBe(201);
    expect(response.state.payload).toEqual(expect.objectContaining({ channel: 'trade_fair' }));
  });

  test('returns 404 when amazon job channel does not match', async () => {
    dbMock.queuePoolExecute([job({ channel: 'b2b_directory' })]);

    const { state } = await callHandler(controller.getAmazonJob, {
      params: { id: 'job-1' },
    });

    expect(state.statusCode).toBe(404);
  });

  test('returns latest amazon risk score by keyword', async () => {
    dbMock.queuePoolExecute([{
      id: 'risk-1',
      job_id: 'job-1',
      keyword: 'oto aksesuar',
      marketplace: 'de',
      data_points: 47,
      category_risk_score: '7.2',
      category_risk_confidence: 'HIGH',
      composite_score: '6.6',
      decision: 'DIKKATLI_OL',
      scanned_at: now,
    }]);
    dbMock.queuePoolExecute([
      { price_30d_min: '20.00', price_30d_max: '40.00', price_90d_avg: '30.00' },
      { price_30d_min: '22.00', price_30d_max: '42.00', price_90d_avg: '32.00' },
    ]);

    const { result } = await callHandler(controller.getAmazonRiskScores, {
      params: { keyword: encodeURIComponent('oto aksesuar') },
      query: { marketplace: 'de' },
    });

    expect(dbMock.poolExecutions.some((entry) => entry.sql.includes('FROM amazon_risk_scores'))).toBe(true);
    expect(result).toEqual(expect.objectContaining({
      keyword: 'oto aksesuar',
      data_points: 47,
      composite_score: 6.6,
      decision: 'DIKKATLI_OL',
    }));
    expect((result as { keepa_trend?: Array<{ label: string; price: number }> }).keepa_trend)
      .toEqual([
        { label: '30d min', price: 21 },
        { label: '90d avg', price: 31 },
        { label: '30d max', price: 41 },
      ]);
    expect((result as { scores: { category_risk: { score: number; confidence: string } } }).scores.category_risk)
      .toEqual(expect.objectContaining({ score: 7.2, confidence: 'HIGH' }));
  });

  test('returns 404 when no amazon risk score exists', async () => {
    dbMock.queuePoolExecute([]);

    const { state } = await callHandler(controller.getAmazonRiskScores, {
      params: { keyword: encodeURIComponent('missing') },
      query: { marketplace: 'de' },
    });

    expect(state.statusCode).toBe(404);
    expect(state.payload).toEqual({ error: { message: 'no_score_found' } });
  });
});

describe('lead machine controller enrichment and competitor endpoints', () => {
  test('batch enrichment ignores invalid candidate id body', async () => {
    const { result } = await callHandler(controller.enrichBatch, {
      body: { candidate_ids: 'not-array' },
    });

    expect(result).toEqual({ queued: 0 });
  });

  test('batch enrichment caps candidate ids at 50', async () => {
    const ids = Array.from({ length: 55 }, (_, index) => `candidate-${index}`);
    for (let index = 0; index < 50; index += 1) {
      dbMock.queuePoolExecute([candidate({ id: ids[index], website: null })]);
    }

    const { result } = await callHandler(controller.enrichBatch, {
      body: { candidate_ids: ids },
    });

    expect(result).toEqual({ queued: 50 });
  });

  test('competitor scan requires url', async () => {
    const { state } = await callHandler(controller.competitorScan, {
      body: {},
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual({ error: { message: 'url_required' } });
  });

  test('competitor scan returns scraper result', async () => {
    scrape.mockImplementation(() => Promise.resolve({ data: { title: 'Competitor' } }));

    const { result } = await callHandler(controller.competitorScan, {
      body: { url: 'https://competitor.example' },
    });

    expect(scrape).toHaveBeenCalledWith('https://competitor.example', expect.any(Object));
    expect(result).toEqual({ title: 'Competitor' });
  });
});

describe('lead machine controller icp endpoints', () => {
  test('requires name when creating ICP', async () => {
    const { state } = await callHandler(controller.createIcp, {
      body: { definition: {} },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual({ error: { message: 'name_required' } });
  });

  test('creates ICP profile', async () => {
    dbMock.queuePoolExecute([{
      id: 'icp-1',
      name: 'ICP A',
      is_active: 1,
      definition: '{}',
      created_at: now,
      updated_at: now,
    }]);

    const { state } = await callHandler(controller.createIcp, {
      body: { name: 'ICP A', definition: {}, is_active: true },
    });

    expect(state.statusCode).toBe(201);
    expect(state.payload).toEqual(expect.objectContaining({ id: 'icp-1', name: 'ICP A', definition: {} }));
  });
});
