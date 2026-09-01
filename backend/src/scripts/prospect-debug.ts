/**
 * Prospect list tanı aracı: enrichment neden firma seçmiyor?
 * Kullanım: bun src/scripts/prospect-debug.ts [listId]
 */
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';

async function q(sql: string, params: unknown[] = []): Promise<RowDataPacket[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params as never[]);
  return rows;
}

async function main() {
  let listId = process.argv[2];
  if (!listId) {
    const lists = await q('SELECT id, name, tenant_key, owner_user_id FROM prospect_lists ORDER BY created_at DESC LIMIT 5');
    console.log('\n== Listeler ==');
    for (const l of lists) console.log(`  ${l.id}  ${l.name}  tenant=${l.tenant_key} owner=${l.owner_user_id}`);
    const first = lists[0]?.id as string | undefined;
    if (!first) { console.log('liste yok'); await pool.end(); return; }
    listId = first;
    console.log(`\n(ilk liste seçildi: ${listId})`);
  }

  const [meta] = await q('SELECT tenant_key, owner_user_id FROM prospect_lists WHERE id = ?', [listId]);
  const tenantKey = meta?.tenant_key as string;
  const ownerId = meta?.owner_user_id as string;
  console.log(`\n== Liste ${listId}  tenant=${tenantKey} owner=${ownerId} ==\n`);

  console.log('-- enrich_status dağılımı --');
  for (const r of await q(
    'SELECT enrich_status, COUNT(*) n FROM prospect_companies WHERE list_id = ? GROUP BY enrich_status ORDER BY n DESC',
    [listId],
  )) console.log(`   ${String(r.enrich_status).padEnd(16)} ${r.n}`);

  console.log('\n-- alan doluluk (NULL / bos-string / dolu) --');
  for (const col of ['generic_email', 'phone', 'website', 'decision_maker_name']) {
    const [r] = await q(
      `SELECT SUM(${col} IS NULL) AS nulls, SUM(${col} = '') AS empties, SUM(${col} IS NOT NULL AND ${col} <> '') AS filled
         FROM prospect_companies WHERE list_id = ?`,
      [listId],
    );
    console.log(`   ${col.padEnd(20)} NULL=${r?.nulls}  ''=${r?.empties}  dolu=${r?.filled}`);
  }

  console.log('\n-- HEDEF SORGUSU (runFreeEnrich ne seçiyor?) --');
  const [t] = await q(
    `SELECT COUNT(*) AS n FROM prospect_companies
      WHERE tenant_key = ? AND owner_user_id = ? AND list_id = ?
        AND enrich_status NOT IN ('free_running','apollo_running','apollo_done')
        AND (enrich_status = 'pending' OR (generic_email IS NULL AND phone IS NULL))`,
    [tenantKey, ownerId, listId],
  );
  console.log(`   secilen firma sayisi: ${t?.n}`);

  console.log('\n-- ornek kayitlar --');
  for (const r of await q(
    `SELECT company_name, website, enrich_status, generic_email, phone, error
       FROM prospect_companies WHERE list_id = ? LIMIT 5`,
    [listId],
  )) {
    console.log(`   ${String(r.company_name).slice(0, 28).padEnd(30)} st=${String(r.enrich_status).padEnd(10)} email=${JSON.stringify(r.generic_email)} phone=${JSON.stringify(r.phone)} err=${JSON.stringify(r.error)}`);
    console.log(`      website=${JSON.stringify(r.website)}`);
  }

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
