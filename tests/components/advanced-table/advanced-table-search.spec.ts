// spec: specs/advanced-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AdvancedTablePage } from '../../pages/AdvancedTablePage';

test.describe('Advanced Table - Search / Filtering', () => {
  let table: AdvancedTablePage;

  test.beforeEach(async ({ page }) => {
    table = new AdvancedTablePage(page);
    await table.gotoAdvancedTable();
  });

  test('Searching by a country name filters rows to only matching entries and updates the summary count', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' (fresh state) and type 'India' into the search input
    await table.search('India');

    await expect(table.rows).toHaveCount(8);

    const countryCells = table.rows.locator('td:nth-child(3)');
    const countries = await countryCells.allTextContents();
    for (const country of countries) {
      expect(country).toBe('India');
    }

    await table.expectSummary('Showing 1 to 8 of 8 entries (filtered from 64 total entries)');
    await table.expectPageIndicator('1 / 1');

    await expect(table.firstBtn).toBeDisabled();
    await expect(table.previousBtn).toBeDisabled();
    await expect(table.nextBtn).toBeDisabled();
    await expect(table.lastBtn).toBeDisabled();
  });

  test('Search is case-insensitive', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' and type the fully-uppercase string 'CANADA' into the search input
    await table.search('CANADA');

    await expect(table.rows).toHaveCount(2);

    const idCells = table.rows.locator('td:nth-child(1)');
    const uppercaseIds = await idCells.allTextContents();
    expect(uppercaseIds.sort()).toEqual(['29', '7']);

    const uppercaseNames = await table.rows.locator('td:nth-child(2)').allTextContents();
    expect(uppercaseNames).toEqual(
      expect.arrayContaining([
        'Toronto Baptist Seminary and Bible College',
        'Cégep de Saint-Jérôme',
      ])
    );

    const uppercaseCountries = await table.rows.locator('td:nth-child(3)').allTextContents();
    for (const country of uppercaseCountries) {
      expect(country).toBe('Canada');
    }

    await table.expectSummary('Showing 1 to 2 of 2 entries (filtered from 64 total entries)');

    // 2. Clear the search box and instead type the lowercase string 'canada'
    await table.search('canada');

    await expect(table.rows).toHaveCount(2);
    const lowercaseIds = await idCells.allTextContents();
    expect(lowercaseIds.sort()).toEqual(uppercaseIds.sort());
    const lowercaseNames = await table.rows.locator('td:nth-child(2)').allTextContents();
    expect(lowercaseNames.sort()).toEqual(uppercaseNames.sort());
  });

  test('Search matches across ID, Name, Country, and Website fields', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table'. Search for 'Ashoka'
    await table.search('Ashoka');

    await expect(table.rows).toHaveCount(1);
    await expect(table.rows.locator('td:nth-child(2)')).toHaveText('Ashoka University');
    await expect(table.rows.locator('td:nth-child(1)')).toHaveText('27');

    await table.expectSummary('Showing 1 to 1 of 1 entries (filtered from 64 total entries)');

    // 2. Clear and search for 'karazin'
    await table.search('karazin');

    await expect(table.rows).toHaveCount(1);
    await expect(table.rows.locator('td:nth-child(1)')).toHaveText('15');
    await expect(table.rows.locator('td:nth-child(2)')).toHaveText('Kharkiv National University');
    const websiteLink = table.rows.locator('td:nth-child(4) a');
    await expect(websiteLink).toHaveAttribute('href', /karazin\.ua/);

    // 3. Clear and search for '27'
    await table.search('27');

    const rowCount = await table.rows.count();
    expect(rowCount).toBeGreaterThan(0);

    const ids = await table.rows.locator('td:nth-child(1)').allTextContents();
    expect(ids).toContain('27');

    for (let i = 0; i < rowCount; i++) {
      const row = table.rows.nth(i);
      const id = await row.locator('td:nth-child(1)').textContent();
      const name = await row.locator('td:nth-child(2)').textContent();
      const country = await row.locator('td:nth-child(3)').textContent();
      const website = await row.locator('td:nth-child(4)').textContent();
      const matchesSomewhere =
        (id ?? '').includes('27') ||
        (name ?? '').includes('27') ||
        (country ?? '').includes('27') ||
        (website ?? '').includes('27');
      expect(matchesSomewhere).toBe(true);
    }
  });

  test('Search with no matching results shows an empty table and correct zero-state messaging', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' and type 'zzzznotfound' into the search input
    await table.search('zzzznotfound');

    await expect(table.rows).toHaveCount(0);

    await table.expectSummary('Showing 0 to 0 of 0 entries (filtered from 64 total entries)');
    await table.expectPageIndicator('1 / 0');

    await expect(table.nextBtn).toBeEnabled();
    await expect(table.lastBtn).toBeEnabled();
    await expect(table.firstBtn).toBeDisabled();
    await expect(table.previousBtn).toBeDisabled();

    // 2. With the zero-result search still active, click the 'Next' pagination button
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await table.nextBtn.click();

    expect(consoleErrors).toEqual([]);
    await expect(table.rows).toHaveCount(0);
    await table.expectPageIndicator('0 / 0');
    await expect(table.nextBtn).toBeDisabled();
    await expect(table.lastBtn).toBeDisabled();
    await expect(table.firstBtn).toBeEnabled();
    await expect(table.previousBtn).toBeEnabled();
  });

  test('Clearing the search input restores the full unfiltered dataset', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', type 'India' into the search box, then clear the search box back to an empty string
    await table.search('India');

    await expect(table.rows).toHaveCount(8);

    await table.search('');

    await expect(table.rows).toHaveCount(10);
    await table.expectSummary('Showing 1 to 10 of 64 entries');
    await table.expectPageIndicator('1 / 7');
  });

  // [BUG] Whitespace-only search is treated as an active filter (shows "(filtered from 64 total entries)")
  // even though the filtered result set is identical to the unfiltered default in every other respect.
  // See plan bug #2. Update this assertion if the dev team removes the misleading "filtered" messaging
  // for whitespace-only input.
  test('[BUG] Whitespace-only search input incorrectly triggers "filtered" messaging despite matching all records', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' and type a single space character into the search input
    await table.search(' ');

    await expect(table.rows).toHaveCount(10);
    await expect(table.idCell(table.rows.first())).toHaveText('1');
    await table.expectPageIndicator('1 / 7');

    // expect (documenting actual/current behavior — this is the bug): summary incorrectly
    // shows "(filtered from 64 total entries)" despite the result set being the full unfiltered dataset
    await table.expectSummary('Showing 1 to 10 of 64 entries (filtered from 64 total entries)');
  });
});