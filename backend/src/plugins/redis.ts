import fp from 'fastify-plugin';
import IORedis from 'ioredis';
import { env } from '@/core/env';

let redisClient: IORedis | null = null;

export function getRedisClient() {
  return redisClient;
}

export default fp(async (app) => {
  if (!env.REDIS_URL) {
    app.log.info('Redis disabled: REDIS_URL not configured');
    return;
  }

  const client = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  redisClient = client;
  app.decorate('redis', client);

  app.addHook('onClose', async () => {
    redisClient = null;
    await client.quit().catch(() => client.disconnect());
  });

  await client.ping();
  app.log.info('Redis connected');
});
