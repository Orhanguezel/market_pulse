# gzltek.tech — Deploy Runbook (srv1731955 / 187.77.79.59)

Hedef: `market_pulse` uygulamasini `gzltek` tenant'i olarak `/var/www/market_pulse` altina kurmak.
Sunucuda `sultandefense` ve `sultanolive` calisiyor; mevcut servislere dokunma.

## Parametreler
- Branch: `feat/tenant-config-core`
- Portlar: backend **8086**, frontend **3077**, admin **3096**
- DB: `market_pulse_db` (MySQL localhost, yeni)
- Tenant: `TENANT_KEY=gzltek`
- Domain: `gzltek.tech` ve `www.gzltek.tech`
- Scraper: merkezi `https://scraper.guezelwebdesign.com`

Kurulumdan once portlari dogrula:
```bash
ss -tlnp | grep -E '8086|3077|3096' || true
```

## Topoloji (nginx)
- `/`         -> frontend (3077)
- `/panel/`  -> admin (3096, `NEXT_PUBLIC_BASE_PATH=/panel`)
- `/api/`    -> backend (8086)
- `/uploads/`-> backend (8086)

## DNS
Hostinger DNS:
- `A @` -> `187.77.79.59`
- `AAAA @` -> sil
- `CNAME www` -> `gzltek.tech` kalsin
- MX kaydina dokunma

SSL'den once yayilimi dogrula:
```bash
dig +short gzltek.tech
dig +short www.gzltek.tech
```

## 1) MySQL
```sql
CREATE DATABASE IF NOT EXISTS market_pulse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mp_user'@'127.0.0.1' IDENTIFIED BY '<DB_PASSWORD>';
GRANT ALL PRIVILEGES ON market_pulse_db.* TO 'mp_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

## 2) Repo
```bash
cd /var/www
git clone git@github.com:Orhanguezel/market_pulse.git market_pulse
cd market_pulse
git checkout feat/tenant-config-core
```

## 3) Env Dosyalari

`backend/.env.production`:
```dotenv
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
ADMIN_PASSWORD=<guclu-parola>
SCRAPER_SERVICE_URL=https://scraper.guezelwebdesign.com
SCRAPER_SERVICE_API_KEY=<scraper token>
```

Backend runtime `dotenv/config` ile `.env` okudugu icin production dosyasini bagla:
```bash
cd /var/www/market_pulse/backend
ln -sfn .env.production .env
```

`frontend/.env.production`:
```dotenv
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://gzltek.tech
NEXT_PUBLIC_API_URL=/api/v1
API_BASE_URL=http://127.0.0.1:8086/api/v1
PANEL_API_URL=http://127.0.0.1:8086
NEXT_PUBLIC_APP_NAME=Market Pulse
NEXT_PUBLIC_BASE_PATH=
```

`admin_panel/.env.production`:
```dotenv
NODE_ENV=production
NEXT_PUBLIC_BASE_PATH=/panel
NEXT_PUBLIC_API_URL=/api/v1
PANEL_API_URL=http://127.0.0.1:8086
API_BASE_URL=http://127.0.0.1:8086/api/v1
NEXT_PUBLIC_SITE_URL=https://gzltek.tech
NEXT_PUBLIC_APP_NAME=Market Pulse Panel
```

## 4) Nginx + SSL (build'den once)
```bash
cp deploy/gzltek/nginx-gzltek.tech.conf /etc/nginx/sites-available/gzltek.tech
ln -s /etc/nginx/sites-available/gzltek.tech /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d gzltek.tech -d www.gzltek.tech --redirect -n --agree-tos -m orhanguzell@gmail.com
nginx -t && systemctl reload nginx
```

## 5) Install + Build
```bash
cd /var/www/market_pulse/backend && bun install && bun run build
cd ../frontend && bun install && bun run build
cd ../admin_panel && bun install && bun run build
```

## 6) Seed
```bash
cd /var/www/market_pulse/backend
bun run src/db/seed/index.ts --no-drop
bun run tenant:guard
```

## 7) PM2
```bash
cd /var/www/market_pulse
pm2 start deploy/gzltek/backend.ecosystem.config.cjs
pm2 start deploy/gzltek/frontend.ecosystem.config.cjs
pm2 start deploy/gzltek/admin.ecosystem.config.cjs
pm2 save
```

## 8) Smoke Test
```bash
curl -fsS http://127.0.0.1:8086/api/health || echo "backend FAIL"
curl -fsS -o /dev/null -w "%{http_code}\n" https://gzltek.tech/
curl -fsS -o /dev/null -w "%{http_code}\n" https://gzltek.tech/hizmetler
curl -fsS -o /dev/null -w "%{http_code}\n" https://gzltek.tech/tr/hizmetler/gtip-hs-koduna-gore-musteri-bulma
curl -fsS -o /dev/null -w "%{http_code}\n" https://gzltek.tech/panel/
```

## Sonraki deploy'lar
```bash
bash /var/www/market_pulse/deploy/gzltek/deploy.sh
```
