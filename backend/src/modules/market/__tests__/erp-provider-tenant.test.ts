import { describe, expect, mock, test } from 'bun:test';
import { getActiveTenantKey } from '@/modules/_shared/tenant-scope';
import { runWithTenant } from '@/core/tenant-context';

const tenantSettings: Record<string, Record<string, unknown>> = {
  vistaseeds: {
    external_erp: { enabled: true, provider: 'ecosystem', connectionKey: 'vistaseeds' },
    external_db: {
      enabled: true,
      provider: 'ecosystem',
      connectionKey: 'vistaseeds',
      host: '127.0.0.1',
      database: 'vistaseed',
    },
  },
  bereketfide: {
    external_erp: { enabled: true, provider: 'ecosystem', connectionKey: 'bereketfide' },
    external_db: {
      enabled: true,
      provider: 'ecosystem',
      connectionKey: 'bereketfide',
      host: '127.0.0.1',
      database: 'bereketfide',
    },
  },
};

mock.module('@/db/external', () => ({
  getExternalPool: () => null,
  getExternalPoolFromConfig: () => null,
}));

const { EcosystemSourceProvider } = await import('../external/erp/ecosystem.provider');

function providerForActiveTenant() {
  const settings = tenantSettings[getActiveTenantKey()];
  const erp = settings?.external_erp as { connectionKey?: string } | undefined;
  const db = settings?.external_db as { connectionKey?: string } | undefined;
  return new EcosystemSourceProvider(erp?.connectionKey || db?.connectionKey || 'ecosystem', db ?? {});
}

describe('ERP provider tenant config isolation', () => {
  test('selects ecosystem external_db config from the active runtime tenant', async () => {
    const vista = runWithTenant('vistaseeds', providerForActiveTenant);
    const bereket = runWithTenant('bereketfide', providerForActiveTenant);

    expect(vista?.constructor.name).toBe('EcosystemSourceProvider');
    expect(bereket?.constructor.name).toBe('EcosystemSourceProvider');
    expect((vista as unknown as { connectionKey: string }).connectionKey).toBe('vistaseeds');
    expect((bereket as unknown as { connectionKey: string }).connectionKey).toBe('bereketfide');
    expect((vista as unknown as { config: { database: string } }).config.database).toBe('vistaseed');
    expect((bereket as unknown as { config: { database: string } }).config.database).toBe('bereketfide');
  });
});
