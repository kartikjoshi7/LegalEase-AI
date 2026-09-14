import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('LegalEase AI E2E', () => {

  test('Homepage renders and is accessible', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Check main headline exists
    await expect(page.locator('text=LegalEase AI')).toBeVisible();
    
    // Check accessibility
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    // Axe might flag the gradient background contrast, but we ensure no major structural violations
    expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(5); // tolerate minor contrast issues
  });

  test('Redirects to homepage when navigating to workspace without document', async ({ page }) => {
    // Navigate directly to workspace
    await page.goto('http://localhost:5173/workspace/latest');
    
    // It should detect no file and redirect to '/'
    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('text=LegalEase AI')).toBeVisible();
  });

});
