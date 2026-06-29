import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'avrasya' } }));

const customsRepo = await import('../customs/customs.repository');
const { scoreBuyer } = await import('../customs/customs.job');

beforeEach(() => {
  dbMock.reset();
});

describe('customs reference lake', () => {
  test('aggregates buyers from the shared lake without tenant filter', async () => {
    dbMock.queuePoolExecute([{
      buyer_name: 'Buyer GmbH',
      buyer_country: 'DE',
      hs_codes: '090421',
      exporter_names: 'Exporter A',
      total_value: '120000',
      total_quantity: '100',
      record_count: '4',
      latest_month: 'May 2025',
    }]);

    const rows = await customsRepo.aggregateBuyers({
      hsPrefix: '0904',
      productQuery: 'pepper',
      buyerCountry: 'DE',
      minValue: 1000,
      limit: 50,
    });

    expect(rows).toHaveLength(1);
    const call = dbMock.poolExecutions[0];
    expect(call?.sql).toContain('FROM customs_records');
    expect(call?.sql).not.toContain('tenant_key = ?');
    expect(call?.sql).toContain('(hs_description LIKE ? OR exporter_name LIKE ?)');
    expect(call?.sql).toContain('buyer_country = ?');
    expect(call?.values).toEqual(['0904%', '%pepper%', '%pepper%', 'DE', 1000]);
  });

  test('aggregates exact HS code lists before prefix fallback', async () => {
    dbMock.queuePoolExecute([]);

    await customsRepo.aggregateBuyers({
      hsCodes: ['090421', '090422'],
      hsPrefix: '0904',
      minValue: 500,
      limit: 20,
    });

    const call = dbMock.poolExecutions[0];
    expect(call?.sql).toContain('hs_code IN (?, ?)');
    expect(call?.sql).not.toContain('hs_code LIKE ?');
    expect(call?.values).toEqual(['090421', '090422', 500]);
  });

  test('bulk import writes global provenance and source row numbers idempotently', async () => {
    await customsRepo.bulkInsertRecords([
      {
        hsCode: '090421',
        hsDescription: 'Dried pepper',
        buyerName: 'Buyer GmbH',
        exporterName: 'Exporter A',
        buyerCountry: 'DE',
        totalValue: 12500,
        totalQuantity: 30,
        monthYear: 'May 2025',
        sourceRowNumber: 2,
      },
    ], 'excel_data.csv');

    const call = dbMock.poolQueries[0];
    expect(call?.sql).toContain('INSERT IGNORE INTO customs_records');
    expect(call?.values).toEqual([
      'global',
      '090421',
      'Dried pepper',
      'Buyer GmbH',
      'Exporter A',
      'DE',
      12500,
      30,
      'May 2025',
      'excel_data.csv',
      2,
    ]);
  });

  test('scoreBuyer rewards value, frequency, and recency', () => {
    expect(scoreBuyer({
      buyer_name: 'High Value GmbH',
      buyer_country: 'DE',
      hs_codes: '090421',
      exporter_names: 'Exporter A',
      total_value: 150000,
      total_quantity: 100,
      record_count: 12,
      latest_month: 'May 2025',
    })).toBe(10);

    expect(scoreBuyer({
      buyer_name: 'Small Buyer',
      buyer_country: null,
      hs_codes: '090421',
      exporter_names: 'Exporter A',
      total_value: 900,
      total_quantity: 1,
      record_count: 1,
      latest_month: 'Jan 2020',
    })).toBe(1);
  });
});
