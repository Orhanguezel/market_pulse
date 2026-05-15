// =============================================================
// FILE: src/modules/audit/service.ts
// corporate-backend – Audit Service
//   - shouldSkipAuditLog()
//   - writeRequestAuditLog()
//   - sanitizeRequestBody()
//   - startRetentionJob()
// =============================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { createRequire } from 'node:module';
import { emitAppEvent } from '../../core/events';
import { env } from '../../core/env';
import {
  repoInsertRequestLog,
  repoDeleteOldRequestLogs,
  repoDeleteOldAuthEvents,
  repoDeleteOldAuditEvents,
} from './repository';

const require = createRequire(import.meta.url);
const geoip = require('geoip-lite') as {
  lookup(ip: string): { country?: string; city?: string; ll?: [number, number] } | null;
};

type HeaderCarrier = { headers: Record<string, unknown> };
type RequestWithUrl = FastifyRequest & {
  raw?: { url?: string };
  url?: string;
  auth?: { user?: unknown };
  requestContext?: { get?: (key: string) => unknown };
  auditError?: { message?: string; code?: string; stack?: string };
};
type ReplyWithStatus = FastifyReply & {
  raw?: { statusCode?: number };
};
type RequestUserRecord = Record<string, unknown>;
type SanitizableRecord = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/* -------------------- helper: headers -------------------- */
function firstHeader(req: FastifyRequest, name: string): string {
  const v = (req as HeaderCarrier).headers?.[name.toLowerCase()];
  if (Array.isArray(v)) return String(v[0] ?? '').trim();
  return String(v ?? '').trim();
}

function parseFirstIpFromXff(xff: string): string {
  return (
    xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)[0] || ''
  );
}

/* -------------------- shouldSkip -------------------- */
export function shouldSkipAuditLog(req: FastifyRequest): boolean {
  const method = String(req.method || '').toUpperCase();
  if (method === 'OPTIONS') return true;

  const rawUrl = String((req as RequestWithUrl).raw?.url ?? (req as RequestWithUrl).url ?? '');
  const path = (rawUrl.split('?')[0] || '/').trim();

  if (path === '/api/health' || path === '/health') return true;
  if (path.startsWith('/uploads/')) return true;
  if (path.startsWith('/api/admin/audit/stream')) return true;

  const excludeIps = Array.isArray((env as { AUDIT_EXCLUDE_IPS?: unknown }).AUDIT_EXCLUDE_IPS)
    ? ((env as { AUDIT_EXCLUDE_IPS?: unknown[] }).AUDIT_EXCLUDE_IPS ?? [])
    : [];
  if (excludeIps.length > 0) {
    const ip = normalizeClientIp(req);
    if (ip && excludeIps.includes(ip)) return true;
  }

  return false;
}

/* -------------------- normalize -------------------- */
function normalizeClientIp(req: FastifyRequest): string {
  const cf = firstHeader(req, 'cf-connecting-ip');
  if (cf) return cf;

  const xReal = firstHeader(req, 'x-real-ip');
  if (xReal) return xReal;

  const xff = firstHeader(req, 'x-forwarded-for');
  if (xff) {
    const ip = parseFirstIpFromXff(xff);
    if (ip) return ip;
  }

  const socket = req.socket as { remoteAddress?: string | null };
  return String(req.ip || socket?.remoteAddress || '').trim();
}

function normalizeUrlAndPath(req: FastifyRequest): { url: string; path: string } {
  const rawUrl = String((req as RequestWithUrl).raw?.url ?? (req as RequestWithUrl).url ?? '').trim() || '/';
  const path = rawUrl.split('?')[0] || '/';
  return { url: rawUrl, path };
}

function normalizeUserContext(req: FastifyRequest): { userId: string | null; isAdmin: number } {
  const request = req as RequestWithUrl & { user?: unknown };
  const userCandidate =
    request.user ??
    request.auth?.user ??
    request.requestContext?.get?.('user') ??
    null;

  const u: RequestUserRecord | null = isRecord(userCandidate) ? userCandidate : null;

  const userId = u?.id ? String(u.id) : null;

  let isAdmin = 0;
  if (u) {
    if (u.is_admin === true || u.is_admin === 1 || u.is_admin === '1') isAdmin = 1;
    const role = String(u.role ?? '');
    if (role === 'admin') isAdmin = 1;
    const roles = Array.isArray(u.roles) ? u.roles.map(String) : [];
    if (roles.includes('admin')) isAdmin = 1;
  }

  return { userId, isAdmin };
}

function normalizeUserAgent(req: FastifyRequest): string | null {
  const ua = firstHeader(req, 'user-agent');
  return ua ? ua : null;
}

function normalizeReferer(req: FastifyRequest): string | null {
  const ref = firstHeader(req, 'referer');
  return ref ? ref : null;
}

function normalizeGeo(req: FastifyRequest, ip: string): { country: string | null; city: string | null } {
  const cfCountry = firstHeader(req, 'cf-ipcountry') || null;
  const cfCity = firstHeader(req, 'x-geo-city') || null;
  if (cfCountry) return { country: cfCountry, city: cfCity };

  const isLocal =
    !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');

  if (!isLocal) {
    const geo = geoip.lookup(ip);
    if (geo) {
      return { country: geo.country || null, city: geo.city || null };
    }
  }

  if (isLocal) return { country: 'LOCAL', city: null };

  return { country: null, city: null };
}

/* -------------------- request body sanitization -------------------- */
const SENSITIVE_FIELDS = new Set([
  'password',
  'password_hash',
  'token',
  'secret',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'authorization',
  'credit_card',
  'cvv',
  'ssn',
  'pin',
  'current_password',
  'new_password',
  'confirm_password',
]);

const MAX_BODY_SIZE = 4096;

function stripSensitive(obj: SanitizableRecord): void {
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      obj[key] = '[REDACTED]';
    } else if (isRecord(obj[key])) {
      stripSensitive(obj[key]);
    }
  }
}

function sanitizeRequestBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;

  try {
    const cloned = JSON.parse(JSON.stringify(body));
    if (typeof cloned === 'object' && cloned !== null) {
      stripSensitive(cloned);
    }
    const json = JSON.stringify(cloned);
    if (json.length > MAX_BODY_SIZE) {
      return json.slice(0, MAX_BODY_SIZE) + '...[TRUNCATED]';
    }
    return json;
  } catch {
    return null;
  }
}

/* -------------------- writer -------------------- */
export async function writeRequestAuditLog(args: {
  req: FastifyRequest;
  reply: FastifyReply;
  reqId: string;
  responseTimeMs: number;
}) {
  const { req, reply } = args;

  const { url, path } = normalizeUrlAndPath(req);
  const ip = normalizeClientIp(req);
  const { userId, isAdmin } = normalizeUserContext(req);

  const statusCode =
    typeof reply.statusCode === 'number'
      ? reply.statusCode
      : Number((reply as ReplyWithStatus).raw?.statusCode ?? 0);

  const ua = normalizeUserAgent(req);
  const referer = normalizeReferer(req);
  const geo = normalizeGeo(req, ip);
  const method = String(req.method || '').toUpperCase();

  const auditError = (req as RequestWithUrl).auditError;

  let errorMessage: string | null = null;
  let errorCode: string | null = null;

  if (statusCode >= 400 && auditError) {
    errorMessage = auditError.message ? String(auditError.message).slice(0, 512) : null;
    errorCode = auditError.code ? String(auditError.code).slice(0, 64) : null;
  }

  let requestBody: string | null = null;
  const logBody = process.env.LOG_REQUEST_BODY === 'true';

  if (logBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    requestBody = sanitizeRequestBody(req.body);
  }

  await repoInsertRequestLog({
    req_id: String(args.reqId || ''),
    method,
    url,
    path,
    status_code: Number(statusCode || 0),
    response_time_ms: Math.max(0, Math.round(Number(args.responseTimeMs || 0))),
    ip,
    user_agent: ua,
    referer,
    user_id: userId,
    is_admin: isAdmin,
    country: geo.country,
    city: geo.city,
    error_message: errorMessage,
    error_code: errorCode,
    request_body: requestBody,
  });

  emitAppEvent({
    level: Number(statusCode) >= 500 ? 'error' : Number(statusCode) >= 400 ? 'warn' : 'info',
    topic: 'audit.request.logged',
    message: 'request_logged',
    meta: {
      method,
      path,
      status_code: Number(statusCode || 0),
      ip,
      response_time_ms: Math.max(0, Math.round(Number(args.responseTimeMs || 0))),
      user_id: userId,
      is_admin: isAdmin,
      error_message: errorMessage,
      error_code: errorCode,
    },
    entity: null,
  });
}

/* -------------------- retention job -------------------- */
export function startRetentionJob() {
  const RETENTION_REQUEST_DAYS = Number(process.env.AUDIT_RETENTION_REQUEST_LOGS_DAYS || 90);
  const RETENTION_AUTH_DAYS = Number(process.env.AUDIT_RETENTION_AUTH_EVENTS_DAYS || 180);
  const RETENTION_EVENTS_DAYS = Number(process.env.AUDIT_RETENTION_AUDIT_EVENTS_DAYS || 30);

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  async function runCleanup() {
    try {
      await repoDeleteOldRequestLogs(RETENTION_REQUEST_DAYS);
      await repoDeleteOldAuthEvents(RETENTION_AUTH_DAYS);
      await repoDeleteOldAuditEvents(RETENTION_EVENTS_DAYS);

      console.log(
        `[audit] Retention cleanup done — request_logs: ${RETENTION_REQUEST_DAYS}d, auth_events: ${RETENTION_AUTH_DAYS}d, audit_events: ${RETENTION_EVENTS_DAYS}d`,
      );
    } catch (err) {
      console.error('[audit] Retention cleanup failed:', err);
    }
  }

  setTimeout(runCleanup, 30_000);
  setInterval(runCleanup, ONE_DAY_MS);
}
