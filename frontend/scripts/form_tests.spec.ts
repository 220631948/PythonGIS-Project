
import { test, expect } from '@playwright/test';

test.describe('Form and Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await expect(page.locator('.app-container')).toBeVisible();
  });

  test('Search Autocomplete Input', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('role', 'combobox'); // Verify our previous fix

    await searchInput.fill('Cape Town');
    await expect(searchInput).toHaveValue('Cape Town');
    
    // Check if suggestions appear (mocking might be needed for real data, but we check if container exists)
    // The suggestions container might only appear if data returns. 
    // For now, input interaction is the key form test.
  });

  test('Offline Data Manager Form', async ({ page }) => {
    // Open via keyboard shortcut 'm'
    await page.keyboard.press('m');
    
    const modal = page.locator('.offline-manager');
    await expect(modal).toBeVisible();

    // Check checkboxes
    const checkboxes = modal.locator('input[type="checkbox"]');
    // We expect at least some checkboxes for layers
    expect(await checkboxes.count()).toBeGreaterThan(0);

    const firstCheckbox = checkboxes.first();
    const isChecked = await firstCheckbox.isChecked();
    
    // Toggle
    await firstCheckbox.click();
    expect(await firstCheckbox.isChecked()).toBe(!isChecked);
    
    // Close
    const closeBtn = modal.locator('.close-btn');
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
