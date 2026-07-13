/**
 * Avrasya Paspas ihracat istihbaratı pilot eşleştirmeleri.
 * Yalnızca mevcut gümrük gölünde doğrulanmış ihracatçı unvanları eklenir.
 * Idempotent: aynı görünen ad daha önce eklendiyse atlanır.
 */
import { pool } from '@/db/client';
import {
  createCustomsEntity,
  listCustomsEntities,
  type CustomsEntityType,
} from '@/modules/lead-machine/customs/customs-intelligence.repository';

const TENANT = process.env.TENANT_KEY ?? 'avrasya';

const entities: Array<{
  entityType: CustomsEntityType;
  name: string;
  aliases: string[];
}> = [
  {
    entityType: 'own',
    name: 'Avrasya Paspas',
    aliases: [
      'AVRASYA PASPAS AUTOMOTIVE INDUSTRY AND TRADE LIMITED COMPANY',
      'AVRASYA PASPAS OTOMOTIV SAN TIC LIMITED',
    ],
  },
  {
    entityType: 'competitor',
    name: 'Tameks',
    aliases: [
      'TAMEKS FOREIGN TRADE AND MARKETING INC',
      'TAMEKS OTOMOT V SMA L YAL IN DELEMEN VE ORTA I KOLLEKT F RKET',
      'ITAMEKS FOREIGN TRADE AND MARKETING INC',
    ],
  },
  {
    entityType: 'competitor',
    name: 'Rizine Otomotiv',
    aliases: [
      'RIZINE AUTOMOTIVE CONSTRUCTION FOOD PRODUCTION EXPORT IMPORT INDUSTRY AND TRADE LIMITED COMPANY',
      'R ZL NE OTOMOT V CONSTRUCTION FOOD PRODUCTION EXPORT IMPORT INDUSTRY AND TRADE LIMITED COMPANY',
    ],
  },
  {
    entityType: 'competitor',
    name: 'Doğan Dış Ticaret',
    aliases: ['DOGAN FOREIGN TRADE AND MARKETING JOINT STOCK COMPANY'],
  },
];

async function main() {
  const existing = await listCustomsEntities(TENANT);
  const names = new Set(existing.map((item) => `${item.entity_type}:${item.name.toLocaleUpperCase('tr-TR')}`));
  let inserted = 0;
  for (const entity of entities) {
    const key = `${entity.entityType}:${entity.name.toLocaleUpperCase('tr-TR')}`;
    if (names.has(key)) continue;
    await createCustomsEntity(TENANT, {
      entityType: entity.entityType,
      name: entity.name,
      country: 'TR',
      aliases: entity.aliases.map((alias) => ({ alias, matchType: 'exact' })),
    });
    inserted += 1;
  }
  console.log(`[customs-intelligence] tenant=${TENANT} inserted=${inserted} existing=${existing.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => pool.end());
