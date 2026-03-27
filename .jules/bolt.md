## 2026-02-11 - [Backend] Optimized GeoJSON Serialization
**Learning:** `geopandas.to_json()` is highly optimized for converting GeoDataFrames to GeoJSON strings, but `FastAPI`'s `JSONResponse` requires a dictionary, leading to a redundant `String -> Dict -> String` cycle. Splicing the metadata directly into the JSON string avoids this overhead and is ~2x faster for typical payloads.
**Action:** When returning large GeoJSON responses in FastAPI where the source is already a JSON string (e.g., from `to_json` or PostGIS `ST_AsGeoJSON`), construct the final response string manually and return `Response(content=str, media_type="application/json")` instead of `JSONResponse`.

## 2026-02-18 - [Backend] PostGIS Native GeoJSON Construction
**Learning:** Constructing complex GeoJSON FeatureCollections directly in PostGIS using `json_build_object`, `json_agg`, and `ST_AsGeoJSON` is significantly more efficient than fetching rows and constructing dictionaries in Python. This eliminates row iteration overhead and leverages the database's optimized JSON functions.
**Action:** For spatial endpoints returning GeoJSON, push the JSON construction logic to the SQL query and return the raw JSON string using `Response` to bypass FastAPI/Pydantic serialization. Also, ensure `AsyncSession` is used correctly with `await` for database execution to avoid coroutine errors.

## 2026-02-19 - [Backend] Spatial Intersection Optimization
**Learning:** Loading entire datasets into memory with `geopandas` for point-in-polygon checks is extremely inefficient for large datasets. Using PostGIS `ST_Intersects` (or `ST_Within`) allows the database to use spatial indexes and only return the count, avoiding data transfer and memory overhead.
**Action:** Always prefer database-side spatial operations (`ST_Intersects`, `ST_DWithin`) over loading data into application memory. When implementing fallback logic, ensure input geometries are correctly serialized for PostGIS (e.g., `ST_GeomFromGeoJSON`) and coordinate systems are handled (e.g., `ST_SetSRID(..., 4326)`). Also, validating table names with regex is critical when dynamic table names are used.

## 2026-03-17 - [Backend] Eliminating Double-Serialization in GeoJSON Endpoints
**Learning:** `paginated.to_json()` outputs a full JSON string. Using `json.loads(paginated.to_json())` just to extract the `"features"` list and then return it via `JSONResponse` causes massive CPU overhead because it forces a String -> Dict -> String conversion cycle.
**Action:** Always manipulate the JSON string directly (e.g., using string concatenation or slicing) and return it using `Response(content=str, media_type="application/json")`. Make sure the caching mechanism correctly supports storing and returning raw JSON strings to fully bypass FastAPI's serialization overhead.

## 2026-03-27 - [Backend] Eliminating Double-Serialization in GeoJSON Endpoints
**Learning:** Returning `json.loads(df.to_json())` from spatial analysis modules and serializing it again in FastAPI causes a massive `String -> Dict -> String` CPU overhead.
**Action:** Always manipulate and pass the JSON string directly by returning `df.to_json(na="null")` from the analyzer and wrapping it in a `Response(content=str, media_type="application/json")` in the FastAPI router to fully bypass FastAPI's string-to-dict-to-string serialization loop overhead.
