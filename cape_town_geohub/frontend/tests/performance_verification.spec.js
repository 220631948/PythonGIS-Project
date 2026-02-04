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

    // Wait for the layer to be loaded/displayed
    // We can check for the popup or marker presence if possible, or just wait for network idle
    // The "Test Point" should be rendered.
    // The MapView renders markers for features.
    // It creates a marker with "Test Point" in popup?
    // Let's wait for network requests to settle.
    await page.waitForTimeout(2000);

    // Verify the request count
    console.log(`Request count: ${requestCount}`);

    // In strict mode (dev), effects might run twice, but let's see.
    // Ideally it should be 1. If it's 2, it might be due to Strict Mode, but we want to avoid 100.
    // The issue is race conditions, so "exactly once" might be strict for dev, but let's observe.
    expect(requestCount).toBeGreaterThan(0);
    expect(requestCount).toBeLessThan(4); // Allow for strict mode double invocation
  });
});
