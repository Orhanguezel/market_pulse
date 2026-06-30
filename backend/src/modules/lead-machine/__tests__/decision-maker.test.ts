import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';
import { runWithTenant } from '@/core/tenant-context';

const dbMock = createDbMock();
const scrape = mock(() => Promise.resolve({ text: '', html: '', data: {}, final_url: null }));
const askBestAvailable = mock(() => Promise.resolve('not-json'));
const getGoogleMapsKey = mock(() => Promise.resolve('maps-test-key'));
const env = {
  TENANT_KEY: 'tenant-a',
  APOLLO_API_KEY: '',
  APOLLO_DECISION_MAKER_ENABLED: false,
  SERPER_API_KEY: '',
  SCRAPER_SERVICE_URL: 'http://scraper.local',
  SCRAPER_SERVICE_API_KEY: '',
};
const originalFetch = globalThis.fetch;
const fetchMock = mock(() => Promise.resolve(new Response(JSON.stringify({ organic: [] }), { status: 200 })));

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

mock.module('@/modules/siteSettings', () => ({
  getGoogleMapsKey,
}));

const osint = await import('../decision-maker/osint.service');
const finder = await import('../decision-maker/finder.service');
const persist = await import('../decision-maker/persist.service');
const batch = await import('../decision-maker/candidate-enrichment.service');
const outreach = await import('../outreach/outreach.service');
const jobService = await import('../decision-maker/job.service');
const exportService = await import('../decision-maker/export.service');

beforeEach(() => {
  dbMock.reset();
  scrape.mockReset();
  fetchMock.mockReset();
  getGoogleMapsKey.mockReset();
  askBestAvailable.mockReset();
  askBestAvailable.mockImplementation(() => Promise.resolve('not-json'));
  getGoogleMapsKey.mockImplementation(() => Promise.resolve('maps-test-key'));
  env.APOLLO_API_KEY = '';
  env.APOLLO_DECISION_MAKER_ENABLED = false;
  env.SERPER_API_KEY = '';
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ organic: [] }), { status: 200 })));
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

function decisionMakerJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dm-job-1',
    channel: 'decision_maker',
    status: 'pending',
    icp_id: null,
    params: JSON.stringify({
      sector: 'fitness',
      cities: ['Istanbul'],
      country: 'TR',
      businessTypes: ['fitness center'],
      titles: ['Founder'],
      targetCount: 10,
      perCityLimit: 2,
    }),
    result_count: 0,
    error_msg: null,
    created_by: null,
    created_at: '2026-06-30 10:00:00',
    started_at: null,
    finished_at: null,
    ...overrides,
  };
}

describe('decision maker OSINT resolver', () => {
  test('resolves LinkedIn profile from Serper Google operator results', async () => {
    env.SERPER_API_KEY = 'serper-test-key';
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      organic: [{
        title: 'Ayşe Demir - Founder - Acme Fitness | LinkedIn',
        link: 'https://tr.linkedin.com/in/ayse-demir-123',
        snippet: 'Founder at Acme Fitness in Istanbul',
      }],
    }), { status: 200 })));

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
    env.SERPER_API_KEY = 'serper-test-key';
    scrape.mockImplementation(() => Promise.resolve({
      text: '',
      html: '',
      final_url: 'https://acme.example/hakkimizda',
      data: {
        text_content: 'Acme Fitness ekibimiz. Kurucu Ayşe Demir uzun yıllardır spor sektöründe çalışıyor.',
        social_profiles: [{ platform: 'instagram', url: 'https://instagram.com/acmefitness' }],
      },
    }));

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

describe('decision maker quality gates (edge cases)', () => {
  test('Serper key yok + skipWebsite → C fallback (uydurma kişi yazılmaz)', async () => {
    env.SERPER_API_KEY = '';
    const res = await osint.resolveDecisionMaker(
      { company: 'Acme Fitness', city: 'Istanbul', country: 'TR', website: 'https://acme.example', titles: ['Founder'] },
      { skipWebsite: true },
    );
    expect(res.confidence).toBe('C');
    expect(res.name).toBeNull();
    expect(res.linkedin_url).toBeNull();
    expect(res.evidence.source).toBe('none');
  });

  test('Apollo LinkedIn URL yoksa reddedilir (C kalır)', async () => {
    env.SERPER_API_KEY = '';
    env.APOLLO_API_KEY = 'apollo-test-key';
    env.APOLLO_DECISION_MAKER_ENABLED = true;
    fetchMock.mockImplementation((url: string | URL | Request) => {
      if (String(url).includes('apollo.io')) {
        return Promise.resolve(new Response(JSON.stringify({
          people: [{ name: 'Mehmet Yilmaz', title: 'Owner', linkedin_url: null }],
        }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ organic: [] }), { status: 200 }));
    });
    const res = await osint.resolveDecisionMaker(
      { company: 'Acme Fitness', city: 'Istanbul', country: 'TR', website: 'https://acme.example', titles: ['Owner'] },
      { skipWebsite: true, allowApollo: true },
    );
    expect(res.name).toBeNull();
    expect(res.confidence).toBe('C');
  });

  test('Apollo LinkedIn + tam isim varsa kabul edilir', async () => {
    env.SERPER_API_KEY = '';
    env.APOLLO_API_KEY = 'apollo-test-key';
    env.APOLLO_DECISION_MAKER_ENABLED = true;
    fetchMock.mockImplementation((url: string | URL | Request) => {
      if (String(url).includes('apollo.io')) {
        return Promise.resolve(new Response(JSON.stringify({
          people: [{ name: 'Mehmet Yilmaz', title: 'Owner', linkedin_url: 'https://linkedin.com/in/mehmet-yilmaz' }],
        }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ organic: [] }), { status: 200 }));
    });
    const res = await osint.resolveDecisionMaker(
      { company: 'Acme Fitness', city: 'Istanbul', country: 'TR', website: 'https://acme.example', titles: ['Owner'] },
      { skipWebsite: true, allowApollo: true },
    );
    expect(res.name).toBe('Mehmet Yilmaz');
    expect(res.linkedin_url).toBe('https://linkedin.com/in/mehmet-yilmaz');
    expect(res.evidence.source).toBe('apollo');
  });

  test('Apollo fallback default kapalı: allowApollo verilmezse Apollo çağrılmaz (C)', async () => {
    env.SERPER_API_KEY = '';
    env.APOLLO_API_KEY = 'apollo-test-key';
    env.APOLLO_DECISION_MAKER_ENABLED = true;
    let apolloCalled = false;
    fetchMock.mockImplementation((url: string | URL | Request) => {
      if (String(url).includes('apollo.io')) apolloCalled = true;
      return Promise.resolve(new Response(JSON.stringify({ organic: [] }), { status: 200 }));
    });
    const res = await osint.resolveDecisionMaker(
      { company: 'Acme Fitness', city: 'Istanbul', country: 'TR', website: 'https://acme.example', titles: ['Owner'] },
      { skipWebsite: true },
    );
    expect(apolloCalled).toBe(false);
    expect(res.confidence).toBe('C');
  });

  test('Website OSINT: unvan ön-ekinden sonra tek kelime isim reddedilir (C)', async () => {
    env.SERPER_API_KEY = '';
    scrape.mockImplementation(() => Promise.resolve({
      text: '', html: '', final_url: 'https://acme.example/hakkimizda',
      data: { text_content: 'Kurucu Mehmet uzun yıllardır sektörde.', social_profiles: [] },
    }));
    const res = await osint.resolveDecisionMaker(
      { company: 'Acme Fitness', city: 'Istanbul', country: 'TR', website: 'https://acme.example', titles: ['Founder'] },
      { skipWebsite: false },
    );
    expect(res.name).toBeNull();
    expect(res.confidence).toBe('C');
  });

  test('Website OSINT: kurumsal kelimeli isim (Acme Fitness) reddedilir (C)', async () => {
    env.SERPER_API_KEY = '';
    scrape.mockImplementation(() => Promise.resolve({
      text: '', html: '', final_url: 'https://acme.example/about',
      data: { text_content: 'Founder Acme Fitness Center kurulduğundan beri hizmet veriyor.', social_profiles: [] },
    }));
    const res = await osint.resolveDecisionMaker(
      { company: 'Acme Fitness', city: 'Istanbul', country: 'TR', website: 'https://acme.example', titles: ['Founder'] },
      { skipWebsite: false },
    );
    expect(res.name).toBeNull();
    expect(res.confidence).toBe('C');
  });

  test('Fitness preset: exclude keyword (supplement) firması excluded olur, enrich edilmez', async () => {
    fetchMock.mockImplementation((url: string | URL | Request) => {
      if (String(url).includes('places.googleapis.com')) {
        return Promise.resolve(new Response(JSON.stringify({
          places: [
            { displayName: { text: 'Mega Supplement Store' }, websiteUri: 'https://megasupp.example' },
            { displayName: { text: 'Acme Fitness Club' }, websiteUri: 'https://acme.example', nationalPhoneNumber: '+90 212 000 00 00', googleMapsUri: 'https://maps.example/acme' },
          ],
        }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ organic: [] }), { status: 200 }));
    });
    const pool = await finder.buildCompanyPool({
      sector: 'fitness', cities: ['Istanbul'], country: 'TR', businessTypes: ['fitness center'], perCityLimit: 5,
    });
    const supplement = pool.rows.find((row) => row.company_name === 'Mega Supplement Store');
    expect(supplement?.quality_status).toBe('excluded');
    expect(supplement?.exclude_reason).toContain('supplement');
    expect(pool.stats.excluded).toBeGreaterThanOrEqual(1);
  });
});

describe('manual review/reject (tenant-scoped)', () => {
  test('updateDecisionMakerReview UPDATE tenant + id ile scope edilir', async () => {
    await runWithTenant('tenant-a', () => persist.updateDecisionMakerReview('dm-1', 'rejected'));
    const upd = dbMock.poolExecutions.find((item) => item.sql.startsWith('UPDATE lead_decision_makers SET review_status'));
    expect(upd?.sql).toContain('WHERE id = ? AND tenant_key = ?');
    expect(upd?.values).toEqual(['rejected', 'dm-1', 'tenant-a']);
  });

  test('updateCompanyPoolStatus excluded → reason yazılır, tenant scope', async () => {
    await runWithTenant('tenant-a', () => persist.updateCompanyPoolStatus('cp-1', 'excluded', 'manuel'));
    const upd = dbMock.poolExecutions.find((item) => item.sql.startsWith('UPDATE lead_company_pool SET quality_status'));
    expect(upd?.sql).toContain('WHERE id = ? AND tenant_key = ?');
    expect(upd?.values).toEqual(['excluded', 'manuel', 'cp-1', 'tenant-a']);
  });

  test('updateCompanyPoolStatus non-excluded → reason temizlenir', async () => {
    await runWithTenant('tenant-a', () => persist.updateCompanyPoolStatus('cp-2', 'qualified'));
    const upd = dbMock.poolExecutions
      .filter((item) => item.sql.startsWith('UPDATE lead_company_pool SET quality_status'))
      .at(-1);
    expect(upd?.values).toEqual(['qualified', null, 'cp-2', 'tenant-a']);
  });
});

describe('candidate decision-maker enrichment', () => {
  test('updates candidate raw_data decision_makers idempotently', async () => {
    env.SERPER_API_KEY = 'serper-test-key';
    dbMock.queuePoolExecute([candidate()]);
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      organic: [{
        title: 'Ayşe Demir - Founder - Acme Fitness | LinkedIn',
        link: 'https://tr.linkedin.com/in/ayse-demir-123',
        snippet: 'Founder at Acme Fitness',
      }],
    }), { status: 200 })));

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

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('decision maker jobs and export', () => {
  test('runs a decision maker job and persists job-scoped A results', async () => {
    env.SERPER_API_KEY = 'serper-test-key';
    dbMock.queuePoolExecute([decisionMakerJob()]);
    fetchMock.mockImplementation((url: string | URL | Request) => {
      const href = String(url);
      if (href.includes('places.googleapis.com')) {
        return Promise.resolve(new Response(JSON.stringify({
          places: [{
            displayName: { text: 'Acme Fitness' },
            websiteUri: 'https://acme.example',
            nationalPhoneNumber: '+90 212 000 00 00',
            googleMapsUri: 'https://maps.example/acme',
          }],
        }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({
        organic: [{
          title: 'Ayşe Demir - Founder - Acme Fitness | LinkedIn',
          link: 'https://tr.linkedin.com/in/ayse-demir-123',
          snippet: 'Founder at Acme Fitness',
        }],
      }), { status: 200 }));
    });

    const result = await runWithTenant('tenant-a', () => jobService.runDecisionMakerJob('dm-job-1'));

    expect(result.stats.withDecisionMaker).toBe(1);
    expect(result.companyPool[0]).toEqual(expect.objectContaining({
      company_name: 'Acme Fitness',
      quality_status: 'qualified',
    }));
    const poolInsert = dbMock.poolExecutions.find((item) => item.sql.includes('INSERT INTO lead_company_pool'));
    expect(poolInsert?.values).toEqual(expect.arrayContaining([
      'tenant-a',
      'dm-job-1',
      'Acme Fitness',
      'qualified',
    ]));
    const insert = dbMock.poolExecutions.find((item) => item.sql.includes('INSERT INTO lead_decision_makers'));
    expect(insert?.values).toEqual(expect.arrayContaining([
      'tenant-a',
      'dm-job-1',
      'Acme Fitness',
      'Ayşe Demir',
      'https://tr.linkedin.com/in/ayse-demir-123',
      'A',
    ]));
    expect(dbMock.poolExecutions.at(-1)?.sql).toContain('UPDATE lead_search_jobs SET status = ?, result_count = ?, finished_at = CURRENT_TIMESTAMP');
    expect(dbMock.poolExecutions.at(-1)?.values).toEqual(['done', 1, 'dm-job-1', 'tenant-a']);
  });

  test('exports decision maker rows as utf8 csv', () => {
    const rows = [{
      company_name: 'Acme Fitness',
      city: 'Istanbul',
      business_type: 'fitness center',
      decision_maker_name: 'Ayşe Demir',
      title: 'Founder',
      linkedin_profile_url: 'https://linkedin.com/in/ayse',
      company_website: 'https://acme.example',
      social_url: null,
      source_url: 'https://linkedin.com/in/ayse | https://maps.example/acme',
      fit_note: 'LinkedIn/karar verici eşleşmesi güçlü.',
      confidence_score: 'A',
      last_verified_at: '2026-06-30',
    }] as const;
    const csv = exportService.decisionMakersToCsv([...rows]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Company Name"');
    expect(csv).toContain('"Ayşe Demir"');
    expect(csv).toContain('"A"');
    const xlsx = exportService.decisionMakersToXlsx([...rows]);
    expect(xlsx[0]).toBe(0x50);
    expect(xlsx[1]).toBe(0x4b);
    expect(xlsx.length).toBeGreaterThan(1000);
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
