// spec: specs/simple-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SimpleTablePage } from '../../pages/SimpleTablePage';

test.describe('Simple Table - Sortable Table Keyboard Interaction', () => {
  let simplePage: SimpleTablePage;

  test.beforeEach(async ({ page }) => {
    simplePage = new SimpleTablePage(page);
    await simplePage.gotoSimpleTable();
  });

  test('Pressing Enter on a keyboard-focused sortable header triggers the same descending sort as a mouse click', async () => {
    const salaryHeader = simplePage.sortHeader('salary');

    // 1. Navigate to '/components/simple-table'. Focus the 'sort-column-salary' header (via direct .focus())
    //    without clicking it, then press 'Enter'
    await salaryHeader.focus();
    await expect(salaryHeader).toBeFocused();
    await salaryHeader.press('Enter');

    // expect: 'sort-column-salary' has aria-sort='descending' after Enter is pressed
    await simplePage.expectAriaSort('salary', 'descending');

    // expect: Row order (by Salary) is exactly: 'Diana Prince' ($90000), 'Alice Johnson' ($80000), 'Bob Smith'
    //         ($60000), 'Charlie Brown' ($50000) — identical to the mouse-click result documented in the
    //         Descending-First Behavior suite, confirming Enter is a fully equivalent activation method
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Diana Prince',
      'Alice Johnson',
      'Bob Smith',
      'Charlie Brown',
    ]);
  });

  test('Pressing Space on a keyboard-focused sortable header triggers the same descending sort as a mouse click', async () => {
    const hireDateHeader = simplePage.sortHeader('hireDate');

    // 1. Navigate to '/components/simple-table'. Focus the 'sort-column-hireDate' header without clicking it,
    //    then press 'Space'
    await hireDateHeader.focus();
    await expect(hireDateHeader).toBeFocused();
    await hireDateHeader.press('Space');

    // expect: 'sort-column-hireDate' has aria-sort='descending' after Space is pressed
    await simplePage.expectAriaSort('hireDate', 'descending');

    // expect: Row order (by Hire Date) is exactly: 'Alice Johnson' (2022-01-15), 'Charlie Brown' (2021-03-12),
    //         'Bob Smith' (2020-09-01), 'Diana Prince' (2019-06-25) — identical to the mouse-click result
    //         documented in the Descending-First Behavior suite, confirming Space is a fully equivalent
    //         activation method
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Alice Johnson',
      'Charlie Brown',
      'Bob Smith',
      'Diana Prince',
    ]);
  });
});
