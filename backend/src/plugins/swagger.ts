import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { env } from '@/core/env';

export default fp(async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: { title: `${env.APP_NAME} API`, version: '0.1.0' },
      servers: [{ url: `${(env.PUBLIC_URL || 'http://localhost:8086').replace(/\/+$/, '')}/api/v1` }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/api/v1/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });
});
