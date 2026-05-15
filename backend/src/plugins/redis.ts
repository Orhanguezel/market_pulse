import fp from 'fastify-plugin';

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
  scan(cursor: string, mode: string, pattern: string, countMode: string, count: number): Promise<[string, string[]]>;
  ping(): Promise<string>;
};

let redisClient: RedisLike | null = null;

export function getRedisClient() {
  return redisClient;
}

export default fp(async (app) => {
  app.log.info('Redis disabled: no local Redis plugin configured');
});
