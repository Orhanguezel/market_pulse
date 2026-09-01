import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const env = { TENANT_KEY: 'avrasya', PUBLIC_URL: 'http://localhost:8086' };

const enqueueBulkRecipientEmails = mock((_tenantKey: string, _listId: string, recipients: unknown[]) => Promise.resolve({ queued: recipients.length }));
const assertMailQueueAvailable = mock(() => undefined);

mock.module('@/db/client', () => ({ db: dbMock.db, pool: dbMock.pool }));
mock.module('@/core/env', () => ({ env }));
mock.module('../mail-queue', () => ({ assertMailQueueAvailable, enqueueBulkRecipientEmails }));

const service = await import('../bulk-list.service');

beforeEach(() => {
  dbMock.reset();
  enqueueBulkRecipientEmails.mockClear();
  assertMailQueueAvailable.mockClear();
  enqueueBulkRecipientEmails.mockImplementation((_tenantKey: string, _listId: string, recipients: unknown[]) => Promise.resolve({ queued: recipients.length }));
  env.TENANT_KEY = 'avrasya';
});

describe('substitutePlaceholders', () => {
  test('substitutes name/company/country', () => {
    const out = service.substitutePlaceholders('Merhaba {{name}}, {{company}} ({{country}})', {
      name: 'Alice', company: 'ACME', country: 'DE',
    });
    expect(out).toBe('Merhaba Alice, ACME (DE)');
  });

  test('missing variables become empty string', () => {
    expect(service.substitutePlaceholders('Hi {{name}}{{missing}}', { name: 'Bob' })).toBe('Hi Bob');
  });

  test('tolerates internal whitespace in tokens', () => {
    expect(service.substitutePlaceholders('{{ name }}', { name: 'X' })).toBe('X');
  });
});

describe('generateDraftsFromList', () => {
  test('creates channel-agnostic drafts with recipient fields and substituted templates', async () => {
    // getList → list row
    dbMock.queuePoolExecute([{ id: 'list-1', tenant_key: 'avrasya', campaign_id: 'camp-9', name: 'L', source: 'csv', status: 'ready', total_count: 2, sent_count: 0 }]);
    // listRecipients (pending) → 2 recipients
    dbMock.queuePoolExecute([
      { id: 'r1', tenant_key: 'avrasya', list_id: 'list-1', email: 'alice@example.com', name: 'Alice', company: 'ACME', country: 'DE', custom_fields: null, status: 'pending', draft_id: null },
      { id: 'r2', tenant_key: 'avrasya', list_id: 'list-1', email: 'bob@example.com', name: 'Bob', company: 'Globex', country: 'TR', custom_fields: null, status: 'pending', draft_id: null },
    ]);

    const result = await service.generateDraftsFromList('avrasya', 'list-1', {
      subjectTemplate: 'Merhaba {{name}}',
      bodyTemplate: '{{company}} için teklifimiz',
    });

    expect(result.generated).toBe(2);
    expect(result.draftIds).toHaveLength(2);

    const inserts = dbMock.poolExecutions.filter(e => /INSERT INTO lead_outreach_drafts/i.test(e.sql));
    expect(inserts).toHaveLength(2);

    // values: [id, tenant, owner, campaign, listId, email, name, subject, body]
    const v0 = inserts[0].values!;
    expect(v0[1]).toBe('avrasya');         // tenant
    expect(v0[2]).toBeNull();              // owner_user_id
    expect(v0[3]).toBe('camp-9');          // campaign_id from list
    expect(v0[4]).toBe('list-1');          // recipient_list_id
    expect(v0[5]).toBe('alice@example.com'); // recipient_email
    expect(v0[6]).toBe('Alice');           // recipient_name
    expect(v0[7]).toBe('Merhaba Alice');   // subject substituted
    expect(v0[8]).toBe('ACME için teklifimiz'); // body substituted

    // candidate_id / market_lead_id are hard-coded NULL in SQL (channel-agnostic)
    expect(inserts[0].sql).toContain('NULL, NULL');
  });

  test('throws when list is missing', async () => {
    dbMock.queuePoolExecute([]); // getList → none
    await expect(service.generateDraftsFromList('avrasya', 'nope', { subjectTemplate: 's', bodyTemplate: 'b' }))
      .rejects.toThrow('LIST_NOT_FOUND');
  });
});

describe('tenant isolation', () => {
  test('getList query is scoped by the active tenant key', async () => {
    env.TENANT_KEY = 'tarvista';
    dbMock.queuePoolExecute([]); // getList
    await expect(service.generateDraftsFromList('tarvista', 'list-x', { subjectTemplate: 's', bodyTemplate: 'b' }))
      .rejects.toThrow('LIST_NOT_FOUND');
    const exec = dbMock.poolExecutions[0];
    expect(exec.sql).toContain('tenant_key = ?');
    expect(exec.values).toEqual(['tarvista', 'list-x']);
  });
});

describe('sendList — persistent queue', () => {
  test('queues drafted recipients and marks invalid rows as bounced', async () => {
    // getList
    dbMock.queuePoolExecute([{ id: 'list-1', tenant_key: 'avrasya', campaign_id: null, name: 'L', source: 'csv', status: 'ready', total_count: 2, sent_count: 0 }]);
    // listRecipients (drafted)
    dbMock.queuePoolExecute([
      { id: 'r1', tenant_key: 'avrasya', list_id: 'list-1', email: 'ok@example.com', name: null, company: null, country: null, custom_fields: null, status: 'drafted', draft_id: 'd1' },
      { id: 'r2', tenant_key: 'avrasya', list_id: 'list-1', email: '', name: null, company: null, country: null, custom_fields: null, status: 'drafted', draft_id: 'd2' },
    ]);

    const result = await service.sendList('avrasya', 'list-1', { ratePerMinute: 6000 });
    expect(result.queued).toBe(true);
    expect(result.queuedCount).toBe(1);
    expect(result.bounced).toBe(1);
    expect(result.total).toBe(2);
    expect(result.ratePerMinute).toBe(6000);
    expect(enqueueBulkRecipientEmails).toHaveBeenCalledTimes(1);
    expect(enqueueBulkRecipientEmails.mock.calls[0][0]).toBe('avrasya');
    expect(enqueueBulkRecipientEmails.mock.calls[0][1]).toBe('list-1');
    expect(enqueueBulkRecipientEmails.mock.calls[0][2]).toHaveLength(1);
  });
});
