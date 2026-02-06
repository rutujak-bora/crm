#!/bin/bash

# EC2 Frontend Deployment Script
# Run this AFTER uploading the build folder to /home/ubuntu/frontend-build

set -e

echo "=========================================="
echo "Deploying Frontend to Nginx"
echo "=========================================="

# Copy build files to web root
echo "📋 Copying build files to /var/www/html..."
sudo cp -r /home/ubuntu/frontend-build/* /var/www/html/

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Configure Nginx
echo "⚙️  Configuring Nginx..."
sudo tee /etc/nginx/sites-available/default > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    # Serve React Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to FastAPI backend (Optional fallback)
    # This proxies /api to the Backend EC2 IP
    location /api {
        proxy_pass http://13.51.198.102:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
