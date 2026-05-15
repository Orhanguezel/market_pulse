// =============================================================
// FILE: src/i18n/request.ts  (DYNAMIC)
// =============================================================

/* ----------------------- getRequestConfig SHIM ----------------------- */
type RequestCtx = { requestLocale?: string | null };
type RequestConfigFn<R = any> = (ctx: RequestCtx) => Promise<R>;
function getRequestConfig<R = { locale: string; messages: Record<string, unknown> }>(
  cb: RequestConfigFn<R>,
): RequestConfigFn<R> {
  return cb;
}
/* ------------------------------------------------------------------- */

import { normLocaleTag } from "./localeUtils";
import { getServerI18nContext } from "./server";

/**
 * Namespace listesi (UI textleri)
 * NOT: Burada "fallback namespace yükleme" yok; istenen dil dosyası yoksa boş döneriz.
 */
const NAMESPACES = [
  "common","nav","navbar","footer","seo",
  "home","about","contact",
  "library","libraryDetail",
  "references","referenceDetail",
  "products","productDetail",
  "spareParts","sparePartDetail",
  "news","newsDetail",
  "blog","blogDetail",
  "search",
  "comments","legal","notFound","tagPage","categories","tagLabels",
] as const;

// "a.b.c": "val" -> {a:{b:{c:"val"}}}
function undot(flat: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (!key.includes(".")) { out[key] = value; continue; }
    const parts = key.split(".");
    let cur: Record<string, unknown> = out;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      if (i === parts.length - 1) cur[p] = value;
      else {
        cur[p] = (cur[p] as Record<string, unknown>) ?? {};
        cur = cur[p] as Record<string, unknown>;
      }
    }
  }
  return out;
}

// Basit derin merge
function mergeDeep<T extends Record<string, unknown>>(target: T, src: T): T {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      // @ts-expect-error generic assign
      target[k] = mergeDeep((target[k] as T) ?? ({} as T), v as T);
    } else {
      // @ts-expect-error generic assign
      target[k] = v;
    }
  }
  return target;
}

/** Sadece İSTENEN locale’den dener; dosya yoksa BOŞ döner. */
async function loadNamespace(locale: string, ns: string): Promise<Record<string, unknown>> {
  try {
    const mod = (await import(`@/i18n/messages/${locale}/${ns}.json`)) as {
      default?: Record<string, unknown>;
    };
    const raw = (mod?.default ?? {}) as Record<string, unknown>;
    const tree = Object.keys(raw).some((k) => k.includes(".")) ? undot(raw) : raw;
    return tree && typeof tree === "object" && ns in tree
      ? (tree as Record<string, unknown>)
      : { [ns]: tree };
  } catch {
    return { [ns]: {} };
  }
}

export default getRequestConfig(async ({ requestLocale }: RequestCtx) => {
  const { activeLocales, defaultLocale } = await getServerI18nContext();

  const req = normLocaleTag(requestLocale);
  const activeSet = new Set((activeLocales || []).map(normLocaleTag));

  const chosen = (req && activeSet.has(req)) ? req : defaultLocale;

  let messages: Record<string, unknown> = {};
  for (const ns of NAMESPACES) {
    const tree = await loadNamespace(chosen, ns);
    messages = mergeDeep(messages, tree);
  }

  return { locale: chosen, messages };
});
