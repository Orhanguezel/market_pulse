import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { askBestAvailable } from '../_shared/ai.client';
import { getCandidate } from '../_shared/db';
import { listCandidateEnrichment as _listEnrichment } from '../enrichment/enrichment.service';

export async function generateOutreachEmail(candidateId: string) {
  const candidate = await getCandidate(candidateId);
  if (!candidate) throw new Error('CANDIDATE_NOT_FOUND');

  const raw = candidate.raw_data && typeof candidate.raw_data === 'object'
    ? candidate.raw_data as Record<string, unknown>
    : {};
  const analysis = raw.analysis && typeof raw.analysis === 'object'
    ? raw.analysis as Record<string, unknown>
    : null;
  const match = raw.match && typeof raw.match === 'object'
    ? raw.match as { score?: number; reasons?: string[] }
    : null;
  const painPoints: string[] = Array.isArray(analysis?.pain_points) ? analysis.pain_points as string[] : [];
  const sellsChina = analysis?.sells_china === true;
  const privateLabel = analysis?.private_label === true;
  const matchReasons: string[] = Array.isArray(match?.reasons) ? match.reasons as string[] : [];

  const enrichmentRows = await _listEnrichment(candidateId);
  const latestEnrichment = enrichmentRows[0] as Record<string, unknown> | undefined;
  const decisionMaker = latestEnrichment?.decision_maker && typeof latestEnrichment.decision_maker === 'object'
    ? latestEnrichment.decision_maker as Record<string, unknown>
    : null;

  const contextLines: string[] = [
    `Firma adı: ${candidate.name}`,
    `Ülke: ${candidate.country ?? 'bilinmiyor'}`,
    `Kanal: ${candidate.channel}`,
    candidate.website ? `Web sitesi: ${candidate.website}` : '',
    painPoints.length ? `Tespit edilen sorunlar: ${painPoints.join(', ')}` : '',
    sellsChina ? 'Çin tedarikine bağımlı' : '',
    privateLabel ? 'Private label ürün yapıyor' : '',
    matchReasons.length ? `ICP eşleşme nedenleri: ${matchReasons.join(', ')}` : '',
    decisionMaker?.name ? `Karar verici: ${String(decisionMaker.name)}${decisionMaker.title ? `, ${String(decisionMaker.title)}` : ''}` : '',
    candidate.ai_summary ? `AI özeti: ${candidate.ai_summary}` : '',
    'Ürünlerimiz: Oto paspas, plastik enjeksiyon parçaları, Türkiye üretimi',
  ].filter(Boolean);

  const prompt = `
${contextLines.join('\n')}

Kısa, kişiselleştirilmiş B2B tanıtım e-postası yaz.
- Açılış cümlesi firmanın tespitimize özel bir detayını vurgulasın (tedarik sorunu veya uyum)
- Ürün uyumunu somut bir örnekle açıkla
- CTA: numune talebi veya görüşme
- Maksimum 150 kelime
- Subject ve Body başlıklarıyla dön
`;
  const content = await askBestAvailable(prompt, 'gpt-4o-mini');
  const subject = content.match(/subject\s*:\s*(.+)/i)?.[1]?.trim() || `${candidate.name} için tedarik görüşmesi`;
  const body = content.replace(/subject\s*:\s*.+/i, '').replace(/body\s*:\s*/i, '').trim() || content;
  const id = randomUUID();
  await pool.execute(
    'INSERT INTO lead_outreach_drafts (id, candidate_id, subject, body, ai_model) VALUES (?, ?, ?, ?, ?)',
    [id, candidateId, subject.slice(0, 300), body, 'best_available'],
  );
  return { id, candidateId, subject, body };
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
