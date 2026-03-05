module.exports = {
  apps: [
    {
      name: 'lunch-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--loader tsx'
    },
    {
      name: 'lunch-frontend',
      script: 'npx',
      args: 'vite preview',
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
