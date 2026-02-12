/**
 * Performance Harness for Cape Town GeoHub
 * 
 * Provides:
 * - Deterministic map-ready detection
 * - Performance timing measurements
 * - Auth support (placeholder)
 * - Baseline performance metrics
 */
import { test, expect } from '@playwright/test';

const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
const backendBase = process.env.BACKEND_URL || 'http://localhost:8000';

// Performance budgets (in milliseconds)
const PERF_BUDGETS = {
  pageLoad: 3000,
  mapReady: 2000,
  firstLayerRender: 1500,
  interactionReady: 1000,
};

/**
 * Wait for map to be fully ready and interactive
 * Uses multiple signals to ensure deterministic detection
 */
async function waitForMapReady(page) {
  const startTime = Date.now();
  
  // 1. Wait for Leaflet container to exist
  await page.waitForSelector('.leaflet-container', { timeout: 10000 });
  
  // 2. Wait for map tiles to load (check for tile layer)
  await page.waitForSelector('.leaflet-tile-loaded', { timeout: 10000 });
  
  // 3. Wait for zoom controls to be interactive
  await page.waitForSelector('.leaflet-control-zoom', { timeout: 5000 });
  
  // 4. Ensure network is idle (no pending requests)
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  
  // 5. Check that map has rendered at least some tiles
  const tileCount = await page.locator('.leaflet-tile-loaded').count();
  expect(tileCount, 'Map should have loaded tiles').toBeGreaterThan(0);
  
  // 6. Add a small buffer to ensure all event handlers are attached
  await page.waitForTimeout(500);
  
  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Collect performance metrics from the browser
 */
async function collectPerformanceMetrics(page) {
  return await page.evaluate(() => {
    const perfData = window.performance.getEntriesByType('navigation')[0];
    const paintEntries = window.performance.getEntriesByType('paint');
    
    const firstPaint = paintEntries.find(e => e.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(e => e.name === 'first-contentful-paint');
    
    return {
      // Navigation timing
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      domInteractive: perfData.domInteractive - perfData.fetchStart,
      
      // Paint timing
      firstPaint: firstPaint ? firstPaint.startTime : null,
      firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : null,
      
      // Resource timing summary
      resourceCount: window.performance.getEntriesByType('resource').length,
      
      // Memory (if available)
      memory: window.performance.memory ? {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
      } : null,
    };
  });
}

/**
 * Auth helper (placeholder for future implementation)
 */
async function setupAuth(page) {
  // For now, no auth is required
  // Future: handle JWT tokens, session cookies, etc.
  // await page.context().addCookies([...]);
  return true;
}

test.describe('Performance Harness', () => {
  test.beforeEach(async ({ page }) => {
    // Set up auth if needed
    await setupAuth(page);
  });

  test('baseline: page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate and wait for initial load
    await page.goto(frontendBase, { waitUntil: 'domcontentloaded' });
    
    const pageLoadTime = Date.now() - startTime;
    
    // Collect browser performance metrics
    const metrics = await collectPerformanceMetrics(page);
    
    console.log('Page Load Metrics:', {
      pageLoadTime,
      ...metrics,
    });
    
    // Verify against budget
    expect(pageLoadTime, 'Page load should meet budget').toBeLessThan(PERF_BUDGETS.pageLoad);
    
    // Store metrics for CI reporting
    await page.evaluate((m) => {
      window.__PERF_METRICS__ = m;
    }, { pageLoadTime, ...metrics });
  });

  test('baseline: map ready performance', async ({ page }) => {
    await page.goto(frontendBase);
    
    const mapReadyTime = await waitForMapReady(page);
    
    console.log('Map Ready Time:', mapReadyTime, 'ms');
    
    // Verify against budget
    expect(mapReadyTime, 'Map ready should meet budget').toBeLessThan(PERF_BUDGETS.mapReady);
    
    // Verify map is interactive
    const zoomInButton = page.locator('.leaflet-control-zoom-in');
    await expect(zoomInButton).toBeVisible();
    await expect(zoomInButton).toBeEnabled();
  });

  test('baseline: layer load performance', async ({ page }) => {
    // Intercept and measure layer requests
    const layerRequests = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/portal/datasets') || 
          request.url().includes('/api/performance/cluster')) {
        layerRequests.push({
          url: request.url(),
          startTime: Date.now(),
        });
      }
    });
    
    page.on('response', response => {
      const req = layerRequests.find(r => r.url === response.url() && !r.endTime);
      if (req) {
        req.endTime = Date.now();
        req.duration = req.endTime - req.startTime;
        req.status = response.status();
      }
    });
    
    // Load with a test layer
    await page.goto(`${frontendBase}/?layers=informal-settlements`);
    await waitForMapReady(page);
    
    // Wait a bit more for layer data to load
    await page.waitForTimeout(2000);
    
    // Analyze layer request performance
    const completedRequests = layerRequests.filter(r => r.endTime);
    
    if (completedRequests.length > 0) {
      const avgDuration = completedRequests.reduce((sum, r) => sum + r.duration, 0) / completedRequests.length;
      const maxDuration = Math.max(...completedRequests.map(r => r.duration));
      
      console.log('Layer Load Performance:', {
        requestCount: completedRequests.length,
        avgDuration,
        maxDuration,
        requests: completedRequests,
      });
      
      // Verify average request time meets budget
      expect(avgDuration, 'Average layer load should meet budget').toBeLessThan(PERF_BUDGETS.firstLayerRender);
    }
  });

  test('baseline: interaction responsiveness', async ({ page }) => {
    await page.goto(frontendBase);
    await waitForMapReady(page);
    
    // Test zoom interaction
    const startTime = Date.now();
    await page.click('.leaflet-control-zoom-in');
    
    // Wait for zoom animation to complete
    await page.waitForTimeout(500);
    
    const zoomInteractionTime = Date.now() - startTime;
    
    console.log('Zoom Interaction Time:', zoomInteractionTime, 'ms');
    
    expect(zoomInteractionTime, 'Zoom should be responsive').toBeLessThan(PERF_BUDGETS.interactionReady);
  });

  test('baseline: map panning performance', async ({ page }) => {
    await page.goto(frontendBase);
    await waitForMapReady(page);
    
    // Get map bounds before pan
    const initialBounds = await page.evaluate(() => {
      const map = window.map || document.querySelector('.leaflet-container')?._leaflet_map;
      return map ? map.getBounds().toBBoxString() : null;
    });
    
    // Perform pan by dragging map
    const mapContainer = page.locator('.leaflet-container');
    const box = await mapContainer.boundingBox();
    
    if (box) {
      const startTime = Date.now();
      
      // Drag from center to simulate pan
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100, { steps: 10 });
      await page.mouse.up();
      
      // Wait for pan to settle
      await page.waitForTimeout(500);
      
      const panTime = Date.now() - startTime;
      
      // Get new bounds
      const newBounds = await page.evaluate(() => {
        const map = window.map || document.querySelector('.leaflet-container')?._leaflet_map;
        return map ? map.getBounds().toBBoxString() : null;
      });
      
      console.log('Pan Performance:', {
        panTime,
        boundsChanged: initialBounds !== newBounds,
      });
      
      // Verify map moved
      expect(newBounds, 'Map should have panned').not.toBe(initialBounds);
      expect(panTime, 'Pan should be smooth').toBeLessThan(PERF_BUDGETS.interactionReady);
    }
  });

  test('regression: no duplicate layer fetches', async ({ page }) => {
    // Track all requests to layer endpoints
    const requestUrls = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/portal/datasets') && 
          request.url().includes('/geojson')) {
        requestUrls.push(request.url());
      }
    });
    
    // Navigate with a layer
    await page.goto(`${frontendBase}/?layers=test-layer`);
    
    // Mock the response if needed
    await page.route('**/api/portal/datasets/test-layer/geojson', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: { type: "Point", coordinates: [18.4241, -33.9249] },
            properties: { name: "Test Point" }
          }]
        })
      });
    });
    
    await waitForMapReady(page);
    await page.waitForTimeout(2000);
    
    // Count unique requests
    const uniqueRequests = [...new Set(requestUrls)];
    const duplicateCount = requestUrls.length - uniqueRequests.length;
    
    console.log('Layer Fetch Analysis:', {
      totalRequests: requestUrls.length,
      uniqueRequests: uniqueRequests.length,
      duplicates: duplicateCount,
    });
    
    // Should have minimal duplicates (React strict mode may cause 2x)
    expect(duplicateCount, 'Should minimize duplicate fetches').toBeLessThan(2);
  });

  test('backend: cluster endpoint performance', async ({ page }) => {
    // Test PostGIS clustering endpoint directly
    const response = await page.request.get(
      `${backendBase}/api/performance/cluster/informal-settlements?zoom=12&bounds=18.3,-34.0,18.5,-33.8`
    );
    
    const responseTime = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(r => r.name.includes('/cluster/'))
        .map(r => r.duration)[0] || 0;
    });
    
    expect(response.status(), 'Cluster endpoint should respond').toBe(200);
    
    const data = await response.json();
    
    console.log('Cluster Endpoint Performance:', {
      responseTime,
      featureCount: data.features?.length || 0,
      metadata: data.metadata,
    });
    
    // Cluster endpoint should be fast
    if (responseTime > 0) {
      expect(responseTime, 'Cluster response should be fast').toBeLessThan(1000);
    }
  });
});
