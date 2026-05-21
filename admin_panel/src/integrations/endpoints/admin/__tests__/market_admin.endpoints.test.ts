import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { configureStore } from '@reduxjs/toolkit';
import { marketAdminApi } from '../market_admin.endpoints';

type FetchCall = {
  url: URL;
  method: string;
  body: unknown;
};

const capturedFetchCalls: FetchCall[] = [];

const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : null;
  const headers = new Headers(init?.headers ?? request?.headers);
  const contentType = headers.get('content-type') ?? 'application/json';
  const rawUrl = request?.url ?? String(input);
  const method = init?.method ?? request?.method ?? 'GET';
  const body = init?.body ?? (request ? await request.clone().text() : null);
  capturedFetchCalls.push({ url: new URL(rawUrl), method, body: body || null });
  if (contentType.includes('text/csv')) return Promise.resolve(new Response('name,category\n'));
  return Promise.resolve(Response.json({ ok: true }));
});

globalThis.fetch = fetchMock as unknown as typeof fetch;

function createStore() {
  return configureStore({
    reducer: { [marketAdminApi.reducerPath]: marketAdminApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: false,
    }).concat(marketAdminApi.middleware),
  });
}

function lastFetchCall(): FetchCall {
  const call = capturedFetchCalls.at(-1);
  if (!call) throw new Error('fetch was not called');
  return call;
}

function jsonBody(call: FetchCall) {
  return typeof call.body === 'string' ? JSON.parse(call.body) : call.body;
}

let store: ReturnType<typeof createStore>;

beforeEach(() => {
  fetchMock.mockClear();
  capturedFetchCalls.length = 0;
  store = createStore();
});

afterEach(() => {
  store.dispatch(marketAdminApi.util.resetApiState());
});

async function dispatchEndpoint(endpointName: keyof typeof marketAdminApi.endpoints, arg?: unknown) {
  const endpoint = marketAdminApi.endpoints[endpointName] as {
    initiate: (value?: unknown) => ReturnType<typeof store.dispatch>;
  };
  const promise = store.dispatch(endpoint.initiate(arg));
  await promise;
  promise.unsubscribe?.();
  return lastFetchCall();
}

describe('market admin RTK endpoints', () => {
  test('market stats endpoint', async () => {
    const call = await dispatchEndpoint('getMarketStats');

    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/market/stats');
  });

  test('market target endpoints map URL, params, methods and bodies', async () => {
    let call = await dispatchEndpoint('listMarketTargets', { q: 'alpha', category: 'dealer', status: 'active', limit: 25 });
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/market/targets');
    expect(call.url.searchParams.get('q')).toBe('alpha');
    expect(call.url.searchParams.get('category')).toBe('dealer');
    expect(call.url.searchParams.get('status')).toBe('active');
    expect(call.url.searchParams.get('limit')).toBe('25');

    call = await dispatchEndpoint('createMarketTarget', { name: 'Target A', website: 'https://target.example' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/targets');
    expect(jsonBody(call)).toEqual({ name: 'Target A', website: 'https://target.example' });

    call = await dispatchEndpoint('updateMarketTarget', { id: 'target-1', body: { status: 'paused' } });
    expect(call.method).toBe('PATCH');
    expect(call.url.pathname).toBe('/api/v1/admin/market/targets/target-1');
    expect(jsonBody(call)).toEqual({ status: 'paused' });

    call = await dispatchEndpoint('deleteMarketTarget', 'target-1');
    expect(call.method).toBe('DELETE');
    expect(call.url.pathname).toBe('/api/v1/admin/market/targets/target-1');

    call = await dispatchEndpoint('recalculateChurn', 'target-1');
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/targets/target-1/recalculate-churn');
  });

  test('market lead endpoints map URL, filters, methods and bodies', async () => {
    let call = await dispatchEndpoint('listMarketLeads', { q: 'lead', status: 'new', priority: 'high', source: 'amazon', sort: 'score', order: 'desc' });
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/market/leads');
    expect(call.url.searchParams.get('source')).toBe('amazon');
    expect(call.url.searchParams.get('sort')).toBe('score');

    call = await dispatchEndpoint('createMarketLead', { name: 'Lead A', priority: 'high' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/leads');
    expect(jsonBody(call)).toEqual({ name: 'Lead A', priority: 'high' });

    call = await dispatchEndpoint('updateMarketLead', { id: 'lead-1', body: { status: 'qualified' } });
    expect(call.method).toBe('PATCH');
    expect(call.url.pathname).toBe('/api/v1/admin/market/leads/lead-1');

    call = await dispatchEndpoint('deleteMarketLead', 'lead-1');
    expect(call.method).toBe('DELETE');
    expect(call.url.pathname).toBe('/api/v1/admin/market/leads/lead-1');
  });

  test('market signal endpoints transform camelCase body fields', async () => {
    let call = await dispatchEndpoint('listMarketSignals', { target_id: 'target-1', severity: 'high', is_reviewed: false, limit: 10 });
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/market/signals');
    expect(call.url.searchParams.get('is_reviewed')).toBe('false');

    call = await dispatchEndpoint('createMarketSignal', {
      targetId: 'target-1',
      leadId: 'lead-1',
      signalType: 'manual',
      sourceUrl: 'https://source.example',
      severity: 'medium',
      title: 'Signal A',
    });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/signals');
    expect(jsonBody(call)).toEqual({
      severity: 'medium',
      title: 'Signal A',
      signal_type: 'manual',
      source_url: 'https://source.example',
      target_id: 'target-1',
      lead_id: 'lead-1',
    });

    call = await dispatchEndpoint('reviewMarketSignal', { id: 'signal-1' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/signals/signal-1/review');

    call = await dispatchEndpoint('deleteMarketSignal', 'signal-1');
    expect(call.method).toBe('DELETE');
    expect(call.url.pathname).toBe('/api/v1/admin/market/signals/signal-1');
  });

  test('Paspas external and report endpoints map correctly', async () => {
    let call = await dispatchEndpoint('listPaspasCustomers', { q: 'bayi', limit: 20 });
    expect(call.url.pathname).toBe('/api/v1/admin/market/external/paspas/customers');
    expect(call.url.searchParams.get('q')).toBe('bayi');

    call = await dispatchEndpoint('listPaspasProducts', { q: 'paspas', limit: 10 });
    expect(call.url.pathname).toBe('/api/v1/admin/market/external/paspas/products');

    call = await dispatchEndpoint('listPaspasCustomerOrders', 'customer-1');
    expect(call.url.pathname).toBe('/api/v1/admin/market/external/paspas/customers/customer-1/orders');

    call = await dispatchEndpoint('previewWeeklyReport');
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/market/reports/weekly/preview');

    call = await dispatchEndpoint('sendWeeklyReport', { to: 'ops@example.com' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/reports/weekly/send');
    expect(jsonBody(call)).toEqual({ to: 'ops@example.com' });
  });

  test('competitor scan and bulk import endpoints map correctly', async () => {
    let call = await dispatchEndpoint('scanCompetitor', 'target-1');
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/targets/target-1/scan-competitor');

    call = await dispatchEndpoint('scanAllCompetitors');
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/targets/scan-all-competitors');

    call = await dispatchEndpoint('syncPaspasTargets', { mode: 'customers' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/sync-paspas');
    expect(jsonBody(call)).toEqual({ mode: 'customers' });

    call = await dispatchEndpoint('bulkImportTargets', { rows: [{ name: 'Target A' }], dry_run: true, on_conflict: 'skip' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/targets/bulk-import');
    expect(jsonBody(call)).toEqual({ rows: [{ name: 'Target A' }], dry_run: true, on_conflict: 'skip' });

    call = await dispatchEndpoint('downloadImportTemplate');
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/market/targets/import-template');
  });

  test('test center and developer note endpoints map correctly', async () => {
    let call = await dispatchEndpoint('listMarketTestRuns', { suite: 'admin', status: 'passed', limit: 10 });
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/market/test-runs');
    expect(call.url.searchParams.get('suite')).toBe('admin');
    expect(call.url.searchParams.get('status')).toBe('passed');

    call = await dispatchEndpoint('createMarketTestRun', {
      suite: 'admin',
      title: 'Admin tests',
      command: 'cd admin_panel && bun test',
      status: 'passed',
      pass_count: 18,
    });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/test-runs');
    expect(jsonBody(call)).toEqual({
      suite: 'admin',
      title: 'Admin tests',
      command: 'cd admin_panel && bun test',
      status: 'passed',
      pass_count: 18,
    });

    call = await dispatchEndpoint('executeMarketTestRun', {
      suite: 'backend',
      title: 'Backend tests',
      command: 'cd backend && bun test',
    });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/test-runs/execute');
    expect(jsonBody(call)).toEqual({
      suite: 'backend',
      title: 'Backend tests',
      command: 'cd backend && bun test',
    });

    call = await dispatchEndpoint('listMarketDeveloperNotes', { status: 'open', priority: 'high' });
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/market/developer-notes');
    expect(call.url.searchParams.get('priority')).toBe('high');

    call = await dispatchEndpoint('createMarketDeveloperNote', {
      subject: 'Build issue',
      body: 'Font fetch failed',
      priority: 'high',
      page_path: '/admin/market',
      attachment_url: 'https://cdn.example.com/screenshot.png',
    });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/market/developer-notes');
    expect(jsonBody(call)).toEqual({
      subject: 'Build issue',
      body: 'Font fetch failed',
      priority: 'high',
      page_path: '/admin/market',
      attachment_url: 'https://cdn.example.com/screenshot.png',
    });

    call = await dispatchEndpoint('updateMarketDeveloperNote', { id: 'note-1', body: { status: 'resolved' } });
    expect(call.method).toBe('PATCH');
    expect(call.url.pathname).toBe('/api/v1/admin/market/developer-notes/note-1');
    expect(jsonBody(call)).toEqual({ status: 'resolved' });

    call = await dispatchEndpoint('deleteMarketDeveloperNote', 'note-1');
    expect(call.method).toBe('DELETE');
    expect(call.url.pathname).toBe('/api/v1/admin/market/developer-notes/note-1');
  });
});

describe('lead machine admin RTK endpoints', () => {
  test('candidate endpoints map filters and actions', async () => {
    let call = await dispatchEndpoint('listLeadCandidates', { channel: 'all', status: 'pending', job_id: 'job-1', page: 2, limit: 25 });
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/candidates');
    expect(call.url.searchParams.get('channel')).toBeNull();
    expect(call.url.searchParams.get('status')).toBe('pending');
    expect(call.url.searchParams.get('job_id')).toBe('job-1');

    call = await dispatchEndpoint('reviewCandidate', { id: 'candidate-1', action: 'reject', reject_reason: 'wrong' });
    expect(call.method).toBe('PATCH');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/candidates/candidate-1/review');
    expect(jsonBody(call)).toEqual({ action: 'reject', reject_reason: 'wrong' });

    call = await dispatchEndpoint('approveToLead', 'candidate-1');
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/candidates/candidate-1/approve-to-lead');
  });

  test('enrichment and outreach endpoints map correctly', async () => {
    let call = await dispatchEndpoint('listCandidateEnrichment', 'candidate-1');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/enrich/candidate-1');

    call = await dispatchEndpoint('enrichCandidate', 'candidate-1');
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/enrich/candidate-1');

    call = await dispatchEndpoint('generateOutreachDraft', 'candidate-1');
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/outreach/generate/candidate-1');

    call = await dispatchEndpoint('listOutreachDrafts', { candidate_id: 'candidate-1', market_lead_id: 'lead-1' });
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/outreach/drafts');
    expect(call.url.searchParams.get('candidate_id')).toBe('candidate-1');
    expect(call.url.searchParams.get('market_lead_id')).toBe('lead-1');

    call = await dispatchEndpoint('updateOutreachDraft', { id: 'draft-1', body: { status: 'sent' } });
    expect(call.method).toBe('PATCH');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/outreach/drafts/draft-1');
    expect(jsonBody(call)).toEqual({ status: 'sent' });

    call = await dispatchEndpoint('sendOutreachDraft', { id: 'draft-1', to: 'buyer@example.com' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/outreach/drafts/draft-1/send');
    expect(jsonBody(call)).toEqual({ to: 'buyer@example.com' });
  });

  test('job and ICP endpoints map correctly', async () => {
    let call = await dispatchEndpoint('listAmazonJobs');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/amazon/jobs');

    call = await dispatchEndpoint('startAmazonJob', { keyword: 'paspas' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/amazon/jobs');

    call = await dispatchEndpoint('startAmazonScan', { keyword: 'paspas', marketplace: 'de' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/amazon/scan');
    expect(jsonBody(call)).toEqual({ keyword: 'paspas', marketplace: 'de' });

    call = await dispatchEndpoint('getAmazonScan', 'job-1');
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/amazon/scan/job-1');

    call = await dispatchEndpoint('listAmazonScanProducts', { jobId: 'job-1', limit: 25 });
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/amazon/scan/job-1/products');
    expect(call.url.searchParams.get('limit')).toBe('25');

    call = await dispatchEndpoint('getAmazonRiskScore', { keyword: 'silikon paspas', marketplace: 'de' });
    expect(call.method).toBe('GET');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/amazon/risk-scores/silikon%20paspas');
    expect(call.url.searchParams.get('marketplace')).toBe('de');

    call = await dispatchEndpoint('listB2bJobs');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/b2b/jobs');

    call = await dispatchEndpoint('startB2bJob', { source: 'google_maps' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/b2b/jobs');

    call = await dispatchEndpoint('listFairJobs');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/fair/jobs');

    call = await dispatchEndpoint('startFairJob', { fair_name: 'Automechanika' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/fair/jobs');

    call = await dispatchEndpoint('startGenericFairRunner', { fair_url: 'https://fair.example', icp_id: 'icp-1' });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/fair/run');

    call = await dispatchEndpoint('listIcpProfiles');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/icp');

    call = await dispatchEndpoint('createIcpProfile', { name: 'ICP A', definition: { sectors: ['automotive'] } });
    expect(call.method).toBe('POST');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/icp');

    call = await dispatchEndpoint('updateIcpProfile', { id: 'icp-1', body: { is_active: false } });
    expect(call.method).toBe('PATCH');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/icp/icp-1');

    call = await dispatchEndpoint('deleteIcpProfile', 'icp-1');
    expect(call.method).toBe('DELETE');
    expect(call.url.pathname).toBe('/api/v1/admin/lead-machine/icp/icp-1');
  });

  test('expected market hooks and aliases are exported', async () => {
    const mod = await import('../market_admin.endpoints');
    const expectedExports = [
      'useGetMarketStatsQuery',
      'useListMarketTargetsQuery',
      'useCreateMarketTargetMutation',
      'useUpdateMarketTargetMutation',
      'useDeleteMarketTargetMutation',
      'useRecalculateChurnMutation',
      'useListMarketLeadsQuery',
      'useCreateMarketLeadMutation',
      'useUpdateMarketLeadMutation',
      'useDeleteMarketLeadMutation',
      'useListMarketSignalsQuery',
      'useCreateMarketSignalMutation',
      'useReviewMarketSignalMutation',
      'useDeleteMarketSignalMutation',
      'useListPaspasCustomersQuery',
      'useListPaspasProductsQuery',
      'useListPaspasCustomerOrdersQuery',
      'useGetPaspasCustomerOrdersQuery',
      'usePreviewWeeklyReportQuery',
      'useLazyPreviewWeeklyReportQuery',
      'useSendWeeklyReportMutation',
      'useListMarketTestRunsQuery',
      'useCreateMarketTestRunMutation',
      'useListMarketDeveloperNotesQuery',
      'useCreateMarketDeveloperNoteMutation',
      'useUpdateMarketDeveloperNoteMutation',
      'useDeleteMarketDeveloperNoteMutation',
      'useListLeadCandidatesQuery',
      'useReviewCandidateMutation',
      'useApproveToLeadMutation',
      'useListCandidateEnrichmentQuery',
      'useEnrichCandidateMutation',
      'useGenerateOutreachDraftMutation',
      'useListOutreachDraftsQuery',
      'useUpdateOutreachDraftMutation',
      'useSendOutreachDraftMutation',
      'useListAmazonJobsQuery',
      'useStartAmazonJobMutation',
      'useStartAmazonScanMutation',
      'useGetAmazonScanQuery',
      'useGetAmazonRiskScoreQuery',
      'useListB2bJobsQuery',
      'useStartB2bJobMutation',
      'useListFairJobsQuery',
      'useStartFairJobMutation',
      'useStartGenericFairRunnerMutation',
      'useListIcpProfilesQuery',
      'useCreateIcpProfileMutation',
      'useUpdateIcpProfileMutation',
      'useDeleteIcpProfileMutation',
      'useSyncPaspasTargetsMutation',
      'useBulkImportTargetsMutation',
      'useLazyDownloadImportTemplateQuery',
      'useScanCompetitorMutation',
      'useScanAllCompetitorsMutation',
    ];

    for (const key of expectedExports) {
      expect(typeof (mod as Record<string, unknown>)[key]).toBe('function');
    }
  });
});
