## 2024-05-18 - Missing Authentication on Admin Endpoints in Notifications API
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were missing the `require_admin_key` dependency, exposing admin functionality to unauthenticated users.
**Learning:** Even when the docstring or memory states an endpoint is restricted to administrators using a decorator, it's essential to verify its presence in the actual route definition. Missing decorators lead to immediate access control bypasses.
**Prevention:** Always verify the presence of `dependencies=[Depends(require_admin_key)]` on new or modified endpoints meant for administrators. Incorporate automated security tests to specifically query admin endpoints without authentication headers and assert they return 401/403.
## 2026-03-17 - [Missing Authentication on Performance Admin Endpoints]
**Vulnerability:** The `/cache/preload` and `/cache/stats` endpoints in `app/api/performance_api.py` lacked the `require_admin_key` FastAPI dependency, making them publicly accessible despite being intended for administrative use (e.g. cache warming).
**Learning:** Even when endpoints are described as "Admin endpoint" in docstrings, they are fully public unless explicitly protected by a dependency decorator (e.g., `dependencies=[Depends(require_admin_key)]`).
**Prevention:** Always verify that access control decorators mentioned in docstrings or documentation are explicitly applied to the route definitions, and include security integration tests to enforce restricted access.

## $(date +%Y-%m-%d) - [HIGH] Missing Authorization on Cache Refresh Endpoints
**Vulnerability:** State-mutating API endpoints like `POST /catalog/refresh` and `POST /realtime/feeds/{feed_id}/refresh` were missing the `require_admin_key` FastAPI dependency, allowing unauthenticated users to trigger potentially heavy data synchronization operations.
**Learning:** Always verify that state-mutating backend endpoints intended for system-level actions explicitly declare authorization dependencies (e.g., `dependencies=[Depends(require_admin_key)]`), even if they're grouped logically with other public read-only endpoints.
**Prevention:** Add automated tests that hit all expected admin endpoints without headers to assert they return a 401 or 403 Forbidden.
