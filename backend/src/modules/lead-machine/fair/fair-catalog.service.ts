/**
 * Fuar kataloğu — arama + katılımcı (exhibitor) sayfası keşfi.
 *
 * MALİYET KURALI: burada ÜCRETLİ servis (Google Places / Oxylabs) KULLANILMAZ.
 * Katılımcı sayfası, fuarın kendi sitesinden ücretsiz olarak keşfedilir:
 *   1) doğrudan HTTP ile fuar sitesinin HTML'i alınır,
 *   2) linkler arasında "exhibitor / katılımcı / aussteller / expositor" kalıpları aranır,
 *   3) bulunamazsa kendi scraper-service'imiz (ücretsiz) ile bir kez daha denenir.
 */
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';
import { scrape } from '../_shared/scraper.client';

export interface FairRow extends RowDataPacket {
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
  exhibitor_url: string | null;
  source: string;
}

export interface FairSearchParams {
  q?: string;
  country?: string;
  sector?: string;
  from?: string;          // bu tarihten sonra başlayanlar (YYYY-MM-DD)
  onlyUpcoming?: boolean; // bugünden sonrakiler
  limit?: number;
  offset?: number;
}

/** Katalog araması: ad/sektör/şehir üzerinde serbest metin + ülke/tarih filtreleri. */
export async function searchFairs(p: FairSearchParams): Promise<{ rows: FairRow[]; total: number }> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (p.q?.trim()) {
    const like = `%${p.q.trim()}%`;
    where.push('(name LIKE ? OR name_en LIKE ? OR sector LIKE ? OR city LIKE ? OR organizer LIKE ?)');
    values.push(like, like, like, like, like);
  }
  if (p.country?.trim()) { where.push('country = ?'); values.push(p.country.trim()); }
  if (p.sector?.trim()) { where.push('sector LIKE ?'); values.push(`%${p.sector.trim()}%`); }
  if (p.from?.trim()) { where.push('start_date >= ?'); values.push(p.from.trim()); }
  if (p.onlyUpcoming) { where.push('start_date >= CURDATE()'); }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Math.min(Math.max(Number(p.limit ?? 30), 1), 100);
  const offset = Math.max(Number(p.offset ?? 0), 0);

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM fairs ${clause}`,
    values as never[],
  );
  const [rows] = await pool.execute<FairRow[]>(
    `SELECT id, name, name_en, sector, country, city, venue, organizer,
            start_date, end_date, date_status, website, exhibitor_url, source
       FROM fairs ${clause}
      ORDER BY (start_date IS NULL), start_date ASC, name ASC
      LIMIT ${limit} OFFSET ${offset}`,
    values as never[],
  );
  return { rows, total: Number(countRows[0]?.n ?? 0) };
}

export async function getFair(id: string): Promise<FairRow | null> {
  const [rows] = await pool.execute<FairRow[]>('SELECT * FROM fairs WHERE id = ? LIMIT 1', [id]);
  return rows[0] ?? null;
}

// ─── Katılımcı sayfası keşfi (ÜCRETSİZ) ──────────────────────────────────────

const EXHIBITOR_PATTERN = /(exhibitor|exhibitors|katilimci|katılımcı|katilimcilar|aussteller|expositor|expositores|esposit|participants?|firma-listesi|company-list)/i;

function absoluteUrl(href: string, base: string): string | null {
  try { return new URL(href, base).toString(); } catch { return null; }
}

function normalizeSite(site: string): string {
  const s = site.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

/** HTML içindeki linklerden katılımcı-listesi adaylarını çıkarır. */
function exhibitorLinksFromHtml(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1] ?? '';
    const text = (m[2] ?? '').replace(/<[^>]+>/g, ' ');
    if (!EXHIBITOR_PATTERN.test(href) && !EXHIBITOR_PATTERN.test(text)) continue;
    const abs = absoluteUrl(href, baseUrl);
    if (abs && /^https?:\/\//i.test(abs)) out.push(abs);
  }
  // Kısa/temiz URL'leri öne al (genelde asıl katılımcı listesi sayfası)
  return [...new Set(out)].sort((a, b) => a.length - b.length);
}

/** Doğrudan HTTP ile sayfayı çeker (ücretsiz, scraper kotası harcamaz). */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; IsletmeniYonetBot/1.0)' },
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('html')) return null;
    return await res.text();
  } catch { return null; }
}

export interface DiscoverResult {
  exhibitor_url: string | null;
  website: string | null;
  candidates: string[];
  note: string;
}

/**
 * Fuarın katılımcı listesi sayfasını bulur (ücretsiz).
 * Sırayla: fuar sitesinin ana sayfası → linklerde exhibitor kalıpları →
 * bulunamazsa scraper-service ile bir deneme daha.
 */
export async function discoverExhibitorUrl(fair: FairRow): Promise<DiscoverResult> {
  const site = fair.website ? normalizeSite(fair.website) : null;
  if (!site) {
    return { exhibitor_url: null, website: null, candidates: [], note: 'Fuarın web sitesi kayıtlı değil — önce site adresi gerekiyor.' };
  }

  // 1) Doğrudan HTTP (ücretsiz)
  const html = await fetchHtml(site);
  if (html) {
    const links = exhibitorLinksFromHtml(html, site);
    if (links.length) {
      return { exhibitor_url: links[0]!, website: site, candidates: links.slice(0, 8), note: 'Fuar sitesinden bulundu.' };
    }
  }

  // 2) Kendi scraper-service'imiz (yine ücretsiz) — bot korumalı siteler için
  try {
    const res = await scrape(site, { profile: 'lead-page', return_text: true });
    const data = res.data as { text_content?: string } | undefined;
    const text = data?.text_content ?? '';
    if (EXHIBITOR_PATTERN.test(text)) {
      return {
        exhibitor_url: null,
        website: res.final_url || site,
        candidates: [],
        note: 'Sitede katılımcı bölümü var gibi görünüyor ama doğrudan link çıkarılamadı — katılımcı sayfasını elle girin.',
      };
    }
  } catch { /* sessiz geç */ }

  return { exhibitor_url: null, website: site, candidates: [], note: 'Katılımcı listesi linki bulunamadı — sayfayı elle girebilirsiniz.' };
}

/** Keşif sonucunu kataloğa yazar. */
export async function saveFairDiscovery(id: string, exhibitorUrl: string | null, website: string | null): Promise<void> {
  await pool.execute(
    `UPDATE fairs
        SET exhibitor_url = COALESCE(?, exhibitor_url),
            website = COALESCE(?, website),
            verified_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [exhibitorUrl, website, id],
  );
}

/** Kullanıcının elle girdiği katılımcı sayfasını kaydeder. */
export async function setExhibitorUrl(id: string, url: string): Promise<void> {
  await pool.execute(
    'UPDATE fairs SET exhibitor_url = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?',
    [url.slice(0, 500), id],
  );
}
