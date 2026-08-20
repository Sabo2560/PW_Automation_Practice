// spec: specs/simple-table.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SimpleTablePage } from '../../pages/SimpleTablePage';

test.describe('Simple Table - Shopping Table Total Calculation', () => {
  let simplePage: SimpleTablePage;

  test.beforeEach(async ({ page }) => {
    simplePage = new SimpleTablePage(page);
  });

  test('The displayed total equals the sum of (quantity × price) computed live from every row, not a hardcoded value', async () => {
    // 1. Navigate to '/components/simple-table'. For every row in the shopping table, read the Quantity and
    //    Price cells, parse them as numbers, and sum (quantity × price) across all rows to compute an expected
    //    total live from the DOM (do not hardcode 590 in the assertion)
    await simplePage.gotoSimpleTable();
    const expectedTotal = await simplePage.computeExpectedShoppingTotal();

    // expect: The computed expected total equals exactly the sum of each row's quantity×price (360 + 100 + 25 + 105)
    expect(expectedTotal).toBe(360 + 100 + 25 + 105);

    // expect: The tfoot's total cell's numeric text content equals the computed expected total exactly (both
    //         currently resolve to 590, confirmed live, but the assertion must compare against the freshly-computed
    //         sum, not a literal)
    const displayedTotalText = await simplePage.shoppingTotalCell.textContent();
    expect(parseFloat(displayedTotalText ?? '0')).toBe(expectedTotal);
  });

  test('Each individual row’s quantity × price line value is independently correct, including the smallest-value and largest-value rows (boundary rows)', async () => {
    // 1. Navigate to '/components/simple-table'. Read the Quantity and Price cells for the 'Eraser' row (the
    //    smallest line total: qty 5 × price 5) and the 'Notebook' row (the largest line total: qty 3 × price 120)
    await simplePage.gotoSimpleTable();
    const eraserRow = simplePage.shoppingRows.filter({ hasText: 'Eraser' });
    const notebookRow = simplePage.shoppingRows.filter({ hasText: 'Notebook' });

    // expect: 'Eraser' row: quantity cell = '5', price cell = '5', so quantity × price = 25
    const eraserCells = eraserRow.locator('td');
    await expect(eraserCells.nth(1)).toHaveText('5');
    await expect(eraserCells.nth(2)).toHaveText('5');
    const eraserQty = parseFloat((await eraserCells.nth(1).textContent()) ?? '0');
    const eraserPrice = parseFloat((await eraserCells.nth(2).textContent()) ?? '0');
    expect(eraserQty * eraserPrice).toBe(25);

    // expect: 'Notebook' row: quantity cell = '3', price cell = '120', so quantity × price = 360, confirming the
    //         highest-value row (by unit price) and lowest-value row (by line total) both parse and compute correctly
    const notebookCells = notebookRow.locator('td');
    await expect(notebookCells.nth(1)).toHaveText('3');
    await expect(notebookCells.nth(2)).toHaveText('120');
    const notebookQty = parseFloat((await notebookCells.nth(1).textContent()) ?? '0');
    const notebookPrice = parseFloat((await notebookCells.nth(2).textContent()) ?? '0');
    expect(notebookQty * notebookPrice).toBe(360);
  });

  test('The tfoot total row has exactly one data cell spanning both the Quantity and Price columns via colspan, and there is exactly one total row', async () => {
    // 1. Navigate to '/components/simple-table'. Inspect the shopping table's tfoot
    await simplePage.gotoSimpleTable();
    const tfootRows = simplePage.shoppingTable.locator('tfoot tr');

    // expect: Exactly 1 '<tr>' exists inside 'tfoot'
    await expect(tfootRows).toHaveCount(1);

    // expect: That row contains exactly 2 '<td>' cells: the first with text 'Total', the second with the
    //         'colspan' attribute equal to '2' holding the numeric total text
    const tfootCells = tfootRows.locator('td');
    await expect(tfootCells).toHaveCount(2);
    await expect(tfootCells.first()).toHaveText('Total');
    await expect(tfootCells.last()).toHaveAttribute('colspan', '2');
    await expect(tfootCells.last()).toHaveText(/^\d+$/);
  });
});
