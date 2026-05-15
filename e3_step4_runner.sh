#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PILOT_MSG_FILE="$ROOT_DIR/docs/E3_STEP4_PILOT_HANDOFF_MESSAGE.md"
PILOT_CHECKLIST="$ROOT_DIR/docs/PILOT_DELIVERY_PACKAGE_CHECKLIST.md"
EXEC_LOG="$ROOT_DIR/docs/E3_EXECUTION_LOG.md"

echo "E3 Step 4 ready."
echo
echo "Before pilot handoff, review:"
echo "- $PILOT_CHECKLIST"
echo "- $EXEC_LOG"
echo
echo "Now send/apply this Step-4 message:"
echo "----------------------------------------"
sed -n '1,220p' "$PILOT_MSG_FILE"
echo "----------------------------------------"
