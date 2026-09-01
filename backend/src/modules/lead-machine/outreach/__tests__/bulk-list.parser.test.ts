import { describe, expect, test } from 'bun:test';
import { isValidEmail, parseCsv, parseRecipientFile } from '../bulk-list.parser';

describe('bulk-list parser — email validation', () => {
  test('accepts well-formed emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('a.b-c@sub.example.co')).toBe(true);
  });
  test('rejects malformed / empty emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('foo@bar')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('bulk-list parser — CSV', () => {
  test('parses header + rows, maps known fields', () => {
    const csv = 'email,name,company,country\nalice@example.com,Alice,ACME,DE\nbob@example.com,Bob,Globex,TR\n';
    const result = parseRecipientFile(Buffer.from(csv), 'list.csv');
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      email: 'alice@example.com',
      name: 'Alice',
      company: 'ACME',
      country: 'DE',
      custom_fields: null,
    });
  });

  test('skips invalid emails and counts them', () => {
    const csv = 'email,name\ngood@example.com,Good\nbad-email,Bad\n,Empty\n';
    const result = parseRecipientFile(Buffer.from(csv), 'list.csv');
    expect(result.rows).toHaveLength(1);
    expect(result.invalid).toBe(2);
  });

  test('de-dups repeated emails (case-insensitive), first wins', () => {
    const csv = 'email,name\ndup@example.com,First\nDUP@example.com,Second\nother@example.com,Other\n';
    const result = parseRecipientFile(Buffer.from(csv), 'list.csv');
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('First');
    expect(result.duplicates).toBe(1);
  });

  test('captures unknown columns as custom_fields', () => {
    const csv = 'email,sector\nx@example.com,automotive\n';
    const result = parseRecipientFile(Buffer.from(csv), 'list.csv');
    expect(result.rows[0].custom_fields).toEqual({ sector: 'automotive' });
  });

  test('supports turkish header aliases and semicolon delimiter', () => {
    const csv = 'e-posta;isim;firma;ülke\nveli@example.com;Veli;FirmaX;TR\n';
    const result = parseRecipientFile(Buffer.from(csv), 'list.csv');
    expect(result.rows[0]).toEqual({
      email: 'veli@example.com',
      name: 'Veli',
      company: 'FirmaX',
      country: 'TR',
      custom_fields: null,
    });
  });

  test('handles quoted fields containing commas', () => {
    const csv = 'email,company\nq@example.com,"ACME, Inc."\n';
    const rows = parseCsv(csv);
    expect(rows[1][1]).toBe('ACME, Inc.');
  });
});
