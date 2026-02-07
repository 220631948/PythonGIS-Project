import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import time
import json
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
# httpx import removed as it is no longer used in proxy_data

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
    suitability_api,
)

# New enhanced API modules
from app.api import geocode_api, temporal_api, network_api, reports_api, filter_api

# Advanced feature API modules
from app.api import (
    collaboration_api,
    export_api,
    field_data_api,
    metadata_api,
    advanced_analysis_api,
    realtime_api,
    data_status_api,
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
    key_func=get_remote_address, default_limits=["200 per day", "50 per hour"]
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
            logger.warning(
                f"Slow request: {request.method} {request.url.path} took {process_time:.3f}s"
            )

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

# Generic Data Proxy Endpoint (Phase 7.5: System Integration)
# In-memory cache for responses (simple TTL cache)
_response_cache: dict = {}
_cache_timestamps: dict = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def get_cached_response(cache_key: str) -> Optional[dict]:
    """Get cached response if not expired"""
    if cache_key in _response_cache:
        if time.time() - _cache_timestamps.get(cache_key, 0) < CACHE_TTL_SECONDS:
            return _response_cache[cache_key]
        # Expired, remove
        del _response_cache[cache_key]
        del _cache_timestamps[cache_key]
    return None


def set_cached_response(cache_key: str, data: dict):
    """Store response in cache"""
    _response_cache[cache_key] = data
    _cache_timestamps[cache_key] = time.time()


@app.get("/api/data/{dataset_key}")
async def proxy_data(
    dataset_key: str,
    limit: int = Query(
        default=1000, ge=1, le=10000, description="Max features to return"
    ),
    offset: int = Query(default=0, ge=0, description="Number of features to skip"),
    use_cache: bool = Query(
        default=True, description="Use cached response if available"
    ),
):
    """
    Smart Data Proxy & Domain Intelligence Endpoint with Pagination.

    1. Fetches data via DataLoader (Handles ZIP, CRS, Caching)
    2. Applies Domain Intelligence (Safety Merging, Transport Optimization)
    3. Returns paginated GeoJSON

    Pagination: Use limit/offset to page through large datasets.
    """
    import re
    from app.core.data_loader import data_loader
    from app.spatial_analysis.safety import safety_analyzer
    from app.spatial_analysis.transport import transport_optimizer
    from app.config import settings

    # Validate dataset_key against injection (alphanumeric + underscores only)
    if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]{0,62}$", dataset_key):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid dataset key: '{dataset_key}'. Only letters, digits, and underscores allowed.",
        )

    if dataset_key not in settings.DATA_URLS and dataset_key != "safety_precincts":
        raise HTTPException(
            status_code=404,
            detail=f"Dataset '{dataset_key}' not found. Available: {list(settings.DATA_URLS.keys())} + ['safety_precincts']",
        )

    # Check cache first
    cache_key = f"{dataset_key}:{limit}:{offset}"
    if use_cache:
        cached = get_cached_response(cache_key)
        if cached:
            return JSONResponse(
                content=cached,
                headers={
                    "X-Cache": "HIT",
                    "Cache-Control": "public, max-age=300",
                },
            )

    try:
        # Domain Intelligence Logic

        # 1. Transport Domain - Optimize Routes
        if dataset_key == "myciti_routes":
            gdf = data_loader.get_gdf(dataset_key)
            optimized = transport_optimizer.optimize_routes(gdf)
            # Apply pagination
            total = len(optimized)
            paginated = optimized.iloc[offset : offset + limit]
            result = {
                "type": "FeatureCollection",
                "features": json.loads(paginated.to_json())["features"],
                "metadata": {
                    "total": total,
                    "limit": limit,
                    "offset": offset,
                    "returned": len(paginated),
                },
            }
            set_cached_response(cache_key, result)
            return JSONResponse(
                content=result,
                headers={
                    "X-Optimization": "TransportOptimizer",
                    "X-Cache": "MISS",
                    "Cache-Control": "public, max-age=86400",
                },
            )

        # 2. Safety Domain - Merge Precincts with Stats
        elif dataset_key == "safety_precincts":
            try:
                precincts = data_loader.get_gdf("precincts")
                stats = data_loader.load_csv("crime_stats")
                merged = safety_analyzer.merge_stats_with_precincts(precincts, stats)
                # Apply pagination
                total = len(merged)
                paginated = merged.iloc[offset : offset + limit]
                result = {
                    "type": "FeatureCollection",
                    "features": json.loads(paginated.to_json())["features"],
                    "metadata": {
                        "total": total,
                        "limit": limit,
                        "offset": offset,
                        "returned": len(paginated),
                    },
                }
                set_cached_response(cache_key, result)
                return JSONResponse(
                    content=result,
                    headers={
                        "X-Merged": "SafetyAnalyzer",
                        "X-Cache": "MISS",
                        "Cache-Control": "public, max-age=86400",
                    },
                )
            except Exception as e:
                logger.error(f"Safety domain error: {e}. Falling back to boundaries.")
                precincts = data_loader.get_gdf("precincts")
                total = len(precincts)
                paginated = precincts.iloc[offset : offset + limit]
                return JSONResponse(
                    content={
                        "type": "FeatureCollection",
                        "features": json.loads(paginated.to_json())["features"],
                        "metadata": {
                            "total": total,
                            "limit": limit,
                            "offset": offset,
                            "returned": len(paginated),
                        },
                    }
                )

        # 3. Default Path - Smart Loader with Pagination
        # Optimized with direct DB pagination
        gdf, total = data_loader.get_paginated_gdf(
            dataset_key, limit=limit, offset=offset
        )

        result = {
            "type": "FeatureCollection",
            "features": json.loads(gdf.to_json())["features"],
            "metadata": {
                "total": total,
                "limit": limit,
                "offset": offset,
                "returned": len(gdf),
                "has_more": offset + limit < total,
            },
        }
        set_cached_response(cache_key, result)

        return JSONResponse(
            content=result,
            headers={
                "Cache-Control": f"public, max-age={settings.CACHE_DURATION_DAYS * 86400}",
                "X-Data-Source": "City of Cape Town",
                "X-Loader-Version": "v2",
                "X-Cache": "MISS",
                "X-Total-Count": str(total),
            },
        )

    except Exception as e:
        logger.error(f"Smart proxy error for {dataset_key}: {e}")
        # Improve error messages for known types
        status = 500
        if "timeout" in str(e).lower():
            status = 504
        elif "not found" in str(e).lower():
            status = 404

        raise HTTPException(status_code=status, detail=str(e))


# Health check (Enhanced - validates database connectivity)
@app.get("/health")
async def health_check_simple():
    from app.core.database import check_db_connection

    db_status = await check_db_connection()
    if not db_status["connected"]:
        return JSONResponse(
            status_code=503,
            content={
                "status": "partial_outage",
                "database": "disconnected",
                "error": db_status["error"],
            },
        )
    return {"status": "online", "database": "connected", "version": "1.0.0"}


# Detailed System Health check
@app.get("/api/health")
async def health_check():
    import psutil

    # System information
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": time.time(),
        "uptime": time.time() - getattr(app.state, "start_time", time.time()),
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
            },
            "disk": {"total": disk.total, "free": disk.free, "percent": disk.percent},
        },
        "requests": {
            "total": sum(request_stats.values()),
            "by_method": dict(request_stats),
        },
        "errors": {"total": sum(error_stats.values()), "by_type": dict(error_stats)},
    }


# System monitoring endpoints
@app.get("/api/stats")
async def get_system_stats():
    """Get detailed system statistics"""
    return {
        "request_stats": dict(request_stats),
        "error_stats": dict(error_stats),
        "timestamp": time.time(),
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
        "port": settings.PORT,
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
    app.mount(
        "/assets",
        StaticFiles(directory=str(settings.STATIC_DIR / "assets")),
        name="assets",
    )

# Icons for PWA
if (settings.STATIC_DIR / "icons").exists():
    app.mount(
        "/icons",
        StaticFiles(directory=str(settings.STATIC_DIR / "icons")),
        name="icons",
    )


# SPA Fallback
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    index_file = settings.STATIC_DIR / "index.html"
    if not index_file.exists():
        return JSONResponse(
            status_code=503,
            content={
                "error": "Frontend not built. Run 'npm run build' in the frontend directory."
            },
        )
    return FileResponse(index_file)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=settings.WORKERS,
    )
