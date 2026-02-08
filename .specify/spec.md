# spec.md — Cape Town GeoHub

Version: 0.1
Stage: Beta (CI-gated)
Date: 2026-02-08

## Summary

Cape Town GeoHub is a full-stack geospatial decision-support platform that combines a FastAPI backend, a React + Vite frontend with Leaflet maps, and a data ingestion pipeline from the City of Cape Town Open Data Portal.

## Goals

- Provide a reliable API that returns RFC 7946-compliant GeoJSON (EPSG:4326).
- Offer a responsive, accessible map-first UI (WCAG 2.1 AA) with toggleable layers and spatial tools.
- Maintain CI gates (lint/type-check/audit/tests) and keep E2E tests for critical user flows.

## Constraints

- Project Stage: Beta (CI-gated). Expect stricter quality gates than a prototype.
- Spatial dependencies require system libraries (GDAL, GEOS, PROJ) when installing GeoPandas.
- External data comes from City of Cape Town Open Data; attribution and provenance must be preserved.

## Acceptance Criteria

- API endpoints under `/api` serve GeoJSON and document CRS expectations.
- Frontend builds and runs on Node 20 (Vite dev server: :5173).
- CI pipeline runs linting, type-checks, pip-audits, ruff, pytest, and Playwright E2E on protected branches.
- A minimal Spec Kit scaffold exists in `.specify/` and a CI job verifies its presence.

## Deliverables (initial)

- `.specify/spec.md` (this file)
- `.specify/plan.md` (high-level plan)
- `.specify/tasks/*` (initial actionable tasks)
- `.github/prompts/specify.prompt.md` and partner prompt files
- `.github/workflows/spec-check.yml` to ensure the spec artefacts are present

## TODOs

- Add LICENSE to repository (no license file detected).
- Integrate `specify` CLI checks into CI (run `specify check`) once the CLI install approach is confirmed.
- Expand spec tasks into granular work items for Phase 5 and Phase 6.
