#!/bin/bash

# Nginx setup script for lunch app
# Run this on your server as root

echo "Setting up nginx for lunch app..."

# Backup default nginx config
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create new nginx config
cat > /etc/nginx/sites-available/lunch-app << 'EOF'
server {
    listen 80;
    server_name _;  # This will match any domain

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
EOF

# Disable default site and enable lunch app
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/lunch-app /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid. Restarting nginx..."
    systemctl restart nginx
    systemctl enable nginx
    echo "Nginx setup complete!"
    echo "Your app should now be accessible at your domain."
else
    echo "Nginx configuration test failed. Please check the configuration."
    exit 1
fi 