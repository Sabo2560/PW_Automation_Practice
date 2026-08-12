import { test, expect } from '@playwright/test';

test.describe('Alert component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/alert');
  });

  test('should accept a simple browser alert', async ({ page }) => {
    // Native browser alert — must register the dialog handler BEFORE clicking,
    // otherwise Playwright auto-dismisses it and the click hangs.
    // We capture the dialog's type here and assert on it in the main test
    // body afterward — an expect() that fails inside this callback won't
    // reliably fail the test the normal way.
    let dialogType = '';
    page.once('dialog', async (dialog) => {
      dialogType = dialog.type();
      await dialog.accept();
    });
    await page.getByTestId('button-simple-alert').click();

    expect(dialogType).toBe('alert');
  });

  test('should dismiss a confirm alert and read its text', async ({ page }) => {
    // "print the alert text" here just means capturing the dialog's message
    // (e.g. to console) — nothing is displayed on the page after dismissing.
    let dialogMessage = '';
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await page.getByTestId('button-confirm-alert').click();

    expect(dialogMessage).toBe('Are you happy with Automation Playground?');
  });

  test('should type a name into a prompt alert and display it', async ({ page }) => {
    const nameToEnter = 'Saad Tested';
    let dialogType = '';
    page.once('dialog', async (dialog) => {
      dialogType = dialog.type();
      await dialog.accept(nameToEnter);
    });
    await page.getByTestId('button-prompt-alert').click();

    expect(dialogType).toBe('prompt');
    // Page prints "You entered: <name>" after accepting the prompt
    await expect(page.getByText(`You entered: ${nameToEnter}`)).toBeVisible();
  });

  test('should trigger a custom (SweetAlert) modal and confirm it', async ({ page }) => {
    // This is a custom in-page modal, not a native browser dialog
    await page.getByTestId('button-sweet-alert').click();

    await expect(page.getByRole('heading', { name: 'Error!' })).toBeVisible();
    await expect(page.getByText('Do you want to continue?')).toBeVisible();

    await page.getByRole('button', { name: 'Yes' }).click();
    await expect(page.getByRole('heading', { name: 'Error!' })).not.toBeVisible();
  });
});