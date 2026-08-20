import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export const ALL_OPTIONS = Array.from({ length: 10 }, (_, i) => `Option ${i + 1}`);

export class MultiselectPage extends BasePage {
  readonly form1: Locator;
  readonly form2: Locator;
  readonly form3: Locator;

  constructor(page: Page) {
    super(page);
    this.form1 = page.getByTestId('multiselect-form-1');
    this.form2 = page.getByTestId('multiselect-form-2');
    this.form3 = page.getByTestId('multiselect-form-3');
  }

  async gotoMultiselect() {
    const response = await this.goto('/components/multiselect');
    await this.searchInput(this.form1).waitFor({ state: 'visible' });
    return response;
  }

  searchInput(form: Locator): Locator {
    return form.getByRole('textbox', { name: 'Select' });
  }

  optionListContainer(form: Locator): Locator {
    return form.locator('.optionListContainer');
  }

  chips(form: Locator): Locator {
    return form.locator('.chip');
  }

  chip(form: Locator, label: string): Locator {
    return form.locator('.chip').filter({ hasText: new RegExp(`^${label}$`) });
  }

  option(form: Locator, label: string): Locator {
    return form.locator('.optionContainer li.option').filter({ hasText: new RegExp(`^${label}$`) });
  }

  options(form: Locator): Locator {
    return form.locator('.optionContainer li.option');
  }

  highlightedOption(form: Locator): Locator {
    return form.locator('.optionContainer li.option.highlightOption.highlight');
  }

  noOptionsAvailable(form: Locator): Locator {
    return form.locator('.notFound');
  }

  async openForm(form: Locator) {
    await this.searchInput(form).click();
  }

  /**
   * Escape does NOT close an open option list (confirmed quirk). A still-open list
   * can visually overlap and intercept clicks meant for another form below/above it,
   * so switching forms requires clicking outside first — the page heading is a safe,
   * always-present target that is never covered by any form's option list.
   */
  async closeOpenList() {
    await this.page.getByRole('heading', { name: 'Multiselect', level: 1 }).click();
  }

  async selectOption(form: Locator, label: string) {
    await this.option(form, label).click();
  }

  async removeChip(form: Locator, label: string) {
    await this.chip(form, label).locator('.icon_cancel').click();
  }

  async filterOptions(form: Locator, text: string) {
    await this.searchInput(form).fill(text);
  }

  /**
   * `.fill('')` leaves the widget's rendered option list stuck on the previous
   * filtered result even though the input's DOM value clears — confirmed live.
   * Real keystrokes always refresh it correctly, so clear via keyboard instead.
   */
  async clearSearch(form: Locator) {
    const input = this.searchInput(form);
    await input.click();
    await input.press('ControlOrMeta+a');
    await input.press('Backspace');
  }

  async getChipTexts(form: Locator): Promise<string[]> {
    return this.chips(form).allTextContents();
  }

  async getAvailableOptionTexts(form: Locator): Promise<string[]> {
    return this.options(form).allTextContents();
  }
}
