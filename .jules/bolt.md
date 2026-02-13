## 2024-02-08 - [GeoJSON Serialization Optimization]
**Learning:** `gdf.to_json()` is significantly faster (~2.4x) than manual iteration for converting GeoDataFrames to GeoJSON. However, it requires a custom default handler for `pd.Timestamp` to output ISO strings (standard JSON serializers fail on Timestamp). The `default` argument in `to_json` (passed to `json.dumps`) solves this elegantly.
**Action:** Prefer `gdf.to_json(default=json_serial, na='null')` over manual iteration for large GeoDataFrames. Always test datetime serialization explicitly.

## 2024-02-09 - [Single Geometry Transformation Optimization]
**Learning:** `pyproj.Transformer` and `shapely.ops.transform` are significantly faster (10-20x) than `geopandas.GeoDataFrame.to_crs` for single geometry operations (buffer, distance). The `GeoDataFrame` initialization overhead is dominant for small inputs.
**Action:** For single geometry operations, especially inside loops or high-frequency calls, bypass `GeoDataFrame` and use `pyproj` directly with pre-initialized transformers.

## 2026-02-13 - [Async Database Session Confusion]
**Learning:** The application's `get_db` dependency returns an `AsyncSession` (via async generator), but several endpoints (e.g., `get_nearby_features`, previously `get_buffer`) were defined as synchronous functions or failed to `await` database operations. This causes subtle bugs where database queries return coroutine objects instead of results, leading to `TypeError` or silently failing logic.
**Action:** Always verify if `get_db` is async or sync. When using `AsyncSession`, ensure endpoints are `async def` and database calls are `await`ed. Use `Optional[AsyncSession]` to gracefully degrade functionality when the database is unavailable (e.g., in test environments without DB).
