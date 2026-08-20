// spec: specs/radio.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { RadioPage } from '../../pages/RadioPage';

test.describe("Radio - 'Find the Bug' Exercise (Mismatched Name Attributes)", () => {
  let radioPage: RadioPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioPage(page);
    await radioPage.gotoRadio();
  });

  test("[BUG] Both options in the 'Find the bug' pair can end up checked simultaneously because they use different name attributes", async () => {
    // 1. Confirm via DOM inspection that '#nobug' has name='nobug' and '#bug' has name='bug'
    //    (different, non-matching name attributes) before interacting
    // expect: '#nobug' name attribute equals exactly 'nobug'
    // expect: '#bug' name attribute equals exactly 'bug' — confirming the two inputs do not share a common
    // 'name' and therefore cannot be a real mutually-exclusive native radio group
    await expect(radioPage.findBugOptionA).toHaveAttribute('name', 'nobug');
    await expect(radioPage.findBugOptionB).toHaveAttribute('name', 'bug');

    // 2. Check '#nobug' (the 'Yes'-labeled option), then check '#bug' (the 'No'-labeled option)
    await radioPage.findBugOptionA.check();
    await radioPage.findBugOptionB.check();

    // expect: '#nobug' is checked
    // expect: '#bug' is ALSO checked at the same time — both true simultaneously — reproducing the intentional
    // bug this exercise is designed to surface, since a correctly-implemented mutually-exclusive pair would have
    // unchecked '#nobug' the moment '#bug' was checked
    await expect(radioPage.findBugOptionA).toBeChecked();
    await expect(radioPage.findBugOptionB).toBeChecked();
  });

  test('Clicking an already-checked option in this pair a second time does not uncheck it (standard native single-radio behavior, a direct consequence of the same defect)', async () => {
    // 1. Check '#nobug' once, confirm it is checked, then click '#nobug' again (second click on the
    //    same, already-checked radio)
    await radioPage.findBugOptionA.check();
    await expect(radioPage.findBugOptionA).toBeChecked();

    await radioPage.findBugOptionA.click();

    // expect: '#nobug' remains checked=true after the second click (not toggled off) — this is expected native
    // <input type="radio"> behavior, distinct from a checkbox, and demonstrates that each of '#nobug'/'#bug'
    // functions as its own isolated one-member group rather than a real either/or pair
    await expect(radioPage.findBugOptionA).toBeChecked();
  });
});
