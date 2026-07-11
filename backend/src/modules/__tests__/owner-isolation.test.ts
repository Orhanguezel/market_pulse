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

/**
 * Kullanici (owner-scope) request'i. lead-machine `leadMachineScope`, market/crm
 * `ownerScope` bayragini okur; ikisi de saglanir ki test gercek route kaydini temsil etsin
 * (route kaydi bu bayraklari guard.config'e koyar; req.url'e ASLA bakilmaz).
 */
function userReq(url: string, extra: Record<string, unknown> = {}) {
  return {
    url,
    routeOptions: { config: { leadMachineScope: 'user' as const, ownerScope: 'user' as const } },
    ...extra,
  };
}

describe('same-tenant owner isolation', () => {
  test('lead candidates list is scoped to the active user inside the same tenant', async () => {
    dbMock.queuePoolExecute([]);
    dbMock.queuePoolExecute([{ count: 0 }]);

    await runWithTenantAndUser('tenant-a', 'user-1', () =>
      leadController.listLeadCandidates(
        userReq('/lead-machine/candidates', { query: { limit: 25 } }) as never,
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
        userReq('/lead-machine/candidates', { query: { limit: 25 } }) as never,
        reply() as never,
      ));

    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-2']);
  });

  // registerOutreachUser guard'i leadMachineScope tasimazsa listDrafts owner filtresini
  // dusuruyor ve kullanici ayni tenant'taki baskalarinin taslaklarini goruyordu.
  test('outreach draft list is scoped to the active user inside the same tenant', async () => {
    dbMock.queuePoolExecute([]);

    await runWithTenantAndUser('tenant-a', 'user-1', () =>
      leadController.listDrafts(
        userReq('/lead-machine/outreach/drafts', { query: {} }) as never,
        reply() as never,
      ));

    expect(dbMock.poolExecutions[0]?.sql).toContain('owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toContain('user-1');
  });

  test('outreach campaign list is scoped to the active user inside the same tenant', async () => {
    dbMock.queuePoolExecute([]);

    await runWithTenantAndUser('tenant-a', 'user-1', () =>
      campaignController.listOutreachCampaigns(userReq('/lead-machine/outreach/campaigns') as never, reply() as never));

    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-1']);

    dbMock.reset();
    dbMock.queuePoolExecute([]);

    await runWithTenantAndUser('tenant-a', 'user-2', () =>
      campaignController.listOutreachCampaigns(userReq('/lead-machine/outreach/campaigns') as never, reply() as never));

    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-2']);
  });

  test('CRM account list is scoped to the active user inside the same tenant', async () => {
    dbMock.queuePoolExecute([]);

    await runWithTenantAndUser('tenant-a', 'user-1', () =>
      crmController.listAccountsHandler(
        userReq('/crm/accounts', { query: { limit: 50, offset: 0 } }) as never,
        reply() as never,
      ));

    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-1']);

    dbMock.reset();
    dbMock.queuePoolExecute([]);

    await runWithTenantAndUser('tenant-a', 'user-2', () =>
      crmController.listAccountsHandler(
        userReq('/crm/accounts', { query: { limit: 50, offset: 0 } }) as never,
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
        userReq('/lead-machine/candidates', { ...superAdminReq, query: { limit: 25 } }) as never,
        reply() as never,
      ));
    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'super-admin-1']);

    dbMock.reset();
    dbMock.queuePoolExecute([]);
    await runWithTenantAndUser('tenant-a', 'super-admin-1', () =>
      campaignController.listOutreachCampaigns(
        userReq('/lead-machine/outreach/campaigns', { ...superAdminReq }) as never,
        reply() as never,
      ));
    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'super-admin-1']);

    dbMock.reset();
    dbMock.queuePoolExecute([]);
    await runWithTenantAndUser('tenant-a', 'super-admin-1', () =>
      crmController.listAccountsHandler(
        userReq('/crm/accounts', { ...superAdminReq, query: { limit: 50, offset: 0 } }) as never,
        reply() as never,
      ));
    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'super-admin-1']);
  });
});
