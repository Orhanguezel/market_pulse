import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'avrasya' } }));

const customsRepo = await import('../customs/customs.repository');
const customsIntelligence = await import('../customs/customs-intelligence.repository');
const { scoreBuyer } = await import('../customs/customs.job');

beforeEach(() => {
  dbMock.reset();
});

describe('customs reference lake', () => {
  test('aggregates buyers from the shared lake without tenant filter', async () => {
    // Ürün araması önce küçük sözlüklerde eşleşenleri bulur (açıklama + ihracatçı),
    // sonra ana tabloyu indeksli IN(...) ile süzer — 16.3M satırda LIKE taraması yapmaz.
    dbMock.queuePoolExecute([{ hs_description: 'BLACK PEPPER' }]);
    dbMock.queuePoolExecute([]);
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

    // 'pepper' Türkçe eşanlamıyla ('biber') birlikte sözlükte aranır
    const descLookup = dbMock.poolExecutions[0];
    expect(descLookup?.sql).toContain('FROM customs_descriptions');
    expect(descLookup?.values).toEqual(['%pepper%']);

    const call = dbMock.poolExecutions[2];
    expect(call?.sql).toContain('FROM customs_records');
    expect(call?.sql).not.toContain('tenant_key = ?');
    expect(call?.sql).toContain('hs_description IN (?)');
    expect(call?.sql).toContain('buyer_country = ?');
    expect(call?.values).toEqual(['0904%', 'BLACK PEPPER', 'DE', 1000]);
  });

  test('returns nothing when no description or exporter matches the product query', async () => {
    dbMock.queuePoolExecute([]); // açıklama sözlüğü
    dbMock.queuePoolExecute([]); // ihracatçı sözlüğü

    const rows = await customsRepo.aggregateBuyers({ productQuery: 'paspas' });

    expect(rows).toEqual([]);
    expect(dbMock.poolExecutions).toHaveLength(2); // ana tabloya hiç gidilmez
  });

  test('HS kod listesi ON EK olarak eslesir (tam esitlik degil)', async () => {
    dbMock.queuePoolExecute([]);

    // ICP'ler HS kodunu 4-6 haneli ön ek tutar (8482 = rulman); gölde kodlar tam
    // uzunluktadır (848210, 8482100000). Tam eşitlik arandığı için tarama 0 sonuç
    // dönüyordu — Aurora'nın gümrük profili bu yüzden boş geldi.
    await customsRepo.aggregateBuyers({
      hsCodes: ['8482', '090421'],
      hsPrefix: '0904',
      minValue: 500,
      limit: 20,
    });

    const call = dbMock.poolExecutions[0];
    expect(call?.sql).toContain('(hs_code LIKE ? OR hs_code LIKE ?)');
    expect(call?.sql).not.toContain('hs_code IN (');
    expect(call?.values).toEqual(['8482%', '090421%', 500]);
  });

  test('bulk import writes global provenance and source row numbers idempotently', async () => {
    await customsRepo.bulkInsertRecords([
      {
        hsCode: '090421',
        hsDescription: 'Dried pepper',
        buyerName: 'Buyer GmbH',
        exporterName: 'Exporter A',
        originCountry: 'TR',
        buyerCountry: 'DE',
        totalValue: 12500,
        totalQuantity: 30,
        netWeight: 25,
        shipmentDate: '2025-05-10',
        monthYear: 'May 2025',
        sourceProvider: 'EXIMPEDIA',
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
      'TR',
      'DE',
      12500,
      30,
      25,
      '2025-05-10',
      'May 2025',
      'EXIMPEDIA',
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

describe('customs export intelligence', () => {
  test('matches tracked exporter aliases and calculates observed share', async () => {
    dbMock.queuePoolExecute([{
      id: 'entity-1',
      entity_type: 'own',
      name: 'Avrasya Paspas',
      country: 'TR',
      is_active: 1,
    }]);
    dbMock.queuePoolExecute([{
      id: 'alias-1',
      entity_id: 'entity-1',
      alias: 'AVRASYA PASPAS AUTOMOTIVE',
      match_type: 'prefix',
    }]);
    dbMock.queuePoolExecute([{
      shipment_count: 18,
      total_value_usd: 250000,
      total_quantity: 1200,
      net_weight: 900,
      buyer_count: 8,
      first_shipment_date: '2022-01-01',
      latest_shipment_date: '2026-05-01',
    }]);
    dbMock.queuePoolExecute([{ period: '2026-05', shipment_count: 2, total_value_usd: 45000 }]);
    dbMock.queuePoolExecute([{ country: 'DE', shipment_count: 5, total_value_usd: 80000 }]);

    const result = await customsIntelligence.getCustomsIntelligenceSummary('avrasya', {
      hsPrefix: '401691',
      dateFrom: '2022-01-01',
      dateTo: '2026-12-31',
    });

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]?.observed_share_pct).toBe(100);
    expect(result.entities[0]?.destinations[0]?.country).toBe('DE');
    const totalsCall = dbMock.poolExecutions[2];
    expect(totalsCall?.sql).toContain('exporter_name LIKE ?');
    expect(totalsCall?.sql).toContain("COALESCE(shipment_date, STR_TO_DATE(CONCAT(month_year, ' 01'), '%b %Y %d')) >= ?");
    expect(totalsCall?.values).toEqual([
      'AVRASYA PASPAS AUTOMOTIVE%',
      '401691%',
      '2022-01-01',
      '2026-12-31',
    ]);
  });
});
