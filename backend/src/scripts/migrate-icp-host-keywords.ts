// =============================================================
// FILE: backend/src/scripts/migrate-icp-host-keywords.ts
// One-off: for every ICP that has a fair.host_exhibitor.messe_snapshot,
// move those snapshot keywords OUT of definition.sectors and INTO
// definition.keywords. Sectors should describe broad categories (used
// by matchesIcp filter); host keywords are a separate signal used for
// the overlap badge + score boost.
//
// Run: bun src/scripts/migrate-icp-host-keywords.ts
// =============================================================

import { pool } from '@/db/client';

function asObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value) ?? {}; } catch { return {}; }
  }
  return value as Record<string, any>;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : [];
}

async function main() {
  const [rows] = await pool.query<any[]>('SELECT id, name, definition FROM icp_profiles');
  let updated = 0;

  for (const r of rows as Array<{ id: string; name: string; definition: any }>) {
    const def = asObject(r.definition);
    const fair = asObject(def.fair);
    const host = asObject(fair.host_exhibitor);
    const snap = asObject(host.messe_snapshot);
    const snapKeywords = asStringArray(snap.keywords);
    if (snapKeywords.length === 0) continue;

    const existingKeywords = asStringArray(def.keywords);
    const existingSectors = asStringArray(def.sectors);
    const snapLower = new Set(snapKeywords.map((k) => k.toLowerCase().trim()));

    // 1. Anything in snapshot keywords that is currently sitting in sectors
    //    needs to be removed from sectors (they came from the older sync).
    const sectorsCleaned = existingSectors.filter((s) => !snapLower.has(s.toLowerCase().trim()));

    // 2. Make sure definition.keywords contains every snapshot keyword
    const keywordsLower = new Set(existingKeywords.map((k) => k.toLowerCase().trim()));
    const keywordsMerged = [...existingKeywords];
    let added = 0;
    for (const k of snapKeywords) {
      const norm = k.toLowerCase().trim();
      if (!keywordsLower.has(norm)) {
        keywordsLower.add(norm);
        keywordsMerged.push(k);
        added += 1;
      }
    }

    const sectorsChanged = sectorsCleaned.length !== existingSectors.length;
    if (!sectorsChanged && added === 0) continue;

    def.sectors = sectorsCleaned;
    def.keywords = keywordsMerged;
    await pool.execute('UPDATE icp_profiles SET definition = ? WHERE id = ?', [JSON.stringify(def), r.id]);
    // eslint-disable-next-line no-console
    console.log(`✓ ${r.name}: sectors -${existingSectors.length - sectorsCleaned.length}  keywords +${added}`);
    updated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`migrate done: updated=${updated}`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('migrate failed:', err);
  process.exit(1);
});
