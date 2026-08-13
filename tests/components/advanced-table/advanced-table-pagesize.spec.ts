// spec: specs/advanced-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Advanced Table - Page Size Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/advanced-table');
  });

  test('Changing page size to 25 recalculates rows-per-page and total page count correctly', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' (default page size 10) and select '25' from the 'Show:' dropdown
    await page.getByTestId('items-per-page-selector').selectOption('25');

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(25);
    const idCells = rows.locator('td').nth(0);
    for (let i = 0; i < 25; i++) {
      await expect(rows.nth(i).locator('td').first()).toHaveText(String(i + 1));
    }

    await expect(page.getByText('Showing 1 to 25 of 64 entries')).toBeVisible();
    await expect(page.getByText('1 / 3')).toBeVisible();

    await expect(page.getByTestId('pagination-first')).toBeDisabled();
    await expect(page.getByTestId('pagination-previous')).toBeDisabled();
    await expect(page.getByTestId('pagination-next')).toBeEnabled();
    await expect(page.getByTestId('pagination-last')).toBeEnabled();
  });

  test('Changing page size to 5 recalculates rows-per-page and total page count correctly', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' (default page size 10) and select '5' from the 'Show:' dropdown
    await page.getByTestId('items-per-page-selector').selectOption('5');

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(rows.nth(i).locator('td').first()).toHaveText(String(i + 1));
    }

    await expect(page.getByText('Showing 1 to 5 of 64 entries')).toBeVisible();
    await expect(page.getByText('1 / 13')).toBeVisible();
  });

  test('Changing page size while on a non-first page preserves the current page NUMBER, not the item offset', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', click 'Next' once to move to page 2 of 7, then select '25' from the 'Show:' dropdown
    await page.getByTestId('pagination-next').click();
    await page.getByTestId('items-per-page-selector').selectOption('25');

    await expect(page.getByText('2 / 3')).toBeVisible();

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(25);
    await expect(rows.first().locator('td').first()).toHaveText('26');
    await expect(rows.last().locator('td').first()).toHaveText('50');

    await expect(page.getByText('Showing 26 to 50 of 64 entries')).toBeVisible();
  });

  test('Changing page size while on the last page of a larger page size clamps correctly on a smaller page size', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', select page size '25', click 'Last' to reach page 3 of 3, then select page size '5' from the dropdown
    await page.getByTestId('items-per-page-selector').selectOption('25');
    await page.getByTestId('pagination-last').click();
    await page.getByTestId('items-per-page-selector').selectOption('5');

    await expect(page.getByText('3 / 13')).toBeVisible();

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(5);
    await expect(rows.first().locator('td').first()).toHaveText('11');
    await expect(rows.last().locator('td').first()).toHaveText('15');

    await expect(page.getByText('Showing 11 to 15 of 64 entries')).toBeVisible();
  });

  test('Page size change combined with an active search re-paginates the filtered result set, not the full dataset', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', type 'United States' in the search box to filter the dataset,
    // note the filtered total shown in the results summary, then change page size from 10 to 5
    await page.getByTestId('advanced-table-filter').fill('United States');

    const summary = page.locator('text=/Showing \\d+ to \\d+ of \\d+ entries \\(filtered from 64 total entries\\)/');
    await expect(summary).toBeVisible();
    const beforeText = await summary.textContent();
    const beforeMatch = beforeText?.match(/of (\d+) entries/);
    const filteredTotalBefore = beforeMatch ? beforeMatch[1] : null;
    expect(filteredTotalBefore).not.toBeNull();

    await page.getByTestId('items-per-page-selector').selectOption('5');

    const afterMatch = (await summary.textContent())?.match(/of (\d+) entries/);
    const filteredTotalAfter = afterMatch ? afterMatch[1] : null;

    expect(filteredTotalAfter).toBe(filteredTotalBefore);

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeLessThanOrEqual(5);
  });

  // [BUG] This test documents a known defect (plan scenario 3.6): changing the page size while on a
  // page number that does not exist at the new page size is not clamped, producing an invalid
  // pagination state ("7 / 3", "Showing 151 to 64 of 64 entries", zero rendered rows). Update this
  // test once the page-size clamping bug is fixed by the dev team (expected fix: page 3/3, "Showing
  // 51 to 64 of 64 entries").
  test('[BUG] Changing page size while on a page number that doesn\'t exist at the new size produces an invalid state', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' (default page size 10), click 'Last' to reach page 7/7
    // (final page, showing records 61-64), then select page size '25' from the 'Show:' dropdown
    // — which only has 3 total pages at that size
    await page.getByTestId('pagination-last').click();
    await page.getByTestId('items-per-page-selector').selectOption('25');

    await expect(page.getByText('7 / 3')).toBeVisible();
    await expect(page.getByText('Showing 151 to 64 of 64 entries')).toBeVisible();

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(0);

    // 2. From this broken state, click 'First'
    await page.getByTestId('pagination-first').click();

    await expect(page.getByText('1 / 3')).toBeVisible();
    await expect(rows).toHaveCount(25);
    await expect(rows.first().locator('td').first()).toHaveText('1');
    await expect(rows.last().locator('td').first()).toHaveText('25');
  });
});
