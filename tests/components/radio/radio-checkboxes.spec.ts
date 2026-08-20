// spec: specs/radio.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { RadioPage } from '../../pages/RadioPage';

test.describe("Radio - Checkboxes ('Remember me' and 'Accept the T&C')", () => {
  let radioPage: RadioPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioPage(page);
    await radioPage.gotoRadio();
  });

  test("The 'Remember me' checkbox is checked by default and toggles cleanly in both directions", async () => {
    // 1. Inspect '[data-testid="checkbox-checked"]' without interacting
    // expect: The checkbox is checked by default
    await expect(radioPage.rememberCheckbox).toBeChecked();

    // 2. Uncheck it, then check it again
    await radioPage.rememberCheckbox.uncheck();

    // expect: After unchecking: checkbox is NOT checked
    await expect(radioPage.rememberCheckbox).not.toBeChecked();

    await radioPage.rememberCheckbox.check();

    // expect: After re-checking: checkbox IS checked again, confirming a full, clean round-trip
    await expect(radioPage.rememberCheckbox).toBeChecked();
  });

  test('The T&C checkbox is unchecked by default and toggles cleanly in both directions', async () => {
    // 1. Inspect '[data-testid="termsConditions-checkbox"]' without interacting
    // expect: The checkbox is NOT checked by default
    await expect(radioPage.termsCheckbox).not.toBeChecked();

    // 2. Check it, then uncheck it, then check it again
    await radioPage.termsCheckbox.check();

    // expect: After checking: checkbox IS checked
    await expect(radioPage.termsCheckbox).toBeChecked();

    await radioPage.termsCheckbox.uncheck();

    // expect: After unchecking: checkbox is NOT checked
    await expect(radioPage.termsCheckbox).not.toBeChecked();

    await radioPage.termsCheckbox.check();

    // expect: After the final check: checkbox IS checked again, confirming the full three-step round-trip works correctly with no stuck state
    await expect(radioPage.termsCheckbox).toBeChecked();
  });

  test("Clicking the nested 'Terms and Conditions' link does not toggle the T&C checkbox, but clicking the surrounding label text does", async () => {
    // 1. Confirm '[data-testid="termsConditions-checkbox"]' is unchecked, then click the 'Terms and Conditions' link
    //    (handling the resulting new-tab popup so the test doesn't hang) and close the new tab
    await expect(radioPage.termsCheckbox).not.toBeChecked();

    const popup = await radioPage.openTermsLinkInNewTab();
    await popup.close();

    // expect: Back on the original tab, '[data-testid="termsConditions-checkbox"]' is STILL unchecked immediately
    // after the link click — the anchor's own navigation activation behavior does not also toggle the checkbox
    await expect(radioPage.termsCheckbox).not.toBeChecked();

    // 2. On the same page (no reload), click on the label's plain text portion 'I agree to the' (not the link itself) —
    //    a small offset from the label's own left edge, well clear of the nested link, reliably lands on the plain-text node
    await radioPage.clickLabelText(radioPage.termsLabel);

    // expect: '[data-testid="termsConditions-checkbox"]' becomes checked=true, confirming clicking the non-link
    // portion of the label DOES toggle the checkbox as expected, in contrast to the link click in the prior step
    await expect(radioPage.termsCheckbox).toBeChecked();
  });

  test("The 'Terms and Conditions' link opens '/testing-terms-conditions' in a new tab without navigating the original page", async ({ page }) => {
    // 1. Record the current tab's URL, then click the 'Terms and Conditions' link and wait for the resulting popup
    const originalUrl = page.url();

    const popup = await radioPage.openTermsLinkInNewTab();

    // expect: A new tab/popup opens with URL exactly '/testing-terms-conditions'
    await expect(popup).toHaveURL(/\/testing-terms-conditions$/);

    // expect: The original tab's URL remains exactly '/components/radio', unchanged — confirming this is a genuine
    // new-tab navigation (target="_blank"), not an in-place redirect
    expect(page.url()).toBe(originalUrl);
    await expect(page).toHaveURL(/\/components\/radio$/);

    await popup.close();
  });
});
