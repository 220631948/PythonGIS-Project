## 2024-02-08 - [GeoJSON Serialization Optimization]
**Learning:** `gdf.to_json()` is significantly faster (~2.4x) than manual iteration for converting GeoDataFrames to GeoJSON. However, it requires a custom default handler for `pd.Timestamp` to output ISO strings (standard JSON serializers fail on Timestamp). The `default` argument in `to_json` (passed to `json.dumps`) solves this elegantly.
**Action:** Prefer `gdf.to_json(default=json_serial, na='null')` over manual iteration for large GeoDataFrames. Always test datetime serialization explicitly.

## 2024-02-09 - [Single Geometry Transformation Optimization]
**Learning:** `pyproj.Transformer` and `shapely.ops.transform` are significantly faster (10-20x) than `geopandas.GeoDataFrame.to_crs` for single geometry operations (buffer, distance). The `GeoDataFrame` initialization overhead is dominant for small inputs.
**Action:** For single geometry operations, especially inside loops or high-frequency calls, bypass `GeoDataFrame` and use `pyproj` directly with pre-initialized transformers.

## 2026-02-15 - [PostGIS Native JSON Optimization]
**Learning:** Constructing GeoJSON directly in PostGIS using `json_build_object` and `ST_AsGeoJSON` avoids the significant overhead of transferring row data to Python, iterating, and double-serializing (DB->Dict->JSON). This is especially critical for endpoints returning large FeatureCollections. Also, `AsyncSession` requires careful handling in endpoints; mixing sync `db.execute` with async sessions causes runtime errors.
**Action:** For spatial endpoints returning standard GeoJSON structures, prefer `json_build_object` / `json_agg` in SQL queries and return raw `Response(content=..., media_type="application/json")`. Ensure endpoints are `async def` when using `AsyncSession`.
