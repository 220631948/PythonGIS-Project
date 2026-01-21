import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.utils.logging_config import setup_logging
from app.core.exceptions import GeoHubException, geohub_exception_handler
from app.api import (
    services_api,
    transport_api,
    safety_api,
    environment_api,
    land_use_api,
    utilities_api,
    spatial_tools_api,
    infrastructure_api,
    portal_api,
    suitability_api
)
# New enhanced API modules
from app.api import (
    geocode_api,
    temporal_api,
    network_api,
    reports_api,
    filter_api
)
# Advanced feature API modules
from app.api import (
    collaboration_api,
    export_api,
    field_data_api,
    metadata_api,
    advanced_analysis_api,
    realtime_api,
    data_status_api
)

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Application state for tracking metrics
app_start_time: float = 0.0

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    Handles startup and shutdown events.
    """
    global app_start_time
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    app_start_time = time.time()
    app.state.start_time = app_start_time
    # Here we could warm up the cache or initialize the data loader
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Consolidated GIS utility for Cape Town urban planning and research.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Exception handlers
app.add_exception_handler(GeoHubException, geohub_exception_handler)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(SlowAPIMiddleware)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
app.state.limiter = limiter

# Global request tracking for monitoring
request_stats = defaultdict(int)
error_stats = defaultdict(int)

@app.middleware("http")
async def enhanced_monitoring_middleware(request: Request, call_next):
    start_time = time.time()

    # Track request
    request_stats[request.method] += 1
    request_stats[f"{request.method}:{request.url.path}"] += 1

    try:
        response = await call_next(request)
        process_time = time.time() - start_time

        # Add performance headers
        response.headers["X-Process-Time"] = f"{process_time:.3f}"
        response.headers["X-API-Version"] = settings.APP_VERSION

        # Log slow requests
        if process_time > 1.0:  # Log requests taking more than 1 second
            logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.3f}s")

        return response
    except Exception as e:
        # Track errors
        error_stats[str(type(e).__name__)] += 1
        error_stats[f"{request.method}:{request.url.path}"] += 1

        # Log errors
        logger.error(f"Request error: {request.method} {request.url.path} - {str(e)}")
        raise

# Rate limiting exception handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include API routers
app.include_router(services_api.router, prefix=settings.API_PREFIX)
app.include_router(transport_api.router, prefix=settings.API_PREFIX)
app.include_router(safety_api.router, prefix=settings.API_PREFIX)
app.include_router(environment_api.router, prefix=settings.API_PREFIX)
app.include_router(land_use_api.router, prefix=settings.API_PREFIX)
app.include_router(utilities_api.router, prefix=settings.API_PREFIX)
app.include_router(spatial_tools_api.router, prefix=settings.API_PREFIX)
app.include_router(infrastructure_api.router, prefix=settings.API_PREFIX)
app.include_router(portal_api.router, prefix=settings.API_PREFIX)
app.include_router(suitability_api.router, prefix=settings.API_PREFIX)

# New enhanced feature routers
app.include_router(geocode_api.router, prefix=settings.API_PREFIX)
app.include_router(temporal_api.router, prefix=settings.API_PREFIX)
app.include_router(network_api.router, prefix=settings.API_PREFIX)
app.include_router(reports_api.router, prefix=settings.API_PREFIX)
app.include_router(filter_api.router, prefix=settings.API_PREFIX)

# Advanced feature routers
app.include_router(collaboration_api.router, prefix=settings.API_PREFIX)
app.include_router(export_api.router, prefix=settings.API_PREFIX)
app.include_router(field_data_api.router, prefix=settings.API_PREFIX)
app.include_router(metadata_api.router, prefix=settings.API_PREFIX)
app.include_router(advanced_analysis_api.router, prefix=settings.API_PREFIX)
app.include_router(realtime_api.router, prefix=settings.API_PREFIX)
app.include_router(data_status_api.router, prefix=settings.API_PREFIX)

# Health check
@app.get("/api/health")
async def health_check():
    import psutil

    # System information
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": time.time(),
        "uptime": time.time() - getattr(app.state, 'start_time', time.time()),
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent
            },
            "disk": {
                "total": disk.total,
                "free": disk.free,
                "percent": disk.percent
            }
        },
        "requests": {
            "total": sum(request_stats.values()),
            "by_method": dict(request_stats)
        },
        "errors": {
            "total": sum(error_stats.values()),
            "by_type": dict(error_stats)
        }
    }

# System monitoring endpoints
@app.get("/api/stats")
async def get_system_stats():
    """Get detailed system statistics"""
    return {
        "request_stats": dict(request_stats),
        "error_stats": dict(error_stats),
        "timestamp": time.time()
    }

@app.post("/api/cache/clear")
async def clear_cache():
    """Clear application cache"""
    try:
        # Clear request stats
        request_stats.clear()
        error_stats.clear()

        # Here you could add cache clearing logic for data_loader, etc.
        logger.info("Cache cleared via API")
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear cache")

@app.get("/api/config")
async def get_config():
    """Get application configuration (safe, non-sensitive info)"""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
        "api_prefix": settings.API_PREFIX,
        "cors_origins": settings.CORS_ORIGINS,
        "host": settings.HOST,
        "port": settings.PORT
    }

# PWA and Static Files
@app.get("/manifest.json")
async def serve_manifest():
    manifest_file = settings.STATIC_DIR / "manifest.json"
    if manifest_file.exists():
        return FileResponse(manifest_file, media_type="application/manifest+json")
    return JSONResponse(status_code=404, content={"error": "Manifest not found"})

@app.get("/sw.js")
async def serve_service_worker():
    sw_file = settings.STATIC_DIR / "sw.js"
    if sw_file.exists():
        return FileResponse(sw_file, media_type="application/javascript")
    return JSONResponse(status_code=404, content={"error": "Service worker not found"})

# Serve static assets
if (settings.STATIC_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(settings.STATIC_DIR / "assets")), name="assets")

# Icons for PWA
if (settings.STATIC_DIR / "icons").exists():
    app.mount("/icons", StaticFiles(directory=str(settings.STATIC_DIR / "icons")), name="icons")

# SPA Fallback
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    
    index_file = settings.STATIC_DIR / "index.html"
    if not index_file.exists():
        return JSONResponse(
            status_code=503, 
            content={"error": "Frontend not built. Run 'npm run build' in the frontend directory."}
        )
    return FileResponse(index_file)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=settings.DEBUG,
        workers=settings.WORKERS
    )
