import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from './helpers/mock-db';

const dbMock = createDbMock();
const scrape = mock(() => Promise.resolve({ data: { changed_fields: [] } }));
const searchGoogleMaps = mock(() => Promise.resolve({ places: [] }));
const verifyScraperWebhook = mock(() => true);

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/modules/lead-machine/_shared/scraper.client', () => ({
  scrape,
  searchGoogleMaps,
  verifyScraperWebhook,
}));

const service = await import('../competitor.signal');

beforeEach(() => {
  dbMock.reset();
  scrape.mockReset();
  scrape.mockImplementation(() => Promise.resolve({ data: { changed_fields: [] } }));
});

function target(overrides: Record<string, unknown> = {}) {
  return {
    id: 'target-1',
    name: 'Alpha Dealer',
    website: 'https://alpha.example',
    ...overrides,
  };
}

describe('market competitor signal service', () => {
  test('throws 404 when target is missing', async () => {
    dbMock.queueSelect([]);

    await expect(service.scanAndCreateSignals('missing')).rejects.toMatchObject({
      message: 'TARGET_NOT_FOUND',
      statusCode: 404,
    });
  });

  test('throws 400 when target has no website', async () => {
    dbMock.queueSelect([target({ website: null })]);

    await expect(service.scanAndCreateSignals('target-1')).rejects.toMatchObject({
      message: 'TARGET_HAS_NO_WEBSITE',
      statusCode: 400,
    });
  });

  test('updates last seen without creating signal when no fields changed', async () => {
    dbMock.queueSelect([target()]);
    scrape.mockImplementation(() => Promise.resolve({ data: { changed_fields: [] } }));

    const result = await service.scanAndCreateSignals('target-1');

    expect(scrape).toHaveBeenCalledWith('https://alpha.example', {
      profile: 'competitor-page',
      return_text: false,
      mode: 'stealthy',
    });
    expect(dbMock.inserts).toHaveLength(0);
    expect(dbMock.updates[0]?.patch).toEqual(expect.objectContaining({
      last_seen_at: expect.any(Date),
    }));
    expect(result).toEqual(expect.objectContaining({
      target_id: 'target-1',
      url: 'https://alpha.example',
      changed_fields: [],
      signals_created: 0,
    }));
  });

  test('creates high severity signal for price changes', async () => {
    dbMock.queueSelect([target()]);
    scrape.mockImplementation(() => Promise.resolve({
      data: {
        changed_fields: ['prices'],
        prices: [{ label: 'A', value: '10' }],
        campaigns: [],
        products: [],
      },
    }));

    const result = await service.scanAndCreateSignals('target-1');

    expect(dbMock.inserts[0]?.values).toEqual(expect.objectContaining({
      target_id: 'target-1',
      signal_type: 'competitor_change',
      severity: 'high',
      title: 'Alpha Dealer: fiyat değişikliği tespit edildi',
      source_url: 'https://alpha.example',
    }));
    expect(result.signals_created).toBe(1);
  });

  test('creates medium severity signal for product changes', async () => {
    dbMock.queueSelect([target()]);
    scrape.mockImplementation(() => Promise.resolve({
      data: { changed_fields: ['products'], products: [{ name: 'Mat' }] },
    }));

    await service.scanAndCreateSignals('target-1');

    expect(dbMock.inserts[0]?.values).toEqual(expect.objectContaining({
      severity: 'medium',
      title: 'Alpha Dealer: ürün listesi değişikliği tespit edildi',
    }));
  });

  test('creates critical severity signal for three or more changed fields', async () => {
    dbMock.queueSelect([target()]);
    scrape.mockImplementation(() => Promise.resolve({
      data: { changed_fields: ['prices', 'products', 'campaigns'] },
    }));

    await service.scanAndCreateSignals('target-1');

    expect(dbMock.inserts[0]?.values).toEqual(expect.objectContaining({
      severity: 'critical',
    }));
  });
});
