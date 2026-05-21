#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLOSURE_MSG_FILE="$ROOT_DIR/docs/E3_STEP3_CLOSURE_RUN_MESSAGE.md"
TRIAGE_FILE="$ROOT_DIR/docs/E3_TRIAGE_REPORT_READY.md"
QUEUE_FILE="$ROOT_DIR/docs/E3_FIX_QUEUE.md"
LOG_FILE="$ROOT_DIR/docs/E3_EXECUTION_LOG.md"
SMOKE_FILE="$ROOT_DIR/docs/E3_SMOKE_TEST_COMMANDS.md"

echo "E3 Step 3 ready."
echo
echo "Before closing, ensure these are updated:"
echo "- $TRIAGE_FILE"
echo "- $QUEUE_FILE"
echo "- $LOG_FILE"
echo
echo "If needed, run smoke/build checks from:"
echo "- $SMOKE_FILE"
echo
echo "Now send/apply this Step-3 message:"
echo "----------------------------------------"
sed -n '1,220p' "$CLOSURE_MSG_FILE"
echo "----------------------------------------"
