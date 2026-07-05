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
  created_by: string | null;
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
  value?: string;
  pattern?: string;
  action?: string | null;
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

export type StartLeadJobBody = Record<string, unknown> & { icp_id?: string | null };
