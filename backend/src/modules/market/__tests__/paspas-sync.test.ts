import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from './helpers/mock-db';
import { callHandler } from './helpers/reply';

const dbMock = createDbMock();
const getPaspasCustomers = mock(() => Promise.resolve([{ id: 'customer-1', name: 'Customer A' }]));
const getPaspasProducts = mock(() => Promise.resolve([{ id: 'product-1', name: 'Paspas A' }]));
const getCustomerOrders = mock(() => Promise.resolve([{ id: 'order-1', siparisNo: 'S-1' }]));
const syncPaspasCustomersToTargets = mock(() => Promise.resolve({ inserted: 1, updated: 2, total: 3 }));

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('../external/paspas.repository', () => ({
  getCustomerOrders,
  getPaspasCustomers,
  getPaspasProducts,
}));

mock.module('../external/paspas.sync', () => ({
  syncPaspasCustomersToTargets,
}));

const controller = await import('../controller');

beforeEach(() => {
  dbMock.reset();
  getPaspasCustomers.mockReset();
  getPaspasProducts.mockReset();
  getCustomerOrders.mockReset();
  syncPaspasCustomersToTargets.mockReset();
  getPaspasCustomers.mockImplementation(() => Promise.resolve([{ id: 'customer-1', name: 'Customer A' }]));
  getPaspasProducts.mockImplementation(() => Promise.resolve([{ id: 'product-1', name: 'Paspas A' }]));
  getCustomerOrders.mockImplementation(() => Promise.resolve([{ id: 'order-1', siparisNo: 'S-1' }]));
  syncPaspasCustomersToTargets.mockImplementation(() => Promise.resolve({ inserted: 1, updated: 2, total: 3 }));
});

describe('market paspas external endpoints', () => {
  test('lists Paspas customers with query params', async () => {
    const { result } = await callHandler(controller.listPaspasCustomers, {
      query: { q: 'alpha', limit: '10' },
    });

    expect(getPaspasCustomers).toHaveBeenCalledWith('alpha', 10);
    expect(result).toEqual([{ id: 'customer-1', name: 'Customer A' }]);
  });

  test('rejects invalid customer query', async () => {
    const { state } = await callHandler(controller.listPaspasCustomers, {
      query: { limit: '0' },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual(expect.objectContaining({
      error: expect.objectContaining({ message: 'invalid_query' }),
    }));
  });

  test('maps customer repository status errors', async () => {
    getPaspasCustomers.mockImplementation(() => {
      const err = new Error('external_unavailable');
      Object.assign(err, { statusCode: 503 });
      return Promise.reject(err);
    });

    const { state } = await callHandler(controller.listPaspasCustomers, {
      query: {},
    });

    expect(state.statusCode).toBe(503);
    expect(state.payload).toEqual({ error: { message: 'external_unavailable' } });
  });

  test('lists Paspas products', async () => {
    const { result } = await callHandler(controller.listPaspasProducts, {
      query: { q: 'oto', limit: '5' },
    });

    expect(getPaspasProducts).toHaveBeenCalledWith('oto', 5);
    expect(result).toEqual([{ id: 'product-1', name: 'Paspas A' }]);
  });

  test('lists Paspas customer orders', async () => {
    const { result } = await callHandler(controller.listPaspasCustomerOrders, {
      params: { id: 'customer-1' },
    });

    expect(getCustomerOrders).toHaveBeenCalledWith('customer-1');
    expect(result).toEqual([{ id: 'order-1', siparisNo: 'S-1' }]);
  });
});

describe('market paspas sync endpoint', () => {
  test('syncs Paspas customers to market targets', async () => {
    const { result } = await callHandler(controller.syncPaspasTargets, {
      body: { mode: 'customers' },
    });

    expect(syncPaspasCustomersToTargets).toHaveBeenCalledWith('customers');
    expect(result).toEqual({
      ok: true,
      inserted: 1,
      updated: 2,
      total: 3,
      message: '3 kayıt işlendi: 1 eklendi, 2 güncellendi.',
    });
  });

  test('uses all mode by default', async () => {
    await callHandler(controller.syncPaspasTargets, {
      body: {},
    });

    expect(syncPaspasCustomersToTargets).toHaveBeenCalledWith('all');
  });

  test('rejects invalid sync mode', async () => {
    const { state } = await callHandler(controller.syncPaspasTargets, {
      body: { mode: 'invalid' },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual(expect.objectContaining({
      error: expect.objectContaining({ message: 'invalid_body' }),
    }));
  });

  test('maps sync service status errors', async () => {
    syncPaspasCustomersToTargets.mockImplementation(() => {
      const err = new Error('external_db_not_configured');
      Object.assign(err, { statusCode: 400 });
      return Promise.reject(err);
    });

    const { state } = await callHandler(controller.syncPaspasTargets, {
      body: { mode: 'all' },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual({ error: { message: 'external_db_not_configured' } });
  });
});
