#!/usr/bin/env bash
# market_pulse — gzltek deploy/update script
# Kullanim: bash /var/www/market_pulse/deploy/gzltek/deploy.sh
set -euo pipefail

ROOT="${DEPLOY_ROOT:-/var/www/market_pulse}"
BRANCH="${DEPLOY_BRANCH:-feat/tenant-config-core}"
ECO="$ROOT/deploy/gzltek"

echo "==> [1/7] git pull ($BRANCH)"
cd "$ROOT"
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> [2/7] backend build"
cd "$ROOT/backend" && bun install && bun run build

echo "==> [3/7] frontend build"
cd "$ROOT/frontend" && bun install && bun run build

echo "==> [4/7] admin build"
cd "$ROOT/admin_panel" && bun install && bun run build

echo "==> [5/7] db seed (idempotent, no-drop)"
cd "$ROOT/backend"
if [ ! -e .env ] && [ -f .env.production ]; then
  ln -s .env.production .env
fi
set -a
# shellcheck disable=SC1091
[ -f .env.production ] && . ./.env.production
set +a
bun run src/db/seed/index.ts --no-drop

echo "==> [6/7] tenant scope guard"
cd "$ROOT/backend" && bun run tenant:guard

echo "==> [7/7] pm2 reload"
pm2 reload "$ECO/backend.ecosystem.config.cjs"  || pm2 start "$ECO/backend.ecosystem.config.cjs"
pm2 reload "$ECO/frontend.ecosystem.config.cjs" || pm2 start "$ECO/frontend.ecosystem.config.cjs"
pm2 reload "$ECO/admin.ecosystem.config.cjs"    || pm2 start "$ECO/admin.ecosystem.config.cjs"
pm2 save

echo ""
echo "Deploy tamam"
pm2 list | grep market-pulse-gzltek || true
