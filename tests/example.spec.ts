import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://www.automationplayground.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Automation Playground/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://www.automationplayground.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
