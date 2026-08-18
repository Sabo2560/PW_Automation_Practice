// spec: specs/alert.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AlertPage } from '../../pages/AlertPage';

test.describe('Alert - Simple alert() Dialog', () => {
  test('Simple alert triggers a native alert dialog with the correct message and produces no on-page text change', async ({
    page,
  }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Register a dialog handler before clicking, then click and accept the dialog
    // 2. Capture the page's <main> content text before and after this interaction
    let dialog: { type: string; message: string } = { type: '', message: '' };
    const { before, after } = await alertPage.captureTextAround(async () => {
      dialog = await alertPage.triggerDialog(alertPage.simpleAlertBtn, { action: 'accept' });
    });

    // expect: The dialog's type equals exactly 'alert'
    expect(dialog.type).toBe('alert');
    // expect: The dialog's message equals exactly 'Hey! Welcome to Automation Playground!'
    expect(dialog.message).toBe('Hey! Welcome to Automation Playground!');
    // expect: The 'before' and 'after' text snapshots are identical
    expect(after).toBe(before);
  });
});
