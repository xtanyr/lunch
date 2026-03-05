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
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
