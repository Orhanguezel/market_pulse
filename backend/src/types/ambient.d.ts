declare module 'geoip-lite';

declare module 'fastify' {
  interface FastifyContextConfig {
    public?: boolean;
  }

  interface FastifyInstance {
    redis?: {
      ping(): Promise<string>;
    };
  }
}

export {};
