import { test, expect } from '@playwright/test';

test.describe('Simple Table component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/simple-table');
  });

  test('should calculate the correct total from quantity × price for each row', async ({ page }) => {
    // Rather than hardcoding the expected total (590), we compute it
    // ourselves from the actual row data — this way the test still catches
    // a bug even if the sample data on the page ever changes.
    const table = page.getByTestId('shopping-table');
    // The total row lives in a separate <tfoot>, not inside <tbody> —
    // confirmed via DevTools. Querying them separately instead of assuming
    // the total is just "the last tbody row".
    const dataRows = table.locator('tbody tr');

    // Wait for the table to actually be hydrated/rendered before counting —
    // counting immediately after goto() was racing the client-side render
    // and returning 0 rows.
    await expect(dataRows.first()).toBeVisible();
    const rowCount = await dataRows.count();

    let expectedTotal = 0;
    for (let i = 0; i < rowCount; i++) {
      const cells = dataRows.nth(i).locator('td');
      const quantity = parseFloat((await cells.nth(1).textContent()) ?? '0');
      const price = parseFloat((await cells.nth(2).textContent()) ?? '0');
      expectedTotal += quantity * price;
    }

    const totalCell = table.locator('tfoot td').last();
    const displayedTotal = parseFloat((await totalCell.textContent()) ?? '0');

    expect(displayedTotal).toBe(expectedTotal);
  });

  test('should mark "Develop API" as completed while leaving "Design Landing Page" unchecked', async ({ page }) => {
    const taskTable = page.getByTestId('task-table');

    const designRow = taskTable.getByRole('row', { name: /Design Landing Page/ });
    const writeBlogRow = taskTable.getByRole('row', { name: /Write Blog Post/ });
    const developApiRow = taskTable.getByRole('row', { name: /Develop API/ });

    // "Write Blog Post" is already completed by default — confirming that
    // starting state before we touch anything.
    await expect(writeBlogRow.getByRole('checkbox')).toBeChecked();
    await expect(designRow.getByRole('checkbox')).not.toBeChecked();
    await expect(developApiRow.getByRole('checkbox')).not.toBeChecked();

    await developApiRow.getByRole('checkbox').check();

    await expect(developApiRow.getByRole('checkbox')).toBeChecked();
    await expect(designRow.getByRole('checkbox')).not.toBeChecked(); // unaffected
    await expect(writeBlogRow.getByRole('checkbox')).toBeChecked(); // still checked
  });

  test.describe('column sorting', () => {
    // Each column needs different comparison logic: Salary has a "$" prefix
    // to strip before comparing numerically, Hire Date happens to already
    // be in YYYY-MM-DD format so string comparison sorts it chronologically
    // for free, and Name/Department are plain string comparisons.
    const columns: { testId: string; columnIndex: number; parse: (raw: string) => string | number }[] = [
      { testId: 'sort-column-name', columnIndex: 0, parse: (raw) => raw },
      { testId: 'sort-column-department', columnIndex: 1, parse: (raw) => raw },
      { testId: 'sort-column-hireDate', columnIndex: 2, parse: (raw) => raw },
      { testId: 'sort-column-salary', columnIndex: 3, parse: (raw) => parseFloat(raw.replace('$', '')) },
    ];

    for (const column of columns) {
      test(`should sort by ${column.testId.replace('sort-column-', '')} descending then ascending`, async ({ page }) => {
        const table = page.locator('table').filter({ has: page.getByTestId(column.testId) });
        const header = page.getByTestId(column.testId);

        const readColumnValues = async () => {
          const cells = table.locator(`tbody tr td:nth-child(${column.columnIndex + 1})`);
          const texts = await cells.allTextContents();
          return texts.map(column.parse);
        };

        // First click — descending (confirmed against the page's actual behavior,
        // which is the opposite of what you'd typically expect by default)
        await header.click();
        await expect(header).toHaveAttribute('aria-sort', 'descending');
        const descendingValues = await readColumnValues();
        const sortedDescending = [...descendingValues].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
        expect(descendingValues).toEqual(sortedDescending);

        // Second click — ascending
        await header.click();
        await expect(header).toHaveAttribute('aria-sort', 'ascending');
        const ascendingValues = await readColumnValues();
        const sortedAscending = [...sortedDescending].reverse();
        expect(ascendingValues).toEqual(sortedAscending);
      });
    }
  });
});