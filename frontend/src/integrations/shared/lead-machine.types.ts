export type LeadChannel = 'amazon' | 'b2b_directory' | 'trade_fair' | 'trade_fair_in_person' | 'icp_match' | 'customs' | 'decision_maker';
export type LeadJobStatus = 'pending' | 'running' | 'done' | 'failed';
export type LeadCandidateStatus = 'pending' | 'approved' | 'rejected' | 'favorite';

export type LeadSearchJob = {
  id: string;
  channel: LeadChannel;
  status: LeadJobStatus;
  icp_id: string | null;
  params: Record<string, unknown>;
  result_count: number;
  error_msg: string | null;
  owner_user_id: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type LeadCandidate = {
  id: string;
  job_id: string;
  channel: LeadChannel;
  icp_id: string | null;
  status: LeadCandidateStatus;
  name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  raw_data: unknown;
  ai_summary: string | null;
  lead_score: number | string | null;
  decision: string | null;
  reject_reason: string | null;
  reject_tags: string[] | null;
  created_at: string;
  /** Adayı üreten taramanın parametreleri (keyword, ülke, fuar adı…) — "nereden bulundu" için. */
  job_params?: Record<string, unknown> | null;
  job_created_at?: string | null;
};

export type IcpProfile = {
  id: string;
  name: string;
  definition: Record<string, unknown>;
  is_active: boolean | number;
  created_at?: string;
  updated_at?: string;
};

export type LeadScanRule = {
  id: string;
  channel: LeadChannel | string;
  icp_id?: string | null;
  rule_type?: string | null;
  value: string;
  label?: string | null;
  created_at?: string;
};

export type LeadCandidateListParams = {
  channel?: LeadChannel | string;
  status?: LeadCandidateStatus | string;
  job_id?: string;
  page?: number;
  limit?: number;
};

export type LeadCandidatePage = {
  rows: LeadCandidate[];
  total: number;
};

export type StartLeadJobBody = Record<string, unknown> & { icp_id?: string | null };

/** Fuar kataloğu kaydı (Türkiye + Dünya fuar takvimi — paylaşımlı katalog). */
export type FairCatalogItem = {
  id: string;
  name: string;
  name_en: string | null;
  sector: string | null;
  country: string | null;
  city: string | null;
  venue: string | null;
  organizer: string | null;
  start_date: string | null;
  end_date: string | null;
  date_status: string | null;
  website: string | null;
  /** Katılımcı listesi sayfası — fuar taraması bunun üzerinden çalışır. */
  exhibitor_url: string | null;
  source: string;
};
