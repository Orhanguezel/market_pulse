/**
 * VistaSeeds ICP — uluslararası B2B sebze tohumu alıcıları.
 * ÖNCELİK: biber (pepper / capsicum) hibrit tohumu alıcıları.
 * Idempotent: aynı isimli vistaseeds ICP'si varsa günceller, yoksa ekler; aktif yapar.
 *
 * Çalıştırma:  cd backend && bun run src/scripts/seed-icp-vistaseeds.ts
 */
import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';

const TENANT = 'vistaseeds';
const NAME = 'VistaSeeds — B2B Sebze/Biber Tohumu Alıcısı (uluslararası)';

const definition = {
  version: 1,
  summary:
    'VistaSeeds için uluslararası B2B sebze tohumu alıcıları (distribütör, importör, toptancı, agro-bayi, fide üreticisi). ÖNCELİK: biber (pepper/capsicum) hibrit tohumu alıcıları.',
  priority_crop: 'pepper',

  // Hedef ürün/sektör ilgi alanları — lead arama terimleri
  sectors: [
    'vegetable seeds', 'hybrid vegetable seeds', 'F1 hybrid seeds',
    'pepper seeds', 'capsicum seeds', 'chili pepper seeds', 'hot pepper seeds',
    'sweet pepper seeds', 'bell pepper seeds', 'kapia pepper seeds',
    'tomato seeds', 'cucumber seeds', 'eggplant seeds',
    'melon seeds', 'watermelon seeds', 'squash seeds', 'zucchini seeds',
    'seedling production', 'greenhouse vegetable seeds', 'horticulture inputs',
  ],
  priority_sectors: [
    'pepper seeds', 'capsicum seeds', 'chili pepper seeds',
    'hot pepper seeds', 'sweet pepper seeds', 'kapia pepper seeds',
  ],

  // Çok dilli anahtar kelimeler — uluslararası B2B dizin/arama
  keywords: {
    en: ['pepper seeds', 'capsicum seeds', 'chili seeds', 'hybrid pepper seed', 'F1 pepper seeds',
         'vegetable seed distributor', 'vegetable seed importer', 'seed wholesaler'],
    tr: ['biber tohumu', 'kapya biber tohumu', 'sivri biber tohumu', 'dolma biber tohumu',
         'acı biber tohumu', 'çarliston biber tohumu', 'hibrit sebze tohumu',
         'tohum bayi', 'tohum distribütörü', 'fide üreticisi'],
    es: ['semillas de pimiento', 'semillas de chile', 'semillas híbridas de hortalizas',
         'distribuidor de semillas', 'importador de semillas'],
    fr: ['graines de poivron', 'graines de piment', 'semences maraîchères', 'distributeur de semences'],
    ar: ['بذور الفلفل', 'بذور الفلفل الحار', 'بذور الخضروات الهجينة', 'موزع بذور', 'مستورد بذور'],
    ru: ['семена перца', 'семена овощей', 'гибридные семена перца', 'дистрибьютор семян'],
  },

  // Aranan firma tipleri (alıcılar)
  firm_types: [
    'seed distributor', 'seed importer', 'agricultural input wholesaler',
    'agro-dealer', 'seed company', 'seed house', 'seedling producer',
    'greenhouse grower', 'horticultural cooperative', 'agricultural cooperative',
    'agri retail chain', 'garden center chain', 'seed repacking company',
    'agri import-export company',
  ],
  priority_firm_types: ['seed distributor', 'seed importer', 'agro-dealer', 'seedling producer'],

  // Hedef coğrafyalar — Türk hibrit biber tohumu ihracat pazarları
  geographies: [
    // MENA
    'EG', 'MA', 'TN', 'DZ', 'JO', 'IQ', 'SA', 'AE', 'LB', 'LY', 'SD', 'OM',
    // Orta Asya / Türki cumhuriyetler + Kafkasya
    'UZ', 'KZ', 'TM', 'KG', 'AZ', 'GE',
    // Balkanlar / Doğu Avrupa
    'RO', 'BG', 'MK', 'RS', 'UA', 'MD', 'AL', 'XK', 'GR',
    // Akdeniz AB
    'ES', 'IT', 'PT', 'CY',
    // Güney Asya + Afrika (biber yoğun)
    'IN', 'PK', 'NG', 'GH', 'KE', 'ET',
  ],
  priority_geographies: ['EG', 'MA', 'UZ', 'AZ', 'RO', 'IQ', 'SA', 'DZ', 'TN', 'KZ'],
  exclude_geographies: ['CN', 'HK'], // Çin/HK — büyük rakip biber tohumu kaynağı

  sales_types: ['B2B', 'B2B2C'],
  sales_channels: [
    'agro-dealer network', 'distributor network', 'cooperative supply',
    'own agri retail', 'online agri marketplace', 'wholesale catalog', 'greenhouse supply',
  ],
  company_size_min: 'small',
  company_size_max: 'enterprise',

  // Hariç tutulanlar
  exclude_sectors: [
    'ornamental flower seeds only', 'cereal/grain seeds only', 'cannabis seeds',
    'lawn/turf grass seeds only', 'forestry tree seeds only', 'animal feed only',
    'fertilizer only', 'pesticide only',
  ],
  exclude_firm_types: [
    'individual farmer (end user)', 'seed breeding company (own R&D / competitor)',
    'government seed agency (non-commercial)', 'university research institute', 'GMO seed producer',
  ],

  // Sinyaller
  positive_signals: [
    'imports hybrid vegetable seeds', 'active pepper/capsicum catalog',
    'distributes Turkish or European seed brands', 'greenhouse pepper production region',
    'private label seed interest', 'expanding dealer network',
    'participates in agri/seed fairs', 'government/tender seed supply',
  ],
  negative_signals: [
    'own seed breeding program', 'only open-pollinated / heirloom seeds',
    'exclusive >70% contract with competitor breeder (Rijk Zwaan, Enza Zaden, Syngenta, Bayer, Bejo)',
    'import ban or phytosanitary restriction on Turkish seed',
  ],

  // Skorlama
  scoring_weights: {
    sector_match: 0.28,
    priority_crop_match: 0.17, // biber alıcısı bonusu
    firm_type_match: 0.20,
    geography_match: 0.15,
    channel_match: 0.05,
    positive_signal: 0.10,
    negative_signal: -0.15,
  },
  min_lead_score_for_candidate: 5.0,

  // Fuarlar — kullanıcı güncelleyecek; ev sahibi fuar + hedef tarama listesi
  fair: {
    name: 'Growtech Antalya 2026',
    role: 'host_exhibitor',
    host_exhibitor: { name: 'VistaSeeds', hall: '', booth: '', brand: 'VistaSeeds' },
  },
  target_fairs: [
    { name: 'Growtech Antalya', country: 'TR', focus: 'sera, tohum, agri inputs' },
    { name: 'Fruit Logistica Berlin', country: 'DE', focus: 'taze ürün / tohum alıcıları' },
    { name: 'Fruit Attraction Madrid', country: 'ES', focus: 'taze ürün / tohum' },
    { name: 'Sival Angers', country: 'FR', focus: 'bahçe bitkileri / tohum' },
    { name: 'SIAM Meknès', country: 'MA', focus: 'Fas/Afrika tarım' },
    { name: 'Sahara Expo Cairo', country: 'EG', focus: 'Mısır/MENA tarım' },
    { name: 'AgroWorld Uzbekistan (Tashkent)', country: 'UZ', focus: 'Orta Asya tarım' },
    { name: 'Caspian Agro Baku', country: 'AZ', focus: 'Kafkasya/Hazar tarım' },
    { name: 'INDAGRA Bucharest', country: 'RO', focus: 'Balkanlar tarım' },
    { name: 'Novi Sad Agricultural Fair', country: 'RS', focus: 'Sırbistan/Balkanlar tarım' },
    { name: 'WOP Dubai', country: 'AE', focus: 'perishables / MENA taze ürün' },
    { name: 'ISF World Seed Congress', country: '—', focus: 'global tohum endüstrisi' },
  ],

  // Diğer modüller için ipuçları
  modules_hint: {
    b2b_directory: 'Europages (vegetable seeds), Kompass, agri B2B portalları, ulusal tohum dernekleri',
    enrichment: 'firma web sitesi, ihracat ayak izi, biber/capsicum ürün sayfaları, fuar katılımı',
    outreach: 'çok dilli (TR/EN/ES/AR) — biber hibrit tohum kataloğu + distribütörlük teklifi',
  },
  notes:
    'Öncelik biber (pepper/capsicum) hibrit tohumu B2B alıcıları. Fuar listesi kullanıcı tarafından güncellenecek. Hollanda/Fransa büyük tohum ıslahçıları (Rijk Zwaan, Enza, Bejo) rakip — alıcı değil, dikkatle değerlendir.',
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
    console.log(`[icp] vistaseeds ICP güncellendi: ${row.id}`);
  } else {
    const id = randomUUID();
    await pool.execute(
      'INSERT INTO icp_profiles (id, tenant_key, name, is_active, definition) VALUES (?, ?, ?, 1, ?)',
      [id, TENANT, NAME, JSON.stringify(definition)],
    );
    console.log(`[icp] vistaseeds ICP eklendi: ${id}`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
