import { describe, expect, test } from 'bun:test';
import Fastify, { type RouteOptions } from 'fastify';
import { registerStorageUser } from '../user.routes';

describe('user storage routes', () => {
  test('registers authenticated CRM-scoped asset operations', async () => {
    const app = Fastify();
    const routes: RouteOptions[] = [];
    app.addHook('onRoute', (route) => routes.push(route));
    await app.register(registerStorageUser);
    await app.ready();

    expect(routes.map((route) => `${route.method} ${route.url}`)).toEqual(expect.arrayContaining([
      'GET /storage/my/assets',
      'GET /storage/my/assets/:id',
      'GET /storage/my/assets/:id/content',
      'POST /storage/my/assets',
      'PATCH /storage/my/assets/:id',
      'DELETE /storage/my/assets/:id',
      'GET /storage/my/folders',
    ]));
    expect(routes.every((route) => Array.isArray(route.preHandler) && route.preHandler.length === 2)).toBe(true);
    await app.close();
  });
});
