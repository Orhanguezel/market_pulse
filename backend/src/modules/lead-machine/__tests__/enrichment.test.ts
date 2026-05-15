import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const scrape = mock(() => Promise.resolve({ data: {} }));
const searchGoogleMaps = mock(() => Promise.resolve({ places: [] }));
const verifyScraperWebhook = mock(() => true);
const env = { APOLLO_API_KEY: '' };

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env }));

mock.module('@/modules/lead-machine/_shared/scraper.client', () => ({
  scrape,
  searchGoogleMaps,
  verifyScraperWebhook,
}));

const service = await import('../enrichment/enrichment.service');

beforeEach(() => {
  dbMock.reset();
  scrape.mockReset();
  scrape.mockImplementation(() => Promise.resolve({ data: {} }));
  env.APOLLO_API_KEY = '';
});

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'candidate-1',
    job_id: 'job-1',
    channel: 'b2b_directory',
    icp_id: null,
    status: 'pending',
    name: 'Dealer A',
    website: 'https://dealer.example/about',
    country: 'DE',
    city: null,
    phone: null,
    email: null,
    contact_name: null,
    raw_data: '{}',
    ai_summary: null,
    lead_score: '5.0',
    reject_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-05-08 10:00:00',
    ...overrides,
  };
}

describe('lead machine enrichment service', () => {
  test('throws when candidate is missing', async () => {
    dbMock.queuePoolExecute([]);

    await expect(service.enrichCandidate('missing')).rejects.toThrow('CANDIDATE_NOT_FOUND');
  });

  test('scrapes candidate website and inserts enrichment', async () => {
    dbMock.queuePoolExecute([candidate()]);
    scrape.mockImplementation(() => Promise.resolve({
      data: {
        contact_emails: ['owner@dealer.example'],
        contact_phones: ['+49 123'],
      },
    }));

    const result = await service.enrichCandidate('candidate-1');

    expect(scrape).toHaveBeenCalledWith('https://dealer.example/about', {
      profile: 'lead-page',
      return_text: true,
    });
    expect(dbMock.poolExecutions[1]?.sql).toStartWith('INSERT INTO lead_enrichment');
    expect(dbMock.poolExecutions[1]?.values).toEqual([
      expect.any(String),
      'candidate-1',
      '{"email":"owner@dealer.example","phone":"+49 123"}',
      'scraped',
    ]);
    expect(result).toEqual(expect.objectContaining({
      candidateId: 'candidate-1',
      decisionMaker: { email: 'owner@dealer.example', phone: '+49 123' },
      sourceVendor: 'scraped',
    }));
  });

  test('lists candidate enrichment and parses JSON fields', async () => {
    dbMock.queuePoolExecute([{
      id: 'enrichment-1',
      candidate_id: 'candidate-1',
      decision_maker: '{"email":"owner@dealer.example"}',
      pain_points: '["MOQ"]',
      growth_signals: '{"hiring":true}',
    }]);

    const result = await service.listCandidateEnrichment('candidate-1');

    expect(dbMock.poolExecutions[0]?.values).toEqual(['candidate-1']);
    expect(result).toEqual([expect.objectContaining({
      decision_maker: { email: 'owner@dealer.example' },
      pain_points: ['MOQ'],
      growth_signals: { hiring: true },
    })]);
  });
});
