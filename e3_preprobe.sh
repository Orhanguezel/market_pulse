#!/usr/bin/env bash
set -euo pipefail

ADMIN_BASE_URL="${ADMIN_BASE_URL:-http://localhost:3096}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8086}"

probe() {
  local label="$1"
  local url="$2"
  local method="${3:-GET}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
  printf "%s" "$code"
}

check() {
  local label="$1"
  local expected="$2"
  local url="$3"
  local method="${4:-GET}"
  local got
  got=$(probe "$label" "$url" "$method")
  if [[ "$got" == "$expected" ]]; then
    printf "%-55s %s (ok)\n" "$label" "$got"
  else
    printf "%-55s %s (expected %s)\n" "$label" "$got" "$expected"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

echo "== E3 Preprobe =="
echo "ADMIN_BASE_URL=$ADMIN_BASE_URL"
echo "API_BASE_URL=$API_BASE_URL"
echo
FAIL_COUNT=0

echo "-- Core Health --"
check "backend /api/health" "200" "$API_BASE_URL/api/health"
check "backend /api/v1/public/brand-config" "200" "$API_BASE_URL/api/v1/public/brand-config"
check "admin /auth/login" "200" "$ADMIN_BASE_URL/auth/login"
echo

echo "-- Kept Routes (expect 200) --"
for p in notifications users user-roles site-settings storage audit cache db profile external-db market market/targets market/leads market/signals market/reports; do
  check "/admin/$p" "200" "$ADMIN_BASE_URL/admin/$p"
done
echo

echo "-- Removed Routes (expect 404) --"
for p in availability banners campaigns chat email-templates home-layout llm-prompts orders reports reviews subscription-plans subscriptions telegram wallet announcements; do
  check "/admin/$p" "404" "$ADMIN_BASE_URL/admin/$p"
done
echo

echo "-- Lead Machine Routes (expect 200) --"
for p in candidates amazon b2b icp; do
  check "/admin/market/lead-machine/$p" "200" "$ADMIN_BASE_URL/admin/market/lead-machine/$p"
done
echo

echo "-- Admin Market API (expect 401 without auth) --"
check "/api/v1/admin/market/external/paspas/customers" "401" "$API_BASE_URL/api/v1/admin/market/external/paspas/customers?limit=1"
check "/api/v1/admin/market/reports/weekly/preview" "401" "$API_BASE_URL/api/v1/admin/market/reports/weekly/preview"
check "/api/v1/admin/market/targets/:id/recalculate-churn" "401" "$API_BASE_URL/api/v1/admin/market/targets/00000000-0000-0000-0000-000000000000/recalculate-churn" "POST"
echo

if [[ "$FAIL_COUNT" -eq 0 ]]; then
  echo "E3 preprobe result: PASS"
else
  echo "E3 preprobe result: FAIL ($FAIL_COUNT mismatch)"
  exit 1
fi
