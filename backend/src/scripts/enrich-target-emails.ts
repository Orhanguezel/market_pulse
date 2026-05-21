// =============================================================
// FILE: backend/src/scripts/enrich-target-emails.ts
// One-off: for every market_target that has a website but no email,
// hit the firm's homepage + /iletisim /kontakt /contact /about-us with
// the scraper-service, collect contact_emails, pick the best one
// (personal-style mail outranks info@/sales@), and UPDATE both the
// market_targets row AND the paspas musteriler row (source of truth).
//
// Run: bun src/scripts/enrich-target-emails.ts
// =============================================================

import { pool } from '@/db/client';
import { getExternalPool } from '@/db/external';
import { scrape, type LeadPageData } from '@/modules/lead-machine/_shared/scraper.client';

const CONTACT_PATHS = ['/iletisim', '/kontakt', '/contact', '/about-us', '/hakkimizda'];

function rankEmail(email: string): number {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  if (/^[a-z]+\.[a-z]+$/.test(local)) return 5;
  if (/^[a-z]\.[a-z]+$/.test(local)) return 4;
  if (/^[a-z]+_[a-z]+$/.test(local)) return 4;
  if (['purchasing', 'einkauf', 'satinalma', 'satis'].some((g) => local.includes(g))) return 3;
  if (['info', 'sales', 'office', 'contact', 'kontakt', 'iletisim'].some((g) => local.includes(g))) return 1;
  if (/^[a-z]+$/.test(local) && local.length > 2) return 2;
  return 0;
}

function pickBest(emails: string[]): string | null {
  const cleaned = [...new Set(emails.map((e) => e.toLowerCase().trim()))]
    .filter((e) => /@/.test(e))
    .filter((e) => !/no-?reply|do-?not-?reply|abuse@|postmaster@|webmaster@|example\.com/i.test(e));
  if (!cleaned.length) return null;
  return cleaned.sort((a, b) => rankEmail(b) - rankEmail(a))[0] ?? null;
}

async function collectEmails(website: string): Promise<string[]> {
  const base = website.replace(/\/+$/, '');
  const urls = [base, ...CONTACT_PATHS.map((p) => base + p)];
  const all: string[] = [];
  for (const url of urls) {
    try {
      const res = await scrape(url, { profile: 'lead-page', return_text: true });
      if (res.success && res.data) {
        const data = res.data as unknown as LeadPageData;
        if (Array.isArray(data.contact_emails)) all.push(...data.contact_emails);
        if (typeof data.text_content === 'string') {
          // Belt-and-braces: pull anything matching an email pattern from the
          // visible text, since some sites obfuscate inside spans rather than
          // mailto: links.
          const re = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
          const found = data.text_content.match(re) ?? [];
          all.push(...found);
        }
      }
    } catch {
      // try next
    }
    // Stop early once we have something personal
    if (all.some((e) => rankEmail(e) >= 4)) break;
  }
  return all;
}

interface TargetRow {
  id: string;
  name: string;
  website: string;
  paspas_customer_id: string | null;
}

async function main() {
  const [rows] = await pool.query<any[]>(
    `SELECT id, name, website, paspas_customer_id
       FROM market_targets
      WHERE status = 'active'
        AND website IS NOT NULL AND website <> ''
        AND (email IS NULL OR email = '')`,
  );
  const targets = rows as TargetRow[];
  // eslint-disable-next-line no-console
  console.log(`Found ${targets.length} target(s) with website but no email`);

  const paspasPool = await getExternalPool('PASPAS');
  let found = 0;
  let missed = 0;

  for (const t of targets) {
    // eslint-disable-next-line no-console
    process.stdout.write(`→ ${t.name} (${t.website}) ... `);
    let email: string | null = null;
    try {
      const emails = await collectEmails(t.website);
      email = pickBest(emails);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`error: ${(e as Error).message}`);
      missed += 1;
      continue;
    }
    if (!email) {
      // eslint-disable-next-line no-console
      console.log('no email found');
      missed += 1;
      continue;
    }
    await pool.execute('UPDATE market_targets SET email = ? WHERE id = ?', [email, t.id]);
    if (paspasPool && t.paspas_customer_id) {
      try {
        await paspasPool.query(
          'UPDATE musteriler SET email = COALESCE(email, ?) WHERE id = ?',
          [email, t.paspas_customer_id],
        );
      } catch {
        // keep going — local update already done
      }
    }
    // eslint-disable-next-line no-console
    console.log(`✓ ${email}`);
    found += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`\ndone: found=${found} missed=${missed} total=${targets.length}`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('failed:', err);
  process.exit(1);
});
