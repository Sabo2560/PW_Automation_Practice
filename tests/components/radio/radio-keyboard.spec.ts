// spec: specs/radio.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { RadioPage } from '../../pages/RadioPage';

test.describe('Radio - Keyboard Interaction', () => {
  let radioPage: RadioPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioPage(page);
    await radioPage.gotoRadio();
  });

  test('ArrowDown within a focused native radio group moves both focus and the checked state to the next radio in that group', async ({
    page,
    browserName,
  }) => {
    // WebKit does not move keyboard focus onto radio/checkbox/button-type inputs on a mouse click
    // (matches real Safari's default behavior, where only text-like inputs are focused by click unless
    // "Full Keyboard Access" is enabled). Confirmed live: after radioPage.answerYes.click() on webkit,
    // document.activeElement is <body>, not the 'Yes' radio, so the subsequent ArrowDown has no focused
    // radio group to act on and never cycles the checked state. This is a genuine WebKit engine difference,
    // not an app bug, so we skip the check here while keeping it strict on chromium/firefox.
    test.skip(browserName === 'webkit', 'WebKit does not focus radio inputs on click, so ArrowDown has no focused element to cycle — see comment above.');

    // 1. Click the 'Yes' radio in the answer-radio group to focus and check it, then press 'ArrowDown'
    await radioPage.answerYes.click();

    // expect: Before ArrowDown: 'Yes' is checked and 'No' is not
    await radioPage.expectOnlyChecked(radioPage.answerYes, [radioPage.answerNo]);

    await page.keyboard.press('ArrowDown');

    // expect: After ArrowDown: 'No' becomes checked and 'Yes' becomes unchecked — confirming standard native
    // browser radio-group keyboard-cycling behavior
    await radioPage.expectOnlyChecked(radioPage.answerNo, [radioPage.answerYes]);
  });

  test("ArrowDown has no effect on the mismatched-name 'Find the bug' pair, since each option is its own isolated single-member group", async ({
    page,
  }) => {
    // 1. Click '#nobug' to focus and check it, then press 'ArrowDown'
    await radioPage.findBugOptionA.click();
    await page.keyboard.press('ArrowDown');

    // expect: '#nobug' remains checked=true after ArrowDown
    // expect: '#bug' remains checked=false after ArrowDown — confirming ArrowDown does not move the checked state
    // across to '#bug', since the two inputs do not share a 'name' and are therefore not treated as a single
    // native keyboard-navigable group at all
    await expect(radioPage.findBugOptionA).toBeChecked();
    await expect(radioPage.findBugOptionB).not.toBeChecked();
  });
});
