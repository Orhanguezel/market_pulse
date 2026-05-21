// =============================================================
// FILE: backend/src/scripts/re-enrich-fair-candidates.ts
// One-off: backfills mail_classification + recommendation + ai_summary
// + lead_score onto existing lead_candidates rows scanned BEFORE the
// enrichment port landed. Idempotent (skips rows that already have a
// recommendation).
// Run: bun src/scripts/re-enrich-fair-candidates.ts
// =============================================================

import { pool } from '@/db/client';
import { buildSummary, classifyMail, computeScore, recommend } from '@/modules/lead-machine/fair/enrichment';

interface CandidateRow {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  raw_data: any;
}

async function main() {
  const [rows] = await pool.query<any[]>(
    `SELECT id, name, email, website, country, city, raw_data
     FROM lead_candidates
     WHERE channel = 'trade_fair'`,
  );
  const candidates = rows as CandidateRow[];

  let updated = 0;
  let skipped = 0;

  for (const c of candidates) {
    const raw = (typeof c.raw_data === 'string' ? JSON.parse(c.raw_data) : c.raw_data) ?? {};
    if (raw.recommendation && raw.mail_classification) {
      skipped += 1;
      continue;
    }

    const mailType = classifyMail(c.email);
    const score = computeScore(c.name, c.country, mailType);
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

    const fairInfo = raw.fair_info ?? {};
    const hall = fairInfo.hall ?? raw.exhibitor?.hall ?? null;
    const booth = fairInfo.booth_number ?? raw.exhibitor?.booth_number ?? null;
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
  console.log(`re-enrich done: updated=${updated} skipped=${skipped} total=${candidates.length}`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('re-enrich failed:', err);
  process.exit(1);
});
