import { Page, Locator, Dialog, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AlertPage extends BasePage {
  readonly simpleAlertBtn: Locator;
  readonly confirmAlertBtn: Locator;
  readonly promptAlertBtn: Locator;
  readonly sweetAlertBtn: Locator;
  readonly main: Locator;
  readonly sweetAlertModal: Locator;
  readonly sweetAlertHeading: Locator;
  readonly sweetAlertYesBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.simpleAlertBtn = page.getByTestId('button-simple-alert');
    this.confirmAlertBtn = page.getByTestId('button-confirm-alert');
    this.promptAlertBtn = page.getByTestId('button-prompt-alert');
    this.sweetAlertBtn = page.getByTestId('button-sweet-alert');
    this.main = page.locator('main');
    this.sweetAlertModal = page.getByRole('dialog');
    this.sweetAlertHeading = page.getByRole('heading', { name: 'Error!' });
    this.sweetAlertYesBtn = page.getByRole('button', { name: 'Yes' });
  }

  async gotoAlert() {
    const response = await this.goto('/components/alert');
    // Ensure client-side content has actually rendered before any caller captures
    // page text as a "before" baseline — page.goto() resolves on the load event,
    // which can land before React hydration finishes on slower browsers.
    await expect(this.simpleAlertBtn).toBeVisible();
    return response;
  }

  /**
   * Clicks the given trigger button, registers a one-shot native dialog handler
   * before clicking (required — Playwright auto-dismisses unregistered dialogs),
   * resolves it via accept/dismiss, and returns the dialog's type/message.
   * Centralizes the register-then-click ordering so every call site doesn't
   * hand-roll the same race-prone boilerplate.
   */
  async triggerDialog(
    trigger: Locator,
    resolution: { action: 'accept'; value?: string } | { action: 'dismiss' }
  ): Promise<{ type: string; message: string }> {
    let result: { type: string; message: string } | null = null;
    // The dialog must be accepted/dismissed from *within* the event handler — a native
    // dialog blocks the page's render process, so trigger.click() won't resolve until
    // the dialog has actually been handled here.
    const handled = new Promise<void>((resolve) => {
      this.page.once('dialog', async (dialog: Dialog) => {
        result = { type: dialog.type(), message: dialog.message() };
        if (resolution.action === 'accept') {
          await dialog.accept(resolution.value);
        } else {
          await dialog.dismiss();
        }
        resolve();
      });
    });
    await trigger.click();
    await handled;
    return result!;
  }

  /** Captures <main>'s visible text before running `action`, and returns both snapshots. */
  async captureTextAround(action: () => Promise<void>): Promise<{ before: string; after: string }> {
    const before = await this.main.innerText();
    await action();
    const after = await this.main.innerText();
    return { before, after };
  }

  async expectNoDialogFires(during: () => Promise<void>) {
    let dialogFired = false;
    const handler = () => {
      dialogFired = true;
    };
    this.page.on('dialog', handler);
    try {
      await during();
    } finally {
      this.page.off('dialog', handler);
    }
    expect(dialogFired).toBe(false);
  }

  async openSweetAlert() {
    await this.sweetAlertBtn.click();
    await expect(this.sweetAlertHeading).toBeVisible();
  }

  async expectSweetAlertClosed() {
    await expect(this.sweetAlertHeading).not.toBeVisible();
    await expect(this.sweetAlertModal).toHaveCount(0);
  }

  async closeSweetAlertViaYes() {
    await this.sweetAlertYesBtn.click();
  }

  async closeSweetAlertViaEscape() {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Clicks the SweetAlert backdrop, not the popup itself. Rather than a hardcoded
   * pixel offset (fragile if the popup's size/position ever shifts), this computes
   * a point inside the container's bounding box but outside the popup's, and fails
   * loudly if no such point exists near the container's corner instead of silently
   * clicking the popup and hanging on a modal that never closes.
   */
  async closeSweetAlertViaBackdropClick() {
    const container = this.page.locator('.swal2-container');
    const popup = this.page.locator('.swal2-popup');

    const containerBox = await container.boundingBox();
    const popupBox = await popup.boundingBox();
    if (!containerBox || !popupBox) {
      throw new Error('Could not read SweetAlert container/popup bounding box for backdrop click.');
    }

    const point = { x: containerBox.x + 10, y: containerBox.y + 10 };
    const isInsidePopup =
      point.x >= popupBox.x &&
      point.x <= popupBox.x + popupBox.width &&
      point.y >= popupBox.y &&
      point.y <= popupBox.y + popupBox.height;
    if (isInsidePopup) {
      throw new Error(
        'Computed backdrop-click point falls inside the SweetAlert popup, not the backdrop — ' +
          'viewport is too small relative to the popup for this approach.'
      );
    }

    await container.click({ position: { x: point.x - containerBox.x, y: point.y - containerBox.y } });
  }
}
