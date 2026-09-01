import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createDbMock } from '@/modules/market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({
  env: {
    TENANT_KEY: 'tenant-a',
    MAIL_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    DB_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    PUBLIC_URL: 'https://example.test',
    APP_URL: 'https://example.test',
    COOKIE_SECRET: 'cookie-secret',
    JWT_SECRET: 'jwt-secret',
    GMAIL_DAILY_SEND_LIMIT: 500,
  },
}));

const service = await import('../service');
const { runWithTenant } = await import('@/core/tenant-context');

beforeEach(() => {
  dbMock.reset();
});

describe('mail account owner isolation and secrets', () => {
  test('lists only active tenant and owner mail accounts', async () => {
    dbMock.queuePoolExecute([]);

    await runWithTenant('tenant-a', () => service.listMailAccounts('user-1'));

    expect(dbMock.poolExecutions[0]?.sql).toContain('WHERE tenant_key = ? AND owner_user_id = ?');
    expect(dbMock.poolExecutions[0]?.values).toEqual(['tenant-a', 'user-1']);
  });

  test('stores IMAP/SMTP password encrypted and scoped to owner', async () => {
    dbMock.queuePoolExecute([]);

    await runWithTenant('tenant-a', () => service.saveImapSmtpAccount('user-1', {
      email: 'user@example.com',
      displayName: 'User One',
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUsername: 'user@example.com',
      password: 'plain-secret',
      imapHost: 'imap.example.com',
      imapPort: 993,
    }));

    const insert = dbMock.poolExecutions[0];
    expect(insert?.sql).toContain('INSERT INTO user_mail_accounts');
    expect(insert?.values?.slice(0, 3)).toEqual(['tenant-a', 'user-1', 'user@example.com']);
    expect(insert?.values).not.toContain('plain-secret');
    expect(String(insert?.values?.at(-1))).not.toBe('plain-secret');

    const list = dbMock.poolExecutions[1];
    expect(list?.values).toEqual(['tenant-a', 'user-1']);
  });
});
