## 2026-03-10 - Missing Authentication on Admin Endpoints
**Vulnerability:** The `/cache/preload` and `/cache/stats` endpoints in `app/api/performance_api.py` were administrative routes but lacked any authentication checks. This allowed unauthenticated users to trigger cache preloading (potential DoS/resource exhaustion) and view cache statistics.
**Learning:** Even if an endpoint is intended for admins and documented as such ("Admin endpoint for cache warming"), FastAPI requires the explicit application of dependency decorators like `dependencies=[Depends(require_admin_key)]` to actually enforce the protection.
**Prevention:** Always verify that access control decorators mentioned in docstrings or documentation are explicitly applied to the route definitions.
