import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortColumn = 'name' | 'department' | 'hireDate' | 'salary';

const COLUMN_INDEX: Record<SortColumn, number> = {
  name: 0,
  department: 1,
  hireDate: 2,
  salary: 3,
};

export class SimpleTablePage extends BasePage {
  readonly shoppingTable: Locator;
  readonly taskTable: Locator;
  readonly salaryTable: Locator;
  readonly shoppingRows: Locator;
  readonly shoppingTotalCell: Locator;
  readonly salaryRows: Locator;

  constructor(page: Page) {
    super(page);
    this.shoppingTable = page.getByTestId('shopping-table');
    this.taskTable = page.getByTestId('task-table');
    this.salaryTable = page.getByTestId('salary-table');
    this.shoppingRows = this.shoppingTable.locator('tbody tr');
    this.shoppingTotalCell = this.shoppingTable.locator('tfoot td').last();
    this.salaryRows = this.salaryTable.locator('tbody tr');
  }

  async gotoSimpleTable() {
    const response = await this.goto('/components/simple-table');
    await this.shoppingRows.first().waitFor({ state: 'visible' });
    return response;
  }

  taskRow(name: string): Locator {
    return this.taskTable.getByRole('row', { name: new RegExp(name) });
  }

  taskCheckbox(name: string): Locator {
    return this.taskRow(name).getByRole('checkbox');
  }

  sortHeader(column: SortColumn): Locator {
    return this.page.getByTestId(`sort-column-${column}`);
  }

  async expectAriaSort(column: SortColumn, value: 'none' | 'ascending' | 'descending') {
    await expect(this.sortHeader(column)).toHaveAttribute('aria-sort', value);
  }

  /** Reads quantity×price from every shopping-table row live, so callers never hardcode the total. */
  async computeExpectedShoppingTotal(): Promise<number> {
    const rows = await this.shoppingRows.all();
    let total = 0;
    for (const row of rows) {
      const cells = row.locator('td');
      const quantity = parseFloat((await cells.nth(1).textContent()) ?? '0');
      const price = parseFloat((await cells.nth(2).textContent()) ?? '0');
      total += quantity * price;
    }
    return total;
  }

  /** Reads one salary-table column's cell text top-to-bottom, parsing salary as a number (stripping '$'). */
  async readColumnValues(column: SortColumn): Promise<(string | number)[]> {
    const index = COLUMN_INDEX[column];
    const cells = this.salaryTable.locator(`tbody tr td:nth-child(${index + 1})`);
    const texts = await cells.allTextContents();
    return column === 'salary' ? texts.map((text) => parseFloat(text.replace('$', ''))) : texts;
  }
}
