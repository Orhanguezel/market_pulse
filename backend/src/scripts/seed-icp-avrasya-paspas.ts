/**
 * Avrasya Paspas ICP — kauçuk araç paspası / otomotiv döşeme (GTİP 4016.91) B2B alıcıları.
 * Idempotent: aynı isimli avrasya ICP'si varsa günceller, yoksa ekler; aktif yapar.
 *
 * Çalıştırma:  cd backend && bun run src/scripts/seed-icp-avrasya-paspas.ts
 */
import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';

const TENANT = 'avrasya';
const NAME = 'Avrasya Paspas — Kauçuk Araç Paspası Alıcısı (GTİP 4016.91)';

const definition = {
  version: 1,
  summary:
    'Avrasya Paspas için kauçuk araç paspası / otomotiv döşeme (GTİP 4016.91) ithal eden B2B alıcılar: otomotiv aksesuar distribütörü, oto yedek parça ithalatçısı, OEM/aftermarket tedarik, kauçuk ürün ithalatçısı.',
  priority_product: 'rubber car mat',

  // Gümrük kanalı için HS odakları
  hs_codes: ['40169', '40082', '57024'],
  priority_hs_codes: ['40169'],

  sectors: [
    'rubber car mats', 'car floor mats', 'automotive floor mats', 'vehicle mats',
    'rubber flooring and mats', 'automotive accessories', 'auto parts',
    'aftermarket auto accessories', 'rubber products',
  ],
  priority_sectors: ['rubber car mats', 'automotive floor mats', 'car floor mats'],

  keywords: {
    en: ['car mats', 'rubber car mats', 'automotive floor mats', 'car accessories importer',
         'auto parts distributor', 'rubber mats supplier', 'aftermarket car accessories'],
    tr: ['oto paspas', 'kauçuk paspas', 'araç paspası', 'otomotiv aksesuar', 'oto yedek parça ithalatçı', 'paspas distribütör'],
    de: ['Automatten', 'Gummifußmatten', 'Autozubehör Importeur', 'KFZ-Teile Großhandel'],
  },

  firm_types: [
    'automotive accessory distributor', 'auto parts importer', 'automotive parts wholesaler',
    'car accessory retailer chain', 'OEM tier supplier', 'automotive aftermarket distributor',
    'rubber products importer', 'auto component trader',
  ],
  priority_firm_types: ['automotive accessory distributor', 'auto parts importer', 'OEM tier supplier'],

  // Gümrük verisinden gözlemlenen pazarlar (4016.91 alıcıları)
  geographies: ['DE', 'RO', 'CH', 'FR', 'IT', 'ES', 'NL', 'PL', 'GB', 'BE', 'BR', 'US', 'AE', 'SA', 'RU', 'AZ', 'BG'],
  priority_geographies: ['DE', 'RO', 'CH', 'FR', 'IT'],

  sales_types: ['B2B'],
  sales_channels: ['distributor network', 'automotive aftermarket', 'OEM supply', 'wholesale catalog'],

  positive_signals: [
    'imports rubber/car mats', 'automotive accessory catalog', 'OEM/aftermarket auto parts',
    'regular importer (multiple shipments)', 'European auto distribution',
  ],
  negative_signals: [
    'only industrial rubber matting (non-automotive)', 'competitor manufacturer',
  ],

  scoring_weights: {
    sector_match: 0.30, priority_product_match: 0.20, firm_type_match: 0.20,
    geography_match: 0.15, positive_signal: 0.10, negative_signal: -0.15,
  },
  min_lead_score_for_candidate: 5.0,

  // Türk rakip ihracatçıları (gümrük 4016.91) — lead'lerden hariç + rakip izleme
  competitors: [
    { name: 'Pimsa Otomotiv', country: 'TR' },
    { name: 'Arsan Kauçuk', country: 'TR' },
    { name: 'Doğan Dış Ticaret', country: 'TR' },
    { name: 'Tameks', country: 'TR' },
    { name: 'Rizine Otomotiv', country: 'TR' },
    { name: 'Tokez Yağ Keçe', country: 'TR' },
  ],

  notes:
    'GTİP 4016.91 "kauçuk döşeme & paspas" geniş kalem; endüstriyel kauçuk mat alıcılarını da içerir (ör. Caterpillar) — otomotiv sektörü alıcılarına öncelik ver. Kaynak: gümrük ticaret verisi 2023-2024.',
};

async function main() {
  const [existing] = await pool.execute(
    'SELECT id FROM icp_profiles WHERE tenant_key = ? AND name = ? LIMIT 1',
    [TENANT, NAME],
  );
  const row = (existing as Array<{ id: string }>)[0];
  if (row) {
    await pool.execute(
      'UPDATE icp_profiles SET definition = ?, is_active = 1 WHERE id = ? AND tenant_key = ?',
      [JSON.stringify(definition), row.id, TENANT],
    );
    console.log(`[icp] avrasya paspas ICP güncellendi: ${row.id}`);
  } else {
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO icp_profiles (id, tenant_key, name, is_active, definition) VALUES (?, ?, ?, 1, ?)',
      [id, TENANT, NAME, JSON.stringify(definition)],
    );
    console.log(`[icp] avrasya paspas ICP eklendi: ${id}`);
  }
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
