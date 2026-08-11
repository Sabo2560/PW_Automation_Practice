import { test, expect } from '@playwright/test';

test.describe('Multiselect component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/multiselect');
  });

  test('should select at least two items and display them as chips', async ({ page }) => {
    const form1 = page.getByTestId('multiselect-form-1');
    await form1.getByRole('textbox', { name: 'Select' }).click();
    await form1.getByText('Option 2', { exact: true }).click();
    await form1.getByRole('textbox', { name: 'Select' }).click();
    await form1.getByText('Option 4', { exact: true }).click();

    await expect(form1.getByText('Option 2', { exact: true })).toBeVisible();
    await expect(form1.getByText('Option 4', { exact: true })).toBeVisible();
  });

  test('should select all options and show no further options message', async ({ page }) => {
    const form2 = page.getByTestId('multiselect-form-2');
    await form2.getByRole('textbox', { name: 'Select' }).click();

    // Select every remaining option until none are left. Capped at a
    // sane max so a selector bug fails fast with a clear error instead
    // of hanging silently until the test-level timeout kicks in.
    const MAX_OPTIONS = 20;
    for (let i = 0; i < MAX_OPTIONS; i++) {
      const remaining = await form2.locator('li').count();
      if (remaining === 0) break;
      await form2.locator('li').first().click();
    }

    await expect(page.getByText('No Options Available')).toBeVisible();
  });

  test('should remove all pre-selected items and show no selections', async ({ page }) => {
    const form3 = page.getByTestId('multiselect-form-3');

    const MAX_CHIPS = 20;
    for (let i = 0; i < MAX_CHIPS; i++) {
      const chipCount = await form3.locator('.icon_cancel').count();
      if (chipCount === 0) break;
      await form3.locator('.icon_cancel').first().click();
    }

    await expect(form3.locator('.chip')).toHaveCount(0);
  });
});