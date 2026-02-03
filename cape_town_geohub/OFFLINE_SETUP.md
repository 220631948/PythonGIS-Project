# Offline Setup Guide

## Overview
The Cape Town GeoHub is designed with an offline-first architecture. This allows the application to function in environments with limited or no internet connectivity after the initial setup.

## Prerequisites
- Docker
- Docker Compose
- Minimum 10 GB disk space
- Initial internet connection for setup

## Setup Steps
1. **Clone repository**
   ```bash
   git clone <repository_url>
   cd cape_town_geohub
   ```

2. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

3. **Edit .env**
   Edit `.env` to set passwords and other configuration variables.

4. **Build containers**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

5. **Download spatial datasets**
   ```bash
   docker-compose -f docker-compose.prod.yml exec api python scripts/download_scripts.py
   ```

6. **Verify downloads**
   ```bash
   ./scripts/verify_downloads.sh
   ```

7. **Load data into PostGIS**
   ```bash
   docker-compose -f docker-compose.prod.yml exec api python scripts/load_spatial_data.py
   ```

8. **Verify database**
   ```bash
   docker-compose -f docker-compose.prod.yml exec db psql -U geohub -d geohub_db -c "\dt"
   ```

9. **Test offline capability**
   Disconnect from the internet and restart the application to ensure it functions correctly.

## Data Storage Locations
- **Database location:** `postgres_data` (Estimate: 5GB)
- **Cached GeoJSON location:** `data/cache` (Estimate: 1GB)
- **Raw downloads location:** `data/raw` (Estimate: 2GB)

## Backup Strategy
- **Database backup:**
  ```bash
  docker-compose -f docker-compose.prod.yml exec db pg_dump -U geohub geohub_db > backups/geohub_db_$(date +%Y%m%d).sql
  ```

- **Data cache backup:**
  ```bash
  tar -czvf backups/data_cache_$(date +%Y%m%d).tar.gz data/cache
  ```

## Troubleshooting
- **Container startup failures:**
  Check logs using `docker-compose -f docker-compose.prod.yml logs`

- **Data loading problems:**
  Check disk space and permissions. Ensure `data` directory is writable.

- **Performance issues:**
  Monitor resources using `docker stats`. Adjust Docker memory settings if necessary.

## Production Deployment
To deploy in production, run:
```bash
docker-compose -f docker-compose.prod.yml up -d
```
