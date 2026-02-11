# Observability & Sentry Integration

This document describes the Sentry integration and how to verify it is configured correctly for Cape Town GeoHub.

## Quick Verification (Local)

1. Ensure you have set the SENTRY_DSN in `.env` (do NOT commit production DSNs into the repo). For local testing you can use a project DSN from Sentry.

2. Start the backend (from project root):

```bash
# In a virtualenv with project deps installed
uvicorn app.main:app --reload --port 8000
```

3. Trigger the verification route:

```bash
curl -v http://localhost:8000/sentry-debug || true
```

This endpoint intentionally raises an exception to verify the Sentry installation. If `SENTRY_DSN` is set correctly, you should see a new test event appear in your Sentry project.

**Important:** This endpoint is meant for local testing or controlled staging environments. Do not expose it publicly in production without protection.

## Release Tracking

To correlate errors and traces across frontend and backend, set a release value at build time and use the same release for both the frontend and backend.

- Use `GIT_SHA` or an explicit `SENTRY_RELEASE` env var in your CI/build pipeline.
- The Sentry SDK will annotate events with the configured `release` attribute.

### Creating a release via webhook

Sentry provides a lightweight release webhook endpoint you can POST to when you want to create a release entry. Example (replace placeholders):

```bash
curl https://us.sentry.io/api/hooks/release/builtin/<PROJECT_ID>/<WEBHOOK_TOKEN>/ \
  -X POST -H 'Content-Type: application/json' \
  -d '{"version": "$(git rev-parse --short HEAD)"}'
```

Alternatively, use `sentry-cli` in your CI to create the release and upload source maps for the frontend build.

## Frontend Sentry Setup

1. Install the browser SDK and Vite plugin in the frontend directory (package.json updated in this PR):

```bash
cd frontend
npm install
```

2. Configure `VITE_SENTRY_DSN` and optionally `VITE_SENTRY_RELEASE` in `frontend/.env` or pass them in your CI environment.

3. The frontend entry initializes Sentry (`frontend/src/sentry.ts`) and will attach a `release` if `VITE_SENTRY_RELEASE` or `VITE_COMMIT_SHA` are provided.

## CI Tips

- Store `SENTRY_AUTH_TOKEN` in your CI secret store and pass it into your build step when calling `sentry-cli releases new` and `sentry-cli releases files <RELEASE> upload-sourcemaps ./dist`.
- Alternatively, you can store a one-off `SENTRY_RELEASE_WEBHOOK` (a release webhook URL) in your secrets and configure the CI to call it after a successful frontend build (this repo includes a `Create Sentry release (webhook)` step that uses `secrets.SENTRY_RELEASE_WEBHOOK`).
- Do not commit `SENTRY_AUTH_TOKEN`, webhook tokens, or other secrets to the repository.

## Privacy & Guardrails

- `send_default_pii` is disabled by default in this project. Before enabling PII collection, get explicit stakeholder approval and add documentation for what will be collected.
- The backend uses a `before_send` hook to scrub `authorization` and `cookie` headers and to round geo coordinates (bbox/centroid) to reduce precision.
- Session Replay is disabled by default and must be enabled explicitly and with appropriate masking and consent.

If you want, I can add CI jobs to automatically create releases and upload source maps during the frontend build; let me know and I will draft them for your review.
