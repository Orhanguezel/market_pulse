/**
 * Fuar kataloğunu ücretsiz kanallardan yeniler: resmî site + güncel tarih + katılımcı sayfası.
 *
 * MALİYET: sıfır. Sadece DuckDuckGo HTML araması, doğrudan HTTP ve kendi scraper-service'imiz.
 *
 * Kullanım:
 *   bun src/scripts/refresh-fairs.ts --limit 50                  # sitesi/tarihi eksik ilk 50 fuar
 *   bun src/scripts/refresh-fairs.ts --source dunya_takvim --limit 200 --concurrency 3
 *   bun src/scripts/refresh-fairs.ts --stale                     # tarihi geçmiş olanlar
 *   bun src/scripts/refresh-fairs.ts --name "bauma" --force      # daha önce işlenmiş kaydı yeniden keşfet
 */
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';
import { env } from '@/core/env';
import { runWithTenant } from '@/core/tenant-context';
import {
  discoverExhibitorUrl,
  saveFairDiscovery,
  resetFairDiscovery,
  type FairRow,
} from '@/modules/lead-machine/fair/fair-catalog.service';

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const limit = Math.max(1, Number(arg('limit', '50')));
  const concurrency = Math.min(6, Math.max(1, Number(arg('concurrency', '3'))));
  const source = arg('source');
  const name = arg('name');
  const onlyStale = flag('stale');
  const force = flag('force'); // daha önce işlenmiş kayıtları da yeniden dene

  const where: string[] = [];
  const values: unknown[] = [];
  if (source) { where.push('source = ?'); values.push(source); }
  if (name) { where.push('name LIKE ?'); values.push(`%${name}%`); }
  if (onlyStale) where.push('(start_date IS NULL OR start_date < CURDATE())');
  else where.push('(website IS NULL OR exhibitor_url IS NULL OR start_date IS NULL OR start_date < CURDATE())');
  if (!force) where.push('verified_at IS NULL'); // aynı fuarı ikinci kez deneme

  const [fairs] = await pool.execute<FairRow[]>(
    `SELECT * FROM fairs WHERE ${where.join(' AND ')} ORDER BY (start_date IS NULL), start_date DESC LIMIT ${limit}`,
    values as never[],
  );
  console.log(`[fairs] hedef: ${fairs.length} fuar  (concurrency=${concurrency}, kaynak=${source ?? 'hepsi'})`);

  let site = 0, dated = 0, exh = 0, miss = 0, done = 0;
  const t0 = Date.now();

  const worker = async () => {
    for (;;) {
      const fair = fairs.shift();
      if (!fair) return;
      try {
        // --force: eski (muhtemelen hatalı) site/katılımcı değerlerini temizle, sıfırdan keşfet
        if (force) {
          await resetFairDiscovery(fair.id);
          fair.website = null;
          fair.exhibitor_url = null;
        }
        const r = await discoverExhibitorUrl(fair);
        if (r.website || r.exhibitor_url || r.start_date) {
          await saveFairDiscovery(fair.id, r.exhibitor_url, r.website, { start: r.start_date, end: r.end_date });
          if (r.website) site++;
          if (r.start_date) dated++;
          if (r.exhibitor_url) exh++;
        } else {
          miss++;
        }
        done++;
        if (done % 10 === 0) {
          console.log(`[fairs] ${done} islendi | site=${site} tarih=${dated} katilimci=${exh} bulunamadi=${miss}`);
        }
      } catch (e) {
        miss++; done++;
        console.warn(`[fairs] hata: ${fair.name} — ${String(e).slice(0, 90)}`);
      }
      // Arama motoruna karşı nazik ol — ücretsiz kanalı yakmayalım
      await new Promise((r) => setTimeout(r, 1200));
    }
  };

  await runWithTenant(env.TENANT_KEY, () => Promise.all(Array.from({ length: concurrency }, worker)));

  const [stat] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS toplam,
            SUM(website IS NOT NULL) AS siteli,
            SUM(exhibitor_url IS NOT NULL) AS katilimcili,
            SUM(start_date >= CURDATE()) AS gelecek
       FROM fairs`,
  );
  console.log(`[fairs] TAMAMLANDI  sure=${((Date.now() - t0) / 60000).toFixed(1)} dk`);
  console.log(`[fairs] bu kosu: site=${site} tarih=${dated} katilimci=${exh} bulunamadi=${miss}`);
  console.log('[fairs] katalog toplami:', stat[0]);
  process.exit(0);
}

void main();
