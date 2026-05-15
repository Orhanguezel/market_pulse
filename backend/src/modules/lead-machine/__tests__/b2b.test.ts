import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const scrape = mock(() => Promise.resolve({ data: {}, text: null }));
const searchGoogleMaps = mock(() => Promise.resolve({ places: [] }));
const verifyScraperWebhook = mock(() => true);
const askBestAvailable = mock(() => Promise.reject(new Error('AI unavailable')));

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/modules/lead-machine/_shared/scraper.client', () => ({
  scrape,
  searchGoogleMaps,
  verifyScraperWebhook,
}));

mock.module('@/modules/lead-machine/_shared/ai.client', () => ({
  askBestAvailable,
}));

const { searchDirectory } = await import('../b2b/directory.scraper');
const { analyzeCompanyWebsite } = await import('../b2b/website.analyzer');
const { runB2bJob } = await import('../b2b/b2b.job');

beforeEach(() => {
  dbMock.reset();
  scrape.mockReset();
  searchGoogleMaps.mockReset();
  askBestAvailable.mockReset();
  scrape.mockImplementation(() => Promise.resolve({ data: {}, text: null }));
  searchGoogleMaps.mockImplementation(() => Promise.resolve({ places: [] }));
  askBestAvailable.mockImplementation(() => Promise.reject(new Error('AI unavailable')));
});

describe('b2b lead machine job runner', () => {
  test('runs b2b job and inserts matching candidate', async () => {
    dbMock.queuePoolExecute([{
      id: 'job-1',
      channel: 'b2b_directory',
      status: 'pending',
      icp_id: 'icp-1',
      params: '{"icp_id":"icp-1","source":"google_maps","search_query":"automotive distributor","country":"DE","limit":5}',
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
    searchGoogleMaps.mockImplementation(() => Promise.resolve({
      places: [{ name: 'Automotive Distributor A', website: 'https://dealer.example', phone: '+49' }],
    }));
    scrape.mockImplementation(() => Promise.resolve({
      text: 'Automotive distributor B2B importer',
      data: {
        title: 'Dealer A',
        description: 'Automotive distributor',
        product_keywords: ['car mats'],
        has_b2b_signals: true,
        has_china_signals: false,
        has_private_label: false,
        firm_type_hints: ['distributor'],
      },
    }));

    await runB2bJob('job-1');

    expect(dbMock.poolExecutions[1]?.values).toEqual(['running', null, 'job-1']);
    const insert = dbMock.poolExecutions.find((entry) => entry.sql.startsWith('INSERT INTO lead_candidates'));
    expect(insert?.values).toEqual(expect.arrayContaining(['job-1', 'b2b_directory', 'icp-1', 'Automotive Distributor A']));
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['done', 1, 'job-1']);
  });

  test('marks b2b job failed on directory error', async () => {
    dbMock.queuePoolExecute([{
      id: 'job-1',
      channel: 'b2b_directory',
      status: 'pending',
      icp_id: null,
      params: '{"source":"google_maps"}',
      result_count: 0,
      error_msg: null,
      created_by: null,
      created_at: '2026-05-08',
      started_at: null,
      finished_at: null,
    }]);
    searchGoogleMaps.mockImplementation(() => Promise.reject(new Error('MAPS_DOWN')));

    await runB2bJob('job-1');

    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['failed', 'MAPS_DOWN', 'job-1']);
  });
});

describe('b2b lead machine directory scraper', () => {
  test('searches google maps with capped total and country region', async () => {
    searchGoogleMaps.mockImplementation(() => Promise.resolve({
      places: [{ name: 'Dealer A', website: 'https://dealer.example', phone: '+49' }],
    }));

    const result = await searchDirectory('google_maps', null, {
      search_query: 'car mat distributor',
      country: 'DE',
      limit: 25,
    });

    expect(searchGoogleMaps).toHaveBeenCalledWith('car mat distributor', {
      total: 10,
      language: 'en',
      region: 'DE',
    });
    expect(result).toEqual([{ name: 'Dealer A', website: 'https://dealer.example', phone: '+49' }]);
  });

  test('uses ICP sector as default query', async () => {
    await searchDirectory(
      'google_maps',
      {
        id: 'icp-1',
        name: 'ICP',
        is_active: 1,
        definition: { sectors: ['automotive accessories'] },
        created_at: '',
        updated_at: '',
      },
      { country: 'NL', limit: 3 },
    );

    expect(searchGoogleMaps).toHaveBeenCalledWith('automotive accessories', {
      total: 3,
      language: 'en',
      region: 'NL',
    });
  });

  test('scrapes non-google directory and normalizes companies', async () => {
    scrape.mockImplementation(() => Promise.resolve({
      data: {
        companies: [
          {
            name: 'Europages Dealer',
            website: 'https://dealer.example',
            phone: '+31',
            source_url: 'https://source.example/dealer',
          },
        ],
      },
    }));

    const result = await searchDirectory('europages', null, {
      search_query: 'floor mats',
      country: 'NL',
      limit: 12,
    });

    expect(scrape).toHaveBeenCalledWith('https://www.europages.com/search/companies?query=floor%20mats', {
      profile: 'directory-listing',
      return_text: true,
      mode: 'stealthy',
      options: { country: 'NL', limit: 12 },
    });
    expect(result).toEqual([{
      name: 'Europages Dealer',
      website: 'https://dealer.example',
      phone: '+31',
      address: null,
      place_url: 'https://source.example/dealer',
    }]);
  });
});

describe('b2b lead machine website analyzer', () => {
  test('normalizes lead page data and falls back to page metadata when AI fails', async () => {
    scrape.mockImplementation(() => Promise.resolve({
      text: 'Automotive accessories importer',
      data: {
        title: 'Dealer A',
        description: 'Automotive accessories importer',
        product_keywords: ['car mats', 'trunk mats'],
        has_b2b_signals: true,
        has_china_signals: true,
        has_private_label: false,
        firm_type_hints: ['importer'],
      },
    }));

    const result = await analyzeCompanyWebsite('https://dealer.example');

    expect(scrape).toHaveBeenCalledWith('https://dealer.example', {
      profile: 'lead-page',
      return_text: true,
      mode: 'stealthy',
    });
    expect(result).toEqual({
      sells: ['car mats', 'trunk mats'],
      is_b2b: true,
      sells_china: true,
      private_label: null,
      firm_type: 'importer',
      pain_points: [],
      summary: 'Dealer A — Automotive accessories importer',
    });
  });
});
