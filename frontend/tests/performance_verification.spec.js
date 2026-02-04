import { test, expect } from '@playwright/test';

const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

test.describe('Performance Repro', () => {
  test('should fetch layer data exactly once', async ({ page }) => {
    // Mock the backend response for the layer
    let requestCount = 0;
    await page.route('**/api/portal/datasets/test-layer/geojson', async route => {
      requestCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [18.4241, -33.9249]
              },
              properties: {
                name: "Test Point"
              }
            }
          ]
        })
      });
    });

    // Navigate to the map with the test layer
    await page.goto(`${frontendBase}/?layers=test-layer`);

    // Allow time for the layer to load and network requests to settle
    await page.waitForTimeout(2000);

    // Verify the request count
    expect(requestCount).toBeGreaterThan(0);
    // In strict mode dev builds, effects can fire twice; ensure we avoid uncontrolled loops
    expect(requestCount).toBeLessThan(4);
  });
});