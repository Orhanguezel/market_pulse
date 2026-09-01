export type OutreachCampaign = {
  id: string;
  slug: string;
  name: string;
  is_active: number;
  brand_name: string;
  brand_short: string;
  brand_legal: string | null;
  sender_label: string;
  sender_name: string | null;
  sender_title: string | null;
  sender_email: string;
  reply_to_email: string | null;
  sender_phone: string | null;
  sender_office: string | null;
  sender_website: string | null;
  sender_address: string | null;
  product_en: string;
  product_de: string | null;
  product_tr: string | null;
  fair_name: string | null;
  fair_edition: string | null;
  fair_dates_en: string | null;
  fair_dates_de: string | null;
  fair_dates_tr: string | null;
  fair_hall: string | null;
  fair_booth: string | null;
  fair_url: string | null;
  calendly_link: string | null;
  calendly_placeholder: string | null;
  icp_id: string | null;
  default_lang: string;
  country_to_lang: Record<string, string> | null;
  created_at?: string;
  updated_at?: string;
};

export type OutreachDraft = {
  id: string;
  campaign_id?: string | null;
  candidate_id?: string | null;
  market_lead_id?: string | null;
  subject: string;
  body: string;
  status?: string | null;
  reply_status?: string | null;
  sent_at?: string | null;
  opened_at?: string | null;
  created_at?: string;
};

export type OutreachList = {
  id: string;
  name: string;
  status: string;
  total_count: number;
  sent_count: number;
  created_at: string;
};

export type OutreachRecipient = {
  id: string;
  list_id: string;
  email: string;
  name?: string | null;
  company?: string | null;
  status?: string | null;
  draft_id?: string | null;
};
