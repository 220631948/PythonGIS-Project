## 2024-02-08 - [GeoJSON Serialization Optimization]
**Learning:** `gdf.to_json()` is significantly faster (~2.4x) than manual iteration for converting GeoDataFrames to GeoJSON. However, it requires a custom default handler for `pd.Timestamp` to output ISO strings (standard JSON serializers fail on Timestamp). The `default` argument in `to_json` (passed to `json.dumps`) solves this elegantly.
**Action:** Prefer `gdf.to_json(default=json_serial, na='null')` over manual iteration for large GeoDataFrames. Always test datetime serialization explicitly.

## 2024-02-09 - [Single Geometry Transformation Optimization]
**Learning:** `pyproj.Transformer` and `shapely.ops.transform` are significantly faster (10-20x) than `geopandas.GeoDataFrame.to_crs` for single geometry operations (buffer, distance). The `GeoDataFrame` initialization overhead is dominant for small inputs.
**Action:** For single geometry operations, especially inside loops or high-frequency calls, bypass `GeoDataFrame` and use `pyproj` directly with pre-initialized transformers.

## 2026-02-12 - [API Response Performance]
**Learning:** `json.loads(gdf.to_json())` followed by `json.dumps()` in FastAPI responses is a significant bottleneck (~22% overhead on 50k rows). String splicing the pre-serialized `gdf.to_json()` output to add metadata avoids this double serialization entirely.
**Action:** Use `create_geojson_response_string` utility for all GeoDataFrame API responses to bypass `JSONResponse` serialization overhead.
