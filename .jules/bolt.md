## 2026-02-11 - [Backend] Optimized GeoJSON Serialization
**Learning:** `geopandas.to_json()` is highly optimized for converting GeoDataFrames to GeoJSON strings, but `FastAPI`'s `JSONResponse` requires a dictionary, leading to a redundant `String -> Dict -> String` cycle. Splicing the metadata directly into the JSON string avoids this overhead and is ~2x faster for typical payloads.
**Action:** When returning large GeoJSON responses in FastAPI where the source is already a JSON string (e.g., from `to_json` or PostGIS `ST_AsGeoJSON`), construct the final response string manually and return `Response(content=str, media_type="application/json")` instead of `JSONResponse`.

## 2026-02-18 - [Backend] PostGIS Native GeoJSON Construction
**Learning:** Constructing complex GeoJSON FeatureCollections directly in PostGIS using `json_build_object`, `json_agg`, and `ST_AsGeoJSON` is significantly more efficient than fetching rows and constructing dictionaries in Python. This eliminates row iteration overhead and leverages the database's optimized JSON functions.
**Action:** For spatial endpoints returning GeoJSON, push the JSON construction logic to the SQL query and return the raw JSON string using `Response` to bypass FastAPI/Pydantic serialization. Also, ensure `AsyncSession` is used correctly with `await` for database execution to avoid coroutine errors.
