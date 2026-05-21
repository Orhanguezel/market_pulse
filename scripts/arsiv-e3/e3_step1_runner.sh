#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MSG_FILE="$ROOT_DIR/docs/E3_ANTIGRAVITY_FINAL_MESSAGE.md"

cd "$ROOT_DIR"
bash ./e3_preprobe_and_record.sh

echo
echo "E3 Step 1 ready."
echo "Send this message to Antigravity:"
echo "----------------------------------------"
sed -n '1,220p' "$MSG_FILE"
echo "----------------------------------------"
