// spec: specs/test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Home Page - Navigation Journeys', () => {
  test('Clicking the logo/branding link navigates to (or stays on) the home page', async ({ page }) => {
    // 1. Navigate to '/components' first (to ensure not already on home), then click the 'Automation Playground' branding link in the header
    await page.goto('/components');
    await page.getByRole('link', { name: 'Automation Playground' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'The Library of Components for Automation Testing' })).toBeVisible();
  });

  test('Clicking header \'Components\' nav link navigates to Components page', async ({ page }) => {
    // 1. Navigate to '/' and click the 'Components' link in the header navigation
    await page.goto('/');
    await page.getByRole('link', { name: 'Components', exact: true }).click();
    await expect(page).toHaveURL('/components');
    await expect(page.getByRole('heading', { name: 'Component Showcase' })).toBeVisible();
  });

  test('Clicking header \'F.A.Q\' nav link navigates to FAQ page', async ({ page }) => {
    // 1. Navigate to '/' and click the 'F.A.Q' link in the header navigation
    await page.goto('/');
    await page.getByRole('link', { name: 'F.A.Q' }).click();
    await expect(page).toHaveURL('/faq');
    await expect(page.getByText('Welcome to the Automation Playground FAQ!')).toBeVisible();
  });

  test('Clicking header \'Home\' nav link while already on home page keeps user on home page', async ({ page }) => {
    // 1. Navigate to '/' and click the 'Home' link in the header navigation
    await page.goto('/');
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'The Library of Components for Automation Testing' })).toBeVisible();
  });

  test('\'Browse all components\' hero CTA navigates to Components page', async ({ page }) => {
    // 1. Navigate to '/' and click the 'Browse all components' link in the hero section
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse all components' }).click();
    await expect(page).toHaveURL('/components');
    await expect(page.getByRole('heading', { name: 'Component Showcase' })).toBeVisible();
  });

  test('\'Get started\' CTA in \'Automation newbie?\' section navigates to Components page', async ({ page }) => {
    // 1. Navigate to '/' and scroll to the 'Automation newbie?' section, then click the 'Get started' link
    await page.goto('/');
    await page.getByRole('link', { name: 'Get started' }).click();
    await expect(page).toHaveURL('/components');
    await expect(page.getByRole('heading', { name: 'Component Showcase' })).toBeVisible();
  });

  test('\'Scroll down\' hero anchor scrolls to the \'learn-more\' section on the same page', async ({ page }) => {
    // 1. Navigate to '/' and click the 'Scroll down' link in the hero section
    await page.goto('/');
    await page.getByRole('link', { name: 'Scroll down' }).click();
    await expect(page).toHaveURL('/#learn-more');
    await expect(page.getByRole('heading', { name: 'Automation newbie?' })).toBeVisible();
  });
});
