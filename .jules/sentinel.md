## 2024-05-18 - Missing Authentication on Admin Endpoints in Notifications API
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were missing the `require_admin_key` dependency, exposing admin functionality to unauthenticated users.
**Learning:** Even when the docstring or memory states an endpoint is restricted to administrators using a decorator, it's essential to verify its presence in the actual route definition. Missing decorators lead to immediate access control bypasses.
**Prevention:** Always verify the presence of `dependencies=[Depends(require_admin_key)]` on new or modified endpoints meant for administrators. Incorporate automated security tests to specifically query admin endpoints without authentication headers and assert they return 401/403.
## 2025-03-04 - Missing Authentication on Admin Endpoints
**Vulnerability:** Found an admin endpoint (`/cache/preload` in `app/api/performance_api.py`) missing the `dependencies=[Depends(require_admin_key)]` decorator, leaving it fully accessible.
**Learning:** Sometimes docstrings claim an endpoint is "Admin only", but the FastAPI dependencies aren't explicitly applied to the route definition.
**Prevention:** Always verify that access control decorators mentioned in documentation or docstrings are explicitly present in the route definition decorators.
