import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from './helpers/mock-db';
import { callHandler } from './helpers/reply';

const dbMock = createDbMock();
const erpProvider = {
  getCustomers: mock(() => Promise.resolve([{ id: 'customer-1', name: 'Customer A' }])),
  getProducts: mock(() => Promise.resolve([{ id: 'product-1', name: 'Product A' }])),
  getCustomerOrders: mock(() => Promise.resolve([{ id: 'order-1', siparisNo: 'S-1' }])),
  getAllActiveCustomers: mock(() => Promise.resolve([])),
};
const getErpProvider = mock(() => Promise.resolve(erpProvider));
const syncErpCustomersToTargets = mock(() => Promise.resolve({ enabled: true, inserted: 1, updated: 2, total: 3 }));

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('../external/erp', () => ({
  getErpProvider,
}));

mock.module('../external/erp/sync', () => ({
  syncErpCustomersToTargets,
}));

const controller = await import('../controller');

beforeEach(() => {
  dbMock.reset();
  getErpProvider.mockReset();
  erpProvider.getCustomers.mockReset();
  erpProvider.getProducts.mockReset();
  erpProvider.getCustomerOrders.mockReset();
  syncErpCustomersToTargets.mockReset();
  getErpProvider.mockImplementation(() => Promise.resolve(erpProvider));
  erpProvider.getCustomers.mockImplementation(() => Promise.resolve([{ id: 'customer-1', name: 'Customer A' }]));
  erpProvider.getProducts.mockImplementation(() => Promise.resolve([{ id: 'product-1', name: 'Product A' }]));
  erpProvider.getCustomerOrders.mockImplementation(() => Promise.resolve([{ id: 'order-1', siparisNo: 'S-1' }]));
  syncErpCustomersToTargets.mockImplementation(() => Promise.resolve({ enabled: true, inserted: 1, updated: 2, total: 3 }));
});

describe('market ERP external endpoints', () => {
  test('lists ERP customers with query params', async () => {
    const { result } = await callHandler(controller.listErpCustomers, {
      query: { q: 'alpha', limit: '10' },
    });

    expect(erpProvider.getCustomers).toHaveBeenCalledWith('alpha', 10);
    expect(result).toEqual({ enabled: true, items: [{ id: 'customer-1', name: 'Customer A' }] });
  });

  test('rejects invalid customer query', async () => {
    const { state } = await callHandler(controller.listErpCustomers, {
      query: { limit: '0' },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual(expect.objectContaining({
      error: expect.objectContaining({ message: 'invalid_query' }),
    }));
  });

  test('returns disabled payload when ERP is off', async () => {
    getErpProvider.mockImplementation(() => Promise.resolve(null));

    const { result } = await callHandler(controller.listErpCustomers, {
      query: {},
    });

    expect(result).toEqual({ enabled: false, items: [] });
  });

  test('maps customer provider status errors', async () => {
    erpProvider.getCustomers.mockImplementation(() => {
      const err = new Error('external_unavailable');
      Object.assign(err, { statusCode: 503 });
      return Promise.reject(err);
    });

    const { state } = await callHandler(controller.listErpCustomers, {
      query: {},
    });

    expect(state.statusCode).toBe(503);
    expect(state.payload).toEqual({ error: { message: 'external_unavailable' } });
  });

  test('lists ERP products', async () => {
    const { result } = await callHandler(controller.listErpProducts, {
      query: { q: 'oto', limit: '5' },
    });

    expect(erpProvider.getProducts).toHaveBeenCalledWith('oto', 5);
    expect(result).toEqual({ enabled: true, items: [{ id: 'product-1', name: 'Product A' }] });
  });

  test('lists ERP customer orders', async () => {
    const { result } = await callHandler(controller.listErpCustomerOrders, {
      params: { id: 'customer-1' },
    });

    expect(erpProvider.getCustomerOrders).toHaveBeenCalledWith('customer-1');
    expect(result).toEqual({ enabled: true, items: [{ id: 'order-1', siparisNo: 'S-1' }] });
  });
});

describe('market ERP sync endpoint', () => {
  test('syncs ERP customers to market targets', async () => {
    const { result } = await callHandler(controller.syncErpTargets, {
      body: { mode: 'customers' },
    });

    expect(syncErpCustomersToTargets).toHaveBeenCalledWith('customers');
    expect(result).toEqual({
      ok: true,
      enabled: true,
      inserted: 1,
      updated: 2,
      total: 3,
      message: '3 kayıt işlendi: 1 eklendi, 2 güncellendi.',
    });
  });

  test('uses all mode by default', async () => {
    await callHandler(controller.syncErpTargets, {
      body: {},
    });

    expect(syncErpCustomersToTargets).toHaveBeenCalledWith('all');
  });

  test('rejects invalid sync mode', async () => {
    const { state } = await callHandler(controller.syncErpTargets, {
      body: { mode: 'invalid' },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual(expect.objectContaining({
      error: expect.objectContaining({ message: 'invalid_body' }),
    }));
  });

  test('maps sync service status errors', async () => {
    syncErpCustomersToTargets.mockImplementation(() => {
      const err = new Error('external_db_not_configured');
      Object.assign(err, { statusCode: 400 });
      return Promise.reject(err);
    });

    const { state } = await callHandler(controller.syncErpTargets, {
      body: { mode: 'all' },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual({ error: { message: 'external_db_not_configured' } });
  });
});
