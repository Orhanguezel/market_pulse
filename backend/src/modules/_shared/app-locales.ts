// src/modules/_shared/app-locales.ts

export type AppLocaleMeta = {
  code: string;
  label: string;
  is_default: boolean;
  is_active: boolean;
};

export const DEFAULT_APP_LOCALES: AppLocaleMeta[] = [
  { code: 'tr', label: 'TR', is_default: true, is_active: true },
  { code: 'en', label: 'EN', is_default: false, is_active: true },
];

export function cloneDefaultAppLocales(): AppLocaleMeta[] {
  return DEFAULT_APP_LOCALES.map((item) => ({ ...item }));
}

function normalizeLocaleCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace('_', '-');
  if (!normalized) return null;
  return normalized.split('-')[0]?.trim() || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseAppLocalesValueToMeta(value: unknown): AppLocaleMeta[] {
  if (value == null) return [];

  const normalizeOne = (item: unknown): AppLocaleMeta | null => {
    if (typeof item === 'string') {
      const code = normalizeLocaleCode(item);
      if (!code) return null;
      return { code, label: code.toUpperCase(), is_default: false, is_active: true };
    }

    if (!isRecord(item)) return null;

    const code = normalizeLocaleCode(item.code ?? item.value);
    if (!code) return null;

    const label =
      typeof item.label === 'string' && item.label.trim()
        ? item.label.trim()
        : code.toUpperCase();

    return {
      code,
      label,
      is_default: item.is_default === true || item.isDefault === true,
      is_active: item.is_active !== false,
    };
  };

  if (Array.isArray(value)) {
    const items = value.map(normalizeOne).filter((item): item is AppLocaleMeta => item !== null);
    const active = items.filter((item) => item.is_active !== false);
    const unique = new Map<string, AppLocaleMeta>();

    for (const item of active) unique.set(item.code, item);

    const out = Array.from(unique.values());
    if (out.length > 0 && !out.some((item) => item.is_default)) {
      out[0] = { ...out[0], is_default: true };
    }
    return out;
  }

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return [];

    try {
      return parseAppLocalesValueToMeta(JSON.parse(raw));
    } catch {
      const parts = raw
        .split(/[;,]+/)
        .map((item) => normalizeLocaleCode(item))
        .filter((item): item is string => Boolean(item));
      const unique = Array.from(new Set(parts));
      return unique.map((code, index) => ({
        code,
        label: code.toUpperCase(),
        is_default: index === 0,
        is_active: true,
      }));
    }
  }

  return [];
}

export function getActiveAppLocaleCodes(items: AppLocaleMeta[]): string[] {
  return items.filter((item) => item.is_active !== false).map((item) => item.code);
}

export function pickDefaultAppLocaleCode(items: AppLocaleMeta[]): string | null {
  return items.find((item) => item.is_default)?.code ?? items[0]?.code ?? null;
}
