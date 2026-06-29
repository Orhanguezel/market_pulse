import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '@/modules/market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'tenant-a' } }));

const service = await import('../service');
const { requireModule } = await import('../guard');

beforeEach(() => {
  dbMock.reset();
});

describe('module entitlements service', () => {
  test('hasModule checks active or trial unexpired tenant module rows', async () => {
    dbMock.queuePoolExecute([{ ok: 1 }]);

    const result = await service.hasModule('tenant-a', 'leads');

    expect(result).toBe(true);
    expect(dbMock.poolExecutions[0]?.sql).toContain("status IN ('trial', 'active')");
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'leads']);
  });

  test('hasModule returns false when no entitlement row exists', async () => {
    dbMock.queuePoolExecute([]);

    await expect(service.hasModule('tenant-a', 'crm')).resolves.toBe(false);
  });

  test('activateModule snapshots catalog price and upserts tenant module', async () => {
    dbMock.queuePoolExecute([{ base_price: '99.00', currency: 'USD' }]);
    dbMock.queuePoolExecute([{
      id: 'tm-1',
      tenant_key: 'tenant-a',
      module_key: 'crm',
      status: 'active',
      price_snapshot: '99.00',
      currency: 'USD',
      activated_at: '2026-06-29 10:00:00',
      expires_at: null,
      config: '{"seats":3}',
      created_at: '2026-06-29 10:00:00',
      updated_at: '2026-06-29 10:00:00',
    }]);

    const result = await service.activateModule('tenant-a', 'crm', { config: { seats: 3 } });

    expect(dbMock.poolExecutions[1]?.sql).toContain('INSERT INTO tenant_modules');
    expect(dbMock.poolExecutions[1]?.values?.slice(1)).toEqual([
      'tenant-a',
      'crm',
      'active',
      '99.00',
      'USD',
      null,
      '{"seats":3}',
    ]);
    expect(result?.config).toEqual({ seats: 3 });
  });
});

describe('requireModule guard', () => {
  test('returns 402 for tenants without the requested module', async () => {
    dbMock.queuePoolExecute([]);
    const sent: unknown[] = [];
    const reply = {
      code(status: number) {
        sent.push({ status });
        return this;
      },
      send(payload: unknown) {
        sent.push(payload);
        return payload;
      },
    };

    await requireModule('crm')({} as never, reply as never);

    expect(sent).toEqual([
      { status: 402 },
      { error: 'MODULE_NOT_ENTITLED', module: 'crm' },
    ]);
  });

  test('bypasses module checks for super-admin users', async () => {
    const reply = {
      code() {
        throw new Error('unexpected_reply_code');
      },
    };

    await requireModule('crm')({ user: { isSuperAdmin: true } } as never, reply as never);

    expect(dbMock.poolExecutions).toHaveLength(0);
  });
});
