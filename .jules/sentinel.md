# Sentinel's Journal 🛡️

## 2026-02-24 - Fail-Open Admin Authentication
**Vulnerability:** The `require_admin_key` dependency allowed unrestricted access to admin endpoints when `ADMIN_API_KEY` was not configured (empty string), defaulting to "unprotected" instead of denying access.
**Learning:** Defaulting to "open" for convenience (e.g., local dev) creates a critical risk in production if configuration is missed. The system failed to "Fail Secure".
**Prevention:** Implement "Fail Secure" logic in all authentication dependencies. Explicitly check for `DEBUG` mode if developer convenience is required, but ALWAYS deny access by default in production if security configuration is missing.
