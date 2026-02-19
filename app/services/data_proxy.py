import json
import re
import logging
from typing import Optional, Union

from fastapi import HTTPException, Response, status
from fastapi.responses import JSONResponse
from cachetools import TTLCache

from app.config import settings
from app.core.data_loader import data_loader
from app.spatial_analysis.safety import safety_analyzer
from app.spatial_analysis.transport import transport_optimizer

logger = logging.getLogger(__name__)

# Bounded in-memory cache with automatic TTL eviction
CACHE_TTL_SECONDS = 300  # 5 minutes
CACHE_MAX_ENTRIES = 256  # Prevent unbounded memory growth
_response_cache: TTLCache = TTLCache(maxsize=CACHE_MAX_ENTRIES, ttl=CACHE_TTL_SECONDS)


class DataProxyService:
    """
    Service for handling data proxy requests with caching and domain intelligence.
    """

    @staticmethod
    def get_cached_response(cache_key: str) -> Optional[Union[dict, str]]:
        """Get cached response if present."""
        return _response_cache.get(cache_key)

    @staticmethod
    def set_cached_response(cache_key: str, data: Union[dict, str]) -> None:
        """Store response in bounded TTL cache."""
        _response_cache[cache_key] = data

    @staticmethod
    def clear_cache() -> int:
        """Clear the cache and return number of entries evicted."""
        count = len(_response_cache)
        _response_cache.clear()
        return count

    @staticmethod
    def get_cache_stats() -> dict:
        """Get cache statistics."""
        return {
            "size": len(_response_cache),
            "maxsize": _response_cache.maxsize,
            "currsize": _response_cache.currsize,
        }

    @classmethod
    async def get_dataset(
        cls,
        dataset_key: str,
        limit: int = 1000,
        offset: int = 0,
        use_cache: bool = True,
    ) -> Response:
        """
        Smart Data Proxy & Domain Intelligence logic.
        """
        # Validate dataset_key
        if not re.match(r"^[a-zA-Z]\w{0,62}$", dataset_key):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid dataset key: '{dataset_key}'. Only letters, digits, and underscores allowed.",
            )

        if dataset_key not in settings.DATA_URLS and dataset_key != "safety_precincts":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{dataset_key}' not found. Available: {list(settings.DATA_URLS.keys())} + ['safety_precincts']",
            )

        # Check cache
        cache_key = f"{dataset_key}:{limit}:{offset}"
        if use_cache:
            cached = cls.get_cached_response(cache_key)
            if cached:
                if isinstance(cached, str):
                    return Response(
                        content=cached,
                        media_type="application/json",
                        headers={
                            "X-Cache": "HIT",
                            "Cache-Control": "public, max-age=300",
                        },
                    )
                return JSONResponse(
                    content=cached,
                    headers={
                        "X-Cache": "HIT",
                        "Cache-Control": "public, max-age=300",
                    },
                )

        try:
            # Domain Intelligence Logic
            if dataset_key == "myciti_routes":
                return cls._handle_transport(dataset_key, limit, offset, cache_key)
            elif dataset_key == "safety_precincts":
                return cls._handle_safety(dataset_key, limit, offset, cache_key)
            else:
                return cls._handle_default(dataset_key, limit, offset, cache_key)

        except HTTPException:
            raise
        except Exception as e:
            # Attach geo context to Sentry (if configured)
            try:
                from app.utils.sentry_utils import attach_geo_context
                attach_geo_context(dataset_id=dataset_key)
            except Exception:
                pass

            logger.error(f"Smart proxy error for {dataset_key}: {e}")

            # Map exceptions to status codes
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            if "timeout" in str(e).lower():
                status_code = status.HTTP_504_GATEWAY_TIMEOUT
            elif "not found" in str(e).lower():
                status_code = status.HTTP_404_NOT_FOUND

            raise HTTPException(status_code=status_code, detail=str(e))

    @classmethod
    def _handle_transport(cls, dataset_key: str, limit: int, offset: int, cache_key: str) -> Response:
        gdf = data_loader.get_gdf(dataset_key)
        optimized = transport_optimizer.optimize_routes(gdf)

        # Pagination
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
        cls.set_cached_response(cache_key, result)
        return JSONResponse(
            content=result,
            headers={
                "X-Optimization": "TransportOptimizer",
                "X-Cache": "MISS",
                "Cache-Control": "public, max-age=86400",
            },
        )

    @classmethod
    def _handle_safety(cls, dataset_key: str, limit: int, offset: int, cache_key: str) -> Response:
        try:
            precincts = data_loader.get_gdf("precincts")
            stats = data_loader.load_csv("crime_stats")
            merged = safety_analyzer.merge_stats_with_precincts(precincts, stats)

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
            cls.set_cached_response(cache_key, result)
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

    @classmethod
    def _handle_default(cls, dataset_key: str, limit: int, offset: int, cache_key: str) -> Response:
        gdf, total = data_loader.get_paginated_gdf(
            dataset_key, limit=limit, offset=offset
        )

        # Performance Optimization: Construct JSON string directly
        json_str = gdf.to_json(na="null")

        if json_str.rstrip().endswith("}"):
            json_str = json_str.rstrip()[:-1]

            metadata = {
                "total": total,
                "limit": limit,
                "offset": offset,
                "returned": len(gdf),
                "has_more": offset + limit < total,
            }
            metadata_str = json.dumps(metadata)

            final_json = f'{json_str}, "metadata": {metadata_str}}}'

            cls.set_cached_response(cache_key, final_json)

            return Response(
                content=final_json,
                media_type="application/json",
                headers={
                    "Cache-Control": f"public, max-age={settings.CACHE_DURATION_DAYS * 86400}",
                    "X-Data-Source": "City of Cape Town",
                    "X-Loader-Version": "v2",
                    "X-Cache": "MISS",
                    "X-Total-Count": str(total),
                },
            )
        else:
            # Fallback
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
            cls.set_cached_response(cache_key, result)

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
