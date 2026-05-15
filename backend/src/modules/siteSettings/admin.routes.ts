// src/modules/siteSettings/admin.routes.ts

import type { FastifyInstance } from 'fastify';
import {
  adminGetSettingsAggregate,
  adminUpsertSettingsAggregate,
  adminListSiteSettings,
  adminGetSiteSettingByKey,
  adminCreateSiteSetting,
  adminUpdateSiteSetting,
  adminBulkUpsertSiteSettings,
  adminDeleteManySiteSettings,
  adminDeleteSiteSetting,
  adminGetAppLocales,
  adminGetDefaultLocale,
  adminSmtpTest,
} from './admin.controller';

const B = '/site-settings';

export async function registerSiteSettingsAdmin(app: FastifyInstance) {
  app.get(B, adminGetSettingsAggregate);
  app.put(B, adminUpsertSettingsAggregate);
  app.get(`${B}/app-locales`, adminGetAppLocales);
  app.get(`${B}/default-locale`, adminGetDefaultLocale);
  app.get(`${B}/list`, adminListSiteSettings);
  app.post(`${B}/smtp-test`, adminSmtpTest);
  app.get(`${B}/:key`, adminGetSiteSettingByKey);
  app.post(B, adminCreateSiteSetting);
  app.put(`${B}/:key`, adminUpdateSiteSetting);
  app.post(`${B}/bulk-upsert`, adminBulkUpsertSiteSettings);
  app.delete(B, adminDeleteManySiteSettings);
  app.delete(`${B}/:key`, adminDeleteSiteSetting);
}
