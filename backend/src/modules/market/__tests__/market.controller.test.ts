import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from './helpers/mock-db';
import { callHandler } from './helpers/reply';

const dbMock = createDbMock();
const commandRunnerMock = mock(async (_command: string) => ({ stdout: '3 pass\n0 fail\n', stderr: '' }));

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('../external/paspas.repository', () => ({
  getCustomerOrders: mock(() => Promise.resolve([])),
  getPaspasCustomers: mock(() => Promise.resolve([])),
  getPaspasProducts: mock(() => Promise.resolve([])),
}));

mock.module('../external/paspas.sync', () => ({
  syncPaspasCustomersToTargets: mock(() => Promise.resolve({ inserted: 1, updated: 2, total: 3 })),
}));

const controller = await import('../controller');

const now = new Date('2026-05-08T10:00:00Z');

function target(overrides: Record<string, unknown> = {}) {
  return {
    id: 'target-1',
    name: 'Alpha Dealer',
    category: 'dealer',
    status: 'active',
    website: 'https://alpha.example',
    phone: null,
    email: null,
    contact_name: null,
    city: 'Istanbul',
    district: null,
    instagram_url: null,
    google_maps_url: null,
    notes: null,
    churn_risk_score: '12.5',
    last_seen_at: null,
    paspas_customer_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    name: 'Beta Lead',
    category: 'retail',
    source: 'manual',
    status: 'new',
    priority: 'medium',
    score: '6.5',
    website: null,
    phone: null,
    email: null,
    contact_name: null,
    city: null,
    district: null,
    notes: null,
    assigned_to: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function signal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'signal-1',
    target_id: 'target-1',
    lead_id: null,
    signal_type: 'manual',
    severity: 'high',
    title: 'Price changed',
    description: null,
    source_url: null,
    is_reviewed: 0,
    reviewed_at: null,
    created_at: now,
    ...overrides,
  };
}

function testRun(overrides: Record<string, unknown> = {}) {
  return {
    id: 'run-1',
    suite: 'admin',
    title: 'Admin tests',
    command: 'cd admin_panel && bun test',
    status: 'passed',
    pass_count: 18,
    fail_count: 0,
    skip_count: 0,
    output_excerpt: '18 pass',
    risk_note: null,
    created_by: 'user-1',
    created_at: now,
    ...overrides,
  };
}

function developerNote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'note-1',
    subject: 'Build issue',
    body: 'Google Fonts needs network access.',
    priority: 'high',
    status: 'open',
    page_path: '/admin/market',
    attachment_url: null,
    created_by: 'user-1',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

beforeEach(() => {
  dbMock.reset();
  commandRunnerMock.mockClear();
  controller.setMarketTestCommandRunnerForTests(commandRunnerMock);
});

describe('market controller targets', () => {
  test('lists targets with total count header', async () => {
    dbMock.queueSelect([target()]);
    dbMock.queueSelect([{ count: 1 }]);

    const { result, state } = await callHandler(controller.listTargets, {
      query: { q: 'Alpha', category: 'dealer', status: 'active', limit: '25', offset: '0' },
    });

    expect(state.headers['x-total-count']).toBe('1');
    expect(result).toEqual([
      expect.objectContaining({
        id: 'target-1',
        name: 'Alpha Dealer',
        contactName: null,
        churnRiskScore: 12.5,
      }),
    ]);
  });

  test('rejects invalid target query', async () => {
    const { state } = await callHandler(controller.listTargets, {
      query: { limit: '0' },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual(expect.objectContaining({
      error: expect.objectContaining({ message: 'invalid_query' }),
    }));
  });

  test('creates a target', async () => {
    dbMock.queueSelect([target({ name: 'Created Target' })]);

    const { state } = await callHandler(controller.createTarget, {
      body: { name: 'Created Target', website: 'https://created.example' },
    });

    expect(state.statusCode).toBe(201);
    expect(dbMock.inserts).toHaveLength(1);
    expect(dbMock.inserts[0]?.values).toEqual(expect.objectContaining({
      name: 'Created Target',
      website: 'https://created.example',
    }));
    expect(state.payload).toEqual(expect.objectContaining({ name: 'Created Target' }));
  });

  test('returns 404 for missing target', async () => {
    dbMock.queueSelect([]);

    const { state } = await callHandler(controller.getTarget, {
      params: { id: 'missing' },
    });

    expect(state.statusCode).toBe(404);
    expect(state.payload).toEqual({ error: { message: 'not_found' } });
  });

  test('updates a target', async () => {
    dbMock.queueSelect([target({ status: 'paused' })]);

    const { result } = await callHandler(controller.updateTarget, {
      params: { id: 'target-1' },
      body: { status: 'paused' },
    });

    expect(dbMock.updates[0]?.patch).toEqual({ status: 'paused' });
    expect(result).toEqual(expect.objectContaining({ status: 'paused' }));
  });

  test('deletes a target with 204', async () => {
    const { state } = await callHandler(controller.deleteTarget, {
      params: { id: 'target-1' },
    });

    expect(state.statusCode).toBe(204);
    expect(dbMock.deletes).toHaveLength(1);
  });
});

describe('market controller leads', () => {
  test('lists leads with filters and total count', async () => {
    dbMock.queueSelect([lead()]);
    dbMock.queueSelect([{ count: 1 }]);

    const { result, state } = await callHandler(controller.listLeads, {
      query: { q: 'Beta', status: 'new', priority: 'medium', source: 'manual' },
    });

    expect(state.headers['x-total-count']).toBe('1');
    expect(result).toEqual([expect.objectContaining({ id: 'lead-1', score: 6.5 })]);
  });

  test('creates a lead', async () => {
    dbMock.queueSelect([lead({ name: 'Created Lead' })]);

    const { state } = await callHandler(controller.createLead, {
      body: { name: 'Created Lead', email: 'lead@example.com' },
    });

    expect(state.statusCode).toBe(201);
    expect(dbMock.inserts[0]?.values).toEqual(expect.objectContaining({
      name: 'Created Lead',
      email: 'lead@example.com',
    }));
  });

  test('rejects invalid lead body', async () => {
    const { state } = await callHandler(controller.createLead, {
      body: { name: '', email: 'invalid' },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual(expect.objectContaining({
      error: expect.objectContaining({ message: 'invalid_body' }),
    }));
  });

  test('returns 404 for missing lead update', async () => {
    dbMock.queueSelect([]);

    const { state } = await callHandler(controller.updateLead, {
      params: { id: 'missing' },
      body: { status: 'won' },
    });

    expect(state.statusCode).toBe(404);
  });

  test('deletes a lead with 204', async () => {
    const { state } = await callHandler(controller.deleteLead, {
      params: { id: 'lead-1' },
    });

    expect(state.statusCode).toBe(204);
  });
});

describe('market controller signals and stats', () => {
  test('lists signals with total count', async () => {
    dbMock.queueSelect([signal()]);
    dbMock.queueSelect([{ count: 1 }]);

    const { result, state } = await callHandler(controller.listSignals, {
      query: { target_id: 'target-1', severity: 'high', is_reviewed: false },
    });

    expect(state.headers['x-total-count']).toBe('1');
    expect(result).toEqual([expect.objectContaining({
      id: 'signal-1',
      isReviewed: false,
      targetId: 'target-1',
    })]);
  });

  test('creates a signal', async () => {
    dbMock.queueSelect([signal({ title: 'Manual signal' })]);

    const { state } = await callHandler(controller.createSignal, {
      body: { target_id: 'target-1', severity: 'medium', title: 'Manual signal' },
    });

    expect(state.statusCode).toBe(201);
    expect(dbMock.inserts[0]?.values).toEqual(expect.objectContaining({
      target_id: 'target-1',
      severity: 'medium',
      title: 'Manual signal',
    }));
  });

  test('reviews a signal', async () => {
    dbMock.queueSelect([signal({ is_reviewed: 1, reviewed_at: now })]);

    const { result } = await callHandler(controller.reviewSignal, {
      params: { id: 'signal-1' },
    });

    expect(dbMock.updates[0]?.patch).toEqual(expect.objectContaining({ is_reviewed: 1 }));
    expect(result).toEqual(expect.objectContaining({ isReviewed: true, reviewedAt: now }));
  });

  test('returns market stats', async () => {
    dbMock.queueSelect([{ count: 5 }]);
    dbMock.queueSelect([{ count: 3 }]);
    dbMock.queueSelect([{ count: 2 }]);

    const { result } = await callHandler(controller.getMarketStats, {});

    expect(result).toEqual({
      totalTargets: 5,
      totalLeads: 3,
      pendingSignals: 2,
    });
  });
});

describe('market controller operations', () => {
  test('lists market test runs with total count', async () => {
    dbMock.queueSelect([testRun()]);
    dbMock.queueSelect([{ count: 1 }]);

    const { result, state } = await callHandler(controller.listMarketTestRuns, {
      query: { suite: 'admin', status: 'passed' },
    });

    expect(state.headers['x-total-count']).toBe('1');
    expect(result).toEqual([expect.objectContaining({
      id: 'run-1',
      passCount: 18,
      outputExcerpt: '18 pass',
    })]);
  });

  test('creates a market test run', async () => {
    dbMock.queueSelect([testRun({ title: 'Backend tests' })]);

    const { state } = await callHandler(controller.createMarketTestRun, {
      user: { id: 'user-1' },
      body: {
        suite: 'backend',
        title: 'Backend tests',
        command: 'cd backend && bun test',
        status: 'passed',
        pass_count: 110,
      },
    });

    expect(state.statusCode).toBe(201);
    expect(dbMock.inserts[0]?.values).toEqual(expect.objectContaining({
      suite: 'backend',
      title: 'Backend tests',
      created_by: 'user-1',
    }));
  });

  test('rejects invalid market test run body', async () => {
    const { state } = await callHandler(controller.createMarketTestRun, {
      body: { suite: '', title: '' },
    });

    expect(state.statusCode).toBe(400);
  });

  test('executes allowed market test command and stores parsed output', async () => {
    dbMock.queueSelect([testRun({
      suite: 'backend',
      title: 'Backend tests',
      command: 'cd backend && bun test',
      pass_count: 3,
      output_excerpt: '3 pass\n0 fail',
    })]);

    const { state } = await callHandler(controller.executeMarketTestRun, {
      user: { id: 'user-1' },
      body: {
        suite: 'backend',
        title: 'Backend tests',
        command: 'cd backend && bun test',
      },
    });

    expect(state.statusCode).toBe(201);
    expect(commandRunnerMock).toHaveBeenCalledWith('cd backend && bun test');
    expect(dbMock.inserts[0]?.values).toEqual(expect.objectContaining({
      suite: 'backend',
      title: 'Backend tests',
      command: 'cd backend && bun test',
      status: 'passed',
      pass_count: 3,
      fail_count: 0,
      created_by: 'user-1',
    }));
  });

  test('rejects unsafe market test command execution', async () => {
    const { state } = await callHandler(controller.executeMarketTestRun, {
      body: {
        suite: 'backend',
        title: 'Unsafe',
        command: 'rm -rf /tmp/market-pulse',
      },
    });

    expect(state.statusCode).toBe(400);
    expect(state.payload).toEqual({ error: { message: 'unsafe_command' } });
  });

  test('lists developer notes with total count', async () => {
    dbMock.queueSelect([developerNote()]);
    dbMock.queueSelect([{ count: 1 }]);

    const { result, state } = await callHandler(controller.listMarketDeveloperNotes, {
      query: { status: 'open', priority: 'high' },
    });

    expect(state.headers['x-total-count']).toBe('1');
    expect(result).toEqual([expect.objectContaining({
      id: 'note-1',
      pagePath: '/admin/market',
    })]);
  });

  test('creates, updates and deletes developer notes', async () => {
    dbMock.queueSelect([developerNote({ subject: 'New note', attachment_url: 'https://cdn.example.com/screenshot.png' })]);

    const created = await callHandler(controller.createMarketDeveloperNote, {
      user: { id: 'user-1' },
      body: {
        subject: 'New note',
        body: 'Details',
        priority: 'critical',
        page_path: '/admin/market',
        attachment_url: 'https://cdn.example.com/screenshot.png',
      },
    });

    expect(created.state.statusCode).toBe(201);
    expect(created.result).toEqual(expect.objectContaining({
      attachmentUrl: 'https://cdn.example.com/screenshot.png',
    }));
    expect(dbMock.inserts[0]?.values).toEqual(expect.objectContaining({
      subject: 'New note',
      priority: 'critical',
      attachment_url: 'https://cdn.example.com/screenshot.png',
      created_by: 'user-1',
    }));

    dbMock.queueSelect([developerNote({ status: 'resolved' })]);
    const updated = await callHandler(controller.updateMarketDeveloperNote, {
      params: { id: 'note-1' },
      body: { status: 'resolved' },
    });

    expect(updated.result).toEqual(expect.objectContaining({ status: 'resolved' }));
    expect(dbMock.updates[0]?.patch).toEqual({ status: 'resolved' });

    const deleted = await callHandler(controller.deleteMarketDeveloperNote, {
      params: { id: 'note-1' },
    });
    expect(deleted.state.statusCode).toBe(204);
  });
});
