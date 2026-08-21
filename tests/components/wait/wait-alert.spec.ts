// spec: specs/wait.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WaitPage, GENEROUS_TIMEOUT, ALERT_MESSAGE_PATTERN, collectDistinctDelays, extendTestTimeoutFor } from '../../pages/WaitPage';

test.describe('Wait - Delayed Alert Dialog', () => {
  let waitPage: WaitPage;

  test.beforeEach(async ({ page }) => {
    waitPage = new WaitPage(page);
    await waitPage.gotoWait();
  });

  test('Clicking the alert button eventually triggers a native alert dialog whose message matches the expected pattern, within a generous timeout', async ({
    page,
  }) => {
    // 1. Register a dialog handler BEFORE clicking (to avoid a race with the eventual alert), capturing the
    //    dialog's message and calling dialog.accept(). Click 'button-wait-for-alert'
    const message = await waitPage.triggerAlertAndGetMessage();

    // expect: Within a generous timeout, a dialog appears and its captured message matches the expected pattern
    expect(message).toMatch(ALERT_MESSAGE_PATTERN);
    // expect: After acceptance, no dialog remains open and the page is otherwise unchanged
    await expect(page).toHaveURL(/\/components\/wait$/);
  });

  test('The alert delay is genuinely randomized across repeated triggers, not a fixed constant', async () => {
    extendTestTimeoutFor(3 * GENEROUS_TIMEOUT);

    // 1. Trigger the alert button, capture and accept the dialog message, then repeat two more times (3 total
    //    trials), recording each captured message's numeric seconds value each time
    const delays = await collectDistinctDelays(3, async () => {
      const message = await waitPage.triggerAlertAndGetMessage();
      // expect: Each captured message matches the expected pattern
      expect(message).toMatch(ALERT_MESSAGE_PATTERN);
      return message;
    });

    // expect: The 3 parsed numeric delay values are not all identical to each other, confirming genuine
    //         per-click randomization
    expect(new Set(delays).size).toBeGreaterThan(1);
  });

  test('The alert button remains enabled and clickable while its own delay is still pending', async ({ page }) => {
    // 1. Click 'button-wait-for-alert' once (do not wait for the dialog), then immediately check the button's
    //    disabled state
    const dialogPromise = page.waitForEvent('dialog', { timeout: GENEROUS_TIMEOUT });
    await waitPage.alertButton.click();

    // expect: Immediately after the click, before the dialog has appeared, the button is still enabled
    await expect(waitPage.alertButton).toBeEnabled();

    // 2. Register a dialog handler and wait for the pending dialog to appear (generous timeout), then accept it
    //    to clean up
    const dialog = await dialogPromise;

    // expect: The dialog eventually appears and is accepted without error
    expect(dialog.message()).toMatch(ALERT_MESSAGE_PATTERN);
    await dialog.accept();
  });
});
