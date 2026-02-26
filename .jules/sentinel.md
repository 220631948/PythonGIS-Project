# Sentinel's Security Journal

## 2024-05-22 - Testing Global Side Effects (Sentry)
**Vulnerability:** N/A (Testing Challenge)
**Learning:** The application initializes Sentry at the module level in `app/main.py` via `init_sentry()`. This makes it difficult to mock or disable Sentry in tests because the initialization happens immediately upon import.
**Prevention:** To test configuration changes (like disabling Sentry to prevent test noise) or verify startup logic, use `unittest.mock.patch` on `app.config.settings` and then explicitly `importlib.reload(app.main)`. This forces `init_sentry()` to re-run with the mocked settings.
