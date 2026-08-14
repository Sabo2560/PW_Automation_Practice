import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type FormFieldOverrides = {
  dropdown?: string;
  name?: string;
  email?: string;
  message?: string;
  radio?: 'Yes' | 'No';
  checkTerms?: boolean;
};

export type Validity = {
  valueMissing: boolean;
  typeMismatch: boolean;
  validationMessage: string;
};

export class FormPage extends BasePage {
  readonly dropdown: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly messageInput: Locator;
  readonly radioYes: Locator;
  readonly radioNo: Locator;
  readonly checkbox: Locator;
  readonly submitBtn: Locator;
  readonly successPanel: Locator;
  readonly retryBtn: Locator;
  readonly termsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.dropdown = page.getByTestId('form-dropdown');
    this.nameInput = page.getByTestId('form-name');
    this.emailInput = page.getByTestId('form-email');
    this.messageInput = page.getByTestId('form-message');
    this.radioYes = page.getByTestId('form-radio').and(page.locator('#Yes'));
    this.radioNo = page.getByTestId('form-radio').and(page.locator('#No'));
    this.checkbox = page.getByTestId('termsConditions-checkbox');
    this.submitBtn = page.getByTestId('button-submit');
    this.successPanel = page.getByTestId('form-sent');
    this.retryBtn = page.getByTestId('button-form-retry');
    this.termsLink = page.getByRole('link', { name: 'Terms and Conditions' });
  }

  async gotoForm() {
    await this.goto('/components/form');
  }

  /**
   * Fills all six fields with valid default values, allowing per-field overrides.
   * Passing an empty string ('') for a text field, or `false`/`undefined` for
   * checkTerms/radio, leaves that field at its default (unfilled) state — useful
   * for isolating a single required-field constraint in validation tests.
   */
  async fillValid(overrides: FormFieldOverrides = {}) {
    const values: Required<FormFieldOverrides> = {
      dropdown: 'Software',
      name: 'Test User',
      email: 'test@example.com',
      message: 'Test message',
      radio: 'Yes',
      checkTerms: true,
      ...overrides,
    };

    if (values.dropdown) await this.dropdown.selectOption(values.dropdown);
    if (values.name) await this.nameInput.fill(values.name);
    if (values.email) await this.emailInput.fill(values.email);
    if (values.message) await this.messageInput.fill(values.message);
    if (values.radio) await this.selectRadio(values.radio);
    if (values.checkTerms) await this.checkbox.check();
  }

  async selectRadio(value: 'Yes' | 'No') {
    if (value === 'Yes') {
      await this.radioYes.check();
    } else {
      await this.radioNo.check();
    }
  }

  async submit() {
    await this.submitBtn.click();
  }

  async retry() {
    await this.retryBtn.click();
  }

  /** Reads native HTML5 constraint-validation state off a form control. */
  async getValidity(locator: Locator): Promise<Validity> {
    return locator.evaluate((el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => ({
      valueMissing: el.validity.valueMissing,
      typeMismatch: el.validity.typeMismatch,
      validationMessage: el.validationMessage,
    }));
  }

  async expectSuccessVisible() {
    await expect(this.successPanel).toBeVisible();
  }

  async expectSuccessAbsent() {
    await expect(this.successPanel).toHaveCount(0);
  }

  async expectFormRestored() {
    await expect(this.successPanel).toHaveCount(0);
    await expect(this.dropdown).toHaveValue('');
    await expect(this.nameInput).toHaveValue('');
    await expect(this.emailInput).toHaveValue('');
    await expect(this.messageInput).toHaveValue('');
    await expect(this.radioYes).not.toBeChecked();
    await expect(this.radioNo).not.toBeChecked();
    await expect(this.checkbox).not.toBeChecked();
    await expect(this.submitBtn).toBeVisible();
    await expect(this.submitBtn).toBeEnabled();
  }
}
