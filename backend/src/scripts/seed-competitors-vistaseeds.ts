/**
 * VistaSeeds yerli rakip tohum firmaları → market_targets (category='competitor').
 * Rakip-izleme / keyword-overlap / özel araştırma için kayıt. Idempotent (isimle).
 * Web/sosyal/şehir alanları sonradan enrichment/araştırma ile doldurulacak.
 *
 * Çalıştırma:  cd backend && bun run src/scripts/seed-competitors-vistaseeds.ts
 */
import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';

const TENANT = 'vistaseeds';

// Yerli (Türkiye) rakip tohum firmaları. Web siteleri araştırmayla doğrulanacak (şimdilik boş).
const competitors = [
  { name: 'Yüksel Tohum',   note: 'Yerli rakip — sebze/biber tohumu. Ana rakip.' },
  { name: 'Maya Tohum',     note: 'Yerli rakip — sebze tohumu.' },
  { name: 'Multi Tohum',    note: 'Yerli rakip — sebze tohumu.' },
  { name: 'Anamas Tohum',   note: 'Yerli rakip — sebze tohumu.' },
  { name: 'Genetika Tohum', note: 'Yerli rakip — sebze tohumu.' },
  { name: 'Petektar Tohum', note: 'Yerli rakip — sebze tohumu.' },
];

async function main() {
  let inserted = 0;
  let skipped = 0;
  for (const c of competitors) {
    const [rows] = await pool.execute(
      "SELECT id FROM market_targets WHERE tenant_key = ? AND name = ? AND category = 'competitor' LIMIT 1",
      [TENANT, c.name],
    );
    if ((rows as unknown[]).length) {
      skipped++;
      continue;
    }
    await pool.execute(
      `INSERT INTO market_targets (id, tenant_key, name, category, status, notes)
       VALUES (?, ?, ?, 'competitor', 'active', ?)`,
      [randomUUID(), TENANT, c.name, c.note],
    );
    inserted++;
    console.log(`[competitor] eklendi: ${c.name}`);
  }
  console.log(`[competitor] tamam — ${inserted} eklendi, ${skipped} zaten vardı.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
