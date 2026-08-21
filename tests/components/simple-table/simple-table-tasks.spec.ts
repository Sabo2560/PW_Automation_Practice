// spec: specs/simple-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect, Locator } from '@playwright/test';
import { SimpleTablePage } from '../../pages/SimpleTablePage';

test.describe('Simple Table - Task Table Checkbox Verification', () => {
  let simplePage: SimpleTablePage;
  let designCheckbox: Locator;
  let blogCheckbox: Locator;
  let apiCheckbox: Locator;

  test.beforeEach(async ({ page }) => {
    simplePage = new SimpleTablePage(page);
    await simplePage.gotoSimpleTable();
    designCheckbox = simplePage.taskCheckbox('Design Landing Page');
    blogCheckbox = simplePage.taskCheckbox('Write Blog Post');
    apiCheckbox = simplePage.taskCheckbox('Develop API');
  });

  test("Checking 'Develop API' while 'Write Blog Post' stays checked leaves 'Design Landing Page' unaffected", async () => {
    // 1. Navigate to '/components/simple-table'. Confirm baseline: 'Write Blog Post' checked, 'Design Landing
    //    Page' and 'Develop API' unchecked

    // expect: Baseline matches the documented defaults exactly
    await expect(blogCheckbox).toBeChecked();
    await expect(designCheckbox).not.toBeChecked();
    await expect(apiCheckbox).not.toBeChecked();

    // 2. Check the 'Develop API' row's checkbox
    await apiCheckbox.click();

    // expect: 'Develop API' checkbox is now checked
    await expect(apiCheckbox).toBeChecked();

    // expect: 'Design Landing Page' checkbox remains unchecked (unaffected)
    await expect(designCheckbox).not.toBeChecked();

    // expect: 'Write Blog Post' checkbox remains checked (unaffected)
    await expect(blogCheckbox).toBeChecked();
  });

  test("Unchecking the only pre-checked task ('Write Blog Post') and re-checking it round-trips cleanly with no effect on the other two rows", async () => {
    // 1. Navigate to '/components/simple-table'. Uncheck the 'Write Blog Post' checkbox
    await blogCheckbox.click();

    // expect: 'Write Blog Post' checkbox is now unchecked
    await expect(blogCheckbox).not.toBeChecked();

    // expect: 'Design Landing Page' and 'Develop API' checkboxes remain unchecked (unaffected, no accidental
    //         state coupling)
    await expect(designCheckbox).not.toBeChecked();
    await expect(apiCheckbox).not.toBeChecked();

    // 2. Check 'Write Blog Post' again
    await blogCheckbox.click();

    // expect: 'Write Blog Post' checkbox is checked again, confirming a full round-trip back to its documented
    //         default
    await expect(blogCheckbox).toBeChecked();

    // expect: 'Design Landing Page' and 'Develop API' remain unchecked throughout
    await expect(designCheckbox).not.toBeChecked();
    await expect(apiCheckbox).not.toBeChecked();
  });

  test("Clicking a task row's non-checkbox cell (e.g. the task name) does not toggle that row's checkbox", async () => {
    // 1. Navigate to '/components/simple-table'. Confirm 'Design Landing Page' checkbox is unchecked, then click
    //    directly on the 'Design Landing Page' text cell (not the checkbox itself)
    await expect(designCheckbox).not.toBeChecked();
    await simplePage.taskRow('Design Landing Page').getByText('Design Landing Page').click();

    // expect: 'Design Landing Page' checkbox remains unchecked after the cell click, confirming the checkbox has
    //         no associated <label> wrapping the row and clicking elsewhere in the row has no toggle side effect
    await expect(designCheckbox).not.toBeChecked();
  });

  test('Boundary states: checking all three task checkboxes simultaneously, then unchecking all three, both work correctly with no stuck/coupled state', async () => {
    // 1. Navigate to '/components/simple-table'. Check 'Design Landing Page' and 'Develop API' (in addition to
    //    the already-checked 'Write Blog Post')
    await designCheckbox.click();
    await apiCheckbox.click();

    // expect: All three task checkboxes ('Design Landing Page', 'Write Blog Post', 'Develop API') are now checked
    //         simultaneously — the 3-checked boundary state
    await expect(designCheckbox).toBeChecked();
    await expect(blogCheckbox).toBeChecked();
    await expect(apiCheckbox).toBeChecked();

    // 2. Uncheck all three checkboxes
    await designCheckbox.click();
    await blogCheckbox.click();
    await apiCheckbox.click();

    // expect: All three task checkboxes are now unchecked simultaneously — the 0-checked boundary state,
    //         confirming both extremes of the 3-independent-checkbox state space work with no leftover/stuck
    //         checked state
    await expect(designCheckbox).not.toBeChecked();
    await expect(blogCheckbox).not.toBeChecked();
    await expect(apiCheckbox).not.toBeChecked();
  });
});
