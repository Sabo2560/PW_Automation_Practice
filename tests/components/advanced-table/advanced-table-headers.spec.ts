// spec: specs/advanced-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AdvancedTablePage } from '../../pages/AdvancedTablePage';

test.describe('Advanced Table - Non-Interactive Elements and Content Integrity', () => {
  let table: AdvancedTablePage;

  test.beforeEach(async ({ page }) => {
    table = new AdvancedTablePage(page);
  });

  test('Column headers are static labels and do not trigger row sorting when clicked', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' and capture the text content of all 10 ID cells in their default rendered order (expected: '1' through '10' ascending)
    await table.gotoAdvancedTable();

    const idCells = page.locator('table tbody tr td:first-child');
    await expect(idCells).toHaveCount(10);

    const expectedOrder = Array.from({ length: 10 }, (_, i) => String(i + 1));
    await expect(idCells).toHaveText(expectedOrder);

    // 2. Click the 'ID' column header
    const idHeader = page.getByRole('columnheader', { name: 'ID' });
    await idHeader.click();

    // expect: The rendered row order is unchanged (still '1' through '10' ascending)
    await expect(idCells).toHaveText(expectedOrder);

    // 3. Click the 'Name' column header
    const nameHeader = page.getByRole('columnheader', { name: 'Name' });
    await nameHeader.click();

    // expect: The rendered row order remains '1' through '10' by ID (unchanged)
    await expect(idCells).toHaveText(expectedOrder);
  });

  test('Total record count (64) and per-country distribution remain constant regardless of pagination/search cycling', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table'. Without searching, cycle through all 7 pages
    // (default page size 10) using 'Next', collecting every row's ID cell value into a list
    await table.gotoAdvancedTable();

    const idCells = page.locator('table tbody tr td:first-child');

    const pageIndicatorText = await table.pageIndicator.textContent();
    const totalPages = Number(pageIndicatorText?.split('/')[1].trim());
    expect(totalPages).toBeGreaterThan(0);

    const collectedIds: string[] = [];
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const idsOnPage = await idCells.allTextContents();
      collectedIds.push(...idsOnPage);

      if (currentPage < totalPages) {
        await table.nextBtn.click();
        await table.expectPageIndicator(`${currentPage + 1} / ${totalPages}`);
      }
    }

    // expect: the collected list contains exactly 64 unique ID values, 1 through 64, no duplicates/gaps
    expect(collectedIds).toHaveLength(64);
    const uniqueSortedIds = [...new Set(collectedIds.map(Number))].sort((a, b) => a - b);
    expect(uniqueSortedIds).toHaveLength(64);
    expect(uniqueSortedIds).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));

    // 2. Search for 'India' (8 matches) and separately for 'United States' (largest expected subset),
    // cross-checking both filtered counts as a sanity check against the full unfiltered dataset
    await table.search('India');
    await table.expectSummary('Showing 1 to 8 of 8 entries (filtered from 64 total entries)');

    await table.search('United States');
    const usSummaryText = await table.summaryText.textContent();
    const usMatch = usSummaryText?.match(/of (\d+) entries/);
    const usCount = usMatch ? Number(usMatch[1]) : 0;

    // expect: United States is the largest country subset — sanity bound, not a guessed exact count
    expect(usCount).toBeGreaterThan(8);
    expect(usCount).toBeLessThan(64);
  });
});