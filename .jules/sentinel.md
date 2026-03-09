## 2024-05-18 - Missing Authentication on Admin Endpoints in Notifications API
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were missing the `require_admin_key` dependency, exposing admin functionality to unauthenticated users.
**Learning:** Even when the docstring or memory states an endpoint is restricted to administrators using a decorator, it's essential to verify its presence in the actual route definition. Missing decorators lead to immediate access control bypasses.
**Prevention:** Always verify the presence of `dependencies=[Depends(require_admin_key)]` on new or modified endpoints meant for administrators. Incorporate automated security tests to specifically query admin endpoints without authentication headers and assert they return 401/403.

## 2025-03-09 - Missing Admin Authentication on Cache Endpoints
**Vulnerability:** The `/api/performance/cache/preload` and `/api/performance/cache/stats` endpoints were missing the `dependencies=[Depends(require_admin_key)]` decorator, allowing unauthenticated users to trigger heavy caching operations (DoS risk) and view cache statistics.
**Learning:** Endpoints intended for administrators must explicitly include the authorization dependency in their FastAPI router decorators. The dependency itself works only when explicitly applied.
**Prevention:** When creating new admin endpoints, immediately apply the `dependencies=[Depends(require_admin_key)]` decorator. Review docstrings for "admin" to ensure the decorator matches the intended access level.
