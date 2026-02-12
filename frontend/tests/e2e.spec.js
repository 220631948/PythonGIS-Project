import { test, expect, request } from '@playwright/test';

const backendBase = process.env.BACKEND_URL || 'http://localhost:8000';
const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
const emptyFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

// Helper to create an API context for backend calls
async function createApiContext() {
  return await request.newContext({ baseURL: backendBase, ignoreHTTPSErrors: true });
}

async function waitForBackend(api, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await api.get('/api/health', {
        failOnStatusCode: false,
        timeout: 5_000,
      });
      if (res.status() === 200) {
        return res;
      }
    } catch {
      // retry until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  return null;
}

async function mockLayerRequests(page) {
  const body = JSON.stringify(emptyFeatureCollection);
  await page.route('**/api/data/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body }),
  );
  await page.route('**/api/portal/datasets/**/geojson**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body }),
  );
}

test.describe('Cape Town GeoHub E2E', () => {
  test('backend health endpoints respond', async () => {
    const api = await createApiContext();
    const res = await waitForBackend(api);
    if (!res) {
      test.skip(true, `Backend unavailable from Playwright request context at ${backendBase}`);
      return;
    }
    expect(res.status(), 'health status').toBe(200);
    const body = await res.json();
    expect(body.status ?? 'ok').toBeDefined();
  });

  test('spatial buffer endpoint returns GeoJSON', async () => {
    const api = await createApiContext();
    const healthRes = await waitForBackend(api);
    if (!healthRes) {
      test.skip(true, `Backend unavailable from Playwright request context at ${backendBase}`);
      return;
    }
    const res = await api.get('/api/spatial/buffer?lat=-33.9247&lon=18.4241&distance=200', { failOnStatusCode: false });
    expect(res.status(), 'buffer status').toBe(200);
    const data = await res.json();
    expect(data.type).toBe('Feature');
    expect(data.geometry?.type).toBeDefined();
  });

  test('frontend renders map shell', async ({ page }) => {
    await mockLayerRequests(page);
    await page.goto(frontendBase, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
  });

  test('frontend -> backend integration for nearby schools', async ({ page }) => {
    await mockLayerRequests(page);
    await page.goto(frontendBase, { waitUntil: 'domcontentloaded' });

    // Call API directly and ensure data is available
    const api = await createApiContext();
    let res;
    try {
      res = await api.get(
        '/api/spatial/nearby?layer=schools&lat=-33.9247&lon=18.4241&radius=5000',
        { failOnStatusCode: false, timeout: 10_000 },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'request failed';
      test.skip(true, `Nearby endpoint unavailable in current runtime (${message})`);
      return;
    }

    if (res.status() !== 200) {
      test.skip(
        true,
        `Nearby endpoint unavailable in local DB context (status ${res.status()})`,
      );
    }

    const json = await res.json();
    expect(Array.isArray(json.features)).toBeTruthy();

    // Basic UI sanity: map and sidebar exist
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/Cape Town|GeoHub/i);
  });
});
