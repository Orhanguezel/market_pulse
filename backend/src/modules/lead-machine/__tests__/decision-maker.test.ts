import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';
import { runWithTenant } from '@/core/tenant-context';

const dbMock = createDbMock();
const scrape = mock(() => Promise.resolve({ text: '', html: '', data: {}, final_url: null }));
const askBestAvailable = mock(() => Promise.resolve('not-json'));
const env = {
  TENANT_KEY: 'tenant-a',
  APOLLO_API_KEY: '',
  SCRAPER_SERVICE_URL: 'http://scraper.local',
  SCRAPER_SERVICE_API_KEY: '',
};

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env }));

mock.module('@/modules/lead-machine/_shared/scraper.client', () => ({
  scrape,
}));

mock.module('@/modules/lead-machine/_shared/ai.client', () => ({
  askBestAvailable,
}));

const osint = await import('../decision-maker/osint.service');
const batch = await import('../decision-maker/candidate-enrichment.service');
const outreach = await import('../outreach/outreach.service');

beforeEach(() => {
  dbMock.reset();
  scrape.mockReset();
  askBestAvailable.mockReset();
  askBestAvailable.mockImplementation(() => Promise.resolve('not-json'));
  env.APOLLO_API_KEY = '';
  scrape.mockImplementation(() => Promise.resolve({ text: '', html: '', data: {}, final_url: null }));
});

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'candidate-1',
    job_id: 'job-1',
    channel: 'customs',
    icp_id: null,
    status: 'pending',
    name: 'Acme Fitness',
    website: 'https://acme.example',
    country: 'TR',
    city: 'Istanbul',
    phone: null,
    email: null,
    contact_name: null,
    raw_data: '{"google_maps_url":"https://maps.example/acme"}',
    ai_summary: 'fitness lead',
    lead_score: '6.0',
    decision: null,
    reject_reason: null,
    reject_tags: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-06-29 10:00:00',
    ...overrides,
  };
}

describe('decision maker OSINT resolver', () => {
  test('resolves LinkedIn profile from Google operator scrape', async () => {
    scrape.mockImplementation(() => Promise.resolve({
      text: 'Founder Acme Fitness https://tr.linkedin.com/in/ayse-demir-123',
      html: '<a href="https://tr.linkedin.com/in/ayse-demir-123">Ayse Demir Founder</a>',
      data: {},
      final_url: 'https://google.example',
    }));

    const result = await osint.resolveDecisionMaker({
      company: 'Acme Fitness',
      city: 'Istanbul',
      country: 'TR',
      website: 'https://acme.example',
      titles: ['Founder'],
    });

    expect(result.confidence).toBe('A');
    expect(result.linkedin_url).toBe('https://tr.linkedin.com/in/ayse-demir-123');
    expect(result.evidence.source).toBe('linkedin_serp');
    expect(result.evidence.google_operator).toContain('site:linkedin.com/in');
  });

  test('falls back to website OSINT when SERP has no profile', async () => {
    scrape.mockImplementation((url: string) => {
      if (url.includes('google.com/search')) {
        return Promise.resolve({ text: '', html: '', data: {}, final_url: url });
      }
      return Promise.resolve({
        text: '',
        html: '',
        final_url: 'https://acme.example/hakkimizda',
        data: {
          text_content: 'Acme Fitness ekibimiz. Kurucu Ayşe Demir uzun yıllardır spor sektöründe çalışıyor.',
          social_profiles: [{ platform: 'instagram', url: 'https://instagram.com/acmefitness' }],
        },
      });
    });

    const result = await osint.resolveDecisionMaker({
      company: 'Acme Fitness',
      city: 'Istanbul',
      country: 'TR',
      website: 'https://acme.example',
      titles: ['Founder'],
    });

    expect(result.confidence).toBe('A');
    expect(result.name).toBe('Ayşe Demir');
    expect(result.evidence.source).toBe('website_osint');
    expect(result.evidence.social_url).toBe('https://instagram.com/acmefitness');
  });
});

describe('candidate decision-maker enrichment', () => {
  test('updates candidate raw_data decision_makers idempotently', async () => {
    dbMock.queuePoolExecute([candidate()]);
    scrape.mockImplementation(() => Promise.resolve({
      text: 'Founder Acme Fitness https://tr.linkedin.com/in/ayse-demir-123',
      html: '',
      data: {},
      final_url: null,
    }));

    const result = await runWithTenant('tenant-a', () => batch.enrichCandidateDecisionMakers({
      candidate_ids: ['candidate-1'],
      titles: ['Founder'],
    }));

    expect(result.processed).toBe(1);
    const update = dbMock.poolExecutions.find((item) => item.sql.startsWith('UPDATE lead_candidates SET raw_data'));
    expect(update?.values?.[1]).toBe('tenant-a');
    const raw = JSON.parse(String(update?.values?.[0]));
    expect(raw.decision_makers[0]).toEqual(expect.objectContaining({
      linkedin_url: 'https://tr.linkedin.com/in/ayse-demir-123',
      confidence: 'A',
    }));
  });
});

describe('LinkedIn outreach templates', () => {
  test('returns fallback templates and creates a LinkedIn sequence', async () => {
    dbMock.queuePoolExecute([candidate({
      raw_data: '{"decision_makers":[{"name":"Ayşe Demir","title":"Founder","linkedin_url":"https://linkedin.com/in/ayse"}],"product_context":"fitness B2B data"}',
    })]);
    const templates = await runWithTenant('tenant-a', () => outreach.generateLinkedInTemplates({
      candidateId: 'candidate-1',
      language: 'TR',
    }));

    expect(templates.connection).toContain('Acme Fitness');
    expect(templates.followups).toHaveLength(3);

    dbMock.queuePoolExecute([candidate({
      raw_data: '{"decision_makers":[{"name":"Ayşe Demir","title":"Founder","linkedin_url":"https://linkedin.com/in/ayse"}]}',
    })]);
    const sequence = await runWithTenant('tenant-a', () => outreach.createLinkedInSequence({
      candidateId: 'candidate-1',
      language: 'TR',
    }));

    expect(sequence.steps).toHaveLength(5);
    const inserts = dbMock.poolExecutions.filter((item) => item.sql.includes('INSERT INTO lead_outreach_drafts'));
    expect(inserts).toHaveLength(5);
    expect(inserts[0]?.values?.[7]).toBe('linkedin_connection');
  });
});
