## 2024-05-18 - Missing Authentication on Admin Endpoints in Notifications API
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were missing the `require_admin_key` dependency, exposing admin functionality to unauthenticated users.
**Learning:** Even when the docstring or memory states an endpoint is restricted to administrators using a decorator, it's essential to verify its presence in the actual route definition. Missing decorators lead to immediate access control bypasses.
**Prevention:** Always verify the presence of `dependencies=[Depends(require_admin_key)]` on new or modified endpoints meant for administrators. Incorporate automated security tests to specifically query admin endpoints without authentication headers and assert they return 401/403.
## 2024-05-24 - Missing Authentication on Administrative Cache Endpoints
**Vulnerability:** The `/cache/preload` and `/cache/stats` endpoints in `app/api/performance_api.py` lacked authentication, allowing unauthorized users to trigger heavy operations (cache warming) and access system statistics.
**Learning:** Endpoints meant for administration must explicitly include the `dependencies=[Depends(require_admin_key)]` decorator to protect them, even if their docstring claims they are admin endpoints.
**Prevention:** Verify that all sensitive routes define `dependencies` explicitly when registering with FastAPI's `@router` decorators.
