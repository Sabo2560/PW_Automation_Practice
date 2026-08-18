// spec: specs/alert.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AlertPage } from '../../pages/AlertPage';

test.describe('Alert - Native confirm() Dialog', () => {
  test('Confirm dialog dismiss path shows the correct message and produces no on-page text change', async ({ page }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Register a dialog handler, click, and dismiss the dialog
    const dialog = await alertPage.triggerDialog(alertPage.confirmAlertBtn, { action: 'dismiss' });

    // expect: The dialog's type equals exactly 'confirm'
    expect(dialog.type).toBe('confirm');
    // expect: The dialog's message equals exactly 'Are you happy with Automation Playground?'
    expect(dialog.message).toBe('Are you happy with Automation Playground?');
    // expect: No element containing text 'You entered' or any other new result text appears anywhere on the page after dismissing
    await expect(page.getByText('You entered')).toHaveCount(0);
  });

  test('Confirm dialog accept path also produces no on-page text change', async ({ page }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Register a dialog handler, click, and accept the dialog instead of dismissing it
    let dialog: { type: string; message: string } = { type: '', message: '' };
    const { before, after } = await alertPage.captureTextAround(async () => {
      dialog = await alertPage.triggerDialog(alertPage.confirmAlertBtn, { action: 'accept' });
    });

    // expect: The dialog's type equals exactly 'confirm'
    expect(dialog.type).toBe('confirm');
    // expect: Capture the page's <main> content text before and after this interaction — byte-for-byte identical
    expect(after).toBe(before);
  });
});
