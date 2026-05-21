// PM2 ecosystem for scraper-service (native, Docker-less)
// Run from this directory: `pm2 start ecosystem.config.cjs`
module.exports = {
  apps: [
    {
      name: 'scraper-api',
      cwd: __dirname,
      script: '.venv/bin/uvicorn',
      args: 'src.main:app --host 127.0.0.1 --port 8200 --workers 1',
      autorestart: true,
      max_memory_restart: '1500M',
      env: { PYTHONUNBUFFERED: '1' },
    },
    {
      name: 'scraper-worker',
      cwd: __dirname,
      script: '.venv/bin/arq',
      args: 'src.workers.tasks.WorkerSettings',
      autorestart: true,
      max_memory_restart: '1500M',
      env: { PYTHONUNBUFFERED: '1' },
    },
  ],
};
