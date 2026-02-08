# E2E: Layer visual checks

This PR adds a Playwright E2E test that toggles the 14 mapped layers in the Layer Panel and verifies that the backend returns 200 OK and that there are no console errors. It also captures screenshots for visual evidence.

Changes:
- Add e2e test: frontend/tests/e2e/layer_visual_check.spec.ts
- Adjust Playwright config: use local cwd so the webServer starts reliably when run from frontend
- CI: E2E job now starts the API service and uploads evidence screenshots as artifacts

This improves our visual verification coverage for the Layer Panel and ensures E2E runs will upload screenshots for review.
