## 2024-05-18 - Missing Authentication on Admin Endpoints in Notifications API
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were missing the `require_admin_key` dependency, exposing admin functionality to unauthenticated users.
**Learning:** Even when the docstring or memory states an endpoint is restricted to administrators using a decorator, it's essential to verify its presence in the actual route definition. Missing decorators lead to immediate access control bypasses.
**Prevention:** Always verify the presence of `dependencies=[Depends(require_admin_key)]` on new or modified endpoints meant for administrators. Incorporate automated security tests to specifically query admin endpoints without authentication headers and assert they return 401/403.
## 2026-03-17 - [Missing Authentication on Performance Admin Endpoints]
**Vulnerability:** The `/cache/preload` and `/cache/stats` endpoints in `app/api/performance_api.py` lacked the `require_admin_key` FastAPI dependency, making them publicly accessible despite being intended for administrative use (e.g. cache warming).
**Learning:** Even when endpoints are described as "Admin endpoint" in docstrings, they are fully public unless explicitly protected by a dependency decorator (e.g., `dependencies=[Depends(require_admin_key)]`).
**Prevention:** Always verify that access control decorators mentioned in docstrings or documentation are explicitly applied to the route definitions, and include security integration tests to enforce restricted access.
## 2026-04-03 - Missing Authentication on Admin Endpoints via Fail-Open Design
**Vulnerability:** The `require_admin_key` dependency in `app/dependencies.py` failed open by allowing access to administrative endpoints when the `ADMIN_API_KEY` was missing or not configured.
**Learning:** Security dependencies must default to 'deny' or 'fail securely'. Failing open (returning 'unprotected' and allowing access) completely defeats the purpose of the security control when misconfigured.
**Prevention:** Always ensure authentication dependencies raise appropriate exceptions (e.g. 403 Forbidden) and deny access when required configuration or keys are missing.
