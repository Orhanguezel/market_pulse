/**
 * orhanguzell@gmail.com için "Gümrük — Oto Aksesuar/Paspas İthalatçısı" ICP profili
 * oluşturur (kişiye özel, owner_user_id + tenant_key). Idempotent: aynı isimde profil
 * varsa yeniden eklemez. Kullanım: bun src/scripts/seed-orhan-customs-icp.ts
 */
import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';

const EMAIL = 'orhanguzell@gmail.com';
const ICP_NAME = 'Gümrük — Oto Aksesuar/Paspas İthalatçısı';

// Otomotiv paspas/aksesuar ithalatçısı hedefi. Gölde bulunan alıcı ülkeleri (US/RU/UA)
// öne alınır; DE/PL/FR gibi Avrupa hedefleri veri gölüne eklenince otomatik kapsanır.
const DEFINITION = {
  channel: 'customs',
  sectors: ['automotive accessories', 'car care', 'floor mats', 'car mats', 'rubber mats', 'trunk liners'],
  firm_types: ['importer', 'distributor', 'wholesaler', 'aftermarket retailer'],
  // Gölde gerçekten veri olan alıcı ülkeleri (buyer_country) — gümrük araması bunlarla sonuç döner.
  geographies: ['United States', 'Russia', 'Ukraine'],
  priority_geographies: ['United States'],
  // Hedeflenen ama gölde henüz olmayan Avrupa pazarları (veri import edilince aktif olur).
  wishlist_geographies: ['DE', 'PL', 'FR', 'NL', 'AT'],
  // Otomotiv paspas/halı/aksesuar HS/GTİP kodları.
  hs_codes: ['570390', '570500', '570320', '630260', '870899', '870829', '401699', '392690'],
  product_keywords: ['floor mat', 'car mat', 'rubber mat', 'car carpet', 'trunk liner', 'boot mat', 'auto accessory'],
  min_value: 1000,
  notes: 'Gümrük veri gölü şu an US/RU/UA genel ithalat verisi içerir; Avrupa/otomotiv-paspas gümrük verisi eklendikçe kapsam artar.',
};

async function main() {
  const [users] = await pool.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [EMAIL]);
  const userId = users[0]?.id as string | undefined;
  if (!userId) { console.error(`Kullanıcı bulunamadı: ${EMAIL}`); process.exit(1); }

  const [roles] = await pool.execute<RowDataPacket[]>(
    "SELECT tenant_key FROM tenant_user_roles WHERE user_id = ? ORDER BY FIELD(role,'tenant_admin','tenant_editor') LIMIT 1",
    [userId],
  );
  const tenantKey = (roles[0]?.tenant_key as string | undefined) ?? 'gzltek';

  const [existing] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM icp_profiles WHERE tenant_key = ? AND owner_user_id = ? AND name = ? LIMIT 1',
    [tenantKey, userId, ICP_NAME],
  );
  if (existing[0]) {
    console.log(`Zaten var (id=${existing[0].id}, tenant=${tenantKey}). Değişiklik yapılmadı.`);
    await pool.end();
    return;
  }

  const id = randomUUID();
  await pool.execute(
    'INSERT INTO icp_profiles (id, tenant_key, owner_user_id, name, is_active, definition) VALUES (?, ?, ?, ?, 1, ?)',
    [id, tenantKey, userId, ICP_NAME, JSON.stringify(DEFINITION)],
  );
  console.log(`OLUŞTURULDU: "${ICP_NAME}"`);
  console.log(`  id=${id}  tenant=${tenantKey}  owner=${userId} (${EMAIL})`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
