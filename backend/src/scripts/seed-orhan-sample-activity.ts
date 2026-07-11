/**
 * orhanguzell@gmail.com için örnek bir CRM aktivitesi ekler (müşteriye bağlı olmayan
 * bağımsız/genel aktivite). Idempotent: aynı konulu örnek varsa yeniden eklemez.
 * Kullanım: bun src/scripts/seed-orhan-sample-activity.ts
 */
import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';

const EMAIL = 'orhanguzell@gmail.com';
const SUBJECT = 'Örnek: İlk müşteri görüşmesini planla';

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
    'SELECT id FROM crm_activities WHERE tenant_key = ? AND owner_user_id = ? AND subject = ? LIMIT 1',
    [tenantKey, userId, SUBJECT],
  );
  if (existing[0]) {
    console.log(`Zaten var (id=${existing[0].id}). Değişiklik yapılmadı.`);
    await pool.end();
    return;
  }

  const id = randomUUID();
  await pool.execute(
    `INSERT INTO crm_activities
       (id, tenant_key, ref_type, ref_id, type, subject, body, planned_start_at, due_at, done, owner_user_id, created_by)
     VALUES (?, ?, NULL, NULL, 'meeting', ?, ?, NULL, NULL, 0, ?, ?)`,
    [
      id, tenantKey, SUBJECT,
      'Bu örnek bir aktivitedir. "Yeni Aktivite" ile kendi görüşme, görev ve planlarınızı ekleyebilirsiniz.',
      userId, userId,
    ],
  );
  console.log(`OLUŞTURULDU: "${SUBJECT}"  id=${id}  tenant=${tenantKey}  owner=${EMAIL}`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
