#!/usr/bin/env bash
set -euo pipefail

echo "🚀 OpenClaw Automation: Cape Town GeoHub Deployment"
echo "=================================================="
echo ""

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# 1. Check Docker availability
echo "📦 Checking Docker..."
if ! command_exists docker; then
  echo "❌ Docker not found. Please install Docker first."
  exit 1
fi

if ! docker ps >/dev/null 2>&1; then
  echo "⚠️  Docker daemon not running. Attempting to start..."
  if command_exists systemctl; then
    sudo systemctl start docker || true
  fi
  sleep 3
fi

# 2. Verify Docker is operational
if ! docker ps >/dev/null 2>&1; then
  echo "❌ Docker daemon still not accessible."
  echo "   Please start Docker Desktop or run: sudo systemctl start docker"
  echo ""
  echo "⚠️  Falling back to Frontend-Only checks..."
  
  if [ -d "frontend" ]; then
      echo "📦 Building Frontend..."
      cd frontend && npm run build
      echo "✅ Frontend Build Complete"
      echo "   To serve locally: cd frontend && npm run preview"
  else
      echo "❌ Frontend directory not found."
  fi
  
  exit 1
fi

echo "✅ Docker is running"
echo ""

# 3. Deploy production stack
echo "🐳 Deploying production stack..."
cd "$(dirname "$0")/.."
docker compose -f docker-compose.prod.yml up -d

# 4. Wait for services
echo "⏳ Waiting for services to initialize..."
sleep 10

# 5. Health check
echo "🏥 Running health checks..."
if curl -sf http://localhost/api/health >/dev/null 2>&1; then
  echo "✅ API Gateway: OK"
else
  echo "⚠️  API Gateway: Not ready yet"
fi

if curl -sf http://localhost:80 >/dev/null 2>&1; then
  echo "✅ Frontend: OK"
else
  echo "⚠️  Frontend: Not ready yet"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📍 Access Points:"
echo "   Frontend: http://localhost"
echo "   API Docs: http://localhost/api/docs"
echo "   Health:   http://localhost/api/health"
echo ""
echo "📊 View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop:      docker compose -f docker-compose.prod.yml down"
