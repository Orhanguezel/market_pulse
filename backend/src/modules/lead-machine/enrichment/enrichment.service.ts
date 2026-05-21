import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { env } from '@/core/env';
import { getCandidate } from '../_shared/db';
import { scrape, type LeadPageData } from '../_shared/scraper.client';

function domainFromUrl(url: string | null) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] ?? '';
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const found = value.find((item) => typeof item === 'string' && item.trim());
    return typeof found === 'string' ? found.trim() : null;
  }
  return null;
}

function normalizeApolloDecisionMaker(payload: unknown) {
  const data = asRecord(payload);
  const person = asRecord(data.person ?? data.contact ?? data);
  const phoneNumbers = Array.isArray(person.phone_numbers) ? person.phone_numbers : [];
  const phoneRow = asRecord(phoneNumbers[0]);
  const firstName = firstString(person.first_name);
  const lastName = firstString(person.last_name);
  const joinedName = [firstName, lastName].filter(Boolean).join(' ');
  const fullName = firstString(person.name) ?? (joinedName || null);
  return {
    name: fullName,
    title: firstString(person.title ?? person.headline),
    email: firstString(person.email ?? person.email_address),
    linkedin_url: firstString(person.linkedin_url),
    phone: firstString(person.phone ?? person.sanitized_phone ?? phoneRow.sanitized_number ?? phoneRow.raw_number),
    raw: payload,
  };
}

export async function enrichCandidate(candidateId: string) {
  const candidate = await getCandidate(candidateId);
  if (!candidate) throw new Error('CANDIDATE_NOT_FOUND');
  const domain = domainFromUrl(candidate.website);
  let decisionMaker: unknown = null;
  let sourceVendor = 'scraped';

  if (env.APOLLO_API_KEY && domain) {
    const res = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.APOLLO_API_KEY },
      body: JSON.stringify({ domain, title: 'Owner CEO Purchasing Manager Category Manager Import Manager' }),
    });
    if (res.ok) {
      decisionMaker = normalizeApolloDecisionMaker(await res.json() as unknown);
      sourceVendor = 'apollo';
    }
  }

  if (!decisionMaker && candidate.website) {
    try {
      const page = await scrape(candidate.website, { profile: 'lead-page', return_text: true });
      const data = page.data as unknown as LeadPageData;
      const email = data.contact_emails?.[0] ?? null;
      const phone = data.contact_phones?.[0] ?? null;
      decisionMaker = { email, phone };
    } catch {
      decisionMaker = null;
    }
  }

  const id = randomUUID();
  await pool.execute(
    `INSERT INTO lead_enrichment (id, candidate_id, decision_maker, source_vendor)
     VALUES (?, ?, ?, ?)`,
    [id, candidateId, JSON.stringify(decisionMaker), sourceVendor],
  );
  return { id, candidateId, decisionMaker, sourceVendor };
}

export async function listCandidateEnrichment(candidateId: string) {
  const [rows] = await pool.execute(
    'SELECT * FROM lead_enrichment WHERE candidate_id = ? ORDER BY enriched_at DESC LIMIT 10',
    [candidateId],
  );
  return (rows as Array<Record<string, unknown>>).map((row) => {
    const decisionMaker = row.decision_maker;
    const painPoints = row.pain_points;
    const growthSignals = row.growth_signals;
    return {
      ...row,
      decision_maker: typeof decisionMaker === 'string' ? JSON.parse(decisionMaker) : decisionMaker,
      pain_points: typeof painPoints === 'string' ? JSON.parse(painPoints) : painPoints,
      growth_signals: typeof growthSignals === 'string' ? JSON.parse(growthSignals) : growthSignals,
    };
  });
}
