import { test, expect } from '@playwright/test';

test.describe('Input component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/input');
  });

  test('should type text into full name field', async ({ page }) => {
    const fullName = page.getByTestId('full-name');
    await fullName.fill('Test Tester');
    await expect(fullName).toHaveValue('Test Tester');
  });

  test('should append typed text before the default value', async ({ page }) => {
    const appendField = page.getByTestId('append-text');

    // The field ships with default text already in it (e.g. "BeLike").
    // Read it first instead of hardcoding it, so this test doesn't break
    // if the default value ever changes on the page.
    const defaultValue = await appendField.inputValue();

    await appendField.fill('Testing' + defaultValue);
    await appendField.press('Tab');

    await expect(appendField).toHaveValue('Testing' + defaultValue);
  });

  test('should read text inside the text box', async ({ page }) => {
    const insideText = page.getByTestId('inside-text');
    await expect(insideText).toBeVisible();
    const value = await insideText.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should let the user select and clear the pre-filled text field', async ({ page }) => {
    const clearField = page.getByTestId('clear-text');

    // Field loads with default text already in it — the "clear" exercise
    // is just about the user being able to select-all and delete it,
    // there's no separate clear button on the page.
    await expect(clearField).not.toHaveValue('');
    await clearField.fill('');
    await expect(clearField).toHaveValue('');
  });

  test('should confirm disabled field is not editable', async ({ page }) => {
    const disabledField = page.getByTestId('disabled-field');
    await expect(disabledField).toBeDisabled();
  });

  test('should confirm readonly field cannot be edited', async ({ page }) => {
    const readonlyField = page.getByTestId('readonly-field');
    await expect(readonlyField).toHaveAttribute('readonly', '');
    await readonlyField.click();
    await page.keyboard.type('should not appear');
    const value = await readonlyField.inputValue();
    expect(value).not.toContain('should not appear');
  });

  test('should support tab navigation across input fields', async ({ page }) => {
    await page.getByTestId('full-name').click();
    await page.getByTestId('full-name').press('Tab');
    await expect(page.getByTestId('append-text')).toBeFocused();
    await page.getByTestId('append-text').press('Tab');
    await expect(page.getByTestId('inside-text')).toBeFocused();
  });
});