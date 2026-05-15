import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const askBestAvailable = mock(() => Promise.resolve('Subject: Numune görüşmesi\nBody: Merhaba, oto paspas tedariki için görüşelim.'));

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/modules/lead-machine/_shared/ai.client', () => ({
  askBestAvailable,
}));

const service = await import('../outreach/outreach.service');

beforeEach(() => {
  dbMock.reset();
  askBestAvailable.mockReset();
  askBestAvailable.mockImplementation(() => Promise.resolve('Subject: Numune görüşmesi\nBody: Merhaba, oto paspas tedariki için görüşelim.'));
});

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'candidate-1',
    job_id: 'job-1',
    channel: 'amazon',
    icp_id: null,
    status: 'pending',
    name: 'Seller A',
    website: 'https://seller.example',
    country: 'DE',
    city: null,
    phone: null,
    email: null,
    contact_name: null,
    raw_data: '{"product":"car mats"}',
    ai_summary: 'Fit complaints',
    lead_score: '8.0',
    reject_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-05-08 10:00:00',
    ...overrides,
  };
}

describe('lead machine outreach service', () => {
  test('throws when candidate is missing', async () => {
    dbMock.queuePoolExecute([]);

    await expect(service.generateOutreachEmail('missing')).rejects.toThrow('CANDIDATE_NOT_FOUND');
  });

  test('generates and inserts outreach draft from AI response', async () => {
    dbMock.queuePoolExecute([candidate()]);

    const result = await service.generateOutreachEmail('candidate-1');

    expect(askBestAvailable).toHaveBeenCalledWith(expect.stringContaining('Şirket: Seller A'), 'gpt-4o-mini');
    expect(dbMock.poolExecutions[1]?.sql).toStartWith('INSERT INTO lead_outreach_drafts');
    expect(dbMock.poolExecutions[1]?.values).toEqual([
      expect.any(String),
      'candidate-1',
      'Numune görüşmesi',
      'Merhaba, oto paspas tedariki için görüşelim.',
      'best_available',
    ]);
    expect(result).toEqual(expect.objectContaining({
      candidateId: 'candidate-1',
      subject: 'Numune görüşmesi',
      body: 'Merhaba, oto paspas tedariki için görüşelim.',
    }));
  });

  test('uses fallback subject when AI response has no subject', async () => {
    dbMock.queuePoolExecute([candidate()]);
    askBestAvailable.mockImplementation(() => Promise.resolve('Merhaba, görüşelim.'));

    const result = await service.generateOutreachEmail('candidate-1');

    expect(result.subject).toBe('Seller A için tedarik görüşmesi');
    expect(result.body).toBe('Merhaba, görüşelim.');
  });

  test('lists outreach drafts with candidate and market lead filters', async () => {
    dbMock.queuePoolExecute([{ id: 'draft-1', subject: 'S', body: 'B' }]);

    const result = await service.listOutreachDrafts('candidate-1', 'lead-1');

    expect(dbMock.poolExecutions[0]?.sql).toContain('WHERE candidate_id = ? AND market_lead_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['candidate-1', 'lead-1']);
    expect(result).toEqual([{ id: 'draft-1', subject: 'S', body: 'B' }]);
  });

  test('updates outreach draft fields', async () => {
    dbMock.queuePoolExecute([{ id: 'draft-1', subject: 'Updated', body: 'Body', status: 'sent' }]);

    const result = await service.updateOutreachDraft('draft-1', {
      subject: 'Updated',
      body: 'Body',
      status: 'sent',
    });

    expect(dbMock.poolExecutions[0]?.sql).toContain('UPDATE lead_outreach_drafts SET subject = ?, body = ?, status = ? WHERE id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['Updated', 'Body', 'sent', 'draft-1']);
    expect(result).toEqual({ id: 'draft-1', subject: 'Updated', body: 'Body', status: 'sent' });
  });

  test('returns null for empty outreach update patch', async () => {
    const result = await service.updateOutreachDraft('draft-1', {});

    expect(result).toBeNull();
    expect(dbMock.poolExecutions).toHaveLength(0);
  });
});
