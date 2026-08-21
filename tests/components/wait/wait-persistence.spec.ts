// spec: specs/wait.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WaitPage, GENEROUS_TIMEOUT, extendTestTimeoutFor } from '../../pages/WaitPage';

test.describe('Wait - Reload Persistence', () => {
  test('No widget state persists across a page reload; all four widgets reset to their documented fresh-load defaults after completing full cycles', async ({
    page,
  }) => {
    extendTestTimeoutFor(GENEROUS_TIMEOUT);

    const waitPage = new WaitPage(page);
    await waitPage.gotoWait();

    // 1. Trigger 'button-wait-for-element' and 'button-wait-for-text' and wait for BOTH to reach their
    //    fully-settled changed state — deliberately waiting for full completion before reloading, to avoid the
    //    reload-during-pending-timer race documented for this page
    // expect: Before reload, both widgets reflect their changed state (asserted by the helpers themselves)
    await waitPage.elementButton.click();
    await waitPage.textButton.click();
    await waitPage.waitForElementAppear();
    await waitPage.waitForTextChange();

    // 2. Reload the page
    await page.reload();
    await expect(waitPage.alertButton).toBeVisible();

    // expect: '#dynamic-text' does not exist in the DOM again
    await expect(waitPage.dynamicElement).toHaveCount(0);
    // expect: '#update-text' reads exactly 'Initial text...' again
    await expect(waitPage.updateTextSpan).toHaveText('Initial text...');
    // expect: '#disappearing-element' does not exist in the DOM (its own fresh-load default)
    await expect(waitPage.disappearingElement).toHaveCount(0);
  });
});
