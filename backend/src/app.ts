import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

import authPlugin from './plugins/authPlugin';
import mysqlPlugin from '@/plugins/mysql';
import sentryPlugin from '@/plugins/sentry';
import swaggerPlugin from '@/plugins/swagger';
import { env } from '@/core/env';
import { registerErrorHandlers } from '@/core/error';
import { loggerConfig } from '@/core/logger';
import { requestLoggerPlugin } from '@/modules/audit/requestLogger.plugin';
import { getStorageSettings } from '@/modules/siteSettings';
import { registerAllRoutes } from './routes';
import { parseCorsOrigins, pickUploadsRoot, pickUploadsPrefix } from './app.helpers';
import { registerChurnJob } from '@/jobs/churn.job';
import { registerReportJob } from '@/jobs/report.job';

export async function createApp() {
  const { default: buildFastify } =
    (await import('fastify')) as unknown as { default: typeof import('fastify').default };

  const app = buildFastify({ logger: loggerConfig }) as FastifyInstance;

  await app.register(cors, {
    origin: parseCorsOrigins(env.CORS_ORIGIN),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Prefer', 'Accept', 'Accept-Language', 'x-skip-auth', 'Range'],
    exposedHeaders: ['x-total-count', 'content-range', 'range'],
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true, path: '/', sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
    },
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
  });

  await app.register(rateLimit, {
    max: 600,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip,
  });

  await app.register(authPlugin);
  await app.register(mysqlPlugin);
  await app.register(sentryPlugin);
  await app.register(swaggerPlugin);

  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  let storageSettings: Awaited<ReturnType<typeof getStorageSettings>> | null = null;
  try { storageSettings = await getStorageSettings(); } catch { /* ignore */ }

  await app.register(fastifyStatic, {
    root: pickUploadsRoot(storageSettings?.localRoot),
    prefix: pickUploadsPrefix(storageSettings?.localBaseUrl),
    decorateReply: false,
  });

  app.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (_req, body, done) => {
      try { done(null, Object.fromEntries(new URLSearchParams(body as string))); }
      catch { done(null, {}); }
    },
  );

  await app.register(requestLoggerPlugin);
  await registerAllRoutes(app);
  registerErrorHandlers(app);
  registerChurnJob(app);
  registerReportJob(app);

  return app;
}
