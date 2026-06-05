// PM2 — market_pulse frontend (tarvista deploy)
// Kurulum: /var/www/market_pulse/frontend  (Next.js, port 3077)
module.exports = {
  apps: [
    {
      name: 'market-pulse-frontend',
      cwd: '/var/www/market_pulse/frontend',
      script: '/usr/bin/bun',
      args: 'x next start -p 3077 -H 127.0.0.1',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: '3077',
        HOSTNAME: '127.0.0.1',
      },
      out_file: '/root/.pm2/logs/market-pulse-frontend.out.log',
      error_file: '/root/.pm2/logs/market-pulse-frontend.err.log',
    },
  ],
};
