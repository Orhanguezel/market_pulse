// src/modules/_shared/http.ts
// Tüm route handler'larında ortak kullanılan yardımcılar
import type { FastifyReply, FastifyRequest } from "fastify";
import { captureServerException } from "../../plugins/sentry";

type RequestLoggerLike = {
  error: (payload: unknown, msg?: string) => void;
};

type RequestWithLogger = FastifyRequest & {
  log: RequestLoggerLike;
};

type ZodErrorLike = {
  name?: string;
  issues?: unknown;
  message?: string;
};

// ── Auth ─────────────────────────────────────────────────────────────────────

function readRequestUserId(user: unknown): string {
  if (typeof user !== "object" || user === null || Array.isArray(user)) {
    throw new Error("unauthorized");
  }
  const record = user as Record<string, unknown>;
  const sub = record.sub ?? record.id ?? null;
  if (!sub) throw new Error("unauthorized");
  return String(sub);
}

/** JWT'den user id çıkarır, bulamazsa "unauthorized" fırlatır */
export function getAuthUserId(req: FastifyRequest): string {
  return readRequestUserId((req as FastifyRequest & { user?: unknown }).user);
}

// ── Pagination ───────────────────────────────────────────────────────────────

export function parsePage(query: Record<string, string>, opts?: { maxLimit?: number }) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10));
  const limit = Math.min(opts?.maxLimit ?? 100, Math.max(1, parseInt(query.limit ?? "20", 10)));
  return { page, limit, offset: (page - 1) * limit };
}

// ── Error Responses ──────────────────────────────────────────────────────────

export function sendValidationError(reply: FastifyReply, issues: unknown) {
  return reply.code(400).send({ error: { message: "validation_error", details: issues } });
}

export function sendUnauthorized(reply: FastifyReply) {
  return reply.code(401).send({ error: { message: "unauthorized" } });
}

export function sendForbidden(reply: FastifyReply) {
  return reply.code(403).send({ error: { message: "forbidden" } });
}

export function sendNotFound(reply: FastifyReply) {
  return reply.code(404).send({ error: { message: "not_found" } });
}

export function sendServerError(reply: FastifyReply, req: RequestWithLogger, err: unknown, code: string) {
  captureServerException(err, { code });
  req.log.error({ err, code }, 'Route error');
  return reply.code(500).send({ error: { message: code } });
}

// ── Unified handler wrapper ───────────────────────────────────────────────────

/** ZodError, unauthorized ve genel 500 hatalarını standart şekilde yakalar */
export function handleRouteError(
  reply: FastifyReply,
  req: FastifyRequest,
  err: unknown,
  serverCode: string,
) {
  if (reply.sent) return reply;
  const typedErr = (typeof err === "object" && err !== null ? err : null) as ZodErrorLike | null;
  if (typedErr?.name === "ZodError") return sendValidationError(reply, typedErr.issues);
  if (typedErr?.message === "unauthorized") return sendUnauthorized(reply);
  return sendServerError(reply, req as RequestWithLogger, err, serverCode);
}
