declare module 'geoip-lite';

declare module 'fastify' {
  interface FastifyContextConfig {
    public?: boolean;
    leadMachineScope?: 'user' | 'admin' | 'public';
  }

  interface FastifyRequest { rawBody?: Buffer; }

  interface FastifyInstance {
    redis?: {
      ping(): Promise<string>;
      quit(): Promise<unknown>;
    };
  }
}

export {};
