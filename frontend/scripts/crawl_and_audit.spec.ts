import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';

test('crawl and audit', async ({ page }) => {
  const visited = new Set<string>();
  const queue = ['/'];
  const inventory: any[] = [];
  const accessibilityReports: any[] = [];

  while (queue.length > 0) {
    const route = queue.shift()!;
    if (visited.has(route)) continue;
    visited.add(route);

    console.log(`Visiting: ${route}`);
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    // Accessibility check
    try {
      const results = await new AxeBuilder({ page }).analyze();
      accessibilityReports.push({ route, violations: results.violations });
    } catch (e) {
      console.error(`Axe failed on ${route}:`, e);
    }

    // Inventory interactive elements
    const elements = await page.evaluate(() => {
      const interactive = [];
      const nodes = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
      for (const node of nodes) {
        interactive.push({
          tagName: node.tagName.toLowerCase(),
          text: node.textContent?.slice(0, 50),
          id: node.id,
          class: node.className,
          href: (node as HTMLAnchorElement).href,
          type: (node as HTMLInputElement).type,
          ariaLabel: node.getAttribute('aria-label'),
        });
      }
      return interactive;
    });

    inventory.push({ route, elements });

    // Collect new links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.getAttribute('href'))
        .filter(href => href && href.startsWith('/') && !href.startsWith('//'));
    });

    for (const link of links) {
      if (link && !visited.has(link) && !queue.includes(link)) {
        queue.push(link);
      }
    }
  }

  fs.writeFileSync('ui_inventory.json', JSON.stringify(inventory, null, 2));
  fs.writeFileSync('accessibility_report.json', JSON.stringify(accessibilityReports, null, 2));
});
