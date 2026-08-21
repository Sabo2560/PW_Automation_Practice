import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortColumn = 'name' | 'department' | 'hireDate' | 'salary';

const COLUMN_INDEX: Record<SortColumn, number> = {
  name: 0,
  department: 1,
  hireDate: 2,
  salary: 3,
};

const SORT_COLUMNS: SortColumn[] = ['name', 'department', 'hireDate', 'salary'];

export class SimpleTablePage extends BasePage {
  readonly shoppingTable: Locator;
  readonly taskTable: Locator;
  readonly salaryTable: Locator;
  readonly shoppingRows: Locator;
  readonly shoppingTotalCell: Locator;
  readonly shoppingTfootCells: Locator;
  readonly salaryRows: Locator;

  constructor(page: Page) {
    super(page);
    this.shoppingTable = page.getByTestId('shopping-table');
    this.taskTable = page.getByTestId('task-table');
    this.salaryTable = page.getByTestId('salary-table');
    this.shoppingRows = this.shoppingTable.locator('tbody tr');
    this.shoppingTotalCell = this.shoppingTable.locator('tfoot td').last();
    this.shoppingTfootCells = this.shoppingTable.locator('tfoot tr td');
    this.salaryRows = this.salaryTable.locator('tbody tr');
  }

  async gotoSimpleTable() {
    const response = await this.goto('/components/simple-table');
    await this.shoppingRows.first().waitFor({ state: 'visible' });
    return response;
  }

  shoppingRow(name: string): Locator {
    return this.shoppingRows.filter({ hasText: name });
  }

  taskRow(name: string): Locator {
    return this.taskTable.getByRole('row', { name: new RegExp(name) });
  }

  taskCheckbox(name: string): Locator {
    return this.taskRow(name).getByRole('checkbox');
  }

  /** Asserts the task table's default checked state: only 'Write Blog Post' checked. */
  async expectTaskDefaultState() {
    await expect(this.taskCheckbox('Design Landing Page')).not.toBeChecked();
    await expect(this.taskCheckbox('Write Blog Post')).toBeChecked();
    await expect(this.taskCheckbox('Develop API')).not.toBeChecked();
  }

  sortHeader(column: SortColumn): Locator {
    return this.page.getByTestId(`sort-column-${column}`);
  }

  async expectAriaSort(column: SortColumn, value: 'none' | 'ascending' | 'descending') {
    await expect(this.sortHeader(column)).toHaveAttribute('aria-sort', value);
  }

  /**
   * Asserts one column's aria-sort direction and every other column's is 'none' — or, with no
   * arguments, that all four columns are 'none' (the fresh-load/no-sort-yet state).
   */
  async expectSortState(active?: SortColumn, direction?: 'ascending' | 'descending') {
    for (const column of SORT_COLUMNS) {
      await this.expectAriaSort(column, column === active ? direction! : 'none');
    }
  }

  /** Reads quantity×price from every shopping-table row live, so callers never hardcode the total. */
  async computeExpectedShoppingTotal(): Promise<number> {
    const cellTexts = await this.shoppingRows.locator('td').allTextContents();
    let total = 0;
    for (let i = 0; i < cellTexts.length; i += 3) {
      total += parseFloat(cellTexts[i + 1]) * parseFloat(cellTexts[i + 2]);
    }
    return total;
  }

  /** Computes the expected total live and asserts the displayed tfoot total matches it exactly. */
  async expectShoppingTotalCorrect() {
    const expectedTotal = await this.computeExpectedShoppingTotal();
    await expect(this.shoppingTotalCell).toHaveText(String(expectedTotal));
  }

  /** Reads one salary-table column's cell text top-to-bottom, parsing salary as a number (stripping '$'). */
  async readColumnValues(column: SortColumn): Promise<(string | number)[]> {
    const index = COLUMN_INDEX[column];
    const cells = this.salaryTable.locator(`tbody tr td:nth-child(${index + 1})`);
    const texts = await cells.allTextContents();
    return column === 'salary' ? texts.map((text) => parseFloat(text.replace('$', ''))) : texts;
  }
}
