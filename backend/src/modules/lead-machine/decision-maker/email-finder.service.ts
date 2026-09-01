import { pool } from '@/db/client';
import { env } from '@/core/env';
import { getActiveTenantKey } from '@/modules/_shared';
import { deepScrapeContactInfo, pickBestEmail, rankEmail } from '../enrichment/enrichment.service';
import { domainFromWebsite } from './apollo-people';

/**
 * Karar verici email bulma — KADEMELİ (kredi koruması):
 *  1) ÜCRETSİZ: firma website'ini scrape et (contact_emails), en iyi email'i seç.
 *     pickBestEmail kişisel-tarzı (ad.soyad@) email'i generic (info@) üstüne sıralar.
 *  2) ÜCRETLİ FALLBACK: scrape'te kişisel email yoksa VE allowApollo açıksa,
 *     Apollo people/match ile karar vericinin kişisel email'ini iste (reveal → kredi).
 * Öncelik: karar vericinin KİŞİSEL email'i; yoksa generic firma email'i.
 */

export type EmailFindInput = {
  id: string;
  company_name: string;
  decision_maker_name: string | null;
  company_website: string | null;
};

export type EmailFindResult = {
  id: string;
  email: string | null;
  email_source: 'website' | 'apollo' | null;
  personal: boolean;
};

function isUsableEmail(email: string | null | undefined): email is string {
  return typeof email === 'string' && /@/.test(email) && !/email_not_unlocked|not_unlocked|domain\.com$/i.test(email);
}

/** Apollo people/match ile kişisel email (reveal → kredi harcar). */
async function apolloFindEmail(domain: string, name: string | null): Promise<string | null> {
  if (!env.APOLLO_API_KEY || !env.APOLLO_DECISION_MAKER_ENABLED) return null;
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const body: Record<string, unknown> = { domain, reveal_personal_emails: true };
  if (parts.length) {
    body.first_name = parts[0];
    if (parts.length > 1) body.last_name = parts[parts.length - 1];
  } else {
    body.title = 'Owner CEO Founder Purchasing Manager General Manager';
  }
  try {
    const res = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.APOLLO_API_KEY },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { person?: { email?: string | null; email_address?: string | null } };
    const email = data.person?.email ?? data.person?.email_address ?? null;
    return isUsableEmail(email) ? email.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function findDecisionMakerEmail(
  row: EmailFindInput,
  opts: { allowApollo?: boolean } = {},
): Promise<EmailFindResult> {
  let email: string | null = null;
  let source: 'website' | 'apollo' | null = null;

  // 1) Ücretsiz website scrape
  if (row.company_website) {
    try {
      const deep = await deepScrapeContactInfo(row.company_website);
      const best = pickBestEmail(deep.emails);
      if (isUsableEmail(best)) { email = best; source = 'website'; }
    } catch {
      // best-effort
    }
  }

  // 2) Kişisel email tercih: scrape'te kişisel yoksa ve Apollo açıksa
  const personalFromScrape = email ? rankEmail(email) >= 4 : false;
  if (!personalFromScrape && opts.allowApollo) {
    const domain = domainFromWebsite(row.company_website);
    if (domain) {
      const apolloEmail = await apolloFindEmail(domain, row.decision_maker_name);
      if (apolloEmail) { email = apolloEmail; source = 'apollo'; }
    }
  }

  return { id: row.id, email, email_source: source, personal: email ? rankEmail(email) >= 4 : false };
}

/** Seçili karar vericiler için email bul + lead_decision_makers.email güncelle (tenant-scoped). */
export async function findEmailsForDecisionMakers(
  rows: EmailFindInput[],
  opts: { allowApollo?: boolean } = {},
): Promise<{ results: EmailFindResult[]; found: number; apollo: number; total: number }> {
  const tenantKey = await getActiveTenantKey();
  const results: EmailFindResult[] = [];
  let found = 0;
  let apollo = 0;
  const CONCURRENCY = 4;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    const batchRes = await Promise.all(batch.map((r) => findDecisionMakerEmail(r, opts)));
    for (const res of batchRes) {
      if (res.email && tenantKey) {
        await pool.execute(
          'UPDATE lead_decision_makers SET email = ?, email_source = ? WHERE id = ? AND tenant_key = ?',
          [res.email, res.email_source, res.id, tenantKey] as never[],
        );
        found += 1;
        if (res.email_source === 'apollo') apollo += 1;
      }
      results.push(res);
    }
  }
  return { results, found, apollo, total: rows.length };
}
