// =============================================================
// FILE: backend/src/modules/lead-machine/campaign/host-exhibitor.lookup.ts
// Fetches the host exhibitor's own page on Messe Frankfurt for a campaign
// so we can sync their public keywords/description into the linked ICP.
// =============================================================

const MESSE_API_BASE = 'https://api.messefrankfurt.com/service/esb_api';
const MESSE_PUBLIC_API_KEY = 'LXnMWcYQhipLAS7rImEzmZ3CkrU033FMha9cwVSngG4vbufTsAOCQQ==';

export interface HostExhibitorData {
  rewrite_id: string | null;
  name: string;
  short_description: string | null;
  description: string | null;
  keywords: string[];
  product_names: string[];
  hall: string | null;
  booth: string | null;
  source_url: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&szlig;/gi, 'ß')
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Uuml;/g, 'Ü');
}

function clean(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const stripped = decodeHtmlEntities(text)
    .replace(/<span[^>]*class="highlighted"[^>]*>/g, '')
    .replace(/<\/span>/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  return stripped || null;
}

function firstBoothString(halls: any[]): { hall: string | null; booth: string | null } {
  for (const h of halls ?? []) {
    const stand = (h?.stand ?? []).find((s: any) => s?.name);
    if (stand?.name) {
      return { hall: clean(h?.name ?? h?.id), booth: clean(stand.name) };
    }
  }
  return { hall: null, booth: null };
}

interface SearchOpts {
  eventId?: string;
  query: string;
}

export async function searchMesseExhibitor(opts: SearchOpts): Promise<HostExhibitorData | null> {
  const url = new URL(`${MESSE_API_BASE}/exhibitor-service/api/2.1/public/exhibitor/search`);
  url.searchParams.set('language', 'en-GB');
  url.searchParams.set('q', opts.query);
  url.searchParams.set('pageNumber', '1');
  url.searchParams.set('pageSize', '5');
  url.searchParams.set('findEventVariable', opts.eventId ?? 'AUTOMECHANIKA');

  const res = await fetch(url, {
    headers: { apikey: process.env.MESSE_FRANKFURT_API_KEY || MESSE_PUBLIC_API_KEY },
  });
  if (!res.ok) throw new Error(`MESSE_API_FAILED_${res.status}`);
  const json = await res.json() as any;
  const hits = json?.result?.hits ?? [];
  const wanted = opts.query.trim().toLowerCase();

  // Prefer the hit whose name (stripped of highlight spans) contains the full query
  const ranked = hits
    .map((h: any) => {
      const ex = h?.exhibitor;
      if (!ex) return null;
      const name = clean(ex.name) ?? '';
      const score = name.toLowerCase().includes(wanted) ? 2 : 1;
      return { score, exhibitor: ex, name };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score);

  const top = ranked[0];
  if (!top?.exhibitor) return null;

  const ex = top.exhibitor;
  const description = clean((ex.description ?? {}).text);
  const shortDescription = clean(ex.shortDescription);
  const keywords = (ex.keyWords ?? [])
    .map((k: unknown) => clean(k))
    .filter((k: string | null): k is string => Boolean(k));
  const productNames = ((ex.products ?? {}).products ?? [])
    .map((p: any) => clean(p?.name))
    .filter((p: string | null): p is string => Boolean(p));
  const halls = (ex.exhibition ?? {}).exhibitionHall ?? [];
  const { hall, booth } = firstBoothString(halls);
  const rewriteId = clean(ex.rewriteId);
  const sourceUrl = rewriteId
    ? `https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html/${rewriteId}.html`
    : url.toString();

  return {
    rewrite_id: rewriteId,
    name: top.name,
    short_description: shortDescription,
    description,
    keywords,
    product_names: productNames,
    hall,
    booth,
    source_url: sourceUrl,
  };
}
