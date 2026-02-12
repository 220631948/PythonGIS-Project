import json
import logging
from typing import Dict, Any
import geopandas as gpd

logger = logging.getLogger(__name__)

def create_geojson_response_string(gdf: gpd.GeoDataFrame, metadata: Dict[str, Any]) -> str:
    """
    Efficiently creates a GeoJSON response string by splicing metadata into the GDF JSON output.

    This avoids the expensive double-serialization pattern:
    gdf.to_json() -> string -> json.loads() -> dict -> json.dumps() -> string

    Instead, we do:
    gdf.to_json() -> string -> slice -> append metadata -> string

    Args:
        gdf: The GeoDataFrame containing the features.
        metadata: A dictionary of metadata to include in the response.

    Returns:
        A JSON string representing the FeatureCollection with metadata.
    """
    try:
        # Get GeoJSON string from GeoDataFrame
        # to_json() typically returns a minified string like {"type": "FeatureCollection", "features": [...]}
        geojson_str = gdf.to_json()

        # Check if it ends with '}' (ignoring whitespace)
        geojson_str = geojson_str.strip()

        if not geojson_str.endswith("}"):
            # Fallback if something is unexpected (should not happen with standard geopandas)
            logger.warning("gdf.to_json() did not end with '}', falling back to standard serialization")
            # Reconstruct the dict manually (expensive path)
            data = json.loads(geojson_str)
            data["metadata"] = metadata
            return json.dumps(data)

        # Remove the last '}'
        geojson_str_stripped = geojson_str[:-1]

        # Serialize metadata
        metadata_str = json.dumps(metadata)

        # Splice
        final_json = f'{geojson_str_stripped}, "metadata": {metadata_str}}}'

        return final_json

    except Exception as e:
        logger.error(f"Error in optimized GeoJSON serialization: {e}")
        # Fallback to standard method if anything goes wrong
        # Convert GDF to dict (via json.loads) and add metadata
        try:
            data = json.loads(gdf.to_json())
            data["metadata"] = metadata
            return json.dumps(data)
        except Exception as e2:
             logger.error(f"Fallback serialization failed: {e2}")
             # Last resort: empty feature collection
             return json.dumps({
                 "type": "FeatureCollection",
                 "features": [],
                 "metadata": metadata,
                 "error": "Serialization failed"
             })
