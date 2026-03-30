## 2024-05-18 - Missing Authentication on Admin Endpoints in Notifications API
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were missing the `require_admin_key` dependency, exposing admin functionality to unauthenticated users.
**Learning:** Even when the docstring or memory states an endpoint is restricted to administrators using a decorator, it's essential to verify its presence in the actual route definition. Missing decorators lead to immediate access control bypasses.
**Prevention:** Always verify the presence of `dependencies=[Depends(require_admin_key)]` on new or modified endpoints meant for administrators. Incorporate automated security tests to specifically query admin endpoints without authentication headers and assert they return 401/403.
## 2026-03-17 - [Missing Authentication on Performance Admin Endpoints]
**Vulnerability:** The `/cache/preload` and `/cache/stats` endpoints in `app/api/performance_api.py` lacked the `require_admin_key` FastAPI dependency, making them publicly accessible despite being intended for administrative use (e.g. cache warming).
**Learning:** Even when endpoints are described as "Admin endpoint" in docstrings, they are fully public unless explicitly protected by a dependency decorator (e.g., `dependencies=[Depends(require_admin_key)]`).
**Prevention:** Always verify that access control decorators mentioned in docstrings or documentation are explicitly applied to the route definitions, and include security integration tests to enforce restricted access.

## 2026-03-30 - [Missing Authorization on Administrative Cache Refresh Endpoints]
**Vulnerability:** State-mutating administrative routes (like POST `/refresh` or `/feeds/{feed_id}/refresh`) in `app/api/metadata_api.py` and `app/api/realtime_api.py` lacked explicit authorization checks, exposing them to unauthorized users. This could lead to potential denial-of-service (DoS) as refreshing metadata/feeds involves processing large amounts of data, or unauthorized cache invalidation.
**Learning:** Even internal cache management endpoints must be treated as administrative routes. The system had a `require_admin_key` dependency available, but it was not applied to all sensitive mutating operations.
**Prevention:** Always verify that endpoints performing state-mutating or resource-intensive operations (especially POST/PUT/DELETE) have appropriate authorization dependencies like `dependencies=[Depends(require_admin_key)]`.
