// spec: specs/input.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Input - Initial Load and Default State', () => {
  test('Input page loads with all six fields showing correct default values and attributes', async ({ page }) => {
    // 1. Navigate to '/components/input' on a fresh browser context
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const response = await page.goto('/components/input');

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Input' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Input', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect each of the six fields' default value and relevant attributes
    const fullName = page.locator('[data-testid="full-name"]');
    const appendText = page.locator('[data-testid="append-text"]');
    const insideText = page.locator('[data-testid="inside-text"]');
    const clearText = page.locator('[data-testid="clear-text"]');
    const disabledField = page.locator('[data-testid="disabled-field"]');
    const readonlyField = page.locator('[data-testid="readonly-field"]');

    // expect: '[data-testid="full-name"]' value equals '' and placeholder equals 'Enter first & last name'
    await expect(fullName).toHaveValue('');
    await expect(fullName).toHaveAttribute('placeholder', 'Enter first & last name');

    // expect: '[data-testid="append-text"]' value equals 'TestingBeLike'
    await expect(appendText).toHaveValue('TestingBeLike');

    // expect: '[data-testid="inside-text"]' value equals 'HelloWorld123'
    await expect(insideText).toHaveValue('HelloWorld123');

    // expect: '[data-testid="clear-text"]' value equals 'DefaultText' and placeholder equals 'Enter'
    await expect(clearText).toHaveValue('DefaultText');
    await expect(clearText).toHaveAttribute('placeholder', 'Enter');

    // expect: '[data-testid="disabled-field"]' value equals 'Disabled text' and the field is disabled
    await expect(disabledField).toHaveValue('Disabled text');
    await expect(disabledField).toBeDisabled();

    // expect: '[data-testid="readonly-field"]' value equals 'This text is readonly' and has the readonly attribute
    await expect(readonlyField).toHaveValue('This text is readonly');
    await expect(readonlyField).toHaveAttribute('readonly', '');

    // expect: All six fields individually have the required HTML attribute present
    await expect(fullName).toHaveAttribute('required', '');
    await expect(appendText).toHaveAttribute('required', '');
    await expect(insideText).toHaveAttribute('required', '');
    await expect(clearText).toHaveAttribute('required', '');
    await expect(disabledField).toHaveAttribute('required', '');
    await expect(readonlyField).toHaveAttribute('required', '');
  });

  test('Tab order proceeds through the editable fields in document order', async ({ page }) => {
    // 1. Navigate to '/components/input', click into '[data-testid="full-name"]', then press Tab
    await page.goto('/components/input');

    const fullName = page.locator('[data-testid="full-name"]');
    const appendText = page.locator('[data-testid="append-text"]');
    const insideText = page.locator('[data-testid="inside-text"]');

    await fullName.click();
    await page.keyboard.press('Tab');

    // expect: '[data-testid="append-text"]' becomes focused
    await expect(appendText).toBeFocused();

    // 2. Press Tab again
    await page.keyboard.press('Tab');

    // expect: '[data-testid="inside-text"]' becomes focused
    await expect(insideText).toBeFocused();
  });
});
