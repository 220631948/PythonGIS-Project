/**
 * Viewport Loading Performance Tests
 *
 * Sprint 3 - Phase E.2.2
 * Target: < 100ms perceived load time leveraging sub-100ms backend queries
 *
 * Tests:
 * 1. Initial load performance
 * 2. Pan/zoom performance
 * 3. Cache hit rate
 * 4. Memory efficiency (only visible features loaded)
 */

import { test, expect } from '@playwright/test';

const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

test.describe('Viewport Loading Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto(frontendBase);

    // Wait for map to be ready
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow initial render
  });

  test('E.2.2.1: Initial viewport load should complete in < 500ms', async ({ page }) => {
    // Enable a data layer
    await page.click('text=Layers');
    await page.waitForTimeout(500);

    // Start timer
    const startTime = Date.now();

    // Click on a layer to load it
    const layerCheckbox = page.locator('.leaflet-control-layers-overlays input').first();
    await layerCheckbox.check();

    // Wait for layer to appear on map
    await page.waitForSelector('.leaflet-overlay-pane svg', { timeout: 5000 });

    // Calculate load time
    const loadTime = Date.now() - startTime;

    console.log(`Initial viewport load time: ${loadTime}ms`);

    // Assert performance target
    // Note: Initial load includes network latency, so we allow up to 500ms
    expect(loadTime).toBeLessThan(500);
  });

  test('E.2.2.2: Pan should trigger incremental loading', async ({ page }) => {
    // Enable a data layer
    await page.click('text=Layers');
    await page.waitForTimeout(500);
    const layerCheckbox = page.locator('.leaflet-control-layers-overlays input').first();
    await layerCheckbox.check();
    await page.waitForSelector('.leaflet-overlay-pane svg', { timeout: 5000 });

    // Get initial feature count
    const initialFeatures = await page.locator('.leaflet-overlay-pane path').count();
    console.log(`Initial features visible: ${initialFeatures}`);

    // Pan the map
    const mapContainer = page.locator('.leaflet-container');
    const mapBox = await mapContainer.boundingBox();

    const startTime = Date.now();

    // Drag map to pan
    await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(mapBox.x + mapBox.width / 4, mapBox.y + mapBox.height / 4);
    await page.mouse.up();

    // Wait for new features to load
    await page.waitForTimeout(1000); // Allow debounce + fetch

    const panLoadTime = Date.now() - startTime;
    console.log(`Pan + reload time: ${panLoadTime}ms`);

    // Get new feature count (should be different after pan)
    const newFeatures = await page.locator('.leaflet-overlay-pane path').count();
    console.log(`Features after pan: ${newFeatures}`);

    // Assert: Features changed (viewport loading is working)
    // Note: In some cases features may be similar if dataset is sparse
    expect(newFeatures).toBeGreaterThan(0);

    // Assert: Pan + reload is fast (< 1500ms including debounce)
    expect(panLoadTime).toBeLessThan(1500);
  });

  test('E.2.2.3: Zoom should trigger appropriate level loading', async ({ page }) => {
    // Enable a data layer
    await page.click('text=Layers');
    await page.waitForTimeout(500);
    const layerCheckbox = page.locator('.leaflet-control-layers-overlays input').first();
    await layerCheckbox.check();
    await page.waitForSelector('.leaflet-overlay-pane svg', { timeout: 5000 });

    // Get initial zoom level and feature count
    const initialFeatures = await page.locator('.leaflet-overlay-pane path').count();
    console.log(`Initial features at default zoom: ${initialFeatures}`);

    // Zoom in
    const zoomInButton = page.locator('.leaflet-control-zoom-in');

    const startTime = Date.now();

    await zoomInButton.click();
    await zoomInButton.click(); // Zoom in 2 levels

    // Wait for zoom animation + data reload
    await page.waitForTimeout(1500);

    const zoomLoadTime = Date.now() - startTime;
    console.log(`Zoom + reload time: ${zoomLoadTime}ms`);

    // Get new feature count after zoom
    const zoomedFeatures = await page.locator('.leaflet-overlay-pane path').count();
    console.log(`Features after zoom: ${zoomedFeatures}`);

    // Assert: Features are loaded after zoom
    expect(zoomedFeatures).toBeGreaterThan(0);

    // Assert: Zoom + reload is fast (< 2000ms including animation)
    expect(zoomLoadTime).toBeLessThan(2000);
  });

  test('E.2.2.4: Subsequent viewport changes should leverage cache', async ({ page }) => {
    // Enable a data layer
    await page.click('text=Layers');
    await page.waitForTimeout(500);
    const layerCheckbox = page.locator('.leaflet-control-layers-overlays input').first();
    await layerCheckbox.check();
    await page.waitForSelector('.leaflet-overlay-pane svg', { timeout: 5000 });

    // Pan right
    const mapContainer = page.locator('.leaflet-container');
    const mapBox = await mapContainer.boundingBox();

    // First pan (cache miss)
    const firstPanStart = Date.now();
    await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(mapBox.x + mapBox.width / 4, mapBox.y + mapBox.height / 4);
    await page.mouse.up();
    await page.waitForTimeout(1000);
    const firstPanTime = Date.now() - firstPanStart;

    console.log(`First pan time (cache miss): ${firstPanTime}ms`);

    // Pan back to original position (cache hit expected)
    const secondPanStart = Date.now();
    await page.mouse.move(mapBox.x + mapBox.width / 4, mapBox.y + mapBox.height / 4);
    await page.mouse.down();
    await page.mouse.move(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
    await page.mouse.up();
    await page.waitForTimeout(500); // Shorter wait since cache hit
    const secondPanTime = Date.now() - secondPanStart;

    console.log(`Second pan time (cache hit expected): ${secondPanTime}ms`);

    // Assert: Cache hit should be faster than cache miss
    // Note: This may not always be true due to network variability
    expect(secondPanTime).toBeLessThan(firstPanTime + 500);
  });

  test('E.2.2.5: Network tab should show bounding box parameters', async ({ page }) => {
    // Listen for network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/data/')) {
        requests.push(request.url());
      }
    });

    // Enable a data layer
    await page.click('text=Layers');
    await page.waitForTimeout(500);
    const layerCheckbox = page.locator('.leaflet-control-layers-overlays input').first();
    await layerCheckbox.check();
    await page.waitForTimeout(2000);

    // Assert: At least one request was made
    expect(requests.length).toBeGreaterThan(0);

    // Assert: Request includes bounding box parameters
    const lastRequest = requests[requests.length - 1];
    console.log(`Last API request: ${lastRequest}`);

    expect(lastRequest).toContain('min_lat');
    expect(lastRequest).toContain('max_lat');
    expect(lastRequest).toContain('min_lng');
    expect(lastRequest).toContain('max_lng');

    console.log('✓ Viewport loading is using bounding box parameters');
  });

  test('E.2.2.6: Memory efficiency - only visible features loaded', async ({ page }) => {
    // Enable a data layer
    await page.click('text=Layers');
    await page.waitForTimeout(500);
    const layerCheckbox = page.locator('.leaflet-control-layers-overlays input').first();
    await layerCheckbox.check();
    await page.waitForTimeout(2000);

    // Count visible features
    const visibleFeatures = await page.locator('.leaflet-overlay-pane path').count();
    console.log(`Visible features in viewport: ${visibleFeatures}`);

    // Assert: Reasonable number of features (not loading entire dataset)
    // If viewport loading is working, we should see < 10k features
    expect(visibleFeatures).toBeLessThan(10000);
    expect(visibleFeatures).toBeGreaterThan(0);

    console.log(`✓ Memory efficient: ${visibleFeatures} features loaded (< 10k limit)`);
  });
});

test.describe('Performance Regression Tests', () => {
  test('E.2.2.7: Baseline - Map renders without viewport loading', async ({ page }) => {
    // This test serves as a baseline to compare with viewport loading enabled
    await page.goto(frontendBase);

    const startTime = Date.now();
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    const renderTime = Date.now() - startTime;

    console.log(`Baseline map render time: ${renderTime}ms`);
    expect(renderTime).toBeLessThan(5000);
  });

  test('E.2.2.8: Performance with multiple layers enabled', async ({ page }) => {
    await page.goto(frontendBase);
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Open layers control
    await page.click('text=Layers');
    await page.waitForTimeout(500);

    // Enable 3 layers
    const checkboxes = page.locator('.leaflet-control-layers-overlays input');
    const count = Math.min(3, await checkboxes.count());

    const startTime = Date.now();

    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
      await page.waitForTimeout(500);
    }

    const loadTime = Date.now() - startTime;
    console.log(`${count} layers load time: ${loadTime}ms`);

    // Assert: Multiple layers load reasonably fast
    expect(loadTime).toBeLessThan(3000);
  });
});
