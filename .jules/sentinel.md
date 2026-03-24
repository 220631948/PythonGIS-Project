## 2024-05-18 - Missing Authentication on Admin Endpoints in Notifications API
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were missing the `require_admin_key` dependency, exposing admin functionality to unauthenticated users.
**Learning:** Even when the docstring or memory states an endpoint is restricted to administrators using a decorator, it's essential to verify its presence in the actual route definition. Missing decorators lead to immediate access control bypasses.
**Prevention:** Always verify the presence of `dependencies=[Depends(require_admin_key)]` on new or modified endpoints meant for administrators. Incorporate automated security tests to specifically query admin endpoints without authentication headers and assert they return 401/403.
## 2026-03-17 - [Missing Authentication on Performance Admin Endpoints]
**Vulnerability:** The `/cache/preload` and `/cache/stats` endpoints in `app/api/performance_api.py` lacked the `require_admin_key` FastAPI dependency, making them publicly accessible despite being intended for administrative use (e.g. cache warming).
**Learning:** Even when endpoints are described as "Admin endpoint" in docstrings, they are fully public unless explicitly protected by a dependency decorator (e.g., `dependencies=[Depends(require_admin_key)]`).
**Prevention:** Always verify that access control decorators mentioned in docstrings or documentation are explicitly applied to the route definitions, and include security integration tests to enforce restricted access.
## 2024-05-24 - Missing authentication on admin metadata refresh endpoint
**Vulnerability:** The `/catalog/refresh` endpoint in `app/api/metadata_api.py` was exposed to unauthenticated users, creating a potential DoS vector by allowing anyone to trigger expensive cache refreshes.
**Learning:** Always verify that administrative endpoints (like cache flushing or refreshing) have proper authorization dependencies applied, especially when they appear in larger API files alongside public read-only endpoints.
**Prevention:** Apply `@router.post("...", dependencies=[Depends(require_admin_key)])` or similar strict access controls to all state-mutating administrative endpoints.
