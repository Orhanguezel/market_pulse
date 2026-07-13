/**
 * Keşif hatalarının yazdığı bozuk fuar verisini temizler.
 *
 * İKİ HATA (ikisi de düzeltildi, bu script geride kalan kayıtları onarır):
 *
 * 1) SAHTE TARİHLER — siteler sayfaya bugünün tarihini basıyor ("son güncelleme",
 *    haber akışı, tarih widget'ı). Tarih çıkarıcı bunu fuar tarihi sandı ve 80+ fuara
 *    bugünün/dünün tarihini yazdı. Artık en az 7 gün ilerideki tarihler kabul ediliyor.
 *    Onarım: bu kayıtların tarihi silinir (date_status='unknown'), verified_at sıfırlanır
 *    → sonraki tazeleme turunda doğru tarih yeniden aranır.
 *
 * 2) ŞEHİR ADINDAN YANLIŞ SİTE — "Warsaw Industry Week" → warsaw.net (Varşova şehir
 *    sitesi). Artık eşleşme için fuarı AYIRT EDEN kelime şart. Onarım: host'u yalnızca
 *    şehir/ülke adıyla eşleşen siteler silinir.
 *
 * Kullanım:
 *   bun src/scripts/fix-fair-data.ts            # ne yapacağını yazar, DEĞİŞTİRMEZ
 *   bun src/scripts/fix-fair-data.ts --apply    # uygular
 */
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';

const apply = process.argv.includes('--apply');

interface Row extends RowDataPacket {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  start_date: string | null;
  website: string | null;
}

function deaccent(s: string): string {
  return s.toLowerCase()
    .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c');
}

/** Site host'u SADECE şehir/ülke adını içeriyorsa (fuarın adından hiçbir şey yoksa) yanlıştır. */
function isPlaceOnlyMatch(row: Row): boolean {
  if (!row.website) return false;
  let host: string;
  try { host = new URL(row.website).hostname.replace(/^www\./, '').replace(/[^a-z0-9]/gi, '').toLowerCase(); }
  catch { return false; }

  const place = [row.city, row.country].filter(Boolean).map((p) => deaccent(String(p)).replace(/[^a-z0-9]/g, ''));
  const nameWords = deaccent(row.name).split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  const distinctive = nameWords.filter((w) => !place.some((p) => p && (p.includes(w) || w.includes(p))));

  const hostHasPlace = place.some((p) => p.length >= 4 && host.includes(p));
  const hostHasDistinctive = distinctive.some((w) => host.includes(w));
  return hostHasPlace && !hostHasDistinctive;
}

async function main() {
  // 1) Sahte tarihler: keşifle yazılmış ama bugüne çok yakın olanlar
  const [bogusDates] = await pool.execute<Row[]>(
    `SELECT id, name, city, country, start_date, website FROM fairs
      WHERE date_status = 'discovered' AND start_date <= CURDATE() + INTERVAL 6 DAY`,
  );
  console.log(`[fix] sahte tarih (bugune cok yakin): ${bogusDates.length} fuar`);
  for (const r of bogusDates.slice(0, 5)) console.log(`      - ${r.name} → ${r.start_date}`);

  // 2) Sadece şehir/ülke adıyla eşleşmiş siteler
  const [withSite] = await pool.execute<Row[]>(
    'SELECT id, name, city, country, start_date, website FROM fairs WHERE website IS NOT NULL',
  );
  const placeOnly = withSite.filter(isPlaceOnlyMatch);
  console.log(`[fix] sehir adindan yanlis site: ${placeOnly.length} fuar`);
  for (const r of placeOnly.slice(0, 5)) console.log(`      - ${r.name} (${r.city}) → ${r.website}`);

  if (!apply) {
    console.log('\n[fix] DEGISIKLIK YAPILMADI. Uygulamak icin: --apply');
    process.exit(0);
  }

  for (const r of bogusDates) {
    await pool.execute(
      "UPDATE fairs SET start_date = NULL, end_date = NULL, date_status = 'unknown', verified_at = NULL WHERE id = ?",
      [r.id],
    );
  }
  for (const r of placeOnly) {
    await pool.execute(
      'UPDATE fairs SET website = NULL, exhibitor_url = NULL, verified_at = NULL WHERE id = ?',
      [r.id],
    );
  }

  console.log(`[fix] UYGULANDI — tarih sifirlanan: ${bogusDates.length}, site sifirlanan: ${placeOnly.length}`);
  console.log('[fix] Bu fuarlar sonraki tazeleme turunda yeniden kesfedilecek.');
  process.exit(0);
}

void main();
