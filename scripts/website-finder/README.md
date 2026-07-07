# Website Finder (yerel liste-hazırlama aracı)

Firma adı listesi (Excel) → her firma için **Google'da ilk sonucun URL'sini** website
olarak bulur. `/listelerim` (Firma Listelerim) modülüne yükleyeceğin firma+website
listelerini üretmek için kullanılır.

## Neden yerel?
Selenium + görünür Chrome + gerektiğinde **elle CAPTCHA** çözümü gerektirir; Google
anti-bot nedeniyle sunucuda (headless) güvenilir çalışmaz. Bu yüzden **kendi
bilgisayarında** çalıştırılır, çıktısı sisteme yüklenir.

## Kurulum
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Chrome + eşleşen chromedriver kurulu olmalı (selenium 4 otomatik indirir)
```

## Çalıştırma
```bash
python website_finder.py
# Açılan pencereden Excel dosyasını seç (1. kolon = Firma Adı)
```
- Sonuç: `~/Desktop/chrome/firmalar_ve_websiteleri_final.xlsx` (Firma + Website)
- Ara kayıt `~/Desktop/chrome/ara_kayit.csv` — işlem yarıda kalırsa **kaldığı yerden devam eder**.
- CAPTCHA çıkarsa ~15 sn içinde elle çöz; script bekler.

## Akış
1. Bu araçla firma listesinden **website** bul (yerel).
2. Çıktı xlsx'i **Firma Listelerim → Excel/CSV Yükle** ile içe aktar.
3. **Ücretsiz Zenginleştir** (site e-postası + LinkedIn) → gerekirse **Apollo (seçili)**.
