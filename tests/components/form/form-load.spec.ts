// spec: specs/form.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FormPage } from '../../pages/FormPage';

test.describe('Form - Initial Load and Default State', () => {
  test('Form page loads with correct default state', async ({ page }) => {
    const form = new FormPage(page);

    // 1. Navigate to '/components/form' on a fresh browser context
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const response = await page.goto('/components/form');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Form', level: 1 })).toBeVisible();
    await expect(page.getByText('Select one of the given options')).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect the dropdown field '[data-testid="form-dropdown"]'
    await expect(form.dropdown).toHaveValue('');
    const selectedOptionText = await form.dropdown.locator('option:checked').textContent();
    expect(selectedOptionText).toBe('Select an option');

    const options = form.dropdown.locator('option');
    await expect(options).toHaveCount(4);
    await expect(options).toHaveText(['Select an option', 'Software', 'Hardware', 'Other']);
    const optionValues = await options.evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value));
    expect(optionValues).toEqual(['', 'Software', 'Hardware', 'Other']);

    await expect(form.dropdown).toHaveAttribute('required', '');

    // 3. Inspect the Name, Email, and Message fields
    await expect(form.nameInput).toHaveValue('');
    await expect(form.nameInput).toBeVisible();
    await expect(page.getByText('Name:')).toBeVisible();

    await expect(form.emailInput).toHaveValue('');
    await expect(form.emailInput).toBeVisible();
    await expect(page.getByText('Email:')).toBeVisible();

    await expect(form.messageInput).toHaveValue('');
    await expect(form.messageInput).toBeVisible();
    await expect(page.getByText('Message:')).toBeVisible();

    // 4. Inspect the radio group and checkbox
    await expect(form.radioYes).not.toBeChecked();
    await expect(form.radioNo).not.toBeChecked();
    await expect(form.checkbox).not.toBeChecked();
    await expect(page.getByText('Do you like this exercise?')).toBeVisible();
    await expect(page.getByText('I agree to the Terms and Conditions')).toBeVisible();
    await expect(form.termsLink).toBeVisible();

    // 5. Inspect the Submit button and overall page state
    await expect(form.submitBtn).toBeVisible();
    await expect(form.submitBtn).toBeEnabled();
    await expect(form.submitBtn).toHaveText('Submit');
    await expect(form.successPanel).toHaveCount(0);
  });

  test("'Terms and Conditions' link navigates to the correct page in a new tab", async ({ page, context }) => {
    const form = new FormPage(page);
    await form.gotoForm();

    // 1. Navigate to '/components/form' and inspect the 'Terms and Conditions' link without clicking
    await expect(form.termsLink).toHaveAttribute('href', '/testing-terms-conditions');
    await expect(form.termsLink).toHaveAttribute('target', '_blank');

    // 2. Click the 'Terms and Conditions' link
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      form.termsLink.click(),
    ]);
    await newPage.waitForLoadState();

    await expect(page).toHaveURL(/\/components\/form$/);
    await expect(newPage).toHaveURL(/\/testing-terms-conditions$/);
    await expect(newPage.getByRole('heading', { name: 'Testing terms & conditions', level: 1 })).toBeVisible();
  });
});
