import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const env = { TENTIMES_API_KEY: '' };
const scrape = mock(() => Promise.resolve({ data: {} }));
const searchGoogleMaps = mock(() => Promise.resolve({ places: [] }));
const verifyScraperWebhook = mock(() => true);
const fetchMock = mock(() => Promise.resolve(Response.json({ attendees: [] })));

globalThis.fetch = fetchMock as unknown as typeof fetch;

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

const { scrapeOfficialExhibitorList } = await import('../fair/fair.scraper');
const { getFairAttendeeIntent } = await import('../fair/tentimes.client');
const { runFairJob } = await import('../fair/fair.job');

beforeEach(() => {
  dbMock.reset();
  scrape.mockReset();
  searchGoogleMaps.mockReset();
  fetchMock.mockReset();
  scrape.mockImplementation(() => Promise.resolve({ data: {} }));
  fetchMock.mockImplementation(() => Promise.resolve(Response.json({ attendees: [] })));
  env.TENTIMES_API_KEY = '';
});

describe('fair lead machine job runner', () => {
  test('runs fair job and inserts matching exhibitors', async () => {
    dbMock.queuePoolExecute([{
      id: 'job-1',
      channel: 'trade_fair',
      status: 'pending',
      icp_id: 'icp-1',
      params: '{"fair_name":"Automechanika","fair_url":"https://fair.example","fair_date":"2026-09-01","icp_id":"icp-1"}',
      result_count: 0,
      error_msg: null,
      created_by: null,
      created_at: '2026-05-08',
      started_at: null,
      finished_at: null,
    }]);
    dbMock.queuePoolExecute([{
      id: 'icp-1',
      name: 'ICP',
      is_active: 1,
      definition: '{"sectors":["automotive"],"firm_types":["distributor"]}',
      created_at: '2026-05-08',
      updated_at: '2026-05-08',
    }]);
    scrape.mockImplementation(() => Promise.resolve({
      data: {
        exhibitors: [{
          name: 'Automotive Distributor Fair Co',
          website: 'https://fairco.example',
          booth_number: 'A12',
          description: 'Automotive accessories distributor',
        }],
      },
    }));

    await runFairJob('job-1');

    expect(dbMock.poolExecutions[1]?.values).toEqual(['running', null, 'job-1']);
    const insert = dbMock.poolExecutions.find((entry) => entry.sql.startsWith('INSERT INTO lead_candidates'));
    expect(insert?.values).toEqual(expect.arrayContaining(['job-1', 'trade_fair', 'icp-1', 'Automotive Distributor Fair Co']));
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['done', 1, 'job-1']);
  });

  test('marks fair job failed on scraper error', async () => {
    dbMock.queuePoolExecute([{
      id: 'job-1',
      channel: 'trade_fair',
      status: 'pending',
      icp_id: null,
      params: '{"fair_url":"https://fair.example"}',
      result_count: 0,
      error_msg: null,
      created_by: null,
      created_at: '2026-05-08',
      started_at: null,
      finished_at: null,
    }]);
    scrape.mockImplementation(() => Promise.reject(new Error('FAIR_DOWN')));

    await runFairJob('job-1');

    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['failed', 'FAIR_DOWN', 'job-1']);
  });
});

describe('fair lead machine scraper', () => {
  test('scrapes official exhibitor list and normalizes exhibitors', async () => {
    scrape.mockImplementation(() => Promise.resolve({
      data: {
        exhibitors: [
          {
            name: 'Exhibitor A',
            website: 'https://exhibitor.example',
            booth_number: 'A12',
            description: 'Automotive accessories distributor',
          },
        ],
      },
    }));

    const result = await scrapeOfficialExhibitorList('https://fair.example/exhibitors');

    expect(scrape).toHaveBeenCalledWith('https://fair.example/exhibitors', {
      profile: 'fair-exhibitor',
      return_html: true,
      return_text: true,
      mode: 'stealthy',
    });
    expect(result).toEqual([{
      name: 'Exhibitor A',
      website: 'https://exhibitor.example',
      country: undefined,
      booth_number: 'A12',
      description: 'Automotive accessories distributor',
    }]);
  });
});

describe('fair lead machine 10times client', () => {
  test('returns empty attendee intent when API key is not configured', async () => {
    const result = await getFairAttendeeIntent('event-1');

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('fetches attendee intent with bearer token', async () => {
    env.TENTIMES_API_KEY = 'token-1';
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({
      attendees: [{ company: 'Dealer A', interested_count: 12, attending_count: 3 }],
    })));

    const result = await getFairAttendeeIntent('event 1');

    expect(fetchMock).toHaveBeenCalledWith('https://api.10times.com/v1/events/event%201/attendees', {
      headers: { authorization: 'Bearer token-1' },
    });
    expect(result).toEqual([{ company: 'Dealer A', interested_count: 12, attending_count: 3 }]);
  });

  test('throws on failed 10times response', async () => {
    env.TENTIMES_API_KEY = 'token-1';
    fetchMock.mockImplementation(() => Promise.resolve(new Response('', { status: 502 })));

    await expect(getFairAttendeeIntent('event-1')).rejects.toThrow('TENTIMES_FAILED_502');
  });
});
