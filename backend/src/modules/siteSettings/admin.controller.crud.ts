// src/modules/siteSettings/admin.controller.crud.ts
// Admin granular CRUD + delete + meta handler'lar.

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import { siteSettingUpsertSchema, siteSettingBulkUpsertSchema } from './validation';
import type { JsonLike } from '../_shared';
import {
  createAdminSiteSetting,
  bulkUpsertAdminSiteSettings,
  deleteAdminSiteSetting,
  deleteManyAdminSiteSettings,
  getAdminAppLocalesMeta,
  getAdminEffectiveDefaultLocale,
  getAdminSiteSettingByKey,
  hasAdminSettingValue,
  listAdminSiteSettings,
  updateAdminSiteSetting,
} from './helpers';

type LocaleRequest = FastifyRequest & { locale?: string | null };
type LocaleQuery = { locale?: string };

// ── List ─────────────────────────────────────────────────────────────────────

export async function adminListSiteSettings(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = (req.query || {}) as Record<string, string | undefined>;
    const rows = await listAdminSiteSettings(q);
    return reply.send(rows);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_list_site_settings');
  }
}

// ── Get by key ───────────────────────────────────────────────────────────────

export async function adminGetSiteSettingByKey(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { key } = req.params as { key: string };
    const qLocale = (req.query as LocaleQuery | undefined)?.locale;
    const result = await getAdminSiteSettingByKey(key, qLocale ?? (req as LocaleRequest).locale);
    if (!result) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_site_setting');
  }
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function adminCreateSiteSetting(req: FastifyRequest, reply: FastifyReply) {
  try {
    const input = siteSettingUpsertSchema.parse(req.body || {});
    const result = await createAdminSiteSetting(input);
    return reply.code(201).send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_create_site_setting');
  }
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function adminUpdateSiteSetting(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { key } = req.params as { key: string };
    const body = (req.body || {}) as Partial<{ value: JsonLike }>;
    const qLocale = (req.query as LocaleQuery | undefined)?.locale;

    if (!hasAdminSettingValue(body)) {
      return reply.code(400).send({ error: { message: 'validation_error' } });
    }

    await updateAdminSiteSetting(key, body.value, qLocale);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_update_site_setting');
  }
}

// ── Bulk upsert ──────────────────────────────────────────────────────────────

export async function adminBulkUpsertSiteSettings(req: FastifyRequest, reply: FastifyReply) {
  try {
    const input = siteSettingBulkUpsertSchema.parse(req.body || {});
    await bulkUpsertAdminSiteSettings(input);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_bulk_upsert_site_settings');
  }
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function adminDeleteManySiteSettings(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = (req.query || {}) as Record<string, string | undefined>;
    await deleteManyAdminSiteSettings(q);
    return reply.code(204).send();
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_delete_many_site_settings');
  }
}

export async function adminDeleteSiteSetting(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { key } = req.params as { key: string };
    const qLocale = (req.query as LocaleQuery | undefined)?.locale;
    await deleteAdminSiteSetting(key, qLocale);
    return reply.code(204).send();
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_delete_site_setting');
  }
}

// ── Meta ─────────────────────────────────────────────────────────────────────

export async function adminGetAppLocales(req: FastifyRequest, reply: FastifyReply) {
  try {
    const metas = await getAdminAppLocalesMeta();
    return reply.send(metas);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_app_locales');
  }
}

export async function adminGetDefaultLocale(req: FastifyRequest, reply: FastifyReply) {
  try {
    const def = await getAdminEffectiveDefaultLocale();
    return reply.send(def);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_default_locale');
  }
}
