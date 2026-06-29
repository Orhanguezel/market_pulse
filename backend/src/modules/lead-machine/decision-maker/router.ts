import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import { requireModule } from '@/modules/entitlements';
import { runDecisionMakerFinder, buildSearchHints, SECTOR_PRESETS, DEFAULT_TITLES, EXPORT_B2B_TITLES, type FinderParams } from './finder.service';

/**
 * Karar Verici Bulma (OSINT) — Places havuzu + Apollo people-search.
 * /api/v1/lead-machine/decision-makers/* — requireAuth + requireModule('leads').
 */
export async function registerDecisionMakerPublic(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireModule('leads')] };

  // Sektör/unvan presetleri (UI için)
  app.get('/lead-machine/decision-makers/presets', guard, async () => ({
    sectors: Object.keys(SECTOR_PRESETS),
    business_types: SECTOR_PRESETS,
    default_titles: DEFAULT_TITLES,
    export_b2b_titles: EXPORT_B2B_TITLES,
  }));

  // Yarı-manuel OSINT asistanı: Google operatörleri + LinkedIn arama URL'i (firma bazlı)
  app.post('/lead-machine/decision-makers/search-hints', guard, async (req, reply) => {
    const body = (req.body ?? {}) as { company?: string; city?: string; country?: string; titles?: string[] };
    if (!body.company) return reply.status(400).send({ error: { message: 'company_required' } });
    return buildSearchHints(body.company, body.country, body.titles, body.city);
  });

  // Senkron çalıştır → satırlar + istatistik (ilk faz; ileride job'a alınabilir)
  app.post('/lead-machine/decision-makers/find', guard, async (req, reply) => {
    const body = (req.body ?? {}) as Partial<FinderParams>;
    if (!Array.isArray(body.cities) || body.cities.length === 0) {
      return reply.status(400).send({ error: { message: 'cities_required' } });
    }
    const result = await runDecisionMakerFinder({
      sector: body.sector,
      businessTypes: body.businessTypes,
      cities: body.cities.slice(0, 8),
      country: body.country,
      titles: body.titles,
      perCityLimit: body.perCityLimit,
      targetCount: body.targetCount,
    });
    return result;
  });
}
