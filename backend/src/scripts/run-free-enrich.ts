/**
 * Ücretsiz zenginleştirmeyi doğrudan çalıştırır (UI'dan tetiklemeye gerek kalmadan).
 * Kullanım: bun src/scripts/run-free-enrich.ts <listId>
 */
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';
import { countFreeEnrichTargets, runFreeEnrich } from '@/modules/prospect-lists/service';

async function main() {
  const listId = process.argv[2];
  if (!listId) { console.error('listId gerekli'); process.exit(1); }

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT tenant_key, owner_user_id FROM prospect_lists WHERE id = ? LIMIT 1',
    [listId],
  );
  const tenantKey = rows[0]?.tenant_key as string | undefined;
  const ownerId = rows[0]?.owner_user_id as string | undefined;
  if (!tenantKey || !ownerId) { console.error('liste bulunamadi'); process.exit(1); }

  const queued = await countFreeEnrichTargets(tenantKey, ownerId, listId);
  console.log(`[enrich] hedef firma: ${queued}  (liste=${listId} tenant=${tenantKey})`);
  const t0 = Date.now();
  await runFreeEnrich(tenantKey, ownerId, listId);
  console.log(`[enrich] TAMAMLANDI  sure=${((Date.now() - t0) / 1000 / 60).toFixed(1)} dk`);

  const [stat] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS toplam,
            SUM(generic_email IS NOT NULL) AS emailli,
            SUM(phone IS NOT NULL) AS telefonlu
       FROM prospect_companies WHERE list_id = ?`,
    [listId],
  );
  const s = (stat as RowDataPacket[])[0];
  console.log(`[enrich] SONUC: toplam=${s?.toplam}  e-postali=${s?.emailli}  telefonlu=${s?.telefonlu}`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
