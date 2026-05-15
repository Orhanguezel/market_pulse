#!/usr/bin/env bash
# MatPortal Proje Teklifi — HTML build
# Markdown → HTML (Pandoc) + ortak nav/stil/yorum sistemi

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="$(dirname "$SCRIPT_DIR")"
TARTISMA_DIR="$(dirname "$DOCS_DIR")/tartisma"
OUT_DIR="$SCRIPT_DIR/output"

# Temizle
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/tartisma"

# Stil ve JS dosyalarını kopyala
cp "$SCRIPT_DIR/style.css" "$OUT_DIR/"
cp "$SCRIPT_DIR/comments.js" "$OUT_DIR/"
cp "$SCRIPT_DIR/style.css" "$OUT_DIR/tartisma/"
cp "$SCRIPT_DIR/comments.js" "$OUT_DIR/tartisma/"

# Tartışma için template (path'leri ayarla)
sed 's|href="style.css"|href="../style.css"|g; s|src="comments.js"|src="../comments.js"|g; s|href="index.html"|href="../index.html"|g; s|href="\([0-9]\)|href="../\1|g; s|href="tek-sayfa-ozet.html"|href="../tek-sayfa-ozet.html"|g; s|href="tartisma/|href="|g' "$SCRIPT_DIR/template.html" > "$SCRIPT_DIR/template-tartisma.html"

echo "→ Proje teklifi dokümanları derleniyor..."
for md in "$DOCS_DIR"/*.md; do
  base=$(basename "$md" .md)
  if [ "$base" = "README" ]; then continue; fi
  echo "  $base.md → $base.html"
  pandoc "$md" \
    --from=markdown-tex_math_dollars-tex_math_single_backslash-raw_tex \
    --to=html5 \
    --wrap=none \
    --template="$SCRIPT_DIR/template.html" \
    --metadata title="$(head -1 "$md" | sed 's/^# *//')" \
    --output="$OUT_DIR/$base.html"
done

echo "→ Tartışma dokümanları derleniyor..."
for md in "$TARTISMA_DIR"/*.md; do
  base=$(basename "$md" .md)
  if [ "$base" = "README" ]; then continue; fi
  echo "  tartisma/$base.md → tartisma/$base.html"
  pandoc "$md" \
    --from=markdown-tex_math_dollars-tex_math_single_backslash-raw_tex \
    --to=html5 \
    --wrap=none \
    --template="$SCRIPT_DIR/template-tartisma.html" \
    --metadata title="$(head -1 "$md" | sed 's/^# *//')" \
    --output="$OUT_DIR/tartisma/$base.html"
done

# Tartışma için README'yi index.html olarak da kopyala
if [ -f "$TARTISMA_DIR/README.md" ]; then
  pandoc "$TARTISMA_DIR/README.md" \
    --from=markdown-tex_math_dollars-tex_math_single_backslash-raw_tex \
    --to=html5 \
    --wrap=none \
    --template="$SCRIPT_DIR/template-tartisma.html" \
    --metadata title="Tartışma Dokümanları İndeksi" \
    --output="$OUT_DIR/tartisma/index.html"
fi

# Ana index.html — proje teklifi giriş sayfası
if [ -f "$DOCS_DIR/README.md" ]; then
  pandoc "$DOCS_DIR/README.md" \
    --from=markdown-tex_math_dollars-tex_math_single_backslash-raw_tex \
    --to=html5 \
    --wrap=none \
    --template="$SCRIPT_DIR/template.html" \
    --metadata title="MatPortal Proje Teklifi" \
    --output="$OUT_DIR/index.html"
fi

# Geçici template'i temizle
rm -f "$SCRIPT_DIR/template-tartisma.html"

echo ""
echo "✓ Build tamamlandı: $OUT_DIR"
echo ""
echo "Açmak için:"
echo "  xdg-open $OUT_DIR/index.html"
echo ""
echo "Servis etmek için (HTTP, yorumlar için CORS gerek olabilir):"
echo "  cd $OUT_DIR && python3 -m http.server 8080"
