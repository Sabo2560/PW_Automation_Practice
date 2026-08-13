import { test, expect } from '@playwright/test';

// This file is referenced as the "seed" in test plans (specs/*.plan.md) and by the
// Playwright test-generator/planner tools. It documents baseline patterns used across
// this project's specs — navigation, visibility checks, and link/href assertions —
// so new tests generated from a plan follow the same conventions.

test.describe('Seed examples', () => {
  test('navigate and verify page title/heading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Automation playground');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('click a link and verify navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse all components' }).click();
    await expect(page).toHaveURL(/\/components/);
  });

  test('verify an href without navigating', async ({ page }) => {
    await page.goto('/');
    const faqLink = page.getByRole('link', { name: 'F.A.Q' });
    await expect(faqLink).toHaveAttribute('href', '/faq');
  });
});
