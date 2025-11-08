#!/bin/bash

# Nginx + SSL (Let's Encrypt) Setup Script for appexit.jp
# This script should be run on the EC2 instance as root or with sudo

set -e  # Exit on error

echo "========================================="
echo "appexit.jp Nginx + SSL Setup"
echo "========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Configuration
DOMAIN="appexit.jp"
EMAIL="your-email@example.com"  # Change this to your email
BACKEND_PORT=8080
FRONTEND_PORT=3000

echo -e "${YELLOW}Please enter your email address for Let's Encrypt notifications:${NC}"
read -p "Email: " EMAIL

if [[ -z "$EMAIL" ]]; then
    echo -e "${RED}Email is required${NC}"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  Domain: $DOMAIN"
echo "  Email: $EMAIL"
echo "  Backend Port: $BACKEND_PORT"
echo "  Frontend Port: $FRONTEND_PORT"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Update system and install Nginx
echo -e "${GREEN}Step 1: Installing Nginx...${NC}"
apt-get update
apt-get install -y nginx

# Step 2: Install Certbot for Let's Encrypt
echo -e "${GREEN}Step 2: Installing Certbot...${NC}"
apt-get install -y certbot python3-certbot-nginx

# Step 3: Create certbot webroot directory
echo -e "${GREEN}Step 3: Creating certbot directories...${NC}"
mkdir -p /var/www/certbot

# Step 4: Create temporary Nginx config for initial certificate
echo -e "${GREEN}Step 4: Creating temporary Nginx configuration...${NC}"
cat > /etc/nginx/sites-available/appexit.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name appexit.jp www.appexit.jp;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Nginx is running. SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/appexit.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

echo -e "${GREEN}Step 5: Obtaining SSL certificate from Let's Encrypt...${NC}"
echo -e "${YELLOW}This may take a minute...${NC}"

# Obtain certificate
certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to obtain SSL certificate${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo "  1. DNS is properly configured (appexit.jp -> EC2 IP)"
    echo "  2. Port 80 is open in security group"
    echo "  3. Domain ownership is verified"
    exit 1
fi

echo -e "${GREEN}Step 6: Installing final Nginx configuration...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NGINX_CONF="$SCRIPT_DIR/nginx/appexit.conf"

if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" /etc/nginx/sites-available/appexit.conf
else
    echo -e "${RED}Warning: nginx/appexit.conf not found in $SCRIPT_DIR${NC}"
    echo "Using embedded configuration..."

    cat > /etc/nginx/sites-available/appexit.conf << 'EOFNGINX'
server {
    listen 80;
    listen [::]:80;
    server_name appexit.jp www.appexit.jp;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name appexit.jp www.appexit.jp;

    ssl_certificate /etc/letsencrypt/live/appexit.jp/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appexit.jp/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 20M;

    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    access_log /var/log/nginx/appexit_access.log;
    error_log /var/log/nginx/appexit_error.log;
}
EOFNGINX
fi

# Test Nginx configuration
echo -e "${GREEN}Step 7: Testing Nginx configuration...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}Nginx configuration test failed${NC}"
    exit 1
fi

# Reload Nginx
echo -e "${GREEN}Step 8: Reloading Nginx...${NC}"
systemctl reload nginx

# Enable Nginx to start on boot
systemctl enable nginx

# Step 9: Setup automatic certificate renewal
echo -e "${GREEN}Step 9: Setting up automatic certificate renewal...${NC}"

# Test renewal
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Certificate renewal test successful${NC}"

    # Add cron job for automatic renewal (runs twice daily)
    CRON_CMD="0 0,12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'"
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -

    echo -e "${GREEN}Automatic renewal configured${NC}"
else
    echo -e "${YELLOW}Warning: Certificate renewal test failed${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Your site is now configured with SSL:"
echo "  - Frontend: https://appexit.jp"
echo "  - Backend API: https://appexit.jp/api"
echo ""
echo "Next steps:"
echo "  1. Update your backend ALLOWED_ORIGINS environment variable"
echo "  2. Update your frontend API_URL to use https://appexit.jp/api"
echo "  3. Restart your backend and frontend services"
echo ""
echo "To check Nginx status:"
echo "  sudo systemctl status nginx"
echo ""
echo "To view logs:"
echo "  sudo tail -f /var/log/nginx/appexit_access.log"
echo "  sudo tail -f /var/log/nginx/appexit_error.log"
echo ""
echo -e "${YELLOW}Important: Make sure your backend (port $BACKEND_PORT) and frontend (port $FRONTEND_PORT) are running!${NC}"
echo ""
