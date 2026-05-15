// src/modules/_shared/env.ts
// Shared environment variable parsers

export function parseEnvInt(value: string | undefined, fallback: number): number {
  const parsed = value ? parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseEnvBool(value: string | undefined, fallback = false): boolean {
  if (value == null) return fallback;
  const normalized = value.toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

export function parseEnvList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
