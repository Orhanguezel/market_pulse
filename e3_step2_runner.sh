#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
INTAKE_FILE="$ROOT_DIR/docs/E3_REPORT_INTAKE.md"
MSG_FILE="$ROOT_DIR/docs/E3_STEP2_TRIAGE_RUN_MESSAGE.md"

if [[ "${1:-}" == "" ]]; then
  echo "Usage: bash ./e3_step2_runner.sh /absolute/path/to/antigravity-report.md"
  exit 1
fi

REPORT_FILE="$1"
if [[ ! -f "$REPORT_FILE" ]]; then
  echo "Report file not found: $REPORT_FILE"
  exit 1
fi

{
  echo "# E3 Report Intake (Paste Area)"
  echo
  echo "Antigravity raporu gelir gelmez bu dosyaya ham ciktiyi yapistir."
  echo
  echo "## 1) Ham Rapor"
  echo
  echo '```md'
  cat "$REPORT_FILE"
  echo
  echo '```'
  echo
  echo "## 2) Hizli Cikarim"
  echo
  echo "- Toplam PASS:"
  echo "- Toplam FAIL:"
  echo "- Toplam BLOCKED:"
  echo
  echo "- P0:"
  echo "- P1:"
  echo "- P2:"
  echo "- P3:"
  echo
  echo "## 3) Sonraki Aksiyon"
  echo
  echo "- [ ] \`docs/E3_TRIAGE_REPORT_READY.md\` dosyasini doldur"
  echo "- [ ] \`docs/E3_FIX_QUEUE.md\` kuyrugunu guncelle"
  echo "- [ ] P0/P1 fix turunu baslat"
} > "$INTAKE_FILE"

echo "Updated intake file: $INTAKE_FILE"
echo
echo "Now send/apply this Step-2 message:"
echo "----------------------------------------"
sed -n '1,220p' "$MSG_FILE"
echo "----------------------------------------"
