## 2026-02-20 - [Fail Open Authentication]
**Vulnerability:** Admin endpoints were configured to allow access if `ADMIN_API_KEY` was missing or empty, logging only a warning.
**Learning:** Default configurations should always be "secure by default". "Fail open" logic (allowing access on error/misconfiguration) is a critical anti-pattern.
**Prevention:** Ensure all security dependencies raise an exception (403/401) if required configuration is missing, rather than proceeding with a warning.
