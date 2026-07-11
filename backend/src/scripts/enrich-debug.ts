/**
 * Ücretsiz enrichment (site-scrape) tanı aracı.
 * Kullanım: bun src/scripts/enrich-debug.ts https://example.com
 * Scraper-service'in ham yanıtını ve deepScrapeContactInfo çıktısını gösterir —
 * "Ücretsiz Zenginleştir sonuç bulmuyor" durumunun nerede koptuğunu teşhis eder.
 */
import { scrape, searchGoogleMaps } from '@/modules/lead-machine/_shared/scraper.client';
import { deepScrapeContactInfo } from '@/modules/lead-machine/enrichment/enrichment.service';
import { isJunkWebsite } from '@/modules/prospect-lists/service';

async function main() {
  const arg = process.argv[2] ?? 'https://www.campora.com.co';

  // Argüman URL değilse: firma adı kabul edilir → Google Places ile gerçek siteyi ara.
  if (!/^https?:\/\//.test(arg)) {
    console.log(`\n=== FIRMA ADINDAN SITE ARAMA: "${arg}" ===\n`);
    try {
      const res = await searchGoogleMaps(arg, { total: 3 });
      const places = res.places ?? [];
      console.log(`   bulunan yer sayisi: ${places.length}`);
      for (const p of places) {
        console.log(`   • ${String(p.name ?? '-').slice(0, 40).padEnd(42)} website=${p.website ?? '-'}  junk=${isJunkWebsite(p.website)}`);
      }
    } catch (e) {
      console.log(`   ISTISNA (Places): ${(e as Error)?.message}`);
    }
    process.exit(0);
  }

  const url = arg;
  console.log(`\n=== HEDEF: ${url} ===\n`);

  console.log('-- 1) Ham scrape() cagrisi (profile: lead-page) --');
  try {
    const res = await scrape(url, { profile: 'lead-page', return_text: true });
    console.log(`   success      : ${res.success}`);
    console.log(`   final_url    : ${res.final_url ?? '-'}`);
    console.log(`   error        : ${(res as { error?: unknown }).error ?? '-'}`);
    const data = res.data as Record<string, unknown> | undefined;
    if (data) {
      console.log(`   data keys    : ${Object.keys(data).join(', ') || '(bos)'}`);
      console.log(`   contact_emails: ${JSON.stringify((data as { contact_emails?: unknown }).contact_emails ?? null)}`);
      console.log(`   contact_phones: ${JSON.stringify((data as { contact_phones?: unknown }).contact_phones ?? null)}`);
      const text = (data as { text_content?: string }).text_content;
      console.log(`   text_content  : ${text ? `${text.length} karakter` : '(yok)'}`);
    } else {
      console.log('   data         : (yok)');
    }
  } catch (e) {
    console.log(`   ISTISNA: ${(e as Error)?.message}`);
  }

  console.log('\n-- 2) deepScrapeContactInfo() --');
  try {
    const deep = await deepScrapeContactInfo(url);
    console.log(`   emails        : ${JSON.stringify(deep.emails)}`);
    console.log(`   phones        : ${JSON.stringify(deep.phones)}`);
    console.log(`   decisionMakers: ${deep.decisionMakers.length}`);
    console.log(`   pages_visited : ${JSON.stringify(deep.pages_visited)}`);
    console.log(`   pages_failed  : ${JSON.stringify(deep.pages_failed)}`);
  } catch (e) {
    console.log(`   ISTISNA: ${(e as Error)?.message}`);
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
