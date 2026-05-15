import type { RowDataPacket } from 'mysql2/promise';
import { createRequire } from 'node:module';
import { env } from '@/core/env';
import { pool } from '@/db/client';
import { renderWeeklyReportText, type WeeklyReportData } from './report.template';

const require = createRequire(import.meta.url);

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createSimplePdf(lines: string[]): Buffer {
  const content = [
    'BT',
    '/F1 12 Tf',
    '50 790 Td',
    ...lines.flatMap((line, index) => [
      index === 0 ? '' : '0 -18 Td',
      `(${escapePdfText(line)}) Tj`,
    ]),
    'ET',
  ].filter(Boolean).join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

async function collectWeeklyReportData(): Promise<WeeklyReportData> {
  const [[targetStats], [leadStats], [signalStats], [riskRows], [signalRows], [leadRows]] = await Promise.all([
    pool.query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM market_targets'),
    pool.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM market_leads WHERE status NOT IN ('converted', 'rejected')"),
    pool.query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM market_signals WHERE is_reviewed = 0'),
    pool.query<RowDataPacket[]>(
      `SELECT name, churn_risk_score AS churnRiskScore, city
       FROM market_targets
       WHERE churn_risk_score >= 60
       ORDER BY churn_risk_score DESC
       LIMIT 5`,
    ),
    pool.query<RowDataPacket[]>(
      `SELECT s.created_at AS createdAt, s.severity, s.title, t.name AS targetName
       FROM market_signals s
       LEFT JOIN market_targets t ON t.id = s.target_id
       WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         AND s.severity IN ('critical', 'high')
       ORDER BY s.created_at DESC
       LIMIT 20`,
    ),
    pool.query<RowDataPacket[]>(
      'SELECT status, COUNT(*) AS count FROM market_leads GROUP BY status ORDER BY status ASC',
    ),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    totalTargets: Number(targetStats[0]?.count ?? 0),
    activeLeads: Number(leadStats[0]?.count ?? 0),
    pendingSignals: Number(signalStats[0]?.count ?? 0),
    highRiskTargets: riskRows.map((row) => ({
      name: String(row.name),
      churnRiskScore: Number(row.churnRiskScore ?? 0),
      city: row.city ? String(row.city) : null,
    })),
    weeklySignals: signalRows.map((row) => ({
      createdAt: String(row.createdAt),
      targetName: row.targetName ? String(row.targetName) : null,
      severity: String(row.severity),
      title: String(row.title),
    })),
    leadStatusCounts: leadRows.map((row) => ({
      status: String(row.status),
      count: Number(row.count ?? 0),
    })),
  };
}

export async function generateWeeklyReport(): Promise<Buffer> {
  const data = await collectWeeklyReportData();
  return createSimplePdf(renderWeeklyReportText(data));
}

export async function sendWeeklyReportEmail(to: string): Promise<void> {
  if (!env.SMTP_HOST) throw new Error('smtp_not_configured');
  const nodemailer = require('nodemailer') as typeof import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });

  const pdf = await generateWeeklyReport();
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'MarketPulse Haftalik Rapor',
    text: 'Haftalik MarketPulse raporu ekte yer alir.',
    attachments: [{ filename: 'marketpulse-weekly-report.pdf', content: pdf, contentType: 'application/pdf' }],
  });
}
