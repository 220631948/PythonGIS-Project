/**
 * GeoJSON Clustering Performance Tests
 *
 * Sprint 3 - E.2.1: GeoJSON Clustering
 * Target: 100k points @ 60fps rendering
 *
 * Tests:
 * 1. Server-side clustering API endpoint
 * 2. Frontend clustering hook integration
 * 3. Cluster rendering performance
 * 4. Zoom-based adaptive clustering
 * 5. Cluster click/expand behavior
 */

import { test, expect } from '@playwright/test';

test.describe('GeoJSON Clustering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:5173');

    // Wait for map to be ready
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow initial render
  });

  test('E.2.1.1: Clustering endpoint returns valid GeoJSON', async ({ page }) => {
    // Make API request directly to clustering endpoint
    const response = await page.request.post('http://localhost:8000/api/spatial/cluster', {
      data: {
        layer_name: 'clinics',
        bounds: {
          min_lat: -34.0,
          max_lat: -33.8,
          min_lng: 18.0,
          max_lng: 18.6,
        },
        zoom_level: 10,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Validate GeoJSON structure
    expect(data.type).toBe('FeatureCollection');
    expect(Array.isArray(data.features)).toBe(true);
    expect(data.metadata).toBeDefined();
    expect(data.metadata.cluster_count).toBeGreaterThan(0);
    expect(data.metadata.zoom).toBe(10);

    // Validate cluster features
    if (data.features.length > 0) {
      const feature = data.features[0];
      expect(feature.type).toBe('Feature');
      expect(feature.geometry.type).toBe('Point');
      expect(feature.properties.cluster_id).toBeDefined();
      expect(feature.properties.point_count).toBeGreaterThan(0);
      expect(feature.properties.is_cluster).toBeDefined();
    }

    console.log(`✓ Clustering returned ${data.metadata.cluster_count} clusters from ${data.metadata.total_points} points`);
  });

  test('E.2.1.2: Clustering respects bounding box validation', async ({ page }) => {
    // Test with invalid bounding box (too large - > 10°)
    const response = await page.request.post('http://localhost:8000/api/spatial/cluster', {
      data: {
        layer_name: 'clinics',
        bounds: {
          min_lat: -40.0,
          max_lat: -20.0, // 20° range - exceeds 10° limit
          min_lng: 10.0,
          max_lng: 30.0,  // 20° range - exceeds 10° limit
        },
        zoom_level: 10,
      },
    });

    // Should return validation error (400 or 422)
    expect([400, 422]).toContain(response.status());

    const error = await response.json();
    console.log(`✓ Validation error for oversized bbox: ${JSON.stringify(error)}`);
  });

  test('E.2.1.3: Cluster count adapts to zoom level', async ({ page }) => {
    // Low zoom - fewer clusters
    const lowZoomResponse = await page.request.post('http://localhost:8000/api/spatial/cluster', {
      data: {
        layer_name: 'clinics',
        bounds: {
          min_lat: -34.0,
          max_lat: -33.8,
          min_lng: 18.0,
          max_lng: 18.6,
        },
        zoom_level: 8,
      },
    });

    const lowZoomData = await lowZoomResponse.json();
    const lowZoomClusterCount = lowZoomData.metadata.cluster_count;

    // High zoom - more clusters
    const highZoomResponse = await page.request.post('http://localhost:8000/api/spatial/cluster', {
      data: {
        layer_name: 'clinics',
        bounds: {
          min_lat: -34.0,
          max_lat: -33.8,
          min_lng: 18.0,
          max_lng: 18.6,
        },
        zoom_level: 14,
      },
    });

    const highZoomData = await highZoomResponse.json();
    const highZoomClusterCount = highZoomData.metadata.cluster_count;

    console.log(`Low zoom (8): ${lowZoomClusterCount} clusters`);
    console.log(`High zoom (14): ${highZoomClusterCount} clusters`);

    // Higher zoom should have more clusters (more detail)
    expect(highZoomClusterCount).toBeGreaterThanOrEqual(lowZoomClusterCount);
  });

  test('E.2.1.4: Clustering performance < 500ms for viewport query', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.request.post('http://localhost:8000/api/spatial/cluster', {
      data: {
        layer_name: 'clinics',
        bounds: {
          min_lat: -34.0,
          max_lat: -33.8,
          min_lng: 18.0,
          max_lng: 18.6,
        },
        zoom_level: 12,
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    console.log(`Clustering query time: ${duration}ms`);

    // Assert: Clustering query completes in < 500ms (leveraging Sprint 3 indexes)
    expect(duration).toBeLessThan(500);
  });

  test('E.2.1.5: Frontend renders cluster markers on map', async ({ page }) => {
    // Enable a point layer that supports clustering
    await page.click('text=Layers');
    await page.waitForTimeout(500);

    // Find "Clinics" layer checkbox (or similar point layer)
    const clinicsCheckbox = page.locator('text=Clinics').first();
    if (await clinicsCheckbox.isVisible()) {
      await clinicsCheckbox.click();
      await page.waitForTimeout(2000); // Allow clustering to load
    }

    // Check if cluster markers are rendered
    // Cluster markers are CircleMarkers rendered by ClusterLayer
    const clusterMarkers = page.locator('.leaflet-interactive[stroke="#fff"]');
    const count = await clusterMarkers.count();

    console.log(`Rendered ${count} cluster markers on map`);

    // Assert: At least some clusters are visible
    expect(count).toBeGreaterThan(0);
  });

  test('E.2.1.6: Clicking cluster marker zooms to cluster bounds', async ({ page }) => {
    // Enable a point layer
    await page.click('text=Layers');
    await page.waitForTimeout(500);

    const clinicsCheckbox = page.locator('text=Clinics').first();
    if (await clinicsCheckbox.isVisible()) {
      await clinicsCheckbox.click();
      await page.waitForTimeout(2000);
    }

    // Get initial zoom level
    const initialZoom = await page.evaluate(() => {
      const map = window.leafletMap || window.map;
      return map ? map.getZoom() : null;
    });

    console.log(`Initial zoom: ${initialZoom}`);

    // Click on a cluster marker
    const clusterMarker = page.locator('.leaflet-interactive[stroke="#fff"]').first();
    if (await clusterMarker.isVisible()) {
      await clusterMarker.click();
      await page.waitForTimeout(1000);

      // Get new zoom level
      const newZoom = await page.evaluate(() => {
        const map = window.leafletMap || window.map;
        return map ? map.getZoom() : null;
      });

      console.log(`New zoom after cluster click: ${newZoom}`);

      // Assert: Zoom increased after clicking cluster
      if (initialZoom) {
        expect(newZoom).toBeGreaterThan(initialZoom);
      }
    } else {
      console.log('⚠ No cluster markers found, skipping zoom test');
    }
  });

  test('E.2.1.7: Cluster count tooltips display correctly', async ({ page }) => {
    // Enable a point layer
    await page.click('text=Layers');
    await page.waitForTimeout(500);

    const clinicsCheckbox = page.locator('text=Clinics').first();
    if (await clinicsCheckbox.isVisible()) {
      await clinicsCheckbox.click();
      await page.waitForTimeout(2000);
    }

    // Hover over cluster marker to reveal tooltip
    const clusterMarker = page.locator('.leaflet-interactive[stroke="#fff"]').first();
    if (await clusterMarker.isVisible()) {
      await clusterMarker.hover();
      await page.waitForTimeout(500);

      // Check for tooltip with cluster count
      const tooltip = page.locator('.cluster-count-tooltip');
      const isVisible = await tooltip.isVisible();

      console.log(`Cluster count tooltip visible: ${isVisible}`);

      // Assert: Tooltip is displayed
      expect(isVisible).toBe(true);

      // Get tooltip text (should be a number or "X.Xk")
      const tooltipText = await tooltip.textContent();
      console.log(`Tooltip text: ${tooltipText}`);

      // Assert: Tooltip contains a number
      expect(tooltipText).toMatch(/\d+/);
    } else {
      console.log('⚠ No cluster markers found, skipping tooltip test');
    }
  });

  test('E.2.1.8: Clustering respects layer name validation', async ({ page }) => {
    // Test with invalid layer name (SQL injection attempt)
    const response = await page.request.post('http://localhost:8000/api/spatial/cluster', {
      data: {
        layer_name: "clinics'; DROP TABLE users; --",
        bounds: {
          min_lat: -34.0,
          max_lat: -33.8,
          min_lng: 18.0,
          max_lng: 18.6,
        },
        zoom_level: 10,
      },
    });

    // Should return validation error (400 or 422)
    expect([400, 422]).toContain(response.status());

    const error = await response.json();
    console.log(`✓ SQL injection blocked: ${JSON.stringify(error)}`);
  });
});

test.describe('Clustering Performance Regression', () => {
  test('E.2.1.9: Baseline - Direct GeoJSON loading without clustering', async ({ page }) => {
    // This test serves as a baseline to compare clustering performance
    const startTime = Date.now();

    const response = await page.request.get(
      'http://localhost:8000/api/data/clinics?limit=1000'
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);

    const data = await response.json();
    const featureCount = data.features?.length || 0;

    console.log(`Baseline: Loaded ${featureCount} features in ${duration}ms`);
  });

  test('E.2.1.10: Memory efficiency - clustered vs unclustered', async ({ page }) => {
    // Enable point layer without clustering (high zoom)
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    await page.click('text=Layers');
    await page.waitForTimeout(500);

    const clinicsCheckbox = page.locator('text=Clinics').first();
    if (await clinicsCheckbox.isVisible()) {
      await clinicsCheckbox.click();

      // Zoom in to disable clustering (zoom >= 15)
      const zoomInButton = page.locator('.leaflet-control-zoom-in');
      for (let i = 0; i < 5; i++) {
        await zoomInButton.click();
        await page.waitForTimeout(300);
      }

      await page.waitForTimeout(2000);

      // Count individual markers (unclustered)
      const unclusteredMarkers = page.locator('.leaflet-interactive');
      const unclusteredCount = await unclusteredMarkers.count();

      console.log(`Unclustered mode: ${unclusteredCount} individual markers rendered`);

      // Zoom out to enable clustering (zoom < 15)
      const zoomOutButton = page.locator('.leaflet-control-zoom-out');
      for (let i = 0; i < 5; i++) {
        await zoomOutButton.click();
        await page.waitForTimeout(300);
      }

      await page.waitForTimeout(2000);

      // Count cluster markers (clustered)
      const clusteredMarkers = page.locator('.leaflet-interactive[stroke="#fff"]');
      const clusteredCount = await clusteredMarkers.count();

      console.log(`Clustered mode: ${clusteredCount} cluster markers rendered`);

      // Assert: Clustering significantly reduces marker count
      expect(clusteredCount).toBeLessThan(unclusteredCount / 2);
      console.log(`✓ Memory efficiency: ${((1 - clusteredCount / unclusteredCount) * 100).toFixed(0)}% reduction in markers`);
    } else {
      console.log('⚠ Clinics layer not available, skipping memory test');
    }
  });
});
