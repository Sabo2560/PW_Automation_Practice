// spec: specs/advanced-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Advanced Table - Non-Interactive Elements and Content Integrity', () => {
  test('Column headers are static labels and do not trigger row sorting when clicked', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' and capture the text content of all 10 ID cells in their default rendered order (expected: '1' through '10' ascending)
    await page.goto('/components/advanced-table');

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

  test('Total record count (64) remains constant and complete when cycling through all pages', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table'. Without searching, cycle through all 7 pages (default page size 10) using 'Next' (data-testid="pagination-next") repeatedly, collecting every row's ID cell value into a list
    await page.goto('/components/advanced-table');

    const idCells = page.locator('table tbody tr td:first-child');
    const pageIndicator = page.getByText(/^\d+ \/ \d+$/);
    const nextButton = page.getByTestId('pagination-next');

    const pageIndicatorText = await pageIndicator.textContent();
    const totalPages = Number(pageIndicatorText?.split('/')[1].trim());
    expect(totalPages).toBeGreaterThan(0);

    const collectedIds: string[] = [];
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const idsOnPage = await idCells.allTextContents();
      collectedIds.push(...idsOnPage);

      if (currentPage < totalPages) {
        await nextButton.click();
        await expect(pageIndicator).toHaveText(`${currentPage + 1} / ${totalPages}`);
      }
    }

    // expect: The collected list contains exactly 64 unique ID values, forming the complete set 1 through 64 with no duplicates and no gaps
    expect(collectedIds).toHaveLength(64);
    const uniqueSortedIds = [...new Set(collectedIds.map(Number))].sort((a, b) => a - b);
    expect(uniqueSortedIds).toHaveLength(64);
    expect(uniqueSortedIds).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));

    // 2. Search for 'India' in the search input (data-testid="advanced-table-filter")
    const searchInput = page.getByTestId('advanced-table-filter');
    await searchInput.fill('India');

    // expect: The filtered count shown in the results summary equals 8
    const resultsSummary = page.getByText(/^Showing/);
    await expect(resultsSummary).toHaveText('Showing 1 to 8 of 8 entries (filtered from 64 total entries)');
  });
});
