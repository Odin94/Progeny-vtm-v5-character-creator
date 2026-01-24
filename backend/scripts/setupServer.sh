#!/bin/bash

# Setup script for Progeny Backend on Ubuntu Hetzner Server
# This script prepares an Ubuntu server for running the Fastify backend

# NOTE: You can NOT just paste this as hetzner init script, those follow a yaml format
# Copy over with scp, fix line endings and run
# scp backend/scripts/setupServer.sh root@IPHERE:/tmp/setupServer.sh
# sudo apt install dos2unix
# dos2unix /tmp/setupServer.sh
# chmod +x /tmp/setupServer.sh
# /tmp/setupServer.sh

set -e

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
    git \
    build-essential \
    sqlite3 \
    libcap2-bin \
    certbot

# Install Node.js 24.x
echo -e "${YELLOW}📦 Installing Node.js 24.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js is already installed${NC}"
    node --version
fi

# Verify Node.js installation
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 24 ]; then
    echo -e "${RED}Node.js version 24 or higher is required. Current version: $(node --version)${NC}"
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

# Allow Node.js to bind to privileged ports (443)
echo -e "${YELLOW}🔐 Setting capabilities for privileged ports...${NC}"
NODE_PATH=$(which node)
if setcap 'cap_net_bind_service=+ep' "$NODE_PATH" 2>/dev/null; then
    echo -e "${GREEN}✓ Capabilities set for Node.js to bind to port 443${NC}"
else
    echo -e "${YELLOW}Warning: Could not set capabilities. Node.js may need root privileges to bind to port 443.${NC}"
fi

# Create application user
APP_USER="progeny"
APP_DIR="/opt/progeny"

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

# Clone or update repository
echo -e "${YELLOW}📥 Setting up repository...${NC}"
if [ -d "$APP_DIR/.git" ]; then
    echo -e "${YELLOW}Repository already exists, pulling latest changes...${NC}"
    runuser -u "$APP_USER" -- git -C "$APP_DIR" pull
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    runuser -u "$APP_USER" -- git clone https://github.com/Odin94/Progeny-vtm-v5-character-creator.git "$APP_DIR"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
runuser -u "$APP_USER" -- bash -c "cd $APP_DIR/backend && npm install"

# Build backend
echo -e "${YELLOW}🔨 Building backend...${NC}"
runuser -u "$APP_USER" -- bash -c "cd $APP_DIR/backend && npm run build"

# Create PM2 ecosystem file
echo -e "${YELLOW}⚙️  Creating PM2 ecosystem file...${NC}"
cat > "$APP_DIR/backend/ecosystem.config.cjs" << 'EOF'
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
      PORT: 443,
      HOST: '0.0.0.0'
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
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/backend/ecosystem.config.cjs"

# Create systemd service for PM2
echo -e "${YELLOW}⚙️  Setting up PM2 startup script...${NC}"
PM2_STARTUP=$(runuser -u "$APP_USER" -- pm2 startup systemd -u "$APP_USER" --hp "$APP_DIR" | grep -v "PM2" | tail -n 1)
eval "$PM2_STARTUP"

# Install and configure PM2 log rotation
echo -e "${YELLOW}📦 Installing PM2 log rotation...${NC}"
runuser -u "$APP_USER" -- pm2 install pm2-logrotate 2>/dev/null || {
    echo -e "${YELLOW}Note: PM2 log rotation will be configured when PM2 is first started${NC}"
}

# Configure log rotation to keep logs for 1 month (30 days)
echo -e "${YELLOW}⚙️  Configuring log rotation (30 days retention, 20M max size)...${NC}"
runuser -u "$APP_USER" -- pm2 set pm2-logrotate:max_size 20M 2>/dev/null || true
runuser -u "$APP_USER" -- pm2 set pm2-logrotate:retain 30 2>/dev/null || true
runuser -u "$APP_USER" -- pm2 set pm2-logrotate:rotateInterval '0 0 * * *' 2>/dev/null || true
runuser -u "$APP_USER" -- pm2 set pm2-logrotate:workerInterval 30 2>/dev/null || true
runuser -u "$APP_USER" -- pm2 save 2>/dev/null || true

# Create environment file template
echo -e "${YELLOW}📝 Creating environment file template...${NC}"
cat > "$APP_DIR/backend/.env" << 'EOF'
# PostHog Configuration
POSTHOG_KEY=your_posthog_api_key_here
POSTHOG_HOST=https://eu.i.posthog.com

# WorkOS Configuration
WORKOS_API_KEY=your_workos_api_key_here
WORKOS_CLIENT_ID=your_workos_client_id_here
WORKOS_COOKIE_PASSWORD=your_cookie_password_here

# Server Configuration
PORT=443
HOST=0.0.0.0
NODE_ENV=production

# Optional: Backend URL (for auth redirects)
BACKEND_URL=https://api.progeny.odin-matthias.de

# Optional: Frontend URL (for logout redirects)
FRONTEND_URL=https://progeny.odin-matthias.de

# SSL Configuration (for HTTPS on port 443)
# Will only work after running certbot:
SSL_CERT_PATH=/etc/letsencrypt/live/api.progeny.odin-matthias.de/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/api.progeny.odin-matthias.de/privkey.pem
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/backend/.env"

# Create setup completion script
cat > "$APP_DIR/backend/README-SETUP.md" << 'HEREDOC_EOF'
# Server Setup Complete!

## Next Steps:

1. **SSH into the server and switch to the application user:**
   ```bash
   ssh your-server
   sudo su - progeny
   cd /opt/progeny/backend
   ```

2. **Set up environment variables:**
   ```bash
   vim .env  # Edit with your WorkOS credentials
   ```

3. **Generate and run database migrations:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Set up SSL certificates (after DNS is configured):**
   ```bash
   # First, stop the backend if it's running
   pm2 stop progeny-backend
   
   # Get SSL certificate from Let's Encrypt
   sudo certbot certonly --standalone -d api.progeny.odin-matthias.de
   
   # Allow the progeny user to read the certificates
   sudo chmod 755 /etc/letsencrypt/live
   sudo chmod 755 /etc/letsencrypt/archive
   sudo chmod 644 /etc/letsencrypt/live/api.progeny.odin-matthias.de/fullchain.pem
   sudo chmod 644 /etc/letsencrypt/live/api.progeny.odin-matthias.de/privkey.pem
   
   # Update .env with certificate paths (uncomment and set):
   # SSL_CERT_PATH=/etc/letsencrypt/live/api.progeny.odin-matthias.de/fullchain.pem
   # SSL_KEY_PATH=/etc/letsencrypt/live/api.progeny.odin-matthias.de/privkey.pem
   ```

5. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   ```

6. **Check status:**
   ```bash
   pm2 status
   pm2 logs progeny-backend
   ```

## Useful Commands:

- View logs: `pm2 logs progeny-backend`
- Restart: `pm2 restart progeny-backend`
- Stop: `pm2 stop progeny-backend`
- Monitor: `pm2 monit`
- Update code: `./scripts/updateCode.sh`
HEREDOC_EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/backend/README-SETUP.md"

# Create README in home directory
echo -e "${YELLOW}📝 Creating home directory README...${NC}"
cat > "$APP_DIR/README.md" << 'EOF'
# Progeny Backend Server

Welcome to the Progeny VTM V5 Character Creator backend server.

## Quick Links

- **Backend Directory**: `/opt/progeny/backend`
- **Logs**: `/var/log/progeny-backend/`
- **Database**: `/opt/progeny/backend/database.sqlite`

## Getting Started

1. Navigate to the backend directory:
   ```bash
   cd /opt/progeny/backend
   ```

2. See `README-SETUP.md` for detailed setup and management instructions.

## Useful Commands

- View PM2 status: `pm2 status`
- View logs: `pm2 logs progeny-backend`
- Restart backend: `pm2 restart progeny-backend`
- Update code: `./scripts/updateCode.sh` (from backend directory)
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/README.md"

echo ""
echo -e "${GREEN}✅ Server setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Application directory: $APP_DIR${NC}"
echo -e "${YELLOW}Application user: $APP_USER${NC}"
echo -e "${YELLOW}Log directory: $LOG_DIR${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Switch to user $APP_USER: sudo su - $APP_USER"
echo "2. Navigate to: cd $APP_DIR/backend"
echo "3. Follow the instructions in $APP_DIR/backend/README-SETUP.md"
echo ""
echo -e "${YELLOW}Note: Make sure to configure your .env file with WorkOS credentials before starting the application.${NC}"
echo -e "${YELLOW}Note: Fastify will listen on port 443. Make sure your Hetzner firewall allows traffic on this port.${NC}"
echo ""
echo -e "${GREEN}📋 DNS & SSL Setup:${NC}"
echo ""
echo "1. In Netlify DNS, add an A record:"
echo "   - Name: api"
echo "   - Value: <your-hetzner-server-ip>"
echo ""
echo "2. After DNS propagates (5-10 min), see: backend/scripts/DNS_SSL_SETUP.md"
echo "   for detailed SSL certificate setup instructions."
echo ""