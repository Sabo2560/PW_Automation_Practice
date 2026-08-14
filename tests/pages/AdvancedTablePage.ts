import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdvancedTablePage extends BasePage {
  readonly searchInput: Locator;
  readonly pageSizeSelect: Locator;
  readonly firstBtn: Locator;
  readonly previousBtn: Locator;
  readonly nextBtn: Locator;
  readonly lastBtn: Locator;
  readonly rows: Locator;
  readonly summaryText: Locator;
  readonly pageIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByTestId('advanced-table-filter');
    this.pageSizeSelect = page.getByTestId('items-per-page-selector');
    this.firstBtn = page.getByTestId('pagination-first');
    this.previousBtn = page.getByTestId('pagination-previous');
    this.nextBtn = page.getByTestId('pagination-next');
    this.lastBtn = page.getByTestId('pagination-last');
    this.rows = page.locator('table tbody tr');
    this.summaryText = page.getByTestId('table-summary');
    this.pageIndicator = page.getByTestId('pagination-current-page');
  }

  async gotoAdvancedTable() {
    await this.goto('/components/advanced-table');
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async setPageSize(size: '5' | '10' | '25') {
    await this.pageSizeSelect.selectOption(size);
  }

  idCell(row: Locator) {
    return row.locator('td').first();
  }

  async expectSummary(text: string) {
    await expect(this.summaryText).toHaveText(text);
  }

  async expectPageIndicator(text: string) {
    await expect(this.pageIndicator).toHaveText(text);
  }
}