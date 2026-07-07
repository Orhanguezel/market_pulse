# Codex Brief — Market Pulse → gzltek.tech Deploy

> Hazırlayan: Claude Code (mimar) · Uygulayan: **Codex** · Tarih: 2026-06-27
> Hedef: market_pulse'ı **gzltek.tech** altında, sunucu **187.77.79.59 (srv1731955)**'e kur.
> Bu sunucu zaten **sultandefense + sultanolive** barındırıyor → onlara DOKUNMA, port çakıştırma.
> Referans runbook (uyarlanacak): [deploy/tarvista/RUNBOOK.md](deploy/tarvista/RUNBOOK.md) + [deploy/tarvista/deploy.sh](deploy/tarvista/deploy.sh).
> İlerde gzltek.tech → **isletmeniyonet.com**'a taşınacak (şimdilik gzltek).

---

## 0) ⚠️ ÖN KOŞUL — bugünkü işleri commit + push et (deploy bunu çeker)

Çalışma ağacında **47 commit'lenmemiş değişiklik** var (hizmetler render, customs kanalı, teal+navy tema, outreach bulk-list). Branch: `feat/tenant-config-core`. Deploy git'ten pull yaptığı için ÖNCE:
```bash
cd <repo>
git add -A
git commit -m "feat: hizmetler render layer + customs Discover channel + teal/navy theme + outreach bulk-list"
git push origin feat/tenant-config-core
```
> Not: `frontend/src/config/hizmetler/*.json` (67 sayfa), `backend/src/modules/lead-machine/customs/`, `outreach/bulk-list.*`, `028/030_*.sql`, tema dosyaları dahil edilmeli. `SECRETS.md` / `.env*` commit'lenmez (zaten .gitignore'da olmalı — kontrol et).

---

## 1) Parametreler (gzltek)

| | Değer |
|---|---|
| Sunucu | `187.77.79.59` (srv1731955) — sultandefense ile AYNI |
| SSH | key tabanlı (sultandefense ile aynı erişim — yerel secrets'ta, REPODA DEĞİL) |
| Domain | `gzltek.tech` (+ `www.gzltek.tech`) |
| Kurulum dizini | `/var/www/market_pulse` |
| Branch | `feat/tenant-config-core` |
| Portlar | backend **8086**, frontend **3077**, admin **3096** — **kurulumdan önce `ss -tlnp` ile boş doğrula** (sultandefense 8091/3042/3043 kullanıyor, çakışmamalı) |
| DB | `market_pulse_db` (localhost MySQL, yeni — kimseyi etkilemez) |
| Tenant | `TENANT_KEY=gzltek` |
| Branding | `NEXT_PUBLIC_APP_NAME="Market Pulse"` (gzltek.tech şimdilik) |
| Scraper | merkezi `https://scraper.guezelwebdesign.com` (yeni container yok) |

---

## 2) DNS değişiklikleri (Hostinger hpanel → gzltek.tech → DNS / Ad Sunucuları)

Mevcut kayıtlar yanlış sunucuya işaret ediyor. Şu değişiklikleri yap:

| Tür | Ad | ŞİMDİ | YAP |
|-----|----|-------|-----|
| **A** | @ | `72.61.23.36` | **`187.77.79.59`** olarak DÜZENLE |
| **AAAA** | @ | `2a02:4780:41:70::1` | **SİL** (yeni sunucuda eşleşen IPv6 yok; bırakılırsa split-brain) |
| CNAME | www | `gzltek.tech` | DOKUNMA (doğru) |
| MX | @ | `gzltek.tech` | DOKUNMA (mail kullanılmıyorsa zararsız) |

TTL düşükse (300) yayılım hızlı; A kaydı 14400 → propagasyon ~birkaç saat olabilir. SSL'den (certbot) ÖNCE A kaydının yayıldığını `dig +short gzltek.tech` ile doğrula.

---

## 3) deploy/gzltek/ varlıklarını oluştur (tarvista şablonundan)

`deploy/tarvista/` → `deploy/gzltek/` kopyala ve gzltek değerleriyle uyarla:
```bash
cp -r deploy/tarvista deploy/gzltek
```
Uyarlanacaklar:
- **3 ecosystem .cjs**: `name` → `market-pulse-backend|frontend|admin` (çakışma yoksa kalabilir ama gzltek-suffix önerilir), PORT'lar **8086/3077/3096**.
- **nginx conf** → `nginx-gzltek.tech.conf`, `server_name gzltek.tech www.gzltek.tech`.
- **deploy.sh** → ROOT/ECO yolları + branch.

### 🔑 TOPOLOJİ FARKI (tarvista'dan KRİTİK sapma)
tarvista Faz-7'de **admin root'taydı, frontend kapalıydı** (frontend o zaman yanlış üründü). **gzltek'te public frontend HAZIR** (67 hizmet sayfası + teal tema) → **frontend root'ta** olmalı:
```
/          → frontend  (3077)   ← PUBLIC YÜZ
/panel/    → admin     (3096, NEXT_PUBLIC_BASE_PATH=/panel)
/api/      → backend   (8086)
/uploads/  → backend   (8086)
```
nginx conf'u buna göre yaz (tarvista'nın İLK runbook topolojisi — admin-root EK'i DEĞİL). `client_max_body_size 50M` (xlsx/CSV upload için).

---

## 4) Sunucu kurulum adımları (tarvista RUNBOOK uyarlaması)

SSH ile `187.77.79.59`'a gir, sırayla:

1. **MySQL**: DB + kullanıcı oluştur (root socket-auth):
   ```sql
   CREATE DATABASE IF NOT EXISTS market_pulse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'mp_user'@'127.0.0.1' IDENTIFIED BY '<DB_PASSWORD>';
   GRANT ALL PRIVILEGES ON market_pulse_db.* TO 'mp_user'@'127.0.0.1';
   FLUSH PRIVILEGES;
   ```
2. **Repo**: `cd /var/www && git clone git@github.com:Orhanguezel/market_pulse.git && cd market_pulse && git checkout feat/tenant-config-core`
3. **backend/.env.production** (repoda DEĞİL):
   ```
   NODE_ENV=production
   TENANT_KEY=gzltek
   HOST=127.0.0.1
   PORT=8086
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=market_pulse_db
   DB_USER=mp_user
   DB_PASSWORD=<DB_PASSWORD>
   JWT_SECRET=<openssl rand -hex 32>
   COOKIE_SECRET=<openssl rand -hex 32>
   DB_ENCRYPTION_KEY=<openssl rand -hex 32>
   APP_URL=https://gzltek.tech
   PUBLIC_URL=https://gzltek.tech
   FRONTEND_URL=https://gzltek.tech
   CORS_ORIGIN=https://gzltek.tech
   ADMIN_EMAIL=orhanguzell@gmail.com
   ADMIN_PASSWORD=<güçlü-parola>
   SCRAPER_SERVICE_URL=https://scraper.guezelwebdesign.com
   SCRAPER_SERVICE_API_KEY=<scraper token>
   # ERP yok — EXTERNAL_DB_* girilmez.
   ```
4. **frontend/.env.production**:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_SITE_URL=https://gzltek.tech
   NEXT_PUBLIC_API_URL=/api/v1
   API_BASE_URL=http://127.0.0.1:8086/api/v1   # SSR fetch local backend'e (ZORUNLU)
   PANEL_API_URL=http://127.0.0.1:8086
   NEXT_PUBLIC_APP_NAME=Market Pulse
   NEXT_PUBLIC_BASE_PATH=
   ```
5. **admin_panel/.env.production**:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_BASE_PATH=/panel
   NEXT_PUBLIC_API_URL=/api/v1
   PANEL_API_URL=http://127.0.0.1:8086
   NEXT_PUBLIC_SITE_URL=https://gzltek.tech
   NEXT_PUBLIC_APP_NAME=Market Pulse Panel
   ```
6. **Nginx vhost + SSL — BUILD'DEN ÖNCE** (frontend build SSR fetch atar, domain canlı olmalı):
   ```bash
   # Fresh kurulum: cert dosyalari yokken gecici HTTP vhost ile basla.
   cat >/etc/nginx/sites-available/gzltek.tech <<'EOF'
   server {
     listen 80;
     server_name gzltek.tech www.gzltek.tech;
     location / {
       proxy_pass http://127.0.0.1:3077;
       proxy_set_header Host $host;
     }
   }
   EOF
   ln -sfn /etc/nginx/sites-available/gzltek.tech /etc/nginx/sites-enabled/gzltek.tech
   nginx -t && systemctl reload nginx
   certbot --nginx -d gzltek.tech -d www.gzltek.tech --redirect -n --agree-tos -m orhanguzell@gmail.com
   cp deploy/gzltek/nginx-gzltek.tech.conf /etc/nginx/sites-available/gzltek.tech
   nginx -t && systemctl reload nginx
   ```
7. **Install + build** (Bun):
   ```bash
   cd backend && bun install && bun run build
   cd ../frontend && bun install && bun run build
   cd ../admin_panel && bun install && bun run build
   ```
8. **DB seed** (DB önceden oluşturuldu → `--no-drop`; ALTER YASAK kuralı geçerli):
   ```bash
   cd backend && bun run src/db/seed/index.ts --no-drop
   ```
9. **PM2**:
   ```bash
   cd /var/www/market_pulse
   pm2 start deploy/gzltek/backend.ecosystem.config.cjs
   pm2 start deploy/gzltek/frontend.ecosystem.config.cjs
   pm2 start deploy/gzltek/admin.ecosystem.config.cjs
   pm2 save
   ```
10. **Smoke test**:
    ```bash
    curl -fsS http://127.0.0.1:8086/api/health || echo "backend FAIL"
    curl -fsS -o /dev/null -w "%{http_code}\n" https://gzltek.tech/                 # frontend (public)
    curl -fsS -o /dev/null -w "%{http_code}\n" https://gzltek.tech/hizmetler         # 67 sayfa hub
    curl -fsS -o /dev/null -w "%{http_code}\n" https://gzltek.tech/tr/hizmetler/gtip-hs-koduna-gore-musteri-bulma
    curl -fsS -o /dev/null -w "%{http_code}\n" https://gzltek.tech/panel/             # admin
    ```

---

## 5) Opsiyonel — customs demo verisi (Discover kanalını canlı göstermek için)
PoC'de kullanılan biber gümrük örneği (3535 kayıt) sunucuya taşınıp import edilebilir:
```bash
# CSV'yi sunucuya kopyala, sonra:
cd backend && bun src/scripts/import-customs.ts /path/pepper_customs.csv
# Sonra admin panelde Discover/customs job çalıştır.
```
> Import script'i `TENANT_KEY` env'ini kullanır; sunucuda `backend/.env.production` içinde `TENANT_KEY=gzltek` olduğu için kayıtlar gzltek tenant'ına gider.

---

## 6) Güvenlik / kurallar
- **SSH key + tüm secret'lar REPODA DEĞİL.** `.env.production` dosyaları elle, sunucuda oluşturulur.
- `JWT_SECRET`/`COOKIE_SECRET`/`DB_ENCRYPTION_KEY` → `openssl rand -hex 32`.
- ⚠️ Backend'de bilinen güvenlik açığı: tenant `x-tenant` header'ından, JWT'de değil → cross-tenant erişim riski. **Tek tenant (gzltek) deploy'da kritik değil ama multi-tenant açılmadan ÖNCE JWT'ye tenant binding eklenmeli.** (ayrı iş)
- `ALTER TABLE` lokal/deploy'da YASAK → schema `CREATE TABLE` + `db:seed`.

## 7) Bilinen tuzaklar (tarvista'dan)
- **Build SIRASI:** nginx+SSL **önce**, frontend/admin build **sonra** — yoksa SSR fetch `https://gzltek.tech/api`'ye gidip 60sn timeout ile build çöker.
- ALS tenant context: `enterWith` kullanılır (`run` değil); `tenantContextPlugin` `fastify-plugin` ile sarılı — bunlar repoda zaten düzeltili, regression yapma.
- Port doğrulama: kurulumdan önce `ss -tlnp | grep -E '8086|3077|3096'` boş olmalı.

## 8) İlerisi — isletmeniyonet.com geçişi
gzltek doğrulandıktan sonra isletmeniyonet.com bu kuruluma yönlendirilecek: DNS A → 187.77.79.59, nginx server_name + cert + env URL'leri isletmeniyonet.com'a güncellenir, gzltek 301 redirect veya ikinci server_name olarak bırakılır.
