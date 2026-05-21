import fp from 'fastify-plugin';
import mysql from '@fastify/mysql';
import net from 'node:net';
import { env } from '@/core/env';

type MysqlHealthRow = { ok: number };

function isTcpPortReachable(host: string, port: number, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    const finish = (ok: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

export default fp(async (app) => {
  const connectionString =
    `mysql://${encodeURIComponent(env.DB.user)}:${encodeURIComponent(env.DB.password)}@` +
    `${env.DB.host}:${env.DB.port}/${env.DB.name}?timezone=Z&charset=utf8mb4_unicode_ci`;

  const reachable = await isTcpPortReachable(env.DB.host, env.DB.port);
  if (!reachable) {
    app.log.warn(
      {
        host: env.DB.host,
        port: env.DB.port,
        database: env.DB.name,
      },
      'MySQL port is not reachable, skipping database plugin initialization',
    );
    return;
  }

  try {
    await app.register(mysql, {
      promise: true,
      connectionString,
    });

    if (!app.mysql) {
      app.log.error('MySQL plugin did not initialize');
      throw new Error('MySQL not initialized');
    }

    const db = app.mysql;
    app.decorate('db', db);

    const [rows] = await db.query<MysqlHealthRow[]>('SELECT 1 AS ok');
    app.log.info({ mysqlOk: rows?.[0]?.ok === 1 }, 'MySQL connected');
  } catch (error) {
    app.log.warn(
      {
        error,
        host: env.DB.host,
        port: env.DB.port,
        database: env.DB.name,
      },
      'MySQL unavailable, continuing without database connection',
    );
  }
});
