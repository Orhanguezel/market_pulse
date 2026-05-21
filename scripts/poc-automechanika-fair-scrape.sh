#!/usr/bin/env bash
# =============================================================================
# poc-automechanika-fair-scrape.sh
#
# Automechanika Frankfurt 2026 exhibitor liste + detail sayfasinin
# scraper-service uzerinden gerceklikten ne kadar veri cektigini olcer.
#
# Kullanim:
#   bash scripts/poc-automechanika-fair-scrape.sh
#
# Cikti:
#   1) Resmi exhibitor-search liste sayfasinin stealthy mod ile cekilmesi
#   2) Liste sayfasinin extractor'un tanimladigi exhibitors[] arrayi
#   3) Avrasya detail sayfasinin (referans) cekilmesi
#   4) Iki yanit /tmp/automechanika_*.json icine kaydedilir
# =============================================================================

set -euo pipefail

SCRAPER_URL="${SCRAPER_SERVICE_URL:-http://localhost:8200}"
SCRAPER_KEY="${SCRAPER_SERVICE_API_KEY:-}"

EXHIBITOR_LIST_URL="https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.html"
EXHIBITOR_DETAIL_URL="https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html/avrasya-paspas-otomotiv-sanayi-ve-ticaret-limited-sirketi.html"

LIST_OUT="/tmp/automechanika_list_$(date +%s).json"
DETAIL_OUT="/tmp/automechanika_detail_$(date +%s).json"

auth_header=()
if [[ -n "${SCRAPER_KEY}" ]]; then
  auth_header=(-H "authorization: Bearer ${SCRAPER_KEY}")
fi

echo "==> Scraper-service URL: ${SCRAPER_URL}"
echo "==> Scraper-service auth: $([[ -n "${SCRAPER_KEY}" ]] && echo 'enabled' || echo 'anonymous')"
echo

# ------- 1) Health check ------------------------------------------------------
echo "==> [1/3] Saglik kontrolu"
if ! curl -s --max-time 5 "${auth_header[@]}" "${SCRAPER_URL}/health" >/dev/null; then
  echo "  HATA: scraper-service erisilmez. Docker compose ayakta mi?"
  echo "    cd /home/orhan/Documents/Projeler/scraper-service && docker compose up -d"
  exit 1
fi
echo "  OK"
echo

# ------- 2) Exhibitor liste sayfasi -------------------------------------------
echo "==> [2/3] Liste sayfasini stealthy mod ile cekiyorum (Playwright)"
echo "  URL: ${EXHIBITOR_LIST_URL}"
echo "  Cikti: ${LIST_OUT}"

curl -s -X POST "${SCRAPER_URL}/api/v1/scrape" \
  -H 'content-type: application/json' \
  -H 'cache-control: no-cache' \
  "${auth_header[@]}" \
  -d @- <<EOF > "${LIST_OUT}"
{
  "url": "${EXHIBITOR_LIST_URL}",
  "mode": "stealthy",
  "profile": "fair-exhibitor",
  "return_html": true,
  "return_text": true,
  "options": {
    "wait_for": ".exhibitor-card, [class*='exhibitor'], [class*='result'], article",
    "timeout": 30
  }
}
EOF

EXHIBITOR_COUNT=$(jq -r '.data.count // 0' "${LIST_OUT}" 2>/dev/null || echo 0)
SUCCESS=$(jq -r '.success' "${LIST_OUT}" 2>/dev/null || echo "?")
HTML_LEN=$(jq -r '.html | length' "${LIST_OUT}" 2>/dev/null || echo 0)
echo "  success=${SUCCESS}  extracted_exhibitors=${EXHIBITOR_COUNT}  html_chars=${HTML_LEN}"
if [[ "${EXHIBITOR_COUNT}" -lt 5 ]]; then
  echo "  UYARI: Beklenenden az aday cikti. Olasi sebepler:"
  echo "    - DOM yapisi generic selector setine uymuyor (Sprint 0 -> 5.1)"
  echo "    - JS render tamamlanmadan HTML yakalandi (wait_ms artir)"
  echo "    - Internal XHR endpointi var, dogru veri orada"
fi
echo

# ------- 3) Avrasya detail sayfasi --------------------------------------------
echo "==> [3/3] Avrasya detail sayfasini cekiyorum (referans)"
echo "  URL: ${EXHIBITOR_DETAIL_URL}"
echo "  Cikti: ${DETAIL_OUT}"

curl -s -X POST "${SCRAPER_URL}/api/v1/scrape" \
  -H 'content-type: application/json' \
  -H 'cache-control: no-cache' \
  "${auth_header[@]}" \
  -d @- <<EOF > "${DETAIL_OUT}"
{
  "url": "${EXHIBITOR_DETAIL_URL}",
  "mode": "stealthy",
  "profile": "fair-exhibitor-detail",
  "return_html": true,
  "return_text": true,
  "options": {
    "wait_for": "main, .exhibitor-detail, [class*='detail'], h1",
    "timeout": 30
  }
}
EOF

TITLE=$(jq -r '.data.name // empty' "${DETAIL_OUT}" 2>/dev/null || echo "")
EMAILS=$(jq -r '.data.email // empty' "${DETAIL_OUT}" 2>/dev/null || echo "")
PHONES=$(jq -r '.data.phone // empty' "${DETAIL_OUT}" 2>/dev/null || echo "")
BOOTH=$(jq -r '.data.booth // empty' "${DETAIL_OUT}" 2>/dev/null || echo "")
PRODUCT_GROUPS=$(jq -r '(.data.product_groups // []) | join(", ")' "${DETAIL_OUT}" 2>/dev/null || echo "")
DETAIL_HTML_LEN=$(jq -r '.html | length' "${DETAIL_OUT}" 2>/dev/null || echo 0)
echo "  name='${TITLE}'"
echo "  email='${EMAILS}'"
echo "  phone='${PHONES}'"
echo "  booth='${BOOTH}'"
echo "  product_groups='${PRODUCT_GROUPS}'"
echo "  html_chars=${DETAIL_HTML_LEN}"
echo

echo "==> Tamamlandi"
echo "    Liste:  ${LIST_OUT}"
echo "    Detail: ${DETAIL_OUT}"
echo
echo "Sonraki adim:"
echo "  - jq '.data.exhibitors[:5]' ${LIST_OUT} ile ilk 5 adayi gor"
echo "  - HTML cikti dosyalarini inceleyip Messe Frankfurt'un gercek selector"
echo "    yapisini cikar -> docs/teknik/FAIR_MODULU_CEKLISTI.md Sprint 0"
echo "  - Backend uzerinden tetiklemek istiyorsan:"
echo "      curl -X POST http://localhost:3000/api/v1/admin/lead-machine/fair/jobs \\"
echo "        -H 'content-type: application/json' -H 'authorization: Bearer <token>' \\"
echo "        -d '{\"fair_name\":\"Automechanika Frankfurt 2026\",\"fair_url\":\"${EXHIBITOR_LIST_URL}\",\"fair_date\":\"2026-09-08\",\"icp_id\":\"<icp-uuid>\"}'"
