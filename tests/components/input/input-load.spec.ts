// spec: specs/input.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { InputPage } from '../../pages/InputPage';

test.describe('Input - Initial Load and Default State', () => {
  test('Input page loads with all six fields showing correct default values and attributes', async ({ page }) => {
    const inputPage = new InputPage(page);

    // 1. Navigate to '/components/input' on a fresh browser context
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const response = await inputPage.gotoInput();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Input' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Input', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect each of the six fields' default value and relevant attributes
    // expect: '[data-testid="full-name"]' value equals '' and placeholder equals 'Enter first & last name'
    await expect(inputPage.fullNameField).toHaveValue('');
    await expect(inputPage.fullNameField).toHaveAttribute('placeholder', 'Enter first & last name');

    // expect: '[data-testid="append-text"]' value equals 'TestingBeLike'
    await expect(inputPage.appendTextField).toHaveValue('TestingBeLike');

    // expect: '[data-testid="inside-text"]' value equals 'HelloWorld123'
    await expect(inputPage.insideTextField).toHaveValue('HelloWorld123');

    // expect: '[data-testid="clear-text"]' value equals 'DefaultText' and placeholder equals 'Enter'
    await expect(inputPage.clearTextField).toHaveValue('DefaultText');
    await expect(inputPage.clearTextField).toHaveAttribute('placeholder', 'Enter');

    // expect: '[data-testid="disabled-field"]' value equals 'Disabled text' and the field is disabled
    await expect(inputPage.disabledField).toHaveValue('Disabled text');
    await expect(inputPage.disabledField).toBeDisabled();

    // expect: '[data-testid="readonly-field"]' value equals 'This text is readonly' and has the readonly attribute
    await expect(inputPage.readonlyField).toHaveValue('This text is readonly');
    await expect(inputPage.readonlyField).toHaveAttribute('readonly', '');

    // expect: All six fields individually have the required HTML attribute present
    await inputPage.expectAllFieldsRequired();
  });

  test('Tab order proceeds through the editable fields in document order', async ({ page }) => {
    const inputPage = new InputPage(page);

    // 1. Navigate to '/components/input', click into '[data-testid="full-name"]', then press Tab
    await inputPage.gotoInput();

    await inputPage.fullNameField.click();
    await page.keyboard.press('Tab');

    // expect: '[data-testid="append-text"]' becomes focused
    await expect(inputPage.appendTextField).toBeFocused();

    // 2. Press Tab again
    await page.keyboard.press('Tab');

    // expect: '[data-testid="inside-text"]' becomes focused
    await expect(inputPage.insideTextField).toBeFocused();
  });
});
