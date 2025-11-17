module.exports = {
  apps: [
    {
      name: 'appexit-backend',
      cwd: './backend',
      script: './appexit-backend',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: '8080',
        ENV: 'development',
      },
      env_development: {
        PORT: '8080',
        ENV: 'development',
      },
      env_production: {
        PORT: '8080',
        ENV: 'production',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
    {
      name: 'appexit-frontend',
      cwd: './frontend/appexit',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: '3000',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/appexit.git',
      path: '/var/www/appexit',
      'pre-deploy-local': '',
      'post-deploy':
        'cd backend && go build -o appexit-backend ./cmd/api && ' +
        'cd ../frontend/appexit && npm install && npm run build && ' +
        'pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
    staging: {
      user: 'deploy',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/appexit.git',
      path: '/var/www/appexit-staging',
      'post-deploy':
        'cd backend && go build -o appexit-backend ./cmd/api && ' +
        'cd ../frontend/appexit && npm install && npm run build && ' +
        'pm2 reload ecosystem.config.js --env development',
    },
  },
};
