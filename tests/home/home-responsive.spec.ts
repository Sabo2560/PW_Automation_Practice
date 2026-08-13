// spec: specs/test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Home Page - Responsive and Accessibility Checks', () => {
  test('Home page renders correctly on mobile viewport', async ({ page }) => {
    // 1. Set viewport to a mobile size (e.g. 375x812) and navigate to '/'
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Library of Components for Automation Testing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse all components' })).toBeVisible();
    // On mobile, navigation is collapsed behind a hamburger menu button; open it to access nav links.
    await page.getByRole('banner').getByRole('button').click();
    const navDialog = page.getByRole('dialog');
    await expect(navDialog.getByRole('navigation')).toBeVisible();
    await expect(navDialog.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(navDialog.getByRole('link', { name: 'Components' })).toBeVisible();
    await expect(navDialog.getByRole('link', { name: 'F.A.Q' })).toBeVisible();
    await expect(page.getByText('© 2026 Automation Playground.')).toBeVisible();
  });

  test('Home page renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'The Library of Components for Automation Testing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse all components' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible();
    await expect(page.getByText('© 2026 Automation Playground.')).toBeVisible();
  });

  test('Home page renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'The Library of Components for Automation Testing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse all components' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible();
    await expect(page.getByText('© 2026 Automation Playground.')).toBeVisible();
  });

  test('Key images on the home page have accessible alt text', async ({ page }) => {
    // 1. Navigate to '/' and inspect all <img> elements rendered on the page
    await page.goto('/');
    const illustrations = page.getByRole('img', { name: 'Automation Testing Illustration' });
    await expect(illustrations).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      await expect(illustrations.nth(i)).toHaveAttribute('alt', /.+/);
    }
    const buyMeACoffeeSmallImg = page.getByRole('img', { name: 'buy me a coffee', exact: true });
    await expect(buyMeACoffeeSmallImg).toHaveAttribute('alt', /.+/);
    const buyMeACoffeeLinkImg = page.getByRole('img', { name: 'Buy Me A Coffee', exact: true });
    await expect(buyMeACoffeeLinkImg).toHaveAttribute('alt', /.+/);

    const allImages = page.locator('img');
    const imageCount = await allImages.count();
    for (let i = 0; i < imageCount; i++) {
      await expect(allImages.nth(i)).toHaveAttribute('alt', /.*/);
    }
  });

  test('Home page headings are present with correct text and levels', async ({ page }) => {
    // Note: this checks that each expected heading exists with the right
    // level — it does NOT validate overall document hierarchy (e.g. only
    // one h1 per page). The page actually has two <h1>s (branding +
    // hero heading), which is a real accessibility finding — flagged
    // separately in the test plan rather than asserted here as a failure,
    // since fixing it is a site change, not a test change.
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Automation Playground', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Library of Components for Automation Testing', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Automation newbie?', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Got a feature in Mind?', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Like the project?', level: 2 })).toBeVisible();
  });
});