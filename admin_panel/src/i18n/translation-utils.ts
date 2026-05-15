export type TranslationParams = Record<string, string | number>;

export function getValueByPath(obj: unknown, path: string): unknown {
  const p = String(path || '').trim();
  if (!p) return undefined;

  const keys = p.split('.').filter(Boolean);
  if (!keys.length) return undefined;

  let current: unknown = obj;
  for (const key of keys) {
    if (!current || typeof current !== 'object') return undefined;
    if (!(key in (current as Record<string, unknown>))) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function getStringByPath(obj: unknown, path: string): string | undefined {
  const v = getValueByPath(obj, path);
  return typeof v === 'string' ? v : undefined;
}

export function interpolate(template: string, params?: TranslationParams | null): string {
  if (!params) return template;

  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

export type TranslateFn = (key: string, params?: TranslationParams | null, fallback?: string) => string;

type BuildTranslatorOpts<TLocale extends string> = {
  translations: Partial<Record<TLocale, unknown>>;
  locales: readonly TLocale[];
  fallbackChain: readonly TLocale[];
};

function uniqKeepOrder<T>(items: readonly T[]): T[] {
  const out: T[] = [];
  const seen = new Set<T>();
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

export function buildTranslator<TLocale extends string>(opts: BuildTranslatorOpts<TLocale>): TranslateFn {
  const { translations, locales, fallbackChain } = opts;

  const allowed = new Set(locales);
  const chain = uniqKeepOrder(fallbackChain).filter((l) => allowed.has(l));

  return (key: string, params?: TranslationParams | null, fallback?: string): string => {
    const k = String(key || '').trim();
    if (!k) return '';

    let text: string | undefined;
    for (const l of chain) {
      text = getStringByPath(translations[l], k);
      if (text) break;
    }

    const finalText = text || fallback || k;
    return interpolate(finalText, params);
  };
}
