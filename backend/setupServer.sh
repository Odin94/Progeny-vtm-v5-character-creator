#!/bin/bash

# Setup script for Progeny Backend on Ubuntu Hetzner Server
# This script prepares an Ubuntu server for running the Fastify backend

# ============================================================================
# SCRIPT OVERVIEW - What this script does and why:
# ============================================================================
#
# 1. SYSTEM UPDATES
#    - Updates package lists and upgrades all system packages
#    - Required: Ensures security patches and latest system libraries
#
# 2. ESSENTIAL PACKAGES
#    - Installs curl, wget, git, build-essential, etc.
#    - Required: Basic tools needed for Node.js installation and development
#
# 3. NODE.JS 22.X INSTALLATION
#    - Installs Node.js version 22.x from NodeSource repository
#    - Required: Backend requires Node.js >=22.0.0 (as specified in package.json)
#
# 4. PM2 PROCESS MANAGER
#    - Installs PM2 globally for process management
#    - Required: Keeps backend running, auto-restarts on crashes, manages logs
#
# 5. NGINX REVERSE PROXY
#    - Installs and configures nginx as reverse proxy
#    - Required: Routes HTTP/HTTPS traffic to backend, handles SSL termination,
#      provides WebSocket support, enables SSL certificates
#
# 6. FIREWALL CONFIGURATION (UFW)
#    - Configures Uncomplicated Firewall
#    - Required: Security - only allows SSH (22), HTTP (80), HTTPS (443), 
#      and backend port (3001) if needed
#
# 7. APPLICATION USER CREATION
#    - Creates dedicated 'progeny' user for running the application
#    - Required: Security best practice - run app as non-root user,
#      isolates application files and processes
#
# 8. DIRECTORY STRUCTURE
#    - Creates /opt/progeny-backend for application code
#    - Creates /var/log/progeny-backend for log files
#    - Required: Organized file structure, proper permissions, log management
#
# 9. NGINX CONFIGURATION
#    - Creates nginx site configuration for reverse proxy
#    - Required: Routes requests to backend, handles WebSocket upgrades,
#      sets proper headers for proxying
#
# 10. PM2 ECOSYSTEM CONFIG
#     - Creates PM2 configuration file for process management
#     - Required: Defines how PM2 should run the backend (instances, env vars,
#       log locations, restart policies)
#
# 11. PM2 STARTUP SCRIPT
#     - Configures PM2 to start on system boot
#     - Required: Ensures backend automatically starts after server reboots
#
# 12. ENVIRONMENT TEMPLATE
#     - Creates .env.example file with required configuration keys
#     - Required: Documents required environment variables for deployment
#
# ============================================================================

set -e  # Exit on error

echo "🚀 Starting Progeny Backend server setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install essential packages
echo -e "${YELLOW}📦 Installing essential packages...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    sqlite3

# Install Node.js 22.x
echo -e "${YELLOW}📦 Installing Node.js 22.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js is already installed${NC}"
    node --version
fi

# Verify Node.js installation
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo -e "${RED}Node.js version 22 or higher is required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"
echo -e "${GREEN}✓ npm $(npm --version) installed${NC}"

# Install PM2 globally for process management
echo -e "${YELLOW}📦 Installing PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo -e "${GREEN}PM2 is already installed${NC}"
fi

# Install nginx
echo -e "${YELLOW}📦 Installing nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
else
    echo -e "${GREEN}nginx is already installed${NC}"
fi

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp  # Backend port (optional, if not using nginx)
ufw --force reload

# Create application user
APP_USER="progeny"
APP_DIR="/opt/progeny-backend"

if ! id "$APP_USER" &>/dev/null; then
    echo -e "${YELLOW}👤 Creating application user...${NC}"
    useradd -r -s /bin/bash -d "$APP_DIR" -m "$APP_USER"
    echo -e "${GREEN}✓ User $APP_USER created${NC}"
else
    echo -e "${GREEN}User $APP_USER already exists${NC}"
fi

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Create log directory
LOG_DIR="/var/log/progeny-backend"
mkdir -p "$LOG_DIR"
chown -R "$APP_USER:$APP_USER" "$LOG_DIR"

# Create nginx configuration
echo -e "${YELLOW}🌐 Configuring nginx...${NC}"
NGINX_CONFIG="/etc/nginx/sites-available/progeny-backend"
cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF

# Enable nginx site
if [ ! -f "/etc/nginx/sites-enabled/progeny-backend" ]; then
    ln -s "$NGINX_CONFIG" /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default  # Remove default site
fi

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

# Create PM2 ecosystem file
echo -e "${YELLOW}⚙️  Creating PM2 ecosystem file...${NC}"
cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'progeny-backend',
    script: './dist/index.js',
    cwd: '/opt/progeny-backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOST: '0.0.0.0'
    },
    error_file: '/var/log/progeny-backend/error.log',
    out_file: '/var/log/progeny-backend/out.log',
    log_file: '/var/log/progeny-backend/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/ecosystem.config.js"

# Create systemd service for PM2 (optional, but recommended)
echo -e "${YELLOW}⚙️  Setting up PM2 startup script...${NC}"
PM2_STARTUP=$(pm2 startup systemd -u "$APP_USER" --hp "$APP_DIR" | grep -v "PM2" | tail -n 1)
eval "$PM2_STARTUP"

# Create environment file template
echo -e "${YELLOW}📝 Creating environment file template...${NC}"
cat > "$APP_DIR/.env.example" << 'EOF'
# WorkOS Configuration
WORKOS_API_KEY=your_workos_api_key_here
WORKOS_CLIENT_ID=your_workos_client_id_here

# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/.env.example"

# Create setup completion script
cat > "$APP_DIR/README-SETUP.md" << 'EOF'
# Server Setup Complete!

## Next Steps:

1. **Copy your backend code to the server:**
   ```bash
   scp -r backend/* $APP_USER@your-server:/opt/progeny-backend/
   ```

2. **SSH into the server and switch to the application user:**
   ```bash
   ssh your-server
   sudo su - $APP_USER
   cd /opt/progeny-backend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your WorkOS credentials
   ```

5. **Generate and run database migrations:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

6. **Build the application:**
   ```bash
   npm run build
   ```

7. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

8. **Check status:**
   ```bash
   pm2 status
   pm2 logs progeny-backend
   ```

## SSL Setup (Optional but Recommended):

If you have a domain name, set up SSL with Let's Encrypt:

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## Useful Commands:

- View logs: `pm2 logs progeny-backend`
- Restart: `pm2 restart progeny-backend`
- Stop: `pm2 stop progeny-backend`
- Monitor: `pm2 monit`
- Check nginx: `systemctl status nginx`
- Check firewall: `ufw status`
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/README-SETUP.md"

echo ""
echo -e "${GREEN}✅ Server setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Application directory: $APP_DIR${NC}"
echo -e "${YELLOW}Application user: $APP_USER${NC}"
echo -e "${YELLOW}Log directory: $LOG_DIR${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Copy your backend code to $APP_DIR"
echo "2. Switch to user $APP_USER: sudo su - $APP_USER"
echo "3. Follow the instructions in $APP_DIR/README-SETUP.md"
echo ""
echo -e "${YELLOW}Note: Make sure to configure your .env file with WorkOS credentials before starting the application.${NC}"
