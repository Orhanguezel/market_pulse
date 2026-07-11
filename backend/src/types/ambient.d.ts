declare module 'geoip-lite';

declare module 'fastify' {
  interface FastifyContextConfig {
    public?: boolean;
    leadMachineScope?: 'user' | 'admin' | 'public';
    // Owner-scope route bayragi (market, crm, ...). 'user' => aktif kullaniciyla sinirla.
    // req.url'e BAKMAK yasak: query string saldirgan kontrolunde (?x=/admin/ ile bypass).
    ownerScope?: 'user' | 'admin';
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
