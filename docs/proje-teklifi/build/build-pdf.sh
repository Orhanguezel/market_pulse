#!/usr/bin/env bash
# MatPortal Proje Teklifi — PDF build
# İki yöntem: 1) pandoc+xelatex (varsa), 2) headless Chrome (HTML üzerinden)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="$(dirname "$SCRIPT_DIR")"
TARTISMA_DIR="$(dirname "$DOCS_DIR")/tartisma"
OUT_DIR="$SCRIPT_DIR/pdf"
HTML_DIR="$SCRIPT_DIR/output"

mkdir -p "$OUT_DIR"

# Yöntem seçimi
if command -v xelatex &> /dev/null; then
  METHOD="pandoc"
  echo "→ Yöntem: pandoc + xelatex"
elif command -v google-chrome &> /dev/null || command -v chromium &> /dev/null; then
  METHOD="chrome"
  echo "→ Yöntem: headless Chrome (HTML → PDF)"
else
  echo "✗ HATA: PDF üretimi için xelatex veya google-chrome gerekli."
  echo "  Kurulum:"
  echo "    sudo apt install texlive-xetex texlive-fonts-recommended  # pandoc için"
  echo "    sudo apt install google-chrome-stable                     # chrome için"
  exit 1
fi

# HTML build varlığını kontrol et
if [ "$METHOD" = "chrome" ] && [ ! -d "$HTML_DIR" ]; then
  echo "→ HTML output bulunamadı, build.sh çalıştırılıyor..."
  bash "$SCRIPT_DIR/build.sh"
fi

CHROME_BIN=""
if command -v google-chrome &> /dev/null; then
  CHROME_BIN="google-chrome"
elif command -v chromium &> /dev/null; then
  CHROME_BIN="chromium"
fi

# PDF üretici fonksiyonu
generate_pdf() {
  local html_file="$1"
  local pdf_file="$2"

  if [ "$METHOD" = "chrome" ]; then
    "$CHROME_BIN" \
      --headless \
      --disable-gpu \
      --no-sandbox \
      --print-to-pdf="$pdf_file" \
      --print-to-pdf-no-header \
      --no-pdf-header-footer \
      "file://$html_file" 2>/dev/null
  else
    # pandoc + xelatex
    local md_file="${html_file%.html}.md"
    md_file="${md_file/output/}"
    md_file="${md_file/build\//}"
    pandoc "$DOCS_DIR/${md_file##*/}" \
      --pdf-engine=xelatex \
      -V geometry:margin=2cm \
      -V mainfont="DejaVu Sans" \
      -V monofont="DejaVu Sans Mono" \
      -V fontsize=10pt \
      --toc \
      --from=markdown-tex_math_dollars-tex_math_single_backslash-raw_tex \
      --output="$pdf_file"
  fi
}

if [ "$METHOD" = "chrome" ]; then
  echo "→ HTML dosyalarından PDF üretiliyor..."

  for html in "$HTML_DIR"/*.html; do
    base=$(basename "$html" .html)
    pdf="$OUT_DIR/$base.pdf"
    echo "  $base.html → $base.pdf"
    generate_pdf "$html" "$pdf"
  done

  for html in "$HTML_DIR"/tartisma/*.html; do
    base=$(basename "$html" .html)
    if [ "$base" = "index" ]; then continue; fi
    pdf="$OUT_DIR/tartisma-$base.pdf"
    echo "  tartisma/$base.html → tartisma-$base.pdf"
    generate_pdf "$html" "$pdf"
  done
fi

# 6. Birleşik PDF (tek dosya — sunum için ideal)
if command -v pdfunite &> /dev/null; then
  echo ""
  echo "→ Birleşik PDF oluşturuluyor..."
  cd "$OUT_DIR"
  pdfunite \
    tek-sayfa-ozet.pdf \
    00-yonetici-ozeti.pdf \
    01-pazar-ve-musteri-analizi.pdf \
    02-cozum-genel-bakis.pdf \
    03-mimari-ve-teknoloji.pdf \
    04-kullanici-yolculuklari.pdf \
    05-fonksiyonel-kapsam.pdf \
    06-veri-modeli.pdf \
    07-yol-haritasi.pdf \
    08-butce-kaynak.pdf \
    09-risk.pdf \
    10-basari-kpi.pdf \
    11-ek-belgeler.pdf \
    matportal-tum-teklif.pdf
  echo "  ✓ matportal-tum-teklif.pdf ($(ls -lh matportal-tum-teklif.pdf | awk '{print $5}'))"

  # Tartışma dokümanları birleşik
  pdfunite \
    tartisma-00-vizyon.pdf \
    tartisma-01-talep-tahmin-motoru.pdf \
    tartisma-02-musteri-kesif.pdf \
    tartisma-03-tedarikci-yonetimi.pdf \
    tartisma-04-stok-tahmin-otomasyonu.pdf \
    tartisma-05-veri-toplama-altyapisi.pdf \
    tartisma-06-yol-haritasi.pdf \
    tartisma-07-konversasyonel-katman.pdf \
    tartisma-08-saas-butce-analizi.pdf \
    tartisma-09-otomasyon-esikleri.pdf \
    tartisma-10-crm-karari.pdf \
    tartisma-11-b2b-bayi-portali.pdf \
    tartisma-12-tahmin-motoru-derinlemesine.pdf \
    tartisma-13-bayi-scraping-churn.pdf \
    tartisma-14-egitilebilir-modeller-mlops.pdf \
    tartisma-15-genisletme-sinyalleri.pdf \
    matportal-tum-tartisma.pdf
  echo "  ✓ matportal-tum-tartisma.pdf ($(ls -lh matportal-tum-tartisma.pdf | awk '{print $5}'))"
else
  echo ""
  echo "ⓘ pdfunite bulunamadı, birleşik PDF üretilmedi."
  echo "  Kurulum: sudo apt install poppler-utils"
fi

echo ""
echo "✓ PDF build tamamlandı: $OUT_DIR"
echo ""
echo "Dosyalar:"
ls -lh "$OUT_DIR" 2>/dev/null | tail -n +2 || echo "(boş)"
