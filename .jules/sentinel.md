## 2024-05-18 - Missing Authentication on Admin Endpoints in Notifications API
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were missing the `require_admin_key` dependency, exposing admin functionality to unauthenticated users.
**Learning:** Even when the docstring or memory states an endpoint is restricted to administrators using a decorator, it's essential to verify its presence in the actual route definition. Missing decorators lead to immediate access control bypasses.
**Prevention:** Always verify the presence of `dependencies=[Depends(require_admin_key)]` on new or modified endpoints meant for administrators. Incorporate automated security tests to specifically query admin endpoints without authentication headers and assert they return 401/403.

## 2024-05-19 - Missing Authentication on Admin Endpoints in Performance API
**Vulnerability:** The `preload_cache` and `get_cache_stats` admin endpoints in `app/api/performance_api.py` lacked the `require_admin_key` dependency decorator, exposing administrative actions to unauthenticated users.
**Learning:** Similarly to the previous incident, admin functionality may lack its authentication dependency in the route definition despite explicit docstrings and names indicating it is restricted.
**Prevention:** Systematically search all route endpoints for explicit references to administrative keywords (e.g., "cache", "preload", "admin") and cross-reference them with the presence of `dependencies=[Depends(require_admin_key)]`.
