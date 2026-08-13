// spec: specs/test-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Home Page - Content Sections and External Links', () => {
  test('\'Automation newbie?\' section displays expected copy and illustration', async ({ page }) => {
    // 1. Navigate to '/' and scroll to the 'Automation newbie?' section
    await page.goto('/');
    const newbieSection = page.locator('#learn-more');
    await expect(newbieSection.getByRole('heading', { name: 'Automation newbie?', level: 2 })).toBeVisible();
    await expect(page.getByText('Automation Playground is a testing space for new automation engineers')).toBeVisible();
    const illustration = newbieSection.getByRole('img', { name: 'Automation Testing Illustration' });
    await expect(illustration).toBeVisible();
    await expect(illustration).toHaveAttribute('alt', /.+/);
    await expect(newbieSection.getByRole('link', { name: 'Get started' })).toBeVisible();
  });

  test('\'Got a feature in Mind?\' section displays expected copy', async ({ page }) => {
    // 1. Navigate to '/' and scroll to the 'Got a feature in Mind?' section
    await page.goto('/');
    const featureSection = page.locator('section').filter({ hasText: 'Got a feature in Mind?Drop us' });
    await expect(page.getByRole('heading', { name: 'Got a feature in Mind?', level: 2 })).toBeVisible();
    await expect(page.getByText('Drop us a message — we’re always open to improvements and experiments!')).toBeVisible();
    await expect(featureSection.getByRole('img')).toBeVisible();
  });

  test('\'Like the project?\' section: mailto contact link has correct address', async ({ page }) => {
    // 1. Navigate to '/' and scroll to the 'Like the project?' section, then inspect the contact link's href attribute (do not click, to avoid launching a mail client)
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Like the project?', level: 2 })).toBeVisible();
    await expect(page.getByText('Feedback or coffee — both help us build better, faster!')).toBeVisible();
    const contactLink = page.getByRole('link', { name: 'qa.automation.playground@gmail.com' });
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toHaveAttribute('href', 'mailto:qa.automation.playground@gmail.com');
  });

  test('\'Buy Me A Coffee\' external link opens correct destination in a new tab', async ({ page, context }) => {
    // 1. Navigate to '/', scroll to the 'Like the project?' section, and verify the 'Buy Me A Coffee' image link's href and target attributes before interacting
    await page.goto('/');
    const coffeeLink = page.getByRole('link', { name: 'Buy Me A Coffee' });
    await expect(coffeeLink).toHaveAttribute('href', 'https://www.buymeacoffee.com/automationplayground');
    await expect(coffeeLink).toHaveAttribute('target', '_blank');

    // 2. Click the 'Buy Me A Coffee' link and capture the newly opened page/tab
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      coffeeLink.click(),
    ]);
    await newPage.waitForURL(/buymeacoffee\.com\/automationplayground/);
    expect(newPage.url()).toMatch(/^https:\/\/(www\.)?buymeacoffee\.com\/automationplayground/);
    expect(page.url()).toContain('automationplayground.dev/');
  });

  test('No broken links: all home page links respond successfully', async ({ page }) => {
    // 1. Navigate to '/' and collect all anchor tag hrefs on the page (internal: '/', '/components', '/faq', '#learn-more'; external: buymeacoffee.com; mailto is excluded from HTTP checks)
    await page.goto('/');
    const links = page.locator('a');
    const count = await links.count();
    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toBeNull();
      expect(href).not.toBe('');
      expect(href).not.toBe('#');
      expect(href).not.toBe('javascript:void(0)');
      if (href && !href.startsWith('mailto:')) {
        hrefs.push(href);
      }
    }

    const internalPaths = ['/', '/components', '/faq'];
    for (const path of internalPaths) {
      const response = await page.request.get(path);
      expect(response.status()).toBeLessThan(400);
    }

    const externalResponse = await page.request.head('https://www.buymeacoffee.com/automationplayground');
    expect(externalResponse.status()).toBeLessThan(400);
  });
});
