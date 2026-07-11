/**
 * Hazir ICP sablonlari. "Sablondan olustur" ile tek tikla kullaniciya ait yeni bir
 * ICP profili acilir; sonrasinda formdan serbestce duzenlenir.
 *
 * Alan adlari backend eslestiricisiyle (b2b/icp.matcher.ts) birebir ayni olmalidir:
 * sectors, firm_types, geographies, priority_geographies, exclude_geographies,
 * keywords, exclude_patterns, sales_channels, positive_signals, negative_signals,
 * min_lead_score_for_candidate.
 */
export type IcpTemplate = {
  key: string;
  label: string;
  description: string;
  name: string;
  definition: Record<string, unknown>;
};

export const ICP_TEMPLATES: IcpTemplate[] = [
  {
    key: 'avrasya-promats-automechanika',
    label: 'Avrasya Paspas (ProMats) — Automechanika 2026',
    description: 'Oto paspas/aksesuar ithalatcisi & distributoru arayan ihracatci profili. Kaynak: docs/AUTOMECHANIKA_2026_CEKLIST.md',
    name: 'Automechanika 2026 — Oto Aksesuar Alıcısı',
    definition: {
      version: 2,
      host_company: {
        name: 'Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti.',
        brand: 'ProMats',
        website: 'https://promats.com.tr',
        email: 'info@promats.com.tr',
      },
      fair: {
        name: 'Automechanika Frankfurt 2026',
        dates: '2026-09-08/2026-09-12',
        host_exhibitor: {
          name: 'Avrasya Paspas Otomotiv San. ve Tic. Ltd. Şti.',
          brand: 'ProMats',
          hall: '3.1',
          booth: 'D11',
        },
      },
      sectors: [
        'automotive accessories', 'car care', 'floor mats', 'car mats', 'car carpet',
        'interior accessories', 'boot liners', 'trunk mats', 'auto trim', 'rubber mats',
      ],
      sub_sectors: ['3D floor mats', 'rubber car mats', 'textile car mats', 'boot liner'],
      firm_types: [
        'distributor', 'importer', 'wholesaler', 'e-commerce seller', 'buying group',
        'aftermarket retailer', 'tuning shop chain', 'auto parts catalog company',
      ],
      geographies: [
        'DE', 'AT', 'NL', 'PL', 'FR', 'BE', 'CZ', 'IT', 'ES', 'UK',
        'RO', 'HU', 'SK', 'SE', 'DK', 'NO', 'FI', 'CH', 'GR', 'BG', 'PT', 'IE',
      ],
      priority_geographies: ['DE', 'AT', 'NL', 'PL', 'FR'],
      exclude_geographies: ['CN', 'HK', 'IN', 'PK', 'BD', 'VN', 'TH', 'TR'],
      sales_types: ['B2B', 'B2B2C', 'B2C'],
      sales_channels: [
        'own website', 'amazon', 'ebay', 'kaufland', 'otto', 'cdiscount', 'fruugo',
        'wholesale catalog', 'retail chain', 'tuning chain',
      ],
      keywords: ['floor mats', 'car mats', 'boot liner', 'private label', 'aftermarket accessories'],
      price_segment: 'mid',
      exclude_firm_types: [
        'manufacturer (own production)', 'OEM tier-1 supplier', 'single car brand official dealer',
        'raw material supplier', 'tooling supplier',
      ],
      exclude_sectors: [
        'engine oil only', 'lubricants only', 'battery only', 'tire only',
        'electronic parts only', 'mechanical parts only',
      ],
      exclude_patterns: [
        'chinese factory direct', 'made in china reseller only',
        'paspas üretici', 'dernek', 'buying alliance',
      ],
      positive_signals: [
        'private label interest', 'ODM partnership signals', 'european-made preference',
        'amazon FBA seller', 'multi-brand catalog', 'stocking distributor',
      ],
      negative_signals: [
        'in-house production line', 'patent on floor mat manufacturing',
        'established china supplier chain', 'single OEM contract revenue >70%',
      ],
      scoring_weights: {
        sector_match: 0.3,
        firm_type_match: 0.25,
        geography_match: 0.2,
        channel_match: 0.1,
        positive_signal: 0.1,
        negative_signal: -0.15,
      },
      neighbor_bonus: 0.5,
      priority_boost: 1.0,
      min_lead_score_for_candidate: 5.5,
      auto_approve_threshold: 7.0,
    },
  },
  {
    key: 'oto-aksesuar-distributor-avrupa',
    label: 'Oto Aksesuar Distribütörü — Avrupa',
    description: 'Genel amaçlı Avrupa oto aksesuar distribütörü/ithalatçısı profili.',
    name: 'Oto Aksesuar Distribütörü — Avrupa',
    definition: {
      sectors: ['automotive accessories', 'car care', 'floor mats'],
      firm_types: ['distributor', 'importer', 'wholesaler', 'e-commerce seller'],
      geographies: ['DE', 'AT', 'NL', 'PL', 'CZ', 'FR', 'IT', 'ES'],
      priority_geographies: ['DE', 'NL'],
      exclude_geographies: ['CN', 'HK', 'IN'],
      sales_types: ['B2B', 'B2C'],
      sales_channels: ['own website', 'amazon', 'ebay', 'wholesale'],
      keywords: [],
      exclude_patterns: [],
      positive_signals: ['multi-brand catalog', 'stocking distributor'],
      negative_signals: ['in-house production line'],
      price_segment: 'mid',
      min_lead_score_for_candidate: 5.0,
      auto_approve_threshold: 7.0,
    },
  },
  {
    key: 'genel-b2b-ithalatci',
    label: 'Genel B2B İthalatçı (boş taslak)',
    description: 'Sektör ve ülke alanlarını kendiniz dolduracağınız sade başlangıç şablonu.',
    name: 'Yeni B2B İthalatçı Profili',
    definition: {
      sectors: [],
      firm_types: ['distributor', 'importer', 'wholesaler'],
      geographies: [],
      priority_geographies: [],
      exclude_geographies: [],
      sales_channels: [],
      keywords: [],
      exclude_patterns: [],
      positive_signals: [],
      negative_signals: [],
      min_lead_score_for_candidate: 5.0,
      auto_approve_threshold: 7.0,
    },
  },
];
