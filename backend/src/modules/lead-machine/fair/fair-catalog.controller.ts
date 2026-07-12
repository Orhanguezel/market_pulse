import type { RouteHandler } from 'fastify';
import {
  searchFairs,
  getFair,
  discoverExhibitorUrl,
  saveFairDiscovery,
  setExhibitorUrl,
} from './fair-catalog.service';

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/** GET /lead-machine/fair/catalog — fuar arama (paylaşımlı katalog). */
export const listFairCatalog: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const q = asRecord(req.query);
  const { rows, total } = await searchFairs({
    q: str(q.q),
    country: str(q.country),
    sector: str(q.sector),
    from: str(q.from),
    onlyUpcoming: q.upcoming === '1' || q.upcoming === 'true',
    limit: Number(q.limit ?? 30),
    offset: Number(q.offset ?? 0),
  });
  reply.header('x-total-count', String(total));
  return rows;
};

/** GET /lead-machine/fair/catalog/:id */
export const getFairCatalogItem: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const fair = await getFair(req.params.id);
  if (!fair) return reply.code(404).send({ error: { message: 'not_found' } });
  return fair;
};

/**
 * POST /lead-machine/fair/catalog/:id/discover
 * Fuarın sitesini, güncel tarihini ve katılımcı sayfasını ÜCRETSİZ keşfeder, kataloğa yazar.
 */
export const discoverFairExhibitor: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const fair = await getFair(req.params.id);
  if (!fair) return reply.code(404).send({ error: { message: 'not_found' } });

  const result = await discoverExhibitorUrl(fair);
  if (result.exhibitor_url || result.website || result.start_date) {
    await saveFairDiscovery(fair.id, result.exhibitor_url, result.website, {
      start: result.start_date,
      end: result.end_date,
    });
  }
  return result;
};

/** PATCH /lead-machine/fair/catalog/:id/exhibitor-url — katılımcı sayfasını elle kaydet. */
export const patchFairExhibitorUrl: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  const url = str(body.exhibitor_url);
  if (!url || !/^https?:\/\//i.test(url)) {
    return reply.code(400).send({ error: { message: 'valid_url_required' } });
  }
  const fair = await getFair(req.params.id);
  if (!fair) return reply.code(404).send({ error: { message: 'not_found' } });
  await setExhibitorUrl(fair.id, url);
  return { ok: true, exhibitor_url: url };
};
