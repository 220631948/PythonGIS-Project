import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

const screenshotsDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const LAYERS = [
  'zoning-layer', 'building-footprints-layer', 'open-spaces-layer',
  'services-layer', 'clinics-layer', 'housing-offices-layer', 'courts-layer',
  'parks-layer', 'sports-layer', 'swimming-pools-layer',
  'safety-layer', 'flood-layer', 'cemeteries-layer', 'trading-layer'
];

test.describe('Map Layer Visual Verification (e2e)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { state: 'visible', timeout: 30_000 });
  });

  for (const layerId of LAYERS) {
    test(`toggle and load: ${layerId}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const card = page.locator(`[data-testid="${layerId}"]`);
      await expect(card).toBeVisible();

      // Wait for the API response from either /api/data/* or /api/portal/datasets/*
      const responsePromise = page.waitForResponse((response) => {
        const u = response.url();
        return (
          (u.includes('/api/data/') || u.includes('/api/portal/datasets/')) &&
          response.status() === 200
        );
      }, { timeout: 15_000 });

      await card.click();

      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();

      // allow some time for rendering
      await page.waitForTimeout(700);

      await page.screenshot({ path: path.join(screenshotsDir, `evidence-${layerId}.png`) });

      expect(consoleErrors).toHaveLength(0);

      // Toggle off to restore initial state
      await card.click();
    });
  }
});