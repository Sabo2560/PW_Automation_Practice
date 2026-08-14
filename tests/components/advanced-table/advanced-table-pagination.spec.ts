// spec: specs/advanced-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AdvancedTablePage } from '../../pages/AdvancedTablePage';

test.describe('Advanced Table - Pagination Controls', () => {
  let table: AdvancedTablePage;

  test.beforeEach(async ({ page }) => {
    table = new AdvancedTablePage(page);
    await table.gotoAdvancedTable();
  });

  test(`'Next' button advances one page at a time and updates rows/summary/indicator`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' (default state: page 1/7, size 10) and click 'Next'
    await table.nextBtn.click();

    await table.expectPageIndicator('2 / 7');

    await expect(table.rows).toHaveCount(10);
    await expect(table.idCell(table.rows.first())).toHaveText('11');
    await expect(table.idCell(table.rows.last())).toHaveText('20');

    await table.expectSummary('Showing 11 to 20 of 64 entries');

    await expect(table.firstBtn).toBeEnabled();
    await expect(table.previousBtn).toBeEnabled();
  });

  test(`'Previous' button moves back one page and correctly disables at page 1`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', click 'Next' twice to reach page 3/7, then click 'Previous' once
    await table.nextBtn.click();
    await table.nextBtn.click();
    await table.previousBtn.click();

    await table.expectPageIndicator('2 / 7');

    await expect(table.rows).toHaveCount(10);
    await expect(table.idCell(table.rows.first())).toHaveText('11');
    await expect(table.idCell(table.rows.last())).toHaveText('20');

    // 2. Click 'Previous' once more to return to page 1
    await table.previousBtn.click();

    await table.expectPageIndicator('1 / 7');

    await expect(table.rows).toHaveCount(10);
    await expect(table.idCell(table.rows.first())).toHaveText('1');
    await expect(table.idCell(table.rows.last())).toHaveText('10');

    await expect(table.firstBtn).toBeDisabled();
    await expect(table.previousBtn).toBeDisabled();
  });

  test(`'Last' button jumps directly to the final page and correctly shows a partial (non-full) final page`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', select page size '25' from the 'Show:' dropdown, then click 'Last'
    await table.setPageSize('25');
    await table.lastBtn.click();

    await table.expectPageIndicator('3 / 3');

    await expect(table.rows).toHaveCount(14);
    await expect(table.idCell(table.rows.first())).toHaveText('51');
    await expect(table.idCell(table.rows.last())).toHaveText('64');

    await table.expectSummary('Showing 51 to 64 of 64 entries');

    await expect(table.nextBtn).toBeDisabled();
    await expect(table.lastBtn).toBeDisabled();
    await expect(table.firstBtn).toBeEnabled();
    await expect(table.previousBtn).toBeEnabled();
  });

  test(`'First' button jumps directly back to page 1 from any later page`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', select page size '25', click 'Last' to reach page 3/3, then click 'First'
    await table.setPageSize('25');
    await table.lastBtn.click();
    await table.firstBtn.click();

    await table.expectPageIndicator('1 / 3');

    await expect(table.rows).toHaveCount(25);
    await expect(table.idCell(table.rows.first())).toHaveText('1');
    await expect(table.idCell(table.rows.last())).toHaveText('25');

    await table.expectSummary('Showing 1 to 25 of 64 entries');

    await expect(table.firstBtn).toBeDisabled();
    await expect(table.previousBtn).toBeDisabled();
  });

  test(`Pagination and search interact correctly: navigating to a later page then searching resets to page 1 of the filtered set`, async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', click 'Next' twice to reach page 3/7 (default page size 10), then type 'United States' into the search box
    await table.nextBtn.click();
    await table.nextBtn.click();
    await table.search('United States');

    await expect(table.pageIndicator).toHaveText(/^1 \/ \d+$/);
    await expect(table.pageIndicator).not.toHaveText('3 / 7');

    const firstRow = table.rows.first();
    await expect(firstRow.locator('td').nth(2)).toHaveText('United States');
    // page 3 of the unfiltered set (page size 10) would have started at ID 21 - confirm we did not stay there
    await expect(table.idCell(firstRow)).not.toHaveText('21');
  });
});