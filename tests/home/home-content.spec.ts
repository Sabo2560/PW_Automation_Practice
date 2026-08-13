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
    // Scoping by the heading itself instead of matching concatenated text —
    // the original selector depended on the heading and paragraph text
    // being directly adjacent with no whitespace between them in the DOM,
    // which breaks on any markup/whitespace change even if the content is fine.
    const featureSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Got a feature in Mind?' }),
    });
    await expect(featureSection.getByRole('heading', { name: 'Got a feature in Mind?', level: 2 })).toBeVisible();
    await expect(featureSection.getByText('Drop us a message — we’re always open to improvements and experiments!')).toBeVisible();
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

  test('\'Buy Me A Coffee\' link has correct destination and opens in a new tab', async ({ page }) => {
    // Checking the attributes only, not actually navigating to the live
    // external site — see test plan notes on why the click-through was
    // dropped from the automated suite (third-party site reliability
    // shouldn't be able to fail our CI).
    await page.goto('/');
    const coffeeLink = page.getByRole('link', { name: 'Buy Me A Coffee' });
    await expect(coffeeLink).toHaveAttribute('href', 'https://www.buymeacoffee.com/automationplayground');
    await expect(coffeeLink).toHaveAttribute('target', '_blank');
  });

  test('No broken links: all home page links respond successfully', async ({ page }) => {
    // 1. Navigate to '/' and collect all anchor tag hrefs on the page
    await page.goto('/');
    const links = page.locator('a');
    const count = await links.count();
    const hrefs = new Set<string>();

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toBeNull();
      expect(href).not.toBe('');
      expect(href).not.toBe('#');
      expect(href).not.toBe('javascript:void(0)');
      if (href && !href.startsWith('mailto:')) {
        hrefs.add(href);
      }
    }

    expect(hrefs.size).toBeGreaterThan(0);

    // Actually checking every link we collected — the original version
    // gathered hrefs above and then discarded them in favor of a hardcoded
    // list, so a new/changed link on the page could silently go unchecked.
    for (const href of hrefs) {
      if (href.startsWith('http')) {
        const response = await page.request.head(href).catch(() =>
          // Some external sites reject HEAD requests (405) — fall back to GET
          page.request.get(href)
        );
        expect(response.status(), `${href} responded with an error status`).toBeLessThan(400);
      } else {
        const response = await page.request.get(href);
        expect(response.status(), `${href} responded with an error status`).toBeLessThan(400);
      }
    }
  });
});