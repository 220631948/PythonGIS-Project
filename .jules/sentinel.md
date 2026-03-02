## 2025-03-02 - Missing Authentication on Administrative Endpoints
**Vulnerability:** The `/alerts/create` and `/stats` endpoints in `app/api/notifications_api.py` were intended for administrators but did not include the necessary `Depends(require_admin_key)` decorator.
**Learning:** Endpoints intended for administrators must explicitly include `dependencies=[Depends(require_admin_key)]` in their FastAPI router decorators to prevent unauthorized access, as the dependency itself functions correctly only when applied.
**Prevention:** Always verify that administrative routes are protected with the correct `dependencies` parameter in the `@router` decorator.
