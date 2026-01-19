#!/bin/bash

# Server Setup Script for Auto-Update
# This script sets up the update server directory and Nginx configuration

set -e

echo "========================================="
echo "Setting up Auto-Update Server"
echo "========================================="

# 1. Create update directory
echo "📁 Creating update directory..."
sudo mkdir -p /var/www/ytrc-updates
sudo chown admin:admin /var/www/ytrc-updates
sudo chmod 755 /var/www/ytrc-updates
echo "✅ Update directory created: /var/www/ytrc-updates"

# 2. Backup existing Nginx config
echo "💾 Backing up Nginx configuration..."
sudo cp /etc/nginx/conf.d/app.ytrc.co.th.conf /etc/nginx/conf.d/app.ytrc.co.th.conf.backup.$(date +%Y%m%d_%H%M%S) || true

# 3. Copy new Nginx config
echo "📝 Updating Nginx configuration..."
sudo cp /home/admin/Desktop/Desktop-NestJS/nginx_app_production.conf /etc/nginx/conf.d/app.ytrc.co.th.conf

# 4. Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# 5. Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "========================================="
echo "✅ Server Setup Complete!"
echo "========================================="
echo "Update directory: /var/www/ytrc-updates"
echo "Update URL: https://app.ytrc.co.th/updates/"
echo ""
echo "Verify setup:"
echo "  curl -I https://app.ytrc.co.th/updates/"
echo "========================================="
