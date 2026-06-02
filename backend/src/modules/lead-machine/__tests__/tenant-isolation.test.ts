import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const env = { TENANT_KEY: 'avrasya', PUBLIC_URL: 'http://localhost:8086' };

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env }));

const leadDb = await import('../_shared/db');
const icpRepo = await import('../icp/icp.repository');

beforeEach(() => {
  dbMock.reset();
  env.TENANT_KEY = 'avrasya';
});

afterEach(() => {
  env.TENANT_KEY = 'avrasya';
});

function jobRow(id: string) {
  return {
    id,
    channel: 'amazon',
    status: 'pending',
    icp_id: null,
    params: '{"keyword":"paspas"}',
    result_count: 0,
    error_msg: null,
    created_by: null,
    created_at: '2026-06-02',
    started_at: null,
    finished_at: null,
  };
}

describe('tenant isolation', () => {
  test('lead-machine reads and writes use the active tenant key', async () => {
    dbMock.queuePoolExecute([jobRow('avrasya-job')]);
    await leadDb.createSearchJob('amazon', { keyword: 'paspas' });
    expect(dbMock.poolExecutions[0]?.values).toEqual([
      expect.any(String),
      'avrasya',
      'amazon',
      'pending',
      null,
      '{"keyword":"paspas"}',
      null,
    ]);
    expect(dbMock.poolExecutions[1]?.values).toEqual(['avrasya', expect.any(String)]);

    env.TENANT_KEY = 'tarvista';
    dbMock.queuePoolExecute([jobRow('tarvista-job')]);
    await leadDb.getSearchJob('same-id');
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['tarvista', 'same-id']);
  });

  test('icp repository queries never omit tenant_key', async () => {
    env.TENANT_KEY = 'tarvista';
    dbMock.queuePoolExecute([]);

    await icpRepo.listIcpProfiles();
    expect(dbMock.poolExecutions[0]?.sql).toContain('tenant_key = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tarvista']);
  });
});
