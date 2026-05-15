// src/core/error.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { captureServerException } from '../plugins/sentry';

type FastifyErrorLike = {
  statusCode?: number;
  status?: number;
  validation?: unknown;
  errors?: unknown;
  code?: string;
  message?: string;
  stack?: string;
};

type ErrorPayload = {
  error: {
    code: string;
    message: string;
    path?: string;
    details?: unknown;
    stack?: string;
  };
};

export function registerErrorHandlers(app: FastifyInstance) {
  // 404
  app.setNotFoundHandler((req: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: 'Not Found', path: req.url },
    });
  });

  // Genel hata yakalayıcı
  app.setErrorHandler((err: FastifyErrorLike, req: FastifyRequest, reply: FastifyReply) => {
    const status = err?.statusCode ?? err?.status ?? (err?.validation ? 400 : 500);

    const payload: ErrorPayload = {
      error: {
        code: err?.validation
          ? 'VALIDATION_ERROR'
          : err?.code ?? (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
        message: err?.message ?? 'Server Error',
      },
    };

    if (err?.validation) payload.error.details = err.validation;
    if (err?.errors) payload.error.details = err.errors;

    if (process.env.NODE_ENV !== 'production' && err?.stack) {
      payload.error.stack = err.stack;
    }

    captureServerException(err, { status, path: req.url });
    req.log?.error?.({ err, status, path: req.url }, 'request_failed');
    reply.code(status).send(payload);
  });
}
