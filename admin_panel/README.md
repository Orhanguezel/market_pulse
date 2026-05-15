# MarketPulse Admin Panel

Next.js 16, Tailwind v4; tema ve icerik `site_settings` / theme uzerinden.

## Calistirma

Ortak ekosistem kokunden:

```bash
cd /path/to/paspas/market_pulse
bun install
cd admin_panel && bun run dev
```

Varsayilan port: **3094** (`package.json`). Backend: `../backend` (8086).

`.env` icin: `.env.example` kopyala; API URL'leri kendi ortamina gore ayarla.

## Uyarlama notlari

- Endpoint ve metinler MarketPulse backend ile hizalanir; sabit domain/marka kodda tutulmaz.
- Tasarim: CSS tokenlari — admin tema ayarlari ile degisebilir.
