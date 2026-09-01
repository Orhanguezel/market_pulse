/**
 * Scraper yük testi: aynı siteleri N paralel ile tarayıp başarı oranını ölçer.
 * "Tek tek çalışıyor ama toplu taramada sonuç gelmiyor" durumunun sebebini bulur.
 * Kullanım: bun src/scripts/scrape-load-test.ts [concurrency]
 */
import { scrape } from '@/modules/lead-machine/_shared/scraper.client';

const SITES = [
  'https://comestiblesalfa.com/',
  'https://www.campora.com.co/',
  'https://damasgate.co.uk/',
  'https://butaagro.com/en/contact/',
  'https://agroserc.com/en/',
  'https://www.denanuts.com/',
  'https://4seasonsfood.eu/en/en/home/',
  'https://comestiblesalfa.com/contact',
];

async function one(url: string): Promise<{ url: string; ok: boolean; emails: number; err?: string }> {
  const t0 = Date.now();
  try {
    const res = await scrape(url, { profile: 'lead-page', return_text: true });
    const data = res.data as { contact_emails?: string[] } | undefined;
    const emails = data?.contact_emails?.length ?? 0;
    console.log(`   ${res.success ? 'OK ' : 'FAIL'} ${String(Date.now() - t0).padStart(6)}ms  emails=${emails}  ${url}`);
    return { url, ok: Boolean(res.success), emails };
  } catch (e) {
    const msg = (e as Error)?.message ?? 'err';
    console.log(`   EXC ${String(Date.now() - t0).padStart(6)}ms  ${msg.slice(0, 60)}  ${url}`);
    return { url, ok: false, emails: 0, err: msg };
  }
}

async function run(concurrency: number) {
  console.log(`\n=== ${SITES.length} site, ${concurrency} PARALEL ===`);
  const t0 = Date.now();
  const results: Awaited<ReturnType<typeof one>>[] = [];
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, SITES.length) }, async () => {
      while (idx < SITES.length) {
        const i = idx++;
        results.push(await one(SITES[i]!));
      }
    }),
  );
  const ok = results.filter((r) => r.ok).length;
  const withEmail = results.filter((r) => r.emails > 0).length;
  console.log(`   --> basarili=${ok}/${SITES.length}  e-posta bulunan=${withEmail}/${SITES.length}  sure=${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

async function main() {
  const c = Number(process.argv[2] ?? 0);
  if (c > 0) { await run(c); process.exit(0); }
  await run(1); // sirali (referans)
  await run(6); // runFreeEnrich'in kullandigi eszamanlilik
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
