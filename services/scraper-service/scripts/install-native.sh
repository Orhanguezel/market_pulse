#!/usr/bin/env bash
# Native (Docker-less) install for scraper-service on a Debian/Ubuntu VPS.
# Run from the scraper-service directory as root (or with sudo).
set -euo pipefail

SERVICE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SERVICE_DIR"

echo "[1/6] System packages (redis, python venv, build deps)"
apt-get update
apt-get install -y --no-install-recommends \
  redis-server \
  python3-venv \
  python3-pip \
  python3-dev \
  build-essential \
  ca-certificates \
  curl

echo "[2/6] Ensure redis is running and enabled"
systemctl enable --now redis-server

echo "[3/6] Python virtualenv"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[4/6] Playwright Chromium + OS deps"
playwright install --with-deps chromium

echo "[5/6] .env"
if [[ ! -f .env ]]; then
  cp .env.example .env
  # Make redis local + production-friendly defaults
  sed -i 's|^REDIS_URL=.*|REDIS_URL=redis://127.0.0.1:6379/0|' .env
  sed -i 's|^APP_ENV=.*|APP_ENV=production|' .env
  sed -i 's|^API_HOST=.*|API_HOST=127.0.0.1|' .env
  echo
  echo "WARNING: .env created from example. Edit and rotate API_KEYS before going live."
fi

echo "[6/6] Done. Start with PM2:"
echo "  pm2 start ecosystem.config.cjs"
