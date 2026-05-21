#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "E3 Master Runner"
echo
echo "Step 1: Preprobe + Antigravity message"
echo "  bash ./e3_step1_runner.sh"
echo
echo "Step 2: Intake + triage start (report file required)"
echo "  bash ./e3_step2_runner.sh /absolute/path/to/antigravity-report.md"
echo
echo "Step 3: Closure prep"
echo "  bash ./e3_step3_runner.sh"
echo
echo "Step 4: Pilot handoff prep"
echo "  bash ./e3_step4_runner.sh"
echo
echo "Quick docs:"
echo "  - docs/E3_READY_NOW.md"
echo "  - docs/E3_MASTER_RUN_SEQUENCE.md"
echo "  - docs/E3_STATUS_SNAPSHOT.md"
echo "  - docs/E3_PREPROBE_LAST_RUN.md"
echo
echo "Extra:"
echo "  bash ./e3_master_runner.sh --status"
echo

if [[ "${1:-}" == "--step1" ]]; then
  cd "$ROOT_DIR"
  bash ./e3_step1_runner.sh
  exit 0
fi

if [[ "${1:-}" == "--step2" ]]; then
  if [[ -z "${2:-}" ]]; then
    echo "Usage: bash ./e3_master_runner.sh --step2 /absolute/path/to/antigravity-report.md"
    exit 1
  fi
  cd "$ROOT_DIR"
  bash ./e3_step2_runner.sh "$2"
  exit 0
fi

if [[ "${1:-}" == "--step3" ]]; then
  cd "$ROOT_DIR"
  bash ./e3_step3_runner.sh
  exit 0
fi

if [[ "${1:-}" == "--step4" ]]; then
  cd "$ROOT_DIR"
  bash ./e3_step4_runner.sh
  exit 0
fi

if [[ "${1:-}" == "--status" ]]; then
  echo "=== Status Snapshot ==="
  sed -n '1,80p' "$ROOT_DIR/docs/E3_STATUS_SNAPSHOT.md"
  echo
  echo "=== Last Preprobe ==="
  sed -n '1,120p' "$ROOT_DIR/docs/E3_PREPROBE_LAST_RUN.md"
  exit 0
fi

if [[ -n "${1:-}" ]]; then
  echo "Unknown option: $1"
  echo "Usage:"
  echo "  bash ./e3_master_runner.sh"
  echo "  bash ./e3_master_runner.sh --status"
  echo "  bash ./e3_master_runner.sh --step1"
  echo "  bash ./e3_master_runner.sh --step2 /absolute/path/to/antigravity-report.md"
  echo "  bash ./e3_master_runner.sh --step3"
  echo "  bash ./e3_master_runner.sh --step4"
  exit 1
fi
