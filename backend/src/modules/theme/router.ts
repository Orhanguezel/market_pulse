import type { FastifyInstance } from 'fastify';
import { publicGetTheme } from './admin.controller';

export async function registerTheme(app: FastifyInstance) {
  const B = '/theme';
  app.get(`${B}`, publicGetTheme);
}
