// accessibility.spec.js
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility checks', () => {
  test('Home page should have no WCAG violations', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Inject axe
    await injectAxe(page);
    // Run axe core checks
    const violations = await checkA11y(page, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2aa']
        }
      }
    });
    expect(violations).toEqual([]);
    // Capture screenshot after fixes
    await page.screenshot({ path: 'accessibility-after.png', fullPage: true });
  });
});
