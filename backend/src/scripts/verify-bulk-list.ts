import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { pool } from '@/db/client';
import { runWithTenant } from '@/core/tenant-context';
import { uploadList, generateDraftsFromList } from '@/modules/lead-machine/outreach/bulk-list.service';
import { getList, listRecipients } from '@/modules/lead-machine/outreach/bulk-list.repository';

// END-TO-END verify (NO real emails): upload CSV → generate drafts → STOP (do not send).
const TENANT = 'avrasya';

async function main() {
  const csvPath = process.argv.slice(2).find(a => !a.startsWith('--'));
  if (!csvPath) throw new Error('usage: verify-bulk-list <recipients.csv>');
  const buffer = readFileSync(csvPath);

  await runWithTenant(TENANT, async () => {
    // 1. uploadList
    const up = await uploadList(TENANT, {
      campaignId: null,
      name: `verify-${Date.now()}`,
      fileBuffer: buffer,
      filename: basename(csvPath),
    });
    console.log(`\n[1] uploadList → list ${up.list.id}`);
    console.log(`    inserted=${up.inserted} invalid=${up.invalid} duplicates=${up.duplicates} total_count=${up.list.total_count}`);

    const recipients = await listRecipients(TENANT, up.list.id);
    console.log(`    outreach_recipients rows for list = ${recipients.length}`);
    if (recipients.length !== 5) throw new Error(`EXPECTED 5 recipients, got ${recipients.length}`);
    if (up.list.total_count !== 5) throw new Error(`EXPECTED total_count=5, got ${up.list.total_count}`);

    // 2. generateDraftsFromList
    const gen = await generateDraftsFromList(TENANT, up.list.id, {
      subjectTemplate: 'Merhaba {{name}}',
      bodyTemplate: '{{company}} için teklifimiz... ({{country}})',
    });
    console.log(`\n[2] generateDraftsFromList → generated=${gen.generated} skipped=${gen.skipped}`);
    if (gen.generated !== 5) throw new Error(`EXPECTED 5 drafts, got ${gen.generated}`);

    // Verify drafts in DB: channel-agnostic, recipient_email set, placeholders substituted.
    const [drafts] = await pool.execute(
      `SELECT id, candidate_id, market_lead_id, recipient_list_id, recipient_email, recipient_name, subject, body, status
       FROM lead_outreach_drafts
       WHERE tenant_key = ? AND recipient_list_id = ?
       ORDER BY recipient_email ASC`,
      [TENANT, up.list.id],
    );
    const draftRows = drafts as Array<Record<string, unknown>>;
    console.log(`    lead_outreach_drafts rows = ${draftRows.length}`);
    for (const d of draftRows) {
      if (d.candidate_id !== null) throw new Error('candidate_id must be NULL');
      if (d.market_lead_id !== null) throw new Error('market_lead_id must be NULL');
      if (!d.recipient_email) throw new Error('recipient_email must be set');
      if (String(d.subject).includes('{{')) throw new Error('subject not substituted');
      if (String(d.body).includes('{{')) throw new Error('body not substituted');
    }

    // Verify recipient.status flipped to 'drafted'.
    const drafted = await listRecipients(TENANT, up.list.id, 'drafted');
    console.log(`    recipients with status='drafted' = ${drafted.length}`);
    if (drafted.length !== 5) throw new Error(`EXPECTED 5 drafted recipients, got ${drafted.length}`);

    console.log('\n[3] STOP — NOT calling sendList / NO emails sent. Sample generated drafts:');
    for (const d of draftRows.slice(0, 3)) {
      console.log(`    - to=${d.recipient_email} | subject="${d.subject}" | body="${d.body}"`);
    }

    const refreshed = await getList(TENANT, up.list.id);
    console.log(`\n[ok] list status=${refreshed?.status} total_count=${refreshed?.total_count} sent_count=${refreshed?.sent_count} (sent_count must be 0 — nothing sent)`);
    console.log('\nVERIFY PASSED ✓ (no emails sent)');
  });

  await pool.end();
}

main().catch((e) => { console.error('VERIFY FAILED:', e); process.exit(1); });
