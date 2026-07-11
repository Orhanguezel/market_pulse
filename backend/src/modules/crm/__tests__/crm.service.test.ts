import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '@/modules/market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'tenant-a' } }));

const accounts = await import('../accounts.service');
const convert = await import('../convert.service');
const dashboard = await import('../dashboard.service');
const businessRecords = await import('../business-records.service');
const insights = await import('../insights.service');
const { runWithTenant, runWithTenantAndUser } = await import('@/core/tenant-context');

beforeEach(() => {
  dbMock.reset();
});

describe('crm accounts service', () => {
  test('creates accounts with the active tenant key', async () => {
    dbMock.queuePoolExecute([{
      id: 'account-1',
      tenant_key: 'tenant-a',
      name: 'Acme',
      raw_data: '{"source":"manual"}',
    }]);

    const result = await runWithTenantAndUser(
      'tenant-a',
      'user-1',
      () => accounts.createAccount({ name: 'Acme', raw_data: { source: 'manual' } }),
    );

    expect(dbMock.poolExecutions[0]?.sql).toStartWith('INSERT INTO crm_accounts');
    expect(dbMock.poolExecutions[0]?.values?.slice(0, 4)).toEqual([
      expect.any(String),
      'tenant-a',
      'Acme',
      null,
    ]);
    expect(dbMock.poolExecutions[0]?.values?.[10]).toBe('user-1');
    expect(result).toEqual(expect.objectContaining({ id: 'account-1', raw_data: { source: 'manual' } }));
  });
});

describe('crm lead conversion service', () => {
  test('converts an approved lead candidate into account, contact and deal', async () => {
    dbMock.queuePoolExecute([{
      id: 'candidate-1',
      name: 'Buyer Co',
      website: 'https://buyer.example',
      country: 'DE',
      city: 'Berlin',
      phone: '+49',
      email: 'buyer@example.com',
      contact_name: 'Ada Buyer',
      raw_data: '{"channel":"customs"}',
      ai_summary: 'Good customs fit',
    }]);
    dbMock.queuePoolExecute([{ id: 'account-1', name: 'Buyer Co', raw_data: '{}' }]);
    dbMock.queuePoolExecute([{ id: 'contact-1', first_name: 'Ada', last_name: 'Buyer' }]);
    dbMock.queuePoolExecute([{ id: 'pipeline-1' }]);
    dbMock.queuePoolExecute([{ id: 'stage-1' }]);
    dbMock.queuePoolExecute([{ id: 'deal-1', title: 'Buyer Co fırsatı', raw_data: '{}' }]);

    const result = await runWithTenantAndUser(
      'tenant-a',
      'user-1',
      () => convert.convertLeadCandidate({ candidate_id: 'candidate-1', owner_user_id: 'client-spoof' }),
    );

    expect(result).toEqual({
      account: expect.objectContaining({ id: 'account-1' }),
      contact: expect.objectContaining({ id: 'contact-1' }),
      deal: expect.objectContaining({ id: 'deal-1' }),
    });
    expect(dbMock.poolExecutions.some((entry) => entry.sql.startsWith('INSERT INTO crm_accounts'))).toBe(true);
    expect(dbMock.poolExecutions.some((entry) => entry.sql.startsWith('INSERT INTO crm_contacts'))).toBe(true);
    expect(dbMock.poolExecutions.some((entry) => entry.sql.startsWith('INSERT INTO crm_deals'))).toBe(true);
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'candidate-1']);
    expect(dbMock.poolExecutions.find((entry) => entry.sql.startsWith('INSERT INTO crm_accounts'))?.values?.[10]).toBe('user-1');
    expect(dbMock.poolExecutions.find((entry) => entry.sql.startsWith('INSERT INTO crm_contacts'))?.values?.[10]).toBe('user-1');
    expect(dbMock.poolExecutions.find((entry) => entry.sql.startsWith('INSERT INTO crm_deals'))?.values?.[10]).toBe('user-1');
  });
});

describe('crm dashboard summary service', () => {
  test('builds tenant-scoped dashboard counts and chart data', async () => {
    dbMock.queuePoolExecute([{ cnt: '2' }]);
    dbMock.queuePoolExecute([{ cnt: '3' }]);
    dbMock.queuePoolExecute([{ cnt: '4' }]);
    dbMock.queuePoolExecute([{ cnt: '1' }]);
    dbMock.queuePoolExecute([{ cnt: '5' }]);
    dbMock.queuePoolExecute([{ cnt: '6' }]);
    dbMock.queuePoolExecute([{ cnt: '1' }]);
    dbMock.queuePoolExecute([{ cnt: '2' }]);
    dbMock.queuePoolExecute([{ cnt: '3' }]);
    dbMock.queuePoolExecute([{ month: '2026-01', amount: '14000.50' }]);
    dbMock.queuePoolExecute([
      { done: 0, count: '5' },
      { done: 1, count: '7' },
    ]);
    dbMock.queuePoolExecute([{ id: 'activity-1', subject: 'Müşteriyi ara', related_name: 'Acme', due_at: '2026-07-12' }]);
    dbMock.queuePoolExecute([{ id: 'quote-1', title: 'İhracat teklifi', amount: '1200', currency: 'EUR' }]);
    dbMock.queuePoolExecute([{ id: 'deal-1', title: 'Dağıtıcı anlaşması', amount: '5000', currency: 'EUR' }]);
    dbMock.queuePoolExecute([{ id: 'account-1', name: 'Acme GmbH', country: 'DE' }]);

    const result = await runWithTenant('tenant-b', () => dashboard.getDashboardSummary());

    expect(result.counts).toEqual({
      accounts: 2,
      contacts: 3,
      deals_open: 4,
      deals_won: 1,
      activities_pending: 5,
      quotes: 1,
      orders: 2,
      leads: 6,
      reminders_scheduled: 3,
    });
    expect(result.pending).toEqual({ quotes: 1, open_deals: 4 });
    expect(result.sales_summary).toEqual([{ month: '2026-01', amount: 14000.5 }]);
    expect(result.team_breakdown).toEqual([
      { label: 'Açık Aktivite', count: 5 },
      { label: 'Tamamlanan Aktivite', count: 7 },
    ]);
    expect(result.status_breakdown).toContainEqual({ label: 'Planlı Hatırlatma', count: 3 });
    expect(result.totals.records).toBe(27);
    expect(result.upcoming_activities).toEqual([expect.objectContaining({ id: 'activity-1' })]);
    expect(result.recent_quotes).toEqual([expect.objectContaining({ id: 'quote-1' })]);
    expect(result.recent_deals).toEqual([expect.objectContaining({ id: 'deal-1' })]);
    expect(result.recent_accounts).toEqual([expect.objectContaining({ id: 'account-1' })]);
    expect(dbMock.poolExecutions).toHaveLength(15);
    expect(dbMock.poolExecutions.every((entry) => entry.values?.[0] === 'tenant-b')).toBe(true);
    expect(dbMock.poolExecutions.every((entry) => entry.sql.includes('tenant_key = ?'))).toBe(true);
  });

  test('creates reminders with tenant scope and default channel/status', async () => {
    dbMock.queuePoolExecute([{
      id: 'reminder-1',
      tenant_key: 'tenant-b',
      title: 'Teklifi ara',
      channel: 'in_app',
      status: 'scheduled',
      raw_data: '{"source":"manual"}',
    }]);

    const result = await runWithTenantAndUser('tenant-b', 'user-2', () =>
      businessRecords.createBusinessRecord('reminders', {
        title: 'Teklifi ara',
        remind_at: '2026-07-01 09:00:00',
        owner_user_id: 'client-spoof',
        created_by: 'client-spoof',
        raw_data: { source: 'manual' },
      }));

    expect(dbMock.poolExecutions[0]?.sql).toStartWith('INSERT INTO crm_reminders');
    expect(dbMock.poolExecutions[0]?.values?.slice(0, 9)).toEqual([
      expect.any(String),
      'tenant-b',
      null,
      null,
      'Teklifi ara',
      null,
      '2026-07-01 09:00:00',
      'in_app',
      'scheduled',
    ]);
    expect(dbMock.poolExecutions[0]?.values?.[9]).toBe('user-2');
    expect(dbMock.poolExecutions[0]?.values?.[10]).toBe('user-2');
    expect(result).toEqual(expect.objectContaining({ id: 'reminder-1', raw_data: { source: 'manual' } }));
  });
});

describe('crm business records service', () => {
  test('creates products with tenant scope and parses raw data', async () => {
    dbMock.queuePoolExecute([{
      id: 'product-1',
      tenant_key: 'tenant-b',
      name: 'Service Package',
      raw_data: '{"category":"consulting"}',
    }]);

    const result = await runWithTenantAndUser('tenant-b', 'user-2', () => businessRecords.createBusinessRecord('products', {
      name: 'Service Package',
      unit_price: 1200,
      raw_data: { category: 'consulting' },
    }));

    expect(dbMock.poolExecutions[0]?.sql).toStartWith('INSERT INTO crm_products');
    // owner_user_id INSERT'e yaziliyor (products artik owner-scoped).
    expect(dbMock.poolExecutions[0]?.values).toContain('user-2');
    expect(dbMock.poolExecutions[0]?.values?.slice(0, 6)).toEqual([
      expect.any(String),
      'tenant-b',
      null,
      'Service Package',
      null,
      1200,
    ]);
    expect(result).toEqual(expect.objectContaining({ id: 'product-1', raw_data: { category: 'consulting' } }));
  });

  test('lists quotes owner-scoped without accepting a client tenant key', async () => {
    dbMock.queuePoolExecute([{ id: 'quote-1', tenant_key: 'tenant-b', status: 'sent', raw_data: null }]);

    const result = await runWithTenantAndUser('tenant-b', 'user-2', () => businessRecords.listBusinessRecords('quotes', {
      limit: 50,
      offset: 0,
      status: 'sent',
    }));

    expect(dbMock.poolExecutions[0]?.sql).toContain('FROM crm_quotes');
    // Kisi-bazli izolasyon: quotes artik owner_user_id ile filtreleniyor.
    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-b', 'user-2', 'sent']);
    expect(result).toEqual([expect.objectContaining({ id: 'quote-1' })]);
  });

  test('gets a business record by active tenant and id', async () => {
    dbMock.queuePoolExecute([{ id: 'task-1', tenant_key: 'tenant-b', subject: 'Ara', raw_data: '{"source":"manual"}' }]);

    const result = await runWithTenantAndUser('tenant-b', 'user-2', () => businessRecords.getBusinessRecord('tasks', 'task-1'));

    expect(dbMock.poolExecutions[0]?.sql).toBe('SELECT * FROM crm_tasks WHERE tenant_key = ? AND id = ? AND owner_user_id = ? LIMIT 1');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-b', 'task-1', 'user-2']);
    expect(result).toEqual(expect.objectContaining({ id: 'task-1', raw_data: { source: 'manual' } }));
  });

  test('updates a business record with tenant scope', async () => {
    dbMock.queuePoolExecute([{ id: 'quote-1', tenant_key: 'tenant-b', title: 'Yeni teklif', raw_data: '{"version":2}' }]);

    const result = await runWithTenantAndUser('tenant-b', 'user-2', () => businessRecords.updateBusinessRecord('quotes', 'quote-1', {
      title: 'Yeni teklif',
      status: 'sent',
      raw_data: { version: 2 },
      // Sahiplik yeniden atama denemesi — SET'e ASLA girmemeli.
      owner_user_id: 'user-9',
    } as never));

    expect(dbMock.poolExecutions[0]?.sql).toContain('UPDATE crm_quotes SET');
    // owner_user_id filtreli WHERE (baskasinin kaydini guncellemeyi engeller).
    expect(dbMock.poolExecutions[0]?.sql).toContain('WHERE tenant_key = ? AND id = ? AND owner_user_id = ?');
    // SET clause owner_user_id ICERMEZ (reassignment engellendi).
    expect(dbMock.poolExecutions[0]?.sql).not.toContain('owner_user_id = ?,');
    expect(dbMock.poolExecutions[0]?.values).toEqual([
      'Yeni teklif',
      'sent',
      '{"version":2}',
      'tenant-b',
      'quote-1',
      'user-2',
    ]);
    expect(dbMock.poolExecutions[1]?.values).toEqual(['tenant-b', 'quote-1', 'user-2']);
    expect(result).toEqual(expect.objectContaining({ id: 'quote-1', raw_data: { version: 2 } }));
  });

  test('delete business record is owner-scoped (products)', async () => {
    await runWithTenantAndUser('tenant-b', 'user-2', () => businessRecords.deleteBusinessRecord('products', 'product-9'));
    expect(dbMock.poolExecutions[0]?.sql).toBe('DELETE FROM crm_products WHERE tenant_key = ? AND id = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-b', 'product-9', 'user-2']);
  });
});

describe('crm insights service', () => {
  test('builds tenant-scoped mail management summary', async () => {
    dbMock.queuePoolExecute([{ cnt: '2' }]);
    dbMock.queuePoolExecute([{ cnt: '10' }]);
    dbMock.queuePoolExecute([{ cnt: '4' }]);
    dbMock.queuePoolExecute([{ cnt: '6' }]);
    dbMock.queuePoolExecute([{ cnt: '3' }]);
    dbMock.queuePoolExecute([{ cnt: '1' }]);
    dbMock.queuePoolExecute([{ cnt: '5' }]);
    dbMock.queuePoolExecute([{ cnt: '8' }]);

    const result = await runWithTenant('tenant-b', () => insights.getMailSummary());

    expect(result).toEqual({
      campaigns_active: 2,
      drafts_total: 10,
      drafts_ready: 4,
      sent: 6,
      opened: 3,
      replied: 1,
      recipient_lists: 5,
      recipients_pending: 8,
      links: {
        drafts: '/lead-machine/outreach/drafts',
        campaigns: '/lead-machine/outreach/campaigns',
        lists: '/lead-machine/outreach/lists',
      },
    });
    expect(dbMock.poolExecutions).toHaveLength(8);
    expect(dbMock.poolExecutions.every((entry) => entry.values?.[0] === 'tenant-b')).toBe(true);
    expect(dbMock.poolExecutions.every((entry) => entry.sql.includes('tenant_key = ?'))).toBe(true);
  });

  test('builds tenant-scoped reports summary', async () => {
    dbMock.queuePoolExecute([{ cnt: '12' }]);
    dbMock.queuePoolExecute([{ cnt: '7' }]);
    dbMock.queuePoolExecute([{ cnt: '3' }]);
    dbMock.queuePoolExecute([{ cnt: '2' }]);
    dbMock.queuePoolExecute([{ cnt: '4' }]);
    dbMock.queuePoolExecute([{ cnt: '9' }]);

    const result = await runWithTenant('tenant-b', () => insights.getReportsSummary());

    expect(result).toEqual({
      weekly_report: {
        preview_url: '/market/reports/weekly/preview',
        send_url: '/market/reports/weekly/send',
        available: true,
      },
      counts: {
        targets_total: 12,
        active_leads: 7,
        pending_signals: 3,
        high_risk_targets: 2,
        weekly_high_signals: 4,
        market_test_runs: 9,
      },
    });
    expect(dbMock.poolExecutions).toHaveLength(6);
    expect(dbMock.poolExecutions.every((entry) => entry.values?.[0] === 'tenant-b')).toBe(true);
    expect(dbMock.poolExecutions.every((entry) => entry.sql.includes('tenant_key = ?'))).toBe(true);
  });

  test('builds tenant-scoped users summary', async () => {
    dbMock.queuePoolExecute([{ cnt: '5' }]);
    dbMock.queuePoolExecute([{ cnt: '4' }]);
    dbMock.queuePoolExecute([{ cnt: '1' }]);
    dbMock.queuePoolExecute([{ cnt: '2' }]);
    dbMock.queuePoolExecute([{ cnt: '3' }]);
    dbMock.queuePoolExecute([{ cnt: '4' }]);

    const result = await runWithTenant('tenant-b', () => insights.getUsersSummary());

    expect(result).toEqual({
      tenant_key: 'tenant-b',
      users_total: 5,
      active_users: 4,
      inactive_users: 1,
      tenant_admins: 2,
      tenant_editors: 3,
      verified_users: 4,
      links: {
        users: '/users',
      },
    });
    expect(dbMock.poolExecutions).toHaveLength(6);
    expect(dbMock.poolExecutions.every((entry) => entry.values?.[0] === 'tenant-b')).toBe(true);
    expect(dbMock.poolExecutions.every((entry) => entry.sql.includes('tenant_key = ?'))).toBe(true);
  });

  test('builds tenant-scoped business management summary', async () => {
    dbMock.queuePoolExecute([{
      tenant_key: 'tenant-b',
      name: 'Tenant B',
      locale: 'tr',
      status: 'active',
      plan: 'pro',
    }]);
    dbMock.queuePoolExecute([{ cnt: '7' }]);
    dbMock.queuePoolExecute([{ cnt: '4' }]);
    dbMock.queuePoolExecute([{ cnt: '1' }]);

    const result = await runWithTenant('tenant-b', () => insights.getBusinessSummary());

    expect(result).toEqual({
      tenant: {
        tenant_key: 'tenant-b',
        name: 'Tenant B',
        locale: 'tr',
        status: 'active',
        plan: 'pro',
      },
      counts: {
        tenant_settings: 7,
        active_modules: 4,
        suspended_modules: 1,
      },
      links: {
        settings: '/site-settings',
        modules: '/entitlements/me',
        theme: '/theme',
      },
    });
    expect(dbMock.poolExecutions).toHaveLength(4);
    expect(dbMock.poolExecutions.every((entry) => entry.values?.[0] === 'tenant-b')).toBe(true);
    expect(dbMock.poolExecutions.every((entry) => entry.sql.includes('tenant_key = ?'))).toBe(true);
  });
});
