import { pool } from '@/db/client';
import { env } from '@/core/env';
import { sendMailRaw } from '@/modules/mail';
import { getCandidate } from '../_shared/db';
import { listCandidateEnrichment } from '../enrichment/enrichment.service';
export { generateOutreachEmail } from './draft.service';

type OutreachDraftRow = {
  id: string;
  candidate_id: string | null;
  market_lead_id: string | null;
  subject: string;
  body: string;
  status: string;
  sequence_step?: string | null;
  followup_step?: string | null;
};

type ReminderStage = {
  step: 'reminder_1' | 'reminder_2' | 'closing';
  previous: 'initial' | 'reminder_1' | 'reminder_2';
  dueDate: string;
};

const REMINDER_STAGES: ReminderStage[] = [
  { step: 'reminder_1', previous: 'initial', dueDate: '2026-08-25' },
  { step: 'reminder_2', previous: 'reminder_1', dueDate: '2026-09-01' },
  { step: 'closing', previous: 'reminder_2', dueDate: '2026-09-07' },
];

const FOLLOWUP_STAGES = [
  { step: 'followup_1', previous: 'initial', daysSinceSent: 3 },
  { step: 'followup_2', previous: 'followup_1', daysSinceSent: 10 },
  { step: 'followup_closing', previous: 'followup_2', daysSinceSent: 30 },
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function textToHtml(body: string) {
  return body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function trackingPixelHtml(id: string) {
  const base = env.PUBLIC_URL.replace(/\/+$/, '');
  const src = `${base}/api/v1/lead-machine/outreach/open/${encodeURIComponent(id)}/pixel.gif`;
  return `<img src="${src}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px" />`;
}

function pickReminderLanguage(draft: OutreachDraftRow): 'EN' | 'DE' | 'TR' {
  const content = `${draft.subject}\n${draft.body}`.toLowerCase();
  if (content.includes('termin') || content.includes('sehr geehrte') || content.includes('beste grüße')) return 'DE';
  if (content.includes('randevu') || content.includes('merhabalar') || content.includes('selamlar')) return 'TR';
  return 'EN';
}

function reminderContent(stage: ReminderStage['step'], language: 'EN' | 'DE' | 'TR') {
  if (stage === 'reminder_1') {
    if (language === 'DE') return {
      subject: 'Re: Automechanika Frankfurt - 10 Min Termin?',
      body: 'Hallo Team,\n\nkurze Erinnerung: wir sind 8.-12. September auf der Automechanika Frankfurt, Halle 3.1, Stand D11. Falls ein kurzer Termin passt: {calendly_link}\n\nBeste Grüße,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
    };
    if (language === 'TR') return {
      subject: 'Re: Automechanika Frankfurt - 10 dk randevu?',
      body: 'Selam ekip,\n\nKısa bir hatırlatma: 8-12 Eylül arası Automechanika Frankfurt - Hall 3.1 Stand D11. Kısa bir görüşme uygunsa: {calendly_link}\n\nSelamlar,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
    };
    return {
      subject: 'Re: Automechanika Frankfurt - 10 min meeting?',
      body: "Hi team,\n\nQuick reminder: we're at Automechanika Frankfurt Sept 8-12, Hall 3.1 Booth D11. If a brief on-site meeting fits your schedule: {calendly_link}\n\nBest,\n{gonderici_ad_soyad}\nAvrasya / ProMats",
    };
  }
  if (stage === 'reminder_2') {
    if (language === 'DE') return {
      subject: 'Letzte Nachfrage - Automechanika-Besuch?',
      body: 'Hallo Team,\n\nganz unverbindlich - kurze Nachfrage vor der Messe. Falls der Zeitpunkt nicht passt, gerne. Sonst: {calendly_link}\n\nBeste Grüße,\n{gonderici_ad_soyad}',
    };
    if (language === 'TR') return {
      subject: 'Son kontrol - Automechanika ziyareti?',
      body: 'Selam ekip,\n\nBaskısız bir kontrol - fuar dolmadan bir kez daha soruyorum. Şu an doğru zaman değilse sorun değil. Aksi halde: {calendly_link}\n\nSelamlar,\n{gonderici_ad_soyad}',
    };
    return {
      subject: 'Last check - Automechanika visit?',
      body: "Hi team,\n\nNo pressure - just wanted to check before the show fills up. If this isn't the right time, no problem at all. Otherwise: {calendly_link}\n\nBest,\n{gonderici_ad_soyad}",
    };
  }
  if (language === 'DE') return {
    subject: 'Letzte Nachricht - Automechanika',
    body: 'Hallo Team,\n\nkeine Rückmeldung seit unserer Nachricht - völlig verständlich. Das ist meine letzte Nachricht in diesem Thread. Falls sich bei Ihnen vor September etwas ändert: {calendly_link}\n\nBeste Grüße,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
  };
  if (language === 'TR') return {
    subject: 'Son nota - Automechanika',
    body: 'Selam ekip,\n\nMesajımızdan beri yanıt gelmedi - tamamen normal. Bu konudaki son mesajımız. Eylül öncesi tarafınızda durum değişirse: {calendly_link}\n\nSaygılarımla,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
  };
  return {
    subject: 'Closing this thread - Automechanika',
    body: 'Hi team,\n\nNo response since our note - completely understandable. This is my last message in this thread. If something changes on your end before September, my line is always open: {calendly_link}\n\nBest,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
  };
}

function followupContent(stage: typeof FOLLOWUP_STAGES[number]['step'], language: 'EN' | 'DE' | 'TR') {
  if (stage === 'followup_1') {
    if (language === 'DE') return {
      subject: 'Re: Automechanika Frankfurt - 10 Min Termin?',
      body: 'Hallo Team,\n\nkurze Erinnerung zu unserer Nachricht. Falls ein kurzer Austausch nach der Automechanika sinnvoll ist, hier ist mein Kalender: {calendly_link}\n\nBeste Grüße,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
    };
    if (language === 'TR') return {
      subject: 'Re: Automechanika Frankfurt - 10 dk görüşme?',
      body: 'Selam ekip,\n\nAutomechanika notumuz için kısa bir hatırlatma. Kısa bir görüşme uygunsa takvimim burada: {calendly_link}\n\nSelamlar,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
    };
    return {
      subject: 'Re: Automechanika Frankfurt - 10 min meeting?',
      body: "Hi team,\n\nQuick reminder on my note. If a brief post-Automechanika conversation fits your schedule, here's my calendar: {calendly_link}\n\nBest,\n{gonderici_ad_soyad}\nAvrasya / ProMats",
    };
  }
  if (stage === 'followup_2') {
    if (language === 'DE') return {
      subject: 'Letzte Nachfrage - Automechanika',
      body: 'Hallo Team,\n\nganz unverbindlich - ich wollte nur noch einmal nachfragen. Falls der Zeitpunkt nicht passt, kein Problem. Sonst: {calendly_link}\n\nBeste Grüße,\n{gonderici_ad_soyad}',
    };
    if (language === 'TR') return {
      subject: 'Son kontrol - Automechanika',
      body: 'Selam ekip,\n\nBaskısız bir son kontrol yapmak istedim. Şu an doğru zaman değilse sorun değil. Aksi halde: {calendly_link}\n\nSelamlar,\n{gonderici_ad_soyad}',
    };
    return {
      subject: 'Last check - Automechanika',
      body: "Hi team,\n\nNo pressure - just wanted to check once more. If this isn't the right time, no problem at all. Otherwise: {calendly_link}\n\nBest,\n{gonderici_ad_soyad}",
    };
  }
  if (language === 'DE') return {
    subject: 'Letzte Nachricht - Automechanika',
    body: 'Hallo Team,\n\nkeine Rückmeldung seit unserer Nachricht - völlig verständlich. Das ist meine letzte Nachricht in diesem Thread. Falls sich später etwas ändert: {calendly_link}\n\nBeste Grüße,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
  };
  if (language === 'TR') return {
    subject: 'Son nota - Automechanika',
    body: 'Selam ekip,\n\nMesajımızdan beri yanıt gelmedi - tamamen normal. Bu konudaki son mesajımız. Daha sonra durum değişirse: {calendly_link}\n\nSaygılarımla,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
  };
  return {
    subject: 'Closing this thread - Automechanika',
    body: 'Hi team,\n\nNo response since our note - completely understandable. This is my last message in this thread. If something changes later, my line is always open: {calendly_link}\n\nBest,\n{gonderici_ad_soyad}\nAvrasya / ProMats',
  };
}

async function getOutreachDraft(id: string) {
  const [rows] = await pool.execute('SELECT * FROM lead_outreach_drafts WHERE id = ? LIMIT 1', [id]);
  return (rows as OutreachDraftRow[])[0] ?? null;
}

async function resolveDraftRecipient(draft: OutreachDraftRow) {
  if (draft.candidate_id) {
    const enrichmentRows = await listCandidateEnrichment(draft.candidate_id);
    for (const row of enrichmentRows) {
      const decisionMaker = asRecord(row.decision_maker);
      if (typeof decisionMaker.email === 'string' && decisionMaker.email.trim()) return decisionMaker.email.trim();
    }
    const candidate = await getCandidate(draft.candidate_id);
    if (candidate?.email) return candidate.email;
  }

  if (draft.market_lead_id) {
    const [rows] = await pool.execute('SELECT email FROM market_leads WHERE id = ? LIMIT 1', [draft.market_lead_id]);
    const email = (rows as Array<{ email?: string | null }>)[0]?.email;
    if (email) return email;
  }

  return null;
}

export async function listOutreachDrafts(candidateId?: string, marketLeadId?: string) {
  const where: string[] = [];
  const values: unknown[] = [];
  if (candidateId) {
    where.push('candidate_id = ?');
    values.push(candidateId);
  }
  if (marketLeadId) {
    where.push('market_lead_id = ?');
    values.push(marketLeadId);
  }
  const [rows] = await pool.execute(
    `SELECT * FROM lead_outreach_drafts ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 100`,
    values as never[],
  );
  return rows;
}

export async function updateOutreachDraft(
  id: string,
  data: { subject?: string; body?: string; status?: string; reply_status?: string | null },
) {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (data.subject !== undefined) { sets.push('subject = ?'); values.push(data.subject); }
  if (data.body !== undefined) { sets.push('body = ?'); values.push(data.body); }
  if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }
  if (data.reply_status !== undefined) {
    sets.push('reply_status = ?');
    values.push(data.reply_status);
    sets.push('replied_at = ?');
    values.push(data.reply_status ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null);
  }
  if (!sets.length) return null;
  values.push(id);
  await pool.execute(`UPDATE lead_outreach_drafts SET ${sets.join(', ')} WHERE id = ?`, values as never[]);
  const [rows] = await pool.execute('SELECT * FROM lead_outreach_drafts WHERE id = ? LIMIT 1', [id]);
  return (rows as unknown[])[0] ?? null;
}

export async function sendOutreachDraft(id: string, toOverride?: string | null) {
  const draft = await getOutreachDraft(id);
  if (!draft) throw new Error('DRAFT_NOT_FOUND');
  const to = toOverride?.trim() || await resolveDraftRecipient(draft);
  if (!to) throw new Error('OUTREACH_RECIPIENT_NOT_FOUND');

  await sendMailRaw({
    to,
    subject: draft.subject,
    html: `${textToHtml(draft.body)}\n${trackingPixelHtml(id)}`,
    text: draft.body,
  });

  await pool.execute(
    "UPDATE lead_outreach_drafts SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id],
  );
  const sentDraft = await getOutreachDraft(id);
  return sentDraft ?? { ...draft, status: 'sent' };
}

export async function trackOutreachOpen(id: string) {
  await pool.execute(
    `UPDATE lead_outreach_drafts
     SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP),
         open_count = COALESCE(open_count, 0) + 1
     WHERE id = ?`,
    [id],
  );
}

export async function sendDueOutreachReminders(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const stage = [...REMINDER_STAGES].reverse().find((item) => today >= item.dueDate);
  if (!stage) return { stage: null, sent: 0, skipped: 0 };

  const [rows] = await pool.execute(
    `SELECT * FROM lead_outreach_drafts
     WHERE status = 'sent'
       AND replied_at IS NULL
       AND reply_status IS NULL
       AND COALESCE(sequence_step, 'initial') = ?
     ORDER BY sent_at ASC
     LIMIT 100`,
    [stage.previous],
  );

  let sent = 0;
  let skipped = 0;
  for (const draft of rows as OutreachDraftRow[]) {
    const to = await resolveDraftRecipient(draft);
    if (!to) {
      skipped += 1;
      continue;
    }
    const content = reminderContent(stage.step, pickReminderLanguage(draft));
    await sendMailRaw({
      to,
      subject: content.subject,
      html: `${textToHtml(content.body)}\n${trackingPixelHtml(draft.id)}`,
      text: content.body,
    });
    await pool.execute(
      'UPDATE lead_outreach_drafts SET sequence_step = ?, last_reminder_at = CURRENT_TIMESTAMP WHERE id = ?',
      [stage.step, draft.id],
    );
    sent += 1;
  }

  return { stage: stage.step, sent, skipped };
}

export async function sendDuePostShowFollowups(now = new Date()) {
  for (const stage of FOLLOWUP_STAGES) {
    const threshold = new Date(now);
    threshold.setUTCDate(threshold.getUTCDate() - stage.daysSinceSent);
    const thresholdSql = threshold.toISOString().slice(0, 19).replace('T', ' ');

    const [rows] = await pool.execute(
      `SELECT * FROM lead_outreach_drafts
       WHERE status = 'sent'
         AND sent_at IS NOT NULL
         AND sent_at <= ?
         AND replied_at IS NULL
         AND reply_status IS NULL
         AND COALESCE(followup_step, 'initial') = ?
       ORDER BY sent_at ASC
       LIMIT 100`,
      [thresholdSql, stage.previous],
    );

    if (!(rows as OutreachDraftRow[]).length) continue;

    let sent = 0;
    let skipped = 0;
    for (const draft of rows as OutreachDraftRow[]) {
      const to = await resolveDraftRecipient(draft);
      if (!to) {
        skipped += 1;
        continue;
      }
      const content = followupContent(stage.step, pickReminderLanguage(draft));
      await sendMailRaw({
        to,
        subject: content.subject,
        html: `${textToHtml(content.body)}\n${trackingPixelHtml(draft.id)}`,
        text: content.body,
      });
      await pool.execute(
        'UPDATE lead_outreach_drafts SET followup_step = ?, last_followup_at = CURRENT_TIMESTAMP WHERE id = ?',
        [stage.step, draft.id],
      );
      sent += 1;
    }

    return { stage: stage.step, sent, skipped };
  }

  return { stage: null, sent: 0, skipped: 0 };
}
