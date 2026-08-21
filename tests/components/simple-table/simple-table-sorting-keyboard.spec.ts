// spec: specs/simple-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SimpleTablePage, SortColumn } from '../../pages/SimpleTablePage';

/** Focuses `column`'s header (without clicking), presses `key`, then asserts the resulting sort state/order. */
async function pressAndExpectSort(
  simplePage: SimpleTablePage,
  column: SortColumn,
  key: 'Enter' | 'Space',
  expectedNames: string[]
) {
  const header = simplePage.sortHeader(column);
  await header.focus();
  await expect(header).toBeFocused();
  await header.press(key);

  await simplePage.expectAriaSort(column, 'descending');
  expect(await simplePage.readColumnValues('name')).toEqual(expectedNames);
}

test.describe('Simple Table - Sortable Table Keyboard Interaction', () => {
  let simplePage: SimpleTablePage;

  test.beforeEach(async ({ page }) => {
    simplePage = new SimpleTablePage(page);
    await simplePage.gotoSimpleTable();
  });

  test('Pressing Enter on a keyboard-focused sortable header triggers the same descending sort as a mouse click', async () => {
    // 1. Navigate to '/components/simple-table'. Focus the 'sort-column-salary' header (via direct .focus())
    //    without clicking it, then press 'Enter'
    // expect: 'sort-column-salary' has aria-sort='descending' after Enter is pressed
    // expect: Row order (by Salary) is exactly: 'Diana Prince' ($90000), 'Alice Johnson' ($80000), 'Bob Smith'
    //         ($60000), 'Charlie Brown' ($50000) — identical to the mouse-click result documented in the
    //         Descending-First Behavior suite, confirming Enter is a fully equivalent activation method
    await pressAndExpectSort(simplePage, 'salary', 'Enter', [
      'Diana Prince',
      'Alice Johnson',
      'Bob Smith',
      'Charlie Brown',
    ]);
  });

  test('Pressing Space on a keyboard-focused sortable header triggers the same descending sort as a mouse click', async () => {
    // 1. Navigate to '/components/simple-table'. Focus the 'sort-column-hireDate' header without clicking it,
    //    then press 'Space'
    // expect: 'sort-column-hireDate' has aria-sort='descending' after Space is pressed
    // expect: Row order (by Hire Date) is exactly: 'Alice Johnson' (2022-01-15), 'Charlie Brown' (2021-03-12),
    //         'Bob Smith' (2020-09-01), 'Diana Prince' (2019-06-25) — identical to the mouse-click result
    //         documented in the Descending-First Behavior suite, confirming Space is a fully equivalent
    //         activation method
    await pressAndExpectSort(simplePage, 'hireDate', 'Space', [
      'Alice Johnson',
      'Charlie Brown',
      'Bob Smith',
      'Diana Prince',
    ]);
  });
});
