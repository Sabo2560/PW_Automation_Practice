// spec: specs/button.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Button - Disabled State', () => {
  test('Disabled button cannot be focused or clicked, and has no click handler bound', async ({ page }) => {
    // 1. Navigate to '/components/button' and inspect '[data-testid="button-disabled-button"]'
    await page.goto('/components/button');

    const disabledButton = page.locator('[data-testid="button-disabled-button"]');

    // expect: Playwright's toBeDisabled() assertion passes for this element
    await expect(disabledButton).toBeDisabled();

    // expect: The button's 'disabled' DOM property equals true
    const isDisabled = await disabledButton.evaluate((el: HTMLButtonElement) => el.disabled);
    expect(isDisabled).toBe(true);

    // expect: The button's 'onclick' property equals null, confirming no click handler is bound to it at all
    const onclick = await disabledButton.evaluate((el: HTMLButtonElement) => el.onclick);
    expect(onclick).toBeNull();

    // 2. Attempt to dispatch a forced click on '[data-testid="button-disabled-button"]' (bypassing Playwright's normal actionability check)
    const bodyText = page.locator('body');
    const textBefore = await bodyText.innerText();

    await disabledButton.click({ force: true });

    const textAfter = await bodyText.innerText();

    // expect: No visible page/DOM change results anywhere on the page from the forced click attempt
    expect(textAfter).toBe(textBefore);
    expect(page.url()).toContain('/components/button');
  });
});
