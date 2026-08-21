// spec: specs/wait.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WaitPage, GENEROUS_TIMEOUT, TEXT_CHANGE_PATTERN, collectDistinctDelays, extendTestTimeoutFor } from '../../pages/WaitPage';

test.describe('Wait - Text Content Change After Delay', () => {
  test("'#update-text' reads 'Initial text...' by default and changes to the expected message after clicking, within a generous timeout", async ({
    page,
  }) => {
    const waitPage = new WaitPage(page);
    await waitPage.gotoWait();

    // 1. Confirm '#update-text' reads exactly 'Initial text...' before interacting, and that the surrounding
    //    static prefix 'Text to update: ' is visible alongside it
    await expect(waitPage.updateTextSpan).toHaveText('Initial text...');
    await expect(page.getByText('Text to update:')).toBeVisible();

    // 2. Click 'button-wait-for-text'
    await waitPage.textButton.click();

    // expect: Within a generous timeout, '#update-text' changes to match the expected pattern and no longer
    //         equals 'Initial text...'
    await waitPage.waitForTextChange();
  });

  test('The text-change delay is genuinely randomized across repeated triggers on fresh page loads', async ({
    page,
  }) => {
    // 3 fresh-navigation trials, each with up to GENEROUS_TIMEOUT to change — needs more than the default 30s.
    extendTestTimeoutFor(3 * GENEROUS_TIMEOUT);

    // 1. On 3 separate fresh navigations, click 'button-wait-for-text' once each time and record the numeric
    //    seconds value parsed from '#update-text' once it changes
    const delays = await collectDistinctDelays(3, async () => {
      const waitPage = new WaitPage(page);
      await waitPage.gotoWait();
      await waitPage.textButton.click();
      await waitPage.waitForTextChange();

      const text = (await waitPage.updateTextSpan.textContent()) ?? '';
      // expect: Each recorded text matches the expected pattern
      expect(text).toMatch(TEXT_CHANGE_PATTERN);
      return text;
    });

    // expect: The 3 parsed numeric delay values are not all identical, confirming genuine randomization
    expect(new Set(delays).size).toBeGreaterThan(1);
  });
});
