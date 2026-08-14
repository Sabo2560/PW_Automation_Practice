// spec: specs/advanced-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AdvancedTablePage } from '../../pages/AdvancedTablePage';

test.describe('Advanced Table - Page Size Selector', () => {
  let table: AdvancedTablePage;

  test.beforeEach(async ({ page }) => {
    table = new AdvancedTablePage(page);
    await table.gotoAdvancedTable();
  });

  test('Changing page size to 25 recalculates rows-per-page and total page count correctly', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' (default page size 10) and select '25' from the 'Show:' dropdown
    await table.setPageSize('25');

    await expect(table.rows).toHaveCount(25);
    for (let i = 0; i < 25; i++) {
      await expect(table.idCell(table.rows.nth(i))).toHaveText(String(i + 1));
    }

    await table.expectSummary('Showing 1 to 25 of 64 entries');
    await table.expectPageIndicator('1 / 3');

    await expect(table.firstBtn).toBeDisabled();
    await expect(table.previousBtn).toBeDisabled();
    await expect(table.nextBtn).toBeEnabled();
    await expect(table.lastBtn).toBeEnabled();
  });

  test('Changing page size to 5 recalculates rows-per-page and total page count correctly', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' (default page size 10) and select '5' from the 'Show:' dropdown
    await table.setPageSize('5');

    await expect(table.rows).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(table.idCell(table.rows.nth(i))).toHaveText(String(i + 1));
    }

    await table.expectSummary('Showing 1 to 5 of 64 entries');
    await table.expectPageIndicator('1 / 13');
  });

  test('Changing page size while on a non-first page preserves the current page NUMBER, not the item offset', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', click 'Next' once to move to page 2 of 7, then select '25' from the 'Show:' dropdown
    await table.nextBtn.click();
    await table.setPageSize('25');

    await table.expectPageIndicator('2 / 3');

    await expect(table.rows).toHaveCount(25);
    await expect(table.idCell(table.rows.first())).toHaveText('26');
    await expect(table.idCell(table.rows.last())).toHaveText('50');

    await table.expectSummary('Showing 26 to 50 of 64 entries');
  });

  test('Changing page size while on the last page of a larger page size clamps correctly on a smaller page size', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', select page size '25', click 'Last' to reach page 3 of 3, then select page size '5' from the dropdown
    await table.setPageSize('25');
    await table.lastBtn.click();
    await table.setPageSize('5');

    await table.expectPageIndicator('3 / 13');

    await expect(table.rows).toHaveCount(5);
    await expect(table.idCell(table.rows.first())).toHaveText('11');
    await expect(table.idCell(table.rows.last())).toHaveText('15');

    await table.expectSummary('Showing 11 to 15 of 64 entries');
  });

  test('Page size change combined with an active search re-paginates the filtered result set, not the full dataset', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', type 'United States' in the search box to filter the dataset,
    // note the filtered total shown in the results summary, then change page size from 10 to 5
    await table.search('United States');

    await expect(table.summaryText).toBeVisible();
    const beforeText = await table.summaryText.textContent();
    const beforeMatch = beforeText?.match(/of (\d+) entries/);
    const filteredTotalBefore = beforeMatch ? beforeMatch[1] : null;

    await table.setPageSize('5');

    const afterMatch = (await table.summaryText.textContent())?.match(/of (\d+) entries/);
    const filteredTotalAfter = afterMatch ? afterMatch[1] : null;

    expect(filteredTotalAfter).toBe(filteredTotalBefore);

    const rowCount = await table.rows.count();
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
    await table.lastBtn.click();
    await table.setPageSize('25');

    await table.expectPageIndicator('7 / 3');
    await table.expectSummary('Showing 151 to 64 of 64 entries');

    await expect(table.rows).toHaveCount(0);

    // 2. From this broken state, click 'First'
    await table.firstBtn.click();

    await table.expectPageIndicator('1 / 3');
    await expect(table.rows).toHaveCount(25);
    await expect(table.idCell(table.rows.first())).toHaveText('1');
    await expect(table.idCell(table.rows.last())).toHaveText('25');
  });
});