// =============================================================
// FILE: backend/src/scripts/re-enrich-fair-candidates.ts
// Backfills enrichment fields onto existing lead_candidates rows.
//
// Two modes — controlled by --force:
//   default      : skip rows that already have recommendation +
//                  mail_classification (the original one-off)
//   --force      : recompute everything, picking up host-keyword overlap
//                  from icp_profiles.fair.host_exhibitor.messe_snapshot
//
// Run:
//   bun src/scripts/re-enrich-fair-candidates.ts
//   bun src/scripts/re-enrich-fair-candidates.ts --force
// =============================================================

import { pool } from '@/db/client';
import {
  buildSummary, classifyMail, computeKeywordOverlap, computeScore, recommend,
} from '@/modules/lead-machine/fair/enrichment';

interface CandidateRow {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  icp_id: string | null;
  raw_data: any;
}

function asObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) ?? {};
    } catch {
      return {};
    }
  }
  return value as Record<string, any>;
}

function extractHostKeywordsFromIcp(definition: unknown): string[] {
  const def = asObject(definition);
  const all: string[] = [];
  if (Array.isArray(def.keywords)) {
    for (const k of def.keywords) if (typeof k === 'string' && k.trim()) all.push(k);
  }
  const fair = asObject(def.fair);
  const host = asObject(fair.host_exhibitor);
  const snap = asObject(host.messe_snapshot);
  if (Array.isArray(snap.keywords)) {
    for (const k of snap.keywords) if (typeof k === 'string' && k.trim()) all.push(k);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of all) {
    const norm = k.toLowerCase().trim();
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(k);
    }
  }
  return out;
}

async function loadHostKeywordsByIcp(): Promise<Map<string, string[]>> {
  const [icpRows] = await pool.query<any[]>('SELECT id, definition FROM icp_profiles');
  const map = new Map<string, string[]>();
  for (const r of icpRows as Array<{ id: string; definition: any }>) {
    const kws = extractHostKeywordsFromIcp(r.definition);
    if (kws.length) map.set(r.id, kws);
  }
  return map;
}

async function main() {
  const force = process.argv.includes('--force');
  const hostByIcp = await loadHostKeywordsByIcp();

  const [rows] = await pool.query<any[]>(
    `SELECT id, name, email, website, country, city, icp_id, raw_data
       FROM lead_candidates
      WHERE channel = 'trade_fair'`,
  );
  const candidates = rows as CandidateRow[];

  let updated = 0;
  let skipped = 0;
  let withOverlap = 0;

  for (const c of candidates) {
    const raw = asObject(c.raw_data);
    const hasAll = raw.recommendation && raw.mail_classification && raw.host_keyword_match;
    if (hasAll && !force) {
      skipped += 1;
      continue;
    }

    const mailType = classifyMail(c.email);
    const hostKeywords = c.icp_id ? hostByIcp.get(c.icp_id) ?? [] : [];

    const exhibitor = asObject(raw.exhibitor);
    const candidateBlob = [
      typeof exhibitor.description === 'string' ? exhibitor.description : '',
      ...(Array.isArray(exhibitor.product_groups) ? exhibitor.product_groups : []),
      ...(Array.isArray(exhibitor.brands) ? exhibitor.brands : []),
      ...(Array.isArray(exhibitor.target_markets) ? exhibitor.target_markets : []),
      ...(Array.isArray(exhibitor.trade_audience) ? exhibitor.trade_audience : []),
    ].filter((s): s is string => typeof s === 'string' && s.length > 0).join(' ');

    const overlap = computeKeywordOverlap(`${c.name} ${candidateBlob}`, hostKeywords);
    const score = computeScore(c.name, c.country, mailType, overlap.boost);
    const recommendation = recommend(
      {
        name: c.name,
        email: c.email,
        website: c.website,
        countryIso: c.country,
      },
      mailType,
      score,
    );

    const fairInfo = asObject(raw.fair_info);
    const hall = fairInfo.hall ?? exhibitor.hall ?? null;
    const booth = fairInfo.booth_number ?? exhibitor.booth_number ?? null;
    const fairName = fairInfo.fair_name ?? null;

    const summary = buildSummary({
      name: c.name,
      city: c.city,
      countryIso: c.country,
      hall,
      booth,
      fairName,
      mailType,
      score,
    });

    raw.mail_classification = {
      type: mailType,
      classified_at: new Date().toISOString(),
    };
    raw.recommendation = recommendation;
    raw.host_keyword_match = {
      shared: overlap.shared,
      count: overlap.count,
      score_boost: overlap.boost,
    };
    if (overlap.count > 0) withOverlap += 1;

    await pool.execute(
      `UPDATE lead_candidates
          SET raw_data   = ?,
              ai_summary = ?,
              lead_score = ?
        WHERE id = ?`,
      [JSON.stringify(raw), summary, score, c.id],
    );
    updated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`re-enrich done: updated=${updated} skipped=${skipped} with_overlap=${withOverlap} total=${candidates.length} force=${force}`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('re-enrich failed:', err);
  process.exit(1);
});
