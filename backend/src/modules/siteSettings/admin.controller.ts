// src/modules/siteSettings/admin.controller.ts
// Admin handler'lar (aggregate + upsert) — max 200 satir kurali.
// Granular CRUD + delete + meta: admin.controller.crud.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import { sendMailRaw } from '../mail';
import { getSmtpSettings } from './service';
import {
  readAdminAggregateSettings,
  upsertAdminAggregateSettings,
  type AdminAggregateSettingsPayload,
} from './helpers';

type LocaleRequest = FastifyRequest & { locale?: string | null };
type LocaleQuery = { locale?: string };

// ── Aggregate GET/PUT ────────────────────────────────────────────────────────

export async function adminGetSettingsAggregate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const qLocale = (req.query as LocaleQuery | undefined)?.locale;
    const result = await readAdminAggregateSettings(qLocale ?? (req as LocaleRequest).locale);
    return reply.send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_settings_aggregate');
  }
}

export async function adminUpsertSettingsAggregate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = (req.body || {}) as AdminAggregateSettingsPayload;
    const qLocale = (req.query as LocaleQuery | undefined)?.locale;
    await upsertAdminAggregateSettings(body, qLocale);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_upsert_settings_aggregate');
  }
}

// ── SMTP Test ────────────────────────────────────────────────────────────────

export async function adminSmtpTest(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { to } = (req.body || {}) as { to?: string };
    if (!to || !to.trim()) {
      return reply.status(400).send({ error: { message: 'to adresi zorunludur' } });
    }

    const cfg = await getSmtpSettings();
    if (!cfg.host) {
      return reply.status(422).send({ error: { message: 'SMTP ayarları eksik (smtp_host). Önce SMTP sekmesinden yapılandırın.' } });
    }

    await sendMailRaw({
      to: to.trim(),
      subject: 'SMTP Test Maili',
      html: '<p>Bu bir test mailidir. SMTP yapılandırmanız başarıyla çalışıyor.</p>',
      text: 'Bu bir test mailidir. SMTP yapilandirmaniz basariyla calisiyor.',
    });

    return reply.send({ ok: true, message: `Test maili ${to.trim()} adresine gönderildi.` });
  } catch (e: any) {
    const raw = e?.message || 'SMTP bağlantı hatası';
    // Provide friendlier messages for common SMTP errors
    const msg = raw.includes('ENOTFOUND')
      ? 'SMTP sunucusuna bağlanılamadı (DNS çözümlenemedi). smtp_host değerini kontrol edin.'
      : raw.includes('ECONNREFUSED')
      ? 'SMTP sunucusu bağlantıyı reddetti. Host/port değerlerini kontrol edin.'
      : raw.includes('ETIMEDOUT')
      ? 'SMTP sunucusuna bağlantı zaman aşımına uğradı.'
      : raw;
    return reply.status(422).send({ error: { message: msg } });
  }
}

// Re-export crud handlers for admin.routes.ts convenience
export {
  adminListSiteSettings,
  adminGetSiteSettingByKey,
  adminCreateSiteSetting,
  adminUpdateSiteSetting,
  adminBulkUpsertSiteSettings,
  adminDeleteManySiteSettings,
  adminDeleteSiteSetting,
  adminGetAppLocales,
  adminGetDefaultLocale,
} from './admin.controller.crud';
