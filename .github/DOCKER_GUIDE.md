# Docker Setup Guide

Cape Town GeoHub uses Docker for consistent development and production deployments. This guide covers all Docker configurations and their usage.

## Quick Start

### Development
```bash
# Start all services in development mode
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Production
```bash
# Build and start production services
docker compose -f docker-compose.prod.yml up -d

# Check service health
docker compose -f docker-compose.prod.yml ps
```

## Docker Compose Files

### Development: `compose.yaml`

**Purpose:** Local development with hot reload and debugging capabilities

**Features:**
- Hot reload for both backend and frontend
- Volume mounts for live code updates
- Exposed ports for debugging
- Development-optimized images
- PostGIS with initialization scripts

**Services:**
- `db` - PostgreSQL with PostGIS (kartoza/postgis:15-3.4) on port 5432
- `api` - FastAPI backend with uvicorn reload on port 8000
- `frontend` - Vite dev server with HMR on port 5173

**Usage:**
```bash
# Start development environment
docker compose up -d

# Rebuild after dependency changes
docker compose build api frontend

# View specific service logs
docker compose logs -f api

# Access database
docker compose exec db psql -U geohub -d geohub_db

# Run backend tests
docker compose exec api pytest tests/ -v

# Install frontend dependencies
docker compose exec frontend npm install
```

**Environment Variables:**
- `POSTGRES_USER` - Database username (required)
- `POSTGRES_PASSWORD` - Database password (required)
- `POSTGRES_DB` - Database name (required)
- `SENTRY_DSN` - Optional Sentry DSN
- `ADMIN_API_KEY` - Optional admin API key

### Production: `docker-compose.prod.yml`

**Purpose:** Production deployment with optimized images and minimal attack surface

**Features:**
- Production-optimized builds
- Minimal volume mounts (read-only cache)
- No exposed database port
- Health checks for all services
- Automatic restart policies
- Separate network isolation

**Services:**
- `db` - PostgreSQL with PostGIS (kartoza/postgis:15-3.4)
- `api` - FastAPI backend (production build)
- `frontend` - Nginx serving static React build on port 80

**Usage:**
```bash
# Build and start production services
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Check service health
docker compose -f docker-compose.prod.yml ps

# View production logs
docker compose -f docker-compose.prod.yml logs -f

# Stop production services
docker compose -f docker-compose.prod.yml down

# Backup database
docker compose -f docker-compose.prod.yml exec db pg_dump -U geohub -d geohub_db > backup.sql
```

**Environment Variables:**
- `POSTGRES_USER` - Database username (required)
- `POSTGRES_PASSWORD` - Database password (required)
- `POSTGRES_DB` - Database name (required)
- `DATABASE_URL` - Full database connection URL (required)

### Blue-Green Deployment: `.infrastructure/docker/`

**Purpose:** Zero-downtime production deployments using blue-green strategy

**Files:**
- `docker-compose.blue.yml` - Blue environment (port 8001)
- `docker-compose.green.yml` - Green environment (port 8002)

**Features:**
- Pre-built images from GitHub Container Registry
- Separate data volumes for isolation
- External network for load balancer integration
- Health checks for traffic routing decisions
- Structured logging with rotation

**Usage:**
```bash
# Deploy to blue environment
cd .infrastructure/docker
docker compose -f docker-compose.blue.yml up -d

# Verify blue is healthy
curl http://localhost:8001/health

# Deploy to green environment
docker compose -f docker-compose.green.yml up -d

# Switch traffic (via load balancer)
# ... update load balancer config ...

# Teardown old environment
docker compose -f docker-compose.blue.yml down
```

**Environment Variables:**
- `GITHUB_REPOSITORY` - GitHub repository for image pulls
- `PRODUCTION_DATABASE_URL` - Production database URL
- `SECRET_KEY` - JWT secret key
- `SENTRY_DSN` - Sentry DSN for error tracking
- `GIT_SHA` - Commit SHA for version tracking

## Dockerfiles

### Backend: `Dockerfile`

**Purpose:** Production-optimized FastAPI application

**Features:**
- Multi-stage build for smaller image size
- Python 3.11 slim base
- GDAL and spatial dependencies
- Non-root user for security
- Health check endpoint

**Build:**
```bash
docker build -t geohub-api:latest .
```

**Run:**
```bash
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/geohub \
  geohub-api:latest
```

### Frontend Production: `frontend/Dockerfile`

**Purpose:** Production-optimized React application served by Nginx

**Features:**
- Multi-stage build (Node for build, Nginx for serving)
- Static asset optimization
- Nginx configuration for SPA routing
- Security headers
- Gzip compression

**Build:**
```bash
cd frontend
docker build -t geohub-frontend:latest .
```

**Run:**
```bash
docker run -p 80:80 geohub-frontend:latest
```

### Frontend Development: `frontend/Dockerfile.dev`

**Purpose:** Development environment with hot module replacement

**Features:**
- Node 20 slim base
- Volume mounts for live updates
- Vite dev server
- Development dependencies included

**Build:**
```bash
cd frontend
docker build -f Dockerfile.dev -t geohub-frontend:dev .
```

## PostGIS Configuration

All configurations use `kartoza/postgis:15-3.4` for consistent spatial database capabilities.

**Features:**
- PostgreSQL 15
- PostGIS 3.4
- Optimized for spatial queries
- Automatic PostGIS extension installation

**Customization:**

Create `scripts/init_db/` directory with SQL scripts for automatic execution:

```sql
-- scripts/init_db/01_extensions.sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- scripts/init_db/02_indexes.sql
-- Add spatial indexes, etc.
```

## Networking

### Development Network: `geohub-network`
- Bridge driver
- All services can communicate by service name
- Database accessible at `db:5432`
- API accessible at `api:8000`

### Production Network: `geohub-prod`
- Bridge driver
- Database not exposed externally
- Only frontend exposed on port 80

### Blue-Green Network: `geohub-network` (external)
- External network for load balancer integration
- Managed outside Docker Compose
- Create with: `docker network create geohub-network`

## Volumes

### Development
- `postgres_data` - PostgreSQL data persistence
- Volume mounts for live code updates

### Production
- `postgres_data_prod` - PostgreSQL data persistence
- `./data/cache:/app/data/cache:ro` - Read-only cache
- `./backups:/backups` - Database backups

### Blue-Green
- `geohub-data-blue` - Blue environment data
- `geohub-data-green` - Green environment data
- `geohub-logs-blue` - Blue environment logs
- `geohub-logs-green` - Green environment logs

## Health Checks

All configurations include health checks for monitoring:

**Database:**
```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "geohub"]
  interval: 10s
  timeout: 5s
  retries: 5
```

**Backend:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Environment Files

Create `.env` file in project root:

```bash
# Database
POSTGRES_USER=geohub
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=geohub_db

# Database URL for application
DATABASE_URL=postgresql+asyncpg://geohub:secure_password_here@db:5432/geohub_db

# API Configuration
ADMIN_API_KEY=your_admin_key_here
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Frontend (Optional)
VITE_API_URL=http://localhost:8000
VITE_MAP_CENTER=-33.9249,18.4241
VITE_MAP_ZOOM=12
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/frontend-project-id
```

## Common Tasks

### Database Migrations
```bash
# Run migrations in development
docker compose exec api alembic upgrade head

# Create new migration
docker compose exec api alembic revision --autogenerate -m "description"

# Rollback migration
docker compose exec api alembic downgrade -1
```

### Testing
```bash
# Backend tests
docker compose exec api pytest tests/ -v --cov=app

# Frontend tests
docker compose exec frontend npm test

# E2E tests
docker compose exec frontend npm run test:e2e
```

### Logs & Debugging
```bash
# Follow all logs
docker compose logs -f

# Follow specific service
docker compose logs -f api

# Last 100 lines
docker compose logs --tail=100 api

# Check container stats
docker stats geohub_api geohub_frontend geohub_postgis
```

### Database Operations
```bash
# Connect to database
docker compose exec db psql -U geohub -d geohub_db

# Backup database
docker compose exec db pg_dump -U geohub -d geohub_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
gunzip -c backup_20260212.sql.gz | docker compose exec -T db psql -U geohub -d geohub_db

# Run SQL file
docker compose exec -T db psql -U geohub -d geohub_db < script.sql
```

### Cleanup
```bash
# Stop and remove containers, networks
docker compose down

# Also remove volumes (CAUTION: deletes data)
docker compose down -v

# Remove all unused images, containers, volumes
docker system prune -a --volumes

# Clean build cache
docker builder prune -a
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs api

# Check service status
docker compose ps

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Database connection issues
```bash
# Verify database is running
docker compose exec db pg_isready -U geohub

# Check environment variables
docker compose exec api env | grep DATABASE_URL

# Test connection
docker compose exec db psql -U geohub -d geohub_db -c "SELECT version();"
```

### Permission issues
```bash
# Fix volume permissions (if needed)
sudo chown -R 1000:1000 ./data

# Check container user
docker compose exec api whoami
```

### Frontend can't reach backend
```bash
# Verify API is running
curl http://localhost:8000/health

# Check network connectivity
docker compose exec frontend curl http://api:8000/health

# Verify CORS settings
docker compose exec api env | grep CORS_ORIGINS
```

## Best Practices

1. **Use .env file** - Never hardcode secrets in compose files
2. **Separate concerns** - Use different compose files for dev/prod
3. **Health checks** - Always define health checks for services
4. **Named volumes** - Use named volumes for data persistence
5. **Multi-stage builds** - Optimize image sizes with multi-stage builds
6. **Non-root user** - Run containers as non-root when possible
7. **Resource limits** - Set memory and CPU limits in production
8. **Logging** - Configure log rotation to prevent disk space issues
9. **Networking** - Use internal networks for service-to-service communication
10. **Backups** - Automate database backups in production

## CI/CD Integration

See `.github/workflows/` for automated Docker build and deployment pipelines:
- `ci.yml` - Test builds on pull requests
- `deploy-staging.yml` - Deploy to staging environment
- `deploy-production.yml` - Blue-green production deployment

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostGIS Docker Image](https://hub.docker.com/r/kartoza/postgis)
- [FastAPI Docker Guide](https://fastapi.tiangolo.com/deployment/docker/)
- [Vite Docker Guide](https://vitejs.dev/guide/static-deploy.html)
