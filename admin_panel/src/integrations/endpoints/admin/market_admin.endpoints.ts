import { baseApi } from '@/integrations/baseApi';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MarketTarget {
  id:             string;
  name:           string;
  category:       string;
  status:         string;
  website:        string | null;
  phone:          string | null;
  email:          string | null;
  contactName:    string | null;
  city:           string | null;
  district:       string | null;
  instagramUrl:   string | null;
  googleMapsUrl:  string | null;
  notes:          string | null;
  churnRiskScore: number;
  lastSeenAt:     string | null;
  createdAt:      string;
  updatedAt:      string;
}

export interface MarketLead {
  id:          string;
  name:        string;
  category:    string | null;
  source:      string;
  status:      string;
  priority:    string;
  score:       number;
  website:     string | null;
  phone:       string | null;
  email:       string | null;
  contactName: string | null;
  city:        string | null;
  district:    string | null;
  notes:       string | null;
  assignedTo:  string | null;
  convertedAt: string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface ConversionStats {
  stage_counts: Array<{ status: string; count: number }>;
  recent_conversions: Array<{ id: string; name: string; source: string; score: number; converted_at: string | null }>;
  by_source: Array<{ source: string; count: number }>;
}

export interface MarketSignal {
  id:          string;
  targetId:    string | null;
  leadId:      string | null;
  signalType:  string;
  severity:    'critical' | 'high' | 'medium' | 'low';
  title:       string;
  description: string | null;
  sourceUrl:   string | null;
  isReviewed:  boolean;
  reviewedAt:  string | null;
  createdAt:   string;
}

export interface MarketStats {
  totalTargets:   number;
  totalLeads:     number;
  pendingSignals: number;
}

export interface PaspasCustomer {
  id: string;
  tur: string;
  name: string;
  phone: string | null;
  address: string | null;
  discount: number | null;
}

export interface PaspasProduct {
  id: string;
  kategori: string;
  kod: string;
  name: string;
  birim: string;
  stock: number;
  reservedStock: number;
  criticalStock: number;
  unitPrice: number | null;
}

export interface PaspasOrder {
  id: string;
  siparisNo: string;
  customerId: string;
  siparisTarihi: string;
  terminTarihi: string | null;
  durum: string;
  toplamTutar: number;
}

export type LeadCandidateStatus = 'pending' | 'approved' | 'rejected' | 'favorite';
export type LeadCandidateChannel = 'amazon' | 'b2b_directory' | 'trade_fair' | 'trade_fair_in_person' | 'icp_match';

export interface LeadCandidate {
  id: string;
  job_id: string;
  channel: LeadCandidateChannel;
  icp_id: string | null;
  status: LeadCandidateStatus;
  name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  raw_data: Record<string, unknown> | null;
  ai_summary: string | null;
  lead_score: number | string | null;
  decision: AmazonRiskDecision | null;
  reject_reason: string | null;
  reject_tags: string[] | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface LeadSearchJob {
  id: string;
  channel: LeadCandidateChannel;
  status: 'pending' | 'running' | 'done' | 'failed';
  icp_id: string | null;
  params: Record<string, unknown>;
  result_count: number;
  error_msg: string | null;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  risk_report?: AmazonRiskReport;
}

export interface IcpDefinition {
  sectors?: string[];
  sub_sectors?: string[];
  firm_types?: string[];
  geographies?: string[];
  sales_types?: string[];
  sales_channels?: string[];
  price_segment?: string;
  min_employees?: number | null;
  max_employees?: number | null;
  exclude_countries?: string[];
  exclude_patterns?: string[];
  /** Lead tarama kanalı: 'b2b' | 'fuar' | 'amazon' — çoklu */
  lead_channels?: string[];
  /** Serbest açıklama metni */
  description?: string;

  // ─── v3 Gelişmiş ayarlar ───
  /** Pozitif eşleşme (güçlü sektör) — match skoru x1.5 */
  strong_match_sectors?: string[];
  /** Pozitif eşleşme (zayıf sektör) — match skoru x1.0 */
  weak_match_sectors?: string[];
  /** Domain substring eleme. Örn: 'cooling' → reachcooling.com elenir */
  exclude_domain_substrings?: string[];
  /** OEM tier-1 brand eleme. Örn: 'bosch', 'zf', 'schaeffler' */
  exclude_brands?: string[];
  /** Business model anahtar kelime sözlüğü */
  business_model_signals?: Record<string, string[]>;
  /** Business model'e göre skor modifier'ı */
  business_model_score_modifiers?: Record<string, number>;
  /** Pozitif sinyaller (mail/web'de geçerse skor +) */
  positive_signals?: string[];
  /** Negatif sinyaller (skor -) */
  negative_signals?: string[];
  /** Skor ağırlıkları */
  scoring_weights?: Record<string, number>;
  /** Aday kabul edilmesi için minimum skor */
  min_lead_score_for_candidate?: number;
  /** Otomatik onay için skor eşiği */
  auto_approve_threshold?: number;
  /** Komşu stand bonusu (Manhattan mesafesi ≤ N adaylar için) */
  neighbor_bonus?: number;
  /** Öncelikli coğrafyalar (skor +) */
  priority_geographies?: string[];
  /** Öncelikli coğrafya için skor boost */
  priority_boost?: number;
}

export interface IcpProfile {
  id: string;
  name: string;
  is_active: number;
  definition: IcpDefinition;
  created_at: string;
  updated_at: string;
}

export interface BulkImportRow {
  name:          string;
  category?:     string;
  website?:      string;
  phone?:        string;
  email?:        string;
  contact_name?: string;
  city?:         string;
  district?:     string;
  notes?:        string;
}

export interface BulkImportPreviewRow extends BulkImportRow {
  _action: 'insert' | 'update' | 'skip';
}

export interface BulkImportResult {
  inserted: number;
  updated:  number;
  skipped:  number;
  total:    number;
  dry_run:  boolean;
  preview:  BulkImportPreviewRow[];
}

export interface PaspasSyncResult {
  ok:       boolean;
  inserted: number;
  updated:  number;
  total:    number;
  message:  string;
}

export interface LeadEnrichment {
  id: string;
  candidate_id: string | null;
  market_lead_id: string | null;
  decision_maker: {
    name?: string | null;
    title?: string | null;
    linkedin_url?: string | null;
    email?: string | null;
    phone?: string | null;
  } | Record<string, unknown> | null;
  company_size: string | null;
  pain_points: string[] | null;
  growth_signals: Record<string, unknown> | null;
  source_vendor: string | null;
  enriched_at: string;
}

export interface OutreachDraft {
  id: string;
  candidate_id: string | null;
  market_lead_id: string | null;
  subject: string;
  body: string;
  ai_model: string | null;
  status: 'draft' | 'sent' | 'archived';
  sent_at: string | null;
  opened_at: string | null;
  open_count: number;
  sequence_step: string;
  last_reminder_at: string | null;
  followup_step: string;
  last_followup_at: string | null;
  reply_status: 'replied' | 'no_reply' | null;
  replied_at: string | null;
  created_at: string;
}

export type AmazonScoreConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
export type AmazonRiskDecision = 'GUVENLI' | 'DIKKATLI_OL' | 'GIRME' | 'MIXED_SIGNAL' | 'INSUFFICIENT_DATA';

export interface AmazonDimensionScore {
  score: number;
  confidence: AmazonScoreConfidence;
  reason: string;
}

export interface AmazonRiskReport {
  keyword: string;
  scanned_at: string;
  data_points: number;
  scores: {
    category_risk: AmazonDimensionScore;
    sku_chaos: AmazonDimensionScore;
    price_war_risk: AmazonDimensionScore;
    brand_reliability: AmazonDimensionScore;
    operational_risk: AmazonDimensionScore;
  };
  composite_score: number | null;
  decision: AmazonRiskDecision;
  summary: string;
  keepa_trend?: Array<{ label: string; price: number }>;
  buy_box_change_count?: number;
  problem_flags?: string[];
  top_sellers?: AmazonTopSeller[];
  products?: AmazonProductEvidence[];
}

export interface AmazonTopSeller {
  seller_name: string;
  product_count: number;
  avg_price: number | null;
}

export interface AmazonProductEvidence {
  title: string;
  price: number | null;
  rating: number | null;
  review_count: number;
  seller_name: string | null;
  product_url: string | null;
  asin: string | null;
  has_keepa?: boolean;
}

export interface RescoreResult {
  report: AmazonRiskReport;
  total_before: number;
  excluded_count: number;
  remaining_count: number;
}

export interface ScanRule {
  id: string;
  icp_id: string | null;
  channel: string | null;
  rule_type: string;
  value: string;
  label: string | null;
  created_at: string;
}

export interface AmazonScanJob {
  id: string;
  keyword: string;
  marketplace: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  data_points: number;
  error_msg: string | null;
  created_at: string;
  finished_at: string | null;
}

export type MarketTestRunStatus = 'passed' | 'failed' | 'expected_failing' | 'skipped' | 'not_run';

export interface MarketTestRun {
  id: string;
  suite: string;
  title: string;
  command: string | null;
  status: MarketTestRunStatus;
  passCount: number;
  failCount: number;
  skipCount: number;
  outputExcerpt: string | null;
  riskNote: string | null;
  createdBy: string | null;
  createdAt: string;
}

export type MarketDeveloperNotePriority = 'low' | 'normal' | 'high' | 'critical';
export type MarketDeveloperNoteStatus = 'open' | 'in_review' | 'resolved' | 'closed';

export interface MarketDeveloperNote {
  id: string;
  subject: string;
  body: string;
  priority: MarketDeveloperNotePriority;
  status: MarketDeveloperNoteStatus;
  pagePath: string | null;
  attachmentUrl: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AmazonSavedSearch {
  id:               string;
  label:            string;
  keyword:          string;
  marketplace:      string;
  watchlistEnabled: boolean;
  lastJobId:        string | null;
  lastRunAt:        string | null;
  createdAt:        string;
  updatedAt:        string;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

export interface OutreachCampaign {
  id:                   string;
  slug:                 string;
  name:                 string;
  is_active:            number;

  brand_name:           string;
  brand_short:          string;
  brand_legal:          string | null;
  sender_label:         string;
  sender_name:          string | null;
  sender_title:         string | null;
  sender_email:         string;
  reply_to_email:       string | null;
  sender_phone:         string | null;
  sender_office:        string | null;
  sender_website:       string | null;
  sender_address:       string | null;

  product_en:           string;
  product_de:           string | null;
  product_tr:           string | null;

  fair_name:            string | null;
  fair_edition:         string | null;
  fair_dates_en:        string | null;
  fair_dates_de:        string | null;
  fair_dates_tr:        string | null;
  fair_hall:            string | null;
  fair_booth:           string | null;
  fair_url:             string | null;

  calendly_link:        string | null;
  calendly_placeholder: string | null;

  icp_id:               string | null;
  default_lang:         string;
  country_to_lang:      Record<string, string> | null;

  created_at:           string;
  updated_at:           string;
}

export const marketAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMarketStats: b.query<MarketStats, void>({
      query: () => ({ url: '/admin/market/stats' }),
      providesTags: ['MarketStats'],
    }),

    listMarketTargets: b.query<MarketTarget[], {
      q?: string;
      category?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }>({
      query: (params) => ({ url: '/admin/market/targets', params }),
      providesTags: ['MarketTargets'],
    }),
    createMarketTarget: b.mutation<MarketTarget, Partial<MarketTarget> & { name: string }>({
      query: (body) => ({ url: '/admin/market/targets', method: 'POST', body }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),
    updateMarketTarget: b.mutation<MarketTarget, { id: string; body: Partial<MarketTarget> }>({
      query: ({ id, body }) => ({ url: `/admin/market/targets/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['MarketTargets'],
    }),
    deleteMarketTarget: b.mutation<void, string>({
      query: (id) => ({ url: `/admin/market/targets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),
    recalculateChurn: b.mutation<{ score: number }, string>({
      query: (id) => ({ url: `/admin/market/targets/${id}/recalculate-churn`, method: 'POST' }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),

    listMarketLeads: b.query<MarketLead[], {
      q?: string;
      status?: string;
      priority?: string;
      source?: string;
      sort?: string;
      order?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }>({
      query: (params) => ({ url: '/admin/market/leads', params }),
      providesTags: ['MarketLeads'],
    }),
    createMarketLead: b.mutation<MarketLead, Partial<MarketLead> & { name: string }>({
      query: (body) => ({ url: '/admin/market/leads', method: 'POST', body }),
      invalidatesTags: ['MarketLeads', 'MarketStats'],
    }),
    updateMarketLead: b.mutation<MarketLead, { id: string; body: Partial<MarketLead> }>({
      query: ({ id, body }) => ({ url: `/admin/market/leads/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['MarketLeads'],
    }),
    deleteMarketLead: b.mutation<void, string>({
      query: (id) => ({ url: `/admin/market/leads/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MarketLeads', 'MarketStats'],
    }),
    getConversionStats: b.query<ConversionStats, void>({
      query: () => ({ url: '/admin/market/leads/conversion-stats' }),
      providesTags: ['MarketLeads'],
    }),

    listMarketSignals: b.query<MarketSignal[], {
      target_id?: string;
      lead_id?: string;
      severity?: string;
      is_reviewed?: boolean;
      limit?: number;
    }>({
      query: (params) => ({ url: '/admin/market/signals', params }),
      providesTags: ['MarketSignals'],
    }),
    createMarketSignal: b.mutation<MarketSignal, {
      signalType?: string;
      severity?: string;
      title: string;
      description?: string;
      sourceUrl?: string;
      targetId?: string;
      leadId?: string;
    }>({
      query: ({ signalType, sourceUrl, targetId, leadId, ...rest }) => ({
        url: '/admin/market/signals',
        method: 'POST',
        body: {
          ...rest,
          signal_type: signalType,
          source_url:  sourceUrl,
          target_id:   targetId,
          lead_id:     leadId,
        },
      }),
      invalidatesTags: ['MarketSignals', 'MarketStats'],
    }),
    reviewMarketSignal: b.mutation<MarketSignal, { id: string }>({
      query: ({ id }) => ({ url: `/admin/market/signals/${id}/review`, method: 'POST' }),
      invalidatesTags: ['MarketSignals', 'MarketStats'],
    }),
    deleteMarketSignal: b.mutation<void, string>({
      query: (id) => ({ url: `/admin/market/signals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MarketSignals', 'MarketStats'],
    }),

    listPaspasCustomers: b.query<PaspasCustomer[], { q?: string; limit?: number }>({
      query: (params) => ({ url: '/admin/market/external/paspas/customers', params }),
    }),
    listPaspasProducts: b.query<PaspasProduct[], { q?: string; limit?: number }>({
      query: (params) => ({ url: '/admin/market/external/paspas/products', params }),
    }),
    listPaspasCustomerOrders: b.query<PaspasOrder[], string>({
      query: (id) => ({ url: `/admin/market/external/paspas/customers/${id}/orders` }),
    }),

    previewWeeklyReport: b.query<Blob, void>({
      query: () => ({
        url: '/admin/market/reports/weekly/preview',
        responseHandler: async (response) => response.blob(),
      }),
    }),
    sendWeeklyReport: b.mutation<{ ok: boolean }, { to: string }>({
      query: (body) => ({ url: '/admin/market/reports/weekly/send', method: 'POST', body }),
    }),

    listMarketTestRuns: b.query<MarketTestRun[], { suite?: string; status?: MarketTestRunStatus; limit?: number; offset?: number } | void>({
      query: (params) => ({ url: '/admin/market/test-runs', params: params ?? undefined }),
      providesTags: ['MarketTestRuns'],
    }),
    createMarketTestRun: b.mutation<MarketTestRun, {
      suite: string;
      title: string;
      command?: string;
      status?: MarketTestRunStatus;
      pass_count?: number;
      fail_count?: number;
      skip_count?: number;
      output_excerpt?: string;
      risk_note?: string;
    }>({
      query: (body) => ({ url: '/admin/market/test-runs', method: 'POST', body }),
      invalidatesTags: ['MarketTestRuns'],
    }),
    executeMarketTestRun: b.mutation<MarketTestRun, {
      suite: string;
      title: string;
      command: string;
    }>({
      query: (body) => ({ url: '/admin/market/test-runs/execute', method: 'POST', body }),
      invalidatesTags: ['MarketTestRuns'],
    }),

    listMarketDeveloperNotes: b.query<MarketDeveloperNote[], {
      status?: MarketDeveloperNoteStatus;
      priority?: MarketDeveloperNotePriority;
      page_path?: string;
      limit?: number;
      offset?: number;
    } | void>({
      query: (params) => ({ url: '/admin/market/developer-notes', params: params ?? undefined }),
      providesTags: ['MarketDeveloperNotes'],
    }),
    createMarketDeveloperNote: b.mutation<MarketDeveloperNote, {
      subject: string;
      body: string;
      priority?: MarketDeveloperNotePriority;
      status?: MarketDeveloperNoteStatus;
      page_path?: string;
      attachment_url?: string;
    }>({
      query: (body) => ({ url: '/admin/market/developer-notes', method: 'POST', body }),
      invalidatesTags: ['MarketDeveloperNotes'],
    }),
    updateMarketDeveloperNote: b.mutation<MarketDeveloperNote, {
      id: string;
      body: Partial<{
        subject: string;
        body: string;
        priority: MarketDeveloperNotePriority;
        status: MarketDeveloperNoteStatus;
        page_path: string;
        attachment_url: string;
      }>;
    }>({
      query: ({ id, body }) => ({ url: `/admin/market/developer-notes/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['MarketDeveloperNotes'],
    }),
    deleteMarketDeveloperNote: b.mutation<void, string>({
      query: (id) => ({ url: `/admin/market/developer-notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MarketDeveloperNotes'],
    }),

    scanCompetitor: b.mutation<{
      target_id: string; url: string; changed_fields: string[]; signals_created: number;
    }, string>({
      query: (id) => ({ url: `/admin/market/targets/${id}/scan-competitor`, method: 'POST' }),
      invalidatesTags: ['MarketSignals', 'MarketTargets'],
    }),
    scanAllCompetitors: b.mutation<{
      scanned: number; succeeded: number; failed: number; signals_created: number;
    }, void>({
      query: () => ({ url: '/admin/market/targets/scan-all-competitors', method: 'POST' }),
      invalidatesTags: ['MarketSignals', 'MarketTargets', 'MarketStats'],
    }),

    syncPaspasTargets: b.mutation<PaspasSyncResult, { mode?: 'all' | 'customers' | 'dealers' }>({
      query: (body) => ({ url: '/admin/market/sync-paspas', method: 'POST', body }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),
    bulkImportTargets: b.mutation<BulkImportResult, {
      rows: BulkImportRow[];
      dry_run?: boolean;
      on_conflict?: 'skip' | 'update';
    }>({
      query: (body) => ({ url: '/admin/market/targets/bulk-import', method: 'POST', body }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),
    downloadImportTemplate: b.query<string, void>({
      query: () => ({
        url: '/admin/market/targets/import-template',
        responseHandler: async (response) => response.text(),
      }),
    }),

    listLeadCandidates: b.query<LeadCandidate[], {
      channel?: LeadCandidateChannel | 'all';
      status?: LeadCandidateStatus | 'all';
      job_id?: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ channel, status, ...params } = {}) => ({
        url: '/admin/lead-machine/candidates',
        params: {
          ...params,
          channel: channel && channel !== 'all' ? channel : undefined,
          status: status && status !== 'all' ? status : undefined,
        },
      }),
      providesTags: ['LeadCandidates'],
    }),
    reviewCandidate: b.mutation<LeadCandidate, {
      id: string;
      action: 'approve' | 'reject' | 'favorite';
      reject_reason?: string;
      reject_tags?: string[];
    }>({
      query: ({ id, ...body }) => ({
        url: `/admin/lead-machine/candidates/${id}/review`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['LeadCandidates'],
    }),
    approveToLead: b.mutation<MarketLead, string>({
      query: (id) => ({ url: `/admin/lead-machine/candidates/${id}/approve-to-lead`, method: 'POST' }),
      invalidatesTags: ['LeadCandidates', 'MarketLeads', 'MarketStats'],
    }),
    listCandidateEnrichment: b.query<LeadEnrichment[], string>({
      query: (id) => ({ url: `/admin/lead-machine/enrich/${id}` }),
      providesTags: ['LeadEnrichment'],
    }),
    enrichCandidate: b.mutation<LeadEnrichment, string>({
      query: (id) => ({ url: `/admin/lead-machine/enrich/${id}`, method: 'POST' }),
      invalidatesTags: ['LeadEnrichment'],
    }),
    enrichBatch: b.mutation<LeadEnrichment[], string[]>({
      query: (ids) => ({ url: '/admin/lead-machine/enrich/batch', method: 'POST', body: { candidate_ids: ids } }),
      invalidatesTags: ['LeadEnrichment'],
    }),
    generateOutreachDraft: b.mutation<OutreachDraft, string>({
      query: (id) => ({ url: `/admin/lead-machine/outreach/generate/${id}`, method: 'POST' }),
      invalidatesTags: ['OutreachDrafts'],
    }),
    listOutreachDrafts: b.query<OutreachDraft[], { candidate_id?: string; market_lead_id?: string } | void>({
      query: (params) => ({ url: '/admin/lead-machine/outreach/drafts', params: params ?? undefined }),
      providesTags: ['OutreachDrafts'],
    }),
    getCandidateById: b.query<LeadCandidate, string>({
      query: (id) => ({ url: `/admin/lead-machine/candidates/${id}` }),
      providesTags: ['LeadCandidates'],
    }),
    updateOutreachDraft: b.mutation<OutreachDraft, { id: string; body: Partial<Pick<OutreachDraft, 'subject' | 'body' | 'status' | 'reply_status'>> }>({
      query: ({ id, body }) => ({ url: `/admin/lead-machine/outreach/drafts/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['OutreachDrafts'],
    }),
    sendOutreachDraft: b.mutation<OutreachDraft, { id: string; to?: string }>({
      query: ({ id, to }) => ({ url: `/admin/lead-machine/outreach/drafts/${id}/send`, method: 'POST', body: to ? { to } : {} }),
      invalidatesTags: ['OutreachDrafts'],
    }),
    listAmazonJobs: b.query<LeadSearchJob[], void>({
      query: () => ({ url: '/admin/lead-machine/amazon/jobs' }),
      providesTags: ['LeadMachineJobs'],
    }),
    startAmazonJob: b.mutation<LeadSearchJob, Record<string, unknown>>({
      query: (body) => ({ url: '/admin/lead-machine/amazon/jobs', method: 'POST', body }),
      invalidatesTags: ['LeadMachineJobs'],
    }),
    startAmazonScan: b.mutation<LeadSearchJob, Record<string, unknown>>({
      query: (body) => ({ url: '/admin/lead-machine/amazon/scan', method: 'POST', body }),
      invalidatesTags: ['LeadMachineJobs', 'AmazonRiskScores'],
    }),
    getAmazonScan: b.query<AmazonScanJob, string>({
      query: (jobId) => ({ url: `/admin/lead-machine/amazon/scan/${jobId}` }),
      providesTags: ['LeadMachineJobs'],
    }),
    listAmazonScanProducts: b.query<AmazonProductEvidence[], { jobId: string; limit?: number }>({
      query: ({ jobId, limit }) => ({
        url: `/admin/lead-machine/amazon/scan/${jobId}/products`,
        params: { limit },
      }),
      providesTags: ['AmazonRiskScores'],
    }),
    getAmazonScanProducts: b.query<{ products: AmazonProductEvidence[] }, string>({
      query: (jobId) => ({ url: `/admin/lead-machine/amazon/scan/${jobId}/products` }),
    }),
    rescoreAmazonJob: b.mutation<RescoreResult, {
      jobId: string;
      exclude: { asins?: string[]; product_urls?: string[]; seller_names?: string[]; title_keywords?: string[] };
    }>({
      query: ({ jobId, exclude }) => ({
        url: `/admin/lead-machine/amazon/jobs/${jobId}/rescore`,
        method: 'POST',
        body: { exclude },
      }),
      invalidatesTags: ['AmazonRiskScores'],
    }),
    getAmazonRiskScore: b.query<AmazonRiskReport, { keyword: string; marketplace?: string }>({
      query: ({ keyword, marketplace = 'com' }) => ({
        url: `/admin/lead-machine/amazon/risk-scores/${encodeURIComponent(keyword)}`,
        params: { marketplace },
      }),
      providesTags: ['AmazonRiskScores'],
    }),
    getBulkAmazonRiskScores: b.mutation<
      Array<{ keyword: string; marketplace: string; report: AmazonRiskReport | null }>,
      { keywords: string[]; marketplace?: string }
    >({
      query: ({ keywords, marketplace = 'com' }) => ({
        url: '/admin/lead-machine/amazon/risk-scores/bulk',
        method: 'POST',
        body: { keywords, marketplace },
      }),
    }),
    listB2bJobs: b.query<LeadSearchJob[], void>({
      query: () => ({ url: '/admin/lead-machine/b2b/jobs' }),
      providesTags: ['LeadMachineJobs'],
    }),
    startB2bJob: b.mutation<LeadSearchJob, Record<string, unknown>>({
      query: (body) => ({ url: '/admin/lead-machine/b2b/jobs', method: 'POST', body }),
      invalidatesTags: ['LeadMachineJobs'],
    }),
    listFairJobs: b.query<LeadSearchJob[], void>({
      query: () => ({ url: '/admin/lead-machine/fair/jobs' }),
      providesTags: ['LeadMachineJobs'],
    }),
    startFairJob: b.mutation<LeadSearchJob, Record<string, unknown>>({
      query: (body) => ({ url: '/admin/lead-machine/fair/jobs', method: 'POST', body }),
      invalidatesTags: ['LeadMachineJobs'],
    }),
    startGenericFairRunner: b.mutation<LeadSearchJob, { fair_url: string; icp_id: string; fair_name?: string; fair_date?: string; hall_filters?: string[]; max_exhibitors?: number }>({
      query: (body) => ({ url: '/admin/lead-machine/fair/run', method: 'POST', body }),
      invalidatesTags: ['LeadMachineJobs'],
    }),
    listIcpProfiles: b.query<IcpProfile[], void>({
      query: () => ({ url: '/admin/lead-machine/icp' }),
      providesTags: ['IcpProfiles'],
    }),
    createIcpProfile: b.mutation<IcpProfile, { name: string; definition: IcpDefinition; is_active?: boolean }>({
      query: (body) => ({ url: '/admin/lead-machine/icp', method: 'POST', body }),
      invalidatesTags: ['IcpProfiles'],
    }),
    updateIcpProfile: b.mutation<IcpProfile, { id: string; body: { name?: string; definition?: IcpDefinition; is_active?: boolean } }>({
      query: ({ id, body }) => ({ url: `/admin/lead-machine/icp/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['IcpProfiles'],
    }),
    deleteIcpProfile: b.mutation<void, string>({
      query: (id) => ({ url: `/admin/lead-machine/icp/${id}`, method: 'DELETE' }),
      invalidatesTags: ['IcpProfiles'],
    }),
    getFeedbackRejectionStats: b.query<Array<{ tag: string; channel: string; icp_id: string | null; count: number }>, void>({
      query: () => ({ url: '/admin/lead-machine/feedback/rejection-stats' }),
      providesTags: ['ScanRules'],
    }),
    getFeedbackApprovedStats: b.query<{
      total_approved: number;
      total_favorite: number;
      avg_lead_score: number | null;
      by_channel: Array<{ channel: string; count: number }>;
      by_country: Array<{ country: string; count: number }>;
      top_pain_points: Array<{ pain_point: string; count: number }>;
    }, void>({
      query: () => ({ url: '/admin/lead-machine/feedback/approved-stats' }),
      providesTags: ['ScanRules'],
    }),
    listScanRules: b.query<ScanRule[], { icp_id?: string } | void>({
      query: (arg) => ({
        url: '/admin/lead-machine/rules',
        params: arg && typeof arg === 'object' && arg.icp_id ? { icp_id: arg.icp_id } : undefined,
      }),
      providesTags: ['ScanRules'],
    }),
    createScanRule: b.mutation<ScanRule, {
      icp_id?: string | null;
      channel?: string | null;
      rule_type?: string;
      value: string;
      label?: string | null;
    }>({
      query: (body) => ({ url: '/admin/lead-machine/rules', method: 'POST', body }),
      invalidatesTags: ['ScanRules'],
    }),
    deleteScanRule: b.mutation<void, string>({
      query: (id) => ({ url: `/admin/lead-machine/rules/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ScanRules'],
    }),
    getKeepaUsage: b.query<{
      today: { budget_date: string; token_budget: number; tokens_used: number; remaining: number } | null;
      history: Array<{ budget_date: string; token_budget: number; tokens_used: number }>;
      queue: { pending: number; done_today: number; failed_total: number };
    }, void>({
      query: () => ({ url: '/admin/lead-machine/keepa/usage' }),
    }),

    listSavedSearches: b.query<AmazonSavedSearch[], void>({
      query: () => ({ url: '/admin/lead-machine/amazon/saved-searches' }),
      providesTags: ['SavedSearches'],
    }),
    createSavedSearch: b.mutation<AmazonSavedSearch, {
      label?: string;
      keyword: string;
      marketplace?: string;
      watchlist_enabled?: boolean;
    }>({
      query: (body) => ({ url: '/admin/lead-machine/amazon/saved-searches', method: 'POST', body }),
      invalidatesTags: ['SavedSearches'],
    }),
    updateSavedSearch: b.mutation<void, { id: string; watchlist_enabled: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/lead-machine/amazon/saved-searches/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['SavedSearches'],
    }),
    deleteSavedSearch: b.mutation<void, string>({
      query: (id) => ({ url: `/admin/lead-machine/amazon/saved-searches/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SavedSearches'],
    }),
    runSavedSearch: b.mutation<{ id: string; status: string }, string>({
      query: (id) => ({ url: `/admin/lead-machine/amazon/saved-searches/${id}/run`, method: 'POST' }),
      invalidatesTags: ['SavedSearches', 'LeadMachineJobs'],
    }),

    // ─── Outreach Campaigns (SaaS — multi-tenant kampanya yapısı) ───────
    listOutreachCampaigns: b.query<OutreachCampaign[], void>({
      query: () => ({ url: '/admin/lead-machine/outreach/campaigns' }),
      providesTags: ['OutreachCampaigns'],
    }),
    getOutreachCampaign: b.query<OutreachCampaign, string>({
      query: (id) => ({ url: `/admin/lead-machine/outreach/campaigns/${id}` }),
      providesTags: ['OutreachCampaigns'],
    }),
    createOutreachCampaign: b.mutation<OutreachCampaign, Partial<OutreachCampaign>>({
      query: (body) => ({ url: '/admin/lead-machine/outreach/campaigns', method: 'POST', body }),
      invalidatesTags: ['OutreachCampaigns'],
    }),
    updateOutreachCampaign: b.mutation<OutreachCampaign, { id: string; body: Partial<OutreachCampaign> }>({
      query: ({ id, body }) => ({ url: `/admin/lead-machine/outreach/campaigns/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['OutreachCampaigns'],
    }),
    deleteOutreachCampaign: b.mutation<void, string>({
      query: (id) => ({ url: `/admin/lead-machine/outreach/campaigns/${id}`, method: 'DELETE' }),
      invalidatesTags: ['OutreachCampaigns'],
    }),
    generateOutreachDrafts: b.mutation<
      {
        campaign_id: string;
        campaign_slug: string;
        approved_count: number;
        draft_count: number;
        skipped_existing: number;
        candidates_without_email: number;
      },
      string
    >({
      query: (id) => ({
        url: `/admin/lead-machine/outreach/campaigns/${id}/generate-drafts`,
        method: 'POST',
      }),
      invalidatesTags: ['OutreachDrafts', 'LeadCandidates'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetMarketStatsQuery,
  useListMarketTargetsQuery,
  useCreateMarketTargetMutation,
  useUpdateMarketTargetMutation,
  useDeleteMarketTargetMutation,
  useRecalculateChurnMutation,
  useListMarketLeadsQuery,
  useCreateMarketLeadMutation,
  useUpdateMarketLeadMutation,
  useDeleteMarketLeadMutation,
  useGetConversionStatsQuery,
  useListMarketSignalsQuery,
  useCreateMarketSignalMutation,
  useReviewMarketSignalMutation,
  useDeleteMarketSignalMutation,
  useListPaspasCustomersQuery,
  useListPaspasProductsQuery,
  useListPaspasCustomerOrdersQuery,
  usePreviewWeeklyReportQuery,
  useLazyPreviewWeeklyReportQuery,
  useSendWeeklyReportMutation,
  useListMarketTestRunsQuery,
  useCreateMarketTestRunMutation,
  useExecuteMarketTestRunMutation,
  useListMarketDeveloperNotesQuery,
  useCreateMarketDeveloperNoteMutation,
  useUpdateMarketDeveloperNoteMutation,
  useDeleteMarketDeveloperNoteMutation,
  useListLeadCandidatesQuery,
  useReviewCandidateMutation,
  useApproveToLeadMutation,
  useListCandidateEnrichmentQuery,
  useEnrichCandidateMutation,
  useEnrichBatchMutation,
  useGetCandidateByIdQuery,
  useGenerateOutreachDraftMutation,
  useListOutreachDraftsQuery,
  useUpdateOutreachDraftMutation,
  useSendOutreachDraftMutation,
  useListAmazonJobsQuery,
  useStartAmazonJobMutation,
  useStartAmazonScanMutation,
  useGetAmazonScanQuery,
  useListAmazonScanProductsQuery,
  useRescoreAmazonJobMutation,
  useGetAmazonRiskScoreQuery,
  useListB2bJobsQuery,
  useStartB2bJobMutation,
  useListFairJobsQuery,
  useStartFairJobMutation,
  useStartGenericFairRunnerMutation,
  useListIcpProfilesQuery,
  useCreateIcpProfileMutation,
  useUpdateIcpProfileMutation,
  useDeleteIcpProfileMutation,
  useSyncPaspasTargetsMutation,
  useBulkImportTargetsMutation,
  useLazyDownloadImportTemplateQuery,
  useScanCompetitorMutation,
  useScanAllCompetitorsMutation,
  useGetKeepaUsageQuery,
  useListScanRulesQuery,
  useCreateScanRuleMutation,
  useDeleteScanRuleMutation,
  useGetFeedbackRejectionStatsQuery,
  useGetFeedbackApprovedStatsQuery,
  useGetBulkAmazonRiskScoresMutation,
  useListSavedSearchesQuery,
  useCreateSavedSearchMutation,
  useUpdateSavedSearchMutation,
  useDeleteSavedSearchMutation,
  useRunSavedSearchMutation,
  useListOutreachCampaignsQuery,
  useGetOutreachCampaignQuery,
  useCreateOutreachCampaignMutation,
  useUpdateOutreachCampaignMutation,
  useDeleteOutreachCampaignMutation,
  useGenerateOutreachDraftsMutation,
} = marketAdminApi;

// Checklist uyumu için alias hook isimleri
export const useGetPaspasCustomerOrdersQuery = useListPaspasCustomerOrdersQuery;
