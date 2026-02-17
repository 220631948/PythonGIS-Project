## 2026-02-11 - [Backend] Optimized GeoJSON Serialization
**Learning:** `geopandas.to_json()` is highly optimized for converting GeoDataFrames to GeoJSON strings, but `FastAPI`'s `JSONResponse` requires a dictionary, leading to a redundant `String -> Dict -> String` cycle. Splicing the metadata directly into the JSON string avoids this overhead and is ~2x faster for typical payloads.
**Action:** When returning large GeoJSON responses in FastAPI where the source is already a JSON string (e.g., from `to_json` or PostGIS `ST_AsGeoJSON`), construct the final response string manually and return `Response(content=str, media_type="application/json")` instead of `JSONResponse`.

## 2026-02-17 - [Backend] Optimized Geospatial Distance Calculation & Compatibility
**Learning:** `GeoDataFrame.apply(lambda x: gdf.distance(x).min())` is extremely slow ($O(N \times M)$) for spatial nearest neighbor searches. `gpd.sjoin_nearest` provides a vectorized solution ($O(N \log M)$) using spatial indexing, yielding ~20x speedup for typical workloads.
**Learning:** `geopandas==0.14.2` has compatibility issues with `pandas>=3.0.0` regarding `StringDtype` inference during file I/O operations (`gpd.to_file`), causing `TypeError`. Downgrading to `pandas==2.2.0` resolves this while maintaining modern pandas features.
**Action:** Always prefer `sjoin_nearest` for distance/nearest neighbor queries. Ensure `pandas` version is pinned to `<3.0.0` when using `geopandas<=0.14.x`.
