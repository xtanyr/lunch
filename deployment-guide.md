# Deployment Guide for xtany.ru

## Server Information
- **Server IP**: 158.160.136.51
- **Domain**: xtany.ru
- **Target URL**: http://xtany.ru

## Step 1: Configure DNS Records

You need to configure DNS records to point your domain to your server. Since your domain is currently parked at Timeweb, you need to:

1. **Log into your domain registrar** (where you bought xtany.ru)
2. **Add/Update DNS records**:

   **A Record (Root Domain):**
   - Name: `@` (or leave empty)
   - Value: `158.160.136.51`
   - TTL: 300 (or default)

   **A Record (WWW Subdomain):**
   - Name: `www`
   - Value: `158.160.136.51`
   - TTL: 300

## Step 2: SSH into Your Server

```bash
ssh root@158.160.136.51
```

## Step 3: Ensure Your Node.js App is Running

```bash
# Navigate to your app directory
cd /path/to/your/lunch/app

# Check if server is running
ps aux | grep node

# If not running, start it
node server.js

# Or run it in background with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name "lunch-app"
pm2 startup
pm2 save
```

## Step 4: Configure Nginx

### Option A: Use the setup script
```bash
# Upload setup-nginx.sh to your server
chmod +x setup-nginx.sh
sudo ./setup-nginx.sh
```

### Option B: Manual configuration
```bash
# Backup default config
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Edit the default config
nano /etc/nginx/sites-available/default
```

Replace the content with:
```nginx
server {
    listen 80;
    server_name xtany.ru www.xtany.ru;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy all requests to Node.js server
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
    }

    # Handle API requests specifically
    location /orders {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

## Step 5: Test and Restart Nginx

```bash
# Test configuration
nginx -t

# If test passes, restart nginx
systemctl restart nginx
systemctl enable nginx
```

## Step 6: Verify Everything Works

1. **Check if your app is accessible locally:**
   ```bash
   curl http://localhost:3001
   ```

2. **Check nginx status:**
   ```bash
   systemctl status nginx
   ```

3. **Test domain resolution:**
   ```bash
   nslookup xtany.ru
   ```

4. **Visit your domain:** http://xtany.ru

## Troubleshooting

### If you still see nginx welcome page:
1. Check if Node.js server is running: `ps aux | grep node`
2. Check nginx error logs: `tail -f /var/log/nginx/error.log`
3. Verify nginx config: `nginx -t`

### If domain doesn't resolve:
1. DNS propagation can take up to 48 hours
2. Check DNS records with: `dig xtany.ru`
3. Verify your registrar's DNS settings

### If you get connection refused:
1. Check firewall: `ufw status`
2. Ensure port 80 is open: `ufw allow 80`
3. Check if nginx is listening: `netstat -tlnp | grep :80`

## SSL Certificate (Optional but Recommended)

For HTTPS, you can add Let's Encrypt SSL:

```bash
# Install certbot
apt update
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d xtany.ru -d www.xtany.ru

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Final Notes

- Your app will be accessible at: http://xtany.ru
- The API endpoints will be at: http://xtany.ru/orders
- Make sure your Node.js server is running on port 3001
- Consider setting up PM2 for process management
- Monitor logs regularly: `tail -f /var/log/nginx/access.log`

## TypeScript Linter Errors

If you encounter TypeScript linter errors, you can install the necessary type declarations:

```bash
npm install --save-dev @types/react @types/react-dom
``` 