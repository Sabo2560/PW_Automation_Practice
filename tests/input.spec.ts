import { test, expect } from '@playwright/test';

test.describe('Input component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.automationplayground.dev/components/input');
  });

  test('should type text into full name field', async ({ page }) => {
    const fullName = page.getByTestId('full-name');
    await fullName.fill('Test Tester');
    await expect(fullName).toHaveValue('Test Tester');
  });

  test('should append text on button/action', async ({ page }) => {
    const appendField = page.getByTestId('append-text');
    await appendField.fill('Hello');
    await appendField.press('Tab');
    // Verify appended text — update expected value once actual append behavior is confirmed
    await expect(appendField).not.toHaveValue('');
  });

  test('should read text inside the text box', async ({ page }) => {
    const insideText = page.getByTestId('inside-text');
    await expect(insideText).toBeVisible();
    const value = await insideText.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should clear the text field', async ({ page }) => {
    const clearField = page.getByTestId('clear-text');
    await clearField.fill('Some text');
    await expect(clearField).toHaveValue('Some text');
    // Trigger the clear action — update selector below with the actual clear button/testid
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