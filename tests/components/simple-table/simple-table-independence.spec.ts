// spec: specs/simple-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SimpleTablePage, SortColumn } from '../../pages/SimpleTablePage';

test.describe('Simple Table - Cross-Table Independence and Network Behavior', () => {
  let simplePage: SimpleTablePage;

  test.beforeEach(async ({ page }) => {
    simplePage = new SimpleTablePage(page);
    await simplePage.gotoSimpleTable();
  });

  test('Sorting the salary table and checking a task checkbox produce zero observable effect on either of the other two tables', async () => {
    // 1. Navigate to '/components/simple-table'. Record the shopping table's tfoot total (590) and the task
    //    table's baseline checkbox states as a reference
    const expectedTotal = await simplePage.computeExpectedShoppingTotal();
    const originalShoppingRows = await simplePage.shoppingRows.allTextContents();
    const originalSalaryOrder = await simplePage.readColumnValues('name');

    // expect: Baseline recorded: shopping total = 590; task table = only 'Write Blog Post' checked
    await expect(simplePage.shoppingTotalCell).toHaveText(String(expectedTotal));
    await expect(simplePage.taskCheckbox('Design Landing Page')).not.toBeChecked();
    await expect(simplePage.taskCheckbox('Write Blog Post')).toBeChecked();
    await expect(simplePage.taskCheckbox('Develop API')).not.toBeChecked();

    // 2. Sort the salary table by clicking 'sort-column-salary' twice (ending ascending), and separately check
    //    the 'Develop API' task checkbox
    const salaryHeader = simplePage.sortHeader('salary');
    await salaryHeader.click();
    await salaryHeader.click();
    await simplePage.taskCheckbox('Develop API').check();

    // expect: 'sort-column-salary' has aria-sort='ascending' and the salary table's row order has changed from
    //         its original order
    await simplePage.expectAriaSort('salary', 'ascending');
    expect(await simplePage.readColumnValues('name')).not.toEqual(originalSalaryOrder);
    // expect: 'Develop API' checkbox is now checked
    await expect(simplePage.taskCheckbox('Develop API')).toBeChecked();

    // 3. Re-read the shopping table's tfoot total and the full row contents of the shopping table
    // expect: The shopping table's total is still exactly 590 and its 4 rows are still in their original order
    //         with unchanged values — confirming zero cross-contamination from sorting the salary table or
    //         checking a task checkbox
    await expect(simplePage.shoppingTotalCell).toHaveText(String(expectedTotal));
    expect(await simplePage.shoppingRows.allTextContents()).toEqual(originalShoppingRows);
  });

  test('No API/network requests fire as a result of any table interaction on this page (purely client-side component)', async () => {
    // 1. Navigate to '/components/simple-table', begin recording network requests, then interact broadly across
    //    all three tables (sort every column of the salary table at least twice each, check and uncheck every
    //    task checkbox)
    const apiRequests = simplePage.trackApiRequests('/components/simple-table');

    const columns: SortColumn[] = ['name', 'department', 'hireDate', 'salary'];
    for (const column of columns) {
      const header = simplePage.sortHeader(column);
      await header.click();
      await header.click();
    }

    const taskNames = ['Design Landing Page', 'Write Blog Post', 'Develop API'];
    for (const name of taskNames) {
      const checkbox = simplePage.taskCheckbox(name);
      await checkbox.click();
      await checkbox.click();
    }

    // expect: No XHR/fetch network request specific to any table action is observed (only the pre-existing
    //         Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other
    //         component page in this suite) — confirming this plan requires no API-level test coverage
    expect(apiRequests).toEqual([]);
  });
});
