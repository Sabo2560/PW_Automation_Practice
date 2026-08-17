// spec: specs/input.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Input - Disabled and Readonly States', () => {
  test('Disabled field cannot be focused, clicked into, or edited', async ({ page }) => {
    // 1. Navigate to '/components/input' and inspect '[data-testid="disabled-field"]'
    await page.goto('/components/input');
    const disabledField = page.getByTestId('disabled-field');

    // expect: The field is disabled (use Playwright's toBeDisabled() assertion)
    await expect(disabledField).toBeDisabled();

    // expect: The field's value remains 'Disabled text' (unchanged, untouched default)
    await expect(disabledField).toHaveValue('Disabled text');

    // expect: The field is excluded from keyboard tab order (attempting to reach it via Tab
    // from the preceding field, clear-text, does not focus it — disabled fields are always
    // skipped in tab order per browser spec)
    const clearText = page.getByTestId('clear-text');
    const readonlyField = page.getByTestId('readonly-field');
    await clearText.click();
    await page.keyboard.press('Tab');
    await expect(disabledField).not.toBeFocused();
    await expect(readonlyField).toBeFocused();
  });

  test('Readonly field is focusable but its value cannot be changed via keyboard input', async ({ page }) => {
    // 1. Navigate to '/components/input', click '[data-testid="readonly-field"]', and attempt to type additional text into it
    await page.goto('/components/input');
    const readonlyField = page.getByTestId('readonly-field');
    await readonlyField.click();
    await readonlyField.pressSequentially('extra text');

    // expect: '[data-testid="readonly-field"]' has the readonly HTML attribute
    await expect(readonlyField).toHaveAttribute('readonly', '');

    // expect: The field's value remains exactly 'This text is readonly' (typed text is not appended/inserted), since readonly inputs accept focus but reject value mutation via user input
    await expect(readonlyField).toHaveValue('This text is readonly');
  });
});
