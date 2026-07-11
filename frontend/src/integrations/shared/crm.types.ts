export type CrmDashboardSummary = {
  counts: { accounts: number; contacts: number; leads: number; deals_open: number; deals_won: number; activities_pending: number; quotes: number; orders?: number };
  pending: { quotes: number; open_deals: number };
  sales_summary: { month: string; amount: number }[];
  status_breakdown: { label: string; count: number }[];
  team_breakdown?: { label: string; count: number }[];
  totals: { records: number };
  upcoming_activities?: Array<{ id: string; subject: string; type?: string | null; ref_type?: string | null; ref_id?: string | null; due_at?: string | null; related_name?: string | null }>;
  recent_quotes?: Array<{ id: string; quote_no?: string | null; title: string; amount?: number | string | null; currency?: string | null; status?: string | null; account_name?: string | null; created_at?: string | null }>;
  recent_deals?: Array<{ id: string; title: string; amount?: number | string | null; currency?: string | null; status?: string | null; stage_name?: string | null; account_name?: string | null; created_at?: string | null }>;
  recent_accounts?: Array<{ id: string; name: string; country?: string | null; city?: string | null; status?: string | null; created_at?: string | null }>;
};

export type CrmAccount = { id: string; name: string; website?: string | null; country?: string | null; city?: string | null; phone?: string | null; email?: string | null; industry?: string | null; status?: string | null; created_at?: string };
export type CrmContact = { id: string; first_name?: string | null; last_name?: string | null; title?: string | null; email?: string | null; phone?: string | null; account_id?: string | null; linkedin_url?: string | null; created_at?: string };
export type CrmPipeline = { id: string; name: string; is_default?: number | boolean; sort?: number | null };
export type CrmStage = { id: string; pipeline_id: string; name: string; sort?: number | null; is_won?: number | boolean; is_lost?: number | boolean };
export type CrmPipelineResponse = { pipelines: CrmPipeline[]; stages: CrmStage[] };
export type CrmDeal = { id: string; title: string; amount?: number | string | null; currency?: string | null; status?: string | null; stage_id?: string | null; stage_name?: string | null; pipeline_id?: string | null; pipeline_name?: string | null; account_id?: string | null; account_name?: string | null; contact_id?: string | null; contact_email?: string | null; expected_close_date?: string | null; created_at?: string };
export type CrmActivity = { id: string; type?: string | null; subject?: string | null; body?: string | null; due_at?: string | null; done?: number | boolean; ref_type?: string | null; ref_id?: string | null; created_at?: string };
export type CrmProduct = { id: string; sku?: string | null; name: string; description?: string | null; unit_price?: number | string | null; currency?: string | null; status?: string | null; created_at?: string };
export type CrmQuote = { id: string; quote_no?: string | null; title: string; amount?: number | string | null; currency?: string | null; status?: string | null; valid_until?: string | null; deal_id?: string | null; account_id?: string | null; contact_id?: string | null; sent_at?: string | null; accepted_at?: string | null; created_at?: string };
export type CrmOrder = { id: string; order_no?: string | null; title: string; amount?: number | string | null; currency?: string | null; status?: string | null; ordered_at?: string | null; quote_id?: string | null; deal_id?: string | null; account_id?: string | null; contact_id?: string | null; created_at?: string };
export type CrmDocument = { id: string; title: string; ref_type?: string | null; ref_id?: string | null; file_url?: string | null; mime_type?: string | null; status?: string | null; created_at?: string };
export type CrmTask = { id: string; subject: string; body?: string | null; due_at?: string | null; priority?: string | null; status?: string | null; ref_type?: string | null; ref_id?: string | null; completed_at?: string | null; created_at?: string };
export type CrmReminder = { id: string; title: string; body?: string | null; remind_at?: string | null; channel?: string | null; status?: string | null; ref_type?: string | null; ref_id?: string | null; sent_at?: string | null; snoozed_until?: string | null; created_at?: string };
export type CrmLead = { id: string; name?: string | null; country?: string | null; website?: string | null; email?: string | null; lead_score?: number | null; status?: string | null; channel?: string | null };

export type CrmMailSummary = { campaigns_active: number; drafts_total: number; drafts_ready: number; sent: number; opened: number; replied: number; recipient_lists: number; recipients_pending: number };
export type CrmReportsSummary = { weekly_report: { preview_url: string; send_url: string; available: boolean }; counts: { targets_total: number; active_leads: number; pending_signals: number; high_risk_targets: number; weekly_high_signals: number; market_test_runs: number } };
export type CrmUsersSummary = { tenant_key: string; users_total: number; active_users: number; inactive_users: number; tenant_admins: number; tenant_editors: number; verified_users: number };
export type CrmBusinessSummary = { tenant: { tenant_key: string; name: string | null; locale: string | null; status: string | null; plan: string | null }; counts: { tenant_settings: number; active_modules: number; suspended_modules: number } };
