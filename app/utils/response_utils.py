import json
from typing import Any, Dict, Optional
from fastapi import Response
import geopandas as gpd
from app.spatial_analysis.spatial_utils import gdf_to_geojson_str

def create_geojson_response(
    gdf: gpd.GeoDataFrame,
    metadata: Optional[Dict[str, Any]] = None,
    status_code: int = 200,
    media_type: str = "application/json"
) -> Response:
    """
    Creates a highly optimized JSON response for GeoDataFrames.
    Avoids double serialization (GDF -> JSON string -> Dict -> JSON string).

    Args:
        gdf: The GeoDataFrame to serialize.
        metadata: Optional dictionary of metadata to include in the response.
        status_code: HTTP status code.
        media_type: Media type for the response.

    Returns:
        FastAPI Response object with pre-serialized JSON content.
    """
    geojson_str = gdf_to_geojson_str(gdf)

    if not metadata:
        return Response(content=geojson_str, media_type=media_type, status_code=status_code)

    # Serialize metadata
    try:
        meta_json = json.dumps(metadata)
    except Exception as e:
        # Fallback if metadata is not JSON serializable, though it should be handled by caller
        raise ValueError(f"Metadata serialization failed: {e}")

    # Check if metadata is effectively empty (just "{}")
    if meta_json == "{}":
         response_content = '{"geojson":' + geojson_str + '}'
    else:
         # Remove the closing brace '}' from metadata and append geojson key
         response_content = meta_json[:-1] + ',"geojson":' + geojson_str + '}'

    return Response(content=response_content, media_type=media_type, status_code=status_code)
