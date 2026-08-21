// spec: specs/wait.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import {
  WaitPage,
  ALERT_MESSAGE_PATTERN,
  ELEMENT_APPEAR_PATTERN,
  TEXT_CHANGE_PATTERN,
  GENEROUS_TIMEOUT,
  SHORT_APPEAR_TIMEOUT,
  OBSERVATION_WINDOW,
  extendTestTimeoutFor,
} from '../../pages/WaitPage';

test.describe('Wait - Concurrent and Repeated-Click Quirks', () => {
  let waitPage: WaitPage;

  test.beforeEach(async ({ page }) => {
    waitPage = new WaitPage(page);
    await waitPage.gotoWait();
  });

  test('[QUIRK] Clicking the alert button twice in quick succession while the first delay is still pending produces TWO separate sequential dialogs, not one merged/ignored click', async ({
    page,
  }) => {
    extendTestTimeoutFor(2 * OBSERVATION_WINDOW);

    // 1. Register a dialog collector that records every dialog's message and accepts each one as it appears.
    //    Click 'button-wait-for-alert', wait ~200ms, then click 'button-wait-for-alert' again
    // expect: Within a generous combined timeout, exactly 2 dialogs are captured in total
    const dialogMessages = await waitPage.triggerAlertTwiceAndCollectMessages();

    // expect: Both captured messages independently match the expected pattern
    expect(dialogMessages[0]).toMatch(ALERT_MESSAGE_PATTERN);
    expect(dialogMessages[1]).toMatch(ALERT_MESSAGE_PATTERN);

    // expect: no further, unexpected third dialog appears shortly after — confirms exactly 2, not more
    await page.waitForTimeout(2000);
    expect(dialogMessages.length).toBe(2);
  });

  test('[QUIRK] Clicking the element-appear button three times in rapid succession while prior delays are still pending produces three distinct sequential text changes, with the LAST-firing timer\'s message as the final displayed state', async ({
    page,
  }) => {
    extendTestTimeoutFor(OBSERVATION_WINDOW);

    // 1. Click 'button-wait-for-element' three times in rapid succession, then observe over the following ~9
    //    seconds. Multiplicity is proven via DOM mutation count, not distinct text values — the app's delay
    //    display is rounded to one decimal, so two of the three independently-randomized delays can
    //    coincidentally render identical text, which would make a "distinct values" count unreliable.
    await waitPage.startCountingDomMutations();
    await waitPage.elementButton.click();
    await page.waitForTimeout(100);
    await waitPage.elementButton.click();
    await page.waitForTimeout(100);
    await waitPage.elementButton.click();

    await page.waitForTimeout(OBSERVATION_WINDOW);
    const mutationCount = await waitPage.stopCountingDomMutations();

    // expect: More than one DOM mutation is observed, proving at least a second click's timer independently
    //         wrote to the DOM rather than the first click's callback being discarded/merged/ignored
    expect(mutationCount).toBeGreaterThan(1);
    // expect: The FINAL value present at the end of the observation window matches the expected pattern
    await expect(waitPage.dynamicElement).toHaveText(ELEMENT_APPEAR_PATTERN);
  });

  test("[QUIRK] Re-clicking the text-change button after the text has already changed once does not revert it to 'Initial text...' as an intermediate step — it stays at the old changed value until the new delay elapses", async ({
    page,
  }) => {
    extendTestTimeoutFor(2 * OBSERVATION_WINDOW);

    // 1. Click 'button-wait-for-text' and wait for '#update-text' to change from 'Initial text...' to its first
    //    delayed message. Record this first message
    await waitPage.textButton.click();
    await waitPage.waitForTextChange();
    const firstMessage = await waitPage.updateTextSpan.textContent();
    expect(firstMessage).toMatch(TEXT_CHANGE_PATTERN);

    // 2. Click 'button-wait-for-text' a second time. Immediately re-read '#update-text'
    await waitPage.textButton.click();

    // expect: '#update-text' still equals the exact first-recorded message, unchanged — it does NOT revert to
    //         'Initial text...' immediately after the second click
    await expect(waitPage.updateTextSpan).toHaveText(firstMessage!);

    // 3. Wait out the second click's own delay. Not waited via "text differs from firstMessage": the displayed
    //    delay is rounded to one decimal, so two independent random trials can occasionally land on the exact
    //    same displayed value (confirmed live: one run produced "3.0 seconds!" both times) — a fixed wait for
    //    GENEROUS_TIMEOUT reliably outlasts the second timer without depending on the two messages differing.
    await page.waitForTimeout(GENEROUS_TIMEOUT);

    // expect: '#update-text' eventually updates to a new value matching the expected pattern
    const secondMessage = await waitPage.updateTextSpan.textContent();
    expect(secondMessage).toMatch(TEXT_CHANGE_PATTERN);
  });

  test('[QUIRK] Re-clicking the disappearance button while its element is already visible does not produce an observable duplicate appear/disappear cycle', async () => {
    extendTestTimeoutFor(OBSERVATION_WINDOW);

    // 1. Click 'button-wait-for-disappearance' and wait for '#disappearing-element' to become visible. Then,
    //    while it is still visible, click 'button-wait-for-disappearance' again
    await waitPage.disappearanceButton.click();
    await expect(waitPage.disappearingElement).toBeVisible({ timeout: SHORT_APPEAR_TIMEOUT });
    await waitPage.disappearanceButton.click();

    // expect: '#disappearing-element' remains visible immediately after the second click
    await expect(waitPage.disappearingElement).toBeVisible();

    // 2. Poll '#disappearing-element' presence continuously over the following ~9 seconds, counting every
    //    present-to-absent transition. pollDistinctValues already dedups consecutive equal states, and the
    //    poll always starts on 'present', so every 'absent' entry in the result is one present→absent transition.
    const states = await waitPage.pollDistinctValues(
      async () => ((await waitPage.disappearingElement.count()) > 0 ? 'present' : 'absent'),
      Date.now() + OBSERVATION_WINDOW
    );
    const transitions = states.filter((state) => state === 'absent').length;

    // expect: Exactly 1 present-to-absent (disappearance) transition is observed within the window
    expect(transitions).toBe(1);
  });
});
