// spec: specs/advanced-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Advanced Table - Pagination Controls', () => {
  const searchInput = (page: import('@playwright/test').Page) =>
    page.locator('[data-testid="advanced-table-filter"]');
  const pageSizeSelect = (page: import('@playwright/test').Page) =>
    page.locator('[data-testid="items-per-page-selector"]');
  const firstButton = (page: import('@playwright/test').Page) =>
    page.locator('[data-testid="pagination-first"]');
  const previousButton = (page: import('@playwright/test').Page) =>
    page.locator('[data-testid="pagination-previous"]');
  const nextButton = (page: import('@playwright/test').Page) =>
    page.locator('[data-testid="pagination-next"]');
  const lastButton = (page: import('@playwright/test').Page) =>
    page.locator('[data-testid="pagination-last"]');
  const pageIndicator = (page: import('@playwright/test').Page) =>
    page.getByText(/^\d+ \/ \d+$/);
  const resultsSummary = (page: import('@playwright/test').Page) =>
    page.getByText(/^Showing \d+ to \d+ of \d+ entries/);
  const dataRows = (page: import('@playwright/test').Page) =>
    page.locator('table tbody tr');
  const idCell = (row: import('@playwright/test').Locator) => row.locator('td').first();

  test.beforeEach(async ({ page }) => {
    await page.goto('/components/advanced-table');
  });

  test(`'Next' button advances one page at a time and updates rows/summary/indicator`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' (default state: page 1/7, size 10) and click 'Next' (data-testid="pagination-next")
    await nextButton(page).click();

    // expect: The page indicator updates to '2 / 7'
    await expect(pageIndicator(page)).toHaveText('2 / 7');

    // expect: The table body shows records 11 through 20 (first row ID === 11, last row ID === 20)
    const rows = dataRows(page);
    await expect(rows).toHaveCount(10);
    await expect(idCell(rows.first())).toHaveText('11');
    await expect(idCell(rows.last())).toHaveText('20');

    // expect: Results summary text equals exactly 'Showing 11 to 20 of 64 entries'
    await expect(resultsSummary(page)).toHaveText('Showing 11 to 20 of 64 entries');

    // expect: 'First' (data-testid="pagination-first") and 'Previous' (data-testid="pagination-previous") buttons become enabled
    await expect(firstButton(page)).toBeEnabled();
    await expect(previousButton(page)).toBeEnabled();
  });

  test(`'Previous' button moves back one page and correctly disables at page 1`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', click 'Next' twice to reach page 3/7, then click 'Previous' once
    await nextButton(page).click();
    await nextButton(page).click();
    await previousButton(page).click();

    // expect: The page indicator updates to '2 / 7'
    await expect(pageIndicator(page)).toHaveText('2 / 7');

    // expect: The table body shows records 11 through 20
    let rows = dataRows(page);
    await expect(rows).toHaveCount(10);
    await expect(idCell(rows.first())).toHaveText('11');
    await expect(idCell(rows.last())).toHaveText('20');

    // 2. Click 'Previous' once more to return to page 1
    await previousButton(page).click();

    // expect: The page indicator equals '1 / 7'
    await expect(pageIndicator(page)).toHaveText('1 / 7');

    // expect: The table body shows records 1 through 10
    rows = dataRows(page);
    await expect(rows).toHaveCount(10);
    await expect(idCell(rows.first())).toHaveText('1');
    await expect(idCell(rows.last())).toHaveText('10');

    // expect: 'First' and 'Previous' buttons are disabled again
    await expect(firstButton(page)).toBeDisabled();
    await expect(previousButton(page)).toBeDisabled();
  });

  test(`'Last' button jumps directly to the final page and correctly shows a partial (non-full) final page`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', select page size '25' from the 'Show:' dropdown (data-testid="items-per-page-selector"), then click 'Last' (data-testid="pagination-last")
    await pageSizeSelect(page).selectOption('25');
    await lastButton(page).click();

    // expect: The page indicator equals '3 / 3'
    await expect(pageIndicator(page)).toHaveText('3 / 3');

    // expect: The table body renders exactly 14 rows, with first row ID === 51 and last row ID === 64
    const rows = dataRows(page);
    await expect(rows).toHaveCount(14);
    await expect(idCell(rows.first())).toHaveText('51');
    await expect(idCell(rows.last())).toHaveText('64');

    // expect: Results summary text equals exactly 'Showing 51 to 64 of 64 entries'
    await expect(resultsSummary(page)).toHaveText('Showing 51 to 64 of 64 entries');

    // expect: 'Next' and 'Last' buttons are disabled; 'First' and 'Previous' are enabled
    await expect(nextButton(page)).toBeDisabled();
    await expect(lastButton(page)).toBeDisabled();
    await expect(firstButton(page)).toBeEnabled();
    await expect(previousButton(page)).toBeEnabled();
  });

  test(`'First' button jumps directly back to page 1 from any later page`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', select page size '25', click 'Last' to reach page 3/3, then click 'First' (data-testid="pagination-first")
    await pageSizeSelect(page).selectOption('25');
    await lastButton(page).click();
    await firstButton(page).click();

    // expect: The page indicator equals '1 / 3'
    await expect(pageIndicator(page)).toHaveText('1 / 3');

    // expect: The table body renders 25 rows with first row ID === 1 and last row ID === 25
    const rows = dataRows(page);
    await expect(rows).toHaveCount(25);
    await expect(idCell(rows.first())).toHaveText('1');
    await expect(idCell(rows.last())).toHaveText('25');

    // expect: Results summary text equals exactly 'Showing 1 to 25 of 64 entries'
    await expect(resultsSummary(page)).toHaveText('Showing 1 to 25 of 64 entries');

    // expect: 'First' and 'Previous' buttons are disabled again
    await expect(firstButton(page)).toBeDisabled();
    await expect(previousButton(page)).toBeDisabled();
  });

  test(`Pagination and search interact correctly: navigating to a later page then searching resets to page 1 of the filtered set`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', click 'Next' twice to reach page 3/7 (default page size 10), then type 'United States' into the search box (data-testid="advanced-table-filter")
    await nextButton(page).click();
    await nextButton(page).click();
    await searchInput(page).fill('United States');

    // expect: The page indicator resets to page 1 of the 'United States' filtered result set's page count (current page number does NOT remain 3)
    await expect(pageIndicator(page)).toHaveText(/^1 \/ \d+$/);
    await expect(pageIndicator(page)).not.toHaveText('3 / 7');

    // expect: The table's first visible row belongs to the filtered ('United States') result set, not to whatever was on page 3 of the unfiltered set
    const rows = dataRows(page);
    const firstRow = rows.first();
    await expect(firstRow.locator('td').nth(2)).toHaveText('United States');
    // page 3 of the unfiltered set (page size 10) would have started at ID 21 - confirm we did not stay there
    await expect(idCell(firstRow)).not.toHaveText('21');
  });
});
