import { askBestAvailable } from '../_shared/ai.client';
import { scrape, type LeadPageData } from '../_shared/scraper.client';

export interface WebsiteAnalysis {
  sells:         string[];
  is_b2b:        boolean;
  sells_china:   boolean | null;
  private_label: boolean | null;
  firm_type:     string | null;
  pain_points:   string[];
  summary:       string;
}

export async function analyzeCompanyWebsite(url: string): Promise<WebsiteAnalysis> {
  const page = await scrape(url, { profile: 'lead-page', return_text: true, mode: 'stealthy' });
  const data = page.data as unknown as LeadPageData;
  const text = String(page.text ?? '').slice(0, 12000) || data.text_content?.slice(0, 12000) || '';

  const PAIN_POINT_OPTIONS = [
    "Çin'e bağımlı",
    'MOQ sorunu var',
    'Private label yapıyor',
    'Online kanalda zayıf',
    'Distribütör arıyor',
    'Tek tedarikçiye bağımlı',
  ];

  let summary = '';
  let painPoints: string[] = [];

  if (text) {
    try {
      const raw = await askBestAvailable(
        `Analyze this company website for B2B lead qualification.\nReturn ONLY valid JSON (no markdown, no code fence) in this exact format:\n{"summary":"Turkish 2-3 sentence description of the company","pain_points":[]}\nFor pain_points choose up to 3 that apply from these exact strings (empty array if none): ${PAIN_POINT_OPTIONS.map(s => JSON.stringify(s)).join(', ')}\n\nWebsite text:\n${text}`,
      );
      const parsed = JSON.parse(raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, ''));
      if (typeof parsed?.summary === 'string') summary = parsed.summary;
      if (Array.isArray(parsed?.pain_points)) {
        painPoints = parsed.pain_points.filter((p: unknown): p is string => typeof p === 'string' && PAIN_POINT_OPTIONS.includes(p));
      }
    } catch {
      summary = [data.title, data.description].filter(Boolean).join(' — ') || text.slice(0, 500);
    }
  }

  return {
    sells:         data.product_keywords?.slice(0, 10) ?? [],
    is_b2b:        data.has_b2b_signals ?? false,
    sells_china:   data.has_china_signals ? true : null,
    private_label: data.has_private_label ? true : null,
    firm_type:     data.firm_type_hints?.[0] ?? null,
    pain_points:   painPoints,
    summary,
  };
}
