import type { FastifyInstance } from 'fastify';
import { getHealth } from './controller';

export async function registerHealth(app: FastifyInstance) {
  const B = '/health';
  app.get(B, getHealth);
}
