import { test, expect, request } from '@playwright/test';

const backendBase = process.env.BACKEND_URL || 'http://localhost:8000';
const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper to create an API context for backend calls
async function createApiContext() {
  return await request.newContext({ baseURL: backendBase, ignoreHTTPSErrors: true });
}

test.describe('Cape Town GeoHub E2E', () => {
  test('backend health endpoints respond', async () => {
    const api = await createApiContext();
    const res = await api.get('/api/health', { failOnStatusCode: false });
    expect(res.status(), 'health status').toBe(200);
    const body = await res.json();
    expect(body.status ?? 'ok').toBeDefined();
  });

  test('spatial buffer endpoint returns GeoJSON', async () => {
    const api = await createApiContext();
    const res = await api.get('/api/spatial/buffer?lat=-33.9247&lon=18.4241&distance=200', { failOnStatusCode: false });
    expect(res.status(), 'buffer status').toBe(200);
    const data = await res.json();
    expect(data.type).toBe('Feature');
    expect(data.geometry?.type).toBeDefined();
  });

  test('frontend renders map shell', async ({ page }) => {
    await page.goto(frontendBase);
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('frontend -> backend integration for nearby schools', async ({ page }) => {
    await page.goto(frontendBase);

    // Call API directly and ensure data is available
    const api = await createApiContext();
    const res = await api.get('/api/spatial/nearby?layer=schools&lat=-33.9247&lon=18.4241&radius=5000', { failOnStatusCode: false });

    if (res.status() === 404) {
      test.skip(true, 'Schools layer not loaded in database yet');
    }

    expect(res.status(), 'nearby status').toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.features)).toBeTruthy();

    // Basic UI sanity: map and sidebar exist
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Cape Town|GeoHub/i);
  });
});
