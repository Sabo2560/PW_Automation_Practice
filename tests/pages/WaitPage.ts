import { Page, Locator, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Every multi-second delay observed live across ~20 trials fell between 2.1s and 4.0s.
 * This gives more than 2x safety margin — never assert against a tighter/assumed exact delay.
 */
export const GENEROUS_TIMEOUT = 10000;

/** The disappearance widget's initial appearance was measured live at only ~20-35ms. */
export const SHORT_APPEAR_TIMEOUT = 2000;

/** How long the concurrency-quirk tests poll for transient intermediate states to appear. */
export const OBSERVATION_WINDOW = 9000;

export const ALERT_MESSAGE_PATTERN = /^Alert after [\d.]+ seconds!$/;
export const ELEMENT_APPEAR_PATTERN = /^Element appeared after [\d.]+ seconds!$/;
export const TEXT_CHANGE_PATTERN = /^Text changed after [\d.]+ seconds!$/;

/** Extends the current test's timeout to comfortably cover `ms` of expected real-timer waiting. */
export function extendTestTimeoutFor(ms: number) {
  test.setTimeout(ms + 30000);
}

/** Runs `trial` `count` times, parsing the numeric "X.X seconds" value out of each returned message. */
export async function collectDistinctDelays(count: number, trial: () => Promise<string>): Promise<number[]> {
  const delays: number[] = [];
  for (let i = 0; i < count; i++) {
    const text = await trial();
    delays.push(parseFloat(text.replace(/[^\d.]/g, '')));
  }
  return delays;
}

export class WaitPage extends BasePage {
  readonly alertButton: Locator;
  readonly elementButton: Locator;
  readonly textButton: Locator;
  readonly disappearanceButton: Locator;
  readonly dynamicElement: Locator;
  readonly updateTextSpan: Locator;
  readonly disappearingElement: Locator;

  constructor(page: Page) {
    super(page);
    this.alertButton = page.getByTestId('button-wait-for-alert');
    this.elementButton = page.getByTestId('button-wait-for-element');
    this.textButton = page.getByTestId('button-wait-for-text');
    this.disappearanceButton = page.getByTestId('button-wait-for-disappearance');
    this.dynamicElement = page.locator('#dynamic-text');
    this.updateTextSpan = page.locator('#update-text');
    this.disappearingElement = page.locator('#disappearing-element');
  }

  async gotoWait() {
    const response = await this.goto('/components/wait');
    await expect(this.alertButton).toBeVisible();
    return response;
  }

  /**
   * Registers the dialog handler BEFORE clicking — required to avoid a race with the eventual
   * alert — accepts it, and returns its message text.
   */
  async triggerAlertAndGetMessage(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: GENEROUS_TIMEOUT });
    await this.alertButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }

  /**
   * Registers a dialog collector (auto-accepting each), clicks the alert button twice ~200ms
   * apart — while the first click's delay is still pending — and returns both captured messages
   * once received. Used by the repeated-click quirk scenarios.
   */
  async triggerAlertTwiceAndCollectMessages(): Promise<string[]> {
    const dialogMessages: string[] = [];
    this.page.on('dialog', async (dialog) => {
      dialogMessages.push(dialog.message());
      await dialog.accept();
    });

    await this.alertButton.click();
    await this.page.waitForTimeout(200);
    await this.alertButton.click();

    await expect.poll(() => dialogMessages.length, { timeout: 2 * GENEROUS_TIMEOUT }).toBe(2);
    return dialogMessages;
  }

  async waitForElementAppear() {
    await expect(this.dynamicElement).toHaveText(ELEMENT_APPEAR_PATTERN, { timeout: GENEROUS_TIMEOUT });
  }

  async waitForTextChange() {
    await expect(this.updateTextSpan).toHaveText(TEXT_CHANGE_PATTERN, { timeout: GENEROUS_TIMEOUT });
  }

  async waitForDisappearance() {
    await expect(this.disappearingElement).toBeHidden({ timeout: GENEROUS_TIMEOUT });
  }

  /**
   * Clicks the disappearance button, asserts its near-instant appearance (optionally checking its
   * exact static text), then waits for it to disappear again.
   */
  async runDisappearanceCycle(assertText = true) {
    await this.disappearanceButton.click();
    await expect(this.disappearingElement).toBeVisible({ timeout: SHORT_APPEAR_TIMEOUT });
    if (assertText) {
      await expect(this.disappearingElement).toHaveText('I will disappear!');
    }
    await this.waitForDisappearance();
  }

  /**
   * Triggers the element-appear, text-change, and disappearance widgets concurrently and waits
   * for all three to settle. Concurrent, not sequential — the disappearance widget's full cycle
   * can complete faster than the other two widgets' own trigger delay, so awaiting sequentially
   * risks missing its appear/disappear window, and needlessly stacks each widget's wait time.
   */
  async triggerAndSettleElementTextDisappearance() {
    await this.elementButton.click();
    await this.textButton.click();
    await this.disappearanceButton.click();

    await Promise.all([
      this.waitForElementAppear(),
      this.waitForTextChange(),
      (async () => {
        await expect(this.disappearingElement).toBeVisible({ timeout: SHORT_APPEAR_TIMEOUT });
        await this.waitForDisappearance();
      })(),
    ]);
  }

  /**
   * Polls `read()` every `intervalMs` until `deadline`, recording each distinct consecutive
   * value. For observing transient intermediate states between independently-scheduled timers,
   * where a single web-first assertion can't capture the full sequence.
   */
  async pollDistinctValues(read: () => Promise<string | null>, deadline: number, intervalMs = 200): Promise<string[]> {
    const values: string[] = [];
    while (Date.now() < deadline) {
      const value = await read();
      if (value && values[values.length - 1] !== value) {
        values.push(value);
      }
      await this.page.waitForTimeout(intervalMs);
    }
    return values;
  }

  /**
   * Starts counting real DOM mutations under <body> via a MutationObserver. Content-based
   * distinctness (comparing successive text values) isn't a reliable way to prove multiple
   * independent timers each wrote to the DOM — the app's delay display is rounded to one decimal,
   * so two unrelated random delays can coincidentally render identical text (confirmed live: this
   * happened often enough to make a "distinct values" count genuinely flaky). Counting mutations
   * instead is immune to that collision, since it doesn't matter whether the written values match.
   * Call `stopCountingDomMutations()` to stop observing and read the count.
   */
  async startCountingDomMutations() {
    await this.page.evaluate(() => {
      const win = window as unknown as { __mutationCount: number; __mutationObserver: MutationObserver };
      win.__mutationCount = 0;
      win.__mutationObserver = new MutationObserver((mutations) => {
        win.__mutationCount += mutations.length;
      });
      win.__mutationObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
  }

  async stopCountingDomMutations(): Promise<number> {
    return this.page.evaluate(() => {
      const win = window as unknown as { __mutationCount: number; __mutationObserver: MutationObserver };
      win.__mutationObserver.disconnect();
      return win.__mutationCount;
    });
  }
}
