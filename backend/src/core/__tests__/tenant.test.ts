import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../modules/market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const envMock = {
  TENANT_KEY: 'avrasya',
  DB_ENCRYPTION_KEY: '',
};

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({
  env: envMock,
}));

const tenant = await import('../tenant');
const tenantContext = await import('../tenant-context');

const tenantRow = {
  tenant_key: 'avrasya',
  name: 'Avrasya Otomotiv',
  locale: 'tr',
  status: 'active',
  plan: 'agency',
  created_at: '2026-06-02 00:00:00',
  updated_at: '2026-06-02 00:00:00',
};

beforeEach(() => {
  dbMock.reset();
  envMock.TENANT_KEY = 'avrasya';
  envMock.DB_ENCRYPTION_KEY = '';
  tenant.resetActiveTenantCacheForTests();
});

describe('tenant core', () => {
  test('getActiveTenant resolves tenant from env', async () => {
    dbMock.queuePoolExecute([tenantRow]);
    dbMock.queuePoolExecute([
      { key: 'locale', value_json: '{"default":"tr"}' },
      { key: 'external_erp', value_json: { enabled: true } },
    ]);

    const result = await tenant.getActiveTenant();

    expect(result).toEqual(expect.objectContaining({
      key: 'avrasya',
      name: 'Avrasya Otomotiv',
      locale: 'tr',
      status: 'active',
      plan: 'agency',
      settings: {
        locale: { default: 'tr' },
        external_erp: { enabled: true },
      },
    }));
    expect(dbMock.poolExecutions[0]?.values).toEqual(['avrasya', 'active']);
  });

  test('getActiveTenant throws a clear error for an unknown TENANT_KEY', async () => {
    envMock.TENANT_KEY = 'missing';
    dbMock.queuePoolExecute([]);

    await expect(tenant.getActiveTenant()).rejects.toThrow('Unknown TENANT_KEY: missing');
  });

  test('getTenantSetting returns fallback when key is missing', async () => {
    dbMock.queuePoolExecute([tenantRow]);
    dbMock.queuePoolExecute([{ key: 'locale', value_json: '{"default":"tr"}' }]);

    await expect(tenant.getTenantSetting('branding', { appName: 'MarketPulse' }))
      .resolves.toEqual({ appName: 'MarketPulse' });
  });

  test('getActiveTenant resolves tenant from request context', async () => {
    dbMock.queuePoolExecute([{ ...tenantRow, tenant_key: 'vistaseeds', name: 'VistaSeeds' }]);
    dbMock.queuePoolExecute([{ key: 'branding', value_json: '{"displayName":"VistaSeeds"}' }]);

    const result = await tenantContext.runWithTenant('vistaseeds', () => tenant.getActiveTenant());

    expect(result.key).toBe('vistaseeds');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['vistaseeds', 'active']);
  });

  test('caches active tenants per key', async () => {
    dbMock.queuePoolExecute([{ ...tenantRow, tenant_key: 'vistaseeds', name: 'VistaSeeds' }]);
    dbMock.queuePoolExecute([]);
    dbMock.queuePoolExecute([{ ...tenantRow, tenant_key: 'bereketfide', name: 'Bereket Fide' }]);
    dbMock.queuePoolExecute([]);

    await tenantContext.runWithTenant('vistaseeds', () => tenant.getActiveTenant());
    await tenantContext.runWithTenant('vistaseeds', () => tenant.getActiveTenant());
    await tenantContext.runWithTenant('bereketfide', () => tenant.getActiveTenant());

    expect(dbMock.poolExecutions.map((q) => q.values?.[0])).toEqual([
      'vistaseeds',
      'vistaseeds',
      'bereketfide',
      'bereketfide',
    ]);
  });
});
