import { createApp } from './app';
import { env } from '@/core/env';
import type { FastifyInstance } from 'fastify';

async function main() {
  const app: FastifyInstance = await createApp();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`${env.APP_NAME} API listening :${env.PORT} [${env.NODE_ENV}]`);
}

main().catch((e) => {
  console.error('Server failed', e);
  process.exit(1);
});
