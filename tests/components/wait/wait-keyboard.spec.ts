// spec: specs/wait.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WaitPage } from '../../pages/WaitPage';

test.describe('Wait - Keyboard Interaction', () => {
  let waitPage: WaitPage;

  test.beforeEach(async ({ page }) => {
    waitPage = new WaitPage(page);
    await waitPage.gotoWait();
  });

  test("Pressing Enter on a keyboard-focused 'Wait for element!' button triggers the same delayed-appearance cycle as a mouse click", async () => {
    // 1. Focus 'button-wait-for-element' directly without clicking it, then press 'Enter'
    await waitPage.elementButton.focus();
    await expect(waitPage.elementButton).toBeFocused();
    await waitPage.elementButton.press('Enter');

    // expect: Within a generous timeout, '#dynamic-text' becomes visible with the expected message, identical
    //         in shape to the mouse-click result
    await waitPage.waitForElementAppear();
  });

  test("Pressing Space on a keyboard-focused 'Wait for text change!' button triggers the same delayed text-change cycle as a mouse click", async () => {
    // 1. Confirm '#update-text' reads 'Initial text...'. Focus 'button-wait-for-text' directly without clicking
    //    it, then press 'Space'
    await expect(waitPage.updateTextSpan).toHaveText('Initial text...');
    await waitPage.textButton.focus();
    await expect(waitPage.textButton).toBeFocused();
    await waitPage.textButton.press('Space');

    // expect: Within a generous timeout, '#update-text' changes to match the expected message, identical in
    //         shape to the mouse-click result
    await waitPage.waitForTextChange();
  });
});
