# Security Guidelines

## Secrets & Config
- Never commit secrets. Use environment variables and `.env` files kept out of VCS.
- Frontend env vars must be prefixed with `VITE_`; avoid leaking backend secrets to the browser.

## API & Auth
- Validate all input (GeoJSON, CRS, query params). Reject coordinates outside valid ranges.
- Add rate limiting on heavy endpoints (routing, buffer analyses) when exposed publicly.
- Sanitize filenames/paths for any export or download endpoints.

## Data Handling
- Preserve attribution metadata from City of Cape Town sources; do not strip provenance.
- Ensure GeoJSON follows RFC 7946 and does not leak internal paths or stack traces.
- Avoid logging sensitive user-provided payloads; log hashes/ids instead when needed.

## Transport & CORS
- Enforce HTTPS in production and set secure cookies/headers when applicable.
- Keep CORS origins constrained to known frontends; avoid wildcard in production.

## Dependencies
- Run `npm audit` / `pip-audit` in CI; patch critical issues quickly.
- Pin versions where possible; rebuild images after upgrades.