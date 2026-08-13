// spec: specs/advanced-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Advanced Table - Search / Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/advanced-table');
  });

  test('Searching by a country name filters rows to only matching entries and updates the summary count', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' (fresh state) and type 'India' into the search input (data-testid="advanced-table-filter")
    const searchInput = page.getByTestId('advanced-table-filter');
    await searchInput.fill('India');

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(8);

    const countryCells = rows.locator('td:nth-child(3)');
    const countries = await countryCells.allTextContents();
    for (const country of countries) {
      expect(country).toBe('India');
    }

    await expect(page.getByText(/^Showing .* entries/)).toHaveText(
      'Showing 1 to 8 of 8 entries (filtered from 64 total entries)'
    );

    const pageIndicator = page.getByText(/^\d+ \/ \d+$/);
    await expect(pageIndicator).toHaveText('1 / 1');

    await expect(page.getByTestId('pagination-first')).toBeDisabled();
    await expect(page.getByTestId('pagination-previous')).toBeDisabled();
    await expect(page.getByTestId('pagination-next')).toBeDisabled();
    await expect(page.getByTestId('pagination-last')).toBeDisabled();
  });

  test('Search is case-insensitive', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' and type the fully-uppercase string 'CANADA' into the search input
    const searchInput = page.getByTestId('advanced-table-filter');
    await searchInput.fill('CANADA');

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(2);

    const idCells = rows.locator('td:nth-child(1)');
    const uppercaseIds = await idCells.allTextContents();
    expect(uppercaseIds.sort()).toEqual(['29', '7']);

    const uppercaseNames = await rows.locator('td:nth-child(2)').allTextContents();
    expect(uppercaseNames).toEqual(
      expect.arrayContaining([
        'Toronto Baptist Seminary and Bible College',
        'Cégep de Saint-Jérôme',
      ])
    );

    const uppercaseCountries = await rows.locator('td:nth-child(3)').allTextContents();
    for (const country of uppercaseCountries) {
      expect(country).toBe('Canada');
    }

    await expect(page.getByText(/^Showing .* entries/)).toHaveText(
      'Showing 1 to 2 of 2 entries (filtered from 64 total entries)'
    );

    // 2. Clear the search box and instead type the lowercase string 'canada'
    await searchInput.fill('canada');

    await expect(rows).toHaveCount(2);
    const lowercaseIds = await idCells.allTextContents();
    expect(lowercaseIds.sort()).toEqual(uppercaseIds.sort());
    const lowercaseNames = await rows.locator('td:nth-child(2)').allTextContents();
    expect(lowercaseNames.sort()).toEqual(uppercaseNames.sort());
  });

  test('Search matches across ID, Name, Country, and Website fields', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table'. Search for 'Ashoka'
    const searchInput = page.getByTestId('advanced-table-filter');
    await searchInput.fill('Ashoka');

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.locator('td:nth-child(2)')).toHaveText('Ashoka University');
    await expect(rows.locator('td:nth-child(1)')).toHaveText('27');

    await expect(page.getByText(/^Showing .* entries/)).toHaveText(
      'Showing 1 to 1 of 1 entries (filtered from 64 total entries)'
    );

    // 2. Clear and search for 'karazin'
    await searchInput.fill('karazin');

    await expect(rows).toHaveCount(1);
    await expect(rows.locator('td:nth-child(1)')).toHaveText('15');
    await expect(rows.locator('td:nth-child(2)')).toHaveText('Kharkiv National University');
    const websiteLink = rows.locator('td:nth-child(4) a');
    await expect(websiteLink).toHaveAttribute('href', /karazin\.ua/);

    // 3. Clear and search for '27'
    await searchInput.fill('27');

    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    const ids = await rows.locator('td:nth-child(1)').allTextContents();
    expect(ids).toContain('27');

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
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
    const searchInput = page.getByTestId('advanced-table-filter');
    await searchInput.fill('zzzznotfound');

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(0);

    await expect(page.getByText(/^Showing .* entries/)).toHaveText(
      'Showing 0 to 0 of 0 entries (filtered from 64 total entries)'
    );

    const pageIndicator = page.getByText(/^\d+ \/ \d+$/);
    await expect(pageIndicator).toHaveText('1 / 0');

    const nextButton = page.getByTestId('pagination-next');
    const lastButton = page.getByTestId('pagination-last');
    const firstButton = page.getByTestId('pagination-first');
    const previousButton = page.getByTestId('pagination-previous');

    await expect(nextButton).toBeEnabled();
    await expect(lastButton).toBeEnabled();
    await expect(firstButton).toBeDisabled();
    await expect(previousButton).toBeDisabled();

    // 2. With the zero-result search still active, click the 'Next' pagination button
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await nextButton.click();

    expect(consoleErrors).toEqual([]);
    await expect(rows).toHaveCount(0);
    await expect(pageIndicator).toHaveText('0 / 0');
    await expect(nextButton).toBeDisabled();
    await expect(lastButton).toBeDisabled();
    await expect(firstButton).toBeEnabled();
    await expect(previousButton).toBeEnabled();
  });

  test('Clearing the search input restores the full unfiltered dataset', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table', type 'India' into the search box, then clear the search box back to an empty string
    const searchInput = page.getByTestId('advanced-table-filter');
    await searchInput.fill('India');

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(8);

    await searchInput.fill('');

    await expect(rows).toHaveCount(10);
    await expect(page.getByText(/^Showing .* entries/)).toHaveText('Showing 1 to 10 of 64 entries');

    const pageIndicator = page.getByText(/^\d+ \/ \d+$/);
    await expect(pageIndicator).toHaveText('1 / 7');
  });

  test('Search does not produce inconsistent results on whitespace-only input', async ({ page }) => {
    // 1. Navigate to '/components/advanced-table' and type a single space character into the search input
    const searchInput = page.getByTestId('advanced-table-filter');
    const rows = page.locator('tbody tr');

    await searchInput.fill(' ');
    await expect(rows.first()).toBeVisible();
    const firstAttemptCount = await rows.count();
    const firstAttemptSummary = await page.getByText(/^Showing .* entries/).textContent();

    // - expect: re-enter the same single-space input again (clear and retype) and assert the row count matches exactly
    await searchInput.fill('');
    await searchInput.fill(' ');
    await expect(rows).toHaveCount(firstAttemptCount);
    await expect(page.getByText(/^Showing .* entries/)).toHaveText(firstAttemptSummary ?? '');
  });
});
