# Sentinel Journal - Critical Security Learnings

## 2026-02-23 - Fail Securely: Admin Key Default
**Vulnerability:** The `require_admin_key` dependency defaulted to "unprotected" (allowing access) when `ADMIN_API_KEY` was not configured in the environment.
**Learning:** Defaulting to an insecure state for developer convenience creates a critical risk where production deployments might accidentally expose sensitive admin endpoints if configuration is missed.
**Prevention:** Always implement "Fail Securely". If a security control (like an API key) is missing, the system should deny access by default, not allow it. Explicitly require configuration for sensitive operations.
