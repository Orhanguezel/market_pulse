// =============================================================
// FILE: src/modules/theme/admin.routes.ts
// =============================================================
import type { FastifyInstance } from 'fastify';
import { adminGetTheme, adminUpdateTheme, adminResetTheme } from './admin.controller';

export async function registerThemeAdmin(app: FastifyInstance) {
  const B = '/theme';
  app.get(`${B}`, adminGetTheme);
  app.put(`${B}`, adminUpdateTheme);
  app.post(`${B}/reset`, adminResetTheme);
}
