// spec: specs/simple-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SimpleTablePage, SortColumn } from '../../pages/SimpleTablePage';

/** Clicks `column`'s header, then asserts its aria-sort direction and the resulting Name-column row order. */
async function clickAndExpectOrder(
  simplePage: SimpleTablePage,
  column: SortColumn,
  direction: 'ascending' | 'descending',
  expectedNames: string[]
) {
  await simplePage.sortHeader(column).click();
  await simplePage.expectAriaSort(column, direction);
  expect(await simplePage.readColumnValues('name')).toEqual(expectedNames);
}

test.describe('Simple Table - Sortable Table Sorting Behavior', () => {
  let simplePage: SimpleTablePage;

  test.beforeEach(async ({ page }) => {
    simplePage = new SimpleTablePage(page);
    await simplePage.gotoSimpleTable();
  });

  test('Name column: first click sorts descending (Z-to-A), second click sorts ascending (A-to-Z), aria-sort reflects each state', async () => {
    // 1. Navigate to '/components/simple-table'. Click the 'sort-column-name' header once
    // expect: 'sort-column-name' has aria-sort='descending'
    // expect: Row order (by Name column) is exactly: 'Diana Prince', 'Charlie Brown', 'Bob Smith', 'Alice Johnson'
    await clickAndExpectOrder(simplePage, 'name', 'descending', [
      'Diana Prince',
      'Charlie Brown',
      'Bob Smith',
      'Alice Johnson',
    ]);

    // 2. Click the 'sort-column-name' header a second time
    // expect: 'sort-column-name' has aria-sort='ascending'
    // expect: Row order is exactly: 'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince'
    await clickAndExpectOrder(simplePage, 'name', 'ascending', [
      'Alice Johnson',
      'Bob Smith',
      'Charlie Brown',
      'Diana Prince',
    ]);
  });

  test('Department column (from a fresh page load): first click sorts descending with the Engineering tie in original-data order (Alice before Diana), second click sorts ascending preserving that same tie order', async () => {
    // 1. Navigate to '/components/simple-table' on a fresh context (no prior sort on any column). Click the
    //    'sort-column-department' header once
    // expect: 'sort-column-department' has aria-sort='descending'
    // expect: Row order (by Department) is exactly: 'Bob Smith' (Marketing), 'Charlie Brown' (HR), 'Alice
    //         Johnson' (Engineering), 'Diana Prince' (Engineering) — confirming Marketing > HR > Engineering
    //         alphabetically descending, and that the Engineering tie resolves Alice before Diana when sorted
    //         directly from a fresh, never-before-sorted load
    await clickAndExpectOrder(simplePage, 'department', 'descending', [
      'Bob Smith',
      'Charlie Brown',
      'Alice Johnson',
      'Diana Prince',
    ]);

    // 2. Click the 'sort-column-department' header a second time
    // expect: 'sort-column-department' has aria-sort='ascending'
    // expect: Row order is exactly: 'Alice Johnson' (Engineering), 'Diana Prince' (Engineering), 'Charlie Brown'
    //         (HR), 'Bob Smith' (Marketing) — confirming the Engineering tie still resolves Alice before Diana on
    //         this immediate second click, since the row order on screen at the moment of this click was
    //         unchanged from the prior (first) click's tie order
    await clickAndExpectOrder(simplePage, 'department', 'ascending', [
      'Alice Johnson',
      'Diana Prince',
      'Charlie Brown',
      'Bob Smith',
    ]);
  });

  test('Hire Date column: first click sorts descending (most recent first), second click sorts ascending (oldest first)', async () => {
    // 1. Navigate to '/components/simple-table'. Click the 'sort-column-hireDate' header once
    // expect: 'sort-column-hireDate' has aria-sort='descending'
    // expect: Row order (by Hire Date) is exactly: 'Alice Johnson' (2022-01-15), 'Charlie Brown' (2021-03-12),
    //         'Bob Smith' (2020-09-01), 'Diana Prince' (2019-06-25)
    await clickAndExpectOrder(simplePage, 'hireDate', 'descending', [
      'Alice Johnson',
      'Charlie Brown',
      'Bob Smith',
      'Diana Prince',
    ]);

    // 2. Click the 'sort-column-hireDate' header a second time
    // expect: 'sort-column-hireDate' has aria-sort='ascending'
    // expect: Row order is exactly: 'Diana Prince' (2019-06-25), 'Bob Smith' (2020-09-01), 'Charlie Brown'
    //         (2021-03-12), 'Alice Johnson' (2022-01-15)
    await clickAndExpectOrder(simplePage, 'hireDate', 'ascending', [
      'Diana Prince',
      'Bob Smith',
      'Charlie Brown',
      'Alice Johnson',
    ]);
  });

  test("Salary column: first click sorts descending (highest salary first, parsed as a number after stripping the '$' prefix), second click sorts ascending (lowest first)", async () => {
    // 1. Navigate to '/components/simple-table'. Click the 'sort-column-salary' header once
    // expect: 'sort-column-salary' has aria-sort='descending'
    // expect: Row order (by Salary, parsed as a number) is exactly: 'Diana Prince' ($90000), 'Alice Johnson'
    //         ($80000), 'Bob Smith' ($60000), 'Charlie Brown' ($50000)
    await clickAndExpectOrder(simplePage, 'salary', 'descending', [
      'Diana Prince',
      'Alice Johnson',
      'Bob Smith',
      'Charlie Brown',
    ]);

    // 2. Click the 'sort-column-salary' header a second time
    // expect: 'sort-column-salary' has aria-sort='ascending'
    // expect: Row order is exactly: 'Charlie Brown' ($50000), 'Bob Smith' ($60000), 'Alice Johnson' ($80000),
    //         'Diana Prince' ($90000), confirming numeric parsing (not lexicographic string comparison, though
    //         both happen to coincide for this specific 5-digit dataset)
    await clickAndExpectOrder(simplePage, 'salary', 'ascending', [
      'Charlie Brown',
      'Bob Smith',
      'Alice Johnson',
      'Diana Prince',
    ]);
  });

  test("A third click on the same column returns to descending again — sorting never reaches an 'unsorted' state again once a column has been clicked", async () => {
    // 1. Navigate to '/components/simple-table'. Click 'sort-column-name' three times in a row, recording
    //    aria-sort and row order after each click
    // expect: After click 1: aria-sort='descending', order = Diana, Charlie, Bob, Alice
    await clickAndExpectOrder(simplePage, 'name', 'descending', [
      'Diana Prince',
      'Charlie Brown',
      'Bob Smith',
      'Alice Johnson',
    ]);

    // expect: After click 2: aria-sort='ascending', order = Alice, Bob, Charlie, Diana
    await clickAndExpectOrder(simplePage, 'name', 'ascending', [
      'Alice Johnson',
      'Bob Smith',
      'Charlie Brown',
      'Diana Prince',
    ]);

    // expect: After click 3: aria-sort='descending' again (NOT 'none'), and the row order is identical to the
    //         click-1 result (Diana, Charlie, Bob, Alice) — confirming the toggle cycles strictly between
    //         descending/ascending forever and never reverts to an unsorted state
    await clickAndExpectOrder(simplePage, 'name', 'descending', [
      'Diana Prince',
      'Charlie Brown',
      'Bob Smith',
      'Alice Johnson',
    ]);
  });

  test("Switching the sort to a different column resets the previously-active column's aria-sort back to 'none', and only one column shows a non-'none' aria-sort at a time", async () => {
    // 1. Navigate to '/components/simple-table'. Click 'sort-column-name' (now descending), then read aria-sort
    //    on all four headers
    await simplePage.sortHeader('name').click();

    // expect: 'sort-column-name' = 'descending'; 'sort-column-department', 'sort-column-hireDate',
    //         'sort-column-salary' all = 'none'
    await simplePage.expectSortState('name', 'descending');

    // 2. Click 'sort-column-department', then read aria-sort on all four headers again
    await simplePage.sortHeader('department').click();

    // expect: 'sort-column-department' = 'descending'; 'sort-column-name' has reverted to 'none';
    //         'sort-column-hireDate' and 'sort-column-salary' remain 'none' — confirming at most one column ever
    //         shows a non-'none' aria-sort value simultaneously
    await simplePage.expectSortState('department', 'descending');
  });

  test('[QUIRK] Sorting Department immediately after Name was already sorted descending flips the Engineering tie order, because the sort operates on the currently-displayed row order, not a fixed original dataset order', async () => {
    // 1. Navigate to '/components/simple-table'. Click 'sort-column-name' three times total (ending on
    //    descending: Diana, Charlie, Bob, Alice — confirmed by the toggle-forever behavior in the prior
    //    scenario), then click 'sort-column-department' once
    await simplePage.sortHeader('name').click();
    await simplePage.sortHeader('name').click();
    await clickAndExpectOrder(simplePage, 'name', 'descending', [
      'Diana Prince',
      'Charlie Brown',
      'Bob Smith',
      'Alice Johnson',
    ]);

    // expect: 'sort-column-department' has aria-sort='descending'
    // expect: Row order (by Department) is exactly: 'Bob Smith' (Marketing), 'Charlie Brown' (HR), 'Diana Prince'
    //         (Engineering), 'Alice Johnson' (Engineering) — note the Engineering tie now resolves DIANA BEFORE
    //         ALICE, the OPPOSITE order from the 'fresh load, no prior sort' scenario in the previous suite,
    //         because the underlying stable sort was applied to the row order that was on screen (Diana,
    //         Charlie, Bob, Alice) at the moment 'sort-column-department' was clicked, not a fresh re-derivation
    //         from the original dataset order
    await clickAndExpectOrder(simplePage, 'department', 'descending', [
      'Bob Smith',
      'Charlie Brown',
      'Diana Prince',
      'Alice Johnson',
    ]);
  });
});
