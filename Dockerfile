# Builder Stage
FROM python:3.11-slim-bullseye AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy requirements file
COPY cape_town_geohub/requirements.txt .

# Install python packages
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime Stage
FROM python:3.11-slim-bullseye AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal30 \
    libgeos-c1v5 \
    libproj22 \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 geohub

# Create app and data directories
RUN mkdir -p /app/data/cache && chown -R geohub:geohub /app

WORKDIR /app

# Copy installed python packages from builder
COPY --from=builder /root/.local /home/geohub/.local

# Update PATH
ENV PATH=/home/geohub/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Copy application code
COPY --chown=geohub:geohub cape_town_geohub/ .

# Switch to non-root user
USER geohub

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Default command
CMD ["gunicorn", "app.main:app", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--timeout", "120"]
