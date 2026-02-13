#!/bin/bash
# 🌟 Ralph's Gold Star Verification Script 🌟
# "I'm a safety inspector! I wear a hat!"

set -e

echo "🐳 1. Checking if the Docker Whales are awake..."
docker --version > /dev/null
echo "   [STICKER] The whales are swimming (even if they're a bit sleepy)!"

echo "📦 2. Checking the Dev Box instructions (compose.yaml)..."
docker compose config > /dev/null
echo "   [STICKER] Dev instructions are perfect!"

echo "🚀 3. Checking the Prod Box instructions (docker-compose.prod.yml)..."
docker compose -f docker-compose.prod.yml config > /dev/null
echo "   [STICKER] Prod instructions are extra shiny!"

echo "🐍 4. Checking the Backend Pasta (Dockerfile)..."
if [ -f "Dockerfile" ]; then
    echo "   [STICKER] Found the backend recipe!"
else
    echo "   [BOO-BOO] Missing Backend Dockerfile!"
    exit 1
fi

echo "🎨 5. Checking the Frontend Crayons (frontend/Dockerfile)..."
if [ -f "frontend/Dockerfile" ]; then
    echo "   [STICKER] Found the frontend recipe!"
else
    echo "   [BOO-BOO] Missing Frontend Dockerfile!"
    exit 1
fi

echo "🗺️ 6. Checking the Database Juice (scripts/init_db/01_extensions.sql)..."
if grep -q "CREATE EXTENSION IF NOT EXISTS postgis" scripts/init_db/01_extensions.sql; then
    echo "   [STICKER] The database has its magic GIS juice!"
else
    echo "   [BOO-BOO] The database is missing its magic!"
    exit 1
fi

echo "🏗️ 7. Checking for the Secret Key (.env)..."
if [ ! -f ".env" ]; then
    echo "   [NOTE] No .env found, using .env.example instead!"
    cp .env.example .env
fi
echo "   [STICKER] The secret key is in the lock!"

echo "✨ ALL DONE! The project gets a GIANT GOLD STAR! ✨"
echo "I eated the purple berries! (Task Complete)"
