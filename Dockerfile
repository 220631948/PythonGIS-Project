# Builder stage
FROM python:3.11-slim-bullseye AS builder

# Update apt packages and install system dependencies
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy only requirements.txt first for layer caching
COPY requirements.txt .

# Install python packages using pip install with no-cache-dir and user flags
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim-bullseye AS runtime

# Support passing a release value at build time
ARG SENTRY_RELEASE=""
ARG SENTRY_ENVIRONMENT="production"
ENV SENTRY_RELEASE=${SENTRY_RELEASE}
ENV SENTRY_ENVIRONMENT=${SENTRY_ENVIRONMENT}

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal28 \
    libgeos-c1v5 \
    libproj19 \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user geohub
RUN useradd -m -u 1000 geohub

# Create app directory and data slash cache subdirectory
RUN mkdir -p /app/data/cache

# Set ownership to geohub user
RUN chown -R geohub:geohub /app

WORKDIR /app

# Copy python packages from builder
COPY --from=builder /root/.local /home/geohub/.local

# Update PATH environment variable
ENV PATH=/home/geohub/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Copy application code setting ownership to geohub
COPY --chown=geohub:geohub . .

# Switch to geohub user
USER geohub

# Add healthcheck calling lightweight API endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

EXPOSE 8000

# Default CMD runs gunicorn serving app.main:app
CMD ["gunicorn", "app.main:app", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--timeout", "120"]
