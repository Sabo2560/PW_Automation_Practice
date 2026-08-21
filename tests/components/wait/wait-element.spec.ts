// spec: specs/wait.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WaitPage, GENEROUS_TIMEOUT, ELEMENT_APPEAR_PATTERN, collectDistinctDelays, extendTestTimeoutFor } from '../../pages/WaitPage';

test.describe('Wait - Element Appears After Delay', () => {
  test("'#dynamic-text' is absent by default and appears with the expected message after clicking, within a generous timeout", async ({
    page,
  }) => {
    const waitPage = new WaitPage(page);
    await waitPage.gotoWait();

    // 1. Confirm '#dynamic-text' does not exist in the DOM before interacting
    await expect(waitPage.dynamicElement).toHaveCount(0);

    // 2. Click 'button-wait-for-element'
    await waitPage.elementButton.click();

    // expect: Within a generous timeout, '#dynamic-text' becomes visible with the expected message
    await waitPage.waitForElementAppear();
  });

  test('The element-appear delay is genuinely randomized across repeated triggers on fresh page loads', async ({
    page,
  }) => {
    // 3 fresh-navigation trials, each with up to GENEROUS_TIMEOUT to appear — needs more than the default 30s.
    extendTestTimeoutFor(3 * GENEROUS_TIMEOUT);

    // 1. On 3 separate fresh navigations, click 'button-wait-for-element' once each time and record the numeric
    //    seconds value parsed from '#dynamic-text' once it appears
    const delays = await collectDistinctDelays(3, async () => {
      const waitPage = new WaitPage(page);
      await waitPage.gotoWait();
      await waitPage.elementButton.click();
      await waitPage.waitForElementAppear();

      const text = (await waitPage.dynamicElement.textContent()) ?? '';
      // expect: Each recorded text matches the expected pattern
      expect(text).toMatch(ELEMENT_APPEAR_PATTERN);
      return text;
    });

    // expect: The 3 parsed numeric delay values are not all identical, confirming genuine randomization
    expect(new Set(delays).size).toBeGreaterThan(1);
  });
});
