module.exports = {
  apps: [{
    name: 'progeny-backend',
    script: 'npm',
    args: 'start',
    cwd: '/opt/progeny/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: 'localhost'
    },
    error_file: '/var/log/progeny-backend/error.log',
    out_file: '/var/log/progeny-backend/out.log',
    log_file: '/var/log/progeny-backend/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '2G'
  }]
};
