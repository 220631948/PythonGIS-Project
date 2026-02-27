# Sentinel Journal - Critical Security Learnings

## 2026-02-27 - Missing Authentication on Sensitive Endpoints
**Vulnerability:** The `create_alert` and `get_notification_stats` endpoints in `app/api/notifications_api.py` were unprotected, allowing unauthenticated users to broadcast alerts and view system statistics.
**Learning:** Adding new modules/endpoints (likely copy-pasted or drafted quickly) without immediately attaching standard security dependencies (like `require_admin_key`) is a common source of exposure. The `ADMIN_API_KEY` setting was available but not applied.
**Prevention:**
1. Establish a linting rule or pre-commit hook that flags `POST/PUT/DELETE` endpoints without `dependencies=` or `Security` arguments.
2. Default to "deny all" in API router configuration and explicitly allow public endpoints.
