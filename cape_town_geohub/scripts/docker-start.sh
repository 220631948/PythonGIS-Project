#!/bin/bash

# Cape Town GeoHub - Docker Starter Script

echo "🌍 Starting Cape Town GeoHub..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker Desktop/Daemon."
  exit 1
fi

echo "🚀 Building and starting containers..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo "✅ Containers started successfully!"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:8000/api/docs"
    echo "   - Logs: 'docker-compose logs -f'"
else
    echo "❌ Failed to start containers."
fi
