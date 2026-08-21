// spec: specs/wait.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  WaitPage,
  ALERT_MESSAGE_PATTERN,
  ELEMENT_APPEAR_PATTERN,
  TEXT_CHANGE_PATTERN,
  GENEROUS_TIMEOUT,
  OBSERVATION_WINDOW,
  extendTestTimeoutFor,
} from '../../pages/WaitPage';

test.describe('Wait - Cross-Widget Independence and Network/Console Behavior', () => {
  let waitPage: WaitPage;

  test.beforeEach(async ({ page }) => {
    waitPage = new WaitPage(page);
    await waitPage.gotoWait();
  });

  test('Triggering the element-appear, text-change, and disappearance widgets simultaneously completes all three independently with no cross-interference', async () => {
    extendTestTimeoutFor(GENEROUS_TIMEOUT);

    // 1. Click 'button-wait-for-element', 'button-wait-for-text', and 'button-wait-for-disappearance' one
    //    immediately after another (within the same short window)
    // 2. Wait for all three widgets to reach their fully-settled end state, concurrently (not sequentially — the
    //    disappearance widget's full cycle can complete faster than the other two widgets' own trigger delay)
    // expect: '#dynamic-text' ends up visible with the expected message
    // expect: '#update-text' ends up matching the expected message
    // expect: '#disappearing-element' ends up absent again after having appeared
    await waitPage.triggerAndSettleElementTextDisappearance();

    await expect(waitPage.dynamicElement).toHaveText(ELEMENT_APPEAR_PATTERN);
    await expect(waitPage.updateTextSpan).toHaveText(TEXT_CHANGE_PATTERN);
    await expect(waitPage.disappearingElement).toHaveCount(0);
  });

  test('No API/network requests fire as a result of any wait-widget interaction on this page (purely client-side component)', async () => {
    extendTestTimeoutFor(GENEROUS_TIMEOUT);

    // 1. Begin recording network requests, then trigger and fully complete a cycle on all four widgets
    //    (accepting the alert dialog)
    const apiRequests = waitPage.trackApiRequests('/components/wait');

    const alertMessage = await waitPage.triggerAlertAndGetMessage();
    expect(alertMessage).toMatch(ALERT_MESSAGE_PATTERN);

    await waitPage.triggerAndSettleElementTextDisappearance();

    // expect: No XHR/fetch network request specific to any wait-widget action is observed
    expect(apiRequests).toEqual([]);
  });

  test('No console errors are logged during any of the four widgets\' delay/reveal cycles, including overlapping/concurrent triggers', async () => {
    extendTestTimeoutFor(2 * OBSERVATION_WINDOW);

    // 1. Begin tracking console errors, then trigger and fully complete a cycle on all four widgets, including
    //    at least one rapid double-click on the alert button (accepting both resulting dialogs)
    const consoleErrors = waitPage.trackConsoleErrors();

    const dialogMessages = await waitPage.triggerAlertTwiceAndCollectMessages();
    expect(dialogMessages).toHaveLength(2);

    await waitPage.triggerAndSettleElementTextDisappearance();

    // expect: Zero console error messages are logged throughout the entire sequence of interactions
    expect(consoleErrors).toEqual([]);
  });
});
