// src/seo/serverBase.ts
import type { GetServerSidePropsContext } from 'next';

function firstHeader(v: unknown): string {
  return String(v || '')
    .split(',')[0]
    .trim();
}

function isLocalHost(host: string): boolean {
  const h = String(host || '').toLowerCase();
  return h.startsWith('localhost') || h.startsWith('127.0.0.1');
}

export function getRequestBaseUrl(ctx: GetServerSidePropsContext): string {
  const req = ctx.req;

  const xfProto = firstHeader(req.headers['x-forwarded-proto']);
  const xfHost = firstHeader(req.headers['x-forwarded-host']);
  const host = xfHost || firstHeader(req.headers.host);

  let proto = xfProto || 'http';
  if (isLocalHost(host)) proto = 'http'; // ✅ local her zaman http

  return `${proto}://${host}`.replace(/\/+$/, '');
}
