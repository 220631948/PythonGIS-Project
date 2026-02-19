# Cape Town GeoHub

_Last updated: 2026-02-19_

Cape Town GeoHub is a full-stack geospatial decision-support platform combining a FastAPI backend, a React + Vite frontend (Leaflet maps), and an ingestion pipeline for City of Cape Town open data. It focuses on spatial analysis, accessibility, and data provenance for municipal planning and community workflows.

## Current Stage

**Beta (CI-gated)** — strict linting, type checks, audits and tests are enforced in CI. E2E tests run on `master` and `develop` branches.

## Highlights

- Interactive web GIS (map-first UX) with togglable basemaps and vector layers.
- Spatial analytics: routing, isochrones, buffering, suitability analyses.
- Offline/PWA-ready functionality for field workflows.
- Data provenance and attribution preserved from City of Cape Town Open Data.

## Architecture (high-level)

```text
frontend/   → React + Vite UI (Leaflet mapping)
app/        → FastAPI backend (GeoPandas, Shapely, PyProj)
data/       → raw/processed/cache datasets
scripts/    → data loading + deployment helpers
docs/       → technical docs + ethics
.specify/   → Spec Kit artifacts for spec-driven development
.github/    → Copilot agents and workflows (spec templates & CI)
```

## Tech Stack & Requirements

- Languages: Python 3.11+, TypeScript/JavaScript (React 19)
- Frontend: Vite, React 19, Tailwind (utilities), Leaflet (react-leaflet)
- Backend: FastAPI, GeoPandas, SQLAlchemy, GeoAlchemy2
- Database: PostgreSQL 15 + PostGIS (recommended)
- Package managers: npm (frontend), pip (backend)
- Containers: Docker & Docker Compose

Platform dependencies (required to build GeoPandas & spatial stack):
- Debian/Ubuntu: `sudo apt-get install -y gdal-bin libgdal-dev libgeos-dev libproj-dev`

- macOS: use `brew install gdal geos proj` (adjust as needed)

## Quick Start

### Option A — Docker (recommended)

This repo contains `compose.yaml` for local development.

```bash
# from repo root
docker compose -f compose.yaml up --build
```

- Frontend (Vite dev server): [http://localhost:5173](http://localhost:5173)
- Backend (API + docs): [http://localhost:8000](http://localhost:8000) — OpenAPI at [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- Postgres: 5432

### Option B — Local Development (manual)

Backend (Linux/macOS):

```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
# install system libs first (see requirements above)
pip install -r requirements.txt
# set up .env from .env.example and run DB (docker compose or local Postgres)
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev  # serves on :5173 by default
```


## Scripts & Useful Commands

Frontend (from `frontend/`):

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run type-check` — TypeScript type check
- `npm run test:unit` — Vitest unit tests
- `npm run test:e2e` — Playwright E2E


Backend:

- `.venv/bin/uvicorn app.main:app --reload --port 8000` — development server
- `pytest` — run backend tests
- `ruff check app/` — linter


Repo-level scripts:

- `scripts/update_data.py` — pull and refresh data caches
- `scripts/load_spatial_data.py` — load datasets into DB (as implemented)

## Environment variables

Copy `.env.example` → `.env` and set required values. Important variables:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_SERVER`
- `API_PREFIX` (default `/api`)
- `VITE_API_URL` (frontend dev server points to backend)
- `TARGET_CRS=EPSG:4326` and `PROJECTED_CRS=EPSG:32734`

## Testing & CI (what CI runs)

- Frontend CI: `npm ci`, `npm audit`, `npm run lint`, `npm run type-check`, `npm run build`
- Backend CI: install system deps (GDAL/GEOS/PROJ), `pip install -r requirements.txt`, `pip-audit --strict`, `ruff check app/`, `pytest` with PostGIS service
- Docker build: `docker compose build --no-cache`
- E2E: Playwright tests run in CI on `master`/`develop`

Follow the PR checklist in `AGENTS.md` and `.github/copilot-instructions.md` before merging.

## Spec Kit (Spec-driven development)

This repository includes a minimal Spec Kit scaffold under `.specify/` and lightweight CI verification (`.github/workflows/spec-check.yml`) to enforce presence of the spec artefacts on PRs.

To use Spec Kit locally (high-level):

1. Install the Specify CLI (see [Spec Kit](https://github.com/github/spec-kit) for the latest install instructions). Two common methods:

   - Using pip (recommended for CI):

     ```bash
     python -m venv .venv && source .venv/bin/activate
     python -m pip install --upgrade pip
     pip install git+https://github.com/github/spec-kit.git
     ```

   - Using `uvx` / `uv` (alternative):

     ```bash
     uvx --from git+https://github.com/github/spec-kit.git specify init .
     ```

2. Run `specify check` from the repository root to validate the `.specify` artefacts.

3. Run `specify init .` to bootstrap or edit `.specify/spec.md` and `.specify/plan.md` directly.

4. Use `.github/prompts/` to generate plan/task files and interact with coding agents (Copilot, Claude, etc.).

TODO: Add `specify check` to CI once the CLI install approach is validated.

## Project Structure (short)

- `app/` — FastAPI application, routers, models, core utilities
- `frontend/` — Vite + React app (src/modules/ for features)
- `data/` — raw, processed and cached GeoJSON/shapefiles
- `scripts/` — data and deployment helpers
- `docs/` — extended documentation and policy guides
- `.github/agents` & `.github/copilot/` — Copilot agent specs, prompts and instructions
- `.specify/` — Spec Kit artifacts (spec.md, plan.md, tasks/)

## Data & Attribution

All external datasets come from the City of Cape Town Open Data Portal. Preserve attribution as documented in `DATA_SOURCES.md`.

## License

No license file detected in the repository. Please add a LICENSE (e.g., MIT, Apache-2.0) to make terms clear. TODO: Add LICENSE file.

## Contributing

Please read `CONTRIBUTING.md`, `AGENTS.md`, and `.github/copilot/docs/CONTRIBUTING.md` for contribution guidance and Copilot agent usage.

---

If you'd like, I can now:

- Add `specify` CLI instructions (exact install commands) to this README after verifying the best install method.
- Add a follow-up CI job to run `specify check` once installation in CI is solved.
