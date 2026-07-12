/**
 * Oxylabs Realtime API istemcisi.
 *
 * İki kullanım:
 *  - googleSearch(query)  → arama sonuçlarından firmanın GERÇEK web sitesini bulmak
 *  - universalScrape(url) → herhangi bir sayfanın HTML'ini almak (e-posta/telefon çıkarımı)
 *
 * Kimlik bilgileri YALNIZCA env'den okunur (OXYLABS_USER / OXYLABS_PASS);
 * repoda hiçbir değer tutulmaz. Env boşsa istemci devre dışıdır (isEnabled=false).
 */
import { env } from '@/core/env';

const ENDPOINT = 'https://realtime.oxylabs.io/v1/queries';
const TIMEOUT_MS = Number(process.env.OXYLABS_TIMEOUT_MS ?? 45_000);

export function isOxylabsEnabled(): boolean {
  return Boolean(env.OXYLABS_USER && env.OXYLABS_PASS);
}

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${env.OXYLABS_USER}:${env.OXYLABS_PASS}`).toString('base64');
}

async function query<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: authHeader() },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OXYLABS_ERROR_${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

type OxyResponse<C> = { results?: Array<{ content?: C }> };

/** Google arama sonuçlarındaki organik linkleri döndürür (sıralı). */
export async function googleSearchUrls(q: string, geo?: string): Promise<string[]> {
  type Content = { results?: { organic?: Array<{ url?: string }> } };
  const data = await query<OxyResponse<Content>>({
    source: 'google_search',
    query: q,
    parse: true,
    ...(geo ? { geo_location: geo } : {}),
  });
  const organic = data.results?.[0]?.content?.results?.organic ?? [];
  return organic.map((o) => o.url).filter((u): u is string => Boolean(u));
}

/** Herhangi bir URL'nin ham HTML'ini döndürür (universal kaynağı). */
export async function universalScrape(url: string): Promise<string | null> {
  const data = await query<OxyResponse<string>>({ source: 'universal', url });
  const content = data.results?.[0]?.content;
  return typeof content === 'string' ? content : null;
}

/** HTML metninden e-posta adreslerini çıkarır (gürültü filtreli). */
export function extractEmailsFromHtml(html: string): string[] {
  const found = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
  const bad = /\.(png|jpe?g|gif|svg|webp|css|js)$|^[0-9a-f]{16,}@|sentry|example\.com|@2x|wixpress/i;
  return [...new Set(found.map((e) => e.toLowerCase()).filter((e) => !bad.test(e)))];
}
