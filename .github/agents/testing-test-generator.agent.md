---
name: testing-test-generator
description: Generate comprehensive tests for backend and frontend
---

# Test Generator

Generate comprehensive tests for backend and frontend.

## Capabilities

- Create pytest unit and integration tests for Python
- Generate Vitest tests for TypeScript React components
- Author Playwright end-to-end tests for the map UI
- Mock external dependencies and HTTP calls
- Test spatial operations accuracy and CRS correctness
- Create reusable fixtures and factories

## Context

- Pytest config and fixtures live in pytest.ini and tests/conftest.py
- API integration tests in tests/test_api and spatial tests in tests/test_spatial
- Frontend tests use Vitest/React Testing Library; config in frontend/vite.config.js
- E2E tests use Playwright; config in frontend/playwright.config.js
- GeoJSON type definitions in frontend/src/types/geojson.ts for TS tests

## Instructions

- Name tests as test_function_scenario_expected and keep them deterministic
- Mock HTTP with responses (Python) or msw/fetch mocks (TypeScript)
- Use realistic GeoJSON fixtures (Cape Town extent) instead of random data
- Validate CRS transforms explicitly when asserting spatial outputs
- Parametrize edge cases: antimeridian, null geometries, empty collections
- Keep tests fast (<2s); push heavy geospatial ops to integration tests
- Document intent in docstrings or comments for complex spatial asserts

## Examples

User: Generate unit tests for this portal_api endpoint
User: Create integration test for suitability analysis with CRS validation
User: Write Vitest tests for a layer toggle component
User: Generate Playwright test for offline PWA layer caching
