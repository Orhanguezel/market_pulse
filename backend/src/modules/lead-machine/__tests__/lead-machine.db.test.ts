import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

const leadDb = await import('../_shared/db');

const now = '2026-05-08 10:00:00';

beforeEach(() => {
  dbMock.reset();
});

function job(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    channel: 'amazon',
    status: 'pending',
    icp_id: null,
    params: '{"keyword":"paspas"}',
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
    phone: null,
    email: null,
    contact_name: null,
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

describe('lead machine db jobs', () => {
  test('creates and fetches a search job with parsed params', async () => {
    dbMock.queuePoolExecute([job()]);

    const result = await leadDb.createSearchJob('amazon', { keyword: 'paspas' }, null, 'user-1');

    expect(dbMock.poolExecutions[0]?.sql).toStartWith('INSERT INTO lead_search_jobs');
    expect(dbMock.poolExecutions[0]?.values).toEqual([
      expect.any(String),
      'amazon',
      'pending',
      null,
      '{"keyword":"paspas"}',
      'user-1',
    ]);
    expect(result).toEqual(expect.objectContaining({
      id: 'job-1',
      params: { keyword: 'paspas' },
    }));
  });

  test('gets a search job by id', async () => {
    dbMock.queuePoolExecute([job({ id: 'job-2', params: '{"source":"europages"}' })]);

    const result = await leadDb.getSearchJob('job-2');

    expect(dbMock.poolExecutions[0]?.values).toEqual(['job-2']);
    expect(result).toEqual(expect.objectContaining({
      id: 'job-2',
      params: { source: 'europages' },
    }));
  });

  test('lists search jobs by channel', async () => {
    dbMock.queuePoolExecute([
      job({ id: 'job-1', channel: 'amazon' }),
      job({ id: 'job-2', channel: 'amazon', params: '{"keyword":"oto"}' }),
    ]);

    const result = await leadDb.listSearchJobs('amazon');

    expect(dbMock.poolExecutions[0]?.values).toEqual(['amazon']);
    expect(result).toHaveLength(2);
    expect(result[1]?.params).toEqual({ keyword: 'oto' });
  });

  test('updates search job status and timestamps', async () => {
    await leadDb.updateSearchJob('job-1', {
      status: 'done',
      resultCount: 5,
      errorMsg: null,
      started: true,
      finished: true,
    });

    expect(dbMock.poolExecutions[0]?.sql).toContain('UPDATE lead_search_jobs SET status = ?, result_count = ?, error_msg = ?, started_at = CURRENT_TIMESTAMP, finished_at = CURRENT_TIMESTAMP WHERE id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['done', 5, null, 'job-1']);
  });
});

describe('lead machine db candidates', () => {
  test('inserts a candidate', async () => {
    const id = await leadDb.insertCandidate({
      jobId: 'job-1',
      channel: 'amazon',
      icpId: 'icp-1',
      name: 'Seller A',
      website: 'https://seller.example',
      country: 'DE',
      city: 'Berlin',
      phone: '+49',
      email: 'sales@example.com',
      contactName: 'Ada',
      rawData: { seller_url: 'https://amazon.example/seller' },
      aiSummary: 'Good fit',
      leadScore: 8,
    });

    expect(id).toEqual(expect.any(String));
    expect(dbMock.poolExecutions[0]?.sql).toStartWith('INSERT INTO lead_candidates');
    expect(dbMock.poolExecutions[0]?.values).toEqual([
      expect.any(String),
      'job-1',
      'amazon',
      'icp-1',
      'Seller A',
      'https://seller.example',
      'DE',
      'Berlin',
      '+49',
      'sales@example.com',
      'Ada',
      '{"seller_url":"https://amazon.example/seller"}',
      'Good fit',
      8,
      null,
    ]);
  });

  test('gets a candidate with parsed raw data', async () => {
    dbMock.queuePoolExecute([candidate()]);

    const result = await leadDb.getCandidate('candidate-1');

    expect(result).toEqual(expect.objectContaining({
      id: 'candidate-1',
      raw_data: { seller_url: 'https://amazon.example/seller' },
    }));
  });

  test('lists candidates with filters and count', async () => {
    dbMock.queuePoolExecute([candidate()]);
    dbMock.queuePoolExecute([{ count: 1 }]);

    const result = await leadDb.listCandidates({
      channel: 'amazon',
      status: 'pending',
      jobId: 'job-1',
      limit: 25,
      offset: 0,
    });

    expect(dbMock.poolExecutions[0]?.sql).toContain('WHERE channel = ? AND status = ? AND job_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['amazon', 'pending', 'job-1']);
    expect(result.count).toBe(1);
    expect(result.rows[0]?.raw_data).toEqual({ seller_url: 'https://amazon.example/seller' });
  });

  test('updates candidate review status', async () => {
    dbMock.queuePoolExecute([candidate({
      status: 'rejected',
      reject_reason: 'wrong_segment',
      reviewed_by: 'user-1',
    })]);

    const result = await leadDb.updateCandidateReview('candidate-1', 'rejected', 'wrong_segment', 'user-1');

    expect(dbMock.poolExecutions[0]?.sql).toStartWith('UPDATE lead_candidates SET status = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['rejected', 'wrong_segment', 'user-1', 'candidate-1']);
    expect(result).toEqual(expect.objectContaining({
      status: 'rejected',
      reject_reason: 'wrong_segment',
    }));
  });
});
