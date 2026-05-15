// src/modules/siteSettings/controller.ts
// Public handler'lar — DB sorgusu yok, repo fonksiyonları kullanılır.

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError, normalizeLooseLocale } from '../_shared';

import { buildLocaleFallbackChain, getAppLocalesMeta, getEffectiveDefaultLocale } from './service';
import { rowToDto, repoGetAllByConditions, repoGetRowsByKey, repoGetFirstRowByFallback } from './repository';

type LocaleRequest = FastifyRequest & { locale?: string | null };
type SeoPageDto = { pageKey: string } & Record<string, unknown>;
type BrandConfigDto = {
  primaryHex: string;
  primaryHexDark: string;
  accentHex: string;
  accentHexDark: string;
  sidebarBgCss: string;
  logoUrl: string;
  faviconUrl: string;
};

// GET /site_settings?locale=de&prefix=foo
export async function listSiteSettings(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = (req.query || {}) as {
      locale?: string;
      prefix?: string;
      key?: string;
      key_in?: string;
    };

    const requested = normalizeLooseLocale(q.locale) ?? normalizeLooseLocale((req as LocaleRequest).locale);
    const fallbacks = await buildLocaleFallbackChain({ requested });
    const prefix = typeof q.prefix === 'string' ? q.prefix.trim() : '';

    const keyIn = q.key_in
      ? q.key_in.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const rows = await repoGetAllByConditions({
      key: q.key,
      prefix,
      keyIn,
    });

    const map = new Map<string, ReturnType<typeof rowToDto>>();
    const uniqueKeys = Array.from(new Set(rows.map((r) => r.key)));

    for (const k of uniqueKeys) {
      const cands = rows.filter((r) => r.key === k);
      const byLocale = new Map(cands.map((r) => [r.locale, r]));

      for (const l of fallbacks) {
        const r = byLocale.get(l);
        if (r) {
          map.set(k, rowToDto(r));
          break;
        }
      }
    }

    return reply.send(Array.from(map.values()));
  } catch (e) {
    return handleRouteError(reply, req, e, 'list_site_settings');
  }
}

// GET /site_settings/:key?locale=de
export async function getSiteSettingByKey(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { key } = req.params as { key: string };
    const query = (req.query || {}) as { locale?: string; prefix?: string };
    const qLocale = query.locale as string | undefined;
    const prefix = typeof query.prefix === 'string' ? query.prefix.trim() : '';

    const requested = normalizeLooseLocale(qLocale) ?? normalizeLooseLocale((req as LocaleRequest).locale);
    const fallbacks = await buildLocaleFallbackChain({ requested });

    const candidateKeys = Array.from(
      new Set([prefix ? `${prefix}${key}` : null, key].filter(Boolean) as string[]),
    );

    for (const candidateKey of candidateKeys) {
      const rows = await repoGetRowsByKey(candidateKey);
      const byLocale = new Map(rows.map((r) => [r.locale, r]));

      for (const l of fallbacks) {
        const found = byLocale.get(l);
        if (found) return reply.send(rowToDto(found));
      }
    }

    return reply.code(404).send({ error: { message: 'not_found' } });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_site_setting');
  }
}

export async function getAppLocalesPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const metas = await getAppLocalesMeta();
    return reply.send(metas);
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_app_locales');
  }
}

export async function getDefaultLocalePublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const def = await getEffectiveDefaultLocale();
    return reply.send(def);
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_default_locale');
  }
}

// GET /site_settings/seo/:pageKey
export async function getPageSeo(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { pageKey } = req.params as { pageKey: string };
    const query = (req.query || {}) as { locale?: string };

    const requested = normalizeLooseLocale(query.locale) ?? normalizeLooseLocale((req as LocaleRequest).locale);
    const fallbacks = await buildLocaleFallbackChain({ requested });

    // seo_pages_{pageKey} anahtarını oku
    const settingKey = `seo_pages_${pageKey}`;
    const row = await repoGetFirstRowByFallback(settingKey, fallbacks);

    if (!row) {
      // seo_defaults fallback
      const defaults = await repoGetFirstRowByFallback('seo_defaults', fallbacks);
      if (defaults) return reply.send({ pageKey, ...(rowToDto(defaults).value as Record<string, unknown>), _fallback: true });
      return reply.code(404).send({ error: { message: 'not_found' } });
    }

    return reply.send({ pageKey, ...(rowToDto(row).value as Record<string, unknown>) });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_page_seo');
  }
}

// GET /site_settings/seo — tüm sayfa SEO ayarlarını döndür
export async function listAllPageSeo(req: FastifyRequest, reply: FastifyReply) {
  try {
    const query = (req.query || {}) as { locale?: string };
    const requested = normalizeLooseLocale(query.locale) ?? normalizeLooseLocale((req as LocaleRequest).locale);
    const fallbacks = await buildLocaleFallbackChain({ requested });

    const rows = await repoGetAllByConditions({ prefix: 'seo_pages_' });

    const map = new Map<string, SeoPageDto>();
    const uniqueKeys = Array.from(new Set(rows.map((r) => r.key)));

    for (const k of uniqueKeys) {
      const cands = rows.filter((r) => r.key === k);
      const byLocale = new Map(cands.map((r) => [r.locale, r]));

      for (const l of fallbacks) {
        const r = byLocale.get(l);
        if (r) {
          const pageKey = k.replace('seo_pages_', '');
          const val = rowToDto(r).value;
          map.set(pageKey, { pageKey, ...(val as Record<string, unknown>) });
          break;
        }
      }
    }

    return reply.send(Array.from(map.values()));
  } catch (e) {
    return handleRouteError(reply, req, e, 'list_page_seo');
  }
}

// GET /site_settings/homepage — hero + sections + banners
export async function getHomepageSettings(req: FastifyRequest, reply: FastifyReply) {
  try {
    const query = (req.query || {}) as { locale?: string };
    const requested = normalizeLooseLocale(query.locale) ?? normalizeLooseLocale((req as LocaleRequest).locale);
    const fallbacks = await buildLocaleFallbackChain({ requested });

    const keys = ['homepage_hero', 'homepage_sections', 'homepage_banners'];
    const rows = await repoGetAllByConditions({ keyIn: keys });

    const result: Record<string, unknown> = {};
    for (const k of keys) {
      const cands = rows.filter((r) => r.key === k);
      const byLocale = new Map(cands.map((r) => [r.locale, r]));
      for (const l of fallbacks) {
        const r = byLocale.get(l);
        if (r) {
          result[k.replace('homepage_', '')] = rowToDto(r).value;
          break;
        }
      }
    }

    return reply.send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_homepage_settings');
  }
}

// GET /public/brand-config
export async function getPublicBrandConfig(req: FastifyRequest, reply: FastifyReply) {
  try {
    const row = await repoGetFirstRowByFallback('brand_config', ['*', 'tr', 'en', 'de']);
    const raw = row ? rowToDto(row).value : null;

    const defaults: BrandConfigDto = {
      primaryHex: '#E8A598',
      primaryHexDark: '#D88D7E',
      accentHex: '#22c55e',
      accentHexDark: '#4ade80',
      sidebarBgCss: 'oklch(0.97 0.02 145)',
      logoUrl: '',
      faviconUrl: '',
    };

    if (!raw || typeof raw !== 'object') {
      return reply.send(defaults);
    }

    const cfg = raw as Partial<BrandConfigDto>;
    return reply.send({
      primaryHex: typeof cfg.primaryHex === 'string' ? cfg.primaryHex : defaults.primaryHex,
      primaryHexDark: typeof cfg.primaryHexDark === 'string' ? cfg.primaryHexDark : defaults.primaryHexDark,
      accentHex: typeof cfg.accentHex === 'string' ? cfg.accentHex : defaults.accentHex,
      accentHexDark: typeof cfg.accentHexDark === 'string' ? cfg.accentHexDark : defaults.accentHexDark,
      sidebarBgCss: typeof cfg.sidebarBgCss === 'string' ? cfg.sidebarBgCss : defaults.sidebarBgCss,
      logoUrl: typeof cfg.logoUrl === 'string' ? cfg.logoUrl : defaults.logoUrl,
      faviconUrl: typeof cfg.faviconUrl === 'string' ? cfg.faviconUrl : defaults.faviconUrl,
    } satisfies BrandConfigDto);
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_public_brand_config');
  }
}
