import type { FastifyInstance } from 'fastify';
import { authSecurity } from '../_shared';
import { signup, token, googleToken, googleConfig, refresh, passwordResetRequest, passwordResetConfirm, me, status, update, logout } from './controller';

export async function registerAuth(app: FastifyInstance) {
  const B = '/auth';

  app.post(`${B}/signup`, {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: { tags: ['auth'] },
  }, signup);
  app.post(`${B}/register`, {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: { tags: ['auth'] },
  }, signup);
  app.post(`${B}/token`, {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    schema: { tags: ['auth'] },
  }, token);
  app.post(`${B}/login`, {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    schema: { tags: ['auth'] },
  }, token);
  app.post(`${B}/google`, {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    schema: { tags: ['auth'] },
  }, googleToken);
  app.get(`${B}/google/config`, {
    schema: { tags: ['auth'] },
  }, googleConfig);
  app.post(`${B}/token/refresh`, {
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    schema: { tags: ['auth'] },
  }, refresh);
  app.post(`${B}/password-reset/request`, {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { tags: ['auth'] },
  }, passwordResetRequest);
  app.post(`${B}/password-reset/confirm`, {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: { tags: ['auth'] },
  }, passwordResetConfirm);

  app.get(`${B}/user`, {
    schema: { tags: ['auth'], security: authSecurity },
  }, me);
  app.get(`${B}/status`, {
    schema: { tags: ['auth'] },
  }, status);
  app.put(`${B}/user`, {
    schema: { tags: ['auth'], security: authSecurity },
  }, update);
  app.post(`${B}/logout`, {
    schema: { tags: ['auth'], security: authSecurity },
  }, logout);
}
