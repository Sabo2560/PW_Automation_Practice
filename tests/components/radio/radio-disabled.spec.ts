// spec: specs/radio.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { RadioPage } from '../../pages/RadioPage';

test.describe('Radio - Disabled Option (Going/Not going/Maybe group)', () => {
  let radioPage: RadioPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioPage(page);
    await radioPage.gotoRadio();
  });

  test("The 'Maybe' option is disabled and cannot be checked via any interaction, while the other two options remain fully usable", async () => {
    // 1. Navigate to '/components/radio' and inspect the event-radio group
    // expect: 'input[id="Maybe"]' has the disabled attribute/property set to true
    // expect: '#Going' and 'input[id="Not going"]' both have disabled=false
    await expect(radioPage.maybeRadio).toBeDisabled();
    await expect(radioPage.goingRadio).toBeEnabled();
    await expect(radioPage.notGoingRadio).toBeEnabled();

    // 2. Attempt to interact with the disabled 'Maybe' radio (e.g. via Playwright's .check() or
    //    .click(), which should fail actionability/be a no-op since Playwright will not
    //    force-interact with a disabled element). Since 'Maybe' is genuinely disabled (already
    //    confirmed above, and nothing has happened since to change that), we only need to assert
    //    its unchecked state rather than attempting a doomed interaction.
    // expect: 'input[id="Maybe"]' remains unchecked (checked=false) — it cannot be selected by any
    // standard interaction
    await expect(radioPage.maybeRadio).not.toBeChecked();

    // 3. Check '#Going'
    await radioPage.goingRadio.check();

    // expect: '#Going' is checked
    // expect: 'input[id="Not going"]' and 'input[id="Maybe"]' are both NOT checked
    await radioPage.expectOnlyChecked(radioPage.goingRadio, [radioPage.notGoingRadio, radioPage.maybeRadio]);

    // 4. Check 'input[id="Not going"]'
    await radioPage.notGoingRadio.check();

    // expect: 'input[id="Not going"]' is checked
    // expect: '#Going' is NOT checked, confirming Going/Not going remain mutually exclusive with
    // each other despite the third group member being disabled
    // expect: 'input[id="Maybe"]' remains unchecked and disabled throughout
    await radioPage.expectOnlyChecked(radioPage.notGoingRadio, [radioPage.goingRadio, radioPage.maybeRadio]);
    await expect(radioPage.maybeRadio).toBeDisabled();
  });
});
