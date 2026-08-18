import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class InputPage extends BasePage {
  readonly fullNameField: Locator;
  readonly appendTextField: Locator;
  readonly insideTextField: Locator;
  readonly clearTextField: Locator;
  readonly disabledField: Locator;
  readonly readonlyField: Locator;

  constructor(page: Page) {
    super(page);
    this.fullNameField = page.getByTestId('full-name');
    this.appendTextField = page.getByTestId('append-text');
    this.insideTextField = page.getByTestId('inside-text');
    this.clearTextField = page.getByTestId('clear-text');
    this.disabledField = page.getByTestId('disabled-field');
    this.readonlyField = page.getByTestId('readonly-field');
  }

  async gotoInput() {
    return this.goto('/components/input');
  }

  /** Reads native HTML5 constraint-validation state off a form control. */
  async getValidity(locator: Locator): Promise<{ valueMissing: boolean }> {
    return locator.evaluate((el: HTMLInputElement) => ({ valueMissing: el.validity.valueMissing }));
  }

  /** Selects all content in a field via keyboard and deletes it. */
  async clearViaKeyboard(field: Locator) {
    await field.click();
    await this.page.keyboard.press('ControlOrMeta+a');
    await this.page.keyboard.press('Backspace');
  }

  async expectAllFieldsRequired() {
    for (const field of [
      this.fullNameField,
      this.appendTextField,
      this.insideTextField,
      this.clearTextField,
      this.disabledField,
      this.readonlyField,
    ]) {
      await expect(field).toHaveAttribute('required', '');
    }
  }
}
