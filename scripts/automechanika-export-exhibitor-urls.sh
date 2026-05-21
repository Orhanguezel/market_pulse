#!/usr/bin/env bash
# =============================================================================
# automechanika-export-exhibitor-urls.sh
#
# Messe Frankfurt public exhibitor API uzerinden Automechanika Frankfurt 2026
# exhibitor detail URL listesini cikarir. Varsayilan hall filtresi Avrasya ICP
# icin 3.0, 3.1 ve 4.0'dur. Kapsam karari degisirse HALLS env'i ile override
# edilebilir.
#
# Kullanim:
#   bash scripts/automechanika-export-exhibitor-urls.sh
#   HALLS=3.0,3.1,4.0,8.0 bash scripts/automechanika-export-exhibitor-urls.sh
#   HALLS=all bash scripts/automechanika-export-exhibitor-urls.sh
#
# Cikti:
#   /tmp/automechanika_exhibitors_<timestamp>/exhibitors.jsonl
#   /tmp/automechanika_exhibitors_<timestamp>/detail-urls.txt
#   /tmp/automechanika_exhibitors_<timestamp>/summary.tsv
# =============================================================================

set -euo pipefail

API_BASE="${MESSE_API_BASE:-https://api.messefrankfurt.com/service/esb_api}"
API_KEY="${MESSE_API_KEY:-LXnMWcYQhipLAS7rImEzmZ3CkrU033FMha9cwVSngG4vbufTsAOCQQ==}"
EVENT_ID="${MESSE_EVENT_ID:-AUTOMECHANIKA}"
LANGUAGE="${MESSE_LANGUAGE:-en-GB}"
PAGE_SIZE="${PAGE_SIZE:-100}"
MAX_PAGES="${MAX_PAGES:-120}"
DELAY="${DELAY:-0.4}"
HALLS="${HALLS:-3.0,3.1,4.0}"

RUN_ID="$(date +%s)"
OUT_DIR="${OUT_DIR:-/tmp/automechanika_exhibitors_${RUN_ID}}"
JSONL_OUT="${OUT_DIR}/exhibitors.jsonl"
URLS_OUT="${OUT_DIR}/detail-urls.txt"
SUMMARY_OUT="${OUT_DIR}/summary.tsv"
RAW_DIR="${OUT_DIR}/raw"

mkdir -p "${RAW_DIR}"
: > "${JSONL_OUT}"
: > "${URLS_OUT}"
printf "scope\ttotal\tpages\twritten\n" > "${SUMMARY_OUT}"

api_url="${API_BASE}/exhibitor-service/api/2.1/public/exhibitor/search"
detail_base="https://automechanika.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html"

urlencode() {
  jq -nr --arg value "$1" '$value|@uri'
}

fetch_page() {
  local scope="$1"
  local page="$2"
  local raw="$3"
  local location_param=()

  if [[ "${scope}" != "all" ]]; then
    location_param+=("--data-urlencode" "location=${scope}")
  fi

  curl -sS -G "${api_url}" \
    -H "apikey: ${API_KEY}" \
    --data-urlencode "language=${LANGUAGE}" \
    --data-urlencode "q=" \
    --data-urlencode "orderBy=name" \
    --data-urlencode "pageNumber=${page}" \
    --data-urlencode "pageSize=${PAGE_SIZE}" \
    --data-urlencode "orSearchFallback=false" \
    --data-urlencode "showJumpLabels=false" \
    --data-urlencode "findEventVariable=${EVENT_ID}" \
    "${location_param[@]}" \
    -o "${raw}"
}

extract_hits() {
  local scope="$1"
  local raw="$2"

  jq -c --arg scope "${scope}" --arg detail_base "${detail_base}" '
    .result.hits[]? as $hit
    | ($hit.exhibitor // {}) as $e
    | ($e.exhibition.exhibitionHall // []) as $halls
    | {
        source: "messefrankfurt_api",
        event_id: ($e.exhibition.id // "AUTOMECHANIKA"),
        hall_filter: $scope,
        id: ($e.id // null),
        syn_id: ($e.synId // null),
        rewrite_id: ($e.rewriteId // null),
        name: (($e.name // "") | gsub("&amp;"; "&")),
        country: ($e.address.country.iso3 // $e.address.country.id // null),
        city: ($e.address.city // null),
        website: ($e.homepage // null),
        email: ($e.address.email // null),
        phone: ($e.address.tel // null),
        halls: [
          $halls[]?
          | {
              id: (.id // .name // null),
              name: (.name // .id // null),
              stands: [(.stand // [])[]? | .name]
            }
        ],
        booth_number: (
          [$halls[]? | select((.stand // []) | length > 0) | "\(.name // .id) " + ((.stand // [])[0].name // "")]
          | .[0] // null
        ),
        detail_url: ($detail_base + "/" + ($e.rewriteId // "") + ".html")
      }
    | select(.rewrite_id != null and .rewrite_id != "")
  ' "${raw}"
}

run_scope() {
  local scope="$1"
  local page=1
  local total=0
  local pages=0
  local written_before written_after written

  written_before="$(wc -l < "${JSONL_OUT}")"

  while (( page <= MAX_PAGES )); do
    raw="${RAW_DIR}/${scope//[^A-Za-z0-9_.-]/_}-page-${page}.json"
    fetch_page "${scope}" "${page}" "${raw}"

    success="$(jq -r '.success // false' "${raw}")"
    if [[ "${success}" != "true" ]]; then
      echo "HATA: API success=false scope=${scope} page=${page}" >&2
      jq -c '{status, message, fieldErrors, systemErrors}' "${raw}" >&2
      return 1
    fi

    page_hits="$(jq -r '(.result.hits // []) | length' "${raw}")"
    total="$(jq -r '.result.metaData.hitsTotal // 0' "${raw}")"
    extract_hits "${scope}" "${raw}" >> "${JSONL_OUT}"
    pages="${page}"

    printf "  scope=%s page=%s hits=%s total=%s\n" "${scope}" "${page}" "${page_hits}" "${total}"

    if (( page_hits == 0 || page * PAGE_SIZE >= total )); then
      break
    fi

    page=$((page + 1))
    sleep "${DELAY}"
  done

  written_after="$(wc -l < "${JSONL_OUT}")"
  written=$((written_after - written_before))
  printf "%s\t%s\t%s\t%s\n" "${scope}" "${total}" "${pages}" "${written}" >> "${SUMMARY_OUT}"
}

echo "==> Messe API export"
echo "  event=${EVENT_ID}"
echo "  halls=${HALLS}"
echo "  page_size=${PAGE_SIZE}"
echo "  out=${OUT_DIR}"
echo

if [[ "${HALLS}" == "all" ]]; then
  run_scope "all"
else
  IFS=',' read -r -a hall_array <<< "${HALLS}"
  for hall in "${hall_array[@]}"; do
    hall="${hall// /}"
    [[ -z "${hall}" ]] && continue
    run_scope "${hall}"
  done
fi

jq -s 'unique_by(.detail_url)[]' "${JSONL_OUT}" > "${JSONL_OUT}.dedup"
mv "${JSONL_OUT}.dedup" "${JSONL_OUT}"
jq -r '.detail_url' "${JSONL_OUT}" | sort -u > "${URLS_OUT}"

echo
echo "==> Tamam"
echo "  unique_urls=$(wc -l < "${URLS_OUT}")"
echo "  exhibitors=${JSONL_OUT}"
echo "  urls=${URLS_OUT}"
echo "  summary=${SUMMARY_OUT}"
