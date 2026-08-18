// spec: specs/input.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InputPage } from '../../pages/InputPage';

test.describe('Input - Editable Field Behavior', () => {
  test('Typing into the empty full-name field sets its value exactly', async ({ page }) => {
    const inputPage = new InputPage(page);

    // 1. Navigate to '/components/input' and fill '[data-testid="full-name"]' with 'Test Tester'
    await inputPage.gotoInput();
    await inputPage.fullNameField.fill('Test Tester');

    // expect: '[data-testid="full-name"]' value equals 'Test Tester' exactly
    await expect(inputPage.fullNameField).toHaveValue('Test Tester');
  });

  test("Appending text before the pre-filled append-text field's default value", async ({ page }) => {
    const inputPage = new InputPage(page);

    // 1. Navigate to '/components/input', read the current value of '[data-testid="append-text"]'
    // (its live default, expected 'TestingBeLike'), then fill the field with the literal string
    // 'Prepended' immediately followed by that captured default value, and press Tab
    await inputPage.gotoInput();
    const defaultValue = await inputPage.appendTextField.inputValue();
    await inputPage.appendTextField.fill(`Prepended${defaultValue}`);
    await page.keyboard.press('Tab');

    // expect: '[data-testid="append-text"]' value equals 'Prepended' + the captured default value
    // (read dynamically via inputValue(), not hardcoded, so the test remains resilient if the
    // default text ever changes)
    await expect(inputPage.appendTextField).toHaveValue(`Prepended${defaultValue}`);
  });

  test('Reading and overwriting the pre-filled inside-text field', async ({ page }) => {
    const inputPage = new InputPage(page);

    // 1. Navigate to '/components/input' and read '[data-testid="inside-text"]'
    await inputPage.gotoInput();

    // expect: The field is visible and its initial value is a non-empty string (expected 'HelloWorld123')
    await expect(inputPage.insideTextField).toBeVisible();
    await expect(inputPage.insideTextField).toHaveValue('HelloWorld123');

    // 2. Fill the field with a new value 'Overwritten123'
    await inputPage.insideTextField.fill('Overwritten123');

    // expect: '[data-testid="inside-text"]' value equals 'Overwritten123', confirming the pre-filled field is fully editable
    await expect(inputPage.insideTextField).toHaveValue('Overwritten123');
  });

  test('Whitespace-only input satisfies the required constraint on a text field', async ({ page }) => {
    const inputPage = new InputPage(page);

    // 1. Navigate to '/components/input' and set '[data-testid="full-name"]' to a whitespace-only
    // value (e.g. three space characters), then read its validity state
    await inputPage.gotoInput();
    await inputPage.fullNameField.fill('   ');

    // expect: The field's validity.valueMissing equals false (native HTML5 `required` does not treat
    // whitespace-only content as empty) — this documents a known native-browser edge case (mirrors the
    // same behavior already confirmed on the Form component's text fields), not an app defect
    const validity = await inputPage.getValidity(inputPage.fullNameField);
    expect(validity.valueMissing).toBe(false);
  });
});

test.describe('Input - Clear Behavior', () => {
  test('Selecting and clearing the pre-filled clear-text field empties it', async ({ page }) => {
    const inputPage = new InputPage(page);

    // 1. Navigate to '/components/input' and confirm '[data-testid="clear-text"]' is not empty
    // (expected default 'DefaultText')
    await inputPage.gotoInput();

    // expect: '[data-testid="clear-text"]' value does not equal ''
    await expect(inputPage.clearTextField).not.toHaveValue('');

    // 2. Select all and clear the field's content
    await inputPage.clearViaKeyboard(inputPage.clearTextField);

    // expect: '[data-testid="clear-text"]' value equals '' after clearing
    await expect(inputPage.clearTextField).toHaveValue('');
  });
});
