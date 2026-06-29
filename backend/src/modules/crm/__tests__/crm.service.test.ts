import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '@/modules/market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'tenant-a' } }));

const accounts = await import('../accounts.service');
const convert = await import('../convert.service');
const dashboard = await import('../dashboard.service');
const { runWithTenant } = await import('@/core/tenant-context');

beforeEach(() => {
  dbMock.reset();
});

describe('crm accounts service', () => {
  test('creates accounts with the active tenant key', async () => {
    dbMock.queuePoolExecute([{
      id: 'account-1',
      tenant_key: 'tenant-a',
      name: 'Acme',
      raw_data: '{"source":"manual"}',
    }]);

    const result = await accounts.createAccount({ name: 'Acme', raw_data: { source: 'manual' } });

    expect(dbMock.poolExecutions[0]?.sql).toStartWith('INSERT INTO crm_accounts');
    expect(dbMock.poolExecutions[0]?.values?.slice(0, 4)).toEqual([
      expect.any(String),
      'tenant-a',
      'Acme',
      null,
    ]);
    expect(result).toEqual(expect.objectContaining({ id: 'account-1', raw_data: { source: 'manual' } }));
  });
});

describe('crm lead conversion service', () => {
  test('converts an approved lead candidate into account, contact and deal', async () => {
    dbMock.queuePoolExecute([{
      id: 'candidate-1',
      name: 'Buyer Co',
      website: 'https://buyer.example',
      country: 'DE',
      city: 'Berlin',
      phone: '+49',
      email: 'buyer@example.com',
      contact_name: 'Ada Buyer',
      raw_data: '{"channel":"customs"}',
      ai_summary: 'Good customs fit',
    }]);
    dbMock.queuePoolExecute([{ id: 'account-1', name: 'Buyer Co', raw_data: '{}' }]);
    dbMock.queuePoolExecute([{ id: 'contact-1', first_name: 'Ada', last_name: 'Buyer' }]);
    dbMock.queuePoolExecute([{ id: 'pipeline-1' }]);
    dbMock.queuePoolExecute([{ id: 'stage-1' }]);
    dbMock.queuePoolExecute([{ id: 'deal-1', title: 'Buyer Co fırsatı', raw_data: '{}' }]);

    const result = await convert.convertLeadCandidate({ candidate_id: 'candidate-1' });

    expect(result).toEqual({
      account: expect.objectContaining({ id: 'account-1' }),
      contact: expect.objectContaining({ id: 'contact-1' }),
      deal: expect.objectContaining({ id: 'deal-1' }),
    });
    expect(dbMock.poolExecutions.some((entry) => entry.sql.startsWith('INSERT INTO crm_accounts'))).toBe(true);
    expect(dbMock.poolExecutions.some((entry) => entry.sql.startsWith('INSERT INTO crm_contacts'))).toBe(true);
    expect(dbMock.poolExecutions.some((entry) => entry.sql.startsWith('INSERT INTO crm_deals'))).toBe(true);
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'candidate-1']);
  });
});

describe('crm dashboard summary service', () => {
  test('builds tenant-scoped dashboard counts and chart data', async () => {
    dbMock.queuePoolExecute([{ cnt: '2' }]);
    dbMock.queuePoolExecute([{ cnt: '3' }]);
    dbMock.queuePoolExecute([{ cnt: '4' }]);
    dbMock.queuePoolExecute([{ cnt: '1' }]);
    dbMock.queuePoolExecute([{ cnt: '5' }]);
    dbMock.queuePoolExecute([{ cnt: '6' }]);
    dbMock.queuePoolExecute([{ cnt: '1' }]);
    dbMock.queuePoolExecute([{ month: '2026-01', amount: '14000.50' }]);
    dbMock.queuePoolExecute([
      { done: 0, count: '5' },
      { done: 1, count: '7' },
    ]);

    const result = await runWithTenant('tenant-b', () => dashboard.getDashboardSummary());

    expect(result.counts).toEqual({
      accounts: 2,
      contacts: 3,
      deals_open: 4,
      deals_won: 1,
      activities_pending: 5,
      quotes: 1,
      orders: 1,
      leads: 6,
    });
    expect(result.pending).toEqual({ quotes: 1, open_deals: 4 });
    expect(result.sales_summary).toEqual([{ month: '2026-01', amount: 14000.5 }]);
    expect(result.team_breakdown).toEqual([
      { label: 'Açık Aktivite', count: 5 },
      { label: 'Tamamlanan Aktivite', count: 7 },
    ]);
    expect(result.totals.records).toBe(21);
    expect(dbMock.poolExecutions).toHaveLength(9);
    expect(dbMock.poolExecutions.every((entry) => entry.values?.[0] === 'tenant-b')).toBe(true);
    expect(dbMock.poolExecutions.every((entry) => entry.sql.includes('tenant_key = ?'))).toBe(true);
  });
});
