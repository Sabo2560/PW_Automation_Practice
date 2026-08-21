// spec: specs/wait.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WaitPage, GENEROUS_TIMEOUT, extendTestTimeoutFor } from '../../pages/WaitPage';

test.describe('Wait - Element Disappearance Cycle', () => {
  let waitPage: WaitPage;

  test.beforeEach(async ({ page }) => {
    waitPage = new WaitPage(page);
    await waitPage.gotoWait();
  });

  test("'#disappearing-element' is absent by default, appears almost instantly after clicking with the exact static text, then disappears again after a further randomized delay", async () => {
    extendTestTimeoutFor(GENEROUS_TIMEOUT);

    // 1. Confirm '#disappearing-element' does not exist in the DOM before interacting
    await expect(waitPage.disappearingElement).toHaveCount(0);

    // 2-3. Click 'button-wait-for-disappearance'
    // expect: '#disappearing-element' becomes visible within a short timeout — its appearance was measured
    //         live at only ~20-35ms, far faster than the other three widgets' multi-second delays
    // expect: text content equals exactly the static string, NOT a randomized-delay message
    // expect: within a generous timeout, '#disappearing-element' becomes hidden/removed from the DOM again
    await waitPage.runDisappearanceCycle();
  });

  test('The full appear-then-disappear cycle can be repeated a second time on the same page load, with no reload required', async () => {
    extendTestTimeoutFor(2 * GENEROUS_TIMEOUT);

    // 1. Click 'button-wait-for-disappearance' and wait for the full cycle to complete
    await waitPage.runDisappearanceCycle();

    // expect: '#disappearing-element' is absent again after the first full cycle completes
    await expect(waitPage.disappearingElement).toHaveCount(0);

    // 2. Without reloading, click 'button-wait-for-disappearance' a second time
    // expect: becomes visible again within a short timeout, with the exact static text
    // expect: within a further generous timeout, becomes hidden/removed again
    await waitPage.runDisappearanceCycle();
  });
});
