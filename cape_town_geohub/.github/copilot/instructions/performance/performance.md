# Performance & Optimization

## Frontend
- Use geometry simplification and server-side pagination; never load full-city layers at once.
- Avoid re-render storms: memoize GeoJSON layers and selectors; debounce map interactions.
- Prefer streaming/lazy loading for large lists; show skeletons for perceived performance.
- Use CSS variables and lightweight components; keep bundle size small (analyze via `npm run build -- --analyze`).

## Backend
- For heavy GeoPandas operations, project to EPSG:32734 and run in `asyncio.to_thread` to avoid blocking.
- Reuse cached datasets from `app/core/data_loader` instead of refetching.
- Add GIST indexes for geometry columns when touching migrations.
- Limit response size: use `simplify` query param, bounding boxes, and content compression (nginx/gunicorn level).
- Avoid eager loading huge GeoDataFrames in request scope; cache or stream when possible.

## Database & I/O
- Use COPY/bulk operations for ingest; avoid row-by-row inserts.
- Validate CRS and geometry validity early to prevent expensive downstream failures.
- Keep PostGIS ANALYZE/VACUUM in maintenance scripts; ensure SRID consistency.

## Testing Performance
- Mark slow tests and keep unit tests under 2 seconds; move heavy geospatial checks to integration.
- Use small deterministic fixtures clipped to Cape Town bounding box.