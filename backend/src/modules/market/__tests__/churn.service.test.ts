import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from './helpers/mock-db';

const dbMock = createDbMock();
const getCustomerOrders = mock(() => Promise.resolve([]));

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('../external/paspas.repository', () => ({
  getCustomerOrders,
  getPaspasCustomers: mock(() => Promise.resolve([])),
  getPaspasProducts: mock(() => Promise.resolve([])),
}));

const service = await import('../churn.service');

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

beforeEach(() => {
  dbMock.reset();
  getCustomerOrders.mockReset();
  getCustomerOrders.mockImplementation(() => Promise.resolve([]));
});

describe('market churn service', () => {
  test('throws 404 when target is missing', async () => {
    dbMock.queuePoolQuery([]);

    await expect(service.recalculateChurnScore('missing')).rejects.toMatchObject({
      message: 'target_not_found',
      statusCode: 404,
    });
  });

  test('adds risk for missing last seen date and unresolved signals', async () => {
    dbMock.queuePoolQuery([{ id: 'target-1', last_seen_at: null }]);
    dbMock.queuePoolQuery([
      { severity: 'critical', count: 1 },
      { severity: 'high', count: 2 },
      { severity: 'medium', count: 3 },
      { severity: 'low', count: 9 },
    ]);
    getCustomerOrders.mockImplementation(() => Promise.resolve([{ siparisTarihi: daysAgo(5) }]));

    const score = await service.recalculateChurnScore('target-1');

    expect(score).toBe(70);
    expect(dbMock.poolQueries.at(-1)).toEqual(expect.objectContaining({
      values: [70, 'avrasya', 'target-1'],
    }));
  });

  test('applies 30/60/90 day last seen thresholds', async () => {
    const cases = [
      { days: 31, expected: 10 },
      { days: 61, expected: 20 },
      { days: 91, expected: 30 },
    ];

    for (const item of cases) {
      dbMock.reset();
      getCustomerOrders.mockImplementation(() => Promise.resolve([{ siparisTarihi: daysAgo(3) }]));
      dbMock.queuePoolQuery([{ id: `target-${item.days}`, last_seen_at: daysAgo(item.days) }]);
      dbMock.queuePoolQuery([]);

      const score = await service.recalculateChurnScore(`target-${item.days}`);

      expect(score).toBe(item.expected);
    }
  });

  test('does not add order risk when order history is empty', async () => {
    dbMock.queuePoolQuery([{ id: 'target-1', last_seen_at: daysAgo(2), paspas_customer_id: 'cust-1' }]);
    dbMock.queuePoolQuery([]);
    getCustomerOrders.mockImplementation(() => Promise.resolve([]));

    const score = await service.recalculateChurnScore('target-1');

    expect(score).toBe(0);
  });

  test('adds order risk when recent order volume drops sharply', async () => {
    dbMock.queuePoolQuery([{ id: 'target-1', last_seen_at: daysAgo(2), paspas_customer_id: 'cust-1' }]);
    dbMock.queuePoolQuery([]);
    getCustomerOrders.mockImplementation(() => Promise.resolve([
      { siparisTarihi: daysAgo(10) },
      { siparisTarihi: daysAgo(100) },
      { siparisTarihi: daysAgo(110) },
      { siparisTarihi: daysAgo(120) },
    ]));

    const score = await service.recalculateChurnScore('target-1');

    expect(score).toBe(10);
  });

  test('normalizes score to 100', async () => {
    dbMock.queuePoolQuery([{ id: 'target-1', last_seen_at: daysAgo(200) }]);
    dbMock.queuePoolQuery([{ severity: 'critical', count: 10 }]);
    getCustomerOrders.mockImplementation(() => Promise.resolve([]));

    const score = await service.recalculateChurnScore('target-1');

    expect(score).toBe(100);
  });
});
