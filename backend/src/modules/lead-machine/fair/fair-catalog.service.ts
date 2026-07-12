/**
 * Fuar kataloğu — arama + fuar sitesi / güncel tarih / katılımcı sayfası keşfi.
 *
 * MALİYET KURALI: burada ÜCRETLİ servis (Google Places / Oxylabs) KULLANILMAZ.
 * Her şey ücretsiz kanallardan yapılır:
 *   1) fuar sitesi bilinmiyorsa DuckDuckGo HTML araması (anahtarsız) ile bulunur,
 *   2) doğrudan HTTP ile fuar sitesinin HTML'i alınır,
 *   3) linkler arasında "exhibitor / katılımcı / aussteller / expositor" kalıpları aranır,
 *   4) aynı HTML'den fuarın güncel tarihi çıkarılmaya çalışılır,
 *   5) bot koruması varsa kendi scraper-service'imiz (ücretsiz) ile bir deneme daha.
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
  // Yaklaşan fuarlar başa (tarihi en yakın olan önce); tarihi geçmiş/bilinmeyenler sona.
  // Dünya takvimi kayıtlarının tarihi 2024'te kalmış olabilir — bunlar seçilince keşifle güncellenir.
  const [rows] = await pool.execute<FairRow[]>(
    `SELECT id, name, name_en, sector, country, city, venue, organizer,
            start_date, end_date, date_status, website, exhibitor_url, source
       FROM fairs ${clause}
      ORDER BY (start_date IS NOT NULL AND start_date >= CURDATE()) DESC,
               CASE WHEN start_date >= CURDATE() THEN start_date END ASC,
               name ASC
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

// ─── Fuar sitesini bulma (ÜCRETSİZ web araması) ──────────────────────────────

/** Fuar sitesi olamayacak hostlar: dizinler, sosyal medya, haber/aggregator. */
const NON_FAIR_HOSTS = [
  '10times.com', 'tradefairdates.com', 'eventseye.com', 'expodatabase.com', 'biztradeshows.com',
  'nseventsdb.com', 'events.com', 'allevents.in', 'wikipedia.org', 'facebook.com', 'instagram.com',
  'linkedin.com', 'twitter.com', 'x.com', 'youtube.com', 'pinterest.com', 'tiktok.com',
  'duckduckgo.com', 'google.com', 'bing.com', 'yandex.com', 'amazon.com', 'booking.com',
  'tripadvisor.com', 'cns.travel', 'fuarrehberi.com', 'fuarlist.com', 'expofairs.com',
  'trade-fairs.com', 'messeinfo.de', 'auma.de', 'conferenceindex.org', 'eventbrite.com',
];

/** İsim/host eşleştirmesinde işe yaramayan genel kelimeler. */
const NAME_STOPWORDS = new Set([
  'fuar', 'fuari', 'fuarı', 'expo', 'exhibition', 'exhibitions', 'fair', 'fairs', 'show', 'trade',
  'international', 'uluslararasi', 'uluslararası', 'ihtisas', 'messe', 'salon', 'forum', 'summit',
  'congress', 'week', 'days', 'the', 'and', 've', 'of', 'for', 'ile', 'san', 'tic',
]);

/** Fuar adını host eşleştirmede kullanılabilecek anlamlı parçalara böler. */
function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !NAME_STOPWORDS.has(t) && !/^\d+$/.test(t));
}

/** DDG sonuç sayfasındaki hedef linkleri (uddg=) çözer. */
function ddgLinks(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/uddg=([^&"']+)/g)) {
    try {
      const target = decodeURIComponent(m[1] ?? '');
      if (/^https?:\/\//i.test(target)) out.push(target);
    } catch { /* bozuk encode — atla */ }
  }
  return [...new Set(out)];
}

/**
 * DDG art arda sorguda 202 + "anomaly" sayfasi doner. Sorgular arasinda en az
 * DDG_MIN_GAP_MS birakiyoruz; paralel worker'lar bu kapiya sirayla girer.
 */
const DDG_MIN_GAP_MS = 2500;
let ddgGate: Promise<void> = Promise.resolve();

function paceDdg(): Promise<void> {
  const wait = ddgGate.then(() => new Promise<void>((r) => setTimeout(r, DDG_MIN_GAP_MS)));
  ddgGate = wait;
  return wait;
}

/**
 * Ücretsiz web araması. API anahtarı yok, ücretli servis yok.
 *   1) DuckDuckGo HTML doğrudan (hız sınırlı),
 *   2) 202/boş dönerse kendi scraper-service'imiz üzerinden (yine ücretsiz).
 */
async function webSearch(query: string): Promise<string[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  await paceDdg();
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        'accept-language': 'en-US,en;q=0.8,tr;q=0.6',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const links = ddgLinks(await res.text());
      if (links.length) return links;
    }
  } catch { /* aşağıdaki yedek kanala düş */ }

  // Yedek: kendi scraper'ımız (stealth) — DDG bizi hız sınırına takarsa
  try {
    const res = await scrape(url, { mode: 'stealthy', return_html: true, return_text: false });
    if (res.html) return ddgLinks(res.html);
  } catch { /* sessiz geç */ }

  return [];
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./i, '').toLowerCase(); } catch { return ''; }
}

/**
 * Adayın fuar sitesi olma puanı: host'ta eşleşen anlamlı kelime sayısı.
 * 0 → aday değil. Tek kelime eşleşmesi yanıltabildiği için ("bauma CONEXPO INDIA"
 * → bauma.de) en çok kelimeyi tutturan aday seçilir.
 */
function fairSiteScore(url: string, tokens: string[]): number {
  const host = hostOf(url);
  if (!host) return 0;
  if (NON_FAIR_HOSTS.some((bad) => host === bad || host.endsWith(`.${bad}`))) return 0;
  const flat = host.replace(/[^a-z0-9]/g, '');
  return tokens.filter((t) => flat.includes(t)).length;
}

/** Fuarın resmî sitesini ücretsiz web aramasıyla bulur (kök adres döner). */
export async function findFairWebsite(fair: FairRow): Promise<string | null> {
  const tokens = nameTokens(fair.name_en?.trim() || fair.name);
  if (!tokens.length) return null;

  const place = [fair.city, fair.country].filter(Boolean).join(' ');
  const queries = [
    `${fair.name_en?.trim() || fair.name} ${place} official website`,
    `${fair.name} ${place} fuar resmi site`,
  ];

  for (const q of queries) {
    const hits = await webSearch(q);
    // En çok kelime tutturan aday kazanır; eşitlikte arama sırası (alaka) belirler.
    let bestUrl = '';
    let bestScore = 0;
    for (const url of hits) {
      const score = fairSiteScore(url, tokens);
      if (score > bestScore) { bestUrl = url; bestScore = score; }
    }
    if (bestUrl) {
      try { return new URL(bestUrl).origin; } catch { return bestUrl; }
    }
  }
  return null;
}

// ─── Güncel tarih çıkarımı (fuarın kendi sayfasından) ────────────────────────

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  ocak: 1, subat: 2, mart: 3, nisan: 4, mayis: 5, haziran: 6, temmuz: 7,
  agustos: 8, eylul: 9, ekim: 10, kasim: 11, aralik: 12,
  januar: 1, februar: 2, marz: 3, mai: 5, juni: 6, juli: 7, oktober: 10, dezember: 12,
  // Lehçe
  stycznia: 1, styczen: 1, lutego: 2, luty: 2, marca: 3, marzec: 3, kwietnia: 4, kwiecien: 4,
  maja: 5, czerwca: 6, czerwiec: 6, lipca: 7, lipiec: 7, sierpnia: 8, sierpien: 8,
  wrzesnia: 9, wrzesien: 9, pazdziernika: 10, pazdziernik: 10, listopada: 11, listopad: 11,
  grudnia: 12, grudzien: 12,
  // Fransızca
  janvier: 1, fevrier: 2, mars: 3, avril: 4, juin: 6, juillet: 7, aout: 8, septembre: 9,
  octobre: 10, novembre: 11, decembre: 12,
  // İspanyolca / İtalyanca
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  gennaio: 1, febbraio: 2, aprile: 4, maggio: 5, giugno: 6, luglio: 7, settembre: 9,
  ottobre: 10, dicembre: 12,
};

function deaccent(s: string): string {
  return s.toLowerCase()
    .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c').replace(/[äÄ]/g, 'a');
}

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

export interface FairDates { start: string; end: string | null }

/**
 * Sayfa metninden fuarın (gelecek) tarihini çıkarır.
 * Desteklenen kalıplar: "12-15 May 2026", "May 12-15, 2026", "12-15 Mayıs 2026",
 * "12.05.2026 - 15.05.2026", "2026-05-12".
 */
export function extractFairDates(html: string): FairDates | null {
  const text = deaccent(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 730 * 864e5).toISOString().slice(0, 10); // ~2 yıl
  const found: FairDates[] = [];

  const push = (start: string | null, end: string | null) => {
    if (!start || start < today || start > horizon) return;
    found.push({ start, end: end && end >= start && end <= horizon ? end : null });
  };

  // Uzun ay adları önce denensin ("mar" kısaltması "marca"yı yutmasın)
  const mon = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');

  // "12 - 15 May 2026" / "12-15 mayis 2026"
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})\\s*[-–—/]\\s*(\\d{1,2})\\s+(${mon})\\.?,?\\s+(\\d{4})\\b`, 'g'))) {
    const mm = MONTHS[m[3]!]!; const y = Number(m[4]);
    push(iso(y, mm, Number(m[1])), iso(y, mm, Number(m[2])));
  }
  // "May 12 - 15, 2026"
  for (const m of text.matchAll(new RegExp(`\\b(${mon})\\.?\\s+(\\d{1,2})\\s*[-–—]\\s*(\\d{1,2}),?\\s+(\\d{4})\\b`, 'g'))) {
    const mm = MONTHS[m[1]!]!; const y = Number(m[4]);
    push(iso(y, mm, Number(m[2])), iso(y, mm, Number(m[3])));
  }
  // tek tarih: "15 May 2026" / "May 15, 2026"
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})\\s+(${mon})\\.?,?\\s+(\\d{4})\\b`, 'g'))) {
    push(iso(Number(m[3]), MONTHS[m[2]!]!, Number(m[1])), null);
  }
  for (const m of text.matchAll(new RegExp(`\\b(${mon})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'g'))) {
    push(iso(Number(m[3]), MONTHS[m[1]!]!, Number(m[2])), null);
  }
  // "12.05.2026 - 15.05.2026" veya tek "12.05.2026"
  for (const m of text.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})(?:\s*[-–—]\s*(\d{1,2})[./](\d{1,2})[./](\d{4}))?/g)) {
    push(iso(Number(m[3]), Number(m[2]), Number(m[1])), m[6] ? iso(Number(m[6]), Number(m[5]), Number(m[4])) : null);
  }
  // ISO
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    push(iso(Number(m[1]), Number(m[2]), Number(m[3])), null);
  }

  if (!found.length) return null;
  // En yakın gelecek tarih, fuarın bir sonraki edisyonudur
  found.sort((a, b) => a.start.localeCompare(b.start));
  return found[0]!;
}

export interface DiscoverResult {
  exhibitor_url: string | null;
  website: string | null;
  start_date: string | null;
  end_date: string | null;
  candidates: string[];
  note: string;
}

/**
 * Fuarın sitesini, güncel tarihini ve katılımcı listesi sayfasını bulur (ücretsiz).
 * Sırayla: site yoksa web araması → ana sayfa HTML'i → exhibitor linkleri + tarih →
 * bulunamazsa scraper-service ile bir deneme daha.
 */
export async function discoverExhibitorUrl(fair: FairRow): Promise<DiscoverResult> {
  let site = fair.website ? normalizeSite(fair.website) : null;
  const notes: string[] = [];

  // 0) Site kayıtlı değilse ücretsiz web aramasıyla bul (Dünya takvimi kayıtlarında site yok)
  if (!site) {
    site = await findFairWebsite(fair);
    if (!site) {
      return {
        exhibitor_url: null, website: null, start_date: null, end_date: null, candidates: [],
        note: 'Fuarın resmî sitesi bulunamadı — site adresini elle girebilirsiniz.',
      };
    }
    notes.push('Site web aramasıyla bulundu.');
  }

  // 1) Doğrudan HTTP (ücretsiz)
  const html = await fetchHtml(site);
  if (html) {
    const dates = extractFairDates(html);
    if (dates) notes.push('Güncel tarih sitesinden okundu.');
    const links = exhibitorLinksFromHtml(html, site);
    if (links.length) {
      return {
        exhibitor_url: links[0]!, website: site,
        start_date: dates?.start ?? null, end_date: dates?.end ?? null,
        candidates: links.slice(0, 8),
        note: [...notes, 'Katılımcı sayfası fuar sitesinden bulundu.'].join(' '),
      };
    }
    if (dates) {
      return {
        exhibitor_url: null, website: site, start_date: dates.start, end_date: dates.end, candidates: [],
        note: [...notes, 'Katılımcı listesi linki bulunamadı — sayfayı elle girebilirsiniz.'].join(' '),
      };
    }
  }

  // 2) Kendi scraper-service'imiz (yine ücretsiz) — bot korumalı siteler için
  try {
    const res = await scrape(site, { profile: 'lead-page', return_text: true });
    const data = res.data as { text_content?: string } | undefined;
    const text = data?.text_content ?? '';
    const dates = extractFairDates(text);
    if (EXHIBITOR_PATTERN.test(text) || dates) {
      return {
        exhibitor_url: null,
        website: res.final_url || site,
        start_date: dates?.start ?? null,
        end_date: dates?.end ?? null,
        candidates: [],
        note: [...notes, 'Sitede katılımcı bölümü var gibi görünüyor ama link çıkarılamadı — sayfayı elle girin.'].join(' '),
      };
    }
  } catch { /* sessiz geç */ }

  return {
    exhibitor_url: null, website: site, start_date: null, end_date: null, candidates: [],
    note: [...notes, 'Katılımcı listesi linki bulunamadı — sayfayı elle girebilirsiniz.'].join(' '),
  };
}

/** Keşif sonucunu kataloğa yazar (tarih bulunduysa date_status='discovered'). */
export async function saveFairDiscovery(
  id: string,
  exhibitorUrl: string | null,
  website: string | null,
  dates?: { start: string | null; end: string | null },
): Promise<void> {
  await pool.execute(
    `UPDATE fairs
        SET exhibitor_url = COALESCE(?, exhibitor_url),
            website       = COALESCE(?, website),
            start_date    = COALESCE(?, start_date),
            end_date      = COALESCE(?, end_date),
            date_status   = CASE WHEN ? IS NOT NULL THEN 'discovered' ELSE date_status END,
            verified_at   = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [exhibitorUrl, website, dates?.start ?? null, dates?.end ?? null, dates?.start ?? null, id],
  );
}

/** Hatalı keşfedilmiş kaydı sıfırlar (yeniden keşfedilebilsin diye). */
export async function resetFairDiscovery(id: string): Promise<void> {
  await pool.execute(
    'UPDATE fairs SET website = NULL, exhibitor_url = NULL, verified_at = NULL WHERE id = ?',
    [id],
  );
}

/** Kullanıcının elle girdiği katılımcı sayfasını kaydeder. */
export async function setExhibitorUrl(id: string, url: string): Promise<void> {
  await pool.execute(
    'UPDATE fairs SET exhibitor_url = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?',
    [url.slice(0, 500), id],
  );
}
