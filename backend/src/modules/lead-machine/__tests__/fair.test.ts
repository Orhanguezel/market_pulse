import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const env = { TENTIMES_API_KEY: '', PUBLIC_URL: 'http://localhost:8086' };
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

const { isNeighborBooth, parseBooth } = await import('../fair/booth');
const { scrapeExhibitorDetail, scrapeOfficialExhibitorList } = await import('../fair/fair.scraper');
const { generateFairBriefingPdf } = await import('../fair/briefing.service');
const { buildGenericFairRunnerParams } = await import('../fair/fair.runner');
const { getFairAttendeeIntent } = await import('../fair/tentimes.client');
const { runFairJob } = await import('../fair/fair.job');
const { aggregateRejectionPatterns } = await import('../scan-rules.service');

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
  test('builds generic fair runner params from fair url and icp id', () => {
    const params = buildGenericFairRunnerParams({
      fair_url: 'https://example-fair.com/exhibitors',
      icp_id: 'icp-1',
      halls: ['3.1', '4.0'],
      detail_concurrency: 12,
      max_exhibitors: 20000,
    });

    expect(params).toEqual({
      fair_url: 'https://example-fair.com/exhibitors',
      icp_id: 'icp-1',
      fair_name: 'example fair',
      fair_date: undefined,
      hall_filters: ['3.1', '4.0'],
      max_pages: 120,
      max_exhibitors: 10000,
      detail_concurrency: 5,
    });
  });

  test('requires fair url and icp id for generic runner', () => {
    expect(() => buildGenericFairRunnerParams({ icp_id: 'icp-1' })).toThrow('FAIR_URL_REQUIRED');
    expect(() => buildGenericFairRunnerParams({ fair_url: 'https://fair.example' })).toThrow('ICP_ID_REQUIRED');
  });

  test('generates printable stand briefing PDF for candidate', async () => {
    dbMock.queuePoolExecute([{
      id: 'candidate-1',
      job_id: 'job-1',
      channel: 'trade_fair',
      icp_id: 'icp-1',
      status: 'approved',
      name: 'Automechanika Buyer GmbH',
      website: 'https://buyer.example',
      country: 'DE',
      city: 'Frankfurt',
      phone: null,
      email: null,
      contact_name: null,
      raw_data: JSON.stringify({
        exhibitor: { product_groups: ['Car mats', 'Interior accessories'] },
        fair_info: { booth_number: '3.1 D12', is_neighbor: true },
        analysis: { has_b2b_signals: true, has_china_signals: false, has_private_label: true },
        match: { reasons: ['sector:automotive accessories'] },
      }),
      ai_summary: 'German aftermarket distributor.',
      lead_score: '8.5',
      decision: 'candidate',
      reject_reason: null,
      reject_tags: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-05-08',
    }]);
    dbMock.queuePoolExecute([{ decision_maker: '{"name":"Anna Buyer","title":"Purchasing"}' }]);

    const pdf = await generateFairBriefingPdf(['candidate-1']);

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(String(pdf)).toContain('Automechanika Buyer GmbH');
    expect(String(pdf)).toContain('Bizim stand: Hall 3.1 D11');
  });

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
            source_url: 'https://fair.example/detail/exhibitor-a',
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
      detail_url: 'https://fair.example/detail/exhibitor-a',
      country: undefined,
      booth_number: 'A12',
      description: 'Automotive accessories distributor',
    }]);
  });

  test('uses Messe Frankfurt API for Automechanika hall-filtered lists', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({
      success: true,
      result: {
        metaData: { hitsTotal: 1, hitsPerPage: 100, currentPage: 1 },
        hits: [{
          exhibitor: {
            id: 'mf-1',
            rewriteId: 'avrasya-paspas-otomotiv-sanayi-ve-ticaret-limited-sirketi',
            name: 'Avrasya Paspas Otomotiv Sanayi Ve Ticaret Limited Sirketi',
            homepage: 'www.promats.com.tr',
            address: {
              city: 'Istanbul',
              tel: '+90 539 860 75 80',
              email: 'info@avrasyaotomotiv.net',
              country: { iso3: 'TUR', label: 'Türkiye' },
            },
            exhibition: {
              id: 'AUTOMECHANIKA',
              exhibitionHall: [{ id: '3.1', name: '3.1', stand: [{ name: 'D11' }] }],
            },
          },
        }],
      },
    })));

    const result = await scrapeOfficialExhibitorList(
      'https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.html',
      { halls: ['3.1'] },
    );

    expect(fetchMock).toHaveBeenCalled();
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.get('location')).toBe('3.1');
    expect(scrape).not.toHaveBeenCalled();
    expect(result).toEqual([{
      name: 'Avrasya Paspas Otomotiv Sanayi Ve Ticaret Limited Sirketi',
      website: 'https://www.promats.com.tr',
      country: 'TUR',
      city: 'Istanbul',
      address: 'Istanbul, Türkiye',
      phone: '+90 539 860 75 80',
      email: 'info@avrasyaotomotiv.net',
      hall: '3.1',
      detail_url: 'https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html/avrasya-paspas-otomotiv-sanayi-ve-ticaret-limited-sirketi.html',
      booth_number: '3.1 D11',
      description: undefined,
    }]);
  });

  test('scrapes exhibitor detail with fair-exhibitor-detail profile', async () => {
    scrape.mockImplementation(() => Promise.resolve({
      data: {
        final_url: 'https://fair.example/detail/exhibitor-a',
        name: 'Exhibitor A GmbH',
        hall: '3.1',
        booth: '3.1 D11',
        country: 'DE',
        city: 'Frankfurt',
        address: 'Messeplatz 1',
        website: 'https://exhibitor.example',
        phone: '+49 69 123',
        email: 'sales@exhibitor.example',
        product_groups: ['floor mats'],
        brands: ['Brand A'],
        target_markets: ['DACH'],
        trade_audience: ['distributors'],
        description: 'Automotive accessories distributor',
      },
    }));

    const result = await scrapeExhibitorDetail('https://fair.example/detail/exhibitor-a');

    expect(scrape).toHaveBeenCalledWith('https://fair.example/detail/exhibitor-a', {
      profile: 'fair-exhibitor-detail',
      return_html: true,
      return_text: true,
      mode: 'stealthy',
    });
    expect(result).toEqual({
      name: 'Exhibitor A GmbH',
      website: 'https://exhibitor.example',
      country: 'DE',
      city: 'Frankfurt',
      address: 'Messeplatz 1',
      phone: '+49 69 123',
      email: 'sales@exhibitor.example',
      hall: '3.1',
      booth_number: '3.1 D11',
      detail_url: 'https://fair.example/detail/exhibitor-a',
      description: 'Automotive accessories distributor',
      product_groups: ['floor mats'],
      brands: ['Brand A'],
      target_markets: ['DACH'],
      trade_audience: ['distributors'],
    });
  });
});

describe('fair booth parser', () => {
  test('parses hall, row, and column from booth labels', () => {
    expect(parseBooth('3.1 D11')).toEqual({ hall: '3.1', row: 'D', col: 11, raw: '3.1 D11' });
    expect(parseBooth('Hall 4.0 A 07')).toEqual({ hall: '4.0', row: 'A', col: 7, raw: 'Hall 4.0 A 07' });
  });

  test('returns null grid fields for empty or unknown booth labels', () => {
    expect(parseBooth('')).toEqual({ hall: null, row: null, col: null, raw: '' });
    expect(parseBooth('Outdoor area')).toEqual({ hall: null, row: null, col: null, raw: 'Outdoor area' });
  });

  test('flags same-row booths within five columns of Avrasya D11', () => {
    expect(isNeighborBooth(parseBooth('3.1 D6'))).toBe(true);
    expect(isNeighborBooth(parseBooth('3.1 D16'))).toBe(true);
    expect(isNeighborBooth(parseBooth('3.1 D11'))).toBe(false);
    expect(isNeighborBooth(parseBooth('3.1 C11'))).toBe(false);
    expect(isNeighborBooth(parseBooth('4.0 D12'))).toBe(false);
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

describe('lead machine rejection pattern aggregation', () => {
  test('aggregates reject tags into lead_rejection_patterns', async () => {
    dbMock.queuePoolExecute([{ count: 3 }]);

    const result = await aggregateRejectionPatterns();

    expect(dbMock.poolExecutions[0]?.sql).toContain('INSERT INTO lead_rejection_patterns');
    expect(dbMock.poolExecutions[0]?.sql).toContain('JSON_TABLE');
    expect(dbMock.poolExecutions[1]?.sql).toContain('SELECT COUNT(*) AS count FROM lead_rejection_patterns');
    expect(result).toEqual({ patterns: 3 });
  });
});
