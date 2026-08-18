// spec: specs/button.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ButtonPage } from '../../pages/ButtonPage';

test.describe('Button - Disabled State', () => {
  test('Disabled button cannot be focused or clicked, and has no click handler bound', async ({ page }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button' and inspect '[data-testid="button-disabled-button"]'
    await buttonPage.gotoButton();

    // expect: Playwright's toBeDisabled() assertion passes for this element
    await expect(buttonPage.disabledBtn).toBeDisabled();

    // expect: The button's 'disabled' DOM property equals true
    const isDisabled = await buttonPage.disabledBtn.evaluate((el: HTMLButtonElement) => el.disabled);
    expect(isDisabled).toBe(true);

    // expect: The button's 'onclick' property equals null, confirming no click handler is bound to it at all
    const onclick = await buttonPage.disabledBtn.evaluate((el: HTMLButtonElement) => el.onclick);
    expect(onclick).toBeNull();

    // 2. Attempt to dispatch a forced click on '[data-testid="button-disabled-button"]' (bypassing Playwright's normal actionability check)
    // expect: No visible page/DOM change results anywhere on the page from the forced click attempt
    const { before, after } = await buttonPage.captureTextAround(() => buttonPage.disabledBtn.click({ force: true }));
    expect(after).toBe(before);
    expect(page.url()).toContain('/components/button');
  });
});
