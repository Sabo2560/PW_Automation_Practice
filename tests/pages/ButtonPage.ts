import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ButtonPage extends BasePage {
  readonly goHomeBtn: Locator;
  readonly findLocationBtn: Locator;
  readonly findColorBtn: Locator;
  readonly findHeightWidthBtn: Locator;
  readonly disabledBtn: Locator;
  readonly holdBtn: Locator;
  readonly body: Locator;
  readonly holdResultText: Locator;

  constructor(page: Page) {
    super(page);
    this.goHomeBtn = page.getByTestId('button-go-home');
    this.findLocationBtn = page.getByTestId('button-find-location');
    this.findColorBtn = page.getByTestId('button-find-color');
    this.findHeightWidthBtn = page.getByTestId('button-find-height-width');
    this.disabledBtn = page.getByTestId('button-disabled-button');
    this.holdBtn = page.getByTestId('hold-button');
    this.body = page.locator('body');
    this.holdResultText = page.getByText(/You held the button for \d+ ms/);
  }

  async gotoButton() {
    return this.goto('/components/button');
  }

  /** Captures body text before/after `action`; returns both snapshots for equality checks. */
  async captureTextAround(action: () => Promise<void>): Promise<{ before: string; after: string }> {
    const before = await this.body.innerText();
    await action();
    const after = await this.body.innerText();
    return { before, after };
  }

  /** Extracts the numeric N from "You held the button for N ms" / "Holding... (N ms)" text. */
  parseMs(text: string): number {
    const match = text.match(/(\d+) ms/);
    if (!match) throw new Error(`No "N ms" pattern found in text: ${text}`);
    return Number(match[1]);
  }

  async getHoldResultMs(): Promise<number> {
    const text = await this.holdResultText.innerText();
    return this.parseMs(text);
  }
}
