# MatPortal Proje Teklifi — HTML Build

Bu klasör markdown teklif dokümanlarını **statik HTML** olarak derler. Sonuç `output/` klasöründe.

## Build Etme

```bash
bash build.sh
```

Gereksinim: `pandoc` (Ubuntu: `sudo apt install pandoc`)

## Yerel Görüntüleme

```bash
# Tek dosya açma
xdg-open output/index.html

# HTTP server (yorumlar için tavsiye)
cd output && python3 -m http.server 8080
# → http://localhost:8080
```

## İçerik Yapısı

```
output/
├── index.html                       # Ana sayfa (proje teklifi README)
├── style.css                        # Ortak stil
├── comments.js                      # Yorum sistemi (localStorage)
├── 00-yonetici-ozeti.html
├── 01-pazar-ve-musteri-analizi.html
├── 02-cozum-genel-bakis.html
├── 03-mimari-ve-teknoloji.html
├── 04-kullanici-yolculuklari.html
├── 05-fonksiyonel-kapsam.html
├── 06-veri-modeli.html
├── 07-yol-haritasi.html
├── 08-butce-kaynak.html
├── 09-risk.html
├── 10-basari-kpi.html
├── 11-ek-belgeler.html
├── tek-sayfa-ozet.html
└── tartisma/
    ├── index.html
    ├── 00-vizyon.html
    ├── 01-15 ... .html             # Tüm tartışma dokümanları
    └── ...
```

## Yorum Sistemi

İki mod:

### Mod A — Statik HTML (mevcut)
- Yorumlar tarayıcıda `localStorage`'da tutulur
- Her doküman için ayrı kayıt
- "JSON olarak indir" ile export edilebilir
- Limitasyon: çoklu kullanıcı yorum paylaşamaz

### Mod B — Promats Admin Panel Entegrasyonu (gelecek implementasyon)

`comments.js` modifiye edilerek API'ye bağlanır:

```js
// localStorage yerine:
fetch('/admin/teklif-yorum', {
  method: 'POST',
  body: JSON.stringify({ doc_id, yazar, metin }),
  credentials: 'include',
});
```

Backend tarafı gerekenler:
- `teklif_yorumlari` tablosu (id, doc_id, yazar_user_id, metin, yanit, created_at)
- `/admin/teklif-yorum` POST + GET endpoint
- Sidebar'a "Proje Teklifleri" menüsü
- HTML statik servis (Nginx ile `/admin/teklif/*` route)

## Promats Admin Panel'e Entegrasyon Adımları

```
1. backend/src/db/seed/sql/0XX_teklif_yorumlari_schema.sql ekle
2. backend/src/modules/teklif/ modülü yaz (router + repo)
3. admin_panel/src/app/(main)/admin/teklif-teklifleri/ Next.js sayfası
   - iframe ile output/index.html serve et
   - Yorum POST/GET endpoint'i comments.js'ten çağrılır
4. Nginx static serve: /admin/teklif/output/* → docs/proje-teklifi/build/output/
5. CI: build.sh her commit'te çalıştırılır, output/ commitlenir
```

Bu entegrasyon **kod yazma fazına** girer — Faz 0 ile birlikte yapılır.

## PDF Üretimi

Otomatik build script:

```bash
bash build-pdf.sh
```

İki yöntem otomatik denenir:
1. **xelatex** (varsa): pandoc + LaTeX, akademik kalite
2. **headless Chrome** (mevcut sistem): HTML → PDF, web kalitesi

Ubuntu'ya xelatex kurulumu:
```bash
sudo apt install texlive-xetex texlive-fonts-recommended
```

PDF'leri tek dosyada birleştirme (poppler-utils gerek):
```bash
sudo apt install poppler-utils
# script otomatik birleştirir, ek komut gerek yok
```

### Üretilen PDF'ler

`pdf/` klasöründe:
- `matportal-tum-teklif.pdf` — birleşik proje teklifi (2.2MB, ~70 sayfa)
- `matportal-tum-tartisma.pdf` — birleşik tartışma dokümanları (2.1MB, ~80 sayfa)
- `tek-sayfa-ozet.pdf` — A4 yönetim sunum özeti
- `00-yonetici-ozeti.pdf` ... `11-ek-belgeler.pdf` — her bölüm ayrı
- `tartisma-XX-*.pdf` — tartışma dokümanları ayrı

## Versiyon Kontrolü

`output/` klasörü Git'te kalabilir (sıkıştırılmış HTML, ~1MB) ama önerilen:
- `.gitignore`'a `output/` eklenir
- CI/CD build sürecinde üretilir
- GitHub Pages veya Cloudflare Pages ile deploy

## Stil Özelleştirme

`style.css` Promats marka kimliğine adapte edilebilir:
- `--accent` rengini Promats kurumsal rengine değiştir
- Logo eklenebilir (`.brand` class'ına img)
- Font Promats kurumsal fontuna geçirilir
