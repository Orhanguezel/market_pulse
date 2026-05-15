// =============================================================
// FILE: src/modules/theme/admin.controller.ts
// Admin + public theme handlers
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import { DEFAULT_THEME } from './defaults';
import { themeUpdateSchema } from './validation';
import { repoGetThemeConfig, repoUpsertThemeConfig, mergeThemeConfig } from './repository';
import type { ThemeConfig } from './types';

/** GET /admin/theme */
export async function adminGetTheme(_req: FastifyRequest, reply: FastifyReply) {
  try {
    const config = await repoGetThemeConfig();
    return reply.send(config);
  } catch (e) {
    return handleRouteError(reply, _req, e, 'admin_get_theme');
  }
}

/** PUT /admin/theme */
export async function adminUpdateTheme(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = themeUpdateSchema.parse(req.body || {});
    const current = await repoGetThemeConfig();
    const merged = mergeThemeConfig(current, body as Partial<ThemeConfig>);
    await repoUpsertThemeConfig(merged);
    return reply.send(merged);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_update_theme');
  }
}

/** POST /admin/theme/reset */
export async function adminResetTheme(_req: FastifyRequest, reply: FastifyReply) {
  try {
    await repoUpsertThemeConfig(DEFAULT_THEME);
    return reply.send(DEFAULT_THEME);
  } catch (e) {
    return handleRouteError(reply, _req, e, 'admin_reset_theme');
  }
}

/** GET /theme — public endpoint (frontend için) */
export async function publicGetTheme(_req: FastifyRequest, reply: FastifyReply) {
  try {
    const config = await repoGetThemeConfig();
    reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return reply.send(config);
  } catch (e) {
    return handleRouteError(reply, _req, e, 'public_get_theme');
  }
}
