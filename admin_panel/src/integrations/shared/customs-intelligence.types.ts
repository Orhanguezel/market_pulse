export type CustomsEntityType = 'own' | 'competitor';
export type CustomsAliasMatchType = 'exact' | 'prefix';

export type CustomsTrackedEntity = {
  id: string;
  entity_type: CustomsEntityType;
  name: string;
  country: string | null;
  is_active: boolean;
  aliases: Array<{
    id: string;
    alias: string;
    match_type: CustomsAliasMatchType;
  }>;
};

export type CustomsIntelligenceFilters = {
  hs_prefix?: string;
  date_from?: string;
  date_to?: string;
};

export type CustomsEntitySummary = CustomsTrackedEntity & {
  shipment_count: number;
  total_value_usd: number;
  total_quantity: number;
  net_weight: number;
  buyer_count: number;
  first_shipment_date: string | null;
  latest_shipment_date: string | null;
  observed_share_pct: number;
  trends: Array<{ period: string; shipment_count: number; total_value_usd: number }>;
  destinations: Array<{ country: string; shipment_count: number; total_value_usd: number }>;
};

export type CustomsIntelligenceSummary = {
  entities: CustomsEntitySummary[];
  observed_total_value_usd: number;
  observed_shipment_count: number;
};

export type CustomsEvidenceRow = {
  id: number;
  shipment_date: string | null;
  month_year: string | null;
  exporter_name: string | null;
  buyer_name: string | null;
  origin_country: string | null;
  buyer_country: string | null;
  hs_code: string | null;
  hs_description: string | null;
  total_value: string | number | null;
  total_quantity: string | number | null;
  net_weight: string | number | null;
  source_provider: string | null;
  source_file: string | null;
  source_row_number: number | null;
};

export type CustomsEvidenceResponse = {
  entity: CustomsTrackedEntity;
  count: number;
  rows: CustomsEvidenceRow[];
};
