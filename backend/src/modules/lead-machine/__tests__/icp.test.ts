import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'avrasya' } }));

const icpRepo = await import('../icp/icp.repository');
const { matchesIcp } = await import('../b2b/icp.matcher');

const now = '2026-05-08 10:00:00';

beforeEach(() => {
  dbMock.reset();
});

function profile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'icp-1',
    name: 'EU Distributor',
    is_active: 1,
    definition: '{"sectors":["automotive"],"firm_types":["distributor"]}',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('lead machine icp repository', () => {
  test('lists profiles and parses definition json', async () => {
    dbMock.queuePoolExecute([profile()]);

    const result = await icpRepo.listIcpProfiles();

    expect(result).toEqual([
      expect.objectContaining({
        id: 'icp-1',
        definition: { sectors: ['automotive'], firm_types: ['distributor'] },
      }),
    ]);
  });

  test('gets a profile by id', async () => {
    dbMock.queuePoolExecute([profile({ id: 'icp-2', definition: { sectors: ['retail'] } })]);

    const result = await icpRepo.getIcpProfile('icp-2');

    expect(dbMock.poolExecutions[0]?.values).toEqual(['avrasya', 'icp-2']);
    expect(result).toEqual(expect.objectContaining({
      id: 'icp-2',
      definition: { sectors: ['retail'] },
    }));
  });

  test('creates a profile with active default', async () => {
    dbMock.queuePoolExecute([profile({ name: 'Created ICP', definition: '{}' })]);

    const result = await icpRepo.createIcpProfile({
      name: 'Created ICP',
      definition: {},
    });

    expect(dbMock.poolExecutions[0]?.sql).toStartWith('INSERT INTO icp_profiles');
    expect(dbMock.poolExecutions[0]?.values).toEqual([
      expect.any(String),
      'avrasya',
      'Created ICP',
      1,
      '{}',
    ]);
    expect(result).toEqual(expect.objectContaining({ name: 'Created ICP', definition: {} }));
  });

  test('updates profile fields', async () => {
    dbMock.queuePoolExecute([profile({
      name: 'Updated ICP',
      is_active: 0,
      definition: '{"sectors":["floor mats"]}',
    })]);

    const result = await icpRepo.updateIcpProfile('icp-1', {
      name: 'Updated ICP',
      is_active: false,
      definition: { sectors: ['floor mats'] },
    });

    expect(dbMock.poolExecutions[0]?.sql).toContain('UPDATE icp_profiles SET name = ?, is_active = ?, definition = ? WHERE id = ? AND tenant_key = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual([
      'Updated ICP',
      0,
      '{"sectors":["floor mats"]}',
      'icp-1',
      'avrasya',
    ]);
    expect(result).toEqual(expect.objectContaining({
      name: 'Updated ICP',
      is_active: 0,
      definition: { sectors: ['floor mats'] },
    }));
  });

  test('returns current profile when update patch is empty', async () => {
    dbMock.queuePoolExecute([profile()]);

    const result = await icpRepo.updateIcpProfile('icp-1', {});

    expect(dbMock.poolExecutions[0]?.sql).toStartWith('SELECT * FROM icp_profiles');
    expect(result).toEqual(expect.objectContaining({ id: 'icp-1' }));
  });

  test('deletes a profile when it has no jobs', async () => {
    dbMock.queuePoolExecute([]);

    await icpRepo.deleteIcpProfile('icp-1');

    expect(dbMock.poolExecutions[0]?.sql).toStartWith('SELECT id FROM lead_search_jobs');
    expect(dbMock.poolExecutions[1]?.sql).toBe('DELETE FROM icp_profiles WHERE tenant_key = ? AND id = ?');
    expect(dbMock.poolExecutions[1]?.values).toEqual(['avrasya', 'icp-1']);
  });

  test('rejects deleting a profile that has jobs', async () => {
    dbMock.queuePoolExecute([{ id: 'job-1' }]);

    await expect(icpRepo.deleteIcpProfile('icp-1')).rejects.toMatchObject({
      message: 'ICP_HAS_JOBS',
      statusCode: 409,
    });
  });
});

describe('lead machine icp matcher', () => {
  test('matches and scores sector, firm type, website and phone', () => {
    const result = matchesIcp(
      {
        name: 'Automotive Distributor GmbH',
        description: 'Automotive floor mats distributor',
        website: 'https://dealer.example',
        phone: '+49',
      },
      {
        sectors: ['automotive'],
        firm_types: ['distributor'],
      },
    );

    expect(result).toEqual({
      matches: true,
      score: 8,
      reasons: ['sector:automotive', 'firm_type:distributor', 'website'],
    });
  });

  test('excludes countries and patterns', () => {
    expect(matchesIcp({ name: 'Good Co', country: 'CN' }, { exclude_countries: ['CN'] })).toEqual({
      matches: false,
      score: 0,
      reasons: ['excluded_country'],
    });

    expect(matchesIcp({ name: 'Dropship Only Co' }, { exclude_patterns: ['dropship'] })).toEqual({
      matches: false,
      score: 0,
      reasons: ['excluded_pattern:dropship'],
    });
  });

  test('does not match below minimum score', () => {
    expect(matchesIcp({ name: 'Unknown Co' }, { sectors: ['automotive'] })).toEqual({
      matches: false,
      score: 0,
      reasons: [],
    });
  });
});
