// spec: specs/test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Home Page - Load and Branding', () => {
  test('Home page loads with correct title, heading, and branding', async ({ page }) => {
    // 1. Navigate to the base URL '/'
    await page.goto('/');
    await expect(page).toHaveTitle('Automation playground');
    const brandingLink = page.getByRole('link', { name: 'Automation Playground' });
    await expect(brandingLink).toBeVisible();
    await expect(brandingLink).toHaveAttribute('href', '/');

    // 2. Verify the hero section is visible
    await expect(page.getByRole('heading', { name: 'The Library of Components for Automation Testing', level: 1 })).toBeVisible();
    await expect(page.getByText('Sharpen Your Automation Skills Through Real Examples')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse all components' })).toBeVisible();

    // 3. Verify the footer is visible at the bottom of the page
    await expect(page.getByText('© 2026 Automation Playground.')).toBeVisible();
    await expect(page.getByText('All rights reserved.')).toBeVisible();
  });

  test('Header navigation links are present and correctly targeted', async ({ page }) => {
    // 1. Navigate to '/' and locate the header navigation region
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Components' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'F.A.Q' })).toBeVisible();
    await expect(nav.getByRole('link')).toHaveCount(3);

    // 2. Inspect the href attributes of the 'Home', 'Components', and 'F.A.Q' links without clicking
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'Components' })).toHaveAttribute('href', '/components');
    await expect(nav.getByRole('link', { name: 'F.A.Q' })).toHaveAttribute('href', '/faq');
  });
});
