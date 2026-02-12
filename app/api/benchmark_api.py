"""
Benchmark API for PostGIS Query Performance

Provides admin endpoints for:
- Running EXPLAIN ANALYZE on queries
- Checking index usage
- Benchmarking spatial queries
- Getting optimization recommendations

Note: These endpoints should be protected in production
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging

from app.core.database import get_db
from app.utils.benchmark import PostGISBenchmark, run_benchmark_suite
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/benchmark", tags=["Benchmark"])
logger = logging.getLogger(__name__)


class ExplainRequest(BaseModel):
    """Request model for EXPLAIN ANALYZE."""
    query: str = Field(..., description="SQL query to analyze")
    params: Optional[Dict[str, Any]] = Field(None, description="Query parameters")


class BenchmarkRequest(BaseModel):
    """Request model for query benchmarking."""
    query: str = Field(..., description="SQL query to benchmark")
    params: Optional[Dict[str, Any]] = Field(None, description="Query parameters")
    iterations: int = Field(5, ge=1, le=20, description="Number of iterations")


class SpatialQueryRequest(BaseModel):
    """Request model for spatial query analysis."""
    table_name: str = Field(..., description="Name of the table")
    geometry_column: str = Field("geom", description="Name of the geometry column")
    test_lon: float = Field(18.4241, description="Test point longitude")
    test_lat: float = Field(-33.9249, description="Test point latitude")
    radius_meters: float = Field(1000, ge=1, le=50000, description="Search radius")


@router.post("/explain")
async def explain_query(
    request: ExplainRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Run EXPLAIN ANALYZE on a query to see execution plan and timing.
    
    **Security Note**: This endpoint should be restricted to admins in production.
    """
    try:
        benchmark = PostGISBenchmark(db)
        result = await benchmark.explain_analyze(request.query, request.params)
        
        return result
        
    except Exception as e:
        logger.error(f"Explain query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/benchmark")
async def benchmark_query(
    request: BenchmarkRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Benchmark a query by running it multiple times and collecting statistics.
    
    **Security Note**: This endpoint should be restricted to admins in production.
    """
    try:
        benchmark = PostGISBenchmark(db)
        result = await benchmark.benchmark_query(
            request.query,
            request.params,
            request.iterations
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Benchmark query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/indexes/{table_name}")
async def check_table_indexes(
    table_name: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Check what indexes exist on a table, including spatial indexes.
    """
    try:
        benchmark = PostGISBenchmark(db)
        indexes = await benchmark.check_indexes(table_name)
        
        return {
            'table': table_name,
            'index_count': len(indexes),
            'has_spatial_index': any(idx['is_spatial'] for idx in indexes),
            'indexes': indexes,
        }
        
    except Exception as e:
        logger.error(f"Check indexes failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-spatial")
async def analyze_spatial_query(
    request: SpatialQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze performance of a spatial query on a table.
    
    Provides:
    - Current index status
    - EXPLAIN ANALYZE results
    - Benchmark timings
    - Optimization recommendations
    """
    try:
        benchmark = PostGISBenchmark(db)
        result = await benchmark.analyze_spatial_query(
            table_name=request.table_name,
            geometry_column=request.geometry_column,
            test_point=(request.test_lon, request.test_lat),
            radius_meters=request.radius_meters
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Analyze spatial query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suite")
async def run_benchmark_suite_endpoint(
    tables: List[str] = Query(..., description="List of table names to benchmark"),
    db: AsyncSession = Depends(get_db)
):
    """
    Run a comprehensive benchmark suite on multiple tables.
    
    **Security Note**: This may be slow for large tables. Use with caution.
    """
    try:
        result = await run_benchmark_suite(db, tables)
        return result
        
    except Exception as e:
        logger.error(f"Benchmark suite failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggest-index/{table_name}")
async def suggest_index(
    table_name: str,
    geometry_column: str = Query("geom", description="Geometry column name"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get SQL suggestion for creating a spatial index on a table.
    """
    try:
        benchmark = PostGISBenchmark(db)
        sql = await benchmark.suggest_spatial_index(table_name, geometry_column)
        
        # Check if index already exists
        indexes = await benchmark.check_indexes(table_name)
        has_spatial_index = any(
            idx['is_spatial'] and geometry_column in idx['definition']
            for idx in indexes
        )
        
        return {
            'table': table_name,
            'geometry_column': geometry_column,
            'has_spatial_index': has_spatial_index,
            'suggested_sql': sql,
            'note': 'Index already exists' if has_spatial_index else 'Run this SQL to create the index',
        }
        
    except Exception as e:
        logger.error(f"Suggest index failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
