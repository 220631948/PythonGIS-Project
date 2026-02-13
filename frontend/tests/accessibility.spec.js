import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
const emptyFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

async function mockLayerRequests(page) {
  const body = JSON.stringify(emptyFeatureCollection);
  await page.route('**/api/data/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body }),
  );
  await page.route('**/api/portal/datasets/**/geojson**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body }),
  );
}

test.describe('Accessibility checks', () => {
  test('Home page should have no critical WCAG violations', async ({ page }) => {
    await mockLayerRequests(page);
    await page.goto(frontendBase, { waitUntil: 'domcontentloaded' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = results.violations.filter(
      (violation) => violation.impact === 'critical',
    );
    expect(criticalViolations, 'Critical accessibility violations detected').toEqual([]);
    console.log(
      `A11y summary: total=${results.violations.length}, critical=${criticalViolations.length}`,
    );

    await page.screenshot({
      path: 'test-results/accessibility-after.png',
      fullPage: true,
    });
  });
});
