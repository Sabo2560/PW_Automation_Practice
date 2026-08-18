// spec: specs/alert.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AlertPage } from '../../pages/AlertPage';

test.describe('Alert - Native prompt() Dialog', () => {
  test('Prompt dialog accept with typed text displays the entered value', async ({ page }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Register a dialog handler, click, and accept with typed text
    const nameToEnter = 'Saad Tested';
    const dialog = await alertPage.triggerDialog(alertPage.promptAlertBtn, { action: 'accept', value: nameToEnter });

    // expect: The dialog's type equals exactly 'prompt'
    expect(dialog.type).toBe('prompt');
    // expect: The dialog's message equals exactly 'Please enter your name:'
    expect(dialog.message).toBe('Please enter your name:');
    // expect: A paragraph containing exactly 'You entered: Saad Tested' becomes visible on the page
    await expect(page.getByText(`You entered: ${nameToEnter}`)).toBeVisible();
  });

  test('Prompt dialog cancel/dismiss path displays a fallback message, not blank text', async ({ page }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Register a dialog handler, click, and dismiss/cancel the dialog
    await alertPage.triggerDialog(alertPage.promptAlertBtn, { action: 'dismiss' });

    // expect: A paragraph containing exactly 'You entered: No name provided.' becomes visible on the page
    await expect(page.getByText('You entered: No name provided.')).toBeVisible();
  });

  test('Prompt dialog accept with an empty string produces the same fallback text as the cancel path', async ({ page }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Register a dialog handler, click, and accept with an empty string
    await alertPage.triggerDialog(alertPage.promptAlertBtn, { action: 'accept', value: '' });

    // expect: A paragraph containing exactly 'You entered: No name provided.' becomes visible on the page — NOT 'You entered: '
    await expect(page.getByText('You entered: No name provided.')).toBeVisible();
  });

  test('Repeated prompt interactions replace the single result paragraph rather than appending duplicates', async ({
    page,
  }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Trigger the prompt and accept with text 'First Entry', then trigger again with 'Second Entry'
    await alertPage.triggerDialog(alertPage.promptAlertBtn, { action: 'accept', value: 'First Entry' });
    await expect(page.getByText('You entered: First Entry')).toBeVisible();

    await alertPage.triggerDialog(alertPage.promptAlertBtn, { action: 'accept', value: 'Second Entry' });

    // expect: Exactly one element on the page matches text of the form 'You entered: ...' after the second interaction
    await expect(page.getByText(/You entered: /)).toHaveCount(1);
    // expect: Its text equals exactly 'You entered: Second Entry'
    await expect(page.getByText('You entered: Second Entry')).toBeVisible();
  });
});
