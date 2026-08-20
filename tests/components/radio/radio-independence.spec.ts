// spec: specs/radio.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { RadioPage } from '../../pages/RadioPage';

test.describe('Radio - Cross-Group Independence', () => {
  let radioPage: RadioPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioPage(page);
    await radioPage.gotoRadio();
  });

  test("Interacting with any one group/checkbox produces zero observable change in the other six exercises' state", async () => {
    // 1. Record baseline state for all seven exercises
    // expect: Baseline recorded matches the documented defaults exactly for all 7 exercises
    await radioPage.expectDefaultState();

    // 2. Interact broadly with ONLY the answer-radio and foobar-radio groups: check 'No' in answer-radio, and check 'Foo' in foobar-radio
    await radioPage.answerNo.check();
    await radioPage.fooRadio.check();

    // expect: answer-radio: 'No' is checked, 'Yes' is not
    await radioPage.expectOnlyChecked(radioPage.answerNo, [radioPage.answerYes]);
    // expect: foobar-radio: 'Foo' is checked, 'Bar' is not
    await radioPage.expectOnlyChecked(radioPage.fooRadio, [radioPage.barRadio]);

    // 3. Re-read the state of the remaining five exercises (one-radio, find-the-bug, event-radio, checkbox-checked, termsConditions-checkbox) without navigating away
    // expect: one-radio: both radios still unchecked (unchanged from baseline)
    await expect(radioPage.oneYes).not.toBeChecked();
    await expect(radioPage.oneNo).not.toBeChecked();
    // expect: find-the-bug: both '#nobug' and '#bug' still unchecked (unchanged)
    await expect(radioPage.findBugOptionA).not.toBeChecked();
    await expect(radioPage.findBugOptionB).not.toBeChecked();
    // expect: event-radio: all three radios still unchecked and 'Maybe' still disabled (unchanged)
    await expect(radioPage.goingRadio).not.toBeChecked();
    await expect(radioPage.notGoingRadio).not.toBeChecked();
    await expect(radioPage.maybeRadio).not.toBeChecked();
    await expect(radioPage.maybeRadio).toBeDisabled();
    // expect: checkbox-checked: still checked=true (unchanged)
    await expect(radioPage.rememberCheckbox).toBeChecked();
    // expect: termsConditions-checkbox: still checked=false (unchanged) — confirming zero cross-contamination
    // from the answer-radio/foobar-radio interactions
    await expect(radioPage.termsCheckbox).not.toBeChecked();
  });

  test('No API/network requests fire as a result of any radio/checkbox interaction on this page (purely client-side component)', async () => {
    // 1. Navigate to '/components/radio', begin recording network requests, then interact broadly across all
    // seven exercises (check/uncheck radios in every group, trigger the find-the-bug double-check, toggle both checkboxes)
    const apiRequests = radioPage.trackApiRequests('/components/radio');

    // check/uncheck radios in every group
    await radioPage.answerYes.check();
    await radioPage.answerNo.check();
    await radioPage.oneYes.check();
    await radioPage.oneNo.check();

    // trigger the find-the-bug double-check
    await radioPage.findBugOptionA.check();
    await radioPage.findBugOptionB.check();

    await radioPage.fooRadio.check();
    await radioPage.barRadio.check();
    await radioPage.goingRadio.check();
    await radioPage.notGoingRadio.check();

    // toggle both checkboxes
    await radioPage.rememberCheckbox.uncheck();
    await radioPage.rememberCheckbox.check();
    await radioPage.termsCheckbox.check();
    await radioPage.termsCheckbox.uncheck();

    // expect: No XHR/fetch network request specific to any radio/checkbox action is observed (only the
    // pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every
    // other component page in this suite) — confirming this plan requires no API-level test coverage
    expect(apiRequests).toEqual([]);
  });
});
