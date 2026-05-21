#!/usr/bin/env bash
# =============================================================================
# automechanika-rate-limit-check.sh
#
# Messe Frankfurt scraper kalibrasyonunu anti-bot/rate-limit acisindan dener.
# Varsayilan olarak 100 ardil stealthy scrape istegi atar; her istek arasinda
# 2-5 sn bekler ve user-agent rotasyonu uygular.
#
# Kullanim:
#   set -a; . backend/.env; set +a
#   bash scripts/automechanika-rate-limit-check.sh
#
# Opsiyonel:
#   LIMIT=20 MIN_DELAY=1 MAX_DELAY=2 bash scripts/automechanika-rate-limit-check.sh
# =============================================================================

set -euo pipefail

SCRAPER_URL="${SCRAPER_SERVICE_URL:-http://localhost:8200}"
SCRAPER_KEY="${SCRAPER_SERVICE_API_KEY:-}"
LIMIT="${LIMIT:-100}"
MIN_DELAY="${MIN_DELAY:-2}"
MAX_DELAY="${MAX_DELAY:-5}"

EXHIBITOR_LIST_URL="https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.html"
AVRASYA_DETAIL_URL="https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html/avrasya-paspas-otomotiv-sanayi-ve-ticaret-limited-sirketi.html"

RUN_ID="$(date +%s)"
OUT_DIR="/tmp/automechanika_rate_limit_${RUN_ID}"
LIST_OUT="${OUT_DIR}/seed-list.json"
SUMMARY_OUT="${OUT_DIR}/summary.tsv"

USER_AGENTS=(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15"
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0"
)

mkdir -p "${OUT_DIR}"

auth_header=()
if [[ -n "${SCRAPER_KEY}" ]]; then
  auth_header=(-H "authorization: Bearer ${SCRAPER_KEY}")
fi

post_scrape() {
  local url="$1"
  local profile="$2"
  local ua="$3"
  local output="$4"

  jq -n \
    --arg url "${url}" \
    --arg profile "${profile}" \
    --arg ua "${ua}" \
    '{
      url: $url,
      mode: "stealthy",
      profile: $profile,
      return_html: false,
      return_text: true,
      options: {
        wait_for: "main, [class*=exhibitor], [class*=detail], h1",
        timeout: 30,
        user_agent: $ua
      }
    }' | curl -sS -X POST "${SCRAPER_URL}/api/v1/scrape" \
      -H 'content-type: application/json' \
      -H 'cache-control: no-cache' \
      "${auth_header[@]}" \
      -d @- > "${output}"
}

echo "==> Scraper-service URL: ${SCRAPER_URL}"
echo "==> Auth: $([[ -n "${SCRAPER_KEY}" ]] && echo enabled || echo anonymous)"
echo "==> Limit: ${LIMIT} request, delay: ${MIN_DELAY}-${MAX_DELAY}s"
echo "==> Output: ${OUT_DIR}"
echo

echo "==> Health"
curl -sS --max-time 10 "${auth_header[@]}" "${SCRAPER_URL}/health" | jq -c .
echo

echo "==> Seed liste cekiliyor"
post_scrape "${EXHIBITOR_LIST_URL}" "fair-exhibitor" "${USER_AGENTS[0]}" "${LIST_OUT}"

seed_success="$(jq -r '.success // false' "${LIST_OUT}")"
seed_count="$(jq -r '.data.count // 0' "${LIST_OUT}")"
echo "  success=${seed_success} count=${seed_count}"
echo

mapfile -t DETAIL_URLS < <(
  jq -r '.data.exhibitors[]?.detail_url // empty' "${LIST_OUT}" | awk '!seen[$0]++'
)

if [[ "${#DETAIL_URLS[@]}" -eq 0 ]]; then
  DETAIL_URLS=("${AVRASYA_DETAIL_URL}")
fi

printf "idx\tprofile\tsuccess\tstatus_code\tduration_ms\tcaptcha_or_block\tcache_hit\turl\n" > "${SUMMARY_OUT}"

ok=0
failed=0
blocked=0
rate_limited=0

for ((i = 1; i <= LIMIT; i++)); do
  ua="${USER_AGENTS[$(((i - 1) % ${#USER_AGENTS[@]}))]}"

  if (( i % 10 == 1 )); then
    profile="fair-exhibitor"
    url="${EXHIBITOR_LIST_URL}"
  else
    profile="fair-exhibitor-detail"
    url="${DETAIL_URLS[$(((i - 1) % ${#DETAIL_URLS[@]}))]}"
  fi

  out="${OUT_DIR}/request-${i}.json"
  if post_scrape "${url}" "${profile}" "${ua}" "${out}"; then
    success="$(jq -r '.success // false' "${out}")"
    status_code="$(jq -r '.status_code // empty' "${out}")"
    duration_ms="$(jq -r '.duration_ms // 0' "${out}")"
    cache_hit="$(jq -r '.cache_hit // false' "${out}")"
    text_probe="$(jq -r '((.error // "") + " " + (.text // ""))[0:2000] | ascii_downcase' "${out}")"
    block_flag="false"

    if [[ "${status_code}" == "403" || "${status_code}" == "429" ]]; then
      block_flag="true"
    fi
    if grep -Eiq 'captcha|rate limit|too many requests|access denied|forbidden|blocked' <<<"${text_probe}"; then
      block_flag="true"
    fi

    if [[ "${success}" == "true" ]]; then
      ok=$((ok + 1))
    else
      failed=$((failed + 1))
    fi
    if [[ "${status_code}" == "429" ]]; then
      rate_limited=$((rate_limited + 1))
    fi
    if [[ "${block_flag}" == "true" ]]; then
      blocked=$((blocked + 1))
    fi

    printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
      "${i}" "${profile}" "${success}" "${status_code}" "${duration_ms}" "${block_flag}" "${cache_hit}" "${url}" >> "${SUMMARY_OUT}"
    printf "[%03d/%03d] success=%s status=%s duration=%sms block=%s profile=%s\n" \
      "${i}" "${LIMIT}" "${success}" "${status_code:-null}" "${duration_ms}" "${block_flag}" "${profile}"
  else
    failed=$((failed + 1))
    printf "%s\t%s\tfalse\t\t0\ttrue\tfalse\t%s\n" "${i}" "${profile}" "${url}" >> "${SUMMARY_OUT}"
    printf "[%03d/%03d] curl failed profile=%s\n" "${i}" "${LIMIT}" "${profile}"
  fi

  if (( i < LIMIT )); then
    sleep_for=$((MIN_DELAY + RANDOM % (MAX_DELAY - MIN_DELAY + 1)))
    sleep "${sleep_for}"
  fi
done

echo
echo "==> Ozet"
echo "  ok=${ok}"
echo "  failed=${failed}"
echo "  blocked_or_captcha=${blocked}"
echo "  rate_limited_429=${rate_limited}"
echo "  summary=${SUMMARY_OUT}"

if (( blocked > 0 || rate_limited > 0 )); then
  exit 2
fi
