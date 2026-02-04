# Generate Playwright E2E Tests

**Context requirements:**
- User journey (e.g., load map, toggle layer, inspect popup)
- Test environment URL and auth (if any)
- Offline/online expectations for PWA
- Devices/viewport targets (desktop/mobile)

**Prompt structure:**
- Start from landing page and wait for map tiles ready
- Interact with controls via accessibility roles/labels
- Toggle layers and assert GeoJSON features appear/disappear
- Test offline fallback where relevant (service worker, cached tiles)
- Capture screenshots on failure for diagnostics

**Example usage:**
- "E2E: user toggles services layer and opens popup"
- "E2E: offline mode still shows cached base layer and warning toast"
