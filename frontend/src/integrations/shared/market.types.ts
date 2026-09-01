export type MarketTarget = {
  id: string;
  name: string;
  category?: string | null;
  status?: string | null;
  city?: string | null;
  district?: string | null;
  country?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  instagramUrl?: string | null;
  googleMapsUrl?: string | null;
  hepsiburadaUrl?: string | null;
  trendyolUrl?: string | null;
  amazonUrl?: string | null;
  notes?: string | null;
  churn_score?: number | null;
  churnRiskScore?: number | null;
  lastSeenAt?: string | null;
  externalCustomerId?: string | null;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MarketLead = {
  id: string;
  name: string;
  status?: string | null;
  channel?: string | null;
  country?: string | null;
  website?: string | null;
  email?: string | null;
  lead_score?: number | null;
  created_at?: string;
};

export type MarketSignal = {
  id: string;
  target_id?: string | null;
  targetId?: string | null;
  lead_id?: string | null;
  title: string;
  signalType?: string | null;
  signal_type?: string | null;
  description?: string | null;
  severity?: string | null;
  status?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  source_url?: string | null;
  isReviewed?: boolean;
  created_at?: string;
  createdAt?: string;
};

export type MarketStats = Record<string, unknown>;
export type MarketListParams = Record<string, string | number | boolean | undefined>;
export type MarketBulkImportRow = {
  name: string;
  category?: string;
  website?: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  city?: string;
  district?: string;
  notes?: string;
};
export type MarketBulkImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
  dry_run: boolean;
  preview: Array<MarketBulkImportRow & { _action: 'insert' | 'update' | 'skip' }>;
};
export type MarketTargetIntel = {
  target: MarketTarget;
  churn: unknown;
  signals: unknown[];
  orders: { latest: unknown[]; trend: Record<string, unknown>; error: string | null };
};
export type MarketplaceHistory = {
  platform: string;
  target_id: string;
  points: Array<{ at: string; product_count: number; out_of_stock_count: number; content_hash: string }>;
};
