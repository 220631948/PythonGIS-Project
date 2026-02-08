This PR adds Playwright E2E tests that toggle the 14 mapped layer cards and verifies the backend returns 200 OK and that there are no console errors. It also captures a screenshot for each layer and uploads them as CI artifacts.

Files changed:
- frontend/tests/e2e/layer_visual_check.spec.ts (new)
- frontend/playwright.config.js (small webServer cwd fix)
- .github/workflows/ci.yml (E2E job: start API and upload screenshot evidence)

How to run locally:
1. Start the API: docker compose up -d api
2. From /frontend: npm ci && npx playwright install --with-deps
3. From /frontend: npm run test:e2e

Artifacts: screenshots are saved to frontend/tests/e2e/screenshots/ and uploaded by the CI E2E job.
