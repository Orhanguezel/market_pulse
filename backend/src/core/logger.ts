import type { FastifyServerOptions } from 'fastify';

const isDev = process.env.NODE_ENV !== 'production';

export const loggerConfig: FastifyServerOptions['logger'] = {
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
      }
    : {
        formatters: {
          level(label: string) {
            return { level: label };
          },
          bindings() {
            return {};
          },
        },
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
      }),
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        host: req.headers?.host,
        ip: req.ip,
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
};
