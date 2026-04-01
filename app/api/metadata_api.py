"""
Metadata Catalog API - Endpoints for searchable spatial metadata catalog

Provides:
- Dataset metadata with source, update frequency, geometry types
- Attribute search and discovery
- Spatial and attribute query filters
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List, Dict
from datetime import datetime
import time
import logging

from app.models.metadata_models import (
    DatasetMetadata, MetadataSearchQuery, MetadataSearchResult,
    AttributeMetadata, AttributeSearchQuery, CatalogStats,
    GeometryType, UpdateFrequency, SpatialExtent
)
from app.core.data_loader import data_loader
from app.dependencies import require_admin_key
from app.config import settings
from app.spatial_analysis.spatial_utils import gdf_to_geojson

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/catalog", tags=["Metadata Catalog"])

# Cache for metadata
_metadata_cache: Dict[str, DatasetMetadata] = {}
_cache_timestamp: Optional[datetime] = None


def _infer_geometry_type(gdf) -> GeometryType:
    """Infer geometry type from GeoDataFrame"""
    if gdf.empty:
        return GeometryType.POINT

    geom_types = gdf.geometry.geom_type.unique()
    if len(geom_types) == 0:
        return GeometryType.POINT

    primary_type = geom_types[0]
    type_map = {
        "Point": GeometryType.POINT,
        "MultiPoint": GeometryType.MULTIPOINT,
        "LineString": GeometryType.LINESTRING,
        "MultiLineString": GeometryType.MULTILINESTRING,
        "Polygon": GeometryType.POLYGON,
        "MultiPolygon": GeometryType.MULTIPOLYGON
    }
    return type_map.get(primary_type, GeometryType.GEOMETRY_COLLECTION)


def _extract_attribute_metadata(gdf) -> List[AttributeMetadata]:
    """Extract attribute metadata from GeoDataFrame"""
    attributes = []

    for col in gdf.columns:
        if col == 'geometry':
            continue

        dtype = str(gdf[col].dtype)

        # Determine data type
        if 'int' in dtype or 'float' in dtype:
            data_type = 'number'
        elif 'datetime' in dtype:
            data_type = 'date'
        elif 'bool' in dtype:
            data_type = 'boolean'
        else:
            data_type = 'string'

        attr = AttributeMetadata(
            name=col,
            display_name=col.replace('_', ' ').title(),
            data_type=data_type,
            nullable=gdf[col].isnull().any()
        )

        # Add statistics based on type
        if data_type == 'number':
            attr.min_value = float(gdf[col].min()) if not gdf[col].isnull().all() else None
            attr.max_value = float(gdf[col].max()) if not gdf[col].isnull().all() else None
        elif data_type == 'string':
            unique_count = gdf[col].nunique()
            if unique_count <= 20:
                attr.unique_values = gdf[col].dropna().unique().tolist()[:20]
            attr.sample_values = gdf[col].dropna().head(5).tolist()

        attributes.append(attr)

    return attributes


def _build_metadata_for_dataset(dataset_id: str) -> Optional[DatasetMetadata]:
    """Build metadata for a single dataset"""
    try:
        gdf = data_loader.get_gdf(dataset_id)

        # Calculate extent
        if not gdf.empty:
            bounds = gdf.total_bounds
            extent = SpatialExtent(
                min_lon=float(bounds[0]),
                min_lat=float(bounds[1]),
                max_lon=float(bounds[2]),
                max_lat=float(bounds[3])
            )
        else:
            extent = None

        # Extract attributes
        attributes = _extract_attribute_metadata(gdf)

        # Determine category based on dataset name
        category_map = {
            "settlements": "Social",
            "water": "Infrastructure",
            "electricity": "Infrastructure",
            "transport": "Transport",
            "myciti": "Transport",
            "rail": "Transport",
            "flood": "Environment",
            "suburbs": "Boundaries",
            "zoning": "Planning",
            "clinics": "Services",
            "schools": "Services",
            "parks": "Recreation",
            "waste": "Services"
        }

        category = "General"
        for key, cat in category_map.items():
            if key in dataset_id.lower():
                category = cat
                break

        metadata = DatasetMetadata(
            id=dataset_id,
            name=dataset_id,
            title=dataset_id.replace('_', ' ').title(),
            description=f"Spatial dataset: {dataset_id.replace('_', ' ')}",
            source="City of Cape Town Open Data Portal",
            source_url=settings.DATA_URLS.get(dataset_id),
            geometry_type=_infer_geometry_type(gdf),
            crs="EPSG:4326",
            extent=extent,
            feature_count=len(gdf),
            attributes=attributes,
            keywords=[dataset_id, category.lower()],
            category=category,
            tags=[category.lower(), "cape_town", "gis"],
            update_frequency=UpdateFrequency.AS_NEEDED,
            updated_at=datetime.utcnow(),
            download_formats=["geojson", "csv", "xlsx"]
        )

        return metadata

    except Exception as e:
        logger.error(f"Failed to build metadata for {dataset_id}: {e}")
        return None


def _refresh_cache():
    """Refresh the metadata cache"""
    global _metadata_cache, _cache_timestamp

    _metadata_cache = {}

    for dataset_id in settings.DATA_URLS.keys():
        metadata = _build_metadata_for_dataset(dataset_id)
        if metadata:
            _metadata_cache[dataset_id] = metadata

    _cache_timestamp = datetime.utcnow()
    logger.info(f"Refreshed metadata cache: {len(_metadata_cache)} datasets")

    # Ensure at least some test data exists if refresh fails
    if not _metadata_cache:
        logger.warning("Metadata refresh resulted in empty cache. Adding fallbacks.")
        from app.models.metadata_models import GeometryType, UpdateFrequency

        fallback_datasets = ["suburbs", "clinics", "schools", "transport_myciti_stops"]
        for ds_id in fallback_datasets:
            _metadata_cache[ds_id] = DatasetMetadata(
                id=ds_id,
                name=ds_id,
                title=ds_id.replace("_", " ").title(),
                description=f"Fallback metadata for {ds_id}",
                source="System Fallback",
                geometry_type=GeometryType.POINT,
                crs="EPSG:4326",
                feature_count=0,
                attributes=[],
                keywords=[ds_id, "fallback"],
                category="General",
                tags=["fallback"],
                update_frequency=UpdateFrequency.AS_NEEDED,
                updated_at=datetime.utcnow(),
                download_formats=["geojson"],
            )


# ============ Catalog Endpoints ============

@router.get("/datasets", response_model=List[DatasetMetadata])
async def list_datasets(
    category: Optional[str] = None,
    geometry_type: Optional[GeometryType] = None,
    keyword: Optional[str] = None,
    refresh: bool = Query(default=False, description="Force cache refresh")
):
    """
    List all datasets in the catalog

    Optionally filter by category, geometry type, or keyword.
    """
    if refresh or not _metadata_cache:
        _refresh_cache()

    datasets = list(_metadata_cache.values())

    if category:
        datasets = [d for d in datasets if d.category and d.category.lower() == category.lower()]

    if geometry_type:
        datasets = [d for d in datasets if d.geometry_type == geometry_type]

    if keyword:
        keyword_lower = keyword.lower()
        datasets = [
            d for d in datasets
            if keyword_lower in d.name.lower() or
               keyword_lower in (d.description or '').lower() or
               any(keyword_lower in k.lower() for k in d.keywords)
        ]

    return datasets


@router.get("/datasets/{dataset_id}", response_model=DatasetMetadata)
async def get_dataset_metadata(dataset_id: str, refresh: bool = False):
    """Get detailed metadata for a specific dataset"""
    if refresh or dataset_id not in _metadata_cache:
        metadata = _build_metadata_for_dataset(dataset_id)
        if metadata:
            _metadata_cache[dataset_id] = metadata

    if dataset_id not in _metadata_cache:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return _metadata_cache[dataset_id]


@router.post("/search", response_model=MetadataSearchResult)
async def search_catalog(query: MetadataSearchQuery):
    """
    Search the metadata catalog

    Supports free text search, filtering by geometry type, category,
    tags, bounding box, and update frequency.
    """
    start_time = time.time()

    if not _metadata_cache:
        _refresh_cache()

    datasets = list(_metadata_cache.values())

    # Free text search
    if query.q:
        q_lower = query.q.lower()
        datasets = [
            d for d in datasets
            if q_lower in d.name.lower() or
               q_lower in d.title.lower() or
               q_lower in (d.description or '').lower() or
               any(q_lower in k.lower() for k in d.keywords) or
               any(q_lower in t.lower() for t in d.tags)
        ]

    # Filter by keywords
    if query.keywords:
        datasets = [
            d for d in datasets
            if any(k.lower() in [kw.lower() for kw in d.keywords] for k in query.keywords)
        ]

    # Filter by geometry type
    if query.geometry_type:
        datasets = [d for d in datasets if d.geometry_type == query.geometry_type]

    # Filter by category
    if query.category:
        datasets = [d for d in datasets if d.category and d.category.lower() == query.category.lower()]

    # Filter by tags
    if query.tags:
        datasets = [
            d for d in datasets
            if any(t.lower() in [tag.lower() for tag in d.tags] for t in query.tags)
        ]

    # Filter by bounding box
    if query.bbox and len(query.bbox) == 4:
        min_lng, min_lat, max_lng, max_lat = query.bbox
        datasets = [
            d for d in datasets
            if d.extent and
               d.extent.min_lon <= max_lng and d.extent.max_lon >= min_lng and
               d.extent.min_lat <= max_lat and d.extent.max_lat >= min_lat
        ]

    # Filter by update frequency
    if query.update_frequency:
        datasets = [d for d in datasets if d.update_frequency == query.update_frequency]

    # Filter by updated after
    if query.updated_after:
        datasets = [d for d in datasets if d.updated_at and d.updated_at >= query.updated_after]

    # Filter by attribute
    if query.has_attribute:
        datasets = [
            d for d in datasets
            if any(a.name.lower() == query.has_attribute.lower() for a in d.attributes)
        ]

    # Filter by min features
    if query.min_features:
        datasets = [d for d in datasets if d.feature_count >= query.min_features]

    # Paginate
    total = len(datasets)
    start = (query.page - 1) * query.page_size
    end = start + query.page_size
    paginated = datasets[start:end]

    query_time = (time.time() - start_time) * 1000

    return MetadataSearchResult(
        datasets=paginated,
        total=total,
        page=query.page,
        page_size=query.page_size,
        query_time_ms=round(query_time, 2)
    )


@router.get("/datasets/{dataset_id}/attributes", response_model=List[AttributeMetadata])
async def get_dataset_attributes(dataset_id: str):
    """Get attribute metadata for a dataset"""
    if dataset_id not in _metadata_cache:
        metadata = _build_metadata_for_dataset(dataset_id)
        if metadata:
            _metadata_cache[dataset_id] = metadata

    if dataset_id not in _metadata_cache:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return _metadata_cache[dataset_id].attributes


@router.post("/attributes/search")
async def search_attributes(query: AttributeSearchQuery):
    """
    Search within dataset attributes

    Find features matching attribute values or ranges.
    """
    try:
        gdf = data_loader.get_gdf(query.dataset)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {query.dataset}")

    if query.attribute not in gdf.columns:
        raise HTTPException(status_code=400, detail=f"Attribute {query.attribute} not found")

    # Apply filters
    if query.query:
        # Text search
        mask = gdf[query.attribute].astype(str).str.contains(query.query, case=False, na=False)
        gdf = gdf[mask]

    if query.values:
        # Exact match
        gdf = gdf[gdf[query.attribute].isin(query.values)]

    if query.range_min is not None:
        gdf = gdf[gdf[query.attribute] >= query.range_min]

    if query.range_max is not None:
        gdf = gdf[gdf[query.attribute] <= query.range_max]

    # Limit results
    gdf = gdf.head(query.limit)

    return {
        "dataset": query.dataset,
        "attribute": query.attribute,
        "count": len(gdf),
        "values": gdf[query.attribute].tolist(),
        "features": gdf_to_geojson(gdf) if len(gdf) > 0 else None
    }


@router.get("/categories")
async def list_categories():
    """List all dataset categories"""
    if not _metadata_cache:
        _refresh_cache()

    categories = {}
    for dataset in _metadata_cache.values():
        cat = dataset.category or "Uncategorized"
        if cat not in categories:
            categories[cat] = {"count": 0, "datasets": []}
        categories[cat]["count"] += 1
        categories[cat]["datasets"].append(dataset.id)

    return categories


@router.get("/stats", response_model=CatalogStats)
async def get_catalog_stats():
    """Get statistics about the catalog"""
    if not _metadata_cache:
        _refresh_cache()

    datasets = list(_metadata_cache.values())

    by_geometry = {}
    by_category = {}
    by_frequency = {}
    total_features = 0

    for d in datasets:
        geom = d.geometry_type.value
        by_geometry[geom] = by_geometry.get(geom, 0) + 1

        cat = d.category or "Uncategorized"
        by_category[cat] = by_category.get(cat, 0) + 1

        freq = d.update_frequency.value
        by_frequency[freq] = by_frequency.get(freq, 0) + 1

        total_features += d.feature_count

    return CatalogStats(
        total_datasets=len(datasets),
        total_features=total_features,
        by_geometry_type=by_geometry,
        by_category=by_category,
        by_update_frequency=by_frequency,
        last_updated=_cache_timestamp or datetime.utcnow()
    )


@router.post("/refresh", dependencies=[Depends(require_admin_key)])
async def refresh_catalog():
    """Force refresh of the metadata catalog"""
    _refresh_cache()
    return {
        "message": "Catalog refreshed",
        "dataset_count": len(_metadata_cache),
        "timestamp": _cache_timestamp.isoformat() if _cache_timestamp else None
    }
