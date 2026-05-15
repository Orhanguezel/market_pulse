#!/usr/bin/env bash
set -euo pipefail

BUN="$(command -v bun 2>/dev/null || echo '/root/.bun/bin/bun')"
MANIFEST=".next/prerender-manifest.json"
PORT="${PORT:-3078}"
HOST="${HOST:-127.0.0.1}"

if [[ ! -f "$MANIFEST" ]]; then
  echo "[pm2-start] Missing $MANIFEST, running production build..."
  "$BUN" run build
fi

echo "[pm2-start] Starting Next.js on ${HOST}:${PORT}"
exec "$BUN" run start -- -p "$PORT" -H "$HOST"
