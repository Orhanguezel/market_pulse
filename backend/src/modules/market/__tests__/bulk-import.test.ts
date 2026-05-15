import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from './helpers/mock-db';
import { callHandler } from './helpers/reply';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('../external/paspas.repository', () => ({
  getCustomerOrders: mock(() => Promise.resolve([])),
  getPaspasCustomers: mock(() => Promise.resolve([])),
  getPaspasProducts: mock(() => Promise.resolve([])),
}));

mock.module('../external/paspas.sync', () => ({
  syncPaspasCustomersToTargets: mock(() => Promise.resolve({ inserted: 1, updated: 2, total: 3 })),
}));

const controller = await import('../controller');

beforeEach(() => {
  dbMock.reset();
});

describe('market bulk import', () => {
  test('downloads a csv import template', async () => {
    const { state } = await callHandler(controller.downloadImportTemplate, {});

    expect(state.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(state.headers['content-disposition']).toBe('attachment; filename="hedef-sablonu.csv"');
    expect(String(state.payload)).toStartWith('name,category,website,phone,email,contact_name,city,district,notes');
  });

  test('previews inserts without writing in dry run mode', async () => {
    dbMock.queueSelect([]);

    const { result } = await callHandler(controller.bulkImportTargets, {
      body: {
        dry_run: true,
        on_conflict: 'skip',
        rows: [{ name: 'New Dealer', website: 'https://new.example', category: 'bayi' }],
      },
    });

    expect(dbMock.inserts).toHaveLength(0);
    expect(result).toEqual({
      inserted: 1,
      updated: 0,
      skipped: 0,
      total: 1,
      dry_run: true,
      preview: [expect.objectContaining({
        name: 'New Dealer',
        category: 'dealer',
        _action: 'insert',
      })],
    });
  });

  test('skips duplicate website when conflict mode is skip', async () => {
    dbMock.queueSelect([{ id: 'existing-target' }]);

    const { result } = await callHandler(controller.bulkImportTargets, {
      body: {
        dry_run: false,
        on_conflict: 'skip',
        rows: [{ name: 'Existing Dealer', website: 'https://existing.example' }],
      },
    });

    expect(dbMock.inserts).toHaveLength(0);
    expect(dbMock.updates).toHaveLength(0);
    expect(result).toEqual(expect.objectContaining({
      inserted: 0,
      updated: 0,
      skipped: 1,
      preview: [expect.objectContaining({ _action: 'skip' })],
    }));
  });

  test('updates duplicate website when conflict mode is update', async () => {
    dbMock.queueSelect([{ id: 'existing-target' }]);

    const { result } = await callHandler(controller.bulkImportTargets, {
      body: {
        dry_run: false,
        on_conflict: 'update',
        rows: [{
          name: 'Existing Dealer',
          website: 'https://existing.example',
          email: 'sales@example.com',
          city: 'Izmir',
        }],
      },
    });

    expect(dbMock.updates[0]?.patch).toEqual(expect.objectContaining({
      name: 'Existing Dealer',
      website: 'https://existing.example',
      email: 'sales@example.com',
      city: 'Izmir',
    }));
    expect(result).toEqual(expect.objectContaining({
      inserted: 0,
      updated: 1,
      skipped: 0,
      preview: [expect.objectContaining({ _action: 'update' })],
    }));
  });

  test('detects duplicates by name when website is missing', async () => {
    dbMock.queueSelect([{ id: 'existing-target' }]);

    const { result } = await callHandler(controller.bulkImportTargets, {
      body: {
        dry_run: true,
        on_conflict: 'skip',
        rows: [{ name: 'Name Only Dealer' }],
      },
    });

    expect(result).toEqual(expect.objectContaining({
      skipped: 1,
      preview: [expect.objectContaining({ name: 'Name Only Dealer', _action: 'skip' })],
    }));
  });

  test('rejects invalid bulk import payload', async () => {
    const { state } = await callHandler(controller.bulkImportTargets, {
      body: { dry_run: true, rows: [] },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual(expect.objectContaining({
      error: expect.objectContaining({ message: 'invalid_body' }),
    }));
  });
});
