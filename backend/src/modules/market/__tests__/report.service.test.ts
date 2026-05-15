import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from './helpers/mock-db';

const dbMock = createDbMock();
const sendMail = mock(() => Promise.resolve({ messageId: 'mail-1' }));
const createTransport = mock(() => ({ sendMail }));

const env = {
  SMTP_HOST: '',
  SMTP_PORT: 587,
  SMTP_USER: '',
  SMTP_PASSWORD: '',
  SMTP_FROM: 'noreply@example.com',
};

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env }));

mock.module('nodemailer', () => ({
  default: { createTransport },
  createTransport,
}));

const service = await import('../report.service');

function queueReportRows() {
  dbMock.queuePoolQuery([{ count: 10 }]);
  dbMock.queuePoolQuery([{ count: 4 }]);
  dbMock.queuePoolQuery([{ count: 2 }]);
  dbMock.queuePoolQuery([
    { name: 'Risk A', churnRiskScore: '80.5', city: 'Istanbul' },
    { name: 'Risk B', churnRiskScore: '70.0', city: null },
  ]);
  dbMock.queuePoolQuery([
    {
      createdAt: '2026-05-08 10:00:00',
      targetName: 'Alpha Dealer',
      severity: 'critical',
      title: 'Critical signal',
    },
  ]);
  dbMock.queuePoolQuery([
    { status: 'new', count: 3 },
    { status: 'qualified', count: 1 },
  ]);
}

beforeEach(() => {
  dbMock.reset();
  sendMail.mockReset();
  createTransport.mockReset();
  createTransport.mockImplementation(() => ({ sendMail }));
  sendMail.mockImplementation(() => Promise.resolve({ messageId: 'mail-1' }));
  env.SMTP_HOST = '';
  env.SMTP_PORT = 587;
  env.SMTP_USER = '';
  env.SMTP_PASSWORD = '';
  env.SMTP_FROM = 'noreply@example.com';
});

describe('market weekly report service', () => {
  test('generates a PDF buffer from report rows', async () => {
    queueReportRows();

    const pdf = await service.generateWeeklyReport();

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(String(pdf)).toContain('MarketPulse Haftalik Ozet Raporu');
    expect(String(pdf)).toContain('Toplam hedef: 10');
    expect(String(pdf)).toContain('Aktif lead: 4');
    expect(String(pdf)).toContain('Incelenmemis sinyal: 2');
  });

  test('throws when SMTP is not configured', async () => {
    await expect(service.sendWeeklyReportEmail('ops@example.com')).rejects.toThrow('smtp_not_configured');
  });

  test('sends weekly report email with PDF attachment', async () => {
    env.SMTP_HOST = 'smtp.example.com';
    env.SMTP_USER = 'user';
    env.SMTP_PASSWORD = 'pass';
    queueReportRows();

    await service.sendWeeklyReportEmail('ops@example.com');

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'user', pass: 'pass' },
    });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'noreply@example.com',
      to: 'ops@example.com',
      subject: 'MarketPulse Haftalik Rapor',
      attachments: [
        expect.objectContaining({
          filename: 'marketpulse-weekly-report.pdf',
          contentType: 'application/pdf',
          content: expect.any(Buffer),
        }),
      ],
    }));
  });
});
