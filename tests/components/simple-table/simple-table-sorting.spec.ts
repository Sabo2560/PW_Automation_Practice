// spec: specs/simple-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SimpleTablePage } from '../../pages/SimpleTablePage';

test.describe('Simple Table - Sortable Table Sorting Behavior', () => {
  let simplePage: SimpleTablePage;

  test.beforeEach(async ({ page }) => {
    simplePage = new SimpleTablePage(page);
    await simplePage.gotoSimpleTable();
  });

  test('Name column: first click sorts descending (Z-to-A), second click sorts ascending (A-to-Z), aria-sort reflects each state', async () => {
    const nameHeader = simplePage.sortHeader('name');

    // 1. Navigate to '/components/simple-table'. Click the 'sort-column-name' header once
    await nameHeader.click();

    // expect: 'sort-column-name' has aria-sort='descending'
    await simplePage.expectAriaSort('name', 'descending');

    // expect: Row order (by Name column) is exactly: 'Diana Prince', 'Charlie Brown', 'Bob Smith', 'Alice Johnson'
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Diana Prince',
      'Charlie Brown',
      'Bob Smith',
      'Alice Johnson',
    ]);

    // 2. Click the 'sort-column-name' header a second time
    await nameHeader.click();

    // expect: 'sort-column-name' has aria-sort='ascending'
    await simplePage.expectAriaSort('name', 'ascending');

    // expect: Row order is exactly: 'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince'
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Alice Johnson',
      'Bob Smith',
      'Charlie Brown',
      'Diana Prince',
    ]);
  });

  test('Department column (from a fresh page load): first click sorts descending with the Engineering tie in original-data order (Alice before Diana), second click sorts ascending preserving that same tie order', async () => {
    const departmentHeader = simplePage.sortHeader('department');

    // 1. Navigate to '/components/simple-table' on a fresh context (no prior sort on any column). Click the
    //    'sort-column-department' header once
    await departmentHeader.click();

    // expect: 'sort-column-department' has aria-sort='descending'
    await simplePage.expectAriaSort('department', 'descending');

    // expect: Row order (by Department) is exactly: 'Bob Smith' (Marketing), 'Charlie Brown' (HR), 'Alice
    //         Johnson' (Engineering), 'Diana Prince' (Engineering) — confirming Marketing > HR > Engineering
    //         alphabetically descending, and that the Engineering tie resolves Alice before Diana when sorted
    //         directly from a fresh, never-before-sorted load
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Bob Smith',
      'Charlie Brown',
      'Alice Johnson',
      'Diana Prince',
    ]);

    // 2. Click the 'sort-column-department' header a second time
    await departmentHeader.click();

    // expect: 'sort-column-department' has aria-sort='ascending'
    await simplePage.expectAriaSort('department', 'ascending');

    // expect: Row order is exactly: 'Alice Johnson' (Engineering), 'Diana Prince' (Engineering), 'Charlie Brown'
    //         (HR), 'Bob Smith' (Marketing) — confirming the Engineering tie still resolves Alice before Diana on
    //         this immediate second click, since the row order on screen at the moment of this click was
    //         unchanged from the prior (first) click's tie order
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Alice Johnson',
      'Diana Prince',
      'Charlie Brown',
      'Bob Smith',
    ]);
  });

  test('Hire Date column: first click sorts descending (most recent first), second click sorts ascending (oldest first)', async () => {
    const hireDateHeader = simplePage.sortHeader('hireDate');

    // 1. Navigate to '/components/simple-table'. Click the 'sort-column-hireDate' header once
    await hireDateHeader.click();

    // expect: 'sort-column-hireDate' has aria-sort='descending'
    await simplePage.expectAriaSort('hireDate', 'descending');

    // expect: Row order (by Hire Date) is exactly: 'Alice Johnson' (2022-01-15), 'Charlie Brown' (2021-03-12),
    //         'Bob Smith' (2020-09-01), 'Diana Prince' (2019-06-25)
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Alice Johnson',
      'Charlie Brown',
      'Bob Smith',
      'Diana Prince',
    ]);

    // 2. Click the 'sort-column-hireDate' header a second time
    await hireDateHeader.click();

    // expect: 'sort-column-hireDate' has aria-sort='ascending'
    await simplePage.expectAriaSort('hireDate', 'ascending');

    // expect: Row order is exactly: 'Diana Prince' (2019-06-25), 'Bob Smith' (2020-09-01), 'Charlie Brown'
    //         (2021-03-12), 'Alice Johnson' (2022-01-15)
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Diana Prince',
      'Bob Smith',
      'Charlie Brown',
      'Alice Johnson',
    ]);
  });

  test("Salary column: first click sorts descending (highest salary first, parsed as a number after stripping the '$' prefix), second click sorts ascending (lowest first)", async () => {
    const salaryHeader = simplePage.sortHeader('salary');

    // 1. Navigate to '/components/simple-table'. Click the 'sort-column-salary' header once
    await salaryHeader.click();

    // expect: 'sort-column-salary' has aria-sort='descending'
    await simplePage.expectAriaSort('salary', 'descending');

    // expect: Row order (by Salary, parsed as a number) is exactly: 'Diana Prince' ($90000), 'Alice Johnson'
    //         ($80000), 'Bob Smith' ($60000), 'Charlie Brown' ($50000)
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Diana Prince',
      'Alice Johnson',
      'Bob Smith',
      'Charlie Brown',
    ]);

    // 2. Click the 'sort-column-salary' header a second time
    await salaryHeader.click();

    // expect: 'sort-column-salary' has aria-sort='ascending'
    await simplePage.expectAriaSort('salary', 'ascending');

    // expect: Row order is exactly: 'Charlie Brown' ($50000), 'Bob Smith' ($60000), 'Alice Johnson' ($80000),
    //         'Diana Prince' ($90000), confirming numeric parsing (not lexicographic string comparison, though
    //         both happen to coincide for this specific 5-digit dataset)
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Charlie Brown',
      'Bob Smith',
      'Alice Johnson',
      'Diana Prince',
    ]);
  });

  test("A third click on the same column returns to descending again — sorting never reaches an 'unsorted' state again once a column has been clicked", async () => {
    const nameHeader = simplePage.sortHeader('name');

    // 1. Navigate to '/components/simple-table'. Click 'sort-column-name' three times in a row, recording
    //    aria-sort and row order after each click
    await nameHeader.click();

    // expect: After click 1: aria-sort='descending', order = Diana, Charlie, Bob, Alice
    await simplePage.expectAriaSort('name', 'descending');
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Diana Prince',
      'Charlie Brown',
      'Bob Smith',
      'Alice Johnson',
    ]);

    await nameHeader.click();

    // expect: After click 2: aria-sort='ascending', order = Alice, Bob, Charlie, Diana
    await simplePage.expectAriaSort('name', 'ascending');
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Alice Johnson',
      'Bob Smith',
      'Charlie Brown',
      'Diana Prince',
    ]);

    await nameHeader.click();

    // expect: After click 3: aria-sort='descending' again (NOT 'none'), and the row order is identical to the
    //         click-1 result (Diana, Charlie, Bob, Alice) — confirming the toggle cycles strictly between
    //         descending/ascending forever and never reverts to an unsorted state
    await simplePage.expectAriaSort('name', 'descending');
    expect(await simplePage.readColumnValues('name')).toEqual([
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
    await simplePage.expectAriaSort('name', 'descending');
    await simplePage.expectAriaSort('department', 'none');
    await simplePage.expectAriaSort('hireDate', 'none');
    await simplePage.expectAriaSort('salary', 'none');

    // 2. Click 'sort-column-department', then read aria-sort on all four headers again
    await simplePage.sortHeader('department').click();

    // expect: 'sort-column-department' = 'descending'; 'sort-column-name' has reverted to 'none';
    //         'sort-column-hireDate' and 'sort-column-salary' remain 'none' — confirming at most one column ever
    //         shows a non-'none' aria-sort value simultaneously
    await simplePage.expectAriaSort('department', 'descending');
    await simplePage.expectAriaSort('name', 'none');
    await simplePage.expectAriaSort('hireDate', 'none');
    await simplePage.expectAriaSort('salary', 'none');
  });

  test('[QUIRK] Sorting Department immediately after Name was already sorted descending flips the Engineering tie order, because the sort operates on the currently-displayed row order, not a fixed original dataset order', async () => {
    const nameHeader = simplePage.sortHeader('name');

    // 1. Navigate to '/components/simple-table'. Click 'sort-column-name' three times total (ending on
    //    descending: Diana, Charlie, Bob, Alice — confirmed by the toggle-forever behavior in the prior
    //    scenario), then click 'sort-column-department' once
    await nameHeader.click();
    await nameHeader.click();
    await nameHeader.click();
    await simplePage.expectAriaSort('name', 'descending');
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Diana Prince',
      'Charlie Brown',
      'Bob Smith',
      'Alice Johnson',
    ]);

    await simplePage.sortHeader('department').click();

    // expect: 'sort-column-department' has aria-sort='descending'
    await simplePage.expectAriaSort('department', 'descending');

    // expect: Row order (by Department) is exactly: 'Bob Smith' (Marketing), 'Charlie Brown' (HR), 'Diana Prince'
    //         (Engineering), 'Alice Johnson' (Engineering) — note the Engineering tie now resolves DIANA BEFORE
    //         ALICE, the OPPOSITE order from the 'fresh load, no prior sort' scenario in the previous suite,
    //         because the underlying stable sort was applied to the row order that was on screen (Diana,
    //         Charlie, Bob, Alice) at the moment 'sort-column-department' was clicked, not a fresh re-derivation
    //         from the original dataset order
    expect(await simplePage.readColumnValues('name')).toEqual([
      'Bob Smith',
      'Charlie Brown',
      'Diana Prince',
      'Alice Johnson',
    ]);
  });
});
