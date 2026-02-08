import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

const screenshotsDir = path.join(__dirname, 'screenshots');
const evidenceDir = path.join(__dirname, 'evidence');
fs.mkdirSync(screenshotsDir, { recursive: true });
fs.mkdirSync(evidenceDir, { recursive: true });

const LAYERS = [
  'zoning-layer', 'building-footprints-layer', 'open-spaces-layer',
  'services-layer', 'clinics-layer', 'housing-offices-layer', 'courts-layer',
  'parks-layer', 'sports-layer', 'swimming-pools-layer',
  'safety-layer', 'flood-layer', 'cemeteries-layer', 'trading-layer'
];

// Selectors to detect map layer rendering (covers vector paths, markers, tiles)
const LAYER_RENDER_SELECTORS = '.leaflet-overlay-pane svg path, .leaflet-marker-icon, .leaflet-tile';

test.describe('Map Layer Visual Verification (e2e)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { state: 'visible', timeout: 30_000 });
  });

  for (const layerId of LAYERS) {
    test(`toggle and load: ${layerId}`, async ({ page }) => {
      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        // capture all console messages for diagnostics
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      });

      const card = page.locator(`[data-testid="${layerId}"]`);
      await expect(card).toBeVisible();

      // Record current layer render candidates so we can detect when the layer has added elements to the map
      const initialCount = await page.$$eval(LAYER_RENDER_SELECTORS, els => els.length);

      // Wait for the API response from either /api/data/* or /api/portal/datasets/*
      const responsePromise = page.waitForResponse((response) => {
        const u = response.url();
        return (
          (u.includes('/api/data/') || u.includes('/api/portal/datasets/')) &&
          response.status() === 200
        );
      }, { timeout: 30_000 });

      await card.click();

      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();

      // Wait until the DOM shows additional map elements (indicating layer render), or timeout
      await page.waitForFunction(
        (args: unknown) => {
          const [sel, initial] = args as [string, number];
          return document.querySelectorAll(sel).length > initial;
        },
        [LAYER_RENDER_SELECTORS, initialCount],
        { timeout: 20_000 }
      );

      // Short additional pause to let rendering stabilise
      await page.waitForTimeout(500);

      const screenshotPath = path.join(screenshotsDir, `evidence-${layerId}.png`);
      await page.screenshot({ path: screenshotPath });

      // Write console messages and full page HTML for debugging/evidence
      const consolePath = path.join(evidenceDir, `console-${layerId}.log`);
      const pageHtmlPath = path.join(evidenceDir, `page-${layerId}.html`);
      fs.writeFileSync(consolePath, consoleMessages.join('\n'));
      fs.writeFileSync(pageHtmlPath, await page.content());

      // Fail test if any console errors were captured
      const errors = consoleMessages.filter(m => m.startsWith('[error]'));
      if (errors.length > 0) {
        throw new Error(`Console errors found for layer ${layerId}. See ${consolePath} and ${pageHtmlPath}\n${errors.join('\n')}`);
      }

      // Toggle off to restore initial state
      await card.click();
    });
  }
});