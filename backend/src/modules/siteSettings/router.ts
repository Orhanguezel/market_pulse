// src/modules/siteSettings/router.ts

import type { FastifyInstance } from 'fastify';
import {
  listSiteSettings,
  getSiteSettingByKey,
  getAppLocalesPublic,
  getDefaultLocalePublic,
  getPageSeo,
  listAllPageSeo,
  getHomepageSettings,
  getPublicBrandConfig,
} from './controller';

const B = '/site_settings';

export async function registerSiteSettings(app: FastifyInstance) {
  app.get(B, listSiteSettings);
  app.get(`${B}/app-locales`, getAppLocalesPublic);
  app.get(`${B}/default-locale`, getDefaultLocalePublic);
  app.get(`${B}/page-seo`, listAllPageSeo);
  app.get(`${B}/page-seo/:pageKey`, getPageSeo);
  app.get(`${B}/homepage`, getHomepageSettings);
  app.get('/public/brand-config', getPublicBrandConfig);
  app.get(`${B}/:key`, getSiteSettingByKey);
}
