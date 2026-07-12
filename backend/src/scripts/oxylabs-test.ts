/**
 * Oxylabs DENEME aracı — tüm listeyi taramaz, sadece küçük bir örneklem üzerinde
 * "firma adı → gerçek site → e-posta" zincirini test eder ve maliyeti sınırlı tutar.
 *
 * Kullanım:
 *   bun src/scripts/oxylabs-test.ts            → varsayılan 5 firma (listeden, e-postasız olanlar)
 *   bun src/scripts/oxylabs-test.ts <listId> 8 → belirli listeden 8 firma
 */
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';
import {
  isOxylabsEnabled,
  googleSearchUrls,
  universalScrape,
  extractEmailsFromHtml,
  siteMatchesCompany,
  emailBelongsToSite,
} from '@/modules/_shared/oxylabs.client';
import { isJunkWebsite } from '@/modules/prospect-lists/service';

async function main() {
  if (!isOxylabsEnabled()) {
    console.error('OXYLABS_USER / OXYLABS_PASS env tanimli degil.');
    process.exit(1);
  }

  const listId = process.argv[2];
  const limit = Math.min(Number(process.argv[3] ?? 5) || 5, 10); // guvenlik: en fazla 10

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT company_name, country, website FROM prospect_companies
      WHERE generic_email IS NULL ${listId ? 'AND list_id = ?' : ''}
      ORDER BY row_index LIMIT ${limit}`,
    listId ? [listId] : [],
  );

  console.log(`\n=== OXYLABS DENEME — ${rows.length} firma (tum liste TARANMIYOR) ===\n`);

  let siteFound = 0;
  let emailFound = 0;

  for (const row of rows) {
    const name = String(row.company_name);
    const country = (row.country as string | null) ?? '';
    const listed = row.website as string | null;
    console.log(`• ${name.slice(0, 46)}`);
    console.log(`    listedeki link : ${listed ?? '-'}  ${isJunkWebsite(listed) ? '(COP)' : '(gercek)'}`);

    // 1) Gerçek siteyi bul (listedeki link çöpse Google araması).
    //    DOĞRULAMA: bulunan domain firma adıyla eşleşmeli — aksi halde yaptırım
    //    sayfası/rehber gibi alakasız sonuçlardan yanlış e-posta yazarız.
    let site: string | null = isJunkWebsite(listed) ? null : listed;
    if (!site) {
      try {
        const urls = await googleSearchUrls(`${name} ${country} official site`.trim());
        const candidates = urls.filter((u) => !isJunkWebsite(u));
        site = candidates.find((u) => siteMatchesCompany(u, name)) ?? null;
        if (site) console.log(`    google_search  : ${site}  (firma adiyla ESLESIYOR)`);
        else console.log(`    google_search  : ${candidates[0] ?? 'sonuc yok'} -> REDDEDILDI (firma adiyla eslesmiyor)`);
      } catch (e) {
        console.log(`    google_search  : HATA ${(e as Error).message.slice(0, 70)}`);
      }
    }
    if (!site) { console.log(''); continue; }
    siteFound++;

    // 2) Siteyi tara; SADECE sitenin kendi alan adına ait e-postaları kabul et.
    try {
      const html = await universalScrape(site);
      const all = html ? extractEmailsFromHtml(html) : [];
      const own = all.filter((e) => emailBelongsToSite(e, site!));
      if (own.length) { emailFound++; console.log(`    E-POSTA (dogrulanmis): ${own.slice(0, 3).join(', ')}`); }
      else if (all.length) console.log(`    universal      : e-posta var ama SITE DOMAININE AIT DEGIL -> reddedildi (${all.slice(0, 2).join(', ')})`);
      else console.log(`    universal      : sayfa alindi (${html?.length ?? 0} kar.) ama e-posta yok`);
    } catch (e) {
      console.log(`    universal      : HATA ${(e as Error).message.slice(0, 70)}`);
    }
    console.log('');
  }

  console.log(`=== OZET: ${rows.length} firma → site bulundu ${siteFound} → e-posta bulundu ${emailFound} ===`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
