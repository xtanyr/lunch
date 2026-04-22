module.exports = {
  apps: [
    {
      name: 'lunch-backend',
      script: './node_modules/.bin/tsx',
      args: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'lunch-frontend',
      script: './node_modules/.bin/vite',
      args: 'preview --port 3001 --host',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      autorestart: true
    }
  ]
};
