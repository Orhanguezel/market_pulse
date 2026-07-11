import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({ db: dbMock.db, pool: dbMock.pool }));
mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'default' } }));

const quota = await import('../quota.repository');
const { runWithTenant } = await import('@/core/tenant-context');

beforeEach(() => dbMock.reset());

describe('quota plan resolution', () => {
  test('uses active user plan override first', async () => {
    dbMock.queuePoolExecute([{ plan_code: 'starter' }]);

    const plan = await runWithTenant('gzltek', () => quota.getUserPlan('user-1'));

    expect(plan).toBe('starter');
    expect(dbMock.poolExecutions).toHaveLength(1);
  });

  test('falls back to the tenant plan when user override is absent', async () => {
    dbMock.queuePoolExecute([]);
    dbMock.queuePoolExecute([{ plan: 'agency' }]);

    const plan = await runWithTenant('gzltek', () => quota.getUserPlan('user-1'));

    expect(plan).toBe('agency');
    expect(dbMock.poolExecutions[1]?.values).toEqual(['gzltek', 'active']);
  });
});
