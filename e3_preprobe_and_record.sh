#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_FILE="$ROOT_DIR/docs/E3_PREPROBE_LAST_RUN.md"

ADMIN_BASE_URL="${ADMIN_BASE_URL:-http://localhost:3096}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8086}"
NOW_HUMAN="$(date '+%Y-%m-%d %H:%M (%Z)')"
NOW_ISO="$(date -Iseconds)"

RESULT_OUTPUT="$(cd "$ROOT_DIR" && bash ./e3_preprobe.sh)"

if printf '%s' "$RESULT_OUTPUT" | rg -q "E3 preprobe result: PASS"; then
  RESULT="PASS"
else
  RESULT="FAIL"
fi

cat > "$OUT_FILE" <<EOF
# E3 Preprobe Last Run

## Run Info

- Komut: \`bash ./e3_preprobe.sh\`
- Komut: \`bash ./e3_preprobe_and_record.sh\`
- Zaman: \`$NOW_HUMAN\`
- ISO: \`$NOW_ISO\`
- Sonuc: \`$RESULT\`

## Ham Cikti

\`\`\`text
$RESULT_OUTPUT
\`\`\`

## Not

Bu dosya \`e3_preprobe_and_record.sh\` tarafindan otomatik guncellendi.
EOF

echo "Updated: $OUT_FILE"
echo "Result: $RESULT"
