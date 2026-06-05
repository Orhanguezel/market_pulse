import { pool } from '@/db/client';

const targets = [
  ['01900000-0000-4000-8000-000000000001', 'Promat Pilot Bayi - Istanbul Avrupa', 'dealer', '+90 212 000 00 01', 'istanbul-avrupa@example.com', 'Pilot Yetkili 1', 'Istanbul', 'Avrupa Yakasi', 12.0],
  ['01900000-0000-4000-8000-000000000002', 'Promat Pilot Bayi - Istanbul Anadolu', 'dealer', '+90 216 000 00 02', 'istanbul-anadolu@example.com', 'Pilot Yetkili 2', 'Istanbul', 'Anadolu Yakasi', 18.0],
  ['01900000-0000-4000-8000-000000000003', 'Promat Pilot Bayi - Ankara', 'dealer', '+90 312 000 00 03', 'ankara@example.com', 'Pilot Yetkili 3', 'Ankara', 'Ostim', 24.0],
  ['01900000-0000-4000-8000-000000000004', 'Promat Pilot Bayi - Izmir', 'dealer', '+90 232 000 00 04', 'izmir@example.com', 'Pilot Yetkili 4', 'Izmir', 'Bornova', 9.0],
  ['01900000-0000-4000-8000-000000000005', 'Promat Pilot Distribitor - Bursa', 'distributor', '+90 224 000 00 05', 'bursa@example.com', 'Pilot Yetkili 5', 'Bursa', 'Nilufer', 31.0],
] as const;

async function main() {
  for (const [id, name, category, phone, email, contactName, city, district, churnRiskScore] of targets) {
    await pool.query(
      `INSERT INTO market_targets
        (id, tenant_key, name, category, status, website, phone, email, contact_name, city, district,
         instagram_url, google_maps_url, notes, churn_risk_score, last_seen_at, created_at, updated_at)
       VALUES (?, 'avrasya', ?, ?, 'active', NULL, ?, ?, ?, ?, ?, NULL, NULL,
         'Anonim Promat pilot bayi kaydi. Gercek bayi listesi geldiginde ERP senkronu ile guncellenecek.',
         ?, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         category = VALUES(category),
         status = VALUES(status),
         phone = VALUES(phone),
         email = VALUES(email),
         contact_name = VALUES(contact_name),
         city = VALUES(city),
         district = VALUES(district),
         notes = VALUES(notes),
         churn_risk_score = VALUES(churn_risk_score),
         updated_at = CURRENT_TIMESTAMP`,
      [id, name, category, phone, email, contactName, city, district, churnRiskScore],
    );
  }
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
