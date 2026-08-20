import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RadioPage extends BasePage {
  readonly answerYes: Locator;
  readonly answerNo: Locator;
  readonly oneYes: Locator;
  readonly oneNo: Locator;
  readonly findBugOptionA: Locator;
  readonly findBugOptionB: Locator;
  readonly fooRadio: Locator;
  readonly barRadio: Locator;
  readonly goingRadio: Locator;
  readonly notGoingRadio: Locator;
  readonly maybeRadio: Locator;
  readonly rememberCheckbox: Locator;
  readonly termsCheckbox: Locator;
  readonly termsLabel: Locator;
  readonly termsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.answerYes = page.getByTestId('answer-radio').first();
    this.answerNo = page.getByTestId('answer-radio').last();
    this.oneYes = page.getByTestId('one-radio').first();
    this.oneNo = page.getByTestId('one-radio').last();
    // No shared data-testid on this pair — ids are unique standalone strings,
    // safe to use directly (unlike #Yes/#No, which are duplicated document-wide).
    this.findBugOptionA = page.locator('#nobug');
    this.findBugOptionB = page.locator('#bug');
    this.fooRadio = page.locator('#Foo');
    this.barRadio = page.locator('#Bar');
    this.goingRadio = page.locator('#Going');
    // id contains a literal space, so a bare CSS id selector won't work here.
    this.notGoingRadio = page.locator('input[id="Not going"]');
    this.maybeRadio = page.locator('#Maybe');
    this.rememberCheckbox = page.getByTestId('checkbox-checked');
    this.termsCheckbox = page.getByTestId('termsConditions-checkbox');
    this.termsLabel = page.locator('label[for="termsAndConditions"]');
    this.termsLink = page.getByRole('link', { name: 'Terms and Conditions' });
  }

  async gotoRadio() {
    const response = await this.goto('/components/radio');
    await expect(this.answerYes).toBeVisible();
    return response;
  }

  /** Asserts `checked` is the only one of `checked`/`unchecked` that's actually checked. */
  async expectOnlyChecked(checked: Locator, unchecked: Locator[]) {
    await expect(checked).toBeChecked();
    for (const radio of unchecked) {
      await expect(radio).not.toBeChecked();
    }
  }

  /** Asserts every one of the page's 13 radio/checkbox inputs matches its documented fresh-load default. */
  async expectDefaultState() {
    await expect(this.answerYes).not.toBeChecked();
    await expect(this.answerNo).not.toBeChecked();
    await expect(this.oneYes).not.toBeChecked();
    await expect(this.oneNo).not.toBeChecked();
    await expect(this.findBugOptionA).not.toBeChecked();
    await expect(this.findBugOptionB).not.toBeChecked();
    await expect(this.fooRadio).not.toBeChecked();
    await expect(this.barRadio).toBeChecked();
    await expect(this.goingRadio).not.toBeChecked();
    await expect(this.goingRadio).toBeEnabled();
    await expect(this.notGoingRadio).not.toBeChecked();
    await expect(this.notGoingRadio).toBeEnabled();
    await expect(this.maybeRadio).not.toBeChecked();
    await expect(this.maybeRadio).toBeDisabled();
    await expect(this.rememberCheckbox).toBeChecked();
    await expect(this.termsCheckbox).not.toBeChecked();
  }

  /**
   * Clicks a label at a fixed offset from its own top-left corner (position is element-relative,
   * not page-relative, so no boundingBox lookup is needed) — used to click the plain-text portion
   * of termsLabel without landing on its nested link.
   */
  async clickLabelText(label: Locator, offset: { x: number; y: number } = { x: 10, y: 5 }) {
    await label.click({ position: offset });
  }

  /** Clicks termsLink, waits for the resulting new tab to finish loading, and returns it. */
  async openTermsLinkInNewTab(): Promise<Page> {
    const [popup] = await Promise.all([this.page.waitForEvent('popup'), this.termsLink.click()]);
    await popup.waitForLoadState();
    return popup;
  }
}
