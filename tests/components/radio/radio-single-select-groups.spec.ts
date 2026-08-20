// spec: specs/radio.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { RadioPage } from '../../pages/RadioPage';

test.describe('Radio - Mutual Exclusivity (answer-radio and one-radio groups)', () => {
  let radioPage: RadioPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioPage(page);
    await radioPage.gotoRadio();
  });

  test("'Select any one' group (answer-radio) allows only one option checked at a time, in both switch directions", async () => {
    // 1. Check the 'Yes' radio in the 'answer-radio' group (getByTestId('answer-radio').first())
    await radioPage.answerYes.check();

    // expect: 'Yes' radio is checked
    // expect: 'No' radio (getByTestId('answer-radio').last()) is NOT checked
    await radioPage.expectOnlyChecked(radioPage.answerYes, [radioPage.answerNo]);

    // 2. Now check the 'No' radio in the same group
    await radioPage.answerNo.check();

    // expect: 'No' radio is checked
    // expect: 'Yes' radio is now NOT checked, confirming the switch reversed cleanly with no state where both or neither is checked
    await radioPage.expectOnlyChecked(radioPage.answerNo, [radioPage.answerYes]);
  });

  test("'Cofirm you can select only one radio button' group (one-radio) independently enforces the same mutual exclusivity", async () => {
    // 1. Check the 'No' radio in the 'one-radio' group (getByTestId('one-radio').last()) first, deliberately testing the reverse order from the answer-radio scenario
    await radioPage.oneNo.check();

    // expect: 'No' radio is checked
    // expect: 'Yes' radio (getByTestId('one-radio').first()) is NOT checked
    await radioPage.expectOnlyChecked(radioPage.oneNo, [radioPage.oneYes]);

    // 2. Now check the 'Yes' radio in the same group
    await radioPage.oneYes.check();

    // expect: 'Yes' radio is checked
    // expect: 'No' radio is now NOT checked
    await radioPage.expectOnlyChecked(radioPage.oneYes, [radioPage.oneNo]);
  });

  test("Checking a radio in answer-radio has zero effect on one-radio's state, despite both groups sharing duplicate 'Yes'/'No' element ids", async () => {
    // 1. Record one-radio's baseline state (both unchecked)
    await expect(radioPage.oneYes).not.toBeChecked();
    await expect(radioPage.oneNo).not.toBeChecked();

    // Check 'Yes' in the answer-radio group only, scoped via getByTestId('answer-radio').first()
    await radioPage.answerYes.check();

    // expect: answer-radio's 'Yes' is checked and its 'No' is unchecked
    await radioPage.expectOnlyChecked(radioPage.answerYes, [radioPage.answerNo]);

    // expect: one-radio's 'Yes' and 'No' (getByTestId('one-radio')) both remain unchecked, exactly matching the
    // pre-interaction baseline — confirming the two groups are fully independent in application state despite
    // their underlying elements sharing the literal ids 'Yes'/'No' in the raw DOM (a real, confirmed duplicate-id
    // defect that must not be conflated with an actual state-sharing bug)
    await expect(radioPage.oneYes).not.toBeChecked();
    await expect(radioPage.oneNo).not.toBeChecked();
  });
});
