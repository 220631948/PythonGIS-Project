## 2024-05-18 - Missing Authentication on Admin Endpoints in Notifications API
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were missing the `require_admin_key` dependency, exposing admin functionality to unauthenticated users.
**Learning:** Even when the docstring or memory states an endpoint is restricted to administrators using a decorator, it's essential to verify its presence in the actual route definition. Missing decorators lead to immediate access control bypasses.
**Prevention:** Always verify the presence of `dependencies=[Depends(require_admin_key)]` on new or modified endpoints meant for administrators. Incorporate automated security tests to specifically query admin endpoints without authentication headers and assert they return 401/403.
## 2025-03-06 - Missing Authentication on Admin Endpoints
**Vulnerability:** Found unauthenticated endpoints (`/cache/preload` and `/cache/stats`) in `app/api/performance_api.py` that were explicitly documented as "Admin endpoints" but lacked the `require_admin_key` dependency.
**Learning:** Route decorators can easily miss necessary access control dependencies, even if the docstring claims the route is restricted. This creates a disconnect between documented intent and actual security implementation.
**Prevention:** Verify that access control decorators (like `require_admin_key`) mentioned in docstrings or documentation are explicitly applied to the route definitions, as they can be missing and result in a vulnerability.
