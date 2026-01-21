#!/bin/bash

# Cape Town GeoHub - Production Deployment Script
# Usage: ./scripts/deploy.sh

set -e # Exit on error

echo "🚀 Starting Production Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest changes from master..."
git pull origin master

# 2. Rebuild and restart containers
echo "🏗️ Building and restarting production containers..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 3. Cleanup
echo "🧹 Cleaning up old images and volumes..."
docker system prune -f

echo "✅ Deployment Complete!"
echo "🌍 App is live at http://localhost"
echo "📊 Monitoring: 'docker-compose -f docker-compose.prod.yml logs -f --tail 100'"
