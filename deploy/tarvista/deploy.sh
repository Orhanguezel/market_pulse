#!/usr/bin/env bash
# market_pulse — tarvista deploy/update script (vps-vistainsaat)
# Kullanım: bash /var/www/market_pulse/deploy/tarvista/deploy.sh
set -euo pipefail

ROOT=/var/www/market_pulse
BRANCH="${DEPLOY_BRANCH:-feat/tenant-config-core}"
ECO="$ROOT/deploy/tarvista"

echo "==> [1/6] git pull ($BRANCH)"
cd "$ROOT"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> [2/6] backend build"
cd "$ROOT/backend" && bun install && bun run build

echo "==> [3/6] frontend build"
cd "$ROOT/frontend" && bun install && bun run build

echo "==> [4/6] admin build"
cd "$ROOT/admin_panel" && bun install && bun run build

echo "==> [5/6] db migrate (idempotent, additive)"
cd "$ROOT/backend" && bun run db:migrate || true

echo "==> [6/6] pm2 reload"
pm2 reload "$ECO/backend.ecosystem.config.cjs"  || pm2 start "$ECO/backend.ecosystem.config.cjs"
pm2 reload "$ECO/frontend.ecosystem.config.cjs" || pm2 start "$ECO/frontend.ecosystem.config.cjs"
pm2 reload "$ECO/admin.ecosystem.config.cjs"    || pm2 start "$ECO/admin.ecosystem.config.cjs"
pm2 save

echo ""
echo "✓ Deploy tamam"
pm2 list | grep market-pulse || true
