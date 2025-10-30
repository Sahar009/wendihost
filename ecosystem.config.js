module.exports = {
  apps: [
    {
      name: 'wendihost',
      script: './server.js',
      instances: 1, // Start with 1 instance, can increase for clustering
      exec_mode: 'fork', // Use fork mode for simpler setup
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}

