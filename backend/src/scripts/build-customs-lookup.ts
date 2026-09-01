/**
 * Gümrük arama sözlüklerini tazeler (customs_descriptions / customs_exporters).
 *
 * Bu sözlükler ürün aramasını 16.3M satırlık tam taramadan kurtarır — bkz.
 * 042_customs_lookup_schema.sql. Yeni konşimento dosyası eklendikçe çalıştırılmalı;
 * import-customs-xlsx.ts sonunda otomatik çağrılır.
 *
 * Kullanım: bun src/scripts/build-customs-lookup.ts
 */
import { pool } from '@/db/client';
import { rebuildCustomsLookups } from '@/modules/lead-machine/customs/customs.repository';

async function main() {
  const t0 = Date.now();
  const { descriptions, exporters } = await rebuildCustomsLookups();
  console.log(`[lookup] TAMAMLANDI — aciklama: ${descriptions}, ihracatci: ${exporters}, sure: ${((Date.now() - t0) / 1000).toFixed(0)} sn`);
  await pool.end();
  process.exit(0);
}

void main();
