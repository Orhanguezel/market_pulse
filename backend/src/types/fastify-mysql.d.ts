import 'fastify';

type MySQL = {
  query<T = unknown[]>(sql: string, params?: unknown[]): Promise<[T, unknown]>;
  execute<T = unknown[]>(sql: string, params?: unknown[]): Promise<[T, unknown]>;
};

declare module 'fastify' {
  interface FastifyInstance {
    mysql: MySQL;
    db: MySQL;
  }
  interface FastifyRequest {
    mysql: MySQL;
  }
}
