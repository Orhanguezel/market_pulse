import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import { getCandidate, type LeadCandidate } from '../_shared/db';
import { listCandidateEnrichment } from '../enrichment/enrichment.service';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function escapePdfText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function createSimplePdf(lines: string[]): Buffer {
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += 42) pages.push(lines.slice(i, i + 42));
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids ${pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ')} /Count ${pages.length} >>`,
  ];

  for (let i = 0; i < pages.length; i += 1) {
    const content = [
      'BT',
      '/F1 10 Tf',
      '45 800 Td',
      ...pages[i].flatMap((line, index) => [
        index === 0 ? '' : '0 -17 Td',
        `(${escapePdfText(line).slice(0, 105)}) Tj`,
      ]),
      'ET',
    ].filter(Boolean).join('\n');
    const pageObjectId = 3 + i * 2;
    const contentObjectId = pageObjectId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  }
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

async function briefingLines(candidate: LeadCandidate): Promise<string[]> {
  const raw = asRecord(candidate.raw_data);
  const exhibitor = asRecord(raw.exhibitor);
  const fairInfo = asRecord(raw.fair_info);
  const analysis = asRecord(raw.analysis);
  const match = asRecord(raw.match);
  const enrichmentRows = await listCandidateEnrichment(candidate.id);
  const decisionMaker = asRecord(asRecord(enrichmentRows[0]).decision_maker);
  const productGroups = asStringArray(exhibitor.product_groups).slice(0, 5);
  const salesChannels = asStringArray(exhibitor.sales_channels ?? match.sales_channels).slice(0, 5);
  const booth = String(fairInfo.booth_number ?? fairInfo.booth ?? '-');
  const isNeighbor = fairInfo.is_neighbor === true ? 'EVET' : '-';
  const reasons = asStringArray(match.reasons).slice(0, 5);

  return [
    `STAND BRIFING KARTI - ${candidate.name}`,
    `Ulke/Sehir: ${candidate.country ?? '-'} ${candidate.city ?? ''}`.trim(),
    `ICP Skoru: ${candidate.lead_score ?? '-'}/10`,
    '',
    'Stand bilgisi',
    `Bizim stand: Hall 3.1 D11`,
    `Onlarin stand: ${booth}`,
    `Komsu mu: ${isNeighbor}`,
    '',
    'Randevu',
    'Tarih + saat: -',
    `Gorusulen kisi: ${String(decisionMaker.name ?? 'Bilinmiyor')} ${decisionMaker.title ? `(${String(decisionMaker.title)})` : ''}`,
    `Gorusme dili tercihi: ${candidate.country === 'DE' ? 'DE' : candidate.country === 'TR' ? 'TR' : 'EN'}`,
    '',
    'Firma - kim, ne yapiyor',
    candidate.ai_summary ?? '-',
    '',
    'Urun kategorileri',
    ...(productGroups.length ? productGroups.map((item) => `- ${item}`) : ['-']),
    '',
    'Web sinyalleri',
    `B2B sinyali: ${analysis.has_b2b_signals === true ? 'var' : '-'}`,
    `Cin import sinyali: ${analysis.has_china_signals === true ? 'var' : '-'}`,
    `Private label: ${analysis.has_private_label === true ? 'var' : '-'}`,
    `Satis kanallari: ${salesChannels.join(', ') || '-'}`,
    '',
    'ICP eslesme - niye burada',
    ...(reasons.length ? reasons.map((item) => `- ${item}`) : ['-']),
    '',
    'Gorusme sonrasi',
    'Ilgi duzeyi: [ ] Soguk   [ ] Sicak   [ ] Kapanis yakin',
    'Istedikleri: [ ] Katalog [ ] Fiyat listesi [ ] Numune [ ] Private label [ ] ODM',
    'Sonraki adim: [ ] Takip yok [ ] Mail at [ ] Numune gonder [ ] Telkonferans [ ] Teklif',
    'Notlar:',
    '____________________________________________________________',
    '____________________________________________________________',
    'Stand calisani: __________________ Tarih: __/09/2026 Saat: ___:___',
    '',
  ];
}

export async function generateFairBriefingPdf(candidateIds: string[]) {
  const lines: string[] = [];
  for (const id of candidateIds) {
    const candidate = await getCandidate(id);
    if (candidate) lines.push(...await briefingLines(candidate), '---', '');
  }
  return createSimplePdf(lines.length ? lines : ['Stand brifing karti bulunamadi.']);
}

export async function listFairBriefingCandidateIdsForDay(_date: string) {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    `SELECT id FROM lead_candidates
     WHERE tenant_key = ?
       AND channel = 'trade_fair'
       AND status IN ('approved', 'favorite')
     ORDER BY lead_score DESC, created_at DESC
     LIMIT 100`,
    [tenantKey],
  );
  return (rows as Array<{ id: string }>).map((row) => row.id);
}
