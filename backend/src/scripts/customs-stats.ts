/**
 * Gümrük (customs_records) veri gölü tanı aracı.
 * Kullanım: bun src/scripts/customs-stats.ts [arama-terimi]
 * Amaç: gümrük aramasının neden sonuç döndüğünü/dönmediğini teşhis etmek —
 * hangi alıcı ülkeleri, hangi HS kodları/ürünler gölde var?
 */
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';

async function q(sql: string, params: unknown[] = []): Promise<RowDataPacket[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params as never[]);
  return rows;
}

async function main() {
  const term = process.argv[2] ?? 'floor mat';

  const [{ total }] = await q('SELECT COUNT(*) AS total FROM customs_records');
  console.log(`\n== customs_records toplam: ${Number(total).toLocaleString('en-US')} kayıt ==\n`);

  console.log('-- Alıcı ülkeleri (buyer_country) --');
  for (const r of await q(
    `SELECT COALESCE(NULLIF(buyer_country, ''), '(bos)') AS c, COUNT(*) AS n
       FROM customs_records GROUP BY buyer_country ORDER BY n DESC LIMIT 20`,
  )) console.log(`  ${String(r.c).padEnd(24)} ${Number(r.n).toLocaleString('en-US')}`);

  console.log('\n-- En sık HS kodları --');
  for (const r of await q(
    `SELECT hs_code, COUNT(*) AS n FROM customs_records
      WHERE hs_code IS NOT NULL AND hs_code <> '' GROUP BY hs_code ORDER BY n DESC LIMIT 15`,
  )) console.log(`  ${String(r.hs_code).padEnd(14)} ${Number(r.n).toLocaleString('en-US')}`);

  console.log('\n-- Örnek ürün açıklamaları (hs_description) --');
  for (const r of await q(
    `SELECT DISTINCT hs_description FROM customs_records
      WHERE hs_description IS NOT NULL AND hs_description <> '' LIMIT 15`,
  )) console.log(`  ${String(r.hs_description).slice(0, 90)}`);

  const like = `%${term}%`;
  const [{ n: hit }] = await q(
    `SELECT COUNT(*) AS n FROM customs_records WHERE hs_description LIKE ? OR exporter_name LIKE ?`,
    [like, like],
  );
  console.log(`\n-- "${term}" içeren kayıt (hs_description/exporter_name): ${Number(hit).toLocaleString('en-US')} --`);
  if (Number(hit) > 0) {
    console.log('   örnek alıcılar:');
    for (const r of await q(
      `SELECT buyer_name, buyer_country, hs_code, hs_description FROM customs_records
        WHERE hs_description LIKE ? OR exporter_name LIKE ? LIMIT 8`,
      [like, like],
    )) console.log(`   • ${String(r.buyer_name).slice(0, 40).padEnd(42)} ${String(r.buyer_country ?? '').padEnd(6)} ${r.hs_code ?? ''} — ${String(r.hs_description ?? '').slice(0, 40)}`);
  }

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
