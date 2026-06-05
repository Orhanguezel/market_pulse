// PM2 — market_pulse backend (tarvista deploy)
// Kurulum: /var/www/market_pulse/backend
module.exports = {
  apps: [
    {
      name: 'market-pulse-backend',
      cwd: '/var/www/market_pulse/backend',
      script: '/usr/bin/bun',
      args: 'dist/index.js',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '8087',
      },
      out_file: '/root/.pm2/logs/market-pulse-backend.out.log',
      error_file: '/root/.pm2/logs/market-pulse-backend.err.log',
    },
  ],
};
