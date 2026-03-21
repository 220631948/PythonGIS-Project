## 2023-10-27 - Missing Authentication on Catalog Refresh Endpoint
**Vulnerability:** The `/refresh` endpoint in `app/api/metadata_api.py`, which forces a system-wide metadata catalog refresh, was publicly accessible.
**Learning:** Security dependencies defined in FastAPI (`require_admin_key`) only function if explicitly passed into the route decorators (`dependencies=[Depends(require_admin_key)]`). It is common to miss this decorator on individual routes even if it's imported and used elsewhere in the file.
**Prevention:** Always verify that routes with significant system impact (like cache invalidation, refreshes, or configuration changes) have explicit authentication decorators applied, rather than assuming folder-level or file-level protection.
