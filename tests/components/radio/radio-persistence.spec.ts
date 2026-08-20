// spec: specs/radio.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { RadioPage } from '../../pages/RadioPage';

test.describe('Radio - Reload Persistence', () => {
  let radioPage: RadioPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioPage(page);
    await radioPage.gotoRadio();
  });

  test('No selection state persists across a page reload; every group/checkbox resets to its documented fresh-load default', async ({
    page,
  }) => {
    // 1. Change every control away from its default: check 'Yes' in answer-radio, check 'No' in
    // one-radio, check both #nobug and #bug, check 'Foo' in foobar-radio (switching away from the
    // default Bar), check 'Going' in event-radio, uncheck 'Remember me', check the T&C checkbox
    await radioPage.answerYes.check();
    await radioPage.oneNo.check();
    await radioPage.findBugOptionA.check();
    await radioPage.findBugOptionB.check();
    await radioPage.fooRadio.check();
    await radioPage.goingRadio.check();
    await radioPage.rememberCheckbox.uncheck();
    await radioPage.termsCheckbox.check();

    // expect: Before reload: all seven exercises reflect the just-performed non-default interactions
    await radioPage.expectOnlyChecked(radioPage.answerYes, [radioPage.answerNo]);
    await radioPage.expectOnlyChecked(radioPage.oneNo, [radioPage.oneYes]);
    await expect(radioPage.findBugOptionA).toBeChecked();
    await expect(radioPage.findBugOptionB).toBeChecked();
    await radioPage.expectOnlyChecked(radioPage.fooRadio, [radioPage.barRadio]);
    await radioPage.expectOnlyChecked(radioPage.goingRadio, [radioPage.notGoingRadio, radioPage.maybeRadio]);
    await expect(radioPage.rememberCheckbox).not.toBeChecked();
    await expect(radioPage.termsCheckbox).toBeChecked();

    // 2. Reload the page
    await page.reload();
    await expect(radioPage.answerYes).toBeVisible();

    // expect: every control reverts to its documented fresh-load default (answer-radio/one-radio/find-the-bug
    // all unchecked; foobar-radio Bar checked again — a static per-load render, not persisted prior state;
    // event-radio all unchecked with Maybe still disabled; Remember-me checked again; T&C unchecked again) —
    // confirming no localStorage/sessionStorage/URL state is involved anywhere on this page
    await radioPage.expectDefaultState();
  });
});
