import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'tenant-a' } }));

const leadController = await import('../lead-machine/controller');
const campaignController = await import('../lead-machine/campaign/campaign.controller');
const crmController = await import('../crm/controller');
const { runWithTenantAndUser } = await import('@/core/tenant-context');

beforeEach(() => {
  dbMock.reset();
});

function reply() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    header(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
    code(status: number) {
      this.statusCode = status;
      return this;
    },
    send(payload: unknown) {
      return payload;
    },
  };
}

describe('same-tenant owner isolation', () => {
  test('lead candidates list is scoped to the active user inside the same tenant', async () => {
    dbMock.queuePoolExecute([]);
    dbMock.queuePoolExecute([{ count: 0 }]);

    await runWithTenantAndUser('tenant-a', 'user-1', () =>
      leadController.listLeadCandidates(
        { url: '/lead-machine/candidates', query: { limit: 25 } } as never,
        reply() as never,
      ));

    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-1']);
    expect(dbMock.poolExecutions[1]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[1]?.values).toEqual(['tenant-a', 'user-1']);

    dbMock.reset();
    dbMock.queuePoolExecute([]);
    dbMock.queuePoolExecute([{ count: 0 }]);

    await runWithTenantAndUser('tenant-a', 'user-2', () =>
      leadController.listLeadCandidates(
        { url: '/lead-machine/candidates', query: { limit: 25 } } as never,
        reply() as never,
      ));

    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-2']);
  });

  test('outreach campaign list is scoped to the active user inside the same tenant', async () => {
    dbMock.queuePoolExecute([]);

    await runWithTenantAndUser('tenant-a', 'user-1', () =>
      campaignController.listOutreachCampaigns({ url: '/lead-machine/outreach/campaigns' } as never, reply() as never));

    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-1']);

    dbMock.reset();
    dbMock.queuePoolExecute([]);

    await runWithTenantAndUser('tenant-a', 'user-2', () =>
      campaignController.listOutreachCampaigns({ url: '/lead-machine/outreach/campaigns' } as never, reply() as never));

    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-2']);
  });

  test('CRM account list is scoped to the active user inside the same tenant', async () => {
    dbMock.queuePoolExecute([]);

    await runWithTenantAndUser('tenant-a', 'user-1', () =>
      crmController.listAccountsHandler(
        { url: '/crm/accounts', query: { limit: 50, offset: 0 } } as never,
        reply() as never,
      ));

    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-1']);

    dbMock.reset();
    dbMock.queuePoolExecute([]);

    await runWithTenantAndUser('tenant-a', 'user-2', () =>
      crmController.listAccountsHandler(
        { url: '/crm/accounts', query: { limit: 50, offset: 0 } } as never,
        reply() as never,
      ));

    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-2']);
  });
});

describe('super-admin user-route owner isolation', () => {
  test('isSuperAdmin does not remove owner filter from user-facing lead, campaign and CRM endpoints', async () => {
    const superAdminReq = { user: { isSuperAdmin: true, role: 'admin' } };

    dbMock.queuePoolExecute([]);
    dbMock.queuePoolExecute([{ count: 0 }]);
    await runWithTenantAndUser('tenant-a', 'super-admin-1', () =>
      leadController.listLeadCandidates(
        { ...superAdminReq, url: '/lead-machine/candidates', query: { limit: 25 } } as never,
        reply() as never,
      ));
    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'super-admin-1']);

    dbMock.reset();
    dbMock.queuePoolExecute([]);
    await runWithTenantAndUser('tenant-a', 'super-admin-1', () =>
      campaignController.listOutreachCampaigns(
        { ...superAdminReq, url: '/lead-machine/outreach/campaigns' } as never,
        reply() as never,
      ));
    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'super-admin-1']);

    dbMock.reset();
    dbMock.queuePoolExecute([]);
    await runWithTenantAndUser('tenant-a', 'super-admin-1', () =>
      crmController.listAccountsHandler(
        { ...superAdminReq, url: '/crm/accounts', query: { limit: 50, offset: 0 } } as never,
        reply() as never,
      ));
    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'super-admin-1']);
  });
});
