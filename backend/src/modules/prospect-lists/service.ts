import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/db/client';
import { env } from '@/core/env';
import { deepScrapeContactInfo } from '@/modules/lead-machine/enrichment/enrichment.service';
import { searchGoogleMaps } from '@/modules/lead-machine/_shared/scraper.client';
import { buildSearchHints, EXPORT_B2B_TITLES } from '@/modules/lead-machine/decision-maker/finder.service';
import { searchDecisionMakers, domainFromWebsite } from '@/modules/lead-machine/decision-maker/apollo-people';
import { findDecisionMakerEmail } from '@/modules/lead-machine/decision-maker/email-finder.service';

export type ImportCompany = { company_name: string; website?: string | null };

// Firma adının sonundaki ülke ismini tahmin et (ör. "ALFA GROCERIES LTDA COLOMBIA" -> "COLOMBIA").
const COUNTRIES = [
  'COLOMBIA', 'UKRAINE', 'RUSSIAN FEDERATION', 'RUSSIA', 'CHINA', 'CANADA', 'ALBANIA', 'THAILAND',
  'GERMANY', 'FRANCE', 'ITALY', 'SPAIN', 'NETHERLANDS', 'BELGIUM', 'POLAND', 'TURKEY', 'TURKIYE',
  'USA', 'UNITED STATES', 'UNITED KINGDOM', 'UK', 'INDIA', 'BRAZIL', 'MEXICO', 'JAPAN', 'KOREA',
  'EGYPT', 'MOROCCO', 'GREECE', 'ROMANIA', 'BULGARIA', 'HUNGARY', 'AUSTRIA', 'SWITZERLAND',
  'SWEDEN', 'NORWAY', 'DENMARK', 'FINLAND', 'PORTUGAL', 'IRELAND', 'CZECHIA', 'CZECH REPUBLIC',
  'SAUDI ARABIA', 'UAE', 'UNITED ARAB EMIRATES', 'QATAR', 'KUWAIT', 'ISRAEL', 'AUSTRALIA',
];
function detectCountry(name: string): string | null {
  const upper = name.toUpperCase();
  for (const c of COUNTRIES) {
    if (upper.endsWith(' ' + c) || upper === c) return c;
  }
  return null;
}

function pickBestEmail(emails: string[]): string | null {
  const cleaned = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => /@/.test(e)))];
  if (!cleaned.length) return null;
  const generic = /^(info|sales|office|contact|kontakt|hello|support|admin)@/;
  const personal = cleaned.find((e) => !generic.test(e));
  return personal ?? cleaned[0] ?? null;
}

/**
 * Telefon doğrulama: scraper metinden IP adresi/tarih/rastgele sayı yakalayabiliyor
 * (canlıda "187.77.79.59" telefon olarak kaydedilmişti). En az 7 rakam iste ve
 * IP benzeri (a.b.c.d) değerleri reddet.
 */
function pickBestPhone(phones: string[]): string | null {
  for (const raw of phones) {
    const p = String(raw ?? '').trim();
    if (!p) continue;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(p.replace(/\s/g, ''))) continue; // IP adresi
    const digits = p.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) continue;
    return p;
  }
  return null;
}

/**
 * Website "çöp" mü? Excel'den gelen website kolonu sıklıkla firma sitesi DEĞİL:
 * haber makalesi, xlsx/pdf dosyası, B2B veri sağlayıcı/dizin sayfası olabiliyor.
 * Böyle bir siteyi taramak yanlış veri üretir (ör. theprint.in -> feedback@theprint.in).
 */
const JUNK_HOSTS = [
  // B2B veri sağlayıcı / gümrük dizinleri
  'volza.com', 'dnb.com', 'importgenius.com', 'marketinsidedata.com', 'canadacompanyregistry.com',
  'panjiva.com', 'zauba.com', 'exportgenius.in', 'seair.co.in', 'tradeindia.com', 'importkey.com',
  'trademo.com', 'tracxn.com', 'exportersindia.com', 'indiamart.com', 'alibaba.com',
  'made-in-china.com', 'europages.co.uk', 'europages.com', 'kompass.com', 'b2bhint.com',
  // Firma rehberi / sicil / sarı sayfalar
  'biz-gid.com', 'opencorporates.com', 'atninfo.com', 'organic-bio.com', 'hidubai.com',
  'uaeresults.com', 'company-listing.org', '2gis.ae', 'easyuae.com', 'yellowpages.com',
  'data.gouv.fr', 'annuaire-entreprises.data.gouv.fr', 'fts.unocha.org',
  // Sosyal / ansiklopedi / haber / arama
  'bloomberg.com', 'crunchbase.com', 'linkedin.com', 'facebook.com', 'instagram.com', 'x.com',
  'twitter.com', 'wikipedia.org', 'youtube.com', 'google.com', 'theprint.in', 'bm.ge',
];
export function isJunkWebsite(url: string | null | undefined): boolean {
  if (!url) return true;
  const u = String(url).trim().toLowerCase();
  if (!/^https?:\/\//.test(u)) return true;
  if (/\.(xlsx?|pdf|docx?|csv|zip|pptx?)(\?|#|$)/.test(u)) return true; // dosya linki
  let host = '';
  try { host = new URL(u).hostname.replace(/^www\./, ''); } catch { return true; }
  if (JUNK_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return true;
  // Haber/makale benzeri uzun path'ler (firma ana sayfası değil)
  try {
    const path = new URL(u).pathname;
    if (/(press-release|news|article|company-profile|business-directory|importers?\/)/i.test(path)) return true;
    if (path.split('/').filter(Boolean).length >= 4) return true;
  } catch { /* yoksay */ }
  return false;
}

/** Firma adından gerçek web sitesini bulur (Google Places). Bulamazsa null. */
async function findCompanyWebsite(companyName: string, country: string | null): Promise<string | null> {
  const query = [companyName, country].filter(Boolean).join(' ');
  try {
    const res = await searchGoogleMaps(query, { total: 3 });
    for (const place of res.places ?? []) {
      const site = place.website;
      if (site && !isJunkWebsite(site)) return site;
    }
  } catch { /* arama başarısız — sessiz geç */ }
  return null;
}

/* -------------------- Import -------------------- */

export async function importList(
  tenantKey: string,
  ownerId: string,
  name: string,
  sourceFile: string | null,
  companies: ImportCompany[],
): Promise<{ listId: string; total: number }> {
  const listId = randomUUID();
  const rows = companies
    .map((c) => ({ company_name: String(c.company_name ?? '').trim(), website: (c.website ?? '').toString().trim() || null }))
    .filter((c) => c.company_name);

  await pool.execute(
    `INSERT INTO prospect_lists (id, tenant_key, owner_user_id, name, source_file, total)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [listId, tenantKey, ownerId, name, sourceFile, rows.length],
  );

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const values: unknown[] = [];
    const placeholders = slice
      .map((c, j) => {
        // website de 500'e kırpılmalı: şema varchar(500). Kırpılmadığı için uzun bir URL
        // (ör. 792 karakterlik facebook linki) tüm CHUNK'ı "Data too long" ile düşürüyor
        // ve o chunk'taki firmalar hiç kaydedilmiyordu (2332 satırdan yalnızca 2000'i geldi).
        const site = c.website ? String(c.website).trim().slice(0, 500) : null;
        values.push(randomUUID(), tenantKey, ownerId, listId, i + j, c.company_name.slice(0, 500), detectCountry(c.company_name), site || null);
        return '(?, ?, ?, ?, ?, ?, ?, ?)';
      })
      .join(', ');
    await pool.query(
      `INSERT INTO prospect_companies
         (id, tenant_key, owner_user_id, list_id, row_index, company_name, country, website)
       VALUES ${placeholders}`,
      values,
    );
  }

  return { listId, total: rows.length };
}

/* -------------------- Read -------------------- */

export async function listLists(tenantKey: string, ownerId: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, name, source_file, total, free_done, apollo_done, created_at
       FROM prospect_lists
      WHERE tenant_key = ? AND owner_user_id = ?
      ORDER BY created_at DESC`,
    [tenantKey, ownerId],
  );
  return rows;
}

export async function listCompanies(tenantKey: string, ownerId: string, listId: string, limit = 200, offset = 0) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, row_index, company_name, country, website, generic_email, phone, linkedin_search_url,
            decision_maker_name, decision_maker_title, decision_maker_linkedin, decision_maker_email,
            decision_maker_email_source, enrich_status, error
       FROM prospect_companies
      WHERE tenant_key = ? AND owner_user_id = ? AND list_id = ?
      ORDER BY row_index ASC
      LIMIT ? OFFSET ?`,
    [tenantKey, ownerId, listId, limit, offset],
  );
  return rows;
}

async function refreshStats(listId: string) {
  await pool.execute(
    `UPDATE prospect_lists pl
        SET free_done = (SELECT COUNT(*) FROM prospect_companies WHERE list_id = pl.id AND enrich_status IN ('free_done','apollo_running','apollo_done')),
            apollo_done = (SELECT COUNT(*) FROM prospect_companies WHERE list_id = pl.id AND enrich_status = 'apollo_done')
      WHERE pl.id = ?`,
    [listId],
  );
}

/* -------------------- Enrichment (background) -------------------- */

async function processPool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i]!).catch(() => {});
    }
  });
  await Promise.all(workers);
}

/**
 * Ücretsiz enrichment hedefleri: henüz denenmemiş (pending) VEYA denenip hiç sonuç
 * bulunamamış (e-posta/telefon boş) kayıtlar. Böylece "Ücretsiz Zenginleştir" tekrar
 * basıldığında boş kalanlar YENİDEN taranır (scraper geçici erişilemezse eskiden
 * hepsi boş 'free_done' kalıyor ve bir daha asla denenmiyordu).
 * Apollo sonuçlarına ve o an çalışanlara dokunulmaz; sonuç bulunmuş kayıtlar tekrar taranmaz.
 */
const FREE_ENRICH_TARGET_SQL = `
  FROM prospect_companies
  WHERE tenant_key = ? AND owner_user_id = ? AND list_id = ?
    AND enrich_status NOT IN ('free_running', 'apollo_running', 'apollo_done')
    AND (enrich_status = 'pending' OR (generic_email IS NULL AND phone IS NULL))
`;

/** Ücretsiz taramada işlenecek firma sayısı (UI'da bildirmek için). */
export async function countFreeEnrichTargets(tenantKey: string, ownerId: string, listId: string): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS n ${FREE_ENRICH_TARGET_SQL}`,
    [tenantKey, ownerId, listId],
  );
  return Number(rows[0]?.n ?? 0);
}

// ÜCRETSIZ: website scrape -> email/telefon + LinkedIn arama linki. Apollo kullanmaz.
export async function runFreeEnrich(tenantKey: string, ownerId: string, listId: string): Promise<void> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, company_name, country, website ${FREE_ENRICH_TARGET_SQL}`,
    [tenantKey, ownerId, listId],
  );
  // 6 firma paralel (her firma birkaç sayfa gezer). Scraper-service'i boğmadan
  // büyük listelerin (2000+) makul sürede tamamlanması için.
  await processPool(rows, 6, async (row) => {
    await pool.execute(`UPDATE prospect_companies SET enrich_status = 'free_running' WHERE id = ?`, [row.id]);
    try {
      let email: string | null = null;
      let phone: string | null = null;
      let dmName: string | null = null;

      // 1) Kullanılabilir bir firma sitesi belirle. Excel'den gelen website çoğu zaman
      //    firma sitesi değil (haber/dosya/dizin) → çöpse firma adından gerçek siteyi ara.
      let website: string | null = isJunkWebsite(row.website as string | null) ? null : (row.website as string);
      if (!website) {
        website = await findCompanyWebsite(row.company_name as string, (row.country as string | null) ?? null);
        if (website) {
          await pool.execute(`UPDATE prospect_companies SET website = ? WHERE id = ?`, [website, row.id]);
        }
      }

      // 2) Site bulunduysa iletişim bilgisi için tara.
      if (website) {
        const deep = await deepScrapeContactInfo(website);
        email = pickBestEmail(deep.emails);
        phone = pickBestPhone(deep.phones ?? []);
        const dm = (deep.decisionMakers ?? [])[0] as { name?: string | null } | undefined;
        dmName = dm?.name ?? null;
      }

      const hints = buildSearchHints(row.company_name, row.country, EXPORT_B2B_TITLES);
      await pool.execute(
        `UPDATE prospect_companies
            SET generic_email = ?, phone = ?, linkedin_search_url = ?, decision_maker_name = COALESCE(?, decision_maker_name),
                enrich_status = 'free_done', error = NULL
          WHERE id = ?`,
        [email, phone, hints.linkedin_people_search_url, dmName, row.id],
      );
    } catch (e) {
      await pool.execute(
        `UPDATE prospect_companies SET enrich_status = 'failed', error = ? WHERE id = ?`,
        [String((e as Error)?.message ?? 'error').slice(0, 500), row.id],
      );
    }
  });
  await refreshStats(listId);
}

// APOLLO (seçili firmalar): domain -> karar verici + kişisel email. Kredi tüketir.
export async function runApolloEnrich(tenantKey: string, ownerId: string, companyIds: string[]): Promise<{ listIds: string[] }> {
  if (!companyIds.length) return { listIds: [] };
  const placeholders = companyIds.map(() => '?').join(',');
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, list_id, company_name, website FROM prospect_companies
      WHERE tenant_key = ? AND owner_user_id = ? AND id IN (${placeholders})`,
    [tenantKey, ownerId, ...companyIds],
  );
  const listIds = [...new Set(rows.map((r) => r.list_id as string))];

  await processPool(rows, 2, async (row) => {
    await pool.execute(`UPDATE prospect_companies SET enrich_status = 'apollo_running' WHERE id = ?`, [row.id]);
    try {
      const domain = domainFromWebsite(row.website);
      let name: string | null = null;
      let title: string | null = null;
      let linkedin: string | null = null;
      if (domain) {
        const dms = await searchDecisionMakers(domain, EXPORT_B2B_TITLES);
        if (dms[0]) { name = dms[0].name; title = dms[0].title; linkedin = dms[0].linkedin_url; }
      }
      const emailRes = await findDecisionMakerEmail(
        { id: row.id, company_name: row.company_name, company_website: row.website, decision_maker_name: name },
        { allowApollo: true },
      );
      await pool.execute(
        `UPDATE prospect_companies
            SET decision_maker_name = COALESCE(?, decision_maker_name),
                decision_maker_title = COALESCE(?, decision_maker_title),
                decision_maker_linkedin = COALESCE(?, decision_maker_linkedin),
                decision_maker_email = COALESCE(?, decision_maker_email),
                decision_maker_email_source = COALESCE(?, decision_maker_email_source),
                enrich_status = 'apollo_done', error = NULL
          WHERE id = ?`,
        [name, title, linkedin, emailRes.email, emailRes.email_source, row.id],
      );
    } catch (e) {
      await pool.execute(
        `UPDATE prospect_companies SET enrich_status = 'failed', error = ? WHERE id = ?`,
        [String((e as Error)?.message ?? 'error').slice(0, 500), row.id],
      );
    }
  });
  for (const lid of listIds) await refreshStats(lid);
  return { listIds };
}

export function apolloEnabled(): boolean {
  return Boolean(env.APOLLO_API_KEY);
}
