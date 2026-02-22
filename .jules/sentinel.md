# Sentinel Journal - Security Learnings

## 2026-02-22 - Unprotected Admin Endpoints & Silent Import Failures

**Vulnerability:** The `create_alert` endpoint in `app/api/notifications_api.py` was documented as "admin only" but lacked the `dependencies=[Depends(require_admin_key)]` protection, exposing it to unauthenticated POST requests.

**Learning:** The vulnerability was initially hidden because a syntax error in a sibling module (`app/api/visualization_3d_api.py`) caused the entire block of new feature APIs to fail importing in `app/main.py`. The broad `try-except` block around the imports silenced the error and set `notifications_api` to `None`, effectively disabling the vulnerable route. This created a false sense of security (or rather, non-existence) during initial scans.

**Prevention:**
1. Avoid broad `try-except` blocks around module imports in `app/main.py`. Each module should be imported individually or with granular error handling to fail fast or log specific errors.
2. Ensure all endpoints documented as "admin only" explicitly use the `require_admin_key` dependency.
3. Use automated tests to verify route registration and security policies.
