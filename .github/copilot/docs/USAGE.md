# GitHub Copilot Custom Agents Usage Guide

## Introduction

This guide explains how to use the custom GitHub Copilot agents tailored for Cape Town GeoHub.

## Getting Started

1. Install GitHub Copilot extension
2. Enable agent specifications (if using Spec Kit extension) OR point Copilot to `.github/copilot` instructions
3. Configure workspace settings to reference `.github/copilot/instructions` and `.github/agents`

## Using Custom Agents

Invoke agents using `@` mentions if your Copilot setup supports it (Spec Kit/VS Code Agents), or paste the agent instructions into chat.

### Available Agents

- **GeoJSON Expert** (`.github/agents/spatial-geojson-expert.agent.md`): GeoJSON creation/validation/CRS transforms.
- **GeoPandas Expert** (`.github/agents/spatial-geopandas-expert.agent.md`): Python spatial ops and performance.
- **FastAPI Expert** (`.github/agents/backend-fastapi-expert.agent.md`): API routes, Pydantic schemas, OpenAPI docs.
- **React Expert** (`.github/agents/frontend-react-expert.agent.md`): TSX components, accessibility, map UI.
- **Testing Agent** (`.github/agents/testing-test-generator.agent.md`): Pytest, Vitest, Playwright.
- **Alembic Expert** (`.github/agents/database-alembic-expert.agent.md`): PostGIS migrations and indices.
- **Docker & DevOps Expert** (`.github/agents/devops-docker-expert.agent.md`): Dockerfiles, Compose, CI builds.

## Prompt Templates (pick and paste)

- **API design**: `prompts/api-design/create-endpoint.md`, `prompts/api-design/pagination.md`
- **Components**: `prompts/component/create-feature-component.md`, `prompts/component/map-layer-toggle.md`
- **GeoJSON/Spatial**: `prompts/geojson/generate-feature.md`, `prompts/geojson/validate-collection.md`, `prompts/spatial-analysis/buffer-operation.md`, `prompts/spatial-analysis/transform-crs.md`
- **Testing**: `prompts/testing/pytest-unit.md`, `prompts/testing/vitest-component.md`, `prompts/testing/playwright-e2e.md`
- **Documentation**: `prompts/documentation/api-doc.md`, `prompts/documentation/changelog-entry.md`

## Best Practices

- Start with specific context ("Working on `app/api/portal_api.py`, need pagination")
- Reference relevant files and CRS expectations (4326 storage, 32734 metrics)
- Iterate; ask the agent to refine rather than rewriting from scratch
- Validate generated code against TypeScript/Python coding standards and spatial patterns

## Common Workflows

- **New API Endpoint**: `prompts/api-design/create-endpoint.md`
- **Add Pagination**: `prompts/api-design/pagination.md`
- **React Component**: `prompts/component/create-feature-component.md`
- **Layer Toggle UI**: `prompts/component/map-layer-toggle.md`
- **Spatial Operation**: `prompts/spatial-analysis/buffer-operation.md` or `transform-crs.md`
- **Testing**: `prompts/testing/pytest-unit.md` (backend), `vitest-component.md` (frontend), `playwright-e2e.md` (E2E)
- **Docs/Changelog**: `prompts/documentation/api-doc.md`, `changelog-entry.md`
