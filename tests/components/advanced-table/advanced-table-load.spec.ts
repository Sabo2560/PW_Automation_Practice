// spec: specs/advanced-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Advanced Table - Initial Load and Default State', () => {
  test('Advanced Table page loads with correct default state', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' on a fresh browser context
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const response = await page.goto('/components/advanced-table');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Advanced Table', level: 1 })).toBeVisible();
    const searchInput = page.getByTestId('advanced-table-filter');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search universities (ID, Name, Country, Website)...');
    await expect(searchInput).toHaveValue('');
    expect(consoleErrors).toEqual([]);

    // 2. Inspect the table header row
    const headers = page.getByRole('columnheader');
    await expect(headers).toHaveCount(4);
    await expect(headers).toHaveText(['ID', 'Name', 'Country', 'Website']);

    // 3. Inspect the table body rows on initial load
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(10);

    const firstRow = rows.nth(0);
    await expect(firstRow.locator('td').nth(0)).toHaveText('1');
    await expect(firstRow.locator('td').nth(1)).toHaveText('Engineering Institute of Technology');

    const lastRow = rows.nth(9);
    await expect(lastRow.locator('td').nth(0)).toHaveText('10');
    await expect(lastRow.locator('td').nth(1)).toHaveText('Bhagwan Parshuram Institute of Technology');

    // Row IDs in the visible page are sequential ascending integers 1 through 10
    const rowCount = await rows.count();
    const ids: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      ids.push((await rows.nth(i).locator('td').nth(0).textContent())?.trim() ?? '');
    }
    expect(ids).toEqual(Array.from({ length: 10 }, (_, i) => String(i + 1)));

    // 4. Inspect the results summary text and pagination controls
    await expect(page.getByTestId('table-summary')).toHaveText('Showing 1 to 10 of 64 entries');
    await expect(page.getByTestId('items-per-page-selector')).toHaveValue('10');

    const pageIndicator = page.getByText(/^\d+ \/ \d+$/);
    await expect(pageIndicator).toHaveText('1 / 7');

    await expect(page.getByTestId('pagination-first')).toBeDisabled();
    await expect(page.getByTestId('pagination-previous')).toBeDisabled();
    await expect(page.getByTestId('pagination-next')).toBeEnabled();
    await expect(page.getByTestId('pagination-last')).toBeEnabled();
  });

  test('Website links in the table open the correct external URL in a new, safe tab', async ({ page, context }) => {
    await page.goto('/components/advanced-table');

    // 1. On the freshly loaded page, inspect the first row's Website cell link without clicking
    const firstRowLink = page.locator('table tbody tr').nth(0).getByRole('link');
    await expect(firstRowLink).toHaveText('https://www.eit.edu.au/');
    await expect(firstRowLink).toHaveAttribute('href', 'https://www.eit.edu.au/');
    await expect(firstRowLink).toHaveAttribute('target', '_blank');
    await expect(firstRowLink).toHaveAttribute('rel', 'noopener noreferrer');

    // 2. Click the first row's Website link and capture the newly opened tab/page
    const newPagePromise = context.waitForEvent('page');
    await firstRowLink.click();
    const newPage = await newPagePromise;

    await expect(page).toHaveURL(/\/components\/advanced-table$/);
    await expect(newPage).toHaveURL(/^https:\/\/www\.eit\.edu\.au/);
  });
});
