import crypto from 'node:crypto';

function keyFromHex(raw: string | undefined, envName: string): Buffer {
  const hex = (raw || '').trim();
  if (hex.length < 64) throw new Error(`${envName} must be a 32-byte (64 hex chars) env var`);
  return Buffer.from(hex.slice(0, 64), 'hex');
}

export function encryptAes256Gcm(text: string, rawKey: string | undefined, envName: string): string {
  const key = keyFromHex(rawKey, envName);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptAes256Gcm(stored: string, rawKey: string | undefined, envName: string): string {
  const key = keyFromHex(rawKey, envName);
  const buf = Buffer.from(stored, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
