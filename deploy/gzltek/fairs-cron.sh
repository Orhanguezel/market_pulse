#!/usr/bin/env bash
# Fuar kataloğu otomatik tazeleme (gzltek / VPS cron).
#
# NEDEN: fuarlar her yıl yenilenir — bir edisyon bitince site yeni tarihi yayınlar.
# Tarih çıkarıcı yalnızca GELECEK tarihleri kabul ettiği için, fuarı yeniden ziyaret
# etmek yeni edisyonu otomatik yakalar. Elle bakmaya gerek yok.
#
# İki mod:
#   haftalik → sitesi BİLİNEN fuarlar. Doğrudan fuarın kendi sitesine gidilir:
#              arama motoru yok, bloke riski yok, maliyet yok.
#   aylik    → sitesi HÂLÂ bilinmeyen fuarlar. Arama motoru gerekir; tempo düşük
#              tutulur (SEARCH_MIN_GAP_MS), çünkü hızlı sorguda DDG/Brave IP'yi kesiyor.
#
# Kurulum (crontab -e):
#   15 4 * * 1 /var/www/market_pulse/deploy/gzltek/fairs-cron.sh haftalik
#   0  5 1 * * /var/www/market_pulse/deploy/gzltek/fairs-cron.sh aylik
set -euo pipefail

APP_DIR=/var/www/market_pulse/backend
LOG=/var/log/market-pulse-fairs.log
BUN=$(command -v bun || echo /root/.bun/bin/bun)
MODE="${1:-haftalik}"

cd "$APP_DIR"

{
  echo "===== $(date '+%F %T') — fuar tazeleme: $MODE ====="

  if [ "$MODE" = "haftalik" ]; then
    # Sitesi bilinen, tarihi geçmiş/bilinmeyen fuarlar → yeni edisyon tarihi + katılımcı sayfası
    "$BUN" src/scripts/refresh-fairs.ts \
      --recheck --with-website --no-search \
      --recheck-days 7 --limit 1500 --concurrency 4
  else
    # Sitesi hâlâ bulunamamış fuarlar → alan adı tahmini + yavaş tempolu arama motoru
    SEARCH_MIN_GAP_MS=7000 "$BUN" src/scripts/refresh-fairs.ts \
      --recheck --recheck-days 30 --limit 400 --concurrency 2
  fi

  echo "===== $(date '+%F %T') — bitti ====="
} >> "$LOG" 2>&1
