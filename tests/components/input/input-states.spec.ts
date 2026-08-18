// spec: specs/input.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InputPage } from '../../pages/InputPage';

test.describe('Input - Disabled and Readonly States', () => {
  test('Disabled field cannot be focused, clicked into, or edited', async ({ page }) => {
    const inputPage = new InputPage(page);

    // 1. Navigate to '/components/input' and inspect '[data-testid="disabled-field"]'
    await inputPage.gotoInput();

    // expect: The field is disabled (use Playwright's toBeDisabled() assertion)
    await expect(inputPage.disabledField).toBeDisabled();

    // expect: The field's value remains 'Disabled text' (unchanged, untouched default)
    await expect(inputPage.disabledField).toHaveValue('Disabled text');

    // expect: The field is excluded from keyboard tab order (attempting to reach it via Tab
    // from the preceding field, clear-text, does not focus it — disabled fields are always
    // skipped in tab order per browser spec)
    await inputPage.clearTextField.click();
    await page.keyboard.press('Tab');
    await expect(inputPage.disabledField).not.toBeFocused();
    await expect(inputPage.readonlyField).toBeFocused();
  });

  test('Readonly field is focusable but its value cannot be changed via keyboard input', async ({ page }) => {
    const inputPage = new InputPage(page);

    // 1. Navigate to '/components/input', click '[data-testid="readonly-field"]', and attempt to type additional text into it
    await inputPage.gotoInput();
    await inputPage.readonlyField.click();
    await inputPage.readonlyField.pressSequentially('extra text');

    // expect: '[data-testid="readonly-field"]' has the readonly HTML attribute
    await expect(inputPage.readonlyField).toHaveAttribute('readonly', '');

    // expect: The field's value remains exactly 'This text is readonly' (typed text is not appended/inserted), since readonly inputs accept focus but reject value mutation via user input
    await expect(inputPage.readonlyField).toHaveValue('This text is readonly');
  });
});
