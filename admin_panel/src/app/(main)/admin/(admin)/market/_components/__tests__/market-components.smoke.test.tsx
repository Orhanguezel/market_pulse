import { beforeEach, describe, expect, mock, test } from 'bun:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mutation = mock(() => ({ unwrap: () => Promise.resolve({ ok: true }) }));
const lazy = mock(() => ({ unwrap: () => Promise.resolve(new Blob(['ok'])) }));
const refetch = mock(() => undefined);

const hooksState = {
  loading: false,
  empty: false,
};

function query<T>(data: T) {
  return {
    data: hooksState.empty ? undefined : data,
    isLoading: hooksState.loading,
    isFetching: false,
    refetch,
  };
}

function mutationTuple(state: Record<string, unknown> = {}) {
  return [mutation, { isLoading: false, ...state }] as const;
}

const sampleTarget = {
  id: 'target-1',
  name: 'Alpha Dealer',
  category: 'dealer',
  status: 'active',
  website: 'https://alpha.example',
  phone: '+90',
  email: 'info@alpha.example',
  contactName: 'Ada',
  city: 'Istanbul',
  district: 'Kadikoy',
  instagramUrl: null,
  googleMapsUrl: null,
  notes: null,
  churnRiskScore: 12,
  lastSeenAt: null,
  externalCustomerId: 'customer-1',
  createdAt: '2026-05-08',
  updatedAt: '2026-05-08',
};

const sampleIntel = {
  target: sampleTarget,
  churn: {
    total: 12,
    signal_score: 5,
    age_score: 7,
    age_days: 10,
    erp_score: null,
  },
  signals: [],
  orders: {
    latest: [],
    trend: { last90_count: 0, last90_value: 0, prev90_count: 0, prev90_value: 0, delta_pct: null },
    error: null,
  },
};

const sampleLead = {
  id: 'lead-1',
  name: 'Beta Lead',
  category: 'retail',
  source: 'manual',
  status: 'new',
  priority: 'high',
  score: 8,
  website: 'https://beta.example',
  phone: null,
  email: 'sales@beta.example',
  contactName: 'Bora',
  city: 'Izmir',
  district: null,
  notes: null,
  assignedTo: null,
  createdAt: '2026-05-08',
  updatedAt: '2026-05-08',
};

const sampleSignal = {
  id: 'signal-1',
  targetId: 'target-1',
  leadId: null,
  signalType: 'manual',
  severity: 'high',
  title: 'Fiyat degisikligi',
  description: 'Rakip fiyat guncelledi',
  sourceUrl: 'https://source.example',
  isReviewed: false,
  reviewedAt: null,
  createdAt: '2026-05-08',
};

const sampleJob = {
  id: 'job-1',
  channel: 'amazon',
  status: 'done',
  icp_id: null,
  params: { keyword: 'car mats' },
  result_count: 3,
  error_msg: null,
  created_by: null,
  created_at: '2026-05-08',
  started_at: '2026-05-08',
  finished_at: '2026-05-08',
};

const sampleIcp = {
  id: 'icp-1',
  name: 'EU Distributor',
  is_active: 1,
  definition: { sectors: ['automotive'], firm_types: ['distributor'] },
  created_at: '2026-05-08',
  updated_at: '2026-05-08',
};

const sampleCandidate = {
  id: 'candidate-1',
  job_id: 'job-1',
  channel: 'amazon',
  icp_id: null,
  status: 'pending',
  name: 'Gamma Seller',
  website: 'https://gamma.example',
  country: 'DE',
  city: 'Berlin',
  phone: null,
  email: 'sales@gamma.example',
  contact_name: 'Gina',
  raw_data: { products: [] },
  ai_summary: 'Good fit',
  lead_score: 8,
  reject_reason: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-05-08',
};

mock.module('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    <a href={href} {...props}>{children}</a>,
}));

mock.module('@/app/(main)/admin/_components/admin-settings-provider', () => ({
  useAdminSettings: () => ({ branding: { app_name: 'MarketPulse' } }),
}));

mock.module('@/integrations/hooks', () => ({
  useGetMarketStatsQuery: () => query({ totalTargets: 7, totalLeads: 4, pendingSignals: 2 }),
  useListMarketTargetsQuery: () => query([sampleTarget]),
  useDeleteMarketTargetMutation: () => mutationTuple(),
  useRecalculateChurnMutation: () => mutationTuple(),
  useGetTargetIntelQuery: () => query(sampleIntel),
  useLazyGetTargetIntelQuery: () => [lazy, { isFetching: false }] as const,
  useScanCompetitorMutation: () => mutationTuple(),
  useScanAllCompetitorsMutation: () => mutationTuple(),
  useScanMarketplaceMutation: () => mutationTuple(),
  useGetMarketplaceHistoryQuery: () => query({ platform: 'amazon', target_id: 'target-1', points: [] }),
  useCreateMarketTargetMutation: () => mutationTuple(),
  useUpdateMarketTargetMutation: () => mutationTuple(),
  useListErpCustomersQuery: () => query({ enabled: true, items: [{ id: 'customer-1', name: 'ERP Customer' }] }),
  useListMarketLeadsQuery: () => query([sampleLead]),
  useDeleteMarketLeadMutation: () => mutationTuple(),
  useCreateMarketLeadMutation: () => mutationTuple(),
  useUpdateMarketLeadMutation: () => mutationTuple(),
  useListMarketSignalsQuery: () => query([sampleSignal]),
  useReviewMarketSignalMutation: () => mutationTuple(),
  useDeleteMarketSignalMutation: () => mutationTuple(),
  useCreateMarketSignalMutation: () => mutationTuple(),
  useListLeadCandidatesQuery: () => query([sampleCandidate]),
  useReviewCandidateMutation: () => mutationTuple(),
  useApproveToLeadMutation: () => mutationTuple(),
  useListCandidateEnrichmentQuery: () => query([{ id: 'enrich-1', decision_maker: { email: 'sales@gamma.example' } }]),
  useEnrichCandidateMutation: () => mutationTuple(),
  useEnrichBatchMutation: () => mutationTuple(),
  useGetCandidateByIdQuery: () => query(sampleCandidate),
  useGenerateOutreachDraftMutation: () => mutationTuple(),
  useListAmazonJobsQuery: () => query([sampleJob]),
  useStartAmazonJobMutation: () => mutationTuple(),
  useStartAmazonScanMutation: () => mutationTuple(),
  useListAmazonScanProductsQuery: () => query([]),
  useRescoreAmazonJobMutation: () => mutationTuple(),
  useGetAmazonRiskScoreQuery: () => query(null),
  useListB2bJobsQuery: () => query([{ ...sampleJob, channel: 'b2b_directory' }]),
  useStartB2bJobMutation: () => mutationTuple(),
  useListFairJobsQuery: () => query([{ ...sampleJob, channel: 'trade_fair' }]),
  useStartFairJobMutation: () => mutationTuple(),
  useListIcpProfilesQuery: () => query([sampleIcp]),
  useCreateIcpProfileMutation: () => mutationTuple(),
  useUpdateIcpProfileMutation: () => mutationTuple(),
  useDeleteIcpProfileMutation: () => mutationTuple(),
  useListOutreachDraftsQuery: () => query([{ id: 'draft-1', subject: 'Intro', body: 'Hello', status: 'draft', created_at: '2026-05-08' }]),
  useUpdateOutreachDraftMutation: () => mutationTuple(),
  useSendOutreachDraftMutation: () => mutationTuple(),
  useListOutreachCampaignsQuery: () => query([]),
  useCreateOutreachCampaignMutation: () => mutationTuple(),
  useUpdateOutreachCampaignMutation: () => mutationTuple(),
  useDeleteOutreachCampaignMutation: () => mutationTuple(),
  useGenerateOutreachDraftsMutation: () => mutationTuple(),
  useSyncHostKeywordsMutation: () => mutationTuple(),
  useListSavedSearchesQuery: () => query([]),
  useCreateSavedSearchMutation: () => mutationTuple(),
  useUpdateSavedSearchMutation: () => mutationTuple(),
  useDeleteSavedSearchMutation: () => mutationTuple(),
  useRunSavedSearchMutation: () => mutationTuple(),
  useListScanRulesQuery: () => query([]),
  useCreateScanRuleMutation: () => mutationTuple(),
  useDeleteScanRuleMutation: () => mutationTuple(),
  useGetFeedbackRejectionStatsQuery: () => query({}),
  useGetFeedbackApprovedStatsQuery: () => query({}),
  useGetBulkAmazonRiskScoresMutation: () => mutationTuple(),
  useLazyPreviewWeeklyReportQuery: () => [lazy, { isFetching: false }] as const,
  useSendWeeklyReportMutation: () => mutationTuple(),
  useSyncErpTargetsMutation: () => mutationTuple(),
  useBulkImportTargetsMutation: () => mutationTuple(),
  useLazyDownloadImportTemplateQuery: () => [lazy, { isFetching: false }] as const,
  useListMarketTestRunsQuery: () => query([{ id: 'run-1', title: 'Admin tests', command: 'cd admin_panel && bun test', status: 'passed', passCount: 18, failCount: 0, skipCount: 0, outputExcerpt: '18 pass' }]),
  useCreateMarketTestRunMutation: () => mutationTuple(),
  useExecuteMarketTestRunMutation: () => mutationTuple(),
  useListMarketDeveloperNotesQuery: () => query([{ id: 'note-1', subject: 'Build issue', body: 'Font fetch failed', priority: 'high', status: 'open', attachmentUrl: 'https://cdn.example.com/debug.pdf', createdAt: '2026-05-08', updatedAt: '2026-05-08' }]),
  useCreateMarketDeveloperNoteMutation: () => mutationTuple(),
  useUpdateMarketDeveloperNoteMutation: () => mutationTuple(),
  useDeleteMarketDeveloperNoteMutation: () => mutationTuple(),
}));

const MarketDashboard = (await import('../market-dashboard')).default;
const TargetsPanel = (await import('../targets-panel')).default;
const LeadsPanel = (await import('../leads-panel')).default;
const SignalsPanel = (await import('../signals-panel')).default;
const LeadCandidatesPanel = (await import('../lead-candidates-panel')).default;
const AmazonLeadSearchPanel = (await import('../amazon-lead-search-panel')).default;
const B2bLeadSearchPanel = (await import('../b2b-lead-search-panel')).default;
const FairLeadSearchPanel = (await import('../fair-lead-search-panel')).default;
const IcpProfilesPanel = (await import('../icp-profiles-panel')).default;
const OutreachDraftsPanel = (await import('../outreach-drafts-panel')).default;
const ReportsPanel = (await import('../reports-panel')).default;
const MarketDocumentationPage = (await import('../../docs/page')).default;
const MarketTestCenterPage = (await import('../../test-center/page')).default;
const MarketDeveloperNotesPage = (await import('../../developer-notes/page')).default;
const { RiskScoreCard } = await import('../risk-score-card');

const sampleRiskReport: any = {
  keyword: 'car mats',
  marketplace: 'com',
  data_points: 45,
  scanned_at: '2026-05-08',
  composite_score: 8.5,
  decision: 'GIRME',
  summary: 'Yüksek riskli kategori',
  keepa_trend: [
    { label: '30d min', price: 22.5 },
    { label: '90d avg', price: 24.8 },
    { label: '30d max', price: 28.8 },
  ],
  scores: {
    category_risk: { score: 9, confidence: 'HIGH', reason: 'Too many sellers' },
    sku_chaos: { score: 8, confidence: 'HIGH', reason: 'High chaos' },
    price_war_risk: { score: 7, confidence: 'MEDIUM', reason: 'Some war' },
    brand_reliability: { score: 5, confidence: 'HIGH', reason: 'Average' },
    operational_risk: { score: 4, confidence: 'MEDIUM', reason: 'Low' }
  },
  keepa_trend: [
    { label: '30d min', price: 21.5 },
    { label: '90d avg', price: 28.2 },
    { label: '30d max', price: 36.9 },
  ],
};

function render(component: React.ReactElement) {
  return renderToStaticMarkup(component);
}

beforeEach(() => {
  hooksState.loading = false;
  hooksState.empty = false;
  mutation.mockClear();
  lazy.mockClear();
  refetch.mockClear();
});

describe('market admin component smoke tests', () => {
  test('dashboard renders stats and module links', () => {
    const html = render(<MarketDashboard />);

    expect(html).toContain('MarketPulse');
    expect(html).toContain('Hedef Firmalar');
    expect(html).toContain('Lead Pipeline');
    expect(html).toContain('Bekleyen Sinyal');
  });

  test('dashboard renders loading state without crashing', () => {
    hooksState.loading = true;

    const html = render(<MarketDashboard />);

    expect(html).toContain('Pazar Genel Bakış');
  });

  test('core market panels render populated data', () => {
    expect(render(<TargetsPanel />)).toContain('Alpha Dealer');
    expect(render(<LeadsPanel />)).toContain('Beta Lead');
    expect(render(<SignalsPanel />)).toContain('Fiyat degisikligi');
  });

  test('core market panels render empty state without crashing', () => {
    hooksState.empty = true;

    expect(render(<TargetsPanel />)).toContain('Hedef Firmalar');
    expect(render(<LeadsPanel />)).toContain('Lead Pipeline');
    expect(render(<SignalsPanel />)).toContain('Pazar Sinyalleri');
  });

  test('lead machine panels render populated data', () => {
    expect(render(<LeadCandidatesPanel />)).toContain('Gamma Seller');
    expect(render(<AmazonLeadSearchPanel />)).toContain('car mats');
    expect(render(<B2bLeadSearchPanel />)).toContain('B2B Job Listesi');
    expect(render(<FairLeadSearchPanel />)).toContain('Fuar Job Listesi');
    const riskHtml = render(<RiskScoreCard report={sampleRiskReport} />);
    expect(riskHtml).toContain('Yüksek riskli kategori');
    expect(riskHtml).toContain('Risk Profili (5 Boyut)');
  });

  test('icp, outreach and reports panels render primary surfaces', () => {
    expect(render(<IcpProfilesPanel />)).toContain('EU Distributor');
    expect(render(<OutreachDraftsPanel />)).toContain('Intro');
    expect(render(<ReportsPanel />)).toContain('Haftalık');
  });

  test('documentation page explains each market surface', () => {
    const html = render(<MarketDocumentationPage />);

    expect(html).toContain('Dokümantasyon');
    expect(html).toContain('MarketPulse Dashboard');
    expect(html).toContain('Hedef Firmalar');
    expect(html).toContain('Lead Pipeline');
    expect(html).toContain('Amazon Arama');
    expect(html).toContain('Haftalık Raporlar');
    expect(html).toContain('Test Notları');
    expect(html).toContain('Yazılımcı Notları');
    expect(html).toContain('cd backend &amp;&amp; bun test');
  });

  test('market test center and developer notes pages render operations surfaces', () => {
    const testCenterHtml = render(<MarketTestCenterPage />);
    const developerNotesHtml = render(<MarketDeveloperNotesPage />);

    expect(testCenterHtml).toContain('Test Merkezi');
    expect(testCenterHtml).toContain('Test Checklist Tablosu');
    expect(testCenterHtml).toContain('Otomatik Çalıştır');
    expect(testCenterHtml).toContain('cd admin_panel &amp;&amp; bun run build');
    expect(developerNotesHtml).toContain('Yazılımcı Notları');
    expect(developerNotesHtml).toContain('Yeni Not');
    expect(developerNotesHtml).toContain('Dosya / görsel eki');
    expect(developerNotesHtml).toContain('Dosya ekini aç');
    expect(developerNotesHtml).toContain('Mimari Notlar');
  });
});
