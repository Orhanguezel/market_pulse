import { describe, expect, mock, test } from 'bun:test';
import Fastify, { type RouteOptions } from 'fastify';
import { createDbMock } from '../../market/__tests__/helpers/mock-db';

const dbMock = createDbMock();

mock.module('@/db/client', () => ({
  db: dbMock.db,
  pool: dbMock.pool,
}));

mock.module('@/core/env', () => ({ env: { TENANT_KEY: 'tenant-a' } }));

const { registerLeadMachineUser, registerOutreachUser, registerLeadMachineAdmin } =
  await import('../router');

async function collectRoutes(register: (app: never) => Promise<void>) {
  const app = Fastify();
  const routes: RouteOptions[] = [];
  app.addHook('onRoute', (route) => { routes.push(route); });
  await app.register(register as never);
  await app.ready();
  await app.close();
  return routes;
}

/**
 * Owner-scope, route kaydindaki `config.leadMachineScope` bayragindan okunuyor
 * (controller.ts: isUserRoute). Bayragi unutulan bir KULLANICI route'u sessizce
 * admin/tenant-geneli scope'a duser: owner filtresi kalkar (kullanici baskasinin
 * verisini gorur) ve gunluk kota tuketilmez. Bu test o hatayi kayit aninda yakalar.
 */
describe('lead machine route scope flags', () => {
  test('every lead-machine user route is registered with leadMachineScope=user', async () => {
    const routes = await collectRoutes(registerLeadMachineUser);

    expect(routes.length).toBeGreaterThan(0);
    const unscoped = routes
      .filter((route) => route.config?.leadMachineScope !== 'user')
      .map((route) => `${route.method} ${route.url}`);

    expect(unscoped).toEqual([]);
  });

  test('every outreach user route is registered with leadMachineScope=user', async () => {
    const routes = await collectRoutes(registerOutreachUser);

    expect(routes.length).toBeGreaterThan(0);
    const unscoped = routes
      .filter((route) => route.config?.leadMachineScope !== 'user')
      .map((route) => `${route.method} ${route.url}`);

    expect(unscoped).toEqual([]);
  });

  test('admin routes are not marked as user scope', async () => {
    const routes = await collectRoutes(registerLeadMachineAdmin);

    const userScoped = routes
      .filter((route) => route.config?.leadMachineScope === 'user')
      .map((route) => `${route.method} ${route.url}`);

    expect(userScoped).toEqual([]);
  });
});
