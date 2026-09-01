/**
 * Bir kullanıcı için ICP profillerini JSON dosyasından yükler (kişiye özel: owner_user_id).
 *
 * Müşteriye ait bilgiler (e-posta, firma, ürün/pazar tanımı) BU REPODA TUTULMAZ —
 * market_pulse public bir repodur. Profil dosyası müşterinin kendi (özel) reposunda
 * durur, buraya sadece yükleyici gelir.
 *
 * Dosya biçimi:
 * {
 *   "email": "musteri@ornek.com",
 *   "profiles": [
 *     { "name": "B2B Google Maps — ...", "definition": { "channel": "b2b_directory", ... } }
 *   ]
 * }
 *
 * Idempotent: aynı isimli profil varsa dokunmaz (--update ile tanımı günceller).
 *
 * Kullanım:
 *   bun src/scripts/seed-icps-from-file.ts /yol/icp-profilleri.json
 *   bun src/scripts/seed-icps-from-file.ts /yol/icp-profilleri.json --update
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';

interface IcpSeed { name: string; definition: Record<string, unknown> }
interface SeedFile { email: string; profiles: IcpSeed[] }

async function main() {
  const path = process.argv[2];
  const update = process.argv.includes('--update');
  if (!path || path.startsWith('--')) {
    console.error('Kullanim: bun src/scripts/seed-icps-from-file.ts <profiller.json> [--update]');
    process.exit(1);
  }

  const file = JSON.parse(readFileSync(path, 'utf8')) as SeedFile;
  if (!file.email || !Array.isArray(file.profiles) || !file.profiles.length) {
    console.error('Gecersiz dosya: "email" ve en az bir "profiles" kaydi gerekli.');
    process.exit(1);
  }

  const [users] = await pool.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [file.email]);
  const userId = users[0]?.id as string | undefined;
  if (!userId) { console.error(`Kullanici bulunamadi: ${file.email}`); process.exit(1); }

  const [roles] = await pool.execute<RowDataPacket[]>(
    "SELECT tenant_key FROM tenant_user_roles WHERE user_id = ? ORDER BY FIELD(role,'tenant_admin','tenant_editor') LIMIT 1",
    [userId],
  );
  const tenantKey = (roles[0]?.tenant_key as string | undefined) ?? 'gzltek';

  let created = 0, updated = 0, skipped = 0;

  for (const profile of file.profiles) {
    if (!profile?.name || !profile.definition) { console.warn('ATLANDI (eksik kayit)'); continue; }

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM icp_profiles WHERE tenant_key = ? AND owner_user_id = ? AND name = ? LIMIT 1',
      [tenantKey, userId, profile.name],
    );

    if (existing[0]) {
      if (!update) { console.log(`ATLANDI (zaten var): ${profile.name}`); skipped += 1; continue; }
      await pool.execute(
        'UPDATE icp_profiles SET definition = ?, is_active = 1 WHERE id = ?',
        [JSON.stringify(profile.definition), existing[0].id],
      );
      console.log(`GUNCELLENDI: ${profile.name}`);
      updated += 1;
      continue;
    }

    const id = randomUUID();
    await pool.execute(
      'INSERT INTO icp_profiles (id, tenant_key, owner_user_id, name, is_active, definition) VALUES (?, ?, ?, ?, 1, ?)',
      [id, tenantKey, userId, profile.name, JSON.stringify(profile.definition)],
    );
    console.log(`OLUSTURULDU: ${profile.name}  (id=${id})`);
    created += 1;
  }

  console.log(`\nTAMAMLANDI — olusturulan: ${created}, guncellenen: ${updated}, atlanan: ${skipped}`);
  console.log(`  kullanici: ${file.email} (${userId})  tenant: ${tenantKey}`);
  await pool.end();
}

void main();
