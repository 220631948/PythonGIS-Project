# Docker / Compose cleanup — summary

Date: 2026-02-12
Author: repo maintenance agent

## What I changed

- Standardized PostGIS image across repo to `kartoza/postgis:15-3.4` (compose files, CI, docs).
- Consolidated development Compose files: kept `compose.yaml` (dev) and `docker-compose.prod.yml` (prod); removed duplicate `docker-compose.yml` from repository root.
- Fixed Postgres named-volume path in production compose (now maps to `/var/lib/postgresql/data`).
- Centralized local env usage by adding `env_file: .env` to `api` and `frontend` in `compose.yaml`.
- Improved Dockerfiles:
  - Runtime healthcheck in root `Dockerfile` now uses `curl` (more robust).
  - Added `PYTHONUNBUFFERED=1` to runtime image for predictable logging.
  - Installed `curl` in runtime image and used `--no-install-recommends` for apt installs.
  - Set `NODE_ENV=production` in `frontend/Dockerfile`.
- Removed clutter/duplicates from project root: `docker-compose.yml`, `README.Docker.md`, and the older `SWARM_EXECUTION_REPORT.md` (kept `SWARM_EXECUTION_REPORT_FINAL.md`).
- Updated CI/workflow and repository docs to reflect the above (references to `docker-compose.yml` → `compose.yaml`, `postgis/postgis` → `kartoza/postgis`).
- Added this summary `DOCKER_CLEANUP_REPORT.md` at repo root.

## Files removed

- `docker-compose.yml` (duplicate / confused with `compose.yaml`)
- `README.Docker.md` (redundant; short doc merged into `README.md`)
- `SWARM_EXECUTION_REPORT.md` (superseded by `SWARM_EXECUTION_REPORT_FINAL.md`)

## Files updated / consolidated

- Kept: `compose.yaml` (local dev), `docker-compose.prod.yml` (production), `.infrastructure/docker/docker-compose.{blue,green}.yml` (blue/green deploy)
- Standardized: `kartoza/postgis:15-3.4` for PostGIS service
- Dockerfiles: `Dockerfile`, `frontend/Dockerfile`, `frontend/Dockerfile.dev` (minor hygiene improvements)
- CI workflows: `.github/workflows/*` (PostGIS image updates)
- Docs: `README.md`, `.github/*`, other references updated to `compose.yaml`

## Why these changes

- Remove ambiguous/duplicate Compose files so `docker compose` usage is predictable.
- Use the well-maintained `kartoza/postgis` image (consistent with CI) for PostGIS.
- Centralize environment variables via `.env` for simpler local startup.
- Improve runtime reliability (healthchecks, unbuffered logs, smaller apt installs).

## How to run locally now (minimal setup)

1. Copy `.env.example` → `.env` and set required values (POSTGRES_PASSWORD etc.).
2. Start services:

   docker compose -f compose.yaml up --build

3. API: http://localhost:8000 — Frontend (dev): http://localhost:5173

## Next recommended follow-ups

- Add a small `scripts/docker-validate.sh` that runs `docker compose -f compose.yaml config` and `docker compose -f docker-compose.prod.yml config` in CI.
- Add `compose.yaml` usage note to contributing checklist (already updated in README).
- (Optional) Add a `docker/.env.example.local` with dev-safe defaults (no secrets).

---
If you'd like, I can open a PR with these changes (include CI run & verification steps) or revert any specific edit.