## 2024-02-08 - [GeoJSON Serialization Optimization]
**Learning:** `gdf.to_json()` is significantly faster (~2.4x) than manual iteration for converting GeoDataFrames to GeoJSON. However, it requires a custom default handler for `pd.Timestamp` to output ISO strings (standard JSON serializers fail on Timestamp). The `default` argument in `to_json` (passed to `json.dumps`) solves this elegantly.
**Action:** Prefer `gdf.to_json(default=json_serial, na='null')` over manual iteration for large GeoDataFrames. Always test datetime serialization explicitly.
