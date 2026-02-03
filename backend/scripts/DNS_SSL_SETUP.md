# DNS & SSL Setup Guide for api-progeny.odin-matthias.de

This guide explains how to point your Netlify domain to your Hetzner server and set up SSL certificates.

## Step 1: Configure DNS in Netlify

1. Log in to your Netlify account
2. Go to your domain settings for `odin-matthias.de`
3. Navigate to **DNS** settings
4. Add a new **A record**:
   - **Name**: `api`
   - **Value**: `<your-hetzner-server-ip>` (e.g., `123.45.67.89`)
   - **TTL**: Auto (or 3600)
5. Save the DNS record

**Note**: DNS propagation can take 5-10 minutes. You can check if it's ready by running:
```bash
dig api-progeny.odin-matthias.de
# or
nslookup api-progeny.odin-matthias.de
```

## Step 2: Get Your Server's IP Address

If you don't know your Hetzner server's IP address:
```bash
curl ifconfig.me
# or
hostname -I
```

## Step 3: Set Up SSL Certificate

Once DNS has propagated (wait 5-10 minutes after adding the DNS record):

1. **SSH into your server**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Stop the backend** (if running):
   ```bash
   sudo su - progeny
   pm2 stop progeny-backend
   exit
   ```

3. **Get SSL certificate from Let's Encrypt**:
   ```bash
   sudo certbot certonly --standalone -d api-progeny.odin-matthias.de
   ```
   
   - Follow the prompts
   - Enter your email address when asked
   - Agree to the terms of service
   - Certbot will verify domain ownership and issue the certificate

4. **Set proper permissions** so the `progeny` user can read the certificates:
   ```bash
   sudo chmod 755 /etc/letsencrypt/live
   sudo chmod 755 /etc/letsencrypt/archive
   sudo chmod 644 /etc/letsencrypt/live/api-progeny.odin-matthias.de/fullchain.pem
   sudo chmod 644 /etc/letsencrypt/live/api-progeny.odin-matthias.de/privkey.pem
   ```

5. **Update your `.env` file**:
   ```bash
   sudo su - progeny
   cd /opt/progeny/backend
   vi .env
   ```
   
   Uncomment and set these lines:
   ```env
   SSL_CERT_PATH=/etc/letsencrypt/live/api-progeny.odin-matthias.de/fullchain.pem
   SSL_KEY_PATH=/etc/letsencrypt/live/api-progeny.odin-matthias.de/privkey.pem
   ```

6. **Restart the backend**:
   ```bash
   pm2 restart progeny-backend
   pm2 logs progeny-backend
   ```

7. **Test HTTPS**:
   ```bash
   curl https://api-progeny.odin-matthias.de/health
   ```

## Step 4: Set Up Auto-Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

1. **Test renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```

2. **Set up automatic renewal** (certbot usually sets this up automatically, but verify):
   ```bash
   sudo systemctl status certbot.timer
   ```

   If it's not running:
   ```bash
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer
   ```

3. **Create a renewal hook** to restart the backend after certificate renewal:
   ```bash
   sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
   sudo vi /etc/letsencrypt/renewal-hooks/deploy/restart-progeny.sh
   ```
   
   Add this content:
   ```bash
   #!/bin/bash
   sudo -u progeny pm2 restart progeny-backend
   ```
   
   Make it executable:
   ```bash
   sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/restart-progeny.sh
   ```

## Troubleshooting

### DNS not resolving
- Wait 5-10 minutes for DNS propagation
- Check DNS with: `dig api-progeny.odin-matthias.de`
- Verify the A record in Netlify DNS settings

### Certificate generation fails
- Make sure DNS is fully propagated
- Ensure port 80 is open (certbot needs it for verification)
- Stop the backend before running certbot (it needs to bind to port 80)

### Permission denied reading certificates
- Run the chmod commands from Step 3.4
- Verify the paths are correct in your `.env` file

### HTTPS not working
- Check that SSL_CERT_PATH and SSL_KEY_PATH are set in `.env`
- Verify the certificate files exist at those paths
- Check PM2 logs: `pm2 logs progeny-backend`
- Ensure port 443 is open in your Hetzner firewall
