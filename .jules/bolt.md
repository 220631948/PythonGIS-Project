## 2024-02-08 - [GeoJSON Serialization Optimization]
**Learning:** `gdf.to_json()` is significantly faster (~2.4x) than manual iteration for converting GeoDataFrames to GeoJSON. However, it requires a custom default handler for `pd.Timestamp` to output ISO strings (standard JSON serializers fail on Timestamp). The `default` argument in `to_json` (passed to `json.dumps`) solves this elegantly.
**Action:** Prefer `gdf.to_json(default=json_serial, na='null')` over manual iteration for large GeoDataFrames. Always test datetime serialization explicitly.

## 2024-02-09 - [Single Geometry Transformation Optimization]
**Learning:** `pyproj.Transformer` and `shapely.ops.transform` are significantly faster (10-20x) than `geopandas.GeoDataFrame.to_crs` for single geometry operations (buffer, distance). The `GeoDataFrame` initialization overhead is dominant for small inputs.
**Action:** For single geometry operations, especially inside loops or high-frequency calls, bypass `GeoDataFrame` and use `pyproj` directly with pre-initialized transformers.

## 2026-02-16 - [PostGIS JSON Generation & Async Session Fix]
**Learning:** Generating GeoJSON directly in PostGIS using `json_build_object`/`json_agg` reduces Python overhead by ~15-20% for small payloads and simplifies code. Additionally, `get_db` yields `AsyncSession`, so endpoints consuming it MUST be `async def` and use `await`, otherwise they crash with `TypeError` on sync execution.
**Action:** Use `async def` for all DB-dependent endpoints and prefer SQL-side JSON construction for spatial feature collections.
