import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();
const openingSentence = 'Wir haben Ihr Aftermarket-Programm in Deutschland gesehen und sehen klare Überschneidungen mit unserer Floor-Mat-Linie.';
const askBestAvailable = mock(() => Promise.resolve(openingSentence));
const sendMailRaw = mock(() => Promise.resolve());

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/modules/lead-machine/_shared/ai.client', () => ({
  askBestAvailable,
}));

mock.module('@/modules/mail', () => ({
  sendMailRaw,
}));

const service = await import('../outreach/outreach.service');

beforeEach(() => {
  dbMock.reset();
  askBestAvailable.mockReset();
  askBestAvailable.mockImplementation(() => Promise.resolve(openingSentence));
  sendMailRaw.mockReset();
  sendMailRaw.mockImplementation(() => Promise.resolve());
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
    dbMock.queuePoolExecute([]);

    const result = await service.generateOutreachEmail('candidate-1');

    const prompt = askBestAvailable.mock.calls[0]?.[0] as string;
    expect(prompt).toContain('Language: DE');
    expect(prompt).toContain('Name: Seller A');
    expect(prompt).toContain('Target country: Deutschland');
    expect(askBestAvailable).toHaveBeenCalledWith(expect.any(String), 'gpt-4o-mini');
    expect(dbMock.poolExecutions[2]?.sql).toStartWith('INSERT INTO lead_outreach_drafts');
    expect(dbMock.poolExecutions[2]?.values).toEqual([
      expect.any(String),
      'avrasya',
      'candidate-1',
      'Automechanika Frankfurt - 10 Min Termin? - Avrasya / ProMats',
      expect.stringContaining(openingSentence),
      'gpt-4o-mini',
    ]);
    expect(result).toEqual(expect.objectContaining({
      candidateId: 'candidate-1',
      subject: 'Automechanika Frankfurt - 10 Min Termin? - Avrasya / ProMats',
      body: expect.stringContaining('Hätten Sie 10 Minuten für einen Termin vor Ort?'),
    }));
    expect(result.body).toContain('{calendly_link}');
    expect(result.body).toContain('{gonderici_ad_soyad}');
  });

  test('uses template fallback opening when AI response is blank', async () => {
    dbMock.queuePoolExecute([candidate({ country: 'US' })]);
    dbMock.queuePoolExecute([]);
    askBestAvailable.mockImplementation(() => Promise.resolve(''));

    const result = await service.generateOutreachEmail('candidate-1');

    expect(result.subject).toBe('Automechanika Frankfurt - 10 min meeting? - Avrasya / ProMats');
    expect(result.body).toContain("We've seen your aftermarket programme covering the US market");
    expect(result.body).toContain('Would you have 10 minutes for an on-site meeting?');
  });

  test('lists outreach drafts with candidate and market lead filters', async () => {
    dbMock.queuePoolExecute([{ id: 'draft-1', subject: 'S', body: 'B' }]);

    const result = await service.listOutreachDrafts('candidate-1', 'lead-1');

    expect(dbMock.poolExecutions[0]?.sql).toContain('WHERE tenant_key = ? AND candidate_id = ? AND market_lead_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['avrasya', 'candidate-1', 'lead-1']);
    expect(result).toEqual([{ id: 'draft-1', subject: 'S', body: 'B' }]);
  });

  test('updates outreach draft fields', async () => {
    dbMock.queuePoolExecute([{ id: 'draft-1', subject: 'Updated', body: 'Body', status: 'sent' }]);

    const result = await service.updateOutreachDraft('draft-1', {
      subject: 'Updated',
      body: 'Body',
      status: 'sent',
    });

    expect(dbMock.poolExecutions[0]?.sql).toContain('UPDATE lead_outreach_drafts SET subject = ?, body = ?, status = ? WHERE id = ? AND tenant_key = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['Updated', 'Body', 'sent', 'draft-1', 'avrasya']);
    expect(result).toEqual({ id: 'draft-1', subject: 'Updated', body: 'Body', status: 'sent' });
  });

  test('sends outreach draft and marks it sent', async () => {
    const draft = {
      id: 'draft-1',
      candidate_id: 'candidate-1',
      market_lead_id: null,
      subject: 'Meeting',
      body: 'Hello\n\nCan we meet?',
      status: 'draft',
    };
    dbMock.queuePoolExecute([draft]);
    dbMock.queuePoolExecute([{ decision_maker: '{"email":"buyer@example.com"}' }]);
    dbMock.queuePoolExecute([{ ...draft, status: 'sent', sent_at: '2026-05-21 10:00:00' }]);

    const result = await service.sendOutreachDraft('draft-1');

    expect(sendMailRaw).toHaveBeenCalledWith({
      to: 'buyer@example.com',
      subject: 'Meeting',
      html: expect.stringContaining('<p>Hello</p>\n<p>Can we meet?</p>'),
      text: 'Hello\n\nCan we meet?',
    });
    expect((sendMailRaw.mock.calls[0]?.[0] as { html: string }).html).toContain('/api/v1/lead-machine/outreach/open/draft-1/pixel.gif');
    expect(dbMock.poolExecutions[2]?.sql).toBe("UPDATE lead_outreach_drafts SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE tenant_key = ? AND id = ?");
    expect(dbMock.poolExecutions[2]?.values).toEqual(['avrasya', 'draft-1']);
    expect(result).toEqual(expect.objectContaining({ id: 'draft-1', status: 'sent' }));
  });

  test('throws when sending draft without recipient', async () => {
    dbMock.queuePoolExecute([{
      id: 'draft-1',
      candidate_id: 'candidate-1',
      market_lead_id: null,
      subject: 'Meeting',
      body: 'Hello',
      status: 'draft',
    }]);
    dbMock.queuePoolExecute([]);
    dbMock.queuePoolExecute([candidate({ email: null })]);

    await expect(service.sendOutreachDraft('draft-1')).rejects.toThrow('OUTREACH_RECIPIENT_NOT_FOUND');
    expect(sendMailRaw).not.toHaveBeenCalled();
  });

  test('tracks outreach open pixel', async () => {
    await service.trackOutreachOpen('draft-1');

    expect(dbMock.poolExecutions[0]?.sql).toContain('UPDATE lead_outreach_drafts');
    expect(dbMock.poolExecutions[0]?.sql).toContain('open_count = COALESCE(open_count, 0) + 1');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['avrasya', 'draft-1']);
  });

  test('sends due outreach reminders once per sequence step', async () => {
    dbMock.queuePoolExecute([{
      id: 'draft-1',
      candidate_id: 'candidate-1',
      market_lead_id: null,
      subject: 'Automechanika Frankfurt - 10 min meeting? - Avrasya / ProMats',
      body: 'Dear Sirs,\n\nInitial note',
      status: 'sent',
      sequence_step: 'initial',
    }]);
    dbMock.queuePoolExecute([{ decision_maker: '{"email":"buyer@example.com"}' }]);

    const result = await service.sendDueOutreachReminders(new Date('2026-08-25T09:00:00Z'));

    expect(result).toEqual({ stage: 'reminder_1', sent: 1, skipped: 0 });
    expect(sendMailRaw).toHaveBeenCalledWith(expect.objectContaining({
      to: 'buyer@example.com',
      subject: 'Re: Automechanika Frankfurt - 10 min meeting?',
      text: expect.stringContaining('Quick reminder'),
    }));
    expect(dbMock.poolExecutions[2]?.sql).toBe('UPDATE lead_outreach_drafts SET sequence_step = ?, last_reminder_at = CURRENT_TIMESTAMP WHERE tenant_key = ? AND id = ?');
    expect(dbMock.poolExecutions[2]?.values).toEqual(['reminder_1', 'avrasya', 'draft-1']);
  });

  test('does not run reminders before the first due date', async () => {
    const result = await service.sendDueOutreachReminders(new Date('2026-08-24T09:00:00Z'));

    expect(result).toEqual({ stage: null, sent: 0, skipped: 0 });
    expect(sendMailRaw).not.toHaveBeenCalled();
    expect(dbMock.poolExecutions).toHaveLength(0);
  });

  test('sends post-show follow-up based on sent_at and tracks sequence step', async () => {
    dbMock.queuePoolExecute([{
      id: 'draft-1',
      candidate_id: 'candidate-1',
      market_lead_id: null,
      subject: 'Automechanika Frankfurt - 10 min meeting? - Avrasya / ProMats',
      body: 'Dear Sirs,\n\nInitial note',
      status: 'sent',
      sent_at: '2026-09-13 09:00:00',
      followup_step: 'initial',
    }]);
    dbMock.queuePoolExecute([{ decision_maker: '{"email":"buyer@example.com"}' }]);

    const result = await service.sendDuePostShowFollowups(new Date('2026-09-16T09:00:00Z'));

    expect(result).toEqual({ stage: 'followup_1', sent: 1, skipped: 0 });
    expect(dbMock.poolExecutions[0]?.sql).toContain("COALESCE(followup_step, 'initial') = ?");
    expect(dbMock.poolExecutions[0]?.values).toEqual(['avrasya', '2026-09-13 09:00:00', 'initial']);
    expect(sendMailRaw).toHaveBeenCalledWith(expect.objectContaining({
      to: 'buyer@example.com',
      subject: 'Re: Automechanika Frankfurt - 10 min meeting?',
      text: expect.stringContaining('post-Automechanika conversation'),
    }));
    expect(dbMock.poolExecutions[2]?.sql).toBe('UPDATE lead_outreach_drafts SET followup_step = ?, last_followup_at = CURRENT_TIMESTAMP WHERE tenant_key = ? AND id = ?');
    expect(dbMock.poolExecutions[2]?.values).toEqual(['followup_1', 'avrasya', 'draft-1']);
  });

  test('returns null for empty outreach update patch', async () => {
    const result = await service.updateOutreachDraft('draft-1', {});

    expect(result).toBeNull();
    expect(dbMock.poolExecutions).toHaveLength(0);
  });
});
