// spec: specs/simple-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SimpleTablePage } from '../../pages/SimpleTablePage';

test.describe('Simple Table - Reload Persistence', () => {
  let simplePage: SimpleTablePage;

  test.beforeEach(async ({ page }) => {
    simplePage = new SimpleTablePage(page);
    await simplePage.gotoSimpleTable();
  });

  test("No sort state or checkbox state persists across a page reload; both the salary table and task table reset to their documented fresh-load defaults", async ({
    page,
  }) => {
    // 1. Sort the salary table by 'sort-column-hireDate' (one click, descending), and change the task
    // table away from its default by unchecking 'Write Blog Post' and checking 'Develop API'
    await simplePage.sortHeader('hireDate').click();
    await simplePage.taskCheckbox('Write Blog Post').uncheck();
    await simplePage.taskCheckbox('Develop API').check();

    // expect: Before reload: 'sort-column-hireDate' has aria-sort='descending' with the corresponding
    // sorted row order; 'Write Blog Post' is unchecked and 'Develop API' is checked
    await simplePage.expectAriaSort('hireDate', 'descending');
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Alice Johnson',
      'Charlie Brown',
      'Bob Smith',
      'Diana Prince',
    ]);
    await expect(simplePage.taskCheckbox('Write Blog Post')).not.toBeChecked();
    await expect(simplePage.taskCheckbox('Develop API')).toBeChecked();

    // 2. Reload the page (page.reload())
    await page.reload();
    await expect(simplePage.salaryRows.first()).toBeVisible();

    // expect: All four salary-table headers ('sort-column-name', 'sort-column-department',
    // 'sort-column-hireDate', 'sort-column-salary') have aria-sort='none' again
    await simplePage.expectSortState();

    // expect: The salary table's rows are back in their original DOM order: Alice Johnson, Bob Smith,
    // Charlie Brown, Diana Prince
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Alice Johnson',
      'Bob Smith',
      'Charlie Brown',
      'Diana Prince',
    ]);

    // expect: The task table has reverted to its documented default: only 'Write Blog Post' is checked;
    // 'Design Landing Page' and 'Develop API' are both unchecked again
    await simplePage.expectTaskDefaultState();

    // expect: The shopping table's total is still exactly correct (it has no interactive state to begin
    // with, included here to confirm reload doesn't corrupt static content either) — confirming no
    // localStorage/sessionStorage/URL state is involved anywhere on this page
    await simplePage.expectShoppingTotalCorrect();
  });
});
