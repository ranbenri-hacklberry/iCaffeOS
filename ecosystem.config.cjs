// ecosystem.config.js — iCaffeOS PM2 Configuration
// Usage:
//   pm2 start ecosystem.config.js              # Start all
//   pm2 start ecosystem.config.js --only icaffe-backend,icaffe-frontend  # Core only
//   pm2 save && pm2 startup                    # Auto-start on boot

module.exports = {
  apps: [
    // ── Core Services ──────────────────────────────────────
    {
      name: 'icaffe-backend',
      script: 'backend_server.js',
      cwd: './frontend_source',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 8081,
      },
    },
    {
      name: 'icaffe-frontend',
      script: 'npx',
      args: 'vite --host --port 4028',
      cwd: './frontend_source',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },

    // ── Optional Services ──────────────────────────────────
    {
      name: 'icaffe-studio',
      script: 'backend/services/studio_local.py',
      interpreter: 'python3',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PORT: 5002,
      },
    },
    {
      name: 'icaffe-sms',
      script: 'sms-server.js',
      cwd: './frontend_source',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 8085,
      },
    },
    {
      name: 'icaffe-cortex',
      script: 'services/cortex-gateway/main.py',
      interpreter: 'python3',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PORT: 8000,
      },
    },
  ],
};
