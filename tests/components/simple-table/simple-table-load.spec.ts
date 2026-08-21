// spec: specs/simple-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SimpleTablePage } from '../../pages/SimpleTablePage';

test.describe('Simple Table - Initial Load and Default State', () => {
  let simplePage: SimpleTablePage;

  test.beforeEach(async ({ page }) => {
    simplePage = new SimpleTablePage(page);
  });

  test('Simple Table page loads with all three tables, labels, and Insight section correctly rendered', async ({
    page,
  }) => {
    // 1. Navigate to '/components/simple-table' on a fresh browser context
    const consoleErrors = simplePage.trackConsoleErrors();
    const response = await simplePage.gotoSimpleTable();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Simple Table' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Simple Table', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect all three 'form-label' elements in DOM order
    // expect: The three labels read exactly, in order
    await expect(page.getByTestId('form-label')).toHaveText([
      'Add all the prices and check if the total is correct',
      'Ensure "Write Blog Post" is completed and mark "Develop API" as finished',
      'Ensure sorting works for all columns',
    ]);

    // 3. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
    // expect: The concept list contains exactly the documented items
    const conceptList = page.getByRole('list').filter({ hasText: 'Count rows or elements in a table' });
    await expect(conceptList.getByRole('listitem')).toHaveText([
      'Count rows or elements in a table',
      'Extract all text content from elements',
      'Verify checkbox states',
      'Sort table columns',
      'Validate calculated totals',
    ]);
    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/table/simpleTable.spec.ts'
    );
  });

  test('Shopping table renders exactly 4 static data rows with the confirmed live product/quantity/price values, in DOM order', async () => {
    // 1. Navigate to '/components/simple-table'. Inspect '[data-testid="shopping-table"] tbody tr' without any interaction
    await simplePage.gotoSimpleTable();

    // expect: Exactly 4 rows are present, in this exact order with these exact cell values
    await expect(simplePage.shoppingRows.locator('td')).toHaveText([
      'Notebook', '3', '120',
      'Pen', '10', '10',
      'Eraser', '5', '5',
      'Pencil', '7', '15',
    ]);

    // expect: The tfoot contains exactly 1 row with a 'Total' label cell and a single data cell with colspan='2' showing the text '590'
    await expect(simplePage.shoppingTfootCells).toHaveText(['Total', '590']);
    await expect(simplePage.shoppingTotalCell).toHaveAttribute('colspan', '2');
  });

  test("Task table's checkbox default states match the confirmed live baseline: only 'Write Blog Post' checked", async () => {
    // 1. Navigate to '/components/simple-table'. Without any interaction, read the '.checked' property of all 3
    //    checkboxes in '[data-testid="task-table"]', matched by their row's task name
    await simplePage.gotoSimpleTable();

    // expect: 'Design Landing Page' unchecked, 'Write Blog Post' checked, 'Develop API' unchecked
    await simplePage.expectTaskDefaultState();
  });

  test("Salary table renders its 4 rows in original (unsorted) order with all four headers showing aria-sort='none' on fresh load", async () => {
    // 1. Navigate to '/components/simple-table'. Without any interaction, read '[data-testid="salary-table"] tbody tr'
    //    cell values and the 'aria-sort' attribute of all four 'sort-column-*' headers
    await simplePage.gotoSimpleTable();

    // expect: Rows appear in exactly this order
    await expect(simplePage.salaryRows.locator('td')).toHaveText([
      'Alice Johnson', 'Engineering', '2022-01-15', '$80000',
      'Bob Smith', 'Marketing', '2020-09-01', '$60000',
      'Charlie Brown', 'HR', '2021-03-12', '$50000',
      'Diana Prince', 'Engineering', '2019-06-25', '$90000',
    ]);

    // expect: 'sort-column-name', 'sort-column-department', 'sort-column-hireDate', and 'sort-column-salary' all
    //         have aria-sort exactly equal to the literal string 'none'
    await simplePage.expectSortState();
  });
});
